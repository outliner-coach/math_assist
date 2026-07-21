# Shared Contracts

Use this page when a change crosses workstream boundaries.

## High-conflict files

- `src/lib/types.ts`
- `src/lib/problem-generator.ts`
- `src/lib/session.ts`
- `public/data/concepts.json`
- `public/data/templates/*.json`

## Update rule

When you change a high-conflict file, add a short dated note below:

- date
- file
- what changed
- what dependent workstreams should re-check

## Notes

- 2026-07-21: approved Grade 5 semantic corrections and Grade 6 public
  promotion (primary workstreams 01, 02, 03, and 04) close the nine blocked
  Grade 5 blueprint slots, redesign `g6ratio-001` so A/B/C use materially
  different problem families, add a rendered answer-safe ratio table visual,
  and promote Grade 6 only after corrupt-session recovery, 48px/two-viewport
  browser gates, home projection, and ledger checks pass. Grade 5 saved
  problem snapshots remain unchanged. Grade 6 keeps its isolated storage
  namespaces and must preserve corrupt bytes until the learner explicitly
  resets only the affected key. Re-check `src/lib/types.ts`, template
  generation, curriculum references, session/result routing, home preference
  compatibility, answer leakage, and all direct Grade 6 paths before changing
  these contracts.

- 2026-07-21: Grade 6 release-candidate fail-closed gate (primary workstreams
  02 and 04) keeps candidate unit/concept/template data in static output but
  blocks every Grade 6 learning entry until
  `curriculum-allocations-v1.json.releaseState.grade6 === "released"`.
  `src/lib/grade-release.ts` is the single public-ledger adapter used by the
  Grade 6 index and shared unit, concept, practice, and result routes. Fetch,
  schema, and unknown-state failures remain blocked and must not create,
  overwrite, or clear Grade 6 progress/session/result. Re-check every direct
  URL and Grade 5 continuity before changing the ledger release state.

- 2026-07-21: safe arithmetic expression evaluator (primary workstream 04;
  Grade 5 and Grade 6 generator consumers) owns the narrow change to
  `src/lib/problem-generator.ts`, new `src/lib/arithmetic-expression.ts`, and
  the narrow runtime-generator loader in `scripts/problem-quality-core.js`.
  The generator keeps registered function evaluation, but numeric arithmetic
  is parsed without `eval` and accepts only finite decimal literals,
  parentheses, `+ - * /`, and unary signs. Re-check deterministic Grade 5/6
  generation, Grade 6 and template validators, problem audit,
  function-argument arithmetic, division by zero, invalid/trailing tokens, and
  CSP compatibility. No template, session, home, or active Grade 6 file is part
  of this change.

- 2026-07-21: Grade 6 Study minimum release (primary workstreams 01, 02, and
  04) reuses the shared unit/concept/template practice engine with Grade
  6-prefixed content IDs. `src/lib/types.ts`, `src/lib/session.ts`, and
  `src/lib/progress.ts` gain optional grade/item-count routing while preserving
  legacy Grade 5 snapshots and exact Grade 5 storage keys. Grade 6 owns
  isolated `mathAssist_grade6CurrentSession`, `mathAssist_grade6LastResult`,
  and `mathAssist_grade6Progress` namespaces, defaults to 5 questions, and
  offers 10 explicitly. Re-check legacy Grade 5 normalization, retry routing,
  static export params, progress isolation, and both 5/10 completion paths.
  Curriculum-ledger promotion is concurrently owned by the Grade 4 lane and
  must be reconciled only after that validator contract is finished.

- 2026-07-21: Phase 4 mission ScratchPad route integration (primary workstreams
  02 and 03; browser checks in workstream 04) connects persisted sketches to
  the real Grade 1, 2, and 3 mission clients in addition to Grade 5 practice.
  `src/lib/mission-sketch-identity.ts` derives stable guest/session/item keys
  from each grade's deterministic run and concrete variant. Navigation and
  reload restore the same item; explicit retry starts a new session; completed
  and expired documents are read-only. All connected surfaces keep the shared
  WebKit selection guard and 48px ScratchPad controls. Re-check key continuity
  if mission seed, replay, or explicit session storage changes.

- 2026-07-21: Phase 3B home projection adoption (primary workstream 02) changes
  `src/lib/guest-home.ts` so completed, review, recent activity, and Grade 5
  resumable-session validity come from `LocalProgressRepository`. Grade-specific
  today counts, selected-unit copy, and Grade 5 set links remain read-only legacy
  details. The home still writes only `mathAssist_guestHome_v1`; re-check valid
  legacy equivalence, malformed Grade 5 session rejection, and raw-key equality
  when Grade 4/6 are activated.

