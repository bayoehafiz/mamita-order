# 🫔 Mamita Order

Mobile-first pre-order landing page for **Martabak Bihun Mamita**. Customers fill a simple form, tap send, and the order goes straight to WhatsApp — no login required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + Realtime) |
| Hosting | VPS (self-hosted) |

## Features

- **Real-time portal state** — stock, pricing, and availability update instantly via Supabase Realtime
- **WhatsApp ordering** — form generates a pre-filled WhatsApp message with order details
- **Admin dashboard** (`/dapur`) — PIN-protected panel to manage stock, toggle PO status, and update product info
- **Graceful fallback** — if Supabase is unreachable, the UI shows a safe "closed" state
- **Mobile-first design** — optimized for the target demographic (young mothers on mobile)

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
├── components/               # React components
│   ├── portal-live-shell.tsx # Realtime wrapper (client component)
│   ├── order-form.tsx        # Order form with validation
│   ├── admin-config-form.tsx # Admin configuration form
│   └── icons.tsx             # SVG icon components
├── lib/                      # Shared utilities
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
└── docs/                     # Documentation
```

## Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Copy env file:**

   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment variables** in `.env.local`:

   | Variable | Description |
   |----------|------------|
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
   | `SUPABASE_PORTAL_TABLE` | Table name (default: `portal_state`) |
   | `SUPABASE_PORTAL_STATE_ID` | Row ID (default: `1`) |
   | `ADMIN_PIN` | 6-digit PIN for admin access |
   | `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL (for Realtime) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (for Realtime) |
   | `NEXT_PUBLIC_SUPABASE_PORTAL_TABLE` | Public table name (for Realtime) |

4. **Start dev server:**

   ```bash
   npm run dev
   ```

5. **Verify Supabase connectivity:**

   ```bash
   npm run check:supabase
   ```

### Using Local Supabase

```bash
supabase start
# Then set in .env.local:
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
```

## Admin Panel

Visit `/dapur` and authenticate with the 6-digit `ADMIN_PIN`. From there you can:

- Toggle PO open/close
- Update available stock count
- Edit product name, pack label, and pricing
- Enable/disable delivery methods (Pickup, Grab/Gojek, Seller Delivery)
- Set announcement text
- View last update timestamp and author

Changes are written to Supabase via a secure server-side API and reflected on the homepage in real-time.

## Deployment

Self-hosted on a VPS via Docker.

### Prerequisites

- Docker & Docker Compose on VPS
- `.env.production` file with production credentials (never commit secrets)
- Nginx configured as reverse proxy (see `deploy/nginx/mamita-order.conf`)
- Domain DNS pointing to VPS IP

### GitHub Secrets (for CI/CD)

| Secret | Description |
|--------|-------------|
| `VPS_SSH_KEY` | Private SSH key for deploy user |
| `VPS_SSH_HOST_KEY` | `ssh-keyscan` output of VPS host key |
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH user (e.g. `masbay`) |
| `VPS_PROJECT_DIR` | Deploy path (e.g. `~/projects/mamita-order`) |

### Manual Deploy

```bash
REMOTE_HOST=103.183.74.22 bash deploy/deploy.sh
```

### Nginx Setup

```bash
sudo ln -s ~/projects/mamita-order/deploy/nginx/mamita-order.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> **Note:** Never commit `.env.local` or `.env.production` to version control.

## Database Schema

See [`docs/supabase-setup.md`](./docs/supabase-setup.md) for the full Supabase setup guide, including the `portal_state` table schema and RLS policies.

## License

Private — All rights reserved.
