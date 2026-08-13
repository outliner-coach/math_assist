# 5학년 분수의 곱셈 응용문제 보강 인계

## 범위

`unit-5-2-fraction-mul`의 `fracmul-001` 30문항을 K21/A9/R0, 문제군
5개에서 K12/A12/R6, 문제군 10개로 재설계했다. 화면, 공개 경로, 저장
형식, 채점기는 변경하지 않았다.

## 바뀐 학습 구조

- A/B/C 각 세트는 난이도 4/4/2와 K4/A4/R2를 함께 유지한다.
- Knowing 4종은 분수×자연수, 자연수×분수, 분수×분수, 곱셈 전 약분을
  다룬다.
- Applying 4종은 실제 양의 일부, 일부의 일부, 빠진 인수, 분수 변의
  직사각형 넓이를 다룬다.
- Reasoning 2종은 두 번째 분모를 빠뜨린 오답과 1보다 작은 분수를
  곱했을 때 처음 분수와 곱의 크기 차이를 분석한다.
- 분모는 분자보다 고정 양만큼 크게 구성해 모든 기본 인수가 양의
  진분수이며, 답은 항상 기약분수로 생성한다.

## 재현 계약

- 생성기: `scripts/generate-grade5-fracmul-templates.js`
- 명령: `npm run generate:grade5-fracmul`
- 결과: `public/data/templates/fracmul.json`
- 중앙 의미 매핑: `scripts/migrate-grade5-blueprints.js`
- 회귀: `src/lib/grade5-blueprint-metadata.test.ts`

생성기 출력은 커밋 JSON과 완전히 같아야 한다. 테스트는 5,112개 허용
매개변수 조합에서 양의 정수·기약분수 정답, 미평가 표현식 부재, 객관식
보기 4개와 정답 1개를 검사한다.

## 검증

- 부족한 K/A/R 분포를 먼저 실패시키는 테스트 확인
- 30개 중간값 표본의 문제 문장과 정답 직접 검토
- 5,112개 허용 매개변수 조합 전수 검사
- 집중 Vitest 49/49
- 전체 Vitest 61개 파일, 400/400
- lint, TDD guard, Grade 5 blueprint migration check 통과
- template metadata 690/690, missing 0, invalid 0
- problem audit 오류 0, 경고 37
- 분수의 곱셈 난이도 신호 6.31 < 8.33 < 9.74
- 정적 build 75/75

문제 데이터만 바뀌고 화면·경로·저장·정답 공개 시점은 바뀌지 않아 E2E는
생략했다. 다음 작업 단위는 `unit-5-1-fraction-addsub`의
`fracadd-001`과 `fracsub-001` 60문항이다.
