# 6학년 분수의 나눗셈 공개 인계

기준일: 2026-07-26

## 공개 범위

- 단원: `unit-6-1-fraction-division`
- 개념: `g6fractiondiv-001`
- 성취기준: `[6수01-10]`, `[6수01-11]`
- 문제은행: `public/data/templates/g6fractiondiv.json`
- 재현 생성기: `scripts/generate-grade6-fraction-division-templates.js`
- 시도 기록 버전: `grade6-fraction-division-v1`

## 콘텐츠 계약

- A/B/C 각 10문항, 각 세트 difficulty 4/4/2와 K/A/R 4/4/2다.
- 30개 문제군은 세트 사이에 겹치지 않는다.
- 자연수 몫의 분수 표현부터 분수÷자연수·분수÷분수, 묶음 수,
  역연산, 다단계 남은 양, 잘못된 역수·소거 방법 분석까지 다룬다.
- 답은 기존 규칙 기반 분수 정규화와 채점만 사용한다. 생성된 답은
  정수 또는 기약분수이며 AI·캐릭터·보상 상태가 판정을 바꾸지 않는다.

## 확장 구조

- `validate:grade6`은 더 이상 `g6ratio.json`을 직접 읽지 않는다.
  공개 Grade 6 unit과 concept에서 prefix 파일을 찾고 모든 bank를
  같은 계약으로 검사한다.
- 각 공개 성취기준은 원장에서 `released`와 `existing-reference`여야
  하고, 주 template과 `grade6:<conceptId>` 참조가 모두 있어야 한다.
- Grade 6 receipt는 concept별 release ID resolver를 사용한다. 새
  개념을 추가할 때 resolver 항목을 빼면 알 수 없는 개념 오류로 닫힌다.

## 발견한 UI 문제와 수정

- 기존 전역 마스코트는 390px에서 `C · 10문제`, 1024px에서 오른쪽
  5/10문제 버튼과 겹쳤다.
- 개념 화면의 고정 행동 영역에 모바일 48px, `md` 이상 320px 오른쪽
  안전 영역을 두고 Grade 6 두 줄 행동 영역만큼 문서 하단 여백을 늘렸다.
- E2E는 390×844·1024×768에서 실제 DOM 사각형 교차 면적 0을 검사한다.

## 검증

- 전체 Vitest 64개 파일 477/477
- lint와 TDD guard 통과
- Grade 6 validator: 2단원, 2개념, 60문항
- curriculum validator: 92개 기준, 현재 참조 65개
- template blueprint: 720/720
- problem/mission audit: 오류 0, 경고 0
- 정적 build: 78/78
- Grade 6 E2E: 6/6
- 단일 작업자 전체 E2E: 54/54

## 다음 단원

원장 순서상 `[6수01-12]` 분수와 소수의 관계를 다음 독립 단원으로
승격한다. 같은 30문항·세트 분포·release ID·전체 검증·실배포 게이트를
반복한다.
