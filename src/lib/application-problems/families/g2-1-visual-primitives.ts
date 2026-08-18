import type {
  ApplicationVisualDiagramSceneV1,
  ApplicationVisualPrimitive,
  ApplicationVisualTableSceneV1,
} from '../visual-model'

export function buildG2BarScene(input: {
  description: string
  values: readonly number[]
  labels: readonly string[]
  answer: string
}): ApplicationVisualDiagramSceneV1 {
  if (
    input.values.length === 0 ||
    input.values.length !== input.labels.length ||
    input.values.some((value) => !Number.isSafeInteger(value) || value <= 0)
  ) {
    throw new TypeError('Grade 2 bar scenes require matching positive integer values and labels')
  }
  const primitives = input.values.map((value, index) => {
    const primitive = {
      key: `bar-${index}`,
      kind: 'rect' as const,
      x: 0,
      y: index * 24,
      width: value,
      height: 14,
      disclosure: 'given' as const,
      styleRole: (index % 2 === 0 ? 'primary' : 'secondary') as 'primary' | 'secondary',
      emphasis: 'normal' as const,
    }
    return primitive
  })
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'quantitative',
    viewBox: { width: Math.max(...input.values) + 20, height: input.values.length * 24 + 24 },
    scale: { x: 1, y: 1 },
    description: { before: { text: input.description, disclosure: 'given' } },
    primitives,
    labels: [
      ...input.labels.map((label, index) => ({
        key: `label-${index}`,
        x: 0.5,
        y: index * 24 + 10,
        content: { before: { text: label, disclosure: 'given' as const } },
        styleRole: 'primary' as const,
      })),
      {
        key: 'answer-label',
        x: 2,
        y: input.values.length * 24 + 12,
        content: {
          before: { text: '답: ?', disclosure: 'identifier' as const },
          after: { text: `답: ${input.answer}`, disclosure: 'solution' as const },
        },
        styleRole: 'accent' as const,
      },
    ],
    constraints: primitives.map((primitive, index) => ({
      kind: 'area' as const,
      primitiveKey: primitive.key,
      expected: input.values[index] * 14,
    })),
  }
}

export function buildG2ShapeScene(input: {
  description: string
  shapeCounts: readonly number[]
  labels: readonly string[]
  answer: string
}): ApplicationVisualDiagramSceneV1 {
  if (
    input.shapeCounts.length === 0 ||
    input.shapeCounts.length !== input.labels.length ||
    input.shapeCounts.some((value) => !Number.isSafeInteger(value) || value <= 0)
  ) {
    throw new TypeError('Grade 2 shape scenes require matching positive counts and labels')
  }
  const primitives: ApplicationVisualPrimitive[] = input.shapeCounts.flatMap(
    (count, groupIndex) =>
      Array.from({ length: count }, (_, itemIndex): ApplicationVisualPrimitive =>
        groupIndex % 2 === 0
          ? {
              key: `shape-${groupIndex}-${itemIndex}`,
              kind: 'rect',
              x: itemIndex * 14,
              y: groupIndex * 24,
              width: 10,
              height: 10,
              disclosure: 'given',
              styleRole: 'primary',
              emphasis: 'normal',
            }
          : {
              key: `shape-${groupIndex}-${itemIndex}`,
              kind: 'circle',
              cx: itemIndex * 14 + 5,
              cy: groupIndex * 24 + 5,
              radius: 5,
              disclosure: 'given',
              styleRole: 'secondary',
              emphasis: 'normal',
            },
      ),
  )
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'diagram',
    semantics: 'schematic',
    viewBox: {
      width: Math.max(...input.shapeCounts) * 14 + 20,
      height: input.shapeCounts.length * 24 + 24,
    },
    scale: { x: 1, y: 1 },
    description: { before: { text: input.description, disclosure: 'given' } },
    primitives,
    labels: [
      ...input.labels.map((label, index) => ({
        key: `shape-label-${index}`,
        x: Math.max(...input.shapeCounts) * 14 + 2,
        y: index * 24 + 8,
        content: { before: { text: label, disclosure: 'given' as const } },
        styleRole: 'primary' as const,
      })),
      {
        key: 'answer-label',
        x: 2,
        y: input.shapeCounts.length * 24 + 12,
        content: {
          before: { text: '답: ?', disclosure: 'identifier' as const },
          after: { text: `답: ${input.answer}`, disclosure: 'solution' as const },
        },
        styleRole: 'accent' as const,
      },
    ],
    constraints: [],
  }
}

export function buildG2TableScene(input: {
  caption: string
  categories: readonly string[]
  counts: readonly number[]
  answer: string
}): ApplicationVisualTableSceneV1 {
  if (
    input.categories.length < 2 ||
    input.categories.length !== input.counts.length ||
    input.counts.some((value) => !Number.isSafeInteger(value) || value < 0)
  ) {
    throw new TypeError('Grade 2 tables require matching categories and non-negative counts')
  }
  return {
    schemaVersion: 'application-visual-v1',
    surface: 'table',
    semantics: 'quantitative',
    caption: { before: { text: input.caption, disclosure: 'given' } },
    columns: [
      { before: { text: '종류', disclosure: 'identifier' } },
      { before: { text: '개수', disclosure: 'identifier' } },
    ],
    rows: [
      ...input.categories.map((category, index) => ({
        key: `category-${index}`,
        cells: [
          { before: { text: category, disclosure: 'given' as const } },
          {
            before: { text: String(input.counts[index]), disclosure: 'given' as const },
            numericValue: input.counts[index],
            numericDisclosure: 'given' as const,
          },
        ],
      })),
      {
        key: 'answer-row',
        cells: [
          { before: { text: '답', disclosure: 'identifier' as const } },
          {
            before: { text: '?', disclosure: 'identifier' as const },
            after: { text: input.answer, disclosure: 'solution' as const },
          },
        ],
      },
    ],
    constraints: [{
      kind: 'table-ratio',
      numerator: { rowKey: 'category-0', columnIndex: 1 },
      denominator: { rowKey: 'category-1', columnIndex: 1 },
      expected: input.counts[0] / input.counts[1],
    }],
  }
}
