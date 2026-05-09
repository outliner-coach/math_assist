# Workstream 04 - Quality and Automation

## Owns

- `e2e/**`
- `src/lib/*.test.ts`
- `.github/workflows/**`
- test and validation scripts

## Focus

- regression safety
- content validation coverage
- CI reliability
- release and deployment confidence

## Typical tasks

- add or strengthen Playwright coverage
- add data and generator unit tests
- harden GitHub Actions
- add reporting around template validation failures
- add Grade 1 mission-bank validation and adventure E2E coverage

## Watch-outs

- Keep tests aligned with current learner-facing copy.
- Coordinate workflow changes because they affect everyone.
- Grade 1 content scale-up should have a dedicated validator before templates
  move from TypeScript into JSON.
