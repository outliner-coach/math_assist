# 프로덕션 업그레이드 3~6단계 실행 명세와 상태

기준일: 2026-07-21

이 디렉터리는 `docs/math-assist-production-proposal.html`의 제품 방향을 현재 코드에서 실행 가능한 계약으로 나눈다. 상세 문서는 설계 당시의 승인 기준과 유지보수 계약을 보존하고, 이 README와 `docs/tracking/status.md`가 2026-07-21 구현 상태를 요약한다. 작업트리의 `released`를 실제 GitHub Pages 배포 완료로 해석하면 안 된다.

## 문서 목록

| 단계 | 현재 상태 | 결과 | 상세 명세 |
|---|---|---|---|
| 3 | 완료 | 공통 읽기 투영, 시도 영수증, 기존 키 어댑터가 현재 공개 대상 1~6학년에 연결됨 | [03-common-activity-and-progress.md](03-common-activity-and-progress.md) |
| 4 | 완료 | 1~6학년 문제별 풀이 복구, clear, undo/redo, 세 학년군 경험 프리셋 연결 | [04-scratchpad-and-experience-presets.md](04-scratchpad-and-experience-presets.md) |
| 5 | 비공개 기반 | 원격 merge·backup·mock transport·auth·동의 기반만 존재하며 flag는 `false` | [05-optional-remote-storage.md](05-optional-remote-storage.md) |
| 6 | 작업트리 released | 4학년 큰 수 Bridge와 6학년 비와 비율 Study가 홈·이어하기에 연결됨 | [06-grade4-grade6.md](06-grade4-grade6.md) |
| 공통 | 통합 검증 완료 | 384/384 unit, validator·audit, 75-page build, 34/34 E2E 통과. 실제 배포와 원격 정책 blocker는 별도 유지 | [acceptance-gates.md](acceptance-gates.md) |

## 근거 우선순위

요구사항이 서로 다를 때 아래 순서로 해석한다.

1. 학습·보안 불변식: `docs/business-rules.md`, `docs/security.md`, `docs/contracts.md`, `docs/standards.md`
2. 승인된 결정 기록: `docs/tracking/decisions/0001-*`부터 `0010-*`
3. 제품 방향과 릴리스 목표: `docs/math-assist-production-proposal.html`
4. 상세 구조 제안: `docs/math-assist-architecture-ux-stress-test.md`
5. 현재 구현: `src/**`, `public/data/**`, `scripts/**`

이 우선순위는 메인 제안서를 축소하기 위한 것이 아니다. 제안서 이후 확정된 보안·제품 결정을 반영하기 위한 것이다. 구현 기준은 게스트 학습을 유지하고 어린이가 `기록 저장하기`를 선택하되, 원격 기록 생성 전 법정대리인 동의와 동의자 확인을 거쳐 학습 번호와 4자리 숫자 비밀번호를 만드는 흐름이다. 이후 보호자 연결은 복구·관리를 위한 선택 기능이다.

## 현재 기준선

- **실제 배포 경계**: GitHub Pages 정적 사이트이고 공개 서버 API·계정·원격 저장이 없다. 이번 작업트리 변경은 아직 실제 배포 확인을 마치지 않았다.
- **작업트리 공개 대상**: 1·2·3·4·5·6학년이다. 4학년은 큰 수 Bridge, 6학년은 비와 비율 Study만 `released`이고 나머지 배정 기준은 `planned`다.
- **공통 저장 경계**: 학년별 기존 형식을 read-only projection으로 모으고 새 유효 확인만 append-only `AttemptReceipt`에 추가한다. 기존 학년별 진도는 계속 권위 있는 원장이다.
- **풀이장**: normalized vector command, 문제별 local repository, 펜·지우개·clear·undo·redo와 `play / bridge / study` 프리셋이 1·2·3·4·5·6학년에 연결되어 있다.
- **원격 기반**: merge·rollback backup·mock transport·auth·one-time recovery·동의 provisioning 코드가 있으나 production flag는 `false`이고 provider·공개 route·UI가 없다.
- **6학년 Study**: `[6수02-02/03]` 범위의 unit·concept·A/B/C 30개 독립 문제군, 실제 정량 표, 5/10문제, 격리 저장과 손상 복구가 연결됐다. 원장이 없거나 정확히 `released`가 아니면 직접 경로는 계속 fail-closed한다.
- **추가 안전 경계**: 숫자 형식 오류 분리가 완료됐고 템플릿 산술의 `eval`은 제한된 parser로 교체됐다. 5학년 청사진은 의미 오류 9개를 함께 수정해 660/660이다.

## 의존성 그래프

