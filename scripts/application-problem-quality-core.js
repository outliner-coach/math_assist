const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const ROOT_DIR = path.join(__dirname, '..')
const APPLICATION_AUDIT_MODES = new Set(['work', 'candidate', 'release', 'all'])
const FIXED_PILOT_PACK_REFS = [
  'pack-g2-2-length@1',
  'pack-unit-5-1-perimeter-area@1',
  'pack-unit-6-1-ratio@1',
]
const FIXED_PILOT_FAMILY_REFS = [
  'g2-length-route-total@1',
  'g2-length-missing-segment@1',
  'g2-length-claim-check@1',
  'g5-perimeter-boundary-rebuild@1',
  'g5-area-composite-inverse@1',
  'g5-area-overlap-reconstruction@1',
  'g6-ratio-part-whole@1',
  'g6-ratio-relative-comparison@1',
  'g6-ratio-representation-check@1',
]

function parseApplicationAuditSelection(argv) {
  let mode = 'work'
  let grade
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--mode') mode = argv[++index]
    else if (argument.startsWith('--mode=')) mode = argument.slice('--mode='.length)
    else if (argument === '--grade') grade = Number(argv[++index])
    else if (argument.startsWith('--grade=')) grade = Number(argument.slice('--grade='.length))
    else throw new TypeError(`unsupported application audit argument ${argument}`)
  }
  if (mode === 'grade-candidate') mode = 'candidate'
  if (!APPLICATION_AUDIT_MODES.has(mode)) {
    throw new TypeError(`unsupported application audit mode ${String(mode)}`)
  }
  if (mode === 'all') grade = 6
  if ((mode === 'candidate' || mode === 'release') && ![2, 3, 4, 5, 6].includes(grade)) {
    throw new TypeError(`${mode} mode requires --grade 2 through 6`)
  }
  return grade === undefined ? { mode } : { mode, grade }
}

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
    approval.evidenceRefs.every(isRepositoryEvidenceFile)
  )
}

