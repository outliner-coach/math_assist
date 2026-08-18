import { readdirSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  parseUnitKnowledgePackV1,
  type GeneratedApplicationProblemV1,
  type ApplicationProblemFamilyV1,
  type UnitKnowledgePackV1,
} from './application-problems/contracts'
import {
  APPLICATION_PROBLEM_AUTHORING_CATALOG_V1,
  GRADE2_APPLICATION_AUTHORING_CATALOG_V1,
  GRADE3_APPLICATION_AUTHORING_CATALOG_V1,
  APPLICATION_UNIT_INVENTORY_V1,
  type ApplicationUnitInventoryEntryV1,
  type DraftApplicationFamilyCandidateV1,
  type ReviewOnlyApplicationAuthoringCatalogV1,
} from './application-problems/authoring-catalog'
import { generateApplicationProblem } from './application-problems/generator'
import {
  G2_LENGTH_EXHAUSTIVE_PROOFS,
  G2_LENGTH_PROOF_AUTHORITY_ENTRIES,
} from './application-problems/families/g2-length-proof-registration'
import {
  G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1,
  G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1,
} from './application-problems/families/grade5-geometry-proof-registration'
import {
  G6_RATIO_PROOF_AUTHORITIES,
  G6_RATIO_PROOFS,
} from './application-problems/families/g6-ratio-proof'
import {
  getProductionApplicationFamilyEvidence,
  type ApplicationFamilyQualityEvidenceRow,
} from './application-problems/quality-evidence'
import { APPLICATION_PROBLEM_REGISTRY_V1 } from './application-problems/registered-families'
import type {
  ApplicationProblemRegistryEntryV1,
  ApplicationProblemRegistryV1,
} from './application-problems/registry'
import {
  resolveApplicationVisual,
  type ValidatedApplicationVisualScene,
} from './application-problems/visual-validator'

import {
  getGrade1Missions,
  grade1Islands,
  grade1MissionTemplates,
  renderGrade1MissionFromParams,
  type Grade1Mission,
  type Grade1MissionTemplate,
} from './grade1-problems'
import {
  getGrade2Missions,
  grade2Units,
  grade2MissionTemplates,
  renderGrade2MissionFromParams,
  type Grade2Mission,
  type Grade2MissionTemplate,
} from './grade2-problems'
import {
  getGrade3Missions,
  grade3Units,
  grade3MissionTemplates,
  type Grade3Mission,
} from './grade3-problems'
import {
  getGrade4MissionBank,
  grade4Units,
  grade4MissionTemplates,
  type Grade4Mission,
  type Grade4MissionTemplate,
} from './grade4-problems'
import {
  generateProblems,
  renderProblemTemplate,
} from './problem-generator'
import {
  buildProblemReviewCatalog,
  type EditorialEvidence,
  type EditorialLedger,
  type EditorialLedgerItem,
  type ProblemReviewItem,
  type ProblemReviewJsonValue,
  type ProblemReviewSource,
  type RequiredEvidenceKind,
  type ReviewVisualSemantics,
  type TaskAction,
} from './problem-review-catalog'
import { PROBLEM_REVIEW_RENDERER_VERSIONS } from './problem-review-renderer-versions'
import type {
  Concept,
  Problem,
  ProblemTaskAction,
  ProblemTemplate,
  Unit,
  VisualSemantics,
  VisualTemplateValue,
} from './types'

const REVIEW_SEEDS = {
  grade1: 11,
  grade2: 29,
  grade3: 47,
  grade4: 71,
  A: 11,
  B: 29,
  C: 47,
} as const

const CHOICE_LABELS = ['①', '②', '③', '④']

interface ProblemReviewRuntimeRowBase {
  reviewId: string
  grade: 1 | 2 | 3 | 4 | 5 | 6
  sourceKind: 'mission' | 'template'
  sourceId: string
  groupId: string
  groupTitle: string
  unitTitle: string
  prompt: string
  correctAnswer: string
  correctChoiceLabel: string | null
  choices: string[]
  hintSteps: string[]
  solutionSteps: string[]
  answerType: string
  difficultyLabel: string
  hasVisual: boolean
  visualKind: string | null
  sampleKey: string
  variants: ProblemReviewVariant[]
}

type ProblemReviewRenderable = (
  | {
      renderer: 'grade1'
      mission: Grade1Mission
      problem: null
    }
  | {
      renderer: 'grade2'
      mission: Grade2Mission
      problem: null
    }
  | {
      renderer: 'grade3'
      mission: Grade3Mission
      problem: null
    }
  | {
      renderer: 'grade4'
      mission: Grade4Mission
      problem: null
    }
  | {
      renderer: 'practice'
      mission: null
      problem: Problem
    }
)

export type ProblemReviewVariant = Pick<
  ProblemReviewRuntimeRowBase,
  | 'prompt'
  | 'correctAnswer'
  | 'correctChoiceLabel'
  | 'choices'
  | 'hintSteps'
  | 'solutionSteps'
  | 'answerType'
  | 'difficultyLabel'
  | 'hasVisual'
  | 'visualKind'
  | 'sampleKey'
> & ProblemReviewRenderable & {
  key: string
  label: string
}

export type ProblemReviewStatus = 'pass' | 'blocked' | 'stale' | 'missing'

interface ProblemReviewMetadata {
  semester: string | null
  unitId: string
  conceptId: string | null
  family: string
  curriculumCodes: string[]
  taskActions: TaskAction[]
  answerKind: string
  requiredEvidence: RequiredEvidenceKind[]
  visualSemantics: ReviewVisualSemantics
  rendererReviewVersion: string
  contentHash: string
  reviewedContentHash: string | null
  recordedReviewStatus: 'pass' | 'blocked' | null
  reviewStatus: ProblemReviewStatus
  reviewFindingCategories: string[]
  reviewEvidence: EditorialEvidence | null
  reviewNote: string
}

type ProblemReviewRuntimeRow = ProblemReviewRuntimeRowBase & ProblemReviewRenderable

export type ProblemReviewRow = ProblemReviewRuntimeRow & ProblemReviewMetadata

export interface ProblemReviewSummary {
  totalProblems: number
  totalVisualProblems: number
  totalChoiceProblems: number
  totalWrittenProblems: number
  passProblems: number
  blockedProblems: number
  staleProblems: number
  missingProblems: number
  byGrade: Record<1 | 2 | 3 | 4 | 5 | 6, number>
}

export interface ProblemReviewData {
  summary: ProblemReviewSummary
  groups: Array<{
    id: string
    grade: 1 | 2 | 3 | 4 | 5 | 6
    title: string
    unitTitle: string
    rowCount: number
  }>
  rows: ProblemReviewRow[]
}

type ExtendedPracticeTemplate = ProblemTemplate & {
  answerKind?: string
  curriculumCodes?: string[]
  scaffold?: ProblemReviewJsonValue
  tool?: ProblemReviewJsonValue
  visualSemantics?: VisualSemantics
}

const GRADE4_REVIEW_CHOICE_SEED_BASE = 2026072600

function actualEvidence({
  visual,
  tool,
  scaffold,
}: {
  visual: ProblemReviewSource['content']['visual']
  tool: ProblemReviewJsonValue
  scaffold: ProblemReviewJsonValue
}): RequiredEvidenceKind[] {
  return [
    'text',
    ...(visual === null ? [] : ['visual'] as const),
    ...(tool === null ? [] : ['tool'] as const),
    ...(scaffold === null ? [] : ['scaffold'] as const),
  ]
}

function rendererReviewKey(
  grade: 1 | 2 | 3 | 4 | 5 | 6,
  visualKind: string | null
) {
  if (grade === 5) {
    if (visualKind === null) return 'grade5-practice-text'
    if (visualKind === 'cuboid' || visualKind === 'three_shape_overlap') {
      return `grade5-practice-visual:${visualKind}`
    }
    return 'grade5-practice-visual'
  }
  if (visualKind === null) return 'none'
  if (grade <= 4) return `grade${grade}-mission-visual`
  if (visualKind === 'cuboid' || visualKind === 'three_shape_overlap') {
    return `practice-problem-visual:${visualKind}`
  }
  return 'practice-problem-visual'
}

function sourceVisual(
  visualKind: string | null,
  config: ProblemReviewJsonValue
): ProblemReviewSource['content']['visual'] {
  return visualKind === null ? null : { kind: visualKind, config }
}

export function classifyProblemReviewStatus(
  item: Pick<ProblemReviewItem, 'contentHash'>,
  receipt: Pick<EditorialLedgerItem, 'contentHash' | 'status'> | undefined
): ProblemReviewStatus {
  if (!receipt) return 'missing'
  if (receipt.contentHash !== item.contentHash) return 'stale'
  return receipt.status
}

async function readJsonFile<T>(...segments: string[]): Promise<T> {
  const filePath = path.join(process.cwd(), ...segments)
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content) as T
}

function getTemplateFileName(conceptId: string) {
  return `${conceptId.split('-')[0]}.json`
}

function correctChoiceLabel(choices: string[], answer: string) {
  const index = choices.indexOf(answer)
  return index >= 0 ? CHOICE_LABELS[index] ?? null : null
}

function sortConcepts(concepts: Concept[], units: Unit[]) {
  const unitOrderById = Object.fromEntries(units.map(unit => [unit.id, unit.order]))

  return [...concepts].sort((left, right) => {
    const unitOrderDiff = (
      (unitOrderById[left.unit_id] ?? 0) - (unitOrderById[right.unit_id] ?? 0)
    )
    if (unitOrderDiff !== 0) return unitOrderDiff

    const conceptOrderDiff = left.order - right.order
    if (conceptOrderDiff !== 0) return conceptOrderDiff

    return left.id.localeCompare(right.id)
  })
}

