'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import { MathText } from '@/components'
import type {
  ProblemReviewData,
  ProblemReviewRow,
  ProblemReviewStatus,
} from '@/lib/problem-review'

import ProblemReviewRenderer, {
  type ProblemReviewState,
} from './ProblemReviewRenderer'
import {
  canonicalizeProblemReviewSelection,
  createProblemReviewQuery,
  resolveProblemReviewQuery,
  transitionProblemReviewSelection,
  type ProblemReviewSelection,
} from './problem-review-query'

interface ProblemReviewClientProps {
  data: ProblemReviewData
}

type GradeFilter = 'all' | '1' | '2' | '3' | '4' | '5' | '6'

interface ReviewFilters {
  gradeFilter: GradeFilter
  visualOnly: boolean
  search: string
  semesterFilter: string
  unitFilter: string
  conceptFilter: string
  familyFilter: string
  taskActionFilter: string
  answerKindFilter: string
  visualKindFilter: string
  visualSemanticsFilter: string
  reviewStatusFilter: string
}

const defaultReviewFilters: ReviewFilters = {
  gradeFilter: 'all',
  visualOnly: true,
  search: '',
  semesterFilter: 'all',
  unitFilter: 'all',
  conceptFilter: 'all',
  familyFilter: 'all',
  taskActionFilter: 'all',
  answerKindFilter: 'all',
  visualKindFilter: 'all',
  visualSemanticsFilter: 'all',
  reviewStatusFilter: 'all',
}

const CHOICE_LABELS = ['①', '②', '③', '④']

const subscribeToHydration = () => () => undefined
const getClientHydration = () => true
const getServerHydration = () => false

const reviewStateLabel: Record<ProblemReviewState, string> = {
  pre: '제출 전',
  hint: '힌트',
  revealed: '정답 공개',
}

const reviewStatusLabel: Record<ProblemReviewStatus, string> = {
  pass: '통과',
  blocked: '차단',
  stale: '해시 오래됨',
  missing: '기록 없음',
}

const selectClassName = (
  'min-h-[48px] w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-slate-50 '
  + 'px-4 text-sm font-semibold outline-none focus:border-cyan-500'
)

function uniqueValues(values: Array<string | null>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  ).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
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
    <div className="rounded-[1.5rem] border border-white/60 bg-white/85 p-4 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.4)]">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-black ${accent}`}>{value}</div>
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
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function StateButton({
  state,
  activeState,
  onSelect,
}: {
  state: ProblemReviewState
  activeState: ProblemReviewState
  onSelect: (state: ProblemReviewState) => void
}) {
  const active = state === activeState
  return (
    <button
      type="button"
      onClick={() => onSelect(state)}
      data-testid={`review-state-${state}`}
      aria-pressed={active}
      className={`min-h-[48px] rounded-2xl px-5 py-3 text-sm font-black transition ${
        active
          ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {reviewStateLabel[state]}
    </button>
  )
}

function updateReviewUrl(
  selection: ProblemReviewSelection,
) {
  const url = new URL(window.location.href)
  url.search = createProblemReviewQuery(selection)
  window.history.replaceState(null, '', url)
}

function answerText(row: ProblemReviewRow) {
  return row.correctChoiceLabel
    ? `${row.correctChoiceLabel} ${row.correctAnswer}`
    : row.correctAnswer
}

function filterProblemReviewRows(rows: ProblemReviewRow[], filters: ReviewFilters) {
  const normalizedSearch = filters.search.trim().toLowerCase()
  return rows.filter(row => {
    if (filters.gradeFilter !== 'all' && String(row.grade) !== filters.gradeFilter) return false
    if (filters.visualOnly && !row.hasVisual) return false
    if (filters.semesterFilter !== 'all' && (row.semester ?? 'none') !== filters.semesterFilter) return false
    if (filters.unitFilter !== 'all' && row.unitId !== filters.unitFilter) return false
    if (filters.conceptFilter !== 'all' && row.conceptId !== filters.conceptFilter) return false
    if (filters.familyFilter !== 'all' && row.family !== filters.familyFilter) return false
    if (
      filters.taskActionFilter !== 'all'
      && !row.taskActions.some(action => action === filters.taskActionFilter)
    ) return false
    if (filters.answerKindFilter !== 'all' && row.answerKind !== filters.answerKindFilter) return false
    if (filters.visualKindFilter !== 'all' && (row.visualKind ?? 'none') !== filters.visualKindFilter) return false
    if (filters.visualSemanticsFilter !== 'all' && row.visualSemantics !== filters.visualSemanticsFilter) return false
    if (filters.reviewStatusFilter !== 'all' && row.reviewStatus !== filters.reviewStatusFilter) return false
    if (!normalizedSearch) return true
    return [
      row.reviewId, row.sourceId, row.groupTitle, row.unitTitle, row.prompt,
      row.family, row.curriculumCodes.join(' '), row.taskActions.join(' '),
      row.visualKind ?? '',
    ].join(' ').toLowerCase().includes(normalizedSearch)
  })
}

