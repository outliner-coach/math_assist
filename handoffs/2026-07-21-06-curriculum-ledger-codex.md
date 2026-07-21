# 6A 교육과정 원장과 검증기 인계

작성일: 2026-07-21

## 완료 범위

- `public/data/curriculum-allocations-v1.json`에 2022 개정 수학과
  3~4학년군 47개, 5~6학년군 45개 성취기준을 정확히 한 번씩 기록했다.
- 각 항목은 공식 문구, 학년군, 배정 학년·학기, unit ID, 선수 기준,
  교육부 원문 URL·쪽수, 검토 상태, 현재 콘텐츠 참조, 배정 근거와
  검토자를 가진다.
- 학년 배정은 코드 숫자로 생성하지 않았다. 현재 3학년 미션의
  `curriculumCode`, 현재 5학년 템플릿의 `blueprint`와 학기 순서를
  대조한 명시적 원장이다.
- 현재 참조는 3학년 22개, 5학년 17개로 추적된다. 추가로 3학년에
  3개, 5학년에 6개가 같은 기존 단원 안의 계획 항목이며, 4학년 22개와
  6학년 22개는 신규 계획 항목이다.
- `npm run validate:curriculum`은 공식 코드 누락·중복, 스키마·학년군·학기,
  선수 기준, 출처·검토 근거, 기존 3·5학년 참조, 홈의 4·6학년 미출시를
  함께 검사한다.

## 출시 계약

- 원장 버전은 `2022-math-allocation-v1`이다.
- `releaseState.grade4`와 `releaseState.grade6`은 모두 `not-released`이며,
  현재 `SUPPORTED_GRADES`에 4 또는 6이 들어가면 validator가
  `unreleased_grade_exposed`로 실패한다.
- `coverageStatus: existing-reference`는 현재 코드나 청사진에 실제 참조가
  있다는 뜻이지 해당 성취기준의 전체 문제 은행이 완료됐다는 뜻이 아니다.
  6B·6C에서 문제 은행 게이트를 통과하기 전에는 신규 학년을 활성화하지 않는다.
- 기존 5학년 참조는 템플릿의 `primaryStandard`와 `connectedStandards`를
  모두 읽어 추적한다. 청사진을 바꾸면 원장과 validator를 함께 실행한다.

## TDD와 검증

- 실패 확인: validator 구현 전 `src/lib/curriculum-allocation.test.ts`가
  모듈 부재로 실패했다.
- 집중 테스트: `npm test -- --run src/lib/curriculum-allocation.test.ts`
- 원장 검사: `npm run validate:curriculum`
- 통과: 집중 테스트 3개, `npm run validate:curriculum`, `npm run lint`,
  `npm run tdd:guard`, 작업 파일 `git diff --check`.
- 전체 `npm test`는 이 범위의 테스트를 포함해 226개가 통과했지만, 동시
  Phase 5 작업이 테스트만 먼저 만든 `src/lib/server/remote-auth-core.test.ts`가
  아직 없는 구현 파일을 import해 전체 명령은 실패했다. 6A 실패가 아니다.
- `next dev --port 3100`과 Playwright가 다른 작업에서 실행 중이어서 저장소의
  `.next` 동시 사용 금지 규칙에 따라 `npm run build`는 실행하지 않았다.
  해당 작업 종료 후 통합 게이트에서 다시 실행해야 한다.

## 다음 단계

1. 6B에서 `assignedGrade: 4`인 22개 항목을 Bridge unit bank에 연결한다.
2. 6C에서 `assignedGrade: 6`인 22개 항목을 Study concept/template에 연결한다.
3. 기존 3·5학년 계획 공백 9개는 신규 학년으로 넘기지 말고 배정된 기존
   단원의 보강 목록으로 유지한다.
4. 신규 unit ID를 실제 데이터로 만들 때 원장의 ID를 그대로 사용하고,
   학기나 단원 순서를 바꾸면 배정 근거와 검토자를 다시 기록한다.
