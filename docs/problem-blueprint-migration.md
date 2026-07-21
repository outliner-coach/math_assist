# 5학년 문제 청사진 메타데이터 이관

작성일: 2026-07-21
주 문서: `docs/math-assist-production-proposal.html`의 Content system, Release 0,
Production gates

## 목적

5학년 문제의 숫자·절차 난이도인 `difficulty`와 사고 유형을 분리한다.
기존 660개 템플릿을 자동 추정으로 분류하지 않고, 개념별 검토가 끝난
문제만 청사진 완료로 센다. 이 문서는 타입과 감사 도구를 먼저 배포한 뒤
콘텐츠를 안전하게 이관하기 위한 단계와 완료 기준을 고정한다.

## 계약

템플릿의 선택 필드 `blueprint`는 다음 `ProblemBlueprintMeta`를 사용한다.

```ts
interface ProblemBlueprintMeta {
  problemFamily: string
  cognitiveDomain: 'knowing' | 'applying' | 'reasoning'
  reasoningPattern:
    | 'direct' | 'inverse' | 'constraint' | 'multi_step'
    | 'representation_shift' | 'compare_methods' | 'error_analysis'
    | 'pattern_generalization' | 'systematic_counting' | 'optimization'
    | 'data_sufficiency' | 'model_and_check'
  primaryStandard: string
  connectedStandards?: string[]
  representations: Array<'text' | 'equation' | 'table' | 'diagram' | 'graph' | 'manipulative'>
  contextType: 'pure_math' | 'real_world' | 'puzzle'
  estimatedSteps: number
  readingLoad: 'low' | 'medium' | 'high'
  visualSemantics?: 'decorative' | 'schematic' | 'quantitative'
}
```

- `difficulty`로 `cognitiveDomain`이나 `reasoningPattern`을 추정하지 않는다.
- `blueprint`는 통째로 없을 수 있지만, 선언한 객체는 모든 필수 필드가
  유효해야 한다. 일부 필드만 채운 중간 객체는 검증 오류다.
- 기존 `problem_family`와 `blueprint.problemFamily`를 함께 둔 이관 기간에는
  두 값이 같아야 한다. 생성된 문제는 검토된 청사진 값을 우선 사용한다.
- `visual_template`가 있는 문제는 `visualSemantics`가 필수다. 시각 템플릿이
  자체 `semantics`를 선언하면 청사진과 같은 값이어야 한다.
- 예전 템플릿과 저장된 `Problem`에는 청사진이 없어도 로드할 수 있다.
  소비자는 청사진 부재를 knowing이나 direct로 해석하면 안 된다.

## 상태 구분

| 상태 | 조건 | `validate:templates` | `audit:problems` |
| --- | --- | --- | --- |
| missing | `blueprint` 전체가 없음 | 기존 템플릿 호환을 위해 통과 | 개념별 누락 수와 커버리지 경고 |
| invalid | 객체를 선언했지만 필드·값·시각 계약 오류 | 오류로 실패 | 오류와 invalid 수 보고 |
| complete | 모든 필드와 교차 계약이 유효 | 통과 | 인지영역·문제군·표현 커버리지에 포함 |

이 구분 때문에 “검증 통과”는 아직 “청사진 이관 완료”를 뜻하지 않는다.
출시 게이트는 감사 보고서의 complete가 660/660이고 invalid가 0일 때만
평가할 수 있다. 콘텐츠 의미가 solver·개념과 충돌하는 템플릿은 임의의
성취기준을 붙이지 않고 missing으로 남긴다.

## M0 기준선과 M1 달성 상태

M0 시작 시점의 기준선은 다음과 같았다.

- 22개 개념, 660개 템플릿
- 기존 `problem_family`: 210/660개, 도형·응용 7개 개념
- 완전한 `blueprint`: 0/660개
- 나머지 15개 개념은 의미 있는 문제군부터 검토해야 함

M1 이관 후 같은 날의 실제 감사 결과는 다음과 같다.

- 완전한 `blueprint`: 210/660개, 31.82%
- missing: 450개, invalid: 0개
- `area`, `perimeter`, `polygonarea`, `congruence`, `symmetry`, `cuboid`,
  `cuboidnet`: 각 30/30 complete
- `area-001`: K12/A12/R6, reasoning family 2개로 현재 목표 통과
- 나머지 6개 이관 개념: 현행 문제 의미대로 분류한 결과 추론 문제군과
  K/A/R 비율 공백이 남음
- 감사 경고 27개: 미이관 개념 15개, reasoning family 공백 6개,
  cognitive domain mix 공백 6개

익숙한 넓이 역산이나 좌표 대칭 계산을 추론으로 올려 수치를 맞추지 않았다.
M1은 분류 완료 단계이며, Applying·Reasoning 콘텐츠 보강은 M2의 별도 변경이다.

`npm run audit:problems`의 JSON과 Markdown 결과가 이 수치를 현재 데이터에서
다시 계산한다. 문서 숫자를 성공 근거로 사용하지 않는다.

## 이관 페이즈

### M0 — 계약과 가시성

- 공용 타입과 생성 문제의 선택 필드를 추가한다.
- 선언된 메타데이터의 enum, 필수값, 시각 의미, 기존 문제군 일치를 검증한다.
- 전체 은행에서 missing, invalid, complete를 분리하고 개념별로 보고한다.
- Gate: 기존 660개 템플릿과 저장 문제 호환, validator 오류 0, 누락 은폐 0.

### M1 — 기존 7개 시각·응용 개념 검토

