<p align="center">
  <img src="https://raw.githubusercontent.com/lokeshzenbook-coder/LapLoop/main/frontend/public/icon.svg" alt="LapLoop" width="96" />
</p>

<h1 align="center">LapLoop</h1>

<p align="center"><strong>laptops changing hands</strong></p>

<p align="center">
  A modern full-stack marketplace for buying and selling used laptops — with real photos,
  honest specs and transparent battery health.
</p>

<p align="center">
  <kbd>Next.js 16</kbd> <kbd>TypeScript</kbd> <kbd>Tailwind CSS</kbd>
  <kbd>Go</kbd> <kbd>PostgreSQL</kbd> <kbd>Docker</kbd>
</p>

---

## ✨ Features

| | |
|---|---|
| **Browse** | Live search, brand / condition / RAM / storage / price / location filters, sorting (newest · price · popular), pagination |
| **Listing page** | Photo gallery, full spec table, seller card with verified badge, contact/inquiry form |
| **Sell** | Step-by-step form with optional status and drag & drop **multi-image upload** (JPEG · PNG · WEBP · GIF, up to 5 MB) |
| **Dashboard** | Listing stats (active · views · sold), edit / delete listings, status management |
| **Auth** | Register / login with JWT sessions and owner-only protected actions |
| **Wake-up fresh** | First boot auto-migrates the schema and seeds 4 demo users + 10 listings |

---

## 🚀 Quick start

```bash
docker compose up --build
```

Then open:

| Service | URL | Notes |
|---|---|---|
| **App** | http://localhost:3000 | Next.js frontend |
| **API** | http://localhost:8080 | `GET /health` |
| **MinIO console** | http://localhost:9001 | `minioadmin` / `minioadmin` |
| **Postgres** | `postgres://marketplace:marketplace@localhost:5432/marketplace` | |

> On first boot the backend applies migrations, seeds demo data (`SEED=true`) and creates the
> public `laptop-images` bucket. Seeded listings ship with self-hosted SVG placeholders, so the
> marketplace renders perfectly with **no external image service required**.

### Demo accounts

| Email             | Password      |
|-------------------|---------------|
| `alex@example.com`  | `password123` |
| `mia@example.com`   | `password123` |
| `jonas@example.com` | `password123` |
| `priya@example.com` | `password123` |

---

## 🧱 Tech stack

| Layer      | Tech                                                                   |
|------------|------------------------------------------------------------------------|
| Frontend   | Next.js 16 (App Router) · TypeScript · Tailwind CSS                    |
| Backend    | Go (chi, pgx) — clean REST: handlers → services → repos                |
| Database   | PostgreSQL 16                                                          |
| Storage    | S3-compatible object storage (MinIO) or local disk                     |
| Auth       | JWT (HS256) + bcrypt password hashing                                  |
| Deploy     | Docker + Docker Compose                                                |

---

## 🏗 Architecture

```
backend/
├── cmd/server/            # entrypoint, wiring
├── internal/
│   ├── config/            # env config
│   ├── models/            # User, Laptop, Image, Favorite, Inquiry
│   ├── repositories/      # PostgreSQL access (Store)
│   ├── services/          # auth, laptops, seed — business logic + validation
│   ├── handlers/          # HTTP handlers + router (+ /placeholders)
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

---

## 🔌 API

Full reference in [API.md](./API.md). Summary:

```
POST /auth/register          POST /auth/login             GET /me
GET  /laptops                GET  /laptops/:id           POST /laptops
PUT  /laptops/:id            DELETE /laptops/:id         POST /laptops/:id/images
DELETE /images/:id           POST /laptops/:id/favorite  POST /laptops/:id/inquiry
GET  /me/listings            GET  /me/favorites
```

`GET /laptops` supports search, filtering and pagination via query params
(`q`, `brand`, `condition`, `minRam`, `maxPrice`, `sort`, `page`, `limit`, …).

---

## ⚙️ Configuration

All settings are environment variables — see [`.env.example`](./.env.example) for every option.

```bash
cp .env.example .env
```

Storage runs as **MinIO/S3** (`STORAGE_PROVIDER=minio`) or plain **local disk**
(`STORAGE_PROVIDER=local`) for offline dev, with local uploads served from `/uploads`.

| Variable            | Default                    | Purpose                                   |
|---------------------|----------------------------|-------------------------------------------|
| `PORT`              | `8080`                     | API port                                  |
| `DATABASE_URL`      | local postgres URL         | PostgreSQL connection string              |
| `JWT_SECRET`        | `dev-secret-change-me`     | Token signing secret                      |
| `STORAGE_PROVIDER`  | `local`                    | `minio` or `local`                        |
| `S3_PUBLIC_URL`     | `http://localhost:9000`    | Browser-reachable MinIO base URL          |
| `PUBLIC_BASE_URL`   | `http://localhost:8080`    | Browser-reachable API base URL (placeholders) |
| `NEXT_PUBLIC_API_URL`| `http://localhost:8080`   | Frontend → API base URL                   |
| `SEED`              | `false`                    | Seed demo data on first boot              |

---

## 🔒 Security

- **bcrypt** password hashing and **JWT (HS256)** with 7-day expiry.
- Owner-only authorization on every edit / delete / upload.
- Input validation on all endpoints; image **content-type sniffing** + size limits (no magic-mime trust).
- Per-IP rate limiting, CORS allow-list, panic recovery, and **no secrets committed**.

---

## 🛠 Development without Docker

PostgreSQL must be running and reachable first. Start just the database
dependency, or point `DATABASE_URL` at your own Postgres:

```bash
# Start LapLoop's PostgreSQL (localhost:5432, marketplace/marketplace/marketplace)
docker compose up -d db
```

**Backend:**

```bash
cd backend
DATABASE_URL='postgres://marketplace:marketplace@localhost:5432/marketplace?sslmode=disable' \
STORAGE_PROVIDER=local JWT_SECRET=dev go run ./cmd/server
```

> If the backend exits with `connection refused` on port 5432, PostgreSQL is not
> ready — run `docker compose up -d db` (or start your own Postgres) and retry.

**Frontend:**

```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8080 npm run dev
```

---

## 📖 Screens

- **Home** — hero, live search, filters, sorting, pagination, favorite buttons.
- **Listing page** — photo gallery, spec table, seller card with verified badge, contact form.
- **Sell** — multi-step form, optional status, drag & drop multi-image upload.
- **Dashboard** — stats (active / views / sold), edit & delete listings, listing status.