- 2026-07-21: Phase 3C mission receipt wiring (primary workstream 02; browser
  checks in workstream 04) adds `src/lib/mission-attempt-receipt.ts` and connects
  the Grade 1, 2, and 3 valid answer-check boundaries. Existing progress and
  reward keys remain authoritative; `mathAssist_attemptReceipts_v1` is an
  append-only supplemental ledger. Format errors append nothing, retry ordinals
  are stored separately from stable item IDs to distinguish intentional checked
  attempts, and repeated delivery of the same ordinal is idempotent. Receipts
  contain neither raw learner answers nor sketch strokes. Re-check this bridge
  if mission session persistence or retry identity changes.

- 2026-07-21: ScratchPad V1 document and local retention foundation (primary
  workstream 03; storage port in workstream 02) is owned in new
  `src/lib/sketch-document.ts` and `src/lib/sketch-repository.ts` modules.
  Phase 4A stores normalized stroke/eraser/clear commands per stable
  learner/session/item key, keeps undo history branches deterministic, and
  enforces 256 KiB per item plus recent-50 retention without deleting active
  session sketches. It does not connect to `ScratchPad.tsx` yet and must not
  change the established WebKit pointer/selection contract. Re-check corrupt
  item isolation, active-session retention, and key stability before UI wiring.

- 2026-07-21: Phase 4B/4C ScratchPad component and ExperiencePreset bridge
  (primary workstream 03; integration consumers in workstreams 02 and 03)
  evolves `src/components/ScratchPad.tsx` to consume either a controlled
  `SketchDocument` or the stable learner/session/item repository key. It keeps
  the established WebKit gesture listeners and pointer isolation while adding
  normalized replay, recovery, pen/eraser/clear history, undo/redo, resize
  reprojection, save-state feedback, and 48px controls. The no-prop component
  remains an unpersisted compatibility mode until each learning route supplies
  stable identity. `src/lib/experience-preset.ts` owns presentation-only Grade
  1-2 play, 3-4 bridge, and 5-6 study contracts; grading and progress must not
  import it. Re-check item-key uniqueness, active-session retention injection,
  and real WebKit painted-pixel behavior when routes adopt the component.

- 2026-07-21: Phase 5B private-staging remote authentication core (primary
  workstream 02; security verification in workstream 04) is owned under
  `src/lib/server/remote-auth-core.ts`. This is a Node-only domain boundary and
  must not be imported by `src/app`, `src/components`, or any client bundle.
  It may define repository and audit ports plus an in-memory fixture, but must
  not expose an HTTP route, cookie policy, CSRF/CORS behavior, database choice,
  or enable the production remote flag. Stored records contain only salted
  verifier material and session-token hashes; raw PIN, recovery code, and
  session token may leave the core only at their one-time creation boundary.
  Account+initial-session and recovery-rotation+new-session repository methods
  are atomic. Self revoke-all accepts a valid session token rather than a caller
  supplied learner number. Production construction requires a stable secret
  audit pepper; automatic pepper generation is test-cost-only. Re-check
  enumeration resistance, account/network/pair rate-limit keying, recovery
  single use, revoke-all, audit redaction, runtime bounds, and client import
  isolation before any provider or staging route adopts this module.

- 2026-07-21: Phase 5B guardian-consent provisioning gate (primary workstream
  02; privacy/security verification in workstream 04) is owned under
  `src/lib/server/remote-account-provisioning.ts`. Remote account creation must
  not call `RemoteAuthCore.createAccount` directly from a route or UI. A valid,
  verified, unexpired, purpose- and policy-matched one-time authorization bound
  to the same pre-account learner request must be consumed in the same atomic
  unit as auth account creation. Failure rolls back both authorization use and
  account/session creation. Consent artifacts contain hashes and verification
  state only, never guardian contact or raw authorization/binding secrets.
  Actual legal sufficiency, guardian verification method, artifact retention,
  withdrawal/deletion, and production provider remain blocked decisions.

