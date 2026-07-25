# 5학년 약분·통분 응용문제 보강 인계

## 범위

`unit-5-1-fraction-simplify`의 `simplify-001`, `commonden-001`
60문항을 각각 K12/A12/R6, 문제군 10개로 재설계했다. 화면, 공개 경로,
저장 형식, 채점기는 변경하지 않았다.

## 바뀐 학습 구조

- A/B/C 각 세트는 난이도 4/4/2와 K4/A4/R2를 유지한다.
- 약분 Knowing은 기약분수, 기약분수의 분자·분모, 분자와 분모의
  최대공약수를 다룬다.
- 약분 Applying은 동치분수의 빈 분자, 수 모형·리본·작업 구간의 실제
  부분, 빠진 확대 배수, 기약분수의 분자·분모 합을 다룬다.
- 약분 Reasoning은 분자만 나눈 오답과 분자·분모에 같은 수를 더한
  오답을 올바른 값과 비교한다.
- 통분 Knowing은 최소 공통 분모, 두 새 분자, 첫째 분수의 확대 배수를
  다룬다.
- 통분 Applying은 비교를 위한 새 분자, 새 분자의 합·차, 원래 분자의
  역산을 다룬다.
- 통분 Reasoning은 두 분모의 합을 공통 분모로 정한 오류와 첫째
  분자의 확대 배수를 잘못 정한 오류를 분석한다.

## 안전한 수학 구조

약분은 `n·f / ((n+1)·f)`로 생성한다. 연속한 `n`, `n+1`은 서로소이므로
기약 결과가 정확히 `n/(n+1)`이고 최대공약수는 `f`다. 통분은 이미
기약분수인 `(d-1)/d`, `1/(d+1)`을 사용한다. 연속한 두 분모는
서로소이므로 최소 공통 분모는 정확히 `d(d+1)`이다.

## 재현·검증 계약

- 생성기: `scripts/generate-grade5-fraction-simplify-templates.js`
- 명령: `npm run generate:grade5-fraction-simplify`
- 결과: `public/data/templates/simplify.json`,
  `public/data/templates/commonden.json`
- 회귀: `src/lib/grade5-blueprint-metadata.test.ts`,
  `src/lib/commonden-prompts.test.ts`

검증 결과:

- 60개 대표 문장·정답 직접 검토
- 360개 허용 매개변수 조합 전수 검사
- 전체 Vitest 61개 파일, 402/402
- lint, TDD guard, blueprint migration check 통과
- template metadata 690/690
- problem audit 오류 0, 경고 25
- 약분 난이도 4.28 < 4.90 < 6.01
- 통분 난이도 6.09 < 7.27 < 8.66
- 정적 build 75/75

문제 데이터만 바뀌어 E2E는 생략했다. 다음 작업 단위는
`unit-5-1-divisor-multiple`의 4개 개념 120문항이다.