function sortProblems(
  problems: Problem[],
  templatesById: Record<string, ProblemTemplate>
) {
  return [...problems].sort((left, right) => {
    const difficultyDiff = (
      (templatesById[left.templateId]?.difficulty ?? 0)
      - (templatesById[right.templateId]?.difficulty ?? 0)
    )
    if (difficultyDiff !== 0) return difficultyDiff

    return left.templateId.localeCompare(right.templateId)
  })
}

function paramsAtBoundary(
  schema: Record<string, { min: number; max: number }>,
  boundary: 'min' | 'max'
) {
  return Object.fromEntries(
    Object.entries(schema).map(([key, range]) => [key, range[boundary]])
  )
}

function paramsSampleKey(params: Record<string, number>) {
  const entries = Object.entries(params)
  return entries.length === 0
    ? '고정값'
    : entries.map(([key, value]) => `${key}=${value}`).join(', ')
}

function uniqueReviewVariants(variants: ProblemReviewVariant[]) {
  const seen = new Set<string>()
  return variants.filter(variant => {
    const identity = `${variant.prompt}\u0000${variant.sampleKey}`
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}

function grade1Variant(
  mission: Grade1Mission,
  key: string,
  label: string
): ProblemReviewVariant {
  const choices = mission.choices ?? []
  return {
    key,
    label,
    prompt: mission.prompt,
    correctAnswer: mission.correctAnswer,
    correctChoiceLabel: correctChoiceLabel(choices, mission.correctAnswer),
    choices,
    hintSteps: mission.hintSteps,
    solutionSteps: mission.solutionSteps,
    answerType: mission.answerType,
    difficultyLabel: `난이도 ${mission.difficulty}`,
    hasVisual: true,
    visualKind: mission.visualModel,
    sampleKey: paramsSampleKey(mission.params),
    renderer: 'grade1',
    mission,
    problem: null,
  }
}

function grade1BoundaryVariants(
  template: Grade1MissionTemplate,
  representative: Grade1Mission
) {
  const minimum = renderGrade1MissionFromParams(
    template,
    paramsAtBoundary(template.paramSchema, 'min'),
    () => 0.25
  )
  const maximum = renderGrade1MissionFromParams(
    template,
    paramsAtBoundary(template.paramSchema, 'max'),
    () => 0.75
  )
  return uniqueReviewVariants([
    grade1Variant(representative, 'representative', '대표 표본'),
    grade1Variant(minimum, 'minimum', '최솟값 경계'),
    grade1Variant(maximum, 'maximum', '최댓값 경계'),
  ])
}

function grade2Variant(
  mission: Grade2Mission,
  key: string,
  label: string
): ProblemReviewVariant {
  const choices = mission.choices ?? []
  return {
    key,
    label,
    prompt: mission.prompt,
    correctAnswer: mission.correctAnswer,
    correctChoiceLabel: correctChoiceLabel(choices, mission.correctAnswer),
    choices,
    hintSteps: mission.hintSteps,
    solutionSteps: mission.solutionSteps,
    answerType: mission.answerType,
    difficultyLabel: mission.difficultyStep,
    hasVisual: true,
    visualKind: mission.visualModel,
    sampleKey: paramsSampleKey(mission.params),
    renderer: 'grade2',
    mission,
    problem: null,
  }
}

function grade2BoundaryVariants(
  template: Grade2MissionTemplate,
  representative: Grade2Mission
) {
  const minimum = renderGrade2MissionFromParams(
    template,
    paramsAtBoundary(template.paramSchema, 'min'),
    () => 0.25
  )
  const maximum = renderGrade2MissionFromParams(
    template,
    paramsAtBoundary(template.paramSchema, 'max'),
    () => 0.75
  )
  return uniqueReviewVariants([
    grade2Variant(representative, 'representative', '대표 표본'),
    grade2Variant(minimum, 'minimum', '최솟값 경계'),
    grade2Variant(maximum, 'maximum', '최댓값 경계'),
  ])
}

function grade3Variant(mission: Grade3Mission): ProblemReviewVariant {
  const choices = mission.choices ?? []
  return {
    key: 'fixed',
    label: '고정 원본',
    prompt: mission.prompt,
    correctAnswer: mission.correctAnswer,
    correctChoiceLabel: correctChoiceLabel(choices, mission.correctAnswer),
    choices,
    hintSteps: mission.hintSteps,
    solutionSteps: mission.solutionSteps,
    answerType: mission.answerType,
    difficultyLabel: mission.difficultyStep,
    hasVisual: true,
    visualKind: mission.visualModel,
    sampleKey: `stage=${mission.stageOrder}`,
    renderer: 'grade3',
    mission,
    problem: null,
  }
}

function buildGrade4Mission(
  template: Grade4MissionTemplate,
  variant: number
): Grade4Mission {
  const built = template.build(
    variant,
    GRADE4_REVIEW_CHOICE_SEED_BASE + variant
  )
  return {
    id: template.id,
    unitId: template.unitId,
    curriculumCode: template.curriculumCode,
    cognitiveDomain: template.cognitiveDomain,
    problemFamily: template.problemFamily,
    representation: template.representation,
    answerType: template.answerType,
    supportTool: template.supportTool,
    taskActions: template.taskActions,
    visualSemantics: template.visualSemantics,
    skillTag: template.skillTag,
    learnerGoal: template.learnerGoal,
    hintSteps: template.hintSteps,
    ...built,
    variantKey: `variant-${variant}`,
  }
}

function grade4Variant(
  mission: Grade4Mission,
  variant: number
): ProblemReviewVariant {
  const choices = mission.choices ?? []
  return {
    key: `variant-${variant}`,
    label: `허용 경계 ${variant}/9`,
    prompt: mission.prompt,
    correctAnswer: mission.correctAnswer,
    correctChoiceLabel: correctChoiceLabel(choices, mission.correctAnswer),
    choices,
    hintSteps: mission.hintSteps,
    solutionSteps: mission.solutionSteps,
    answerType: mission.answerType,
    difficultyLabel: mission.cognitiveDomain,
    hasVisual: true,
    visualKind: mission.visualModel,
    sampleKey: mission.variantKey,
    renderer: 'grade4',
    mission,
    problem: null,
  }
}

function practiceVariant(
  problem: Problem,
  template: ProblemTemplate,
  key: string,
  label: string
): ProblemReviewVariant {
  const choices = problem.choices ?? []
  return {
    key,
    label,
    prompt: problem.prompt,
    correctAnswer: problem.correctAnswer,
    correctChoiceLabel: (
      problem.type === 'choice' && typeof problem.correctChoiceIndex === 'number'
        ? CHOICE_LABELS[problem.correctChoiceIndex] ?? null
        : null
    ),
    choices,
    hintSteps: problem.hintSteps ?? [],
    solutionSteps: problem.solutionSteps,
    answerType: problem.type,
    difficultyLabel: `난이도 ${template.difficulty}`,
    hasVisual: problem.visual !== undefined,
    visualKind: problem.visual?.type ?? null,
    sampleKey: paramsSampleKey(problem.params),
    renderer: 'practice',
    mission: null,
    problem,
  }
}

function practiceBoundaryVariants(
  representative: Problem,
  template: ProblemTemplate
) {
  const minimum = renderProblemTemplate(
    template,
    paramsAtBoundary(template.param_schema, 'min'),
    { choiceSeed: 11 }
  )
  const maximum = renderProblemTemplate(
    template,
    paramsAtBoundary(template.param_schema, 'max'),
    { choiceSeed: 47 }
  )
  return uniqueReviewVariants([
    practiceVariant(representative, template, 'representative', '대표 표본'),
    practiceVariant(minimum, template, 'minimum', '최솟값 경계'),
    practiceVariant(maximum, template, 'maximum', '최댓값 경계'),
  ])
}

function grade1Rows(): ProblemReviewRuntimeRow[] {
  const islandById = new Map(grade1Islands.map(island => [island.id, island]))
  const templateById = new Map(
    grade1MissionTemplates.map(template => [template.id, template])
  )
  return getGrade1Missions(REVIEW_SEEDS.grade1).map(mission => {
    const island = islandById.get(mission.islandId)
    const template = templateById.get(mission.id)
    if (!template) throw new Error(`Missing Grade 1 review template: ${mission.id}`)
    const choices = mission.choices ?? []
    return {
      reviewId: `1:mission:${mission.id}`,
      grade: 1,
      sourceKind: 'mission',
      sourceId: mission.id,
      groupId: mission.islandId,
      groupTitle: island?.title ?? mission.islandId,
      unitTitle: island?.title ?? mission.islandId,
      prompt: mission.prompt,
      correctAnswer: mission.correctAnswer,
      correctChoiceLabel: correctChoiceLabel(choices, mission.correctAnswer),
      choices,
      hintSteps: mission.hintSteps,
      solutionSteps: mission.solutionSteps,
      answerType: mission.answerType,
      difficultyLabel: `난이도 ${mission.difficulty}`,
      hasVisual: true,
      visualKind: mission.visualModel,
      sampleKey: Object.entries(mission.params)
        .map(([key, value]) => `${key}=${value}`)
        .join(', '),
      variants: grade1BoundaryVariants(template, mission),
      renderer: 'grade1',
      mission,
      problem: null,
    }
  })
}

function grade2Rows(): ProblemReviewRuntimeRow[] {
  const unitById = new Map(grade2Units.map(unit => [unit.id, unit]))
  const templateById = new Map(
    grade2MissionTemplates.map(template => [template.id, template])
  )
  return getGrade2Missions(REVIEW_SEEDS.grade2).map(mission => {
    const unit = unitById.get(mission.unitId)
    const template = templateById.get(mission.id)
    if (!template) throw new Error(`Missing Grade 2 review template: ${mission.id}`)
    const choices = mission.choices ?? []
    return {
      reviewId: `2:mission:${mission.id}`,
      grade: 2,
      sourceKind: 'mission',
      sourceId: mission.id,
      groupId: mission.unitId,
      groupTitle: unit?.title ?? mission.unitId,
      unitTitle: unit?.title ?? mission.unitId,
      prompt: mission.prompt,
      correctAnswer: mission.correctAnswer,
      correctChoiceLabel: correctChoiceLabel(choices, mission.correctAnswer),
      choices,
      hintSteps: mission.hintSteps,
      solutionSteps: mission.solutionSteps,
      answerType: mission.answerType,
      difficultyLabel: mission.difficultyStep,
      hasVisual: true,
      visualKind: mission.visualModel,
      sampleKey: Object.entries(mission.params)
        .map(([key, value]) => `${key}=${value}`)
        .join(', '),
      variants: grade2BoundaryVariants(template, mission),
      renderer: 'grade2',
      mission,
      problem: null,
    }
  })
}

function grade3Rows(): ProblemReviewRuntimeRow[] {
  const unitById = new Map(grade3Units.map(unit => [unit.id, unit]))
  return getGrade3Missions(REVIEW_SEEDS.grade3).map(mission => {
    const unit = unitById.get(mission.unitId)
    const choices = mission.choices ?? []
    return {
      reviewId: `3:mission:${mission.id}`,
      grade: 3,
      sourceKind: 'mission',
      sourceId: mission.id,
      groupId: mission.unitId,
      groupTitle: unit?.title ?? mission.unitId,
      unitTitle: unit?.title ?? mission.unitId,
      prompt: mission.prompt,
      correctAnswer: mission.correctAnswer,
      correctChoiceLabel: correctChoiceLabel(choices, mission.correctAnswer),
      choices,
      hintSteps: mission.hintSteps,
      solutionSteps: mission.solutionSteps,
      answerType: mission.answerType,
      difficultyLabel: mission.difficultyStep,
      hasVisual: true,
      visualKind: mission.visualModel,
      sampleKey: `stage=${mission.stageOrder}`,
      variants: [grade3Variant(mission)],
      renderer: 'grade3',
      mission,
      problem: null,
    }
  })
}

function grade4Rows(): ProblemReviewRuntimeRow[] {
  const unitById = new Map(grade4Units.map(unit => [unit.id, unit]))
  const templateById = new Map(
    grade4MissionTemplates.map(template => [template.id, template])
  )
  return getGrade4MissionBank(REVIEW_SEEDS.grade4).map(mission => {
    const unit = unitById.get(mission.unitId)
    const template = templateById.get(mission.id)
    if (!template) throw new Error(`Missing Grade 4 review template: ${mission.id}`)
    const choices = mission.choices ?? []
    return {
      reviewId: `4:mission:${mission.id}`,
      grade: 4,
      sourceKind: 'mission',
      sourceId: mission.id,
      groupId: mission.unitId,
      groupTitle: unit?.title ?? mission.unitId,
      unitTitle: unit?.title ?? mission.unitId,
      prompt: mission.prompt,
      correctAnswer: mission.correctAnswer,
      correctChoiceLabel: correctChoiceLabel(choices, mission.correctAnswer),
      choices,
      hintSteps: mission.hintSteps,
      solutionSteps: mission.solutionSteps,
      answerType: mission.answerType,
      difficultyLabel: mission.cognitiveDomain,
      hasVisual: true,
      visualKind: mission.visualModel,
      sampleKey: mission.variantKey,
      variants: Array.from({ length: 9 }, (_, index) => {
        const variant = index + 1
        return grade4Variant(buildGrade4Mission(template, variant), variant)
      }),
      renderer: 'grade4',
      mission,
      problem: null,
    }
  })
}

function practiceRow(
  problem: Problem,
  concept: Concept,
  unit: Unit,
  templatesById: Record<string, ProblemTemplate>
): ProblemReviewRuntimeRow {
  const template = templatesById[problem.templateId]
  const choices = problem.choices ?? []
  const grade = unit.grade === 6 ? 6 : 5

  return {
    reviewId: `${grade}:template:${problem.templateId}`,
    grade,
    sourceKind: 'template',
    sourceId: problem.templateId,
    groupId: concept.id,
    groupTitle: concept.concept_title,
    unitTitle: unit.title,
    prompt: problem.prompt,
    correctAnswer: problem.correctAnswer,
    correctChoiceLabel: (
      problem.type === 'choice' && typeof problem.correctChoiceIndex === 'number'
        ? CHOICE_LABELS[problem.correctChoiceIndex] ?? null
        : null
    ),
    choices,
    hintSteps: problem.hintSteps ?? [],
    solutionSteps: problem.solutionSteps,
    answerType: problem.type,
    difficultyLabel: `난이도 ${template.difficulty}`,
    hasVisual: problem.visual !== undefined,
    visualKind: problem.visual?.type ?? null,
    sampleKey: Object.entries(problem.params)
      .map(([key, value]) => `${key}=${value}`)
      .join(', '),
    variants: practiceBoundaryVariants(problem, template),
    renderer: 'practice',
    mission: null,
    problem,
  }
}

async function practiceRows(units: Unit[], concepts: Concept[]) {
  const unitById = new Map(units.map(unit => [unit.id, unit]))
  const rows: ProblemReviewRuntimeRow[] = []

  for (const concept of sortConcepts(concepts, units)) {
    const unit = unitById.get(concept.unit_id)
    if (!unit || (unit.grade !== 5 && unit.grade !== 6)) continue
    const templates = await readJsonFile<ProblemTemplate[]>(
      'public',
      'data',
      'templates',
      getTemplateFileName(concept.id)
    )
    const conceptTemplates = templates.filter(
      template => template.concept_id === concept.id
    )
    const templatesById = Object.fromEntries(
      conceptTemplates.map(template => [template.id, template])
    )

    for (const setId of ['A', 'B', 'C'] as const) {
      const generatedProblems = generateProblems(conceptTemplates, {
        count: 10,
        setId,
        seed: REVIEW_SEEDS[setId],
      })

      rows.push(
        ...sortProblems(generatedProblems, templatesById).map(problem => (
          practiceRow(problem, concept, unit, templatesById)
        ))
      )
    }
  }

  return rows
}

function grade1ReviewSources(): ProblemReviewSource[] {
  return grade1MissionTemplates.map(template => {
    const visual = sourceVisual(
      template.visualModel,
      template.visualConfig as ProblemReviewJsonValue
    )
    return {
      grade: 1,
      sourceKind: 'mission',
      sourceId: template.id,
      semester: null,
      unitId: template.islandId,
      conceptId: null,
      family: template.parentSummaryTag,
      curriculumCodes: template.curriculumCodes,
      answerKind: template.answerType,
      taskActions: template.taskActions,
      requiredEvidence: actualEvidence({
        visual,
        tool: null,
        scaffold: null,
      }),
      visualKind: template.visualModel,
      visualSemantics: template.visualSemantics,
      rendererReviewKey: rendererReviewKey(1, template.visualModel),
      isPublic: true,
      content: {
        prompt: template.promptTemplate,
        choices: template.choicesTemplate ?? [],
        answerRule: template.solverRule,
        hints: template.hintStepsTemplate,
        solution: template.solutionStepsTemplate,
        scaffold: null,
        tool: null,
        visual,
      },
    }
  })
}

function grade2ReviewSources(): ProblemReviewSource[] {
  return grade2MissionTemplates.map(template => {
    const visual = sourceVisual(
      template.visualModel,
      template.visualConfig as ProblemReviewJsonValue
    )
    return {
      grade: 2,
      sourceKind: 'mission',
      sourceId: template.id,
      semester: template.semester,
      unitId: template.unitId,
      conceptId: null,
      family: template.parentSummaryTag,
      curriculumCodes: [template.curriculumCode],
      answerKind: template.answerType,
      taskActions: template.taskActions,
      requiredEvidence: actualEvidence({
        visual,
        tool: null,
        scaffold: null,
      }),
      visualKind: template.visualModel,
      visualSemantics: template.visualSemantics,
      rendererReviewKey: rendererReviewKey(2, template.visualModel),
      isPublic: true,
      content: {
        prompt: template.promptTemplate,
        choices: template.choicesTemplate ?? [],
        answerRule: {
          solverRule: template.solverRule,
          answerConfig: template.answerConfig,
        } as unknown as ProblemReviewJsonValue,
        hints: template.hintStepsTemplate,
        solution: template.solutionStepsTemplate,
        scaffold: null,
        tool: null,
        visual,
      },
    }
  })
}

function grade3ReviewSources(): ProblemReviewSource[] {
  return grade3MissionTemplates.map(template => {
    const visual = sourceVisual(
      template.visualModel,
      template.visualConfig as ProblemReviewJsonValue
    )
    const scaffold = (
      template.scaffoldConfig as unknown as ProblemReviewJsonValue
    )
    return {
      grade: 3,
      sourceKind: 'mission',
      sourceId: template.id,
      semester: template.semester,
      unitId: template.unitId,
      conceptId: null,
      family: template.parentSummaryTag,
      curriculumCodes: [template.curriculumCode],
      answerKind: template.answerType,
      taskActions: template.taskActions,
      requiredEvidence: actualEvidence({
        visual,
        tool: null,
        scaffold,
      }),
      visualKind: template.visualModel,
      visualSemantics: template.visualSemantics,
      rendererReviewKey: rendererReviewKey(3, template.visualModel),
      isPublic: true,
      content: {
        prompt: template.prompt,
        choices: template.choices ?? [],
        answerRule: {
          correctAnswer: template.correctAnswer,
          answerConfig: template.answerConfig,
        } as unknown as ProblemReviewJsonValue,
        hints: template.hintSteps,
        solution: template.solutionSteps,
        scaffold,
        tool: null,
        visual,
      },
    }
  })
}

function grade4ReviewSources(): ProblemReviewSource[] {
  const unitById = new Map(grade4Units.map(unit => [unit.id, unit]))
  return grade4MissionTemplates.map(template => {
    const reviewVariants = Array.from({ length: 9 }, (_, index) => {
      const variant = index + 1
      const key = `variant-${variant}`
      const built = template.build(
        variant,
        GRADE4_REVIEW_CHOICE_SEED_BASE + variant
      )
      return {
        key,
        prompt: built.prompt,
        choices: built.choices ?? [],
        correctAnswer: built.correctAnswer,
        solution: built.solutionSteps,
        visualKind: built.visualModel,
        visualConfig: built.visualConfig as ProblemReviewJsonValue,
      }
    })
    const visualKind = reviewVariants[0].visualKind
    const visual = sourceVisual(visualKind, {
      reviewCases: reviewVariants.map(variant => ({
        key: variant.key,
        visualConfig: variant.visualConfig,
      })),
    })
    const tool = template.supportTool === 'none'
      ? null
      : { kind: template.supportTool }
    return {
      grade: 4,
      sourceKind: 'mission',
      sourceId: template.id,
      semester: unitById.get(template.unitId)?.semester ?? null,
      unitId: template.unitId,
      conceptId: null,
      family: template.problemFamily,
      curriculumCodes: [template.curriculumCode],
      answerKind: template.answerType,
      taskActions: template.taskActions,
      requiredEvidence: actualEvidence({
        visual,
        tool,
        scaffold: null,
      }),
      visualKind,
      visualSemantics: template.visualSemantics,
      rendererReviewKey: rendererReviewKey(4, visualKind),
      isPublic: unitById.get(template.unitId)?.releaseStatus === 'released',
      content: {
        prompt: template.promptTemplate,
        choices: [],
        answerRule: {
          mode: 'grade4-reviewed-variants',
          variantKeys: reviewVariants.map(variant => variant.key),
        },
        hints: template.hintSteps,
        solution: [],
        scaffold: null,
        tool,
        visual,
        reviewVariants,
      },
    }
  })
}

async function practiceReviewSources(
  units: Unit[],
  concepts: Concept[]
): Promise<ProblemReviewSource[]> {
  const unitById = new Map(units.map(unit => [unit.id, unit]))
  const sources: ProblemReviewSource[] = []

  for (const concept of sortConcepts(concepts, units)) {
    const unit = unitById.get(concept.unit_id)
    if (!unit || (unit.grade !== 5 && unit.grade !== 6)) continue
    const templates = await readJsonFile<ExtendedPracticeTemplate[]>(
      'public',
      'data',
      'templates',
      getTemplateFileName(concept.id)
    )

    for (const template of templates.filter(
      candidate => candidate.concept_id === concept.id
    )) {
      const visualKind = typeof template.visual_template?.type === 'string'
        ? template.visual_template.type
        : null
      const visual = sourceVisual(
        visualKind,
        (template.visual_template ?? null) as ProblemReviewJsonValue
      )
      const scaffold = template.scaffold ?? null
      const tool = template.tool ?? null
      const curriculumCodes = template.curriculumCodes ?? [
        template.blueprint?.primaryStandard,
        ...(template.blueprint?.connectedStandards ?? []),
      ].filter((code): code is string => Boolean(code))
      const taskActions = (
        template.taskActions
        ?? template.blueprint?.taskActions
        ?? []
      ) as ProblemTaskAction[]
      const visualSemantics = visual === null
        ? 'none'
        : template.visualSemantics ?? template.blueprint?.visualSemantics

      sources.push({
        grade: unit.grade,
        sourceKind: 'template',
        sourceId: template.id,
        semester: unit.semester,
        unitId: unit.id,
        conceptId: concept.id,
        family: template.problem_family ?? '',
        curriculumCodes,
        answerKind: (template.answerKind ?? template.type) as ProblemReviewSource['answerKind'],
        taskActions,
        requiredEvidence: actualEvidence({ visual, tool, scaffold }),
        visualKind,
        visualSemantics: visualSemantics as ReviewVisualSemantics,
        rendererReviewKey: rendererReviewKey(unit.grade, visualKind),
        isPublic: true,
        content: {
          prompt: template.prompt_template,
          choices: template.choices_template ?? [],
          answerRule: template.solver_rule,
          hints: template.hint_steps_template ?? [],
          solution: template.solution_steps_template,
          scaffold,
          tool,
          visual,
        },
      })
    }
  }

  return sources
}

async function readEditorialReceipts(): Promise<EditorialLedger> {
  return readJsonFile<EditorialLedger>(
    'docs',
    'tracking',
    'problem-editorial-review-v1.json'
  )
}

function enrichReviewRows(
  rows: ProblemReviewRuntimeRow[],
  catalogItems: ProblemReviewItem[],
  ledger: EditorialLedger
): ProblemReviewRow[] {
  const catalogById = new Map(catalogItems.map(item => [item.reviewId, item]))
  const receiptById = new Map(ledger.items.map(item => [item.reviewId, item]))

  return rows.map(row => {
    const item = catalogById.get(row.reviewId)
    if (!item) throw new Error(`Missing canonical review item: ${row.reviewId}`)
    const receipt = receiptById.get(row.reviewId)
    return {
      ...row,
      semester: item.semester,
      unitId: item.unitId,
      conceptId: item.conceptId,
      family: item.family,
      curriculumCodes: item.curriculumCodes,
      taskActions: item.taskActions,
      answerKind: item.answerKind,
      requiredEvidence: item.requiredEvidence,
      visualSemantics: item.visualSemantics,
      rendererReviewVersion: item.rendererReviewVersion,
      contentHash: item.contentHash,
      reviewedContentHash: receipt?.contentHash ?? null,
      recordedReviewStatus: receipt?.status ?? null,
      reviewStatus: classifyProblemReviewStatus(item, receipt),
      reviewFindingCategories: receipt?.findingCategories ?? [],
      reviewEvidence: receipt?.evidence ?? null,
      reviewNote: receipt?.note ?? '검수 기록이 없습니다.',
    }
  })
}

export async function getProblemReviewData(): Promise<ProblemReviewData> {
  const [units, concepts] = await Promise.all([
    readJsonFile<Unit[]>('public', 'data', 'units.json'),
    readJsonFile<Concept[]>('public', 'data', 'concepts.json'),
  ])
  const [runtimePracticeRows, practiceSources, ledgerExport] = await Promise.all([
    practiceRows(units, concepts),
    practiceReviewSources(units, concepts),
    readEditorialReceipts(),
  ])
  const runtimeRows = [
    ...grade1Rows(),
    ...grade2Rows(),
    ...grade3Rows(),
    ...grade4Rows(),
    ...runtimePracticeRows,
  ]
  const catalog = buildProblemReviewCatalog([
    ...grade1ReviewSources(),
    ...grade2ReviewSources(),
    ...grade3ReviewSources(),
    ...grade4ReviewSources(),
    ...practiceSources,
  ], PROBLEM_REVIEW_RENDERER_VERSIONS)
  const rows = enrichReviewRows(runtimeRows, catalog.items, ledgerExport)
  const groupsById = new Map<string, ProblemReviewData['groups'][number]>()
  for (const row of rows) {
    const key = `${row.grade}:${row.groupId}`
    const current = groupsById.get(key)
    groupsById.set(key, {
      id: row.groupId,
      grade: row.grade,
      title: row.groupTitle,
      unitTitle: row.unitTitle,
      rowCount: (current?.rowCount ?? 0) + 1,
    })
  }
  const byGrade = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  for (const row of rows) byGrade[row.grade] += 1

  return {
    summary: {
      totalProblems: rows.length,
      totalVisualProblems: rows.filter(row => row.hasVisual).length,
      totalChoiceProblems: rows.filter(row => row.choices.length > 0).length,
      totalWrittenProblems: rows.filter(row => row.choices.length === 0).length,
      passProblems: rows.filter(row => row.reviewStatus === 'pass').length,
      blockedProblems: rows.filter(row => row.reviewStatus === 'blocked').length,
      staleProblems: rows.filter(row => row.reviewStatus === 'stale').length,
      missingProblems: rows.filter(row => row.reviewStatus === 'missing').length,
      byGrade,
    },
    groups: Array.from(groupsById.values()),
    rows,
  }
}

type ApplicationReviewGrade = ApplicationUnitInventoryEntryV1['grade']

interface ApplicationReviewOption {
  value: string
  label: string
}

interface ApplicationProofEvidence {
  mode: ApplicationProblemFamilyV1['proofMode']
  expectedCount: number
  authorityId: string | null
  proven: boolean
  checkedCount: number
  issues: string[]
}

export type ApplicationReviewEvidenceStatus = 'passed' | 'failed' | 'missing' | 'blocked'

export interface ApplicationProblemReviewCaseEvidence {
  kind: 'representative' | 'boundary'
  caseId: string
  status: ApplicationReviewEvidenceStatus
  oracleStatus: ApplicationReviewEvidenceStatus
  visualStatus: ApplicationReviewEvidenceStatus
  disclosureStatus: ApplicationReviewEvidenceStatus
  proofStatus: ApplicationReviewEvidenceStatus
  issues: string[]
}

export interface ApplicationProblemReviewFamilyEvidence {
  key: string
  familyId: string
  version: number
  source: 'draft' | 'production'
  status: ApplicationReviewEvidenceStatus
  deterministicSample: boolean
  proof: ApplicationProofEvidence
  cases: ApplicationProblemReviewCaseEvidence[]
  issues: string[]
}

export interface ApplicationProblemReviewCase {
  kind: 'representative' | 'boundary'
  problem: {
    prompt: string
    answer: string
    answerFormat: 'number' | 'choice' | 'text'
    choices: string[]
    distractors: string[]
    correctChoiceIndex: number | null
    solutionSteps: string[]
    hintSteps: string[]
  }
  reproducibility: {
    caseId: string
    instanceId: string
    seed: number
    variantIndex: number
    deterministic: boolean
  }
  independentVerification: {
    oracleAnswer: string | null
    answerMatches: boolean
    visualValid: boolean
    answerDisclosureSafe: boolean
    proofAuthorityId: string | null
    oracleStatus: ApplicationReviewEvidenceStatus
    visualStatus: ApplicationReviewEvidenceStatus
    disclosureStatus: ApplicationReviewEvidenceStatus
    proofStatus: ApplicationReviewEvidenceStatus
    status: ApplicationReviewEvidenceStatus
    issues: string[]
  }
  visual: {
    semantics: 'decorative' | 'schematic' | 'quantitative'
    before: { scene: ValidatedApplicationVisualScene | null; showAnswer: false }
    after: { scene: ValidatedApplicationVisualScene | null; showAnswer: true }
    resolutionStatus: 'ready' | 'none' | 'omitted' | 'blocked'
  }
}

export interface ApplicationProblemReviewRow {
  grade: ApplicationReviewGrade
  semester: string
  unitTitle: string
  familyId: string
  version: number
  unitId: string
  packId: string
  packVersion: number | null
  metadataEvidence: {
    status: 'passed' | 'missing'
    issues: string[]
  }
  source: 'draft' | 'production'
  conceptIds: string[]
  cognitiveDomain: ApplicationProblemFamilyV1['cognitiveDomain']
  reasoningPattern: ApplicationProblemFamilyV1['reasoningPattern']
  representations: ApplicationProblemFamilyV1['representations']
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
  visual: ApplicationProblemReviewCase['visual']
  automaticChecks: {
    deterministicSample: boolean
    proof: ApplicationProofEvidence
    audit: { status: 'passed' | 'failed'; issues: string[] }
    visual: { status: 'ready' | 'none' | 'omitted' | 'blocked'; resolver: 'resolveApplicationVisual' }
  }
  reviewCases: ApplicationProblemReviewCase[]
  familyEvidence: ApplicationProblemReviewFamilyEvidence
}

export interface ApplicationProblemReviewUnit {
  grade: ApplicationReviewGrade
  semester: string
  unitId: string
  title: string
  familyCount: number
  releaseStatuses: ApplicationProblemFamilyV1['releaseStatus'][]
}

export interface ApplicationProblemReviewData {
  summary: {
    totalRows: number
    totalUnits: number
    byGrade: Record<ApplicationReviewGrade, number>
  }
  filters: {
    grades: ApplicationReviewGrade[]
    semesters: ApplicationReviewOption[]
    units: ApplicationReviewOption[]
    concepts: ApplicationReviewOption[]
    families: ApplicationReviewOption[]
    cognitiveDomains: ApplicationReviewOption[]
    reasoningPatterns: ApplicationReviewOption[]
    representations: ApplicationReviewOption[]
    proofModes: ApplicationReviewOption[]
    releaseStatuses: ApplicationReviewOption[]
  }
  units: ApplicationProblemReviewUnit[]
  rows: ApplicationProblemReviewRow[]
  reviewedFamilies: Array<{ key: string; source: 'draft' | 'production' }>
  familyEvidence: ApplicationProblemReviewFamilyEvidence[]
}

function makeApplicationReviewOptions(values: Iterable<string>): ApplicationReviewOption[] {
  return Array.from(new Set(values))
    .sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
    .map((value) => ({ value, label: value }))
}

function stableApplicationReviewJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableApplicationReviewJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableApplicationReviewJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'undefined'
}

function applicationFamilyKey(family: Pick<ApplicationProblemFamilyV1, 'familyId' | 'version'>) {
  return `${family.familyId}@${family.version}`
}

function loadApplicationReviewProductionPacks(): UnitKnowledgePackV1[] {
  const directory = path.join(process.cwd(), 'public', 'data', 'application-problems', 'packs')
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => parseUnitKnowledgePackV1(
      JSON.parse(readFileSync(path.join(directory, file), 'utf8')),
    ))
}

