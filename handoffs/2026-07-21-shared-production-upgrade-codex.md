# Math Assist 프로덕션 업그레이드 제안 세션 인수인계

작성일: 2026-07-21

상태: 제안·리서치·아키텍처 스트레스 테스트 완료, P0 정량 겹침 그림 구현·검증 완료

대상 저장소: `/Users/friends/ai/math_assist`

## 1. 다음 세션이 알아야 할 결론

Math Assist의 프로덕션 확장은 기능을 한꺼번에 붙이는 작업이 아니다. 다음 네 계약을 먼저 세우고 각 기능을 그 위에 얹어야 한다.

1. **공통 학습 활동 계약**: 1문제 미션과 5·10문제 연습을 같은 `LearningActivitySession`으로 표현한다.
2. **문제 청사진 계약**: 숫자 난이도와 `knowing / applying / reasoning` 인지 유형을 분리하고 단원별 응용·추론 커버리지를 보장한다.
3. **정량 시각 계약**: 문제 수치와 그림이 하나의 수학 모델을 공유하며 위상·비율·라벨을 자동 검증한다.
4. **저장 경계 계약**: 로그인 없이 바로 학습하고 localStorage를 기본으로 유지하되, 보호자 연결은 같은 저장 인터페이스의 후속 구현으로 둔다.

미션·풀이장·캐릭터는 전 학년에 적용한다. 다만 1–2학년은 `play`, 3–4학년은 `bridge`, 5–6학년은 `study` 프리셋으로 세션 길이, 캐릭터 크기, 도구 수, 보상 노출을 다르게 한다. 미션·캐릭터·보상은 문제 생성·답안 저장·채점·복구를 통제하지 않는 파생 경험이어야 한다.

## 2. 이번 세션에서 만든 결과물

### 2026-07-21 후속 구현: P0 정량 겹침 그림

- `src/lib/three-shape-overlap.ts`가 세 도형의 같은 전체 넓이, 세 단독 영역, 삼중 공통 영역에서 일곱 영역을 결정적으로 계산한다.
- `src/lib/problem-generator.ts`는 새 문제 snapshot에 계산된 모델을 포함한다. `ProblemDiagram`은 구형 snapshot에 모델이 없어도 같은 함수로 복원한다.
- `three_shape_overlap` 템플릿은 `semantics: quantitative`를 선언한다. 검증기는 불가능한 음수 영역, 셀로 표현할 수 없는 비정수 영역, 의미 분류 누락을 차단한다.
- 렌더러는 고정 다각형을 제거하고 한 칸 1단위 넓이의 동일 셀로 일곱 영역을 표현한다. 0 영역은 그리지 않고, 문제에서 주지 않은 이중 겹침값은 숫자로 표시하지 않는다.
- 검증 결과: 32개 단위 테스트 파일의 139개 테스트, lint, TDD gate, 템플릿 검증, 문제 감사, 69개 정적 페이지 빌드, E2E 18개가 통과했다. 실제 Chromium에서 390×844와 1024×768 렌더, 구형 localStorage snapshot 복구, 콘솔 오류 0을 확인했다.
- 다음 구현 우선순위는 5학년의 완성되지 않은 숫자 입력을 수학적 오답과 분리하는 작업이다.

### 주 제안서

- [`docs/math-assist-production-proposal.html`](../docs/math-assist-production-proposal.html)
  - 1–6학년 제품 비전, 세 학년군 UX, 전 학년 풀이장·미션·캐릭터, 계정 전략, 아키텍처, 출시 로드맵, 프로덕션 게이트를 시각화했다.
  - 국내외 서비스 벤치마크, 현재 저장소 콘텐츠 감사, 응용문제·시각 무결성 진단을 한 문서에서 확인할 수 있다.
  - 반응형 HTML이며 인쇄/PDF 저장 버튼과 학년군 미리보기 상호작용을 포함한다.

### 상세 근거 문서

- [`references/2026-07-20-elementary-math-product-benchmark.md`](../references/2026-07-20-elementary-math-product-benchmark.md)
  - 국내외 10개 서비스, 학습 동기·게임화·아동 안전 근거, 채택·조정·배제 판정, 캐릭터 상태 세트를 정리했다.
