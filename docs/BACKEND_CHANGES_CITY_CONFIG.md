# Backend changes: City-wise journey configuration + uploads

This document describes the **backend API updates**, **database schema changes**, and **seed/migration changes** needed to support the latest frontend features:

- City-wise journey configuration (separate config per city)
- Admin editing UI (title/labels/descriptions/location/address)
- Image uploads stored in S3 via presigned URLs

Applies to a Node.js + Express.js + TypeScript backend using Postgres + S3.

---

## 1) API endpoints to implement / update

### 1.1 Admin: Journey configuration (city-scoped)

#### GET config for a city
**GET** `/api/admin/journey?city={cityId}`

- **Auth**: admin-only
- **Query**
  - `city`: string (slug), e.g. `bangalore`, `chennai`
- **200 response**

```json
{
  "version": 1,
  "updatedAt": "2026-04-28T12:05:10.123Z",
  "stages": [
    {
      "id": "stranger",
      "title": "Stranger",
      "weeksLabel": "Weeks 1 - 8",
      "description": "Intro journey for newcomers",
      "imageUrl": "admin_asset/bangalore/1e5f...jpg",
      "accent": "green",
      "status": "in_progress",
      "levels": [
        {
          "id": "stranger-l1",
          "levelNumber": 1,
          "imageUrl": "admin_asset/bangalore/91aa...jpg",
          "tasks": [
            {
              "id": "s1l1-food",
              "category": "food",
              "title": "Benne Dosa at CTR.",
              "description": "Visit CTR and upload a photo proof.",
              "address": "CTR Shri Sagar, Malleshwaram, Bengaluru",
              "location": { "lat": 12.9983, "lng": 77.5707, "radiusM": 100 },
              "completed": false,
              "xp": 100,
              "imageUrl": "admin_asset/bangalore/ff02...jpg",
              "galleryUrls": ["admin_asset/bangalore/a1.jpg"]
            }
          ]
        }
      ]
    }
  ]
}
```

Notes:
- If a city has no config yet, backend should **return a seeded default config** (see seeding section) so the admin can edit and save it.
- Frontend treats `accent`, `status`, and task `completed` as legacy UI values; backend may store them but doesn’t need to use them for gameplay logic.

#### PUT save config for a city
**PUT** `/api/admin/journey?city={cityId}`

- **Auth**: admin-only
- **Request body**: same JSON shape as GET response
- Backend should:
  - Validate `version === 1`
  - Validate required fields (below)
  - Set `updatedAt = now()`
  - Persist city-scoped config
- **200 response**: the saved config (with updated `updatedAt`)

**Required fields (minimum enforced by backend)**
- `version`
- `stages[].id`, `stages[].title`, `stages[].weeksLabel`
- `levels[].id`, `levels[].levelNumber`
- `tasks[].id`, `tasks[].category`, `tasks[].title`
- `tasks[].description`, `tasks[].address`
- `tasks[].location.lat`, `tasks[].location.lng`

---

### 1.2 Uploads (S3 presigned PUT)

The frontend already calls these endpoints.

#### Request upload URL
**POST** `/v1/uploads/request`

Request:
```json
{
  "purpose": "admin_asset",
  "content_type": "image/jpeg",
  "file_name": "stage.jpg",
  "size_bytes": 123456
}
```

Response **200**:
```json
{
  "upload_id": "upl_123",
  "method": "PUT",
  "upload_url": "https://s3-presigned-put-url",
  "file_key": "admin_asset/bangalore/upl_123.jpg",
  "expires_at": "2026-04-28T12:10:00Z"
}
```

Rules:
- Enforce max size and allowed types.
- Include `city` scope in key:
  - `admin_asset/{cityId}/{uuid}.{ext}`
  - `mission_proof/{cityId}/{userId}/{uuid}.{ext}`

#### Confirm upload (optional)
**POST** `/v1/uploads/confirm`

Request:
```json
{ "upload_id": "upl_123" }
```

Response **200**:
```json
{ "ok": true, "file_key": "admin_asset/bangalore/upl_123.jpg" }
```

---

## 2) Database schema changes (Postgres)

You can store city configs either as **JSONB** (fastest) or **normalized tables** (more queryable). JSONB is recommended for v1 because it matches the admin payload directly.

### Option A (recommended): JSONB config per city

