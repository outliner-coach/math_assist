# 초등 5학년 수학 개념 학습·연습문제 웹앱 PRD (prd.md)

작성일: 2026-02-01 (KST)
버전: v0.2 (MVP 중심)

---

## 1. 제품 개요

초등학교 5학년 수학의 **단원별 주요 개념(예: 공약수/공배수/통분/분수 연산 등)**을 선택하면,
1) 아이 눈높이의 개념 설명을 제공하고,
2) **연습문제 10문항 세트**를 풀게 한 뒤,
3) 제출 시 **자동 채점 + 정답 + 단계별 해설**을 제공하는 학습 웹앱입니다.

정확도(정답/채점)와 학습 경험(친절한 설명/힌트)을 동시에 달성하기 위해 **결정적 코어(규칙 기반) + AI 어시스트(API)** 하이브리드 구조를 채택합니다.

### 1.1 프로젝트 성격
- **비상업적 개인/교육 프로젝트**
- 핵심 기능 중심의 MVP 구현
- 태블릿 기기 최적화

---

## 2. 목표(Goals)

### 2.1 사용자 가치
- 초5 아이가 “개념을 이해 → 빠르게 연습 → 바로 해설로 보완”하는 루틴을 형성
- **정답/해설의 신뢰도**를 확보(환각/계산 실수 방지)
- 학습 몰입을 위해 “설명/힌트/피드백”을 자연어로 친절하게 제공

### 2.2 제품 지표(초기)
- 세션 완료율(10문항 제출 완료 비율)
- 평균 정답률/개념별 오답률
- 재방문율(다음날/일주일 내)
- 힌트 사용률(오답 시 힌트 버튼 클릭 비율)

---

## 3. 범위(Non-Goals)

- 전 학년(1~6) 전체 확장: MVP 범위 밖(구조만 확장 가능하게 설계)
- 서술형 긴 답안/자유 서술 채점: MVP 범위 밖
- AI가 정답/채점을 “결정”하는 구조: 배제(정확도 리스크)

---

## 4. 타깃 사용자 및 시나리오

### 4.1 사용자
- 주 사용자: 초등학교 5학년 학생
- 보조 사용자: 학습을 돕는 보호자(점수/오답 확인, 반복 학습 유도)

### 4.2 핵심 시나리오
1) 아이가 ‘약수와 배수 > 최소공배수’ 선택  
2) 설명/예시를 읽고 ‘연습문제(10)’ 시작  
3) 10문항 풀이 후 제출  
4) 점수와 함께 오답 문항의 해설을 읽고 재도전

---

## 5. 정보 구조(IA) 및 UX 플로우

### 5.1 IA
- 단원(5-1, 5-2)
  - 개념(Concept)
    - 설명/예시/자주 실수
    - 연습(Practice Session 10문항)

### 5.2 화면(페이지) 구성
1) 홈/단원 선택
2) 단원 내 개념 목록
3) 개념 상세(설명 + 예시 + 실수 + 연습 시작)
4) 연습 세션(1/10~10/10)
5) 결과(점수/시간/문항별 정답·해설/재도전)

### 5.3 풀이 모드
- 기본: **일괄 제출(10문항 끝나면 채점)**
- 옵션(추후): 즉시 채점(문항별 제출)

---

## 6. 콘텐츠 범위: 초5 주요 개념(단원별 분류)

> ※ 학교/교재 편차가 있을 수 있어, MVP는 “핵심 공통 개념” 중심으로 시작합니다.

### 6.1 5-1
- ✅ 자연수 혼합 계산(계산 순서, 괄호)
- ✅ 약수와 배수(약수/배수/공약수/최대공약수/공배수/최소공배수)
- ✅ 규칙과 대응(표/규칙 찾기, 대응 관계)
- ✅ 약분과 통분(기약분수/약분/통분)
- ✅ 분수의 덧셈과 뺄셈(이분모 분수)
- ⬜ 다각형의 둘레와 넓이 — *SVG 기하 컴포넌트 필요, 미구현*

