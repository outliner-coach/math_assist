# 외부 사용 계약

## 공통 접근 방식

배포본의 공개 기준 경로는 `/math_assist`다. 모든 공개 인터페이스는 인증이 필요 없는 정적 HTML·JavaScript·JSON이며 서버 API는 없다. 존재하지 않는 경로나 정적 식별자는 GitHub Pages의 404로 끝난다. 브라우저 저장이 차단되어도 공개 콘텐츠는 열 수 있어야 하지만 이어하기는 보장되지 않는다.

아래 표는 2026-08-14 **현재 배포 계약**이다. 2·5·6학년 응용문제
V1 9유형은 커밋 `1a91b9a`의 GitHub Pages 배포에 포함되어 있다.
원장이 없거나 학년 상태가 정확히 `released`가 아니면 해당 경로를
열지 않는다.

## 학습 화면

| 경로 | 입력 | 정상 결과 | 오류·대체 결과 |
|---|---|---|---|
| `/` | 없음 | 제품 소개와 `/home`으로 가는 한 가지 주요 행동 | 정적 자산 실패 시 화면이 완성되지 않음 |
| `/home` | 선택 학년과 기존 localStorage 기록 | 1·2·3·4·5·6학년 선택, 기본·연습 두 열린 선택, 추천 이어하기, 연습 완료 단위 수, 기기 저장 안내 | 손상된 학년 기록은 그 학년 기본 상태로 요약; 다른 학년 기록은 유지 |
| `/grade/1?islandId=<id>&mode=basic\|practice` | 1학년 진행 기록과 선택적 섬·모드 | 전체 지도는 유지하면서 요청한 섬의 기본 7문제 또는 연습 7문제에서 시작 | 알 수 없는 섬은 전체 지도의 안전한 추천 미션, 알 수 없는 모드는 기본 사용; 저장 불가 시 지속 저장 불가를 알림 |
| `/grade/2` | 2학년 진행 기록 | 2학년 단원 선택 | 기록의 단원이 유효하지 않으면 유효한 기본 단원 사용 |
| `/grade/2/mission?unitId=<id>&mode=basic\|practice` | 선택적 2학년 단원·모드 | 해당 단원의 기본 6문제 또는 연습 6문제 | 없거나 알 수 없는 단원은 첫 단원, 알 수 없는 모드는 기본 사용 |
| `/grade/3` | 3학년 진행 기록 | 3학년 단원 선택 | 기록의 단원이 유효하지 않으면 유효한 기본 단원 사용 |
| `/grade/3/mission?unitId=<id>&mode=basic\|practice` | 선택적 3학년 단원·모드 | 10문제 K/A/R 은행에서 해당 단원의 기본 3문제 또는 연습 3문제 | 없거나 알 수 없는 단원은 첫 단원, 알 수 없는 모드는 기본 사용 |
| `/grade/4` | 4학년 진행 기록 | 검증된 큰 수·두 자리 수로 나누기·사칙계산 어림·소수·분수·소수 계산·규칙·등호·수직과 평행·도형의 이동·삼각형 Bridge 단원 선택 | 손상 기록은 원문을 보존한 채 빈 요약과 명시적 초기화 안내 |
| `/grade/4/mission?unitId=<id>&mode=basic\|practice` | 선택적 4학년 단원·모드 | 선택 단원의 알기·적용·추론 각 1개인 기본 또는 연습 3문제 활동 | 없거나 알 수 없는 단원은 안전한 첫 단원인 큰 수, 알 수 없는 모드는 기본 사용 |
| `/grade/5` | 정적 단원 데이터와 5학년 진도 | 5학년 단원 선택 | 단원 JSON 로드 실패 시 정상 목록을 제공하지 못함 |
| `/grade/6` | 공개 curriculum ledger의 `releaseState.grade6` | 현재 `released`인 11개 Study 단원 선택 | 원장 로드·schema·상태 오류는 준비 중으로 닫고 저장을 변경하지 않음 |
| `/unit/<unitId>` | 빌드 시 알려진 단원 식별자와 공개 release state | 공개 학년의 단원 설명과 개념 목록 | 빌드에 없는 식별자는 404; Grade 6 원장 오류는 저장 접근 전 준비 중으로 차단 |
| `/concept/<conceptId>` | 빌드 시 알려진 개념 식별자와 공개 release state | 공개 학년의 설명·예시·실수·연습 시작 | 빌드에 없는 식별자는 404; Grade 6 원장 오류는 저장 접근 전 준비 중으로 차단 |
| `/practice/<conceptId>?set=A|B|C&count=5|10` | 5·6학년 개념, 선택적 세트와 문항 수; 잘못된 세트는 A, count 생략 시 기존 5학년은 10·6학년은 5 | 새 기본 5문제·집중 10문제 세션 또는 같은 요청의 유효한 기존 세션 | 개념·템플릿이 없거나 로드 실패하면 문제를 불러올 수 없음 안내; 완성되지 않은 숫자 형식은 답을 잠그지 않고 형식 안내 |
| `/practice/<conceptId>?set=<set>&mode=retry-wrong&source=<sessionId>` | 직전 결과와 일치하는 개념·세트·결과 식별자 | 직전 오답만 포함한 복습 세션 | 결과가 없거나 일치하지 않거나 오답이 없으면 세션을 만들지 않고 안내 |
| `/result` | `mathAssist_lastResult` | 점수, 오답 우선 풀이, 재도전 또는 새 세트 행동 | 결과가 없거나 손상되면 결과 없음과 홈 이동 제공 |
| `/result?grade=6` | 공개 release state와 `mathAssist_grade6LastResult` | 현재 `released`인 Grade 6 결과와 재도전 제공 | 손상 결과는 원문을 보존하고 명시적 Grade 6 초기화 UI를 제공; 원장 오류에서는 결과를 읽거나 retry session을 만들지 않음 |
| `/review/problems` | 정적 문제 은행 | 내부 검수용 문제·난이도·보기·정답 보드 | 학습자 홈과 랜딩에는 이 경로를 노출하지 않음 |
| `/review/application-problems` | 승인 registry와 고정 대표 시드 | 2·5·6학년 V1 9유형의 문제·정답·풀이·힌트·제출 전후 시각·자동 근거 및 등록값 기반 필터 | 읽기 전용이며 승인·저장·출시 행동과 학습자 동선을 제공하지 않음 |

