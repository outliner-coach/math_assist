# 3단계 - 공통 학습 활동과 진도 저장 경계

## 목표

1문제 미션과 5·10문제 연습을 같은 의미의 `LearningActivitySession`으로 읽고, 채점이 확정된 시도를 불변 `AttemptReceipt`로 남기며, 기존 네 진도 키를 변경하지 않고 하나의 `ProgressView`로 투영한다.

이 단계는 학년별 문제 생성·채점·보상 규칙을 하나로 합치는 작업이 아니다. 공통으로 같은 의미인 활동 상태, 시도 완료, 이어하기, 완료·복습·최근 활동만 통일한다.

## 현재 구현 감사

| 영역 | 현재 소스 | 격차 |
|---|---|---|
| 1학년 진도 | `src/lib/grade1-progress.ts` | stage 단위, v1/v2 복구, XP·숙련 포함 |
| 2학년 진도 | `src/lib/grade2-progress.ts` | mission·selectedUnit 단위, v1/v2 복구 |
| 3학년 진도 | `src/lib/grade3-progress.ts` | 별도 v1, 1·2학년 보상 의미와 다름 |
| 5학년 진도 | `src/lib/progress.ts` | concept 집계만 보존, 개별 과거 시도 원장이 없음 |
| 5학년 세션 | `src/lib/session.ts` | 전역 키 한 개, 10문제·2시간 만료 전용 |
| 홈 | `src/lib/guest-home.ts` | 공통 `LocalProgressRepository`에서 완료·복습·최근 활동·5학년 세션 유효성을 읽고, 학년별 문구·단원 링크만 기존 원본의 전용 필드로 보완 |
| 공통 읽기 계약 | `src/lib/learning-activity.ts` | 1·2·3·5 read model과 nullable learner 경계가 현재 작업 트리에 추가됨 |
| 공통 로컬 어댑터 | `src/lib/local-progress-repository.ts` | 기존 키를 `getItem`만으로 읽는 Release 0 구현이 추가됨; 홈 읽기 소비자가 전환됐고 쓰기는 아직 기존 학년 모듈이 권위 있음 |

과거 기록에서 `AttemptReceipt`를 완전하게 복원할 수 없다. 5학년은 개념별 집계만 있고, 3학년은 1·2학년과 같은 variant·보상 근거가 없으며, 과거 저장에는 모든 문제별 `usedHint`, `variantKey`, 시도가 남아 있지 않다. 따라서 어댑터가 과거 영수증을 지어내면 안 된다. 과거 기록은 `LegacyProgressBaseline`으로 읽고, 새 계약 적용 이후의 확인된 시도만 영수증으로 추가한다.

## 도메인 계약

### LearningActivitySession

현재 소유 파일은 `src/lib/learning-activity.ts`다. 아래는 현재 read model을 쓰기 가능한 세션으로 진화시킬 때의 목표 상태다. 기존 공개 타입을 한 번에 교체하지 않고 schema 변화와 소비자 전환을 별도 단계로 둔다.

```ts
type LearningMode = 'mission' | 'practice' | 'review'
type ActivityStatus = 'active' | 'completed' | 'expired' | 'abandoned'
type ResponseStatus = 'unanswered' | 'draft' | 'format-error' | 'checked'

interface ActivityItemSnapshot {
  itemId: string
  variantKey: string
  contentReleaseId: string
  snapshot: unknown
}

interface ActivityResponse {
  itemId: string
  status: ResponseStatus
  answer: string | null
  correct: boolean | null
  usedHint: boolean
  checkedAt: number | null
}

interface LearningActivitySession {
  schemaVersion: 1
  sessionId: string
  learnerId: string | null
  grade: 1 | 2 | 3 | 4 | 5 | 6
  activityId: string
  mode: LearningMode
  items: ActivityItemSnapshot[]
  responses: ActivityResponse[]
  currentIndex: number
  status: ActivityStatus
  startedAt: number
  updatedAt: number
  expiresAt: number | null
}
```

필수 불변식:

