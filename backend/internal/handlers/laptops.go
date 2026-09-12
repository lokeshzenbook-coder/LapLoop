package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"marketplace/internal/middleware"
	"marketplace/internal/models"
	"marketplace/internal/services"
)

type LaptopHandler struct {
	laptops *services.LaptopService
	cfg     *HandlerConfig
}

type HandlerConfig struct {
	MaxUploadMB int64
}

func NewLaptopHandler(laptops *services.LaptopService, cfg *HandlerConfig) *LaptopHandler {
	if cfg == nil || cfg.MaxUploadMB == 0 {
		cfg = &HandlerConfig{MaxUploadMB: 5}
	}
	return &LaptopHandler{laptops: laptops, cfg: cfg}
}

// List handles GET /laptops with search, filters and pagination.
func (h *LaptopHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	f := models.Filter{
		Query:      q.Get("q"),
		Brand:      q.Get("brand"),
		CPU:        q.Get("cpu"),
		Condition:  q.Get("condition"),
		Location:   q.Get("location"),
		Sort:       q.Get("sort"),
		Page:       atoiDefault(q.Get("page"), 1),
		Limit:      atoiDefault(q.Get("limit"), 12),
		MinRAM:     atoiDefault(q.Get("minRam"), 0),
		MaxRAM:     atoiDefault(q.Get("maxRam"), 0),
		MinStorage: atoiDefault(q.Get("minStorage"), 0),
		MinPrice:   atofDefault(q.Get("minPrice"), 0),
		MaxPrice:   atofDefault(q.Get("maxPrice"), 0),
	}
	result, err := h.laptops.List(r.Context(), f, middleware.UserIDFrom(r.Context()))
	if err != nil {
		translateErr(w, err)
		return
	}
	ok(w, result)
}

// Get handles GET /laptops/:id with optional auth for favorites.
func (h *LaptopHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	laptopID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		badRequest(w, "invalid laptop id")
		return
	}
	l, err := h.laptops.Get(r.Context(), laptopID, middleware.UserIDFrom(r.Context()))
	if err != nil {
		translateErr(w, err)
		return
	}
	if l == nil {
		notFound(w)
		return
	}
	ok(w, l)
}

// Create handles POST /laptops (authenticated).
func (h *LaptopHandler) Create(w http.ResponseWriter, r *http.Request) {
	var l models.Laptop
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil {
		badRequest(w, "invalid JSON body")
		return
	}
	createdL, err := h.laptops.Create(r.Context(), &l, middleware.UserIDFrom(r.Context()))
	if err != nil {
		translateErr(w, err)
		return
	}
	created(w, createdL)
}

// Update handles PUT /laptops/:id (owner only).
func (h *LaptopHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		badRequest(w, "invalid laptop id")
		return
	}
	var l models.Laptop
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil {
		badRequest(w, "invalid JSON body")
		return
	}
	updated, err := h.laptops.Update(r.Context(), id, middleware.UserIDFrom(r.Context()), &l)
	if err != nil {
		translateErr(w, err)
		return
	}
	ok(w, updated)
}

// Delete handles DELETE /laptops/:id (owner only).
func (h *LaptopHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		badRequest(w, "invalid laptop id")
		return
	}
	if err := h.laptops.Delete(r.Context(), id, middleware.UserIDFrom(r.Context())); err != nil {
		translateErr(w, err)
		return
	}
	ok(w, map[string]bool{"deleted": true})
}

// AddImages handles POST /laptops/:id/images (multipart, owner only).
func (h *LaptopHandler) AddImages(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		badRequest(w, "invalid laptop id")
		return
	}
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		badRequest(w, "could not parse multipart form")
		return
	}
	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		badRequest(w, "no files provided under the 'files' field")
		return
	}
	maxBytes := h.cfg.MaxUploadMB * 1024 * 1024
	imgs, err := h.laptops.AddImages(r.Context(), id, middleware.UserIDFrom(r.Context()), files, maxBytes)
	if err != nil {
		translateErr(w, err)
		return
	}
	created(w, map[string]any{"images": imgs})
}

// DeleteImage handles DELETE /images/:id (owner of listing only).
func (h *LaptopHandler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		badRequest(w, "invalid image id")
		return
	}
	if err := h.laptops.DeleteImage(r.Context(), id, middleware.UserIDFrom(r.Context())); err != nil {
		translateErr(w, err)
		return
	}
	ok(w, map[string]bool{"deleted": true})
}

// Favorite handles POST /laptops/:id/favorite (authenticated, toggles).
func (h *LaptopHandler) Favorite(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		badRequest(w, "invalid laptop id")
		return
	}
	uid := middleware.UserIDFrom(r.Context())
	if uid == 0 {
		unauthorized(w)
		return
	}
	fav, err := h.laptops.ToggleFavorite(r.Context(), uid, id)
	if err != nil {
		translateErr(w, err)
		return
	}
	ok(w, map[string]bool{"favorite": fav})
}

// Inquiry handles POST /laptops/:id/inquiry.
func (h *LaptopHandler) Inquiry(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		badRequest(w, "invalid laptop id")
		return
	}
	var in struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		badRequest(w, "invalid JSON body")
		return
	}
	uid := middleware.UserIDFrom(r.Context())
	if uid == 0 {
		unauthorized(w)
		return
	}
	if err := h.laptops.CreateInquiry(r.Context(), id, uid, in.Message); err != nil {
		translateErr(w, err)
		return
	}
	created(w, map[string]bool{"success": true})
}

func pathID(r *http.Request) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
}

func atoiDefault(s string, def int) int {
	if strings.TrimSpace(s) == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func atofDefault(s string, def float64) float64 {
	if strings.TrimSpace(s) == "" {
		return def
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return def
	}
	return f
}
