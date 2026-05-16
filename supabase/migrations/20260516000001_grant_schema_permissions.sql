-- Grant schema usage to PostgREST roles (needed for Accept-Profile to work)
grant usage on schema mamita to anon, authenticated, service_role;
grant all privileges on all tables in schema mamita to anon, authenticated, service_role;
grant all privileges on all sequences in schema mamita to anon, authenticated, service_role;
