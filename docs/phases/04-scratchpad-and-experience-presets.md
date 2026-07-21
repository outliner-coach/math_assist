# 4단계 - 전 학년 풀이장과 ExperiencePreset

## 목표

1·2·3·5학년의 모든 문제에 펜·지우개·되돌리기·전체 지우기를 제공하고, 획을 문제별로 자동 저장해 이동·새로고침 뒤 복구한다. 같은 학습 루프는 유지하되 `play`, `bridge`, `study` 프리셋으로 세션 길이·글 밀도·캐릭터·도구·보상 노출을 바꾼다. 4·6학년은 6단계에서 같은 계약에 연결한다.

## 현재 구현 감사

- `ScratchPad`는 1·2·3·5학년 실제 문제 화면에 렌더링된다.
- 네 학년 모두 learner/session/item 키로 정규화 획과 undo history를 문제별 자동 저장한다.
- 펜·지우개·undo·redo·전체 지우기, iPadOS 선택 방지, 단일 포인터, capture 실패 허용 계약이 구현되어 있다.
- 컴포넌트 테스트는 실제 획 복구·clear undo/redo·리사이즈 재투영·완료/만료 읽기 전용을 검사한다.
- 1·2·3학년은 `mission-sketch-identity.ts`에서 결정적 실행·문항 키를 만들며 채점·receipt·보상 계산은 참조하지 않는다.

## 풀이 데이터 계약

권장 소유 파일: `src/lib/sketch-document.ts`, `src/lib/sketch-repository.ts`

```ts
type ScratchToolId = 'pen' | 'eraser'

interface NormalizedPoint {
  x: number // 0..1
  y: number // 0..1
  pressure: number | null
}

type SketchCommand =
  | { type: 'stroke'; id: string; tool: ScratchToolId; points: NormalizedPoint[] }
  | { type: 'clear'; id: string }

interface SketchDocument {
  schemaVersion: 1
  learnerId: string | null
  sessionId: string
  itemId: string
  commands: SketchCommand[]
  historyCursor: number
  updatedAt: number
}
```

필수 규칙:

- 저장 키는 `learnerId + sessionId + itemId`다. 화면 인덱스만 쓰지 않는다.
- 좌표는 캔버스 크기와 분리된 정규 좌표로 저장한다. 회전·리사이즈 뒤 같은 위치에 재생한다.
- 획은 시작점을 포함하고 coalesced point 순서를 보존한다.
- 지우개도 명령으로 남겨 같은 replay 결과를 만든다.
- 전체 지우기는 과거 명령을 즉시 삭제하지 않고 `clear` 명령으로 남겨 한 번의 undo로 복원 가능해야 한다.
- `historyCursor` 뒤의 명령은 새 획을 시작할 때 제거한다. V1 UI에는 redo를 노출하지 않아도 데이터 reducer는 결정적이어야 한다.
- 손상된 한 sketch는 빈 문서로 복구하고 다른 문제 sketch를 삭제하지 않는다.
- bitmap, 정답 추론, AI 필기 판정은 저장하지 않는다.
- 5단계 첫 원격 동기화에는 sketch를 포함하지 않는다.

용량 제한은 구현 전 픽스처로 고정한다. 권장 V1 상한은 문제당 직렬화 JSON 256 KiB, 학습자당 최근 50개 문서다. 상한 도달 시 현재 획을 조용히 버리지 않고 저장 불가를 알리며, 정리 대상은 완료·만료 활동의 가장 오래된 문서부터다. 활성 세션 문서는 자동 삭제하지 않는다.

## SketchRepository

```ts
interface SketchRepository {
  get(key: { learnerId: string | null; sessionId: string; itemId: string }): Promise<SketchDocument | null>
  put(document: SketchDocument): Promise<'saved' | 'quota-exceeded'>
  removeSession(learnerId: string | null, sessionId: string): Promise<void>
  prune(learnerId: string | null): Promise<number>
}
```

3단계 `LearningActivitySession`이 안정적인 `sessionId`와 `itemId`를 제공해야 한다. 임시로 학년별 ID를 조합할 수 있지만, 서로 다른 구체 문제에 같은 키가 생기는 방식은 허용하지 않는다.

## ExperiencePreset

권장 소유 파일: `src/lib/experience-preset.ts`

```ts
interface ExperiencePreset {
  ageBand: 'play' | 'bridge' | 'study'
  minItems: number
  defaultItems: number
  maxItems: number
  mascotMode: 'full' | 'companion' | 'coach'
  rewardCadence: 'mission' | 'chapter' | 'mastery'
  textDensity: 'low' | 'medium' | 'high'
  baseScratchTools: readonly ['pen', 'eraser', 'undo', 'clear']
  supportToolLimit: 1
}
```

