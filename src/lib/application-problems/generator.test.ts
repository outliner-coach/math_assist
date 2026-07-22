import { describe, expect, it, vi } from 'vitest'
import type { Grade2Mission } from '../grade2-problems'
import type { Problem } from '../types'
import {
  parseApplicationProblemFamilyV1,
  type ApplicationProblemFamilyV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from './contracts'
import {
  ApplicationProblemGenerationError,
  generateApplicationProblem,
  generateApplicationProblemSet,
  type ApplicationProblemFamilyGeneratorV1,
} from './generator'
import {
  adaptGeneratedApplicationProblemToGrade2,
} from './grade2-adapter'
import {
  EMPTY_APPLICATION_PROBLEM_REGISTRY,
  selectApprovedRuntimeCandidates,
  type ApplicationProblemRegistryV1,
} from './registry'
import {
  createApplicationRandomStreams,
  createDeterministicRandom,
} from './random'
import {
  adaptGeneratedApplicationProblemToPractice,
  hasApplicationProblemSource,
} from './template-adapter'

const pendingApproval = {
  ownerStatus: 'pending' as const,
  evidenceRefs: [] as string[],
  expertStatus: 'not-reviewed' as const,
}

const approvedApproval = {
  ownerStatus: 'approved' as const,
  ownerId: 'project-owner',
  approvedAt: '2026-07-22T00:00:00.000Z',
  evidenceRefs: ['reports/application-problems/family-v1.md'],
  expertStatus: 'not-reviewed' as const,
}

function family(
  overrides: Partial<ApplicationProblemFamilyV1> = {},
): ApplicationProblemFamilyV1 {
  return parseApplicationProblemFamilyV1({
    schemaVersion: 'application-problem-family-v1',
    familyId: 'g2-length-route-total',
    version: 1,
    packId: 'pack-g2-2-length',
    unitId: 'g2-2-length',
    conceptIds: ['length-compose'],
    primaryStandard: '[2수03-10]',
    connectedStandards: [],
    cognitiveDomain: 'applying',
    reasoningPattern: 'multi_step',
    representations: ['text', 'diagram'],
    contextType: 'real_world',
    readingLoad: 'low',
    estimatedSteps: 2,
    modelId: 'segment-sum',
    unknownRole: 'total-length',
    requiredStudentActions: ['interpret_context', 'execute_calculation'],
    misconceptionRefs: ['length-unit-place-value'],
    visualPolicy: {
      role: 'required',
      semantics: 'quantitative',
      generatorId: 'length-segment-bar-v1',
      answerCritical: true,
    },
    proofMode: 'exhaustive',
    runtimeMode: 'deterministic-generator',
    releaseStatus: 'draft',
    approval: pendingApproval,
    ...overrides,
  })
}

function numberParam(params: Record<string, JsonValue>, key: string): number {
  const value = params[key]
  if (typeof value !== 'number') throw new Error(`${key} is not numeric`)
  return value
}

function generator(
  overrides: Partial<ApplicationProblemFamilyGeneratorV1> = {},
): ApplicationProblemFamilyGeneratorV1 {
  return {
    familyId: 'g2-length-route-total',
    version: 1,
    packId: 'pack-g2-2-length',
    packVersion: 1,
    maxAttempts: 8,
    sample: ({ random }) => {
      const firstCm = random.params.intInclusive(100, 180)
      const secondCm = random.params.intInclusive(20, 90)
      return {
        params: { firstCm, secondCm },
        mathModel: {
          kind: 'segment-bar',
          segments: [firstCm, secondCm],
        },
      }
    },
    render: ({ params }) => {
      const firstCm = numberParam(params, 'firstCm')
      const secondCm = numberParam(params, 'secondCm')
      const total = firstCm + secondCm
      return {
        prompt: `${firstCm} cm와 ${secondCm} cm를 이은 전체 길이를 구하세요.`,
        answer: { format: 'number', normalized: String(total) },
        solutionSteps: [`${firstCm}+${secondCm}=${total}`],
        hintSteps: ['두 길이의 단위를 같게 두고 더해 보세요.'],
      }
    },
    ...overrides,
  }
}

function generate(
  overrides: Partial<Parameters<typeof generateApplicationProblem>[0]> = {},
): GeneratedApplicationProblemV1 {
  return generateApplicationProblem({
    family: family(),
    generator: generator(),
    packVersion: 1,
    seed: 42,
    variantIndex: 0,
    ...overrides,
  })
}

function choiceGenerator(): ApplicationProblemFamilyGeneratorV1 {
  return generator({
    sample: ({ random }) => ({
      params: { target: random.params.intInclusive(6, 12) },
      mathModel: { kind: 'choice-target' },
    }),
    render: ({ params }) => {
      const target = numberParam(params, 'target')
      const choices = [target, target + 1, target - 1, target + 2].map(String)
      return {
        prompt: `${target}와 같은 수를 고르세요.`,
        answer: { format: 'choice', normalized: String(target) },
        choices,
        correctChoiceIndex: 0,
        solutionSteps: [`${target}를 고릅니다.`],
        hintSteps: ['문제의 수와 같은 보기를 찾으세요.'],
      }
    },
  })
}

describe('deterministic application random', () => {
  it('keeps a fixed vector for a safe integer seed and namespace', () => {
    const random = createDeterministicRandom(42, 'family@1/variant:0/params')

    expect(Array.from({ length: 5 }, () => random.nextUint32())).toEqual([
      3585518919,
      1045741719,
      3532302695,
      1777039403,
      1916431477,
    ])
  })

  it('isolates model, params, and choice streams from unrelated consumption', () => {
    const first = createApplicationRandomStreams({
      familyId: 'family',
      version: 1,
      seed: 42,
      variantIndex: 0,
      attempt: 0,
    })
    const second = createApplicationRandomStreams({
      familyId: 'family',
      version: 1,
      seed: 42,
      variantIndex: 0,
      attempt: 0,
    })

    first.model.nextUint32()
    first.model.nextUint32()

    expect(first.params.nextUint32()).toBe(second.params.nextUint32())
    expect(first.choices.nextUint32()).toBe(second.choices.nextUint32())
  })

  it('isolates family versions and variants in stream namespaces', () => {
    const base = createApplicationRandomStreams({
      familyId: 'family', version: 1, seed: 42, variantIndex: 0, attempt: 0,
    })
    const version = createApplicationRandomStreams({
      familyId: 'family', version: 2, seed: 42, variantIndex: 0, attempt: 0,
    })
    const variant = createApplicationRandomStreams({
      familyId: 'family', version: 1, seed: 42, variantIndex: 1, attempt: 0,
    })

    expect(version.params.nextUint32()).not.toBe(base.params.nextUint32())
    expect(variant.params.nextUint32()).not.toBe(
      createApplicationRandomStreams({
        familyId: 'family', version: 1, seed: 42, variantIndex: 0, attempt: 0,
      }).params.nextUint32(),
    )
  })

  it('rejects implicit or unsafe entropy', () => {
    expect(() => createDeterministicRandom(Number.MAX_SAFE_INTEGER + 1, 'params')).toThrow(
      /safe integer/i,
    )
    expect(() => createDeterministicRandom(1, '')).toThrow(/namespace/i)
  })
})

describe('application problem generator', () => {
  it('reproduces the same normalized snapshot without time or Math.random', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be called')
    })
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Date.now must not be called')
    })

    expect(generate()).toEqual(generate())
    expect(randomSpy).not.toHaveBeenCalled()
    expect(nowSpy).not.toHaveBeenCalled()

    randomSpy.mockRestore()
    nowSpy.mockRestore()
  })

  it('keeps version and variant identity in provenance and random decisions', () => {
    const base = generate()
    const nextVariant = generate({ variantIndex: 1 })
    const nextFamily = family({ version: 2 })
    const nextVersion = generate({
      family: nextFamily,
      generator: generator({ version: 2 }),
    })

    expect(base.instanceId).toBe('g2-length-route-total@1:42:0')
    expect(nextVariant.instanceId).toBe('g2-length-route-total@1:42:1')
    expect(nextVersion.instanceId).toBe('g2-length-route-total@2:42:0')
    expect(nextVariant.params.__generation).not.toEqual(base.params.__generation)
    expect(nextVersion.params.__generation).not.toEqual(base.params.__generation)
  })

  it('records every random draw and keeps rendering pure and replayable', () => {
    const result = generate()
    const generation = result.params.__generation as Record<string, JsonValue>
    const draws = generation.randomDraws as Record<string, JsonValue>

    expect(draws.model).toEqual([])
    expect(draws.params).toHaveLength(2)
    expect(draws.choices).toEqual([])
    expect(result.visual.mathModel).toEqual({
      kind: 'segment-bar',
      segments: [result.params.firstCm, result.params.secondCm],
    })
  })

  it('does not move params or choices when only the model stream consumes more draws', () => {
    const baseGenerator = choiceGenerator()
    const extraModelDrawGenerator = choiceGenerator()
    extraModelDrawGenerator.sample = ({ random }) => {
      random.model.nextUint32()
      random.model.nextUint32()
      return {
        params: { target: random.params.intInclusive(6, 12) },
        mathModel: { kind: 'choice-target' },
      }
    }

    const base = generate({ generator: baseGenerator })
    const extra = generate({ generator: extraModelDrawGenerator })
    const baseTrace = base.params.__generation as Record<string, JsonValue>
    const extraTrace = extra.params.__generation as Record<string, JsonValue>

    expect(extra.params.target).toBe(base.params.target)
    expect(extra.choices).toEqual(base.choices)
    expect(extra.answer).toEqual(base.answer)
    expect((extraTrace.randomDraws as Record<string, JsonValue>).params).toEqual(
      (baseTrace.randomDraws as Record<string, JsonValue>).params,
    )
    expect((extraTrace.randomDraws as Record<string, JsonValue>).choices).toEqual(
      (baseTrace.randomDraws as Record<string, JsonValue>).choices,
    )
  })

  it('preserves choice values while updating the shuffled correct index', () => {
    const result = generate({ generator: choiceGenerator() })
    const generation = result.params.__generation as Record<string, JsonValue>

    expect(result.answer.format).toBe('choice')
    expect(result.choices).toHaveLength(4)
    expect(new Set(result.choices).size).toBe(4)
    expect(result.choices?.[result.correctChoiceIndex!]).toBe(result.answer.normalized)
    expect(generation.choiceOrder).toHaveLength(4)
  })

  it('retries rejected candidates in a fixed bounded order', () => {
    const attempts: number[] = []
    const retrying = generator({
      maxAttempts: 3,
      sample: (input) => {
        attempts.push(input.attempt)
        if (input.attempt < 2) return null
        return {
          params: { value: input.random.params.intInclusive(1, 9) },
          mathModel: { kind: 'accepted' },
        }
      },
      render: ({ params }) => ({
        prompt: '고정된 순서로 찾은 문제입니다.',
        answer: { format: 'number', normalized: String(params.value) },
        solutionSteps: ['값을 확인합니다.'],
        hintSteps: ['주어진 값을 살펴보세요.'],
      }),
    })

    const result = generate({ generator: retrying, maxAttempts: 3 })

    expect(attempts).toEqual([0, 0, 1, 1, 2, 2])
    expect(result.params.__generation).toMatchObject({ attempt: 2 })
  })

  it('fails explicitly when the bounded attempts cannot produce a problem', () => {
    const rejecting = generator({ maxAttempts: 3, sample: () => null })

    try {
      generate({ generator: rejecting, maxAttempts: 3 })
      throw new Error('expected generation to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationProblemGenerationError)
      expect(error).toMatchObject({
        code: 'GENERATION_EXHAUSTED',
        familyId: 'g2-length-route-total',
        version: 1,
        seed: 42,
        variantIndex: 0,
        attempts: 3,
      })
    }
  })

  it('rejects an impure renderer instead of blessing non-deterministic output', () => {
    let renderCount = 0
    const impure = generator({
      render: () => ({
        prompt: `호출 ${++renderCount}`,
        answer: { format: 'number', normalized: '1' },
        solutionSteps: ['1입니다.'],
        hintSteps: ['1을 보세요.'],
      }),
    })

    expect(() => generate({ generator: impure })).toThrowError(
      expect.objectContaining({ code: 'NON_DETERMINISTIC_RENDER' }),
    )
  })

  it('rejects pack identity drift for the same public instance identity', () => {
    expect(() => generate({ packVersion: 2 })).toThrowError(
      expect.objectContaining({ code: 'PACK_VERSION_MISMATCH' }),
    )
    expect(() => generate({
      generator: generator({ packId: 'different-pack' }),
    })).toThrowError(expect.objectContaining({ code: 'PACK_ID_MISMATCH' }))
  })

  it('rejects caller retry drift from the generator recipe policy', () => {
    expect(() => generate({
      generator: generator({ maxAttempts: 3 }),
      maxAttempts: 2,
    })).toThrowError(expect.objectContaining({ code: 'MAX_ATTEMPTS_POLICY_MISMATCH' }))
  })

  it('rejects a sampler that does not replay from the supplied streams', () => {
    let sampleCount = 0
    const impure = generator({
      sample: () => ({
        params: { value: ++sampleCount },
        mathModel: { kind: 'impure-sample' },
      }),
      render: ({ params }) => ({
        prompt: `값 ${params.value}를 쓰세요.`,
        answer: { format: 'number', normalized: String(params.value) },
        solutionSteps: ['주어진 값을 씁니다.'],
        hintSteps: ['값을 확인하세요.'],
      }),
    })

    expect(() => generate({ generator: impure })).toThrowError(
      expect.objectContaining({ code: 'NON_DETERMINISTIC_SAMPLE' }),
    )
  })

  it('snapshots a shared sampler result before the replay can mutate it', () => {
    const sharedSample = {
      params: { value: 1 },
      mathModel: { kind: 'shared-sample', value: 1 },
    }
    let sampleCount = 0
    const shared = generator({
      sample: () => {
        sampleCount += 1
        if (sampleCount === 2) {
          sharedSample.params.value = 2
          sharedSample.mathModel.value = 2
        }
        return sharedSample
      },
      render: ({ params }) => ({
        prompt: `값 ${params.value}를 쓰세요.`,
        answer: { format: 'number', normalized: String(params.value) },
        solutionSteps: ['주어진 값을 씁니다.'],
        hintSteps: ['값을 확인하세요.'],
      }),
    })

    expect(() => generate({ generator: shared })).toThrowError(
      expect.objectContaining({ code: 'NON_DETERMINISTIC_SAMPLE' }),
    )
  })

  it('snapshots a shared renderer result before the replay can mutate it', () => {
    const sharedRender = {
      prompt: '첫 번째 문장',
      answer: { format: 'number' as const, normalized: '1' },
      solutionSteps: ['1입니다.'],
      hintSteps: ['1을 보세요.'],
    }
    let renderCount = 0
    const shared = generator({
      render: () => {
        renderCount += 1
        if (renderCount === 2) sharedRender.prompt = '두 번째 문장'
        return sharedRender
      },
    })

    expect(() => generate({ generator: shared })).toThrowError(
      expect.objectContaining({ code: 'NON_DETERMINISTIC_RENDER' }),
    )
  })

  it('fails the whole requested set when a sequential variant cannot be produced', () => {
    const sparse = generator({
      maxAttempts: 2,
      sample: ({ variantIndex, random }) =>
        variantIndex === 1
          ? null
          : {
              params: { value: random.params.intInclusive(1, 9) },
              mathModel: { kind: 'sparse' },
            },
      render: ({ params }) => ({
        prompt: `${params.value}를 쓰세요.`,
        answer: { format: 'number', normalized: String(params.value) },
        solutionSteps: ['주어진 값을 씁니다.'],
        hintSteps: ['값을 확인하세요.'],
      }),
    })

    expect(() => generateApplicationProblemSet({
      family: family(),
      generator: sparse,
      packVersion: 1,
      seed: 42,
      startVariantIndex: 0,
      count: 3,
      maxAttempts: 2,
    })).toThrowError(expect.objectContaining({
      code: 'GENERATION_EXHAUSTED',
      variantIndex: 1,
      attempts: 2,
    }))
  })

  it('rejects an empty or unbounded requested set with a specific stable code', () => {
    for (const count of [0, 101]) {
      expect(() => generateApplicationProblemSet({
        family: family(),
        generator: generator(),
        packVersion: 1,
        seed: 42,
        startVariantIndex: 0,
        count,
      })).toThrowError(expect.objectContaining({ code: 'INVALID_SET_COUNT' }))
    }
  })
})

