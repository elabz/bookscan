# AllMyBooks - Production Deployment Guide

## Architecture Overview

AllMyBooks consists of four services orchestrated via Docker Compose:

| Service | Image/Build | Port | Purpose |
|---------|-------------|------|---------|
| **frontend** | Vite + React (built to static files) | 8100 (dev) / 80 (prod via nginx) | SPA with Shadcn/ui |
| **backend** | Express.js + TypeScript | 4001 | REST API, auth, image processing |
| **postgres** | `pgvector/pgvector:pg15` | 5432 | Primary database with vector search |
| **supertokens** | `supertokens/supertokens-postgresql` | 3567 | Authentication (email/password + OAuth) |

External dependencies:
- **Bunny.net CDN** for book cover images and frontend static assets
- **OpenLibrary API** for ISBN lookups
- **Elasticsearch** for hybrid text + vector search (gracefully degrades)
- **Google OAuth** for social login
- **LiteLLM proxy** for AI embeddings

### CDN Asset Delivery

Frontend JS/CSS/WASM assets are served from Bunny.net CDN rather than from the home server. This offloads 40MB+ of static files (including OpenCV and ONNX Runtime WASM) to edge nodes globally. The nginx container only serves `index.html` for SPA routing — all other assets load from CDN.

### CI/CD Pipeline

```
GitHub (cloud)          Home Server (behind NAT)
┌──────────────┐        ┌─────────────────────────┐
│  Push to     │        │  Self-hosted GH Runner   │
│  main branch │───────>│  (polls GitHub outbound) │
│              │        │                          │
│  PR opened   │───────>│  Docker, git, node       │
└──────────────┘        └──────┬──────────────────┘
                               │
                        ┌──────▼──────────────────┐
                        │  Docker Compose          │
                        │  (frontend, backend,     │
                        │   postgres, supertokens) │
                        └──────┬──────────────────┘
                               │ reverse SSH tunnel
                        ┌──────▼──────────────────┐
                        │  External Proxy (VPS)    │
                        │  nginx: allmybooks.com    │
                        └─────────────────────────┘
```

