# Phase 3B 홈 공통 진도 projection 인수인계

작성일: 2026-07-21

## 결과

- `src/lib/guest-home.ts`가 완료·복습·최근 활동과 5학년 이어하기 세션의
  유효성을 `LocalProgressRepository`에서 읽는다.
- 오늘 해결 수, 2·3학년 선택 단원, 5학년 세트 링크처럼 공통 projection에
  없는 학년 전용 표현은 기존 키에서 읽기만 한다.
- 불완전하거나 범위를 벗어난 5학년 세션은 더 이상 홈 이어하기로 노출하지
  않는다.
- 홈은 계속 `mathAssist_guestHome_v1`의 학년 선택만 쓰며 학습 기록 원문을
  정규화하거나 재저장하지 않는다.

## 검증

- `src/lib/guest-home.test.ts`에 네 학년 완료·복습·최근 활동의 공통 projection
  동등성과 원문 무변경 회귀를 추가했다.
- 유효한 5학년 snapshot만 이어하기로 인정하고 불완전한 snapshot은 제외하는
  회귀를 추가했다.
- 집중 실행: `guest-home`, `local-progress-repository`, `attempt-receipt` 23개
  테스트 통과.

## 유지 계약

- 선택 단원만 있고 아직 푼 미션이 없는 2·3학년은 학습 진도로 과장하지 않는다.
- 한 학년의 손상 기록은 다른 학년 요약과 원문을 바꾸지 않는다.
- Grade 4/6을 홈에서 활성화할 때는 `LearningGrade`, repository projection,
  `SUPPORTED_GRADES`를 같은 변경에서 확장하고 미출시 차단 검증을 갱신한다.
