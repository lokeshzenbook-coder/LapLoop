package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port           string
	DatabaseURL    string
	JWTSecret      string
	JWTTTLHours    int
	Storage        Storage
	FrontendOrigin string
	RateLimit      int
	Seed           bool
}

type Storage struct {
	Provider       string // "minio" | "local"
	Endpoint       string
	AccessKey      string
	SecretKey      string
	Bucket         string
	PublicURL      string // browser-reachable base URL for objects
	LocalDir       string
	LocalPublicURL string // base URL used when serving local uploads
	UseSSL         bool
	MaxUploadMB    int64
}

func Load() Config {
	return Config{
		Port:           get("PORT", "8080"),
		DatabaseURL:    get("DATABASE_URL", "postgres://marketplace:marketplace@localhost:5432/marketplace?sslmode=disable"),
		JWTSecret:      get("JWT_SECRET", "dev-secret-change-me"),
		JWTTTLHours:    getInt("JWT_TTL_HOURS", 168),
		FrontendOrigin: get("FRONTEND_ORIGIN", "http://localhost:3000"),
		RateLimit:      getInt("RATE_LIMIT_PER_MINUTE", 120),
		Seed:           getBool("SEED", false),
		Storage: Storage{
			Provider:       get("STORAGE_PROVIDER", "local"),
			Endpoint:       get("S3_ENDPOINT", "localhost:9000"),
			AccessKey:      get("S3_ACCESS_KEY", "minioadmin"),
			SecretKey:      get("S3_SECRET_KEY", "minioadmin"),
			Bucket:         get("S3_BUCKET", "laptop-images"),
			PublicURL:      strings.TrimRight(get("S3_PUBLIC_URL", "http://localhost:9000"), "/"),
			LocalDir:       get("LOCAL_UPLOAD_DIR", "./data/uploads"),
			LocalPublicURL: strings.TrimRight(get("LOCAL_PUBLIC_URL", "http://localhost:8080"), "/"),
			UseSSL:         getBool("S3_USE_SSL", false),
			MaxUploadMB:    getInt64("MAX_UPLOAD_MB", 5),
		},
	}
}

func get(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func getInt64(key string, def int64) int64 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			return n
		}
	}
	return def
}

func getBool(key string, def bool) bool {
	if v := os.Getenv(key); v != "" {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return def
}
