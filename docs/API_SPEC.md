# CityQuest Backend API Spec (Proposed)

This document defines the **expected backend endpoints** for the CityQuest app (frontend), including payloads, responses, auth, file upload, and geo-validation flows.

## Assumptions

- **Two services** (recommended):
  - **Auth Service**: identity, registration, login, Google OAuth 2.0, sessions/tokens.
  - **Game/Data Service**: journeys, levels, missions, progress, submissions, uploads metadata, geo validation.
- **Datastores**:
  - Postgres for primary data.
  - S3-compatible object storage for images (AWS S3).
- **Auth model**:
  - Frontend stores a **NextAuth session** (cookie) but relies on backend for user identity and authorization decisions.
  - Frontend calls backend with an **Authorization Bearer token** OR a session cookie (pick one; details below include Bearer JWT).

> You can implement as a single backend too; keep the endpoint shapes and split later.

---

## Frontend integration mapping (this repo)

This Next.js app calls the API using `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:5000` if unset).

- **Home (`/home`)**
  - `GET /v1/journeys` (pick first journey)
  - `GET /v1/journeys/{journeyId}`
  - `GET /v1/me/progress?journey_id=...` (optional; ignored if unauthenticated)
  - `GET /v1/levels/{levelId}`
  - `GET /v1/me/levels/{levelId}/progress` (optional; ignored if unauthenticated)
- **Journey list (`/journey`)**
  - `GET /v1/journeys`
- **Stage overview (`/journey/stage/{journeyId}`)**
  - `GET /v1/journeys/{journeyId}`
- **Level missions (`/journey/stage/{journeyId}/level/{levelNumber}`)**
  - `GET /v1/journeys/{journeyId}` (find level id by `order == levelNumber`)
  - `GET /v1/levels/{levelId}`
  - `GET /v1/me/levels/{levelId}/progress` (optional)
- **Mission detail + proof submission (`/journey/stage/.../mission/{missionId}`)**
  - `GET /v1/journeys/{journeyId}`
  - `GET /v1/levels/{levelId}`
  - `GET /v1/missions/{missionId}`
  - `POST /v1/uploads/request`
  - `PUT` to presigned `upload_url`
  - `POST /v1/uploads/confirm` (optional)
  - `POST /v1/missions/{missionId}/submissions`

Notes:
- Legacy routes `/journey/week/*` redirect to the `/journey/stage/*` equivalents (first journey in the list).

---

## Base URLs (suggested)

- **Auth Service**: `https://auth.cityquest.com`
- **Game/Data Service**: `https://api.cityquest.com`

In local dev:
- `AUTH_API_BASE_URL` (server-side calls from NextAuth) → `http://localhost:4000`
- `NEXT_PUBLIC_AUTH_API_BASE_URL` (browser redirects / register) → `http://localhost:4000`
- `NEXT_PUBLIC_API_BASE_URL` (API base used by frontend pages) → `http://localhost:5000`

---

## Standard Conventions

### Authentication
- Requests requiring auth include:
  - `Authorization: Bearer <access_token>`

### Timestamps
- Use ISO8601 in UTC: `"2026-04-27T15:00:00Z"`

### IDs
- Use opaque string IDs: `usr_...`, `jrn_...`, `lvl_...`, `msn_...`, `sub_...`, `upl_...`

### Standard Error Shape