function grade2Shell(overrides: Partial<Grade2Mission> = {}): Grade2Mission {
  return {
    id: 'g2-2-length-07',
    unitId: 'g2-2-length',
    semester: '2-2',
    stageOrder: 87,
    unitMissionOrder: 7,
    skill: 'length',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-10]',
    learnerGoal: '길이를 여러 단계로 구할 수 있어요.',
    parentSummaryTag: '길이 응용',
    prompt: 'legacy prompt',
    answerType: 'length',
    answerConfig: { kind: 'length', unit: 'm-cm', inputLabel: '전체 길이' },
    params: { legacy: 1 },
    correctAnswer: '1m',
    visualModel: 'length-bars',
    visualConfig: { unit: 'cm' },
    hintSteps: ['legacy hint'],
    solutionSteps: ['legacy solution'],
    rewardId: 'measureTape',
    ...overrides,
  }
}

describe('grade adapters', () => {
  it('preserves the Grade 2 mission shell and requires explicit structured answer mapping', () => {
    const problem = generate()
    const shell = grade2Shell()
    const mission = adaptGeneratedApplicationProblemToGrade2({
      shell,
      problem,
      mapAnswer: ({ answer }) => `${Math.floor(Number(answer.normalized) / 100)}m${Number(answer.normalized) % 100}cm`,
    })

    expect(mission).toMatchObject({
      id: shell.id,
      unitId: shell.unitId,
      stageOrder: shell.stageOrder,
      unitMissionOrder: shell.unitMissionOrder,
      skill: shell.skill,
      difficultyStep: shell.difficultyStep,
      rewardId: shell.rewardId,
      prompt: problem.prompt,
      answerType: 'length',
      answerConfig: shell.answerConfig,
      correctAnswer: expect.stringMatching(/^\d+m\d+cm$/),
      hintSteps: problem.hintSteps,
      solutionSteps: problem.solutionSteps,
      applicationParams: problem.params,
      applicationVisual: problem.visual,
      applicationSource: {
        instanceId: problem.instanceId,
        familyId: problem.familyId,
        generatorVersion: problem.generatorVersion,
        seed: problem.seed,
        variantIndex: problem.variantIndex,
      },
    })
    expect(mission.params).toEqual(shell.params)
    expect(mission.visualModel).toBe(shell.visualModel)
    expect(mission).not.toHaveProperty('proof')
  })

  it('keeps Grade 2 choice values and indices aligned after generation', () => {
    const problem = generate({ generator: choiceGenerator() })
    const mission = adaptGeneratedApplicationProblemToGrade2({
      shell: grade2Shell({
        answerType: 'choice',
        answerConfig: { kind: 'choice' },
      }),
      problem,
      mapAnswer: ({ answer }) => answer.normalized,
    })

    expect(mission.choices).toEqual(problem.choices)
    expect(mission.correctChoiceIndex).toBe(problem.correctChoiceIndex)
    expect(mission.choices?.[mission.correctChoiceIndex!]).toBe(mission.correctAnswer)
  })

  it('preserves Grade 2 label semantics while using canonical choice values', () => {
    const problem = generate({ generator: choiceGenerator() })
    const mission = adaptGeneratedApplicationProblemToGrade2({
      shell: grade2Shell({
        answerType: 'label',
        answerConfig: { kind: 'label', inputLabel: '알맞은 이름' },
      }),
      problem,
      mapAnswer: ({ answer }) => answer.normalized,
    })

    expect(mission.answerType).toBe('label')
    expect(mission.answerConfig).toEqual({ kind: 'label', inputLabel: '알맞은 이름' })
    expect(mission.choices).toEqual(problem.choices)
    expect(mission.choices?.[mission.correctChoiceIndex!]).toBe(mission.correctAnswer)
  })

  it('builds a normal Grade 5/6 Problem snapshot from explicit placement data', () => {
    const generated = generate({ generator: choiceGenerator() })
    const problem = adaptGeneratedApplicationProblemToPractice({
      problem: generated,
      placement: {
        index: 4,
        templateId: 'application-g2-length-v1',
        setId: 'B',
        difficulty: 1,
      },
      mapParams: (params) => ({ target: numberParam(params, 'target') }),
      mapVisual: () => ({
        type: 'basic_shape',
        props: { shape: 'rectangle', width: 2, height: 3, unit: 'cm' },
      }),
    })

    expect(problem).toMatchObject({
      index: 4,
      templateId: 'application-g2-length-v1',
      setId: 'B',
      placementDifficulty: 1,
      params: { target: generated.params.target },
      prompt: generated.prompt,
      type: 'choice',
      choices: generated.choices,
      correctAnswer: generated.answer.normalized,
      correctChoiceIndex: generated.correctChoiceIndex,
      solutionSteps: generated.solutionSteps,
      hintSteps: generated.hintSteps,
      problemFamily: generated.familyId,
      applicationSource: {
        instanceId: generated.instanceId,
        familyId: generated.familyId,
      },
    })
    expect(problem.choices?.[problem.correctChoiceIndex!]).toBe(problem.correctAnswer)
    expect(problem).not.toHaveProperty('blueprint')
    expect(problem).not.toHaveProperty('cognitiveDomain')
    expect(problem).not.toHaveProperty('proof')
  })

  it('leaves legacy Problem snapshots valid without applicationSource', () => {
    const legacy: Problem = {
      index: 0,
      templateId: 'legacy-template',
      setId: 'A',
      params: { n: 3 },
      prompt: '3을 쓰세요.',
      type: 'number',
      correctAnswer: '3',
      solutionSteps: ['3입니다.'],
    }

    expect(hasApplicationProblemSource(legacy)).toBe(false)
  })
})

