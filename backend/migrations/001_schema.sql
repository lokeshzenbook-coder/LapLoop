CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    location      TEXT        NOT NULL DEFAULT '',
    phone         TEXT        NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS laptops (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    brand          TEXT          NOT NULL,
    model          TEXT          NOT NULL,
    cpu            TEXT          NOT NULL,
    ram_gb         INTEGER       NOT NULL DEFAULT 0,
    storage_gb     INTEGER       NOT NULL DEFAULT 0,
    storage_type   TEXT          NOT NULL DEFAULT 'SSD',
    gpu            TEXT          NOT NULL DEFAULT '',
    display        TEXT          NOT NULL DEFAULT '',
    condition      TEXT          NOT NULL DEFAULT 'good',
    age_years      INTEGER       NOT NULL DEFAULT 0,
    battery_health INTEGER       NOT NULL DEFAULT 100,
    price          NUMERIC(12,2) NOT NULL,
    location       TEXT          NOT NULL DEFAULT '',
    description    TEXT          NOT NULL DEFAULT '',
    status         TEXT          NOT NULL DEFAULT 'active',
    views          INTEGER       NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laptops_brand      ON laptops (brand);
CREATE INDEX IF NOT EXISTS idx_laptops_price      ON laptops (price);
CREATE INDEX IF NOT EXISTS idx_laptops_created_at ON laptops (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_laptops_user_id    ON laptops (user_id);
CREATE INDEX IF NOT EXISTS idx_laptops_status     ON laptops (status);

CREATE TABLE IF NOT EXISTS images (
    id         BIGSERIAL PRIMARY KEY,
    laptop_id  BIGINT NOT NULL REFERENCES laptops (id) ON DELETE CASCADE,
    url        TEXT   NOT NULL,
    key        TEXT   NOT NULL DEFAULT '',
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_laptop_id ON images (laptop_id);

CREATE TABLE IF NOT EXISTS favorites (
    user_id    BIGINT      NOT NULL REFERENCES users (id)    ON DELETE CASCADE,
    laptop_id  BIGINT      NOT NULL REFERENCES laptops (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, laptop_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_laptop_id ON favorites (laptop_id);

CREATE TABLE IF NOT EXISTS inquiries (
    id         BIGSERIAL PRIMARY KEY,
    laptop_id  BIGINT      NOT NULL REFERENCES laptops (id) ON DELETE CASCADE,
    user_id    BIGINT      REFERENCES users (id)            ON DELETE SET NULL,
    name       TEXT        NOT NULL,
    email      TEXT        NOT NULL,
    message    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_laptop_id ON inquiries (laptop_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id   ON inquiries (user_id);