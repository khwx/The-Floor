
# Tile Takeover 🧩 (The Floor)

**Tile Takeover** é um jogo de trivia estratégico inspirado no formato "The Floor". O objetivo é conquistar todo o tabuleiro respondendo corretamente a perguntas de diversas categorias geradas por IA.

## 🚀 Funcionalidades

- **Modo Singleplayer:** Enfrente uma IA desafiante que tenta conquistar os seus territórios.
- **Modo Multiplayer em Tempo Real:** Crie salas, partilhe o código e duele com amigos através do Firebase Firestore.
- **Geração de Conteúdo por IA:** Temas e perguntas gerados dinamicamente com **Google Genkit (Gemini)**.
- **Imagens Dinâmicas:** Integração com Pixabay para ilustrar cada pergunta (com filtros de segurança ativos).
- **Duelos de Trivia:** Batalhas de velocidade com múltiplas perguntas e cronómetro integrado.

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js 15](https://nextjs.org/)
- **Base de Dados:** [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **IA Generativa:** [Google Genkit](https://firebase.google.com/docs/genkit)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Imagens:** [Pixabay API](https://pixabay.com/api/docs/)

## 📦 Como Instalar e Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/khwx/The-Floor.git
   cd The-Floor
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um ficheiro `.env` na raiz do projeto com as suas chaves:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=sua_chave
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_id
   NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
   
   GEMINI_API_KEY=sua_chave_gemini
   PIXABAY_API_KEY=sua_chave_pixabay
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

---
Desenvolvido com o suporte do App Prototyper no Firebase Studio.
