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

### 7. 테스트
- [ ] **7.1** 수학 함수 단위 테스트 (`lib/math.test.ts`)
- [ ] **7.2** 채점기 테스트 (`lib/grader.test.ts`)
  - 정수, 소수, 분수, 대분수 케이스
- [ ] **7.3** 문제 생성기 테스트 (`lib/problem-generator.test.ts`)
  - 중복 방지, 셔플 검증

---

### 8. 배포
- [ ] **8.1** Vercel 연동
- [ ] **8.2** 프로덕션 빌드 테스트
- [ ] **8.3** 태블릿 실기기 테스트

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
1.1 → 1.4 → 2.1~2.4 → 3.1~3.5 → 4.1~4.7 → 5.4 → 5.5 → 7.1~7.3
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
| 7. 테스트 | 3 | 검증 |
| 8. 배포 | 3 | 릴리즈 |
| **합계** | **35** | |

---

## 현재 상태

- [x] PRD 작성 완료 (`math_prd.md`)
- [x] CLAUDE.md 작성 완료
- [x] GitHub 저장소 연동
- [ ] **다음 단계: 1.1 프로젝트 초기화**