describe('application problem registry', () => {
  it('starts empty and contains no pilot family registrations', () => {
    expect(EMPTY_APPLICATION_PROBLEM_REGISTRY.entries).toEqual([])
  })

  it('selects only owner-approved families with evidence as runtime candidates', () => {
    const approved = family({ releaseStatus: 'approved', approval: approvedApproval })
    const draft = family()
    const quarantined = { ...approved, familyId: 'quarantined-family', releaseStatus: 'quarantined' as const }
    const retired = { ...approved, familyId: 'retired-family', releaseStatus: 'retired' as const }
    const missingOwnerEvidence = {
      ...approved,
      familyId: 'unreviewed-family',
      approval: pendingApproval,
    }
    const blankEvidence = {
      ...approved,
      familyId: 'blank-evidence-family',
      approval: { ...approvedApproval, evidenceRefs: [''] },
    }
    const registry: ApplicationProblemRegistryV1 = {
      entries: [approved, draft, quarantined, retired, missingOwnerEvidence, blankEvidence].map((entryFamily) => ({
        family: entryFamily,
        runtime: { kind: 'deterministic-generator' as const, generator: generator({
          familyId: entryFamily.familyId,
        }) },
      })),
    }

    expect(selectApprovedRuntimeCandidates(registry).map((entry) => entry.family.familyId)).toEqual([
      'g2-length-route-total',
    ])
  })

  it('admits only non-empty canonical reviewed static corpora for the exact family', () => {
    const staticFamily = family({
      proofMode: 'static-corpus',
      runtimeMode: 'static-corpus',
      releaseStatus: 'approved',
      approval: approvedApproval,
    })
    const problem = generate()
    const review = {
      status: 'approved' as const,
      reviewerId: 'curriculum-reviewer',
      reviewedAt: '2026-07-22T00:00:00.000Z',
      evidenceRefs: ['reports/application-problems/static-corpus-review.md'],
    }
    const reviewedEntry = { corpusId: 'length-corpus-001', problem, review }
    const selectedCount = (entries: readonly unknown[]) =>
      selectApprovedRuntimeCandidates({
        entries: [{
          family: staticFamily,
          runtime: { kind: 'static-corpus', entries } as never,
        }],
      }).length

    const foreignProblem: GeneratedApplicationProblemV1 = {
      ...problem,
      instanceId: `foreign-family@1:${problem.seed}:${problem.variantIndex}`,
      familyId: 'foreign-family',
    }
    const malformedProblem = {
      ...problem,
      answer: { ...problem.answer, normalized: '' },
    } as GeneratedApplicationProblemV1

    expect(selectedCount([reviewedEntry])).toBe(1)
    expect(selectedCount([])).toBe(0)
    expect(selectedCount([{
      ...reviewedEntry,
      review: { ...review, status: 'pending' as const },
    }])).toBe(0)
    expect(selectedCount([{ ...reviewedEntry, problem: foreignProblem }])).toBe(0)
    expect(selectedCount([{ ...reviewedEntry, problem: malformedProblem }])).toBe(0)
  })
})