- `items.length > 0`이고 `responses`는 같은 `itemId`를 한 번씩 가진다.
- `currentIndex`는 항목 범위를 벗어나지 않는다.
- 정규화 실패는 `format-error`이며 `correct`는 `null`이다. 영수증도 만들지 않는다.
- `checked`가 된 응답의 답과 정오는 같은 세션에서 변경되지 않는다.
- `expiresAt`은 학년별 기존 계약을 보존한다. 5학년 이전 세션은 시작 후 2시간이며, 만료가 없는 미션에 임의의 2시간을 강제하지 않는다.
- 문제 snapshot은 세션 중 콘텐츠 배포가 바뀌어도 정답과 풀이가 바뀌지 않을 만큼 완전해야 한다.
- 보상, 캐릭터 상태, 팝업, 애니메이션은 이 타입에 넣지 않는다.
- 풀이 획은 `SketchRepository`가 소유하고 세션에는 획 본문 대신 안정적인 `sessionId + itemId` 키만 사용한다.

`learnerId`는 계정을 뜻하지 않는다. 기존 저장 형식에는 학습자 식별자가 없으므로 현재 read model은 `null`을 유지한다. 명시적인 게스트/profile 경계가 도입되기 전에 임의 기기 ID를 만들어 기존 기록이 특정 아이의 것인 것처럼 가장하지 않는다. 이후 식별자를 도입해도 원본 키를 이동하거나 삭제하지 않는다.

### AttemptReceipt

권장 소유 파일: `src/lib/attempt-receipt.ts`

```ts
interface AttemptReceipt {
  schemaVersion: 1
  attemptId: string
  learnerId: string | null
  sessionId: string
  activityId: string
  grade: 1 | 2 | 3 | 4 | 5 | 6
  itemId: string
  attemptOrdinal: number
  variantKey: string
  contentReleaseId: string
  correct: boolean
  usedHint: boolean
  checkedAt: number
  dedupeKey: string
}
```

필수 불변식:

- 채점이 확정된 `checked` 전이에서 정확히 한 번 생성한다.
- `itemId`는 같은 문제 안에서 안정적이고 `attemptOrdinal`이 유효한 재시도를 구분한다. 재시도 순번을 item ID에 섞지 않는다.
- 형식 오류, 답 입력 중간 상태, 화면 이동만으로 생성하지 않는다.
- 생성 뒤 수정하지 않는다. 정정이 필요하면 원본을 덮어쓰지 않고 명시적인 교정 계약을 별도 결정한다.
- `dedupeKey`는 같은 구체 문제의 문장·정답·보기·시각 내용을 반영한다. 시드만 다른 동일 문제에 새 보상을 주지 않는다.
- 원격 최소 동기화에는 원답 문자열과 풀이 획을 포함하지 않는다.
- `correct`와 `usedHint`는 진도·복습 투영 입력이며 캐릭터가 바꿀 수 없다.

### LegacyProgressBaseline과 ProgressView

```ts
interface LegacyProgressBaseline {
  sourceKey: string
  sourceSchemaVersion: number | null
  sourceHash: string
  grade: 1 | 2 | 3 | 5
  completedIds: string[]
  reviewIds: string[]
  recentActivityId: string | null
  recentActivityAt: number | null
  selectedUnitId: string | null
}

interface ProgressView {
  learnerId: string
  byGrade: Partial<Record<1 | 2 | 3 | 4 | 5 | 6, {
    completedIds: string[]
    reviewIds: string[]
    recentActivityId: string | null
    recentActivityAt: number | null
    selectedUnitId: string | null
    resume: {
      activityId: string
      href: string
      sessionId: string | null
    } | null
  }>>
  generatedAt: number
}
```

`ProgressView`는 최소 공통 의미만 가진다. XP, 레벨, 숙련 별, 5학년 최고 점수를 잃는 축소 저장 형식이 아니다. 이런 학년 전용 정보는 기존 진행 모듈에 남고 필요할 때 별도 projection으로 읽는다.

### 저장 포트

현재 `ProgressRepository`는 `src/lib/learning-activity.ts`에 정의된 동기·읽기 전용 포트이며 `LocalProgressRepository`가 이를 구현한다. 먼저 이 계약을 유지한다. 새 쓰기와 원격 transport는 이름을 충돌시키지 않는 별도 포트로 추가한다.

