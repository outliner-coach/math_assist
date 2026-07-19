# 풀이장 iPadOS 입력 안정화 레슨런

Date: 2026-07-19
Owner lane: `workstreams/03-ui-and-visuals`
Status: 실기기 해결 확인 및 GitHub Pages 배포 완료

## 목적

공용 연습 화면의 `ScratchPad`에서 iPadOS 펜·손가락 입력이 간헐적으로
무시되고 주변 UI 텍스트가 선택되던 문제의 조사 과정과 최종 계약을 기록한다.
풀이장, 서명 패드, 드로잉 캔버스처럼 WebKit에서 직접 입력을 받는 UI를 바꿀 때
이 문서를 먼저 확인한다.

## 사용자 증상

- Android 모바일 웹에서는 대체로 정상 동작했다.
- iPad의 Safari와 Chrome에서 약 5회 중 1~2회 펜 입력이 시작되지 않았다.
- 실패한 순간 캔버스 아래 `단계 힌트` 중 `단계` 텍스트가 선택됐다.
- 캔버스에서 그리기 시작할 때 도구 버튼이 흐려지는 상태 변화도 눈에 띄었다.

## 조사 타임라인

### 1. 캔버스 내부 선택과 다중 포인터 방어

커밋 `4ed1a7b`는 풀이장에 `user-select: none`, 컨텍스트 메뉴 차단,
단일 활성 `pointerId`, 입력 중 도구 잠금을 추가했다.

이 변경은 Android와 일반 모바일 뷰의 오작동을 줄였지만 iPadOS의 간헐적 입력
실패는 남았다. 캔버스 자체만 선택 불가여도 주변 형제 텍스트는 계속 선택 가능한
상태였기 때문이다.

### 2. 명시적 포인터 캡처 실패 방어

커밋 `8fb594b`는 다음을 보강했다.

- 펜·터치는 브라우저의 암시적 포인터 캡처를 사용한다.
- 명시적 `setPointerCapture()`는 마우스에만 사용하고 실패를 허용한다.
- `lostpointercapture`만으로 진행 중인 스트로크를 끝내지 않는다.
- 시작점을 즉시 그려 짧은 입력도 점으로 남긴다.
- coalesced pointer events를 순서대로 그려 빠른 펜 이동을 보존한다.
- 전역 `pointerup`·`pointercancel`을 종료 안전망으로 사용한다.

이 변경은 포인터 캡처 실패 경로를 해결했지만, 실기기에서 텍스트 선택 제스처로
빠지는 별도의 WebKit 기본 동작은 남아 있었다.

### 3. 주변 텍스트 선택이 실제 원인임을 확인

사용자가 실패 순간 `단계` 텍스트가 선택된다고 알려준 뒤 WebKit iPad 환경에서
배포본의 계산 스타일을 측정했다.

- 캔버스: `-webkit-user-select: none`
- `단계 힌트`: `-webkit-user-select: text`

WebKit이 캔버스 입력을 선택 제스처로 처리할 때, 선택 불가능한 캔버스 대신 가장
가까운 선택 가능한 형제 텍스트를 잡는 경로와 실기기 증상이 일치했다.

### 4. 최종 수정

커밋 `499f792`에서 다음 계약을 적용했다.

- `PracticeClient` 전체에 `practice-interaction-surface`를 적용한다.
- 이 영역과 모든 자손은 `-webkit-user-select: none`, `user-select: none`,
  `-webkit-touch-callout: none`을 사용한다.
- 숫자 입력을 위해 `input`과 `textarea`만 텍스트 선택을 다시 허용한다.
- 캔버스에 non-passive native `pointerdown`, `pointermove`, `touchstart`,
  `touchmove` 리스너를 캡처 단계로 등록한다.
- 취소 가능한 네이티브 이벤트의 기본 동작을 React 이벤트 처리보다 먼저 막는다.

사용자가 배포 후 iPad 실기기에서 문제 해결을 확인했다.

## 핵심 레슨런

### 캔버스만 `user-select: none`으로 만들면 충분하지 않다

직접 입력 표면의 형제나 조상 아래에 선택 가능한 텍스트가 남아 있으면 WebKit이
그 텍스트를 선택 대상으로 사용할 수 있다. 드로잉 UI는 입력 표면만이 아니라
상호작용 화면 전체의 선택 정책을 명시해야 한다.

