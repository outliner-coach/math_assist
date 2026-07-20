# Math Assist 응용문제 확대·시각 무결성 리서치

작성일: 2026-07-20

## 결론

Math Assist의 문제 체계에는 서로 다른 두 축이 필요합니다.

1. **수학적 난이도**: 계산량, 단계 수, 수의 범위, 표현 변환 수
2. **인지 유형**: 알기, 적용, 추론

현재 `difficulty: 1 | 2 | 3` 하나만으로 두 축을 함께 표현하면서, 일부 난이도 3 문항은 비정형 응용이 아니라 계산을 한 단계 더 붙인 문항이 되었습니다. 모든 단원에 응용문제를 확대하려면 난이도 숫자를 늘리는 대신 문제군, 인지 유형, 표현, 추론 패턴을 별도 메타데이터로 관리해야 합니다.

시각 문제도 같은 원칙을 따릅니다. 그림은 장식이 아니라 문제 데이터의 표현입니다. 수치가 넓이·길이·개수·비율을 뜻한다면 렌더러는 적어도 위상과 대소 관계를 보존해야 하고, 넓이 자체를 묻는 문제에서는 가능한 한 비례까지 보존해야 합니다.

## 1. 스크린샷 문제 진단

### 문제의 수학 구조

세 도형의 넓이는 각각 29cm²이고, 정확히 한 도형에만 속한 세 영역은 18, 20, 22cm², 세 도형 모두에 속한 영역은 5cm²입니다.

- 세 도형 넓이의 합: `29 × 3 = 87`
- 정확히 한 도형에만 속한 영역: `18 + 20 + 22 = 60`
- 삼중 겹침이 세 번 세어진 값: `5 × 3 = 15`
- 정확히 두 도형에만 속한 영역을 두 번 센 값: `87 - 60 - 15 = 12`
- 정확히 두 도형에만 속한 영역: `12 ÷ 2 = 6`
- 두 도형 이상이 겹친 전체 영역: `6 + 5 = 11cm²`

문제는 포함배제 사고와 영역 분할을 요구하는 좋은 추론 문항입니다.

### 실제 영역별 값

도형을 A, B, C라고 하고 정확히 두 도형에만 속한 영역을 AB, AC, BC라고 하면 현재 생성식은 항상 다음 값을 만듭니다.

| 영역 | 생성되는 값 |
|---|---:|
| A만 | `e` |
| B만 | `e + 2` |
| C만 | `e + 4` |
| AB만 | `4` |
| AC만 | `2` |
| BC만 | `0` |
| ABC | `2 + k` |

따라서 스크린샷 값에서는 한 쌍의 ‘두 도형만 겹친 영역’이 0이어야 합니다. 그러나 현재 SVG에는 세 쌍의 겹침 영역이 모두 눈에 보이게 존재합니다. 이는 비율 문제 이전에 **위상 오류**입니다.

### 현재 SVG의 정량 오차

`src/components/ProblemDiagram.tsx`의 고정 다각형 좌표를 0.25px 격자로 샘플링해 면적 비율을 근사했습니다.

| 도형 | 문제에서 요구되는 단독 영역 비율 | SVG 단독 영역 비율 |
|---|---:|---:|
| A | `18/29 = 62.1%` | 약 `31.1%` |
| B | `20/29 = 69.0%` | 약 `30.9%` |
| C | `22/29 = 75.9%` | 약 `16.6%` |

삼중 겹침도 문제에서는 각 도형의 `5/29 = 17.2%`이지만 SVG에서는 약 37–39%를 차지합니다. 중앙의 노란 원은 실제 교집합 경계가 아니라 텍스트 배경이므로 오해를 더 키웁니다.

### 근본 원인

- `visual_template`에는 영역 값만 있고 렌더링 가능한 영역 분할 모델이 없습니다.
- 렌더러는 파라미터와 무관한 세 다각형 좌표를 사용합니다.
- 생성기는 정답 수식만 계산하고 영역 분할 가능성을 확인하지 않습니다.
- 검증기는 단위, 미평가 표현식, 답 노출을 확인하지만 위상·비례·라벨 위치는 검사하지 않습니다.
- ‘설명용 개략도’와 ‘수량을 표현하는 정량도’가 타입에서 구분되지 않습니다.

## 2. 현재 콘텐츠 감사

