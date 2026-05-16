# Supabase Config Setup

This project shares a single Supabase project (`lulabyte-shared`) with other apps.
Each project is isolated via its own PostgreSQL schema, exposed to PostgREST through the Management API.

## Architecture

```
Supabase Project: lulabyte-shared
├── public schema          ← default (used by Supabase Studio, auth, etc.)
├── graphql_public schema  ← default GraphQL
└── mamita schema          ← Mamita Order tables
    └── portal_state       ← single-row config table
```

Schema isolation is enforced at the API level via the `Accept-Profile` HTTP header.
Tables in one schema are invisible from requests targeting another schema.

## 1. Prerequisites

- A Supabase project (we use `lulabyte-shared`, ref: `kuwejadecsyxxmbiamxk`)
- Supabase Management API access token
- Supabase service role key (from Dashboard → Settings → API)

## 2. Create the Schema

Run this SQL in Supabase SQL Editor:

```sql
create schema if not exists mamita;
```

Then expose it to PostgREST via the Management API:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/kuwejadecsyxxmbiamxk/postgrest" \
  -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"db_schema": "public, graphql_public, mamita"}'
```

This tells PostgREST to serve tables from all three schemas.

### Grant Schema Usage

```sql
-- Allow anonymous and authenticated roles to query the schema
grant usage on schema mamita to anon, authenticated, service_role;

-- Grant full access to tables within the schema
grant all on all tables in schema mamita to anon, authenticated, service_role;
grant all on all sequences in schema mamita to anon, authenticated, service_role;
```

> **Note:** Future tables in the schema will need explicit grants or default privileges.
> For now, the app only has one table (`portal_state`).

## 3. Create the Table

Run in Supabase SQL Editor, **inside the `mamita` schema**:

```sql
create table mamita.portal_state (
  id              bigint primary key default 1,
  is_open         boolean not null default false,
  available_stock integer not null default 0,
  product_name    text not null default '',
  pack_label      text not null default '',
  seller_whatsapp_number text not null default '',
  pickup_enabled  boolean not null default true,
  courier_enabled boolean not null default true,
  seller_delivery_enabled boolean not null default true,
  price_label     text not null default '',
  announcement_text text default '',
  updated_at      timestamptz not null default now(),
  updated_by      text default '',
  constraint portal_state_single_row check (id = 1)
);

-- Insert initial row
insert into mamita.portal_state (id, is_open, available_stock, product_name)
values (1, false, 0, 'Martabak Bihun Mamita');
```

### Column Reference

| column | type | notes |
| --- | --- | --- |
| `id` | `int8` | primary key (default value `1`) |
| `is_open` | `bool` | whether PO is open |
| `available_stock` | `int4` | visible advisory stock |
| `product_name` | `text` | display name |
| `pack_label` | `text` | e.g. `1 pack isi 5 pcs` |
| `seller_whatsapp_number` | `text` | digits only, e.g. `62812xxxxxxx` |
| `pickup_enabled` | `bool` | toggle Pickup option |
| `courier_enabled` | `bool` | toggle Grab/Gojek option |
| `seller_delivery_enabled` | `bool` | toggle Seller Delivery option |
| `price_label` | `text` | e.g. `Rp35.000 / pack` |
| `announcement_text` | `text` | optional note |
| `updated_at` | `timestamptz` | default `now()` |
| `updated_by` | `text` | optional author label |

## 4. Configure API Access

### Environment Variables

Set these in `.env.local` (dev) or `.env.production` (production):

```ini
SUPABASE_URL=https://kuwejadecsyxxmbiamxk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_SCHEMA=mamita
SUPABASE_PORTAL_TABLE=portal_state
SUPABASE_PORTAL_STATE_ID=1

NEXT_PUBLIC_SUPABASE_URL=https://kuwejadecsyxxmbiamxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_SUPABASE_PORTAL_TABLE=portal_state
NEXT_PUBLIC_SUPABASE_SCHEMA=mamita
```

> **Never expose the service role key to the browser.** It is only used server-side.

### Schema + `Accept-Profile` Header

All server-side API requests to Supabase must include the schema-scoped header:

```ts
const response = await fetch(`${supabaseUrl}/rest/v1/portal_state?select=*`, {
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Accept-Profile": "mamita",  // ⬅️ scopes the request to the mamita schema
  },
});
```

The Supabase JS client configures this via the `db.schema` option:

```ts
// Server client
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "mamita" },
});

// Browser client (for Realtime subscriptions)
export const supabaseBrowser = createClient(supabaseUrl, anonKey, {
  db: { schema: "mamita" },
});
```

> **Important:** If you omit `Accept-Profile`, PostgREST defaults to the first schema in its `db_schema` config (usually `public`) and returns "relation not found" (HTTP 404).

## 5. Row Level Security

If you enable RLS on `mamita.portal_state`, add policies that allow service-role access.
The app performs all operations server-side with the service key, so no anonymous policy is required on the table.

```sql
alter table mamita.portal_state enable row level security;

-- Allow service role to read
create policy portal_state_read_service_role
  on mamita.portal_state
  for select
  to authenticated
  using (current_setting('request.jwt.claim.role', true) = 'service_role');

-- Allow service role to update
create policy portal_state_update_service_role
  on mamita.portal_state
  for update
  to authenticated
  using (current_setting('request.jwt.claim.role', true) = 'service_role')
  with check (current_setting('request.jwt.claim.role', true) = 'service_role');
```

> Note: Supabase treats the service role token as bypassing RLS by default,
> but explicit policies like above help when testing with different JWTs or tightening roles.

## 6. Supabase Realtime

Enable Realtime on `mamita.portal_state` so the admin panel's live preview works:

```sql
-- Add publication (if not already created)
create publication if not exists supabase_realtime;

-- Add the table to the publication
alter publication supabase_realtime add table mamita.portal_state;
```

Or use the Supabase Dashboard: Database → Replication → select `mamita.portal_state`.

## 7. Adding a Future Project (Schema Isolation Template)

To add a new project that shares the same Supabase instance:

1. **Create the schema:**

   ```sql
   create schema project_name;
   grant usage on schema project_name to anon, authenticated, service_role;
   grant all on all tables in schema project_name to anon, authenticated, service_role;
   ```

2. **Expose via PostgREST:**

   ```bash
   curl -X PATCH "https://api.supabase.com/v1/projects/kuwejadecsyxxmbiamxk/postgrest" \
     -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"db_schema": "public, graphql_public, mamita, project_name"}'
   ```

3. **Set env vars:**

   ```ini
   SUPABASE_SCHEMA=project_name
   NEXT_PUBLIC_SUPABASE_SCHEMA=project_name
   ```

## Migration Files

All schema changes live in `supabase/migrations/` as timestamped SQL files.
Applied migrations:

| File | Purpose |
|------|---------|
| `20260516000000_migrate_to_mamita_schema.sql` | Creates `mamita` schema, moves `portal_state`, grants permissions |
| `20260516000001_grant_schema_permissions.sql` | Grants schema permissions to roles |