export default function ProblemReviewClient(props: ProblemReviewClientProps) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydration,
    getServerHydration,
  )

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-700">
        <p className="mx-auto max-w-xl rounded-2xl bg-white p-5 text-center font-bold shadow-sm">
          검수 데이터를 준비하고 있습니다.
        </p>
      </main>
    )
  }

  return <HydratedProblemReviewClient {...props} />
}

function HydratedProblemReviewClient({ data }: ProblemReviewClientProps) {
  const defaultRow = data.rows.find(row => row.hasVisual) ?? data.rows[0]
  const querySelection = resolveProblemReviewQuery(
    data.rows,
    window.location.search,
  )
  const [selection, setSelection] = useState<ProblemReviewSelection>({
    reviewId: querySelection?.reviewId ?? defaultRow.reviewId,
    state: querySelection?.state ?? 'pre',
    variantKey: querySelection?.variantKey ?? defaultRow.variants[0].key,
  })
  const [filters, setFilters] = useState<ReviewFilters>({
    ...defaultReviewFilters,
    gradeFilter: (querySelection?.gradeFilter ?? 'all') as GradeFilter,
    visualOnly: querySelection?.visualOnly ?? true,
  })
  const {
    gradeFilter, visualOnly, search, semesterFilter, unitFilter, conceptFilter,
    familyFilter, taskActionFilter, answerKindFilter, visualKindFilter,
    visualSemanticsFilter, reviewStatusFilter,
  } = filters
  const filterOptions = useMemo(() => ({
    semesters: uniqueValues(data.rows.map(row => row.semester)),
    units: uniqueValues(data.rows.map(row => row.unitId)),
    concepts: uniqueValues(data.rows.map(row => row.conceptId)),
    families: uniqueValues(data.rows.map(row => row.family)),
    taskActions: uniqueValues(data.rows.flatMap(row => row.taskActions)),
    answerKinds: uniqueValues(data.rows.map(row => row.answerKind)),
    visualKinds: uniqueValues(data.rows.map(row => row.visualKind)),
    visualSemantics: uniqueValues(
      data.rows.map(row => row.visualSemantics)
    ),
  }), [data.rows])
  const unitTitleById = useMemo(() => new Map(
    data.rows.map(row => [row.unitId, row.unitTitle])
  ), [data.rows])
  const conceptTitleById = useMemo(() => new Map(
    data.rows
      .filter(row => row.conceptId !== null)
      .map(row => [row.conceptId as string, row.groupTitle])
  ), [data.rows])
  const filteredRows = useMemo(
    () => filterProblemReviewRows(data.rows, filters),
    [data.rows, filters],
  )

  const canonicalSelection = canonicalizeProblemReviewSelection(
    filteredRows,
    defaultRow,
    selection,
  )
  const canonicalReviewId = canonicalSelection.reviewId
  const canonicalReviewState = canonicalSelection.state
  const canonicalVariantKey = canonicalSelection.variantKey
  useEffect(() => {
    updateReviewUrl({
      reviewId: canonicalReviewId,
      state: canonicalReviewState,
      variantKey: canonicalVariantKey,
    })
  }, [
    canonicalReviewId,
    canonicalReviewState,
    canonicalVariantKey,
  ])
  const selectedRow = data.rows.find(
    row => row.reviewId === canonicalReviewId,
  ) ?? defaultRow
  const reviewState = canonicalReviewState
  const selectedIndex = filteredRows.findIndex(
    row => row.reviewId === selectedRow.reviewId
  )
  const selectedVariant = (
    selectedRow.variants.find(variant => variant.key === canonicalVariantKey)
    ?? selectedRow.variants[0]
  )
  const renderedRow: ProblemReviewRow = {
    ...selectedRow,
    ...selectedVariant,
    variants: selectedRow.variants,
  }

  const changeFilters = (changes: Partial<ReviewFilters>) => {
    const nextFilters = { ...filters, ...changes }
    const nextSelection = transitionProblemReviewSelection(
      canonicalSelection,
      filterProblemReviewRows(data.rows, nextFilters),
      defaultRow,
    )
    setFilters(nextFilters)
    setSelection(nextSelection)
    updateReviewUrl(nextSelection)
  }

  const selectRow = (row: ProblemReviewRow) => {
    const nextSelection = {
      reviewId: row.reviewId,
      state: reviewState,
      variantKey: row.variants[0].key,
    }
    setSelection(nextSelection)
    updateReviewUrl(nextSelection)
  }
  const selectState = (state: ProblemReviewState) => {
    const nextSelection = {
      reviewId: selectedRow.reviewId,
      state,
      variantKey: selectedVariant.key,
    }
    setSelection(nextSelection)
    updateReviewUrl(nextSelection)
  }
  const selectVariant = (variantKey: string) => {
    const nextSelection = {
      reviewId: selectedRow.reviewId,
      state: reviewState,
      variantKey,
    }
    setSelection(nextSelection)
    updateReviewUrl(nextSelection)
  }
  const selectRelative = (offset: number) => {
    if (filteredRows.length === 0) return
    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0
    const nextIndex = Math.min(
      filteredRows.length - 1,
      Math.max(0, currentIndex + offset)
    )
    selectRow(filteredRows[nextIndex])
  }
  const resetFilters = () => {
    changeFilters(defaultReviewFilters)
  }
  const exportEditorialLedger = () => {
    const ledger = {
      schemaVersion: 1,
      items: [...data.rows]
        .sort((left, right) => left.reviewId.localeCompare(right.reviewId))
        .map(row => ({
          reviewId: row.reviewId,
          contentHash: row.reviewedContentHash ?? row.contentHash,
          status: row.recordedReviewStatus ?? 'blocked',
          findingCategories: row.reviewFindingCategories,
          note: row.reviewNote,
          evidence: row.reviewEvidence ?? {
            editorialRead: false,
            variantAudit: false,
            preAnswer: row.hasVisual ? false : null,
            hint: row.hasVisual ? false : null,
            revealed: row.hasVisual ? false : null,
            mobile: row.hasVisual ? false : null,
            tablet: row.hasVisual ? false : null,
            artifacts: [],
          },
        })),
    }
    const blob = new Blob(
      [`${JSON.stringify(ledger, null, 2)}\n`],
      { type: 'application/json' }
    )
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'problem-editorial-review-v1.json'
    anchor.click()
    URL.revokeObjectURL(href)
  }

  return (
    <main className="relative left-1/2 w-screen max-w-[1600px] -translate-x-1/2 overflow-x-hidden bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_38%,#eef2ff_100%)] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#0e7490_100%)] px-6 py-8 text-white shadow-[0_35px_100px_-45px_rgba(15,23,42,0.85)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">
                Renderer Evidence Surface
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                1–6학년 문제 렌더러 검수
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">
                1,622개 원장을 하나의 review ID로 열고, 실제 학년별 시각
                컴포넌트의 제출 전·힌트·정답 공개 상태를 같은 표본에서
                비교합니다. 학습자 홈에는 노출되지 않는 내부 검수 화면입니다.
              </p>
            </div>
            <Link
              href="/home"
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/25 px-5 font-bold hover:bg-white/10"
            >
              학습 홈으로
            </Link>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          <StatCard label="전체 원장" value={data.summary.totalProblems} accent="text-slate-950" />
          <StatCard label="시각 항목" value={data.summary.totalVisualProblems} accent="text-cyan-700" />
          <StatCard label="검수 통과" value={data.summary.passProblems} accent="text-emerald-700" />
          <StatCard label="검수 차단" value={data.summary.blockedProblems} accent="text-rose-700" />
          <StatCard
            label="해시 오래됨"
            value={data.summary.staleProblems}
            accent="text-amber-700"
          />
          <StatCard label="객관식" value={data.summary.totalChoiceProblems} accent="text-emerald-700" />
          <StatCard label="주관식" value={data.summary.totalWrittenProblems} accent="text-violet-700" />
          <StatCard label="현재 목록" value={filteredRows.length} accent="text-rose-700" />
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_24px_75px_-45px_rgba(15,23,42,0.45)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="학년">
              <select
                value={gradeFilter}
                onChange={event => {
                  changeFilters({ gradeFilter: event.target.value as GradeFilter })
                }}
                data-testid="review-grade-filter"
                className={selectClassName}
              >
                <option value="all">전체 학년</option>
                {[1, 2, 3, 4, 5, 6].map(grade => (
                  <option key={grade} value={grade}>
                    {grade}학년 ({data.summary.byGrade[grade as 1 | 2 | 3 | 4 | 5 | 6]})
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="학기">
              <select
                value={semesterFilter}
                onChange={event => changeFilters({ semesterFilter: event.target.value })}
                data-testid="review-semester-filter"
                className={selectClassName}
              >
                <option value="all">전체 학기</option>
                <option value="none">학기 구분 없음</option>
                {filterOptions.semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="단원">
              <select
                value={unitFilter}
                onChange={event => changeFilters({ unitFilter: event.target.value })}
                data-testid="review-unit-filter"
                className={selectClassName}
              >
                <option value="all">전체 단원</option>
                {filterOptions.units.map(unitId => (
                  <option key={unitId} value={unitId}>
                    {unitTitleById.get(unitId) ?? unitId}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="개념">
              <select
                value={conceptFilter}
                onChange={event => changeFilters({ conceptFilter: event.target.value })}
                data-testid="review-concept-filter"
                className={selectClassName}
              >
                <option value="all">전체 개념</option>
                {filterOptions.concepts.map(conceptId => (
                  <option key={conceptId} value={conceptId}>
                    {conceptTitleById.get(conceptId) ?? conceptId}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="문제군">
              <select
                value={familyFilter}
                onChange={event => changeFilters({ familyFilter: event.target.value })}
                data-testid="review-family-filter"
                className={selectClassName}
              >
                <option value="all">전체 문제군</option>
                {filterOptions.families.map(family => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="학습 행동">
              <select
                value={taskActionFilter}
                onChange={event => changeFilters({ taskActionFilter: event.target.value })}
                data-testid="review-task-action-filter"
                className={selectClassName}
              >
                <option value="all">전체 행동</option>
                {filterOptions.taskActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="답 형식">
              <select
                value={answerKindFilter}
                onChange={event => changeFilters({ answerKindFilter: event.target.value })}
                data-testid="review-answer-kind-filter"
                className={selectClassName}
              >
                <option value="all">전체 답 형식</option>
                {filterOptions.answerKinds.map(answerKind => (
                  <option key={answerKind} value={answerKind}>{answerKind}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="범위">
              <select
                value={visualOnly ? 'visual' : 'all'}
                onChange={event => changeFilters({ visualOnly: event.target.value === 'visual' })}
                data-testid="review-visual-filter"
                className={selectClassName}
              >
                <option value="visual">시각 항목만</option>
                <option value="all">텍스트 포함 전체</option>
              </select>
            </FilterField>

            <FilterField label="시각 종류">
              <select
                value={visualKindFilter}
                onChange={event => changeFilters({ visualKindFilter: event.target.value })}
                data-testid="review-visual-kind-filter"
                className={selectClassName}
              >
                <option value="all">전체 시각 종류</option>
                <option value="none">시각 없음</option>
                {filterOptions.visualKinds.map(visualKind => (
                  <option key={visualKind} value={visualKind}>
                    {visualKind}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="시각 의미">
              <select
                value={visualSemanticsFilter}
                onChange={event => changeFilters({ visualSemanticsFilter: event.target.value })}
                data-testid="review-visual-semantics-filter"
                className={selectClassName}
              >
                <option value="all">전체 시각 의미</option>
                {filterOptions.visualSemantics.map(semantics => (
                  <option key={semantics} value={semantics}>{semantics}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="검수 상태">
              <select
                value={reviewStatusFilter}
                onChange={event => changeFilters({ reviewStatusFilter: event.target.value })}
                data-testid="review-status-filter"
                className={selectClassName}
              >
                <option value="all">전체 검수 상태</option>
                {(Object.keys(reviewStatusLabel) as ProblemReviewStatus[]).map(
                  status => (
                    <option key={status} value={status}>
                      {reviewStatusLabel[status]}
                    </option>
                  )
                )}
              </select>
            </FilterField>

            <FilterField label="review ID·문장 검색">
              <input
                value={search}
                onChange={event => changeFilters({ search: event.target.value })}
                placeholder="예: g3-2-graph-01, cuboid"
                data-testid="review-search"
                className={selectClassName}
              />
            </FilterField>

            <div className="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-4">
              <button
                type="button"
                onClick={() => selectRelative(-1)}
                disabled={selectedIndex <= 0}
                className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-4 font-bold disabled:opacity-40"
                aria-label="이전 검수 항목"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => selectRelative(1)}
                disabled={
                  selectedIndex < 0 || selectedIndex >= filteredRows.length - 1
                }
                className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-4 font-bold disabled:opacity-40"
                aria-label="다음 검수 항목"
              >
                다음
              </button>
              <button
                type="button"
                onClick={resetFilters}
                data-testid="review-reset-filters"
                className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-4 font-bold"
              >
                필터 초기화
              </button>
              <button
                type="button"
                onClick={exportEditorialLedger}
                data-testid="review-export-ledger"
                className="min-h-[48px] rounded-2xl bg-cyan-700 px-4 font-black text-white"
              >
                검수 JSON 내보내기
              </button>
            </div>
          </div>

          <FilterField label={`검수 항목 (${filteredRows.length}개)`}>
            <select
              value={selectedRow.reviewId}
              onChange={event => {
                const row = data.rows.find(
                  item => item.reviewId === event.target.value
                )
                if (row) selectRow(row)
              }}
              data-testid="review-source-select"
              className="mt-4 min-h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-cyan-500"
            >
              {filteredRows.map(row => (
                <option key={row.reviewId} value={row.reviewId}>
                  {row.reviewId} · {row.groupTitle} · {row.visualKind ?? '텍스트'}
                </option>
              ))}
            </select>
          </FilterField>
        </section>

        <article
          id="review-results"
          data-testid="problem-review-surface"
          data-review-id={selectedRow.reviewId}
          data-review-variant={selectedVariant.key}
          data-review-state={reviewState}
          data-review-grade={selectedRow.grade}
          data-review-has-visual={String(selectedRow.hasVisual)}
          data-review-visual-kind={selectedRow.visualKind ?? 'none'}
          data-review-status={selectedRow.reviewStatus}
          data-review-content-hash={selectedRow.contentHash}
          data-review-reviewed-hash={selectedRow.reviewedContentHash ?? 'missing'}
          data-review-answer-visible={String(reviewState === 'revealed')}
          className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.5)] md:p-7"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  {selectedRow.grade}학년
                </span>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">
                  {selectedRow.sourceKind}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                  {renderedRow.difficultyLabel}
                </span>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-800">
                  {selectedRow.visualKind ?? '시각 없음'}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    selectedRow.reviewStatus === 'pass'
                      ? 'bg-emerald-100 text-emerald-900'
                      : selectedRow.reviewStatus === 'blocked'
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-amber-100 text-amber-950'
                  }`}
                >
                  {reviewStatusLabel[selectedRow.reviewStatus]}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-black text-slate-950">
                {selectedRow.groupTitle}
              </h2>
              <p className="mt-1 font-mono text-xs leading-6 text-slate-500">
                {selectedRow.reviewId} · {renderedRow.sampleKey}
              </p>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="검수 상태">
              {(['pre', 'hint', 'revealed'] as const).map(state => (
                <StateButton
                  key={state}
                  state={state}
                  activeState={reviewState}
                  onSelect={selectState}
                />
              ))}
            </div>
          </div>

          <section className="mt-5 rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-4">
            <FilterField label={`숫자 경계 변형 (${selectedRow.variants.length}개)`}>
              <select
                value={selectedVariant.key}
                onChange={event => selectVariant(event.target.value)}
                data-testid="review-variant-select"
                className={`${selectClassName} bg-white`}
              >
                {selectedRow.variants.map(variant => (
                  <option key={variant.key} value={variant.key}>
                    {variant.label} · {variant.sampleKey}
                  </option>
                ))}
              </select>
            </FilterField>
          </section>

          <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
              문제
            </p>
            <div className="mt-3 overflow-x-auto text-xl font-bold leading-9 text-slate-950">
              <MathText>{renderedRow.prompt}</MathText>
            </div>
          </section>

          <section className="mt-5" aria-label="실제 문제 시각 렌더러">
            <ProblemReviewRenderer row={renderedRow} state={reviewState} />
          </section>

          {renderedRow.choices.length > 0 ? (
            <section
              data-testid="problem-review-choice-contract"
              className="mt-5 grid gap-3 sm:grid-cols-2"
            >
              {renderedRow.choices.map((choice, index) => {
                const label = CHOICE_LABELS[index]
                const isCorrect = choice === renderedRow.correctAnswer
                return (
                  <div
                    key={`${selectedRow.reviewId}-${index}`}
                    className={`rounded-2xl border px-4 py-3 ${
                      reviewState === 'revealed' && isCorrect
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <span className="mr-2 text-sm font-black text-slate-500">
                      {label}
                    </span>
                    <MathText>{choice}</MathText>
                  </div>
                )
              })}
            </section>
          ) : (
            <section
              data-testid="problem-review-input-contract"
              className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
            >
              <label className="text-sm font-black text-slate-800">
                {selectedRow.answerKind} 답 입력 형태
                <input
                  readOnly
                  value=""
                  placeholder="검수 화면에서는 입력하지 않습니다."
                  className="mt-2 min-h-[52px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-base"
                />
              </label>
            </section>
          )}

          {reviewState === 'hint' && (
            <section
              data-testid="problem-review-hints"
              className="mt-5 rounded-[1.75rem] border-2 border-amber-300 bg-amber-50 p-5"
            >
              <h3 className="font-black text-amber-900">단계 힌트</h3>
              <ol className="mt-3 space-y-2 text-sm font-semibold leading-7 text-slate-800">
                {renderedRow.hintSteps.map((step, index) => (
                  <li key={`${index}-${step}`}>
                    {index + 1}. <MathText>{step}</MathText>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {reviewState === 'revealed' && (
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
              <section
                data-testid="problem-review-answer"
                className="rounded-[1.75rem] bg-slate-950 p-5 text-white"
              >
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                  정답
                </h3>
                <div className="mt-3 overflow-x-auto text-lg font-black">
                  <MathText>{answerText(renderedRow)}</MathText>
                </div>
              </section>
              <section
                data-testid="problem-review-solution"
                className="rounded-[1.75rem] border-2 border-emerald-300 bg-emerald-50 p-5"
              >
                <h3 className="font-black text-emerald-900">풀이 공개</h3>
                <ol className="mt-3 space-y-2 text-sm font-semibold leading-7 text-slate-800">
                  {renderedRow.solutionSteps.map((step, index) => (
                    <li key={`${index}-${step}`}>
                      {index + 1}. <MathText>{step}</MathText>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}

          <section
            data-testid="problem-review-metadata"
            className="mt-5 grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2 xl:grid-cols-4"
          >
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                학기 · 단원 · 개념
              </div>
              <div className="mt-2 break-words font-bold text-slate-900">
                {selectedRow.semester ?? '학기 구분 없음'} · {selectedRow.unitId}
                {selectedRow.conceptId ? ` · ${selectedRow.conceptId}` : ''}
              </div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                문제군 · 답 형식
              </div>
              <div className="mt-2 break-words font-bold text-slate-900">
                {selectedRow.family} · {selectedRow.answerKind}
              </div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                학습 행동 · 시각 의미
              </div>
              <div className="mt-2 break-words font-bold text-slate-900">
                {selectedRow.taskActions.join(', ')} · {selectedRow.visualSemantics}
              </div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                성취기준
              </div>
              <div className="mt-2 break-words font-bold text-slate-900">
                {selectedRow.curriculumCodes.join(', ')}
              </div>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                최신 내용 해시 · 검수 해시 · 렌더러 버전
              </div>
              <div className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-700">
                {selectedRow.contentHash} ·{' '}
                {selectedRow.reviewedContentHash ?? '기록 없음'} ·{' '}
                {selectedRow.rendererReviewVersion}
              </div>
            </div>
          </section>

          {selectedRow.reviewStatus !== 'pass' && (
            <section
              data-testid="problem-review-status-note"
              className={`mt-4 rounded-[1.5rem] border-2 p-4 ${
                selectedRow.reviewStatus === 'blocked'
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-amber-300 bg-amber-50'
              }`}
            >
              <h3 className="font-black text-slate-950">
                {reviewStatusLabel[selectedRow.reviewStatus]} 검수 기록
              </h3>
              <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                {selectedRow.reviewNote}
              </p>
            </section>
          )}
        </article>
      </div>
    </main>
  )
}
