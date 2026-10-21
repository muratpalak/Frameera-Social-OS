# Architecture & Integration Boundaries

## Stack

- Vite + React 18 + TypeScript frontend, CSS custom glass theming, Recharts animated charts, Lucide icons.
- FastAPI REST backend, Pydantic validation and SQLAlchemy 2.0 ORM.
- SQLite database and local disk media uploads; both persisted outside source-tracked directories.
- The frontend uses same-origin `/api/*` and `/media/*` routes proxied by Vite; no credentials required for local MVP.

## Domain model

| Table | Purpose |
| --- | --- |
| clients | Brand workspace, industry, color, social handles |
| posts | Content metadata, platform, caption, schedule, state, optional asset reference |
| assets | Media file metadata and client ownership |
| metrics | Per-day, per-client, per-platform impressions/reach/engagement/views/follower gain; `is_demo` marker |

## Data flows

**New post:** React form -> POST `/api/posts` -> Pydantic validates platform/status/date/asset ownership -> SQLAlchemy saves to SQLite -> UI refreshes. Scheduled posts without dates are rejected.

**Calendar move:** Native HTML5 drag event -> PATCH `/api/posts/{id}` with scheduled date and status -> persisted to SQLite -> refresh. Draft drop sets `status=draft` and clears date. Time within a moved post is preserved.

**Media upload:** Multipart POST `/api/assets` -> allowed MIME/extension check, 100 MB stream limit, random stored filename -> DB reference -> `/media/<uuid>.<ext>` preview. Clients and posts contain no raw file bytes.

**Analytics:** GET `/api/analytics?days=30&client_id=...` performs a time-window aggregation. Data source counts show demo vs manual rows. POST `/api/metrics` upserts a day/platform/customer combination and marks it manual. Backend does not call platform APIs.

**Caption generator:** POST `/api/captions/generate` invokes a deterministic multilingual template engine. No external services or keys. Later AI provider integration should be opt-in, with authorization and quota controls.

## Security to add before public deployment

1. Server-side users, passwordless/OAuth authentication, secure sessions, CSRF protection if using cookies.
2. Role-based access and enforced tenant/client authorization for every query, not merely UI filtering.
3. Media validation using file signatures/scan, virus scanning, storage access policies, strict size/quantity limits.
4. API rate limits, upload quotas, backup and retention, audit logs, S3-compatible protected storage.
5. Public server reverse proxy with TLS, secrets management, CORS restrictions, monitoring.
6. Production database migrations (Alembic), Postgres, concurrency-safe jobs and deterministic seed policies.
7. OAuth and platform account permission scopes, token refresh and encryption, posting-policy checks, retry and queue infrastructure.

## Social network API roadmap

Do not implement automatic posting by scraping unofficial sites. Instead, register developer applications and follow Meta/Instagram, TikTok, YouTube, and LinkedIn policies, required permissions, content format and rate limits. Capabilities differ by account type and approval, so launch per-platform only after explicit API approval and tests. Publish status should be reconciled using platform-assigned post IDs and errors.
