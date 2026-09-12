package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"marketplace/internal/config"
)

type Object struct {
	Key string
	URL string
}

type Storer interface {
	Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (*Object, error)
	Delete(ctx context.Context, key string) error
}

func New(cfg config.Storage) (Storer, error) {
	switch cfg.Provider {
	case "minio", "s3":
		return newMinIO(cfg)
	case "local":
		return newLocal(cfg)
	default:
		return nil, fmt.Errorf("unknown storage provider %q", cfg.Provider)
	}
}

// --- MinIO / S3-compatible ----------------------------------------------

type MinIO struct {
	client *minio.Client
	bucket string
	prefix string // e.g. "https://host"
}

func newMinIO(cfg config.Storage) (Storer, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio client: %w", err)
	}
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		return nil, fmt.Errorf("minio bucket check: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("minio create bucket: %w", err)
		}
	}
	// Public read so images load straight from S3 in the browser.
	policy := fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [{
			"Effect": "Allow",
			"Principal": {"AWS": ["*"]},
			"Action": ["s3:GetObject"],
			"Resource": ["arn:aws:s3:::%s/*"]
		}]
	}`, cfg.Bucket)
	if err := client.SetBucketPolicy(ctx, cfg.Bucket, policy); err != nil {
		return nil, fmt.Errorf("minio bucket policy: %w", err)
	}
	return &MinIO{client: client, bucket: cfg.Bucket, prefix: cfg.PublicURL}, nil
}

func (m *MinIO) Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (*Object, error) {
	_, err := m.client.PutObject(ctx, m.bucket, key, r, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return nil, fmt.Errorf("upload: %w", err)
	}
	return &Object{Key: key, URL: fmt.Sprintf("%s/%s/%s", m.prefix, m.bucket, key)}, nil
}

func (m *MinIO) Delete(ctx context.Context, key string) error {
	if key == "" {
		return nil
	}
	return m.client.RemoveObject(ctx, m.bucket, key, minio.RemoveObjectOptions{})
}

// --- Local disk (dev fallback) -------------------------------------------

type Local struct {
	dir     string
	baseURL string
}

func newLocal(cfg config.Storage) (Storer, error) {
	if err := os.MkdirAll(cfg.LocalDir, 0o755); err != nil {
		return nil, err
	}
	return &Local{dir: cfg.LocalDir, baseURL: fmt.Sprintf("%s/uploads", cfg.LocalPublicURL)}, nil
}

func (l *Local) Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (*Object, error) {
	path := filepath.Join(l.dir, filepath.FromSlash(key))
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	f, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		return nil, err
	}
	return &Object{Key: key, URL: fmt.Sprintf("%s/%s", l.baseURL, key)}, nil
}

func (l *Local) Delete(ctx context.Context, key string) error {
	if key == "" {
		return nil
	}
	err := os.Remove(filepath.Join(l.dir, filepath.FromSlash(key)))
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}
