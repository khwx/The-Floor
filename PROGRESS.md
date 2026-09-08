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
- **Commit:** `b322da7` - `fix: Game ID collision - crypto secure 8 chars + collision check`
- **Feito:**
  - actions.ts: generateGameId reescrito com crypto.getRandomValues (8 chars, sem ambiguidade)
  - createGameSession: collision check com getDoc + retry (até 5 tentativas)
  - joinGameSession: validação aceita 6-8 chars (backward compat)
  - game-lobby.tsx: input maxLength atualizado para 8
- **Push OK:** `main` -> `origin/main`

## 5 Set 2026 - Feature P1: Seleção de categorias pelo jogador
- **Commit:** `d314ff2` - `feat: seleção de categorias pelo jogador (P1 blueprint)`
- **Feito:**
  - game-setup.tsx: seletor de categorias com scroll (106 categorias), botões Todas/Limpar, contador
  - actions.ts: generateFloor aceita categories opcional
  - generate-themed-floor.ts: aceita categories, fallback para allCategories se vazio
  - play/page.tsx: handleGameStart passa categories, guarda em localStorage
- **Push OK:** `main` -> `origin/main`

## 5 Set 2026 - Fix P0: Firestore transações + background generation
- **Commit:** `5ae768d` - `fix: P0 bugs - transação Firestore sem fetchs + background generation await`
- **Feito:**
  - handleTileClick: gera perguntas + imagens ANTES da transação (elimina timeout risk)
  - joinGameSession: await generateFloor síncrono (elimina fire-and-forget .then() chain)
  - Transação agora só faz escrita, zero chamadas de rede/IA
  - Serverless-safe: não há background promises que podem ser killed
- **Push OK:** `main` -> `origin/main`

## 6 Set 2026 - Feature P1: Supabase integration (ranking/histórico)
- **Commit:** `b445dbd` - `feat: Supabase integration - ranking/histórico (P1)`
- **Feito:**
  - supabase.ts: saveGameToHistory + getRanking + getGameHistory
  - actions.ts: auto-save no checkEndGame quando jogo termina (fire-and-forget)
  - game_history table pronta no schema.sql
- **Push OK:** `main` -> `origin/main`

## 6 Set 2026 - Feature P2: Visibilidade do turno da IA
- **Commit:** `a1a80b4` - `feat: visibilidade do turno da IA (UX P2)`
- **Feito:**
  - play/page.tsx: 3 fases de feedback visual
  - Fase 1 (800ms): "A analisar o tabuleiro..."
  - Fase 2 (1000ms): "A preparar desafio em X..." ou "A atacar X..."
  - Fase 3: Executa ação (gera perguntas ou resolve conquista)
  - Overlay mostra estado atual em tempo real
- **Push OK:** `main` -> `origin/main`

## 6 Set 2026 - Refactor: Hooks para lógica de jogo
- **Commit:** `5ce071e` - `feat: hooks useDuelTimer + useLoadingState para The-Floor play (duel timer, loading)`
- **Feito:**
  - hooks/use-duel-timer.ts: gerencia ciclo de vida do timer de duelo (interval + cleanup)
  - hooks/use-loading-state.ts: gerencia progress bar + mensagens rotativas durante fetch de perguntas
  - play/page.tsx: integrado ambos os hooks, removido ~80 linhas de useEffect duplicados
- **Push OK:** `main` -> `origin/main`

## Pendente (análise completa)
- V1 - Refactorizar play/page.tsx em hooks menores (useGameState, useAI, useDuel)
- V1 - Autenticação (server actions públicas)
- V2 - Modo equipas
- V3 - Keyboard navigation para tiles
- V3 - i18n completo
- V3 - Sons com toggle mute
