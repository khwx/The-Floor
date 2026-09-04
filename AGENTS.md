# AGENTS.md - Tile Takeover / The-Floor

## Objetivo do Projeto
Jogo de trivia estratégico inspirado no formato "The Floor" (Next.js 15 + Firebase + Genkit Gemini).
Melhorar diariamente, expandir funcionalidades, listar melhorias pendentes e fazer push para o GitHub.

## Stack
- **Framework:** Next.js 15 (App Router)
- **Base de Dados:** Firebase Firestore (multiplayer tempo-real) + Supabase (schema pronto para ranking)
- **IA:** Google Genkit (Gemini 2.5 Flash)
- **Estilo:** Tailwind CSS + Shadcn/UI
- **Imagens:** Pixabay API

## Comandos Úteis
```bash
npm run dev          # Dev server (port 9002)
npm run build        # Build de produção
npm run typecheck    # Verificar tipos TypeScript
npm run lint         # ESLint
```

## Estrutura Principal
```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── play/page.tsx         # Singleplayer (544 linhas - componente gigante)
│   └── play/multiplayer/     # Multiplayer
├── ai/
│   ├── genkit.ts             # Config Genkit
│   └── flows/                # Flows AI (perguntas, floor, etc.)
├── components/
│   ├── game-board.tsx        # Tabuleiro
│   ├── tile.tsx              # Casa individual
│   ├── question-modal.tsx    # Modal de perguntas
│   ├── game-over-dialog.tsx  # Dialog fim de jogo
│   └── ui/                   # Shadcn UI components
├── lib/
│   ├── actions.ts            # Server Actions
│   ├── firebase.ts           # Cliente Firebase
│   ├── supabase.ts           # Cliente Supabase (pronto mas não usado)
│   ├── types.ts              # Tipos TypeScript
│   └── categories.ts         # 106 categorias em PT
└── hooks/
    ├── use-audio.ts
    └── use-toast.ts
```

## Convenções
- Server Actions com `'use server'` em `src/lib/actions.ts`
- Componentes client com `'use client'` no topo
- Estilo dark mode (Tailwind)
- UI em português