- [`docs/math-assist-architecture-ux-stress-test.md`](../docs/math-assist-architecture-ux-stress-test.md)
  - 현재 코드의 네 진도 저장 방식과 학년별 앱 분리 상태를 감사했다.
  - 공통 활동·시도 영수증·진도 projection·경험 프리셋·저장소 포트와 복잡도 예산을 제안했다.
- [`references/2026-07-20-application-problem-visual-integrity-research.md`](../references/2026-07-20-application-problem-visual-integrity-research.md)
  - 전 단원 응용문제 확대 기준, 12개 공통 문제군, 학년군별 난이도 계약, 세트 구성, 시각 의미 수준, 수학·렌더링 검증식을 정리했다.
- [`docs/assets/math-assist-animal-mascots.png`](../docs/assets/math-assist-animal-mascots.png)
  - 수리·모아·루미 동물 캐릭터 콘셉트 라인업이다. 제품 자산 확정본이 아니라 스타일·역할 논의를 위한 V1 콘셉트다.

## 3. 저장소 감사에서 확인한 사실

### 현재 제품 구조

- 1·2·3학년은 각각 별도 미션·진도 구조를 사용하고 5학년은 별도 10문제 연습 세션을 사용한다.
- 홈은 `mathAssist_grade1Progress`, `grade2Progress`, `grade3Progress`, `progress_v1`을 학년별로 직접 해석한다.
- 5학년 세션은 `mathAssist_currentSession` 하나를 사용하고 2시간 후 만료된다.
- 풀이장은 5학년 연습 화면에만 있으며 현재 문제별 획 복구 계약이 없다.
- 4·6학년은 아직 제공되지 않는다.

### 5학년 콘텐츠

- 22개 개념 × 개념당 30개 템플릿 = 660개다.
- 모든 세트는 difficulty 기준 `4 / 4 / 2` 분포를 만족한다.
- 최근 추가된 도형·응용 7개 개념은 개념당 10개 문제군을 갖지만, 기존 15개 개념에는 의미 있는 `problem_family` 분류가 없다.
- 기존 difficulty 3 문항에는 비정형 추론보다 계산 단계를 하나 더 붙인 문제가 많다.
- 따라서 `difficulty`만으로는 응용·추론 커버리지를 보장할 수 없다.

## 4. 스크린샷 겹친 도형 문제의 정확한 진단

문제 자체는 포함배제와 영역 분할을 요구하는 좋은 추론 문항이며 정답은 `11cm²`다.

- 세 도형 넓이의 합: `29 × 3 = 87`
- 정확히 한 도형에만 속한 넓이: `18 + 20 + 22 = 60`
- 세 도형 공통부분이 세 번 세어진 값: `5 × 3 = 15`
- 정확히 두 도형에만 속한 부분: `(87 - 60 - 15) ÷ 2 = 6`
- 두 도형 이상 겹친 부분: `6 + 5 = 11`

그러나 현재 그림은 문제 데이터와 일치하지 않는다.

- 생성식으로 영역을 풀면 `AB만 = 4`, `AC만 = 2`, `BC만 = 0`, `ABC = 5`다.
- 현재 고정 SVG에는 `BC만` 영역이 보이므로 비율 이전에 **위상 오류**가 있다.
- 수치상 단독 영역 비율은 A 62.1%, B 69.0%, C 75.9%지만, 고정 SVG를 샘플링한 비율은 약 31.1%, 30.9%, 16.6%다.
- `src/components/ProblemDiagram.tsx`가 문제 파라미터와 독립적인 고정 다각형 좌표를 사용한다.
- 현재 검증기는 정답·단위·표현식·답 노출을 확인하지만 영역 위상·비율·라벨 위치는 확인하지 않는다.

이 문제는 단순 CSS 조정으로 고치면 안 된다. `three_shape_overlap`을 정량 시각으로 재분류하고 문제 생성기와 렌더러가 동일한 영역 분할 모델을 사용해야 한다. 구현 전까지는 해당 템플릿을 일시 제외하는 것도 허용 가능한 P0 안전 조치다.