function isRepositoryEvidenceFile(reference) {
  if (typeof reference !== 'string' || reference.trim() === '' || path.isAbsolute(reference)) return false
  const resolved = path.resolve(ROOT_DIR, reference)
  const relative = path.relative(ROOT_DIR, resolved)
  if (relative === '' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return false
  try {
    const entry = fs.lstatSync(resolved)
    if (!entry.isFile() || entry.isSymbolicLink()) return false
    const canonicalRoot = fs.realpathSync(ROOT_DIR)
    const canonicalEvidence = fs.realpathSync(resolved)
    const canonicalRelative = path.relative(canonicalRoot, canonicalEvidence)
    return canonicalRelative !== '' &&
      !canonicalRelative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(canonicalRelative)
  } catch {
    return false
  }
}

function isFamilyShapeValid(family) {
  return family &&
    family.schemaVersion === 'application-problem-family-v1' &&
    typeof family.familyId === 'string' &&
    Number.isSafeInteger(family.version) && family.version > 0 &&
    typeof family.packId === 'string' &&
    typeof family.unitId === 'string'
}

function isDeepFrozen(value, seen = new Set()) {
  if (!value || typeof value !== 'object') return true
  if (seen.has(value)) return true
  seen.add(value)
  return Object.isFrozen(value) && Object.values(value).every((entry) => isDeepFrozen(entry, seen))
}

function checkPacksAndFamilies(input, errors) {
  const packs = Array.isArray(input.packs) ? input.packs : []
  const families = Array.isArray(input.families) ? input.families : []
  const familyByKey = new Map()
  const packById = new Map()
  const familiesById = new Map()
  const structures = new Map()
  const ledger = new Map((input.ledgerAllocations ?? []).map((allocation) => [allocation.standardCode, allocation]))

  const validFamilies = families.filter(isFamilyShapeValid)
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

  for (const family of validFamilies) {
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
  return { familyByKey, packById, validFamilies }
}

function checkRegistries(input, errors, selection) {
  const canonicalLedger = Array.isArray(input.canonicalReleaseLedger)
    ? input.canonicalReleaseLedger
    : []
  const executableByKey = new Map()
  const ledgerByKey = new Map()
  for (const registry of input.registries ?? []) {
    for (const entry of registry.entries ?? []) {
      const family = entry?.family
      const key = familyKey(family)
      const executableEntries = executableByKey.get(key) ?? []
      executableEntries.push(entry)
      executableByKey.set(key, executableEntries)
      const localMatches = (registry.releaseLedger ?? []).filter((snapshot) => familyKey(snapshot) === key)
      const canonicalMatches = canonicalLedger.filter((snapshot) => familyKey(snapshot) === key)
      if (
        localMatches.length !== 1 ||
        canonicalMatches.length !== 1 ||
        !isDeepFrozen(localMatches[0]) ||
        !isDeepFrozen(canonicalMatches[0]) ||
        stableJson(localMatches[0]) !== stableJson(family) ||
        stableJson(canonicalMatches[0]) !== stableJson(family)
      ) {
        errors.push(issue('APQ_RELEASE_LEDGER', 'runtime entry must exactly match one immutable canonical release-ledger snapshot', { family }))
      }
      if (family?.releaseStatus === 'quarantined' || family?.releaseStatus === 'retired') {
        errors.push(issue('APQ_BLOCKED_RELEASE_CANDIDATE', `${key} cannot be a new runtime candidate`, { family }))
      }
      if (family?.releaseStatus === 'approved' && !approvalIsBacked(family)) {
        errors.push(issue('APQ_APPROVAL_EVIDENCE', 'approved runtime candidate has no approval evidence', { family }))
      }
      if (family?.releaseStatus !== 'approved' || !approvalIsBacked(family)) {
        errors.push(issue(
          selection.mode === 'release' || selection.mode === 'all'
            ? 'APQ_RELEASE_APPROVAL'
            : 'APQ_PRODUCTION_REGISTRY',
          'production registries require every executable family to have backed owner approval',
          { family },
        ))
      }
      if (entry?.runtime?.kind !== family?.runtimeMode) {
        errors.push(issue('APQ_RUNTIME_MODE', 'runtime mode does not match family declaration', { family }))
      }
    }
    for (const snapshot of registry.releaseLedger ?? []) {
      const key = familyKey(snapshot)
      const ledgerSnapshots = ledgerByKey.get(key) ?? []
      ledgerSnapshots.push(snapshot)
      ledgerByKey.set(key, ledgerSnapshots)
      const matchingEntries = (registry.entries ?? []).filter((entry) => familyKey(entry?.family) === key)
      if (
        matchingEntries.length !== 1 ||
        !isDeepFrozen(snapshot) ||
        stableJson(matchingEntries[0]?.family) !== stableJson(snapshot)
      ) {
        errors.push(issue(
          'APQ_RELEASE_LEDGER',
          'every production release-ledger snapshot must exactly match one executable entry',
          { family: snapshot },
        ))
      }
    }
  }

  const fixedPilotAudit = FIXED_PILOT_FAMILY_REFS.some((key) => (
    executableByKey.has(key) || ledgerByKey.has(key)
  )) || (input.packs ?? []).some((pack) => (
    FIXED_PILOT_PACK_REFS.includes(`${pack?.packId}@${pack?.version}`)
  ))
  if (fixedPilotAudit) {
    const canonicalByKey = new Map()
    for (const snapshot of canonicalLedger) {
      const key = familyKey(snapshot)
      const matches = canonicalByKey.get(key) ?? []
      matches.push(snapshot)
      canonicalByKey.set(key, matches)
    }
    for (const key of FIXED_PILOT_FAMILY_REFS) {
      const entries = executableByKey.get(key) ?? []
      const localSnapshots = ledgerByKey.get(key) ?? []
      const canonicalSnapshots = canonicalByKey.get(key) ?? []
      const canonical = canonicalSnapshots[0]
      if (
        entries.length !== 1 ||
        localSnapshots.length !== 1 ||
        canonicalSnapshots.length !== 1 ||
        !isDeepFrozen(localSnapshots[0]) ||
        !isDeepFrozen(canonical) ||
        stableJson(entries[0]?.family) !== stableJson(canonical) ||
        stableJson(localSnapshots[0]) !== stableJson(canonical)
      ) {
        errors.push(issue(
          'APQ_FIXED_PILOT_REGISTRY',
          `fixed pilot ${key} must retain exactly one unchanged executable entry and release-ledger snapshot`,
          { family: entries[0]?.family ?? localSnapshots[0] ?? canonical },
        ))
      }
    }
  }
}

function checkAuthoringContracts(input, errors) {
  if (!input.authoringCatalog) {
    return { catalog: input.authoringCatalog, separationValid: true, safetyValid: true }
  }
  try {
    const {
      createReviewOnlyAuthoringCatalog,
      validateAuthoringCatalogSafety,
      validateAuthoringProductionSeparation,
    } = loadTypeScriptModule('src/lib/application-problems/authoring-catalog.ts')
    const catalog = createReviewOnlyAuthoringCatalog(input.authoringCatalog)
    const separationIssues = validateAuthoringProductionSeparation({
      authoringCatalog: catalog,
      productionRegistries: input.registries ?? [],
      productionPacks: input.packs ?? [],
    })
    const safetyIssues = validateAuthoringCatalogSafety(catalog)
    separationIssues.forEach((contractIssue) => {
      errors.push(issue(
        'APQ_DRAFT_PRODUCTION_MIX',
        `${contractIssue.message} (${contractIssue.path})`,
      ))
    })
    safetyIssues.forEach((contractIssue) => {
      errors.push(issue(
        'APQ_DRAFT_SAFETY',
        `${contractIssue.message} (${contractIssue.path})`,
      ))
    })
    return {
      catalog,
      separationValid: separationIssues.length === 0,
      safetyValid: safetyIssues.length === 0,
    }
  } catch (error) {
    errors.push(issue(
      'APQ_DRAFT_SAFETY',
      `authoring catalog validation failed: ${error instanceof Error ? error.message : String(error)}`,
    ))
    return { catalog: input.authoringCatalog, separationValid: false, safetyValid: false }
  }
}

function checkEvidence(input, errors) {
  const families = Array.isArray(input.validFamilies) ? input.validFamilies : []
  const authorities = Array.isArray(input.proofAuthorities) ? input.proofAuthorities : []
  const sharedEvidenceByFamily = new Map((input.familyEvidence ?? []).map((evidence) => [
    `${evidence.familyId}@${evidence.version}`,
    evidence,
  ]))
  for (const family of families) {
    const authority = authorities.find((candidate) => candidate.familyId === family.familyId && candidate.familyVersion === family.version)
    if (!authority || authority.mode !== family.proofMode || !Number.isSafeInteger(authority.expectedCount) || authority.expectedCount < 1) {
      errors.push(issue('APQ_PROOF_AUTHORITY', 'family requires a matching independent proof authority with a non-empty domain', { family }))
    }
  }
  const evidenceKinds = [
    ['generatedSnapshots', 'APQ_GENERATION_EVIDENCE'],
    ['proofReports', 'APQ_PROOF_EVIDENCE'],
    ['oracleResults', 'APQ_ORACLE_EVIDENCE'],
    ['visualResults', 'APQ_QUANTITATIVE_VISUAL'],
    ['answerExposureResults', 'APQ_ANSWER_EXPOSURE'],
  ]
  for (const [property, code] of evidenceKinds) {
    const records = Array.isArray(input[property]) ? input[property] : []
    for (const family of families) {
      if (!records.some((record) => record?.family?.familyId === family.familyId && record.family.version === family.version)) {
        errors.push(issue(code, `${familyKey(family)} has no production ${property} evidence`, { family }))
      }
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
  const proofReportsByFamily = new Map((input.proofReports ?? []).map((proof) => [familyKey(proof.family), proof]))
  for (const family of families) {
    const sharedEvidence = sharedEvidenceByFamily.get(familyKey(family))
    const registeredProof = proofReportsByFamily.get(familyKey(family))
    const proof = sharedEvidence
      ? { family, ...sharedEvidence.proof }
      : registeredProof
    if (!proof) continue
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
    const matches = answer === result.answer
    const solutionMatches = result.solutionValid === undefined
      ? steps.includes(result.solution)
      : result.solutionValid === true
    const unitMatches = result.unitValid === undefined
      ? (!result.unit || `${result.problem?.prompt ?? ''} ${(steps).join(' ')}`.includes(result.unit))
      : result.unitValid === true
    const choices = result.problem?.choices
    const choiceMatches = result.problem?.answer?.format !== 'choice' || (
      Array.isArray(choices) &&
      choices.length >= 2 &&
      new Set(choices).size === choices.length &&
      choices[result.problem?.correctChoiceIndex] === result.problem?.answer?.normalized
    )
    if (!matches || !solutionMatches || !unitMatches || !choiceMatches) errors.push(issue('APQ_ORACLE_MISMATCH', 'independent oracle disagrees with answer, solution, unit, or choices', { family: result.family }))
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
    const grade2ReplacementEvidence = contract.grade !== 2 || (
      Number.isSafeInteger(contract.candidateCount) &&
      contract.candidateCount >= 0 &&
      contract.candidateCount <= 12 &&
      contract.replacementCount === contract.candidateCount &&
      Array.isArray(contract.replacementUnits) &&
      contract.replacementUnits.length === contract.candidateCount &&
      contract.replacementUnits.every((unit) => (
        unit.sessionCount === 6 &&
        unit.applicationCount === 1 &&
        unit.applicationDomain !== 'knowing' &&
        unit.stableIdentityCount === 6
      ))
    )
    const validCount = contract.grade === 2
      ? contract.legacyCount === 144 && contract.sessionCount === contract.legacyCount
      : contract.grade === 5 ? contract.legacyCount === 10 && contract.sessionCount === 10
        : contract.grade === 6 && contract.legacyCount === 10 && [5, 10].includes(contract.sessionCount)
    const expectedStorage = contract.grade === 2 ? 'mathAssist_grade2Progress'
      : contract.grade === 5 ? 'mathAssist_currentSession' : 'mathAssist_grade6CurrentSession'
    const validDistribution = Object.entries(expected).every(([key, value]) => distribution[key] === value)
    const grade6Evidence = contract.grade !== 6 || (
      Array.isArray(contract.generatedSessions) &&
      contract.generatedSessions.some((session) => (
        session.count === 5 && [1, 2, 3].every((level) => session.difficultyDistribution?.[level] === ({ 1: 2, 2: 2, 3: 1 })[level])
      )) &&
      contract.generatedSessions.some((session) => (
        session.count === 10 && [1, 2, 3].every((level) => session.difficultyDistribution?.[level] === ({ 1: 4, 2: 4, 3: 2 })[level])
      ))
    )
    if (
      !validCount ||
      !validDistribution ||
      !grade2ReplacementEvidence ||
      !grade6Evidence ||
      contract.storageKey !== expectedStorage
    ) {
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

function sameFixedRefs(actual, expected) {
  return Array.isArray(actual) &&
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((value, index) => value === expected[index])
}

function expectedBuildingGrade(releasedThroughGrade) {
  if (releasedThroughGrade === null) return 2
  if (releasedThroughGrade === 6) return null
  return releasedThroughGrade + 1
}

function rolloutIsValid(rollout) {
  return rollout?.schemaVersion === 'application-problem-rollout-v1' &&
    [null, 2, 3, 4, 5, 6].includes(rollout.releasedThroughGrade) &&
    [null, 2, 3, 4, 5, 6].includes(rollout.buildingGrade) &&
    rollout.buildingGrade === expectedBuildingGrade(rollout.releasedThroughGrade) &&
    sameFixedRefs(rollout.baselinePilotPackRefs, FIXED_PILOT_PACK_REFS) &&
    sameFixedRefs(rollout.baselinePilotFamilyRefs, FIXED_PILOT_FAMILY_REFS)
}

function sameStringSet(left, right) {
  return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length &&
    new Set(left).size === left.length &&
    new Set(right).size === right.length &&
    left.every((value) => right.includes(value))
}

function completePackIssues(input, pack, families, completeness) {
  if (pack.coverageStatus !== 'complete') return []
  const errors = []
  const assignedStandards = (input.ledgerAllocations ?? [])
    .filter((allocation) => allocation.unitId === pack.unitId && allocation.assignedGrade === pack.grade)
    .map((allocation) => allocation.standardCode)
  const covered = new Set(pack.coveredStandardCodes ?? [])
  if (assignedStandards.some((standard) => !covered.has(standard))) {
    errors.push('assigned standards')
  }
  const evidenceMatches = (input.unitBaseBankEvidence ?? []).filter((entry) => (
    entry.grade === pack.grade && entry.unitId === pack.unitId
  ))
  const canonicalEvidence = evidenceMatches.length === 1 ? evidenceMatches[0] : undefined
  if (!canonicalEvidence) errors.push('canonical unit evidence')
  const coreConceptIds = canonicalEvidence?.coreConceptIds ?? []
  if (!sameStringSet(completeness?.coreConceptIds, coreConceptIds)) {
    errors.push('canonical core concepts')
  }
  const conceptIds = new Set((pack.concepts ?? []).map((concept) => concept.conceptId))
  if (
    coreConceptIds.length === 0 ||
    coreConceptIds.some((conceptId) => !conceptIds.has(conceptId))
  ) {
    errors.push('core concepts')
  }
  const canonicalConceptUnits = new Map()
  for (const evidence of input.unitBaseBankEvidence ?? []) {
    for (const identity of evidence.conceptUnitIdentities ?? []) {
      const unitIds = canonicalConceptUnits.get(identity.conceptId) ?? new Set()
      unitIds.add(identity.unitId)
      canonicalConceptUnits.set(identity.conceptId, unitIds)
    }
  }
  if ((pack.concepts ?? []).some((concept) => {
    const unitIds = canonicalConceptUnits.get(concept.conceptId)
    return !unitIds || unitIds.size !== 1 || !unitIds.has(pack.unitId)
  })) {
    errors.push('canonical concept identity')
  }
  const familyKeys = new Set((pack.familyRefs ?? []).map((reference) => `${reference.familyId}@${reference.version}`))
  const packFamilies = families.filter((family) => familyKeys.has(familyKey(family)))
  if (coreConceptIds.some((conceptId) => !packFamilies.some((family) => (
    family.cognitiveDomain === 'applying' && (family.conceptIds ?? []).includes(conceptId)
  )))) errors.push('applying coverage')
  const reasoningFamilies = packFamilies.filter((family) => family.cognitiveDomain === 'reasoning')
  if (reasoningFamilies.length < 3) errors.push('reasoning families')
  if (new Set(reasoningFamilies.map((family) => family.reasoningPattern)).size < 3) {
    errors.push('reasoning patterns')
  }
  const usedMisconceptions = new Set(packFamilies.flatMap((family) => family.misconceptionRefs ?? []))
  if ((pack.concepts ?? []).flatMap((concept) => concept.misconceptions ?? [])
    .some((misconception) => !usedMisconceptions.has(misconception.id))) {
    errors.push('misconception use')
  }
  if (
    canonicalEvidence?.hasKnowingCoverage !== true ||
    !Array.isArray(canonicalEvidence?.knowingConceptIds) ||
    canonicalEvidence.knowingConceptIds.length === 0 ||
    completeness?.hasKnowingCoverage !== canonicalEvidence.hasKnowingCoverage
  ) errors.push('canonical knowing coverage')
  const represented = new Set(packFamilies.flatMap((family) => family.representations ?? []))
  const requiredRepresentations = canonicalEvidence?.requiredRepresentations ?? []
  if (!sameStringSet(completeness?.requiredRepresentations, requiredRepresentations)) {
    errors.push('canonical representations')
  }
  if (
    requiredRepresentations.length === 0 ||
    requiredRepresentations.some((representation) => !represented.has(representation))
  ) errors.push('representations')
  return errors
}

function buildRolloutReport(input, selection, errors) {
  const inventory = Array.isArray(input.unitInventory) ? input.unitInventory : []
  const gradeCounts = Object.fromEntries([2, 3, 4, 5, 6].map((grade) => [
    grade,
    inventory.filter((unit) => unit.grade === grade).length,
  ]))
  const identities = new Set(inventory.map((unit) => `${unit.grade}:${unit.unitId}`))
  if (
    inventory.length !== 62 || identities.size !== 62 ||
    [12, 12, 15, 12, 11].some((count, index) => gradeCounts[index + 2] !== count) ||
    inventory.some((unit) => unit.grade === 1)
  ) {
    errors.push(issue('APQ_UNIT_INVENTORY', 'application rollout inventory must be exactly Grades 2-6 with counts 12/12/15/12/11'))
  }
  const baseBankEvidence = Array.isArray(input.unitBaseBankEvidence)
    ? input.unitBaseBankEvidence
    : []
  const evidenceIdentities = new Set(baseBankEvidence.map((entry) => `${entry.grade}:${entry.unitId}`))
  const conceptOwners = new Map()
  let baseBankEvidenceInvalid = baseBankEvidence.length !== 62 || evidenceIdentities.size !== 62
  for (const evidence of baseBankEvidence) {
    const coreConceptIds = evidence.coreConceptIds ?? []
    const requiredRepresentations = evidence.requiredRepresentations ?? []
    const knowingConceptIds = evidence.knowingConceptIds ?? []
    const conceptUnitIdentities = evidence.conceptUnitIdentities ?? []
    if (
      !identities.has(`${evidence.grade}:${evidence.unitId}`) ||
      coreConceptIds.length === 0 || new Set(coreConceptIds).size !== coreConceptIds.length ||
      requiredRepresentations.length === 0 || new Set(requiredRepresentations).size !== requiredRepresentations.length ||
      evidence.hasKnowingCoverage !== (knowingConceptIds.length > 0) ||
      conceptUnitIdentities.length !== coreConceptIds.length ||
      coreConceptIds.some((conceptId) => !conceptUnitIdentities.some((identity) => (
        identity.conceptId === conceptId && identity.unitId === evidence.unitId
      )))
    ) baseBankEvidenceInvalid = true
    for (const conceptId of coreConceptIds) {
      const owners = conceptOwners.get(conceptId) ?? new Set()
      owners.add(evidence.unitId)
      conceptOwners.set(conceptId, owners)
    }
  }
  if (Array.from(conceptOwners.values()).some((owners) => owners.size !== 1)) {
    baseBankEvidenceInvalid = true
  }
  if (baseBankEvidenceInvalid) {
    errors.push(issue('APQ_BASE_BANK_EVIDENCE', 'canonical base-bank evidence must cover all 62 unit identities with concepts, representations, and knowing coverage'))
  }
  if (!rolloutIsValid(input.rollout)) {
    errors.push(issue('APQ_ROLLOUT_STATE', 'application rollout state or fixed pilot exception is invalid'))
  }
  const productionFamilyEntries = new Map()
  const productionFamilyLedger = new Map()
  for (const registry of input.registries ?? []) {
    for (const entry of registry.entries ?? []) {
      const key = familyKey(entry.family)
      const entries = productionFamilyEntries.get(key) ?? []
      entries.push(entry.family)
      productionFamilyEntries.set(key, entries)
    }
    for (const family of registry.releaseLedger ?? []) {
      const key = familyKey(family)
      const snapshots = productionFamilyLedger.get(key) ?? []
      snapshots.push(family)
      productionFamilyLedger.set(key, snapshots)
    }
  }
  const canonicalReleaseLedger = new Map()
  for (const family of input.canonicalReleaseLedger ?? []) {
    const key = familyKey(family)
    const snapshots = canonicalReleaseLedger.get(key) ?? []
    snapshots.push(family)
    canonicalReleaseLedger.set(key, snapshots)
  }
  const productionFamilyIsEligible = (reference) => {
    const key = `${reference.familyId}@${reference.version}`
    const entries = productionFamilyEntries.get(key) ?? []
    const localSnapshots = productionFamilyLedger.get(key) ?? []
    const canonicalSnapshots = canonicalReleaseLedger.get(key) ?? []
    return entries.length === 1 &&
      localSnapshots.length === 1 &&
      canonicalSnapshots.length === 1 &&
      entries[0].releaseStatus === 'approved' &&
      canonicalSnapshots[0].releaseStatus === 'approved' &&
      approvalIsBacked(entries[0]) &&
      approvalIsBacked(canonicalSnapshots[0]) &&
      isDeepFrozen(localSnapshots[0]) &&
      isDeepFrozen(canonicalSnapshots[0]) &&
      stableJson(entries[0]) === stableJson(localSnapshots[0]) &&
      stableJson(entries[0]) === stableJson(canonicalSnapshots[0])
  }
  const productionPlacementRefs = new Set(input.productionPlacementFamilyRefs ?? [])
  const pilotPacks = new Set(input.rollout?.baselinePilotPackRefs ?? [])
  const authoringUnits = input.authoringCatalog?.unitCandidates ?? []
  const productionPackByUnit = new Map()
  for (const pack of input.packs ?? []) {
    const key = `${pack.grade}:${pack.unitId}`
    const current = productionPackByUnit.get(key) ?? []
    current.push(pack)
    productionPackByUnit.set(key, current)
  }
  const authoringByUnit = new Map(authoringUnits.map((candidate) => [
    `${candidate.pack.grade}:${candidate.pack.unitId}`,
    candidate,
  ]))
  const productionPackRefs = new Set((input.packs ?? []).map((pack) => `${pack.packId}@${pack.version}`))
  const productionFamilyRefs = new Set([
    ...productionFamilyEntries.keys(),
    ...productionFamilyLedger.keys(),
  ])
  const completenessByPack = new Map((input.completeCoverageContexts ?? []).map((context) => [
    `${context.packId}@${context.version}`,
    context,
  ]))
  for (const pack of input.packs ?? []) {
    const failures = completePackIssues(
      input,
      pack,
      input.families ?? [],
      completenessByPack.get(`${pack.packId}@${pack.version}`),
    )
    if (failures.length > 0) {
      errors.push(issue(
        'APQ_COMPLETE_PACK_RULE',
        `complete pack ${pack.packId}@${pack.version} fails: ${failures.join(', ')}`,
        { packId: pack.packId },
      ))
    }
  }
  for (const authoring of authoringUnits) {
    const failures = completePackIssues(
      input,
      authoring.pack,
      authoring.familyCandidates.map((candidate) => candidate.family),
      authoring.completeness,
    )
    if (failures.length > 0) {
      errors.push(issue(
        'APQ_COMPLETE_PACK_RULE',
        `complete draft pack ${authoring.pack.packId}@${authoring.pack.version} fails: ${failures.join(', ')}`,
        { packId: authoring.pack.packId },
      ))
    }
  }

  const unitReports = inventory.map((unit) => {
    const key = `${unit.grade}:${unit.unitId}`
    const productionPacks = productionPackByUnit.get(key) ?? []
    const productionPack = productionPacks.find((pack) => pack.coverageStatus === 'complete')
    const pilotPack = productionPacks.find((pack) => pilotPacks.has(`${pack.packId}@${pack.version}`))
    const authoring = authoringByUnit.get(key)
    const productionComplete = Boolean(productionPack &&
      productionPack.releaseStatus === 'approved' &&
      approvalIsBacked(productionPack) &&
      completePackIssues(
        input,
        productionPack,
        input.families ?? [],
        completenessByPack.get(`${productionPack.packId}@${productionPack.version}`),
      ).length === 0 &&
      (productionPack.familyRefs ?? []).every((reference) => {
        const familyRef = `${reference.familyId}@${reference.version}`
        return productionFamilyIsEligible(reference) &&
          productionPlacementRefs.has(familyRef)
      }))
    const authoringFamilies = authoring?.familyCandidates?.map((candidate) => candidate.family) ?? []
    const candidateComplete = Boolean(authoring &&
      authoring.pack.coverageStatus === 'complete' &&
      authoring.pack.releaseStatus === 'draft' &&
      completePackIssues(input, authoring.pack, authoringFamilies, authoring.completeness).length === 0 &&
      input.authoringSafetyValid === true &&
      input.authoringSeparationValid === true &&
      authoring.familyCandidates.every((candidate) => {
        const familyRef = familyKey(candidate.family)
        return candidate.family.releaseStatus === 'draft' &&
          typeof candidate.oracle === 'function' &&
          typeof candidate.visualValidator === 'function' &&
          candidate.placementProposal?.cognitiveDomain === candidate.family.cognitiveDomain &&
          !productionFamilyRefs.has(familyRef)
      }) &&
      !productionPackRefs.has(`${authoring.pack.packId}@${authoring.pack.version}`))
    return {
      grade: unit.grade,
      unitId: unit.unitId,
      rolloutStatus: input.rollout?.buildingGrade !== null &&
        input.rollout?.buildingGrade !== undefined &&
        unit.grade > input.rollout.buildingGrade
        ? 'pending'
        : productionComplete
          ? 'released'
          : candidateComplete
            ? 'candidate'
            : pilotPack
              ? 'baseline-pilot'
              : productionPacks.length > 0 || authoring
                ? 'partial'
                : 'pending',
      baselinePilot: Boolean(pilotPack),
      packRefs: productionPacks.map((pack) => `${pack.packId}@${pack.version}`),
      gradeComplete: productionComplete || candidateComplete,
      productionComplete,
      candidateComplete,
    }
  })

  if (selection.mode === 'candidate') {
    if (selection.grade !== input.rollout?.buildingGrade) {
      errors.push(issue('APQ_ROLLOUT_MODE_GRADE', `candidate Grade ${selection.grade} must equal building Grade ${input.rollout?.buildingGrade}`))
    }
    const candidateUnits = unitReports.filter((unit) => unit.grade === selection.grade)
    if (candidateUnits.length === 0 || candidateUnits.some((unit) => !unit.candidateComplete)) {
      errors.push(issue('APQ_GRADE_CANDIDATE_INCOMPLETE', `Grade ${selection.grade} candidate must have complete, proof-safe, production-absent draft packs for every unit`))
    }
  } else if (selection.mode === 'release') {
    if (selection.grade !== input.rollout?.buildingGrade) {
      errors.push(issue('APQ_ROLLOUT_MODE_GRADE', `release Grade ${selection.grade} must equal building Grade ${input.rollout?.buildingGrade}`))
    }
    if (unitReports.some((unit) => unit.grade <= selection.grade && !unit.productionComplete)) {
      errors.push(issue('APQ_RELEASE_INCOMPLETE', `release through Grade ${selection.grade} requires complete approved production packs, ledgers, and placements`))
    }
  } else if (selection.mode === 'all') {
    if (input.rollout?.releasedThroughGrade !== 6 || input.rollout?.buildingGrade !== null) {
      errors.push(issue('APQ_ROLLOUT_STATE', 'all mode requires the terminal Grade 6/null rollout state'))
    }
    if (unitReports.length !== 62 || unitReports.some((unit) => !unit.productionComplete)) {
      errors.push(issue('APQ_RELEASE_INCOMPLETE', 'all mode requires all 62 units complete and learner-production eligible'))
    }
  } else {
    const releasedThroughGrade = input.rollout?.releasedThroughGrade
    if (
      releasedThroughGrade !== null && releasedThroughGrade !== undefined &&
      unitReports.some((unit) => unit.grade <= releasedThroughGrade && !unit.productionComplete)
    ) {
      errors.push(issue('APQ_RELEASE_INCOMPLETE', `released Grades through ${releasedThroughGrade} must remain complete in work mode`))
    }
  }
  return unitReports
}

function resolveAuditContractInput(input, errors) {
  const source = input ?? {}
  const authoringModule = loadTypeScriptModule('src/lib/application-problems/authoring-catalog.ts')
  const resolved = { ...source }
  if (source.unitInventory === undefined) {
    errors.push(issue('APQ_UNIT_INVENTORY_INPUT', 'audit input omitted unitInventory; canonical Grade 2-6 inventory was derived'))
    resolved.unitInventory = authoringModule.APPLICATION_UNIT_INVENTORY_V1
  }
  if (source.rollout === undefined) {
    errors.push(issue('APQ_ROLLOUT_INPUT', 'audit input omitted rollout; repository rollout state was derived'))
    resolved.rollout = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'public', 'data', 'application-problems', 'rollout.json'), 'utf8'),
    )
  }
  if (source.authoringCatalog === undefined) {
    resolved.authoringCatalog = authoringModule.APPLICATION_PROBLEM_AUTHORING_CATALOG_V1
  }
  const canonicalBaseBankEvidence = loadCanonicalUnitBaseBankEvidence(
    authoringModule.APPLICATION_UNIT_INVENTORY_V1,
  )
  if (
    source.unitBaseBankEvidence !== undefined &&
    stableJson(source.unitBaseBankEvidence) !== stableJson(canonicalBaseBankEvidence)
  ) {
    errors.push(issue(
      'APQ_BASE_BANK_EVIDENCE',
      'supplied base-bank evidence does not match repository-derived Grade 2-6 evidence',
    ))
  }
  resolved.unitBaseBankEvidence = canonicalBaseBankEvidence
  const { APPLICATION_PROBLEM_REGISTRY_V1 } = loadTypeScriptModule('src/lib/application-problems/registered-families.ts')
  resolved.canonicalReleaseLedger = APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger
  return resolved
}

function auditApplicationProblemQuality(input, selection = { mode: 'work' }) {
  const errors = []
  const resolvedInput = resolveAuditContractInput(input, errors)
  const packs = Array.isArray(resolvedInput.packs) ? resolvedInput.packs : []
  const families = Array.isArray(resolvedInput.families) ? resolvedInput.families : []
  const { validFamilies } = checkPacksAndFamilies(resolvedInput, errors)
  checkRegistries(resolvedInput, errors, selection)
  const authoringValidation = checkAuthoringContracts(resolvedInput, errors)
  const checkedInput = {
    ...resolvedInput,
    authoringCatalog: authoringValidation.catalog,
    authoringSafetyValid: authoringValidation.safetyValid,
    authoringSeparationValid: authoringValidation.separationValid,
  }
  checkEvidence({ ...checkedInput, validFamilies }, errors)
  checkSessionContracts(checkedInput, errors)
  const unitReports = buildRolloutReport(checkedInput, selection, errors)
  const draftFamilyCount = validFamilies.filter((family) => family.releaseStatus === 'draft').length
  const approvedFamilyCount = validFamilies.filter((family) => family.releaseStatus === 'approved').length
  return {
    summary: {
      packCount: packs.length,
      unitCount: unitReports.length,
      familyCount: families.length,
      draftFamilyCount,
      approvedFamilyCount,
      errorCount: errors.length,
    },
    packReports: buildPackReports(packs, validFamilies),
    unitReports,
    familyEvidence: resolvedInput.familyEvidence ?? [],
    errors,
  }
}

function loadTypeScriptModule(relativePath) {
  const previous = require.extensions['.ts']
  require.extensions['.ts'] = (loadedModule, filename) => {
    const source = fs.readFileSync(filename, 'utf8')
    loadedModule._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename)
  }
  try {
    return require(path.join(ROOT_DIR, relativePath))
  } finally {
    if (previous) require.extensions['.ts'] = previous
    else delete require.extensions['.ts']
  }
}

function generatedDifficultyDistribution(problems, templates) {
  const difficultyByTemplate = new Map((templates ?? []).map((template) => [template.id, template.difficulty]))
  return (problems ?? []).reduce((distribution, problem) => {
    const difficulty = difficultyByTemplate.get(problem.templateId) ?? problem.placementDifficulty
    if (difficulty) distribution[difficulty] = (distribution[difficulty] ?? 0) + 1
    return distribution
  }, {})
}

function grade2DifficultyDistribution(missions) {
  return (missions ?? []).reduce((distribution, mission) => {
    const difficulty = mission.difficultyStep
    if (typeof difficulty === 'string') distribution[difficulty] = (distribution[difficulty] ?? 0) + 1
    return distribution
  }, {})
}

function loadTemplateCatalog(filename, conceptId) {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'public', 'data', 'templates', filename), 'utf8'))
  const templates = Array.isArray(catalog) ? catalog : (catalog.templates ?? [])
  return templates.filter((template) => template.concept_id === conceptId)
}

