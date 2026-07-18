# Grade 5 Geometry Implementation

## Scope

The Grade 5 practice flow now includes all three geometry units:

- 5-1 perimeter and area
- 5-2 congruence and symmetry
- 5-2 cuboids and nets

Each unit contains two concepts. Each concept has 30 deterministic templates:
10 in practice set A, 10 in B, and 10 in C. Every set distributes difficulty
levels 1/2/3 as 4/4/2 templates. The two concepts in a unit expose 20 distinct
problem families in total, satisfying the minimum 20-problem requirement
without relying on parameter-only duplicates.

## Deterministic Contract

Prompt text, answer calculation, grading, and SVG values all resolve from the
same generated parameters. `visual_template` is data, while
`GeometryProblemVisual` is the renderer. AI is not used to calculate or grade
answers.

Answer-only visual data is gated by `showAnswer`. Practice cards render only
the information needed to solve a problem; result cards may reveal symmetry
axes, corresponding labels, reflected target points, or the valid net.

## Content Maintenance

Regenerate the six geometry banks with:

```bash
npm run generate:grade5-geometry
```

Then run the quality gates:

```bash
npm run validate:templates
npm run audit:problems -- --strict-warnings
npm test
npm run test:e2e
```

The generator is intentionally checked in so future edits remain reproducible
and reviewable instead of requiring hand-edited large JSON files.
