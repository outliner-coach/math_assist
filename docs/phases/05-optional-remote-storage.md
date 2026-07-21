# 5단계 - 선택적 원격 저장, 계정, 복구, 보호자 연결

## 목표와 범위

게스트·기기 로컬 학습을 그대로 유지하면서 기록을 지키려는 학습자에게 선택적 원격 저장을 제공한다. 계정 식별자는 서버가 만든 추측하기 어려운 학습 번호, 인증 비밀은 4자리 숫자 비밀번호다. 최초 동기화 범위는 완료, 복습, 최근 활동, 선택 아바타다. 풀이 획과 UI 상태는 제외한다.

이 단계는 현재 GitHub Pages 정적 배포만으로 완성할 수 없다. 서버, 암호화 연결, 세션 철회, 속도 제한, 복구 코드, 감사 사건, 백업·복구 운영이 필요하다.

## 메인 제안서와 최신 결정의 정합성

메인 제안서와 승인된 `0003-guest-first-child-login`, `business-rules.md`, `security.md`의 제품 계약은 다음과 같이 정렬했다.

- 학습 시작은 항상 게스트다.
- 어린이는 보호자 승인 없이 로컬 UI에서 `기록 저장하기`를 선택할 수 있다.
- 학습 번호 + 4자리 숫자 비밀번호 + 일회성 복구 카드가 기본 계정 UX다.
- 보호자 연결은 선택 기능이며 어린이 이메일·실명·학교 정보는 요구하지 않는다.

다만 로컬 UX 승인과 원격 개인정보 처리의 공개 배포 적법성은 별개다. [개인정보 보호법 제22조의2](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1029334873)는 만 14세 미만 아동의 개인정보 처리에 법상 동의가 필요한 경우 법정대리인 동의와 그 확인을 요구한다. 따라서 어린이 단독 학습 번호/PIN 흐름은 로컬 또는 비공개 staging UX로 준비할 수 있지만, 원격 계정을 공개 배포하기 전에는 적용 가능한 적법 근거, 법정대리인 동의·확인 흐름, 아동이 이해할 수 있는 고지, 개인정보 검토를 확정해야 한다. 이 검토 결과가 현재 제품 결정을 수정해야 한다면 결정 기록과 `business-rules.md`를 먼저 갱신한다. 게스트·로컬 학습은 어떤 결과에서도 막지 않는다.

## 현재 배포 차단 결정

다음 항목은 공개 원격 로그인 전에 반드시 결정되어야 한다.

1. 계정 삭제 요청 즉시 접근 차단 여부와 서버 기록의 복구 유예·영구 삭제 시점
2. 보호자 연결 해제 즉시 복구 권한 철회 여부와 남은 세션 처리
3. 학습자·보호자 세션의 절대 만료, 유휴 만료, 위험 사건 시 전체 철회 시간
4. 만 14세 미만 원격 개인정보 처리의 적법 근거와 필요한 법정대리인 동의·확인 방식
5. API 호스팅, 공개 origin, 세션 전달 방식, CORS/CSRF 경계와 운영 주체
6. 선택적 보호자 연결의 인증 방법, 연결 승인 주체, 계정 복구 권한 범위

1~4는 제품·개인정보 결정이며 구현자가 임의로 정하지 않는다. 5~6은 보안 아키텍처 기록으로 승인한다. 결정 전에도 저장 포트, 병합 함수, migration preview, mock API, 비공개 staging은 진행할 수 있지만 기능 플래그 기본값은 꺼진 상태여야 한다.

## 상태와 데이터 계약

```ts
type LearnerLinkState = 'guest' | 'link-pending' | 'linked' | 'sync-conflict' | 'offline'

interface RemoteProgressEnvelope {
  schemaVersion: 1
  learnerId: string
  revision: string
  legacyBaselines: LegacyProgressBaseline[]
  receipts: AttemptReceipt[]
  recentActivity: { grade: number; activityId: string; at: number } | null
  avatarId: string | null
  updatedAt: number
}
```

규칙:

- 과거 집계를 가짜 receipt로 변환하지 않고 baseline snapshot으로 한 번 이관한다.
- `sourceKey + sourceSchemaVersion + sourceHash`가 같은 baseline은 멱등적으로 한 번만 받는다.
- 새 receipt는 `attemptId` 집합 합치기로 병합한다.
- 완료·복습을 줄이는 병합은 기본 자동 병합으로 허용하지 않는다.
- recent activity는 유효한 최신 시각을 사용하고, 미래 시각·비정상 시각은 거부한다.
- avatar 충돌은 revision과 명시적 사용자 선택으로 해결한다. 오래된 원격 값이 최근 로컬 선택을 조용히 덮지 않는다.
- 병합 전 차이를 미리 보여 주고 원문 localStorage의 복구 가능한 로컬 백업을 만든다.
- 서버 확인 전 로컬 기록을 삭제하거나 “동기화 완료”라고 표시하지 않는다.
- 원격 envelope는 타입 선언만 신뢰하지 않고 허용 필드, 배열 크기, 식별자 길이,
  시각, receipt learner 결합을 런타임 검증한다. raw answer나 sketch command 같은
  알 수 없는 필드가 있으면 읽기·병합 전에 거부한다.

