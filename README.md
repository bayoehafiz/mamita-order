# Mamita Order

Mobile-first pre-order landing page for **Martabak Bihun Mamita**. Customers fill a simple form, tap send, and the order goes straight to WhatsApp — no login required.

## Quick Start

```bash
npm install
cp .env.example .env.local     # fill in Supabase credentials
npm run dev
```

See [`docs/supabase.md`](./docs/supabase.md) for full Supabase setup.

## Features

- **Real-time portal state** — stock, pricing, and availability via Supabase Realtime
- **WhatsApp ordering** — form generates a pre-filled WhatsApp message
- **Admin dashboard** (`/dapur`) — PIN-protected panel to manage stock, toggle PO status, update product info
- **Graceful fallback** — safe "closed" state when Supabase is unreachable
- **Mobile-first design** — optimized for mobile

## Links

| Document | Description |
|----------|-------------|
| [`docs/architecture.md`](./docs/architecture.md) | System architecture, schema isolation, key decisions |
| [`docs/deployment.md`](./docs/deployment.md) | CI/CD, Docker, GHCR, Watchtower, Nginx |
| [`docs/supabase.md`](./docs/supabase.md) | Supabase setup, schema creation, PostgREST config |
| [`docs/implementation-spec.md`](./docs/implementation-spec.md) | Original product spec (pre-deployment) |
| [`CHANGELOG.md`](./CHANGELOG.md) | Release history |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Database | Supabase (PostgreSQL + Realtime, schema-isolated) |
| Hosting | VPS (Docker + Docker Compose) |
| Registry | GHCR (`ghcr.io/bayoehafiz/mamita-order`) |
| Auto-deploy | Watchtower (60s poll) |
| Reverse Proxy | Nginx (SSL, HSTS) |
| Domain | `mamita.lulabyte.tech` |

## Environment Variables

| Variable | Description |
|----------|------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `SUPABASE_SCHEMA` | PostgreSQL schema name (e.g. `mamita`) |
| `SUPABASE_PORTAL_TABLE` | Table name (default: `portal_state`) |
| `SUPABASE_PORTAL_STATE_ID` | Row ID (default: `1`) |
| `ADMIN_PIN` | 6-digit PIN for admin access |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL (for Realtime) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (for Realtime) |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | Schema name exposed to browser |
| `NEXT_PUBLIC_SUPABASE_PORTAL_TABLE` | Public table name |

## License

Private — All rights reserved.
