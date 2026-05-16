# Deployment

Self-hosted on a VPS via Docker with automated image-based deployments.

## Architecture

```
CI (GitHub Actions)          VPS
┌──────────────────┐        ┌──────────────────────┐
│ PR → quality     │  push  │  Watchtower (60s)     │
│ main → build +   │ ─────> │  ↓ auto-pull          │
│   push to GHCR   │  image │  mamita-order:latest  │
│   (latest + sha) │        │  Nginx → localhost:3000│
└──────────────────┘        │  SSL (Let's Encrypt)   │
                            │  HSTS + security hdrs  │
                            └──────────────────────┘
```

## CI Pipeline

On every push to `main`, GitHub Actions:

1. Runs `typecheck` + `lint` + `build` (quality gate)
2. Builds a production Docker image with `output: standalone`
3. Pushes to `ghcr.io/bayoehafiz/mamita-order` (tags: `latest` + commit SHA)
4. Watchtower on VPS detects the new `latest` tag, pulls, and restarts

> **Note:** CI does NOT push changes to the VPS directly — it only pushes to GHCR.

## VPS Prerequisites

- Docker & Docker Compose
- `~/.docker/config.json` authenticated to GHCR (classic PAT with `repo` scope)
- `docker-compose.yml` with `mamita-order` and `watchtower` services
- `.env.production` with runtime environment variables (never commit)
- Nginx reverse proxy (see `deploy/nginx/mamita-order.conf`)
- Domain DNS pointing to VPS IP
- Let's Encrypt SSL certificates

## Required Docker Build Args

All env vars must be passed as Docker build args (both `ARG` and `ENV` in builder stage):

| Variable | Source | Reason |
|----------|--------|--------|
| `SUPABASE_URL` | GitHub `vars` | Required at build time by Next.js module preload |
| `SUPABASE_SERVICE_ROLE_KEY` | GitHub `secrets` | Required at build time by Next.js module preload |
| `SUPABASE_SCHEMA` | GitHub `vars` | Schema isolation |
| `SUPABASE_PORTAL_TABLE` | GitHub `vars` | Table name |
| `SUPABASE_PORTAL_STATE_ID` | GitHub `vars` | Row ID |
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub `vars` | Public client URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub `vars` | Public anon key |
| `NEXT_PUBLIC_SUPABASE_PORTAL_TABLE` | GitHub `vars` | Public table name |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | GitHub `vars` | Public schema name |

## GitHub Repository Configuration

**Secrets** (repo → Settings → Secrets and variables → Actions → Secrets):

| Name | Value |
|------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

**Variables** (repo → Settings → Secrets and variables → Actions → Variables):

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://kuwejadecsyxxmbiamxk.supabase.co` |
| `SUPABASE_PORTAL_TABLE` | `portal_state` |
| `SUPABASE_PORTAL_STATE_ID` | `1` |
| `SUPABASE_SCHEMA` | `mamita` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://kuwejadecsyxxmbiamxk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_PORTAL_TABLE` | `portal_state` |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | `mamita` |

## Manual Deploy (build locally)

```bash
# 1. Build and push to GHCR
docker build -t ghcr.io/bayoehafiz/mamita-order:latest . \
  --build-arg SUPABASE_URL=... \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=... \
  --build-arg SUPABASE_SCHEMA=mamita \
  --build-arg NEXT_PUBLIC_SUPABASE_SCHEMA=mamita \
  # ... all other build args
docker push ghcr.io/bayoehafiz/mamita-order:latest

# 2. On VPS, Watchtower auto-pulls within 60s
# Or force pull and restart:
ssh masbay@103.183.74.22 "docker compose pull && docker compose up -d"
```

## Nginx Setup

```bash
sudo ln -s ~/docker/mamita-order/deploy/nginx/mamita-order.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

The Nginx config handles:
- HTTP → HTTPS redirect (301)
- SSL termination (Let's Encrypt)
- HSTS (`max-age=63072000; includeSubDomains; preload`)
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)
- Gzip compression
- 365d immutable cache for `/_next/static`

## VPS File Layout

```
~/
└── docker/
    └── mamita-order/
        ├── docker-compose.yml
        ├── .env.production        # runtime env vars (gitignored)
        └── deploy/
            └── nginx/
                └── mamita-order.conf
```

> **Note:** Never commit `.env.local` or `.env.production` to version control.
