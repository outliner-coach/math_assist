# Architecture

## Application Shape

Math Assist is a tablet-first Next.js application for Korean elementary math practice.
The app uses static curriculum data and deterministic grading logic. AI, if used, is
limited to optional natural-language hints or feedback.

## Directory Structure

```text
src/
├── app/          # Next.js routes, pages, and API route handlers
├── components/   # Reusable UI components
└── lib/          # Domain logic, generators, grading, persistence, and shared types

public/data/      # Static curriculum content and problem templates
e2e/              # Playwright end-to-end tests
scripts/          # Validation, quality, and harness automation scripts
docs/             # Project architecture and quality notes
references/       # Research, benchmarks, and source material
workstreams/      # Parallel work ownership boundaries
handoffs/         # Dated async handoff notes
phases/           # Harness task plans and execution state
```

## Core Rules

- Grading and answer normalization must be deterministic and rule-based.
- Static JSON in `public/data/` is the source of curriculum and template content.
- Practice session recovery uses browser localStorage; there is no server-side session store.
- UI changes should preserve the tablet-first target and large touch targets.
- Shared contracts such as `src/lib/types.ts`, `src/lib/problem-generator.ts`, and
  `public/data/concepts.json` should be changed deliberately and documented in
  `workstreams/_shared/README.md` when they affect other workstreams.

## Data Flow

```text
Static curriculum JSON
  -> concept/practice UI
  -> deterministic problem generation and grading in src/lib
  -> localStorage-backed practice state
  -> result and feedback screens
```

API routes may expose the same domain operations to the UI, but they should not move
grading authority to an AI service.
