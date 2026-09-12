package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"

	"marketplace/internal/models"
)

func (s *Store) CreateUser(ctx context.Context, u *models.User) (int64, error) {
	var id int64
	err := s.db.QueryRow(ctx,
		`INSERT INTO users (name, email, password_hash, location, phone)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		u.Name, u.Email, u.PasswordHash, u.Location, u.Phone,
	).Scan(&id)
	return id, err
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	return s.getUser(ctx, `WHERE email = $1`, email)
}

func (s *Store) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	return s.getUser(ctx, `WHERE id = $1`, id)
}

func (s *Store) getUser(ctx context.Context, clause string, arg any) (*models.User, error) {
	u := &models.User{}
	err := s.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, location, phone, created_at
		 FROM users `+clause, arg,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Location, &u.Phone, &u.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return u, nil
}

func (s *Store) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := s.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email,
	).Scan(&exists)
	return exists, err
}

func toPublicUser(u *models.User) *models.PublicUser {
	if u == nil {
		return nil
	}
	return &models.PublicUser{ID: u.ID, Name: u.Name, Location: u.Location}
}
