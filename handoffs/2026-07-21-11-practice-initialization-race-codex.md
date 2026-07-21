# PracticeClient initialization race handoff

## Outcome

The Grade 5/6 shared practice route now permits only the currently mounted
async initialization run to create, persist, and render a session. React
Strict Mode may still start the effect twice in development, but the cleaned-up
run stops at the next asynchronous boundary.

## Confirmed cause

- Reported reproduction before the fix: 6/10 passed with 6 workers.
- Independent reproduction before the fix: 8/10 passed; the two failures read
  the three-shape-overlap index from the first localStorage snapshot, then
  rendered a different L-shaped area problem at that index.
- A single run passed and therefore was not an adequate diagnostic.
- React Strict Mode mounted, cleaned up, and remounted the component while the
  first async effect was awaiting data. Both runs generated random sessions.
  The test could read the first persisted snapshot before the second run
  replaced both persisted and rendered state. Parallel load widened the race;
  browser workers did not share localStorage.

## Changes

- `src/app/practice/[conceptId]/PracticeClient.tsx`
  - Added an effect-local active-run guard.
  - Checked it after the Grade 6 release gate and both data-loading awaits.
  - Prevented a stale run from changing session, release-blocked, error, or
    loading state.
  - Kept the existing Grade 5/6 storage keys, release gate, and `saveSession`
    corrupt-storage refusal unchanged.
- `src/app/practice/[conceptId]/PracticeClient.initialization.test.ts`
  - Added a Strict Mode regression proving that two concept reads lead to only
    one template generation, one stored session, and the same rendered problem.
- `docs/engineering-notes.md`
  - Recorded symptom, cause, response, verification, and maintenance contract.

## Verification

- Focused Strict Mode unit: 1/1 passed.
- Requested repeated E2E, no retries, 6 workers: 10/10 passed in 9.3s.
- Additional stress run, no retries, 6 workers: 20/20 passed.
- `npm run lint`: passed with no warnings or errors.
- `npm run tdd:guard`: passed.
- `npm run build`: passed after a clean `.next`; 75/75 static pages generated.

The first build attempt overlapped the just-finished Playwright development
server and corrupted `.next`, reproducing the repository's documented invalid
verification pattern. After terminating only those owned processes and moving
the generated cache to
`/tmp/math-assist-next-corrupt-practice-race-20260721-0827`, the isolated build
passed. No production source was removed.

## Maintenance contract

- After adding any new `await` to practice initialization, check that the run
  is still active before its result mutates React state or browser storage.
- A cleaned-up run must not finish the active run's loading state in `finally`.
- Preserve `saveSession` as the storage boundary so corrupt bytes remain
  fail-closed and Grade 5/6 namespaces stay isolated.
- Validate this class of failure with Strict Mode plus repeated parallel E2E;
  do not mask it with retries or longer waits.
