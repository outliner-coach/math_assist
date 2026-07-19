# 풀이장 모바일·태블릿 터치 안정화 핸드오프

Status: resolved and verified on the user's iPad

## What changed

- 풀이장 전체에서 브라우저 텍스트 선택을 막고 캔버스의 길게 누르기
  컨텍스트 메뉴와 오버스크롤 개입을 차단했다.
- 한 번에 하나의 포인터만 활성 선 입력으로 추적하도록 바꿔 다른 손가락이나
  마우스 보조 버튼의 이벤트가 현재 선에 섞이지 않게 했다.
- 선을 그리고 있는 동안 펜, 지우개, 전체 지우기 버튼을 잠가 손바닥이나 두 번째
  손가락으로 도구가 우발적으로 실행되지 않게 했다.
- `ScratchPad.test.ts`에 선택 방지 스타일과 단일 포인터 규칙 회귀 테스트를 추가했다.
- iPadOS WebKit 후속 대응으로 펜·터치는 브라우저의 암시적 포인터 캡처를 사용하고,
  명시적 캡처 실패나 조기 `lostpointercapture`가 스트로크를 중단하지 않게 했다.
- 짧은 Apple Pencil 입력도 보이도록 누르는 순간 시작점을 그리고, 빠른 이동에서는
  coalesced pointer events를 순서대로 렌더링한다.
- iPadOS에서 실패한 펜 입력이 아래 `단계 힌트` 텍스트 선택으로 이어지는 실기기
  증상에 맞춰 연습 화면 전체의 WebKit 텍스트 선택과 터치 콜아웃을 차단했다.
- 캔버스에는 non-passive native pointer/touch 리스너를 캡처 단계로 추가해 React
  이벤트보다 먼저 브라우저의 선택 제스처 기본 동작을 취소한다.

## What is still risky

- 실제 iPadOS Safari와 Android 기기별 팜 리젝션은 브라우저와 스타일러스가 보내는
  Pointer Events 품질에도 영향을 받는다. 앱은 두 번째 포인터와 조기 캡처 해제를
  방어하지만 운영체제 수준의 팜 리젝션을 대신할 수는 없다.
- 화면 방향이나 캔버스 크기가 바뀌면 기존 정책대로 풀이 내용이 초기화된다.
- 향후 연습 화면에 선택 가능한 텍스트 영역을 별도로 추가하면 iPadOS 회귀가 생길 수
  있으므로 `practice-interaction-surface` 계약을 함께 확인해야 한다.

## What the next agent should do

- 풀이장 입력을 바꿀 때 활성 `pointerId` 격리와 그리는 동안의 도구 잠금을 유지한다.
- 390x844 모바일과 1024x768 태블릿 뷰에서 선 입력, 지우개, 전체 지우기, 페이지
  스크롤을 다시 확인한다.
- iPadOS 관련 변경 전 `docs/scratch-pad-ipados-lessons-learned.md`의 구현 계약과
  회귀 검증 체크리스트를 따른다.