function normalizeBaseBankRepresentation(value) {
  if (['text', 'equation', 'table', 'diagram', 'graph', 'manipulative'].includes(value)) return value
  const normalized = String(value ?? '').toLowerCase()
  if (normalized.includes('graph')) return 'graph'
  if (normalized.includes('table')) return 'table'
  if (normalized.includes('equation') || normalized.includes('operation') || normalized.includes('balance')) return 'equation'
  if (normalized === 'context') return 'text'
  return 'diagram'
}

function loadCanonicalUnitBaseBankEvidence(unitInventory) {
  const evidenceByUnit = new Map((unitInventory ?? []).map((unit) => [
    `${unit.grade}:${unit.unitId}`,
    {
      grade: unit.grade,
      unitId: unit.unitId,
      coreConceptIds: new Set(),
      requiredRepresentations: new Set(['text']),
      knowingConceptIds: new Set(),
    },
  ]))
  const recordTemplate = (grade, template, conceptId, representations) => {
    const evidence = evidenceByUnit.get(`${grade}:${template.unitId}`)
    if (!evidence || typeof conceptId !== 'string' || conceptId.length === 0) return
    evidence.coreConceptIds.add(conceptId)
    for (const representation of representations) {
      evidence.requiredRepresentations.add(normalizeBaseBankRepresentation(representation))
    }
    if (template.cognitiveDomain === 'knowing') evidence.knowingConceptIds.add(conceptId)
  }

  for (const grade of [2, 3, 4]) {
    const module = loadTypeScriptModule(`src/lib/grade${grade}-problems.ts`)
    for (const template of module[`grade${grade}MissionTemplates`] ?? []) {
      const conceptSource = grade === 4 ? template.problemFamily : template.skill
      const conceptId = `${template.unitId}-${conceptSource}`
      recordTemplate(
        grade,
        template,
        conceptId,
        [template.visualModel ?? template.representation],
      )
    }
  }

  const publicConcepts = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'public', 'data', 'concepts.json'), 'utf8'),
  )
  const conceptById = new Map(publicConcepts.map((concept) => [concept.id, concept]))
  for (const concept of publicConcepts) {
    const unit = (unitInventory ?? []).find((entry) => entry.unitId === concept.unit_id)
    if (!unit || (unit.grade !== 5 && unit.grade !== 6)) continue
    const evidence = evidenceByUnit.get(`${unit.grade}:${unit.unitId}`)
    evidence?.coreConceptIds.add(concept.id)
  }
  const templatesDirectory = path.join(ROOT_DIR, 'public', 'data', 'templates')
  for (const filename of fs.readdirSync(templatesDirectory).filter((entry) => entry.endsWith('.json')).sort()) {
    const source = JSON.parse(fs.readFileSync(path.join(templatesDirectory, filename), 'utf8'))
    const templates = Array.isArray(source) ? source : (source.templates ?? [])
    for (const template of templates) {
      const concept = conceptById.get(template.concept_id)
      if (!concept) continue
      const unit = (unitInventory ?? []).find((entry) => entry.unitId === concept.unit_id)
      if (!unit || (unit.grade !== 5 && unit.grade !== 6)) continue
      recordTemplate(
        unit.grade,
        { ...template, unitId: concept.unit_id, cognitiveDomain: template.blueprint?.cognitiveDomain },
        concept.id,
        template.blueprint?.representations ?? ['text'],
      )
    }
  }

  return (unitInventory ?? []).map((unit) => {
    const evidence = evidenceByUnit.get(`${unit.grade}:${unit.unitId}`)
    const coreConceptIds = Array.from(evidence?.coreConceptIds ?? []).sort()
    const knowingConceptIds = Array.from(evidence?.knowingConceptIds ?? []).sort()
    return {
      grade: unit.grade,
      unitId: unit.unitId,
      coreConceptIds,
      requiredRepresentations: Array.from(evidence?.requiredRepresentations ?? ['text']).sort(),
      knowingConceptIds,
      hasKnowingCoverage: knowingConceptIds.length > 0,
      conceptUnitIdentities: coreConceptIds.map((conceptId) => ({ conceptId, unitId: unit.unitId })),
    }
  })
}

