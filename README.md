# Остео Ангио Скан

MVP medical web application for screening patients with type 2 diabetes for elevated skeletal and vascular complication risk. The implementation is a modular monolith: FastAPI backend, React/Vite frontend, PostgreSQL, Alembic migrations, and Docker Compose for local development.

The risk algorithm is intentionally transparent, configurable, and marked as an unvalidated MVP placeholder. It must be clinically reviewed and approved before real medical use.

## MVP Architecture

- Frontend: React, TypeScript, Vite, React Hook Form, Zod, TanStack Query, Tailwind CSS, Recharts.
- Localization: react-i18next with Russian, Kazakh, and English resources. Russian is the default language.
- Backend: FastAPI, Pydantic, SQLAlchemy, Alembic.
- Database: PostgreSQL.
- PDF: Jinja2 HTML template rendered with WeasyPrint.
- Auth: JWT access/refresh tokens and bcrypt password hashing.
- Deployment: **Cloudflare Pages** (frontend) + **Railway** (backend) + **Supabase** (Postgres). See [deploy/DEPLOY.md](deploy/DEPLOY.md). Local dev uses Docker Compose.

Backend module boundaries:

- `api`: HTTP routes and dependencies.
- `schemas`: Pydantic DTOs and validation.
- `domain`: shared enums and domain primitives.
- `services`: application orchestration.
- `repositories`: persistence access.
- `db`: SQLAlchemy models/session.
- `risk_engine`: configurable placeholder rule engine.
- `templates/pdf`: printable protocol template.

## Folder Structure

```text
backend/
  alembic/
  app/
    api/v1/
    core/
    db/
    domain/
    repositories/
    risk_engine/
    schemas/
    services/
    templates/pdf/
  tests/
frontend/
  src/
    api/
    components/
    pages/
    schemas/
    styles/
    types/
deploy/nginx/
```

## Database Schema

- `users`: clinicians/operators, role, password hash, active flag.
- `patients`: patient identity/profile fields and registrar metadata.
- `screenings`: clinical inputs, calculated total/vascular/skeletal scores, category, recommendations, algorithm version/disclaimer.
- `audit_logs`: actor, action, entity type/id, timestamp, and sanitized metadata only.

Roles:

- `admin`: user management plus clinical workflow access.
- `doctor`: clinical workflow access.
- `nurse_registrar`: patient and screening workflow access.

## API Surface

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/me/preferences`
- `GET|POST /api/v1/users`
- `PATCH /api/v1/users/{user_id}`
- `GET|POST /api/v1/patients`
- `GET|PATCH /api/v1/patients/{patient_id}`
- `GET /api/v1/patients/{patient_id}/screenings`
- `POST /api/v1/screenings/patients/{patient_id}`
- `GET /api/v1/screenings/{screening_id}`
- `POST /api/v1/risk/calculate`
- `GET /api/v1/pdf/screenings/{screening_id}`

## Local Setup

```bash
docker compose up --build
```

Run migrations and create the seed admin:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.db.seed
```

Open:

- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs
- Default seed user: `admin@example.com` / `ChangeMe123!`

Optional Nginx proxy:

```bash
docker compose --profile proxy up --build
```

Proxy URL: http://localhost:8080

## Production (Cloudflare + Railway + Supabase)

Step-by-step guide: **[deploy/DEPLOY.md](deploy/DEPLOY.md)**

Quick map:

| Layer | Platform | What you set |
|-------|----------|----------------|
| Frontend | Cloudflare Pages | Root `frontend`, build `npm run build`, `VITE_API_BASE_URL=https://<railway>/api/v1` |
| Backend | Railway | Root `backend`, Dockerfile, env from `.env.railway.example` |
| Database | Supabase | `DATABASE_URL` in Railway (Session pooler URI) |

## Tests

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

## Clinical Safety Notes

- The shipped risk rules live in `backend/app/risk_engine/rules.json`.
- Frontend translation files live in `frontend/src/i18n/locales`.
- Backend PDF/recommendation translation files live in `backend/app/i18n/locales`.
- The rules are a placeholder for MVP workflow testing only.
- Recommendations are generic workflow suggestions and do not represent validated clinical guidance.
- Audit logs intentionally store only action metadata such as changed field names, risk category, algorithm version, and screening id. Patient names, MRNs, lab values, and other sensitive values are not written to audit metadata.
