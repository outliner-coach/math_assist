# Problem Quality Evaluation

이 문서는 모든 연습 문제를 같은 기준으로 점검하기 위한 평가 루프를 정의합니다.
목표는 세 가지입니다.

- 수학적/구현 오류를 자동으로 막기
- 난이도와 문제 문구 품질을 일관되게 비교하기
- 어떤 에이전트가 실행해도 같은 결과를 재현하게 만들기

## Commands

기본 게이트:

```bash
npm run validate:templates
```

- 목적: 템플릿 구조 오류를 차단
- 실패 조건: 세트 분배 오류, 평가되지 않은 표현식, 잘못된 정답, 객관식 보기 중복, 선택지 첫 항목 불일치

품질 평가 리포트:

```bash
npm run audit:problems
```

- 출력물: `out/quality/problem-quality-report.json`, `out/quality/problem-quality-report.md`
- 기본 동작: `error`가 있으면 실패, `warning`은 리포트만 남김

경고까지 게이트로 사용할 때:

```bash
npm run audit:problems -- --strict-warnings
```

`promptfoo` 게이트:

```bash
npm run promptfoo:problems
```

- 출력물: `out/promptfoo/problem-quality.json`
- 웹 리포트: `public/reports/promptfoo-problem-quality.html`
- 기본 동작: `promptfoo`가 4개 스위트를 모두 평가하고, 실패 케이스가 하나라도 있으면 exit code 1로 종료
- 특징: 외부 LLM API 없이 로컬 규칙만 사용하므로 어떤 에이전트가 실행해도 같은 결과가 나옵니다.

브라우저에서 확인할 때:

- 로컬 개발 서버: `/math_assist/reports/promptfoo-problem-quality.html`
- GitHub Pages: `https://outliner-coach.github.io/math_assist/reports/promptfoo-problem-quality.html`

## Evaluation Model

### 1. Error checks

이 항목은 머지 차단용입니다.

- 세트별 10문항 / 4-4-2 난이도 분배
- prompt / solution / hint의 표현식 평가 가능 여부
- 정답 계산 결과가 비어 있거나 `NaN`, `undefined`가 아닌지
- 객관식 보기 중복 여부
- 객관식 첫 번째 보기와 `solver_rule` 일치 여부
- 실제 세션 생성 시 10문항 생성 실패 여부
- 실제 세션 생성 시 같은 템플릿+파라미터 중복 여부

### 2. Warning checks

이 항목은 품질 검토용입니다.

- 분수 개념인데 prompt에 실제 분수가 드러나지 않는 경우
- `첫 번째`, `두 번째` 같은 위치 표현이 있지만 기준 수식이 없는 경우
- `통분한 뒤`처럼 사전 연산을 요구하지만 원래 분수가 보이지 않는 경우
- 개념 내부에서 difficulty 1/2/3 평균 난이도 신호가 자연스럽게 증가하지 않는 경우

### 3. Promptfoo suites

`promptfoo`는 아래 4개 스위트를 모두 통과해야 합니다.

- `template_validation`: 템플릿 구조, 정답 계산, 보기 정합성
- `template_clarity`: 렌더링된 문제 문구의 명확성
- `session_quality`: 실제 10문항 세션 생성 시 중복 prompt, 중복 문제, 난이도 혼합
- `difficulty_progression`: 개념별 difficulty 1 < 2 < 3 단조 증가

## Difficulty Signal

난이도는 절대 점수 대신 상대 비교용 `difficulty signal`로 봅니다.
다음 요소를 합쳐서 계산합니다.

- `solver_rule`의 함수 호출 수
- `solver_rule`의 연산자 수
- 파라미터 개수와 범위 폭
- 자유 입력(`number`) 여부
- 풀이/힌트 단계 수
- 통분, 평균, 공약수/공배수 같은 개념 키워드
- 샘플 정답의 수 크기

중요한 기준:

- 같은 개념 안에서 평균 신호가 `difficulty 1 < 2 < 3` 순으로 증가해야 합니다.
- 이 규칙이 깨지면 자동 `warning`으로 남기고, `promptfoo`에서도 실패시킵니다.

## Agent Workflow

에이전트는 다음 순서를 기본으로 사용합니다.

1. `npm run validate:templates`
2. `npm run audit:problems`
3. `npm run promptfoo:problems`
4. `out/quality/problem-quality-report.md`를 읽고 남은 경고가 있는지 확인
5. 실제 수정 후 같은 세 명령을 다시 실행
6. 경고를 남기고 넘길 때는 handoff에 이유를 적기

## Review Policy

- `error`: 반드시 수정
- `warning`: 수정 우선이지만, 의도된 설계라면 handoff 또는 PR 설명에 근거를 남김
- difficulty signal은 참고 지표입니다. 사람이 보기에 더 적절한 이유가 있으면 override 가능하지만, 근거는 남겨야 합니다.

## Current Passing Bar

2026년 3월 7일 기준 기본 통과선은 다음입니다.

- `npm run validate:templates` 통과
- `npm run audit:problems` 결과 `0 errors`, `0 warnings`
- `npm run promptfoo:problems` 결과 `601 passed, 0 failed, 0 errors`
