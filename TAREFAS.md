# TAREFAS.md - Lista de Melhorias Pendentes

Legenda: ✅ Feito | 🔨 Em curso | ⏳ Pendente

---

## 🐛 BUGS CRÍTICOS (P0)
- ⏳ IA nunca pergunta ao jogador nos duelos (respostas simuladas com Math.random)
- ⏳ Transações Firestore com fetchs de rede (timeout risk ~30s)
- ⏳ Background generation em serverless (pode ser killed)
- ⏳ Jogador pode clicar tiles não adjacentes (blueprint: tiles deviam ser adjacentes)
- ⏳ Game ID collision (6 chars, sem check de existência)

## 🎯 FUNCIONALIDADES EM FALTA (P1)
- ⏳ IA difficulty não reflete accuracy (sempre 65%)
- ⏳ Modo equipas (blueprint: "Team Play Mode")
- ⏳ Seleção de categorias pelo jogador (blueprint: "Category Selection")
- ⏳ Supabase integration (schema pronto, client pronto, zero usage no game logic)

## 🖼️ UX / UI (P2)
- 🔨 icons.tsx não mapeia temas PT (HelpCircle para tudo)
- 🔨 lang="en" hardcoded no layout (UI em PT)
- 🔨 Game-over dialog: dismiss fecha dialog sem opção de ver tabuleiro
- ⏳ Sem indicação visual de casas adjacentes clicáveis
- ⏳ Sem feedback visual de corret/incorret no modal (fecha rápido)
- ⏳ AI turn sem visibilidade (só "A IA está a pensar...")
- ⏳ Sem confirmação ao sair de jogo ativo
- ⏳ Sons sem toggle mute
- ⏳ Loading messages hardcoded em PT (não respeita idioma)

## 🔧 CÓDIGO (P2)
- 🔨 getGridSize duplicado em 2 ficheiros
- ⏳ play/page.tsx monolítico (544 linhas - refatorar em hooks)
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
