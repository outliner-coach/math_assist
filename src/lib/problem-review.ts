import { readFile } from 'node:fs/promises'
import path from 'node:path'

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
  const receiptPaths = [
    'grade1-3.json',
    'grade4.json',
    'grade5.json',
    'grade6.json',
  ]
  const ledgers = await Promise.all(receiptPaths.map(fileName => (
    readJsonFile<EditorialLedger>(
      'docs',
      'tracking',
      'problem-editorial-review-work',
      fileName
    )
  )))
  return {
    schemaVersion: 1,
    items: ledgers
      .flatMap(ledger => ledger.items)
      .sort((left, right) => left.reviewId.localeCompare(right.reviewId)),
  }
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
