# Laptop Market API

Base URL: `http://localhost:8080` (dev). All endpoints return JSON.

## Authentication

`POST /auth/register` and `POST /auth/login` return a `token` (JWT, 7 days). Send it as
`Authorization: Bearer <token>` on protected endpoints.

## Error shape

```json
{ "error": "human readable message" }
```

## Endpoints

### Auth

| Method | Path              | Auth | Body                                                                 |
|--------|-------------------|------|----------------------------------------------------------------------|
| POST   | `/auth/register`  | no   | `{name, email, password, location?, phone?}`                         |
| POST   | `/auth/login`     | no   | `{email, password}`                                                  |
| GET    | `/me`             | yes  | current user                                                         |

`POST /auth/register` → `201 {token, user}`
`POST /auth/login` → `200 {token, user}`

**User**

```json
{
  "id": 1,
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "location": "Berlin, Germany",
  "phone": "+49 170 123456",
  "createdAt": "2026-01-01T10:00:00Z"
}
```

### Laptops

| Method | Path                     | Auth | Description                                          |
|--------|--------------------------|------|------------------------------------------------------|
| GET    | `/laptops`               | no   | list with search + filters + pagination              |
| GET    | `/laptops/:id`           | no   | detail incl. seller, images, isFavorite (if authed)  |
| POST   | `/laptops`               | yes  | create listing (JSON)                                |
| PUT    | `/laptops/:id`           | yes  | update listing (owner only)                          |
| DELETE | `/laptops/:id`           | yes  | delete listing + images (owner only)                 |
| POST   | `/laptops/:id/images`    | yes  | upload multiple images (multipart `files[]`)         |
| DELETE | `/images/:id`            | yes  | delete a single image (owner of listing)             |
| POST   | `/laptops/:id/favorite`  | yes  | toggle favorite → `{favorite: bool}`                 |
| POST   | `/laptops/:id/inquiry`   | yes  | send a message to the seller                         |
| GET    | `/me/listings`           | yes  | current user's listings                              |
| GET    | `/me/favorites`          | yes  | current user's favorite laptops                      |

#### GET /laptops query params

| Param      | Example                 | Notes                          |
|------------|-------------------------|--------------------------------|
| `q`        | `macbook pro`           | full-text search over fields   |
| `brand`    | `Apple`                 | exact brand                    |
| `cpu`      | `i7`                    | substring match                |
| `condition`| `good`                  | like-new, excellent, good, fair, damaged |
| `minRam`   | `16`                    | RAM >= n GB                    |
| `maxRam`   | `64`                    | RAM <= n GB                    |
| `minStorage`| `512`                  | storage >= n GB                |
| `minPrice` | `400`                   |                                |
| `maxPrice` | `2000`                  |                                |
| `location` | `Berlin`                | substring match                |
| `sort`     | `newest` `price_asc` `price_desc` `popular` | default `newest` |
| `page`     | `1`                     | default 1                      |
| `limit`    | `12`                    | default 12, max 48             |

**Response**

```json
{
  "items": [
    {
      "id": 1,
      "brand": "Apple",
      "model": "MacBook Pro 14\" M1 Pro",
      "cpu": "Apple M1 Pro (10-core)",
      "ramGB": 16,
      "storageGB": 512,
      "storageType": "SSD",
      "gpu": "Integrated 16-core GPU",
      "display": "14.2\" Liquid Retina XDR, 3024x1964",
      "condition": "excellent",
      "ageYears": 2,
      "batteryHealth": 94,
      "price": 1250,
      "location": "Berlin, Germany",
      "description": "…",
      "status": "active",
      "views": 42,
      "isFavorite": false,
      "seller": { "id": 1, "name": "Alex Rivera", "location": "Berlin, Germany" },
      "images": [{ "id": 1, "url": "http://localhost:9000/laptop-images/laptops/1/….jpg", "position": 0 }],
      "createdAt": "2026-01-01T10:00:00Z",
      "updatedAt": "2026-01-01T10:00:00Z"
    }
  ],
  "total": 37,
  "page": 1,
  "pages": 4,
  "limit": 12,
  "brands": ["Apple", "Dell", "Lenovo", "ASUS"]
}
```

#### Laptop create/update body

```json
{
  "brand": "Lenovo",
  "model": "ThinkPad X1 Carbon Gen 10",
  "cpu": "Intel Core i7-1260P",
  "ramGB": 32,
  "storageGB": 1024,
  "storageType": "SSD",
  "gpu": "Intel Iris Xe",
  "display": "14\" WUXGA IPS, 1920x1200",
  "condition": "good",
  "ageYears": 3,
  "batteryHealth": 87,
  "price": 720.00,
  "location": "Munich, Germany",
  "description": "Six months of business use, perfect keys…",
  "status": "active"
}
```

Conditions: `like-new | excellent | good | fair | damaged`. `status`: `active | sold | inactive`.

#### Image upload

`POST /laptops/:id/images` — multipart form, field `files`, one or more
images. Allowed types: JPEG, PNG, WEBP, GIF. Max 5 MB each.

**Response**

```json
{
  "images": [{ "id": 12, "url": "http://localhost:9000/laptop-images/laptops/3/ab12….jpg", "position": 0 }]
}
```

### Favorites & inquiries

- `POST /laptops/:id/favorite` → `200 {"favorite": true}`
- `POST /laptops/:id/inquiry` body `{ "message": "Is the battery original?" }` → `201 {"success": true, "inquiry": {...}}`

### Health

`GET /health` → `200 {"status":"ok"}`

## Validation rules

- Register: name ≥ 2 chars, valid email, password ≥ 6 chars.
- Listing: brand, model, cpu, condition, location required; price > 0;
  ramGB, storageGB, batteryHealth ≥ 0.
- Image uploads are sniffed by content type and size-limited.