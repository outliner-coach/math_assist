# Phase 4B/4C - 풀이장 컴포넌트와 ExperiencePreset 연결 계약

## 구현 범위

- `ScratchPad`가 제어형 `sketchDocument/onSketchDocumentChange` 또는
  `learnerId/sessionId/itemId/sessionStatus` 저장 키를 받는다.
- 저장형 모드는 mount 시 문제별 문서를 복구하고 획·지우개·clear·undo·redo를
  매 변경마다 저장한다. quota 실패는 화면에 알리고 완료·만료 활동은 편집을
  막는다.
- 포인터 시작점과 coalesced point는 0~1 좌표와 pressure로 보존한다. 캔버스
  크기 또는 DPR이 바뀌면 현재 문서를 새 크기로 replay한다.
- 기존 WebKit 계약인 native non-passive capture listener, 단일 pointerId,
  pen/touch implicit capture, mouse explicit capture, pointercancel/window 종료
  안전망과 practice surface 선택 차단은 유지했다.
- 도구는 48px 이상이며 펜·지우개·되돌리기·다시하기·전체 지우기를 노출한다.
- `resolveExperiencePreset(grade)`는 Grade 1-2 `play`, 3-4 `bridge`, 5-6
  `study`의 문제 수·캐릭터·보상·글 밀도 표현 계약만 반환한다. 반환 객체와
  공통 풀이 도구 배열은 동결되어 있다.

## PracticeClient 연결 계약

현재 `PracticeClient.tsx`는 다른 작업의 attempt receipt 변경과 겹치므로 이
슬라이스에서 수정하지 않았다. 기존 no-prop 호출은 컴파일과 입력 동작을
유지하지만 저장하지 않는 호환 모드다. 연결 담당자는 구체 문제마다 다음 네
prop을 반드시 제공해야 한다.

```tsx
<ScratchPad
  learnerId={null}
  sessionId={session.sessionId}
  itemId={`${currentProblem.index}:${currentProblem.templateId}`}
  sessionStatus="active"
/>
```

- `itemId`는 화면의 `currentIndex`만 쓰지 않는다. 위 조합은 현재 Grade 5
  snapshot에서 같은 세션의 구체 문제를 안정적으로 식별한다. 이후 공통
  `LearningActivityItem.itemId`가 연결되면 그 값을 그대로 넘긴다.
- route가 완료·만료 활동을 다시 보여줄 수 있으면 `sessionStatus`도 해당
  상태로 바꾼다. 이때 풀이장은 읽기 전용이다.
- 기본 저장소는 현재 세션 외 문서를 활성 가능성이 있는 것으로 보고 자동
  삭제하지 않는다. 앱 전체 활동 상태를 아는 상위 계층이 공유 repository를
  만들 때만 `isSessionActive` 판정 함수를 주입한다.
- 1·2·3학년 연결도 같은 네 prop 계약을 사용하며, 학년별 progress 배열
  index가 아니라 활동 snapshot의 안정적인 item identity를 사용한다.

## 테스트와 검증

- 집중 컴포넌트/프리셋 테스트: mount recovery, controlled mode, normalized
  coalesced points, pointercancel, eraser, clear undo/redo, quota, 완료 상태,
  resize reprojection, 48px와 toolbar 접근성을 검사한다.
- `npm test -- --run src/components/ScratchPad.test.ts
  src/components/ScratchPad.persistence.test.ts src/lib/sketch-document.test.ts
  src/lib/sketch-repository.test.ts src/lib/experience-preset.test.ts`: 28/28 통과.
- `npm test`: 215/215 통과.
- `npm run lint`, `npm run tdd:guard`, `npm run build`, `git diff --check` 통과.
  프로덕션 빌드는 정적 페이지 69개를 생성했다.
- route 연결과 1·2·3·5학년 E2E는 이 컴포넌트 슬라이스의 범위 밖이다.
  연결 후 문제 A/B 분리, 이전 문제 복귀, reload 복구, clear/undo, 실제 iPad
  painted pixels를 반드시 확인한다.
