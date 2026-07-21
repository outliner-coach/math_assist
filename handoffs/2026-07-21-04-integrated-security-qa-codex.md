# 통합 저장·원격 인증 보안 QA

## 범위와 기준

`security-best-practices`의 JavaScript/TypeScript, React, Next.js 서버 경계를
기준으로 새 receipt, 로컬 backup, 풀이장, 원격 병합, 인증, 동의 provisioning을
검토했다. production 원격 기능은 여전히 코드 상수 `false`이며 공개 API route나
계정 UI는 없다.

## 이번에 닫은 결함

- 원격 envelope를 엄격한 런타임 allowlist로 바꿨다. 모든 baseline/receipt/recent
  필드, 배열 개수, 문자열 길이, 안전한 시각, receipt 학습자 결합을 검사하고
  `answer`, sketch `commands`, 알 수 없는 필드, 다른 학습자의 receipt는 읽기·병합
  전에 거부한다. test-only transport도 생성 시 최초 envelope를 검증한다.
- 동의 provisioning의 `acceptedPurpose`는 타입과 런타임 모두
  `remote-progress-account` 리터럴만 허용한다. repository 포트는 token hash별
  직렬화, 동의 읽기/검증, transaction-bound auth account/session 쓰기, 동의 소비를
  같은 DB transaction에 두고 예외 시 전부 rollback해야 한다. 최종화 실패 테스트는
  account/session 0과 미소비 authorization을 확인한다.
- 인증 코어의 BigInt/Map 순회를 현재 TS target 호환 방식으로 고쳤다. repository,
  audit, clock, random 포트 형상을 생성 시 검증하고, redacted audit transport 실패가
  이미 commit된 계정/session/recovery 결과를 orphan으로 만들지 않게 했다.
- Grade 1/2/3 손상 progress는 더 이상 로드 시 삭제하지 않는다. 같은 storage는
  명시적 reset 전 자동 save를 거부한다. 손상 sketch도 빈 화면 복구는 제공하지만
  다음 획으로 원문을 덮어쓰지 않고 `corrupt` 저장 상태를 알린다.
- local progress rollback backup의 정확한 허용 키에 Grade 4 progress와 Grade 6
  progress/current session을 포함했다. current session에는 기기에서 작성 중인 답이
  있을 수 있으나 이 backup은 원격 payload가 아니다. 사용자 답·문제 스냅샷이 있는
  Grade 6 last result, 계정 PIN/token/recovery, sketch는 allowlist에서 제외한다.
- KaTeX 렌더링은 `trust: false`를 명시하고 HTML attribute command 회귀 테스트를
  추가했다. 서버 auth/provisioning은 client production source에서 import되지 않는다.

## 남은 공개 배포 blocker와 보고 사항

1. **High - 의존성 갱신 필요.** `npm audit --omit=dev --json`은 Next 14.2.21의
   middleware authorization bypass를 포함한 누적 advisory, KaTeX 0.16.11,
   Playwright 1.50.1, Next 내부 PostCSS를 보고했다(critical 1, high 2,
   moderate 2 package). 현재 GitHub Pages static export에는 middleware/API/image
   optimizer가 없어 Next 서버 항목 대부분이 활성 공격면은 아니지만, 원격 API를
   공개하기 전 지원되는 Next/React 계열과 KaTeX/Playwright로 올리고 audit 0 또는
   승인된 예외를 만들어야 한다.
2. **High - production auth/provider 미구현.** in-memory repository와 limiter는
   단일 프로세스 fixture다. 실제 provider는 동의+auth transaction, distributed
   rate limit, 서버에서 도출한 network identifier, session 절대/유휴 만료,
   TLS, cookie/header, CORS/CSRF, audit 보존, backup/restore를 승인된 설계로
   구현해야 한다. 이 전에는 remote flag와 공개 route를 열면 안 된다.
3. **해결됨 - 동적 산술 평가.** 후속 작업에서 `src/lib/problem-generator.ts`의 두
   `eval` 호출을 제한된 산술 parser로 교체했다. parser는 유한 십진수, 괄호,
   `+ - * /`, 단항 부호만 허용하고 지수, 식별자, 비유한 수, 0 나눗셈, 후행
   토큰을 거부한다. 5학년 전체 템플릿과 6학년 생성 회귀 및 품질 감사 로더가
   같은 경계를 확인한다.

통합 중 소유 agent가 Grade 4와 Grade 5 progress/session/result에도 손상 원문
보존, 자동 save/clear 거부, 명시적 reset 경계를 적용했다. Grade 6 경계와 함께
focused test에서 확인한 뒤 release해야 한다.

## 확인 결과

- secret/PII를 새 localStorage allowlist나 원격 envelope에 넣는 production 코드는
  발견하지 못했다. 기존 Grade 5 local session의 raw answer는 기기 로컬 계약이며
  remote envelope 검증이 이를 거부한다.
- receipt는 정오답, hint, identity와 시각만 저장하고 raw answer/sketch를 포함하지
  않는다. 손상 receipt ledger는 자동 덮어쓰지 않는다.
- 다른 learner IDOR, PIN/recovery brute force, one-time recovery/consent replay,
  redacted audit 필드, server-only import, feature flag `false`를 집중 테스트로 확인했다.

## 검증 명령

- `npm test -- --run src/lib/server/remote-auth-core.test.ts src/lib/server/remote-account-provisioning.test.ts src/lib/remote-progress.test.ts src/lib/remote-progress-transport.test.ts`
- `npm test -- --run src/lib/sketch-document.test.ts src/lib/sketch-repository.test.ts src/components/ScratchPad.persistence.test.ts`
- `npm test -- --run src/lib/grade1-progress.test.ts src/lib/grade2-progress.test.ts src/lib/grade3-progress.test.ts src/lib/local-progress-backup.test.ts src/components/MathText.test.ts`
- `npm audit --omit=dev --json`
- `npm run lint`, `npm run tdd:guard`, `npm run build`, `git diff --check`

실행 결과:

- 보안 집중 회귀 12개 파일 81/81 통과
- `npm run lint`, `npm run tdd:guard`, `git diff --check` 통과
- 전체 `npm test`는 보안 관련 파일을 포함해 293개가 통과했고, 동시 curriculum
  변경의 `[6수02-02]`, `[6수02-03]` 미배정 때문에
  `src/lib/curriculum-allocation.test.ts` 3개만 실패했다.
- `npm run build`는 server/auth/remote 코드 compile을 통과한 뒤 동시 변경인
  `src/lib/local-progress-repository.ts:184`의 nullable `currentIndex` 타입 오류에서
  중단됐다.

위 두 통합 blocker를 고친 상태에서 전체 test와 build를 다시 실행해야 최종 release
gate가 닫힌다.

후속 재검증에서 curriculum 배정과 `remote-progress`의 callback 타입 축소 오류가
해결된 상태로 전체 Vitest 57개 파일 365/365와 75개 정적 경로 production build가
통과했다. 이 문서의 앞선 실패 수치는 당시 원인 기록이며 현재 release gate 결과는
후속 통과 결과를 기준으로 한다.
