import type { VisualSemantics } from '../types'

export type ApplicationVisualDisclosure =
  | 'given'
  | 'identifier'
  | 'solution'
  | 'intermediate'

export type ApplicationVisualStyleRole = 'primary' | 'secondary' | 'accent' | 'muted'
export type ApplicationVisualEmphasis = 'normal' | 'answer'

export interface ApplicationVisualPublicText {
  text: string
  disclosure: 'given' | 'identifier'
}

export interface ApplicationVisualHiddenText {
  text: string
  disclosure: 'solution' | 'intermediate'
}

export interface ApplicationVisualContent {
  before?: ApplicationVisualPublicText
  after?: ApplicationVisualHiddenText
}

export interface ApplicationVisualPoint {
  x: number
  y: number
}

interface ApplicationVisualPrimitiveBase {
  key: string
  disclosure: ApplicationVisualDisclosure
  styleRole: ApplicationVisualStyleRole
  emphasis: ApplicationVisualEmphasis
}

export type ApplicationVisualPrimitive =
  | (ApplicationVisualPrimitiveBase & {
      kind: 'line'
      x1: number
      y1: number
      x2: number
      y2: number
    })
  | (ApplicationVisualPrimitiveBase & {
      kind: 'rect'
      x: number
      y: number
      width: number
      height: number
    })
  | (ApplicationVisualPrimitiveBase & {
      kind: 'circle'
      cx: number
      cy: number
      radius: number
    })
  | (ApplicationVisualPrimitiveBase & {
      kind: 'polygon' | 'polyline'
      points: ApplicationVisualPoint[]
    })

export interface ApplicationVisualLabel {
  key: string
  targetKey?: string
  x: number
  y: number
  content: ApplicationVisualContent
  styleRole: ApplicationVisualStyleRole
}

export type ApplicationVisualDiagramConstraint =
  | {
      kind: 'segment-length'
      primitiveKey: string
      expected: number
      epsilon?: number
    }
  | {
      kind: 'area'
      primitiveKey: string
      expected: number
      epsilon?: number
    }
  | {
      kind: 'ratio'
      numeratorKey: string
      denominatorKey: string
      metric: 'length' | 'area'
      expected: number
      epsilon?: number
    }
  | {
      kind: 'topology'
      firstKey: string
      secondKey: string
      relation: 'disjoint' | 'touching' | 'overlap' | 'contains'
    }

export interface ApplicationVisualTableAddress {
  rowKey: string
  columnIndex: number
}

export interface ApplicationVisualTableRatioConstraint {
  kind: 'table-ratio'
  numerator: ApplicationVisualTableAddress
  denominator: ApplicationVisualTableAddress
  expected: number
  epsilon?: number
}

export interface ApplicationVisualTableCell extends ApplicationVisualContent {
  numericValue?: number
}

export interface ApplicationVisualTableRow {
  key: string
  cells: ApplicationVisualTableCell[]
}

interface ApplicationVisualSceneBase {
  schemaVersion: 'application-visual-v1'
  semantics: VisualSemantics
}

export interface ApplicationVisualDiagramSceneV1 extends ApplicationVisualSceneBase {
  surface: 'diagram'
  viewBox: { width: number; height: number }
  scale: { x: number; y: number }
  description?: ApplicationVisualContent
  primitives: ApplicationVisualPrimitive[]
  labels: ApplicationVisualLabel[]
  constraints: ApplicationVisualDiagramConstraint[]
}

export interface ApplicationVisualTableSceneV1 extends ApplicationVisualSceneBase {
  surface: 'table'
  caption: ApplicationVisualContent
  columns: ApplicationVisualContent[]
  rows: ApplicationVisualTableRow[]
  constraints: ApplicationVisualTableRatioConstraint[]
}

export type ApplicationVisualSceneV1 =
  | ApplicationVisualDiagramSceneV1
  | ApplicationVisualTableSceneV1

export interface ApplicationVisualModelIssue {
  code: string
  path: string
  message: string
}

export class ApplicationVisualModelError extends Error {
  readonly issues: ApplicationVisualModelIssue[]

