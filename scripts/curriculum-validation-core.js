const STANDARD_RANGES = Object.freeze({
  '4수01': 16,
  '4수02': 3,
  '4수03': 25,
  '4수04': 3,
  '6수01': 15,
  '6수02': 5,
  '6수03': 19,
  '6수04': 6,
})

const OFFICIAL_SOURCE_URL = 'https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&page=1&searchType=null&statusYN=W'
const REVIEW_STATUSES = new Set(['draft', 'curriculum-reviewed', 'released'])
const COVERAGE_STATUSES = new Set(['planned', 'existing-reference'])
const RELEASE_STATES = new Set(['not-released', 'release-candidate', 'released'])

function expectedStandardCodes() {
  return Object.entries(STANDARD_RANGES).flatMap(([prefix, count]) => (
    Array.from({ length: count }, (_, index) => `[${prefix}-${String(index + 1).padStart(2, '0')}]`)
  ))
}

function normalizeStandardCode(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed.startsWith('[') ? trimmed : `[${trimmed}]`
}

function issue(code, message, standardCode) {
  return {
    code,
    message,
    ...(standardCode ? { standardCode } : {}),
  }
}

function extractGrade3References(source) {
  return new Set(source.match(/\[4수(?:01|02|03|04)-\d{2}\]/g) ?? [])
}

function extractTemplateReferences(templates, allowedConceptIds) {
  const references = new Set()
  for (const [conceptId, templateList] of Object.entries(templates ?? {})) {
    if (allowedConceptIds && !allowedConceptIds.has(conceptId)) continue
    if (!Array.isArray(templateList)) continue
    for (const template of templateList) {
      const blueprint = template?.blueprint
      if (!blueprint) continue
      if (blueprint.primaryStandard) references.add(normalizeStandardCode(blueprint.primaryStandard))
      for (const connected of blueprint.connectedStandards ?? []) {
        references.add(normalizeStandardCode(connected))
      }
    }
  }
  return references
}

function extractSupportedGrades(source) {
  const match = source.match(/SUPPORTED_GRADES\s*=\s*\[([^\]]+)\]/)
  if (!match) return []
  return match[1]
    .split(',')
    .map((value) => Number(value.trim()))
    .filter(Number.isInteger)
}

function templateSupportsStandard(templates, conceptId, standardCode) {
  const templateList = templates?.[conceptId]
  return Array.isArray(templateList) && templateList
    .filter((template) => template?.concept_id === conceptId)
    .some((template) => {
      const blueprint = template?.blueprint
      if (!blueprint) return false
      return [blueprint.primaryStandard, ...(blueprint.connectedStandards ?? [])]
        .map(normalizeStandardCode)
        .includes(standardCode)
    })
}

