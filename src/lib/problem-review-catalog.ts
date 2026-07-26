import { createHash } from 'node:crypto'

export const PROBLEM_REVIEW_CATALOG_SCHEMA_VERSION = 1 as const
export const EDITORIAL_LEDGER_SCHEMA_VERSION = 1 as const

export const ANSWER_KINDS = [
  'choice',
  'number',
  'integer',
  'label',
  'decimal',
  'fraction',
  'length',
  'time-of-day',
  'duration',
  'capacity',
  'weight',
  'angle',
] as const

export const TASK_ACTIONS = [
  'recognize',
  'classify',
  'compare',
  'calculate',
  'measure',
  'construct',
  'model',
  'interpret',
  'explain',
  'analyze_error',
  'reason',
] as const

export const REQUIRED_EVIDENCE_KINDS = [
  'text',
  'visual',
  'tool',
  'scaffold',
] as const

export const VISUAL_SEMANTICS = [
  'none',
  'decorative',
  'schematic',
  'quantitative',
] as const

export const EDITORIAL_FINDING_CATEGORIES = [
  'math',
  'curriculum',
  'solvability',
  'wording',
  'answer',
  'hint_solution',
  'grade_appropriateness',
  'visual_semantics',
  'visual_readability',
  'answer_exposure',
  'accessibility',
] as const

export type ReviewGrade = 1 | 2 | 3 | 4 | 5 | 6
export type ReviewSourceKind = 'mission' | 'template'
export type AnswerKind = typeof ANSWER_KINDS[number]
export type TaskAction = typeof TASK_ACTIONS[number]
export type RequiredEvidenceKind = typeof REQUIRED_EVIDENCE_KINDS[number]
export type ReviewVisualSemantics = typeof VISUAL_SEMANTICS[number]
export type EditorialFindingCategory = typeof EDITORIAL_FINDING_CATEGORIES[number]
export type RendererReviewVersionRegistry = Record<string, string>

export type ProblemReviewJsonValue =
  | string
  | number
  | boolean
  | null
  | ProblemReviewJsonValue[]
  | { [key: string]: ProblemReviewJsonValue }

export interface ProblemReviewGeneratedVariant {
  key: string
  prompt: string
  choices: string[]
  correctAnswer: string
  solution: string[]
  visualKind: string | null
  visualConfig: ProblemReviewJsonValue
}

export interface ProblemReviewContent {
  prompt: string
  choices: string[]
  answerRule: ProblemReviewJsonValue
  hints: string[]
  solution: string[]
  scaffold: ProblemReviewJsonValue
  tool: ProblemReviewJsonValue
  visual: {
    kind: string
    config: ProblemReviewJsonValue
  } | null
  reviewVariants?: ProblemReviewGeneratedVariant[]
}

export interface ProblemReviewSource {
  grade: ReviewGrade
  sourceKind: ReviewSourceKind
  sourceId: string
  semester: string | null
  unitId: string
  conceptId: string | null
  family: string
  curriculumCodes: string[]
  answerKind: AnswerKind
  taskActions: TaskAction[]
  requiredEvidence: RequiredEvidenceKind[]
  visualKind: string | null
  visualSemantics: ReviewVisualSemantics
  rendererReviewKey: string
  isPublic: boolean
  content: ProblemReviewContent
}

export interface ProblemReviewItem extends Omit<ProblemReviewSource, 'rendererReviewKey'> {
  reviewId: string
  rendererReviewVersion: string
  contentHash: string
}

export interface ProblemReviewCatalog {
  schemaVersion: typeof PROBLEM_REVIEW_CATALOG_SCHEMA_VERSION
  rendererReviewVersions: RendererReviewVersionRegistry
  items: ProblemReviewItem[]
}

export interface GradeProblemReviewAdapter<TSource = unknown> {
  grade: ReviewGrade
  sourceKind: ReviewSourceKind
  adapt: (source: TSource) => ProblemReviewSource
}

export interface EditorialEvidence {
  editorialRead: boolean
  variantAudit: boolean
  preAnswer: boolean
  hint: boolean
  revealed: boolean
  mobile: boolean
  tablet: boolean
  artifacts: string[]
}

