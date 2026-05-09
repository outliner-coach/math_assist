# Workstream 01 - Content and Curriculum

## Owns

- `public/data/concepts.json`
- `public/data/templates/*.json`
- `src/lib/math.ts`
- `src/lib/problem-generator.ts`
- `scripts/validate-templates.js`

## Focus

- explanation quality
- hint quality
- problem difficulty balance
- answer integrity
- curriculum alignment

## Typical tasks

- add or revise concept copy
- improve set A/B/C balance
- fix invalid or weak distractors
- tighten template parameter ranges
- add Grade 1 adventure mission templates under the shared contract

## Watch-outs

- Changes here often affect tests and result UI.
- Any new field shape must be coordinated through `src/lib/types.ts`.
- For Grade 1 scale-up, prefer `src/lib/grade1-problems.ts` first and avoid
  changing the Grade 5 `problem-generator.ts` unless `_shared/README.md` is
  updated in the same change.
