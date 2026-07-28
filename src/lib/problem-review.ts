import g2LengthPack from '../../public/data/application-problems/packs/g2-2-length.json'
import g5GeometryPack from '../../public/data/application-problems/packs/unit-5-1-perimeter-area.json'
import g6RatioPack from '../../public/data/application-problems/packs/unit-6-1-ratio.json'

import { parseUnitKnowledgePackV1, type ApplicationProblemFamilyV1 } from './application-problems/contracts'
import { G2_LENGTH_PROOF_AUTHORITY_ENTRIES } from './application-problems/families/g2-length-proof-registration'
import { G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1 } from './application-problems/families/grade5-geometry-proof-registration'
import { G6_RATIO_PROOF_AUTHORITIES } from './application-problems/families/g6-ratio-proof'
import { generateApplicationProblem } from './application-problems/generator'
import { APPLICATION_PROBLEM_REGISTRY_V1 } from './application-problems/registered-families'
import {
  resolveApplicationVisual,
  type ValidatedApplicationVisualScene,
} from './application-problems/visual-validator'

const REVIEW_SEED = 1700

type ReviewGrade = 2 | 5 | 6

interface ReviewOption {
  value: string
  label: string
}

interface ProofEvidence {
  mode: ApplicationProblemFamilyV1['proofMode']
  expectedCount: number
  authorityId: string
}

export interface ProblemReviewRow {
  grade: ReviewGrade
  familyId: string
  version: number
  unitId: string
  packId: string
  cognitiveDomain: ApplicationProblemFamilyV1['cognitiveDomain']
  reasoningPattern: ApplicationProblemFamilyV1['reasoningPattern']
  standards: string[]
  proofMode: ApplicationProblemFamilyV1['proofMode']
  releaseStatus: ApplicationProblemFamilyV1['releaseStatus']
  prompt: string
  answer: string
  answerFormat: 'number' | 'choice' | 'text'
  choices: string[]
  correctChoiceIndex: number | null
  solutionSteps: string[]
  hintSteps: string[]
  misconceptions: Array<{ id: string; description: string }>
  visual: {
    semantics: 'decorative' | 'schematic' | 'quantitative'
    before: { scene: ValidatedApplicationVisualScene; showAnswer: false }
    after: { scene: ValidatedApplicationVisualScene; showAnswer: true }
  }
  automaticChecks: {
    deterministicSample: boolean
    proof: ProofEvidence
    visual: { status: 'ready'; resolver: 'resolveApplicationVisual' }
  }
}

export interface ApplicationProblemReviewData {
  summary: { totalRows: number }
  filters: {
    grades: ReviewGrade[]
    units: ReviewOption[]
    families: ReviewOption[]
    versions: ReviewOption[]
    cognitiveDomains: ReviewOption[]
    reasoningPatterns: ReviewOption[]
    standards: ReviewOption[]
    proofModes: ReviewOption[]
    releaseStatuses: ReviewOption[]
  }
  rows: ProblemReviewRow[]
}

const PACKS = [
  parseUnitKnowledgePackV1(g2LengthPack),
  parseUnitKnowledgePackV1(g5GeometryPack),
  parseUnitKnowledgePackV1(g6RatioPack),
]

const proofEvidenceByFamily = new Map<string, ProofEvidence>([
  ...G2_LENGTH_PROOF_AUTHORITY_ENTRIES.map((authority) => [
    `${authority.familyId}@${authority.familyVersion}`,
    {
      mode: authority.mode,
      expectedCount: authority.manifest.expectedCount,
      authorityId: authority.manifest.authorityId,
    },
  ] as const),
  ...G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1.map((authority) => [
    `${authority.familyId}@${authority.familyVersion}`,
    {
      mode: authority.mode,
      expectedCount: authority.expectedCount,
      authorityId: authority.authorityId,
    },
  ] as const),
  ...G6_RATIO_PROOF_AUTHORITIES.map((authority) => [
    `${authority.familyId}@${authority.familyVersion}`,
    {
      mode: authority.mode,
      expectedCount: authority.manifest.expectedCount,
      authorityId: authority.manifest.authorityId,
    },
  ] as const),
])

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

function getPack(family: ApplicationProblemFamilyV1) {
  const pack = PACKS.find((candidate) => candidate.packId === family.packId)
  if (!pack) throw new Error(`Missing knowledge pack for ${family.familyId}@${family.version}`)
  return pack
}