export interface EditorialLedgerItem {
  reviewId: string
  contentHash: string
  status: 'pass' | 'blocked'
  findingCategories: EditorialFindingCategory[]
  note: string
  evidence: EditorialEvidence
}

export interface EditorialLedger {
  schemaVersion: typeof EDITORIAL_LEDGER_SCHEMA_VERSION
  items: EditorialLedgerItem[]
}

const ANSWER_KIND_SET = new Set<string>(ANSWER_KINDS)
const TASK_ACTION_SET = new Set<string>(TASK_ACTIONS)
const REQUIRED_EVIDENCE_SET = new Set<string>(REQUIRED_EVIDENCE_KINDS)
const VISUAL_SEMANTICS_SET = new Set<string>(VISUAL_SEMANTICS)
const FINDING_CATEGORY_SET = new Set<string>(EDITORIAL_FINDING_CATEGORIES)
const EVIDENCE_BOOLEAN_KEYS = [
  'editorialRead',
  'variantAudit',
  'preAnswer',
  'hint',
  'revealed',
  'mobile',
  'tablet',
] as const
const LEDGER_ITEM_KEYS = [
  'reviewId',
  'contentHash',
  'status',
  'findingCategories',
  'note',
  'evidence',
]
const EVIDENCE_KEYS = [...EVIDENCE_BOOLEAN_KEYS, 'artifacts']

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizedUniqueStrings(values: string[]) {
  return Array.from(new Set(values)).sort(compareText)
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Cannot canonicalize a non-finite number')
    return value
  }
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareText)
        .map(key => {
          if (value[key] === undefined) {
            throw new Error(`Cannot canonicalize undefined field "${key}"`)
          }
          return [key, canonicalize(value[key])]
        })
    )
  }
  throw new Error(`Cannot canonicalize ${typeof value}`)
}

