# 5학년 혼합 계산 응용문제 보강 인계

## 범위

`mixedcalc-001` 30문항을 기존 K30/A0/R0 직접 계산 반복형에서
K12/A12/R6으로 재설계했다. 화면, 공개 경로, 저장 형식, 채점기는
변경하지 않았다.

## 바뀐 학습 구조

- A/B/C 각 세트는 난이도 4/4/2와 K4/A4/R2를 함께 유지한다.
- Knowing 4종은 계산 순서를 직접 적용하되 A는 기호식, B는 단계 지시,
  C는 계산 절차 설명으로 표현을 달리한다.
- Applying 4종은 재고, 두 집단의 준비물, 한 꾸러미의 구성, 모둠별 남은
  수를 하나의 혼합 계산식으로 옮긴다.
- Reasoning 2종은 괄호를 빠뜨린 식과 잘못 세운 묶음 모델을 각각 올바른
  계산과 비교해 차이를 구한다.
- 모든 매개변수 범위에서 뺄셈 결과와 정답이 양수이며, 선택형의 첫 보기는
  결정적 solver와 같다.

## 재현 계약

- 생성기:
  `scripts/generate-grade5-mixedcalc-templates.js`
- 명령:
  `npm run generate:grade5-mixedcalc`
- 결과:
  `public/data/templates/mixedcalc.json`
- 중앙 의미 매핑:
  `scripts/migrate-grade5-blueprints.js`
- 회귀:
  `src/lib/grade5-blueprint-metadata.test.ts`

생성기 출력은 커밋 JSON과 완전히 같아야 한다. 문제군 이름이나
`cognitiveDomain`만 바꾸고 문장·solver·풀이를 이전 직접 계산으로
되돌리면 안 된다.

## 검증

- 30개 중간값 표본의 문제 문장과 정답을 직접 렌더링해 조사와 의미를 확인
- 전체 Vitest 61개 파일, 394/394
- lint 통과
- TDD guard 통과
- Grade 5 blueprint migration check 통과
- template metadata 690/690, missing 0, invalid 0
- problem audit 오류 0, 경고 47
- 혼합 계산 난이도 신호 6.93 < 7.36 < 9.21
- 정적 build 75/75

문제 데이터만 바뀌고 화면·경로·저장·정답 공개 시점은 바뀌지 않아 E2E는
생략했다. 다음 우선순위는 `decimalmul-001`이다.
