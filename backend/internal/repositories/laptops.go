package repositories

import (
	"context"
	"fmt"
	stdLog "log"

	"github.com/jackc/pgx/v5"

	"marketplace/internal/models"
)

// laptopFilter builds the WHERE clause + args for the public, filtered list.
// when withBrand is false the brand equality is skipped with placeholder
// numbers still contiguous (used for the brand facet).
func laptopFilter(f models.Filter, withBrand bool) *where {
	w := &where{}
	w.add("l.status = 'active'")
	if withBrand && f.Brand != "" {
		w.add("l.brand = $"+argIdx(w), f.Brand)
	}
	if f.Condition != "" {
		w.add("l.condition = $"+argIdx(w), f.Condition)
	}
	w.addLike("l.brand", f.Query)
	w.addLike("l.model", f.Query)
	w.addLike("l.cpu", f.Query)
	w.addLike("l.gpu", f.Query)
	w.addLike("l.description", f.Query)
	w.addLike("l.location", f.Location)
	w.addInt("l.ram_gb", ">=", f.MinRAM)
	w.addInt("l.ram_gb", "<=", f.MaxRAM)
	w.addInt("l.storage_gb", ">=", f.MinStorage)
	w.addFloat("l.price", ">=", f.MinPrice)
	w.addFloat("l.price", "<=", f.MaxPrice)
	return w
}

// CPU is a separate matcher so it can be combined with the free-text query.
func laptopCPUCondition(f models.Filter) func(*where) {
	return func(w *where) { w.addLike("l.cpu", f.CPU) }
}

func argIdx(w *where) string {
	return fmt.Sprintf("%d", len(w.args)+1)
}

func sortClause(sort string) string {
	switch sort {
	case "price_asc":
		return "l.price ASC, l.created_at DESC"
	case "price_desc":
		return "l.price DESC, l.created_at DESC"
	case "popular":
		return "l.views DESC, l.created_at DESC"
	default:
		return "l.created_at DESC"
	}
}

func (s *Store) ListLaptops(ctx context.Context, f models.Filter) ([]models.Laptop, int, error) {
	total := 0
	facet := laptopFilter(f, true)
	if err := s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM laptops l WHERE `+facet.String(), facet.Args()...,
	).Scan(&total); err != nil {
		stdLog.Printf("ListLaptops count error: %v | WHERE %s", err, facet.String())
		return nil, 0, err
	}

	sel := laptopFilter(f, true)
	laptopCPUCondition(f)(sel)

	rows, err := s.db.Query(ctx,
		`SELECT `+laptopColumns+` FROM laptops l
		 WHERE `+sel.String()+`
		 ORDER BY `+sortClause(f.Sort)+`
		 LIMIT $`+fmt.Sprintf("%d", len(sel.args)+1)+` OFFSET $`+fmt.Sprintf("%d", len(sel.args)+2),
		append(append(sel.Args(), f.Limit), f.Offset())...,
	)
	if err != nil {
		stdLog.Printf("ListLaptops select error: %v | query: WHERE %s sort=%s", err, sel.String(), f.Sort)
		return nil, 0, err
	}
	defer rows.Close()

	laptops := make([]models.Laptop, 0, f.Limit)
	for rows.Next() {
		l, err := scanLaptop(rows)
		if err != nil {
			return nil, 0, err
		}
		laptops = append(laptops, *l)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if err := s.AttachImages(ctx, laptops); err != nil {
		return nil, 0, err
	}
	return laptops, total, nil
}

func (s *Store) LaptopExists(ctx context.Context, id int64) (bool, error) {
	var exists bool
	if err := s.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM laptops WHERE id=$1)`, id,
	).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}

