# Math Assist Collaboration Guide

This repository is small enough that a large code move would create more merge risk than value. For parallel work, keep the product code where it is and coordinate through explicit workstreams, references, and handoffs.

## Repo Map

- `src/app/`: route-level UI and client entry points
- `src/components/`: reusable UI building blocks
- `src/lib/`: domain logic, generators, grading, persistence, shared types
- `public/data/`: curriculum content and problem templates
- `scripts/`: validation and maintenance scripts
- `e2e/`: end-to-end coverage
- `docs/`: project docs and structural notes
- `references/`: external research, benchmarks, and design evidence
- `workstreams/`: parallel work boundaries and ownership notes
- `handoffs/`: short async updates between agents

## Parallel Work Rules

1. Pick one workstream in `workstreams/` before editing code.
2. Stay inside that workstream's primary file boundaries when possible.
3. If you must edit a shared contract, document it in `workstreams/_shared/README.md` before or with the code change.
4. Save external research in `references/` instead of burying it in chat or commit messages.
5. Save cross-agent status or unblock notes in `handoffs/` using a dated filename.

## Shared Hotspots

These files are high-conflict areas and should be touched deliberately:

- `src/lib/types.ts`
- `src/lib/problem-generator.ts`
- `src/lib/session.ts`
- `public/data/concepts.json`
- `public/data/templates/*.json`
- `.github/workflows/*`

## Handoff Naming

Use this format for async notes:

- `handoffs/YYYY-MM-DD-workstream-agent.md`

Each handoff should state:

- what changed
- what is still risky
- what the next agent should do
