package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"strings"
	"time"

	"marketplace/internal/models"
	"marketplace/internal/repositories"
	"marketplace/internal/storage"
)

type LaptopService struct {
	store   *repositories.Store
	storage storage.Storer
}

func NewLaptopService(store *repositories.Store, st storage.Storer) *LaptopService {
	return &LaptopService{store: store, storage: st}
}

type Paginated struct {
	Items  []models.Laptop `json:"items"`
	Total  int             `json:"total"`
	Page   int             `json:"page"`
	Pages  int             `json:"pages"`
	Limit  int             `json:"limit"`
	Brands []string        `json:"brands"`
}

func (p *Paginated) compute(total, page, limit int) {
	p.Total = total
	p.Page = page
	p.Limit = limit
	p.Pages = (total + limit - 1) / limit
	if p.Pages < 1 {
		p.Pages = 1
	}
}

func (s *LaptopService) List(ctx context.Context, f models.Filter, userID int64) (*Paginated, error) {
	if f.Limit <= 0 {
		f.Limit = 12
	}
	if f.Limit > 48 {
		f.Limit = 48
	}
	items, total, err := s.store.ListLaptops(ctx, f)
	if err != nil {
		return nil, err
	}
	if userID > 0 {
		if err := s.markFavorites(ctx, userID, items); err != nil {
			return nil, err
		}
	}
	p := &Paginated{Items: items}
	p.compute(total, f.Page, f.Limit)
	p.Brands, err = s.store.BrandFacet(ctx, f)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (s *LaptopService) markFavorites(ctx context.Context, userID int64, items []models.Laptop) error {
	if len(items) == 0 {
		return nil
	}
	ids := make([]int64, len(items))
	for i, l := range items {
		ids[i] = l.ID
	}
	favs, err := s.store.FavoriteSet(ctx, userID, ids)
	if err != nil {
		return err
	}
	for i := range items {
		items[i].IsFavorite = favs[items[i].ID]
	}
	return nil
}

func (s *LaptopService) Get(ctx context.Context, id int64, userID int64) (*models.Laptop, error) {
	if err := s.store.IncrementViews(ctx, id); err != nil {
		return nil, err
	}
	return s.store.GetLaptop(ctx, id, userID)
}

func (s *LaptopService) Create(ctx context.Context, l *models.Laptop, userID int64) (*models.Laptop, error) {
	if err := validateLaptop(l); err != nil {
		return nil, err
	}
	if l.Status == "" {
		l.Status = string(models.StatusActive)
	}
	if !models.ValidStatuses[models.Status(l.Status)] {
		return nil, fmt.Errorf("%w: invalid status", ErrValidation)
	}
	l.UserID = userID
	id, err := s.store.CreateLaptop(ctx, l)
	if err != nil {
		return nil, err
	}
	l.ID = id
	return l, nil
}

func (s *LaptopService) Update(ctx context.Context, laptopID, userID int64, l *models.Laptop) (*models.Laptop, error) {
	existing, err := s.store.GetLaptop(ctx, laptopID, 0)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrNotFound
	}
	if existing.UserID != userID {
		return nil, ErrForbidden
	}
	if err := validateLaptop(l); err != nil {
		return nil, err
	}
	if !models.ValidStatuses[models.Status(l.Status)] {
		return nil, fmt.Errorf("%w: invalid status", ErrValidation)
	}
	l.ID = laptopID
	l.UserID = userID
	if err := s.store.UpdateLaptop(ctx, l); err != nil {
		return nil, err
	}
	return l, nil
}

func (s *LaptopService) Delete(ctx context.Context, laptopID, userID int64) error {
	l, err := s.store.GetLaptop(ctx, laptopID, 0)
	if err != nil {
		return err
	}
	if l == nil {
		return ErrNotFound
	}
	if l.UserID != userID {
		return ErrForbidden
	}
	imgs, err := s.store.DeleteImagesByLaptop(ctx, laptopID)
	if err != nil {
		return err
	}
	for _, img := range imgs {
		if err := s.storage.Delete(ctx, img.Key); err != nil {
			return err
		}
	}
	return s.store.DeleteLaptop(ctx, laptopID)
}

func (s *LaptopService) OwnerLaptops(ctx context.Context, userID int64) ([]models.Laptop, error) {
	return s.store.ListLaptopsByUser(ctx, userID)
}

func (s *LaptopService) MyFavorites(ctx context.Context, userID int64) ([]models.Laptop, error) {
	return s.store.ListFavorites(ctx, userID)
}

