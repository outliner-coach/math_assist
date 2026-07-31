const PUBLISHED_SOURCE_KINDS = new Set(['mission', 'template'])

function normalizeStandardCode(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('[') && trimmed.endsWith(']')
    ? trimmed
    : `[${trimmed.replace(/^\[|\]$/g, '')}]`
}

function stableCompare(left, right) {
  const leftText = String(left)
  const rightText = String(right)
  if (leftText < rightText) return -1
  if (leftText > rightText) return 1
  return 0
}

function uniqueSorted(values) {
  return [...new Set(values)].sort(stableCompare)
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort(stableCompare)
        .map((key) => [key, canonicalize(value[key])])
    )
  }
  return value
}

function stableJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`
}

function createIssue(code, message, details = {}) {
  return {
    code,
    message,
    ...details,
  }
}

function issueSortKey(value) {
  return [
    value.standardCode ?? '',
    value.field ?? '',
    value.sourceRef ?? '',
    value.sourceId ?? '',
    value.code ?? '',
    value.message ?? '',
  ].join('\u0000')
}

function normalizeQualityStandards(source) {
  const standards = source?.qualityMetadata?.standards
  if (!Array.isArray(standards)) return []
  return uniqueSorted(
    standards
      .map(normalizeStandardCode)
      .filter(Boolean)
  )
}

function normalizeRefs(value) {
  if (!Array.isArray(value)) return []
  return uniqueSorted(
    value
      .filter((ref) => typeof ref === 'string' && ref.trim())
      .map((ref) => ref.trim())
  )
}

function buildPublishedSourceIndex(publishedSources, errors) {
  const grouped = new Map()
  for (const source of Array.isArray(publishedSources) ? publishedSources : []) {
    const reviewId = typeof source?.reviewId === 'string' ? source.reviewId.trim() : ''
    if (!reviewId) {
      errors.push(createIssue(
        'missing_published_source_id',
        '공개 문제 원본에 reviewId가 없습니다.',
        { field: 'reviewId', sourceId: '(unknown)' }
      ))
      continue
    }
    const entries = grouped.get(reviewId) ?? []
    entries.push(source)
    grouped.set(reviewId, entries)
  }

  const index = new Map()
  for (const reviewId of [...grouped.keys()].sort(stableCompare)) {
    const entries = grouped.get(reviewId)
    if (entries.length > 1) {
      errors.push(createIssue(
        'duplicate_published_source_id',
        `공개 문제 원본 ${reviewId}가 중복되었습니다.`,
        { field: 'reviewId', sourceId: reviewId }
      ))
      continue
    }

    const source = entries[0]
    if (source.published !== true || !PUBLISHED_SOURCE_KINDS.has(source.sourceKind)) {
      errors.push(createIssue(
        'invalid_published_source',
        `${reviewId}는 공개 mission/template 문제 원본이 아닙니다.`,
        { field: source.published !== true ? 'published' : 'sourceKind', sourceId: reviewId }
      ))
      continue
    }
    if (!Number.isInteger(source.grade) || source.grade < 1 || source.grade > 6) {
      errors.push(createIssue(
        'invalid_published_source_grade',
        `${reviewId}의 학년이 유효하지 않습니다.`,
        { field: 'grade', sourceId: reviewId }
      ))
      continue
    }

    const standards = normalizeQualityStandards(source)
    if (standards.length === 0) {
      errors.push(createIssue(
        'missing_source_quality_standard',
        `${reviewId}의 자체 품질 메타데이터에 성취기준이 없습니다.`,
        { field: 'qualityMetadata.standards', sourceId: reviewId }
      ))
      continue
    }

    index.set(reviewId, {
      grade: source.grade,
      reviewId,
      sourceKind: source.sourceKind,
      standards,
    })
  }
  return index
}

function validateReferenceList({
  allocation,
  field,
  index,
  requireAssignedGrade,
  errors,
}) {
  const standardCode = normalizeStandardCode(allocation?.standardCode)
  const assignedGrade = allocation?.assignedGrade
  const rawRefs = allocation?.[field]
  if (!Array.isArray(rawRefs)) {
    errors.push(createIssue(
      'invalid_content_refs',
      `${field}는 배열이어야 합니다.`,
      { field, standardCode }
    ))
    return []
  }

  const validRefs = []
  const seen = new Set()
  for (const rawRef of rawRefs) {
    const sourceRef = typeof rawRef === 'string' ? rawRef.trim() : ''
    if (!sourceRef) {
      errors.push(createIssue(
        'invalid_content_ref',
        `${field}에 비어 있는 문제 참조가 있습니다.`,
        { field, sourceRef: String(rawRef ?? ''), standardCode }
      ))
      continue
    }
    if (seen.has(sourceRef)) {
      errors.push(createIssue(
        field === 'directContentRefs'
          ? 'duplicate_direct_content_ref'
          : 'duplicate_review_content_ref',
        `${sourceRef}가 ${field}에 중복되었습니다.`,
        { field, sourceRef, standardCode }
      ))
      continue
    }
    seen.add(sourceRef)

    const source = index.get(sourceRef)
    if (!source) {
      errors.push(createIssue(
        field === 'directContentRefs'
          ? 'direct_ref_not_published_source'
          : 'review_ref_not_published_source',
        `${sourceRef}를 자체 품질 메타데이터가 있는 공개 문제 원본으로 찾을 수 없습니다.`,
        { field, sourceRef, standardCode }
      ))
      continue
    }

    if (requireAssignedGrade && source.grade !== assignedGrade) {
      errors.push(createIssue(
        'direct_ref_grade_mismatch',
        `${sourceRef}의 학년이 배정 학년 ${assignedGrade}와 다릅니다.`,
        { field, sourceRef, standardCode }
      ))
      continue
    }
    if (!requireAssignedGrade && source.grade === assignedGrade) {
      errors.push(createIssue(
        'review_ref_must_use_other_grade',
        `${sourceRef}는 배정 학년과 같아서 다른 학년 복습 참조가 될 수 없습니다.`,
        { field, sourceRef, standardCode }
      ))
      continue
    }
    if (!source.standards.includes(standardCode)) {
      errors.push(createIssue(
        requireAssignedGrade
          ? 'direct_ref_standard_mismatch'
          : 'review_ref_standard_mismatch',
        `${sourceRef}의 자체 품질 메타데이터가 ${standardCode}를 지목하지 않습니다.`,
        { field, sourceRef, standardCode }
      ))
      continue
    }

    validRefs.push(sourceRef)
  }

  return validRefs.sort(stableCompare)
}

function validateDirectCurriculumCoverage(input = {}) {
  const errors = []
  const allocations = Array.isArray(input.allocations) ? input.allocations : []
  const sourceIndex = buildPublishedSourceIndex(input.publishedSources, errors)
  const allocationGroups = new Map()

  for (const allocation of allocations) {
    const standardCode = normalizeStandardCode(allocation?.standardCode)
    const entries = allocationGroups.get(standardCode) ?? []
    entries.push(allocation)
    allocationGroups.set(standardCode, entries)
  }

  const coverage = []
  for (const standardCode of [...allocationGroups.keys()].sort(stableCompare)) {
    const entries = allocationGroups.get(standardCode)
      .map((entry) => ({
        entry,
        key: stableJson(canonicalize(entry)),
      }))
      .sort((left, right) => stableCompare(left.key, right.key))
      .map(({ entry }) => entry)
    if (!standardCode) {
      errors.push(createIssue(
        'missing_standard_code',
        '성취기준 코드가 없습니다.',
        { field: 'standardCode', standardCode }
      ))
      continue
    }
    if (entries.length > 1) {
      errors.push(createIssue(
        'duplicate_standard_allocation',
        `${standardCode}의 배정 학년 행이 중복되었습니다.`,
        { field: 'standardCode', standardCode }
      ))
    }

    const allocation = entries[0]
    if (!Number.isInteger(allocation?.assignedGrade) || allocation.assignedGrade < 1 || allocation.assignedGrade > 6) {
      errors.push(createIssue(
        'invalid_assigned_grade',
        `${standardCode}의 배정 학년이 유효하지 않습니다.`,
        { field: 'assignedGrade', standardCode }
      ))
    }

    const directContentRefs = validateReferenceList({
      allocation,
      field: 'directContentRefs',
      index: sourceIndex,
      requireAssignedGrade: true,
      errors,
    })
    const reviewContentRefs = validateReferenceList({
      allocation,
      field: 'reviewContentRefs',
      index: sourceIndex,
      requireAssignedGrade: false,
      errors,
    })
    if (normalizeRefs(allocation?.directContentRefs).length === 0) {
      errors.push(createIssue(
        'missing_direct_content_ref',
        `${standardCode}에 배정 학년의 공개 문제 직접 참조가 없습니다.`,
        { field: 'directContentRefs', standardCode }
      ))
    }

    coverage.push({
      assignedGrade: allocation?.assignedGrade,
      directContentRefs,
      directlyCovered: directContentRefs.length > 0,
      reviewContentRefs,
      standardCode,
    })
  }

  errors.sort((left, right) => stableCompare(issueSortKey(left), issueSortKey(right)))
  coverage.sort((left, right) => stableCompare(left.standardCode, right.standardCode))

  return {
    errors,
    summary: {
      standardDenominator: coverage.length,
      directlyCoveredStandardCount: coverage.filter((entry) => entry.directlyCovered).length,
      directContentLinkCount: coverage.reduce((sum, entry) => sum + entry.directContentRefs.length, 0),
      reviewContentLinkCount: coverage.reduce((sum, entry) => sum + entry.reviewContentRefs.length, 0),
    },
    coverage,
  }
}

function serializeDirectCoverageResult(result) {
  return stableJson({
    errors: [...(result?.errors ?? [])].sort((left, right) => (
      stableCompare(issueSortKey(left), issueSortKey(right))
    )),
    summary: result?.summary ?? {},
    coverage: [...(result?.coverage ?? [])]
      .map((entry) => ({
        ...entry,
        directContentRefs: uniqueSorted(entry.directContentRefs ?? []),
        reviewContentRefs: uniqueSorted(entry.reviewContentRefs ?? []),
      }))
      .sort((left, right) => stableCompare(left.standardCode, right.standardCode)),
  })
}

module.exports = {
  serializeDirectCoverageResult,
  validateDirectCurriculumCoverage,
}
