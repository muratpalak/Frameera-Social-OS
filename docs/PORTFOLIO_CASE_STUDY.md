# Frameera Social OS — Portfolio Case Study

**Repository:** https://github.com/muratpalak/Frameera-Social-OS  
**Status:** Local demonstration / portfolio project  
**Technical focus:** React · TypeScript · FastAPI · SQLite  
**Automated workflow:** [GitHub Actions](https://github.com/muratpalak/Frameera-Social-OS/actions/workflows/tests.yml)

## Context and problem

This project explores **full-stack product development and api integration** through a reproducible portfolio exercise. Its examples are not represented as an employer deployment or production customer implementation.

## Implemented capabilities

- CRUD REST API with SQLite persistence
- React/TypeScript dashboards and drag-and-drop planning
- CSV reporting with manually entered metrics
- Multilingual user interface and automated backend/build checks

## Reproducible review

Read the repository [README](../README.md) for supported platforms and installation prerequisites. Where the necessary runtime tools are installed, reproduce the checks using:

```bash
(cd backend && python3 -m pip install -r requirements.txt pytest httpx && python3 -m pytest -q tests) && (cd frontend && npm install && npm run build)
```

The associated CI workflow provides evidence of the configured automated checks; it is **not** a guarantee of full feature coverage, security accreditation or production availability.

## Boundaries and honest limitations

Local MVP, not a production SaaS: no social API OAuth/publishing and no production authentication or isolation.

## Relevance to IT roles

Transferable software engineering, API troubleshooting and structured data workflows.

## Deutsche Kurzfassung

**Projekt:** Lokal betriebenes Multi-Client-System für Content-Planung, Medienbibliothek und manuelles Reporting.  
**Schwerpunkt:** Full-stack product development and API integration.  
**Nachweis:** Quellcode, Installationsanleitung, definierte Tests und GitHub-Actions-Protokolle.  
**Einordnung:** Portfolio-/Demonstrationsprojekt; keine Behauptung eines Produktiveinsatzes.
