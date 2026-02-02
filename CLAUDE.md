# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npm run test      # Run unit tests (Vitest)
npm run test:e2e  # Run E2E tests (Playwright)
```

## Project Overview

Korean elementary 5th-grade math learning web app (비상업적 개인 프로젝트). Students select concepts, read explanations, complete 10-question practice sets, then receive automatic grading with step-by-step solutions.

## Architecture Principle

**Hybrid: Deterministic Core + AI Assist**
- Answer calculation and grading must be deterministic (rule-based, no AI)
- AI is only for natural language: hints, feedback (optional feature)
- Grading is binary: correct or incorrect only (no partial credit)

## Tech Stack

- **Frontend/Backend**: Next.js + Tailwind CSS
- **Data**: Static JSON files (`/public/data/`) - no database
- **Session**: Client localStorage only (no server storage)
- **Hosting**: Vercel
- **AI**: Claude API (hints, optional)

## Answer Input Types

Only 2 types supported:
1. **Multiple choice**: Select 1 of 4 options
2. **Number input**: Integer, decimal, fraction (a/b), mixed number (a b/c)

## Grading Normalization

- Integer: string → int parse
- Decimal: normalize (`.5` → `0.5`)
- Fraction: normalize to lowest terms (`2/4` → `1/2`)
- Mixed number: convert to improper fraction (`1 1/2` → `3/2`)

## UI Target

- **Tablet-first** (iPad 1024×768+)
- Custom number keypad (no system keyboard)
- Large touch targets (min 48×48px)
- One problem per screen

## Data Models

Key entities: `Unit` → `Concept` → `ProblemTemplate` → `PracticeSession` → `Submission`

See [math_prd.md](math_prd.md) section 11 for full schema.

## API Endpoints

- `GET /api/units`, `GET /api/units/:id/concepts`, `GET /api/concepts/:id`
- `POST /api/practice/start` - generates 10-problem session
- `POST /api/practice/:sessionId/submit` - grades and returns results
- `GET /api/practice/:sessionId` - session recovery
- `POST /api/ai/hint` - AI hint (with fallback)

## Session Management

- Sessions stored in localStorage for recovery
- Session expires after 2 hours
- Network error: retry button + localStorage backup

## Math Rendering

- **KaTeX** for fractions: `$\frac{1}{2}$`, `$1\frac{1}{2}$`
- User input: plain text `1/2` or `1 1/2`

## Geometry Problems

- React components generate SVG dynamically (`<Rectangle width={8} height={5} />`)
- Answer is always number or multiple choice (no drawing)

## AI Hints

- Automatically shown after submission for wrong answers
- Fallback to template-based hints if API fails
