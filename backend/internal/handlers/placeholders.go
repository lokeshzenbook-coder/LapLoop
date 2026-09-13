package handlers

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
)

// Placeholder renders deterministic, self-hosted SVG placeholder images for
// seeded listings so the marketplace never depends on an external image
// service (which can be slow or blocked). Route: GET /placeholders/{seed}.
type PlaceholderHandler struct{}

func NewPlaceholderHandler() *PlaceholderHandler { return &PlaceholderHandler{} }

var seedPattern = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)

var placeholderPalette = [][2]string{
	{"#0ea5e9", "#1e3a8a"}, {"#8b5cf6", "#1e1b4b"}, {"#10b981", "#064e3b"},
	{"#f59e0b", "#78350f"}, {"#f43f5e", "#4c0519"}, {"#14b8a6", "#134e4a"},
}

func (h *PlaceholderHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	seed := chi.URLParam(r, "seed")
	if !seedPattern.MatchString(seed) {
		seed = "laptop"
	}

	sum := 0
	for _, c := range seed {
		sum += int(c)
	}
	colors := placeholderPalette[sum%len(placeholderPalette)]
	label := strings.ToUpper(strings.ReplaceAll(seed, "-", " "))

	w.Header().Set("Content-Type", "image/svg+xml")
	w.Header().Set("Cache-Control", "public, max-age=86400, immutable")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675" role="img">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="%s"/>
      <stop offset="1" stop-color="%s"/>
    </linearGradient>
  </defs>
  <rect width="900" height="675" fill="url(#g)"/>
  <g transform="translate(450,338)">
    <rect x="-160" y="-118" width="320" height="208" rx="16" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.75)" stroke-width="4"/>
    <rect x="-122" y="-96" width="244" height="140" rx="8" fill="#0b1220" opacity="0.55"/>
    <line x1="-60" y1="98" x2="60" y2="98" stroke="rgba(255,255,255,0.75)" stroke-width="10" stroke-linecap="round"/>
  </g>
  <text x="450" y="100" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="56" font-weight="700" fill="#ffffff" opacity="0.95">LapLoop</text>
  <text x="450" y="600" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="34" font-weight="600" fill="#ffffff" opacity="0.9">%s</text>
</svg>`, colors[0], colors[1], label)

	w.Write([]byte(svg))
}