### 6.2 5-2
- ✅ 수의 범위와 어림하기(반올림/올림/버림)
- ✅ 분수의 곱셈(분수×자연수, 분수×분수)
- ⬜ 합동과 대칭 — *SVG 기하 컴포넌트 필요, 미구현*
- ✅ 소수의 곱셈(소수×자연수, 소수×소수)
- ⬜ 직육면체 — *SVG 기하 컴포넌트 필요, 미구현*
- ✅ 평균과 가능성(평균 구하기)

---

## 7. 기능 요구사항(Functional Requirements)

### 7.1 개념 탐색
- 단원 목록 조회
- 단원별 개념 목록 조회(개념 카드: 제목/요약/난이도 추천)
- 개념 상세 조회
  - 쉬운 설명(초5 수준)
  - 대표 예시 2~3개
  - 자주 하는 실수(오답 포인트)
  - “연습 시작” 버튼

### 7.2 연습 세션
- 개념 선택 후 10문항 생성
- 진행률 표시(예: 3/10)
- **답 입력 UI (2가지 유형만 지원)**
  - **객관식**: 보기 4개 중 택1 (터치/클릭)
  - **숫자 입력**: 정수, 소수, 분수(a/b 형식) 직접 입력
- 제출(10문항 완료 후 일괄 제출)
- 제출 완료 후 자동 채점 결과 표시
  - 점수(0~10)
  - 문항별 정오답/정답/사용자 답/해설(풀이 단계)
  - 오답 개념 이동(관련 개념 링크)

### 7.3 세션 유지 및 복구
- 브라우저 localStorage에 진행 중인 답안 자동 저장
- 페이지 새로고침/이탈 후 복귀 시 이어서 풀기 가능
- 세션 유효 시간: 2시간 (이후 자동 만료)

### 7.4 학습 반복
- "비슷한 문제 10개 더" (동일 개념으로 새 세션)
- "틀린 문제만 다시" (추후)

### 7.5 사용자/기록
- 게스트 사용 (세션 ID 기반, 로그인 없음)

---

## 8. AI 모델 API 활용 전략(핵심)

### 8.1 원칙
- **정답/채점은 결정적(Deterministic) 코어가 담당**합니다.
- AI는 “설명/힌트/오답 피드백” 등 **자연어 품질 향상**에만 사용합니다.

### 8.2 AI 적용 범위(권장)
- 개념 설명 버전 생성(짧게/길게/비유 포함)
- **오답 피드백**: 제출 후 틀린 문항에 자동으로 AI 피드백 표시
- 힌트/격려 메시지 생성

### 8.3 AI 사용을 지양하는 영역
- 정답 계산/채점 판정(모델 계산 실수·환각 리스크)
- 난이도 통제 없이 문제 자체를 전면 생성(검증 파이프라인 없으면 위험)

### 8.4 Structured JSON 출력(스키마 강제)
AI 응답은 반드시 앱이 소비 가능한 JSON 스키마로 받습니다.

예: 힌트 응답 스키마
```json
{
  "hint_level_1": "가벼운 힌트 1문장",
  "hint_level_2": "더 구체적 힌트 1~2문장",
  "common_mistake": "자주 하는 실수 1문장",
  "encouragement": "짧은 격려 1문장"
}
```

---

## 9. 문제 생성/채점/해설 설계(결정적 코어)

### 9.1 문제 생성 방식(템플릿 기반)
- 개념별로 **문제 템플릿(유형)**을 여러 개 보유
- 세션 시작 시 난수 seed를 고정해 **재현 가능**하게 생성
- 생성된 문항(파라미터/정답/해설)을 세션에 저장

### 9.2 채점 규칙
- **채점 결과: 정답(O) 또는 오답(X) 2가지만** (부분 점수 없음)
- **객관식**: 선택한 보기 번호와 정답 번호 일치 여부
- **숫자 입력**:
  - 정수: 문자열→정수 파싱 후 비교 (예: "12" = 12)
  - 소수: 정규화 후 비교 (예: ".5" = "0.5" = 0.5)
  - 분수: `a/b` 형식 → 기약분수로 정규화 후 비교 (예: "2/4" = "1/2")
  - 대분수: `a b/c` 형식 → 가분수로 변환 후 비교 (예: "1 1/2" = "3/2")
