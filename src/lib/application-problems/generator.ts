import {
  parseApplicationProblemFamilyV1,
  parseGeneratedApplicationProblemV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationAnswerV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from './contracts'
import {
  createApplicationRandomStreams,
  type ApplicationRandomStreams,
} from './random'

export const MAX_GENERATION_ATTEMPTS = 8
export const MAX_PROBLEM_SET_SIZE = 100
const RESERVED_GENERATION_PARAM = '__generation'

export type ApplicationProblemGenerationErrorCode =
  | 'INVALID_SEED'
  | 'INVALID_VARIANT_INDEX'
  | 'INVALID_PACK_VERSION'
  | 'INVALID_MAX_ATTEMPTS'
  | 'INVALID_SET_COUNT'
  | 'FAMILY_GENERATOR_MISMATCH'
  | 'PACK_ID_MISMATCH'
  | 'PACK_VERSION_MISMATCH'
  | 'MAX_ATTEMPTS_POLICY_MISMATCH'
  | 'UNSUPPORTED_RUNTIME_MODE'
  | 'GENERATOR_CALLBACK_FAILED'
  | 'NON_DETERMINISTIC_SAMPLE'
  | 'INVALID_SAMPLE'
  | 'NON_DETERMINISTIC_RENDER'
  | 'INVALID_RENDERED_PROBLEM'
  | 'GENERATION_EXHAUSTED'

export class ApplicationProblemGenerationError extends Error {
  readonly code: ApplicationProblemGenerationErrorCode
  readonly familyId: string
  readonly version: number
  readonly seed: number
  readonly variantIndex: number
  readonly attempts: number
  readonly cause?: unknown

  constructor(input: {
    code: ApplicationProblemGenerationErrorCode
    message: string
    familyId: string
    version: number
    seed: number
    variantIndex: number
    attempts: number
    cause?: unknown
  }) {
    super(input.message)
    this.name = 'ApplicationProblemGenerationError'
    this.code = input.code
    this.familyId = input.familyId
    this.version = input.version
    this.seed = input.seed
    this.variantIndex = input.variantIndex
    this.attempts = input.attempts
    this.cause = input.cause
  }
}

export interface ApplicationProblemSampleV1 {
  params: Record<string, JsonValue>
  mathModel?: JsonValue
}

export interface ApplicationProblemSampleContextV1 {
  seed: number
  variantIndex: number
  attempt: number
  random: ApplicationRandomStreams
}

export interface ApplicationProblemRenderContextV1 {
  params: Readonly<Record<string, JsonValue>>
  mathModel?: JsonValue
}

export interface ApplicationProblemRenderedContentV1 {
  prompt: string
  answer: GeneratedApplicationAnswerV1
  choices?: string[]
  correctChoiceIndex?: number
  solutionSteps: string[]
  hintSteps: string[]
}

export interface ApplicationProblemFamilyGeneratorV1 {
  familyId: string
  version: number
  packId: string
  packVersion: number
  maxAttempts: number
  visualGeneratorVersion?: number
  sample(context: ApplicationProblemSampleContextV1): ApplicationProblemSampleV1 | null
  render(context: ApplicationProblemRenderContextV1): ApplicationProblemRenderedContentV1
}

export interface GenerateApplicationProblemInputV1 {
  family: ApplicationProblemFamilyV1
  generator: ApplicationProblemFamilyGeneratorV1
  packVersion: number
  seed: number
  variantIndex: number
  maxAttempts?: number
}

export interface GenerateApplicationProblemSetInputV1
  extends Omit<GenerateApplicationProblemInputV1, 'variantIndex'> {
  startVariantIndex: number
  count: number
}

function errorFor(
  input: GenerateApplicationProblemInputV1,
  code: ApplicationProblemGenerationErrorCode,
  message: string,
  attempts: number,
  cause?: unknown,
): ApplicationProblemGenerationError {
  return new ApplicationProblemGenerationError({
    code,
    message,
    familyId: input.family?.familyId ?? input.generator?.familyId ?? 'unknown-family',
    version: input.family?.version ?? input.generator?.version ?? 0,
    seed: input.seed,
    variantIndex: input.variantIndex,
    attempts,
    cause,
  })
}

function canonicalJson(value: unknown, seen = new Set<object>()): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value as JsonValue
  }
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('value must be JSON-safe')
  }
  if (seen.has(value)) throw new TypeError('value must not contain cycles')
  seen.add(value)
  if (Array.isArray(value)) {
    const result = value.map((entry) => canonicalJson(entry, seen))
    seen.delete(value)
    return result
  }
  const result: Record<string, JsonValue> = {}
  Object.keys(value as Record<string, unknown>)
    .sort((left, right) => left.localeCompare(right))
    .forEach((key) => {
      result[key] = canonicalJson((value as Record<string, unknown>)[key], seen)
    })
  seen.delete(value)
  return result
}

