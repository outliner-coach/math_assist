# Release 0 - 공통 학습 활동·진도 읽기 경계

## 변경

- `learning-activity.ts`에 `LearningActivitySession`, `AttemptReceipt`,
  `ProgressRepository`, 공통 진도 투영 타입을 정의했다.
- `local-progress-repository.ts`가 기존 1·2·3·5학년 진도 키와 5학년 세션을
  `getItem`만 사용해 읽는다.
- 네 학년 모두 `resume / completed / review`로 투영하며, 만료된 5학년
  세션은 최근 완료 개념으로 대체한다.
- 손상된 한 학년은 그 학년만 빈 투영과 `corrupted` 상태가 되고 다른 원문
  키는 유지된다.
- 5학년 세션의 빈 문제 목록과 범위 밖 현재 위치는 손상으로 거부한다.
  과거 세션의 짧거나 긴 답·확인 배열은 문제 수에 맞춰 안전하게 읽는다.

## 중요한 제한

- 1·2·3학년은 활성 세션 스냅숏을 저장하지 않으므로 현재는 진도 기반
  resume만 제공한다.
- 과거 집계 진도에서 개별 `AttemptReceipt`를 추측하지 않는다. 새 쓰기
  경계가 생기기 전까지 레거시 영수증 목록은 비어 있다.
- 아직 홈 UI 소비자를 교체하지 않았다. 다음 단계는 `guest-home`과 공통
  저장소 출력을 회귀 비교한 뒤 읽기 경계를 하나로 합치는 것이다.

## 유지보수

진도 키나 과거 필드를 바꿀 때 `local-progress-repository.test.ts`의 v1
픽스처, 손상 격리, 원문 동일성 검사를 먼저 갱신한다. 기존 학년별 저장
로더는 손상 복구 중 키를 삭제할 수 있으므로 이 읽기 전용 저장소 안에서
호출하지 않는다.
