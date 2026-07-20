# 실행과 배포

## 처음 준비

필수 조건은 Git과 Node.js 24 계열이다. 저장소 루트에서 다음 순서로 실행한다.

```bash
node --version
npm --version
npm ci
npm test
npm run lint
npm run build
```

`npm ci`는 `package-lock.json`과 정확히 맞는 의존성을 설치하므로 테스트와 빌드보다 먼저 실행한다. 빌드가 끝나기 전에 개발 서버를 동시에 시작하지 않는다.

별도 데이터베이스 초기화, 시드 적재, 계정 생성, 필수 환경 파일은 현재 없다. `next.config.js`가 `NEXT_PUBLIC_BASE_PATH=/math_assist`를 빌드에 제공하며 이 값은 정적 자산과 JSON의 공개 경로 접두사다.

## 개발

```bash
npm run dev
```

기본 개발 서버는 `http://localhost:3000`에서 실행되고 앱 경로는 `http://localhost:3000/math_assist` 아래에 있다. 개발 서버를 종료한 뒤 프로덕션 빌드를 실행한다.

## 검증 순서

제품 코드나 콘텐츠를 바꾼 경우 영향 범위의 집중 테스트를 먼저 실행한 뒤 다음을 수행한다.

```bash
npm run lint
npm test
npm run tdd:guard
npm run validate:templates
npm run validate:grade1
npm run validate:grade2
npm run validate:grade3
npm run audit:missions
npm run audit:problems
npm run build
npm run test:e2e
git diff --check
```

- 특정 학년이나 5학년 템플릿을 건드리지 않았다면 관련 콘텐츠 검증기는 생략할 수 있지만, 변경한 콘텐츠의 검증기는 반드시 실행한다.
- 화면·라우팅·localStorage 복구·공개 시점을 바꾼 경우 브라우저 테스트를 생략하지 않는다.
- Playwright는 기본적으로 3100 포트를 사용한다. 다른 서버와 충돌하면 `PLAYWRIGHT_PORT=3173 npm run test:e2e`처럼 빈 포트를 지정한다.
- `npm run build`는 `out/`에 GitHub Pages용 정적 결과를 만든다. 빌드 중 69개보다 경로 수가 달라질 수 있으므로 수치 자체보다 의도한 동적 식별자가 모두 생성됐는지 확인한다.

문제 품질의 선택적 외부 평가를 실행하려면 다음을 사용한다.

```bash
npm run promptfoo:problems
```

이 명령은 기본 출시 게이트가 아니며 생성·채점의 권한을 AI에 넘기지 않는다. 결과는 품질 검토 자료일 뿐 정답 판정 자료가 아니다.

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
