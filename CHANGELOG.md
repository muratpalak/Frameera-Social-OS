# Changelog

## v1.1 — October 20, 2026

- Added customer-filtered analytics CSV export (7–365 days), with Excel-friendly UTF-8 and demo/manual source labels.
- Added spreadsheet-formula protection for user-provided customer names in CSV.
- Added integration tests for report download, client filters, source provenance and validation.
- Verified all six FastAPI backend tests pass; TypeScript/TSX files parse without syntax diagnostics.
- Frontend production build could not be verified in the build sandbox because npm packages were not downloadable; `npm install` on a network-enabled Mac or Windows machine is required.

## v1.0 — October 20, 2026

Initial local-first MVP with clients, content, calendar drag-and-drop, media library, analytics, offline caption templates and TR/DE/EN interface.
