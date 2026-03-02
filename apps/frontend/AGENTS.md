# AGENTS.md

This document provides guidelines for AI agents working on this codebase.

## Project Overview

This is a Next.js 16 AI chatbot application using React 19, TypeScript, Tailwind CSS, Drizzle ORM, and NextAuth. The project uses Ultracite (Biome-based) for linting and formatting.

## Build Commands



```bash
# Development
pnpm dev                    # Start dev server with turbo
pnpm build                  # Run DB migrations then production build
pnpm start                  # Start production server

# Database
pnpm db:generate            # Generate Drizzle migrations
pnpm db:migrate             # Run migrations
pnpm db:push                # Push schema changes
pnpm db:studio              # Open Drizzle Studio
pnpm db:check               # Check DB consistency

# Linting & Formatting
pnpm lint                   # Run Ultracite check
pnpm format                 # Run Ultracite fix

# Testing
pnpm test                   # Run Playwright tests (requires dev server)
npx playwright test                    # Run all tests
npx playwright test e2e/chat.test.ts  # Run single test file
npx playwright test --project=e2e     # Run e2e project specifically
```

## Code Style Guidelines

### General Rules
- Use `pnpm format` before committing to auto-fix lint/format issues
- Follow rules in `.cursor/rules/ultracite.mdc` (Ultracite rules)
- Biome config extends `ultracite/biome/core`, `ultracite/biome/next`, `ultracite/biome/react`

### TypeScript
- Enable `strict: true` in tsconfig.json
- Use explicit types; avoid `any`
- Use `import type` for type-only imports
- Use `export type` for type exports
- No TypeScript enums; use object maps or union types
- No namespaces; prefer modules
- No `@ts-ignore` directives

### React Components
- Client components must have `"use client"` at the top
- Define components at module scope, not inside other components
- Use `<>...</>` fragments instead of `<Fragment>`
- Include `key` props in lists (avoid array indices when possible)
- Hooks must be called at the top level of component functions
- Dependencies in `useEffect`/`useCallback` must be complete

### Naming Conventions
- Components: PascalCase (e.g., `MessageEditor`)
- Hooks: camelCase with "use" prefix (e.g., `useMessages`)
- Utilities: camelCase (e.g., `sanitizeText`)
- Types/Interfaces: PascalCase (e.g., `ChatMessage`)
- Constants: SCREAMING_SNAKE_CASE for config values

### Imports
- Use `@/*` alias for internal imports (configured in tsconfig.json)
- Group imports: React → external → internal → types
- Use named imports where possible

### Styling
- Use Tailwind CSS with `cn()` utility for conditional classes
- `cn` is exported from `@/lib/utils` combining `clsx` and `tailwind-merge`

### Error Handling
- Use `try/catch` with proper error types
- Throw `Error` instances, not primitive values
- Include error messages when throwing errors
- Use `ChatSDKError` for domain-specific errors (see `@/lib/errors`)

### Accessibility (Critical)
- No `accessKey` attributes
- No `aria-hidden` on focusable elements
- ARIA roles only on elements that support them
- All images need alt text (no "image"/"photo" in alt)
- Labels must have text content
- Buttons need `type` attribute
- Anchors must be navigable
- Interactive elements need `tabIndex`

### Testing (Playwright)
- Tests located in `tests/e2e/`
- Use `testMatch: /e2e\/.*.test.ts/` pattern
- No `test.only` or `describe.only`
- Use Page Object pattern via `tests/pages/`
- Helper utilities in `tests/helpers.ts`

### What NOT to Use
- `var`; use `const`/`let`
- `console.log`; use proper logging
- `any` type
- TypeScript enums/const enums
- Namespace declarations
- `@ts-ignore`
- `delete` operator
- `with` statements
- Bitwise operators (in most cases)
- Array index as keys
- Components inside components

### File Organization
- Components: `components/` with feature subfolders
- Hooks: `hooks/`
- Utilities: `lib/`
- App routes: `app/(chat)/`, `app/(auth)/`
- Artifacts: `artifacts/`
- Tests: `tests/e2e/`