All 4xx/5xx responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "geo.accuracy_m must be <= 50",
    "details": { "field": "geo.accuracy_m", "max": 50 }
  }
}
```

---

## Auth Service API (v1)

### 1) Register (email/password)
**POST** `/v1/auth/register`

Request:
```json
{ "name": "Alex", "email": "a@b.com", "password": "Secret123!" }
```

Response **201**:
```json
{ "user": { "id": "usr_123", "email": "a@b.com", "name": "Alex" } }
```

Notes:
- Store password using `argon2id` (recommended) or `bcrypt`.
- Enforce password policy (min length, complexity) as needed.

---

### 2) Login (email/password)
**POST** `/v1/auth/login`

Request:
```json
{ "email": "a@b.com", "password": "Secret123!" }
```

Response **200** (minimum required by current frontend NextAuth Credentials authorize):
```json
{
  "user": { "id": "usr_123", "email": "a@b.com", "name": "Alex", "role": "user" }
}
```

Recommended (if you also want first-class API auth tokens):
```json
{
  "access_token": "jwt",
  "expires_in": 900,
  "refresh_token": "opaque",
  "refresh_expires_in": 2592000,
  "user": { "id": "usr_123", "email": "a@b.com", "name": "Alex", "role": "user" }
}
```

---

### 3) Start Google OAuth (backend-only)
**GET** `/v1/auth/google/start?redirect_uri={frontendCallbackUrl}&state={nonce}`

Behavior:
- Responds with **302 redirect** to Google consent screen.
- Must include and validate `state` (CSRF + return info).

Example `redirect_uri` used by frontend:
- `https://frontend.cityquest.com/auth/callback?from=%2Fhome`

---

### 4) Google OAuth callback (backend endpoint)
**GET** `/v1/auth/google/callback?code=...&state=...`

Behavior:
- Backend validates `state`, exchanges `code` with Google, creates/links user, then:
  - **Redirects (302)** to the frontend callback URI, appending a short-lived one-time code:
    - `https://frontend.cityquest.com/auth/callback?code={one_time_code}&from=/home`

---

### 5) Exchange OAuth one-time code
**POST** `/v1/auth/token`

Used by the frontend’s NextAuth Credentials provider to “finish” Google sign-in.

Request:
```json
{
  "code": "one_time_code_from_backend_redirect",
  "redirect_uri": "https://frontend.cityquest.com/auth/callback?from=%2Fhome"
}
```

Response **200** (minimum required by frontend):
```json
{
  "user": { "id": "usr_123", "email": "a@b.com", "name": "Alex", "role": "user" }
}
```

Recommended:
- Return access/refresh tokens too (same as login).
- One-time codes expire quickly (e.g. 60–120 seconds) and are single-use.

---

### 6) Get current user
**GET** `/v1/me`

Auth: Bearer

Response **200**:
```json
{
  "id": "usr_123",
  "email": "a@b.com",
  "name": "Alex",
  "role": "user",
  "created_at": "2026-04-27T15:00:00Z"
}
```

---

### 7) Logout (optional)
**POST** `/v1/auth/logout`

Response **200**:
```json
{ "ok": true }
```

---

## Game/Data Service API (v1)

### Domain model overview
- **Journey**: top-level experience (e.g. city trail).
- **Level**: grouped tasks in a journey.
- **Mission**: a user-completable task. Some require **photo + geo** validation.
- **Submission**: a user’s mission completion attempt (may be accepted/rejected).

---

## Content (Journeys / Levels / Missions)

### 1) List journeys
**GET** `/v1/journeys?status=active`

Response **200**:
```json
{
  "items": [
    { "id": "jrn_1", "title": "Downtown Trail", "description": "...", "level_count": 12, "status": "active" }
  ]
}
```

---

### 2) Journey details (level summary)
**GET** `/v1/journeys/{journeyId}`

Response **200**:
```json
{
  "id": "jrn_1",
  "title": "Downtown Trail",
  "description": "...",
  "levels": [
    { "id": "lvl_1", "title": "Start Point", "order": 1, "mission_count": 3 }
  ]
}
```

---

### 3) Level details (missions)
**GET** `/v1/levels/{levelId}`

Response **200**:
```json
{
  "id": "lvl_1",
  "journey_id": "jrn_1",
  "title": "Start Point",
  "order": 1,
  "missions": [
    {
      "id": "msn_1",
      "title": "Find the landmark",
      "description": "Take a photo at the landmark",
      "task_type": "photo+geo",
      "geo_rule": { "type": "radius_meters", "lat": 12.9716, "lng": 77.5946, "radius_m": 100 },
      "min_accuracy_m": 50,
      "time_window_sec": 600
    }
  ]
}
```

---

### 4) Mission details
**GET** `/v1/missions/{missionId}`

