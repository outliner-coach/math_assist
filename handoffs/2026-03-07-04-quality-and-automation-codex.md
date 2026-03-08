## What changed

- Added a reusable problem-quality evaluation core for strict template validation and broader quality auditing.
- Added `npm run audit:problems`, which writes JSON/Markdown reports under `out/quality/`.
- Added prompt-quality and difficulty-signal checks so agents can spot ambiguous prompts and weak difficulty ordering without manual browsing.
- Documented the workflow in `docs/problem-quality-evaluation.md`.
- Added a deterministic `promptfoo` gate (`npm run promptfoo:problems`) with 601 local checks across template validation, prompt clarity, session quality, and difficulty progression.
- Updated fraction templates and session generation so the current quality bar is `0 errors / 0 warnings` in the audit report and `601/601` passes in `promptfoo`.
- Verified the full local gate on 2026-03-07: `npm test`, `npm run lint`, `npm run build`, `npm run validate:templates`, `npm run audit:problems`, `npm run promptfoo:problems`.
- Added `/review/problems`, a static review page that renders one deterministic sample per template with concept, set, difficulty, answer type, choices, and correct answer visible at once.
- Redesigned `/review/problems` into a polished card/table review surface with sticky filters, quick concept anchors, and stronger visual hierarchy for prompt/answer inspection.
- Reworked `src/components/MathText.tsx` to render KaTeX synchronously during SSR/SSG so prompts are visible in exported pages and review surfaces before hydration.
- Added a regression test for `MathText` server rendering.

## Current risk

- Difficulty scoring is still heuristic, so future content additions can fail the progression gate even when the math is correct.
- `promptfoo` uses a local custom provider class; if the CLI upgrades its JS provider contract, the provider may need a quick compatibility check.
- The review board renders all 450 samples at once, so any large future increase in template count may need pagination or windowing.

## Next suggested step

- For any new or edited template, run `npm run validate:templates`, `npm run audit:problems`, and `npm run promptfoo:problems` before touching learner-facing UI.
- If a concept intentionally bends the difficulty heuristic, document the rationale in handoff or PR notes before relaxing the gate.
- The next valuable extension is adding a semantic review layer for age-appropriateness and wording naturalness on top of the current deterministic gates.
- Use `/review/problems` first for manual inspection before opening individual concept practice pages when checking wording regressions.
- If the static export path changes, re-check `MathText` on an exported page first because prompt visibility now depends on server-rendered KaTeX markup rather than client-only hydration.