- `area`, `perimeter`, `polygonarea`, `congruence`, `symmetry`, `cuboid`,
  `cuboidnet`을 한 개념씩 검토한다.
- 기존 `problem_family`를 유지하면서 인지영역, 추론패턴, 성취기준, 표현,
  읽기부하를 사람이 문장·풀이·시각과 대조해 기록한다.
- 각 개념 변경은 30개 템플릿과 집중 테스트를 한 단위로 한다.
- Gate: 해당 개념 complete 30/30, invalid 0, 시각 의미 불일치 0.

상태: **완료**. 70개 문제군에 사람이 검토한 매핑을 두고 210개 템플릿을
이관했다. `scripts/migrate-grade5-blueprints.js`는 이 매핑을 기준으로 기존
JSON 줄 순서를 유지해 메타데이터만 삽입하며, `--check` 재실행 결과는
pending 0이다. 도형 템플릿 생성기도 같은 매핑을 사용하므로 재생성 시
청사진이 사라지지 않는다.

### M2 — 문제군이 없는 15개 개념

- 단순 문장 변형을 같은 문제군으로 묶고, 실제 사고 구조가 다른 경우에만
  새 문제군을 만든다.
- 각 개념에서 먼저 현행 분류를 완료한 뒤 부족한 Applying·Reasoning
  문제군을 별도 콘텐츠 변경으로 보강한다. 분류와 문제 재작성을 한 번에
  대량 수행하지 않는다.
- Gate: 개념당 의미 있는 문제군 8개 이상, reasoning 문제군 2개 이상,
  표현 2개 이상.

상태: **완료**. 숫자 범위나 응답 형식만 다른 A/B/C 슬롯은 같은 문제군으로
묶어 15개 개념의 450개 템플릿을 검토했다. 최초 분류에서는 의미 오류 9개를
missing으로 남겼고, 사용자 승인 뒤 문장·범위·solver·풀이를 함께 수정해
전체 기준 660/660 complete, missing 0, invalid 0이다. `difficulty`는 어떤
분류에도 사용하지 않았다.

다음 3개 유형(A/B/C 각 1개, 총 9개)은 잘못된 분류로 덮지 않고 콘텐츠를
바로잡은 뒤에만 청사진을 추가했다.

- `fracmul` 06: “모두”라는 덧셈 문맥과 곱셈 solver가 충돌한다.
- `fracsub` 06: “남은 양에서 먹은 양”을 빼는 문맥이 부자연스럽고 허용
  매개변수에서 음수 양이 나온다.
- `average` 08: 평균이 아니라 네 수의 합만 물어 `6수04-01`에 대응하지 않는다.

문제군·reasoning·K/A/R 목표의 남은 차이는 감사 경고로 공개하며, 같은 계산에
다른 이름을 붙이거나 난이도 3을 reasoning으로 올려 수치를 맞추지 않는다.

### M3 — 커버리지 게이트 필수화

- 전체 660개가 complete이고 invalid가 0인지 확인한다.
- 개념별 목표인 knowing 30–40%, applying 40–50%, reasoning 20–30%를
  감사한다.
- 일반 세트 K4/A4/R2와 A/B/C의 맥락·표현·추론 차이를 추가 검사한다.
- 이 시점에만 `blueprint` 부재를 `validate:templates`의 오류로 승격한다.
- Gate: 단원별 사고 유형 커버리지 100%, 자동 품질 감사 오류 0.

상태: **완료**. 9개 콘텐츠 수정과 생성 self-check 뒤 전체 660개가 complete이며
전체 template metadata 690/690과 invalid 0을 validator가 강제한다. 현행 문제군
구성의 목표 차이는 품질 개선 경고로 남기되 청사진 누락으로 숨기지 않는다.

## 검증 순서

```bash
npx vitest run src/lib/problem-generator.test.ts src/lib/problem-quality-audit.test.ts
npx vitest run src/lib/grade5-blueprint-metadata.test.ts
npm run migrate:grade5-blueprints -- --check
npm run validate:templates
npm run audit:problems
npm run lint
npm test
npm run tdd:guard
npm run build
```

템플릿을 실제로 바꾸는 M1 이후에는 생성된 새 세션에서 `templateId`,
청사진, 문제 문장, 정답, 풀이, 시각 데이터가 같은 검토본을 가리키는지도
확인한다. 진행 중 세션의 저장 스냅샷을 새 분류로 조용히 덮어쓰지 않는다.

## 성취기준 근거

`primaryStandard`는 2022 개정 교육과정의 5~6학년군 성취기준을 사용한다.
이번 이관에서 사용한 범위는 자연수 혼합 계산 `6수01-01`, 어림
`6수01-03`, 약수·배수 `6수01-04`~`05`, 분수 동치·통분 `6수01-06`,
분수 덧셈·뺄셈 `6수01-08`, 분수 곱셈 `6수01-09`, 소수 곱셈
`6수01-13`, 대응 관계 `6수02-01`, 합동·대칭 `6수03-01`~`02`,
직육면체·전개도 `6수03-03`~`04`, 둘레와 다각형 넓이
`6수03-11`~`14`, 평균 `6수04-01`이다.

- [2022 개정 초·중등학교 교육과정 고시 안내](https://ncic.re.kr/board/B0033.cs?act=read&bwrId=2105&pageIndex=1&pageUnit=10)
- [2022 개정 초등학교 5~6학년군 성취수준 자료](https://ncic.re.kr/board/B0024.cs?act=read&bwrId=2021&m=10)
