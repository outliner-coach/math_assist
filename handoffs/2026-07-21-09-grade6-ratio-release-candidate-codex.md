# Phase 6C - Grade 6 비와 비율 release-candidate

> 2026-07-21 후속: 이 후보 상태와 아래 활성화 인계는 승인된 재설계·복구·통합 작업으로 완료됐다. 현재 근거는 `2026-07-21-12-grade5-grade6-approved-release-codex.md`를 따른다.

## 구현 결과

- `unit-6-1-ratio`와 `g6ratio-001`을 기존 Grade 5 정적 unit/concept/template 엔진에 추가했다.
- `g6ratio.json`은 A·B·C 각 10개, 난이도와 Knowing/Applying/Reasoning 각 4/4/2, 10개 problem family, reasoning family 2개, text/equation/table 3개 표현을 제공한다.
- 모든 템플릿은 공식 원장 `[6수02-02]`, `[6수02-03]`에 직접 추적되고 원장은 `released + existing-reference + grade6:g6ratio-001`로 승격했다. 전체 Grade 6 상태는 홈 활성화 전 `release-candidate`로 유지한다.
- `/grade/6` → `/unit/unit-6-1-ratio` → `/concept/g6ratio-001` → `/practice/g6ratio-001` 정적 경로와 5문제 기본·10문제 선택을 구현했다. 5문제 세션은 2/2/1, 10문제 세션은 4/4/2로 뽑는다.
- Grade 6는 `mathAssist_grade6Progress`, `mathAssist_grade6CurrentSession`, `mathAssist_grade6LastResult`를 사용한다. Grade 5의 기존 세 키와 legacy 10문제 snapshot 의미를 유지한다.
- Grade 6 session ID는 `grade6_session` 접두사라 공통 ScratchPad의 `sessionId + itemId` 문서가 Grade 5와 충돌하지 않는다. 화면은 `study` experience preset과 공통 저장형 ScratchPad를 사용한다.
- receipt는 `grade: 6`, `grade6-ratio-v1`을 기록하며 원답과 획을 저장하지 않는다.

## 저장 안전성 수정

- 통합 검토에서 Grade 5/6 progress가 손상되면 빈 map으로 읽은 뒤 다음 완료가 원문을 덮어쓸 수 있고, result/progress 중 하나만 저장돼도 session을 지울 수 있는 경로를 발견했다.
- session/result/progress 저장은 이제 기존 raw가 호환되는지 쓰기 시점마다 확인한다. 손상·비호환 raw는 그대로 보존하고 자동 save/clear를 거부하며 명시적 reset/clear만 해제한다.
- `persistCompletedPractice`가 result와 progress 저장 결과를 모두 확인한 뒤에만 활성 session을 삭제한다. 둘 중 하나라도 막히면 학습자가 다시 시도할 수 있도록 Grade 5/6 session을 유지한다.
- 정상 legacy Grade 5 session은 누락된 `grade`, `itemCount`, `checkedAnswers`를 각각 5, 10, 미확인 배열로 읽되 원문을 재작성하지 않는다. 정상 만료 session의 기존 종료 의미도 유지한다.

## 피한 접근과 이유

- Grade 6 진도를 `mathAssist_progress_v1`에 함께 넣지 않았다. 한 학년의 손상·초기화가 다른 학년을 손상할 수 있기 때문이다.
- 5문제를 10-template bank 축소로 구현하지 않았다. bank 배포 계약 A/B/C 10·4/4/2와 session 길이 5·2/2/1을 분리했다.
- `conceptId`와 curriculum code를 추정하지 않았다. 원장의 정확한 `[6수02-02]`, `[6수02-03]`만 blueprint와 release ref로 사용했다.
- `/home`, `src/lib/guest-home.ts`, 공통 projection은 수정하지 않았다. Phase 6D 전 `releaseState: released`로 올리면 현재 curriculum gate의 hidden-release 위반이므로 `release-candidate`를 유지한다.

## 검증 체크리스트

- `validate:grade6`: 1 unit, 1 concept, 30 templates, A/B/C 10, 5/10 생성 통과.
- `validate:curriculum`: 92개 공식 기준과 Grade 6 두 release ref 추적 통과.
- `validate:templates`, `audit:problems`: Grade 6 포함 자동 감사 오류 0.
- 집중 unit: 30개 분포·결정 채점·확인 전 DOM 답 선노출, Grade 5/6 storage 격리·손상 원문 보존·완료 저장 원자성, legacy Grade 5 복구를 확인한다.
- Chromium E2E 3개: 실제 경로 5문제 완료, 결과·진도·receipt·Grade 5 키 격리, 10문제 후 오답 retry count 유지, 손상 Grade 6 session 원문 보존을 확인했다.
- 전체 unit 365/365, lint, TDD guard, curriculum/Grade4/Grade6/template validator, mission/problem audit가 통과했다. Grade 6 Chromium E2E 3/3과 저학년 ScratchPad reload E2E 3/3도 통과했다.
- 프로덕션 build는 Next compile 성공 뒤 병행 Phase 5 파일 `src/lib/remote-progress.ts:209`의 `unknown` learnerId 타입 오류에서 중단됐다. Grade 6 소유 파일 오류는 아니며 해당 담당 수정 뒤 build를 다시 실행해야 한다.

## Phase 6D 활성화 인계

1. `src/lib/guest-home.ts`와 read-only projection에 Grade 6 전용 세 키를 추가하되 손상 raw를 절대 쓰지 않는다.
2. `/home`에서 Grade 6를 지원 학년으로 활성화하고 5문제 이어하기를 연결한다.
3. 홈 E2E와 실제 정적 산출물을 확인한 뒤 원장 `releaseState.grade6`를 `released`로 올린다. 순서를 바꾸면 `released_grade_hidden` 또는 `unreleased_grade_exposed`가 실패해야 한다.
4. 나머지 Grade 6 `planned` 기준과 unit은 구현·검증 전 노출하지 않는다.

## 유지보수 계약

- Grade 5의 `mathAssist_currentSession`, `mathAssist_lastResult`, `mathAssist_progress_v1` 이름과 legacy 10문제 기본 의미를 바꾸지 않는다.
- Grade 6 ID는 `unit-6-<semester>-<slug>`, `g6<topic>-<nnn>`, template 파일 `g6<topic>.json` 규칙을 유지한다.
- 새 Grade 6 concept도 A/B/C 각 10, 난이도·K/A/R 4/4/2, family 8+, reasoning family 2+, 표현 2+, 공식 원장 release ref를 모두 통과해야 한다.
- 손상 progress/session/result를 자동 덮어쓰기·삭제하는 fallback을 다시 만들지 않는다. 저장 결과 확인 전 활성 session을 지우지 않는다.
