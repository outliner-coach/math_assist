# 현재 상태

기준일: 2026-07-21

## 상태 경계

- **실제 배포본**: GitHub Pages 정적 사이트이며 서버 계정·원격 저장 API가 없다. 2026-07-21 커밋 `14a0904`와 Pages 실행 `29792892987`로 4·6학년 공개 경로, 공통 receipt, 저장형 풀이장까지 실제 배포했다.
- **현재 작업트리**: 아래 단계 구현과 단계별 집중 검증이 반영되어 있다. 2026-07-21 최종 통합 test·lint·TDD guard·validator·audit·build·E2E를 개발 서버와 겹치지 않게 순차 실행했다.
- 이 문서에서 `released`는 curriculum ledger, 공개 경로 게이트와 실제 GitHub Pages 화면이 일치한다는 뜻이다. 이후 변경도 `main` 반영, Pages 성공, 새 브라우저 hydration을 모두 확인해야 출시 완료로 기록한다.

## 단계별 구현 상태

| 단계 | 상태 | 현재 결과와 경계 |
|---|---|---|
| 1. 숫자 입력 형식 | 완료 | 완성되지 않은 숫자·분수·대분수 형식은 오답, 답 잠금, 진도, receipt로 기록하지 않는다. |
| 2. 문제 청사진 | 완료 | 5학년 660개 모두 명시적 문제군·K/A/R 청사진과 의미 self-check를 통과한다. 발견된 9개는 문장·범위·solver·풀이를 함께 바로잡았다. |
| 3. 공통 활동·진도 | 완료 | 기존 학년별 localStorage 원문을 쓰지 않는 공통 read projection과 append-only attempt receipt가 현재 공개 대상인 1·2·3·4·5·6학년에 연결되어 있다. |
| 4. 풀이장·경험 프리셋 | 완료 | 정규화 벡터 획, 문제별 복구, clear, undo/redo, 펜·지우개, `play / bridge / study` 프리셋이 1·2·3·4·5·6학년에 연결되어 있다. |
| 5. 선택적 원격 저장 | 비공개 기반만 구현 | merge·rollback backup·엄격한 envelope, mock transport, auth core, one-time recovery와 동의 provisioning 기반이 있다. production flag는 `false`이며 공개 UI·API·실제 provider는 없다. 정책·provider·의존성 blocker가 해소되기 전 배포하지 않는다. |
| 6A. 교육과정 원장 | 완료 | 3~4·5~6학년군 공식 성취기준 92개를 versioned 원장에 배정하고 release reference를 검증한다. |
| 6B. 4학년 Bridge | 배포 완료 | `[4수01-01]`, `[4수01-02]` 큰 수 범위의 10개 문제 틀과 K/A/R 각 1개인 3문제 활동이 홈·이어하기와 연결되어 있다. 나머지 4학년 기준 20개는 `planned`다. |
| 6C. 6학년 Study | 배포 완료 | `unit-6-1-ratio`, `g6ratio-001`이 홈·이어하기와 연결됐다. A/B/C에 겹치지 않는 30개 문제군, 실제 정량 표, `[6수02-02/03]` 추적, 5/10문제, 손상 저장 명시적 복구, 48px·두 viewport 검증을 갖춘다. 비례식 성격의 `[6수02-04]` 범위는 이후 단원으로 남겼다. |

안전한 산술 parser도 적용했다. 템플릿 식은 더 이상 `eval`로 실행하지 않고 제한된 유한 십진수·괄호·사칙연산·단항 부호만 해석한다.

## 현재 학습 범위

- 1학년 96개 미션, 2학년 12개 단원·144개 미션, 3학년 36개 미션, 5학년 12개 단원·22개 개념·개념당 A·B·C 10문제 계약을 유지한다.
- 현재 작업트리는 4학년 큰 수 Bridge를 홈에서 선택하고 이어갈 수 있다. 손상된 4학년 기록은 원문을 보존하고 명시적 초기화 전 자동 저장을 막는다.
- 현재 작업트리는 6학년 비와 비율 Study를 홈에서 선택하고 5문제 또는 10문제로 학습할 수 있다. 손상된 6학년 세션·결과는 원문과 Grade 5 기록을 보존한 채 명시적 초기화 뒤에만 다시 시작한다.
- 공개 원장을 읽을 수 없거나 Grade 6 상태가 정확히 `released`가 아니면 저장 repository를 호출하기 전에 fail-closed한다.
- 정답·채점은 계속 규칙 기반이며 원격 AI 호출은 없다. AI는 향후 힌트 품질 필요성이 입증된 경우에도 정답·채점·원본 풀이를 결정할 수 없다.

## 2026-07-21 검증 기록

- 전체 Vitest 59개 파일 384/384, lint, TDD guard 통과.
- Grade 1·2·3·4·6, curriculum, template validator 통과: 각각 96, 144, 36, 10, 30개 콘텐츠와 공식 성취기준 92개를 확인했고 template metadata는 690/690이다.
- mission audit는 오류 0·경고 0, problem audit는 오류 0·경고 55다. Grade 6 경고는 0이며 나머지 경고는 다른 문제 은행의 문제군·인지 영역 최소 분포 차이를 공개하는 품질 개선 목록이다.
- clean production build에서 정적 페이지 75/75 생성, 전체 Playwright E2E 34/34 통과.
- Grade 6 Chromium E2E 5/5 통과: 홈 진입, 5/10문제, 실제 정량 표와 답 선노출 방지, 손상 저장의 명시적 복구, Grade 5 비간섭, 390×844·1024×768와 48px 경계를 확인했다.
- GitHub Pages 실행 `29792892987`의 원격 build·deploy가 성공했다. 새 브라우저에서 `/math_assist/`의 1~6학년 안내, `/home/`의 6학년 선택, `/grade/4/`의 `Released`, `/grade/6/`과 6학년 5문제 실세션 hydration, 콘솔 오류 0을 확인했다.
- `PracticeClient` Strict Mode 초기화 경합 집중 테스트 1/1, 반복 E2E 10/10, 추가 stress 20/20 통과. 오래된 초기화가 새 세션·화면·저장을 덮지 않는다.

## 남은 일

1. 원격 저장은 실제 guardian 확인 수단과 적법 근거, 삭제·보존·연결 해제·세션 만료 정책, production provider와 distributed rate limit, TLS·cookie·CORS/CSRF·감사 보존, 의존성 갱신을 마친 뒤 비공개 staging부터 검증한다.
2. 4·6학년의 나머지 `planned` 성취기준은 별도 단원·콘텐츠 검토와 같은 승격 게이트를 거쳐 추가한다.

## 막힌 결정

- 원격 계정의 삭제 후 보존 기간, 보호자 연결 해제 처리, 로그인 세션 만료 시간, guardian 확인·동의 증적 정책이 정해지지 않았다.
