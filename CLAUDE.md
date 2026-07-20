# Math Assist 작업 안내

한국 초등학생이 가입 없이 바로 시작하는 비상업적 개인 수학 학습 웹앱이다. 현재 1·2·3학년 미션과 5학년 개념별 10문제 연습을 제공하며, 장기 범위는 1~6학년이다. 정적 배포와 기기 로컬 기록을 기본으로 유지한다.

## 프로젝트 문서 구조

```text
project-root/
├── CLAUDE.md                         → Claude Code 작업 진입점
├── AGENTS.md                         → Codex 작업 진입점; CLAUDE.md와 동일
├── docs/
│   ├── architecture.md               → 구성요소, 의존 방향, 대표 학습 흐름
│   ├── business-rules.md             → 채점, 세션, 보상, 그림, 계정의 학습 규칙
│   ├── security.md                   → 현재 로컬 기록과 향후 계정의 보호 정책
│   ├── standards.md                  → 변경·검증·경계·배포의 필수 규칙
│   ├── engineering-notes.md          → 증상·원인·대응·확인으로 정리한 구현 경험
│   ├── operations.md                 → 설치, 개발, 검증, 배포 절차
│   ├── contracts.md                  → 공개 경로, JSON, 브라우저 저장 계약
│   └── tracking/
│       ├── status.md                 → 검증된 현재 범위, 남은 일, 막힌 결정
│       ├── findings.md               → 현재 해결되지 않은 재현 가능한 문제
│       └── decisions/
│           ├── index.md              → 주요 기술·제품 결정 목록
│           └── 0001-*.md … 0009-*.md → 선택, 대안, 이후 제약을 담은 결정 기록
├── public/
│   └── data/
│       └── AGENTS.md                 → 5학년 단원·개념·템플릿 변경 규칙
├── scripts/
│   └── AGENTS.md                     → 검증·감사·생성 스크립트 변경 규칙
└── src/
    ├── app/
    │   └── AGENTS.md                 → 경로와 화면별 학습 흐름 경계
    ├── components/
    │   └── AGENTS.md                 → 입력·시각·풀이장·보상 표현 경계
    └── lib/
        └── AGENTS.md                 → 생성·채점·진도·저장 규칙 경계
```

## 반드시 지킬 원칙

- 정답 계산과 채점은 규칙 기반이며 정답 또는 오답만 반환한다. AI, 캐릭터, 보상 상태가 판정을 바꾸면 안 된다.
- 로그인 없이 학습을 시작할 수 있어야 한다. 기존 localStorage 형식을 바꿀 때 완료·복습·최근 활동을 잃으면 안 된다.
- 문제 그림은 확인 전에 답 전용 값을 DOM에 만들지 않는다. 정량 그림은 문제·정답과 같은 수학 모델에서 위상·비율·라벨을 파생한다.
- `src/**` 또는 `public/data/**` 변경은 같은 변경에 집중 테스트를 추가하거나 갱신하고 TDD 검사를 통과해야 한다.
- 태블릿에서 한 문제에 집중할 수 있는 큰 터치 영역을 유지하며, 저학년과 고학년 표현을 억지로 같게 만들지 않는다.

## 작업 전 확인

1. `docs/standards.md`, `docs/engineering-notes.md`, 변경할 디렉터리의 `AGENTS.md`를 읽는다.
2. 작업영역을 `workstreams/`에서 고른다. `src/lib/types.ts`, 생성기, 세션, 개념·템플릿, 배포 파일을 바꿀 때는 `workstreams/_shared/README.md`에 소유권과 계약을 먼저 기록한다.
3. 채점·정규화·보상 변경 전 `docs/business-rules.md`의 해당 규칙과 기존 이전 형식 테스트를 확인한다.
4. 공개 경로나 localStorage 이름을 바꾸기 전 `docs/contracts.md`의 입력·오류 처리와 `docs/security.md`의 학년별 격리를 확인한다.
5. `ScratchPad`, 연습 화면 선택 정책, 포인터 처리를 바꾸기 전 `docs/engineering-notes.md`의 iPad 항목과 `src/components/ScratchPad.test.ts`를 확인한다.
6. 그림이나 템플릿을 바꾸기 전 답 선노출 쌍 테스트, 정량 그림 조건, 해당 학년 검증 명령을 확인한다.
7. 배포나 Next 설정을 바꾸기 전 `/math_assist` 기준 경로와 GitHub Pages 작업을 확인한다. 개발 서버와 빌드는 동시에 실행하지 않는다.

## 문제 보고 기준

다음은 발견 즉시 사용자에게 보고하고 결정을 받는다.

- 정답·채점·풀이가 수학적으로 틀리거나 같은 입력에서 달라지는 경우
- 제출 전 정답 전용 값이 보이거나 접근성 트리에 노출되는 경우
- 기존 학습 기록이 삭제·축소되거나 다른 학년 기록까지 손상되는 경우
- 현재 브라우저 프로필 경계를 벗어난 기록 접근, 원격 계정 도입 후 다른 학습자 기록 접근, 비밀번호·복구 코드 노출, 로그인 우회가 가능한 경우
- 배포된 화면이 로컬 검증과 다르거나 실제 GitHub Pages 배포가 실패한 경우

그 밖의 구조적 문제는 조건·증상·영향·당장 해결하지 못하는 이유를 `docs/tracking/findings.md`에 기록한다. 원인을 추적해 현재 작업 안에서 안전하게 고칠 수 있는 문제는 미해결 목록에 넘기지 말고 테스트와 함께 해결한다.

## 기본 명령

```bash
npm ci
npm run dev
npm run lint
npm test
npm run tdd:guard
npm run build
npm run test:e2e
```

콘텐츠를 바꾸면 영향받는 `validate:*`와 `audit:*` 명령을 함께 실행한다. 커밋 전에는 의도한 파일만 스테이징하고 `git diff --cached --check`를 통과시킨다.
