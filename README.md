# LapLoop

> laptops changing hands

A modern full-stack **used laptop marketplace** — browse, list and sell used laptops with
real photos, honest specs and transparent battery health.

| Layer      | Tech                                                     |
|------------|----------------------------------------------------------|
| Frontend   | Next.js 16 (App Router) · TypeScript · Tailwind CSS      |
| Backend    | Go (chi, pgx) — clean REST: handlers → services → repos  |
| Database   | PostgreSQL 16                                            |
| Storage    | S3-compatible object storage (MinIO) or local disk       |
| Auth       | JWT (HS256) + bcrypt password hashing                    |
| Deploy     | Docker + Docker Compose                                  |

## Quick start

```bash
docker compose up --build
```

Then open:

- **App** → http://localhost:3000
- **API** → http://localhost:8080 (`GET /health`)
- **MinIO console** → http://localhost:9001 (`minioadmin` / `minioadmin`)
- **Postgres** → `postgres://marketplace:marketplace@localhost:5432/marketplace`

On first boot the backend applies migrations, seeds **4 demo users and 10 listings**
(SET `SEED=true`), and creates the public `laptop-images` bucket.

### Demo accounts

| Email             | Password      |
|-------------------|---------------|
| alex@example.com  | `password123` |
| mia@example.com   | `password123` |
| jonas@example.com | `password123` |
| priya@example.com | `password123` |

### Screens

- **Home** — hero, live search, brand/condition/RAM/storage/price/location filters, sorting
  (newest/price/popular), pagination, favorite buttons.
- **Listing page** — photo gallery, spec table, seller card with verified badge, contact form.
- **Sell** — multi-step form, optional status, drag & drop **multi-image upload** (JPEG/PNG/WEBP/GIF, ≤5 MB).
- **Dashboard** — stats (active/views/sold), edit/delete listings, listing status.

## Architecture

```
backend/
├── cmd/server/            # entrypoint, wiring
├── internal/
│   ├── config/            # env config
│   ├── models/            # User, Laptop, Image, Favorite, Inquiry
│   ├── repositories/      # PostgreSQL access (Store)
│   ├── services/          # auth, laptops, seed — business logic + validation
│   ├── handlers/          # HTTP handlers + router
│   ├── middleware/        # JWT auth, CORS, rate limiting, logging, panic recovery
│   ├── storage/           # MinIO (S3) + local-disk providers
│   └── database/          # pgx pool + migration runner
├── migrations/            # SQL schema
└── Dockerfile

frontend/
├── app/                   # /, /laptops/[id], /sell, /dashboard, /login, /register
├── components/            # UI kit + feature components
├── lib/                   # API client, auth context, utils
├── hooks/                 # useLaptops, useDebounce
├── types/                 # shared TS types
└── Dockerfile
```

## API

Full reference in [API.md](./API.md). Summary:

```
POST /auth/register            POST /auth/login          GET /me
GET  /laptops                  GET /laptops/:id          POST /laptops
PUT  /laptops/:id              DELETE /laptops/:id       POST /laptops/:id/images
DELETE /images/:id             POST /laptops/:id/favorite   POST /laptops/:id/inquiry
GET  /me/listings              GET /me/favorites
```

## Configuration

All settings are env vars (see [`.env.example`](./.env.example)). Storage can run as
MinIO/S3 (`STORAGE_PROVIDER=minio`) or plain local disk (`STORAGE_PROVIDER=local`) for
offline dev — local uploads are served from `/uploads`.

```bash
cp .env.example .env   # documents every variable
```

## Security

- bcrypt password hashing; JWT HS256 with expiry; owner-only authorization on edits/deletes.
- Input validation on all endpoints; image type sniffing + size limits (no magic-mime trust).
- Per-IP rate limiting, CORS allow-list, panic recovery, no secrets in the repo.

## Development without Docker

Backend:

```bash
cd backend
DATABASE_URL='postgres://marketplace:marketplace@localhost:5432/marketplace?sslmode=disable' \
STORAGE_PROVIDER=local JWT_SECRET=dev go run ./cmd/server
```

Frontend:

```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```