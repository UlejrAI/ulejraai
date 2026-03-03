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

The platform uses a lazy-loading skill registry. Skills are defined in a single file — no separate prompt files or imports needed.

### How to Add a New Skill

Add an entry to `apps/frontend/lib/ai/skills/registry.ts`:

```typescript
"my-skill": {
    name: "my-skill",
    description: "One-line description shown in the skill catalog (used by the model to decide when to load it).",
    content: `## My Skill

Full instructions for the model go here...`,
    // alwaysOn: true,  // Only set this if the skill is needed on EVERY request
},
```

That's it. The skill is automatically registered and available.

### `alwaysOn` Flag

| Value | Behavior |
| --- | --- |
| `true` | Full content included in system prompt on every request (e.g. artifacts, generative-ui) |
| `false` / omitted | Only name + description shown in catalog; model calls `loadSkill` tool when needed |

Use `alwaysOn: true` only for skills the model needs constantly. Everything else should be lazy-loaded.

### Skill File Locations

| File | Purpose |
| --- | --- |
| `apps/frontend/lib/ai/skills/registry.ts` | Single source of truth for all skills |
| `apps/frontend/lib/ai/tools/load-skill.ts` | Tool the model calls to load a skill at runtime |
| `apps/frontend/lib/ai/prompts.ts` | Builds system prompt using `buildAlwaysOnPrompt()` + `buildSkillCatalog()` |

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
