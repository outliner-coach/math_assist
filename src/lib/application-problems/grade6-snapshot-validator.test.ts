import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { GeneratedApplicationProblemV1, JsonValue } from './contracts'
import {
  generateG6RatioPartWhole,
  generateG6RatioRelativeComparison,
  generateG6RatioRepresentationCheck,
} from './families/g6-ratio'
import { isGrade6ApplicationProblemSnapshotV1Valid } from './grade6-snapshot-validator'

type MutableProblem = GeneratedApplicationProblemV1

function clone(problem: GeneratedApplicationProblemV1): MutableProblem {
  return structuredClone(problem)
}

function generation(problem: MutableProblem): Record<string, JsonValue> {
  return problem.params.__generation as Record<string, JsonValue>
}

function expectMutationBlocked(
  problem: GeneratedApplicationProblemV1,
  mutate: (candidate: MutableProblem) => void,
): void {
  const candidate = clone(problem)
  mutate(candidate)
  expect(isGrade6ApplicationProblemSnapshotV1Valid(candidate)).toBe(false)
}

const validProblems = [
  generateG6RatioPartWhole({ seed: -3, variantIndex: 5 }),
  generateG6RatioRelativeComparison({ seed: 109, variantIndex: 7 }),
  generateG6RatioRepresentationCheck({ seed: 44, variantIndex: 3 }),
] as const

