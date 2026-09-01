# Tile Takeover 🧩

**Tile Takeover** é um jogo de trivia estratégico e dinâmico, inspirado no popular formato de televisão "The Floor". O objetivo é conquistar o tabuleiro respondendo corretamente a perguntas de diversas categorias, desafiando a IA ou outros jogadores em tempo real.

## 🚀 Funcionalidades

- **Modo Singleplayer:** Joga contra uma IA inteligente que tenta conquistar os teus territórios.
- **Modo Multiplayer Real-time:** Cria salas de jogo, partilha o código com amigos e disputa duelos épicos através do Firebase Firestore.
- **Duelos de Trivia:** Quando um território é desafiado, os jogadores entram num duelo frenético com múltiplas perguntas e limite de tempo.
- **Geração de Conteúdo por IA:** As perguntas, categorias e até imagens de fundo são geradas dinamicamente usando **Google Genkit** e modelos **Gemini 2.5 Flash**.
- **Imagens Dinâmicas:** Integração com a API do Pixabay para ilustrar cada pergunta de forma contextualizada.
- **Interface Moderna:** UI responsiva e elegante construída com Next.js, Tailwind CSS e componentes ShadCN.

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Base de Dados:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (para sincronização multiplayer)
- **IA Generativa:** [Google Genkit](https://firebase.google.com/docs/genkit) com modelos Gemini
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

## 📦 Como Instalar e Correr

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/teu-utilizador/tile-takeover.git
    ```

2.  **Instalar dependências:**
    ```bash
    npm install
    ```

3.  **Configurar variáveis de ambiente:**
    Cria um ficheiro `.env` na raiz com as tuas chaves:
    - `NEXT_PUBLIC_FIREBASE_API_KEY`
    - `GOOGLE_GENAI_API_KEY`
    - `PIXABAY_API_KEY`

4.  **Iniciar o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

## 🎮 Como Jogar

1.  Escolha o modo de jogo (Sozinho ou em Equipa).
2.  No tabuleiro, clica numa categoria adjacente ao teu território para a tentar conquistar.
3.  Responde corretamente para ganhar a casa. Se errares, perdes a vez!
4.  No modo multiplayer, o objetivo é dominar o máximo de casas possível antes do adversário.

---
Desenvolvido como um protótipo avançado no Firebase Studio.