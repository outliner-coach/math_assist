# 5학년 의미 오류 수정과 6학년 작업트리 공개 인계

기준일: 2026-07-21

## 결과와 범위

- 사용자가 보고된 5학년 9개 문항의 의미 수정과 6학년 권고 공개 방향을 모두 승인했다.
- 5학년 청사진은 660/660, 전체 template metadata는 690/690이다.
- 6학년 `unit-6-1-ratio`와 `g6ratio-001`은 작업트리 curriculum ledger에서 `released`이며 홈·이어하기·단원·개념·5/10문제·결과·재도전에 연결됐다.
- 이는 작업트리 공개 상태다. 커밋·푸시·GitHub Pages 배포는 요청받지 않았고 실행하지 않았다.
- 선택적 원격 기록은 별도 정책·보안·provider 조건이 남아 `REMOTE_PROGRESS_ENABLED = false`다.

## 5학년 원인과 수정

### 원인

- `fracmul` A/B/C-06은 덧셈처럼 읽히는 색칠 문장과 곱셈 solver가 충돌했다.
- `fracsub` A/B/C-06은 허용 매개변수 조합에 따라 음수 결과가 생길 수 있었다.
- `average` A/B/C-08은 평균 단원에서 평균이 아니라 네 수의 합을 물었다.

### 수정

- 분수 곱셈은 “전체의 일부 중 일부”를 구하는 맥락으로 통일했다.
- 분수 뺄셈은 처음 양에서 사용한 양을 빼며 모든 허용 조합이 음수가 되지 않게 범위를 고쳤다.
- 평균은 네 관측값의 평균을 구하도록 prompt·solver·보기·풀이를 정렬했다.
- 세 문제군의 blueprint family를 실제 의미에 맞게 추가하고 migration self-check가 문항·정답·family 계약을 함께 확인하게 했다.

### 유지 계약

문장·매개변수 범위·solver·풀이·성취기준은 하나의 의미 단위로 바꾼다. 수학 의미가 틀린 문항에 임시 metadata만 붙여 청사진 수를 채우지 않는다.

## 6학년 원인과 재설계

### 원인

- 최초 A/B/C는 같은 10개 수학 구조를 문맥과 숫자 범위만 바꿔 반복했다.
- blueprint의 `table` 선언이 실제 화면의 표와 연결되지 않았다.
- `equivalent-ratio-scale`, `missing-ratio-term`은 현재 비와 비율 `[6수02-02/03]`보다 이후 비례식 `[6수02-04]`에 가까웠다.
- 손상 session의 원문 보존은 있었지만 학습자가 이해하고 복구할 화면이 없었고, 48px·두 viewport 공개 검증도 남아 있었다.

### 수정

- A/B/C를 서로 겹치지 않는 10개씩, 모두 30개의 실제 문제군으로 재설계했다. 각 세트는 Knowing·Applying·Reasoning 4/4/2를 유지한다.
- 공개 범위를 `[6수02-02]`, `[6수02-03]`으로 고정하고 비례식 성격의 `[6수02-04]` 문항은 이후 단원으로 옮겼다.
- 각 세트의 추론 문항은 공통 `ProblemVisual`의 정량 `ratio_table`을 실제 HTML table로 렌더링한다. 표에는 제출 전 정답 전용 필드를 만들지 않는다.
- Grade 6 progress/session/result는 Grade 5와 다른 키를 계속 사용한다. 손상 session/result는 자동 삭제·덮어쓰기 없이 원문을 보존하고, 화면에서 해당 Grade 6 키만 명시적으로 초기화한 뒤 다시 시작한다.
- 공통 학습 활동 projection, 홈 학년 선택과 이어하기, receipt, ScratchPad, 레거시 기준선이 Grade 6를 포함한다.
- 학습 뒤 Grade 6 result와 progress가 저장되기 전에는 session을 지우지 않는다.

### 공개·오류 경계

- `releaseState.grade6`가 정확히 `released`일 때만 Grade 6 경로를 연다.
- 원장 부재, fetch·schema 오류, 알 수 없는 상태에서는 grade·unit·concept·practice·result·retry가 저장 repository 접근 전에 fail-closed한다.
- 현재 원장은 비와 비율 한 단원만 공개한다. 나머지 6학년 성취기준은 `planned`이며 같은 콘텐츠·교육과정·브라우저 게이트 없이 노출하지 않는다.

## 검증

- 5학년 집중 회귀와 self-check: 청사진 660/660, template metadata 690/690.
- Grade 6 validator: A/B/C 각 10, 세트 간 family 중복 0, K/A/R 4/4/2, `[6수02-04]` 누출 0, 실제 정량 표 3개.
- Grade 6 품질 감사: 오류 0, 경고 0.
- Grade 6 Chromium E2E 5/5: 홈에서 6학년 선택, 5문제 흐름, 10문제와 실제 표·답 선노출 방지, 손상 session 명시적 복구와 Grade 5 비간섭, 완료·결과·진도 격리, 390×844·1024×768와 48px 동작.
- 최종 통합 결과는 `docs/tracking/status.md`의 2026-07-21 검증 기록을 권위 있는 수치로 사용한다.

## 다음 작업

1. 배포 요청이 있으면 의도한 파일만 스테이징·커밋·푸시하고 GitHub Actions 성공과 실제 `/math_assist` hydration을 확인한다.
2. 원격 기록은 guardian 확인·적법 근거·삭제/보존·연결 해제·세션 만료 정책, production provider와 distributed security, 의존성 감사를 해소한 뒤 비공개 staging부터 시작한다.
3. `[6수02-04]` 비례식과 다른 planned 기준은 새 단원·개념·문제군으로 별도 검토한다.
