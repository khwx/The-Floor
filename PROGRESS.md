# PROGRESS.md - Histórico de Alterações do Projeto

## 4 Set 2026 - Deploy Vercel + Supabase
- **Commit:** `915bf00` - `chore: prepara deploy Vercel + Supabase`
- **Feito:** `@supabase/supabase-js`, `src/lib/supabase.ts`, `supabase/schema.sql`, `vercel.json`, fix `GEMINI_API_KEY` alias, fix typecheck `duelState`
- **Push OK:** `main` -> `origin/main`

## 4 Set 2026 - Análise completa + Correções Críticas
- **Commit:** `9a8f0ae` - `feat: icons PT, adjacency, IA difficulty, game-over fix, tracking files`
- **Feito:**
  - icons.tsx: 106 categorias PT mapeadas + fuzzy match por keyword
  - layout.tsx: fix `lang="en"` -> `lang="pt"`
  - game-over-dialog.tsx: dismiss bloqueado (X/outside não fecha dialog)
  - play/page.tsx: adjacency check em handleTileClick, IA accuracy por difficulty
  - src/lib/grid.ts: getGridSize + getNeighbors extraídos
- **Push OK:** `main` -> `origin/main`

## 4 Set 2026 - Melhorias UX/UI (QuestionModal + GameBoard)
- **Commit:** `2bc5c88` - `feat: feedback visual respostas + borda verde casas adjacentes`
- **Feito:**
  - question-modal.tsx: feedback visual de correto/incorreto com banner colorido
  - tile.tsx: borda verde em casas adjacentes (dashed se não clicável, glow se clicável)
  - game-board.tsx: passa isAdjacent ao Tile
  - TAREFAS.md: status atualizado com todas as conclusões
- **Push OK:** `main` -> `origin/main`

## 4 Set 2026 - Fix P0: IA duel com perguntas reais
- **Commit:** `9d40c1a` - `fix: IA duel agora mostra perguntas reais ao jogador`
- **Feito:**
  - play/page.tsx: IA agora gera perguntas reais via AI quando desafia o jogador
  - Antes: respostas simuladas com Math.random(), jogador nunca via perguntas
  - Agora: QuestionModal abre com perguntas reais, tracker correto/errado funciona
- **Push OK:** `main` -> `origin/main`

## 4 Set 2026 - Fix P0: Game ID collision
- **Commit:** pendente
- **Feito:**
  - actions.ts: generateGameId reescrito com crypto.getRandomValues (8 chars, sem ambiguidade)
  - createGameSession: collision check com getDoc + retry (até 5 tentativas)
  - joinGameSession: validação aceita 6-8 chars (backward compat)
  - game-lobby.tsx: input maxLength atualizado para 8
- **Push OK:** pendente
- V1 - Refactorizar play/page.tsx em hooks menores
- V1 - Firestore transação sem fetchs de rede (timeout risk)
- V1 - Autenticação (server actions públicas)
- V2 - Modo equipas
- V2 - Seleção de categorias pelo jogador
- V2 - Supabase para ranking/histórico
- V3 - Keyboard navigation para tiles
- V3 - i18n completo
- V3 - Sons com toggle mute
