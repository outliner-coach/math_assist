# Grade 5 Geometry Handoff

## What changed

- Added the missing perimeter/area, congruence/symmetry, and cuboid/net units.
- Added 180 templates across six concepts, with 20 distinct problem families
  per unit, three 10-template sets per concept, and a 4/4/2 difficulty mix.
- Added a shared SVG geometry contract and renderer with answer reveal gating.
- Added deterministic geometry helpers, visual-template resolution, quality
  audit rules, focused tests, and a geometry browser E2E flow.
- Added a reproducible content generator and implementation documentation.

## What is still risky

- The geometry figures are schematic rather than drawn to a guaranteed real
  scale; labels are the source of truth for calculations.
- New visual kinds or answer-only fields must extend both the discriminated
  visual type and the pre-submit reveal regression tests.

## What the next agent should do

- Preserve the rule that prompts, answers, and SVG labels resolve from the same
  deterministic parameters.
- Run `npm run generate:grade5-geometry` after modifying the generator, then
  run the strict audit and focused renderer tests before committing data.
- Keep all answer-only visual values behind `showAnswer` and add a renderer or
  E2E regression whenever that reveal contract changes.
