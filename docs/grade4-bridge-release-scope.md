# 4학년 Bridge 최소 출시 범위

## 현재 상태

4학년은 교육과정 원장에서 `released`이며 홈의 1·2·3·4·5·6학년 선택에 노출된다. `/grade/4`는 단원 선택, `/grade/4/mission?unitId=unit-4-1-large-numbers`는 검증된 3문제 Bridge 활동이다. 6학년 공개 범위는 별도의 비와 비율 Study 계약을 따른다.

## 검증된 범위

- 단원: `unit-4-1-large-numbers` 큰 수
- 성취기준: `[4수01-01]`, `[4수01-02]`
- 콘텐츠 버전: `grade4-bridge-big-numbers-v1`
- 문제 틀: 10개, 인지영역 K/A/R `4/4/2`
- 한 활동: 알기·적용·추론 각 1개, 총 3문제
- 표현: 자리값 표, 수 카드, 수직선, 생활 맥락
- 채점: 선택형 완전 일치, 정수형 완전한 부호 있는 정수만 허용
- 저장: `mathAssist_grade4Progress`와 공통 `mathAssist_attemptReceipts_v1`; 다른 학년 키와 분리
- 풀이장: 활동 실행·문항 변형별 안정적인 로컬 저장 키 사용

## 비활성 범위

원장에서 4학년으로 배정된 나머지 20개 성취기준은 `planned`를 유지한다. 문제 은행, 정답·그림 쌍 검사, 모바일 E2E가 모두 없는 단원은 화면에 만들거나 홈에서 가능하다고 표시하지 않는다.

## 공개 게이트

1. `npm run validate:curriculum`, `npm run validate:grade4`, `npm run audit:missions`가 오류와 경고 없이 끝난다.
2. 집중 단위 테스트와 전체 테스트, lint, TDD guard, production build가 통과한다.
3. 4학년 E2E에서 형식 오류 미기록, 오답→정답 영수증 순번, 로컬 진도, 3문제 완료, 작은 화면 폭을 확인한다.
4. 원장의 `releaseState.grade4 = released`와 홈의 지원 학년 4 노출은 같은 통합 변경으로 유지한다. 둘이 다르면 curriculum validator가 실패한다.

## 유지보수 계약

- 추가 문제는 반드시 원장에 4학년으로 배정된 성취기준을 사용한다.
- 정답 전용 합성값은 제출 전 DOM 또는 접근성 트리에 만들지 않는다.
- 조건형 문제는 모든 숫자 변형을 직접 계산한 참값과 대조한다.
- 유효한 확인만 시도 영수증을 만들며 원답 문자열과 풀이장 획은 영수증에 저장하지 않는다.
