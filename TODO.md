# TODO: 초등 5학년 수학 학습 웹앱 구현 계획

## Phase 1: MVP (약수와 배수 단원)

---

### 1. 프로젝트 초기 설정
- [ ] **1.1** Next.js 프로젝트 생성 (`create-next-app`)
- [ ] **1.2** Tailwind CSS 설정
- [ ] **1.3** KaTeX 설치 및 설정 (`katex`, `react-katex`)
- [ ] **1.4** TypeScript 타입 정의 파일 생성 (`types/index.ts`)
- [ ] **1.5** 폴더 구조 생성
  ```
  src/
    components/
    lib/
    app/
  public/
    data/
  ```

---

### 2. 데이터 레이어
- [ ] **2.1** `public/data/units.json` 생성 (5-1 약수와배수 단원)
- [ ] **2.2** `public/data/concepts.json` 생성
  - 약수, 배수, 공약수, 최대공약수, 공배수, 최소공배수 (6개)
- [ ] **2.3** `public/data/templates/` 폴더 및 템플릿 JSON 생성
  - `divisor.json` (약수 문제 템플릿 3개)
  - `multiple.json` (배수 문제 템플릿 3개)
  - `gcd.json` (최대공약수 문제 템플릿 3개)
  - `lcm.json` (최소공배수 문제 템플릿 3개)
- [ ] **2.4** 데이터 로딩 유틸리티 (`lib/data.ts`)
  - `getUnits()`, `getConcepts()`, `getTemplates()`

---

### 3. 핵심 로직 (lib/)
- [ ] **3.1** 수학 함수 (`lib/math.ts`)
  - `gcd(a, b)` - 최대공약수
  - `lcm(a, b)` - 최소공배수
  - `divisors(n)` - 약수 배열
  - `multiples(n, count)` - 배수 배열
  - `reduce(num, den)` - 기약분수
- [ ] **3.2** 문제 생성기 (`lib/problem-generator.ts`)
  - `generateProblems(conceptId, count)` - 템플릿에서 10문항 생성
  - 파라미터 랜덤 생성 (중복 방지)
  - 객관식 보기 셔플
- [ ] **3.3** 채점기 (`lib/grader.ts`)
  - `normalizeAnswer(input)` - 정수/소수/분수/대분수 정규화
  - `checkAnswer(userAnswer, correctAnswer, type)` - 정답 비교
  - `gradeSession(answers, problems)` - 전체 채점
- [ ] **3.4** 템플릿 렌더러 (`lib/template-renderer.ts`)
  - `renderTemplate(template, params)` - `{{a}}`, `{{lcm(a,b)}}` 치환
- [ ] **3.5** 세션 관리 (`lib/session.ts`)
  - `saveSession(session)` - localStorage 저장
  - `loadSession()` - localStorage 로드
  - `clearSession()` - 세션 삭제
  - `isSessionExpired(session)` - 만료 체크

---

### 4. UI 컴포넌트 (components/)
- [ ] **4.1** 숫자 키패드 (`NumberKeypad.tsx`)
  - 버튼: 0-9, `.`, `/`, `공백`, `−`, `지우기`, `완료`
  - 입력값 상태 관리
  - 태블릿 터치 최적화 (48px 이상)
- [ ] **4.2** 문제 카드 (`ProblemCard.tsx`)
  - 문제 텍스트 (KaTeX 렌더링)
  - 객관식: 4개 보기 그리드
  - 숫자입력: 입력 필드 + 키패드 연동
- [ ] **4.3** 진행률 표시 (`ProgressIndicator.tsx`)
  - 10개 동그라미 (현재 문항 강조)
  - 답변 완료/미완료 상태 표시
- [ ] **4.4** 개념 카드 (`ConceptCard.tsx`)
  - 개념명, 요약 표시
  - 클릭 시 상세 페이지 이동
- [ ] **4.5** 결과 문항 카드 (`ResultCard.tsx`)
  - 정답/오답 표시
  - 사용자 답안 vs 정답
  - 풀이 단계 (KaTeX)
- [ ] **4.6** 공통 버튼 (`Button.tsx`)
  - primary, secondary 스타일
  - 태블릿 터치 영역
- [ ] **4.7** KaTeX 래퍼 (`MathText.tsx`)
  - 문자열 내 `$...$` 패턴 자동 렌더링

---

### 5. 페이지 (app/)
- [ ] **5.1** 홈 페이지 (`app/page.tsx`)
  - 단원 목록 표시
  - 단원 선택 → 개념 목록 페이지 이동
