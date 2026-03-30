import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getConfig } from "./config";

let _client: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (_client) return _client;
  const cfg = await getConfig();
  _client = createClient(cfg.VITE_SUPABASE_URL, cfg.VITE_SUPABASE_ANON_KEY);
  return _client;
}

// Keep sync export for backwards compat during migration
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
);

export const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
);
