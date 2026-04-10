-- Enable Realtime for portal_state table
-- This allows the browser client to subscribe to row changes via WebSocket
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_state;

-- Set REPLICA IDENTITY FULL so Realtime sends the complete updated row (not just PK)
ALTER TABLE public.portal_state REPLICA IDENTITY FULL;

-- Allow anonymous users to SELECT portal_state (needed for Realtime subscription)
-- RLS must be enabled for the anon key to work with Realtime
ALTER TABLE public.portal_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to portal_state"
  ON public.portal_state
  FOR SELECT
  TO anon
  USING (true);