// BrandFacet returns the distinct brands matching the current filters
// (the brand equality is skipped so the facet never collapses to one value).
func (s *Store) BrandFacet(ctx context.Context, f models.Filter) ([]string, error) {
	w := laptopFilter(f, false)
	rows, err := s.db.Query(ctx,
		`SELECT DISTINCT l.brand FROM laptops l WHERE `+w.String()+` ORDER BY l.brand`,
		w.args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	brands := []string{}
	for rows.Next() {
		var b string
		if err := rows.Scan(&b); err != nil {
			return nil, err
		}
		brands = append(brands, b)
	}
	return brands, rows.Err()
}

func (s *Store) CountLaptops(ctx context.Context) (int, error) {
	var n int
	err := s.db.QueryRow(ctx, `SELECT COUNT(*) FROM laptops`).Scan(&n)
	return n, err
}

func (s *Store) FavoriteSet(ctx context.Context, userID int64, laptopIDs []int64) (map[int64]bool, error) {
	out := map[int64]bool{}
	if len(laptopIDs) == 0 {
		return out, nil
	}
	rows, err := s.db.Query(ctx,
		`SELECT laptop_id FROM favorites WHERE user_id = $1 AND laptop_id = ANY($2)`,
		userID, laptopIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out[id] = true
	}
	return out, rows.Err()
}

func (s *Store) GetLaptop(ctx context.Context, id int64, userID int64) (*models.Laptop, error) {
	l, err := scanLaptop(s.db.QueryRow(ctx,
		`SELECT `+laptopColumns+` FROM laptops l WHERE l.id = $1`, id))
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if err := s.loadImages(ctx, []*models.Laptop{l}); err != nil {
		return nil, err
	}
	u, err := s.GetUserByID(ctx, l.UserID)
	if err != nil {
		return nil, err
	}
	l.Seller = toPublicUser(u)
	if userID > 0 {
		l.IsFavorite, err = s.IsFavorite(ctx, userID, id)
		if err != nil {
			return nil, err
		}
	}
	return l, nil
}

func (s *Store) CreateLaptop(ctx context.Context, l *models.Laptop) (int64, error) {
	err := s.db.QueryRow(ctx,
		`INSERT INTO laptops (user_id, brand, model, cpu, ram_gb, storage_gb, storage_type,
		 gpu, display, condition, age_years, battery_health, price, location, description, status)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
		 RETURNING id`,
		l.UserID, l.Brand, l.Model, l.CPU, l.RAMGB, l.StorageGB, l.StorageType,
		l.GPU, l.Display, l.Condition, l.AgeYears, l.BatteryHealth, l.Price,
		l.Location, l.Description, l.Status,
	).Scan(&l.ID)
	return l.ID, err
}

func (s *Store) UpdateLaptop(ctx context.Context, l *models.Laptop) error {
	_, err := s.db.Exec(ctx,
		`UPDATE laptops SET brand=$1, model=$2, cpu=$3, ram_gb=$4, storage_gb=$5,
		 storage_type=$6, gpu=$7, display=$8, condition=$9, age_years=$10,
		 battery_health=$11, price=$12, location=$13, description=$14, status=$15,
		 updated_at=now()
		 WHERE id=$16 AND user_id=$17`,
		l.Brand, l.Model, l.CPU, l.RAMGB, l.StorageGB, l.StorageType,
		l.GPU, l.Display, l.Condition, l.AgeYears, l.BatteryHealth, l.Price,
		l.Location, l.Description, l.Status, l.ID, l.UserID,
	)
	return err
}

func (s *Store) DeleteLaptop(ctx context.Context, id int64) error {
	_, err := s.db.Exec(ctx, `DELETE FROM laptops WHERE id = $1`, id)
	return err
}

func (s *Store) ListLaptopsByUser(ctx context.Context, userID int64) ([]models.Laptop, error) {
	rows, err := s.db.Query(ctx,
		`SELECT `+laptopColumns+` FROM laptops l
		 WHERE l.user_id = $1 ORDER BY l.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	laptops := []models.Laptop{}
	for rows.Next() {
		l, err := scanLaptop(rows)
		if err != nil {
			return nil, err
		}
		laptops = append(laptops, *l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := s.AttachImages(ctx, laptops); err != nil {
		return nil, err
	}
	return laptops, nil
}

func (s *Store) IncrementViews(ctx context.Context, id int64) error {
	_, err := s.db.Exec(ctx, `UPDATE laptops SET views = views + 1 WHERE id = $1`, id)
	return err
}

// loadImages attaches image URLs to laptops in one query.
func (s *Store) loadImages(ctx context.Context, laptops []*models.Laptop) error {
	if len(laptops) == 0 {
		return nil
	}
	ids := make([]int64, len(laptops))
	for i, l := range laptops {
		ids[i] = l.ID
	}
	rows, err := s.db.Query(ctx,
		`SELECT id, laptop_id, url, key, position FROM images
		 WHERE laptop_id = ANY($1) ORDER BY position ASC, id ASC`, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	byLaptop := map[int64][]models.Image{}
	for rows.Next() {
		var img models.Image
		var laptopID int64
		if err := rows.Scan(&img.ID, &laptopID, &img.URL, &img.Key, &img.Position); err != nil {
			return err
		}
		img.LaptopID = laptopID
		byLaptop[laptopID] = append(byLaptop[laptopID], img)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for _, l := range laptops {
		l.Images = byLaptop[l.ID]
	}
	return nil
}

func (s *Store) AttachImages(ctx context.Context, laptops []models.Laptop) error {
	ptrs := make([]*models.Laptop, len(laptops))
	for i := range laptops {
		ptrs[i] = &laptops[i]
	}
	return s.loadImages(ctx, ptrs)
}
