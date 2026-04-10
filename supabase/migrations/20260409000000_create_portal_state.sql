-- Create portal_state table
CREATE TABLE IF NOT EXISTS public.portal_state (
  id bigint PRIMARY KEY DEFAULT 1,
  is_open boolean NOT NULL DEFAULT false,
  available_stock integer NOT NULL DEFAULT 0,
  product_name text NOT NULL DEFAULT 'Martabak Bihun Mamita',
  pack_label text NOT NULL DEFAULT '1 pack isi 5 pcs',
  seller_whatsapp_number text NOT NULL DEFAULT '6281249940606',
  pickup_enabled boolean NOT NULL DEFAULT true,
  courier_enabled boolean NOT NULL DEFAULT true,
  seller_delivery_enabled boolean NOT NULL DEFAULT true,
  price_label text NOT NULL DEFAULT 'Harga dikonfirmasi via WhatsApp',
  announcement_text text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

-- Insert initial seed row with fallback data
INSERT INTO public.portal_state (
  id,
  is_open,
  available_stock,
  product_name,
  pack_label,
  seller_whatsapp_number,
  pickup_enabled,
  courier_enabled,
  seller_delivery_enabled,
  price_label,
  announcement_text,
  updated_at,
  updated_by
) VALUES (
  1,
  false,
  0,
  'Martabak Bihun Mamita',
  '1 pack isi 5 pcs',
  '6281249940606',
  true,
  true,
  true,
  'Harga dikonfirmasi via WhatsApp',
  'PO sedang ditutup sementara. Chat Mamita untuk tanya batch berikutnya.',
  now(),
  'system'
) ON CONFLICT (id) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE public.portal_state IS 'Single-row configuration table for Mamita portal state';

-- Add comments to columns
COMMENT ON COLUMN public.portal_state.id IS 'Primary key, always 1';
COMMENT ON COLUMN public.portal_state.is_open IS 'Whether PO is open for orders';
COMMENT ON COLUMN public.portal_state.available_stock IS 'Visible advisory stock count';
COMMENT ON COLUMN public.portal_state.product_name IS 'Display name for the product';
COMMENT ON COLUMN public.portal_state.pack_label IS 'Pack description label';
COMMENT ON COLUMN public.portal_state.seller_whatsapp_number IS 'WhatsApp number (digits only)';
COMMENT ON COLUMN public.portal_state.pickup_enabled IS 'Enable pickup option';
COMMENT ON COLUMN public.portal_state.courier_enabled IS 'Enable Grab/Gojek option';
COMMENT ON COLUMN public.portal_state.seller_delivery_enabled IS 'Enable seller delivery option';
COMMENT ON COLUMN public.portal_state.price_label IS 'Price display label';
COMMENT ON COLUMN public.portal_state.announcement_text IS 'Optional announcement text';
COMMENT ON COLUMN public.portal_state.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN public.portal_state.updated_by IS 'Optional author label';
