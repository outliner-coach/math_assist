Original prompt: /goal 제안한 계획대로 브라우저 테스트까지 마친 상태로 실제 바로 사용할 수 있는 수준까지 구현해주세요.

## 2026-05-09

- Started Grade 1 adventure scale-up implementation.
- Planned implementation order: deterministic mission bank, data-driven UI, local progress recovery, validator/tests, browser verification.
- Added Grade 1 mission bank, progress persistence helpers, data-driven map/mission UI, mission visual renderers, and validator script.
- Validator, unit tests, build, and Playwright E2E passed after fixing trailing slash expectations and StrictMode storage recovery.
- Browser screenshot flow reached reward state; added priority loading for the above-fold adventure map after a Next LCP warning.
- Reviewed the post-reward Grade 1 UX flow and added a direct "다음 미션 풀기" path from the reward reveal so learners do not need to return to the map before continuing.
- Verified the reward-to-next-mission flow with focused Vitest, lint, build, full Playwright E2E, and a browser screenshot check. Next UX candidate: review whether "오늘 추천 미션" should prefer the next path over review items during the same play streak.