### React 포인터 이벤트만으로 네이티브 제스처 차단을 가정하지 않는다

React `onPointerDown`과 `onPointerMove`의 `preventDefault()`가 있어도 실기기
WebKit의 선택·콜아웃 경로를 모두 차단했다고 가정하면 안 된다. 선택이 실제로
발생한다면 캔버스에 `{ capture: true, passive: false }` 네이티브 리스너를 두고
기본 동작을 조기에 취소한다.

### 포인터 캡처는 입력 시작의 필수 조건이 아니다

`setPointerCapture()`는 실패할 수 있다. 활성 포인터와 시작점을 먼저 저장하고,
포인터 캡처는 선택적 보조 기능으로 다룬다. 캡처 실패나 조기 해제가 스트로크
전체를 버리게 만들면 안 된다. 표준 동작은
[W3C Pointer Events](https://www.w3.org/TR/pointerevents3/)를 기준으로 한다.

### 실기기 관찰은 가장 가까운 DOM 증거까지 기록한다

“펜이 안 써진다”만으로는 포인터 캡처, 좌표 변환, 렌더링, 선택 제스처를 구분하기
어렵다. 이번 문제는 실패 순간 `단계`가 선택된다는 관찰이 결정적이었다. 다음에도
선택 표시, 스크롤 이동, 버튼 상태, 콘솔 오류처럼 동시에 보이는 현상을 함께
기록한다.

### 계산 스타일과 상태를 엔진별로 확인한다

클래스 문자열만 검사하지 말고 WebKit에서 `webkitUserSelect`, `touchAction`,
선택 문자열, 캔버스 픽셀을 확인한다. iPadOS 계열 문제는 Chromium 확인만으로
종료하지 않는다.

## 유지해야 할 구현 계약

- 한 번에 하나의 활성 `pointerId`만 그리기에 사용한다.
- 보조 포인터와 마우스 보조 버튼은 무시한다.
- 짧은 입력은 시작점으로 즉시 렌더링한다.
- 빠른 입력은 coalesced events를 사용한다.
- 도구 버튼은 스트로크 중 실행되지 않아야 하지만 시각적으로 깜빡이지 않는다.
- `practice-interaction-surface`의 WebKit 선택 차단을 제거하지 않는다.
- `input`과 `textarea`의 텍스트 선택 복원 규칙을 유지한다.
- 캔버스의 native pointer/touch 리스너는 non-passive capture 단계여야 한다.

## 회귀 검증 체크리스트

1. focused `ScratchPad.test.ts`를 실행한다.
2. 전체 테스트, 린트, 빌드, TDD 게이트를 통과한다.
3. 390x844 모바일과 1024x768 또는 iPad 크기에서 레이아웃을 확인한다.
4. 펜, 지우개, 전체 지우기와 짧은 점 입력을 확인한다.
5. 다중 포인터와 강제 `setPointerCapture()` 실패를 확인한다.
6. WebKit에서 `단계 힌트`의 `webkitUserSelect`가 `none`인지 확인한다.
7. `단계 힌트`를 드래그해도 `window.getSelection()`이 비어 있는지 확인한다.
8. 캔버스 `touchstart` 기본 동작이 취소되는지 확인한다.
9. GitHub Pages 성공 후 새 브라우저 컨텍스트에서 라이브 페이지를 다시 확인한다.
10. 마지막으로 실제 iPad에서 확인한다.

## 최종 검증 기록

- `npm test`: 30 files, 128 tests passed
- `npm run lint`: passed
- `npm run build`: passed
- `npm run tdd:guard`: passed
- WebKit 18.2 iPad Pro profile:
  - canvas `webkitUserSelect`: `none`
  - hint `webkitUserSelect`: `none`
  - synthetic cancelable `touchstart`: canceled
  - hint drag selection: empty string
  - drawing sample: 439 painted pixels
- GitHub Pages workflow: `29686123775`, success
- live commit: `499f792`
- user acceptance: iPad 실기기에서 해결 확인

## 관련 파일

- `src/components/ScratchPad.tsx`
- `src/components/ScratchPad.test.ts`
- `src/app/practice/[conceptId]/PracticeClient.tsx`
- `src/app/globals.css`
- `handoffs/2026-07-19-03-ui-and-visuals-codex.md`
