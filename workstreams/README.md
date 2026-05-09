# Workstreams

Each subfolder defines one parallel lane of work. The goal is to let multiple agents move at the same time without colliding in the same files.

## Current lanes

- `01-content-and-curriculum/`
- `02-learning-loop/`
- `03-ui-and-visuals/`
- `04-quality-and-automation/`
- `_shared/`

## Current cross-lane initiative

- Grade 1 Adventure Scale-up: see `docs/grade1-adventure-scaleup.md` and
  `phases/grade1-adventure-scaleup/`.
- Coordination lane: `_shared/`.
- Implementation lanes:
  - content bank and deterministic problem contract: `01-content-and-curriculum/`
  - stage progress and review flow: `02-learning-loop/`
  - map, mission card, and visual renderers: `03-ui-and-visuals/`
  - validator, unit tests, and E2E coverage: `04-quality-and-automation/`

## How to use

1. Choose one lane before starting.
2. Read that lane's README.
3. Keep changes inside the listed primary files when possible.
4. If a shared contract changes, update `_shared/README.md`.
