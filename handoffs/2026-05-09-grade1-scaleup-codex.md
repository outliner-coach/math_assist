# 2026-05-09 Grade 1 Scale-up Handoff

## What changed

- Added `docs/grade1-adventure-scaleup.md` as the shared plan for expanding the
  current one-problem Grade 1 game into a deterministic adventure mission bank.
- Added the `phases/grade1-adventure-scaleup/` harness phase with five steps:
  problem contract, alpha mission bank, data-driven UI, progress/review loop,
  and quality gates.
- Updated workstream coordination so agents can split Grade 1 work across
  content, learning loop, UI, and quality lanes.
- Added user-facing planning requirements: learner journey, mistake/hint policy,
  Grade 1 UX rules, progress/parent summary, and error-handling resilience.

## Still risky

- The current `/grade/1` page still has only one hardcoded concrete mission until
  Step 1 is implemented.
- The Grade 1 problem contract is proposed, not production code yet.
- Moving too quickly into JSON could lock in the wrong visual problem shape; keep
  the first extraction in TypeScript until renderers and validation prove the
  contract.
- Error fallback behavior is specified but not implemented yet. Step 1 should
  create the safe mission fallback; Step 4 should handle localStorage failure;
  Step 5 should test corrupt progress and repeated answer taps.

## Next agent should do

- Start with `npm run harness -- grade1-adventure-scaleup` only after deciding to
  let the harness create and commit the phase branch.
- For manual implementation, begin with
  `phases/grade1-adventure-scaleup/step1.md`.
- Keep any shared contract changes documented in `workstreams/_shared/README.md`.
