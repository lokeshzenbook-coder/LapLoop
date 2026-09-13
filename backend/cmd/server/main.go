package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"marketplace/internal/config"
	"marketplace/internal/database"
	"marketplace/internal/handlers"
	"marketplace/internal/repositories"
	"marketplace/internal/services"
	"marketplace/internal/storage"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close()

	// Migrations live in a folder next to the binary in the container, or
	// ./migrations when running locally.
	migrationsDir := os.Getenv("MIGRATIONS_PATH")
	if migrationsDir == "" {
		if mk, err := filepath.Abs("migrations"); err == nil {
			if _, statErr := os.Stat(mk); statErr == nil {
				migrationsDir = mk
			}
		}
	}
	if migrationsDir == "" {
		migrationsDir = "migrations"
	}
	if err := db.Migrate(ctx, migrationsDir); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	store := repositories.New(db.Pool)

	// Object storage for images.
	storer, err := storage.New(cfg.Storage)
	if err != nil {
		log.Fatalf("storage: %v", err)
	}

	authSvc := services.NewAuthService(store, cfg.JWTSecret, cfg.JWTTTLHours)
	laptopSvc := services.NewLaptopService(store, storer)

	// Seed demo data on first boot.
	if cfg.Seed {
		if err := services.Seed(ctx, store, cfg.PublicBaseURL); err != nil {
			log.Printf("seed: %v", err)
		}
	}

	router := handlers.Router(&cfg, authSvc, laptopSvc)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("backend listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
	log.Println("server stopped")
}