## 내부 API 초안

`docs/contracts.md`가 갱신되기 전까지 아래는 외부 약속이 아니라 provider 독립적인 contract-test 표면이다.

| 동작 | 성공 결과 | 필수 실패 의미 |
|---|---|---|
| 계정 생성 | 학습 번호, 한 번만 보이는 복구 코드, 철회 가능한 세션 | 생성 실패 시 로컬 유지 |
| 로그인 | 학습 번호+PIN 검증 뒤 세션 | 번호/PIN 구분 없는 동일 오류, 지연·일시 차단 |
| 로그아웃/철회 | 현재 또는 전체 세션 무효화 | 철회 실패를 완료로 표시하지 않음 |
| progress 조회 | revision 포함 envelope | 다른 learner 접근 404/403, 데이터 0 |
| progress 병합 | 새 revision과 서버 확인 | revision conflict를 명시적으로 반환 |
| 복구 코드 사용 | PIN 재설정, 기존 세션 철회, 새 복구 코드 | 재사용 코드 거부 |
| 보호자 연결/해제 | 양쪽 승인과 권한 상태 | 연결되지 않은 어린이 검색·열람 금지 |
| 계정 삭제 | 정책에 따른 상태와 완료 시각 | 모호한 성공 응답 금지 |

## 보안 계약

- PIN 원문은 localStorage, IndexedDB, 서버 데이터, 로그, 오류, 분석에 남기지 않는다.
- 서버는 계정별 임의값과 느린 비밀번호 검증 방식으로 PIN 검증값만 저장한다. 클라이언트 해시는 서버 검증을 대신하지 않는다.
- 학습 번호는 암호학적으로 안전하게 생성하고 순차 ID를 노출하지 않는다.
- 로그인·복구·연결은 암호화된 연결에서만 수행한다.
- 세션 비밀은 JavaScript가 읽는 영구 저장소에 두지 않는 구성을 우선한다. 정적 사이트와 API origin이 다른 경우 cookie/CORS/CSRF와 Safari 동작을 아키텍처 결정에서 입증한다.
- 실패 지연은 계정과 접속 지점 양쪽을 기준으로 하고, 계정 존재 여부를 응답 시간·문구로 드러내지 않는다.
- 로그아웃, PIN 재설정, 계정 삭제는 정책 범위의 기존 세션을 모두 철회한다.
- 복구 코드는 가입·성공적 재설정 때 한 번만 원문을 보이고 서버에는 검증값만 둔다.
- 감사 사건은 시각, 종류, 익명화 식별자, 결과만 기록한다. PIN, 복구 코드, 답안, 풀이 획은 기록하지 않는다.
- API의 모든 읽기·쓰기는 인증 learner/guardian 관계를 서버에서 다시 확인한다. client learnerId를 신뢰하지 않는다.
- 접속 지점 식별자는 요청 body가 아니라 신뢰하는 edge/server 계층에서 만들고,
  production limiter는 모든 instance가 공유하는 저장소에서 원자적으로 갱신한다.
- 백업 암호화, 복구 훈련, 최소 권한 운영자 접근, 비밀 회전 절차를 문서화한다.

## 구현 단계

### 현재 구현 상태 (2026-07-21)

- 5A 로컬 준비 구현: legacy baseline 생성, attempt receipt 집합 합치기, revision/avatar/future-time 충돌 preview, 원문 localStorage 백업·복원, provider 독립 transport contract와 in-memory fixture가 있다.
- 5B 비공개 staging 인증 도메인 코어: `src/lib/server/remote-auth-core.ts`에
  Node crypto 전용 경계, 원자 repository/audit port와 in-memory fixture가 있다.
  12자리 학습 번호는 편향 없이 암호학적 난수로 만들고, PIN은 정확히 ASCII
  숫자 4자리만 받는다. PIN과 일회성 복구 코드는 계정별 16-byte salt와
  PBKDF2-SHA256 verifier만 저장하며 production 기본 반복 수는 600,000회다.
  session은 256-bit opaque token의 SHA-256 hash만 저장한다.
- 로그인·복구는 올바른 형식의 미존재 계정에도 dummy verifier를 같은 비용으로
  계산하고 같은 `Authentication failed` 오류를 사용한다. 작업별 계정 전체,
  네트워크 전체, 계정+네트워크 쌍의 실패 limiter를 함께 적용해 네트워크를
  바꾸는 PIN 공격과 계정을 바꾸는 네트워크 공격을 모두 제한한다.
- 복구 코드의 원자적 1회 회전, PIN 재설정+기존 session 전체 철회+새 session
  원자 생성, 유효한 기존 session token으로만 가능한 self revoke-all, 안정적인
  서버 audit pepper 기반 HMAC 가명 감사 사건을 구현했다.
