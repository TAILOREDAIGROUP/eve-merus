# EVE Merus — AI Skills Library Optimizer

## What This Is

EVE Merus automates a proven methodology for optimizing AI skills libraries.
The methodology was validated manually on a 46-skill library:
- Routing accuracy: 53% → 100%
- Collision rate: 43% → 0%
- 17 targeted optimizations applied and verified

This software automates what we already know works.

## Tech Stack

- **Framework**: Next.js 15 + TypeScript (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Testing**: Vitest + Testing Library
- **Deployment**: DigitalOcean or Cloudflare Pages

## Project Structure

```
src/
  app/                    # Next.js App Router pages + API routes
    api/                  # API route handlers
    library/              # Library management pages
    tests/                # Golden test set pages
    scoring/              # Routing scorer pages
    dashboard/            # Health dashboard
    optimizer/            # Optimization loop pages
  lib/                    # Core business logic (framework-agnostic)
    ingester.ts           # SKILL.md parser
    scorer.ts             # Routing scorer engine
    collision.ts          # Collision detection
    optimizer.ts          # Optimization loop runner
    health.ts             # Library health calculator
    supabase.ts           # Supabase client
  components/             # React components
  types/                  # TypeScript type definitions
__tests__/                # All tests
```

## Database Tables

- **libraries** — A skills library (name, description, created_at)
- **skills** — Individual skills (library_id, name, description, trigger_phrases, content, token_count, line_count)
- **test_sets** — Golden test sets (library_id, name, description)
- **test_cases** — Individual test requests (test_set_id, request_text, expected_skill, expected_supporting, should_not_trigger, difficulty, cluster_tag)
- **scoring_runs** — Results of scoring a test set against a library (library_id, test_set_id, accuracy, collision_rate, timestamp)
- **scoring_results** — Per-test-case results (run_id, test_case_id, triggered_skill, result_type: correct|collision|wrong|miss)
- **optimization_runs** — An optimization session (library_id, test_set_id, status, started_at, completed_at)
- **experiments** — Individual optimization experiments (run_id, skill_id, change_type, old_description, new_description, accuracy_before, accuracy_after, kept)

## Vertical Slice Build Plan

Each slice is independently testable. Order follows dependency chain.

### Phase 1: Data Foundation

**Slice 1 — Skill File Parser**
Parse SKILL.md files with YAML frontmatter. Extract name, description, trigger phrases, content.
Return typed SkillData objects. Pure function, no DB.
Tests: Parse valid files, handle missing frontmatter, handle empty files.

**Slice 2 — Supabase Client + Schema Migration**
Set up Supabase client. Create SQL migration for all tables.
Tests: Client initializes, migration file is valid SQL.

**Slice 3 — Library CRUD API**
API routes: POST /api/libraries (create), GET /api/libraries (list), GET /api/libraries/[id] (detail), DELETE /api/libraries/[id].
Tests: Create, read, list, delete libraries.

**Slice 4 — Skill Storage API**
API routes: POST /api/libraries/[id]/skills (bulk import parsed skills), GET /api/libraries/[id]/skills (list).
Tests: Import skills, list skills, token/line counts calculated.

**Slice 5 — Library Import Flow (Ingester End-to-End)**
Upload UI: paste or upload SKILL.md files → parse → create library → store skills.
Combines Slices 1 + 3 + 4 into a working flow.
Tests: End-to-end import from file content to stored skills.

### Phase 2: Testing Infrastructure

**Slice 6 — Test Case Types + Validation**
Define TestCase type. Validate required fields. Difficulty levels: easy, medium, hard.
Cluster tags for grouping. Import/export as JSON.
Tests: Validation accepts good data, rejects bad data.

**Slice 7 — Test Set CRUD API**
API routes: POST /api/test-sets, GET /api/test-sets, GET /api/test-sets/[id].
POST /api/test-sets/[id]/cases (add cases), GET /api/test-sets/[id]/cases.
Tests: CRUD operations, JSON import/export.

**Slice 8 — Test Set Management UI**
Page to create/edit test sets. Add/edit/delete test cases.
Import JSON button. Export JSON button.
Tests: Component renders, form validation works.

### Phase 3: Scoring Engine

**Slice 9 — Description Matcher (Core Algorithm)**
Given a request string and a list of skill descriptions, score each skill's relevance.
Use keyword overlap, phrase matching, and TF-IDF-style weighting.
Return ranked list of matched skills with confidence scores.
Tests: Known requests match expected skills, edge cases handled.

**Slice 10 — Routing Scorer**
Takes a test set + skills library. Runs matcher on each test case.
Classifies results: correct, collision, wrong, miss.
Produces: routing accuracy %, collision rate %, per-case results.
Tests: Score a known test set, verify accuracy calculation.

**Slice 11 — Scoring Run API + Storage**
API: POST /api/scoring/run (execute scoring run), GET /api/scoring/runs (list runs).
GET /api/scoring/runs/[id] (run detail with per-case results).
Store results in scoring_runs + scoring_results tables.
Tests: Run scores and stores, results retrievable.

**Slice 12 — Scoring Results UI**
Page showing scoring run results. Summary stats at top.
Per-case result table: request, expected, actual, result type.
Filter by result type (show only misses, show only collisions).
Tests: Component renders with mock data.

### Phase 4: Collision Detection

**Slice 13 — Collision Detector Algorithm**
Compare all skill description pairs. Calculate keyword overlap %.
Produce ranked list of collision pairs. Identify shared trigger phrases.
Tests: Known overlapping descriptions detected, non-overlapping score 0.

**Slice 14 — Collision Heatmap UI**
Visual matrix showing collision intensity between all skill pairs.
Click a cell to see shared keywords. Sort by overlap %.
Tests: Component renders, data transforms correctly.

### Phase 5: Dashboard

**Slice 15 — Health Score Calculator**
Combine metrics into single 0-100 score:
- Routing accuracy (weighted 40%)
- Collision rate inverted (weighted 30%)
- Dead skills penalty (weighted 15%)
- Bloat penalty (weighted 15%)
Tests: Perfect library scores 100, degraded library scores lower.

**Slice 16 — Library Health Dashboard**
Single-page dashboard: Health Score, routing accuracy, collision rate,
dead skills list, bloated skills list, total description token budget.
Auto-refreshes after optimization runs.
Tests: Dashboard renders all sections.

### Phase 6: Optimization Engine

**Slice 17 — Optimization Proposer**
Given worst-performing routes, propose description changes.
Strategies: add missing trigger phrases, remove ambiguous keywords,
sharpen distinctions between colliding skills.
Tests: Proposals generated for known problem cases.

**Slice 18 — Experiment Runner**
Apply a proposed change, re-run scorer, compare before/after.
Keep improvement, revert regression. Log to experiments table.
Tests: Improvement kept, regression reverted.

**Slice 19 — Optimization Loop API**
API: POST /api/optimizer/run (start optimization loop).
GET /api/optimizer/runs/[id] (status + experiment log).
Runs N iterations, stops when no more improvements found.
Tests: Loop runs, experiments logged, results stored.

**Slice 20 — Optimization Results UI**
Page showing optimization run progress. Experiment log table:
skill changed, before/after accuracy, kept/reverted.
Summary: total improvements, final accuracy, final collision rate.
Tests: Component renders experiment log.

**Slice 21 — Results Export (TSV)**
Export optimization experiments as results.tsv.
Columns: experiment_id, skill, change_type, accuracy_before, accuracy_after, kept.
Tests: TSV format correct, all experiments included.

### Phase 7: Polish

**Slice 22 — Navigation + Layout**
Sidebar navigation between all sections. Breadcrumbs.
Active library selector. Responsive layout.

**Slice 23 — Error Handling + Loading States**
Consistent error boundaries. Loading skeletons.
Toast notifications for actions. Optimistic UI where appropriate.

**Slice 24 — Deployment Configuration**
Environment variables for Supabase. Build optimization.
Dockerfile or deployment config for DigitalOcean.

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests (single run)
npm run lint         # ESLint
```

## Rules

- Tests for every slice
- MVP first, no over-engineering
- Each slice independently testable and deployable
- Keep business logic in src/lib/ (framework-agnostic, easy to test)
- Keep UI in src/components/ and src/app/
