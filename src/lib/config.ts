// Loads runtime config from /config endpoint (served by server.cjs)
// This allows env vars to be injected at runtime instead of build time

interface AppConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_WHATSAPP_PROVIDER: string;
  VITE_EVOLUTION_API_URL: string;
  VITE_EVOLUTION_API_KEY: string;
  VITE_EVOLUTION_INSTANCE: string;
}

let _config: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (_config) return _config;

  // First try build-time Vite vars (dev environment)
  const buildTimeUrl = import.meta.env.VITE_SUPABASE_URL;
  if (buildTimeUrl && buildTimeUrl !== 'https://placeholder.supabase.co') {
    _config = {
      VITE_SUPABASE_URL:       import.meta.env.VITE_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY:  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      VITE_WHATSAPP_PROVIDER:  import.meta.env.VITE_WHATSAPP_PROVIDER || '',
      VITE_EVOLUTION_API_URL:  import.meta.env.VITE_EVOLUTION_API_URL || '',
      VITE_EVOLUTION_API_KEY:  import.meta.env.VITE_EVOLUTION_API_KEY || '',
      VITE_EVOLUTION_INSTANCE: import.meta.env.VITE_EVOLUTION_INSTANCE || '',
    };
    return _config;
  }

  // Fall back to runtime /config endpoint (production on Railway)
  try {
    const res = await fetch('/config');
    _config = await res.json();
    return _config!;
  } catch {
    console.error('Failed to load runtime config from /config');
    _config = {
      VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '',
      VITE_WHATSAPP_PROVIDER: '', VITE_EVOLUTION_API_URL: '',
      VITE_EVOLUTION_API_KEY: '', VITE_EVOLUTION_INSTANCE: '',
    };
    return _config;
  }
}
