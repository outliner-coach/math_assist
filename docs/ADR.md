# Architecture Decision Records

## ADR-001: Deterministic Core

**Decision**: Problem generation, answer normalization, and grading are implemented as
deterministic TypeScript logic.

**Reason**: Students need predictable grading and repeatable explanations. AI-generated
judgment would make correctness hard to audit.

**Tradeoff**: More domain logic must be maintained in code and static data templates.

## ADR-002: Static Curriculum Data

**Decision**: Curriculum content, concepts, and problem templates live in
`public/data/` JSON files instead of a database.

**Reason**: The project is a compact non-commercial learning app. Static data keeps
hosting, review, and validation simple.

**Tradeoff**: Content updates require repository changes rather than an admin UI.

## ADR-003: Tablet-First Web App

**Decision**: The primary experience targets tablet screens with large touch controls
and a custom number keypad.

**Reason**: Elementary learners benefit from one-problem-at-a-time interaction and
stable input controls.

**Tradeoff**: Dense desktop workflows are secondary to touch ergonomics.

## ADR-004: Codex Harness-Guided Work Phases

**Decision**: Larger work is split into `phases/{task-name}/stepN.md` files and run
through `scripts/execute.py`.

**Reason**: The harness records task state, carries completed-step summaries forward,
invokes Codex non-interactively, and keeps implementation steps small enough to review.

**Tradeoff**: Initial planning requires more structure than ad hoc task execution.

## ADR-005: Hook-Enforced TDD Gate

**Decision**: The Codex harness runs `.codex/hooks/tdd-guard.sh` before lint/build/test.
The hook denies changes to production files under `src/**` or `public/data/**` unless
the same step also changes a focused test file.

**Reason**: Writing "use TDD" in `AGENTS.md` is guidance, not enforcement. The hook is
the checkpoint that prevents production-only implementation from being accepted.

**Tradeoff**: Some maintenance changes may need an explicit `TDD_GUARD_ALLOW_NO_TEST=1`
override when a test is not meaningful.
