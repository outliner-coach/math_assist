'use client'

import Link from 'next/link'
import { useDeferredValue, useState, type ReactNode } from 'react'

import { MathText } from '@/components'
import type { ProblemReviewData, ProblemReviewRow } from '@/lib/problem-review'

interface ProblemReviewClientProps {
  data: ProblemReviewData
}

type ViewMode = 'card' | 'table'

const difficultyLabel: Record<1 | 2 | 3, string> = {
  1: '난이도 1',
  2: '난이도 2',
  3: '난이도 3',
}

const difficultyStyle: Record<1 | 2 | 3, string> = {
  1: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  2: 'border-amber-200 bg-amber-50 text-amber-800',
  3: 'border-rose-200 bg-rose-50 text-rose-800',
}

const typeLabel: Record<'choice' | 'number', string> = {
  choice: '객관식',
  number: '주관식',
}

const typeStyle: Record<'choice' | 'number', string> = {
  choice: 'border-sky-200 bg-sky-50 text-sky-800',
  number: 'border-violet-200 bg-violet-50 text-violet-800',
}

const CHOICE_LABELS = ['①', '②', '③', '④']

function renderAnswer(row: ProblemReviewRow) {
  if (row.correctChoiceLabel) {
    return `${row.correctChoiceLabel} ${row.correctAnswer}`
  }

  return row.correctAnswer
}

function getAnchorId(rows: ProblemReviewRow[], index: number) {
  if (index === 0 || rows[index - 1].conceptId !== rows[index].conceptId) {
    return `concept-${rows[index].conceptId}`
  }

  return undefined
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/50 bg-white/80 p-5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`mt-3 text-3xl font-black tracking-tight ${accent}`}>{value}</div>
    </div>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