- 2026-07-21: integrated storage/security QA hardens Phase 4/5 infrastructure.
  Remote progress envelopes are strict runtime allowlists and reject raw answer,
  sketch, foreign-learner, oversized, and malformed fields before read or merge.
  Grade 1-3 corrupt progress and corrupt sketch documents are preserved and
  blocked from automatic overwrite until an explicit reset/recovery action.
  Local rollback backup covers the confirmed Grade 4 progress and Grade 6
  progress/current-session keys. A current session can contain device-local
  draft answers but is never a remote payload; Grade 6 last-result snapshots,
  sketch strokes, and account secrets are excluded. Keep production
  remote disabled until dependency upgrades and a real transactional provider,
  distributed limiter, session expiry, TLS/cookie/CORS/CSRF, and consent policy
  decisions are complete.

- 2026-07-21: common read-only learning activity and progress projection
  (primary workstream 02; consumers in home and future experience shells)
  is owned in new `src/lib/learning-activity.ts` and
  `src/lib/local-progress-repository.ts` modules. The first slice reads the
  existing Grade 1/2/3/5 progress keys and Grade 5 active session without
  calling destructive grade loaders or rewriting any key. It does not change
  `src/lib/types.ts`, `src/lib/session.ts`, or existing progress schemas.
  Re-check legacy fixture projections, corrupt-grade isolation, and raw storage
  equality before changing a progress key or adopting these contracts in UI.

- 2026-07-21: Grade 5 problem-blueprint metadata migration (primary workstreams
  01 and 04)
  `src/lib/types.ts` and `src/lib/problem-generator.ts` gain an optional
  `ProblemBlueprintMeta` bridge that keeps old saved problems and the existing
  660-template bank readable while metadata is reviewed concept by concept.
  Declared metadata must be complete and valid; undeclared metadata is counted
  as missing coverage by `audit:problems` and must not be inferred from
  `difficulty`. Re-check template generation, session serialization, content
  validation, and coverage reports when adding or renaming blueprint fields.
  M1 has reviewed metadata for 210 geometry/application templates. M2 reviewed
  the remaining 450 templates and added explicit problem-family/blueprint
  metadata to 441 of them. Nine templates (`fracmul` 06, `fracsub` 06, and
  `average` 08 across A/B/C) deliberately remain missing because their prompt,
  solver, or concept semantics conflict. Current coverage is 651/660 complete,
  9 missing, 0 invalid; do not make metadata mandatory or assign standards to
  those nine until their content correction is approved and tested.

- 2026-07-21: quantitative three-shape overlap repair (primary workstream 03,
  dependencies on workstreams 01 and 04)
  `src/lib/types.ts`, `src/lib/problem-generator.ts`, and
  `public/data/templates/area.json` classify `three_shape_overlap` as a
  quantitative visual. New problems carry a derived seven-region area model;
  the renderer must also derive that model for older saved problem snapshots
  that do not contain it. Re-check template validation, answer-safe DOM output,
  session serialization, zero-region omission, and exact unit-cell ratios.

- 2026-07-19: guest landing and learning home (primary workstream 03)
  `/` is now a public landing, `/home` is the device-local learner home, and
  `/grade/5` owns the Grade 5 unit list. `src/lib/guest-home.ts` reads the
  existing Grade 1/2/3 progress keys, Grade 5 concept progress, and the current
  two-hour practice session without rewriting them. The only new key is
  `mathAssist_guestHome_v1`, currently `{ activeGrade }`. Re-check the home
  adapter whenever a progress schema or storage key changes. Details are in
  `docs/landing-home-guest-v1.md`.

- 2026-07-18: `src/lib/types.ts`, `src/lib/session.ts`, `src/app/practice/**`, `src/components/**`
  The shared Grade 4/5 practice flow now persists `PracticeSession.checkedAnswers`
  so each problem can be graded and explained immediately before navigation. Old
  localStorage sessions normalize to unchecked entries. Re-check result creation,
  retry sessions, progress indicators, and any code that constructs a practice
  session directly.

- 2026-07-18: `src/lib/types.ts`, `src/lib/problem-generator.ts`, `src/components/ProblemCard.tsx`, `src/components/ResultCard.tsx`
  Grade 5 practice problems now support parameter-resolved `GeometryVisual` payloads shared by prompts, deterministic solvers, SVG practice rendering, and result rendering. Answer-only visual annotations remain hidden until `showAnswer` is enabled. Re-check session persistence, result snapshots, template validation, and tablet rendering when changing the shared `Problem` contract.

- 2026-03-07: collaboration structure added. No runtime contract changed in this step.
- 2026-03-07: `src/lib/types.ts`, `src/lib/session.ts`
  action-centered retry loop added with `PracticeSession.mode`, retry source metadata,
  `SubmissionResult.problem` snapshots, `SessionResult.wrongCount`, and local progress summaries.
  Re-check learning loop UI, result rendering, and any tests that assume fixed 10-question sessions.
