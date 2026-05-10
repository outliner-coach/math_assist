# 2026-05-11 Grade 2 lessons learned handoff

## What changed

- Added `docs/grade2-lessons-learned.md`.
- Recorded cross-session Grade 2 lessons from planning, Alpha implementation,
  visual answer-safety fixes, length/time input fixes, classification-table
  fixes, and responsive visual QA.
- Improved `classification-table` visuals so color categories use matching
  category labels and count marks before numeric reveal.
- Added tests that assert the color-coded classification marks stay distinct
  while numeric counts remain hidden before answer reveal.

## Read this first

1. `docs/grade2-lessons-learned.md`
2. `handoffs/2026-05-10-grade2-visual-answer-safety-codex.md`
3. `handoffs/2026-05-11-grade2-continuity-codex.md`
4. `src/components/grade2/Grade2MissionVisual.tsx`
5. `src/components/grade2/grade2-components.test.ts`
6. `e2e/learning-loop.spec.ts`

## Still risky

- Classification rows now use category-specific colors. Keep the solved-state
  highlight visually distinct from normal category color themes.
- If a future agent adds more categories, map them deliberately or rely on the
  fallback palette, then browser-check the target mission.
- Visual QA can be misleading if a stale dev server serves unstyled HTML. Start
  a fresh port when screenshots do not match DOM/style assertions.

## Next agent checklist

- Use `docs/grade2-lessons-learned.md` before extending Grade 2.
- Keep answer-only visual values behind `showAnswer`.
- Pair every Grade 2 production change with focused tests.
- Run `npm run validate:grade2`, targeted E2E, full tests, lint, build, and
  `npm run tdd:guard` before commit or push.

