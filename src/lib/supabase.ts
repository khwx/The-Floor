import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cliente para uso no Browser (Client Components)
// Usa NEXT_PUBLIC_ vars - seguro expor anon key
export function createSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[Supabase] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY em falta. ' +
          'Configura no .env e no Vercel Dashboard. Supabase ficará desativado.'
      );
    }
    return null;
  }

  return createClient(url, anonKey);
}

// Cliente para uso no Servidor (Server Actions / Route Handlers)
// Prefere SERVICE_ROLE se existir, senão usa ANON
export function createSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // No servidor pode usar service_role para bypass RLS se necessário
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Supabase] Variáveis Supabase em falta no servidor.');
    }
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Singleton lazy para browser
let browserClient: SupabaseClient | null | undefined;
export function getSupabaseBrowser(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;
  browserClient = createSupabaseBrowserClient();
  return browserClient;
}

// Helper: verifica se Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