export function stableJsonStringify(value: unknown) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`
}

function reviewIdFor(source: Pick<ProblemReviewSource, 'grade' | 'sourceKind' | 'sourceId'>) {
  return `${source.grade}:${source.sourceKind}:${source.sourceId}`
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validateStringArray(
  value: unknown,
  field: string,
  reviewId: string,
  errors: string[],
  allowEmpty = true
) {
  if (!Array.isArray(value)) {
    errors.push(`${reviewId}: ${field} must be an array`)
    return
  }
  if (!allowEmpty && value.length === 0) {
    errors.push(`${reviewId}: ${field} must contain at least one value`)
  }
  value.forEach((item, index) => {
    if (!nonEmptyString(item)) {
      errors.push(`${reviewId}: ${field}[${index}] must be a non-empty string`)
    }
  })
}

export function validateProblemReviewSource(source: ProblemReviewSource) {
  const reviewId = reviewIdFor(source)
  const errors: string[] = []

  if (![1, 2, 3, 4, 5, 6].includes(source.grade)) {
    errors.push(`${reviewId}: grade must be between 1 and 6`)
  }
  const expectedSourceKind = source.grade <= 4 ? 'mission' : 'template'
  if (source.sourceKind !== expectedSourceKind) {
    errors.push(`${reviewId}: sourceKind must be ${expectedSourceKind} for Grade ${source.grade}`)
  }
  if (!nonEmptyString(source.sourceId) || source.sourceId.includes(':')) {
    errors.push(`${reviewId}: sourceId must be non-empty and cannot contain ":"`)
  }
  if (source.grade === 1) {
    if (source.semester !== null) {
      errors.push(`${reviewId}: semester must be null for Grade 1`)
    }
  } else if (!nonEmptyString(source.semester)) {
    errors.push(`${reviewId}: semester must preserve the non-empty source value`)
  }
  if (!nonEmptyString(source.unitId)) errors.push(`${reviewId}: unitId is required`)
  if (source.grade >= 5) {
    if (!nonEmptyString(source.conceptId)) {
      errors.push(`${reviewId}: conceptId is required for Grade ${source.grade}`)
    }
  } else if (source.conceptId !== null) {
    errors.push(`${reviewId}: conceptId must be null for Grade ${source.grade}`)
  }
  if (!nonEmptyString(source.family)) {
    errors.push(`${reviewId}: family is required and cannot be inferred`)
  }

  validateStringArray(source.curriculumCodes, 'curriculumCodes', reviewId, errors)
  if (!ANSWER_KIND_SET.has(source.answerKind)) {
    errors.push(`${reviewId}: answerKind "${source.answerKind}" is not allowed`)
  }
  if (!Array.isArray(source.taskActions) || source.taskActions.length === 0) {
    errors.push(`${reviewId}: taskActions requires at least one explicit quality metadata value`)
  } else {
    for (const action of source.taskActions) {
      if (!TASK_ACTION_SET.has(action)) {
        errors.push(`${reviewId}: taskActions contains unsupported value "${action}"`)
      }
    }
  }

  if (!Array.isArray(source.requiredEvidence)) {
    errors.push(`${reviewId}: requiredEvidence must be an array`)
  } else {
    for (const evidence of source.requiredEvidence) {
      if (!REQUIRED_EVIDENCE_SET.has(evidence)) {
        errors.push(`${reviewId}: requiredEvidence contains unsupported value "${evidence}"`)
      }
    }
    const actualRequired = new Set<RequiredEvidenceKind>(['text'])
    if (source.content?.visual !== null) actualRequired.add('visual')
    if (source.content?.tool !== null) actualRequired.add('tool')
    if (source.content?.scaffold !== null) actualRequired.add('scaffold')
    for (const evidence of Array.from(actualRequired)) {
      if (!source.requiredEvidence.includes(evidence)) {
        errors.push(`${reviewId}: requiredEvidence must include actual ${evidence} evidence`)
      }
    }
    for (const evidence of source.requiredEvidence) {
      if (!actualRequired.has(evidence)) {
        errors.push(`${reviewId}: requiredEvidence includes ${evidence} without matching source content`)
      }
    }
  }

  if (source.visualKind === null) {
    if (source.content?.visual !== null) {
      errors.push(`${reviewId}: visualKind must preserve the actual visual kind`)
    }
    if (source.visualSemantics !== 'none') {
      errors.push(`${reviewId}: visualSemantics must be none when visualKind is null`)
    }
  } else {
    if (!nonEmptyString(source.visualKind)) {
      errors.push(`${reviewId}: visualKind must be a non-empty source value or null`)
    }
    if (source.content?.visual === null) {
      errors.push(`${reviewId}: visualKind cannot exist without visual content`)
    } else if (
      isRecord(source.content?.visual)
      && source.content.visual.kind !== source.visualKind
    ) {
      errors.push(`${reviewId}: visualKind must equal the actual content.visual.kind`)
    }
    if (source.visualSemantics === 'none') {
      errors.push(`${reviewId}: visualSemantics requires explicit decorative, schematic, or quantitative metadata`)
    }
  }
  if (!VISUAL_SEMANTICS_SET.has(source.visualSemantics)) {
    errors.push(
      source.visualKind === null
        ? `${reviewId}: visualSemantics "${source.visualSemantics}" is not allowed`
        : `${reviewId}: visualSemantics requires explicit decorative, schematic, or quantitative metadata`
    )
  }
  if (!nonEmptyString(source.rendererReviewKey)) {
    errors.push(`${reviewId}: rendererReviewKey is required`)
  }
  if (typeof source.isPublic !== 'boolean') {
    errors.push(`${reviewId}: isPublic must be boolean`)
  }

  if (!isRecord(source.content)) {
    errors.push(`${reviewId}: content is required`)
  } else {
    if (!nonEmptyString(source.content.prompt)) errors.push(`${reviewId}: content.prompt is required`)
    validateStringArray(source.content.choices, 'content.choices', reviewId, errors)
    if (source.content.answerRule === undefined) errors.push(`${reviewId}: content.answerRule is required`)
    validateStringArray(source.content.hints, 'content.hints', reviewId, errors)
    validateStringArray(source.content.solution, 'content.solution', reviewId, errors)
    if (
      source.content.reviewVariants !== undefined
      && !Array.isArray(source.content.reviewVariants)
    ) {
      errors.push(`${reviewId}: content.reviewVariants must be an array when present`)
    }
  }

  return errors
}

function normalizeSource(source: ProblemReviewSource): ProblemReviewSource {
  return {
    ...source,
    sourceId: source.sourceId.trim(),
    semester: source.semester === null ? null : source.semester.trim(),
    unitId: source.unitId.trim(),
    conceptId: source.conceptId === null ? null : source.conceptId.trim(),
    family: source.family.trim(),
    curriculumCodes: normalizedUniqueStrings(source.curriculumCodes.map(code => code.trim())),
    taskActions: normalizedUniqueStrings(source.taskActions) as TaskAction[],
    requiredEvidence: REQUIRED_EVIDENCE_KINDS.filter(kind =>
      source.requiredEvidence.includes(kind)
    ),
    visualKind: source.visualKind === null ? null : source.visualKind.trim(),
    rendererReviewKey: source.rendererReviewKey.trim(),
    content: canonicalize(source.content) as ProblemReviewContent,
  }
}

export function createProblemReviewItem(
  source: ProblemReviewSource,
  rendererReviewVersions: RendererReviewVersionRegistry
): ProblemReviewItem {
  const reviewId = reviewIdFor(source)
  const errors = validateProblemReviewSource(source)
  const rendererReviewVersion = rendererReviewVersions[source.rendererReviewKey]
  if (!nonEmptyString(rendererReviewVersion)) {
    errors.push(
      `${reviewId}: ${source.rendererReviewKey || '(missing key)'} has no renderer review version`
    )
  }
  if (errors.length > 0) throw new Error(errors.join('\n'))

  const normalized = normalizeSource(source)
  const hashPayload = {
    grade: normalized.grade,
    sourceKind: normalized.sourceKind,
    sourceId: normalized.sourceId,
    semester: normalized.semester,
    unitId: normalized.unitId,
    conceptId: normalized.conceptId,
    family: normalized.family,
    curriculumCodes: normalized.curriculumCodes,
    answerKind: normalized.answerKind,
    taskActions: normalized.taskActions,
    requiredEvidence: normalized.requiredEvidence,
    visualKind: normalized.visualKind,
    visualSemantics: normalized.visualSemantics,
    isPublic: normalized.isPublic,
    content: normalized.content,
    rendererReviewVersion,
  }
  const contentHash = createHash('sha256')
    .update(JSON.stringify(canonicalize(hashPayload)))
    .digest('hex')
  const { rendererReviewKey: _rendererReviewKey, ...itemSource } = normalized

  return {
    reviewId,
    ...itemSource,
    rendererReviewVersion,
    contentHash,
  }
}

export function buildProblemReviewCatalog(
  sources: ProblemReviewSource[],
  rendererReviewVersions: RendererReviewVersionRegistry
): ProblemReviewCatalog {
  const items: ProblemReviewItem[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  for (const source of sources) {
    const reviewId = reviewIdFor(source)
    if (seen.has(reviewId)) {
      errors.push(`duplicate reviewId: ${reviewId}`)
      continue
    }
    seen.add(reviewId)
    try {
      items.push(createProblemReviewItem(source, rendererReviewVersions))
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }
  if (errors.length > 0) throw new Error(errors.join('\n'))

  items.sort((left, right) => compareText(left.reviewId, right.reviewId))
  return {
    schemaVersion: PROBLEM_REVIEW_CATALOG_SCHEMA_VERSION,
    rendererReviewVersions: Object.fromEntries(
      Object.entries(rendererReviewVersions).sort(([left], [right]) => compareText(left, right))
    ),
    items,
  }
}

function exactKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort(compareText)
  const normalizedExpected = [...expected].sort(compareText)
  return actual.length === normalizedExpected.length
    && actual.every((key, index) => key === normalizedExpected[index])
}

function validateEvidence(reviewId: string, evidence: unknown, errors: string[]) {
  if (!isRecord(evidence)) {
    errors.push(`${reviewId}: evidence must be an object`)
    return
  }
  if (!exactKeys(evidence, EVIDENCE_KEYS)) {
    errors.push(`${reviewId}: evidence must contain exactly ${EVIDENCE_KEYS.join(', ')}`)
  }
  for (const key of EVIDENCE_BOOLEAN_KEYS) {
    if (evidence[key] !== true) {
      errors.push(`${reviewId}: evidence.${key} must be true`)
    }
  }
  if (!Array.isArray(evidence.artifacts) || evidence.artifacts.length === 0) {
    errors.push(`${reviewId}: evidence.artifacts must contain at least one artifact path`)
  } else {
    const seen = new Set<string>()
    for (const artifact of evidence.artifacts) {
      if (!nonEmptyString(artifact) || pathIsUnsafe(artifact)) {
        errors.push(`${reviewId}: evidence.artifacts contains an invalid repository-relative path`)
      } else if (seen.has(artifact)) {
        errors.push(`${reviewId}: evidence.artifacts contains duplicate path "${artifact}"`)
      } else {
        seen.add(artifact)
      }
    }
  }
}

function pathIsUnsafe(value: string) {
  return value.startsWith('/') || value.split(/[\\/]/).includes('..')
}

export function validateEditorialLedger(
  catalog: ProblemReviewCatalog,
  ledger: unknown
) {
  const errors: string[] = []
  const catalogById = new Map(catalog.items.map(item => [item.reviewId, item]))

  for (const item of catalog.items) {
    if (item.isPublic && item.curriculumCodes.length === 0) {
      errors.push(`public item curriculumCodes is empty: ${item.reviewId}`)
    }
  }

  if (!isRecord(ledger)) return [...errors, 'editorial ledger must be an object']
  if (!exactKeys(ledger, ['schemaVersion', 'items'])) {
    errors.push('editorial ledger must contain exactly schemaVersion and items')
  }
  if (ledger.schemaVersion !== EDITORIAL_LEDGER_SCHEMA_VERSION) {
    errors.push(`editorial ledger schemaVersion must be ${EDITORIAL_LEDGER_SCHEMA_VERSION}`)
  }
  if (!Array.isArray(ledger.items)) {
    errors.push('editorial ledger items must be an array')
    return errors
  }

  const ledgerIds = new Set<string>()
  for (let index = 0; index < ledger.items.length; index += 1) {
    const candidate = ledger.items[index]
    if (!isRecord(candidate)) {
      errors.push(`editorial ledger items[${index}] must be an object`)
      continue
    }
    const reviewId = nonEmptyString(candidate.reviewId)
      ? candidate.reviewId
      : `items[${index}]`
    if (!exactKeys(candidate, LEDGER_ITEM_KEYS)) {
      errors.push(`${reviewId}: editorial item has missing or unexpected fields`)
    }
    if (!nonEmptyString(candidate.reviewId)) {
      errors.push(`${reviewId}: reviewId is required`)
      continue
    }
    if (ledgerIds.has(candidate.reviewId)) {
      errors.push(`duplicate editorial reviewId: ${candidate.reviewId}`)
      continue
    }
    ledgerIds.add(candidate.reviewId)

    const catalogItem = catalogById.get(candidate.reviewId)
    if (!catalogItem) {
      errors.push(`unknown editorial reviewId: ${candidate.reviewId}`)
    } else if (candidate.contentHash !== catalogItem.contentHash) {
      errors.push(`stale contentHash for ${candidate.reviewId}`)
    }
    if (candidate.status !== 'pass' && candidate.status !== 'blocked') {
      errors.push(`${candidate.reviewId}: status must be pass or blocked`)
    } else if (candidate.status === 'blocked') {
      errors.push(`blocked editorial status: ${candidate.reviewId}`)
    }

    if (!Array.isArray(candidate.findingCategories)) {
      errors.push(`${candidate.reviewId}: findingCategories must be an array`)
    } else {
      const seenCategories = new Set<string>()
      for (const category of candidate.findingCategories) {
        if (typeof category !== 'string' || !FINDING_CATEGORY_SET.has(category)) {
          errors.push(`${candidate.reviewId}: findingCategories invalid value "${category}"`)
        } else if (seenCategories.has(category)) {
          errors.push(`${candidate.reviewId}: findingCategories duplicate value "${category}"`)
        } else {
          seenCategories.add(category)
        }
      }
    }
    if (!nonEmptyString(candidate.note)) {
      errors.push(`${candidate.reviewId}: note must be non-empty`)
    }
    validateEvidence(candidate.reviewId, candidate.evidence, errors)
  }

  for (const reviewId of catalog.items.map(item => item.reviewId)) {
    if (!ledgerIds.has(reviewId)) errors.push(`missing editorial reviewId: ${reviewId}`)
  }
  return errors
}
