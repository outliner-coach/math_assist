import type { Metadata } from 'next'

import {
  APP_RELEASE_LABEL,
  CONTENT_RELEASE_LABEL,
  POLICY_UPDATED_LABEL,
} from '@/lib/app-release-info'
import { STORAGE_UNAVAILABLE_WARNING } from '@/lib/storage-health'

export const metadata: Metadata = {
  title: '지원 | 수학 연습장',
  description:
    '수학 연습장의 문제 신고 방법, 저장소 백업과 복구, 오프라인 한계, 공식 지원 환경을 안내합니다.',
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

export default function SupportPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-5 py-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-black text-slate-900">지원</h1>
        <p className="text-base leading-relaxed text-slate-600">
          문제가 생겼을 때 도움을 받는 방법과 앱이 동작하는 환경을 안내합니다.
        </p>
        <ReleaseInfo />
      </header>

      <section aria-labelledby="support-contact" className="space-y-3">
        <h2 id="support-contact" className="text-xl font-black text-slate-900">
          운영 이메일과 문제 신고
        </h2>
        <p className="text-base leading-relaxed text-slate-700">
          운영 이메일은{' '}
          <a
            href="mailto:outliner0206@gmail.com"
            className="font-bold text-emerald-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            outliner0206@gmail.com
          </a>{' '}
          입니다.
        </p>
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700">
          <li>학습 중 문제: 화면의 문제 신고 버튼으로 보고문을 만들 수 있어요.</li>
          <li>메일 앱이 열리지 않으면 보고문 복사 버튼으로 내용을 복사해 메일로 보내 주세요.</li>
          <li>보고문에는 답이나 학습 기록이 들어가지 않아요.</li>
        </ul>
      </section>

      <section aria-labelledby="support-storage-warning" className="space-y-3">
        <h2 id="support-storage-warning" className="text-xl font-black text-slate-900">
          저장소를 사용할 수 없을 때
        </h2>
        <p className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-base font-bold leading-relaxed text-amber-900">
          {STORAGE_UNAVAILABLE_WARNING}
        </p>
        <p className="text-base leading-relaxed text-slate-700">
          프로필 전환이나 가져오기처럼 기록 저장이 꼭 필요한 동작은 저장소 사용이
          불가능하면 중단됩니다. 기기 용량을 확인하거나 브라우저 설정에서 이 사이트의
          데이터를 지운 뒤 다시 시도해 주세요.
        </p>
      </section>

      <section aria-labelledby="support-backup" className="space-y-3">
        <h2 id="support-backup" className="text-xl font-black text-slate-900">
          백업과 복구
        </h2>
        <p className="text-base leading-relaxed text-slate-700">
          홈에서 프로필을 파일로 내보내기 하면 학습 진행을 안전하게 보관할 수 있습니다.
          새 기기나 같은 기기에서 가져오기를 하면 기록을 이어서 사용할 수 있습니다.
        </p>
      </section>

      <section aria-labelledby="support-offline-limits" className="space-y-3">
        <h2 id="support-offline-limits" className="text-xl font-black text-slate-900">
          오프라인 사용 한계
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700">
          <li>최초 방문에는 인터넷 연결이 필요합니다. 연결 후에 오프라인 학습이 준비됩니다.</li>
          <li>오프라인 학습 팩은 기기 저장 용량만큼만 저장할 수 있습니다.</li>
          <li>앱을 업데이트한 뒤에는 다시 인터넷에 연결해야 새 내용이 반영됩니다.</li>
        </ul>
      </section>

      <section aria-labelledby="support-environments" className="space-y-3">
        <h2 id="support-environments" className="text-xl font-black text-slate-900">
          공식 지원 환경
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-slate-700">
          <li>iPadOS Safari: 최신 및 직전 주요 버전</li>
          <li>Android Chrome: 최신 및 직전 주요 버전</li>
          <li>데스크톱 Chrome, Safari, Edge: 최신 버전</li>
        </ul>
        <p className="text-base leading-relaxed text-slate-700">
          그 외 브라우저와 오래된 운영 체제는 가능한 범위에서 동작하지만 공식 합격
          대상이 아닙니다. 지원 밖 환경이라도 학습이 막히지는 않습니다.
        </p>
      </section>

      <section aria-labelledby="support-pages-limits" className="space-y-3">
        <h2 id="support-pages-limits" className="text-xl font-black text-slate-900">
          GitHub Pages에서 운영할 때의 한계
        </h2>
        <p className="text-base leading-relaxed text-slate-700">
          수학 연습장은 GitHub Pages의 정적 호스팅으로 제공됩니다. 이 환경에서는
          서버가 보안 응답 헤더(예: 콘텐츠 보안 정책)를 직접 설정할 수 없어서,
          브라우저의 기본 보안과 웹 표준에 의존합니다. 개인정보 처리 방침에서
          설명하는 것보다 강한 서버 수준 차단은 기대하지 말아 주세요.
        </p>
      </section>

      <footer>
        <ReleaseInfo />
      </footer>
    </main>
  )
}
