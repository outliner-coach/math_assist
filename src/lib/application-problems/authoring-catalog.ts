import units from '../../../public/data/units.json'
import { grade2Units } from '../grade2-problems'
import { grade3Units } from '../grade3-problems'
import { grade4Units } from '../grade4-problems'
import type { ProblemRepresentation } from '../types'
import { createGrade2AuthoringUnitCandidateValues } from './grade2-authoring-catalog'
import {
  ContractValidationError,
  parseApplicationProblemFamilyV1,
  parseUnitKnowledgePackV1,
  type ApplicationCognitiveDomain,
  type ApplicationProofMode,
  type ApplicationProblemFamilyV1,
  type CompletePackCoverageContext,
  type ContractValidationIssue,
  type GeneratedApplicationProblemV1,
  type UnitKnowledgePackV1,
} from './contracts'
import { generateApplicationProblem } from './generator'
import type { ApplicationProblemRuntimeV1, ApplicationProblemRegistryV1 } from './registry'

export interface ApplicationUnitInventoryEntryV1 {
  grade: 2 | 3 | 4 | 5 | 6
  unitId: string
  semester: string
  title: string
  standardCodes: readonly string[]
}

/** Canonical completeness evidence derived from the existing learner base bank. */
export interface ApplicationUnitBaseBankEvidenceV1 {
  grade: 2 | 3 | 4 | 5 | 6
  unitId: string
  coreConceptIds: readonly string[]
  requiredRepresentations: readonly ProblemRepresentation[]
  knowingConceptIds: readonly string[]
  hasKnowingCoverage: boolean
  conceptUnitIdentities: readonly { conceptId: string; unitId: string }[]
}

function inventoryEntry(input: {
  grade: number
  id: string
  semester: string
  title: string
  curriculumCodes?: readonly string[]
}): ApplicationUnitInventoryEntryV1 {
  return Object.freeze({
    grade: input.grade as ApplicationUnitInventoryEntryV1['grade'],
    unitId: input.id,
    semester: input.semester,
    title: input.title,
    standardCodes: Object.freeze([...(input.curriculumCodes ?? [])]),
  })
}

const grade56Units = units.filter((unit) => unit.grade === 5 || unit.grade === 6)

/** Review tooling's single public unit denominator. Learner code must not import this module. */
export const APPLICATION_UNIT_INVENTORY_V1: readonly ApplicationUnitInventoryEntryV1[] =
  Object.freeze([
    ...grade2Units.map((unit) => inventoryEntry({ ...unit, grade: 2 })),
    ...grade3Units.map((unit) => inventoryEntry({ ...unit, grade: 3 })),
    ...grade4Units.map((unit) => inventoryEntry({ ...unit, grade: 4 })),
    ...grade56Units.map(inventoryEntry),
  ])

const expectedGradeCounts: Readonly<Record<ApplicationUnitInventoryEntryV1['grade'], number>> =
  Object.freeze({ 2: 12, 3: 12, 4: 15, 5: 12, 6: 11 })

function assertInventory(): void {
  const identities = new Set<string>()
  for (const unit of APPLICATION_UNIT_INVENTORY_V1) {
    const identity = `${unit.grade}:${unit.unitId}`
    if (identities.has(identity)) throw new Error(`duplicate application unit inventory identity ${identity}`)
    identities.add(identity)
  }
  for (const grade of [2, 3, 4, 5, 6] as const) {
    const count = APPLICATION_UNIT_INVENTORY_V1.filter((unit) => unit.grade === grade).length
    if (count !== expectedGradeCounts[grade]) {
      throw new Error(`application unit inventory Grade ${grade} count ${count} != ${expectedGradeCounts[grade]}`)
    }
  }
  if (APPLICATION_UNIT_INVENTORY_V1.length !== 62) {
    throw new Error(`application unit inventory count ${APPLICATION_UNIT_INVENTORY_V1.length} != 62`)
  }
}

assertInventory()

export interface DraftApplicationPlacementProposalV1 {
  familyId: string
  version: number
  grade: 2 | 3 | 4 | 5 | 6
  unitId: string
  conceptId: string
  cognitiveDomain: ApplicationCognitiveDomain
}

export interface DraftApplicationReviewCaseV1 {
  caseId: string
  kind: 'representative' | 'boundary'
  seed: number
  variantIndex: number
}