- [ ] **5.2** 개념 목록 페이지 (`app/unit/[unitId]/page.tsx`)
  - 해당 단원의 개념 카드 목록
  - 개념 선택 → 개념 상세 페이지 이동
- [ ] **5.3** 개념 상세 페이지 (`app/concept/[conceptId]/page.tsx`)
  - 개념 설명, 예시, 자주하는 실수
  - "연습 시작" 버튼
- [ ] **5.4** 연습 세션 페이지 (`app/practice/[conceptId]/page.tsx`)
  - 문제 1개씩 표시
  - 이전/다음 네비게이션
  - 진행률 표시
  - 제출 버튼 (10문항 완료 시)
  - localStorage 자동 저장
- [ ] **5.5** 결과 페이지 (`app/result/page.tsx`)
  - 점수 표시 (0~10)
  - 문항별 결과 카드
  - "다시 풀기", "다른 개념" 버튼

---

### 6. 스타일 및 레이아웃
- [ ] **6.1** 글로벌 스타일 (`app/globals.css`)
  - 폰트 설정 (한글)
  - KaTeX 스타일 import
- [ ] **6.2** 레이아웃 (`app/layout.tsx`)
  - 태블릿 최적화 컨테이너
  - 헤더 (홈 버튼, 현재 위치)
- [ ] **6.3** 반응형 브레이크포인트
  - 태블릿 가로: 1024px+
  - 태블릿 세로: 768px+

---

### 7. 단위 테스트
- [ ] **7.1** 수학 함수 단위 테스트 (`lib/math.test.ts`)
- [ ] **7.2** 채점기 테스트 (`lib/grader.test.ts`)
  - 정수, 소수, 분수, 대분수 케이스
- [ ] **7.3** 문제 생성기 테스트 (`lib/problem-generator.test.ts`)
  - 중복 방지, 셔플 검증

---

### 8. E2E 테스트 (Playwright)

#### 8.1 테스트 환경 설정
- [ ] **8.1.1** Playwright 설치 및 설정
- [ ] **8.1.2** 태블릿 뷰포트 설정 (1024×768)
- [ ] **8.1.3** 테스트용 시드 데이터 준비

#### 8.2 사용자 플로우 테스트
- [ ] **8.2.1** 홈 → 단원 선택 → 개념 목록 이동
- [ ] **8.2.2** 개념 목록 → 개념 상세 → 설명/예시 표시 확인
- [ ] **8.2.3** 개념 상세 → "연습 시작" → 연습 페이지 이동
- [ ] **8.2.4** 연습 완료 → 결과 페이지 → 점수 표시 확인
- [ ] **8.2.5** 결과 → "다시 풀기" → 새 세션 시작

#### 8.3 문제 풀이 플로우 테스트
- [ ] **8.3.1** 객관식 문제: 보기 선택 → 선택 상태 표시
- [ ] **8.3.2** 숫자 입력 문제: 키패드 입력 → 값 표시
- [ ] **8.3.3** 이전/다음 버튼: 문제 간 이동
- [ ] **8.3.4** 진행률 표시: 현재 문항 강조, 완료 상태 표시
- [ ] **8.3.5** 10문항 완료 후 제출 버튼 활성화

#### 8.4 채점 검증 테스트
```typescript
// 테스트 시나리오: 정답/오답 케이스별 검증
const gradingTestCases = [
  // 정수
  { input: "12", expected: "12", shouldPass: true },
  { input: " 12 ", expected: "12", shouldPass: true },

  // 소수
  { input: "0.5", expected: "0.5", shouldPass: true },
  { input: ".5", expected: "0.5", shouldPass: true },

  // 분수
  { input: "1/2", expected: "1/2", shouldPass: true },
  { input: "2/4", expected: "1/2", shouldPass: true },  // 기약분수 정규화

  // 대분수
  { input: "1 1/2", expected: "3/2", shouldPass: true },
  { input: "1 2/4", expected: "3/2", shouldPass: true },

  // 오답 케이스
  { input: "13", expected: "12", shouldPass: false },
  { input: "1/3", expected: "1/2", shouldPass: false },
];
```
- [ ] **8.4.1** 정수 정답/오답 채점
- [ ] **8.4.2** 소수 정규화 및 채점
- [ ] **8.4.3** 분수 기약분수 정규화 및 채점
- [ ] **8.4.4** 대분수 → 가분수 변환 및 채점
- [ ] **8.4.5** 객관식 정답 인덱스 채점

#### 8.5 세션 관리 테스트
- [ ] **8.5.1** 문제 풀이 중 페이지 새로고침 → 답안 복구 확인
- [ ] **8.5.2** 브라우저 탭 닫기 → 재방문 → 세션 복구
- [ ] **8.5.3** 2시간 경과 시뮬레이션 → 세션 만료 메시지
- [ ] **8.5.4** 만료 후 "새 연습 시작" → 새 세션 생성