- 앞뒤 공백 제거(trim) 적용

### 9.3 해설 생성
- MVP: 템플릿 기반 "풀이 단계" 고정(일관성과 신뢰 우선)
- AI는 "풀이를 더 친절히 풀어 쓰기" 정도로만(원 해설은 코어 제공)

### 9.4 도형 문제 처리
도형 관련 개념(다각형 둘레/넓이, 합동/대칭, 직육면체)의 문제 처리 방식:

- **도형 렌더링**: React 컴포넌트로 SVG 동적 생성 (코드 기반)
- **구현 방식**: 도형 타입별 컴포넌트 (`Rectangle`, `Triangle`, `Parallelogram` 등)
- **파라미터**: 가로, 세로, 높이 등을 props로 전달 → SVG 자동 생성
- **치수 표시**: 도형 위에 길이 라벨 자동 배치
- **문제 유형**: 도형을 보고 둘레/넓이/부피 등 **숫자 계산** 또는 **객관식** 선택
- **도형 직접 그리기**: MVP 범위 밖 (입력은 숫자/객관식만)

```typescript
// 예시: 직사각형 컴포넌트
<Rectangle width={8} height={5} showLabels={true} unit="cm" />
// → 가로 8cm, 세로 5cm 직사각형 SVG 생성
```

---

## 10. 태블릿 UI 설계

### 10.1 기준 해상도
- 기준: iPad (1024×768 이상)
- 가로 모드 권장, 세로 모드도 지원

### 10.2 레이아웃 원칙
- 큰 터치 영역 (버튼 최소 48×48px)
- 문제/보기 텍스트 크기: 18px 이상
- 한 화면에 문제 1개씩 표시 (스크롤 최소화)

### 10.3 숫자 입력 UI
- 입력 필드 터치 시 **커스텀 숫자 키패드** 표시
- 키패드 버튼: `0-9`, `.`, `/`, `공백(대분수용)`, `−(음수)`, `지우기`, `완료`
- 시스템 키보드 비활성화 (일관된 UX)

### 10.4 객관식 UI
- 보기 4개를 2×2 그리드 또는 세로 리스트로 배치
- 선택된 보기는 강조 표시 (배경색 변경)
- 다른 보기 터치 시 선택 변경

### 10.5 진행률 표시
- 상단에 10개 동그라미로 진행률 표시 (현재 문항 강조)
- 이전/다음 문항 이동 버튼

---

## 11. 데이터 모델(권장)

### 11.1 Unit(단원)
- id
- grade (5)
- semester (5-1 / 5-2)
- order (단원 순서)
- title (단원명)
- description (단원 설명, optional)

### 11.2 Concept(개념)
- id
- unit_id (FK → Unit)
- concept_title
- base_explanation (사람이 작성한 기준 설명)
- examples (json)
- pitfalls (json)
- order (개념 순서)

### 11.3 ProblemTemplate(문제 템플릿)
- id
- concept_id (FK → Concept)
- type: `choice` (객관식) | `number` (숫자입력)
- difficulty (1~3)
- param_schema (json: 파라미터 범위 정의)
- prompt_template (문제 문장 템플릿)
- choices_template (객관식인 경우 보기 4개 템플릿, nullable)
- image_template (도형 문제인 경우 SVG 템플릿, nullable)
- solver_rule (정답 계산 규칙/수식)
- solution_steps_template (해설 단계 템플릿)

### 11.4 PracticeSession(연습 세션)
- session_id
- concept_id (FK → Concept)
- seed (난수 시드)
- created_at
- expires_at (created_at + 2시간)
- items (json: 생성된 10문항의 params, correct_answer, solution_steps)

### 11.5 Submission(제출)
- session_id (FK → PracticeSession)
- answers (json: 사용자 답안 10개)
- submitted_at
- score (0~10)
- results (json: 문항별 correct boolean, feedback)

---

## 12. API 스펙(예시)