function canonicalRecord(value: unknown): Record<string, JsonValue> {
  const result = canonicalJson(value)
  if (result === null || Array.isArray(result) || typeof result !== 'object') {
    throw new TypeError('params must be a JSON-safe object')
  }
  return result
}

function deepFreezeJson<T extends JsonValue>(value: T): T {
  if (value !== null && typeof value === 'object') {
    if (Array.isArray(value)) {
      value.forEach((entry) => deepFreezeJson(entry))
    } else {
      Object.values(value).forEach((entry) => deepFreezeJson(entry))
    }
    Object.freeze(value)
  }
  return value
}

function canonicalSnapshot<T>(value: T): T {
  return deepFreezeJson(canonicalJson(value)) as T
}

function stableJson(value: unknown): string {
  return JSON.stringify(canonicalJson(value))
}

function assertInput(input: GenerateApplicationProblemInputV1): {
  family: ApplicationProblemFamilyV1
  maxAttempts: number
} {
  let family: ApplicationProblemFamilyV1
  try {
    family = parseApplicationProblemFamilyV1(input.family)
  } catch (cause) {
    throw errorFor(input, 'FAMILY_GENERATOR_MISMATCH', 'family is not a canonical V1 family', 0, cause)
  }
  if (!Number.isSafeInteger(input.seed)) {
    throw errorFor(input, 'INVALID_SEED', 'seed must be a safe integer', 0)
  }
  if (!Number.isSafeInteger(input.variantIndex) || input.variantIndex < 0) {
    throw errorFor(input, 'INVALID_VARIANT_INDEX', 'variantIndex must be a non-negative safe integer', 0)
  }
  if (!Number.isSafeInteger(input.packVersion) || input.packVersion < 1) {
    throw errorFor(input, 'INVALID_PACK_VERSION', 'packVersion must be a positive safe integer', 0)
  }
  const maxAttempts = input.generator.maxAttempts
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > MAX_GENERATION_ATTEMPTS) {
    throw errorFor(
      input,
      'INVALID_MAX_ATTEMPTS',
      `generator recipe maxAttempts must be between 1 and ${MAX_GENERATION_ATTEMPTS}`,
      0,
    )
  }
  if (family.familyId !== input.generator.familyId || family.version !== input.generator.version) {
    throw errorFor(
      input,
      'FAMILY_GENERATOR_MISMATCH',
      'generator identity must match familyId@version',
      0,
    )
  }
  if (family.packId !== input.generator.packId) {
    throw errorFor(
      input,
      'PACK_ID_MISMATCH',
      'generator recipe packId must match the family packId',
      0,
    )
  }
  if (
    !Number.isSafeInteger(input.generator.packVersion) ||
    input.generator.packVersion < 1 ||
    input.packVersion !== input.generator.packVersion
  ) {
    throw errorFor(
      input,
      'PACK_VERSION_MISMATCH',
      'requested packVersion must match the generator recipe packVersion',
      0,
    )
  }
  if (input.maxAttempts !== undefined && input.maxAttempts !== maxAttempts) {
    throw errorFor(
      input,
      'MAX_ATTEMPTS_POLICY_MISMATCH',
      'caller maxAttempts cannot differ from the generator recipe policy',
      0,
    )
  }
  if (family.runtimeMode !== 'deterministic-generator') {
    throw errorFor(
      input,
      'UNSUPPORTED_RUNTIME_MODE',
      'static corpus families cannot use the deterministic generator',
      0,
    )
  }
  return { family, maxAttempts }
}