- 원격 계정 생성 앞단에는 `src/lib/server/remote-account-provisioning.ts`의
  법정대리인 동의 provisioning gate를 둔다. 저장 artifact는 raw authorization이나
  guardian 연락처가 아니라 token hash, pre-account learner binding hash, `authorized /
  consumed / revoked` 상태, 목적, 정책 버전, 동의·확인 시각, 만료 시각, 확인
  receipt hash만 가진다. 유효하고 미소비이며 아직 만료되지 않은 authorization을
  같은 learner request가 제시할 때만 기존 auth core의 계정 생성을 호출한다.
- authorization 소비와 계정+첫 session 생성은 같은 provider transaction에서 모두
  성공하거나 모두 원복되어야 한다. in-memory fixture는 auth repository snapshot
  transaction으로 이 계약과 동시 replay 1회 성공을 검증한다. 실제 동의의 법적
  적합성, 동의자 확인 방법, 동의 증적 보존·철회·삭제 기간은 구현값으로 정하지
  않았으며 계속 공개 배포 blocker다.
- 이 코어는 HTTP route, cookie, CORS/CSRF, DB provider, session 만료 정책을
  정하지 않았고 `src/app`·`src/components`를 포함한 client production source에서
  import하지 않는다. in-memory limiter와 repository는 test/private single-process
  fixture이며 다중 instance production 보안 경계가 아니다.
- production 원격 기능 플래그는 코드 상수 `false`이며 공개 API route나 계정 화면은 없다.
- 5B 이후는 삭제·보존, 연결 해제, 세션 만료, 법정대리인 동의 확인, API 운영 주체가 승인되기 전 공개 배포하지 않는다.
- 구현 근거와 검증 명령은 `handoffs/2026-07-21-04-remote-storage-phase5a-codex.md`에 기록한다.
- 5B 서버 코어 구현 근거와 provider 연결 전 제약은
  `handoffs/2026-07-21-02-remote-auth-phase5b-codex.md`에 기록한다.
- 동의 provisioning 원자 경계와 미결정 개인정보 조건은
  `handoffs/2026-07-21-02-consent-provisioning-phase5b-codex.md`에 기록한다.

### 5A - 안전한 로컬 준비

- 3단계 repository port와 `RemoteProgressEnvelope` 순수 병합 함수를 만든다.
- migration preview와 raw-key 백업/복원 함수를 테스트한다.
- 원격 기능 플래그 기본값은 `false`이며 게스트 경로에는 원격 호출이 없어야 한다.
- mock transport contract test를 만든다.

Gate 5A: 원격이 없거나 실패해도 모든 학년이 로컬에서 시작·저장·복구된다.

### 5B - 비공개 staging 인증·동기화

- 서버 저장소, PIN 검증, 세션·철회, 속도 제한, 복구 코드, 감사 사건을 구현한다.
- 다른 학습자 IDOR, 로그인 enumeration, replay, revision conflict, offline 재시도를 자동화한다.
- 첫 동기화는 baseline + receipt + recent + avatar만 허용한다.

Gate 5B: staging 보안·백업 복구·충돌 E2E 통과. 공개 링크나 production flag 활성화 금지.

### 5C - 법·정책 승인과 제한 공개

- 위 배포 차단 결정 1~6을 결정 기록과 공개 정책에 반영한다.
- 필요한 법정대리인 동의·확인과 아동용 고지를 실제 브라우저에서 검증한다.
- `contracts.md`, `security.md`, `operations.md`에 실제 API, 오류, 삭제, 지원 절차를 기록한다.
- 점진 rollout과 즉시 disable/rollback을 준비한다.

Gate 5C: 법률·개인정보 검토 승인, 삭제/해제/만료 테스트, 운영 복구 리허설, 게스트 경로 회귀 0.

### 5D - 선택적 보호자 연결

- 보호자 인증과 어린이의 명시적 연결 승인, 권한 확인, 해제를 구현한다.
- 보호자는 연결된 어린이만 복구 지원할 수 있고, 답안·풀이 원문은 초기 권한에 포함하지 않는다.
- 연결 해제 즉시 복구 권한과 정책 범위 세션을 철회한다.

Gate 5D: 미연결 어린이 탐색·열람 0, 해제 후 접근 0, 감사 사건과 복구 경로 일치.

## 필수 E2E와 운영 증거

- 게스트 첫 문제에 계정 벽 없음
- 계정 생성 실패/네트워크 중단 후 로컬 원문 유지
- 다른 기기 로그인, 잘못된 번호/PIN 동일 오류, 속도 제한
- 복구 카드 1회 사용과 재사용 거부, 전체 세션 철회
- 로컬/원격 conflict preview, 완료·복습 무손실 병합, rollback
- offline 학습 뒤 재연결 멱등 동기화
- 다른 learnerId 직접 요청과 guardian 관계 위조 차단
- 삭제·보존, 보호자 해제, 세션 만료를 결정된 시간으로 검증
- 백업에서 staging 복구 후 revision·receipt 일치
- 감사 로그에 PIN·복구 코드·답안·sketch가 없음을 검사

## 완료 조건

공개 원격 계정은 코드가 존재하는 것만으로 완료가 아니다. 위 차단 결정, 법·개인정보 검토, 실제 운영 인프라, 보안 테스트, 백업 복구, 브라우저 E2E가 모두 통과하고도 로그인 없는 로컬 학습이 그대로 가능해야 완료다.
