package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"marketplace/internal/config"
	"marketplace/internal/middleware"
	"marketplace/internal/services"
)

func Router(
	cfg *config.Config,
	auth *services.AuthService,
	laptops *services.LaptopService,
) http.Handler {
	r := chi.NewRouter()

	// Global middleware.
	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)
	r.Use(middleware.CORS(cfg.FrontendOrigin))
	limiter := middleware.NewRateLimiter(cfg.RateLimit)
	r.Use(limiter.RateLimit)

	authHandler := NewAuthHandler(auth)
	laptopHandler := NewLaptopHandler(laptops, &HandlerConfig{MaxUploadMB: cfg.Storage.MaxUploadMB})
	meHandler := NewMeHandler(laptops)

	// Local-file uploads (dev provider).
	if cfg.Storage.Provider == "local" {
		r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(cfg.Storage.LocalDir))))
	}

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		middleware.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Public auth.
	r.Group(func(r chi.Router) {
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
	})

	// Public browsing (+ optional auth so favorites resolve).
	r.Group(func(r chi.Router) {
		r.Use(middleware.OptionalAuth(auth))
		r.Get("/laptops", laptopHandler.List)
		r.Get("/laptops/{id}", laptopHandler.Get)
	})

	// Authenticated routes.
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(auth))

		r.Get("/me", authHandler.Me)
		r.Get("/me/listings", meHandler.Listings)
		r.Get("/me/favorites", meHandler.Favorites)

		r.Post("/laptops", laptopHandler.Create)
		r.Put("/laptops/{id}", laptopHandler.Update)
		r.Delete("/laptops/{id}", laptopHandler.Delete)
		r.Post("/laptops/{id}/images", laptopHandler.AddImages)
		r.Delete("/images/{id}", laptopHandler.DeleteImage)
		r.Post("/laptops/{id}/favorite", laptopHandler.Favorite)
		r.Post("/laptops/{id}/inquiry", laptopHandler.Inquiry)
	})

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		middleware.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
	})

	return r
}
