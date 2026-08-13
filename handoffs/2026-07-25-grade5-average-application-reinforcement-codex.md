# 5학년 평균 응용문제 보강 인계

## 범위

`unit-5-2-average`의 `average-001` 30문항을 K18/A12/R0, 문제군 4개에서
K12/A12/R6, 문제군 10개로 재설계했다. 화면, 공개 경로, 저장 형식,
채점기는 변경하지 않았다.

## 바뀐 학습 구조

- A/B/C 각 세트는 난이도 4/4/2와 K4/A4/R2를 함께 유지한다.
- Knowing 4종은 대칭인 세 수·네 수의 평균과 합에서 평균을 구하는
  표현을 다룬다.
- Applying 4종은 실제 기록의 평균, 평균에서 빠진 값, 목표 평균을 만들
  다음 값을 구한다.
- Reasoning 2종은 자료 수를 잘못 나눈 평균의 오차와 한 기록을 수정했을
  때 전체 평균이 변하는 양을 분석한다.
- 임의의 세 수 평균을 한 자리에서 반올림하지 않는다. 모든 자료는 합이
  자료 수로 정확히 나누어지도록 대칭 구조에서 생성한다.

## 재현 계약

- 생성기: `scripts/generate-grade5-average-templates.js`
- 명령: `npm run generate:grade5-average`
- 결과: `public/data/templates/average.json`
- 중앙 의미 매핑: `scripts/migrate-grade5-blueprints.js`
- 회귀: `src/lib/grade5-blueprint-metadata.test.ts`

생성기 출력은 커밋 JSON과 완전히 같아야 한다. 테스트는 모든 허용
매개변수 조합에서 정수 정답, 미평가 표현식 부재, 객관식 보기 4개와
정답 1개를 검사한다.

## 검증

- 부족한 K/A/R 분포를 먼저 실패시키는 테스트 확인
- 30개 중간값 표본의 문제 문장과 정답 직접 검토
- 모든 허용 매개변수 조합 전수 검사
- 집중 Vitest 47/47
- 전체 Vitest 61개 파일, 398/398
- lint, TDD guard, Grade 5 blueprint migration check 통과
- template metadata 690/690, missing 0, invalid 0
- problem audit 오류 0, 경고 41
- 평균 난이도 신호 5.70 < 6.31 < 7.73
- 정적 build 75/75

문제 데이터만 바뀌고 화면·경로·저장·정답 공개 시점은 바뀌지 않아 E2E는
생략했다. 다음 작업 단위는 `unit-5-2-fraction-mul`의 `fracmul-001`이다.
