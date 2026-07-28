import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { GeneratedApplicationProblemV1, JsonValue } from './contracts'
import {
  generateG5AreaCompositeInverseProblem,
  generateG5AreaOverlapReconstructionProblem,
  generateG5PerimeterBoundaryRebuildProblem,
} from './families/grade5-geometry-families'
import { isGrade5ApplicationProblemSnapshotV1Valid } from './grade5-snapshot-validator'

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
  expect(isGrade5ApplicationProblemSnapshotV1Valid(candidate)).toBe(false)
}

const validProblems = [
  generateG5PerimeterBoundaryRebuildProblem({ seed: -3, variantIndex: 5 }),
  generateG5AreaCompositeInverseProblem({ seed: 109, variantIndex: 7 }),
  generateG5AreaOverlapReconstructionProblem({ seed: 44, variantIndex: 3 }),
] as const

describe('Grade 5 historical application snapshot validator v1', () => {
  it('accepts a valid stored instance from each Grade 5 geometry family', () => {
    validProblems.forEach((problem) => {
      expect(isGrade5ApplicationProblemSnapshotV1Valid(problem)).toBe(true)
    })
  })

  it('rejects source, pack, curriculum, and internally consistent seed mutations', () => {
    const problem = validProblems[0]
    const simpleMutations: Array<(candidate: MutableProblem) => void> = [
      (candidate) => {
        candidate.schemaVersion = 'changed' as MutableProblem['schemaVersion']
      },
      (candidate) => {
        candidate.familyId = 'g5-geometry-unknown'
      },
      (candidate) => {
        candidate.generatorVersion = 2
      },
      (candidate) => {
        candidate.packId = 'pack-unit-5-1-perimeter-area-changed'
      },
      (candidate) => {
        candidate.packVersion = 2
      },
      (candidate) => {
        candidate.curriculumCodes = [...candidate.curriculumCodes, '[6수03-13]']
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
        candidate.params.rectangleWidth = (candidate.params.rectangleWidth as number) + 1
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
        draws.params = [1]
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
        candidate.visual.generatorId = 'g5-geometry-changed-visual'
      },
      (candidate) => {
        candidate.visual.generatorVersion = 2
      },
      (candidate) => {
        const scene = candidate.visual.mathModel as Record<string, JsonValue>
        const constraints = scene.constraints as Array<Record<string, JsonValue>>
        constraints[0].expected = (constraints[0].expected as number) + 1
      },
    ]
    mutations.forEach((mutate) => expectMutationBlocked(problem, mutate))
  })

  it('does not import or call a production Grade 5 generator recipe', () => {
    const source = readFileSync(
      fileURLToPath(new URL('./grade5-snapshot-validator.ts', import.meta.url)),
      'utf8',
    )
    const familyValidatorSource = readFileSync(
      fileURLToPath(
        new URL(
          './families/grade5-geometry-visual-validator.ts',
          import.meta.url,
        ),
      ),
      'utf8',
    )

    expect(source).not.toMatch(
      /\bgenerateG5(?:PerimeterBoundaryRebuild|AreaCompositeInverse|AreaOverlapReconstruction)Problem\b/,
    )
    expect(source).not.toMatch(/\bG5_[A-Z_]+_GENERATOR\b/)
    expect(source).not.toMatch(/from ['"]\.\/families\//)
    expect(familyValidatorSource).not.toMatch(
      /from ['"]\.\/(?:g5-|grade5-geometry-families)/,
    )
    expect(familyValidatorSource).not.toMatch(/\bbuildG5[A-Z]/)
  })
})
