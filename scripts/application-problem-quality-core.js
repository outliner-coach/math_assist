const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const ROOT_DIR = path.join(__dirname, '..')

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function familyKey(family) {
  return `${family?.familyId ?? 'unknown'}@${family?.version ?? 'unknown'}`
}

function issue(code, message, context = {}) {
  return {
    severity: 'error',
    code,
    message,
    ...(context.packId ? { packId: context.packId } : {}),
    ...(context.family ? { familyId: context.family.familyId, familyVersion: context.family.version, family: familyKey(context.family) } : {}),
    ...(Number.isSafeInteger(context.seed) ? { seed: context.seed } : {}),
    ...(context.corpusId ? { corpusId: context.corpusId } : {}),
  }
}

function approvalIsBacked(family) {
  const approval = family?.approval
  return family?.releaseStatus !== 'approved' || (
    approval?.ownerStatus === 'approved' &&
    typeof approval?.ownerId === 'string' && approval.ownerId.trim() !== '' &&
    typeof approval?.approvedAt === 'string' && !Number.isNaN(Date.parse(approval.approvedAt)) &&
    Array.isArray(approval?.evidenceRefs) && approval.evidenceRefs.length > 0 &&
    approval.evidenceRefs.every((reference) => typeof reference === 'string' && reference.trim() !== '' && !reference.startsWith('/') && !reference.split('/').includes('..'))
  )
}

function isFamilyShapeValid(family) {
  return family &&
    family.schemaVersion === 'application-problem-family-v1' &&
    typeof family.familyId === 'string' &&
    Number.isSafeInteger(family.version) && family.version > 0 &&
    typeof family.packId === 'string' &&
    typeof family.unitId === 'string'
}