```text
1. 입력 형식 오류 분리 ───────────────┐
2. 문제 청사진·K/A/R 검증 ───────┐   │
                                   v   v
3. 공통 활동·진도 저장 경계 ──> 4. 풀이장·ExperiencePreset
          │                         │
          ├───────────────> 5. 선택적 원격 저장
          │                         │
          └───────────────> 6. 4·6학년 콘텐츠·UI
2. 교육과정·문제 청사진 ─────────> 6. 4·6학년 콘텐츠·UI
4. 공통 경험 셸 ─────────────────> 6. 4·6학년 최종 브라우저 승인
```

- 3단계의 공통 뷰와 저장 포트가 없으면 5단계가 기존 키를 안전하게 동기화할 수 없다.
- 3단계의 활동 식별자와 문제별 키가 없으면 4단계 풀이장을 안정적으로 복구할 수 없다.
- 2단계의 청사진과 검증기가 없으면 6단계에서 문제 수만 늘고 인지 유형 공백을 자동 차단할 수 없다.
- 4·6학년 콘텐츠 트랙은 서로 다른 파일 소유권으로 병렬 진행할 수 있지만, 공통 타입·검증기·홈·세션 변경은 `_shared` 소유권 기록 뒤 순차 병합한다.

## 단계별 승격 규칙

각 단계는 `설계 승인 -> 실패 테스트 -> 최소 구현 -> 회귀 -> 브라우저 -> 문서/계약 갱신` 순서로 진행한다.

| 상태 | 의미 | 다음 상태 조건 |
|---|---|---|
| Draft | 이 디렉터리의 계약만 존재 | 소유 파일과 이전 형식 픽스처 확정 |
| Adapter-ready | 기존 저장을 읽는 어댑터와 순수 투영이 존재 | 기존 원문 무변경 및 학년 격리 테스트 통과 |
| Local RC | 계정 없이 로컬에서 전체 흐름 사용 가능 | 집중 테스트, 전체 회귀, E2E, 모바일·태블릿 확인 |
| Remote staging | 비공개 환경에서 계정·동기화 검증 가능 | 보안·백업·복구·충돌·감사 사건 게이트 통과 |
| Production | 공개 계약과 운영 절차까지 준비됨 | 단계별 배포 차단 결정 0, 실제 배포와 hydration 확인 |

## 공유 파일 소유권

구현 착수 전 `workstreams/_shared/README.md`에 날짜, 담당 단계, 변경할 필드, 이전 형식, 소비자를 기록한다.

| 공유 지점 | 주 담당 | 의존 검토 |
|---|---|---|
| `src/lib/types.ts`, `src/lib/session.ts` | 단계 3 / workstream 02 | 단계 1·2·4·5·6 |
| 학년별 `*-progress.ts`, `src/lib/guest-home.ts` | 단계 3 / workstream 02 | 홈, 단계 5 |
| `src/components/ScratchPad.tsx`, `src/app/globals.css` | 단계 4 / workstream 03 | 모든 학년 화면, WebKit E2E |
| `public/data/**`, `src/lib/problem-generator.ts` | 단계 6 / workstream 01 | 단계 2, workstream 04 |
| `scripts/**`, `e2e/**` | workstream 04 | 모든 제품 단계 |
| 배포·원격 설정 | 단계 5 / workstream 02+04 | 보안·운영 승인 |

새 타입을 `src/lib/types.ts` 하나에 모두 추가하지 않는다. 충돌 면적을 줄이기 위해 학습 활동, 풀이장, 동기화 타입은 각각 새 도메인 파일에 두고 기존 공개 타입이 실제로 공통 소비될 때만 재노출한다.

## 완료를 증명하는 산출물

- 단계별 계약 타입과 이전 형식 픽스처
- 실패 조건을 명명한 단위·검증기 테스트
- 실제 localStorage 원문이 바뀌지 않았음을 증명하는 회귀 테스트
- 학년별 시작·확인·복구·완료 E2E
- 390×844, 1024×768, WebKit 입력·선택·픽셀 확인
- 4·6학년 교육과정 원장과 콘텐츠 품질 보고서
- 원격 계정의 보안 테스트, 감사 사건, 백업 복구 리허설
- `npm run lint`, `npm test`, `npm run tdd:guard`, 관련 `validate:*`, 관련 `audit:*`, `npm run build`, `npm run test:e2e`
- `main` 반영 시 GitHub Pages 또는 별도 원격 서비스의 실제 배포 확인

테스트 개수, 빌드 페이지 수, 파일 존재만으로 완료를 선언하지 않는다. 각 요구사항을 직접 실행하거나 검사하는 증거가 있어야 한다.
