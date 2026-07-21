# 6단계 - 4학년·6학년 교육과정, 콘텐츠, UI, 검증기

## 목표

현재 “준비 중” 또는 미노출인 4·6학년을 실제 학습 가능한 과정으로 만든다. 4학년은 3~4학년 `bridge` 경험, 6학년은 5~6학년 `study` 경험을 사용한다. 두 학년 모두 공식 교육과정 추적성, Knowing·Applying·Reasoning, 결정적 채점, 시각 무결성, 이전 기록 복구, 모바일·태블릿 게이트를 통과해야 한다.

## 공식 근거와 학년 배정 원칙

[교육부 고시 제2022-33호](https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&page=1&searchType=null&statusYN=W)는 수학과 교육과정을 별책 8로 지정하고, 초등 3·4학년은 2025년 3월 1일, 5·6학년은 2026년 3월 1일부터 적용한다고 명시한다. 성취기준 문구·해설은 [한국과학창의재단 2022 개정 수학과 교육과정 최종 시안 연구 PDF](https://cdn.kosac.re.kr/files/legacy_data/jnrepo/upload/jnBrdBoard/202308/b800e7adf20d4ac2bf4892dddfb0fbcf_1692756609038.pdf)의 공통 교육과정 원문과 교육부 별책 8을 대조한다.

중요: `[4수...]`는 4학년 전용 코드가 아니라 3~4학년군 코드이고, `[6수...]`는 6학년 전용 코드가 아니라 5~6학년군 코드다. 코드 숫자만 보고 새 학년에 자동 배정하면 안 된다. 구현 전에 아래 필드를 가진 versioned curriculum ledger를 만든다.

```ts
interface CurriculumAllocation {
  standardCode: string
  officialText: string
  band: '3-4' | '5-6'
  assignedGrade: 3 | 4 | 5 | 6
  semester: '3-1' | '3-2' | '4-1' | '4-2' | '5-1' | '5-2' | '6-1' | '6-2'
  unitId: string
  prerequisiteCodes: string[]
  sourceUrl: string
  sourcePage: number
  reviewStatus: 'draft' | 'curriculum-reviewed' | 'released'
}
```

같은 성취기준이 두 학년에 반복될 수는 있지만, 의도적 나선 학습인지 중복 구현인지 ledger에 이유를 남긴다. 학년군의 모든 코드는 출시 학년, 기존 학년, 또는 명시적 비범위 항목 중 하나로 분류되어야 한다.

## 교육과정 원장 범위

### 3~4학년군

| 영역 | 공식 코드 범위 | 내용 축 |
|---|---|---|
| 수와 연산 | `[4수01-01]`~`[4수01-16]` | 큰 수, 사칙계산, 어림, 분수·소수, 동분모/소수 덧뺄셈 |
| 변화와 관계 | `[4수02-01]`~`[4수02-03]` | 변화 규칙, 계산식 배열, 등호와 동치 |
| 도형과 측정 | `[4수03-01]`~`[4수03-25]` | 선·각, 이동, 원, 삼각형·사각형·다각형, 시간·측정·각도 |
| 자료와 가능성 | `[4수04-01]`~`[4수04-03]` | 그림·막대·꺾은선그래프, 자료 탐구 |

현재 3학년 36개 미션은 20개 고유 `[4수]` 코드를 참조한다. 단순 집합 비교에서 아직 미션이 참조하지 않는 27개 코드는 다음과 같다.

`[4수01-01]`, `[4수01-02]`, `[4수01-07]`, `[4수01-08]`, `[4수01-13]`~`[4수01-16]`, `[4수02-01]`~`[4수02-03]`, `[4수03-03]`~`[4수03-05]`, `[4수03-08]`~`[4수03-12]`, `[4수03-16]`, `[4수03-19]`, `[4수03-21]`~`[4수03-25]`, `[4수04-02]`.

이 목록은 4학년 자동 범위가 아니라 현재 저장소 공백 목록이다. ledger 검토에서 실제 3학년 보강과 4학년 신규 범위를 나눈다.

### 5~6학년군

| 영역 | 공식 코드 범위 | 내용 축 |
|---|---|---|
| 수와 연산 | `[6수01-01]`~`[6수01-15]` | 혼합 계산, 범위·어림, 약수·배수, 분수·소수 사칙과 관계 |
| 변화와 관계 | `[6수02-01]`~`[6수02-05]` | 대응, 비·비율, 비례식·비례배분 |
| 도형과 측정 | `[6수03-01]`~`[6수03-19]` | 합동·대칭, 여러 입체, 공간 감각, 둘레·넓이·원·겉넓이·부피 |
| 자료와 가능성 | `[6수04-01]`~`[6수04-06]` | 평균, 띠·원그래프, 자료 탐구, 가능성 |

현재 5학년은 12단원·22개념이지만 기존 `Unit`/`Concept`에는 모든 항목에 필수 공식 코드가 붙어 있지 않다. 6학년 범위를 “현재 5학년 제목에 없는 것”으로 추정하지 않는다. 먼저 22개념을 `[6수]` ledger에 매핑하고, 남은 코드와 학년별 교과 순서를 검토해 6학년 단원·개념을 확정한다.

## 콘텐츠 아키텍처

### 4학년 - Bridge 트랙

3학년과 같은 코드 기반 미션 구조를 확장하되 새 파일로 분리한다.

권장 소유 파일:

- `src/lib/grade4-problems.ts`
- `src/lib/grade4-answer-normalizers.ts`
- `src/lib/grade4-progress.ts`
- `src/components/grade4/**`
- `src/app/grade/4/**`

계약:

- 각 unit은 ledger의 표준 코드, 선수 기준, 학습자 목표를 가진다.
- 각 unit bank는 최소 10개 대표 template을 가지며 기본 청사진은 K4/A4/R2다.
- reasoning은 unit당 최소 2개 problem family와 2개 표현을 가진다.
- 한 활동은 3~5문제이며 bank 크기와 세션 길이를 혼동하지 않는다.
- 답은 객관식·숫자·단위가 있는 구조화 입력으로 결정적으로 정규화한다. 자유 서술 의미 추정은 하지 않는다.
- 맞춤 도구는 격자·자·각도기 중 문제에 필요한 하나만 연다.
- 정량 그림은 문제·정답과 같은 모델에서 만들며 answer-only 값은 확인 전 DOM에 없다.

### 6학년 - Study 트랙

5학년 정적 unit/concept/template 엔진을 재사용한다.

권장 소유 파일:

- `public/data/units.json`, `public/data/concepts.json`
- `public/data/templates/g6*.json`
- `src/app/grade/6/**`
- 필요 시 `src/components/grade6/**`; 상태 의미가 같으면 공용 Study 컴포넌트 사용

ID 계약:

- unit: `unit-6-1-<slug>`, `unit-6-2-<slug>`
- concept: 첫 `-` 앞부분이 고유 template 파일 prefix가 되도록 `g6<topic>-<nnn>`
- template file: `public/data/templates/g6<topic>.json`
- 기존 loader의 prefix 규칙을 바꿀 경우 5학년 모든 template 경로와 구형 세션을 같은 변경에서 검증한다.

콘텐츠 계약:

- 각 concept은 A/B/C 세트 × 10문제 template, 세트별 K4/A4/R2와 difficulty 4/4/2를 각각 검증한다.
- concept당 의미 있는 problem family 8개 이상, reasoning family 2개 이상, 표현 2개 이상이다.
- 모든 template은 `blueprint.primaryStandard`가 ledger의 해당 6학년 배정 코드와 일치한다.
- 기본 세션은 5문제, 선택 집중 세션은 10문제다. 기존 10문제 URL 호환을 유지한다.
- 분수·소수·비율 동치와 단위는 규칙 기반 정규화로 판정한다.
- 원·입체·비율 그래프 등 정량 시각은 위상, ±10% 비율, 라벨 내부, 0 영역, 답 선노출을 자동 검사한다.

## 경로와 저장 계약

| 경로 | 결과 | 오류 처리 |
|---|---|---|
| `/home` | 1~6학년 선택; 준비 완료 전 4·6 비활성 | hydration 뒤 실제 지원 상태 표시 |
| `/grade/4` | 4학년 단원·챕터 선택 | 손상 progress는 4학년만 초기화 |
| `/grade/4/mission?unitId=` | 3~5문제 Bridge 활동 | 잘못된 ID는 안전한 첫 unit |
| `/grade/6` | 6학년 단원 선택 | 데이터 실패 시 명시적 안내 |
| `/unit/<grade6UnitId>` | 6학년 개념 목록 | 빌드에 없는 ID는 404 |
| `/concept/<grade6ConceptId>` | 개념 설명과 세션 선택 | 데이터 불일치 안내 |
| `/practice/<grade6ConceptId>` | 5문제 기본 또는 10문제 선택 | 같은 요청의 유효 세션만 복구 |

새 저장 키는 각각 `mathAssist_grade4Progress`, `mathAssist_grade6Progress`처럼 진행 모듈에서만 정의한다. 가능하면 3단계 repository가 물리 키를 소유한다. 4학년 손상이 3학년을, 6학년 손상이 5학년을 초기화하면 실패다.

## 검증기

### `validate:grade4`

- unit/mission ID, semester, order, 표준 코드, answer config
- unit별 K/A/R 4/4/2 최소 bank와 reasoning family 2개
- 결정적 variant, 중복 보기·단일 정답, 구조화 답 self-check
- visual answer masking과 맞춤 도구 최대 1개
- 장기 seed 다양성, 같은 구체 문제 보상 dedupe

### `validate:grade6`

- unit-concept-template 참조와 prefix 파일 계약
- ledger grade/semester/standard 일치
- concept별 A/B/C 10개, difficulty 4/4/2, K/A/R 4/4/2
- 표현식 평가, 단일 정답, 동치 답, 중복 prompt·보기
- 정량 그림의 모델·위상·비율·라벨·answer masking
- 정적 `generateStaticParams` 대상 누락 0

`audit:missions`에는 4학년, `audit:problems`에는 6학년을 포함한다. 검증 실패는 grade, unit, concept, template/mission, standard code, 오류 코드를 출력하고 0이 아닌 상태로 끝난다.

## 단계별 승격

현재 6A 원장은 92개 학년군 성취기준을 모두 배정했다. 4학년은 `[4수01-01]`, `[4수01-02]` 큰 수 한 단원, 6학년은 `[6수02-02]`, `[6수02-03]` 비와 비율 한 단원이 작업트리 `released`다. 구현·비활성 범위와 공개 게이트의 상세 계약은 [`docs/grade4-bridge-release-scope.md`](../grade4-bridge-release-scope.md)와 현재 원장에 있다. 나머지 4·6학년 배정 성취기준은 `planned`다.

### 6A - curriculum ledger와 내부 review route

- 공식 코드 원문, page, 학년·학기 배정, 기존 3·5학년 coverage를 확정한다.
- 4·6학년은 홈에서 학습 가능으로 표시하지 않는다.
- 내부 review 화면과 validator 실패 픽스처만 준비한다.

Gate 6A: 학년군 공식 코드 100%가 배정/기존/비범위 중 하나이며 검토자와 근거가 있다.

### 6B - 4학년 구현과 승격

- Grade4 bank, normalizer, progress, Bridge UI, ScratchPad를 구현한다.
- 단원별 K/A/R·표현·시각·학습자 검토를 통과한 뒤 홈을 활성화한다.

Gate 6B: 4학년 모든 출시 unit의 공식 추적성 100%, 자동 감사 오류 0, E2E 100%.

### 6C - 6학년 구현과 승격

- Grade6 unit/concept/template, Study UI, 5/10 선택, ScratchPad를 구현한다.
- 모든 정적 경로와 template prefix를 build 산출물에서 확인한다.
- A/B/C는 서로 겹치지 않는 10개씩의 문제군을 제공하고 비례식 `[6수02-04]` 성격 문항을 별도 이후 범위로 남긴다.
- blueprint가 표를 요구하면 정답 전용 값을 포함하지 않는 실제 정량 `ratio_table`을 렌더링한다.
- 손상된 Grade 6 session/result는 자동 삭제·덮어쓰기 없이 명시적 복구 UI로만 초기화한다.

Gate 6C: 6학년 모든 출시 concept의 공식 추적성·세트 분포·K/A/R 100%, 자동 감사 오류 0.

### 6D - 1~6 통합 출시

- `/home`에서 1~6을 모두 학습 가능으로 표시한다.
- 학년 전환, 각 학년 이어하기, 풀이장 복구, 손상 키 격리를 검증한다.
- 실제 GitHub Pages 배포에서 `/math_assist` basePath, hydration, 자산, 콘솔을 확인한다.

Gate 6D: 1~6 핵심 흐름·접근성·모바일·태블릿 blocker 0.

2026-07-21 작업트리는 Gate 6C와 로컬 Gate 6D를 통과해 4·6학년 원장을 `released`로 유지한다. Grade 6 전용 Chromium E2E는 홈 진입, 5/10문제, 실제 표, 정답 선노출 방지, 손상 복구, Grade 5 격리와 390×844·1024×768의 48px 동작을 확인한다. 다만 `main` 반영·GitHub Pages 성공·새 브라우저 hydration이 없으므로 실제 배포 완료는 아니다.

## 완료 조건

- 4·6학년은 “준비 중” 표시가 아니라 검증된 학습 경로를 가진다.
- 각 문제는 공식 standard, K/A/R, problem family, 표현에 추적 가능하다.
- 4학년은 Bridge 3~5문제, 6학년은 Study 5/10문제 계약을 지킨다.
- 기존 1·2·3·5학년 콘텐츠·진도·세션 회귀가 없다.
- 관련 `validate:*`, `audit:*`, `npm test`, `npm run lint`, `npm run tdd:guard`, `npm run build`, `npm run test:e2e`와 실제 배포 확인이 모두 통과한다.