## 5. 확정한 콘텐츠 계약

### 두 개의 독립 축

- `difficulty`: 계산량, 단계 수, 수의 범위, 표현 변환 수
- `cognitiveDomain`: `knowing | applying | reasoning`

추가로 `problemFamily`, `reasoningPattern`, `representations`, `contextType`, `estimatedSteps`, `readingLoad`, `visualSemantics`를 문제 청사진 메타데이터로 둔다.

### 공통 응용문제군

- 역문제
- 조건 충족
- 다단계 모델링
- 표현 전환
- 전략 비교
- 오류 분석
- 규칙 일반화
- 체계적 경우의 수
- 최적화
- 정보 선별
- 불변량·보존
- 모델 검증

### 커버리지 목표

- 개념당 의미 있는 `problem_family` 8개 이상
- knowing 30–40%, applying 40–50%, reasoning 20–30%
- 개념당 최소 2개 reasoning family와 2개 표현 방식
- 일반 세트: K4 / A4 / R2
- 응용 세트: K2 / A4 / R4
- A/B/C 세트는 문장만 바꾸지 않고 맥락·표현·추론 패턴 중 하나가 달라야 한다.

숫자 크기, 문장 길이, 함정 보기만 늘린 경우는 난이도 상승으로 인정하지 않는다. 저학년 응용문제는 긴 글 대신 그림·조작·조건 결합으로 어렵게 만든다.

## 6. 확정한 시각 무결성 계약

모든 visual은 다음 중 하나를 명시한다.

- `decorative`: 풀이 데이터가 없는 장식
- `schematic`: 관계와 위상을 표현하는 개략도
- `quantitative`: 길이·넓이·각도·개수를 실제 풀이에 사용하는 정량도

정량 시각 출시 게이트:

- 수학적 영역·교집합 위상 100% 일치
- 핵심 대소 관계 100% 보존
- 영역·길이 비율 목표 대비 ±10%
- 라벨 중심이 해당 영역 안에 위치하는 비율 100%
- 0인 영역은 보이지 않고 양수 영역은 최소 가시성 확보
- 답 전용 값은 제출 또는 해설 전까지 노출하지 않음

세 도형 겹침 문제는 임의 회전 다각형보다 단위 격자 기반 셀 집합을 권장한다. A·B·C 셀 멤버십에서 단독·이중·삼중 영역을 만들면 문제 수치, SVG, 검증기가 동일한 원천을 공유할 수 있다.

## 7. UX·동기·계정 범위 결정

### 유지

- 로그인 없는 즉시 시작과 기기 로컬 저장
- 홈의 추천 활동 한 개와 문제까지 주요 탭 3회 이내
- 전 학년 풀이장 V1: 펜·지우개·되돌리기·전체 지우기·문제별 임시 복구
- 전 학년 짧은 미션 셸과 캐릭터 반응
- 경로 진전 + 미션 보상 1종
- 틀려도 감점·연속 기록 손실 없이 재도전

### 학년군별 적응

| 학년군 | 기본 세션 | 캐릭터 | 풀이장 | 보상 |
|---|---:|---|---|---|
| 1–2 | 1–3문제 | 큰 전신·제스처 중심 | 기본 도구 + 수블록/수직선 1개 | 미션 종료 스티커 |
| 3–4 | 3–5문제 | 작은 동반자·요청형 전략 | 기본 도구 + 맞춤 도구 1개 | 챕터 진전·배지 1종 |
| 5–6 | 5문제 기본, 10문제 선택 | 절제된 코치 | 기본 도구 + 격자/자 등 | 숙달 진전 중심 |

### 후속으로 미룰 것

- 월드·보스·상점·복수 화폐
- 리더보드, 손실형 streak, 힌트 벌점
- AI 필기 판정과 무제한 장기 풀이 노트
- 전체 풀이 획의 다중 기기 동기화
- 어린이가 가입해야만 학습할 수 있는 로그인 벽