권장 추가 파일:

- `src/lib/learning-session-repository.ts`
- `src/lib/attempt-repository.ts`
- `src/lib/progress-repository.ts`
- `src/lib/legacy-progress-adapters.ts`

```ts
interface LearningSessionStore {
  getActive(learnerId: string): Promise<LearningActivitySession[]>
  get(sessionId: string): Promise<LearningActivitySession | null>
  put(session: LearningActivitySession): Promise<void>
  remove(sessionId: string): Promise<void>
}

interface AttemptStore {
  append(receipt: AttemptReceipt): Promise<'inserted' | 'duplicate'>
  listByLearner(learnerId: string): Promise<AttemptReceipt[]>
}

interface ProgressWriteStore {
  readBaselines(learnerId: string): Promise<LegacyProgressBaseline[]>
  readView(learnerId: string): Promise<ProgressView>
}
```

기존 로컬 읽기는 동기 계약을 유지하고, 쓰기·원격 경계만 비동기 인터페이스를 사용한다. 순수 정규화·projection 함수는 동기 함수로 분리해 빠르고 결정적으로 테스트한다.

## 기존 키 어댑터 계약

| 소스 키 | 읽을 공통 의미 | 보존할 전용 의미 | 금지 |
|---|---|---|---|
| `mathAssist_grade1Progress` | 완료 stage, 복습 stage, latest, lastPlayedAt | XP, mastery, 학습일, intro | 읽는 동안 v2로 재저장 |
| `mathAssist_grade2Progress` | 완료 mission, 복습 mission, latest, selectedUnit, lastPlayedAt | XP, mastery, 학습일, intro | 유효하지 않은 선택 단원을 원본에서 삭제 |
| `mathAssist_grade3Progress` | 완료 mission, 복습 mission, latest, selectedUnit, lastPlayedAt | skill summary, intro | 1·2학년 XP 규칙 자동 적용 |
| `mathAssist_progress_v1` | 연습한 concept, needsReview, latest concept/time | 시도 수, 최고·최근 점수, mode | 개별 과거 영수증 생성 |
| `mathAssist_currentSession` | 유효한 5학년 resume | 문제 snapshot, 답, 확인 상태, 2시간 만료 | 다른 요청 세션으로 이어 붙이기 |

어댑터 규칙:

1. 읽기 전 원문 문자열을 보관하고 읽기 뒤 동일한지 테스트한다.
2. 한 키가 손상되면 그 학년의 빈 baseline만 만들고 다른 키는 계속 읽는다.
3. 모르는 추가 필드는 무시하되 저장 과정에서 삭제하지 않는다.
4. 배열은 문자열만 취하고 중복을 제거하지만, 정규화 결과를 원본에 쓰지 않는다.
5. 홈의 명시적 학년이 우선이고, 없으면 최근 활동이 우선이며, 유효한 5학년 세션은 5학년 이어하기에서 우선한다.
6. 과거 집계를 영수증으로 변환하지 않는다. 원격 이관 시 baseline snapshot과 이후 receipt를 함께 보낸다.

## 구현 단계와 파일 소유권

### 3A - 계약과 실패 픽스처 (현재 작업 트리에 read model 존재)

주 담당: workstream 02. 테스트 담당: workstream 04.

- 새 도메인 파일에 타입, 파서, 불변식 검사기를 추가한다.
- 1·2학년 v1/v2, 3학년 v1, 5학년 진도·구형 세션, 손상 JSON 픽스처를 만든다.
- `src/lib/types.ts`와 기존 진행 모듈은 아직 바꾸지 않는다.
- 어댑터가 원문을 쓰지 않는 실패 테스트를 먼저 추가한다.

Gate 3A: 모든 이전 형식이 공통 baseline으로 읽히고 원본 문자열이 바뀌지 않는다.

### 3B - 읽기 어댑터와 공통 홈 projection (완료)

