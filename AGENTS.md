# AGENTS.md - User Assistance Guide

This guide helps assist users with setup, running, and troubleshooting the AI Chatbot Platform.

---

## Repository Overview

- **Software type**: SaaS AI Chatbot Platform (Next.js web application)
- **Purpose**: Full-stack AI chatbot with interactive artifacts, persistent chat history, multimodal support, and advanced AI features
- **Main technologies**: Next.js 15, AI SDK 6 (Vercel), PostgreSQL, Redis, Auth.js v5, Tailwind CSS

---

## Official Documentation Resources

- **Vercel AI SDK Docs**: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
- **Next.js Documentation**: https://nextjs.org/docs
- **Auth.js (NextAuth)**: https://authjs.dev
- **Drizzle ORM**: https://orm.drizzle.team
- **Shadcn/UI Components**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Key Directory Structure

- `apps/frontend/` - Main Next.js chatbot application
- `.skills/` - AI skill definitions (generative UI prompts)
- `apps/microservices/` - Backend microservices (llmrouter, fred-mcp, etc.)

---

## Setup & Installation

### Prerequisites
- Node.js (v20+)
- pnpm package manager
- Docker (for local PostgreSQL + Redis)

### Quick Start

1. **Clone and setup environment**
   ```bash
   cd apps/frontend
   cp .env.example .env.local
   ```

2. **Configure environment variables** in `.env.local`:
   ```
   AUTH_SECRET=<generate-random-secret>
   NEXTAUTH_SECRET=<generate-random-secret>
   NEXTAUTH_URL=http://localhost:3000
   
   # AI Provider (choose one)
   AI_GATEWAY_API_KEY=<vercel-ai-gateway-key>
   MOONSHOT_API_KEY=<moonshot-ai-key>
   
   # Database & Cache
   POSTGRES_URL=postgresql://postgres:postgres@localhost:5434/postgres
   REDIS_URL=redis://localhost:6380
   
   # Optional: MCP tools
   ALPHAVANTAGE_API_KEY=<stock-data-api-key>
   TAVILY_API_KEY=<web-search-api-key>
   ```

3. **Start local services** (PostgreSQL + Redis)
   ```bash
   docker compose up -d
   ```

4. **Start the application**
   ```bash
   pnpm dev
   ```

5. **Access the app**: http://localhost:3000

---

## Running & Usage

### Development
```bash
cd apps/frontend
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm start
```

### Database Commands
```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

---

## Adding AI Skills

The platform supports AI skills that enhance model responses. Skills are defined in `.skills/` directory.

### How to Add a New Skill

1. **Create skill directory**
   ```bash
   mkdir -p .skills/<skill-name>
   ```

2. **Create SKILL.md file** in the new directory:
   ```markdown
   ---
   name: <skill-name>
   description: What the skill does
   ---
   
   # Skill Name
   
   ## When to use this skill
   Describe when to activate this skill.
   
   ## Instructions
   Detailed instructions for the model...
   ```

3. **Integrate with system prompt** in `apps/frontend/lib/ai/prompts.ts`:
   ```typescript
   import { <skill-name>Prompt } from "./<skill-name>-prompt";
   
   // Add to systemPrompt function:
   return `${regularPrompt}\n\n${datePrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}\n\n${invoicePrompt}\n\n${generativeUiPrompt}\n\n${<skill-name>Prompt}`;
   ```

4. **Create prompt file** at `apps/frontend/lib/ai/<skill-name>-prompt.ts`:
   ```typescript
   export const <skill-name>Prompt = `
   ## Skill Name
   Instructions for the model...
   `;
   ```

### Skill File Locations

| File | Purpose |
|------|---------|
| `.skills/generative-ui/SKILL.md` | Skill definition |
| `lib/ai/generative-ui-prompt.ts` | System prompt integration |
| `lib/ai/prompts.ts` | Main prompt assembly |

---

## Troubleshooting

### Common Issues

**"AI Gateway requires a valid credit card"**
- Solution: Add valid payment method in Vercel dashboard or set `MOONSHOT_API_KEY` directly

**Database connection errors**
- Verify PostgreSQL is running: `docker ps`
- Check `POSTGRES_URL` in `.env.local`

**Redis connection errors**
- Verify Redis is running: `docker ps`
- Check `REDIS_URL` in `.env.local`

**Authentication errors**
- Ensure `AUTH_SECRET` and `NEXTAUTH_SECRET` are set
- Generate secrets: https://generate-secret.vercel.app/32

### Log Locations

- Application logs: Check terminal output when running `pnpm dev`
- Database: Container logs via `docker compose logs db`
- Redis: Container logs via `docker compose logs redis`

### Configuration Validation

```bash
# Test database connection
pnpm db:studio

# Run lint check
pnpm lint
```

---

## Key Files for Reference

| File | Purpose |
|------|---------|
| `apps/frontend/README.md` | Project overview |
| `apps/frontend/.env.example` | Environment variable template |
| `apps/frontend/docker-compose.yml` | Local infrastructure setup |
| `apps/frontend/lib/ai/prompts.ts` | AI system prompts |
| `apps/frontend/lib/ai/providers.ts` | AI provider configuration |
| `.skills/generative-ui/SKILL.md` | Generative UI skill definition |