### 12.1 단원/개념
- `GET /api/units` → 단원 목록
- `GET /api/units/:unitId/concepts` → 단원별 개념 목록
- `GET /api/concepts/:id` → 개념 상세 (설명, 예시, 실수 포인트)

### 12.2 연습
- `POST /api/practice/start`
  - req: `{ concept_id }`
  - res: `{ session_id, expires_at, problems: [{index, prompt, type, choices?, image_svg?}] }`

- `POST /api/practice/:sessionId/submit`
  - req: `{ answers: [{index, user_answer}] }`
  - res: `{ score, results: [{index, correct, correct_answer, user_answer, solution_steps}] }`

- `GET /api/practice/:sessionId` → 세션 복구용 (진행 중인 세션 정보)

### 12.3 AI 힌트(옵션)
- `POST /api/ai/hint`
  - req: `{ concept_id, problem_prompt, user_answer? }`
  - res: `{ hint: string, encouragement: string }`
- AI 호출 실패 시: 템플릿 기반 기본 힌트 반환 (fallback)

---

## 13. 기술 스택

### 13.1 권장: Next.js 기반 단일 스택
- **Frontend**: Next.js (React) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Data**: 정적 JSON 파일 (DB 없음)
- **Session**: 클라이언트 localStorage (서버 저장 안 함)
- **Hosting**: Vercel (무료 티어)
- **AI**: Claude API (힌트 생성용, 선택사항)

### 13.2 데이터 저장 구조
```
/public/data/
  units.json              # 단원 목록 (9개 단원)
  concepts.json           # 개념 목록 (16개 개념, unit_id로 연결)
  templates/
    # 5-1 약수와 배수
    divisor.json          # 약수 템플릿
    multiple.json         # 배수 템플릿
    gcd.json              # 최대공약수 템플릿
    lcm.json              # 최소공배수 템플릿
    # 5-1 기타
    mixedcalc.json        # 자연수 혼합 계산 템플릿
    pattern.json          # 규칙과 대응 템플릿
    simplify.json         # 약분 템플릿
    commonden.json        # 통분 템플릿
    fracadd.json          # 분수의 덧셈 템플릿
    fracsub.json          # 분수의 뺄셈 템플릿
    # 5-2
    rounding.json         # 반올림 템플릿
    estimate.json         # 올림/버림 템플릿
    fracmul.json          # 분수의 곱셈 템플릿
    decimalmul.json       # 소수의 곱셈 템플릿
    average.json          # 평균 템플릿
```

### 13.3 클라이언트 localStorage 구조
```typescript
// 진행 중인 세션
localStorage.setItem('currentSession', JSON.stringify({
  sessionId: string,
  conceptId: string,
  problems: Problem[],      // 생성된 10문항
  answers: (string | null)[],  // 사용자 답안
  startedAt: number,        // timestamp
  expiresAt: number         // startedAt + 2시간
}))

// 최근 결과 (선택사항)
localStorage.setItem('lastResult', JSON.stringify({
  conceptId: string,
  score: number,
  completedAt: number
}))
```

### 13.4 선택 이유
- DB 설정/운영 비용 없음
- 콘텐츠(단원/개념/템플릿)는 자주 변경되지 않음
- 세션/결과 데이터는 영구 보관 불필요

---

## 14. 에러 처리

### 14.1 네트워크 오류
- 제출 실패 시 "다시 시도" 버튼 표시
- localStorage 백업으로 답안 유실 방지

### 14.2 세션 만료
- 2시간 초과 시 "세션이 만료되었습니다" 안내
- "새 연습 시작" 버튼으로 동일 개념 재시작 유도

### 14.3 AI 힌트 실패
- API 타임아웃(10초) 또는 오류 시 템플릿 기본 힌트 표시
- 사용자에게 오류 노출하지 않음

---

## 15. 테스트 전략

### 15.1 자동 테스트
- 템플릿별 랜덤 생성 100회 → 솔버 정답 검증
- 채점기 정규화 테스트 (정수/소수/분수/대분수 케이스)
- 객관식 정답 인덱스 범위 검증 (0~3)