function classifyStoredApplicationPacks(storedPacks, authoringCatalog) {
  const authoringPackRefs = new Set(
    (authoringCatalog?.unitCandidates ?? []).map(({ pack }) => `${pack?.packId}@${pack?.version}`),
  )
  const productionPacks = []
  const authoringPackFiles = []
  const unlinkedDraftPacks = []

  for (const pack of storedPacks ?? []) {
    if (pack?.releaseStatus !== 'draft') {
      productionPacks.push(pack)
      continue
    }
    const target = authoringPackRefs.has(`${pack?.packId}@${pack?.version}`)
      ? authoringPackFiles
      : unlinkedDraftPacks
    target.push(pack)
  }

  return { productionPacks, authoringPackFiles, unlinkedDraftPacks }
}

function loadProductionApplicationProblemQualityInput() {
  const { APPLICATION_PROBLEM_REGISTRY_V1 } = loadTypeScriptModule('src/lib/application-problems/registered-families.ts')
  const registries = [
    ['grade2', 'src/lib/application-problems/grade2-registry.ts'],
    ['grade5', 'src/lib/application-problems/grade5-registry.ts'],
    ['grade6', 'src/lib/application-problems/grade6-registry.ts'],
  ].map(([grade, source]) => {
    const registryModule = loadTypeScriptModule(source)
    return { grade, ...(registryModule[`${grade.toUpperCase()}_APPLICATION_PROBLEM_REGISTRY_V1`] ?? {}) }
  })
  const {
    APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
    APPLICATION_UNIT_INVENTORY_V1,
  } = loadTypeScriptModule('src/lib/application-problems/authoring-catalog.ts')
  const packsDirectory = path.join(ROOT_DIR, 'public', 'data', 'application-problems', 'packs')
  const storedPacks = fs.readdirSync(packsDirectory)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(packsDirectory, file), 'utf8')))
  const { productionPacks: packs } = classifyStoredApplicationPacks(
    storedPacks,
    APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
  )
  const rollout = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'public', 'data', 'application-problems', 'rollout.json'), 'utf8'),
  )
  const unitBaseBankEvidence = loadCanonicalUnitBaseBankEvidence(APPLICATION_UNIT_INVENTORY_V1)
  const ledgerAllocations = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'public', 'data', 'curriculum-allocations-v1.json'), 'utf8'),
  ).allocations
  const { getProductionApplicationFamilyEvidence } = loadTypeScriptModule('src/lib/application-problems/quality-evidence.ts')
  const productionEvidence = getProductionApplicationFamilyEvidence()
  const { getGrade2Missions } = loadTypeScriptModule('src/lib/grade2-problems.ts')
  const { buildApprovedGrade2ApplicationMissions, buildGrade2MissionCatalog } = loadTypeScriptModule('src/lib/application-problems/grade2-runtime.ts')
  const { buildApprovedGrade5PracticeProblemCandidates } = loadTypeScriptModule('src/lib/application-problems/grade5-practice-runtime.ts')
  const { buildApprovedGrade6PracticeProblemCandidates } = loadTypeScriptModule('src/lib/application-problems/grade6-practice-runtime.ts')
  const { generateProblems } = loadTypeScriptModule('src/lib/problem-generator.ts')
  const { GRADE2_PROGRESS_KEY } = loadTypeScriptModule('src/lib/grade2-progress.ts')
  const { GRADE5_SESSION_KEY, GRADE6_SESSION_KEY } = loadTypeScriptModule('src/lib/session.ts')
  const grade2Seed = 27
  const grade2LegacyMissions = getGrade2Missions(grade2Seed)
  const grade2Candidates = buildApprovedGrade2ApplicationMissions(grade2Seed)
  const grade2Catalog = buildGrade2MissionCatalog(grade2Seed)
  const grade2CatalogMissions = grade2Catalog.status === 'ready' ? grade2Catalog.missions : []
  const grade2ReplacementUnits = grade2Candidates.map((candidate) => {
    const practice = grade2CatalogMissions.filter((mission) => (
      mission.unitId === candidate.unitId && mission.mode === 'practice'
    ))
    return {
      unitId: candidate.unitId,
      sessionCount: practice.length,
      applicationCount: practice.filter((mission) => (
        mission.applicationSource?.schemaVersion === 'generated-application-problem-v1'
      )).length,
      applicationDomain: candidate.cognitiveDomain,
      stableIdentityCount: new Set(practice.map((mission) => mission.id)).size,
    }
  })
  const grade5Templates = loadTemplateCatalog('area.json', 'area-001')
  const grade6Templates = loadTemplateCatalog('g6ratio.json', 'g6ratio-001')
  const grade5Candidates = buildApprovedGrade5PracticeProblemCandidates({ conceptId: 'area-001' })
  const grade6Candidates = buildApprovedGrade6PracticeProblemCandidates({ conceptId: 'g6ratio-001' })
  const grade5Problems = generateProblems(grade5Templates, { count: 10, setId: 'A', difficultyMix: { 1: 4, 2: 4, 3: 2 }, seed: 205, additionalCandidates: grade5Candidates })
  const grade6Problems5 = generateProblems(grade6Templates, { count: 5, setId: 'A', difficultyMix: { 1: 2, 2: 2, 3: 1 }, seed: 206, additionalCandidates: grade6Candidates })
  const grade6Problems10 = generateProblems(grade6Templates, { count: 10, setId: 'A', difficultyMix: { 1: 4, 2: 4, 3: 2 }, seed: 207, additionalCandidates: grade6Candidates })
  return {
    packs,
    rollout,
    authoringCatalog: APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
    unitInventory: APPLICATION_UNIT_INVENTORY_V1,
    unitBaseBankEvidence,
    canonicalReleaseLedger: APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger,
    completeCoverageContexts: [],
    productionPlacementFamilyRefs: FIXED_PILOT_FAMILY_REFS,
    ledgerAllocations,
    families: APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger,
    registries,
    generatedSnapshots: productionEvidence.generatedSnapshots,
    proofAuthorities: productionEvidence.proofAuthorities,
    proofReports: productionEvidence.proofReports,
    oracleResults: productionEvidence.oracleResults,
    visualResults: productionEvidence.visualResults,
    answerExposureResults: productionEvidence.answerExposureResults,
    familyEvidence: productionEvidence.rows,
    sessionContracts: [
      {
        grade: 2,
        legacyCount: grade2LegacyMissions.length,
        candidateCount: grade2Candidates.length,
        sessionCount: grade2CatalogMissions.length,
        replacementCount: grade2CatalogMissions.filter((mission) => (
          mission.applicationSource?.schemaVersion === 'generated-application-problem-v1'
        )).length,
        replacementUnits: grade2ReplacementUnits,
        difficultyDistribution: grade2DifficultyDistribution(grade2CatalogMissions),
        storageKey: GRADE2_PROGRESS_KEY,
      },
      {
        grade: 5,
        legacyCount: grade5Problems.length,
        candidateCount: grade5Candidates.length,
        sessionCount: grade5Problems.length,
        difficultyDistribution: generatedDifficultyDistribution(grade5Problems, grade5Templates),
        storageKey: GRADE5_SESSION_KEY,
      },
      {
        grade: 6,
        legacyCount: grade6Problems10.length,
        candidateCount: grade6Candidates.length,
        sessionCount: grade6Problems5.length,
        difficultyDistribution: generatedDifficultyDistribution(grade6Problems5, grade6Templates),
        generatedSessions: [
          { count: grade6Problems5.length, difficultyDistribution: generatedDifficultyDistribution(grade6Problems5, grade6Templates) },
          { count: grade6Problems10.length, difficultyDistribution: generatedDifficultyDistribution(grade6Problems10, grade6Templates) },
        ],
        storageKey: GRADE6_SESSION_KEY,
      },
    ],
  }
}

function generateApplicationProblemQualityReport(selection) {
  const resolvedSelection = selection ?? parseApplicationAuditSelection(process.argv.slice(2))
  return auditApplicationProblemQuality(loadProductionApplicationProblemQualityInput(), resolvedSelection)
}

module.exports = {
  auditApplicationProblemQuality,
  classifyStoredApplicationPacks,
  generateApplicationProblemQualityReport,
  loadProductionApplicationProblemQualityInput,
  parseApplicationAuditSelection,
}
