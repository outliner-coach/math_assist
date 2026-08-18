# 2학년 전 단원 응용문제 출시 승인

## 승인 기록

- 승인 문구: “네 배포까지 하고 계속 진행해주세요”
- 승인자: `project-owner`
- 승인 시각: `2026-08-18T05:48:48Z`
- 전문가 검수 상태: `not-reviewed`
- 검수 후보 근거: `docs/reviews/application-problems-grade2-candidate.md`

이 승인은 2학년 12개 complete pack과 검수 후보에 포함된 신규 family 50개의
정확한 버전 스냅샷을 기존 2학년 연습 흐름에 공개하는 데 한정된다. 교사·교육과정
전문가 검수를 뜻하지 않으며, 3~6학년의 미완성 후보를 미리 승인하지 않는다.

## 승인 범위와 보존 조건

- 2학년 12개 단원에 각 1개의 complete pack을 승인한다.
- 신규 family 50개는 후보 검수 때 실행한 대표·경계·독립 검산·시각·답 비노출·
  proof domain 근거와 동일한 `familyId@version`만 승인한다.
- 기존 `pack-g2-2-length@1`과 `g2-length-*@1` 세 유형의 의미, 승인 시각,
  release ledger와 과거 스냅샷은 변경하지 않는다.
- 새 연습은 기존 6개 ID 중 같은 인지영역 한 자리를 응용문제로 대체해
  일반 문제 5개와 응용문제 1개를 유지한다. knowing은 대체하지 않는다.
- 기존 완료·복습·보상·최근 활동, `mathAssist_grade2Progress` 이름과 정상 저장
  스냅샷을 보존한다. 생성·검산·필수 시각 실패 시 짧은 세션을 저장하지 않는다.

## 출시 조건

신규 유형은 실행 registry, owner 승인 정보, 깊게 동결된 release ledger가 정확히
일치하고 각 단원의 승인 pack 참조와 6/1 배치가 모두 확인될 때만 학습 후보가 된다.
rollout 원장은 `releasedThroughGrade: 2`, `buildingGrade: 3`으로 한 단계만
전진한다. 동일 커밋의 전체 로컬 게이트, 원격 `main` SHA와 Pages 배포 SHA 일치,
직접 HTTP, 새 브라우저 hydration·문구·시각·콘솔 오류 0이 확인되어야 공개 완료다.

## 로컬 출시 게이트

2026-08-18의 동일 변경에서 다음 출시 전 검증을 통과했다.

- Grade 2 validator: 144개 원본
- 교육과정 validator: 121개 성취기준, 1,803개 직접 연결
- application pack validator·audit: 62개 대상 단원, production family 59개,
  work·Grade 2 release 모드 오류 0
- mission·problem audit: 오류 0, 경고 0
- 전체 Vitest와 lint·TDD guard: 통과
- Promptfoo 문제 품질 평가: 1,483/1,483
- 정적 build: 114/114 페이지
- 전체 Playwright: 98/98

## 원격 배포와 공개 화면 확인

- `main`과 `origin/main`: `e84bc255e5e10148e929d767943f06131a0489e4`
- GitHub Actions: 실행 `32106502821`, build job `95616927853`, deploy job
  `95617256620`, 모두 성공
- GitHub Pages: deployment `5957328567`, status `16946833417`, 배포 SHA와
  제품 SHA 일치
- 환경 URL: `https://outliner-coach.github.io/math_assist/`
- 직접 HTTP: 환경 URL, `/grade/2/`, `/review/application-problems/` 모두 200
- 새 브라우저: 2학년 12개 단원, 연습 6문제 안의 실제 응용문제 한 자리,
  제출 전 `답: ?`, 검수 화면 production 59개와 대표·경계 독립 검산 확인
- 390×844·1024×768 검수 화면 레이아웃 정상, 학습·검수 화면 콘솔 오류·경고 0

이 확인으로 승인 범위의 공개 완료 조건을 충족했다. 3학년 이후 후보와 전문
교과 검수는 별도 승인 대상이다.
