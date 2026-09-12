package repositories

import (
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"marketplace/internal/models"
)

type Store struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Store {
	return &Store{db: db}
}

// where is a tiny SQL clause builder used for dynamic filters.
type where struct {
	clauses []string
	args    []any
}

func (w *where) add(clause string, args ...any) {
	w.clauses = append(w.clauses, clause)
	w.args = append(w.args, args...)
}

func (w *where) addLike(expr string, value string) {
	if strings.TrimSpace(value) == "" {
		return
	}
	w.add(fmt.Sprintf("%s ILIKE '%%' || $%d || '%%'", expr, len(w.args)+1), value)
}

func (w *where) addInt(expr string, op string, value int) {
	if value <= 0 {
		return
	}
	w.add(fmt.Sprintf("%s %s $%d", expr, op, len(w.args)+1), value)
}

func (w *where) addFloat(expr string, op string, value float64) {
	if value <= 0 {
		return
	}
	w.add(fmt.Sprintf("%s %s $%d", expr, op, len(w.args)+1), value)
}

func (w *where) String() string {
	if len(w.clauses) == 0 {
		return "TRUE"
	}
	return strings.Join(w.clauses, " AND ")
}

func (w *where) Args() []any { return w.args }

const laptopColumns = `l.id, l.user_id, l.brand, l.model, l.cpu, l.ram_gb, l.storage_gb,
	l.storage_type, l.gpu, l.display, l.condition, l.age_years, l.battery_health,
	l.price::float8, l.location, l.description, l.status, l.views, l.created_at, l.updated_at`

func scanLaptop(row interface{ Scan(...any) error }) (*models.Laptop, error) {
	var l models.Laptop
	err := row.Scan(
		&l.ID, &l.UserID, &l.Brand, &l.Model, &l.CPU, &l.RAMGB, &l.StorageGB,
		&l.StorageType, &l.GPU, &l.Display, &l.Condition, &l.AgeYears, &l.BatteryHealth,
		&l.Price, &l.Location, &l.Description, &l.Status, &l.Views, &l.CreatedAt, &l.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &l, nil
}