보호자 계정·어린이 프로필은 기록 보호와 기기 연결이 필요해질 때 도입한다. 첫 동기화 범위는 완료·복습·최근 활동·선택 아바타로 제한하고, 기존 로컬 기록은 미리보기와 백업을 거쳐 병합한다.

## 8. 검증한 내용

이번 세션은 문서·리서치·시각 제안 작업이므로 `src/**`와 `public/data/**`는 수정하지 않았다. 따라서 TDD gate 대상의 제품 변경은 없다.

제안서 검증:

- `parse5` HTML 파싱 성공
- 내부 앵커 누락 0
- 로컬 문서 링크 존재 확인
- CSS 중괄호 균형 0
- 인라인 JavaScript 구문 검사 성공
- trailing whitespace 0
- Chromium 1440×1000 렌더 확인
- Chromium 390×844 렌더 확인
- 모바일 페이지·콘텐츠 `scrollWidth = viewport width`
- 새 콘텐츠 카드의 viewport 이탈 0
- 브라우저 콘솔 error 0

실제 렌더 검증에는 로컬 HTTP 서버와 Playwright CLI를 사용했다. 앱 내부 브라우저의 `file://` 페이지 제어는 보안 제약 때문에 자동화가 막혔으므로, 파일을 HTTP로 제공해 검증했다. 이는 문서 오류가 아니라 검증 경로의 제약이었다.

## 9. 다음 세션 권장 착수 순서

다음 세션은 곧바로 전체 기능을 구현하지 말고 구현 계획을 아래 순서로 고정하는 것이 좋다.

### P0 — 현재 신뢰 오류 차단

1. `three_shape_overlap`을 정량 visual로 분류한다.
2. 영역 분할 가능성 검사와 현재 템플릿의 `BC만 = 0` 계약을 테스트로 고정한다.
3. 격자 기반 렌더러를 만들거나 수정 전까지 해당 템플릿을 세션에서 제외한다.
4. 위상·비율·라벨·답 선노출 회귀 테스트를 추가한다.

### P1 — 공통 타입과 검증기

1. `ProblemBlueprintMeta`, `CognitiveDomain`, `ReasoningPattern`, `VisualSemantics` 타입을 설계한다.
2. 공유 타입 변경 전 `workstreams/_shared/README.md`에 계약과 소유권을 기록한다.
3. `validate:templates`에 문제군·인지영역·영역 분할·시각 무결성 오류 코드를 추가한다.
4. 기존 660개 템플릿의 문제군·인지영역·의미 중복 감사 보고서를 만든다.

### P2 — 콘텐츠 청사진과 공통 학습 활동

1. 1–6학년 성취기준 × K/A/R × 표현 매트릭스를 작성한다.
2. 공백이 큰 5학년 기존 15개 개념부터 적용·추론 문제군을 보강한다.
3. `LearningActivitySession`, `AttemptReceipt`, `ProgressRepository` 계약과 기존 진도 키 읽기 어댑터를 설계한다.
4. 1·2·3·5학년 기존 기록을 무손실로 읽는 회귀 테스트를 먼저 작성한다.

### P3 — 전 학년 경험 셸

1. ScratchPad V1 공통 상태와 문제별 임시 복구를 구현한다.
2. 세 학년군 `ExperiencePreset`을 추가한다.
3. 미션 시작·완료 셸, 캐릭터 5개 런타임 상태, 보상 1종을 붙인다.
4. 아동 관찰에서 문제 도달, 주요 행동 혼동, 재도전, 자발적 다음 문제 선택을 검증한다.

## 10. 병렬 작업 경계

| Workstream | 우선 책임 | 먼저 읽을 문서 | 주의할 공유 지점 |
|---|---|---|---|
| 01 Content & Curriculum | K/A/R 매트릭스, 문제군, 5학년 15개 개념 보강 | 응용문제·시각 무결성 리서치 | `types.ts`, generator, templates |
| 02 Learning Loop | 공통 활동·시도 영수증·진도 projection | 아키텍처·UX 스트레스 테스트 | `session.ts`, 학년별 progress |
| 03 UI & Visuals | 정량 SVG, 경험 프리셋, 풀이장, 캐릭터 상태 | 이 문서와 iPad 풀이장 lessons learned | `ProblemDiagram.tsx`, ScratchPad |
| 04 Quality & Automation | 콘텐츠 감사, 위상·비율 검사, 렌더·E2E 회귀 | 응용문제·시각 무결성 리서치 | validator와 테스트 픽스처 |

