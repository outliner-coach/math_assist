import type { ProblemReviewState } from './ProblemReviewRenderer'

interface ReviewQueryRow {
  reviewId: string
  grade: number
  hasVisual: boolean
  variants: Array<{ key: string }>
}

export interface ProblemReviewSelection {
  reviewId: string
  state: ProblemReviewState
  variantKey: string
}

export interface ProblemReviewQuerySelection {
  reviewId: string
  gradeFilter: string
  visualOnly: boolean
  state: ProblemReviewState
  variantKey: string
}

export function canonicalizeProblemReviewSelection(
  filteredRows: ReviewQueryRow[],
  fallbackRow: ReviewQueryRow,
  preferred: ProblemReviewSelection,
): ProblemReviewSelection {
  const row = filteredRows.find(item => item.reviewId === preferred.reviewId)
    ?? filteredRows[0]
    ?? fallbackRow
  const variantKey = row.variants.some(variant => variant.key === preferred.variantKey)
    ? preferred.variantKey
    : row.variants[0].key

  return {
    reviewId: row.reviewId,
    state: preferred.state,
    variantKey,
  }
}

export function transitionProblemReviewSelection(
  current: ProblemReviewSelection,
  filteredRows: ReviewQueryRow[],
  fallbackRow: ReviewQueryRow,
): ProblemReviewSelection {
  return canonicalizeProblemReviewSelection(filteredRows, fallbackRow, current)
}

export function createProblemReviewQuery(selection: ProblemReviewSelection): string {
  const params = new URLSearchParams()
  params.set('id', selection.reviewId)
  params.set('state', selection.state)
  params.set('variant', selection.variantKey)
  return params.toString()
}

export function resolveProblemReviewQuery(
  rows: ReviewQueryRow[],
  search: string,
): ProblemReviewQuerySelection | null {
  const params = new URLSearchParams(search)
  const requestedRow = rows.find(row => row.reviewId === params.get('id'))
  if (!requestedRow) return null

  const requestedState = params.get('state')
  const state: ProblemReviewState = (
    requestedState === 'hint' || requestedState === 'revealed'
  ) ? requestedState : 'pre'
  const requestedVariant = params.get('variant')
  const variantKey = requestedRow.variants.some(
    variant => variant.key === requestedVariant,
  )
    ? requestedVariant as string
    : requestedRow.variants[0].key

  return {
    reviewId: requestedRow.reviewId,
    gradeFilter: String(requestedRow.grade),
    visualOnly: requestedRow.hasVisual,
    state,
    variantKey,
  }
}
