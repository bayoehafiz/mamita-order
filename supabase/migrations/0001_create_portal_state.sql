-- Create portal_state table with defaults and constraints
create table if not exists public.portal_state (
  id bigint primary key,
  is_open boolean not null default false,
  available_stock integer not null default 0 check (available_stock >= 0),
  product_name text not null default ''::text,
  pack_label text not null default ''::text,
  seller_whatsapp_number text not null default ''::text,
  pickup_enabled boolean not null default false,
  courier_enabled boolean not null default false,
  seller_delivery_enabled boolean not null default false,
  price_label text not null default ''::text,
  announcement_text text,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Ensure only one row is expected by convention (id=1)
-- Optionally seed the initial row if not present
insert into public.portal_state (id)
select 1
where not exists (select 1 from public.portal_state where id = 1);

comment on table public.portal_state is 'Single-row config for Mamita Order portal.';