function checkPacksAndFamilies(input, errors) {
  const packs = Array.isArray(input.packs) ? input.packs : []
  const families = Array.isArray(input.families) ? input.families : []
  const familyByKey = new Map()
  const packById = new Map()
  const familiesById = new Map()
  const structures = new Map()
  const ledger = new Map((input.ledgerAllocations ?? []).map((allocation) => [allocation.standardCode, allocation]))

  for (const family of families) {
    if (!isFamilyShapeValid(family)) {
      errors.push(issue('APQ_FAMILY_SCHEMA', 'family schema or identity is invalid', { family }))
      continue
    }
    const key = familyKey(family)
    if (familyByKey.has(key)) {
      errors.push(issue('APQ_DUPLICATE_FAMILY_VERSION', `family version ${key} is declared more than once`, { family }))
    }
    familyByKey.set(key, family)
    const versions = familiesById.get(family.familyId) ?? []
    versions.push(family)
    familiesById.set(family.familyId, versions)
    const structure = stableJson([family.unitId, family.modelId, family.unknownRole, family.reasoningPattern, family.requiredStudentActions])
    const first = structures.get(structure)
    if (first && first.familyId !== family.familyId) {
      errors.push(issue('APQ_DUPLICATE_STRUCTURE', `${family.familyId} repeats ${first.familyId}'s reasoning structure`, { family }))
    } else if (!first) {
      structures.set(structure, family)
    }
    if (family.reasoningPattern === 'direct' || (Array.isArray(family.requiredStudentActions) && family.requiredStudentActions.length === 1 && family.requiredStudentActions[0] === 'execute_calculation')) {
      errors.push(issue('APQ_APPLICATION_REASONING', 'application family cannot be direct or calculation-only', { family }))
    }
    if (!approvalIsBacked(family)) {
      errors.push(issue('APQ_APPROVAL_EVIDENCE', 'approved family requires owner identity, timestamp, and repository evidence', { family }))
    }
  }

  for (const [familyId, versions] of familiesById) {
    const ordered = versions.map((family) => family.version).sort((left, right) => left - right)
    for (let index = 0; index < ordered.length; index += 1) {
      if (ordered[index] !== index + 1) {
        errors.push(issue('APQ_VERSION_CONTINUITY', `${familyId} must start at v1 and use consecutive versions`, { family: versions[0] }))
        break
      }
    }
  }

  for (const pack of packs) {
    if (!pack || pack.schemaVersion !== 'unit-knowledge-pack-v1' || typeof pack.packId !== 'string' || !Number.isSafeInteger(pack.version)) {
      errors.push(issue('APQ_PACK_SCHEMA', 'unit knowledge pack schema or identity is invalid', { packId: pack?.packId }))
      continue
    }
    const existing = packById.get(pack.packId)
    if (existing && (existing.unitId !== pack.unitId || existing.grade !== pack.grade || existing.semester !== pack.semester)) {
      errors.push(issue('APQ_PACK_ID_REUSED', `${pack.packId} is reused for another unit identity`, { packId: pack.packId }))
    }
    packById.set(pack.packId, pack)
    const concepts = new Set((pack.concepts ?? []).map((concept) => concept.conceptId))
    const misconceptions = new Set((pack.concepts ?? []).flatMap((concept) => (concept.misconceptions ?? []).map((entry) => entry.id)))
    const standards = new Set(pack.coveredStandardCodes ?? [])
    for (const standard of standards) {
      const allocation = ledger.get(standard)
      if (!allocation || allocation.unitId !== pack.unitId || allocation.assignedGrade !== pack.grade || allocation.semester !== pack.semester) {
        errors.push(issue('APQ_LEDGER_REFERENCE', `${standard} has no matching curriculum ledger allocation for ${pack.packId}`, { packId: pack.packId }))
      }
    }
    for (const concept of pack.concepts ?? []) {
      for (const standard of concept.standardCodes ?? []) {
        if (!standards.has(standard) || !ledger.has(standard)) {
          errors.push(issue('APQ_LEDGER_REFERENCE', `${concept.conceptId} references a missing or out-of-pack standard`, { packId: pack.packId }))
        }
      }
      for (const prerequisite of concept.prerequisites ?? []) {
        if ((prerequisite.kind === 'concept' && !concepts.has(prerequisite.conceptId)) || (prerequisite.kind === 'standard' && !ledger.has(prerequisite.standardCode))) {
          errors.push(issue('APQ_LEDGER_REFERENCE', `${concept.conceptId} has an unresolved prerequisite`, { packId: pack.packId }))
        }
      }
    }
    for (const reference of pack.familyRefs ?? []) {
      const family = familyByKey.get(`${reference?.familyId}@${reference?.version}`)
      if (!family || family.packId !== pack.packId || family.unitId !== pack.unitId) {
        errors.push(issue('APQ_PACK_REFERENCE', `pack ${pack.packId} has an unknown or mismatched family reference`, { packId: pack.packId, family }))
        continue
      }
      for (const conceptId of family.conceptIds ?? []) {
        if (!concepts.has(conceptId)) errors.push(issue('APQ_CURRICULUM_SCOPE', `${conceptId} is outside ${pack.packId}`, { packId: pack.packId, family }))
      }
      for (const standard of [family.primaryStandard, ...(family.connectedStandards ?? [])]) {
        if (!standards.has(standard)) errors.push(issue('APQ_CURRICULUM_SCOPE', `${standard} is outside ${pack.packId}`, { packId: pack.packId, family }))
      }
      for (const misconceptionId of family.misconceptionRefs ?? []) {
        if (!misconceptions.has(misconceptionId)) errors.push(issue('APQ_MISCONCEPTION_REFERENCE', `${misconceptionId} is not declared by ${pack.packId}`, { packId: pack.packId, family }))
      }
    }
  }

  for (const family of families) {
    const pack = packById.get(family.packId)
    if (packs.length > 0 && !pack) {
      errors.push(issue('APQ_PACK_REFERENCE', `${familyKey(family)} has no knowledge pack`, { family }))
    } else if (pack) {
      const concepts = new Set((pack.concepts ?? []).map((concept) => concept.conceptId))
      if ((family.conceptIds ?? []).some((conceptId) => !concepts.has(conceptId))) {
        errors.push(issue('APQ_CURRICULUM_SCOPE', `${familyKey(family)} uses a concept outside its pack`, { packId: pack.packId, family }))
      }
    }
  }
  return { familyByKey, packById }
}