function validateRecord(record, expectedSet, unitIds, conceptIds, templates, grade3Source, grade4Source) {
  const errors = []
  const standardCode = normalizeStandardCode(record?.standardCode)
  const expectedBand = standardCode.startsWith('[4수') ? '3-4' : standardCode.startsWith('[6수') ? '5-6' : null
  const allowedGrades = expectedBand === '3-4' ? [3, 4] : expectedBand === '5-6' ? [5, 6] : []

  if (!expectedSet.has(standardCode)) errors.push(issue('invalid_standard', '공식 학년군 코드가 아닙니다.', standardCode))
  if (record?.band !== expectedBand) errors.push(issue('band_mismatch', '코드와 학년군이 일치하지 않습니다.', standardCode))
  if (!allowedGrades.includes(record?.assignedGrade)) errors.push(issue('grade_mismatch', '배정 학년이 학년군 밖입니다.', standardCode))
  if (record?.semester !== `${record?.assignedGrade}-${record?.semester?.endsWith('-2') ? '2' : '1'}`) {
    errors.push(issue('semester_mismatch', '배정 학년과 학기가 일치하지 않습니다.', standardCode))
  }
  if (typeof record?.unitId !== 'string' || !record.unitId.trim()) errors.push(issue('missing_unit', 'unitId가 없습니다.', standardCode))
  if (record?.assignedGrade === 3 && !grade3Source.includes(`id: '${record.unitId}'`)) {
    errors.push(issue('unknown_grade3_unit', `현재 3학년 unit ${record.unitId}를 찾을 수 없습니다.`, standardCode))
  }
  if (record?.assignedGrade === 5 && !unitIds.has(record.unitId)) {
    errors.push(issue('unknown_grade5_unit', `현재 5학년 unit ${record.unitId}를 찾을 수 없습니다.`, standardCode))
  }
  if (record?.assignedGrade === 6 && record?.coverageStatus === 'existing-reference' && !unitIds.has(record.unitId)) {
    errors.push(issue('unknown_grade6_unit', `현재 6학년 unit ${record.unitId}를 찾을 수 없습니다.`, standardCode))
  }
  if (typeof record?.officialText !== 'string' || record.officialText.length < 10 || !record.officialText.endsWith('다.')) {
    errors.push(issue('invalid_official_text', '공식 성취기준 원문이 필요합니다.', standardCode))
  }
  if (record?.sourceUrl !== OFFICIAL_SOURCE_URL || !Number.isInteger(record?.sourcePage) || record.sourcePage < 1) {
    errors.push(issue('invalid_source', '교육부 원문 URL과 쪽수가 필요합니다.', standardCode))
  }
  if (!REVIEW_STATUSES.has(record?.reviewStatus)) errors.push(issue('invalid_review_status', 'reviewStatus가 유효하지 않습니다.', standardCode))
  if (!COVERAGE_STATUSES.has(record?.coverageStatus)) errors.push(issue('invalid_coverage_status', 'coverageStatus가 유효하지 않습니다.', standardCode))
  if (typeof record?.reviewedBy !== 'string' || !record.reviewedBy.trim()) errors.push(issue('missing_reviewer', '검토자가 없습니다.', standardCode))
  if (typeof record?.allocationRationale !== 'string' || !record.allocationRationale.trim()) errors.push(issue('missing_rationale', '학년 배정 근거가 없습니다.', standardCode))

  const prerequisites = Array.isArray(record?.prerequisiteCodes) ? record.prerequisiteCodes : []
  if (!Array.isArray(record?.prerequisiteCodes)) errors.push(issue('invalid_prerequisites', 'prerequisiteCodes는 배열이어야 합니다.', standardCode))
  for (const prerequisite of prerequisites) {
    const normalized = normalizeStandardCode(prerequisite)
    if (!expectedSet.has(normalized) || normalized === standardCode) {
      errors.push(issue('invalid_prerequisite', `유효하지 않은 선수 기준 ${prerequisite}`, standardCode))
    }
  }
  if (new Set(prerequisites.map(normalizeStandardCode)).size !== prerequisites.length) {
    errors.push(issue('duplicate_prerequisite', '선수 기준이 중복되었습니다.', standardCode))
  }

  const contentRefs = Array.isArray(record?.existingContentRefs) ? record.existingContentRefs : []
  if (record?.coverageStatus === 'existing-reference' && (record?.reviewStatus !== 'released' || contentRefs.length === 0)) {
    errors.push(issue('invalid_existing_coverage', '기존 참조는 released 상태와 콘텐츠 참조가 필요합니다.', standardCode))
  }
  if (record?.coverageStatus === 'planned' && contentRefs.length > 0) {
    errors.push(issue('planned_has_reference', 'planned 항목에 기존 콘텐츠 참조가 있습니다.', standardCode))
  }
  for (const ref of contentRefs) {
    if (ref.startsWith('grade3:')) {
      const unitId = ref.slice('grade3:'.length)
      if (record?.assignedGrade !== 3 || !grade3Source.includes(`id: '${unitId}'`) || !grade3Source.includes(standardCode)) {
        errors.push(issue('invalid_grade3_reference', `3학년 참조 ${ref}를 추적할 수 없습니다.`, standardCode))
      }
    } else if (ref.startsWith('grade4:')) {
      const [, unitId, contentReleaseId] = ref.split(':')
      if (
        record?.assignedGrade !== 4
        || !unitId
        || !contentReleaseId
        || !grade4Source.includes(`'${unitId}'`)
        || !grade4Source.includes(standardCode)
        || !grade4Source.includes(`'${contentReleaseId}'`)
      ) {
        errors.push(issue('invalid_grade4_reference', `4학년 참조 ${ref}를 출시 후보 은행에서 추적할 수 없습니다.`, standardCode))
      }
    } else if (ref.startsWith('grade5:')) {
      const conceptId = ref.slice('grade5:'.length)
      if (record?.assignedGrade !== 5 || !conceptIds.has(conceptId) || !templateSupportsStandard(templates, conceptId, standardCode)) {
        errors.push(issue('invalid_grade5_reference', `5학년 참조 ${ref}를 청사진에서 추적할 수 없습니다.`, standardCode))
      }
    } else if (ref.startsWith('grade6:')) {
      const conceptId = ref.slice('grade6:'.length)
      if (record?.assignedGrade !== 6 || !conceptIds.has(conceptId) || !templateSupportsStandard(templates, conceptId, standardCode)) {
        errors.push(issue('invalid_grade6_reference', `6학년 참조 ${ref}를 청사진에서 추적할 수 없습니다.`, standardCode))
      }
    } else {
      errors.push(issue('invalid_content_reference', `알 수 없는 콘텐츠 참조 ${ref}`, standardCode))
    }
  }
  return errors
}