### 5학년 템플릿

- 22개 개념 × 30개 템플릿 = 660개
- 모든 세트는 쉬움/보통/어려움 `4/4/2`를 만족
- 최근 보강한 도형·응용 7개 개념은 개념당 10개 `problem_family`를 가짐
- 나머지 15개 개념은 의미 있는 `problem_family` 분류가 없음
- 기존 개념의 난이도 3은 A/B/C에서 같은 문장 또는 거의 같은 문장을 반복하는 경우가 많음

예를 들면 다음은 난이도 3이지만 적용·추론보다 절차 수행에 가깝습니다.

- 혼합 계산: 두 괄호 또는 두 곱셈을 계산
- 약수: 두 번째로 큰 약수 구하기
- 평균: 평균에서 합 구하기
- 소수의 곱셈: 곱한 뒤 1 빼기
- 약분: 약분한 뒤 분자와 분모의 합 또는 차 구하기

문항 수와 난이도 분포는 충족하지만, 단원마다 ‘낯선 상황을 수학화하고 전략을 선택하는 문제’가 있다는 보장은 없습니다.

### 현재 자동 검증이 보장하는 것

- 세트당 10문제와 4/4/2 난이도 분포
- 개념 ID와 템플릿 표현식 유효성
- 하나의 정답, 객관식 중복 보기 방지
- 단위 일치
- 미평가 visual 값 방지
- 답 전용 visual 키 노출 방지
- 일부 도형 단원의 문제군 수

### 보장하지 못하는 것

- 모든 단원의 적용·추론 문제 비율
- 어려움이 단순 계산량 증가인지 전략적 난이도인지
- A/B/C 세트의 의미적 중복
- 상황 속 수량의 현실성
- 그림의 영역·길이·개수·각도와 라벨 값의 일치
- 0인 영역이 그림에는 존재하는 위상 오류
- 라벨이 실제로 가리키는 영역의 정확성
- 풀이 단계로 문제의 모든 조건이 사용되는지

## 3. 공식 프레임워크에서 가져올 기준

### 대한민국 2022 개정 교육과정