describe('Grade 6 historical application snapshot validator v1', () => {
  it('keeps stored visual resolution independent from current family validators', () => {
    const resolver = readFileSync(
      fileURLToPath(new URL('./grade6-visual-resolution.ts', import.meta.url)),
      'utf8',
    )

    expect(resolver).not.toMatch(/from ['"]\.\/families\//)
    expect(resolver).not.toMatch(/\bvalidateG6Ratio/)
  })

  it('accepts a valid stored instance from each Grade 6 ratio family', () => {
    validProblems.forEach((problem) => {
      expect(isGrade6ApplicationProblemSnapshotV1Valid(problem)).toBe(true)
    })
  })

  it('accepts corrected wording without invalidating the original V1 snapshot', () => {
    const corrected = generateG6RatioRepresentationCheck({ seed: 1, variantIndex: 0 })
    const legacy = clone(corrected)
    legacy.solutionSteps = legacy.solutionSteps.map((step) => step.replace(
      '비교하는 양을 분자, 기준량을 분모에 두어야 합니다. 비교하는 양은 1, 기준량은 20입니다.',
      '비교하는 양 1을 분자, 기준량 20을 분모에 두어야 합니다.',
    ))

    expect(isGrade6ApplicationProblemSnapshotV1Valid(corrected)).toBe(true)
    expect(isGrade6ApplicationProblemSnapshotV1Valid(legacy)).toBe(true)
  })

  it('rejects source, pack, curriculum, and internally consistent seed mutations', () => {
    const problem = validProblems[0]

    const simpleMutations: Array<(candidate: MutableProblem) => void> = [
      (candidate) => {
        candidate.schemaVersion = 'changed' as MutableProblem['schemaVersion']
      },
      (candidate) => {
        candidate.familyId = 'g6-ratio-unknown'
      },
      (candidate) => {
        candidate.generatorVersion = 2
      },
      (candidate) => {
        candidate.packId = 'pack-unit-6-1-ratio-changed'
      },
      (candidate) => {
        candidate.packVersion = 2
      },
      (candidate) => {
        candidate.curriculumCodes = [...candidate.curriculumCodes].reverse()
      },
      (candidate) => {
        candidate.instanceId = `${candidate.instanceId}-changed`
      },
    ]
    simpleMutations.forEach((mutate) => expectMutationBlocked(problem, mutate))

    expectMutationBlocked(problem, (candidate) => {
      candidate.seed += 1
      candidate.instanceId =
        `${candidate.familyId}@${candidate.generatorVersion}:${candidate.seed}:${candidate.variantIndex}`
    })
    expectMutationBlocked(problem, (candidate) => {
      candidate.variantIndex += 1
      candidate.instanceId =
        `${candidate.familyId}@${candidate.generatorVersion}:${candidate.seed}:${candidate.variantIndex}`
    })
  })

  it('rejects params, prompt, answer, hints, solutions, and misconception mutations', () => {
    const problem = validProblems[1]
    const wrongChoiceIndex = (problem.correctChoiceIndex! + 1) % problem.choices!.length

    const mutations: Array<(candidate: MutableProblem) => void> = [
      (candidate) => {
        candidate.params.leftSuccesses = (candidate.params.leftSuccesses as number) + 1
      },
      (candidate) => {
        candidate.params.unexpected = true
      },
      (candidate) => {
        candidate.prompt = `${candidate.prompt} 바뀜`
      },
      (candidate) => {
        candidate.answer = {
          format: 'choice',
          normalized: candidate.choices![wrongChoiceIndex],
        }
        candidate.correctChoiceIndex = wrongChoiceIndex
      },
      (candidate) => {
        candidate.hintSteps[0] = `${candidate.hintSteps[0]} 바뀜`
      },
      (candidate) => {
        candidate.solutionSteps[0] = `${candidate.solutionSteps[0]} 바뀜`
      },
      (candidate) => {
        candidate.misconceptionRefs = [...candidate.misconceptionRefs].reverse()
      },
      (candidate) => {
        generation(candidate).attempt = 1
      },
      (candidate) => {
        const draws = generation(candidate).randomDraws as Record<string, JsonValue>
        draws.model = [1]
      },
    ]
    mutations.forEach((mutate) => expectMutationBlocked(problem, mutate))
  })

  it('requires choiceOrder to be a strict permutation applied to canonical choices', () => {
    const problem = validProblems[2]

    expectMutationBlocked(problem, (candidate) => {
      const order = generation(candidate).choiceOrder as number[]
      order[1] = order[0]
    })
    expectMutationBlocked(problem, (candidate) => {
      const order = generation(candidate).choiceOrder as number[]
      order[0] = 4
    })
    expectMutationBlocked(problem, (candidate) => {
      delete generation(candidate).choiceOrder
    })
    expectMutationBlocked(problem, (candidate) => {
      const distractorIndex = candidate.correctChoiceIndex === 0 ? 1 : 0
      candidate.choices![distractorIndex] = '조작된 보기'
    })
    expectMutationBlocked(problem, (candidate) => {
      const order = generation(candidate).choiceOrder as number[]
      ;[order[0], order[1]] = [order[1], order[0]]
    })
  })

  it('rejects required quantitative visual metadata and math-model mutations', () => {
    const problem = validProblems[0]
    const mutations: Array<(candidate: MutableProblem) => void> = [
      (candidate) => {
        candidate.visual.role = 'support'
        candidate.visual.answerCritical = false
      },
      (candidate) => {
        candidate.visual.semantics = 'schematic'
      },
      (candidate) => {
        candidate.visual.generatorId = 'g6-ratio-changed-visual'
      },
      (candidate) => {
        candidate.visual.generatorVersion = 2
      },
      (candidate) => {
        const scene = candidate.visual.mathModel as Record<string, JsonValue>
        const constraints = scene.constraints as Array<Record<string, JsonValue>>
        constraints[1].expected = (constraints[1].expected as number) + 0.1
      },
    ]
    mutations.forEach((mutate) => expectMutationBlocked(problem, mutate))
  })

  it('does not import or call a production Grade 6 generator recipe', () => {
    const source = readFileSync(
      fileURLToPath(new URL('./grade6-snapshot-validator.ts', import.meta.url)),
      'utf8',
    )

    expect(source).not.toMatch(/from ['"]\.\/families\/g6-/)
    expect(source).not.toMatch(
      /\bgenerateG6Ratio(?:PartWhole|RelativeComparison|RepresentationCheck)\b/,
    )
    expect(source).not.toMatch(/\bG6_RATIO_[A-Z_]+_GENERATOR\b/)
  })
})