### 15.2 수동 테스트
- 태블릿 실기기에서 터치 UX 검증
- 숫자 키패드 입력 흐름 확인

---

## 16. 릴리즈 플랜

### Phase 1 (MVP) ✅ 완료
- 5-1 "약수와 배수" 단원 중심
- 개념 4개, 개념당 템플릿 3개
- 객관식 + 숫자입력 문제
- 10문항 세션 + 일괄 채점 + 해설
- 태블릿 UI + 커스텀 숫자 키패드

### Phase 2 (확장) ✅ 완료
- 5-1 나머지 단원 추가 (자연수 혼합 계산, 규칙과 대응, 약분과 통분, 분수의 덧셈과 뺄셈)
- 5-2 단원 추가 (수의 범위와 어림, 분수의 곱셈, 소수의 곱셈, 평균과 가능성)
- 총 9개 단원, 16개 개념, 33개 템플릿

### Phase 3 (선택/미구현)
- 도형 문제 (SVG 렌더링): 다각형의 둘레와 넓이, 합동과 대칭, 직육면체
- AI 힌트 기능
- 오답 노트 / 다시 풀기

---

## 17. 추가 구현 스펙

### 17.1 객관식 보기 셔플
- 정답이 항상 같은 위치(예: 1번)에 오지 않도록 **보기 순서 랜덤 셔플**
- 셔플된 순서와 정답 인덱스를 세션에 저장
- 예: 원본 `[정답, 오답1, 오답2, 오답3]` → 셔플 `[오답2, 정답, 오답3, 오답1]`, 정답=1

### 17.2 문제 생성 로직
- 개념당 템플릿 3~5개 보유
- 세션 시작 시 **템플릿 랜덤 선택 + 파라미터 랜덤 생성**으로 10문항 구성
- **동일 세션 내 중복 방지**: 같은 (템플릿, 파라미터) 조합 불허
- 난수 seed 기반으로 재현 가능하게 생성 (디버깅/테스트용)

### 17.3 템플릿 함수 정의
문제 생성 시 사용할 수학 함수:
```typescript
// 약수/배수
gcd(a, b)              // 최대공약수
lcm(a, b)              // 최소공배수
divisors(n)            // n의 약수 목록 (문자열)
divisorCount(n)        // n의 약수 개수
multiples(n, count)    // n의 배수 count개 (문자열)
commonDivisors(a, b)   // a,b의 공약수 목록 (문자열)

// 분수 약분/통분
reduceFrac(n, d)       // 기약분수 문자열 (예: "3/4")
reducedNum(n, d)       // 약분된 분자
reducedDen(n, d)       // 약분된 분모
reduceFracOff(n, d, off) // 분자에 offset 더한 기약분수
commonDen(d1, d2)      // 공통 분모 (LCM)
convertNum1(n1, d1, d2)  // 통분 시 첫째 분수의 새 분자
convertNum2(n2, d1, d2)  // 통분 시 둘째 분수의 새 분자

// 분수 사칙연산
fracAdd(n1, d1, n2, d2)          // 분수 덧셈 (기약분수 문자열)
fracAddOff(n1, d1, n2, d2, off)  // 분수 덧셈 + 오프셋
fracSub(n1, d1, n2, d2)          // 분수 뺄셈
fracSubOff(n1, d1, n2, d2, off)  // 분수 뺄셈 + 오프셋
fracMul(n1, d1, n2, d2)          // 분수 곱셈
fracMulOff(n1, d1, n2, d2, off)  // 분수 곱셈 + 오프셋

// 반올림/올림/버림
roundTo(n, place)     // 반올림 (place: 10, 100, 1000)
ceilTo(n, place)      // 올림
floorTo(n, place)     // 버림

// 소수
dec1(n)               // 정수→소수 1자리 (25→"2.5")
decTimesNat(a, b)     // 소수(1자리)×자연수
decTimesNatOff(a, b, off) // 소수×자연수 + 오프셋
decTimesDec(a, b)     // 소수(1자리)×소수(1자리)
decTimesDecOff(a, b, off) // 소수×소수 + 오프셋

// 평균/합계
avg3(a, b, c)         // 세 수의 평균
avg4(a, b, c, d)      // 네 수의 평균
sum3(a, b, c)         // 세 수의 합
sum4(a, b, c, d)      // 네 수의 합
```

