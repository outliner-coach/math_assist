# 5학년 문제 청사진 M0–M2 handoff

> 2026-07-21 후속: 아래 9개 보류는 사용자 승인 뒤 의미 수정과 self-check를 거쳐 660/660으로 해소됐다. 현재 근거는 `2026-07-21-12-grade5-grade6-approved-release-codex.md`를 따른다.

작성일: 2026-07-21
주 작업영역: 01 콘텐츠·생성, 04 품질
상세 계약: `docs/problem-blueprint-migration.md`

## 결과

- 22개 개념 660개 템플릿 중 651개가 complete, 9개가 missing, invalid는 0이다.
- 기존 7개 시각·응용 개념 210개와 나머지 15개 개념 441개에 사람이 검토한
  `problem_family`와 `blueprint`를 명시했다.
- 숫자 범위와 A/B/C 표기만 다른 템플릿은 같은 문제군으로 묶었다.
- `difficulty`에서 인지영역이나 추론패턴을 추정하지 않았다.
- 생성 문제는 템플릿의 청사진을 보존하고, 도형 은행 재생성도 같은 검토
  매핑을 사용한다.

## 보류한 콘텐츠 결함

다음 슬롯은 문제 의미를 속이는 메타데이터를 붙이지 않고 missing으로 남겼다.

- `tmpl-fracmul-{A,B,C}-06`: “모두”라는 덧셈 문맥과 `fracMul` solver 충돌
- `tmpl-fracsub-{A,B,C}-06`: 남은 양에서 먹은 양을 빼는 문맥과 음수 양 가능성
- `tmpl-average-{A,B,C}-08`: 평균이 아닌 네 수의 합을 물어 개념·성취기준 불일치

사용자 승인 전 prompt, solver, 매개변수 범위를 수정하지 않는다. 콘텐츠 수정
시 세 세트의 같은 슬롯을 함께 바꾸고 생성 표본에서 문장·정답·풀이를 검증한다.

## 원인과 선택

기존 `difficulty`는 수치 범위와 계산 길이 신호일 뿐 사고 유형 계약이 아니었다.
이를 자동으로 knowing/applying/reasoning에 대응시키면 익숙한 역산·후처리를
reasoning으로 과장하고, 문제군 수를 문장 변형만큼 부풀리게 된다. 따라서
prompt, solver, 풀이, 시각을 슬롯별로 검토한 명시적 매핑을 단일 원천으로 뒀다.

시도하지 않은 방식은 다음과 같다.

- 난이도 3을 reasoning으로 간주해 K/A/R 목표를 맞추기
- A/B/C 또는 선택형/입력형 차이를 별도 문제군으로 세기
- 오류 문항 9개에 가까운 성취기준을 임시로 붙여 660/660으로 보고하기

이 방식들은 감사 수치는 좋아 보이게 하지만 실제 콘텐츠 공백을 숨기므로
채택하지 않았다.

## 검증 계약

```bash
npm run migrate:grade5-blueprints -- --check
npx vitest run src/lib/grade5-blueprint-metadata.test.ts \
  src/lib/problem-quality-audit.test.ts src/lib/problem-generator.test.ts
npm run validate:templates
npm run audit:problems
npm run lint
npm test
npm run tdd:guard
npm run build
```

기대 기준:

- migration pending 0
- blueprint 651/660 complete, 9 missing, 0 invalid
- 일반 audit errors 0
- strict warnings는 콘텐츠 포트폴리오 공백 때문에 실패해야 한다.
- 보류 9개 외 템플릿은 `blueprint === getReviewedBlueprint(template)`이다.

## 유지보수 계약

- 문제군·인지영역·추론패턴은 `scripts/migrate-grade5-blueprints.js`의 검토
  매핑에서 바꾸고 migration을 실행한다. JSON만 직접 고치지 않는다.
- `problem_family`와 `blueprint.problemFamily`는 항상 같아야 한다.
- 시각 템플릿은 `visualSemantics`를 명시하고 시각 자체 semantics와 맞춘다.
- 개념별 문제군 8개, reasoning 문제군 2개, K/A/R 목표 미달은 현재 콘텐츠의
  정직한 경고다. 분류 변경으로 지우지 말고 새 문제 유형을 설계해 해소한다.
- 보류 9개가 수정되기 전에는 missing을 validator 오류로 승격하지 않는다.