function getProofEvidence(family: ApplicationProblemFamilyV1): ProofEvidence {
  const evidence = proofEvidenceByFamily.get(`${family.familyId}@${family.version}`)
  if (!evidence) throw new Error(`Missing proof authority for ${family.familyId}@${family.version}`)
  if (evidence.mode !== family.proofMode) {
    throw new Error(`Proof mode mismatch for ${family.familyId}@${family.version}`)
  }
  return evidence
}

function makeOptions(values: Iterable<string>): ReviewOption[] {
  return [...new Set(values)]
    .sort((left, right) => left.localeCompare(right, 'ko'))
    .map((value) => ({ value, label: value }))
}

function toReviewRow(
  entry: (typeof APPLICATION_PROBLEM_REGISTRY_V1.entries)[number],
  index: number,
): ProblemReviewRow {
  if (entry.runtime.kind !== 'deterministic-generator') {
    throw new Error(`Unsupported review runtime: ${entry.family.familyId}@${entry.family.version}`)
  }

  const family = entry.family
  const pack = getPack(family)
  const input = {
    family,
    generator: entry.runtime.generator,
    packVersion: entry.runtime.generator.packVersion,
    seed: REVIEW_SEED + index,
    variantIndex: 0,
  }
  const problem = generateApplicationProblem(input)
  const repeat = generateApplicationProblem(input)
  const visual = resolveApplicationVisual(problem.visual)
  if (visual.status !== 'ready') {
    throw new Error(`Registered visual resolver did not prepare ${family.familyId}@${family.version}`)
  }

  const misconceptionById = new Map(
    pack.concepts.flatMap((concept) => concept.misconceptions.map((misconception) => [
      misconception.id,
      { id: misconception.id, description: misconception.description },
    ])),
  )
  const misconceptions = problem.misconceptionRefs.map((id) => {
    const misconception = misconceptionById.get(id)
    if (!misconception) throw new Error(`Missing misconception ${id} for ${family.familyId}`)
    return misconception
  })
  const grade = pack.grade
  if (grade !== 2 && grade !== 5 && grade !== 6) {
    throw new Error(`Unsupported application review grade ${grade}`)
  }

  return {
    grade,
    familyId: family.familyId,
    version: family.version,
    unitId: family.unitId,
    packId: family.packId,
    cognitiveDomain: family.cognitiveDomain,
    reasoningPattern: family.reasoningPattern,
    standards: [...problem.curriculumCodes],
    proofMode: family.proofMode,
    releaseStatus: family.releaseStatus,
    prompt: problem.prompt,
    answer: problem.answer.normalized,
    answerFormat: problem.answer.format,
    choices: [...(problem.choices ?? [])],
    correctChoiceIndex: problem.correctChoiceIndex ?? null,
    solutionSteps: [...problem.solutionSteps],
    hintSteps: [...problem.hintSteps],
    misconceptions,
    visual: {
      semantics: visual.scene.semantics,
      before: { scene: visual.scene, showAnswer: false },
      after: { scene: visual.scene, showAnswer: true },
    },
    automaticChecks: {
      deterministicSample: stableJson(problem) === stableJson(repeat),
      proof: getProofEvidence(family),
      visual: { status: 'ready', resolver: 'resolveApplicationVisual' },
    },
  }
}

export function getApplicationProblemReviewData(): ApplicationProblemReviewData {
  const rows = APPLICATION_PROBLEM_REGISTRY_V1.entries.map(toReviewRow)

  return {
    summary: { totalRows: rows.length },
    filters: {
      grades: [...new Set(rows.map((row) => row.grade))].sort((left, right) => left - right),
      units: makeOptions(rows.map((row) => row.unitId)),
      families: makeOptions(rows.map((row) => row.familyId)),
      versions: makeOptions(rows.map((row) => String(row.version))),
      cognitiveDomains: makeOptions(rows.map((row) => row.cognitiveDomain)),
      reasoningPatterns: makeOptions(rows.map((row) => row.reasoningPattern)),
      standards: makeOptions(rows.flatMap((row) => row.standards)),
      proofModes: makeOptions(rows.map((row) => row.proofMode)),
      releaseStatuses: makeOptions(rows.map((row) => row.releaseStatus)),
    },
    rows,
  }
}
