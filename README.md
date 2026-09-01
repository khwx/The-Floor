# Tile Takeover 🧩

**Tile Takeover** (inspirado no formato "The Floor") é um jogo de trivia estratégico onde o objetivo é conquistar todo o tabuleiro respondendo corretamente a perguntas de diversas categorias.

## 🚀 Funcionalidades

- **Modo Singleplayer:** Jogue contra uma IA que tenta conquistar os seus territórios.
- **Modo Multiplayer em Tempo Real:** Crie salas, partilhe o código e duele com amigos através do Firebase Firestore.
- **Geração de Conteúdo por IA:** Perguntas e temas gerados dinamicamente com **Google Genkit (Gemini 2.5)**.
- **Imagens Dinâmicas:** Integração com Pixabay para ilustrar cada pergunta com filtros de segurança.
- **Duelos de Trivia:** Desafie temas adversários em batalhas frenéticas de múltiplas perguntas com cronómetro.

## 🛠️ Tecnologias

- **Framework:** [Next.js 15](https://nextjs.org/)
- **Base de Dados:** [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **IA Generativa:** [Google Genkit](https://firebase.google.com/docs/genkit)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)

## 📦 Como Instalar e Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/khwx/The-Floor.git
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure as Variáveis de Ambiente:**
   Crie um ficheiro `.env` na raiz do projeto com base no ficheiro `.env.example` e adicione as suas chaves do Firebase, Genkit e Pixabay.
4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

---
Desenvolvido como um protótipo avançado no Firebase Studio.