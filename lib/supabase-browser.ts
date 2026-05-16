import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseSchema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public";

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: supabaseSchema }
});
