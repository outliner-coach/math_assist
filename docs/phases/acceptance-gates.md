# 3~6단계 공통 의존성·승인 게이트

## 게이트 원칙

- 각 요구사항은 직접 증명하는 테스트·렌더·운영 결과를 가진다.
- `src/**` 또는 `public/data/**` 변경은 집중 테스트와 `tdd:guard` 없이 병합하지 않는다.
- 개발 서버와 `next build`를 동시에 실행하지 않는다.
- static HTML 200만으로 hydration, localStorage 복구, 버튼 상태를 통과 처리하지 않는다.
- 자동 검사 통과 뒤에도 어린이용 흐름은 실제 브라우저와 학년군별 관찰로 확인한다.
- 원격 계정은 로컬 build가 아니라 실제 staging/production 보안·복구 증거가 필요하다.

## 단계 의존성 표

| 소비 단계 | 반드시 먼저 참이어야 하는 것 | 차단 증거 |
|---|---|---|
| 3 공통 활동 | 1단계 형식 오류가 오답과 분리됨 | format-error가 receipt/오답을 만들면 차단 |
| 4 풀이장 | 3단계 stable sessionId/itemId/repository | index만으로 sketch를 저장하면 차단 |
| 5 원격 저장 | 3단계 baseline/receipt/progress port | 과거 집계를 가짜 receipt로 만들면 차단 |
| 6 콘텐츠 | 2단계 blueprint·K/A/R validator | difficulty만으로 reasoning을 통과하면 차단 |
| 6 UI | 4단계 preset·ScratchPad | 4·6만 별도 의미로 복제하면 차단 |

## 요구사항별 증거

| 요구사항 | 권위 있는 증거 | 합격 |
|---|---|---|
| 기존 기록 무손실 | 학년별 raw localStorage before/after 픽스처 | 알려진 필드·원문 의도치 않은 변경 0 |
| 공통 진도 의미 | 1·2·3·5 legacy baseline + 새 receipt projection | resume/completed/review/recent 일치 |
| 시도 멱등성 | 반복 탭·reload·동일 attemptId 테스트 | 확인 1회당 receipt 1개 |
| 형식 오류 | `1/`, `-`, `.`, 구조화 미완성 입력 E2E | 답 잠금·오답·receipt 0 |
| 풀이장 | reducer, repository, WebKit pixels, E2E | 모든 제공 학년 input/undo/problem restore 통과 |
| 프리셋 | resolver 단위 테스트와 학년군 UI E2E | 문제 수·표현만 다르고 채점 의미 동일 |
| 원격 병합 | baseline hash, receipt set union, revision conflict | 완료·복습 손실 0, local rollback 가능 |
| 계정 보안 | IDOR, enumeration, throttle, revoke, recovery, audit tests | 비인가 접근·비밀 로그 0 |
| 아동 개인정보 | 적법 근거·법정대리인 동의/확인·고지 검토 기록 | 검토 승인 전 production flag off |
| 4·6 교육과정 | official code ledger와 validator report | 출시 문제 traceability 100% |
| K/A/R | unit/concept coverage report | 전 단원 K/A/R, reasoning family >= 2 |
| 정량 시각 | 모델/위상/비율/라벨/DOM pair tests | 위상 100%, ±10%, 선노출 0 |
| 정적 배포 | build route inventory + 실제 배포 브라우저 | `/math_assist` 자산·hydration·console 오류 0 |

## 자동 검증 묶음

변경 범위에 맞는 집중 테스트 뒤 아래를 순차 실행한다.

```bash
npm run lint
npm test
npm run tdd:guard
npm run validate:templates
npm run validate:grade1
npm run validate:grade2
npm run validate:grade3
npm run validate:grade4
npm run validate:grade6
npm run audit:missions
npm run audit:problems
npm run build
npm run test:e2e
git diff --check
```

`validate:grade4`, `validate:grade6`은 6단계 구현과 함께 추가됐다. 이후 4·6학년 콘텐츠 변경에서도 validator와 실패 fixture를 같은 변경에 유지한다.

## 브라우저 매트릭스

| 환경 | 필수 시나리오 |
|---|---|
| Chromium 390×844 | 학년 선택, 첫 문제 3탭 이내, 입력/피드백, 가로 스크롤 0 |
| Chromium 1024×768 | 문제·답·풀이장 동시 맥락, 48px, 고정 행동 가림 0 |
| WebKit 1024×768 | 선택 문자열 0, cancelable touch, 실제 painted pixels, undo/restore |
| 새 브라우저 profile | 게스트 첫 시작, 저장 불가 대체, 계정 벽 없음 |
| legacy profile | 1·2·3·5 과거 기록 이어하기와 raw-key 보존 |
| 원격 staging profile | 생성/로그인/offline/conflict/recovery/revoke/guardian |

4·6학년 승격 뒤에는 같은 매트릭스에 두 학년을 추가한다. 5단계 공개 전에는 실제 iPad Safari·Chrome에서 게스트 학습과 필요한 동의·로그인 흐름을 확인한다.

## 사용자 관찰 게이트

각 `play`, `bridge`, `study` 학년군에서 최소 3~5명의 짧은 관찰을 수행한다.

1. 설명 없이 학년 선택 뒤 첫 문제 시작
2. 오답 뒤 다시 시도
3. 풀이장에 쓰고 문제 이동 뒤 복귀
4. 앱을 닫고 이어하기
5. 완료 뒤 다음 행동 선택

기록 항목은 주요 탭 수, 멈춘 위치, 잘못 누른 행동, 도움 요청, 재도전, 자발적 다음 문제다. “재미있다” 응답만으로 프리셋을 승인하지 않는다.

## 공개 배포 차단 목록

다음 중 하나라도 남으면 해당 기능은 production에 노출하지 않는다.

- 수학적 오답·채점 불일치 또는 정답 선노출
- 기존 완료·복습·최근 활동 손실 또는 다른 학년 기록 손상
- 풀이장 WebKit 회귀, 문제 간 획 혼합, active sketch 자동 삭제
- 4·6학년 공식 코드 미배정, validator 오류, K/A/R 공백
- 원격 계정 삭제 보존, guardian 해제, session 만료 미결정
- 만 14세 미만 원격 개인정보 처리의 적법 근거와 필요한 법정대리인 동의·확인 미승인
- PIN·복구 코드 노출, IDOR, 속도 제한·세션 철회·백업 복구 실패
- 로컬 검증과 실제 배포 화면 불일치

차단된 원격 기능과 별개로 게스트·로컬 학습은 계속 제공한다.

## 단계 완료 보고 형식

각 단계 종료 보고에는 다음을 포함한다.

- 구현된 요구사항과 소유 파일
- 이전 형식·오류·보안 fixture 목록
- 실행한 명령과 종료 결과
- 브라우저·기기·뷰포트와 실제 관찰 결과
- 배포 URL/워크플로 결과가 있는 경우 실제 hydration 확인
- 남은 blocker와 production에서 비활성인 기능

“테스트 통과”라고만 쓰지 않고 각 테스트가 어떤 계약을 증명하는지 연결한다.
