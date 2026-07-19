# Grade 5 problem quality upgrade

Date: 2026-07-18

## Outcome

The existing Grade 5 `unit-5-1-perimeter-area` now includes the additional
applied concept `area-001`.
Each of sets A, B, and C contains 10 deterministic problems with the existing
4 easy / 4 medium / 2 hard distribution.

## Problem design

The 30 templates cover:

- rectangle, triangle, and parallelogram area/perimeter foundations
- concave L-shape perimeter and subtractive area
- two equal rectangles joined with an overlap
- a rectangle and square chain using total width and total area
- reverse reasoning to recover an unknown square side
- inclusion counting across three overlapping shapes

Five SVG visual models are generated from template parameters. Their runtime
contract contains only prompt-given measurements; answer-only values are not
part of the visual payload.

## Tablet scratch pad

Every shared Grade 5 practice page now includes a temporary scratch pad.

- Pointer Events support touch, stylus, and mouse input.
- Pen, eraser, and full-clear actions are available with 44px minimum controls.
- At widths of 1024px and above, the problem and scratch pad are side by side.
- On narrower screens they stack vertically.
- The canvas resets when the learner changes problems and is never written to localStorage.
- The 2026-07-19 iPadOS follow-up blocks WebKit text selection across the
  practice surface, prevents native canvas selection gestures at capture time,
  and keeps pen strokes alive when explicit pointer capture fails.
- The investigation, final interaction contract, and regression checklist are
  documented in `docs/scratch-pad-ipados-lessons-learned.md`.

## Verification

- `npm run validate:templates`: passed
- `npm run audit:problems`: 0 errors, 0 warnings
- `npm run promptfoo:problems`: 881 passed, 0 failed, 0 errors
- `npm test`: 117 passed
- `npm run lint`: no warnings or errors
- `npm run build`: passed
- `PLAYWRIGHT_PORT=3145 npm run test:e2e`: 16 passed
- `npm run tdd:guard`: passed
- Playwright CLI at 1024x768: side-by-side layout, SVG prompt data, pen,
  partial eraser, full clear, and scratch-pad reset verified

The only browser console error was the repository's existing missing
`/favicon.ico`; it is unrelated to the learning flow.