| 학년군 | 문제 수 | 캐릭터 | 풀이장 보조 도구 | 보상 |
|---|---:|---|---|---|
| `play` 1·2 | 1~3 | 큰 전신, 환영·생각·힌트·회복·축하 | 수블록 또는 수직선 중 문제 맞춤 1개 | 미션 종료 스티커 1종 |
| `bridge` 3·4 | 3~5 | 작은 동반자, 요청 시 전략 | 격자·자·각도기 중 1개 | 챕터 진전과 배지 1종 |
| `study` 5·6 | 기본 5, 선택 10 | 헤더·힌트·완료에만 코치 | 격자·자 등 1개 | 숙달 진전 중심 |

프리셋 불변식:

- `resolveExperiencePreset(grade)`는 순수 함수이며 채점기와 progress projection이 프리셋을 참조하지 않는다.
- 학년별 화면 조건문은 표현에만 사용한다. 같은 답이 프리셋에 따라 다른 정오·복습 의미가 되면 실패다.
- 주요 행동은 화면마다 하나만 강조한다.
- 캐릭터 애니메이션·보상 수령 실패가 문제 로딩, 저장, 채점, 다음 문제를 막지 않는다.
- 학습 콘텐츠는 보상이나 도구 해제로 잠그지 않는다.
- 한 화면에 동시 노출하는 동기 카운터는 경로 진전과 보상까지 최대 2개다.
- 주요 터치 목표는 최소 48×48px다. 현재 ScratchPad의 44px 버튼은 이 단계에서 48px로 올린다.

## 구현 순서와 파일 소유권

### 4A - 순수 획 reducer와 로컬 저장

주 담당: workstream 03. 저장 포트: workstream 02. 테스트: workstream 04.

- canvas와 무관한 `appendStroke`, `clear`, `undo`, `replay`, serialize/parse를 먼저 만든다.
- `ScratchPad`는 제어형 `document/onChange` 또는 repository key를 받는다.
- 기존 iPad pointer 계약을 변경하지 않고 이벤트에서 reducer 명령만 추가한다.

Gate 4A: 점 획, 빠른 획, 지우개, clear undo, resize replay, 손상 문서 격리 테스트 통과.

### 4B - 1·2·3·5학년 연결

- 학년별 활동 항목에 안정적인 session/item ID를 제공한다.
- 1·2·3학년 문제 카드에 풀이장을 같은 문제 맥락으로 배치한다.
- 5학년의 문제 index 기반 remount를 제거하고 저장 문서를 로드한다.
- 이동·reload·브라우저 복귀에서 같은 문제의 획을 복원한다.

Gate 4B: 네 학년에서 A 문제 획과 B 문제 획이 섞이지 않고, 확인 전·후에도 정답 정보가 sketch에 추가되지 않는다.

2026-07-21 연결 검증에서는 1학년 새로고침/완료/재시작, 2·3학년 문항 A→B→A/새로고침/완료/재시작을 실제 Chromium 캔버스 픽셀과 localStorage 문서 수로 확인했다. 네 학년 상호작용 표면은 같은 WebKit 선택 방지 클래스를 사용하며 입력 필드만 선택을 다시 허용한다.

### 4C - 프리셋과 짧은 활동 셸

- `play/bridge/study` 상수와 grade resolver를 추가한다.
- 5학년은 5문제 기본과 10문제 선택을 명시적으로 제공한다. 기존 10문제 A/B/C 경로는 호환 모드로 유지한다.
- 미션 시작·완료 셸, 캐릭터 5개 상태, 보상 1종은 학습 상태에서 파생한다.
- 4·6학년은 route가 생기기 전 resolver와 렌더 테스트만 준비한다.

Gate 4C: 문제까지 주요 탭 3회 이내, 강조 행동 1개, 프리셋별 문제 수와 표현 차이, 동일 채점 의미.

## 필수 테스트

- reducer: stroke/eraser/clear/undo/history branch/replay/idempotent parse
- 좌표: DPR·canvas 크기 변화 뒤 normalized 위치 오차 허용 범위
- 저장: 문제 격리, 세션 격리, quota, 손상 JSON, SSR 저장소 부재
- 컴포넌트: disabled 도구, 48px, toolbar 접근성, 저장 상태 안내
- WebKit: `webkitUserSelect`, 빈 selection, cancel된 touchstart, 실제 painted pixels
- E2E: 1·2·3·5 각각 그리기 -> 다음 문제 -> 이전 문제 -> reload -> 복구
- E2E: clear -> undo -> 원래 획 복구, 다른 학년 기록 무변경
- 뷰포트: 390×844, 1024×768에서 가로 스크롤·고정 행동 가림 0

## 완료 조건

- 1·2·3·5학년 모든 문제에서 입력·되돌리기·문제별 복구가 동작한다.
- 기존 iPadOS Safari·Chrome 입력 계약과 실제 기기 검증이 유지된다.
- 세 프리셋이 문제 수·밀도·캐릭터·도구·보상을 분리하지만 채점·진도 의미는 공유한다.
- 풀이 획은 로컬 전용이고 다른 문제·학년·학습자 문서와 섞이지 않는다.
- 관련 단위 테스트, `npm run lint`, `npm test`, `npm run tdd:guard`, `npm run build`, `npm run test:e2e`가 순차 통과한다.
