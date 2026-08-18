# 3학년 전 단원 응용문제 출시 승인

## 승인 기록

- 승인 문구: “네 승인하고 배포합니다.”
- 승인자: `project-owner`
- 승인 시각: `2026-08-18T09:24:24Z`
- 전문가 검수 상태: `not-reviewed`
- 검수 후보 근거: `docs/reviews/application-problems-grade3-candidate.md`

이 승인은 3학년 12개 complete pack과 후보 검수에 포함된 family 48개의 정확한
버전 스냅샷을 기존 3학년 연습 흐름에 공개하는 데 한정된다. 교사·교육과정
전문가 검수를 뜻하지 않으며, 4~6학년의 미완성 후보를 미리 승인하지 않는다.

## 승인 범위와 보존 조건

- 3학년 12개 단원에 각 1개의 complete pack을 승인한다.
- family 48개는 후보 검수에서 실행한 대표·경계·독립 검산·시각·답 비노출·
  전수 proof 근거와 동일한 `familyId@version`만 승인한다.
- 연습은 기존 K/A/R 3개 ID 중 applying 또는 reasoning 한 자리를 응용문제로
  대체하고 knowing은 대체하지 않는다.
- 기존 미션 ID·인지영역·보상, 완료·복습·최근 활동과
  `mathAssist_grade3Progress` 형식을 보존한다.
- 생성·독립 검산·필수 정량 시각·정식 ledger 중 하나라도 실패하면 3문제 전체
  세션을 차단하며 부분 세션을 저장하거나 일반 문제로 조용히 대체하지 않는다.

## 출시 조건

신규 유형은 실행 registry, owner 승인 정보, 깊게 동결된 release ledger가 정확히
일치하고, 실행 코드에서 독립된
`public/data/application-problems/grade3-approved-family-snapshots-v1.json`의
48개 SHA-256 스냅샷과 각 단원의 승인 pack 참조·3/1 배치가 모두 확인될 때만
학습 후보가 된다.
rollout 원장은 `releasedThroughGrade: 3`, `buildingGrade: 4`로 한 단계만 전진한다.
동일 커밋의 전체 로컬 게이트, 원격 `main` SHA와 Pages 배포 SHA 일치, 직접 HTTP,
새 브라우저 hydration·문구·시각·콘솔 오류 0이 확인되어야 공개 완료다.

## 로컬 출시 게이트

- 3학년 validator는 120개 원본을 확인했고, application pack work와 3학년
  release audit는 62개 단원·production family 107개·오류 0을 확인했다.
- 교육과정 원장은 성취기준 121개와 직접 연결 1,803개를 확인했다. mission과
  problem audit는 오류·경고 0, 전체 Vitest는 118개 파일 1,279/1,279,
  Promptfoo는 1,483/1,483을 통과했다.
- lint, TDD guard, 정적 build 114/114와 전체 Playwright 101/101을 통과했다.
  실제 3학년 연습 E2E는 승인 응용문제 한 자리, 제출 전 `답: ?`, 독립 채점,
  정답 공개와 기존 안정 미션 ID의 `mathAssist_grade3Progress` 기록을 확인한다.
  390×844와 1024×768에서 단원별 네 family의 저장 실행 번호 순환, 가로
  넘침 없음, 내부 변수명 비노출을 함께 확인했다.

## 원격 배포와 공개 화면 확인

원격 `main`과 GitHub Pages의 실제 SHA, Actions 실행, 직접 HTTP와 새 브라우저
확인 결과를 배포 완료 뒤 이 절에 기록한다.
