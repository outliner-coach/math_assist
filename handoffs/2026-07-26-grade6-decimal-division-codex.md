# 6학년 소수의 나눗셈 공개 인계

기준일: 2026-07-26

## 공개 범위

- 단원: `unit-6-1-decimal-division`
- 개념: `g6decimaldiv-001`
- 성취기준: `[6수01-14]`, `[6수01-15]`
- 문제은행: `public/data/templates/g6decimaldiv.json`
- 재현 생성기: `scripts/generate-grade6-decimal-division-templates.js`
- 시도 기록 버전: `grade6-decimal-division-v1`

## 콘텐츠 계약

- A/B/C 각 10문항, 각 세트 difficulty 4/4/2와 K/A/R 4/4/2다.
- 30개 문제군은 세트 사이에 겹치지 않는다.
- 자연수 몫의 소수 표현, 소수÷자연수, 소수÷소수, 같은 크기 묶음 수,
  한 단위 양, 나누기 전 전체·나누는 수 역산, 사용 후 재분배, 잘못된
  소수점 이동과 몫의 크기 분석을 다룬다.
- prompt·solver·풀이가 같은 정수 tenths 또는 hundredths 모델을
  공유한다. 답은 정수 또는 유한소수이며 암묵적 반올림은 없다.
- 답은 기존 규칙 기반 정규화와 채점만 사용하며 AI·캐릭터·보상 상태가
  판정을 바꾸지 않는다.

## 생성·검증 계약

- `npm run generate:grade6-decimal-division`은 커밋된 JSON을 바이트
  단위로 재현한다.
- 집중 테스트는 모든 허용 `p` 값을 순회해 미평가 식과 반복소수·
  부동소수점 찌꺼기가 없는지 확인한다.
- `[6수01-15]` 문제는 `[6수01-14]`를 연결 기준으로 명시한다. 두
  기준은 원장에서 같은 개념을 주 콘텐츠로 참조한다.
- concept별 release ID resolver를 빠뜨리면 receipt 생성 전에
  알 수 없는 6학년 개념 오류로 닫힌다.

## 화면·저장 계약

- 5문제 완주 뒤 Grade 6 진도와 `grade6-decimal-division-v1`
  receipt 5개만 저장하며 Grade 5 키는 건드리지 않는다.
- 개념 화면은 6개 선택 버튼과 의미 단위 줄바꿈을 유지한다. 개념·
  연습 행동과 동반자의 실제 교차 면적은 0이어야 한다.
- 제출 전 정답 전용 값은 DOM과 접근성 트리에 없어야 하며 390×844와
  1024×768에서 가로 넘침이 없어야 한다.

## 검증

- 전체 Vitest 64개 파일 490/490
- lint와 TDD guard 통과
- Grade 6 validator: 4단원, 4개념, 120문항
- curriculum validator: 92개 기준, 현재 참조 68개
- template blueprint: 780/780
- problem/mission audit: 오류 0, 경고 0
- 정적 build: 84/84
- Grade 6 E2E: 8/8
- 단일 작업자 전체 E2E: 56/56
- GitHub Pages 실행 `30178896684` 성공과 390px 공개 개념·C세트
  5문제 hydration, 정답 선노출·가로 넘침·동반자 겹침·콘솔 오류 0 확인

## 다음 단원

원장 순서상 `[6수02-04]`·`[6수02-05]` 비례식과 비례배분을 다음 독립
단원으로 승격한다. 같은 30문항·세트 분포·release ID·전수 생성·
전체 회귀·실배포 게이트를 반복한다.