func validateLaptop(l *models.Laptop) error {
	missing := []string{}
	if strings.TrimSpace(l.Brand) == "" {
		missing = append(missing, "brand")
	}
	if strings.TrimSpace(l.Model) == "" {
		missing = append(missing, "model")
	}
	if strings.TrimSpace(l.CPU) == "" {
		missing = append(missing, "cpu")
	}
	if strings.TrimSpace(l.Location) == "" {
		missing = append(missing, "location")
	}
	if strings.TrimSpace(l.Condition) == "" {
		missing = append(missing, "condition")
	}
	if len(missing) > 0 {
		return fmt.Errorf("%w: missing required fields: %s", ErrValidation, strings.Join(missing, ", "))
	}
	if !models.ValidConditions[models.Condition(strings.ToLower(l.Condition))] {
		return fmt.Errorf("%w: invalid condition", ErrValidation)
	}
	if l.Price <= 0 {
		return fmt.Errorf("%w: price must be greater than zero", ErrValidation)
	}
	if l.RAMGB < 0 || l.StorageGB < 0 || l.BatteryHealth < 0 {
		return fmt.Errorf("%w: ram, storage and battery health must be non-negative", ErrValidation)
	}
	if l.BatteryHealth > 100 {
		return fmt.Errorf("%w: battery health max is 100", ErrValidation)
	}
	return nil
}

// --- Images ----------------------------------------------------------------

var allowedImageTypes = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
	"image/webp": "webp",
	"image/gif":  "gif",
}

type UploadFile interface {
	Filename() string
	Open() (multipart.File, error)
	Size() int64
}

func (s *LaptopService) AddImages(ctx context.Context, laptopID, userID int64, files []*multipart.FileHeader, maxBytes int64) ([]models.Image, error) {
	l, err := s.store.GetLaptop(ctx, laptopID, 0)
	if err != nil {
		return nil, err
	}
	if l == nil {
		return nil, ErrNotFound
	}
	if l.UserID != userID {
		return nil, ErrForbidden
	}
	pos, err := s.store.CountImages(ctx, laptopID)
	if err != nil {
		return nil, err
	}

	created := []models.Image{}
	for _, fh := range files {
		if fh.Size > maxBytes {
			return nil, fmt.Errorf("%w: %s exceeds %dMB", ErrValidation, fh.Filename, maxBytes/(1024*1024))
		}
		f, err := fh.Open()
		if err != nil {
			return nil, err
		}
		head := make([]byte, 512)
		n, _ := io.ReadFull(f, head)
		contentType := strings.ToLower(sniffType(head[:n]))
		ext, ok := allowedImageTypes[contentType]
		f.Close()
		if !ok {
			return nil, fmt.Errorf("%w: unsupported image type for %s (allowed: jpeg, png, webp, gif)", ErrValidation, fh.Filename)
		}

		f, err = fh.Open()
		if err != nil {
			return nil, err
		}
		key := fmt.Sprintf("laptops/%d/%s.%s", laptopID, randID(), ext)
		obj, err := s.storage.Upload(ctx, key, f, fh.Size, contentType)
		f.Close()
		if err != nil {
			return nil, err
		}

		img := models.Image{LaptopID: laptopID, URL: obj.URL, Key: obj.Key, Position: pos}
		id, err := s.store.AddImage(ctx, &img)
		if err != nil {
			return nil, err
		}
		img.ID = id
		created = append(created, img)
		pos++
	}
	return created, nil
}

func (s *LaptopService) DeleteImage(ctx context.Context, imageID, userID int64) error {
	img, err := s.store.GetImageByID(ctx, imageID)
	if err != nil {
		return err
	}
	if img == nil {
		return ErrNotFound
	}
	l, err := s.store.GetLaptop(ctx, img.LaptopID, 0)
	if err != nil {
		return err
	}
	if l.UserID != userID {
		return ErrForbidden
	}
	if err := s.storage.Delete(ctx, img.Key); err != nil {
		return err
	}
	return s.store.DeleteImageByID(ctx, imageID)
}

func (s *LaptopService) ToggleFavorite(ctx context.Context, userID, laptopID int64) (bool, error) {
	exists, err := s.store.LaptopExists(ctx, laptopID)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, ErrNotFound
	}
	return s.store.ToggleFavorite(ctx, userID, laptopID)
}

func (s *LaptopService) CreateInquiry(ctx context.Context, laptopID, userID int64, message string) error {
	laptop, err := s.store.GetLaptop(ctx, laptopID, 0)
	if err != nil {
		return err
	}
	if laptop == nil {
		return ErrNotFound
	}
	if strings.TrimSpace(message) == "" {
		return fmt.Errorf("%w: message is required", ErrValidation)
	}
	if laptop.UserID == userID {
		return fmt.Errorf("%w: you cannot inquire about your own listing", ErrValidation)
	}
	user, err := s.store.GetUserByID(ctx, userID)
	if err != nil {
		return err
	}
	inq := &models.Inquiry{
		LaptopID: laptopID,
		UserID:   userID,
		Name:     user.Name,
		Email:    user.Email,
		Message:  strings.TrimSpace(message),
	}
	_, err = s.store.CreateInquiry(ctx, inq)
	return err
}

func sniffType(b []byte) string {
	switch {
	case len(b) >= 8 && b[0] == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G':
		return "image/png"
	case len(b) >= 4 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF:
		return "image/jpeg"
	case len(b) >= 24 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P':
		return "image/webp"
	case len(b) >= 3 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F':
		return "image/gif"
	default:
		return "application/octet-stream"
	}
}

func randID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}
