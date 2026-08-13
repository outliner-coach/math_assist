# 5학년 반올림·올림과 버림 응용문제 보강 재개 인수인계

## 목표와 범위

2026-07-21에 중단된 전 학년 응용문제 보강 흐름을 현재 `main`에서
재개했다. 첫 구현 단위는 품질 감사에서 K30/A0/R0, 문제군 2개로 나타난
5학년 `rounding-001`과 `estimate-001`이다. 다른 개념, 학년별 진도,
화면, 저장 형식, 배포 파일은 변경하지 않는다.

## 구현 결과

- 두 개념의 30개 템플릿을 각각 A/B/C 각 10개, 난이도 4/4/2로 유지했다.
- 두 개념 모두 각 세트는 K4/A4/R2이며 전체는 K12/A12/R6이다.
- 개념마다 의미가 다른 문제군 10개와 추론 문제군 2개를 사용한다.
- 직접 계산, 반올림 경계, 맥락의 합·차, 가능한 원래 수의 양 끝,
  범위의 체계적 확인, 두 반올림 방법 비교를 포함한다.
- `scripts/generate-grade5-rounding-templates.js`가 30문항을 결정적으로
  생성하며 테스트가 공개 JSON과 완전 일치를 강제한다.
- `scripts/generate-grade5-estimate-templates.js`도 올림·버림 30문항과
  공개 JSON의 완전 일치를 강제한다.
- 중앙 청사진 검토표 `scripts/migrate-grade5-blueprints.js`도 같은 10개
  문제군과 K/A/R 의미를 소유한다.

## 변경 파일

- `public/data/templates/rounding.json`
- `public/data/templates/estimate.json`
- `scripts/generate-grade5-rounding-templates.js`
- `scripts/generate-grade5-estimate-templates.js`
- `scripts/migrate-grade5-blueprints.js`
- `src/lib/grade5-blueprint-metadata.test.ts`
- `package.json`
- `workstreams/_shared/README.md`
- `docs/engineering-notes.md`
- `docs/problem-blueprint-migration.md`
- `docs/tracking/status.md`

## 검증 상태

완료:

```text
npm run generate:grade5-rounding
npm run generate:grade5-estimate
npm run migrate:grade5-blueprints -- --check
npx vitest run \
  src/lib/grade5-blueprint-metadata.test.ts \
  src/lib/grade5-generator-regression.test.ts \
  src/lib/problem-quality-audit.test.ts
npm run validate:templates
npm run audit:problems
git diff --check
```

집중 테스트는 41/41, 템플릿 metadata는 690/690, 문제 감사 오류는 0이다.
전체 경고는 55개에서 49개로 줄었으며 두 개념의 커버리지·난이도
경고는 0이다.

최종 회귀도 완료했다.

```text
npm run lint                       통과
npm test                           61 files, 392/392 통과
npm run tdd:guard                  통과
npm run build                      정적 페이지 75/75 통과
```

화면·경로·저장·정답 공개 시점은 바뀌지 않았으므로 E2E는 실행하지 않았다.

## 다음 작업

다음 개념은 `mixedcalc-001`을 권장한다. 현재 문제군은 10개지만
K30/A0/R0이므로 기존 연산 순서 계산을 reasoning으로 이름만 바꾸지 말고
상황 모델링, 잘못된 계산 순서의 첫 오류, 두 식의 방법 비교, 조건을
만족하는 식 구성처럼 실제 사고 구조가 다른 문항을 추가해야 한다.

사용자가 2026-07-25 커밋·푸시를 승인했다. 이 문서를 포함한 변경은
`main`에 게시하고, 실제 커밋과 GitHub Pages 실행 결과는 Git 기록과 원격
실행 기록으로 확인한다. 기존 `.vscode`,
`e2e/screenshots`, 루트 스크린샷 두 장은 사용자 파일이므로 계속
제외한다.
