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

## Watch-outs

- Changes here often affect tests and result UI.
- Any new field shape must be coordinated through `src/lib/types.ts`.
