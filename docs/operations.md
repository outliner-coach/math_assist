# 실행과 배포

## 처음 준비

필수 조건은 Git과 Node.js 24 계열이다. 저장소 루트에서 다음 순서로 실행한다.

```bash
node --version
npm --version
npm ci
npx playwright install chromium
npm test
npm run lint
npm run build
```

`npm ci`는 `package-lock.json`과 정확히 맞는 의존성을 설치하므로 테스트와 빌드보다 먼저 실행한다. 빌드가 끝나기 전에 개발 서버를 동시에 시작하지 않는다.
`npm ci` 뒤에는 lockfile이 지정한 Playwright 버전의 Chromium 실행 파일이 캐시에
없을 수 있으므로 브라우저 테스트 전에 `npx playwright install chromium`을 실행한다.
실행 파일 부재 오류를 제품 회귀로 판정하지 말고 설치 후 같은 전체 검사를 다시
실행하며, 설치하지 못한 상태를 통과로 기록하지 않는다.

별도 데이터베이스 초기화, 시드 적재, 계정 생성, 필수 환경 파일은 현재 없다. `next.config.js`가 `NEXT_PUBLIC_BASE_PATH=/math_assist`를 빌드에 제공하며 이 값은 정적 자산과 JSON의 공개 경로 접두사다.

## 개발

```bash
npm run dev
```

기본 개발 서버는 `http://localhost:3000`에서 실행되고 앱 경로는 `http://localhost:3000/math_assist` 아래에 있다. 개발 서버를 종료한 뒤 프로덕션 빌드를 실행한다.

## 검증 순서

제품 코드나 콘텐츠를 바꾼 경우 영향 범위의 집중 테스트를 먼저 실행한 뒤 다음을 수행한다.

```bash
npm run validate:grade1
npm run validate:grade2
npm run validate:grade3
npm run validate:grade4
npm run validate:grade6
npm run generate:curriculum-direct-links
npm run validate:curriculum
npm run validate:templates
npm run validate:application-packs
npm run report:content-inventory
npm run audit:missions
npm run audit:problems -- --strict-warnings
npm run audit:applications
npm run promptfoo:problems
npm run generate:problem-review-catalog
npm run check:problem-editorial-review
npm test
npm run lint
npm run tdd:guard
npm run build
npm run test:e2e
git diff --check
```

- 특정 학년이나 5학년 템플릿을 건드리지 않았다면 관련 콘텐츠 검증기는 생략할 수 있지만, 변경한 콘텐츠의 검증기는 반드시 실행한다.
- 교육과정 또는 문제 연결을 바꿨다면 `generate:curriculum-direct-links`로 문제별 직접 역참조를 먼저 확정한 뒤 curriculum validator와 재고 보고서를 실행한다. 재고 보고서는 공개 원본, 원작성 원본, 정규 수학 서명, 생성 변형, 세션 문항 수를 섞지 않는다.
- 화면·라우팅·localStorage 복구·공개 시점을 바꾼 경우 브라우저 테스트를 생략하지 않는다.
- 응용문제 pack·family·registry·승인·증명·시각·세션을 바꾼 경우 `validate:application-packs`와 `audit:applications`를 함께 실행한다. 두 검사는 기존 학년 validator, 문제·미션 감사, 전체 회귀 검사를 대신하지 않는다.
- Playwright는 기본적으로 3100 포트를 사용한다. 다른 서버와 충돌하면 `PLAYWRIGHT_PORT=3173 npm run test:e2e`처럼 빈 포트를 지정한다.
- `npm run build`는 `out/`에 GitHub Pages용 정적 결과를 만든다. 콘텐츠에 따라 경로 수가 달라질 수 있으므로 수치 자체보다 의도한 동적 식별자가 모두 생성됐는지 확인한다.

`npm run promptfoo:problems`는 문제 품질 출판 주기의 전체 검증에서는
필수이며, 일반 기능 변경에서는 선택적 외부 평가로 실행할 수 있다.

```bash
npm run promptfoo:problems
```

외부 평가가 통과해도 생성·채점의 권한을 AI에 넘기지 않는다. 결과는
품질 검토 자료일 뿐 정답 판정 자료가 아니며, 결정적 validator·감사·
편집 원장 검사를 대신하지 않는다.

실제 renderer 검수 증거를 다시 만들 때는 개발 서버와 빌드를 겹치지
않게 다음을 실행한다. 이 명령은 현재 catalog의 모든 시각 원본과
허용 변형을 전수하므로 시간이 오래 걸린다. catalog를 먼저 만들지
않으면 편집 원장 검사는 이전 재고를 읽거나 `ENOENT`로 실패한다.

```bash
npm run generate:problem-review-catalog
npm run generate:problem-visual-evidence -- \
  --output docs/tracking/problem-visual-browser-evidence-v1.json
npm run apply:problem-visual-evidence
npm run generate:problem-review-catalog
npm run check:problem-editorial-review
```

증거 생성이나 적용이 실패하면 최종 원장을 통과로 유지한 채 결과를
무시하지 않는다. renderer 검수 버전과 최신 해시를 맞추고 영향 항목을
다시 확인한다.

## Codex 작업 단계 실행

기존 `phases/<이름>/` 작업을 실행할 때만 다음을 사용한다.

```bash
npm run harness -- phases/<이름>
```

이 실행기는 제품 변경 단계마다 테스트 동반 여부와 표준 검증을 검사한다. 일반 개발 명령이나 배포 명령을 대신하지 않는다.

## 배포

1. 의도한 파일만 스테이징한다.
2. `git diff --cached --check`와 필요한 전체 검증을 통과시킨다.
3. 검증된 커밋을 `main`에 푸시한다.
4. GitHub Actions의 `Deploy Next.js site to Pages`에서 build와 deploy 작업이 모두 성공했는지 확인한다.
5. 배포 URL의 `/math_assist/`, `/math_assist/home/`, 지원 학년 경로, 변경한 학습 경로를 새 브라우저에서 연다.
6. 정적 HTTP 성공뿐 아니라 hydration 뒤 버튼·저장 복구·콘솔 오류·자산 로딩을 확인한다.

워크플로는 Node.js 24에서 `npm ci`, `next build`를 실행해 `out/`을 업로드한다. 로컬 빌드 성공만으로 실제 배포 성공을 보고하지 않는다.

## 계정 기능을 추가할 때 필요한 운영 준비

현재 원격 계정 인프라는 없다. 로그인 기능을 배포하기 전에는 서버 저장소, 암호화 연결, 비밀번호 검증값, 속도 제한, 세션 철회, 복구 코드, 감사 사건, 백업·복구 절차와 계정 삭제·보존 정책을 운영 환경에서 검증해야 한다. 이 준비 없이 화면에만 `기록 저장하기`를 붙이면 안 된다.
