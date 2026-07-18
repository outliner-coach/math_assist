# Grade 5 quality upgrade handoff

## What changed

- Added `area-001` as an applied concept under the existing Grade 5
  `다각형의 둘레와 넓이` unit.
- Added 30 balanced templates under `public/data/templates/area.json`.
- Extended the shared problem contract with evaluated visual templates.
- Added five dynamic SVG geometry renderers that omit answer-only values.
- Added a pointer-based temporary scratch pad to the shared practice route.
- Added focused generator, curriculum, renderer, and scratch-pad tests.

## What is still risky

- The existing template evaluator uses a narrow arithmetic expression engine;
  future geometry models that need conditional constraints should add explicit
  deterministic helpers rather than JavaScript conditions in JSON.
- The scratch pad intentionally resets on problem navigation and orientation
  resize. Persisting sketches within a session would require a separate,
  explicitly bounded in-memory design.
- The current SVGs are schematic and not drawn to mathematical scale. Labels,
  not apparent pixel proportions, are the source of truth.

## What the next agent should do

- Preserve the `visual_template` answer-masking rule when adding new models.
- Keep each Grade 5 set at 4 easy / 4 medium / 2 hard and rerun all three problem
  quality commands after template edits.
- Recheck the shared practice layout at 1024x768 and a narrow mobile width after
  changing `ProblemCard`, `ScratchPad`, or the fixed navigation.