type ProductionApplicationReviewEvidence = {
  rows: readonly ApplicationFamilyQualityEvidenceRow[]
  generatedSnapshots: readonly {
    family: Pick<ApplicationProblemFamilyV1, 'familyId' | 'version' | 'proofMode'>
    seed: number
    first: GeneratedApplicationProblemV1
    second: GeneratedApplicationProblemV1
  }[]
  oracleResults?: readonly {
    family: Pick<ApplicationProblemFamilyV1, 'familyId' | 'version'>
    answer?: string
    valid: boolean
  }[]
}

interface ProductionApplicationReviewCaseDeclaration {
  caseId: string
  proofCaseId?: string
  kind: 'representative' | 'boundary'
  seed: number
  variantIndex: number
}

interface ProductionApplicationReviewDeclaration {
  family: Pick<ApplicationProblemFamilyV1, 'familyId' | 'version'>
  proofAuthorityId: string
  cases: readonly ProductionApplicationReviewCaseDeclaration[]
  oracle(
    problem: GeneratedApplicationProblemV1,
    reviewCase: ProductionApplicationReviewCaseDeclaration,
  ): unknown
  visualValidator?(problem: GeneratedApplicationProblemV1): boolean
  proofValidator?(
    problem: GeneratedApplicationProblemV1,
    reviewCase: ProductionApplicationReviewCaseDeclaration,
  ): readonly string[]
}