function renderTwice(
  input: GenerateApplicationProblemInputV1,
  sample: ApplicationProblemSampleV1,
  attempt: number,
): ApplicationProblemRenderedContentV1 {
  const renderOnce = (): ApplicationProblemRenderedContentV1 => {
    const params = canonicalRecord(sample.params)
    const mathModel = sample.mathModel === undefined ? undefined : canonicalJson(sample.mathModel)
    return input.generator.render({ params, mathModel })
  }

  let first: ApplicationProblemRenderedContentV1
  let second: ApplicationProblemRenderedContentV1
  try {
    first = canonicalSnapshot(renderOnce())
    second = canonicalSnapshot(renderOnce())
  } catch (cause) {
    throw errorFor(
      input,
      'INVALID_RENDERED_PROBLEM',
      'renderer failed for a sampled problem',
      attempt + 1,
      cause,
    )
  }
  try {
    if (stableJson(first) !== stableJson(second)) {
      throw errorFor(
        input,
        'NON_DETERMINISTIC_RENDER',
        'renderer must be a deterministic RNG-free function of params and mathModel',
        attempt + 1,
      )
    }
    return first
  } catch (cause) {
    if (cause instanceof ApplicationProblemGenerationError) throw cause
    throw errorFor(
      input,
      'INVALID_RENDERED_PROBLEM',
      'renderer output must be JSON-safe',
      attempt + 1,
      cause,
    )
  }
}

function createVisual(
  family: ApplicationProblemFamilyV1,
  generator: ApplicationProblemFamilyGeneratorV1,
  mathModel: JsonValue | undefined,
): GeneratedApplicationProblemV1['visual'] {
  if (family.visualPolicy.role === 'none') {
    return { ...family.visualPolicy }
  }
  return {
    ...family.visualPolicy,
    generatorVersion: generator.visualGeneratorVersion ?? generator.version,
    ...(mathModel === undefined ? {} : { mathModel }),
  }
}

function applyChoiceOrder(
  content: ApplicationProblemRenderedContentV1,
  random: ApplicationRandomStreams['choices'],
): {
  content: ApplicationProblemRenderedContentV1
  choiceOrder?: number[]
} {
  if (content.answer.format !== 'choice') return { content }
  if (!content.choices || content.correctChoiceIndex === undefined) return { content }

  const choiceOrder = random.shuffle(content.choices.map((_, index) => index))
  const choices = choiceOrder.map((index) => content.choices![index])
  const correctChoiceIndex = choiceOrder.indexOf(content.correctChoiceIndex)
  return {
    choiceOrder,
    content: { ...content, choices, correctChoiceIndex },
  }
}

