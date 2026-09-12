package repositories

import (
	"context"
	"errors"

	"marketplace/internal/models"
)

var ErrNotFound = errors.New("not found")

func (s *Store) ToggleFavorite(ctx context.Context, userID, laptopID int64) (bool, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	var exists bool
	if err := s.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = $1 AND laptop_id = $2)`,
		userID, laptopID,
	).Scan(&exists); err != nil {
		return false, err
	}
	if exists {
		_, err = tx.Exec(ctx,
			`DELETE FROM favorites WHERE user_id = $1 AND laptop_id = $2`, userID, laptopID)
		if err != nil {
			return false, err
		}
		return false, tx.Commit(ctx)
	}
	_, err = tx.Exec(ctx,
		`INSERT INTO favorites (user_id, laptop_id) VALUES ($1, $2)
		 ON CONFLICT DO NOTHING`, userID, laptopID)
	if err != nil {
		return false, err
	}
	return true, tx.Commit(ctx)
}

func (s *Store) IsFavorite(ctx context.Context, userID, laptopID int64) (bool, error) {
	var ok bool
	err := s.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = $1 AND laptop_id = $2)`,
		userID, laptopID).Scan(&ok)
	return ok, err
}

func (s *Store) ListFavorites(ctx context.Context, userID int64) ([]models.Laptop, error) {
	rows, err := s.db.Query(ctx,
		`SELECT `+laptopColumns+` FROM laptops l
		 JOIN favorites f ON f.laptop_id = l.id
		 WHERE f.user_id = $1 ORDER BY f.created_at DESC`, userID)
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
		l.IsFavorite = true
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

func (s *Store) CreateInquiry(ctx context.Context, inq *models.Inquiry) (int64, error) {
	var id int64
	err := s.db.QueryRow(ctx,
		`INSERT INTO inquiries (laptop_id, user_id, name, email, message)
		 VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		inq.LaptopID, inq.UserID, inq.Name, inq.Email, inq.Message,
	).Scan(&id)
	return id, err
}
