-- Create dedicated schema for mamita (project isolation)
create schema if not exists mamita;

-- Move portal_state from public to mamita (safe: no-op if already there)
do $$
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'portal_state'
  ) then
    alter table public.portal_state set schema mamita;
  end if;
end $$;

-- Update Realtime publication for the correct schema
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'portal_state'
  ) then
    alter publication supabase_realtime drop table only public.portal_state;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'mamita' and tablename = 'portal_state'
  ) then
    alter publication supabase_realtime add table only mamita.portal_state;
  end if;
end $$;

-- Update RLS policy for the new schema
alter table mamita.portal_state enable row level security;
drop policy if exists "Allow public read access to portal_state" on mamita.portal_state;
create policy "Allow public read access to portal_state"
  on mamita.portal_state
  for select
  to anon
  using (true);
