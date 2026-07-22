import type { JsonValue } from '../contracts'
import type {
  ApplicationVisualContent,
  ApplicationVisualDiagramConstraint,
  ApplicationVisualDiagramSceneV1,
  ApplicationVisualDisclosure,
  ApplicationVisualLabel,
  ApplicationVisualPrimitive,
} from '../visual-model'
import type {
  ApplicationVisualValidationIssue,
} from '../visual-validator'

const START_X = 17
const TOTAL_Y = 22
const SEGMENT_Y = 64
const LABEL_Y = 82
const VIEWBOX_MARGIN = START_X * 2

export interface G2LengthSegmentSceneInput {
  lengthsCm: readonly [number, number, number]
  labels: readonly [ApplicationVisualContent, ApplicationVisualContent, ApplicationVisualContent]
  segmentDisclosures?: readonly [
    ApplicationVisualDisclosure,
    ApplicationVisualDisclosure,
    ApplicationVisualDisclosure,
  ]
  description: ApplicationVisualContent
  total?: {
    lengthCm: number
    content: ApplicationVisualContent
    disclosure: ApplicationVisualDisclosure
    emphasis?: 'normal' | 'answer'
  }
}

function assertPositiveLengths(lengths: readonly number[]): void {
  if (lengths.some((value) => !Number.isSafeInteger(value) || value <= 0)) {
    throw new TypeError('Grade 2 length scene values must be positive safe-integer centimeters')
  }
}

export function formatG2MixedLength(cm: number): string {
  if (!Number.isSafeInteger(cm) || cm <= 0) throw new TypeError('cm must be a positive integer')
  const meters = Math.floor(cm / 100)
  const centimeters = cm % 100
  if (meters === 0) return `${centimeters}cm`
  if (centimeters === 0) return `${meters}m`
  return `${meters}m ${centimeters}cm`
}

export function stableG2LengthCaseIndex(
  seed: number,
  variantIndex: number,
  domainSize: number,
): number {
  if (!Number.isSafeInteger(seed)) throw new TypeError('seed must be a safe integer')
  if (!Number.isSafeInteger(variantIndex) || variantIndex < 0) {
    throw new TypeError('variantIndex must be a non-negative safe integer')
  }
  if (!Number.isSafeInteger(domainSize) || domainSize < 1) {
    throw new TypeError('domainSize must be a positive safe integer')
  }
  const floorModSeed = ((seed % domainSize) + domainSize) % domainSize
  return (floorModSeed + (variantIndex % domainSize)) % domainSize
}

export function buildG2ConnectedLengthScene(
  input: G2LengthSegmentSceneInput,
): ApplicationVisualDiagramSceneV1 {
  assertPositiveLengths(input.lengthsCm)
  const totalCm = input.lengthsCm.reduce((sum, value) => sum + value, 0)
  if (input.total && input.total.lengthCm !== totalCm) {
    throw new TypeError('total length must equal the three connected segments')
  }
  const disclosures = input.segmentDisclosures ?? ['given', 'given', 'given']
  const colors = ['primary', 'secondary', 'accent'] as const
  let cursor = START_X
  const primitives: ApplicationVisualPrimitive[] = input.lengthsCm.map((lengthCm, index) => {
    const primitive = {
      key: `segment-${index}`,
      kind: 'line' as const,
      x1: cursor,
      y1: SEGMENT_Y,
      x2: cursor + lengthCm,
      y2: SEGMENT_Y,
      disclosure: disclosures[index],
      styleRole: colors[index],
      emphasis: 'normal' as const,
    }
    cursor += lengthCm
    return primitive
  })
  const labels: ApplicationVisualLabel[] = input.lengthsCm.map((lengthCm, index) => {
    const priorLength = input.lengthsCm.slice(0, index).reduce((sum, value) => sum + value, 0)
    return {
      key: `segment-label-${index}`,
      x: START_X + priorLength + lengthCm / 2,
      y: LABEL_Y,
      content: input.labels[index],
      styleRole: colors[index],
    }
  })
  const constraints: ApplicationVisualDiagramConstraint[] = input.lengthsCm.map((lengthCm, index) => ({
    kind: 'segment-length' as const,
    primitiveKey: `segment-${index}`,
    expected: lengthCm,
  }))

  if (input.total) {
    primitives.push({
      key: 'whole-length',
      kind: 'line',
      x1: START_X,
      y1: TOTAL_Y,
      x2: START_X + input.total.lengthCm,
      y2: TOTAL_Y,
      disclosure: input.total.disclosure,
      styleRole: 'muted',
      emphasis: input.total.emphasis ?? 'normal',
    })
    labels.push({
      key: 'whole-label',
      x: START_X + input.total.lengthCm / 2,
      y: 10,
      content: input.total.content,
      styleRole: 'muted',
    })
    constraints.push({
      kind: 'segment-length',
      primitiveKey: 'whole-length',
      expected: input.total.lengthCm,
    })
  }

  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: totalCm + VIEWBOX_MARGIN, height: 96 },
    scale: { x: 1, y: 1 },
    description: input.description,
    primitives,
    labels,
    constraints,
  }
}

function canonicalJson(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value as JsonValue
  }
  if (Array.isArray(value)) return value.map(canonicalJson)
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('scene must be JSON-safe')
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalJson(entry)]),
  )
}

export function validateExactG2LengthScene(
  actual: unknown,
  expected: ApplicationVisualDiagramSceneV1,
  familyId: string,
): ApplicationVisualValidationIssue[] {
  try {
    if (JSON.stringify(canonicalJson(actual)) === JSON.stringify(canonicalJson(expected))) return []
  } catch {
    return [
      {
        code: 'g2_length_scene_not_json_safe',
        path: 'visual.mathModel',
        message: `${familyId} scene must be JSON-safe`,
      },
    ]
  }
  return [
    {
      code: 'g2_length_scene_params_mismatch',
      path: 'visual.mathModel',
      message: `${familyId} scene must be derived exactly from its generated parameters`,
    },
  ]
}

export function givenText(text: string): ApplicationVisualContent {
  return { before: { text, disclosure: 'given' } }
}

export function identifierThenSolution(
  before: string,
  after: string,
): ApplicationVisualContent {
  return {
    before: { text: before, disclosure: 'identifier' },
    after: { text: after, disclosure: 'solution' },
  }
}

export function solutionText(text: string): ApplicationVisualContent {
  return { after: { text, disclosure: 'solution' } }
}