### 17.4 분수 렌더링 (KaTeX)
- **문제/보기 표시**: KaTeX로 렌더링 `$\frac{1}{2}$` → $\frac{1}{2}$
- **대분수 표시**: `$1\frac{1}{2}$` → $1\frac{1}{2}$
- **사용자 입력**: 텍스트 `1/2` 또는 `1 1/2` 형식 (커스텀 키패드)
- **라이브러리**: `katex` 또는 `react-katex` 사용

### 17.5 난이도 처리 (Phase 1)
- MVP에서는 **난이도 선택 UI 없음** (중간 난이도 고정)
- 템플릿의 `param_schema`에서 적절한 수 범위로 통제
- Phase 2에서 쉬움/보통/어려움 선택 추가 가능

### 17.6 문제 번호 vs 순서
- 문제는 1~10번 순서대로 표시
- 사용자는 **이전/다음 버튼으로 자유롭게 이동** 가능
- 풀지 않은 문항은 진행률 표시에서 빈 원으로 표시

---

## 18. 결정된 사항

| 항목 | 결정 |
|------|------|
| 분수 렌더링 | **KaTeX** 사용 |
| AI 힌트 시점 | **오답 제출 후 자동** 표시 |
| 도형 SVG | **React 컴포넌트로 코드 생성** |

---

## 19. 부록: 샘플 데이터

### 19.1 Concept 예시: 최소공배수(LCM)
```json
{
  "id": "lcm-001",
  "unit_id": "unit-divisor-multiple",
  "concept_title": "최소공배수",
  "base_explanation": "두 수의 공배수 중에서 가장 작은 수를 최소공배수라고 합니다.",
  "examples": [
    "6의 배수: 6, 12, 18, 24, 30...",
    "8의 배수: 8, 16, 24, 32...",
    "공배수: 24, 48... → 최소공배수는 24"
  ],
  "pitfalls": [
    "공약수와 공배수를 혼동함",
    "배수 목록을 너무 짧게 적어서 공배수를 못 찾음"
  ]
}
```

### 19.2 ProblemTemplate 예시: 최소공배수 객관식
```json
{
  "id": "tmpl-lcm-choice-001",
  "concept_id": "lcm-001",
  "type": "choice",
  "difficulty": 1,
  "param_schema": {
    "a": { "min": 2, "max": 12 },
    "b": { "min": 2, "max": 12 }
  },
  "prompt_template": "{{a}}와 {{b}}의 최소공배수는?",
  "choices_template": [
    "{{lcm(a,b)}}",
    "{{gcd(a,b)}}",
    "{{a * b}}",
    "{{a + b}}"
  ],
  "solver_rule": "lcm(a, b)",
  "solution_steps_template": [
    "{{a}}의 배수: {{multiples(a, 5)}}",
    "{{b}}의 배수: {{multiples(b, 5)}}",
    "공배수 중 가장 작은 수: {{lcm(a,b)}}"
  ]
}
```

### 19.3 ProblemTemplate 예시: 최소공배수 숫자입력
```json
{
  "id": "tmpl-lcm-number-001",
  "concept_id": "lcm-001",
  "type": "number",
  "difficulty": 2,
  "param_schema": {
    "a": { "min": 3, "max": 15 },
    "b": { "min": 3, "max": 15 }
  },
  "prompt_template": "{{a}}와 {{b}}의 최소공배수를 구하세요.",
  "solver_rule": "lcm(a, b)",
  "solution_steps_template": [
    "{{a}}의 배수를 나열합니다: {{multiples(a, 6)}}",
    "{{b}}의 배수를 나열합니다: {{multiples(b, 6)}}",
    "공통으로 나타나는 가장 작은 수가 최소공배수입니다.",
    "정답: {{lcm(a,b)}}"
  ]
}
```

---

끝.