export interface DraftApplicationProofEvidenceV1 {
  authorityId: string
  mode: ApplicationProofMode
  expectedCount: number
  checkedCount: number
  proven: boolean
  issues: readonly string[]
  verify(
    problem: GeneratedApplicationProblemV1,
    reviewCase: DraftApplicationReviewCaseV1,
  ): readonly string[]
}

export interface DraftApplicationFamilyCandidateV1 {
  family: ApplicationProblemFamilyV1
  runtime: ApplicationProblemRuntimeV1
  oracle(problem: GeneratedApplicationProblemV1): string
  visualValidator(problem: GeneratedApplicationProblemV1): boolean
  placementProposal: DraftApplicationPlacementProposalV1
  reviewCases: readonly DraftApplicationReviewCaseV1[]
  proof?: DraftApplicationProofEvidenceV1
}

export interface ReviewOnlyApplicationUnitCandidateV1 {
  pack: UnitKnowledgePackV1
  familyCandidates: readonly DraftApplicationFamilyCandidateV1[]
  completeness: Omit<CompletePackCoverageContext, 'packId' | 'version'>
}

export interface ReviewOnlyApplicationAuthoringCatalogV1 {
  schemaVersion: 'application-problem-authoring-catalog-v1'
  unitCandidates: readonly ReviewOnlyApplicationUnitCandidateV1[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fail(code: string, path: string, message: string): never {
  throw new ContractValidationError('ReviewOnlyApplicationAuthoringCatalogV1', [{ code, path, message }])
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function parseCompleteness(
  value: unknown,
  pack: UnitKnowledgePackV1,
): Omit<CompletePackCoverageContext, 'packId' | 'version'> {
  if (!isRecord(value)) fail('invalid_completeness', 'catalog.completeness', 'completeness must be an object')
  const coreConceptIds = value.coreConceptIds
  const requiredRepresentations = value.requiredRepresentations
  if (!Array.isArray(coreConceptIds) || !coreConceptIds.every((entry) => typeof entry === 'string')) {
    fail('invalid_completeness', 'catalog.completeness.coreConceptIds', 'coreConceptIds must be strings')
  }
  if (
    !Array.isArray(requiredRepresentations) ||
    !requiredRepresentations.every((entry) =>
      ['text', 'equation', 'table', 'diagram', 'graph', 'manipulative'].includes(String(entry)),
    )
  ) {
    fail(
      'invalid_completeness',
      'catalog.completeness.requiredRepresentations',
      'requiredRepresentations must use the representation vocabulary',
    )
  }
  if (typeof value.hasKnowingCoverage !== 'boolean') {
    fail('invalid_completeness', 'catalog.completeness.hasKnowingCoverage', 'hasKnowingCoverage must be boolean')
  }
  if (
    pack.coverageStatus === 'complete' &&
    (coreConceptIds.length === 0 || requiredRepresentations.length === 0)
  ) {
    fail(
      'invalid_completeness',
      'catalog.completeness',
      'complete candidates require explicit core concepts and representations',
    )
  }
  return {
    coreConceptIds: [...coreConceptIds] as string[],
    requiredRepresentations: [...requiredRepresentations] as ProblemRepresentation[],
    hasKnowingCoverage: value.hasKnowingCoverage,
  }
}

function parseReviewCases(value: unknown, path: string): DraftApplicationReviewCaseV1[] {
  if (!Array.isArray(value)) {
    fail(
      'missing_draft_review_cases',
      path,
      'draft candidates require representative and boundary review cases',
    )
  }
  const caseIds = new Set<string>()
  const cases = value.map((entry, index) => {
    if (!isRecord(entry)) {
      fail('invalid_draft_review_case', `${path}[${index}]`, 'review case must be an object')
    }
    if (
      typeof entry.caseId !== 'string' ||
      !/^[a-z0-9][a-z0-9-]*$/.test(entry.caseId) ||
      caseIds.has(entry.caseId) ||
      (entry.kind !== 'representative' && entry.kind !== 'boundary') ||
      !Number.isSafeInteger(entry.seed) ||
      !Number.isSafeInteger(entry.variantIndex) ||
      (entry.variantIndex as number) < 0
    ) {
      fail(
        'invalid_draft_review_case',
        `${path}[${index}]`,
        'review cases require a unique stable id, representative or boundary kind, safe seed, and non-negative variant',
      )
    }
    caseIds.add(entry.caseId)
    return entry as unknown as DraftApplicationReviewCaseV1
  })
  if (!cases.some((entry) => entry.kind === 'representative') || !cases.some((entry) => entry.kind === 'boundary')) {
    fail(
      'missing_draft_review_case_kind',
      path,
      'draft candidates require both representative and boundary review cases',
    )
  }
  return cases
}

function parseDraftProof(
  value: unknown,
  path: string,
): DraftApplicationProofEvidenceV1 | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) {
    fail('invalid_draft_proof', path, 'draft proof evidence must be an object')
  }
  if (
    typeof value.authorityId !== 'string' ||
    !/^[a-z0-9][a-z0-9-]*$/.test(value.authorityId) ||
    !['exhaustive', 'invariant-boundary', 'static-corpus'].includes(String(value.mode)) ||
    !Number.isSafeInteger(value.expectedCount) ||
    (value.expectedCount as number) < 1 ||
    !Number.isSafeInteger(value.checkedCount) ||
    (value.checkedCount as number) < 0 ||
    typeof value.proven !== 'boolean' ||
    !Array.isArray(value.issues) ||
    !value.issues.every((entry) => typeof entry === 'string') ||
    typeof value.verify !== 'function'
  ) {
    fail(
      'invalid_draft_proof',
      path,
      'draft proof evidence requires a stable authority, mode, finite counts, issues, and executable verifier',
    )
  }
  return {
    authorityId: value.authorityId,
    mode: value.mode as ApplicationProofMode,
    expectedCount: value.expectedCount as number,
    checkedCount: value.checkedCount as number,
    proven: value.proven,
    issues: [...value.issues] as string[],
    verify: value.verify as DraftApplicationProofEvidenceV1['verify'],
  }
}

export function createReviewOnlyAuthoringCatalog(
  value: unknown,
): ReviewOnlyApplicationAuthoringCatalogV1 {
  if (!isRecord(value)) fail('invalid_authoring_catalog', 'catalog', 'catalog must be an object')
  if ('releaseLedger' in value || 'entries' in value) {
    fail(
      'authoring_release_ledger_forbidden',
      'catalog',
      'review-only authoring catalogs cannot expose a release ledger or learner registry entries',
    )
  }
  if (value.schemaVersion !== 'application-problem-authoring-catalog-v1') {
    fail(
      'invalid_schema_version',
      'catalog.schemaVersion',
      'catalog schemaVersion must equal application-problem-authoring-catalog-v1',
    )
  }
  if (!Array.isArray(value.unitCandidates)) {
    fail('invalid_unit_candidates', 'catalog.unitCandidates', 'unitCandidates must be an array')
  }
  const familyKeys = new Set<string>()
  const unitCandidates = value.unitCandidates.map((candidateValue, unitIndex) => {
    if (!isRecord(candidateValue)) {
      fail('invalid_unit_candidate', `catalog.unitCandidates[${unitIndex}]`, 'unit candidate must be an object')
    }
    if (!Array.isArray(candidateValue.familyCandidates)) {
      fail(
        'invalid_family_candidates',
        `catalog.unitCandidates[${unitIndex}].familyCandidates`,
        'familyCandidates must be an array',
      )
    }
    for (const candidate of candidateValue.familyCandidates) {
      if (
        !isRecord(candidate) ||
        !isRecord(candidate.family) ||
        candidate.family.releaseStatus !== 'draft'
      ) {
        fail(
          'non_draft_authoring_family',
          `catalog.unitCandidates[${unitIndex}].familyCandidates`,
          'every authoring family must remain draft',
        )
      }
    }
    const pack = parseUnitKnowledgePackV1(candidateValue.pack)
    if (pack.releaseStatus !== 'draft') {
      fail('non_draft_authoring_pack', `catalog.unitCandidates[${unitIndex}].pack`, 'authoring packs must remain draft')
    }
    const inventoryUnit = APPLICATION_UNIT_INVENTORY_V1.find(
      (unit) => unit.grade === pack.grade && unit.unitId === pack.unitId,
    )
    if (!inventoryUnit) {
      fail(
        'authoring_unit_outside_inventory',
        `catalog.unitCandidates[${unitIndex}].pack.unitId`,
        `${pack.unitId} is outside the Grade 2-6 public inventory`,
      )
    }
    const familyCandidates = candidateValue.familyCandidates.map((candidateValue, familyIndex) => {
      const candidate = candidateValue as Record<string, unknown>
      const family = parseApplicationProblemFamilyV1(candidate.family)
      const familyKey = `${family.familyId}@${family.version}`
      if (familyKeys.has(familyKey)) {
        fail(
          'duplicate_authoring_family',
          `catalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}].family`,
          `authoring family version ${familyKey} must be unique`,
        )
      }
      familyKeys.add(familyKey)
      if (!isRecord(candidate.runtime) || candidate.runtime.kind !== family.runtimeMode) {
        fail(
          'invalid_draft_runtime',
          `catalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}].runtime`,
          'draft runtime must match the declared runtimeMode',
        )
      }
      if (typeof candidate.oracle !== 'function' || typeof candidate.visualValidator !== 'function') {
        fail(
          'missing_draft_review_proof',
          `catalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}]`,
          'draft candidates require executable oracle and visual validation proposals',
        )
      }
      if (!isRecord(candidate.placementProposal)) {
        fail(
          'missing_draft_placement',
          `catalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}].placementProposal`,
          'draft candidates require a placement proposal',
        )
      }
      const placement = candidate.placementProposal
      if (
        placement.familyId !== family.familyId ||
        placement.version !== family.version ||
        placement.grade !== pack.grade ||
        placement.unitId !== pack.unitId ||
        placement.cognitiveDomain !== family.cognitiveDomain ||
        !family.conceptIds.includes(String(placement.conceptId))
      ) {
        fail(
          'unsafe_draft_placement',
          `catalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}].placementProposal`,
          'placement identity and cognitive domain must exactly match its draft family',
        )
      }
      const reviewCases = parseReviewCases(
        candidate.reviewCases,
        `catalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}].reviewCases`,
      )
      const proof = parseDraftProof(
        candidate.proof,
        `catalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}].proof`,
      )
      if (proof && proof.mode !== family.proofMode) {
        fail(
          'draft_proof_mode_mismatch',
          `catalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}].proof.mode`,
          'draft proof mode must match the family declaration',
        )
      }
      return {
        family,
        runtime: candidate.runtime as unknown as ApplicationProblemRuntimeV1,
        oracle: candidate.oracle as DraftApplicationFamilyCandidateV1['oracle'],
        visualValidator: candidate.visualValidator as DraftApplicationFamilyCandidateV1['visualValidator'],
        placementProposal: placement as unknown as DraftApplicationPlacementProposalV1,
        reviewCases,
        ...(proof ? { proof } : {}),
      }
    })
    const declaredFamilyRefs = new Set(
      pack.familyRefs.map((reference) => `${reference.familyId}@${reference.version}`),
    )
    const candidateFamilyRefs = new Set(
      familyCandidates.map(({ family }) => `${family.familyId}@${family.version}`),
    )
    if (
      declaredFamilyRefs.size !== candidateFamilyRefs.size ||
      Array.from(declaredFamilyRefs).some((reference) => !candidateFamilyRefs.has(reference)) ||
      familyCandidates.some(({ family }) => family.packId !== pack.packId || family.unitId !== pack.unitId)
    ) {
      fail(
        'draft_family_pack_mismatch',
        `catalog.unitCandidates[${unitIndex}].familyCandidates`,
        'draft family candidates must exactly match the pack references and identity',
      )
    }
    return {
      pack,
      familyCandidates,
      completeness: parseCompleteness(candidateValue.completeness, pack),
    }
  })
  const packKeys = unitCandidates.map(({ pack }) => `${pack.packId}@${pack.version}`)
  if (new Set(packKeys).size !== packKeys.length) {
    fail('duplicate_authoring_pack', 'catalog.unitCandidates', 'authoring pack versions must be unique')
  }
  return deepFreeze({
    schemaVersion: 'application-problem-authoring-catalog-v1',
    unitCandidates,
  })
}

export const GRADE2_APPLICATION_AUTHORING_CATALOG_V1 = createReviewOnlyAuthoringCatalog({
  schemaVersion: 'application-problem-authoring-catalog-v1',
  unitCandidates: createGrade2AuthoringUnitCandidateValues(),
})

export const APPLICATION_PROBLEM_AUTHORING_CATALOG_V1 =
  GRADE2_APPLICATION_AUTHORING_CATALOG_V1

export function validateAuthoringProductionSeparation(input: {
  authoringCatalog: ReviewOnlyApplicationAuthoringCatalogV1
  productionRegistries: readonly ApplicationProblemRegistryV1[]
  productionPacks: readonly Pick<UnitKnowledgePackV1, 'packId' | 'version'>[]
}): ContractValidationIssue[] {
  const issues: ContractValidationIssue[] = []
  const productionFamilies = new Set(
    input.productionRegistries.flatMap((registry) => [
      ...registry.entries.map(({ family }) => `${family.familyId}@${family.version}`),
      ...registry.releaseLedger.map((family) => `${family.familyId}@${family.version}`),
    ]),
  )
  const productionPacks = new Set(
    input.productionPacks.map((pack) => `${pack.packId}@${pack.version}`),
  )
  input.authoringCatalog.unitCandidates.forEach((candidate, unitIndex) => {
    const packKey = `${candidate.pack.packId}@${candidate.pack.version}`
    if (productionPacks.has(packKey)) {
      issues.push({
        code: 'draft_pack_in_production',
        path: `authoringCatalog.unitCandidates[${unitIndex}].pack`,
        message: `draft pack ${packKey} is mixed into production`,
      })
    }
    candidate.familyCandidates.forEach(({ family }, familyIndex) => {
      const familyKey = `${family.familyId}@${family.version}`
      if (productionFamilies.has(familyKey)) {
        issues.push({
          code: 'draft_family_in_production',
          path: `authoringCatalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}]`,
          message: `draft family ${familyKey} is mixed into production`,
        })
      }
    })
  })
  return issues
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'undefined'
}

/** Executes review-only evidence. It does not register or expose draft runtimes to learners. */
export function validateAuthoringCatalogSafety(
  catalog: ReviewOnlyApplicationAuthoringCatalogV1,
): ContractValidationIssue[] {
  const issues: ContractValidationIssue[] = []
  catalog.unitCandidates.forEach((unitCandidate, unitIndex) => {
    unitCandidate.familyCandidates.forEach((candidate, familyIndex) => {
      const familyPath = `authoringCatalog.unitCandidates[${unitIndex}].familyCandidates[${familyIndex}]`
      if (!candidate.proof) {
        issues.push({
          code: 'draft_proof_evidence_missing',
          path: `${familyPath}.proof`,
          message: 'draft safety review requires independent proof authority evidence',
        })
      } else if (
        candidate.proof.mode !== candidate.family.proofMode ||
        candidate.proof.proven !== true ||
        candidate.proof.checkedCount !== candidate.proof.expectedCount ||
        candidate.proof.checkedCount < 1 ||
        candidate.proof.issues.length > 0
      ) {
        issues.push({
          code: 'draft_proof_evidence_failed',
          path: `${familyPath}.proof`,
          message: 'draft proof authority did not exhaust its declared safe domain',
        })
      }
      if (candidate.runtime.kind !== 'deterministic-generator') {
        issues.push({
          code: 'draft_runtime_not_deterministic',
          path: `${familyPath}.runtime`,
          message: 'draft safety review requires a deterministic generator',
        })
        return
      }
      const generator = candidate.runtime.generator
      candidate.reviewCases.forEach((reviewCase, caseIndex) => {
        const casePath = `${familyPath}.reviewCases[${caseIndex}]`
        try {
          const generate = () => generateApplicationProblem({
            family: candidate.family,
            generator,
            packVersion: unitCandidate.pack.version,
            seed: reviewCase.seed,
            variantIndex: reviewCase.variantIndex,
          })
          const first = generate()
          const second = generate()
          if (stableJson(first) !== stableJson(second)) {
            issues.push({
              code: 'draft_generation_not_deterministic',
              path: casePath,
              message: `${reviewCase.caseId} did not reproduce byte-equivalent generated content`,
            })
          }
          if (candidate.oracle(first) !== first.answer.normalized) {
            issues.push({
              code: 'draft_oracle_mismatch',
              path: casePath,
              message: `${reviewCase.caseId} independent oracle disagrees with the generated answer`,
            })
          }
          if (candidate.visualValidator(first) !== true) {
            issues.push({
              code: 'draft_visual_validation_failed',
              path: casePath,
              message: `${reviewCase.caseId} failed draft visual validation`,
            })
          }
          const proofIssues = candidate.proof?.verify(first, reviewCase) ?? [
            'missing independent proof authority',
          ]
          if (proofIssues.length > 0) {
            issues.push({
              code: 'draft_proof_case_failed',
              path: casePath,
              message: `${reviewCase.caseId} failed independent proof: ${proofIssues.join('; ')}`,
            })
          }
        } catch (error) {
          issues.push({
            code: 'draft_review_execution_failed',
            path: casePath,
            message: `${reviewCase.caseId} review execution failed: ${error instanceof Error ? error.message : String(error)}`,
          })
        }
      })
    })
  })
  return issues
}
