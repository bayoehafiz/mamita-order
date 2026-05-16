# Architecture

## System Overview

```
┌─────────────┐     HTTPS      ┌──────────────┐
│   Browser    │ ────────────> │  Nginx (443)  │
│  (mobile)    │ <──────────── │  reverse      │
└─────────────┘               │  proxy        │
                              └──────┬───────┘
                                     │ http://127.0.0.1:3000
                              ┌──────┴───────┐
                              │  Docker       │
                              │  ┌─────────┐ │
                              │  │ mamita-  │ │
                              │  │ order    │ │
                              │  │ :3000   │ │
                              │  └─────────┘ │
                              │  ┌─────────┐ │
                              │  │ watch-   │ │
                              │  │ tower    │ │
                              │  └─────────┘ │
                              └──────┬───────┘
                                     │
                        ┌────────────┴────────────┐
                        │ Supabase (shared project)│
                        │ lulabyte-shared          │
                        │ ┌────────────────────┐   │
                        │ │ mamita.portal_state │   │
                        │ └────────────────────┘   │
                        └─────────────────────────┘

CI (GitHub → GHCR) ─────push─────> Watchtower ──auto-pull──> Docker
```

## CI/CD Pipeline

```
PR ──> quality (typecheck + lint + build)
main ──> build & push to ghcr.io/bayoehafiz/mamita-order:latest
              └── Watchtower on VPS detects new tag, pulls, restarts
```

CI never pushes directly to the VPS — only to GHCR. Watchtower handles the deploy.

## Schema Isolation

Shares a single Supabase project (`lulabyte-shared`) with other applications.
Each project is isolated via its own PostgreSQL schema:

| Project | Schema | Table |
|---------|--------|-------|
| Mamita Order | `mamita` | `mamita.portal_state` |
| *(next project)* | `project_name` | `project_name.*` |

PostgREST is configured via the Management API to expose schemas:
`db_schema: public, graphql_public, mamita`

All Supabase requests include the `Accept-Profile: mamita` header to scope the query.

## Project Structure

```
mamita-order/
├── app/
│   ├── page.tsx              # Homepage (SSR, fetches portal state)
│   ├── layout.tsx            # Root layout (fonts, metadata)
│   ├── globals.css           # Global styles
│   ├── dapur/                # Admin dashboard
│   │   ├── page.tsx          # Dashboard (protected)
│   │   └── login/            # PIN login
│   └── api/dapur/            # Server-side API routes
│       └── portal-state/     # CRUD for portal config
├── components/
│   ├── portal-live-shell.tsx # Realtime wrapper (client component)
│   ├── order-form.tsx        # Order form with validation
│   ├── admin-config-form.tsx # Admin configuration form
│   └── icons.tsx             # SVG icon components
├── lib/
│   ├── portal-repository.ts  # Supabase data access layer
│   ├── portal-state.ts       # State mapping & fallback logic
│   ├── supabase-browser.ts   # Browser Supabase client (Realtime)
│   ├── types.ts              # TypeScript type definitions
│   ├── constants.ts          # Fallback config & labels
│   ├── validation.ts         # Form validation
│   ├── utils.ts              # Utility functions
│   └── whatsapp.ts           # WhatsApp deep link generator
├── public/                   # Static assets
├── supabase/                 # Database migrations & config
├── deploy/nginx/             # Nginx reverse proxy config
└── docs/                     # Documentation
```

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| PostgreSQL schemas for isolation | Single Supabase plan, shared connection pool, no separate project overhead |
| GHCR + Watchtower | No SSH deploy keys in CI; VPS pulls when ready |
| All env vars as Docker build args | Next.js build trace preloads modules, capturing `process.env` at build time — even non-`NEXT_PUBLIC_` vars |
| `Accept-Profile` header | PostgREST requires explicit schema-scoping; omitting it defaults to `public` schema |
| `output: standalone` + Alpine + non-root | Minimal image size, security best practice for Docker |
