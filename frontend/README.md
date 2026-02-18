# SaaS AI Chatbot Platform

A powerful, full-stack AI chatbot platform built with standard modern technologies. It features a rich, interactive user interface with "Artifacts" (live documents, code, and images), persistent chat history, and advanced AI features like reasoning and document suggestions.

![Chatbot Preview](app/(chat)/opengraph-image.png)

## 🚀 Features

- **Interactive Artifacts**: AI can create and modify live documents, code snippets, interactive sheets, and images in a dedicated side-panel.
- **Multimodal Support**: Attach images and files to your chats for visual context.
- **AI-Powered Suggestions**: The AI can suggest specific edits to artifacts, which users can accept or reject.
- **Advanced Streaming**: Real-time response streaming with support for **Resumable Streams** (powered by Redis).
- **Reasoning Display**: Support for "thinking" models (like Grok and Anthropic) with a dedicated UI for showing the AI's step-by-step reasoning.
- **Persistent History**: Full chat history and user session management.
- **Sharable Chats**: Toggle visibility between Public and Private for any chat.
- **Modern UI**: Built with Next.js 15, Shadcn/UI, Framer Motion, and Tailwind CSS.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **AI Integration**: [AI SDK 6 (Vercel)](https://ai-sdk.dev)
- **Database**: [PostgreSQL](https://www.postgresql.org) (via [Drizzle ORM](https://orm.drizzle.team))
- **Caching/Streaming**: [Redis](https://redis.io) (via [Upstash](https://upstash.com) or Local Docker)
- **Authentication**: [Auth.js v5](https://authjs.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) & [Shadcn/UI](https://ui.shadcn.com)
- **Infrastructure**: Docker Compose for local development.

## 📁 Project Structure

```text
├── app/                  # Next.js App Router (Auth & Chat)
├── components/           # UI components (Shadcn + custom elements)
│   ├── ai-elements/      # Artifact-specific components
│   └── ui/               # Base Radix-based UI components
├── lib/                  # Core application logic
│   ├── ai/               # AI providers, tools, and prompts
│   ├── db/               # Drizzle schema and database queries
│   └── editor/           # Logic for artifact editors (code, text, etc.)
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── docker-compose.yml    # Local DB & Redis setup
```

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v20+)
- [pnpm](https://pnpm.io)
- [Docker](https://www.docker.com) (for local DB/Redis)

### 2. Environment Setup
Copy `.env.example` to `.env.local` and fill in the required keys:
```bash
cp .env.example .env.local
```

### 3. Start the Full Stack
```bash
docker compose up --build -d
```
*Note: This starts the Next.js app on port `3000`, PostgreSQL on `5434`, and Redis on `6380`.*

### 4. Database Schema Sync (First time only)
The database should be synced once the containers are running:
```bash
npm run db:push
```

### 5. Access the App
Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🤖 AI Providers
This project is configured to use **Vercel AI Gateway** by default, supporting models like:
- `grok-2-vision-1212` (xAI)
- `grok-3-mini` (xAI)
- Anthropic Claude models (with thinking support)

You can easily switch providers in `lib/ai/providers.ts`.

## 📜 License
This project is licensed under the [MIT License](LICENSE).
