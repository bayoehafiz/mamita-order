# Supabase Config Setup

Use a single Supabase table as the seller-editable source of truth.

## 1. Create the table

1. In your Supabase project, create a table named `portal_state` with the following columns:

| column | type | notes |
| --- | --- | --- |
| `id` | `int8` | primary key (default value `1` is fine) |
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

2. Insert the first row manually with `id = 1`. All updates in the app will target this row.

## 2. Configure API access

1. Grab the project URL (`https://<project>.supabase.co`) and the service role key from the Supabase dashboard.
2. Set these values in `.env.local`:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_PORTAL_TABLE=portal_state
SUPABASE_PORTAL_STATE_ID=1
```

> **Never expose the service role key to the browser.** It is only used server-side.

## 3. Admin access

The `/dapur` page is protected by a 6-digit PIN cookie-based authentication, configured via an environment variable:

```
ADMIN_PIN=<6-digit-pin>
```

Enter the PIN on `/dapur/login` to access the admin panel. The page will call Supabase from the server to fetch and update the row.

## 4. Optional Row Level Security

If you enable RLS on `portal_state`, add a policy allowing service-role access. The site only performs server-side reads/writes with the service key, so no anonymous policy is required for the public page.

Example policies (read/write for service role only):

```
-- Enable RLS
alter table public.portal_state enable row level security;

-- Allow service role to read
create policy portal_state_read_service_role
  on public.portal_state
  for select
  to authenticated
  using (current_setting('request.jwt.claim.role', true) = 'service_role');

-- Allow service role to write
create policy portal_state_write_service_role
  on public.portal_state
  for insert
  to authenticated
  with check (current_setting('request.jwt.claim.role', true) = 'service_role');

create policy portal_state_update_service_role
  on public.portal_state
  for update
  to authenticated
  using (current_setting('request.jwt.claim.role', true) = 'service_role')
  with check (current_setting('request.jwt.claim.role', true) = 'service_role');
```

Note: Supabase treats the service role token as bypassing RLS by default, but explicit policies like above help when testing with different JWTs or tightening roles.