function normalizeApplicationReviewOracleAnswer(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof (value as { normalized?: unknown }).normalized === 'string') {
    return (value as { normalized: string }).normalized
  }
  return null
}

function proofDomainCases(proof: {
  domain: {
    cases: readonly { caseId: string; seed: number }[]
    variantIndexes: readonly number[]
  }
}) {
  return proof.domain.cases.flatMap((testCase) => proof.domain.variantIndexes.map((variantIndex) => ({
    ...testCase,
    variantIndex,
  })))
}

function representativeAndBoundaryCases(
  cases: readonly { caseId: string; seed: number; variantIndex: number }[],
): ProductionApplicationReviewCaseDeclaration[] {
  if (cases.length === 0) return []
  const endpoints = [
    { ...cases[0], kind: 'representative' as const },
    { ...cases[cases.length - 1], kind: 'boundary' as const },
  ]
  return endpoints.map((testCase) => ({
    ...testCase,
    proofCaseId: testCase.caseId,
    caseId: `${testCase.caseId}-${testCase.kind}`,
  }))
}

function defaultProductionReviewDeclarations(): ProductionApplicationReviewDeclaration[] {
  const declarations: ProductionApplicationReviewDeclaration[] = []

  const releasedAuthoringUnits = [
    ...GRADE2_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates,
    ...GRADE3_APPLICATION_AUTHORING_CATALOG_V1.unitCandidates,
  ]
  releasedAuthoringUnits.forEach((unitCandidate) => {
    unitCandidate.familyCandidates.forEach((candidate) => {
      if (!candidate.proof) return
      const representative = candidate.reviewCases.find((reviewCase) => reviewCase.kind === 'representative')
      const boundary = candidate.reviewCases.filter((reviewCase) => reviewCase.kind === 'boundary').at(-1)
      if (!representative || !boundary) return
      declarations.push({
        family: candidate.family,
        proofAuthorityId: candidate.proof.authorityId,
        cases: [representative, boundary],
        oracle: (problem) => candidate.oracle(problem),
        visualValidator: (problem) => candidate.visualValidator(problem),
        proofValidator: (problem, reviewCase) => candidate.proof!.verify(problem, reviewCase),
      })
    })
  })

  G2_LENGTH_EXHAUSTIVE_PROOFS.forEach((proof) => {
    const authority = G2_LENGTH_PROOF_AUTHORITY_ENTRIES.find((candidate) => (
      candidate.familyId === proof.family.familyId && candidate.familyVersion === proof.family.version
    ))
    if (!authority) return
    declarations.push({
      family: proof.family,
      proofAuthorityId: authority.manifest.authorityId,
      cases: representativeAndBoundaryCases(proofDomainCases(proof)),
      oracle: (problem, reviewCase) => proof.oracle.evaluate({
        caseId: reviewCase.proofCaseId ?? reviewCase.caseId,
        seed: reviewCase.seed,
        variantIndex: reviewCase.variantIndex,
        params: problem.params,
        mathModel: problem.visual.mathModel,
      }),
    })
  })

  G5_GEOMETRY_PROOF_AUTHORITY_SOURCES_V1.forEach((authority) => {
    const oracle = G5_GEOMETRY_PROOF_IMPLEMENTATION_RECORDS_V1.find((candidate) => (
      candidate.kind === 'oracle' && candidate.implementationId === authority.oracleRef.implementationId
    ))
    if (!oracle || oracle.kind !== 'oracle') return
    declarations.push({
      family: { familyId: authority.familyId, version: authority.familyVersion },
      proofAuthorityId: authority.authorityId,
      cases: representativeAndBoundaryCases(authority.domain),
      oracle: (problem, reviewCase) => oracle.execute({
        caseId: reviewCase.proofCaseId ?? reviewCase.caseId,
        seed: reviewCase.seed,
        variantIndex: reviewCase.variantIndex,
        params: problem.params,
        mathModel: problem.visual.mathModel,
      }),
    })
  })

  G6_RATIO_PROOFS.forEach((proof) => {
    const authority = G6_RATIO_PROOF_AUTHORITIES.find((candidate) => (
      candidate.familyId === proof.family.familyId && candidate.familyVersion === proof.family.version
    ))
    if (!authority) return
    declarations.push({
      family: proof.family,
      proofAuthorityId: authority.manifest.authorityId,
      cases: representativeAndBoundaryCases(proofDomainCases(proof)),
      oracle: (problem, reviewCase) => proof.oracle.evaluate({
        caseId: reviewCase.proofCaseId ?? reviewCase.caseId,
        seed: reviewCase.seed,
        variantIndex: reviewCase.variantIndex,
        params: problem.params,
        mathModel: problem.visual.mathModel,
      }),
    })
  })

  return declarations
}

