# Phase 4A - 풀이장 문서와 로컬 저장소

## 구현

- `sketch-document.ts`는 캔버스 픽셀을 0~1 좌표와 0~1 또는 `null` 압력으로
  정규화하고, 다른 캔버스 크기로 다시 투영한다.
- 펜·지우개 획과 전체 지우기를 순서가 있는 명령으로 저장한다. 시작점과
  coalesced point 순서는 호출자가 준 배열 순서 그대로 보존한다.
- `historyCursor` 기반 undo·redo를 제공한다. clear는 한 번의 undo로
  복원되고, undo 뒤 새 명령은 기존 redo branch를 제거한다.
- 직렬화 파서는 스키마, learner/session/item identity, 명령 ID, 점 범위,
  history cursor를 검증한다. 다른 문제 키의 문서를 교차 로드하지 않는다.
- `sketch-repository.ts`는 learner/session/item을 모두 포함한 충돌 방지 키로
  문제별 문서를 저장한다.

## 용량과 보존

- 문제당 JSON UTF-8 상한은 256 KiB다. 초과 또는 브라우저 quota 오류는
  기존 문서를 덮지 않고 `quota-exceeded`를 반환한다.
- 학습자당 최근 문서 상한은 50개다. 새 저장을 위해 완료·만료 세션으로
  판정된 가장 오래된 문서부터 정리한다.
- 활성 여부는 repository 생성 시 `isSessionActive`로 주입한다. 활성 문서를
  지우지 않고는 50개 안에 넣을 수 없으면 새 저장을 거부한다.
- 한 sketch의 JSON이 손상되면 그 키의 빈 문서를 반환하며 다른 item/session
  문서나 손상 원문을 삭제하지 않는다.

## 다음 단계

- 아직 `ScratchPad.tsx`와 연결하지 않았다. Phase 4B에서 포인터 시작점과
  coalesced event를 정규화해 reducer로 전달하고, 세션 활성 판정 함수를
  공통 `LearningActivitySession`에서 주입한다.
- UI 연결 시 기존 native non-passive capture listener, 단일 pointerId,
  implicit pen/touch capture, WebKit 선택 차단을 변경하지 않는다.
- 저장 실패를 조용히 삼키지 말고 학습자에게 로컬 저장 불가 상태를 알려야 한다.
- `ExperiencePreset`은 이 순수 저장 슬라이스에 포함하지 않았으며 Phase 4C의
  표현 전용 resolver로 분리한다.