function checkRegistries(input, familyByKey, errors) {
  for (const registry of input.registries ?? []) {
    const ledger = new Map((registry.releaseLedger ?? []).map((family) => [familyKey(family), family]))
    for (const entry of registry.entries ?? []) {
      const family = entry?.family
      const key = familyKey(family)
      const ledgerFamily = ledger.get(key)
      if (!ledgerFamily || stableJson(ledgerFamily) !== stableJson(family)) {
        errors.push(issue('APQ_RELEASE_LEDGER', 'runtime entry must exactly match one immutable ledger family', { family }))
      }
      if (family?.releaseStatus === 'quarantined' || family?.releaseStatus === 'retired') {
        errors.push(issue('APQ_BLOCKED_RELEASE_CANDIDATE', `${key} cannot be a new runtime candidate`, { family }))
      }
      if (family?.releaseStatus === 'approved' && !approvalIsBacked(family)) {
        errors.push(issue('APQ_APPROVAL_EVIDENCE', 'approved runtime candidate has no approval evidence', { family }))
      }
      if (entry?.runtime?.kind !== family?.runtimeMode) {
        errors.push(issue('APQ_RUNTIME_MODE', 'runtime mode does not match family declaration', { family }))
      }
    }
  }
}

function checkEvidence(input, errors) {
  const authorities = Array.isArray(input.proofAuthorities) ? input.proofAuthorities : []
  for (const family of input.families ?? []) {
    const authority = authorities.find((candidate) => candidate.familyId === family.familyId && candidate.familyVersion === family.version)
    if (!authority || authority.mode !== family.proofMode || !Number.isSafeInteger(authority.expectedCount) || authority.expectedCount < 1) {
      errors.push(issue('APQ_PROOF_AUTHORITY', 'family requires a matching independent proof authority with a non-empty domain', { family }))
    }
  }
  for (const snapshot of input.generatedSnapshots ?? []) {
    if (stableJson(snapshot.first) !== stableJson(snapshot.second)) {
      errors.push(issue('APQ_NON_DETERMINISTIC_OUTPUT', 'same family, seed, and variant generated different output', { family: snapshot.family, seed: snapshot.seed }))
    }
    const allowedMisconceptions = new Set(snapshot.family?.misconceptionRefs ?? [])
    if ((snapshot.first?.misconceptionRefs ?? []).some((reference) => !allowedMisconceptions.has(reference)) || !(snapshot.first?.hintSteps ?? []).length) {
      errors.push(issue('APQ_GENERATED_MISCONCEPTION', 'generated distractor or hints do not match the family misconception contract', { family: snapshot.family, seed: snapshot.seed }))
    }
  }
  for (const proof of input.proofReports ?? []) {
    if (proof.mode !== proof.family?.proofMode) {
      errors.push(issue('APQ_PROOF_MODE', 'proof mode cannot substitute for the family-declared mode', { family: proof.family }))
    }
    if (!proof.proven || !Number.isSafeInteger(proof.checkedCount) || proof.checkedCount < 1 || (proof.issues ?? []).length > 0) {
      errors.push(issue(proof.mode === 'static-corpus' ? 'APQ_PROOF_STATIC_CORPUS' : 'APQ_PROOF_EVIDENCE', 'proof evidence is incomplete or failed', { family: proof.family, corpusId: proof.corpusId }))
    }
    if (proof.mode === 'static-corpus' && (!Array.isArray(proof.corpusIds) || proof.corpusIds.length === 0)) {
      errors.push(issue('APQ_PROOF_STATIC_CORPUS', 'static corpus proof must include reviewed corpus ids', { family: proof.family }))
    }
  }
  for (const result of input.oracleResults ?? []) {
    const answer = result.problem?.answer?.normalized
    const steps = result.problem?.solutionSteps ?? []
    const matches = answer === result.answer && steps.includes(result.solution)
    const unitMatches = !result.unit || `${result.problem?.prompt ?? ''} ${(steps).join(' ')}`.includes(result.unit)
    const choices = result.problem?.choices
    const choiceMatches = result.problem?.answer?.format !== 'choice' || (
      Array.isArray(choices) &&
      choices.length === 4 &&
      new Set(choices).size === 4 &&
      choices[result.problem?.correctChoiceIndex] === result.problem?.answer?.normalized
    )
    if (!matches || !unitMatches || !choiceMatches) errors.push(issue('APQ_ORACLE_MISMATCH', 'independent oracle disagrees with answer, solution, unit, or choices', { family: result.family }))
  }
  for (const result of input.visualResults ?? []) {
    if (!result.valid) errors.push(issue('APQ_QUANTITATIVE_VISUAL', result.reason ?? 'quantitative visual validation failed', { family: result.family }))
  }
  for (const result of input.answerExposureResults ?? []) {
    if (result.exposed) errors.push(issue('APQ_ANSWER_EXPOSURE', 'answer-only value is visible before submission', { family: result.family }))
  }
}