function validateCurriculumLedger({ ledger, grade3Source = '', grade4Source = '', guestHomeSource = '', units = [], concepts = [], templates = {}, supportedGrades }) {
  const errors = []
  const expected = expectedStandardCodes()
  const expectedSet = new Set(expected)
  const allocations = Array.isArray(ledger?.allocations) ? ledger.allocations : []
  const unitIds = new Set(units.map((unit) => unit.id))
  const conceptIds = new Set(concepts.map((concept) => concept.id))
  const unitGradeById = new Map(units.map((unit) => [unit.id, unit.grade]))
  const grade5ConceptIds = new Set(concepts.filter((concept) => unitGradeById.get(concept.unit_id) === 5).map((concept) => concept.id))
  const grade6ConceptIds = new Set(concepts.filter((concept) => unitGradeById.get(concept.unit_id) === 6).map((concept) => concept.id))
  const counts = new Map()

  if (ledger?.schemaVersion !== '2022-math-allocation-v1') errors.push(issue('invalid_schema_version', '지원하지 않는 curriculum ledger 버전입니다.'))
  for (const grade of [4, 6]) {
    if (!RELEASE_STATES.has(ledger?.releaseState?.[`grade${grade}`])) {
      errors.push(issue('invalid_release_state', `${grade}학년 releaseState가 유효하지 않습니다.`))
    }
  }
  for (const allocation of allocations) {
    const standardCode = normalizeStandardCode(allocation?.standardCode)
    counts.set(standardCode, (counts.get(standardCode) ?? 0) + 1)
    errors.push(...validateRecord(allocation, expectedSet, unitIds, conceptIds, templates, grade3Source, grade4Source))
  }

  const missing = expected.filter((code) => !counts.has(code))
  const duplicates = [...counts].filter(([, count]) => count > 1).map(([code]) => code)
  for (const standardCode of missing) errors.push(issue('missing_standard', '공식 성취기준이 원장에서 누락되었습니다.', standardCode))
  for (const standardCode of duplicates) errors.push(issue('duplicate_standard', '성취기준이 원장에 중복되었습니다.', standardCode))

  const byCode = new Map(allocations.map((allocation) => [normalizeStandardCode(allocation.standardCode), allocation]))
  const grade3References = extractGrade3References(grade3Source)
  const grade4References = new Set(grade4Source.match(/\[4수(?:01|02|03|04)-\d{2}\]/g) ?? [])
  const grade5References = extractTemplateReferences(templates, grade5ConceptIds)
  const grade6References = extractTemplateReferences(templates, grade6ConceptIds)
  let untrackedReferenceCount = 0
  for (const standardCode of grade3References) {
    const allocation = byCode.get(standardCode)
    if (allocation?.assignedGrade !== 3 || allocation?.coverageStatus !== 'existing-reference') {
      errors.push(issue('untracked_grade3_reference', '현재 3학년 curriculumCode가 기존 참조로 배정되지 않았습니다.', standardCode))
      untrackedReferenceCount += 1
    }
  }
  for (const standardCode of grade4References) {
    const allocation = byCode.get(standardCode)
    if (allocation?.assignedGrade !== 4 || allocation?.coverageStatus !== 'existing-reference') {
      errors.push(issue('untracked_grade4_reference', '현재 4학년 출시 후보 코드가 기존 참조로 배정되지 않았습니다.', standardCode))
      untrackedReferenceCount += 1
    }
  }
  for (const standardCode of grade5References) {
    const allocation = byCode.get(standardCode)
    if (allocation?.assignedGrade !== 5 || allocation?.coverageStatus !== 'existing-reference') {
      errors.push(issue('untracked_grade5_reference', '현재 5학년 blueprint 코드가 기존 참조로 배정되지 않았습니다.', standardCode))
      untrackedReferenceCount += 1
    }
  }
  for (const standardCode of grade6References) {
    const allocation = byCode.get(standardCode)
    if (allocation?.assignedGrade !== 6 || allocation?.coverageStatus !== 'existing-reference') {
      errors.push(issue('untracked_grade6_reference', '현재 6학년 blueprint 코드가 기존 참조로 배정되지 않았습니다.', standardCode))
      untrackedReferenceCount += 1
    }
  }

  const effectiveSupportedGrades = supportedGrades ?? extractSupportedGrades(guestHomeSource)
  const releaseStates = { 4: ledger?.releaseState?.grade4, 6: ledger?.releaseState?.grade6 }
  const invalidExposureGrades = []
  for (const grade of [4, 6]) {
    const exposed = effectiveSupportedGrades.includes(grade)
    const state = releaseStates[grade]
    if (exposed && state !== 'released') {
      errors.push(issue('unreleased_grade_exposed', `${grade}학년은 released 상태 전에는 학습 가능 상태로 노출할 수 없습니다.`))
      invalidExposureGrades.push(grade)
    }
    if (!exposed && state === 'released') {
      errors.push(issue('released_grade_hidden', `${grade}학년은 released 상태이지만 홈에서 숨겨져 있습니다.`))
    }
    if (state !== 'not-released') {
      const releasedRefs = allocations.filter((allocation) => allocation.assignedGrade === grade && allocation.coverageStatus === 'existing-reference')
      if (releasedRefs.length === 0) errors.push(issue('release_without_content', `${grade}학년 ${state} 상태에 추적 가능한 콘텐츠가 없습니다.`))
    }
  }

  return {
    errors,
    summary: {
      total: allocations.length,
      grade34Total: allocations.filter((allocation) => allocation.band === '3-4').length,
      grade56Total: allocations.filter((allocation) => allocation.band === '5-6').length,
      missingCount: missing.length,
      duplicateCount: duplicates.length,
      existingReferenceCount: allocations.filter((allocation) => allocation.coverageStatus === 'existing-reference').length,
      grade3ReferenceCount: grade3References.size,
      grade4ReferenceCount: grade4References.size,
      grade5ReferenceCount: grade5References.size,
      grade6ReferenceCount: grade6References.size,
      untrackedReferenceCount,
      unreleasedGradeCount: invalidExposureGrades.length,
    },
  }
}

module.exports = {
  expectedStandardCodes,
  extractSupportedGrades,
  normalizeStandardCode,
  validateCurriculumLedger,
}