- 2026-03-07: `public/data/templates/commonden.json`
  commonden prompt copy now shows the actual fractions and target common denominator with KaTeX-friendly notation.
  Re-check any content tests or screenshots that assume the old plain-text prompt wording.
- 2026-03-07: `src/lib/problem-generator.ts`, `public/data/templates/fracadd.json`, `public/data/templates/fracsub.json`, `public/data/templates/fracmul.json`
  session generation now rejects duplicate rendered prompts inside one 10-problem set, and fraction templates were reworded/re-leveled so prompt clarity and difficulty gates pass.
  Re-check any flows or snapshots that depend on prior prompt copy or assume duplicate wording can appear in one session.
- 2026-05-09: Grade 1 Adventure Scale-up is tracked in `docs/grade1-adventure-scaleup.md`
  and `phases/grade1-adventure-scaleup/`. Start with a Grade 1-specific problem contract in
  `src/lib/grade1-problems.ts` instead of changing `src/lib/problem-generator.ts` immediately.
  The initial target is 24 Alpha mission templates, then 60 Beta templates, then 96 V1
  templates. UI agents should consume the contract through `src/components/grade1/**`; content
  agents own deterministic templates and tests; quality agents own validation and E2E gates.
  The plan also requires learner journey, wrong-answer hint policy, parent summary metadata,
  and runtime recovery for localStorage, missing stages, missing assets, and repeated answer taps.
- 2026-05-10: `src/lib/grade1-progress.ts`
  Grade 1 progress now includes `introDismissedAt: number | null` for the
  first-start guide. Existing stored progress without the field must normalize to
  `null`; reset should clear it. UI and learning-loop agents should use this
  field only for onboarding visibility, not for reward or stage completion.
- 2026-05-11: Grade 1/2 Beta scale-up
  Grade 1 now has 60 mission templates and Grade 2 now has 72 mission templates
  with 6 missions per unit. `Grade2MissionCard` now receives `missionCount`
  instead of assuming `/3`, and `unitMissionOrder` is no longer limited to
  `1 | 2 | 3`. Re-check mission navigation, tests, and browser QA if another
  workstream touches Grade 1/2 mission banks, Grade 2 mission cards, or progress
  copy. The handoff is `handoffs/2026-05-11-grade1-grade2-beta-scaleup-codex.md`.
- 2026-07-18: Grade 1/2 replay expansion is owned by the learning-loop lane but
  changes content-bank counts and reward UI. Both grade progress schemas move to
  v2 with shared deterministic variant, XP, streak, daily-goal, and mastery
  helpers. Existing v1 localStorage data must migrate without losing completion
  or review IDs.
- 2026-05-16: Grade 3 Alpha implementation
  Grade 3 now has a grade-specific Alpha contract under `src/lib/grade3-problems.ts`,
  `src/lib/grade3-answer-normalizers.ts`, `src/lib/grade3-progress.ts`,
  `src/components/grade3/**`, and `src/app/grade/3/**`. The shared mission-bank
  gate now includes `validate:grade3` and Grade 3 inside `audit:missions`.
  Re-check content, UI, and quality workstreams when touching mission-bank
  validation, structured answer normalizers, visual answer masking, or progress
  storage. The detailed note is `docs/grade3-alpha-implementation.md`; the
  handoff is `handoffs/2026-05-16-grade3-alpha-codex.md`.
- 2026-07-18: Grade 5 geometry quality upgrade (primary workstream 01, UI dependency on workstream 03)
  `src/lib/types.ts` and `src/lib/problem-generator.ts` now support an optional
  evaluated `visual_template` / `visual` contract. Grade 5 `area-001` uses five
  answer-safe SVG models, while the shared practice route mounts a temporary
  pointer-based `ScratchPad` beside every problem at tablet widths. Re-check
  answer masking, serialized `Problem` compatibility, responsive practice
  layout, and renderer tests when changing the generator or practice UI. The
  handoff is `handoffs/2026-07-18-grade5-quality-upgrade-codex.md`.
- 2026-07-19: iPadOS scratch-pad input stabilization (primary workstream 03)
  The shared practice surface now blocks WebKit text selection and native
  canvas selection gestures, isolates active pointers, and tolerates pointer
  capture failure. The user verified the final fix on an iPad. Preserve the
  interaction contract in `docs/scratch-pad-ipados-lessons-learned.md`; the
  handoff is `handoffs/2026-07-19-03-ui-and-visuals-codex.md`.
