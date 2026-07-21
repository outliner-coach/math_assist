# 4학년 홈 통합 출시 인계

## 출시 상태

- 교육과정 원장 `releaseState.grade4`: `released`
- 홈 지원 학년: 1·2·3·4·5
- 6학년: 계속 비활성
- 4학년 공개 범위: `[4수01-01]`, `[4수01-02]`, `unit-4-1-large-numbers`

## 이어하기 계약

공통 `LearningGrade`와 local read-only repository가 `mathAssist_grade4Progress`를 투영한다. 완료·복습 variant, 최근 mission, 선택 unit, 활동 내 현재 문제를 읽되 원문을 쓰지 않는다. 홈은 선택 unit이 있으면 `/grade/4/mission?unitId=unit-4-1-large-numbers`로 바로 이어 준다.

첫 방문은 4학년 선택, 홈 주요 행동, 큰 수 단원 카드의 3탭으로 활동에 도달한다. 진행 후에는 홈 주요 행동 한 번으로 현재 활동에 복귀한다.

## 손상 보호

손상되거나 호환되지 않는 4학년 기록은 원문을 삭제하지 않는다. 같은 storage에서 자동 저장을 차단하고, 4학년 화면의 명시적 두 번 확인 초기화만 차단 상태를 해제하고 4학년 키를 교체한다. 1·2·3·5학년 원문은 그대로 유지한다.

## 검증

- Grade 4 progress/home/local projection 집중 단위 테스트 통과
- Grade 4 E2E 6개: 3탭 진입, reload·hydration 복구, 손상 원문 격리, 형식 오류와 receipt, 3문제 완료, 390px 폭
- lint와 TDD guard를 실행한다.
- curriculum validator는 Grade 4 `released`와 실제 `SUPPORTED_GRADES`의 4 노출이 같아야 통과한다.
- 전체 build는 Grade 6의 동시 `PracticeClient` 편집이 끝난 뒤 root가 순차 실행한다.
