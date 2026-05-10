# Step 2 - Answer Normalizers

## Goal

Support child-friendly structured Grade 2 answers while keeping deterministic
binary grading.

## Workstream

Use `workstreams/02-learning-loop/`.

## Primary Files

- `src/lib/grade2-answer-normalizers.ts`
- `src/lib/grade2-answer-normalizers.test.ts`

## Requirements

- Normalize length answers to centimeters.
- Keep `time-of-day` and `duration` separate even though both compare in minutes.
- Block empty, negative, out-of-range, and type-mismatched structured input
  before it becomes an incorrect attempt.

## Acceptance Criteria

- Equivalent length answers such as `1m 20cm` and `120cm` compare equal.
- `3시 25분` and `3시간 25분` are accepted only by their matching answer type.
- Invalid structured inputs return learner-facing correction messages.
