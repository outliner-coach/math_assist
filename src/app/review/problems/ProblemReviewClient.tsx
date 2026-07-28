'use client'

import { useMemo, useState, type ReactNode } from 'react'

import ApplicationProblemVisual from '@/components/ApplicationProblemVisual'
import { MathText } from '@/components'
import type { ApplicationProblemReviewData, ProblemReviewRow } from '@/lib/problem-review'

interface ProblemReviewClientProps {
  data: ApplicationProblemReviewData
}

type Filters = {
  grade: string
  unit: string
  family: string
  version: string
  cognitiveDomain: string
  reasoningPattern: string
  standard: string
  proofMode: string
  releaseStatus: string
}

const emptyFilters: Filters = {
  grade: 'all',
  unit: 'all',
  family: 'all',
  version: 'all',
  cognitiveDomain: 'all',
  reasoningPattern: 'all',
  standard: 'all',
  proofMode: 'all',
  releaseStatus: 'all',
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <FilterField label={label}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
      >
        <option value="all">전체</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FilterField>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  )
}

function VisualReview({ row }: { row: ProblemReviewRow }) {
  return (
    <DetailSection title={`시각 자료 · ${row.visual.semantics}`}>
      <div className="grid gap-3 lg:grid-cols-2">
        <div data-testid="review-visual-before" className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs font-bold tracking-wide text-slate-500">제출 전</div>
          <ApplicationProblemVisual scene={row.visual.before.scene} showAnswer={false} />
        </div>
        <div data-testid="review-visual-after" className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <div className="mb-2 text-xs font-bold tracking-wide text-emerald-800">답 공개 후</div>
          <ApplicationProblemVisual scene={row.visual.after.scene} showAnswer />
        </div>
      </div>
    </DetailSection>
  )
}

function ProblemCard({ row }: { row: ProblemReviewRow }) {
  return (
    <article data-testid="review-problem-card" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-sky-800">{row.grade}학년 · {row.unitId}</p>
          <h2 className="mt-1 break-words text-lg font-black text-slate-950">{row.familyId}</h2>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">v{row.version}</span>
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-900">{row.cognitiveDomain}</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">{row.releaseStatus}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <DetailSection title="문제 문장"><MathText>{row.prompt}</MathText></DetailSection>
        <DetailSection title="정답">
          <span className="font-bold text-slate-950">{row.answer}</span>
          {row.correctChoiceIndex !== null && <span className="ml-2 text-xs text-slate-500">보기 {row.correctChoiceIndex + 1}번</span>}
        </DetailSection>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <DetailSection title="객관식 보기">
          {row.choices.length === 0 ? '주관식 문항입니다.' : (
            <ol className="list-decimal space-y-1 pl-5">
              {row.choices.map((choice) => <li key={choice}><MathText>{choice}</MathText></li>)}
            </ol>
          )}
        </DetailSection>
        <DetailSection title="오개념">
          <ul className="space-y-1">
            {row.misconceptions.map((misconception) => <li key={misconception.id}>• {misconception.description}</li>)}
          </ul>
        </DetailSection>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <DetailSection title="풀이"><ol className="list-decimal space-y-1 pl-5">{row.solutionSteps.map((step) => <li key={step}>{step}</li>)}</ol></DetailSection>
        <DetailSection title="힌트"><ol className="list-decimal space-y-1 pl-5">{row.hintSteps.map((step) => <li key={step}>{step}</li>)}</ol></DetailSection>
      </div>

      <div className="mt-3"><VisualReview row={row} /></div>

      <DetailSection title="자동 검사 근거">
        <ul className="space-y-1">
          <li>결정적 생성 재현: {row.automaticChecks.deterministicSample ? '일치' : '불일치'}</li>
          <li>시각 해석: {row.automaticChecks.visual.resolver} → {row.automaticChecks.visual.status}</li>
          <li>증명 등록: {row.automaticChecks.proof.authorityId} · {row.automaticChecks.proof.mode} · {row.automaticChecks.proof.expectedCount}건</li>
        </ul>
      </DetailSection>
    </article>
  )
}

export default function ProblemReviewClient({ data }: ProblemReviewClientProps) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const setFilter = (key: keyof Filters) => (value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const filteredRows = useMemo(() => data.rows.filter((row) => (
    (filters.grade === 'all' || String(row.grade) === filters.grade) &&
    (filters.unit === 'all' || row.unitId === filters.unit) &&
    (filters.family === 'all' || row.familyId === filters.family) &&
    (filters.version === 'all' || String(row.version) === filters.version) &&
    (filters.cognitiveDomain === 'all' || row.cognitiveDomain === filters.cognitiveDomain) &&
    (filters.reasoningPattern === 'all' || row.reasoningPattern === filters.reasoningPattern) &&
    (filters.standard === 'all' || row.standards.includes(filters.standard)) &&
    (filters.proofMode === 'all' || row.proofMode === filters.proofMode) &&
    (filters.releaseStatus === 'all' || row.releaseStatus === filters.releaseStatus)
  )), [data.rows, filters])

  return (
    <main data-testid="application-problem-review" className="min-h-screen overflow-x-hidden bg-slate-100 px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-3xl bg-slate-950 px-5 py-6 text-white sm:px-8">
          <p className="text-xs font-bold tracking-[0.16em] text-sky-200">INTERNAL · READ ONLY</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">세 학년 응용문제 검수</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">등록된 런타임의 고정 대표 문제와 증명·시각 검사 근거를 비교합니다. 이 화면은 검수 전용이며 승인 또는 출시 상태를 변경하지 않습니다.</p>
          <p className="mt-4 text-sm font-bold text-sky-100">대표 family {data.summary.totalRows}개</p>
        </header>

        <section aria-label="검수 필터" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-lg font-black text-slate-950">검수 필터</h2><p className="mt-1 text-sm text-slate-600">선택지는 현재 등록된 대표 행에서만 파생됩니다.</p></div>
            <p className="text-sm font-bold text-slate-700">{filteredRows.length}개 표시</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Select label="학년" value={filters.grade} options={data.filters.grades.map((grade) => ({ value: String(grade), label: `${grade}학년` }))} onChange={setFilter('grade')} />
            <Select label="단원" value={filters.unit} options={data.filters.units} onChange={setFilter('unit')} />
            <Select label="유형(family)" value={filters.family} options={data.filters.families} onChange={setFilter('family')} />
            <Select label="버전" value={filters.version} options={data.filters.versions.map((option) => ({ ...option, label: `v${option.label}` }))} onChange={setFilter('version')} />
            <Select label="인지영역" value={filters.cognitiveDomain} options={data.filters.cognitiveDomains} onChange={setFilter('cognitiveDomain')} />
            <Select label="추론패턴" value={filters.reasoningPattern} options={data.filters.reasoningPatterns} onChange={setFilter('reasoningPattern')} />
            <Select label="성취기준" value={filters.standard} options={data.filters.standards} onChange={setFilter('standard')} />
            <Select label="증명 방식" value={filters.proofMode} options={data.filters.proofModes} onChange={setFilter('proofMode')} />
            <Select label="출시 상태" value={filters.releaseStatus} options={data.filters.releaseStatuses} onChange={setFilter('releaseStatus')} />
          </div>
        </section>

        <section aria-label="대표 문제 검수" className="grid min-w-0 gap-5">
          {filteredRows.map((row) => <ProblemCard key={`${row.familyId}@${row.version}`} row={row} />)}
          {filteredRows.length === 0 && <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">현재 조건과 일치하는 등록 family가 없습니다.</p>}
        </section>
      </div>
    </main>
  )
}
