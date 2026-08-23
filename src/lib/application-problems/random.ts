export interface DeterministicRandom {
  nextUint32(): number
  nextFloat(): number
  intInclusive(min: number, max: number): number
  pick<T>(values: readonly T[]): T
  shuffle<T>(values: readonly T[]): T[]
  snapshotDraws(): number[]
}

export interface ApplicationRandomStreamKey {
  familyId: string
  version: number
  seed: number
  variantIndex: number
  attempt: number
}

export interface ApplicationRandomStreams {
  model: DeterministicRandom
  params: DeterministicRandom
  choices: DeterministicRandom
}

const UINT32_RANGE = 0x1_0000_0000
const DEFAULT_MAX_DRAWS = 256

function hashText(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer`)
  }
}

export function createDeterministicRandom(
  seed: number,
  namespace: string,
  maxDraws = DEFAULT_MAX_DRAWS,
): DeterministicRandom {
  assertSafeInteger(seed, 'seed')
  if (typeof namespace !== 'string' || namespace.trim() === '') {
    throw new TypeError('namespace must be a non-empty string')
  }
  if (!Number.isSafeInteger(maxDraws) || maxDraws < 1) {
    throw new RangeError('maxDraws must be a positive safe integer')
  }

  let state = hashText(`${seed}:${namespace}`)
  const draws: number[] = []

  const nextUint32 = (): number => {
    if (draws.length >= maxDraws) {
      throw new RangeError(`random draw limit exceeded for namespace ${namespace}`)
    }
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    const result = (value ^ (value >>> 14)) >>> 0
    draws.push(result)
    return result
  }

  const random: DeterministicRandom = {
    nextUint32,
    nextFloat: () => nextUint32() / UINT32_RANGE,
    intInclusive: (min, max) => {
      assertSafeInteger(min, 'min')
      assertSafeInteger(max, 'max')
      if (max < min) throw new RangeError('max must be greater than or equal to min')
      const span = max - min + 1
      if (!Number.isSafeInteger(span) || span > UINT32_RANGE) {
        throw new RangeError('integer range must contain at most 2^32 values')
      }
      const acceptedRange = Math.floor(UINT32_RANGE / span) * span
      let value = nextUint32()
      while (value >= acceptedRange) value = nextUint32()
      return min + (value % span)
    },
    pick: <T>(values: readonly T[]): T => {
      if (values.length === 0) throw new RangeError('cannot pick from an empty collection')
      return values[random.intInclusive(0, values.length - 1)]
    },
    shuffle: <T>(values: readonly T[]): T[] => {
      const result = [...values]
      for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = random.intInclusive(0, index)
        ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
      }
      return result
    },
    snapshotDraws: () => [...draws],
  }

  return random
}

export function createApplicationRandomStreams(
  key: ApplicationRandomStreamKey,
): ApplicationRandomStreams {
  if (typeof key.familyId !== 'string' || key.familyId.trim() === '') {
    throw new TypeError('familyId must be a non-empty string')
  }
  assertSafeInteger(key.version, 'version')
  if (key.version < 1) throw new RangeError('version must be positive')
  assertSafeInteger(key.variantIndex, 'variantIndex')
  if (key.variantIndex < 0) throw new RangeError('variantIndex must be non-negative')
  assertSafeInteger(key.attempt, 'attempt')
  if (key.attempt < 0) throw new RangeError('attempt must be non-negative')

  const prefix = `${key.familyId}@${key.version}/variant:${key.variantIndex}/attempt:${key.attempt}`
  return {
    model: createDeterministicRandom(key.seed, `${prefix}/model`),
    params: createDeterministicRandom(key.seed, `${prefix}/params`),
    choices: createDeterministicRandom(key.seed, `${prefix}/choices`),
  }
}
