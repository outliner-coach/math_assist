# Workstream 03 - UI and Visuals

## Owns

- `src/components/**`
- `src/app/globals.css`
- `src/app/concept/**`
- route-level layout polish in `src/app/**`

## Focus

- child-friendly presentation
- visual aids
- motivation UI
- microcopy and tone
- responsive interaction polish

## Typical tasks

- redesign concept detail sections
- add progress and reward surfaces
- improve set selection UI
- refine typography, color, and spacing
- add Grade 1 visual renderers for counting grids, object groups, number cards,
  shape cards, clocks, and pattern strips

## Watch-outs

- Avoid changing generator or persistence logic unless coordinated with other lanes.
- If UI depends on new data fields, document that dependency in `_shared/README.md`.
- Grade 1 map and mission UI should remain in `src/components/grade1/**` unless a
  shared component is genuinely reusable outside the game.
- Grade 2 visuals must distinguish problem data from answer-only values. Renderers
  may use `visualConfig.result`, `target`, `product`, or equivalent labels after
  the learner solves or the solution path opens, but they should mask those values
  during the first attempt and cover the behavior with tests.
- Before changing `ScratchPad` or the shared practice surface, read
  `docs/scratch-pad-ipados-lessons-learned.md`. Keep the WebKit selection block,
  native non-passive capture listeners, single-pointer isolation, and live iPad
  verification checklist intact.
