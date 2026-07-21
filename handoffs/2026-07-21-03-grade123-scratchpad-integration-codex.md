# Phase 4B - 1·2·3학년 풀이장 실제 화면 연결

## 구현 결과

- Grade 1, 2, 3 미션 화면에 저장형 `ScratchPad`를 문제 카드와 같은 상호작용 표면으로 연결했다.
- `src/lib/mission-sketch-identity.ts`가 세 학년의 guest/session/item 키와 active/completed/expired 상태를 결정한다.
- 1·2학년 session은 기존 결정적 일일/replay seed, 3학년 session은 고정 콘텐츠 seed와 명시적 retry run을 사용한다.
- 명시적 retry run은 각 학년 progress의 선택적 `missionSketchRunOrdinal`로 영속화한다. 이전 저장본은 이 필드가 없어도 0으로 읽으며 완료·복습·보상 필드를 잃지 않는다.
- item은 mission ID와 구체 variant를 함께 써서 같은 session의 다른 문제 획이 섞이지 않는다.
- 정답 확인 직후 풀이장은 읽기 전용이 되고, 완료·만료 안내를 어린이에게 직접 보여 준다.
- 네 학년 화면 전체가 `practice-interaction-surface`를 사용해 iPad WebKit의 주변 텍스트 선택을 막고 input만 선택을 허용한다.

## 선택 이유와 피한 접근

- 화면 index만 item ID로 쓰면 콘텐츠 순서 변경이나 다른 학년에서 같은 풀이를 잘못 복구할 수 있어 mission ID와 variant를 함께 사용했다.
- 매 mission 선택마다 session을 바꾸면 A→B→A 이동에서 A 획을 복구할 수 없어, navigation은 같은 run을 유지하고 명시적 retry에서만 run을 바꾼다.
- 풀이장 저장 성공 여부를 채점·receipt·보상의 선행 조건으로 두지 않았다. 저장 공간 오류가 학습 판정을 바꾸면 안 된다.
- 저학년 전용 canvas 구현을 복제하지 않고 검증된 공통 ScratchPad를 그대로 사용해 WebKit 포인터 안전장치와 48px 터치 도구를 유지했다.

## 집중 검증

- 단위 15개: 세 학년 키의 reload 안정성, 문항·retry 격리, active/completed/expired 상태, WebKit 표면, 저장 복구를 확인했다.
- Chromium E2E 3개: Grade 1은 draw→reload→complete readonly→retry blank→draw→reload restore, Grade 2·3은 A draw→B blank/draw→A restore→reload restore→complete readonly→retry blank→draw→reload restore를 확인한다.
- 캔버스 픽셀과 `mathAssist_sketch_v1:` 문서 수를 함께 검사해 단순 DOM 렌더 성공으로 판단하지 않았다.
- 문항 키 전환 뒤 repository 응답을 일부러 지연한 집중 픽스처에서 직전 문항
  픽셀 재생 0, canvas 즉시 비활성, 복구 완료 뒤 편집 재활성화를 확인한다.
- lint, TDD guard, `git diff --check`가 통과했다.
- 전체 단위 실행은 이 변경 관련 테스트를 포함해 255개가 통과했고, 병렬 Phase 6의 미완성 Grade 4 다양성 테스트 1개만 실패했다(`grade4-problems.test.ts`: run 간 변경 prompt 기대 7개 이상, 실제 0개). Grade 4 소유 파일은 수정하지 않았다.
- 프로덕션 build는 Phase 6가 동시에 제품 파일을 수정 중인 상태에서 유효한 결과가 아니므로 실행하지 않았다. Phase 6 완료 뒤 전체 test와 build를 순차 재실행해야 한다.

## 유지보수 계약

- 공통 `LearningActivitySession.sessionId/itemId`가 모든 미션에 영속화되면 임시 seed/run 조합을 그 ID로 교체한다.
- retry 의미나 seed 생성 방식이 바뀌면 이전 문서와 새 문서의 충돌·복구 테스트를 먼저 갱신한다.
- `missionSketchRunOrdinal`은 풀이장 문서 격리와 1·2학년 기존 replay seed 복구에만 사용한다. 채점·receipt·경험치·보상 계산에 사용하지 않는다.
- 풀이장 문서에 답안·정답·receipt·캐릭터 상태를 추가하지 않는다. 원격 동기화에서도 획은 제외한다.
- 실제 iPad Safari/Chrome painted pixel 확인은 배포 전 수동 gate로 계속 남는다.
