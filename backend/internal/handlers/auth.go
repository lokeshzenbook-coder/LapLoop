package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"marketplace/internal/middleware"
	"marketplace/internal/services"
)

type AuthHandler struct{ auth *services.AuthService }

func NewAuthHandler(auth *services.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var in services.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		badRequest(w, "invalid JSON body")
		return
	}
	u, token, err := h.auth.Register(r.Context(), in)
	if err != nil {
		translateErr(w, err)
		return
	}
	created(w, map[string]any{"token": token, "user": u})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		badRequest(w, "invalid JSON body")
		return
	}
	u, token, err := h.auth.Login(r.Context(), in.Email, in.Password)
	if err != nil {
		translateErr(w, err)
		return
	}
	ok(w, map[string]any{"token": token, "user": u})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	uid := middleware.UserIDFrom(r.Context())
	if uid == 0 {
		unauthorized(w)
		return
	}
	u, err := h.auth.UserByID(r.Context(), uid)
	if err != nil || u == nil {
		unauthorized(w)
		return
	}
	ok(w, u)
}

// --- helpers -------------------------------------------------------------

func ok(w http.ResponseWriter, data any) {
	middleware.WriteJSON(w, http.StatusOK, data)
}

func created(w http.ResponseWriter, data any) {
	middleware.WriteJSON(w, http.StatusCreated, data)
}

func badRequest(w http.ResponseWriter, msg string) {
	middleware.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": msg})
}

func unauthorized(w http.ResponseWriter) {
	middleware.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
}

func translateErr(w http.ResponseWriter, err error) {
	msg := err.Error()
	switch {
	case errors.Is(err, services.ErrValidation):
		badRequest(w, msg)
	case errors.Is(err, services.ErrInvalidCredentials):
		unauthorized(w)
	case errors.Is(err, services.ErrEmailTaken):
		conflict(w, msg)
	case errors.Is(err, services.ErrForbidden):
		forbidden(w)
	case errors.Is(err, services.ErrNotFound):
		notFound(w)
	default:
		if strings.Contains(msg, "validation") {
			badRequest(w, msg)
			return
		}
		internalError(w, err)
	}
}

func conflict(w http.ResponseWriter, msg string) {
	middleware.WriteJSON(w, http.StatusConflict, map[string]string{"error": msg})
}

func forbidden(w http.ResponseWriter) {
	middleware.WriteJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
}

func notFound(w http.ResponseWriter) {
	middleware.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
}

func internalError(w http.ResponseWriter, err error) {
	middleware.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
}