function checkSessionContracts(input, errors) {
  for (const contract of input.sessionContracts ?? []) {
    const distribution = contract.difficultyDistribution ?? {}
    const expected = contract.grade === 2 ? { easy: 48, medium: 48, applied: 48 }
      : contract.grade === 5 ? { 1: 4, 2: 4, 3: 2 }
        : contract.sessionCount === 10 ? { 1: 4, 2: 4, 3: 2 } : { 1: 2, 2: 2, 3: 1 }
    const validCount = contract.grade === 2 ? contract.legacyCount === 144 && contract.sessionCount === 144
      : contract.grade === 5 ? contract.legacyCount === 10 && contract.sessionCount === 10
        : contract.grade === 6 && contract.legacyCount === 10 && [5, 10].includes(contract.sessionCount)
    const expectedStorage = contract.grade === 2 ? 'mathAssist_grade2Progress_v3'
      : contract.grade === 5 ? 'mathAssist_grade5CurrentSession' : 'mathAssist_grade6CurrentSession'
    const validDistribution = Object.entries(expected).every(([key, value]) => distribution[key] === value)
    if (!validCount || !validDistribution || contract.storageKey !== expectedStorage) {
      errors.push(issue('APQ_SESSION_CONTRACT', `Grade ${contract.grade} session count, difficulty distribution, or storage identity regressed`))
    }
  }
}

function buildPackReports(packs, families) {
  if (packs.length === 0) {
    return Array.from(new Map(families.map((family) => [family.packId, family])).entries()).map(([packId, family]) => ({
      packId,
      standardCodes: [family.primaryStandard, ...(family.connectedStandards ?? [])],
      conceptIds: family.conceptIds ?? [],
      cognitiveDomains: [family.cognitiveDomain],
      reasoningPatterns: [family.reasoningPattern],
      representations: family.representations ?? [],
      misconceptionRefs: family.misconceptionRefs ?? [],
      releaseStatus: 'draft-unregistered',
      approvalStatus: 'pending',
    }))
  }
  return packs.map((pack) => {
    const entries = families.filter((family) => family.packId === pack.packId)
    return {
      packId: pack.packId,
      standardCodes: pack.coveredStandardCodes ?? [],
      conceptIds: (pack.concepts ?? []).map((concept) => concept.conceptId),
      cognitiveDomains: Array.from(new Set(entries.map((family) => family.cognitiveDomain))).sort(),
      reasoningPatterns: Array.from(new Set(entries.map((family) => family.reasoningPattern))).sort(),
      representations: Array.from(new Set(entries.flatMap((family) => family.representations ?? []))).sort(),
      misconceptionRefs: Array.from(new Set(entries.flatMap((family) => family.misconceptionRefs ?? []))).sort(),
      releaseStatus: pack.releaseStatus,
      approvalStatus: pack.approval?.ownerStatus ?? 'pending',
    }
  })
}

function auditApplicationProblemQuality(input) {
  const errors = []
  const packs = Array.isArray(input?.packs) ? input.packs : []
  const families = Array.isArray(input?.families) ? input.families : []
  const { familyByKey } = checkPacksAndFamilies(input ?? {}, errors)
  checkRegistries(input ?? {}, familyByKey, errors)
  checkEvidence(input ?? {}, errors)
  checkSessionContracts(input ?? {}, errors)
  const draftFamilyCount = families.filter((family) => family.releaseStatus === 'draft').length
  const approvedFamilyCount = families.filter((family) => family.releaseStatus === 'approved').length
  return {
    summary: {
      packCount: packs.length,
      familyCount: families.length,
      draftFamilyCount,
      approvedFamilyCount,
      errorCount: errors.length,
    },
    packReports: buildPackReports(packs, families),
    errors,
  }
}

