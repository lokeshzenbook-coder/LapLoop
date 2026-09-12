package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"marketplace/internal/middleware"
	"marketplace/internal/services"
)

// MeHandler serves /me/* routes.
type MeHandler struct {
	laptops *services.LaptopService
}

func NewMeHandler(laptops *services.LaptopService) *MeHandler {
	return &MeHandler{laptops: laptops}
}

func (h *MeHandler) Listings(w http.ResponseWriter, r *http.Request) {
	laptops, err := h.laptops.OwnerLaptops(r.Context(), middleware.UserIDFrom(r.Context()))
	if err != nil {
		translateErr(w, err)
		return
	}
	ok(w, map[string]any{"items": laptops, "total": len(laptops)})
}

func (h *MeHandler) Favorites(w http.ResponseWriter, r *http.Request) {
	laptops, err := h.laptops.MyFavorites(r.Context(), middleware.UserIDFrom(r.Context()))
	if err != nil {
		translateErr(w, err)
		return
	}
	ok(w, map[string]any{"items": laptops, "total": len(laptops)})
}

// Static serves local uploads only when STORAGE_PROVIDER=local.
func Static(dir string, enabled bool) http.Handler {
	if !enabled || dir == "" {
		return http.NotFoundHandler()
	}
	fs := http.FileServer(http.Dir(dir))
	return http.StripPrefix("/uploads/", fs)
}

// MountLocalUploads exposes /uploads when local storage is active.
func MountLocalUploads(r chi.Router, dir string, enabled bool) {
	r.Handle("/uploads/*", Static(dir, enabled))
}
