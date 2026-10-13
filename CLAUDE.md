@AGENTS.md

# Guide for Claude

Next.js (App Router) app + TypeScript + Tailwind v4 + shadcn/ui. The backend is Route Handlers / Server Actions; data and sign-in use Supabase (Postgres + Auth). The UI is bilingual (Vietnamese is the default locale, English is also available).

## Common commands
- `npm run dev` — run dev (http://localhost:3000)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint (also enforces architecture boundaries)
- `npm test` / `npm run test:watch` — Vitest
- `npm run test:coverage` — tests + coverage thresholds
- `npm run specs:check` — every AC in `specs/` must have a test carrying the AC code
- `npm run check` — typecheck + lint + coverage + specs:check (quality gate)
- `npm run build` — production build (must pass before reporting done)
- `npx shadcn@latest add <component>` — add a shadcn/ui component

## Architecture (Clean Architecture, split by module)
Dependencies only point **inward**: `presentation → application → domain`. `infrastructure` implements the application ports.

```
src/
  core/                      errors.ts (AppError...), validate.ts — shared, plain TS
  modules/<feature>/
    domain/                  entities, value objects — import nothing but TS
    application/             use cases + ports (interfaces) + zod schemas — knows nothing of Next/Supabase
    infrastructure/          implements ports with Supabase (SupabaseXxxRepository)
  infrastructure/supabase/   client/server/admin/proxy/env — shared infrastructure
  server/container.ts        composition root: wires port ↔ implementation (the only one)
  lib/http.ts, action-error.ts   presentation helpers: AppError → HTTP status / form message
  app/                       presentation: pages, route.ts, Server Actions — THIN, only call use cases
  components/ui/             shadcn/ui
  proxy.ts                   Next.js 16 (replaces middleware): refreshes the session, blocks private routes
supabase/migrations/         numbered SQL 0001_...sql
```
Existing modules: `auth` (password + Google), `profile`, `greeting`, `writing` (sentence practice; prompts live in the database, sample data in `supabase/seed.sql`), `admin` (role check), `credits` (AI-grading balance, `spend_credits` RPC), `points` (10 per completed sentence in `profiles.points`, for a leaderboard; completions are written only by the server with the service role through `complete_sentence`); accepted answers per prompt (`prompt_answers`, admin-only; an exact match is graded without the AI); AI grading uses Gemini via `GEMINI_API_KEY` (`docs/ai-grading-setup.md`). Google sign-in dashboard setup: `docs/google-login-setup.md`. Alias `@/*` → `src/*`.

Boundaries are **enforced by ESLint** (`eslint.config.mjs`): domain/core import no framework or other layer; application imports no infrastructure/Next/Supabase; `src/app` imports no infrastructure (it goes through `getContainer()`).

## SDD + TDD workflow (mandatory for every feature/bug fix)
The spec is the source of truth, tests are the evidence. Details: `specs/constitution.md`, `.claude/rules/sdd.md`, `.claude/rules/tdd.md`.

```
/spec → (approve) → /plan → (approve) → /tasks → /implement (Red→Green→Refactor) → /verify
```
- `specs/NNN-ten/spec.md`: goals + acceptance criteria with codes `XXX-AC-NN` (Given/When/Then); no technology mentioned.
- Each AC needs at least one test with its code in the name: `it("AUTH-AC-02: ...")`. Manually verified AC are marked `` `manual` ``.
- No production code without a test that is red for the right reason. Bug fixes also start with a reproducing test.
- Behavior change → edit the spec **first**, tell the user, then tests/code. Do not guess at ambiguity: ask or write `[NEEDS CLARIFICATION]`.
- Use cases are tested with fake ports (`src/test/fakes.ts`); Supabase adapters get contract tests with a fake client.
- Never lower coverage thresholds or delete/skip tests to go green.

## Adding a feature
1. domain: entity (if any) → 2. application: port + use case + zod schema + **test** → 3. infrastructure: Supabase implementation → 4. wire into `server/container.ts` → 5. presentation: route/page/action calling the use case.
Skill: `/spec`, `/plan`, `/tasks`, `/implement`, `/add-feature`, `/add-api-route`, `/add-page`, `/add-db-migration`, `/verify`. Existing specs: `specs/README.md`.

## Clean code — mandatory conventions
- Use cases are functions taking dependencies as parameters (`signIn(auth, input)`), no singletons/globals; they take `unknown` and validate with `parseOrThrow(schema, input)`.
- Errors: throw `AppError` (`ValidationError`, `UnauthorizedError`, `NotFoundError`, `InfrastructureError`); no ambiguous error codes/`null` returns. Presentation wraps with `handle(...)` (routes) or `toActionError` (forms) — no scattered `try/catch`, no leaking internal errors to the client.
- Domain uses its own types (camelCase, `Date`), not DB rows/DTOs; mapping lives in infrastructure.
- Small single-purpose functions with intention-revealing names; no comments that repeat the code, comment only the "why".
- No `any`, no `!` on external data; no magic strings (use constants/error `code`s).
- Every new use case needs a unit test with fake ports (see existing `*.test.ts`) — no real Supabase needed.

## Next.js / Supabase conventions
- Next.js 16 differs from older versions: read `node_modules/next/dist/docs/` before using an API you are unsure of. `cacheComponents: true`, so accessing `cookies()`/dynamic data outside `<Suspense>` breaks the build.
- Server-side auth always uses `getUser()` (never `getSession()`).
- Every redirect driven by an external parameter (`next`, `redirect`...) must go through `safeNextPath()` (`src/lib/safe-redirect.ts`) to prevent open redirects. The app base URL comes from `getSiteUrl()`; never hard-code `localhost`.
- Every table in `public` must have RLS enabled and policies.
- Never read, print or commit `.env*`. New variable: add its name to `.env.example` (no real value). Client key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- Language: only `specs/` is written in Vietnamese; everything else (code, comments, docs, rules, skills, commits) is English. UI text lives in `messages/vi.json` and `messages/en.json`; Vietnamese is the default locale. See `.claude/rules/code-comments.md`.

## Before reporting done
Run `/verify` (`npm run check` + build). Not needed if only documentation changed.
