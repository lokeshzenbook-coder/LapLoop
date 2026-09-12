package database

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func Connect(ctx context.Context, url string) (*DB, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("connect to postgres: %w", err)
	}
	for i := 0; i < 10; i++ {
		if err := pool.Ping(ctx); err == nil {
			return &DB{Pool: pool}, nil
		} else if i == 9 {
			return nil, fmt.Errorf("ping postgres: %w", err)
		}
		time.Sleep(time.Second)
	}
	return nil, fmt.Errorf("ping postgres: timeout")
}

// Migrate applies every *.sql file in dir, in lexical order, tracking
// applied files in schema_migrations.
func (db *DB) Migrate(ctx context.Context, dir string) error {
	_, err := db.Pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		name     TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`)
	if err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	files, err := filepath.Glob(filepath.Join(dir, "*.sql"))
	if err != nil {
		return err
	}
	sort.Strings(files)
	if len(files) == 0 {
		return fmt.Errorf("no migrations found in %s", dir)
	}

	applied := map[string]bool{}
	rows, err := db.Pool.Query(ctx, `SELECT name FROM schema_migrations`)
	if err != nil {
		return err
	}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			rows.Close()
			return err
		}
		applied[name] = true
	}
	rows.Close()

	for _, file := range files {
		name := filepath.Base(file)
		if applied[name] {
			continue
		}
		sql, err := os.ReadFile(file)
		if err != nil {
			return err
		}
		tx, err := db.Pool.Begin(ctx)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, string(sql)); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("apply migration %s: %w", name, err)
		}
		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (name) VALUES ($1)`, name); err != nil {
			tx.Rollback(ctx)
			return err
		}
		if err := tx.Commit(ctx); err != nil {
			return err
		}
		fmt.Println("applied migration:", name)
	}
	return nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

// EnsureValid searches normalized input against multiple fields for the
// live search implementation.
type SearchTerm struct {
	Raw  string
	Norm string
}

func Normalize(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}
