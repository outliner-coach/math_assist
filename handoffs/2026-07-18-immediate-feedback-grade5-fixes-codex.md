# Immediate feedback and Grade 5 geometry fixes

## What changed

- Shared practice sessions persist per-problem checked state and lock answers after immediate grading.
- Practice now follows answer → check answer → see the correct answer and full solution → next problem.
- Six rectangle-square templates now give the square side directly and use Grade 5 arithmetic only.
- The hard variants derive rectangle area and width before calculating the joined perimeter.
- Grade 5 custom diagrams carry their own `cm` or `m` unit and render from problem dimensions.
- Unit mismatch and unscaffolded nonlinear-unknown checks were added to template validation.

## What is still risky

- The three-shape overlap challenge remains intentionally abstract and should receive future teacher review.
- Existing localStorage sessions are normalized to unchecked state; learners may need to re-check answers entered before this release.

## What the next agent should do

- Preserve `PracticeSession.checkedAnswers` when changing shared session recovery.
- Require every new `area-001` custom visual to declare a unit matching its prompt and solution.
- Keep hard Grade 5 problems multi-step without introducing unknown-squared equations.