#### 8.6 엣지 케이스 테스트
- [ ] **8.6.1** 빈 답안 제출 시도 → 경고 또는 차단
- [ ] **8.6.2** 일부 문항만 답변 후 제출 → 미응답 표시
- [ ] **8.6.3** 키패드 특수 입력: `-`, `/` 연속 입력 방지
- [ ] **8.6.4** 매우 큰 숫자 입력 (999999) → 적절한 처리
- [ ] **8.6.5** 뒤로가기 버튼 → 답안 유지 확인

#### 8.7 UI/접근성 테스트
- [ ] **8.7.1** 터치 영역 크기 검증 (48px 이상)
- [ ] **8.7.2** KaTeX 분수 렌더링 확인
- [ ] **8.7.3** 가로/세로 모드 전환 시 레이아웃
- [ ] **8.7.4** 버튼 포커스 상태 표시

#### 8.8 전체 시나리오 테스트 (Happy Path)
```typescript
// 전체 플로우를 처음부터 끝까지 검증
test('complete learning flow', async ({ page }) => {
  // 1. 홈에서 "약수와 배수" 단원 선택
  await page.goto('/');
  await page.click('text=약수와 배수');

  // 2. "최소공배수" 개념 선택
  await page.click('text=최소공배수');

  // 3. 개념 설명 확인 후 연습 시작
  await expect(page.locator('text=공배수 중에서 가장 작은')).toBeVisible();
  await page.click('text=연습 시작');

  // 4. 10문항 풀이
  for (let i = 0; i < 10; i++) {
    // 문제 유형에 따라 답변
    const isChoice = await page.locator('[data-type="choice"]').isVisible();
    if (isChoice) {
      await page.click('[data-choice="0"]'); // 첫 번째 보기 선택
    } else {
      await page.click('[data-key="1"]');
      await page.click('[data-key="2"]');
      await page.click('text=완료');
    }
    if (i < 9) await page.click('text=다음');
  }

  // 5. 제출 및 결과 확인
  await page.click('text=제출');
  await expect(page.locator('[data-testid="score"]')).toBeVisible();

  // 6. 점수가 0~10 범위인지 확인
  const scoreText = await page.locator('[data-testid="score"]').textContent();
  const score = parseInt(scoreText || '0');
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(10);
});
```
- [ ] **8.8.1** Happy Path 전체 플로우 테스트 구현
- [ ] **8.8.2** 모든 개념별 1회 완주 테스트

---

### 9. 배포
- [ ] **9.1** Vercel 연동
- [ ] **9.2** 프로덕션 빌드 테스트
- [ ] **9.3** 태블릿 실기기 테스트

---

## Phase 2: 확장 (추후)
- [ ] 5-1 나머지 단원 추가 (약분/통분, 분수 연산 등)
- [ ] 도형 문제 SVG 컴포넌트
- [ ] AI 힌트 API 연동
- [ ] 난이도 선택 UI

---

## 작업 우선순위

### MVP 핵심 경로 (Critical Path)
```
1.1 → 1.4 → 2.1~2.4 → 3.1~3.5 → 4.1~4.7 → 5.1~5.5 → 7.1~7.3 → 8.1~8.8 → 9.1~9.3
```

### E2E 테스트 우선순위
```
8.1 (환경설정) → 8.8 (Happy Path) → 8.4 (채점검증) → 8.5 (세션관리) → 8.2~8.3 (플로우) → 8.6~8.7 (엣지케이스)
```

### 예상 작업 단위
| 단계 | 작업 수 | 설명 |
|------|---------|------|
| 1. 초기 설정 | 5 | 프로젝트 기반 |
| 2. 데이터 | 4 | JSON 파일 |
| 3. 핵심 로직 | 5 | 수학/생성/채점 |
| 4. 컴포넌트 | 7 | UI 요소 |
| 5. 페이지 | 5 | 라우팅 |
| 6. 스타일 | 3 | 레이아웃 |
| 7. 단위 테스트 | 3 | 함수 검증 |
| 8. E2E 테스트 | 24 | Playwright 플로우 검증 |
| 9. 배포 | 3 | 릴리즈 |
| **합계** | **59** | |

---

## 현재 상태

- [x] PRD 작성 완료 (`math_prd.md`)
- [x] CLAUDE.md 작성 완료
- [x] GitHub 저장소 연동
- [x] TODO 작업 계획 작성 (59개 작업)
- [ ] **다음 단계: 1.1 프로젝트 초기화**
