'use client'

import { useMemo, useState, type ReactNode } from 'react'

import ApplicationProblemVisual from '@/components/ApplicationProblemVisual'
import { MathText } from '@/components'
import type {
  ApplicationProblemReviewData,
  ApplicationProblemReviewRow,
} from '@/lib/problem-review'

type FilterKey =
  | 'grade'
  | 'semester'
  | 'unit'
  | 'concept'
  | 'family'
  | 'cognitiveDomain'
  | 'reasoningPattern'
  | 'representation'
  | 'proofMode'
  | 'releaseStatus'

type Filters = Record<FilterKey, string>

const emptyFilters: Filters = {
  grade: 'all',
  semester: 'all',
  unit: 'all',
  concept: 'all',
  family: 'all',
  cognitiveDomain: 'all',
  reasoningPattern: 'all',
  representation: 'all',
  proofMode: 'all',
  releaseStatus: 'all',
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
    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 w-full min-w-0 max-w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
      >
        <option value="all">전체</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
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

function ReviewCase({
  reviewCase,
}: {
  reviewCase: ApplicationProblemReviewRow['reviewCases'][number]
}) {
  const caseLabel = reviewCase.kind === 'representative' ? '대표 사례' : '경계 사례'
  const visualTestPrefix = reviewCase.kind === 'representative' ? 'review' : 'review-boundary'

  return (
    <section
      data-testid={`review-${reviewCase.kind}-case`}
      className="min-w-0 rounded-2xl border-0 bg-transparent p-0 sm:border sm:border-slate-200 sm:bg-slate-50 sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-black text-slate-950">{caseLabel}</h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
          {reviewCase.reproducibility.caseId}
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <DetailSection title="문제 문장"><MathText>{reviewCase.problem.prompt}</MathText></DetailSection>
        <DetailSection title="정답">
          <span className="font-bold text-slate-950">{reviewCase.problem.answer}</span>
          {reviewCase.problem.correctChoiceIndex !== null && (
            <span className="ml-2 text-xs text-slate-500">
              보기 {reviewCase.problem.correctChoiceIndex + 1}번
            </span>
          )}
        </DetailSection>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <DetailSection title="오답 보기">
          {reviewCase.problem.distractors.length === 0 ? '주관식 문항입니다.' : (
            <ul className="space-y-1">
              {reviewCase.problem.distractors.map((choice, index) => (
                <li key={`${index}:${choice}`}><MathText>{choice}</MathText></li>
              ))}
            </ul>
          )}
        </DetailSection>
        <DetailSection title="풀이">
          <ol className="list-decimal space-y-1 pl-5">
            {reviewCase.problem.solutionSteps.map((step, index) => <li key={`${index}:${step}`}>{step}</li>)}
          </ol>
        </DetailSection>
        <DetailSection title="힌트">
          <ol className="list-decimal space-y-1 pl-5">
            {reviewCase.problem.hintSteps.map((step, index) => <li key={`${index}:${step}`}>{step}</li>)}
          </ol>
        </DetailSection>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <DetailSection title="재현 정보">
          <ul className="space-y-1 break-words">
            <li>instance: {reviewCase.reproducibility.instanceId}</li>
            <li>seed: {reviewCase.reproducibility.seed}</li>
            <li>variant: {reviewCase.reproducibility.variantIndex}</li>
            <li>동일 입력 재현: {reviewCase.reproducibility.deterministic ? '일치' : '불일치'}</li>
          </ul>
        </DetailSection>
        <DetailSection title="독립 검산">
          <ul className="space-y-1">
            <li>케이스 판정: {reviewCase.independentVerification.status}</li>
            <li>오라클 검사: {reviewCase.independentVerification.oracleStatus}</li>
            <li>시각 검사: {reviewCase.independentVerification.visualStatus}</li>
            <li>제출 전 노출 검사: {reviewCase.independentVerification.disclosureStatus}</li>
            <li>케이스 증명: {reviewCase.independentVerification.proofStatus}</li>
            <li>정답 대조: {reviewCase.independentVerification.answerMatches ? '일치' : '불일치'}</li>
            <li>시각 검증: {reviewCase.independentVerification.visualValid ? '통과' : '실패'}</li>
            {reviewCase.independentVerification.oracleAnswer !== null && (
              <li>검산 답: {reviewCase.independentVerification.oracleAnswer}</li>
            )}
            {reviewCase.independentVerification.proofAuthorityId !== null && (
              <li className="break-words">증명 권한: {reviewCase.independentVerification.proofAuthorityId}</li>
            )}
            {reviewCase.independentVerification.issues.map((issue) => (
              <li key={issue} className="text-rose-700">케이스 이슈: {issue}</li>
            ))}
          </ul>
        </DetailSection>
      </div>

      <div className="mt-3">
        <DetailSection title={`시각 자료 · ${reviewCase.visual.semantics}`}>
          {reviewCase.visual.resolutionStatus === 'blocked' || reviewCase.visual.resolutionStatus === 'omitted' ? (
            <p className="text-rose-700">시각 자료 검증 {reviewCase.visual.resolutionStatus}</p>
          ) : reviewCase.visual.before.scene === null || reviewCase.visual.after.scene === null ? (
            <p>이 유형은 필수 시각 자료가 없습니다. · {reviewCase.visual.resolutionStatus}</p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              <div
                data-testid={`${visualTestPrefix}-visual-before`}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-3"
              >
                <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">제출 전</p>
                <ApplicationProblemVisual scene={reviewCase.visual.before.scene} showAnswer={false} />
              </div>
              <div
                data-testid={`${visualTestPrefix}-visual-after`}
                className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3"
              >
                <p className="mb-2 text-xs font-bold tracking-wide text-emerald-800">답 공개 후</p>
                <ApplicationProblemVisual scene={reviewCase.visual.after.scene} showAnswer />
              </div>
            </div>
          )}
        </DetailSection>
      </div>
    </section>
  )
}

function ProblemCard({ row }: { row: ApplicationProblemReviewRow }) {
  return (
    <article data-testid="review-problem-card" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-sky-800">
            {row.grade}학년 · {row.semester} · {row.unitTitle}
          </p>
          <h2 className="mt-1 break-words text-lg font-black text-slate-950">{row.familyId}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {row.unitId} · {row.packId}@{row.packVersion ?? 'unknown'} · {row.conceptIds.join(', ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">v{row.version}</span>
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-900">{row.cognitiveDomain}</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">{row.releaseStatus}</span>
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-sky-900">{row.source}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <DetailSection title="분류">
          <ul className="space-y-1">
            <li>추론 방식: {row.reasoningPattern}</li>
            <li>표현: {row.representations.join(', ')}</li>
            <li>증명 방식: {row.proofMode}</li>
          </ul>
        </DetailSection>
        <DetailSection title="오개념">
          <ul className="space-y-1">
            {row.misconceptions.map((item) => <li key={item.id}>• {item.description}</li>)}
          </ul>
        </DetailSection>
      </div>

      <div className="mt-4 grid min-w-0 gap-4">
        {row.reviewCases.map((reviewCase) => (
          <ReviewCase key={reviewCase.reproducibility.caseId} reviewCase={reviewCase} />
        ))}
      </div>

      <div className="mt-4">
        <DetailSection title="자동 검사 근거">
          <ul className="space-y-1">
            <li>메타데이터 근거: {row.metadataEvidence.status}</li>
            <li>family 근거: {row.familyEvidence.status}</li>
            <li>감사 결과: {row.automaticChecks.audit.status === 'passed' ? '통과' : '실패'}</li>
            <li>결정적 생성 재현: {row.automaticChecks.deterministicSample ? '일치' : '불일치'}</li>
            <li>시각 해석: {row.automaticChecks.visual.resolver} → {row.automaticChecks.visual.status}</li>
            <li>증명 실행: {row.automaticChecks.proof.proven ? '통과' : '실패'} · {row.automaticChecks.proof.checkedCount}/{row.automaticChecks.proof.expectedCount}건 · {row.automaticChecks.proof.mode}</li>
            {row.automaticChecks.proof.authorityId && <li>증명 권한: {row.automaticChecks.proof.authorityId}</li>}
            {row.automaticChecks.proof.issues.map((issue) => <li key={issue} className="text-rose-700">증명 이슈: {issue}</li>)}
            {row.automaticChecks.audit.issues.map((issue) => <li key={issue} className="text-rose-700">감사 이슈: {issue}</li>)}
          </ul>
        </DetailSection>
      </div>
    </article>
  )
}

export default function ApplicationProblemReviewClient({ data }: { data: ApplicationProblemReviewData }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const setFilter = (key: FilterKey) => (value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }
  const filteredRows = useMemo(() => data.rows.filter((row) => (
    (filters.grade === 'all' || String(row.grade) === filters.grade) &&
    (filters.semester === 'all' || row.semester === filters.semester) &&
    (filters.unit === 'all' || row.unitId === filters.unit) &&
    (filters.concept === 'all' || row.conceptIds.includes(filters.concept)) &&
    (filters.family === 'all' || row.familyId === filters.family) &&
    (filters.cognitiveDomain === 'all' || row.cognitiveDomain === filters.cognitiveDomain) &&
    (filters.reasoningPattern === 'all' || row.reasoningPattern === filters.reasoningPattern) &&
    (filters.representation === 'all' || row.representations.some((value) => value === filters.representation)) &&
    (filters.proofMode === 'all' || row.proofMode === filters.proofMode) &&
    (filters.releaseStatus === 'all' || row.releaseStatus === filters.releaseStatus)
  )), [data.rows, filters])

  return (
    <main data-testid="application-problem-review" className="min-h-screen overflow-x-hidden bg-slate-100 px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-3xl bg-slate-950 px-5 py-6 text-white sm:px-8">
          <p className="text-xs font-bold tracking-[0.16em] text-sky-200">INTERNAL · READ ONLY</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">전 학년 응용문제 검수</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">2~6학년 62개 단원의 draft 제작 후보와 승인된 production 유형을 한곳에서 비교합니다. 이 화면은 검수 전용이며 승인·저장·출시 행동이나 학습자 기록 접근을 제공하지 않습니다.</p>
          <p className="mt-4 text-sm font-bold text-sky-100">전체 단원 {data.summary.totalUnits}개 · 대표 family {data.summary.totalRows}개</p>
        </header>

        <section aria-label="검수 필터" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-lg font-black text-slate-950">검수 필터</h2><p className="mt-1 text-sm text-slate-600">단원 선택지는 62단원 원장, 유형 선택지는 현재 검수 카탈로그에서 파생됩니다.</p></div>
            <p className="text-sm font-bold text-slate-700">{filteredRows.length}개 표시</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Select label="학년" value={filters.grade} options={data.filters.grades.map((grade) => ({ value: String(grade), label: `${grade}학년` }))} onChange={setFilter('grade')} />
            <Select label="학기" value={filters.semester} options={data.filters.semesters} onChange={setFilter('semester')} />
            <Select label="단원" value={filters.unit} options={data.filters.units} onChange={setFilter('unit')} />
            <Select label="개념" value={filters.concept} options={data.filters.concepts} onChange={setFilter('concept')} />
            <Select label="유형(family)" value={filters.family} options={data.filters.families} onChange={setFilter('family')} />
            <Select label="인지영역" value={filters.cognitiveDomain} options={data.filters.cognitiveDomains} onChange={setFilter('cognitiveDomain')} />
            <Select label="추론 방식" value={filters.reasoningPattern} options={data.filters.reasoningPatterns} onChange={setFilter('reasoningPattern')} />
            <Select label="표현" value={filters.representation} options={data.filters.representations} onChange={setFilter('representation')} />
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