export function generateApplicationProblem(
  input: GenerateApplicationProblemInputV1,
): GeneratedApplicationProblemV1 {
  const { family, maxAttempts } = assertInput(input)

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const random = createApplicationRandomStreams({
      familyId: family.familyId,
      version: family.version,
      seed: input.seed,
      variantIndex: input.variantIndex,
      attempt,
    })
    const replayRandom = createApplicationRandomStreams({
      familyId: family.familyId,
      version: family.version,
      seed: input.seed,
      variantIndex: input.variantIndex,
      attempt,
    })
    let sample: ApplicationProblemSampleV1 | null
    let replaySample: ApplicationProblemSampleV1 | null
    try {
      sample = canonicalSnapshot(
        input.generator.sample({
          seed: input.seed,
          variantIndex: input.variantIndex,
          attempt,
          random,
        }),
      )
      replaySample = canonicalSnapshot(
        input.generator.sample({
          seed: input.seed,
          variantIndex: input.variantIndex,
          attempt,
          random: replayRandom,
        }),
      )
    } catch (cause) {
      throw errorFor(
        input,
        'GENERATOR_CALLBACK_FAILED',
        'generator sampling callback failed',
        attempt + 1,
        cause,
      )
    }
    try {
      const sampleMatches = stableJson(sample) === stableJson(replaySample)
      const drawsMatch = (['model', 'params', 'choices'] as const).every(
        (stream) =>
          stableJson(random[stream].snapshotDraws()) ===
          stableJson(replayRandom[stream].snapshotDraws()),
      )
      if (!sampleMatches || !drawsMatch) {
        throw errorFor(
          input,
          'NON_DETERMINISTIC_SAMPLE',
          'sampler must replay from only the supplied deterministic streams',
          attempt + 1,
        )
      }
    } catch (cause) {
      if (cause instanceof ApplicationProblemGenerationError) throw cause
      throw errorFor(
        input,
        'INVALID_SAMPLE',
        'sample params and mathModel must be JSON-safe',
        attempt + 1,
        cause,
      )
    }
    if (sample === null) continue

    let params: Record<string, JsonValue>
    let mathModel: JsonValue | undefined
    try {
      params = canonicalRecord(sample.params)
      if (Object.prototype.hasOwnProperty.call(params, RESERVED_GENERATION_PARAM)) {
        throw new TypeError(`${RESERVED_GENERATION_PARAM} is reserved for generator provenance`)
      }
      mathModel = sample.mathModel === undefined ? undefined : canonicalJson(sample.mathModel)
    } catch (cause) {
      throw errorFor(
        input,
        'INVALID_SAMPLE',
        'sample params and mathModel must be JSON-safe',
        attempt + 1,
        cause,
      )
    }

    const rendered = renderTwice(input, { params, mathModel }, attempt)
    const ordered = applyChoiceOrder(rendered, random.choices)
    params[RESERVED_GENERATION_PARAM] = {
      attempt,
      randomDraws: {
        model: random.model.snapshotDraws(),
        params: random.params.snapshotDraws(),
        choices: random.choices.snapshotDraws(),
      },
      ...(ordered.choiceOrder === undefined ? {} : { choiceOrder: ordered.choiceOrder }),
    }

    const candidate: GeneratedApplicationProblemV1 = {
      schemaVersion: 'generated-application-problem-v1',
      instanceId: `${family.familyId}@${family.version}:${input.seed}:${input.variantIndex}`,
      familyId: family.familyId,
      generatorVersion: family.version,
      packId: family.packId,
      packVersion: input.packVersion,
      seed: input.seed,
      variantIndex: input.variantIndex,
      curriculumCodes: [family.primaryStandard, ...family.connectedStandards].filter(
        (standardCode, index, standards) => standards.indexOf(standardCode) === index,
      ),
      params: canonicalRecord(params),
      prompt: ordered.content.prompt,
      answer: ordered.content.answer,
      ...(ordered.content.choices === undefined ? {} : { choices: ordered.content.choices }),
      ...(ordered.content.correctChoiceIndex === undefined
        ? {}
        : { correctChoiceIndex: ordered.content.correctChoiceIndex }),
      solutionSteps: ordered.content.solutionSteps,
      hintSteps: ordered.content.hintSteps,
      misconceptionRefs: [...family.misconceptionRefs],
      visual: createVisual(family, input.generator, mathModel),
    }

    try {
      return parseGeneratedApplicationProblemV1(canonicalJson(candidate))
    } catch (cause) {
      throw errorFor(
        input,
        'INVALID_RENDERED_PROBLEM',
        'rendered candidate violates GeneratedApplicationProblemV1',
        attempt + 1,
        cause,
      )
    }
  }

  throw errorFor(
    input,
    'GENERATION_EXHAUSTED',
    `no valid problem was produced in ${maxAttempts} deterministic attempts`,
    maxAttempts,
  )
}

export function generateApplicationProblemSet(
  input: GenerateApplicationProblemSetInputV1,
): GeneratedApplicationProblemV1[] {
  if (!Number.isSafeInteger(input.startVariantIndex) || input.startVariantIndex < 0) {
    throw errorFor(
      { ...input, variantIndex: input.startVariantIndex },
      'INVALID_VARIANT_INDEX',
      'startVariantIndex must be a non-negative safe integer',
      0,
    )
  }
  if (
    !Number.isSafeInteger(input.count) ||
    input.count < 1 ||
    input.count > MAX_PROBLEM_SET_SIZE
  ) {
    throw errorFor(
      { ...input, variantIndex: input.startVariantIndex },
      'INVALID_SET_COUNT',
      `count must be between 1 and ${MAX_PROBLEM_SET_SIZE}`,
      0,
    )
  }
  if (!Number.isSafeInteger(input.startVariantIndex + input.count - 1)) {
    throw errorFor(
      { ...input, variantIndex: input.startVariantIndex },
      'INVALID_VARIANT_INDEX',
      'requested variant range exceeds safe integers',
      0,
    )
  }

  return Array.from({ length: input.count }, (_, offset) =>
    generateApplicationProblem({
      family: input.family,
      generator: input.generator,
      packVersion: input.packVersion,
      seed: input.seed,
      variantIndex: input.startVariantIndex + offset,
      ...(input.maxAttempts === undefined ? {} : { maxAttempts: input.maxAttempts }),
    }),
  )
}