  constructor(issues: ApplicationVisualModelIssue[]) {
    super(`Application visual model is invalid: ${issues.map((entry) => entry.message).join('; ')}`)
    this.name = 'ApplicationVisualModelError'
    this.issues = issues
  }
}

const MAX_COLLECTION_SIZE = 256
const MAX_TEXT_LENGTH = 500
const MAX_ABSOLUTE_NUMBER = 1_000_000_000
const KEY_PATTERN = /^[a-z0-9][a-z0-9-]*$/
const SEMANTICS: readonly VisualSemantics[] = ['decorative', 'schematic', 'quantitative']
const DISCLOSURES: readonly ApplicationVisualDisclosure[] = [
  'given',
  'identifier',
  'solution',
  'intermediate',
]
const STYLE_ROLES: readonly ApplicationVisualStyleRole[] = [
  'primary',
  'secondary',
  'accent',
  'muted',
]

function addIssue(
  issues: ApplicationVisualModelIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message })
}

function asRecord(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    addIssue(issues, 'invalid_object', path, `${path} must be an object`)
    return {}
  }
  return value as Record<string, unknown>
}

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: ApplicationVisualModelIssue[],
): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) {
    if (!allowedSet.has(key)) {
      addIssue(issues, 'unknown_field', `${path}.${key}`, `${path}.${key} is not allowed`)
    }
  }
}

function asArray(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
  options: { allowEmpty?: boolean; max?: number } = {},
): unknown[] {
  if (!Array.isArray(value)) {
    addIssue(issues, 'invalid_array', path, `${path} must be an array`)
    return []
  }
  if (!options.allowEmpty && value.length === 0) {
    addIssue(issues, 'empty_array', path, `${path} must not be empty`)
  }
  if (value.length > (options.max ?? MAX_COLLECTION_SIZE)) {
    addIssue(issues, 'collection_too_large', path, `${path} exceeds its size limit`)
  }
  return value
}

function asString(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > MAX_TEXT_LENGTH) {
    addIssue(issues, 'invalid_string', path, `${path} must be a non-empty bounded string`)
    return ''
  }
  return value
}

function asKey(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): string {
  const key = asString(value, path, issues)
  if (key && !KEY_PATTERN.test(key)) {
    addIssue(issues, 'invalid_key', path, `${path} must be a stable lowercase identifier`)
  }
  return key
}

function asNumber(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    Math.abs(value) > MAX_ABSOLUTE_NUMBER
  ) {
    addIssue(issues, 'invalid_number', path, `${path} must be a finite bounded number`)
    return 0
  }
  return value
}

function asNonNegativeInteger(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    addIssue(issues, 'invalid_index', path, `${path} must be a non-negative safe integer`)
    return 0
  }
  return value as number
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  issues: ApplicationVisualModelIssue[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    addIssue(issues, 'invalid_enum', path, `${path} has an unsupported value`)
    return allowed[0]
  }
  return value as T
}

function parseText(
  value: unknown,
  path: string,
  allowedDisclosures: readonly ApplicationVisualDisclosure[],
  issues: ApplicationVisualModelIssue[],
): ApplicationVisualPublicText | ApplicationVisualHiddenText {
  const record = asRecord(value, path, issues)
  rejectUnknownKeys(record, ['text', 'disclosure'], path, issues)
  return {
    text: asString(record.text, `${path}.text`, issues),
    disclosure: asEnum(record.disclosure, allowedDisclosures, `${path}.disclosure`, issues),
  } as ApplicationVisualPublicText | ApplicationVisualHiddenText
}

function parseContent(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
  additionalKeys: readonly string[] = [],
): ApplicationVisualContent {
  const record = asRecord(value, path, issues)
  rejectUnknownKeys(record, ['before', 'after', ...additionalKeys], path, issues)
  const before =
    record.before === undefined
      ? undefined
      : (parseText(record.before, `${path}.before`, ['given', 'identifier'], issues) as ApplicationVisualPublicText)
  const after =
    record.after === undefined
      ? undefined
      : (parseText(record.after, `${path}.after`, ['solution', 'intermediate'], issues) as ApplicationVisualHiddenText)
  if (!before && !after) {
    addIssue(issues, 'empty_content', path, `${path} needs before or after content`)
  }
  return { before, after }
}

