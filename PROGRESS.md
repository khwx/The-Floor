# PROGRESS.md - Histórico de Alterações do Projeto

## 4 Set 2026 - Deploy Vercel + Supabase
- **Commit:** `915bf00` - `chore: prepara deploy Vercel + Supabase`
- **Feito:** `@supabase/supabase-js`, `src/lib/supabase.ts`, `supabase/schema.sql`, `vercel.json`, fix `GEMINI_API_KEY` alias, fix typecheck `duelState`
- **Push OK:** `main` -> `origin/main`

## 4 Set 2026 - Análise completa + Correções Críticas
- **Status:** Em progresso
- **Melhorias em curso:**
  - icons.tsx: mapeamento PT + fallback por substring
  - layout.tsx: fix `lang="en"` -> `lang="pt"`
  - game-over-dialog.tsx: dismiss não fecha dialog
  - play/page.tsx: IA respeita difficulty (acc) + adjacency check
  - game-board.tsx: ARIA labels + borda verde casas adjacentes
  - Extract getGridSize para shared utility

## Pendente (análise completa)
- V1 - Refactorizar play/page.tsx em hooks menores
- V1 - Firestore transação sem fetchs de rede (timeout risk)
- V1 - Autenticação (server actions públicas)
- V2 - Modo equipas
- V2 - Seleção de categorias pelo jogador
- V2 - Supabase para ranking/histórico
- V3 - Keyboard navigation para tiles
- V3 - i18n completo
- V3 - Sons com toggle mute
