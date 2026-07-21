# 안전 산술 parser 전환

## 결과

`src/lib/problem-generator.ts`의 두 `eval` 호출을 제거했다. 등록된 수학 함수는
기존 `evaluateFunction` 경계에서 먼저 처리하고, 남은 숫자 식만
`src/lib/arithmetic-expression.ts`에서 코드 실행 없이 평가한다.

허용 문법은 유한 십진수, 괄호, `+ - * /`, 단항 `+ -`이다. 지수, 식별자,
`NaN`, `Infinity`, 직접·계산 결과 0으로 나누기, 후행 토큰, 비유한 결과,
512자를 넘는 식과 64단계를 넘는 중첩은 거부한다. 기존 생성기 실패 계약을
유지해 최종 solver 식은 `[식?]`으로 남고, 등록 함수의 잘못된 인자는 기존처럼
0 fallback을 사용한다.

## 원인과 유지보수 계약

허용 문자 정규식은 script injection 범위를 줄였지만 `eval` 자체와 CSP의
`unsafe-eval` 요구를 없애지 못했다. 또한 품질 감사기는 런타임 생성기 의존성을
임시 디렉터리에 수동 복사하므로 새 parser 모듈 없이 실행하면
`Cannot find module './arithmetic-expression'`으로 실패했다.

산술 문법을 넓혀야 할 때는 정규식이나 코드 컴파일을 추가하지 말고 parser의
명시적 토큰·연산 규칙과 허용/거부 쌍 테스트를 함께 변경한다. 생성기의 직접
의존 모듈이 늘면 `scripts/problem-quality-core.js`의 `loadProblemGenerator`와
그 로더 회귀 테스트도 같은 변경에서 갱신한다.

## TDD와 회귀 범위

- parser 단위 테스트: 우선순위, 좌결합, 괄호, 단항 부호, 소수와 모든 거부 경계
- 생성기 단위 테스트: 등록 함수 인자 산술 보존과 거부 식 미평가 표식
- 5학년 실제 bank: 22개 파일의 A/B/C 각 10문제 전체를 같은 seed로 두 번 생성해
  결정론, 미평가 표식 부재, 유한 정답을 확인
- 6학년: 5문제와 10문제 생성 회귀 및 validator
- 검증기: 임시 runtime generator 로더, template validator, problem audit

## 수학 의미

현재 5학년 전체 bank와 6학년 생성 회귀에서 정답·문장·풀이 미평가 오류는
발견되지 않았다. 지수와 0 나눗셈은 이전 JavaScript 실행 결과와 달리 의도적으로
거부되며, 현재 승인된 템플릿에는 이 문법이 없다.

## 검증 명령

```bash
npm test -- --run src/lib/arithmetic-expression.test.ts src/lib/problem-generator.test.ts src/lib/grade5-generator-regression.test.ts src/lib/grade6-study.test.ts src/lib/problem-quality-audit.test.ts
npm run validate:templates
npm run validate:grade6
npm run audit:problems
npm run lint
npm run tdd:guard
npm run build
git diff --check
```

실행 결과는 parser·생성기·5학년 전체 bank·6학년·감사 로더 집중 회귀 79/79,
원격 진도 집중 회귀 10/10, template validator, Grade 6 validator, problem audit
(error 0, 기존 warning 49), lint, TDD guard, 75개 정적 경로 production build가
모두 통과했다. 전체 Vitest도 57개 파일 365/365가 통과했다. 빌드 중 발견된
`remote-progress`의 callback 경계 타입 축소 오류는
검사 직후 `learnerId`를 지역 문자열 상수로 고정하는 의미 변화 없는 수정으로
해결했다.