---

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- A server with at least **2 GB RAM**
- A domain name with DNS configured
- SSL certificate (use Let's Encrypt / Certbot, or a reverse proxy like Caddy/Traefik)
- Bunny.net storage zone with account API key

---

## 1. Environment Configuration

All environment variables live in a single `.env` file at the repo root. Docker Compose reads it automatically.

```bash
cp .env.example .env
nano .env
```

See `.env.example` for all available variables. Key sections:
- **App**: `NODE_ENV`, `PORT`, `FRONTEND_URL`, `API_URL`
- **Database**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- **Auth**: SuperTokens + OAuth credentials
- **CDN**: Bunny.net storage zone + account API keys, `CDN_ASSETS_PATH` for frontend assets subfolder
- **Search/AI**: Elasticsearch URL, LiteLLM credentials
- **Frontend build-time**: `VITE_API_URL`, `VITE_CDN_BASE`

Generate strong passwords:
```bash
openssl rand -base64 32  # for POSTGRES_PASSWORD
openssl rand -hex 32     # for SUPERTOKENS_API_KEY
```

---

## 2. Production Dockerfiles

- **Backend**: `server/Dockerfile` — multi-stage build (node:18-alpine, vips for sharp, tsc compile, production runtime)
- **Frontend**: `library-scanster/Dockerfile` — multi-stage build with `VITE_API_URL` and `VITE_CDN_BASE` as build args, then nginx:alpine for serving
- **Frontend nginx**: `library-scanster/nginx.conf` — SPA routing only, no API proxy

---

## 3. CDN Asset Deployment

Frontend assets are uploaded to Bunny.net CDN after each build. The script handles upload, cache purge, and cleanup of orphaned files.

```bash
# Build frontend with CDN base URL
cd library-scanster
VITE_CDN_BASE=https://cdn.allmybooks.com/app/ npm run build

# Deploy assets to CDN
cd ..
./scripts/cdn-deploy.sh library-scanster/dist/assets
```

CDN folder structure:
```
allmybooks/                    (storage zone)
├── covers/                   (book covers)
├── user-covers/              (user photos)
├── avatars/                  (profile pics)
└── app/                      (frontend assets)
    └── assets/
        ├── index-Bt3-eBHU.js
        ├── index-CwNcM93g.css
        └── ...
```

Vite produces content-hashed filenames, so each deploy creates new files. Old files are cleaned up automatically by the deploy script.

---

## 4. Database Migrations

After the first deploy, run all migrations in order:

```bash
for f in library-scanster/src/db/migrations/*.sql; do
  echo "Running migration: $f"
  docker exec -i bookscan-postgres psql -U bookuser -d bookscan < "$f"
done
```

SuperTokens automatically creates its own tables in the `auth` database on first startup.

---

## 5. External Proxy Configuration

The external proxy (nginx/Caddy/Traefik) routes traffic to two containers:

```
Client (HTTPS :443)
  |-- /api/*   -->  backend:4001  (strip /api prefix, forward to /)
  |-- /auth/*  -->  backend:4001  (forward as-is, keep /auth path)
  |-- /*       -->  frontend:8100 (serves index.html only; assets load from CDN)
```

---

## 6. CI/CD Setup

### GitHub Actions Self-Hosted Runner (one-time)

```bash
# On home server:
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
tar xzf actions-runner.tar.gz
./config.sh --url https://github.com/elabz/bookscan --token <RUNNER_TOKEN>
sudo ./svc.sh install
sudo ./svc.sh start
```

### GitHub Secrets

Store the entire `.env` file contents as a single GitHub Secret named `ENV_FILE`.

### Workflows

- **`.github/workflows/ci.yml`** — runs on PRs to `main`: installs deps, runs server tests, lints frontend
- **`.github/workflows/deploy.yml`** — runs on push to `main`: tests, builds frontend, deploys assets to CDN, rebuilds Docker containers, runs migrations

### Pre-commit Hook

```bash
git config core.hooksPath .githooks
```

Runs eslint on `library-scanster/` and `tsc --noEmit` on `server/` based on which files are staged.

---

## 7. Manual Deployment

```bash
# 1. Create .env with production values
cp .env.example .env
nano .env

# 2. Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# 3. Run database migrations
for f in library-scanster/src/db/migrations/*.sql; do
  docker exec -i bookscan-postgres psql -U bookuser -d bookscan < "$f"
done

# 4. Build and deploy frontend assets to CDN
cd library-scanster && npm ci && VITE_CDN_BASE=https://cdn.allmybooks.com/app/ npm run build && cd ..
./scripts/cdn-deploy.sh library-scanster/dist/assets

# 5. Reindex Elasticsearch
docker exec bookscan-backend npx ts-node scripts/reindex.ts

# 6. Verify
docker compose -f docker-compose.prod.yml ps
```

---

## 8. Backups

### Database backup

```bash
docker exec bookscan-postgres pg_dump -U bookuser bookscan > backup_$(date +%Y%m%d).sql
```

### Automated daily backups (cron)

```bash
# Add to crontab: crontab -e
0 3 * * * docker exec bookscan-postgres pg_dump -U bookuser bookscan | gzip > /backups/bookscan_$(date +\%Y\%m\%d).sql.gz
```

---

## 9. Elasticsearch Reindex

```bash
docker exec bookscan-backend npx ts-node scripts/reindex.ts
```

---

## 10. Monitoring & Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml restart backend
```

---

## 11. Updating

Automated via CI/CD on push to `main`. For manual updates:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Security Checklist

- [ ] Change default `POSTGRES_PASSWORD` to a strong random value
- [ ] Set a real `SUPERTOKENS_API_KEY`
- [ ] Configure Google OAuth redirect URIs for your production domain
- [ ] Ensure `.env` file is not committed to git (check `.gitignore`)
- [ ] PostgreSQL port (5432) is not exposed to the internet
- [ ] SuperTokens port (3567) is not exposed to the internet
- [ ] Enable SSL/TLS via reverse proxy
- [ ] Set up automated database backups
- [ ] Store `ENV_FILE` secret in GitHub repo settings
