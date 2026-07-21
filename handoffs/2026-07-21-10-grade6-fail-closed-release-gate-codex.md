# 6학년 fail-closed 출시 게이트 인계

> 2026-07-21 후속: 아래 차단 사유는 승인된 콘텐츠·표현·복구·접근성 작업으로 해소됐다. 원장 오류 시 fail-closed 계약은 유지되며 현재 근거는 `2026-07-21-12-grade5-grade6-approved-release-codex.md`를 따른다.

## 결론

`unit-6-1-ratio`, `g6ratio-001`, 30개 template과 Grade 6 전용 저장 코드는 release-candidate로 보존한다. `docs/tracking/findings.md`의 P1 콘텐츠·표현·접근성 문제가 남아 있으므로 공개 원장 `releaseState.grade6`는 `release-candidate`이며 홈에도 6학년을 노출하지 않는다.

## 현재 차단 계약

- `/grade/6`, `/unit/unit-6-1-ratio`, `/concept/g6ratio-001`, 표준·retry `/practice/g6ratio-001`, `/result?grade=6`를 모두 같은 준비 중 화면으로 닫는다.
- 원장을 읽을 수 없거나 schema·상태가 잘못됐거나 상태가 정확히 `released`가 아니어도 닫는다.
- 차단 판단은 session·result·progress·receipt repository 접근보다 먼저 한다. candidate 경로는 기존 Grade 5/6 저장을 읽어 노출하거나 생성·갱신·삭제하지 않는다.
- Grade 5 경로와 저장 계약은 이 gate의 영향을 받지 않는다.

## 검증 증거

- 최신 fail-closed 집중 단위·컴포넌트 게이트 36/36 통과.
- Chromium E2E 3/3 통과: 직접 경로 6개 차단·저장 무변경, Grade 5 비간섭, 390×844·1024×768 overflow 없음과 48px 홈 행동.
- 최종 통합 gate에서 전체 Vitest 59개 파일 370/370, lint, TDD guard, 관련 validator·audit, 75개 정적 경로 build, 전체 E2E 32/32가 통과했다. Grade 6 gate E2E는 이 중 3/3이며 공개 차단과 저장 무변경을 확인한다.

## 해제 순서

1. A/B/C의 실질적 문제군 차이, 실제 표 표현, `[6수02-02/03/04]` 배정, 어린이 문장, 손상 저장 recovery UI, 48px 터치·두 viewport finding을 모두 닫는다.
2. 독립 콘텐츠 검토와 관련 validator·audit·단위·E2E를 다시 통과한다.
3. 홈과 공통 projection에 Grade 6를 안전하게 연결하고 hidden/exposed ledger gate를 통과시킨다.
4. 마지막에만 원장 상태를 `released`로 바꾸고 전체 build·E2E와 실제 배포 hydration을 확인한다.

정적 파일이나 자동 분포 validator가 존재한다는 이유만으로 gate를 우회하거나 `released`로 승격하면 안 된다.
