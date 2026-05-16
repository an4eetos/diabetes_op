# Deploy: Cloudflare Pages + Railway + Supabase

```
Browser → Cloudflare Pages (React static)
              ↓ HTTPS API calls
         Railway (FastAPI)
              ↓
         Supabase (PostgreSQL)
```

## 1. Supabase (database)

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string → URI** (not the JS client key).
3. Prefer **Session pooler** (port `5432`) for the app. For Alembic on first deploy, the direct host (`db.<ref>.supabase.co:5432`) also works if the pooler gives migration issues.
4. Append SSL if missing: `?sslmode=require`
5. Copy the URI — Railway accepts `postgresql://...`; the backend rewrites it to `postgresql+psycopg://` automatically.

**Do not** enable Row Level Security on app tables unless you add matching policies (the app uses a direct Postgres connection).

### Optional: run migrations from your laptop

```bash
cd backend
export DATABASE_URL="postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres?sslmode=require"
pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed
```

---

## 2. Railway (backend)

1. Push this repo to GitHub.
2. [railway.app](https://railway.app) → **New Project → Deploy from GitHub** → select the repo.
3. **Service settings:**
   - **Root Directory:** `backend`
   - **Builder:** Dockerfile (uses `backend/Dockerfile` + `railway.toml`)
4. **Variables** (copy from `.env.railway.example`):

   | Variable | Value |
   |----------|--------|
   | `ENVIRONMENT` | `production` |
   | `DATABASE_URL` | Supabase URI (Session pooler or direct) |
   | `JWT_SECRET_KEY` | `openssl rand -hex 32` |
   | `CORS_ORIGINS` | `["https://<your-pages>.pages.dev"]` — add custom domain later |
   | `RUN_SEED_ON_START` | `true` on first deploy, then `false` |

5. **Deploy.** The entrypoint runs `alembic upgrade head` then starts Uvicorn on Railway’s `PORT`.
6. **Settings → Networking → Generate Domain** → note URL, e.g. `https://medical-api-production.up.railway.app`
7. Verify: `curl https://<railway-domain>/health` → `{"status":"ok"}`

**Seed admin (first deploy with `RUN_SEED_ON_START=true`):** `admin@example.com` / `ChangeMe123!` — change immediately.

---

## 3. Cloudflare Pages (frontend)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Select the repo.

   | Setting | Value |
   |---------|--------|
   | **Production branch** | `main` |
   | **Root directory** | `frontend` |
   | **Build command** | `npm run build` |
   | **Build output directory** | `dist` |

3. **Environment variables** (Production + Preview):

   | Variable | Value |
   |----------|--------|
   | `VITE_API_BASE_URL` | `https://<railway-domain>/api/v1` |
   | `VITE_USE_MOCK_API` | `false` |

4. Deploy. Default URL: `https://<project>.pages.dev`
5. Update Railway `CORS_ORIGINS` to include that exact URL (and your custom domain when added).
6. Redeploy Railway after changing CORS (env change triggers restart).

### Custom domain (optional)

- **Pages:** Custom domains → add `app.yourdomain.com`
- **Railway:** optional API subdomain `api.yourdomain.com`
- Update `VITE_API_BASE_URL` and `CORS_ORIGINS` to match.

### SPA routing

- **Cloudflare Pages:** If you do **not** add a top-level `404.html`, Pages treats the site as an SPA and serves `index.html` for unknown paths (see [Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)). Do **not** use `/* /index.html 200` in `_redirects` — uploads that include it can fail on Workers-backed deploys with *Infinite loop* / code `10021`.
- **Cloudflare Workers** (`wrangler deploy`): use `frontend/wrangler.toml` and `assets.not_found_handling = "single-page-application"` (already set in this repo). Run `npx wrangler deploy` from `frontend/` after `npm run build`.

---

## 4. Checklist

- [ ] Supabase project created; `DATABASE_URL` in Railway
- [ ] Railway `/health` returns OK
- [ ] `RUN_SEED_ON_START=true` once, then `false`
- [ ] Cloudflare build has correct `VITE_API_BASE_URL`
- [ ] `CORS_ORIGINS` lists every frontend origin (Pages + custom domain)
- [ ] Admin password changed after first login
- [ ] HTTPS only in production

---

## 5. Local dev (unchanged)

```bash
docker compose up --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.db.seed
```

Use local Postgres in Compose; Supabase is only for deployed environments.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error in browser | Add exact frontend URL to `CORS_ORIGINS` on Railway |
| `network_failed` on login | Wrong `VITE_API_BASE_URL`, CORS blocked, or API down — rebuild Pages after fixing env |
| `Request failed (HTTP 404)` | `VITE_API_BASE_URL` must end with `/api/v1` (e.g. `https://<railway>/api/v1`), not the bare Railway host |
| `Request failed (HTTP 502)` | Railway backend crashed — check deploy logs (DB URL, migrations, enum errors) |
| Wrong password but generic error | Use seeded credentials or check email matches DB (`sysadmin@example.com` if you changed seed) |
| `Database not ready` forever | Stack uses **psycopg3**; `postgresql://` URLs are rewritten to `postgresql+psycopg://` in app code—same logic is now used in the startup wait. Confirm **`sslmode=require`** (not `sslmode=requir`). Deploy logs show the real DB error. |
| DB connection timeout | Use Supabase pooler URI; check `?sslmode=require` |
| Migrations fail on pooler | Switch `DATABASE_URL` to **direct** host for one deploy, then back to pooler |
| 502 on Railway | Check deploy logs; WeasyPrint needs the Docker image (not bare Python without system libs) |
