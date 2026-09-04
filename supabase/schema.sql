-- The Floor - Supabase Schema
-- Corre este SQL no Supabase Dashboard > SQL Editor
-- Compatível com migração total OU modo híbrido (recomendado)

-- 1) Tabela principal para jogos multiplayer (substitui Firestore 'games')
create table if not exists public.games (
  id text primary key, -- gameId 6 chars (ex: ABC123)
  difficulty text not null check (difficulty in ('easy','medium','hard','epic')),
  language text not null default 'Português',
  status text not null default 'waiting' 
    check (status in ('waiting','generating','playing','processing','question','duel','finished','error')),
  error_message text,
  board jsonb not null default '[]'::jsonb, -- TileData[]
  scores jsonb not null default '{"player1":0,"player2":0}'::jsonb,
  turn text not null default 'player1' check (turn in ('player1','player2')),
  players jsonb not null default '{"player1":null,"player2":null}'::jsonb,
  winner text check (winner in ('player1','player2','draw')),
  active_question jsonb, -- ActiveQuestionInfo | null
  duel_state jsonb, -- MultiplayerDuelState | null
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Tabela para histórico/ranking (opcional, útil para ambos os modos)
create table if not exists public.game_history (
  id uuid primary key default gen_random_uuid(),
  game_id text references public.games(id) on delete set null,
  winner text,
  difficulty text,
  language text,
  scores jsonb,
  board jsonb,
  created_at timestamptz not null default now()
);

-- 3) Perfis (se quiseres auth com Supabase Auth no futuro)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_updated_at on public.games;
create trigger games_updated_at
  before update on public.games
  for each row execute function public.handle_updated_at();

-- RLS: para já permissivo para o jogo funcionar sem auth
-- Depois podes apertar com auth.uid()
alter table public.games enable row level security;
alter table public.game_history enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "allow all games" on public.games;
create policy "allow all games" on public.games for all
  using (true) with check (true);

drop policy if exists "allow all history" on public.game_history;
create policy "allow all history" on public.game_history for all
  using (true) with check (true);

drop policy if exists "profiles are viewable" on public.profiles;
create policy "profiles are viewable" on public.profiles for select using (true);
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- Realtime: permite ouvir mudanças em games (substitui onSnapshot do Firestore)
-- Ativa em Database > Realtime ou via SQL:
alter publication supabase_realtime add table public.games;

-- Índices úteis
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_created_at on public.games(created_at desc);