Response **200**:
```json
{
  "id": "msn_1",
  "level_id": "lvl_1",
  "title": "Find the landmark",
  "task_type": "photo+geo",
  "geo_rule": { "type": "radius_meters", "lat": 12.9716, "lng": 77.5946, "radius_m": 100 }
}
```

---

## User Progress (levels completed, missions completed)

### 1) Progress summary (per journey)
**GET** `/v1/me/progress?journey_id={journeyId}`

Response **200**:
```json
{
  "journey_id": "jrn_1",
  "levels": [
    { "level_id": "lvl_1", "status": "completed", "completed_at": "2026-04-27T15:00:00Z" },
    { "level_id": "lvl_2", "status": "locked" }
  ]
}
```

---

### 2) Level progress detail (mission statuses)
**GET** `/v1/me/levels/{levelId}/progress`

Response **200**:
```json
{
  "level_id": "lvl_1",
  "missions": [
    { "mission_id": "msn_1", "status": "completed", "submission_id": "sub_99" },
    { "mission_id": "msn_2", "status": "in_progress" }
  ]
}
```

---

## Upload + Submission (Image proof + Geo validation)

### Recommended flow
1) Client asks backend for a pre-signed URL.
2) Client uploads directly to S3.
3) Client submits the mission completion with:
   - `file_key` (S3 object key)
   - geo coordinates + accuracy + timestamp
4) Backend validates geo rule + time window + accuracy + file ownership and returns accepted/rejected.

---

### 1) Request upload URL (S3 presign)
**POST** `/v1/uploads/request`

Request:
```json
{
  "purpose": "mission_proof",
  "content_type": "image/jpeg",
  "file_name": "proof.jpg",
  "size_bytes": 345678,
  "sha256": "optional_hash"
}
```

Response **200**:
```json
{
  "upload_id": "upl_1",
  "method": "PUT",
  "upload_url": "https://s3-presigned-url",
  "file_key": "proof/usr_123/upl_1.jpg",
  "expires_at": "2026-04-27T15:00:00Z"
}
```

Notes:
- Enforce max size (e.g. 10MB) and allowed content types.
- Store an `uploads` row in Postgres to bind `upload_id` ↔ user ↔ file_key.

---

### 2) Confirm upload (optional)
**POST** `/v1/uploads/confirm`

Request:
```json
{ "upload_id": "upl_1" }
```

Response **200**:
```json
{ "ok": true, "file_key": "proof/usr_123/upl_1.jpg" }
```

---

### 3) Submit mission completion
**POST** `/v1/missions/{missionId}/submissions`

Request:
```json
{
  "file_key": "proof/usr_123/upl_1.jpg",
  "geo": {
    "lat": 12.971612,
    "lng": 77.594635,
    "accuracy_m": 18,
    "captured_at": "2026-04-27T14:59:40Z"
  },
  "device": {
    "platform": "web",
    "user_agent": "optional"
  },
  "notes": "optional"
}
```

Success **201**:
```json
{
  "submission": {
    "id": "sub_99",
    "mission_id": "msn_1",
    "status": "accepted",
    "geo_validation": { "result": "pass", "distance_m": 42, "rule": "radius_meters" },
    "file": { "file_key": "proof/usr_123/upl_1.jpg" },
    "created_at": "2026-04-27T15:00:00Z"
  },
  "progress_update": { "mission_status": "completed", "level_status": "in_progress" }
}
```

Rejected **201** (or **422** if you prefer):
```json
{
  "submission": {
    "id": "sub_100",
    "mission_id": "msn_1",
    "status": "rejected",
    "rejection_reason": "OUTSIDE_GEOFENCE",
    "geo_validation": { "result": "fail", "distance_m": 320, "max_allowed_m": 100 }
  }
}
```

---

### 4) List my submissions for a mission
**GET** `/v1/missions/{missionId}/submissions?me=true`

Response **200**:
```json
{
  "items": [
    { "id": "sub_99", "status": "accepted", "created_at": "2026-04-27T15:00:00Z" }
  ]
}
```

---

## Optional: Explicit level completion
If you compute level completion automatically from missions, skip this.

**POST** `/v1/levels/{levelId}/complete`

Request:
```json
{ "journey_id": "jrn_1" }
```