function parsePoint(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): ApplicationVisualPoint {
  const record = asRecord(value, path, issues)
  rejectUnknownKeys(record, ['x', 'y'], path, issues)
  return {
    x: asNumber(record.x, `${path}.x`, issues),
    y: asNumber(record.y, `${path}.y`, issues),
  }
}

function parsePrimitive(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): ApplicationVisualPrimitive {
  const record = asRecord(value, path, issues)
  const kind = asEnum(
    record.kind,
    ['line', 'rect', 'circle', 'polygon', 'polyline'] as const,
    `${path}.kind`,
    issues,
  )
  const common = {
    key: asKey(record.key, `${path}.key`, issues),
    kind,
    disclosure: asEnum(record.disclosure, DISCLOSURES, `${path}.disclosure`, issues),
    styleRole: asEnum(record.styleRole, STYLE_ROLES, `${path}.styleRole`, issues),
    emphasis: asEnum(
      record.emphasis ?? 'normal',
      ['normal', 'answer'] as const,
      `${path}.emphasis`,
      issues,
    ),
  }
  if (
    common.emphasis === 'answer' &&
    common.disclosure !== 'solution' &&
    common.disclosure !== 'intermediate'
  ) {
    addIssue(
      issues,
      'unsafe_answer_emphasis',
      `${path}.emphasis`,
      'answer emphasis must be answer-only content',
    )
  }

  if (kind === 'line') {
    rejectUnknownKeys(
      record,
      ['key', 'kind', 'x1', 'y1', 'x2', 'y2', 'disclosure', 'styleRole', 'emphasis'],
      path,
      issues,
    )
    return {
      ...common,
      kind,
      x1: asNumber(record.x1, `${path}.x1`, issues),
      y1: asNumber(record.y1, `${path}.y1`, issues),
      x2: asNumber(record.x2, `${path}.x2`, issues),
      y2: asNumber(record.y2, `${path}.y2`, issues),
    }
  }
  if (kind === 'rect') {
    rejectUnknownKeys(
      record,
      ['key', 'kind', 'x', 'y', 'width', 'height', 'disclosure', 'styleRole', 'emphasis'],
      path,
      issues,
    )
    return {
      ...common,
      kind,
      x: asNumber(record.x, `${path}.x`, issues),
      y: asNumber(record.y, `${path}.y`, issues),
      width: asNumber(record.width, `${path}.width`, issues),
      height: asNumber(record.height, `${path}.height`, issues),
    }
  }
  if (kind === 'circle') {
    rejectUnknownKeys(
      record,
      ['key', 'kind', 'cx', 'cy', 'radius', 'disclosure', 'styleRole', 'emphasis'],
      path,
      issues,
    )
    return {
      ...common,
      kind,
      cx: asNumber(record.cx, `${path}.cx`, issues),
      cy: asNumber(record.cy, `${path}.cy`, issues),
      radius: asNumber(record.radius, `${path}.radius`, issues),
    }
  }

  rejectUnknownKeys(
    record,
    ['key', 'kind', 'points', 'disclosure', 'styleRole', 'emphasis'],
    path,
    issues,
  )
  const points = asArray(record.points, `${path}.points`, issues, { max: 128 }).map(
    (point, index) => parsePoint(point, `${path}.points[${index}]`, issues),
  )
  const minimum = kind === 'polygon' ? 3 : 2
  if (points.length < minimum) {
    addIssue(issues, 'insufficient_points', `${path}.points`, `${kind} needs ${minimum} points`)
  }
  return { ...common, kind, points }
}

function parseEpsilon(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): number | undefined {
  if (value === undefined) return undefined
  const parsed = asNumber(value, path, issues)
  if (parsed <= 0 || parsed > 0.1) {
    addIssue(issues, 'invalid_epsilon', path, `${path} must be greater than 0 and at most 0.1`)
  }
  return parsed
}

