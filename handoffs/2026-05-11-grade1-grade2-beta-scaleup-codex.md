# 2026-05-11 Grade 1/2 Beta scale-up handoff

## What changed

- Expanded Grade 1 adventure content from 24 Alpha templates to 60 Beta templates in `src/lib/grade1-problems.ts`.
- Expanded Grade 2 adventure content from 36 Alpha templates to 72 Beta templates in `src/lib/grade2-problems.ts`, with 6 missions per unit.
- Added `npm run audit:missions` through `scripts/mission-bank-quality-report.js` and `scripts/mission-bank-quality-core.js`.
- Added mission-bank audit coverage in `src/lib/mission-bank-quality-audit.test.ts`.
- Updated Grade 1/2 UI copy so Beta volume is dynamic instead of Alpha-fixed.
- Added a two-click confirmation state for `진행 초기화` in Grade 1 and Grade 2.
- Updated Grade 2 mission progress display from fixed `/3` to dynamic `missionCount`.
- Extended E2E coverage for Grade 2 mission count and visual answer-safety regressions.
- Updated related planning and quality docs:
  - `docs/grade1-adventure-scaleup.md`
  - `docs/grade2-lessons-learned.md`
  - `docs/problem-quality-evaluation.md`
  - `phases/grade2-adventure-beta/index.json`

## Verification

Automated gates passed after the Beta expansion:

- `npm run validate:grade1`
- `npm run validate:grade2`
- `npm run audit:missions`
- `npm run test`
- `npm run lint`
- `npm run build`
- `PLAYWRIGHT_PORT=3111 npm run test:e2e`
- `npm run tdd:guard`

Browser QA was run against `http://localhost:3123/math_assist/grade/1/` and `http://localhost:3123/math_assist/grade/2/`.

Checked flows:

- Grade 1 mobile map and mission screen show the 60-mission Beta copy without overlap.
- Grade 2 unit selection shows 6 missions per unit.
- Grade 2 length mission layout was checked at desktop, tablet, and mobile widths.
- Grade 2 addition/subtraction mission was checked through wrong answer, hint, correct answer, reward, and next mission.
- Grade 2 vertical-operation visual keeps the result hidden as `□` before submit and reveals the result only after success.

## Still risky

- The 60/72 mission banks are Beta breadth, not mastery-level repetition.
- The audit is deterministic and catches structural/content risks, but it does not replace educator review of every new prompt.
- `out/` and `output/` remain generated verification artifact folders and should stay uncommitted.

## Next agent should do

- Keep `npm run audit:missions` in the required gate whenever Grade 1/2 mission banks change.
- Add a dated handoff if any warning is intentionally allowed by changing the audit.
- Keep Grade 2 unit-first navigation and Grade 1 map-first navigation unless product direction changes.
- Prefer adding new visual models only with unsolved/solved reveal tests.