## 공개 JSON

| 경로 | 입력 | 출력 | 오류 |
|---|---|---|---|
| `/data/units.json` | 없음 | `id`, `grade`, `semester`, `order`, 제목을 가진 단원 배열 | 비정상 응답이면 단원 로더가 예외를 반환 |
| `/data/concepts.json` | 없음 | 단원 연결, 설명, 예시, 실수, 순서를 가진 개념 배열 | 비정상 응답이면 개념 로더가 예외를 반환 |
| `/data/templates/<prefix>.json` | 개념 식별자의 첫 `-` 앞부분과 같은 파일 접두사 | 같은 `concept_id`를 가진 문제 템플릿 배열 | 파일 없음·비정상 응답·파싱 실패는 빈 템플릿 목록으로 처리 |
| `/data/curriculum-allocations-v1.json` | 없음 | 공식 성취기준 121개의 학년 배정, 문제별 직접·복습 참조와 학년별 `releaseState` | 원장 부재·비정상 JSON·알 수 없는 상태는 gated 학년을 열지 않고 fail-closed |
| `/data/application-problems/packs/<pack>.json` | 승인된 응용문제 묶음 식별자 | 단원 지식, 유형 계약, 승인 근거와 선택적 정적 문제 모음 | parser·참조·승인·출시 원장 검증 중 하나라도 실패하면 해당 유형을 신규 후보로 사용하지 않음 |

