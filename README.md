# The Floor (Tile Takeover) 🧩

**The Floor** (Tile Takeover) é um jogo de trivia estratégico e dinâmico inspirado no popular formato de televisão. O objetivo é conquistar o tabuleiro respondendo corretamente a perguntas de diversas categorias, desafiando a IA ou outros jogadores em tempo real.

## 🚀 Funcionalidades

- **Modo Singleplayer:** Joga contra uma IA inteligente que tenta conquistar os teus territórios através de duelos estratégicos.
- **Modo Multiplayer Real-time:** Cria salas de jogo, partilha o código com amigos e disputa duelos épicos sincronizados através do Firebase Firestore.
- **Duelos de Trivia Dinâmicos:** Quando um território é desafiado, os jogadores entram num duelo frenético com múltiplas perguntas geradas por IA.
- **Geração de Conteúdo por IA:** As perguntas, categorias e até imagens de fundo são geradas dinamicamente usando **Google Genkit** e modelos **Gemini 2.5 Flash**.
- **Imagens Contextualizadas:** Integração com a API do Pixabay para ilustrar cada pergunta de forma visualmente apelativa, com filtros de segurança ativos.
- **Interface Moderna:** UI responsiva e elegante construída com Next.js 15, Tailwind CSS e componentes ShadCN/UI.

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Base de Dados:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (Sincronização multiplayer em tempo real)
- **IA Generativa:** [Google Genkit](https://firebase.google.com/docs/genkit) com modelos Gemini 2.5
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

## 📦 Como Instalar e Correr

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/khwx/The-Floor.git
    ```

2.  **Instalar dependências:**
    ```bash
    npm install
    ```

3.  **Configurar chaves:**
    Cria um ficheiro `.env` na raiz (usa `.env.example` como base) com:
    - `NEXT_PUBLIC_FIREBASE_API_KEY`
    - `GOOGLE_GENAI_API_KEY`
    - `PIXABAY_API_KEY`

4.  **Iniciar o servidor:**
    ```bash
    npm run dev
    ```

## 🎮 Regras do Jogo

1. **Objetivo:** Dominar o tabuleiro completo.
2. **Turnos:** No teu turno, podes atacar um território adjacente (neutro ou do adversário).
3. **Território Neutro:** Responde corretamente a uma pergunta para o conquistar. Se errares, perdes a vez.
4. **Duelos (Inimigo):** Desafia um tema do adversário. O vencedor do duelo (quem acertar mais perguntas no tempo limite) fica com **todos** os territórios desse tema pertencentes ao perdedor.
5. **Vencedor Continua:** Se conquistares um território, continuas a jogar. Se falhares, o turno passa.

---
Desenvolvido como um protótipo avançado no Firebase Studio.
