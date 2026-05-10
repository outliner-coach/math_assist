# Math Assist Collaboration Guide

This repository is small enough that a large code move would create more merge risk than value. For parallel work, keep the product code where it is and coordinate through explicit workstreams, references, and handoffs.

## Build Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npm run test      # Run unit tests (Vitest)
npm run test:e2e  # Run E2E tests (Playwright)
npm run harness -- <phase-dir>  # Run Codex harness phase
npm run tdd:guard # Run the changed-file TDD gate
```

## Project Overview

Korean elementary math learning web app for a non-commercial personal project. Students select concepts, read explanations, complete 10-question practice sets, then receive automatic grading with step-by-step solutions.

## Architecture Principle

**Hybrid: Deterministic Core + AI Assist**

- Answer calculation and grading must be deterministic and rule-based.
- AI is only for natural-language hints or feedback.
- Grading is binary: correct or incorrect only. Do not add partial credit unless the product requirements explicitly change.

## TDD Gate

`AGENTS.md` is guidance; `.codex/hooks/tdd-guard.sh` is the enforcement point. Any harness step that changes production files under `src/**` or `public/data/**` must also add or update a focused test file in the same step. The hook denies production-only changes before the normal lint/build/test checks run.

Use `TDD_GUARD_ALLOW_NO_TEST=1` only for an explicitly reviewed maintenance change where a test is not meaningful.

## Tech Stack

- **Frontend/Backend**: Next.js + Tailwind CSS
- **Data**: Static JSON files in `public/data/`; no database
- **Session**: Client localStorage only; no server storage
- **Hosting**: Vercel
- **Math rendering**: KaTeX for fractions and mixed numbers

## Repo Map

- `src/app/`: route-level UI and client entry points
- `src/components/`: reusable UI building blocks
- `src/lib/`: domain logic, generators, grading, persistence, shared types
- `public/data/`: curriculum content and problem templates
- `scripts/`: validation and maintenance scripts
- `e2e/`: end-to-end coverage
- `docs/`: project docs and structural notes
- `phases/`: Codex harness task plans and execution state
- `references/`: external research, benchmarks, and design evidence
- `workstreams/`: parallel work boundaries and ownership notes
- `handoffs/`: short async updates between agents

## Product Constraints

- Supported answer inputs are multiple choice and number input.
- Number input must normalize integers, decimals, fractions, and mixed numbers.
- Fractions such as `2/4` should normalize to lowest terms.
- Mixed numbers such as `1 1/2` should convert to improper fractions internally.
- The UI target is tablet-first with large touch targets and one problem per screen.
- Geometry problems should generate SVG dynamically in React components; answers remain number or multiple choice.

## API Surface

- `GET /api/units`
- `GET /api/units/:id/concepts`
- `GET /api/concepts/:id`
- `POST /api/practice/start`
- `POST /api/practice/:sessionId/submit`
- `GET /api/practice/:sessionId`
- `POST /api/ai/hint`

## Session Management

- Store sessions in localStorage for recovery.
- Sessions expire after 2 hours.
- Network errors should expose a retry path and preserve localStorage backup where possible.

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
