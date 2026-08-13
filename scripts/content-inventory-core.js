function stableCompare(left, right) {
  const leftText = String(left)
  const rightText = String(right)
  if (leftText < rightText) return -1
  if (leftText > rightText) return 1
  return 0
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

function normalizeText(value) {
  if (typeof value !== 'string') return ''
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function stripVariantPrefix(value) {
  let normalized = normalizeText(value)
  const prefix = /^(?:(?:challenge|retry)(?:[-_ ]?\d+)?|(?:재도전|도전|다시|한\s*번\s*더))\s*(?:[:：\-–—]\s*)?/u
  while (prefix.test(normalized)) normalized = normalized.replace(prefix, '')
  return normalized.trim()
}

function normalizeStandardCode(value) {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  return normalized.startsWith('[') && normalized.endsWith(']')
    ? normalized
    : `[${normalized.replace(/^\[|\]$/g, '')}]`
}

function normalizeCategory(value) {
  return stripVariantPrefix(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeSolutionRule(value) {
  return stripVariantPrefix(value)
    .replace(/(?<![\p{L}_])[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?/giu, '#')
    .replace(/\s+/g, '')
}

function normalizeList(value, normalizer = normalizeCategory) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(normalizer).filter(Boolean))].sort(stableCompare)
}

function signaturePayload(source) {
  return {
    curriculumStandards: normalizeList(
      source?.curriculumStandards,
      normalizeStandardCode
    ),
    problemFamily: normalizeCategory(source?.problemFamily),
    solutionRule: normalizeSolutionRule(source?.solutionRule),
    contextType: normalizeCategory(source?.contextType),
    representationTypes: normalizeList(source?.representationTypes),
    taskActions: normalizeList(source?.taskActions),
    reasoningPattern: normalizeCategory(source?.reasoningPattern),
  }
}

function buildCanonicalMathSignature(source) {
  return JSON.stringify(canonicalize(signaturePayload(source)))
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
    value.sourceId ?? '',
    value.field ?? '',
    value.conflictingSourceId ?? '',
    value.code ?? '',
    value.message ?? '',
  ].join('\u0000')
}

function sourceSortKey(value) {
  return [
    value.sourceId ?? '',
    value.canonicalMathSignature ?? '',
    value.origin ?? '',
    value.authoredSourceId ?? '',
  ].join('\u0000')
}

function validateRequiredSemantics(source, sourceId, errors) {
  const payload = signaturePayload(source)
  const requirements = [
    ['curriculumStandards', payload.curriculumStandards, 'missing_curriculum_standard', '성취기준이 없습니다.'],
    ['problemFamily', payload.problemFamily, 'missing_problem_family', '문제군이 없습니다.'],
    ['solutionRule', payload.solutionRule, 'missing_solution_rule', '정규화할 풀이 규칙이 없습니다.'],
    ['contextType', payload.contextType, 'missing_context_type', '맥락 유형이 없습니다.'],
    ['representationTypes', payload.representationTypes, 'missing_representation_type', '표현 유형이 없습니다.'],
    ['taskActions', payload.taskActions, 'missing_task_action', '학습자 과업 행동이 없습니다.'],
    ['reasoningPattern', payload.reasoningPattern, 'missing_reasoning_pattern', '추론 패턴이 없습니다.'],
  ]

  for (const [field, value, code, message] of requirements) {
    const missing = Array.isArray(value) ? value.length === 0 : !value
    if (missing) errors.push(createIssue(code, message, { field, sourceId }))
  }
}

function normalizeSourceId(source, index) {
  return typeof source?.reviewId === 'string' && source.reviewId.trim()
    ? source.reviewId.trim()
    : `publishedSources[missing:${buildCanonicalMathSignature(source)}]`
}

function buildContentInventory(input = {}) {
  const publishedSources = Array.isArray(input.publishedSources)
    ? input.publishedSources
    : []
  const sessionItems = Array.isArray(input.sessionItems)
    ? input.sessionItems
    : []
  const errors = []
  const sourceRecords = []

  for (const source of publishedSources) {
    const sourceId = normalizeSourceId(source)
    if (sourceId.startsWith('publishedSources[missing:')) {
      errors.push(createIssue(
        'missing_published_source_id',
        '공개 문제 원본에 reviewId가 없습니다.',
        { field: 'reviewId', sourceId }
      ))
    }
    if (source?.published !== true) {
      errors.push(createIssue(
        'source_not_published',
        `${sourceId}가 공개 원본으로 표시되지 않았습니다.`,
        { field: 'published', sourceId }
      ))
    }
    if (!['authored', 'generated_variant'].includes(source?.origin)) {
      errors.push(createIssue(
        'invalid_source_origin',
        `${sourceId}의 원본 유형이 유효하지 않습니다.`,
        { field: 'origin', sourceId }
      ))
    }
    if (
      source?.origin === 'generated_variant'
      && (typeof source?.authoredSourceId !== 'string' || !source.authoredSourceId.trim())
    ) {
      errors.push(createIssue(
        'missing_authored_source_id',
        `${sourceId} 변형의 작성 원본 ID가 없습니다.`,
        { field: 'authoredSourceId', sourceId }
      ))
    }

    validateRequiredSemantics(source, sourceId, errors)
    sourceRecords.push({
      authoredSourceId: typeof source?.authoredSourceId === 'string'
        ? source.authoredSourceId.trim()
        : undefined,
      canonicalMathSignature: buildCanonicalMathSignature(source),
      origin: source?.origin,
      published: source?.published === true,
      sourceId,
    })
  }

  sourceRecords.sort((left, right) => (
    stableCompare(sourceSortKey(left), sourceSortKey(right))
  ))
  const idGroups = new Map()
  for (const record of sourceRecords) {
    const entries = idGroups.get(record.sourceId) ?? []
    entries.push(record)
    idGroups.set(record.sourceId, entries)
  }
  for (const [sourceId, entries] of [...idGroups.entries()].sort(([left], [right]) => stableCompare(left, right))) {
    if (entries.length > 1) {
      errors.push(createIssue(
        'duplicate_published_source_id',
        `${sourceId}가 공개 원본 목록에 중복되었습니다.`,
        { field: 'reviewId', sourceId }
      ))
    }
  }

  const authoredById = new Map(
    sourceRecords
      .filter((record) => record.published && record.origin === 'authored')
      .map((record) => [record.sourceId, record])
  )
  const authoredBySignature = new Map()
  for (const record of [...authoredById.values()].sort((left, right) => stableCompare(left.sourceId, right.sourceId))) {
    const first = authoredBySignature.get(record.canonicalMathSignature)
    if (first) {
      errors.push(createIssue(
        'duplicate_authored_math_signature',
        `${record.sourceId}와 ${first.sourceId}는 숫자·ID·접두사·순서 차이를 제외하면 같은 작성 문제입니다.`,
        {
          field: 'canonicalMathSignature',
          sourceId: record.sourceId,
          conflictingSourceId: first.sourceId,
        }
      ))
    } else {
      authoredBySignature.set(record.canonicalMathSignature, record)
    }
  }

  for (const record of sourceRecords.filter((entry) => entry.published && entry.origin === 'generated_variant')) {
    if (!record.authoredSourceId) continue
    const authored = authoredById.get(record.authoredSourceId)
    if (!authored) {
      errors.push(createIssue(
        'unknown_authored_source_id',
        `${record.sourceId}가 지목한 작성 원본 ${record.authoredSourceId}를 찾을 수 없습니다.`,
        { field: 'authoredSourceId', sourceId: record.sourceId }
      ))
    } else if (record.canonicalMathSignature !== authored.canonicalMathSignature) {
      errors.push(createIssue(
        'generated_variant_signature_mismatch',
        `${record.sourceId}의 수학 서명이 작성 원본 ${record.authoredSourceId}와 다릅니다.`,
        {
          field: 'canonicalMathSignature',
          sourceId: record.sourceId,
          conflictingSourceId: record.authoredSourceId,
        }
      ))
    }
  }

  const sessionFixtureRows = sessionItems
    .map((item) => ({
      item,
      itemId: typeof item?.itemId === 'string' ? item.itemId.trim() : '',
      sessionId: typeof item?.sessionId === 'string' ? item.sessionId.trim() : '',
    }))
    .sort((left, right) => stableCompare(
      stableJson({ itemId: left.itemId, sessionId: left.sessionId }),
      stableJson({ itemId: right.itemId, sessionId: right.sessionId })
    ))
  const normalizedSessionItems = sessionFixtureRows.map(({ item, itemId, sessionId }, index) => {
    const sourceId = `sessionItems[${index}:${sessionId || '(missing-session)'}:${itemId || '(missing-item)'}]`
    if (typeof item?.sessionId !== 'string' || !item.sessionId.trim()) {
      errors.push(createIssue(
        'invalid_session_item',
        `${sourceId}에 sessionId가 없습니다.`,
        { field: 'sessionId', sourceId }
      ))
    }
    if (typeof item?.itemId !== 'string' || !item.itemId.trim()) {
      errors.push(createIssue(
        'invalid_session_item',
        `${sourceId}에 itemId가 없습니다.`,
        { field: 'itemId', sourceId }
      ))
    }
    return {
      itemId,
      sessionId,
    }
  }).sort((left, right) => stableCompare(
    `${left.sessionId}\u0000${left.itemId}`,
    `${right.sessionId}\u0000${right.itemId}`
  ))

  errors.sort((left, right) => stableCompare(issueSortKey(left), issueSortKey(right)))
  const publishedRecords = sourceRecords.filter((record) => record.published)

  return {
    counts: {
      publishedSourceCount: publishedRecords.length,
      authoredSourceCount: publishedRecords.filter((record) => record.origin === 'authored').length,
      canonicalMathSignatureCount: new Set(
        publishedRecords.map((record) => record.canonicalMathSignature)
      ).size,
      generatedVariantCount: publishedRecords.filter((record) => record.origin === 'generated_variant').length,
      sessionItemCount: normalizedSessionItems.length,
    },
    errors,
    sources: sourceRecords,
    sessionItems: normalizedSessionItems,
  }
}

function serializeContentInventory(result) {
  return stableJson({
    counts: result?.counts ?? {},
    errors: [...(result?.errors ?? [])]
      .sort((left, right) => stableCompare(issueSortKey(left), issueSortKey(right))),
    sources: [...(result?.sources ?? [])]
      .sort((left, right) => stableCompare(sourceSortKey(left), sourceSortKey(right))),
    sessionItems: [...(result?.sessionItems ?? [])]
      .sort((left, right) => stableCompare(
        `${left.sessionId}\u0000${left.itemId}`,
        `${right.sessionId}\u0000${right.itemId}`
      )),
  })
}

module.exports = {
  buildCanonicalMathSignature,
  buildContentInventory,
  serializeContentInventory,
}
