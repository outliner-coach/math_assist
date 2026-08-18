# 3학년 전 단원 응용문제 출시 후보 검수

## 현재 상태

- 승인 상태: `pending`
- 출시 상태: 12개 pack과 48개 family 모두 `draft`
- 소유자 검수: `pending`
- 교사·교육과정 전문가 검수: `not-reviewed`
- 3학년 production registry·release ledger: 존재하지 않음
- 공개 rollout: `releasedThroughGrade: 2`, `buildingGrade: 3` 유지

이 문서는 3학년 후보의 자동 검증 결과를 정리한 승인 전 자료다. 프로젝트
책임자의 승인을 기록하지 않으며, 3학년 후보의 `main` 반영·원격 push·GitHub
Pages 배포를 허가하거나 의미하지 않는다.

## 후보 범위

| 학기 | 단원 | 핵심 개념 | 후보 family 수 |
|---|---|---|---:|
| 3-1 | `g3-1-add-sub` | 덧셈과 뺄셈 | 4 |
| 3-1 | `g3-1-lines` | 선의 종류와 각 | 4 |
| 3-1 | `g3-1-division` | 나눗셈의 뜻 | 4 |
| 3-1 | `g3-1-multiply` | 곱셈 | 4 |
| 3-1 | `g3-1-length-time` | 길이와 시간 | 4 |
| 3-1 | `g3-1-fraction-decimal` | 분수와 소수 | 4 |
| 3-2 | `g3-2-multiply` | 곱셈 | 4 |
| 3-2 | `g3-2-division` | 몫과 나머지 | 4 |
| 3-2 | `g3-2-circle` | 원 | 4 |
| 3-2 | `g3-2-fraction` | 분수 | 4 |
| 3-2 | `g3-2-capacity-weight` | 들이와 무게 | 4 |
| 3-2 | `g3-2-graph` | 막대그래프 | 4 |

각 단원은 기존 120개 Grade 3 K/A/R 은행에서 파생한 정본 개념 ID와 필수
표현을 정확히 사용한다. 단원마다 applying family 1개와 서로 다른 추론 구조의
reasoning family 3개를 두었고, family마다 대표·경계를 포함한 유한 변형 3개를
전수 검사한다. 따라서 검수 범위는 48개 family, 144개 결정적 변형이다.

## 학습 흐름 경계

- 3학년 연습은 계속 `knowing → applying → reasoning` 3문제다.
- 후보 응용문제는 applying 또는 reasoning 한 자리만 대체하고 knowing은
  대체하지 않는다.
- 교체 뒤에도 기존 미션 ID, 인지영역 순서, reward ID, 완료·복습 판정과
  `mathAssist_grade3Progress` 의미가 그대로 유지된다.
- 네 family는 seed에 따라 결정적으로 순환한다.
- 생성기, 독립 오라클, 필수 시각, 제출 전 비노출, proof 중 하나라도 실패하면
  3문제 전체 후보 세션을 `blocked`로 돌려주며 저장을 시도하지 않는다.
- 현재 후보는 review-only 카탈로그에만 연결되어 실제 3학년 학습자 경로에는
  들어가지 않는다.

## 자동 검수 근거

각 family의 대표·경계 사례에서 다음을 실제 실행한다.

- 같은 좌표의 결정적 재생성
- 별도 구현의 정답·풀이 검산
- 문제 수와 단위 관계에서 다시 만든 정량 시각 검증
- 제출 전 정답 전용 라벨과 접근성 이름 비노출
- 144개 변형의 유한 영역 전수 증명
- pack·family·단원·인지영역·버전 스냅샷 일치
- 손상된 문제·정답·풀이·시각 쌍의 fail-closed 회귀

2026-08-18 현재 확인 결과는 다음과 같다.

- Grade 3 validator: 120개 기존 원본 유지
- application candidate validator: 62개 대상 단원, 오류 0
- application candidate audit: 오류 0
- Grade 3 콘텐츠·배치 집중 Vitest: 22/22
- 전체 Vitest: 117개 파일, 1,244/1,244 통과
- Promptfoo 문제 품질 평가: 1,483/1,483
- lint: 경고·오류 0
- 정적 build: 114/114 페이지
- 390×844·1024×768 읽기 전용 브라우저 검수: 6/6 통과
- 전체 Playwright 회귀: 99/99 통과

## 승인 시 확인할 결정

승인한다면 다음 단계에서 이 문서의 12개 pack과 48개 family의 정확한
`familyId@version`만 owner-approved 상태로 바꾸고, 별도의 3학년 production
registry와 불변 release ledger를 만든다. 그 뒤에만 실제 3문제 연습 경로 연결,
`main` 반영, GitHub Pages 배포와 공개 화면 확인을 수행한다. 승인 전에는 후보를
학습자에게 노출하거나 배포하지 않는다.