interface ApplicationReviewBuildInput {
  authoringCatalog?: ReviewOnlyApplicationAuthoringCatalogV1
  productionRegistry?: ApplicationProblemRegistryV1
  productionEvidence?: ProductionApplicationReviewEvidence
  productionPacks?: readonly UnitKnowledgePackV1[]
  productionReviewDeclarations?: readonly ProductionApplicationReviewDeclaration[]
  unitInventory?: readonly ApplicationUnitInventoryEntryV1[]
}

function productionReviewProblems(
  entry: ApplicationProblemRegistryEntryV1,
  snapshot: ProductionApplicationReviewEvidence['generatedSnapshots'][number] | undefined,
  declaration: ProductionApplicationReviewDeclaration | undefined,
): Array<{
  caseId: string
  kind: 'representative' | 'boundary'
  first: GeneratedApplicationProblemV1
  second: GeneratedApplicationProblemV1
  declaration: ProductionApplicationReviewDeclaration | undefined
  declaredCase: ProductionApplicationReviewCaseDeclaration | undefined
}> {
  if (entry.runtime.kind === 'static-corpus') {
    const representative = entry.runtime.entries[0]?.problem
    const boundary = entry.runtime.entries.at(-1)?.problem
    if (!representative || !boundary) {
      throw new Error(`Static review corpus is empty for ${applicationFamilyKey(entry.family)}`)
    }
    return [
      {
        caseId: `${entry.runtime.entries[0].corpusId}-representative`,
        kind: 'representative',
        first: representative,
        second: representative,
        declaration,
        declaredCase: declaration?.cases.find((reviewCase) => reviewCase.kind === 'representative'),
      },
      {
        caseId: `${entry.runtime.entries.at(-1)!.corpusId}-boundary`,
        kind: 'boundary',
        first: boundary,
        second: boundary,
        declaration,
        declaredCase: declaration?.cases.find((reviewCase) => reviewCase.kind === 'boundary'),
      },
    ]
  }
  if (!declaration) {
    if (!snapshot) return []
    return [{
      caseId: 'production-representative-evidence',
      kind: 'representative',
      first: snapshot.first,
      second: snapshot.second,
      declaration: undefined,
      declaredCase: undefined,
    }]
  }
  const generator = entry.runtime.generator
  const generate = (seed: number, variantIndex: number) => generateApplicationProblem({
    family: entry.family,
    generator,
    packVersion: generator.packVersion,
    seed,
    variantIndex,
    maxAttempts: generator.maxAttempts,
  })
  return declaration.cases.map((reviewCase) => {
    if (reviewCase.kind === 'representative' && snapshot) {
      const generatedCaseId = typeof snapshot.first.params.caseId === 'string'
        ? snapshot.first.params.caseId
        : reviewCase.proofCaseId
      return {
        caseId: 'production-runtime-sample-representative',
        kind: reviewCase.kind,
        first: generate(snapshot.seed, snapshot.first.variantIndex),
        second: generate(snapshot.seed, snapshot.first.variantIndex),
        declaration,
        declaredCase: {
          ...reviewCase,
          caseId: 'production-runtime-sample-representative',
          proofCaseId: generatedCaseId,
          seed: snapshot.seed,
          variantIndex: snapshot.first.variantIndex,
        },
      }
    }
    return {
      caseId: reviewCase.caseId,
      kind: reviewCase.kind,
      first: generate(reviewCase.seed, reviewCase.variantIndex),
      second: generate(reviewCase.seed, reviewCase.variantIndex),
      declaration,
      declaredCase: reviewCase,
    }
  })
}