[교육부의 2022 개정 교육과정 발표](https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=93459&lev=0)는 단순 암기에서 탐구·개념 기반의 깊이 있는 학습으로 전환하고, 학생의 삶과 연결된 학습과 학습 과정을 중시하는 평가를 강조합니다. [NCIC 고시 안내](https://ncic.go.kr/board/B0033.cs?act=read&bwrId=2105&pageIndex=1&pageUnit=10)는 수학과 교육과정을 별책 8로 지정합니다.

한국과학창의재단의 [2022 개정 수학과 교육과정 최종 시안 연구](https://cdn.kosac.re.kr/files/legacy_data/jnrepo/upload/jnBrdBoard/202308/b800e7adf20d4ac2bf4892dddfb0fbcf_1692756609038.pdf)는 문제해결, 추론, 의사소통, 연결, 정보처리를 과정·기능과 연결합니다. Math Assist에서는 객관식·숫자 입력 제약 안에서도 다음 요소로 이를 구현할 수 있습니다.

- 문제해결: 상황을 수식·그림·표로 바꾸기
- 추론: 조건 비교, 규칙 일반화, 반례·오류 찾기
- 연결: 단원 안팎의 두 개념 또는 실생활 수량 연결
- 정보처리: 표·그래프·도형에서 필요한 정보 선택
- 의사소통: 풀이 순서 선택, 가장 적절한 설명 고르기

### TIMSS

[TIMSS 2023 수학 프레임워크](https://timssandpirls.bc.edu/timss2023/frameworks/index.html)는 문항을 `knowing`, `applying`, `reasoning`의 세 인지 영역으로 분류합니다. reasoning은 익숙하지 않은 상황, 복합 맥락, 다단계 문제, 표현·모델 구성과 전략 판단을 포함합니다.

[TIMSS 공개 4학년 문항](https://timssandpirls.bc.edu/PDF/T03_RELEASED_M4.pdf)에는 같은 수·측정·도형·자료 영역 안에서도 사실·절차, 개념 사용, 일상적 문제해결, 추론 문항이 함께 있습니다. 따라서 응용문제는 특정 ‘응용 단원’에만 둘 것이 아니라 모든 내용 영역에 교차 배치해야 합니다.

[TIMSS 문항 작성 지침](https://timssandpirls.bc.edu/methods/pdf/T11_Item_writing_guidelines.pdf)은 목표 학년에게 현실적인 상황과 수량을 사용하고, 수학 외의 낯선 어휘·맥락이 난이도를 올리지 않게 하며, 독립 검토와 필드 테스트를 거치도록 합니다.

### Singapore Primary Mathematics

[싱가포르 초등 수학 교육과정](https://www.moe.gov.sg/-/media/files/primary/mathematics_syllabus_primary_1_to_6.pdf)은 문제해결을 중심에 놓고 reasoning, communication and connections, applications, heuristics를 함께 다룹니다. 실제 맥락에서는 답을 계산하는 것뿐 아니라 가정, 수학적 모델, 해석, 현실성 검토를 순환하도록 제시합니다.

### NAEP와 Australian Curriculum

[NAEP 수학 프레임워크](https://nces.ed.gov/nationsreportcard/mathematics/whatmeasure.aspx)는 내용 영역과 별개로 low/moderate/high complexity를 분류합니다. 중간 복잡도는 두 성질의 연결과 전략 선택, 높은 복잡도는 모델의 가정 분석과 같은 인지 요구를 뜻합니다.

[Australian Curriculum Mathematics](https://www.australiancurriculum.edu.au/curriculum-information/understand-this-learning-area/mathematics)는 모든 내용 영역에 understanding, fluency, reasoning, problem solving을 통합하고, 모델링을 상황의 수학화·해결·해석·평가 과정으로 설명합니다.

## 4. Math Assist 응용문제 분류 체계

`difficulty`와 별도로 아래 메타데이터를 둡니다.

```ts
type CognitiveDomain = 'knowing' | 'applying' | 'reasoning'

type ReasoningPattern =
  | 'direct'
  | 'inverse'
  | 'constraint'
  | 'multi_step'
  | 'representation_shift'
  | 'compare_methods'
  | 'error_analysis'
  | 'pattern_generalization'
  | 'systematic_counting'
  | 'optimization'
  | 'data_sufficiency'
  | 'model_and_check'

interface ProblemBlueprintMeta {
  problemFamily: string
  cognitiveDomain: CognitiveDomain
  reasoningPattern: ReasoningPattern
  primaryStandard: string
  connectedStandards?: string[]
  representations: Array<'text' | 'equation' | 'table' | 'diagram' | 'graph' | 'manipulative'>
  contextType: 'pure_math' | 'real_world' | 'puzzle'
  estimatedSteps: number
  readingLoad: 'low' | 'medium' | 'high'
  visualSemantics?: 'decorative' | 'schematic' | 'quantitative'
}
```

### 12개 공통 문제 유형

| 유형 | 핵심 사고 | 예시 적용 영역 |
|---|---|---|
| 역문제 | 결과에서 원래 값 찾기 | 사칙연산, 평균, 넓이, 분수 |
| 조건 충족 | 여러 조건을 동시에 만족 | 수의 범위, 약수·배수, 도형 |
| 다단계 모델링 | 상황을 두 개 이상 식으로 변환 | 연산, 측정, 시간, 돈 |
| 표현 변환 | 그림↔식, 표↔규칙, 그래프↔문장 | 전 학년 |
| 방법 비교 | 두 풀이 중 옳거나 효율적인 것 판단 | 연산, 분수, 넓이 |
| 오류 분석 | 잘못된 풀이의 첫 오류 찾기 | 계산, 단위, 통분 |
| 규칙 일반화 | 먼 번째 항 또는 변하는 양 예측 | 규칙, 대응, 수 배열 |
| 체계적 세기 | 빠짐·중복 없이 경우 세기 | 조합적 사고, 도형 배열 |
| 최적화 | 가장 크거나 작게 만들기 | 둘레·넓이, 어림, 묶음 |
| 정보 선택 | 필요·불필요 조건 구분 | 문장제, 표·그래프 |
| 불변량·보존 | 재배열 전후 변하지 않는 양 | 넓이, 합동, 분수 |
| 모델 검토 | 답·그림·단위가 현실적인지 판단 | 측정, 평균, 자료, 가능성 |

## 5. 학년군별 난이도 계약

읽기 부담은 수학 난이도와 분리합니다. 저학년 응용문제는 긴 문장 대신 그림과 조작으로 어렵게 만들 수 있습니다.

| 학년군 | Difficulty 1 | Difficulty 2 | Difficulty 3 |
|---|---|---|---|
| 1–2 | 한 표현·직접 관계·1단계 | 조건 하나 선택·표현 전환·2단계 | 낯선 배열·두 조건·2–3단계 |
| 3–4 | 익숙한 절차·1–2단계 | 역문제 또는 두 표현·2–3단계 | 전략 선택·불필요 정보·3–4단계 |
| 5–6 | 직접 적용·1–2단계 | 개념 연결·역산·2–4단계 | 비정형 모델링·가정 검토·3–6단계 |

어려움은 다음 중 최소 두 가지가 증가할 때만 올립니다.

- 필요한 개념 수
- 추론 단계 수
- 표현 변환 수
- 전략 선택의 자유도
- 조건의 상호 의존성
- 익숙하지 않은 문제 구조

숫자 크기, 문장 길이, 보기의 함정만 늘린 경우는 난이도 상승으로 인정하지 않습니다.

## 6. 단원별 커버리지 계약

### 개념 단위

30개 템플릿을 가진 개념은 다음을 목표로 합니다.

- 8개 이상의 의미 있는 `problem_family`
- knowing 30–40%, applying 40–50%, reasoning 20–30%
- 최소 2개의 서로 다른 reasoning family
- 최소 2개의 표현 방식
- 실제 맥락은 수량·단위·행동이 목표 학년에 현실적

### 단원 단위

- 모든 주요 성취기준에 applying 문항 1개 이상
- 단원 핵심 아이디어마다 reasoning 문항 1개 이상
- 단원 안 개념 연결 문제 1개 이상
- 이전 단원과 연결되는 전이 문제 1개 이상
- 시각 모델이 필요한 단원은 quantitative visual family 1개 이상

### 세트 구성

기존 4/4/2 난이도 믹스는 일반 연습에 유지할 수 있지만, 인지 유형을 별도로 보장합니다.

- 일반 세트: knowing 4 / applying 4 / reasoning 2
- 응용 세트: knowing 2 / applying 4 / reasoning 4
- A/B/C는 단순 문장 바꾸기가 아니라 맥락, 표현 또는 추론 패턴 중 하나가 달라야 함

## 7. 시각 무결성 계약

### 세 가지 visual semantics

| 종류 | 허용 범위 | 검증 |
|---|---|---|
| decorative | 분위기만 제공, 풀이 데이터 없음 | 답 노출·접근성 |
| schematic | 관계·순서·위상 표현, 정확한 비율은 아님 | 위상, 포함 관계, 대소 순서, ‘개략도’ 표시 |
| quantitative | 길이·넓이·각도·개수를 풀이에 사용 | 수치 가능성, 비례, 라벨, 단위 |

넓이 또는 길이를 직접 추론하는 초등 문항은 원칙적으로 `quantitative`를 사용합니다. 비례를 보존할 수 없는 개략도는 해당 문제의 핵심 시각으로 사용하지 않습니다.

### 생성 전 수학 검증

세 도형 영역 문제는 다음 파생값을 먼저 계산합니다.

```ts
const onlyAWithPairs = shapeA - exclusiveA - triple
const onlyBWithPairs = shapeB - exclusiveB - triple
const onlyCWithPairs = shapeC - exclusiveC - triple

const pairAB = (onlyAWithPairs + onlyBWithPairs - onlyCWithPairs) / 2
const pairAC = (onlyAWithPairs + onlyCWithPairs - onlyBWithPairs) / 2
const pairBC = (onlyBWithPairs + onlyCWithPairs - onlyAWithPairs) / 2
```

게이트:

- 모든 파생 영역이 0 이상
- 그림에서 존재해야 하는 영역은 양수
- 양수 영역의 최소 비율을 확보해 라벨을 읽을 수 있음
- 정수 답을 요구한다면 파생 영역과 최종 답도 정수
- 합집합과 각 도형 넓이를 두 방식으로 재계산해 일치

현재 템플릿처럼 `pairBC = 0`인 샘플을 허용하려면 렌더러도 BC-only 영역을 만들지 않아야 합니다. 그렇지 않으면 파라미터 범위를 바꿔 모든 영역이 양수가 되게 해야 합니다.

### 렌더링 검증

정량 시각은 렌더 결과의 기하를 다시 측정합니다.

- 면적: 각 영역의 픽셀 또는 벡터 면적 비율이 목표 비율 허용 오차 안
- 길이: 좌표상 길이 비율과 라벨 비율 일치
- 각도: 실제 좌표로 계산한 각과 라벨 일치
- 개수: 렌더된 객체 수와 데이터 일치
- 위상: 0인 교집합은 보이지 않고 양수 교집합은 존재
- 라벨: 라벨 중심점이 해당 영역 내부에 있음

초기 허용 오차 제안:

- 핵심 비교 관계: 100% 보존
- 위상: 100% 일치
- 영역·길이 비율: 목표 대비 ±10%, 작은 영역은 최소 가시성 별도 적용
- 라벨 영역 포함: 100%

### 권장 렌더링 방식

세 도형 겹침 문제에는 임의의 회전 다각형 대신 **단위 격자 기반 영역 모델**을 권장합니다.

- 1칸을 1cm² 또는 공통 배수로 정의
- A, B, C의 셀 집합을 생성
- 단독·이중·삼중 영역 셀 수가 파생값과 정확히 일치
- 동일 셀의 멤버십에 따라 색을 혼합
- 라벨은 각 영역의 가장 큰 연결 성분 중심에 배치

이 방식은 픽셀 면적과 수학적 넓이가 정확히 대응하고, 초등학생에게도 ‘영역을 세어 확인’할 수 있는 장점이 있습니다.

## 8. 자동 품질 게이트 확장

`validate:templates`에 추가:

- `missing_cognitive_domain`
- `missing_problem_family`
- `reasoning_family_minimum`
- `application_coverage_gap`
- `invalid_partition`
- `visual_topology_mismatch`
- `quantitative_visual_ratio_mismatch`
- `visual_label_outside_region`
- `unrealistic_context_quantity`

`audit:problems`에 추가:

- A/B/C 의미적 중복 경고
- difficulty와 cognitive domain의 불일치
- 숫자 크기만으로 어려워진 문항
- 사용되지 않는 조건 또는 그림 데이터
- 같은 풀이 골격의 과도한 반복

테스트 계층:

1. 모든 파라미터 경계값·대표값 수학 검증
2. visual 모델별 벡터/격자 기하 검증
3. 문제 카드 hidden/revealed 렌더러 테스트
4. 여러 seed로 세션 구성·중복 검증
5. 학년군별 실제 학생 또는 교사 검토

## 9. 권장 실행 순서

### P0 — 현재 오류 차단

- `three_shape_overlap`을 정량 visual로 재분류
- 현재 고정 SVG를 격자 기반 렌더러로 교체하거나 문제에서 임시 제외
- 영역 분할 가능성·위상·비율 테스트 추가
- 기존 생성 범위에서 `pairBC = 0`이 되는 계약을 명시적으로 처리

### P1 — 문제 메타데이터 마이그레이션

- 660개 템플릿에 `problem_family`, `cognitive_domain`, `reasoning_pattern` 부여
- A/B/C 의미 중복 보고서 생성
- `difficulty`와 읽기 부하 분리

### P2 — 단원별 응용문제 청사진

- 1–6학년 단원마다 성취기준 × knowing/applying/reasoning 매트릭스 작성
- 우선 공백이 큰 5학년 기존 15개 개념부터 적용·추론 family 보강
- 3학년 Beta, 4·6학년 신규 콘텐츠는 처음부터 같은 계약 적용

### P3 — 생성·필드 검증

- 일반 세트와 응용 세트 분리
- 시드 기반 대량 생성과 자동 기하 검증
- 교사 검토와 학년군별 소규모 학생 관찰
- 오답률뿐 아니라 풀이 시간, 힌트 사용, 재도전, 시각 혼동을 기록

## 최종 원칙

좋은 응용문제는 문장이 길거나 숫자가 큰 문제가 아닙니다. 아이가 어떤 수학을 사용할지 결정하고, 표현을 바꾸고, 답이 상황과 그림에 맞는지 검토하게 하는 문제입니다. Math Assist의 생성기는 정답만 맞는 문제를 만드는 수준을 넘어 **조건·수량·그림·풀이가 하나의 동일한 수학 모델을 표현한다는 것**까지 증명해야 합니다.
