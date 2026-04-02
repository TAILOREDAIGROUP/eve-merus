# TAG Operating System — Global CLAUDE.md

You are working for Tony Galente, founder of Tailored AI Group. Tony builds AI-powered products for non-technical business owners. This file governs all Claude Code sessions across all projects.

## Skills Library

36 custom skills are installed at ~/.claude/skills/. Check them before starting any task. Key routing:

**New builds:** Use /idea-to-shipped for intake, then /vertical-slice-builder for execution.
**Quality gates:** Run /production-grade-guardian before shipping anything.
**Session management:** Use /session-anchor before ending any session or when context gets long. Declare mode at session start: RESEARCH (gather info, output compressed artifacts) or EXECUTION (build from existing specs, no research mid-session).
**Client diagnostics:** Use /machine-first-ops-diagnostic for any prospect or client analysis.
**Content production:** Use /the-armorer for any content asset. Use /attention-architect to review outward-facing communication.
**Outreach and sales:** Use /the-hunter for prospect research and outreach sequences.
**Security review:** Use /ai-security-architect and /zero-trust-guardian before deploying any client-facing system.
**Frontier model changes:** Use /frontier-model-readiness as the entry point for any model evaluation.

## Token Discipline (Five Commandments)

These are non-negotiable for every session:

1. **Index references.** Never dump full documents into context. Extract relevant sections. Convert all reference docs to markdown first.
2. **Pre-process context.** Documents arrive ready to be used, not ready to be read. Pre-summarize, pre-chunk.
3. **Cache stable context.** This CLAUDE.md, all .claude/rules/ files, system prompts, and tool definitions should be cached. 90% discount on cache hits.
4. **Scope minimum context.** Each task gets only what it needs. A planning task doesn't need the full codebase. An editing task doesn't need the project roadmap.
5. **Measure what you burn.** After each session, note approximate token usage and model mix if possible.

## Model Routing

Use the cheapest model that gets the job done:
- **Opus/frontier:** Architectural decisions, complex debugging, security review, spec generation
- **Sonnet:** Code implementation, feature building, test writing, most execution work
- **Haiku:** Formatting, linting, simple refactors, boilerplate generation

Default to Sonnet. Escalate to Opus only when the task requires deep reasoning.

## Build Protocol

- Tony specs in the morning (6-8 AM). CLI runs autonomously. Tony reviews at midday (12-12:30 PM).
- One build at a time. No context switching across products.
- Every session ends with CLAUDE.md updated for the project.
- Build in vertical slices: write, test, verify each piece before moving to the next.
- Never move forward on broken ground.

## Tech Stack Defaults (unless project overrides)

Next.js, Supabase, Stripe, Cloudflare Workers, OpenRouter (where AI is needed), Clerk (auth when not using Supabase auth).

## Code Quality Rules

- TypeScript strict mode, no `any` types
- Every API route validates input with Zod
- Every database query uses RLS (Row Level Security)
- Tests written alongside implementation, not after
- No hardcoded secrets. Ever. Use environment variables.
- If you see a secret or credential in chat or code, flag it immediately and require rotation.

## Communication Style

- Direct, no fluff
- Explain WHY behind architectural choices (Tony learns while building)
- Flag the 10% that needs human input as [HUMAN INPUT NEEDED]
- If Tony is doing work the machine should handle, challenge him
- No em dashes. Use commas, colons, or restructure.

## Anti-Patterns

- Do not babysit Tony through obvious steps. Execute autonomously, report results.
- Do not mix research and execution in the same session.
- Do not load tools or context you don't need for the current task.
- Do not generate code without tests.
- Do not proceed past a failing test. Fix it first.

---

# EVE Merus: Project-Specific Context

## What This Is
AI Skills Library Optimization Engine. Manages skill libraries, runs test-based scoring, detects collisions, and optimizes skill descriptions for routing accuracy.

## Auth Architecture (added 2026-04-02)
- Supabase Auth via @supabase/ssr with cookie-based sessions
- Middleware at src/middleware.ts handles session refresh, auth gating, security headers, CSP nonce
- requireAuth() helper at src/lib/auth/requireAuth.ts for API routes
- All 17 API routes require authentication (except /api/health)
- Login/signup pages at src/app/login and src/app/signup
- Public routes: /, /login, /signup, /api/health, /auth/callback

## RLS Architecture
- user_id column on libraries table (root entity)
- All 10 tables have RLS enabled
- Child tables (skills, test_sets, etc.) scoped through library ownership via subquery policies
- Migration: supabase/migrations/20260402000000_add_auth_and_rls.sql

## Supabase Client Pattern
- getSupabaseClient() in src/lib/supabase.ts is ASYNC (returns server client via cookies)
- getServiceClient() is separate, explicit, only for admin operations
- No service role key fallback
- db.ts functions all use await getSupabaseClient()

## Monitoring
- Sentry configs at project root (sentry.*.config.ts)
- Structured logger at src/lib/logger.ts
- Health check at /api/health (public, checks DB connectivity)
- Docker healthcheck configured

## Key Files
- src/middleware.ts: Auth + security headers
- src/lib/supabase.ts: Client factory (async server client + service client)
- src/lib/auth/requireAuth.ts: API route auth enforcement
- src/lib/db.ts: All database operations (async, RLS-scoped)
- src/lib/logger.ts: Structured logging

## Environment Variables Required
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (required)
- SUPABASE_SERVICE_ROLE_KEY (server-only, admin ops)
- NEXT_PUBLIC_SENTRY_DSN, SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT

## Test Pattern
- All API tests mock requireAuth to return { user: { id: 'user-uuid-123' } }
- See __tests__/fixtures/auth-mock.ts for shared mock helper
- 36 test files total. Do NOT run vitest locally (Node 24 + Windows timeout issue).

## Last Session: 2026-04-02
- Added complete Supabase Auth stack from scratch
- Added RLS on all 10 tables
- Added Sentry, structured logging, health check
- Added CI/CD (.github/workflows/ci.yml)
- Fixed all 5 blockers, 6 majors, 4 minors from QA audit
- Post-fix report: E:\EVE OS\qa-output\eve-merus-fix-report.md