템플릿 소비자는 `type`이 `choice`면 네 보기와 정답 보기 위치를, `number`면 정규화 가능한 `solver_rule` 결과를 기대한다. 모든 템플릿은 A·B·C 세트, 난이도 1·2·3, 매개변수 범위, 문제 문장, 정답 규칙, 풀이 단계를 제공해야 한다. 템플릿 산술은 등록 함수 치환 뒤 제한된 유한 십진수·괄호·사칙연산·단항 부호 parser만 사용하며 `eval`, 식별자, 지수, 비유한 수, 0 나눗셈을 허용하지 않는다.

5·6학년 템플릿 metadata는 1,110/1,110이며 각 개념의 A·B·C는
10문제, 난이도·K/A/R 4/4/2, reasoning family 2개 이상, 실제 표현과
blueprint 일치를 유지한다. 구조 검증과 함께 교육과정·어린이 문장·
브라우저 검토를 통과한 범위만 원장에서 `released`로 승격한다.

## 브라우저 저장 이름

| 이름 | 소비자에게 보장하는 내용 | 손상·만료 처리 |
|---|---|---|
| `mathAssist_guestHome_v1` | 명시적으로 고른 `activeGrade`만 저장 | 잘못된 값은 선택 없음으로 처리 |
| `mathAssist_grade1Progress` | schema v3. 기존 완료·복습·보상 필드와 `checkedStageIds`, 연습 완료 섬 `completedIslandIds` | v1·v2 전체 세트 완료는 legacy 완료로 보존; 새 기본 7문제만 확인한 기록은 섬 완료로 승격하지 않음 |
| `mathAssist_grade2Progress` | schema v5. 기존 선택·완료·복습·보상 필드, `checkedMissionIds`, 연습 완료 단원 `completedUnitIds`, 응용문제 활성 스냅샷과 archive | v1~v4 의미를 보존해 읽으며 새 기본 6문제만 확인한 기록은 단원 완료로 승격하지 않음; 응용문제 스냅샷이 손상되면 원문을 자동 덮어쓰지 않음 |
| `mathAssist_grade3Progress` | schema v2. 기존 선택·완료·복습 필드와 결정적 연습 ID, `completedUnitIds` | v1 전체 기본 세트 완료는 legacy 완료로 보존; 새 기본 3문제만 확인한 기록은 단원 완료로 승격하지 않음 |
| `mathAssist_grade4Progress` | 4학년 선택 단원, 활동 실행·현재 문제, 완료·복습 variant, 기본·연습 `completionRecord`, 최근 활동 | completion 증거가 없는 이전 정상 기록은 문항 기록을 유지하되 단원 완료로 추측하지 않음; 손상 원문은 명시적 초기화 전 보존 |
| `mathAssist_progress_v1` | 5학년 개념별 시도·최고·최근 점수·복습 여부와 선택적 기본 5문제·집중 10문제 `completionRecord` | completion 증거가 없는 이전 완료는 legacy 완료로 읽음; 손상 원문은 보존하고 명시적 초기화 전 자동 저장을 거부 |
| `mathAssist_currentSession` | 한 개의 5학년 활성 표준·오답 세션 스냅샷 | 정상 2시간 만료는 종료; 손상 원문은 보존하고 명시적 초기화 전 자동 삭제·저장을 거부 |
| `mathAssist_lastResult` | 가장 최근 5학년 결과와 문제 스냅샷 | 손상·부재 시 `/result`가 결과 없음을 표시하며 손상 원문은 자동 덮어쓰지 않음 |
| `mathAssist_grade6Progress` | 6학년 개념별 시도·최고·최근 점수·복습 여부와 선택적 기본 5문제·집중 10문제 `completionRecord` | completion 증거가 없는 이전 완료는 legacy 완료로 읽음; 손상·비호환 원문은 보존하고 명시적 초기화 전 저장을 거부 |
| `mathAssist_grade6CurrentSession` | Grade 6 전용 5/10문제 표준·오답 세션과 `grade: 6`, `itemCount` | 2시간 만료 정상 세션은 종료; 손상·비호환 원문은 보존하고 화면의 명시적 Grade 6 초기화 전 저장·삭제를 거부 |
| `mathAssist_grade6LastResult` | 가장 최근 Grade 6 결과, 문항 수, 문제 스냅샷 | 손상·비호환 원문은 보존하고 화면의 명시적 Grade 6 초기화 전 저장·삭제를 거부 |
| `mathAssist_attemptReceipts_v1` | 새 계약 적용 뒤 공개 대상 1·2·3·4·5·6학년에서 유효하게 확인한 문제의 불변 receipt 원장. 학년·활동·안정적인 문항 ID·재시도 순번·콘텐츠 버전·정오·힌트 사용 여부·확인 시각을 저장하며 원답 문자열과 풀이장 획은 저장하지 않음 | 손상 시 원장을 덮어쓰지 않고 추가를 중단하며 기존 학년별 진도·보상 기록을 계속 권위 있게 사용 |
| `mathAssist_sketch_v1:<encoded learner/session/item>` | 공개 대상 1·2·3·4·5·6학년의 문제별 풀이장 명령과 undo 위치. 정규화 좌표의 펜·지우개 획과 전체 지우기만 저장하며 정답·답안은 저장하지 않음 | 손상된 문서는 해당 문제의 빈 풀이로 격리; 문제당 256 KiB 초과 시 기존 문서를 덮어쓰지 않고 저장 불가 안내 |
| `mathAssist_sketch_index_v1:<encoded learner>` | 풀이장 최근 50개 보존과 안전한 정리에 필요한 문서 키·갱신 시각 색인 | 손상 시 빈 색인으로 읽으며 다른 진행·receipt 키를 변경하지 않음; 활성 세션 문서는 자동 삭제하지 않음 |