function draftReviewProblems(candidate: DraftApplicationFamilyCandidateV1) {
  if (candidate.runtime.kind !== 'deterministic-generator') {
    throw new Error(`Draft review requires a deterministic runtime for ${applicationFamilyKey(candidate.family)}`)
  }
  const generator = candidate.runtime.generator
  return candidate.reviewCases.map((reviewCase) => {
    const generate = () => generateApplicationProblem({
      family: candidate.family,
      generator,
      packVersion: generator.packVersion,
      seed: reviewCase.seed,
      variantIndex: reviewCase.variantIndex,
      maxAttempts: generator.maxAttempts,
    })
    return {
      ...reviewCase,
      first: generate(),
      second: generate(),
    }
  })
}

function toReviewVisual(problem: GeneratedApplicationProblemV1) {
  const visual = resolveApplicationVisual(problem.visual)
  const scene = visual.status === 'ready' ? visual.scene : null
  return {
    semantics: problem.visual.semantics ?? 'decorative',
    before: { scene, showAnswer: false as const },
    after: { scene, showAnswer: true as const },
    resolutionStatus: visual.status,
  }
}

function hasApplicationReviewAnswerOnlyDisclosure(value: unknown, answer: string): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => hasApplicationReviewAnswerOnlyDisclosure(entry, answer))
  }
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  const before = record.before && typeof record.before === 'object'
    ? record.before as { text?: unknown; disclosure?: unknown }
    : null
  const after = record.after && typeof record.after === 'object'
    ? record.after as { disclosure?: unknown }
    : null
  if (before && typeof before.text === 'string') {
    if (before.disclosure === 'solution' || before.disclosure === 'intermediate') return true
    if (before.disclosure === 'given') return false
    if (
      (after?.disclosure === 'solution' || after?.disclosure === 'intermediate') &&
      before.text.trim() === answer
    ) return true
  }
  return Object.entries(record).some(([key, entry]) => (
    key !== 'after' && hasApplicationReviewAnswerOnlyDisclosure(entry, answer)
  ))
}

function applicationReviewDisclosureStatus(problem: GeneratedApplicationProblemV1) {
  const answer = problem.answer.normalized.trim()
  return answer !== '' && hasApplicationReviewAnswerOnlyDisclosure(problem.visual, answer)
    ? 'failed' as const
    : 'passed' as const
}

function combinedApplicationReviewStatus(
  statuses: readonly ApplicationReviewEvidenceStatus[],
): ApplicationReviewEvidenceStatus {
  if (statuses.every((status) => status === 'passed')) return 'passed'
  if (statuses.includes('blocked')) return 'blocked'
  if (statuses.includes('missing')) return 'missing'
  return 'failed'
}

