import type { Metadata } from 'next'

import {
  APP_RELEASE_LABEL,
  CONTENT_RELEASE_LABEL,
  POLICY_UPDATED_LABEL,
} from '@/lib/app-release-info'

export const metadata: Metadata = {
  title: '개인정보 처리 방침 | 수학 연습장',
  description:
    '수학 연습장이 기기에 저장하는 항목, 프로필의 성격, 내보내기와 삭제, 오류 보고 허용 범위를 안내합니다.',
}

function ReleaseInfo() {
  return (
    <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
      적용 버전: 앱 {APP_RELEASE_LABEL} · 학습 내용 {CONTENT_RELEASE_LABEL}
      <br />
      정책 갱신일: {POLICY_UPDATED_LABEL}
    </p>
  )
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-5 py-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-black text-slate-900">개인정보 처리 방침</h1>
        <p className="text-base leading-relaxed text-slate-600">
          수학 연습장은 가입도, 회원 계정도 없습니다. 학습 기록은 이 기기 안에만 저장되고
          광고나 행동 분석, 원격 학습 기록 저장은 없습니다.
        </p>
        <ReleaseInfo />
      </header>

      <section aria-labelledby="privacy-storage" className="space-y-3">
        <h2 id="privacy-storage" className="text-xl font-black text-slate-900">
          기기에 저장되는 항목
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700">
          <li>브라우저 localStorage: 학습 진행 기록, 프로필 정보, 화면 설정</li>
          <li>Cache Storage: 오프라인 학습을 위한 앱 파일과 학습 팩</li>
        </ul>
        <p className="text-base leading-relaxed text-slate-700">
          이 값들은 운영 서버로 전송되지 않고, 브라우저의 사이트 데이터를 지우면 함께 사라집니다.
        </p>
      </section>

      <section aria-labelledby="privacy-profiles" className="space-y-3">
        <h2 id="privacy-profiles" className="text-xl font-black text-slate-900">
          프로필은 인증이 아닙니다
        </h2>
        <p className="text-base leading-relaxed text-slate-700">
          프로필 이름과 잠금 비밀번호는 이 기기 안에서만 효력이 있습니다. 로그인·회원
          인증 경계가 아니므로, 누군가 기기를 직접 사용하면 프로필 화면을 볼 수 있다는
          점을 알아 주세요.
        </p>
      </section>

      <section aria-labelledby="privacy-export" className="space-y-3">
        <h2 id="privacy-export" className="text-xl font-black text-slate-900">
          내보내기 파일과 삭제
        </h2>
        <p className="text-base leading-relaxed text-slate-700">
          내보내기 파일에는 프로필 이름 같은 기본 정보와 학습 진행 기록이 담깁니다.
          답안 입력 원문이나 풀이장 낙서는 담기지 않습니다.
        </p>
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700">
          <li>개별 삭제: 홈의 프로필 관리에서 프로필을 삭제합니다.</li>
          <li>전체 삭제: 브라우저 설정에서 이 사이트의 데이터를 삭제합니다.</li>
        </ul>
      </section>

      <section aria-labelledby="privacy-error-reporting" className="space-y-3">
        <h2 id="privacy-error-reporting" className="text-xl font-black text-slate-900">
          기술 장애 보고(Sentry)
        </h2>
        <p className="text-base leading-relaxed text-slate-700">
          앱이 멈추는 기술 장애의 종류만 외부 서비스(Sentry)로 보낼 수 있습니다.
          보내지는 항목은 다음으로 제한됩니다.
        </p>
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700">
          <li>이벤트 ID와 시각</li>
          <li>고정 구분 메시지 MathAssistTechnicalError (실제 오류 원문이 아닙니다)</li>
          <li>태그 세 개: app_release, route_template, error_kind</li>
        </ul>
        <p className="text-base leading-relaxed text-slate-700">
          오류 메시지 원문, 스택, 접속 주소, 쿼리 문자열, 학습자·프로필·기기 ID,
          학습 기록과 답안은 전송 전에 제거되며, 허용 목록 검사를 통과하지 못한
          보고는 폐기됩니다. DSN(전송 주소) 설정이 없으면 아무것도 보내지 않는
          무전송 모드로 동작합니다. Sentry 프로젝트는 IP 저장을 끄고 보존 기간은
          최대 30일 이하로만 사용합니다.
        </p>
      </section>

      <section aria-labelledby="privacy-no-tracking" className="space-y-3">
        <h2 id="privacy-no-tracking" className="text-xl font-black text-slate-900">
          하지 않는 일
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700">
          <li>광고 게재 및 광고 식별자 사용</li>
          <li>행동 분석 도구 연동</li>
          <li>학습 기록의 원격 저장 또는 판매</li>
        </ul>
      </section>

      <footer>
        <ReleaseInfo />
      </footer>
    </main>
  )
}