저장 형식 소비자는 모르는 추가 필드를 무시할 수 있지만, 이미 알려진 완료·복습·선택 단원·최근 활동을 조용히 삭제하면 안 된다.
공통 홈의 `LearningProgressProjection`은 원문을 쓰지 않고 활동별 `hasCompletedBasicSet`, `hasCompletedPracticeSet`, `isComplete`, `recommendedMode`를 계산한다. `isComplete`는 새 기록에서 연습 세트 완료를 뜻하며, 이전 형식의 완료 의미는 `legacyCompleted` 호환으로만 보존한다.
5·6학년 progress/session/result의 손상 원문은 자동 기록·완료·만료 정리 경로가 덮어쓰거나 삭제하지 않는다. 저장 계층의 명시적 reset/clear를 먼저 호출한 경우에만 새 값을 쓸 수 있다. 정상인 기존 Grade 5 세션은 `grade`·`itemCount`가 없어도 Grade 5·10문제로 읽는다.
Grade 6의 unit·concept·template 정적 산출물이 존재해도 공개 원장의 상태가 정확히 `released`가 아니면 `/grade/6`, Grade 6 unit/concept/practice/result/retry 모든 화면은 같은 준비 중 경계에서 끝난다.
저학년의 명시적 `다시 풀기`는 같은 학년 progress repository에서 `missionSketchRunOrdinal`을 먼저 증가·저장한 뒤 새 풀이장 session ID를 만든다. 새로고침은 이 순번을 복구해야 하며, 순번은 채점·보상·receipt 판정을 바꾸지 않는다.
승인 응용문제 스냅샷은 `familyId`, `version`, 생성 시드, 유형별 입력·정답·시각 모델과 원래 학년 셸을 함께 검증한다. 출처가 없는 과거 기본 문제는 기존 호환 규칙으로 읽지만, 출처가 있다고 주장하는 불완전한 응용문제 스냅샷을 기본 문제로 낮춰 읽지 않는다.

## 아직 노출되지 않은 계정 인터페이스

`기록 저장하기`, 학습 번호·4자리 숫자 비밀번호 로그인, 복구 카드, 보호자 연결은 승인된 제품 범위이지만 현재 호출 가능한 서버 인터페이스가 아니다. 작업트리의 merge·mock transport·auth core·동의 provisioning은 production flag `false`인 비공개 기반이며 실제 provider, route, UI가 아니다. 요청·응답·오류 형식과 서버 주소가 정해지기 전에는 임시 API를 외부 계약으로 약속하지 않는다.
