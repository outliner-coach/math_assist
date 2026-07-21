# Phase 5A 선택적 원격 저장 로컬 준비 handoff

## 구현 범위

- `src/lib/remote-progress.ts`: baseline·receipt 멱등 합치기, learner/timestamp/중복 충돌 검사, recent activity 최신값, avatar 명시 선택
- `src/lib/legacy-progress-baseline.ts`: 1·2·3·5학년 과거 집계를 영수증으로 조작하지 않는 baseline snapshot으로 변환
- `src/lib/local-progress-backup.ts`: 알려진 진행·세션·홈·receipt 원문 7개 키의 정확한 백업, 변경 preview, 명시적 복원과 실패 rollback
- `src/lib/remote-progress-transport.ts`: revision conflict, offline, 다른 learner 숨김을 검증하는 provider 독립 contract-test transport
- `REMOTE_PROGRESS_ENABLED = false`: production 원격 호출 기본 비활성

## 원인과 경계

GitHub Pages 정적 앱에는 인증·DB·세션 철회·속도 제한을 운영할 서버가 없다. 따라서 화면부터 추가하면 로컬 기록을 잃거나 원격 저장이 된 것처럼 오해시킬 수 있다. 5A는 서버에 종속되지 않는 병합·백업 계약만 먼저 고정한다.

과거 진행은 개별 시도의 `attemptId`, `variantKey`, `usedHint`를 복원할 수 없으므로 `LegacyProgressBaseline`으로만 보낸다. 새 계약 적용 뒤 확인된 문제만 `AttemptReceipt`다.

## 검증 계약

- 같은 baseline identity와 attemptId는 한 번만 합친다.
- 같은 ID의 내용이 다르면 자동 덮어쓰지 않고 충돌이다.
- 다른 learner와 5분을 넘는 미래 시각은 거부한다.
- 양쪽 avatar가 다르면 사용자의 명시적 선택 전 적용하지 않는다.
- 백업은 PIN, 복구 코드, 답 원문, 풀이 획을 포함하지 않는다.
- 손상된 backup이나 receipt 원장은 기존 학년 기록을 다시 쓰지 않는다.
- mock transport의 stale revision, offline, 다른 learner 요청은 명시적 실패다.

## 실행한 집중 검증

```bash
npm test -- --run src/lib/legacy-progress-baseline.test.ts src/lib/local-progress-repository.test.ts src/lib/remote-progress.test.ts
npm test -- --run src/lib/local-progress-backup.test.ts src/lib/remote-progress.test.ts src/lib/attempt-receipt.test.ts
npm test -- --run src/lib/remote-progress-transport.test.ts src/lib/remote-progress.test.ts
npm run lint
```

집중 테스트와 lint가 통과했다. 전체 회귀·build·E2E는 병렬 Phase 2·4·6 파일이 안정된 뒤 순차 실행한다.

## 다음 단계와 공개 차단

5B staging 서버에는 PIN 검증값, 세션·철회, 계정/IP 속도 제한, 복구 코드, 감사 사건, 백업 복구가 필요하다. 5C production은 법정대리인 동의 확인과 개인정보 검토, 삭제·보존, 보호자 연결 해제, 세션 만료 정책이 승인될 때까지 차단한다.