- 현재 `LocalProgressRepository`의 학년별 mapping과 read-only 불변식을 집중 테스트로 검증한다.
- `guest-home.ts`의 현재 행동을 공통 view와 나란히 실행해 결과 동등성을 테스트했다.
- 홈의 완료·복습·최근 활동과 5학년 세션 유효성 소비자를 공통 projection으로 교체했다. 학년 전용 `todaySolvedCount`, 선택 단원과 세트 문구는 원본 키를 읽되 쓰지 않는다.
- 4·6학년 빈 상태를 지원하되 학습 가능 상태로 노출하지 않는다.

Gate 3B: 1·2·3·5학년의 resume/completed/review가 현재 홈과 의미상 같고, 손상 학년 격리가 유지된다.

### 3C - 새 활동 세션과 영수증 쓰기

- 학년별 화면의 답 확인 경계에서 공통 receipt를 생성한다.
- 기존 학년별 진도 저장은 즉시 제거하지 않는다. 전환 기간에는 기존 저장이 권위 있고 공통 receipt는 추가 원장이다.
- 같은 확인 동작의 반복 탭, hydration 재실행, 뒤로 가기에서 중복 receipt를 만들지 않는다.
- 5학년 `PracticeSession`은 공통 세션으로 읽는 어댑터를 먼저 두고, 저장 키 변경은 별도 schema migration으로 한다.

Gate 3C: 같은 구체 문제의 확인 한 번당 receipt 한 개, 형식 오류 receipt 0, 기존 보상·복습 결과 동등.

### 3D - 저장 포트로 소비자 전환

- 홈, 세션 복구, 단계 4 풀이장, 단계 5 동기화가 포트만 소비하게 한다.
- 기존 키 쓰기를 제거하는 것은 모든 과거 형식 round-trip과 롤백 경로가 입증된 후의 별도 릴리스다.
- raw localStorage 키 참조 검색을 CI에서 허용 목록으로 관리한다.

Gate 3D: UI는 새 키를 직접 정의하지 않고, 기존 네 학년 기록과 새 활동이 동일한 공통 view에서 공존한다.

## 집중 테스트

- 학년별 이전 형식과 현재 형식의 baseline mapping
- 손상 JSON, 배열 대신 객체, 잘못된 날짜, 모르는 추가 필드
- 5학년 세션 만료와 요청 concept/set/mode/source 불일치
- 1·2학년 내용 기반 dedupeKey, 3학년 별도 보상 의미 보존
- `format-error -> draft -> checked` 전이와 receipt 생성 시점
- checked 응답 불변, 반복 저장·반복 탭 멱등성
- 한 학년 reset/복구가 다른 학년 baseline에 영향 없음
- 브라우저가 없는 SSR 환경에서 안전한 빈 결과

## 브라우저 승인

각 학년 1·2·3·5에서 다음을 확인한다.

1. 과거 localStorage 픽스처를 주입한다.
2. `/home`에서 올바른 이어하기를 본다.
3. 문제를 확인하고 새 receipt가 한 개 생기는지 확인한다.
4. 새로고침 뒤 같은 활동·현재 문제·확인 상태를 복구한다.
5. 기존 학년 키 원문이 의도하지 않게 변하지 않았는지 확인한다.
6. 한 학년의 손상 키를 넣어도 다른 세 학년 카드와 이어하기가 유지되는지 확인한다.

## 완료 조건

- 네 기존 진도 형식을 무손실로 읽는 어댑터가 있다.
- 과거 집계와 새 receipt가 구분되고 과거 receipt를 조작하지 않는다.
- 공통 view가 resume, completed, review, recent activity를 제공한다.
- 형식 오류는 영수증이나 오답 진도를 만들지 않는다.
- 모든 학년의 결정적 채점·보상 회귀가 통과한다.
- `npm run lint`, `npm test`, `npm run tdd:guard`, `npm run build`, `npm run test:e2e`가 순차 통과한다.
- 변경된 저장 이름·공개 의미가 있다면 `docs/contracts.md`, `docs/security.md`, `docs/architecture.md`가 같은 변경에서 갱신된다.

파일 존재나 타입 컴파일만으로는 완료가 아니다. 실제 과거 저장 원문, 새 receipt, hydration 뒤 이어하기를 증거로 남긴다.