function parseDiagramConstraint(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): ApplicationVisualDiagramConstraint {
  const record = asRecord(value, path, issues)
  const kind = asEnum(
    record.kind,
    ['segment-length', 'area', 'ratio', 'topology'] as const,
    `${path}.kind`,
    issues,
  )
  if (kind === 'segment-length' || kind === 'area') {
    rejectUnknownKeys(record, ['kind', 'primitiveKey', 'expected', 'epsilon'], path, issues)
    return {
      kind,
      primitiveKey: asKey(record.primitiveKey, `${path}.primitiveKey`, issues),
      expected: asNumber(record.expected, `${path}.expected`, issues),
      epsilon: parseEpsilon(record.epsilon, `${path}.epsilon`, issues),
    }
  }
  if (kind === 'ratio') {
    rejectUnknownKeys(
      record,
      ['kind', 'numeratorKey', 'denominatorKey', 'metric', 'expected', 'epsilon'],
      path,
      issues,
    )
    return {
      kind,
      numeratorKey: asKey(record.numeratorKey, `${path}.numeratorKey`, issues),
      denominatorKey: asKey(record.denominatorKey, `${path}.denominatorKey`, issues),
      metric: asEnum(record.metric, ['length', 'area'] as const, `${path}.metric`, issues),
      expected: asNumber(record.expected, `${path}.expected`, issues),
      epsilon: parseEpsilon(record.epsilon, `${path}.epsilon`, issues),
    }
  }
  rejectUnknownKeys(record, ['kind', 'firstKey', 'secondKey', 'relation'], path, issues)
  return {
    kind,
    firstKey: asKey(record.firstKey, `${path}.firstKey`, issues),
    secondKey: asKey(record.secondKey, `${path}.secondKey`, issues),
    relation: asEnum(
      record.relation,
      ['disjoint', 'touching', 'overlap', 'contains'] as const,
      `${path}.relation`,
      issues,
    ),
  }
}

function parseTableAddress(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): ApplicationVisualTableAddress {
  const record = asRecord(value, path, issues)
  rejectUnknownKeys(record, ['rowKey', 'columnIndex'], path, issues)
  return {
    rowKey: asKey(record.rowKey, `${path}.rowKey`, issues),
    columnIndex: asNonNegativeInteger(record.columnIndex, `${path}.columnIndex`, issues),
  }
}

function parseTableConstraint(
  value: unknown,
  path: string,
  issues: ApplicationVisualModelIssue[],
): ApplicationVisualTableRatioConstraint {
  const record = asRecord(value, path, issues)
  rejectUnknownKeys(record, ['kind', 'numerator', 'denominator', 'expected', 'epsilon'], path, issues)
  if (record.kind !== 'table-ratio') {
    addIssue(issues, 'unsupported_constraint', `${path}.kind`, 'table constraint is unsupported')
  }
  return {
    kind: 'table-ratio',
    numerator: parseTableAddress(record.numerator, `${path}.numerator`, issues),
    denominator: parseTableAddress(record.denominator, `${path}.denominator`, issues),
    expected: asNumber(record.expected, `${path}.expected`, issues),
    epsilon: parseEpsilon(record.epsilon, `${path}.epsilon`, issues),
  }
}

