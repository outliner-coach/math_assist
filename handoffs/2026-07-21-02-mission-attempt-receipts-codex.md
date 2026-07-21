# Phase 3C mission AttemptReceipt 연결

## 완료 범위

- `src/lib/mission-attempt-receipt.ts`가 1·2·3학년 미션을 공통 receipt로 변환한다.
- 세 학년 화면의 실제 유효 답 확인 경계가 `mathAssist_attemptReceipts_v1`에 추가 기록한다.
- 기존 `mathAssist_grade1Progress`, `mathAssist_grade2Progress`, `mathAssist_grade3Progress`의 저장·보상·복습 계산은 그대로 권위 있게 유지한다.
- receipt는 학년, 활동, 안정적인 문항 ID, 별도 재시도 순번, 구체 문제 variant, 콘텐츠 릴리스, 정오, 힌트 사용, 확인 시각, 내용 지문만 가진다. 원답 문자열과 풀이장 획은 넣지 않는다.

## 식별과 멱등 계약

- `sessionId`: 학년 + 미션 ID + 현재 결정적 실행 키다. 1·2학년은 기존 일일/replay seed, 3학년은 고정 콘텐츠 seed와 명시적 mission run을 사용한다.
- `activityId`: 미션 ID다.
- `itemId`: 미션 ID로 안정적이다. `attemptOrdinal`이 `wrongAttemptCount`를 별도 보존한다. 기존 재시도 UI에서 유효한 오답 뒤의 다음 확인은 새 불변 receipt가 되지만, 상태가 전진하기 전 반복 전달은 같은 ordinal이라 duplicate가 된다.
- `variantKey`: 1·2학년은 기존 내용 기반 variant 키, 3학년은 미션 ID와 고정 콘텐츠 seed다.
- `contentReleaseId`: `grade1|2|3-missions-static-v1`이다.
- `dedupeKey`: 문장·정답·보기·시각 모델·시각 설정을 정렬 직렬화한 뒤 해시한다.

## 실패 접근과 선택 이유

- `itemId`에 재시도 순번을 섞으면 공통 세션과 풀이장이 같은 문제를 서로 다른 항목으로 오인한다. 그래서 미션 ID는 안정적으로 유지하고 현재 retry-in-place UI의 오답 횟수는 별도 `attemptOrdinal`로 저장한다.
- `checkedAt`이나 원답을 attempt ID에 넣으면 빠른 반복 클릭을 새 receipt로 오인하거나 민감한 원답을 보관하게 된다. 둘 다 식별자에서 제외했다.
- receipt 저장 실패를 기존 진도 저장 실패로 합치지 않았다. 부가 원장 손상 때문에 이미 동작하는 보상·복습 흐름을 막거나 초기화하면 안 되기 때문이다.

## 검증 증거

- 집중 단위: `npm test -- --run src/lib/attempt-receipt.test.ts src/lib/mission-attempt-receipt.test.ts` — 12/12 통과.
- 집중 브라우저: 1·2·3학년 기본 미션, 2학년 구조화 입력, 3학년 구조화 오류 5개 — 5/5 통과.
- 브라우저에서 각 학년 오답→정답은 `[false, true]` receipt 두 개, 정답 버튼 반복 전달은 추가 0개로 확인했다.
- 1·2·3학년 형식 오류 전후 receipt 수가 같음을 확인했다.
- 기존 진도·XP·복습 assertions를 같은 브라우저 테스트에서 유지했다.
- 전체 단위 테스트 226/226, lint, TDD guard, 프로덕션 빌드 69개 정적 페이지, `git diff --check`가 통과했다.
- 전체 Chromium E2E는 20개 모두 최종 통과했다. 기존 세 도형 겹침 테스트가 첫 실행에서 다이어그램을 5초 안에 찾지 못했지만 자동 재시도에서는 통과해 결과는 19 passed, 1 flaky였다. 이 현상은 `docs/engineering-notes.md`의 기존 E2E 일회성 시간 초과 항목과 같은 범주이며 mission receipt 집중 테스트 5개는 재시도 없이 통과했다.

## 유지보수 계약

- 미션이 명시적 `LearningActivitySession` 저장으로 전환되면 seed/run 조합 대신 그 세션의 실제 `sessionId`를 사용한다.
- 재시도 UI가 오답 뒤 새 항목을 만들지 않고 checked 응답을 수정하는 모델로 바뀌면 `attemptIndex` 계약도 함께 재검토한다.
- 콘텐츠 문장·정답·보기·시각 의미가 바뀌면 `contentReleaseId`를 올리고 dedupe 입력 쌍 테스트를 유지한다.
- 원격 동기화는 이 원장을 읽을 수 있지만, 원답·풀이 획을 receipt에 추가해서는 안 된다.