Response **200**:
```json
{ "level_id": "lvl_1", "status": "completed", "completed_at": "2026-04-27T15:00:00Z" }
```

---

## Geo validation rules (recommended)

### Required fields (from client)
- `geo.lat`, `geo.lng` (float)
- `geo.accuracy_m` (number)
- `geo.captured_at` (ISO timestamp)

### Recommended validations
- **Accuracy threshold**: reject if `accuracy_m > mission.min_accuracy_m` (e.g. 50m).
- **Freshness/time window**: reject if `captured_at` older than e.g. 10 minutes.
- **Distance**: compute haversine distance between submission point and target point.
- **Anti-spoof** (optional):
  - track impossible travel speeds between submissions
  - compare EXIF GPS (if available) with submitted GPS (do not rely solely)

---

## Backend build prompt (copy/paste)

Use this prompt to generate the backend services (for a dev team or an AI coding assistant).

### Prompt

Build backend services for **CityQuest** with the following requirements:

**Tech stack**
- Runtime: Node.js 20+ (TypeScript)
- Framework: Express.js (required)
- Auth sessions/tokens: JWT access token + refresh token (recommended) or session cookies (acceptable)
- DB: Postgres 15+
- ORM: Prisma (preferred) or Drizzle/TypeORM (acceptable)
- Auth: Google OAuth 2.0 (backend-only) + email/password
- Password hashing: argon2id
- Storage: AWS S3 for mission proof images (presigned PUT uploads)
- Validation: Zod (preferred) or express-validator (acceptable)
- Migrations: required (Prisma migrate or SQL migration tool)
- Seeding: required (seed scripts to create sample journeys/levels/missions + a test user)
- Observability: request logging + structured logs, basic health endpoint
- API docs: OpenAPI/Swagger JSON (required)

**Deliverables**
- Two services:
  1) Auth Service implementing:
     - POST /v1/auth/register
     - POST /v1/auth/login
     - GET /v1/auth/google/start
     - GET /v1/auth/google/callback
     - POST /v1/auth/token (exchange backend one-time code + redirect_uri)
     - GET /v1/me
  2) Game/Data Service implementing:
     - GET /v1/journeys
     - GET /v1/journeys/:journeyId
     - GET /v1/levels/:levelId
     - GET /v1/missions/:missionId
     - GET /v1/me/progress?journey_id=
     - GET /v1/me/levels/:levelId/progress
     - POST /v1/uploads/request (S3 presign)
     - POST /v1/uploads/confirm (optional)
     - POST /v1/missions/:missionId/submissions (geo+image validation)
     - GET /v1/missions/:missionId/submissions?me=true
     - POST /v1/levels/:levelId/complete (optional)

**Security**
- Enforce rate limits on login/register/token endpoints.
- Validate Google `state` and maintain CSRF protection.
- One-time exchange codes: short TTL (60–120s), single-use.
- Ensure `file_key` submitted belongs to the authenticated user.
- Use parameterized queries/ORM everywhere.

**Response standards**
- Use consistent error shape:
  - `{ error: { code, message, details } }`
- Use ISO timestamps and opaque IDs.

**Testing**
- Unit tests for validation + geo distance calculation.
- Integration tests for auth login + register + token exchange.
- Minimal contract tests for the endpoints in this document.

**Provide**
- DB schema (Prisma) for users, oauth_accounts, journeys, levels, missions, submissions, uploads, progress.
- **Migration scripts**:
  - `npm run migrate` (apply)
  - `npm run migrate:status` (status)
  - `npm run migrate:reset` (dev-only reset)
- **Seed scripts**:
  - `npm run seed` creates:
    - at least 1 journey → levels → missions (including 1 `photo+geo` mission)
    - a demo user (email/password) for local testing
- **Local dev**:
  - `docker compose` for Postgres (and optionally LocalStack/minio for S3)
  - `.env.example` for each service
- Ensure the API is reachable at `http://localhost:5000` during local frontend development (or set `NEXT_PUBLIC_API_BASE_URL` accordingly).
- README with env vars and local run commands for both services.
- A short section describing deployment (prod env vars, DB migration runbook).