export function parseApplicationVisualSceneV1(value: unknown): ApplicationVisualSceneV1 {
  const issues: ApplicationVisualModelIssue[] = []
  const record = asRecord(value, 'scene', issues)
  if (record.schemaVersion !== 'application-visual-v1') {
    addIssue(
      issues,
      'invalid_schema_version',
      'scene.schemaVersion',
      'scene.schemaVersion must equal application-visual-v1',
    )
  }
  const surface = asEnum(record.surface, ['diagram', 'table'] as const, 'scene.surface', issues)
  const semantics = asEnum(record.semantics, SEMANTICS, 'scene.semantics', issues)

  let parsed: ApplicationVisualSceneV1
  if (surface === 'diagram') {
    rejectUnknownKeys(
      record,
      [
        'schemaVersion',
        'surface',
        'semantics',
        'viewBox',
        'scale',
        'description',
        'primitives',
        'labels',
        'constraints',
      ],
      'scene',
      issues,
    )
    const viewBox = asRecord(record.viewBox, 'scene.viewBox', issues)
    rejectUnknownKeys(viewBox, ['width', 'height'], 'scene.viewBox', issues)
    const scale = asRecord(record.scale, 'scene.scale', issues)
    rejectUnknownKeys(scale, ['x', 'y'], 'scene.scale', issues)
    parsed = {
      schemaVersion: 'application-visual-v1',
      surface,
      semantics,
      viewBox: {
        width: asNumber(viewBox.width, 'scene.viewBox.width', issues),
        height: asNumber(viewBox.height, 'scene.viewBox.height', issues),
      },
      scale: {
        x: asNumber(scale.x, 'scene.scale.x', issues),
        y: asNumber(scale.y, 'scene.scale.y', issues),
      },
      description:
        record.description === undefined
          ? undefined
          : parseContent(record.description, 'scene.description', issues),
      primitives: asArray(record.primitives, 'scene.primitives', issues).map((entry, index) =>
        parsePrimitive(entry, `scene.primitives[${index}]`, issues),
      ),
      labels: asArray(record.labels, 'scene.labels', issues, { allowEmpty: true }).map(
        (entry, index) => {
          const path = `scene.labels[${index}]`
          const label = asRecord(entry, path, issues)
          rejectUnknownKeys(label, ['key', 'targetKey', 'x', 'y', 'content', 'styleRole'], path, issues)
          return {
            key: asKey(label.key, `${path}.key`, issues),
            targetKey:
              label.targetKey === undefined
                ? undefined
                : asKey(label.targetKey, `${path}.targetKey`, issues),
            x: asNumber(label.x, `${path}.x`, issues),
            y: asNumber(label.y, `${path}.y`, issues),
            content: parseContent(label.content, `${path}.content`, issues),
            styleRole: asEnum(label.styleRole, STYLE_ROLES, `${path}.styleRole`, issues),
          }
        },
      ),
      constraints: asArray(record.constraints, 'scene.constraints', issues, {
        allowEmpty: true,
      }).map((entry, index) =>
        parseDiagramConstraint(entry, `scene.constraints[${index}]`, issues),
      ),
    }
  } else {
    rejectUnknownKeys(
      record,
      ['schemaVersion', 'surface', 'semantics', 'caption', 'columns', 'rows', 'constraints'],
      'scene',
      issues,
    )
    const columns = asArray(record.columns, 'scene.columns', issues, { max: 32 }).map(
      (entry, index) => parseContent(entry, `scene.columns[${index}]`, issues),
    )
    const rows = asArray(record.rows, 'scene.rows', issues, { max: 128 }).map((entry, index) => {
      const path = `scene.rows[${index}]`
      const row = asRecord(entry, path, issues)
      rejectUnknownKeys(row, ['key', 'cells'], path, issues)
      const cells = asArray(row.cells, `${path}.cells`, issues, { max: 32 }).map(
        (cell, cellIndex) => {
          const cellPath = `${path}.cells[${cellIndex}]`
          const cellRecord = asRecord(cell, cellPath, issues)
          const content = parseContent(cellRecord, cellPath, issues, ['numericValue'])
          return {
            ...content,
            numericValue:
              cellRecord.numericValue === undefined
                ? undefined
                : asNumber(cellRecord.numericValue, `${cellPath}.numericValue`, issues),
          }
        },
      )
      if (cells.length !== columns.length) {
        addIssue(
          issues,
          'table_dimension_mismatch',
          `${path}.cells`,
          'each table row must have the same number of cells as columns',
        )
      }
      return { key: asKey(row.key, `${path}.key`, issues), cells }
    })
    parsed = {
      schemaVersion: 'application-visual-v1',
      surface,
      semantics,
      caption: parseContent(record.caption, 'scene.caption', issues),
      columns,
      rows,
      constraints: asArray(record.constraints, 'scene.constraints', issues, {
        allowEmpty: true,
      }).map((entry, index) => parseTableConstraint(entry, `scene.constraints[${index}]`, issues)),
    }
  }

  if (issues.length > 0) throw new ApplicationVisualModelError(issues)
  return parsed
}
