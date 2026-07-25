# 6학년 분수와 소수의 관계 공개 인계

기준일: 2026-07-26

## 공개 범위

- 단원: `unit-6-1-fraction-decimal-relations`
- 개념: `g6fractiondecimal-001`
- 성취기준: `[6수01-12]`
- 문제은행: `public/data/templates/g6fractiondecimal.json`
- 재현 생성기: `scripts/generate-grade6-fraction-decimal-templates.js`
- 시도 기록 버전: `grade6-fraction-decimal-v1`

## 콘텐츠 계약

- A/B/C 각 10문항, 각 세트 difficulty 4/4/2와 K/A/R 4/4/2다.
- 30개 문제군은 세트 사이에 겹치지 않는다.
- 분수↔소수 직접 변환뿐 아니라 동치분수의 빠진 분자, 실제 양의 합과
  남은 양, 중간값, 정확한 크기 차, 분모·분자 비교 오류 분석을 다룬다.
- 모든 소수와 분수는 prompt·solver·풀이가 공유하는 정수 비에서
  파생한다. 비교 차는 모든 허용 매개변수에서 0 이상이다.
- 답은 기존 규칙 기반 정규화와 채점만 사용하며 AI·캐릭터·보상 상태가
  판정을 바꾸지 않는다.

## 생성·품질 계약

- `npm run generate:grade6-fraction-decimal`은 커밋된 JSON을 바이트
  단위로 재현한다.
- 집중 테스트는 모든 허용 `p` 값을 순회해 문장·풀이·힌트의 미평가
  식이 없고 답이 정수·유한소수·기약분수 형식인지 확인한다.
- 소수→분수 문항의 숨은 피연산자 예외는 `[6수01-12]`, 렌더된 소수,
  분수 출력 요구가 함께 있을 때만 허용한다.
- 새 개념의 release ID를 resolver에 빠뜨리면 receipt 생성 전에
  알 수 없는 6학년 개념 오류로 닫힌다.

## 화면 계약

- 5문제 완주 뒤 Grade 6 진도와
  `grade6-fraction-decimal-v1` receipt 5개만 저장하며 Grade 5 키는
  건드리지 않는다.
- 390px의 3열 버튼은 접근성 이름을 보존한 채 `세트 A`/`5문제`처럼
  의미 있는 두 줄로 표시한다. 12개 줄의 `nowrap`과 실제 버튼 내부
  수용 너비를 390×844·1024×768에서 검사한다.
- 개념·연습 행동과 동반자의 실제 교차 면적은 0이어야 하며 제출 전
  정답 전용 값은 DOM과 접근성 트리에 없어야 한다.

## 검증

- 전체 Vitest 64개 파일 484/484
- lint와 TDD guard 통과
- Grade 6 validator: 3단원, 3개념, 90문항
- curriculum validator: 92개 기준, 현재 참조 66개
- template blueprint: 750/750
- problem/mission audit: 오류 0, 경고 0
- 정적 build: 81/81
- Grade 6 E2E: 7/7
- 단일 작업자 전체 E2E: 55/55
- GitHub Pages 실행 `30178519234` 성공과 390px 공개 개념·연습
  hydration, 정답 선노출·가로 넘침·동반자 겹침·콘솔 오류 0 확인

## 다음 단원

원장 순서상 `[6수01-14]`·`[6수01-15]` 소수의 나눗셈을 다음 독립
단원으로 승격한다. 같은 30문항·세트 분포·release ID·전수 생성·
전체 회귀·실배포 게이트를 반복한다.
