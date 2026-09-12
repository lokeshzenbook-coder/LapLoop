package repositories

import (
	"context"

	"github.com/jackc/pgx/v5"

	"marketplace/internal/models"
)

func (s *Store) AddImage(ctx context.Context, img *models.Image) (int64, error) {
	var id int64
	err := s.db.QueryRow(ctx,
		`INSERT INTO images (laptop_id, url, key, position) VALUES ($1,$2,$3,$4) RETURNING id`,
		img.LaptopID, img.URL, img.Key, img.Position,
	).Scan(&id)
	return id, err
}

func (s *Store) GetImageByID(ctx context.Context, id int64) (*models.Image, error) {
	img := &models.Image{}
	err := s.db.QueryRow(ctx,
		`SELECT id, laptop_id, url, key, position FROM images WHERE id = $1`, id,
	).Scan(&img.ID, &img.LaptopID, &img.URL, &img.Key, &img.Position)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return img, nil
}

func (s *Store) DeleteImageByID(ctx context.Context, id int64) error {
	_, err := s.db.Exec(ctx, `DELETE FROM images WHERE id = $1`, id)
	return err
}

func (s *Store) DeleteImagesByLaptop(ctx context.Context, laptopID int64) ([]models.Image, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, laptop_id, url, key, position FROM images WHERE laptop_id = $1`, laptopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	imgs := []models.Image{}
	for rows.Next() {
		var img models.Image
		if err := rows.Scan(&img.ID, &img.LaptopID, &img.URL, &img.Key, &img.Position); err != nil {
			return nil, err
		}
		imgs = append(imgs, img)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if _, err := s.db.Exec(ctx, `DELETE FROM images WHERE laptop_id = $1`, laptopID); err != nil {
		return nil, err
	}
	return imgs, nil
}

func (s *Store) CountImages(ctx context.Context, laptopID int64) (int, error) {
	var n int
	err := s.db.QueryRow(ctx, `SELECT COUNT(*) FROM images WHERE laptop_id = $1`, laptopID).Scan(&n)
	return n, err
}
