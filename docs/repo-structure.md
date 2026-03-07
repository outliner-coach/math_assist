# Repository Structure

## Why this structure

The current app is still compact. A full source refactor into a new feature tree would touch most files and slow parallel work. Instead, this repository now adds coordination layers around the existing code:

- `references/` for research and product benchmarks
- `workstreams/` for clear parallel ownership
- `handoffs/` for async agent-to-agent updates

This keeps runtime code stable while making concurrent work less collision-prone.

## Code Layout

- `src/app/`: route-level pages and page-specific clients
- `src/components/`: presentational and reusable UI
- `src/lib/`: domain rules and shared runtime logic
- `public/data/`: curriculum content, concept copy, and problem banks
- `scripts/`: validation scripts for problem quality
- `e2e/`: browser tests

## Collaboration Layout

- `references/`: external sources, benchmark notes, and distilled insights
- `workstreams/01-content-and-curriculum/`: templates, concepts, and explanation quality
- `workstreams/02-learning-loop/`: mastery, feedback, retry loops, and progress UX
- `workstreams/03-ui-and-visuals/`: design system, layout, and motivation-focused presentation
- `workstreams/04-quality-and-automation/`: tests, validation, CI, and release reliability
- `workstreams/_shared/`: shared contracts and coordination notes
- `handoffs/`: short dated notes for parallel agents

## Boundary Guidance

To reduce merge conflicts, prefer this split:

- Content-heavy changes: `public/data/**`, `scripts/validate-templates.js`
- Practice/result flow changes: `src/app/practice/**`, `src/app/result/**`, `src/lib/session.ts`
- Visual/interaction changes: `src/components/**`, `src/app/globals.css`, `src/app/concept/**`
- Quality/CI changes: `e2e/**`, `src/lib/*.test.ts`, `.github/workflows/**`

## Shared Contracts

Some files affect all workstreams and should change only when necessary:

- `src/lib/types.ts`
- `src/lib/problem-generator.ts`
- `public/data/concepts.json`

When one of these changes, update `workstreams/_shared/README.md` so other agents can rebase their work with the right assumptions.
