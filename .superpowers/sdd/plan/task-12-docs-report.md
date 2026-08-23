# T12 문서 동기화 보고

## 반영 범위

- 2026-07-28 승인 기록에 맞춰 3 pack, 9개 `familyId@1`,
  `project-owner`, `expertStatus: not-reviewed`를 문서화했다.
- pack → family → registry/release ledger → proof/visual/review/audit 의존과
  `/review/problems`의 내부 읽기 전용 경계를 기록했다.
- 2학년 144개 보존 + 3개 응용 미션, 5·6학년 기존 후보 풀 보존 + 승인 후보 추가,
  그리고 최종 세션의 정확한 문항 수·난이도 계약을 기록했다.
- `validate:application-packs`와 `audit:applications`의 오류·보고서 동작 및 현재
  9개 승인, 오류 0 결과를 기록했다.
- 2학년 길이 교육과정 근거 문서의 현재형 `draft/pending` 상태도 같은 승인 기록으로
  정정했다.

## 이번 작업에서 확인한 명령

```bash
npm run validate:application-packs
npm run audit:applications
git diff --check
```

앞의 두 명령은 각각 9 family, 오류 0을 보고했다. 이 보고서는 문서 동기화 작업만
기록하며 T12 전체 회귀, build, E2E, GitHub Pages 배포 완료를 주장하지 않는다.
