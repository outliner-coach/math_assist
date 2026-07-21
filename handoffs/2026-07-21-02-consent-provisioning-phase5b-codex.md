# Phase 5B - 법정대리인 동의 기반 원격 계정 provisioning

## 구현 경계

- `src/lib/server/remote-account-provisioning.ts`는 `node:crypto` 전용이며 공개
  route, UI, cookie, guardian 연락처 수집, consent provider를 추가하지 않는다.
- route나 provider가 `RemoteAuthCore.createAccount`를 직접 호출하는 대신
  `RemoteAccountProvisioningService.provision`에 one-time authorization token,
  pre-account learner binding token, 4자리 PIN을 전달하는 계약이다.
- service는 repository의 원자 callback 안에서 저장 artifact를 runtime 검증한
  뒤에만 기존 auth core의 `createAccount`를 호출한다.

## 최소 consent artifact

저장 artifact는 다음 필드만 가진다.

- schema version과 opaque artifact ID
- raw authorization 대신 SHA-256 token hash
- 계정 생성 전 learner request secret 대신 SHA-256 binding hash
- `authorized | consumed | revoked` 상태
- `remote-progress-account` 목적과 주입된 정책 버전
- 발급, guardian 동의, guardian 확인, 만료 시각
- 동의자 확인 provider가 준 원문 증적 대신 SHA-256 receipt hash
- 소비된 경우에만 소비 시각과 생성된 12자리 learner number

guardian 이름, 이메일, 전화번호, 학교, raw 확인 증적, raw authorization/binding,
PIN, recovery code, session token은 artifact와 provisioning audit에 없다.

## 원자성과 권한

- `ConsentProvisioningRepository.consumeAuthorizationAndProvision`은 token hash별
  동시 요청을 직렬화하고 authorization 검증, auth account+첫 session 생성,
  `consumed` 전환을 하나의 transaction으로 처리해야 한다.
- callback 또는 최종화 실패는 authorization 상태와 auth account/session을 모두
  원복한다. in-memory fixture는 auth repository snapshot transaction으로 이
  계약을 구현하며 최종화 실패 주입 테스트를 제공한다.
- learner binding mismatch는 authorization을 소비하지 않는다. 같은 token의
  동시 replay는 하나만 성공하고 이후 다른 PIN 또는 binding으로 재사용해도 새
  account를 만들지 않는다.
- provisioning audit는 시각, 고정 사건 종류, 성공/실패, HMAC subject hash만
  가진다. audit transport 실패는 이미 commit된 계정을 실패 응답으로 바꾸지 않는다.

## 미결정 blocker

- 실제 법정대리인 동의의 법적 적합성과 동의자 확인 수단
- 동의 확인에 먼저 받을 수 있는 최소 guardian 정보와 처리 provider
- artifact와 확인 증적의 접근 권한, 보존 기간, 철회·삭제·분쟁 대응
- 실제 DB transaction, distributed replay lock, API origin, TLS, cookie/CSRF/CORS
- learner/account/session 삭제와 절대·유휴 session 만료 정책

이 항목은 개인정보 검토와 아키텍처 승인 전 임의 구현하지 않는다. production
remote flag는 계속 `false`이고 게스트·로컬 학습은 영향받지 않는다.

## 검증 범위

- 동의 전 learner/account/session 0
- 유효한 authorization 성공 시 token 소비와 account+session 동시 생성
- auth 생성 실패와 consent 최종화 실패 시 token 미소비/account orphan 0
- 만료, 미래 확인, revoked, 목적/정책 불일치 거부
- learner binding IDOR, 순차·동시 replay, 다른 PIN 재사용 거부
- raw guardian contact, authorization, binding, recovery/session secret 저장·감사 0
- malformed artifact와 과대 request 입력의 mutation 전 거부

검증 명령:

- `npm test -- --run src/lib/server/remote-account-provisioning.test.ts
  src/lib/server/remote-auth-core.test.ts`: 24/24 통과
- `npm run lint`: 통과
- `npm run tdd:guard`: 통과
- `git diff --check`: 통과