function ChoicePreview({ row }: { row: ProblemReviewRow }) {
  if (row.choices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        주관식 문항입니다. 정답 칸에서 수식을 바로 확인하실 수 있습니다.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {row.choices.map((choice, index) => {
        const choiceLabel = CHOICE_LABELS[index]
        const isCorrect = row.correctChoiceLabel === choiceLabel

        return (
          <div
            key={`${row.templateId}-${index}`}
            className={`rounded-2xl border px-4 py-3 ${
              isCorrect
                ? 'border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-100/70'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="mb-1 text-xs font-bold tracking-[0.16em] text-slate-500">
              {choiceLabel}
            </div>
            <div className="overflow-x-auto text-sm leading-7 text-slate-800">
              <MathText>{choice}</MathText>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProblemCard({
  row,
  anchorId,
}: {
  row: ProblemReviewRow
  anchorId?: string
}) {
  return (
    <article
      id={anchorId}
      className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <Link
              href={`/concept/${row.conceptId}`}
              className="text-lg font-bold text-slate-900 transition hover:text-sky-700"
            >
              {row.conceptTitle}
            </Link>
            <div className="text-sm text-slate-500">{row.unitTitle}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              세트 {row.setId}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${difficultyStyle[row.difficulty]}`}
            >
              {difficultyLabel[row.difficulty]}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyle[row.type]}`}
            >
              {typeLabel[row.type]}
            </span>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] p-5">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
            Problem
          </div>
          <div className="overflow-x-auto text-base font-semibold leading-8 text-slate-900">
            <MathText>{row.prompt}</MathText>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-700">보기</div>
          <ChoicePreview row={row} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="rounded-[1.75rem] bg-slate-950 px-4 py-4 text-white">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-sky-200">
              Answer
            </div>
            <div className="mt-2 overflow-x-auto text-sm font-semibold leading-7">
              <MathText>{renderAnswer(row)}</MathText>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              Template
            </div>
            <div className="mt-2 font-mono text-sm font-semibold text-slate-800">
              {row.templateId}
            </div>
            <div className="mt-3 rounded-2xl bg-white px-3 py-3 font-mono text-xs leading-6 text-slate-500 ring-1 ring-slate-200">
              {Object.entries(row.params)
                .map(([key, value]) => `${key}=${value}`)
                .join(', ')}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function ProblemTable({ rows }: { rows: ProblemReviewRow[] }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)]">
      <div className="overflow-x-auto">
        <table className="min-w-[1320px] w-full border-collapse text-sm">
          <thead className="bg-slate-950 text-left text-white">
            <tr>
              <th className="px-4 py-4 font-semibold">개념</th>
              <th className="px-4 py-4 font-semibold">세트</th>
              <th className="px-4 py-4 font-semibold">난이도</th>
              <th className="px-4 py-4 font-semibold">유형</th>
              <th className="px-4 py-4 font-semibold">문제</th>
              <th className="px-4 py-4 font-semibold">보기</th>
              <th className="px-4 py-4 font-semibold">정답</th>
              <th className="px-4 py-4 font-semibold">템플릿</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.templateId}
                id={getAnchorId(rows, index)}
                className="border-t border-slate-200 align-top odd:bg-slate-50/60"
              >
                <td className="px-4 py-4">
                  <Link
                    href={`/concept/${row.conceptId}`}
                    className="block font-semibold text-slate-900 hover:text-sky-700"
                  >
                    {row.conceptTitle}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">{row.unitTitle}</div>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                    세트 {row.setId}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${difficultyStyle[row.difficulty]}`}
                  >
                    {difficultyLabel[row.difficulty]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyle[row.type]}`}
                  >
                    {typeLabel[row.type]}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-800">
                  <div className="max-w-[32rem] overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 leading-7 shadow-sm">
                    <MathText>{row.prompt}</MathText>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {row.choices.length > 0 ? (
                    <div className="max-w-[22rem] space-y-2">
                      {row.choices.map((choice, choiceIndex) => {
                        const choiceLabel = CHOICE_LABELS[choiceIndex]
                        const isCorrect = row.correctChoiceLabel === choiceLabel

                        return (
                          <div
                            key={`${row.templateId}-${choiceIndex}`}
                            className={`rounded-2xl border px-3 py-2 ${
                              isCorrect
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="mb-1 text-xs font-semibold text-slate-500">
                              {choiceLabel}
                            </div>
                            <div className="overflow-x-auto text-slate-800">
                              <MathText>{choice}</MathText>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">해당 없음</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-[14rem] rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                    <MathText>{renderAnswer(row)}</MathText>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-mono text-xs font-semibold text-slate-700">
                    {row.templateId}
                  </div>
                  <div className="mt-2 text-xs leading-6 text-slate-400">
                    {Object.entries(row.params)
                      .map(([key, value]) => `${key}=${value}`)
                      .join(', ')}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t border-slate-200">
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm font-medium text-slate-500"
                >
                  현재 필터에 맞는 문제가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function ProblemReviewClient({ data }: ProblemReviewClientProps) {
  const [search, setSearch] = useState('')
  const [conceptFilter, setConceptFilter] = useState('all')
  const [setFilter, setSetFilter] = useState<'all' | 'A' | 'B' | 'C'>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | '1' | '2' | '3'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'choice' | 'number'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('card')

  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = deferredSearch.trim().toLowerCase()

  const filteredRows = data.rows.filter(row => {
    if (conceptFilter !== 'all' && row.conceptId !== conceptFilter) return false
    if (setFilter !== 'all' && row.setId !== setFilter) return false
    if (difficultyFilter !== 'all' && String(row.difficulty) !== difficultyFilter) return false
    if (typeFilter !== 'all' && row.type !== typeFilter) return false

    if (!normalizedSearch) return true

    const searchableText = [
      row.conceptTitle,
      row.unitTitle,
      row.templateId,
      row.prompt,
      row.correctAnswer,
      ...row.choices,
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(normalizedSearch)
  })

  const activeConceptIds = new Set(filteredRows.map(row => row.conceptId))

  return (
    <div className="relative left-1/2 w-screen max-w-[1680px] -translate-x-1/2 overflow-x-hidden bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_42%,#f1f5f9_100%)] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="overflow-hidden rounded-[2.25rem] border border-white/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.96)_58%,rgba(14,116,144,0.92)_100%)] px-6 py-8 text-white shadow-[0_40px_120px_-50px_rgba(15,23,42,0.8)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl space-y-3">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200">
                Review Surface
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                연습문제 검수 보드
              </h1>
              <p className="text-sm leading-7 text-slate-200 sm:text-base">
                모든 개념의 문제를 샘플 렌더링한 검수용 페이지입니다. 각 템플릿은
                고정 시드로 1회 생성되며, 문제 유형과 난이도, 보기, 정답, 템플릿
                파라미터를 한 화면에서 바로 비교하실 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                홈으로
              </Link>
              <a
                href="#review-results"
                className="rounded-full bg-sky-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-sky-200"
              >
                검수 결과 보기
              </a>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="총 샘플 문제" value={data.summary.totalProblems} accent="text-slate-950" />
          <StatCard label="개념 수" value={data.summary.totalConcepts} accent="text-sky-700" />
          <StatCard label="객관식" value={data.summary.totalChoiceProblems} accent="text-emerald-700" />
          <StatCard label="주관식" value={data.summary.totalNumberProblems} accent="text-violet-700" />
          <StatCard label="현재 표시중" value={filteredRows.length} accent="text-rose-700" />
        </section>

        <section className="sticky top-4 z-20 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">필터와 보기 모드</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  문제 문구, 정답, 템플릿 ID로 검색하고 세트·난이도·유형별로
                  좁혀 보실 수 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ToggleButton active={viewMode === 'card'} onClick={() => setViewMode('card')}>
                  카드 보기
                </ToggleButton>
                <ToggleButton active={viewMode === 'table'} onClick={() => setViewMode('table')}>
                  테이블 보기
                </ToggleButton>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <FilterField label="검색">
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="문제, 정답, 템플릿 ID"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </FilterField>

              <FilterField label="개념">
                <select
                  value={conceptFilter}
                  onChange={event => setConceptFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                >
                  <option value="all">전체 개념</option>
                  {data.concepts.map(concept => (
                    <option key={concept.id} value={concept.id}>
                      {concept.title}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="세트">
                <select
                  value={setFilter}
                  onChange={event => setSetFilter(event.target.value as 'all' | 'A' | 'B' | 'C')}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                >
                  <option value="all">전체 세트</option>
                  <option value="A">세트 A</option>
                  <option value="B">세트 B</option>
                  <option value="C">세트 C</option>
                </select>
              </FilterField>

              <FilterField label="난이도">
                <select
                  value={difficultyFilter}
                  onChange={event => setDifficultyFilter(event.target.value as 'all' | '1' | '2' | '3')}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                >
                  <option value="all">전체 난이도</option>
                  <option value="1">난이도 1</option>
                  <option value="2">난이도 2</option>
                  <option value="3">난이도 3</option>
                </select>
              </FilterField>

              <FilterField label="유형">
                <select
                  value={typeFilter}
                  onChange={event => setTypeFilter(event.target.value as 'all' | 'choice' | 'number')}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                >
                  <option value="all">전체 유형</option>
                  <option value="choice">객관식</option>
                  <option value="number">주관식</option>
                </select>
              </FilterField>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">개념 빠른 이동</h2>
              <p className="text-sm text-slate-500">
                현재 필터에 남아 있는 개념은 강조 표시됩니다.
              </p>
            </div>
            <div className="text-sm font-semibold text-slate-500">
              활성 개념 {activeConceptIds.size}개
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.concepts.map(concept => {
              const isActive = activeConceptIds.has(concept.id)

              return (
                <a
                  key={concept.id}
                  href={`#concept-${concept.id}`}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {concept.title}
                  <span className={`ml-2 text-xs ${isActive ? 'text-sky-200' : 'text-slate-400'}`}>
                    {concept.rowCount}
                  </span>
                </a>
              )
            })}
          </div>
        </section>

        <section id="review-results" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                검수 결과
              </h2>
              <p className="text-sm leading-6 text-slate-500">
                카드 보기는 문제 자체를 읽기 좋게, 테이블 보기는 다량 비교에
                적합하게 설계했습니다.
              </p>
            </div>
            <div className="text-sm font-semibold text-slate-600">
              {filteredRows.length}문항 표시 중
            </div>
          </div>

          {viewMode === 'card' ? (
            filteredRows.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredRows.map((row, index) => (
                  <ProblemCard
                    key={row.templateId}
                    row={row}
                    anchorId={getAnchorId(filteredRows, index)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/75 px-6 py-16 text-center text-sm font-semibold text-slate-500">
                현재 필터에 맞는 문제가 없습니다.
              </div>
            )
          ) : (
            <ProblemTable rows={filteredRows} />
          )}
        </section>
      </div>
    </div>
  )
}
