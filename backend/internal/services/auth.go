package services

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"marketplace/internal/models"
	"marketplace/internal/repositories"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailTaken         = errors.New("an account with this email already exists")
	ErrValidation         = errors.New("validation failed")
	ErrForbidden          = errors.New("forbidden")
	ErrNotFound           = errors.New("not found")
)

type AuthService struct {
	store  *repositories.Store
	secret []byte
	ttl    time.Duration
}

func NewAuthService(store *repositories.Store, secret string, ttlHours int) *AuthService {
	if ttlHours <= 0 {
		ttlHours = 168
	}
	return &AuthService{store: store, secret: []byte(secret), ttl: time.Duration(ttlHours) * time.Hour}
}

type RegisterInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Location string `json:"location"`
	Phone    string `json:"phone"`
}

func (a *AuthService) Register(ctx context.Context, in RegisterInput) (*models.User, string, error) {
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))

	if len(in.Name) < 2 {
		return nil, "", fmt.Errorf("%w: name must be at least 2 characters", ErrValidation)
	}
	if _, err := mail.ParseAddress(in.Email); err != nil {
		return nil, "", fmt.Errorf("%w: invalid email address", ErrValidation)
	}
	if len(in.Password) < 6 {
		return nil, "", fmt.Errorf("%w: password must be at least 6 characters", ErrValidation)
	}
	exists, err := a.store.EmailExists(ctx, in.Email)
	if err != nil {
		return nil, "", err
	}
	if exists {
		return nil, "", ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	u := &models.User{
		Name:         in.Name,
		Email:        in.Email,
		PasswordHash: string(hash),
		Location:     strings.TrimSpace(in.Location),
		Phone:        strings.TrimSpace(in.Phone),
	}
	id, err := a.store.CreateUser(ctx, u)
	if err != nil {
		return nil, "", err
	}
	u.ID = id
	u.CreatedAt = time.Now().UTC()

	token, err := a.TokenFor(u)
	if err != nil {
		return nil, "", err
	}
	return u, token, nil
}

func (a *AuthService) Login(ctx context.Context, email, password string) (*models.User, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	u, err := a.store.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, "", err
	}
	if u == nil || bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
		return nil, "", ErrInvalidCredentials
	}
	token, err := a.TokenFor(u)
	if err != nil {
		return nil, "", err
	}
	return u, token, nil
}

func (a *AuthService) TokenFor(u *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   u.ID,
		"email": u.Email,
		"exp":   time.Now().Add(a.ttl).Unix(),
		"iat":   time.Now().Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(a.secret)
}

// Parse verifies a bearer token and returns the user ID.
func (a *AuthService) Parse(raw string) (int64, error) {
	token, err := jwt.Parse(raw, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return a.secret, nil
	})
	if err != nil || !token.Valid {
		return 0, ErrInvalidCredentials
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, ErrInvalidCredentials
	}
	sub, ok := claims["sub"].(float64)
	if !ok {
		return 0, ErrInvalidCredentials
	}
	return int64(sub), nil
}

func (a *AuthService) UserByID(ctx context.Context, id int64) (*models.User, error) {
	return a.store.GetUserByID(ctx, id)
}

// SecureEqual is a small constant-time helper for anything needing it.
func SecureEqual(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
