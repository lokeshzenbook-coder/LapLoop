package handlers

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
)

func TestPlaceholderSVG(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/placeholders/{seed}", NewPlaceholderHandler().ServeHTTP)

	for _, seed := range []string{"laptop-mbp14-1", "a_b-c", "bad seed!"} {
		req := httptest.NewRequest("GET", "/placeholders/"+strings.ReplaceAll(seed, " ", "%20"), nil)
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		if rec.Code != 200 {
			t.Fatalf("seed %q status = %d", seed, rec.Code)
		}
		if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "image/svg+xml") {
			t.Fatalf("seed %q content type = %q", seed, ct)
		}
		if !strings.Contains(rec.Body.String(), "<svg") {
			t.Fatalf("seed %q body has no svg", seed)
		}
	}
}