function loadTypeScriptModule(relativePath) {
  const previous = require.extensions['.ts']
  require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8')
    module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename)
  }
  try {
    return require(path.join(ROOT_DIR, relativePath))
  } finally {
    if (previous) require.extensions['.ts'] = previous
    else delete require.extensions['.ts']
  }
}

function loadProductionApplicationProblemQualityInput() {
  const { APPLICATION_PROBLEM_REGISTRY_V1 } = loadTypeScriptModule('src/lib/application-problems/registered-families.ts')
  const registries = [
    ['grade2', 'src/lib/application-problems/grade2-registry.ts'],
    ['grade5', 'src/lib/application-problems/grade5-registry.ts'],
    ['grade6', 'src/lib/application-problems/grade6-registry.ts'],
  ].map(([grade, source]) => {
    const module = loadTypeScriptModule(source)
    return { grade, ...(module[`${grade.toUpperCase()}_APPLICATION_PROBLEM_REGISTRY_V1`] ?? {}) }
  })
  const packsDirectory = path.join(ROOT_DIR, 'public', 'data', 'application-problems', 'packs')
  const packs = fs.readdirSync(packsDirectory)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(packsDirectory, file), 'utf8')))
  const ledgerAllocations = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'public', 'data', 'curriculum-allocations-v1.json'), 'utf8'),
  ).allocations
  const g2Proof = loadTypeScriptModule('src/lib/application-problems/families/g2-length-proof-registration.ts')
  const g5Proof = loadTypeScriptModule('src/lib/application-problems/families/grade5-geometry-proof-registration.ts')
  const g6Proof = loadTypeScriptModule('src/lib/application-problems/families/g6-ratio-proof.ts')
  const proofAuthorities = [
    ...(g2Proof.G2_LENGTH_PROOF_AUTHORITY_ENTRIES ?? []).map((entry) => ({
      familyId: entry.manifest.familyId,
      familyVersion: entry.manifest.familyVersion,
      mode: entry.manifest.mode,
      expectedCount: entry.manifest.expectedCount,
    })),
    ...(g5Proof.G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1 ?? []).map((entry) => ({
      familyId: entry.familyId,
      familyVersion: entry.familyVersion,
      mode: entry.mode,
      expectedCount: entry.expectedCount,
    })),
    ...(g6Proof.G6_RATIO_PROOF_AUTHORITIES ?? []).map((entry) => ({
      familyId: entry.manifest.familyId,
      familyVersion: entry.manifest.familyVersion,
      mode: entry.manifest.mode,
      expectedCount: entry.manifest.expectedCount,
    })),
  ]
  return {
    packs,
    ledgerAllocations,
    families: APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger,
    registries,
    generatedSnapshots: [],
    proofAuthorities,
    proofReports: [],
    oracleResults: [],
    visualResults: [],
    answerExposureResults: [],
    sessionContracts: [
      { grade: 2, legacyCount: 144, candidateCount: 0, sessionCount: 144, difficultyDistribution: { easy: 48, medium: 48, applied: 48 }, storageKey: 'mathAssist_grade2Progress_v3' },
      { grade: 5, legacyCount: 10, candidateCount: 0, sessionCount: 10, difficultyDistribution: { 1: 4, 2: 4, 3: 2 }, storageKey: 'mathAssist_grade5CurrentSession' },
      { grade: 6, legacyCount: 10, candidateCount: 0, sessionCount: 5, difficultyDistribution: { 1: 2, 2: 2, 3: 1 }, storageKey: 'mathAssist_grade6CurrentSession' },
    ],
  }
}

function generateApplicationProblemQualityReport() {
  return auditApplicationProblemQuality(loadProductionApplicationProblemQualityInput())
}

module.exports = {
  auditApplicationProblemQuality,
  generateApplicationProblemQualityReport,
  loadProductionApplicationProblemQualityInput,
}
