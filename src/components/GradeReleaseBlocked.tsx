import Link from 'next/link'

export default function GradeReleaseBlocked({ grade }: { grade: 6 }) {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-4 py-12" data-testid="grade6-release-blocked">
      <section className="w-full rounded-[2rem] border-2 border-[#bae6fd] bg-white p-7 text-center shadow-sm md:p-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0369a1]">{grade}학년 Study</p>
        <h1 className="mt-3 text-3xl font-black text-[#0f172a]">아직 준비 중이에요</h1>
        <p className="mx-auto mt-4 max-w-xl font-bold leading-7 text-[#64748b]">
          문제 내용과 표현을 더 꼼꼼히 확인하고 있어요. 검토가 끝난 뒤 학습 홈에서 열어 드릴게요.
        </p>
        <Link
          href="/home"
          className="mt-7 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#0369a1] px-6 font-black text-white"
        >
          학습 홈으로
        </Link>
      </section>
    </main>
  )
}