#### Table: `cities`
- `id` (text, pk) — e.g. `bangalore`
- `name` (text) — e.g. `Bangalore`
- `created_at` (timestamp)

#### Table: `journey_configs`
- `id` (uuid, pk)
- `city_id` (text, fk → `cities.id`)
- `version` (int) — currently 1
- `config_json` (jsonb) — stores full JourneyConfig object
- `updated_at` (timestamp)
- constraints:
  - `unique (city_id, version)` or simpler `unique (city_id)` if you store only latest

#### Table: `uploads`
- `id` (uuid/pk) or `upload_id` (text/pk)
- `city_id` (text)
- `user_id` (text/uuid nullable for admin uploads)
- `purpose` (text)
- `file_key` (text)
- `content_type` (text)
- `size_bytes` (bigint)
- `created_at` (timestamp)
- `confirmed_at` (timestamp nullable)

---

### Option B: Normalized content tables (later)

If you want missions queryable by geo, split out into:
- `journeys` (city_id, title, description)
- `levels` (journey_id, order, title)
- `missions`:
  - `description`, `address`
  - `location_lat`, `location_lng`, `radius_m`
  - `image_key`, `gallery_keys` (jsonb or array)

You can still keep `journey_configs` as the authoring source and periodically compile/publish into normalized tables.

---

## 3) Migrations

Create migration scripts for:
- `cities`
- `journey_configs`
- `uploads`

Recommended scripts:
- `npm run migrate` (apply)
- `npm run migrate:status`
- `npm run migrate:reset` (dev only)

---

## 4) Seed data changes

### Seed cities
Insert:
- `bangalore`, `cochin`, `hyderabad`, `chennai`

### Seed journey config per city
Seed at least `bangalore` with the static data from:
- `frontend/data/seed-static-journey.json` → `journeys[]`

For the other cities, either:
- copy Bangalore as a starting template, or
- seed an empty-but-valid config (stages/levels/tasks present but blank descriptions/locations).

### Seed admin access
- Create a demo admin user in auth tables (if you have them), and/or
- add `ADMIN_EMAILS=demo@cityquest.local` in `.env` for local dev.

---

## 5) Backend implementation notes (Express + TS)

### Validation
Use Zod schemas for:
- `cityId` slug normalization
- `JourneyConfig` payload validation (required fields)
- upload request payload validation

### Admin auth
Admin endpoints must verify:
- authenticated user
- user is admin (role or email allowlist)

### City scoping
Every config read/write must be scoped by:
- `cityId` from query param (default to `bangalore`)
- enforce `cityId` exists in `cities` table (or auto-create on first save)

### S3
Use AWS SDK v3:
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

Store only the **object key** (`file_key`) in DB/config.

---

## 6) Copy/paste prompt for backend implementation (Cursor)

Build / update an existing Node.js + Express.js + TypeScript backend with Postgres and AWS S3.

### Requirements
- Implement admin city-scoped journey config endpoints:
  - GET `/api/admin/journey?city=:cityId`
  - PUT `/api/admin/journey?city=:cityId`
- Persist configs per city in Postgres using JSONB table `journey_configs`.
- Add `cities` table and seed 4 cities (bangalore, cochin, hyderabad, chennai).
- Add `uploads` table to track presigned uploads.
- Implement `POST /v1/uploads/request` and optional `POST /v1/uploads/confirm` to support S3 presigned PUT uploads.
- Upload keys must include city scope: `admin_asset/{cityId}/{uuid}.{ext}` and `mission_proof/{cityId}/{userId}/{uuid}.{ext}`.
- Validate all payloads with Zod and return consistent error shape `{ error: { code, message, details } }`.
- Add migrations and seed scripts:
  - migration creates tables above
  - seeding imports Bangalore config from `frontend/data/seed-static-journey.json` and stores it into `journey_configs`.
- Provide OpenAPI JSON at `/openapi.json` describing endpoints above.

### Expected JourneyConfig JSON shape
- version: 1
- updatedAt: ISO string (server overwrites on save)
- stages[] with:
  - id, title, weeksLabel
  - optional description, imageUrl
  - levels[] with id, levelNumber, optional imageUrl
  - tasks[] with id, category, title, required description/address/location(lat,lng), optional radiusM/xp/imageUrl/galleryUrls

Return saved JSON on PUT.

