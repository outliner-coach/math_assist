# 4학년 Bridge 출시 후보 인계

## 결과

교육과정 원장의 `[4수01-01]`, `[4수01-02]`만 사용한 큰 수 단원 세로 절편을 구현했다. 10개 문제 틀은 K/A/R 4/4/2이며 한 활동은 각 영역 한 문제씩 총 3문제다. 나머지 4학년 배정 성취기준 20개는 계속 `planned`이며 UI에서 열지 않는다.

## 중요한 수정

- `4□5,000 < 46v,000` 조건의 최대 숫자는 `v=1~5`일 때 5, `v=6~9`일 때 6이다. 1~9 전수 탐색 회귀 테스트로 고정했다.
- 자리별 숫자를 합성하는 문제는 확인 전 완성 수를 DOM에 만들지 않고, 확인 후에만 완성 자리표와 합성값을 보인다.
- 조건 추론 그림은 fallback `000000` 대신 실제 `4□5,000 < 비교 수`를 렌더링한다.
- 형식 오류는 오답이나 receipt로 세지 않는다. 오답 뒤 정답은 별도 순번의 receipt이며 복습 대상에서 제거하지 않는다.

## 저장 계약

- 진도: `mathAssist_grade4Progress`, schema 1
- receipt: `mathAssist_attemptReceipts_v1`
- 콘텐츠 버전: `grade4-bridge-big-numbers-v1`
- receipt에는 원답과 풀이장 획을 넣지 않는다.
- 풀이장 session: `grade4:{unitId}:activity-{run}`, item: mission `variantKey`

## 홈 통합

이 작업은 `src/lib/guest-home.ts`와 홈 화면을 수정하지 않았다. 모든 게이트가 통과하면 상위 통합 작업에서 원장의 `releaseState.grade4`를 `released`로 바꾸고, 같은 변경에서 지원 학년에 4를 추가해야 한다. 상태와 실제 노출이 다르면 curriculum validator가 실패한다.

## 검증 명령

```bash
npm run validate:curriculum
npm run validate:grade4
npm run audit:missions
npm test
npm run lint
npm run tdd:guard
npm run build
npx playwright test e2e/grade4-bridge.spec.ts
```

현재 결과는 Grade 4 E2E 3/3, 전체 단위 테스트 279/279, lint, TDD guard, 세 validator/audit가 통과했다. build 재실행에서 Grade 4 경로는 컴파일됐지만 병행 Phase 5B의 ES target 문제를 차례로 발견해 해당 소유자에게 전달했다. 그 수정 뒤에는 Grade 6가 `PracticeClient` 계약을 동시 편집 중이므로 최종 통합 build를 Grade 6 완료 뒤 root에서 순차 실행한다.
