# 5학년 소수의 곱셈 응용문제 보강 인계

## 범위

`decimalmul-001` 30문항을 K27/A3/R0, 문제군 3개에서 K12/A12/R6,
문제군 10개로 재설계했다. 화면, 공개 경로, 저장 형식, 채점기는 변경하지
않았다.

## 바뀐 학습 구조

- A/B/C 각 세트는 난이도 4/4/2와 K4/A4/R2를 함께 유지한다.
- Knowing 4종은 소수×자연수, 소수×소수, 자연수 곱에서 인수 하나 또는
  둘을 10분의 1로 바꾼 자릿값 관계를 다룬다.
- Applying 4종은 반복량, 곱한 뒤 더한 전체량, 소수 변의 직사각형 넓이,
  곱한 뒤 사용량을 뺀 나머지를 다룬다.
- Reasoning 2종은 소수점을 빠뜨린 오답의 차이와 한 인수가 10분의 1이
  되었을 때 두 곱의 차이를 분석한다.
- 뺄셈이 있는 모든 매개변수 범위에서 정답은 양수다.

## 재현 계약

- 생성기:
  `scripts/generate-grade5-decimalmul-templates.js`
- 명령:
  `npm run generate:grade5-decimalmul`
- 결과:
  `public/data/templates/decimalmul.json`
- 중앙 의미 매핑:
  `scripts/migrate-grade5-blueprints.js`
- 회귀:
  `src/lib/grade5-blueprint-metadata.test.ts`

생성기 출력은 커밋 JSON과 완전히 같아야 한다. 소수 함수가 반환한 문자열을
후속 덧셈·뺄셈에서 정확히 평가하는 현재 solver 계약을 유지한다.

## 검증

- 30개 중간값 표본의 문제 문장과 정답을 직접 렌더링해 조사와 의미를 확인
- 전체 Vitest 61개 파일, 396/396
- lint 통과
- TDD guard 통과
- Grade 5 blueprint migration check 통과
- template metadata 690/690, missing 0, invalid 0
- problem audit 오류 0, 경고 44
- 소수의 곱셈 난이도 신호 5.03 < 6.31 < 9.10
- 정적 build 75/75

문제 데이터만 바뀌고 화면·경로·저장·정답 공개 시점은 바뀌지 않아 E2E는
생략했다. 다음 우선순위는 `average-001`이다.
