# 공통 학습 활동·진도 읽기 계약

상태: Release 0 읽기 전용 기반 및 홈 projection 연결 구현

주 문서: `docs/math-assist-production-proposal.html`의 Architecture와 Release 0,
`docs/math-assist-architecture-ux-stress-test.md`의 Learning Activity Contract

## 목적

1·2·3학년의 한 문제 미션과 5학년 연습을 같은 이름으로 읽을 수 있는
경계를 먼저 만든다. 이 단계는 기존 저장 형식을 이관하거나 UI를 교체하지
않는다. 기존 네 진도 키와 5학년 활성 세션을 읽어 `resume / completed /
review` 투영을 만들며 원문 localStorage는 절대 쓰거나 지우지 않는다.

## 계약

- `LearningActivitySession`: 활동 식별자, 학년, 모드, 항목, 응답, 현재 위치,
  활성·완료·만료 상태를 나타내는 공통 읽기 모델이다. 현재 저장소에서 실제
  활성 세션 스냅숏을 가진 것은 5학년뿐이다.
- `AttemptReceipt`: 이후의 새 시도 기록이 사용할 작은 공통 계약이다. 안정적인
  `itemId`와 별도 `attemptOrdinal`로 같은 문제의 유효한 재시도를 구분한다.
  기존 저장은 집계만 가지므로 정확한 시도 ID, 힌트 사용, 완료 시각을 복원할
  수 없다. 레거시 어댑터는 영수증을 만들어내지 않고 빈 목록을 반환한다.
- `ProgressRepository`: 학년별 진도, 전체 진도, 세션, 시도 영수증을 읽는
  포트다. 첫 구현인 localStorage 저장소는 `getItem`만 받는다.

## 기존 키 매핑

| 학년 | 원본 | completed | review | resume |
|---|---|---|---|---|
| 1 | `mathAssist_grade1Progress` | `completedStageIds` | `reviewStageIds` | `latestStageId` |
| 2 | `mathAssist_grade2Progress` | `completedMissionIds` | `reviewMissionIds` | `latestMissionId`, 선택 단원 문맥 |
| 3 | `mathAssist_grade3Progress` | `completedMissionIds` | `reviewMissionIds` | `latestMissionId`, 선택 단원 문맥 |
| 5 | `mathAssist_progress_v1` | 연습한 개념 | `needsReview`인 개념 | 유효한 활성 세션, 없으면 최근 완료 개념 |

5학년 `mathAssist_currentSession`은 `retry-wrong`을 공통 `review` 모드로
투영한다. 예전 세션에 `checkedAnswers`가 없으면 각 응답의 확인 상태는
`null`이다. 응답 배열이 문제보다 짧으면 누락값을 `null`로 채우고 초과값은
무시한다. 문제 목록이 비었거나 현재 위치가 문제 범위를 벗어난 세션은
손상으로 표시한다. 만료 세션은 읽을 수는 있지만 `resume` 후보가 되지 않는다.

## 무손실·격리 불변식

- 어댑터는 기존 학년 로더를 호출하지 않는다. 현재 학년 로더 일부는 손상
  복구 때 자기 키를 삭제하기 때문에 읽기 전용 공통 뷰에 사용할 수 없다.
- JSON 파싱 실패나 알려진 핵심 필드의 형식 오류는 해당 학년만
  `corrupted: true`와 빈 투영으로 만든다.
- 한 학년의 손상은 다른 학년 키의 읽기 결과를 바꾸지 않는다.
- 모르는 필드는 무시하되 원문을 정규화하거나 다시 저장하지 않는다.
- 학습자 식별자는 현재 저장 형식에 없으므로 `learnerId: null`을 유지한다.
  같은 브라우저 프로필을 별도 학습자로 가장하지 않는다.

## 검증과 다음 연결

집중 테스트는 v1 학년별 픽스처, 예전 5학년 세션, 원문 동일성, 쓰기 호출 0,
손상 학년 격리, 만료·손상 세션 대체를 확인한다. 홈은 이 projection의
완료·복습·최근 활동을 소비하며 유효하지 않은 5학년 세션을 이어하기로 내보내지
않는다. 학년 전용 오늘 해결 수·선택 단원·세트 링크는 기존 원본 필드에서
읽기만 한다. 쓰기 저장소나 원격 동기화는 별도 버전·병합 계약과 백업이
준비되기 전 기존 학년별 저장을 대체하지 않는다.
