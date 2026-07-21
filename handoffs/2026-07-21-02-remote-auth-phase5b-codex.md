# Phase 5B - 비공개 staging 인증 도메인 코어

## 구현 결과

- `src/lib/server/remote-auth-core.ts`는 `node:crypto`를 직접 사용하는 서버
  전용 모듈이다. 공개 route, UI, cookie, CSRF/CORS, DB provider는 추가하지 않았다.
- 계정 생성은 64-bit CSPRNG rejection sampling으로 편향 없는 12자리 숫자를
  만들고 repository collision을 재시도한다. 순차 ID는 노출하지 않는다.
- PIN은 ASCII 숫자 정확히 4자리만 허용한다. PIN과 일회성 128-bit recovery
  code는 각각 독립된 16-byte salt와 PBKDF2-SHA256 verifier만 저장한다.
  production 기본은 600,000회이며 `unsafeTestPbkdf2Iterations`는 단위 테스트
  외 사용을 금지한다.
- session 생성 시 256-bit opaque token을 한 번만 반환하고 repository에는
  SHA-256 hash만 저장한다. PIN 재설정과 self revoke-all은 기존 session
  generation을 모두 무효화하고 저장 session에도 철회 시각을 기록한다.
- recovery 회전은 `expectedCredentialVersion` compare-and-swap과 새 session
  생성을 하나의 repository 연산으로 묶어 동시 재사용 중 하나만 성공한다.
  성공 시 새 PIN, 새 recovery code, 새 session을 만들고 이전 recovery verifier와
  모든 session을 폐기한다.
- 로그인과 복구의 미존재 계정은 시작 시 만든 dummy verifier를 실제 verifier와
  같은 비용으로 계산한다. 잘못된 계정/비밀은 모두 `invalid-credentials`와
  `Authentication failed`로 응답한다.
- 로그인과 복구 limiter는 각각 학습 번호 전체, 네트워크 식별자 전체,
  학습 번호+네트워크 쌍의 hash bucket을 사용한다. 기본 15분 창에서 5회 실패
  후 15분 차단하므로 공격자가 네트워크 또는 계정 한쪽만 바꿔 우회할 수 없다.
- audit port에는 시각, 고정된 사건 종류, 결과, HMAC-SHA256 subject hash만
  전달한다. PIN, recovery code, session token, 원 학습 번호, 네트워크 식별자,
  답안과 풀이 데이터 필드는 존재하지 않는다.

## 원자 저장 포트

`RemoteAuthRepository`는 다음 원자성 경계를 요구한다.

- 중복 학습 번호나 token hash를 거부하며 계정과 첫 session을 함께 만들거나
  둘 다 만들지 않는 `createAccountWithSession`
- 계정과 session hash 조회
- credential version이 일치할 때만 PIN/recovery 교체, 기존 session 전체 철회,
  새 session 생성을 모두 수행하거나 아무것도 하지 않는
  `rotateCredentialsRevokeAndCreateSession`
- login이 만든 token hash의 중복과 session generation을 검사하는 `createSession`
- 내부에서 인증된 학습 번호의 session generation 증가와 기존 session 철회를
  수행하는 repository `revokeAllSessions`

공개 core의 self revoke-all은 학습 번호를 받지 않고 현재 `sessionToken`을
검증해 소유 학습 번호를 얻은 뒤에만 repository 포트를 호출한다.

`InMemoryRemoteAuthRepository`와 `InMemoryRemoteAuthAuditSink`는 contract test와
비공개 단일 프로세스 staging fixture다. 재시작하면 limiter 상태가 사라지고
다중 instance에서 실패 횟수를 공유하지 않으므로 production provider로 쓰지 않는다.

## 남은 결정과 연결 조건

- 실제 API origin, 암호화 연결 종단, cookie 또는 header 전달, CORS/CSRF,
  session 절대/유휴 만료, DB transaction, 분산 limiter, audit 보존·접근,
  backup/restore provider는 아직 결정하지 않았다.
- production cost로 코어를 만들 때는 32-byte 이상의 durable `auditPepper`를
  서버 비밀로 반드시 주입해야 한다. 자동 난수 pepper는 명시적 test-cost
  모드에서만 허용한다. `NEXT_PUBLIC_` 설정이나 client bundle에 넣으면 안 된다.
- 공개 route와 production remote flag는 법정대리인 동의 확인, 삭제·보존,
  session 만료, 운영 주체 결정 전까지 추가하거나 켜지 않는다.
- provider는 hostile/corrupt record를 반환할 수 있다는 전제로 verifier 반복 수,
  salt/hash 길이, learner/session identity, generation과 시각 범위를 유지해야 한다.

## 검증

- 집중 테스트는 PIN 형식, production cost, 무작위 학습 번호, salt 분리, 원문
  비밀 저장 금지, 동일 오류와 dummy verification, 계정/네트워크/쌍별 로그인·복구
  rate limit, recovery 단일·동시 1회 사용, session hash/token 기반 revoke-all,
  stable production audit pepper, 원자 계정 생성 실패 rollback, audit redaction,
  runtime bounds, client import 격리를 검사한다.
- `src/lib/server` 밖의 모든 production TS/TSX에서 server auth import를 금지하는
  경계 테스트와 Next production build를 함께 통과해야 client bundle 격리가
  유효하다.
- `npm test -- --run src/lib/server/remote-auth-core.test.ts`: 13/13 통과.
- `npm test`: 256/256 통과, unhandled rejection 0.
- `npm run lint`, `npm run tdd:guard`, `git diff --check`: 통과.
- `npm run build`: 인증 코어의 compile/type 단계에 도달하기 전 병렬 Phase 6
  변경인 `src/lib/grade4-progress.ts:55`의 Set spread target 오류로 중단됐다.
  오류는 `Type 'Set<string>' can only be iterated through when using the
  '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.`이며,
  소유 범위 밖 파일은 수정하지 않았다. 이 오류가 해결된 통합 상태에서 build를
  다시 통과해야 client bundle 격리 gate가 최종 완료된다.
