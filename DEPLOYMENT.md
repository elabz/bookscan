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
- **Bunny.net CDN** for book cover images
- **OpenLibrary API** for ISBN lookups
- **Elasticsearch** for hybrid text + vector search (gracefully degrades)
- **Google OAuth** for social login
- **LiteLLM proxy** for AI embeddings

---

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- A server with at least **2 GB RAM**
- A domain name with DNS configured
- SSL certificate (use Let's Encrypt / Certbot, or a reverse proxy like Caddy/Traefik)

---

## 1. Production Dockerfiles

Production Dockerfiles are already in the repo:

- **Backend**: `server/Dockerfile` — multi-stage build (node:18-alpine, vips for sharp, tsc compile, production runtime)
- **Frontend**: `library-scanster/Dockerfile` — multi-stage build (node:18-alpine, vite build, nginx:alpine for serving)
- **Frontend nginx**: `library-scanster/nginx.conf` — static SPA serving only, no API proxy (external proxy handles routing)

---

## 2. Production Docker Compose

The production compose file is `docker-compose.prod.yml` in the repo root.

Key differences from dev compose:
- No source code volume mounts (code is baked into images)
- No dev-only ports exposed (postgres, supertokens are internal only)
- `restart: unless-stopped` on all services
- Frontend on port 8100 (internal 80), backend on port 4001 — external proxy targets these
- `NODE_ENV=production`

---

## 3. Environment Variables

Create `.env` on the production server:

```bash
# Domain
FRONTEND_URL=https://allmybooks.com
API_URL=https://allmybooks.com

# Database
POSTGRES_USER=bookuser
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=bookscan

# SuperTokens
SUPERTOKENS_API_KEY=<generate-strong-key>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Bunny.net CDN
CDN_STORAGE_ZONE_NAME=allmybooks
CDN_REGION=ny
CDN_PATH=covers
CDN_URL=cdn.allmybooks.com
CDN_API_KEY=<your-bunny-api-key>

# AI Embeddings (LiteLLM)
LITELLM_API_KEY=<your-litellm-key>
EMBEDDINGS_URL=<your-embeddings-endpoint>
EMBEDDINGS_MODEL=<your-embedding-model>
```

Generate strong passwords:
```bash
openssl rand -base64 32  # for POSTGRES_PASSWORD
openssl rand -hex 32     # for SUPERTOKENS_API_KEY
```

---

## 4. Frontend Environment

The frontend reads environment at **build time** via Vite. Create `library-scanster/.env.production`:

```bash
VITE_API_URL=https://allmybooks.com/api
```

Any `VITE_*` variables are embedded into the built JS bundle during `npm run build`.

---

## 5. Database Migrations

After the first deploy, run all migrations in order:

```bash
# Connect to the running postgres container
for f in library-scanster/src/db/migrations/*.sql; do
  echo "Running migration: $f"
  docker exec -i bookscan-postgres psql -U bookuser -d bookscan < "$f"
done
```

Migration files (run in order):
1. `001_initial_schema.sql` - Core books and user_books tables
2. `002_isbn_handling.sql` - ISBN normalization
3. `003_openlibrary_fields.sql` - Extended book metadata fields
4. `004_cover_variants_dimensions.sql` - Cover image variants, dimensions
5. `005_profile_locations_collections_images.sql` - User profiles, locations, collections
6. `006_user_book_cover_overrides.sql` - Per-user cover overrides
7. `008_user_book_overrides.sql` - Per-user book field overrides
8. `010_contact_messages.sql` - Contact form storage
9. `011_book_dimensions_price.sql` - Physical dimensions, weight, price fields
10. `012_pending_subjects.sql` - Pending subject suggestions
11. `013_pending_book_edits.sql` - Pending book edit proposals
12. `014_add_is_admin.sql` - Admin flag on users table

SuperTokens automatically creates its own tables in the `auth` database on first startup.

---

## 6. External Proxy Configuration

The external proxy (nginx/Caddy/Traefik) routes traffic to two containers:

```
Client (HTTPS :443)
  |-- /api/*   -->  backend:4001  (strip /api prefix, forward to /)
  |-- /auth/*  -->  backend:4001  (forward as-is, keep /auth path)
  |-- /*       -->  frontend:8100 (static SPA files)
```

**Nginx example** (for the external proxy):
```nginx
server {
    listen 443 ssl;
    server_name allmybooks.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # API requests -> backend (strip /api prefix)
    location /api/ {
        proxy_pass http://127.0.0.1:4001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth requests -> backend (keep /auth path)
    location /auth/ {
        proxy_pass http://127.0.0.1:4001/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Everything else -> frontend SPA
    location / {
        proxy_pass http://127.0.0.1:8100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 7. Elasticsearch Reindex

Recreate the ES index and re-embed all books:

```bash
# Default: recreate index + regenerate all embeddings
docker exec allmybooks-backend npx ts-node scripts/reindex.ts

# Only recreate the index (no re-embedding)
docker exec allmybooks-backend npx ts-node scripts/reindex.ts --recreate-index

# Only regenerate embeddings (no index recreation)
docker exec allmybooks-backend npx ts-node scripts/reindex.ts --reembed
```

---

## 8. Deployment Steps

```bash
# 1. Clone the repository
git clone <repo-url> allmybooks
cd allmybooks

# 2. Create .env with production values (see Section 3)
cp .env.example .env
nano .env

# 3. Create frontend production env
echo 'VITE_API_URL=https://allmybooks.com/api' > library-scanster/.env.production

# 4. Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# 5. Run database migrations
for f in library-scanster/src/db/migrations/*.sql; do
  docker exec -i bookscan-postgres psql -U bookuser -d bookscan < "$f"
done

# 6. Reindex Elasticsearch
docker exec allmybooks-backend npx ts-node scripts/reindex.ts

# 7. Verify services are running
docker compose -f docker-compose.prod.yml ps
```

---

## 9. Backups

### Database backup

```bash
# Create backup
docker exec bookscan-postgres pg_dump -U bookuser bookscan > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i bookscan-postgres psql -U bookuser -d bookscan < backup_20250101.sql
```

### Automated daily backups (cron)

```bash
# Add to crontab: crontab -e
0 3 * * * docker exec bookscan-postgres pg_dump -U bookuser bookscan | gzip > /backups/bookscan_$(date +\%Y\%m\%d).sql.gz
```

---

## 10. Monitoring & Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Check service health
docker compose -f docker-compose.prod.yml ps

# Restart a single service
docker compose -f docker-compose.prod.yml restart backend
```

---

## 11. Updating

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run any new migrations
docker exec -i bookscan-postgres psql -U bookuser -d bookscan < library-scanster/src/db/migrations/NEW_migration.sql
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
- [ ] Consider rate limiting on the API (nginx or Express middleware)
