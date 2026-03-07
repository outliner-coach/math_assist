# Shared Contracts

Use this page when a change crosses workstream boundaries.

## High-conflict files

- `src/lib/types.ts`
- `src/lib/problem-generator.ts`
- `src/lib/session.ts`
- `public/data/concepts.json`
- `public/data/templates/*.json`

## Update rule

When you change a high-conflict file, add a short dated note below:

- date
- file
- what changed
- what dependent workstreams should re-check

## Notes

- 2026-03-07: collaboration structure added. No runtime contract changed in this step.
- 2026-03-07: `src/lib/types.ts`, `src/lib/session.ts`
  action-centered retry loop added with `PracticeSession.mode`, retry source metadata,
  `SubmissionResult.problem` snapshots, `SessionResult.wrongCount`, and local progress summaries.
  Re-check learning loop UI, result rendering, and any tests that assume fixed 10-question sessions.
- 2026-03-07: `public/data/templates/commonden.json`
  commonden prompt copy now shows the actual fractions and target common denominator with KaTeX-friendly notation.
  Re-check any content tests or screenshots that assume the old plain-text prompt wording.
- 2026-03-07: `src/lib/problem-generator.ts`, `public/data/templates/fracadd.json`, `public/data/templates/fracsub.json`, `public/data/templates/fracmul.json`
  session generation now rejects duplicate rendered prompts inside one 10-problem set, and fraction templates were reworded/re-leveled so prompt clarity and difficulty gates pass.
  Re-check any flows or snapshots that depend on prior prompt copy or assume duplicate wording can appear in one session.
