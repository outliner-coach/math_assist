# 5학년 분수의 덧셈·뺄셈 응용문제 보강 인계

## 범위

`unit-5-1-fraction-addsub`의 `fracadd-001`, `fracsub-001` 60문항을
각각 K18/A12/R0, 문제군 4개에서 K12/A12/R6, 문제군 10개로
재설계했다. 화면, 공개 경로, 저장 형식, 채점기는 변경하지 않았다.

## 바뀐 학습 구조

- A/B/C 각 세트는 난이도 4/4/2와 K4/A4/R2를 함께 유지한다.
- 덧셈 Knowing은 서로 다른 분모의 직접 계산, 배수 관계 분모, 1이
  되게 하는 분수, 통분한 두 분자의 합을 다룬다.
- 덧셈 Applying은 실제 두 양·세 양의 합, 빠진 덧셈 항, 분수 길이
  직사각형 둘레를 다룬다.
- 덧셈 Reasoning은 분모끼리 더한 오답의 차이와 합을 만족하는 빈
  분자를 분석한다.
- 뺄셈 Knowing은 서로 다른 분모의 직접 계산, 분자가 같은 두 분수의
  크기, 1에서 빼기, 통분한 두 분자의 차를 다룬다.
- 뺄셈 Applying은 남은 양, 거리 차, 빠진 뺄셈 항과 빠진 처음 수를
  다룬다.
- 뺄셈 Reasoning은 통분 없이 분자만 뺀 오답과 뺄셈을 덧셈으로
  계산한 오답의 차이를 분석한다.
- 뺄셈은 첫 분수의 분자가 더 크고 분모가 더 작도록 구성해 모든
  허용 매개변수 조합에서 결과가 양수다.

## 재현 계약

- 생성기: `scripts/generate-grade5-fraction-addsub-templates.js`
- 명령: `npm run generate:grade5-fraction-addsub`
- 결과: `public/data/templates/fracadd.json`,
  `public/data/templates/fracsub.json`
- 중앙 의미 매핑: `scripts/migrate-grade5-blueprints.js`
- 회귀: `src/lib/grade5-blueprint-metadata.test.ts`

생성기 출력은 커밋 JSON과 완전히 같아야 한다. 테스트는 3,618개 허용
매개변수 조합에서 양의 정수·기약분수 정답, 뺄셈의 0 초과 결과,
미평가 표현식 부재, 객관식 보기 4개와 정답 1개를 검사한다.

## 작업 중 발견해 수정한 문제

대표 문장 검토에서 1이 되도록 더할 분수를 묻고도 합인 `1`을 반환하던
초안과 `fracadd-unlike-direct`에서 두 분모가 우연히 같아질 수 있던
초안을 발견했다. 첫 문제는 `b/(n+b)` 자체를 정답으로 바꾸고, 둘째
분모는 첫째 분모에 양의 항을 더한 구조로 바꿨다. 둘 다 커밋 전
전 조합 회귀에 포함했다.

## 검증

- 새 생성기 부재를 먼저 실패시키는 테스트 확인
- 60개 중간값 표본의 문제 문장·정답·풀이 직접 검토
- 3,618개 허용 매개변수 조합 전수 검사
- 집중 Vitest 39/39
- 전체 Vitest 61개 파일, 401/401
- lint, TDD guard, Grade 5 blueprint migration check 통과
- template metadata 690/690, missing 0, invalid 0
- problem audit 오류 0, 경고 31
- 덧셈 난이도 신호 6.89 < 11.99 < 13.95
- 뺄셈 난이도 신호 6.84 < 7.28 < 9.38
- 정적 build 75/75

문제 데이터만 바뀌고 화면·경로·저장·정답 공개 시점은 바뀌지 않아
E2E는 생략했다. 다음 작업 단위는 `unit-5-1-fraction-simplify`의
`simplify-001`과 `commonden-001` 60문항이다.