function problemReviewCase(input: {
  family: ApplicationProblemFamilyV1
  caseId: string
  kind: 'representative' | 'boundary'
  first: GeneratedApplicationProblemV1
  second: GeneratedApplicationProblemV1
  oracle?: (problem: GeneratedApplicationProblemV1) => unknown
  visualValidator?: (problem: GeneratedApplicationProblemV1) => boolean
  proofAuthorityId: string | null
  proofValidator?: (problem: GeneratedApplicationProblemV1) => readonly string[]
}): ApplicationProblemReviewCase {
  const answer = input.first.answer.normalized
  const choices = [...(input.first.choices ?? [])]
  const correctChoiceIndex = input.first.correctChoiceIndex ?? null
  const deterministic = stableApplicationReviewJson(input.first) === stableApplicationReviewJson(input.second)
  const visual = toReviewVisual(input.first)
  const issues: string[] = []
  let oracleAnswer: string | null = null
  let oracleStatus: ApplicationReviewEvidenceStatus = 'missing'
  if (!input.oracle) {
    issues.push('missing independent oracle evidence')
  } else {
    try {
      oracleAnswer = normalizeApplicationReviewOracleAnswer(input.oracle(input.first))
      oracleStatus = oracleAnswer === null ? 'missing' : oracleAnswer === answer ? 'passed' : 'failed'
      if (oracleStatus !== 'passed') issues.push('independent oracle disagrees with the generated answer')
    } catch (error) {
      oracleStatus = 'blocked'
      issues.push(`independent oracle blocked: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  let visualStatus: ApplicationReviewEvidenceStatus =
    visual.resolutionStatus === 'ready' || visual.resolutionStatus === 'none'
      ? 'passed'
      : visual.resolutionStatus === 'blocked'
        ? 'blocked'
        : 'failed'
  if (visualStatus === 'passed' && input.visualValidator) {
    try {
      if (!input.visualValidator(input.first)) visualStatus = 'failed'
    } catch (error) {
      visualStatus = 'blocked'
      issues.push(`declared visual validator blocked: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  if (visualStatus !== 'passed' && !issues.some((issue) => issue.includes('visual'))) {
    issues.push(`visual evidence ${visualStatus}`)
  }
  const disclosureStatus = applicationReviewDisclosureStatus(input.first)
  if (disclosureStatus !== 'passed') issues.push('answer-only value is exposed before submission')
  if (!deterministic) issues.push('declared review case is not deterministic')
  const proofPrerequisites: ApplicationReviewEvidenceStatus[] = [
    deterministic ? 'passed' : 'failed',
    oracleStatus,
    visualStatus,
    disclosureStatus,
  ]
  let proofValidationStatus: ApplicationReviewEvidenceStatus = 'passed'
  if (input.proofValidator) {
    try {
      const proofIssues = [...input.proofValidator(input.first)]
      if (proofIssues.length > 0) {
        proofValidationStatus = 'failed'
        issues.push(...proofIssues.map((issue) => `independent proof failed: ${issue}`))
      }
    } catch (error) {
      proofValidationStatus = 'blocked'
      issues.push(`independent proof blocked: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  const proofStatus = input.proofAuthorityId === null
    ? 'missing'
    : combinedApplicationReviewStatus([...proofPrerequisites, proofValidationStatus])
  if (proofStatus === 'missing') issues.push('missing case-specific proof authority')
  const status = combinedApplicationReviewStatus([
    oracleStatus,
    visualStatus,
    disclosureStatus,
    proofStatus,
    deterministic ? 'passed' : 'failed',
  ])
  return {
    kind: input.kind,
    problem: {
      prompt: input.first.prompt,
      answer,
      answerFormat: input.first.answer.format,
      choices,
      distractors: choices.filter((choice, index) => (
        correctChoiceIndex === null ? choice !== answer : index !== correctChoiceIndex
      )),
      correctChoiceIndex,
      solutionSteps: [...input.first.solutionSteps],
      hintSteps: [...input.first.hintSteps],
    },
    reproducibility: {
      caseId: input.caseId,
      instanceId: input.first.instanceId,
      seed: input.first.seed,
      variantIndex: input.first.variantIndex,
      deterministic,
    },
    independentVerification: {
      oracleAnswer,
      answerMatches: oracleStatus === 'passed',
      visualValid: visualStatus === 'passed',
      answerDisclosureSafe: disclosureStatus === 'passed',
      proofAuthorityId: input.proofAuthorityId,
      oracleStatus,
      visualStatus,
      disclosureStatus,
      proofStatus,
      status,
      issues,
    },
    visual,
  }
}

function packMisconceptions(
  pack: UnitKnowledgePackV1 | undefined,
  problem: Pick<GeneratedApplicationProblemV1, 'misconceptionRefs'>,
) {
  const misconceptionById = new Map(
    (pack?.concepts ?? []).flatMap((concept) => concept.misconceptions.map((misconception) => [
      misconception.id,
      { id: misconception.id, description: misconception.description },
    ])),
  )
  return problem.misconceptionRefs.map((id) => {
    const misconception = misconceptionById.get(id)
    return misconception ?? { id, description: id }
  })
}

function rowFromCases(input: {
  family: ApplicationProblemFamilyV1
  pack: UnitKnowledgePackV1 | undefined
  packVersion: number | null
  metadataIssues: string[]
  inventoryUnit: ApplicationUnitInventoryEntryV1
  source: 'draft' | 'production'
  cases: ApplicationProblemReviewCase[]
  proof: ApplicationProofEvidence
  audit: { status: 'passed' | 'failed'; issues: string[] }
}): ApplicationProblemReviewRow {
  const representative = input.cases.find((reviewCase) => reviewCase.kind === 'representative') ?? input.cases[0]
  if (!representative) {
    throw new Error(`Missing representative review problem for ${applicationFamilyKey(input.family)}`)
  }
  const caseEvidence = input.cases.map((reviewCase): ApplicationProblemReviewCaseEvidence => ({
    kind: reviewCase.kind,
    caseId: reviewCase.reproducibility.caseId,
    status: reviewCase.independentVerification.status,
    oracleStatus: reviewCase.independentVerification.oracleStatus,
    visualStatus: reviewCase.independentVerification.visualStatus,
    disclosureStatus: reviewCase.independentVerification.disclosureStatus,
    proofStatus: reviewCase.independentVerification.proofStatus,
    issues: [...reviewCase.independentVerification.issues],
  }))
  const missingCaseKinds = (['representative', 'boundary'] as const).filter((kind) => (
    !caseEvidence.some((evidence) => evidence.kind === kind)
  ))
  const familyIssues = Array.from(new Set([
    ...input.metadataIssues,
    ...input.audit.issues,
    ...missingCaseKinds.map((kind) => `missing declared ${kind} review evidence`),
    ...caseEvidence.flatMap((evidence) => evidence.issues.map((issue) => `${evidence.kind}: ${issue}`)),
  ]))
  const familyStatus = combinedApplicationReviewStatus([
    input.metadataIssues.length === 0 ? 'passed' : 'missing',
    input.audit.status === 'passed' ? 'passed' : 'failed',
    ...missingCaseKinds.map(() => 'missing' as const),
    ...caseEvidence.map((evidence) => evidence.status),
  ])
  const familyEvidence: ApplicationProblemReviewFamilyEvidence = {
    key: applicationFamilyKey(input.family),
    familyId: input.family.familyId,
    version: input.family.version,
    source: input.source,
    status: familyStatus,
    deterministicSample: input.cases.every((reviewCase) => reviewCase.reproducibility.deterministic),
    proof: input.proof,
    cases: caseEvidence,
    issues: familyIssues,
  }
  return {
    grade: input.inventoryUnit.grade,
    semester: input.inventoryUnit.semester,
    unitTitle: input.inventoryUnit.title,
    familyId: input.family.familyId,
    version: input.family.version,
    unitId: input.family.unitId,
    packId: input.family.packId,
    packVersion: input.packVersion,
    metadataEvidence: {
      status: input.metadataIssues.length === 0 ? 'passed' : 'missing',
      issues: [...input.metadataIssues],
    },
    source: input.source,
    conceptIds: [...input.family.conceptIds],
    cognitiveDomain: input.family.cognitiveDomain,
    reasoningPattern: input.family.reasoningPattern,
    representations: [...input.family.representations],
    standards: Array.from(new Set([input.family.primaryStandard, ...input.family.connectedStandards])),
    proofMode: input.family.proofMode,
    releaseStatus: input.family.releaseStatus,
    prompt: representative.problem.prompt,
    answer: representative.problem.answer,
    answerFormat: representative.problem.answerFormat,
    choices: representative.problem.choices,
    correctChoiceIndex: representative.problem.correctChoiceIndex,
    solutionSteps: representative.problem.solutionSteps,
    hintSteps: representative.problem.hintSteps,
    misconceptions: packMisconceptions(input.pack, {
      misconceptionRefs: input.family.misconceptionRefs,
    }),
    visual: representative.visual,
    automaticChecks: {
      deterministicSample: input.cases.every((reviewCase) => reviewCase.reproducibility.deterministic),
      proof: input.proof,
      audit: {
        status: familyIssues.length === 0 ? 'passed' : 'failed',
        issues: familyIssues,
      },
      visual: {
        status: representative.visual.resolutionStatus,
        resolver: 'resolveApplicationVisual',
      },
    },
    reviewCases: input.cases,
    familyEvidence,
  }
}

function sortApplicationReviewRows(rows: ApplicationProblemReviewRow[]) {
  return rows.sort((left, right) => (
    left.grade - right.grade ||
    (left.semester < right.semester ? -1 : left.semester > right.semester ? 1 : 0) ||
    (left.unitId < right.unitId ? -1 : left.unitId > right.unitId ? 1 : 0) ||
    (left.familyId < right.familyId ? -1 : left.familyId > right.familyId ? 1 : 0) ||
    left.version - right.version
  ))
}

function applicationPackKey(packId: string, packVersion: number) {
  return `${packId}@${packVersion}`
}

function productionSourcePackVersion(
  entry: ApplicationProblemRegistryEntryV1,
  snapshot: ProductionApplicationReviewEvidence['generatedSnapshots'][number] | undefined,
): number | null {
  if (entry.runtime.kind === 'deterministic-generator') return entry.runtime.generator.packVersion
  const versions = new Set<number>()
  entry.runtime.entries.forEach((corpusEntry) => {
    if (Number.isSafeInteger(corpusEntry.problem.packVersion) && corpusEntry.problem.packVersion > 0) {
      versions.add(corpusEntry.problem.packVersion)
    }
  })
  for (const problem of snapshot ? [snapshot.first, snapshot.second] : []) {
    if (Number.isSafeInteger(problem.packVersion) && problem.packVersion > 0) versions.add(problem.packVersion)
  }
  return versions.size === 1 ? Array.from(versions)[0] : null
}

function resolveProductionReviewPack(input: {
  entry: ApplicationProblemRegistryEntryV1
  snapshot: ProductionApplicationReviewEvidence['generatedSnapshots'][number] | undefined
  packsByIdentity: ReadonlyMap<string, readonly UnitKnowledgePackV1[]>
  packsById: ReadonlyMap<string, readonly UnitKnowledgePackV1[]>
}) {
  const packVersion = productionSourcePackVersion(input.entry, input.snapshot)
  if (packVersion !== null) {
    const matches = input.packsByIdentity.get(applicationPackKey(input.entry.family.packId, packVersion)) ?? []
    if (matches.length === 1) return { pack: matches[0], packVersion, issues: [] as string[] }
    return {
      pack: undefined,
      packVersion,
      issues: [matches.length === 0
        ? `missing production pack ${applicationPackKey(input.entry.family.packId, packVersion)}`
        : `ambiguous production pack identity ${applicationPackKey(input.entry.family.packId, packVersion)}`],
    }
  }
  const legacyMatches = input.packsById.get(input.entry.family.packId) ?? []
  if (legacyMatches.length === 1) {
    return { pack: legacyMatches[0], packVersion: legacyMatches[0].version, issues: [] as string[] }
  }
  return {
    pack: undefined,
    packVersion: null,
    issues: [`ambiguous production pack version for ${input.entry.family.packId}`],
  }
}

export function buildApplicationProblemReviewData(
  input: ApplicationReviewBuildInput = {},
): ApplicationProblemReviewData {
  const authoringCatalog = input.authoringCatalog ?? APPLICATION_PROBLEM_AUTHORING_CATALOG_V1
  const productionRegistry = input.productionRegistry ?? APPLICATION_PROBLEM_REGISTRY_V1
  const productionEvidence = input.productionEvidence ?? getProductionApplicationFamilyEvidence()
  const productionPacks = input.productionPacks ?? loadApplicationReviewProductionPacks()
  const productionReviewDeclarations = input.productionReviewDeclarations ?? defaultProductionReviewDeclarations()
  const unitInventory = input.unitInventory ?? APPLICATION_UNIT_INVENTORY_V1
  const unitByIdentity = new Map(unitInventory.map((unit) => [`${unit.grade}:${unit.unitId}`, unit]))
  const unitById = new Map(unitInventory.map((unit) => [unit.unitId, unit]))
  const packsByIdentity = new Map<string, UnitKnowledgePackV1[]>()
  const packsById = new Map<string, UnitKnowledgePackV1[]>()
  productionPacks.forEach((pack) => {
    const byIdentity = packsByIdentity.get(applicationPackKey(pack.packId, pack.version)) ?? []
    byIdentity.push(pack)
    packsByIdentity.set(applicationPackKey(pack.packId, pack.version), byIdentity)
    const byId = packsById.get(pack.packId) ?? []
    byId.push(pack)
    packsById.set(pack.packId, byId)
  })
  const evidenceByFamily = new Map(productionEvidence.rows.map((evidence) => [evidence.key, evidence]))
  const snapshotByFamily = new Map(productionEvidence.generatedSnapshots.map((snapshot) => [
    applicationFamilyKey(snapshot.family),
    snapshot,
  ]))
  const declarationByFamily = new Map(productionReviewDeclarations.map((declaration) => [
    applicationFamilyKey(declaration.family),
    declaration,
  ]))
  const rowsByFamily = new Map<string, ApplicationProblemReviewRow>()

  productionRegistry.entries.forEach((entry) => {
    const key = applicationFamilyKey(entry.family)
    const snapshot = snapshotByFamily.get(key)
    const packResolution = resolveProductionReviewPack({
      entry,
      snapshot,
      packsByIdentity,
      packsById,
    })
    const inventoryUnit = packResolution.pack
      ? unitByIdentity.get(`${packResolution.pack.grade}:${packResolution.pack.unitId}`)
      : unitById.get(entry.family.unitId)
    if (!inventoryUnit) {
      throw new Error(`Missing production review metadata for ${key}`)
    }
    const evidence = evidenceByFamily.get(key) ?? {
      key,
      familyId: entry.family.familyId,
      version: entry.family.version,
      status: 'failed' as const,
      deterministicSample: false,
      proof: {
        mode: entry.family.proofMode,
        authorityId: null,
        expectedCount: 0,
        proven: false,
        checkedCount: 0,
        issues: ['missing production quality evidence'],
      },
      audit: {
        status: 'failed' as const,
        issues: ['missing production quality evidence'],
      },
    }
    const declaration = declarationByFamily.get(key)
    const cases = productionReviewProblems(entry, snapshot, declaration).map((reviewCase) => (
      problemReviewCase({
        family: entry.family,
        ...reviewCase,
        oracle: reviewCase.declaration && reviewCase.declaredCase
          ? (problem) => reviewCase.declaration!.oracle(problem, reviewCase.declaredCase!)
          : undefined,
        visualValidator: reviewCase.declaration?.visualValidator,
        proofAuthorityId: reviewCase.declaration && reviewCase.declaredCase
          ? reviewCase.declaration.proofAuthorityId
          : null,
        proofValidator: reviewCase.declaration?.proofValidator && reviewCase.declaredCase
          ? (problem) => reviewCase.declaration!.proofValidator!(problem, reviewCase.declaredCase!)
          : undefined,
      })
    ))
    rowsByFamily.set(key, rowFromCases({
      family: entry.family,
      pack: packResolution.pack,
      packVersion: packResolution.packVersion,
      metadataIssues: packResolution.issues,
      inventoryUnit,
      source: 'production',
      cases,
      proof: evidence.proof,
      audit: evidence.audit,
    }))
  })

  authoringCatalog.unitCandidates.forEach((unitCandidate) => {
    const inventoryUnit = unitByIdentity.get(`${unitCandidate.pack.grade}:${unitCandidate.pack.unitId}`)
    if (!inventoryUnit) {
      throw new Error(`Missing authoring inventory unit ${unitCandidate.pack.grade}:${unitCandidate.pack.unitId}`)
    }
    unitCandidate.familyCandidates.forEach((candidate) => {
      const key = applicationFamilyKey(candidate.family)
      if (rowsByFamily.has(key)) return
      const reviewProblems = draftReviewProblems(candidate)
      const cases = reviewProblems.map((reviewCase) => {
        return problemReviewCase({
          family: candidate.family,
          ...reviewCase,
          oracle: (problem) => candidate.oracle(problem),
          visualValidator: (problem) => candidate.visualValidator(problem),
          proofAuthorityId: candidate.proof?.authorityId ?? null,
          proofValidator: candidate.proof
            ? (problem) => candidate.proof!.verify(problem, reviewCase)
            : undefined,
        })
      })
      const passedCases = cases.filter((reviewCase) => (
        reviewCase.independentVerification.status === 'passed'
      )).length
      const caseIssues = passedCases === cases.length
        ? []
        : ['draft representative or boundary evidence failed']
      const proofIssues = candidate.proof
        ? [...candidate.proof.issues]
        : ['missing draft proof evidence']
      const issues = [...caseIssues, ...proofIssues]
      rowsByFamily.set(key, rowFromCases({
        family: candidate.family,
        pack: unitCandidate.pack,
        packVersion: unitCandidate.pack.version,
        metadataIssues: [],
        inventoryUnit,
        source: 'draft',
        cases,
        proof: {
          mode: candidate.family.proofMode,
          expectedCount: candidate.proof?.expectedCount ?? cases.length,
          authorityId: candidate.proof?.authorityId ?? null,
          proven: candidate.proof?.proven === true && issues.length === 0,
          checkedCount: candidate.proof?.checkedCount ?? 0,
          issues: proofIssues,
        },
        audit: { status: issues.length === 0 ? 'passed' : 'failed', issues },
      }))
    })
  })

  const rows = sortApplicationReviewRows(Array.from(rowsByFamily.values()))
  const units = unitInventory.map((unit): ApplicationProblemReviewUnit => {
    const unitRows = rows.filter((row) => row.grade === unit.grade && row.unitId === unit.unitId)
    return {
      grade: unit.grade,
      semester: unit.semester,
      unitId: unit.unitId,
      title: unit.title,
      familyCount: unitRows.length,
      releaseStatuses: Array.from(new Set(unitRows.map((row) => row.releaseStatus))).sort(),
    }
  })
  const gradeCounts = Object.fromEntries(
    Array.from(new Set(unitInventory.map((unit) => unit.grade)))
      .sort((left, right) => left - right)
      .map((grade) => [grade, unitInventory.filter((unit) => unit.grade === grade).length]),
  ) as Record<ApplicationReviewGrade, number>

  return {
    summary: { totalRows: rows.length, totalUnits: units.length, byGrade: gradeCounts },
    filters: {
      grades: Array.from(new Set(unitInventory.map((unit) => unit.grade))).sort((left, right) => left - right),
      semesters: makeApplicationReviewOptions(unitInventory.map((unit) => unit.semester)),
      units: unitInventory
        .map((unit) => ({ value: unit.unitId, label: `${unit.grade}학년 · ${unit.title}` }))
        .sort((left, right) => left.value < right.value ? -1 : left.value > right.value ? 1 : 0),
      concepts: makeApplicationReviewOptions(rows.flatMap((row) => row.conceptIds)),
      families: makeApplicationReviewOptions(rows.map((row) => row.familyId)),
      cognitiveDomains: makeApplicationReviewOptions(rows.map((row) => row.cognitiveDomain)),
      reasoningPatterns: makeApplicationReviewOptions(rows.map((row) => row.reasoningPattern)),
      representations: makeApplicationReviewOptions(rows.flatMap((row) => row.representations)),
      proofModes: makeApplicationReviewOptions(rows.map((row) => row.proofMode)),
      releaseStatuses: makeApplicationReviewOptions(rows.map((row) => row.releaseStatus)),
    },
    units,
    rows,
    reviewedFamilies: rows.map((row) => ({
      key: applicationFamilyKey(row),
      source: row.source,
    })),
    familyEvidence: rows.map((row) => row.familyEvidence),
  }
}

export function getApplicationProblemReviewData(): ApplicationProblemReviewData {
  return buildApplicationProblemReviewData()
}
