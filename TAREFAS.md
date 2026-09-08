# TAREFAS.md - Lista de Melhorias Pendentes

Legenda: ✅ Feito | 🔨 Em curso | ⏳ Pendente

---

## 🐛 BUGS CRÍTICOS (P0)
- ✅ IA nunca pergunta ao jogador nos duelos → agora gera perguntas reais via AI + QuestionModal
- ✅ Transações Firestore com fetchs de rede → handleTileClick: gera perguntas + imagens ANTES da transação
- ✅ Background generation em serverless → joinGameSession: await generateFloor (síncrono)
- ✅ Jogador pode clicar tiles não adjacentes → fix adjacency check em handleTileClick
- ✅ Game ID collision → 8 chars cryptographically secure + collision check com retry

## 🎯 FUNCIONALIDADES EM FALTA (P1)
- ✅ IA difficulty não reflete accuracy → AI_ACCURACY por difficulty (45/60/75/90%)
- ⏳ Modo equipas (blueprint: "Team Play Mode")
- ✅ Seleção de categorias pelo jogador → seletor com 106 categorias no GameSetup
- ✅ Supabase integration → saveGameToHistory + getRanking + getGameHistory em supabase.ts, auto-save no checkEndGame

## 🖼️ UX / UI (P2)
- ✅ icons.tsx não mapeia temas PT → 106 categorias PT mapeadas + fuzzy match
- ✅ lang="en" hardcoded no layout → lang="pt"
- ✅ Game-over dialog: dismiss fecha dialog → bloqueado via onPointerDownOutside
- ✅ Sem indicação visual de casas adjacentes clicáveis → borda verde dashed/glow
- ✅ Sem feedback visual de corret/incorret no modal → banner verde/vermelho com ícones
- ✅ AI turn sem visibilidade → 3 fases: "A analisar..." → "A preparar desafio/atacar..." → execução
- ⏳ Sem confirmação ao sair de jogo ativo
- ⏳ Sons sem toggle mute
- ⏳ Loading messages hardcoded em PT (não respeita idioma)

## 🔧 CÓDIGO (P2)
- ✅ getGridSize duplicado → extraído para src/lib/grid.ts
- 🔨 play/page.tsx refatorado: extraídos hooks useDuelTimer + useLoadingState
- ⏳ play/page.tsx monolítico (ainda ~480 linhas - extrair useGameState, useAI, etc.)
- ⏳ `ignoreBuildErrors` esconde erros reais
- ⏳ Deps não usadas no package.json (recharts, date-fns, embla, etc.)
- ⏳ toast delay 1000000ms (16min)

## 🔒 SEGURANÇA (P1)
- ⏳ Server actions públicas (sem auth)
- ⏳ Firestore sem security rules
- ⏳ Math.random() para game IDs (não criptográfico)
- ⏳ Supabase RLS completamente aberto

## ♿ ACESSIBILIDADE (P3)
- ⏳ Sem ARIA labels nos tiles
- ⏳ Owner info só por cor (color-blind users)
- ⏳ Sem keyboard navigation no tabuleiro
- ⏳ Timer sem aria-live announcements