`src/lib/types.ts`, `src/lib/problem-generator.ts`, `src/lib/session.ts`, `public/data/concepts.json`, `public/data/templates/*.json`은 공유 hotspot이다. 병렬 에이전트는 수정 전 소유권을 정하고 `_shared/README.md`에 타입 계약을 먼저 기록해야 한다.

## 11. 다음 에이전트의 첫 확인 명령

```bash
git status --short
sed -n '1,240p' handoffs/2026-07-21-shared-production-upgrade-codex.md
open docs/math-assist-production-proposal.html
npm run lint
npm run test
npm run build
```

제품 파일을 수정하는 단계에서는 집중 테스트를 먼저 추가하고 다음을 수행한다.

```bash
npm run tdd:guard
npm run test:e2e
git diff --check
```

Next 개발 서버와 production build는 `.next` 충돌을 피하기 위해 동시에 실행하지 않는다. 풀이장을 바꾸기 전에는 `docs/scratch-pad-ipados-lessons-learned.md`를 반드시 읽고 WebKit 선택 방지·native non-passive capture listener·단일 pointer 격리 계약을 유지한다.

## 12. 현재 작업트리와 종료 상태

이번 세션의 핵심 결과물은 아직 Git에 추적되지 않은 파일이다.

- `docs/math-assist-production-proposal.html`
- `docs/math-assist-architecture-ux-stress-test.md`
- `docs/assets/math-assist-animal-mascots.png`
- `references/2026-07-20-elementary-math-product-benchmark.md`
- `references/2026-07-20-application-problem-visual-integrity-research.md`
- `handoffs/2026-07-21-shared-production-upgrade-codex.md`

`.vscode/`, `e2e/screenshots/`, 저장소 루트의 과거 스크린샷 두 장은 이 세션의 결과물이 아니므로 임의로 삭제하거나 함께 stage하지 않는다. 커밋이 필요하면 위 결과물과 `handoffs/README.md`만 명시적으로 stage하고 `git diff --cached --check`를 실행한다.

## 13. 유지보수 계약

- 결정적 생성·채점·정답·해설을 게임 상태나 AI 응답에 의존시키지 않는다.
- partial credit은 제품 요구가 바뀌기 전까지 추가하지 않는다.
- 문제의 visual은 답을 제출하기 전에 답 전용 수치를 보여 주지 않는다.
- 응용문제 확대는 문항 수가 아니라 문제군·인지영역·표현 다양성과 학습자 검토로 완료를 판정한다.
- 정량 그림은 수치와 별도 손그림 좌표로 만들지 않는다. 하나의 수학 모델에서 문제·정답·그림·검증을 파생한다.
- 로그인은 학습 시작의 필수 조건이 아니다. 로컬 기록을 잃지 않는 연결·복구 기능으로 도입한다.
- 저학년과 고학년의 UI를 픽셀 단위로 같게 만들지 않는다. 공통 학습 루프와 상태 의미만 통일한다.
- 미션·캐릭터·보상은 학습을 시작하고 계속하게 도와야 하며 콘텐츠 잠금, 힌트 벌점, 손실형 연속 기록으로 압박하지 않는다.

## 14. 완료 정의

이번 세션의 목표였던 프로덕션 제안, 벤치마크, 아키텍처·UX 과잉 범위 검토, 전 학년 풀이장·미션·캐릭터 방향, 응용문제 확대, 스크린샷 시각 오류의 근본 진단과 검증 계약은 문서화되었다.

아직 완료되지 않은 것은 제품 구현이다. 다음 세션은 이 인수인계의 P0/P1을 구현 계획으로 세분화한 뒤, TDD gate를 지키며 작은 릴리스 단위로 시작해야 한다.
