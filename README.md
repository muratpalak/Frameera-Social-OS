# ✦ Frameera Social OS

**A glass-styled, local-first multi-client social media workspace** built with React, TypeScript, FastAPI and SQLite.

> **v1.0 — Functional local MVP.** Scheduling is editorial (a planning calendar), not automatic publishing. Live analytics, OAuth account linking, and platform APIs are **not** implemented. The starter database contains clearly labeled demo metrics and demo posts.

## Highlights

- Manage unlimited clients with separate brand profiles and account handles.
- Plan Instagram, TikTok, YouTube and LinkedIn posts, Reels, stories, videos and carousels.
- Drag-and-drop weekly calendar: drop a scheduled item onto a new day, or back to the draft pool.
- Create/edit/delete content; manually mark content as published.
- Upload client-specific photo and video assets (JPG, PNG, WEBP, GIF, MP4, MOV, WEBM; 100 MB max).
- View animated engagement, reach, and impression graphs with per-client filtering.
- Enter manual daily metrics per client/platform, replacing that date's sample data with real values.
- Export customer-filtered performance reports as Excel-compatible CSV, with demo/manual source labels.
- Offline, template-based caption suggestions in Turkish, German and English, with three stylistic options.
- Full Turkish, German, English UI. Dark/light theme, both persistent in the browser.
- SQLite persistence, REST API, API docs and test suite.

## Requirements

- **Node.js >=20**, npm
- **Python >=3.10** with pip and venv
- Internet access on first run to install standard package dependencies

## macOS (one click)

1. Unzip `Frameera-Social-OS.zip`.
2. Double-click **`START-MAC.command`**. macOS may ask you to authorize an unfamiliar downloaded script. You can alternatively run `bash START-MAC.command` from Terminal.
3. Once both local servers are ready, the browser opens **http://127.0.0.1:5173**.
4. Leave the Terminal window open while using it; press `Control+C` to close.

If macOS blocks the `.command` file, open Terminal in the extracted folder and run `chmod +x START-MAC.command && ./START-MAC.command`.

## Windows

Run **`START-WINDOWS.bat`** (Python and Node.js must be installed), then open http://127.0.0.1:5173.

## Manual development

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

- App: http://127.0.0.1:5173
- API docs: http://127.0.0.1:8000/docs
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

## Docker (optional)

```bash
docker compose up --build
```

Visit http://127.0.0.1:5173. The SQLite database and uploads persist in the `social_data` named volume.

## Publish to GitHub

Create an **empty** `Frameera-Social-OS` repository in your own GitHub account, then on macOS run `bash GITHUB-YUKLE.command` from the extracted project root. This prompts for the repository address and pushes the source only after you run the script. Nothing is uploaded automatically.

## Tests

```bash
cd backend
pip install pytest httpx
pytest -q
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Project structure

```text
Frameera-Social-OS/
├── START-MAC.command
├── START-WINDOWS.bat
├── docker-compose.yml
├── frontend/
│   ├── src/App.tsx         # complete React UI
│   ├── src/styles.css      # dark/light glass design
│   ├── src/i18n.ts         # TR/DE/EN translations
│   ├── src/api.ts          # typed HTTP API client
│   └── src/types.ts
├── backend/
│   ├── main.py             # FastAPI endpoints
│   ├── models.py           # SQLite ORM tables
│   ├── schemas.py          # validated payloads
│   ├── caption_engine.py   # offline caption writer
│   ├── seed.py             # first-run sample data
│   └── tests/
└── docs/
    └── ARCHITECTURE.md
```

## Data and privacy

Local database location: `backend/data/socialos.sqlite3`; media: `backend/data/uploads/`. They are deliberately excluded from Git using `.gitignore`.

**Important:** This local MVP does **not** have user authentication, tenant isolation, access controls, rate limits, audit logs, OAuth integrations, automatic publishing, or API-based metric sync. Do **not** expose it to the public internet or treat it as a ready-to-sell multi-tenant SaaS application. The API listens on 127.0.0.1 on Mac/Windows. Add authentication and security hardening before any shared/server deployment.

The UI's demo sample statistics are **fabricated demo data**. The dashboard calculates its displayed period-on-period changes from stored entries rather than inventing the percentages. Manual entries are labeled separately.

## Future roadmap

OAuth + platform API integration; approval workflow; time-zone-aware queued publishing; account-level analytics sync; AI caption provider integrations with user-supplied credentials; campaign tagging; multi-user RBAC; PostgreSQL and storage abstraction; notifications.

## License

MIT · Frameera Studio · 2026
