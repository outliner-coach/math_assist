# 4학년 두 자리 수로 나누기 단원 인계

## 범위

`[4수01-07]`을 `unit-4-1-multiplication-division`의 두 자리 수로
나누기 Bridge 단원으로 승격했다. 콘텐츠 버전은
`grade4-bridge-two-digit-division-v1`이며, 기존 큰 수 단원의
`grade4-bridge-big-numbers-v1`과 분리된다.

## 문제 구조

- Knowing 4: 나누어떨어지는 몫, 나머지가 있는 몫, 나머지, 곱셈식 검산
- Applying 4: 같은 수씩 포장, 정원에 맞춘 버스 수, 포장 뒤 남는 수,
  나누는 수·몫·나머지에서 처음 수 역산
- Reasoning 2: 나머지를 버린 버스 계획 오류, 너무 큰 시험 몫의 곱 차이
- 모든 1~9 변형에서 두 자리 수인 나누는 수, `0 ≤ 나머지 < 나누는 수`,
  단일 정답과 선택지 4개 고유성을 검사한다.

## 표현·저장

`division-model`은 나누는 수와 나누어지는 수를 세로 모형으로 보여 주되
제출 전 몫·나머지 속성을 만들지 않는다. 처음 수 역산에서는 답인
나누어지는 수도 제출 전 `□`로 가린다. 새 단원 선택 시 첫 문항부터
시작하지만 기존 완료·복습 목록은 유지한다. attempt receipt는 새 단원
콘텐츠 버전을 기록하고 원답과 풀이장 획은 저장하지 않는다.

## 검증

- Grade 4 validator: 2단원, 20문항, K/A/R 8/8/4
- Curriculum validator: 92개 기준, 현재 참조 44개
- Mission audit: 오류 0, 경고 0
- 전체 Vitest 61개 파일 421/421
- lint, TDD guard, build 75/75
- 전체 Chromium E2E 40/40
- 390×844에서 일반 나눗셈과 처음 수 역산 화면, 가로 넘침 없음,
  제출 전 답 전용 DOM 부재 확인

다음 4학년 단원은 원장 순서상 `[4수01-08]`
`unit-4-1-arithmetic-estimation`이다.
