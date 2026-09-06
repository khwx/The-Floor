import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type GameHistoryRecord = {
  id: string;
  game_id: string | null;
  winner: string | null;
  difficulty: string | null;
  language: string | null;
  scores: Record<string, number> | null;
  board: unknown | null;
  created_at: string;
};

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

// Salva jogo terminado no histórico Supabase
export async function saveGameToHistory(params: {
  gameId: string;
  winner: string | null;
  difficulty: string;
  language: string;
  scores: Record<string, number>;
  board: unknown;
}): Promise<{ error: string } | { success: true }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: 'Supabase não configurado' };

  try {
    const { error } = await supabase.from('game_history').insert({
      game_id: params.gameId,
      winner: params.winner,
      difficulty: params.difficulty,
      language: params.language,
      scores: params.scores,
      board: params.board,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar histórico' };
  }
}

// Busca ranking/histórico (top N por score)
export async function getRanking(limit = 20): Promise<GameHistoryRecord[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  try {
    // Score total = soma dos scores dos jogadores
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as GameHistoryRecord[];
  } catch {
    return [];
  }
}

// Busca histórico de um jogo específico
export async function getGameHistory(gameId: string): Promise<GameHistoryRecord | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error || !data) return null;
    return data as GameHistoryRecord;
  } catch {
    return null;
  }
}
