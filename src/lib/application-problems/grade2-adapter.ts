import type { Grade2Mission } from '../grade2-problems'
import type { ApplicationProblemSource } from '../types'
import {
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationAnswerV1,
  type GeneratedApplicationProblemV1,
  type GeneratedApplicationVisualV1,
  type JsonValue,
} from './contracts'
import { applicationProblemSourceOf } from './template-adapter'

export type Grade2ApplicationMissionV1 = Grade2Mission & {
  applicationSource: ApplicationProblemSource
  applicationParams: Record<string, JsonValue>
  applicationMisconceptionRefs: string[]
  applicationVisual: GeneratedApplicationVisualV1
  applicationPlacement?: {
    schemaVersion: 'grade2-application-placement-v1'
    baseMissionId: string
    baseSeed: number
  }
}

export interface Grade2ApplicationAnswerMappingContextV1 {
  answer: Readonly<GeneratedApplicationAnswerV1>
  problem: Readonly<GeneratedApplicationProblemV1>
  shell: Readonly<Grade2Mission>
}

export interface AdaptApplicationProblemToGrade2InputV1 {
  shell: Grade2Mission
  problem: GeneratedApplicationProblemV1
  mapAnswer(context: Grade2ApplicationAnswerMappingContextV1): string
}

export function adaptGeneratedApplicationProblemToGrade2(
  input: AdaptApplicationProblemToGrade2InputV1,
): Grade2ApplicationMissionV1 {
  const problem = parseGeneratedApplicationProblemV1(input.problem)
  if (typeof input.mapAnswer !== 'function') {
    throw new TypeError(
      'mapAnswer callback is required for Grade 2 structured length, time, label, and choice answers',
    )
  }
  const correctAnswer = input.mapAnswer({
    answer: problem.answer,
    problem,
    shell: input.shell,
  })
  if (typeof correctAnswer !== 'string' || correctAnswer.trim() === '') {
    throw new TypeError('mapAnswer must return a non-empty Grade 2 answer string')
  }

  const choiceShell = input.shell.answerType === 'choice' || input.shell.answerType === 'label'
  const choiceProblem = problem.answer.format === 'choice'
  if (choiceShell !== choiceProblem) {
    throw new TypeError('Grade 2 choice/label shell and generated answer format must match')
  }
  if (
    choiceProblem &&
    problem.choices?.[problem.correctChoiceIndex!] !== correctAnswer
  ) {
    throw new TypeError('mapped Grade 2 choice answer must equal the indexed choice value')
  }

  return {
    ...input.shell,
    prompt: problem.prompt,
    choices: choiceProblem ? [...problem.choices!] : undefined,
    correctAnswer,
    correctChoiceIndex: choiceProblem ? problem.correctChoiceIndex : undefined,
    hintSteps: [...problem.hintSteps],
    solutionSteps: [...problem.solutionSteps],
    applicationSource: applicationProblemSourceOf(problem),
    applicationParams: { ...problem.params },
    applicationMisconceptionRefs: [...problem.misconceptionRefs],
    applicationVisual: problem.visual,
  }
}

export function adaptGeneratedApplicationProblemToGrade2Replacement(input: {
  shell: Grade2Mission
  problem: GeneratedApplicationProblemV1
  baseSeed: number
}): Grade2ApplicationMissionV1 {
  const isTimeText = input.problem.answer.format === 'text' &&
    input.problem.familyId.startsWith('g2-2-time-') &&
    /^\d{1,2}시 \d{1,2}분$/.test(input.problem.answer.normalized)
  if (input.problem.answer.format === 'text' && !isTimeText) {
    throw new TypeError('Grade 2 text application answers must use the supported time-of-day form')
  }
  const answerType = input.problem.answer.format === 'choice'
    ? 'choice' as const
    : input.problem.answer.format === 'text'
      ? 'time-of-day' as const
      : 'integer' as const
  const shell: Grade2Mission = {
    ...input.shell,
    answerType,
    answerConfig: answerType === 'choice'
      ? { kind: 'choice' }
      : answerType === 'time-of-day'
        ? {
            kind: 'time-of-day',
            timeMode: 'time-of-day',
            inputLabel: '시각을 써요',
          }
        : { kind: 'integer', inputLabel: '답을 숫자로 써요' },
    curriculumCode: input.problem.curriculumCodes[0] ?? input.shell.curriculumCode,
    directCurriculumCodes: [...input.problem.curriculumCodes],
    visualSemantics: input.problem.visual.semantics ?? input.shell.visualSemantics,
  }
  return {
    ...adaptGeneratedApplicationProblemToGrade2({
      shell,
      problem: input.problem,
      mapAnswer: ({ answer }) => answer.normalized,
    }),
    applicationPlacement: {
      schemaVersion: 'grade2-application-placement-v1',
      baseMissionId: input.shell.id,
      baseSeed: input.baseSeed,
    },
  }
}

export function isGrade2ApplicationMission(
  mission: Grade2Mission,
): mission is Grade2ApplicationMissionV1 {
  const candidate = mission as Partial<Grade2ApplicationMissionV1>
  return (
    candidate.applicationSource?.schemaVersion === 'generated-application-problem-v1' &&
    typeof candidate.applicationParams === 'object' &&
    candidate.applicationParams !== null &&
    !Array.isArray(candidate.applicationParams) &&
    typeof candidate.applicationVisual === 'object' &&
    candidate.applicationVisual !== null
  )
}

export function hasGrade2ApplicationProblemSource(
  mission: Grade2Mission,
): mission is Grade2Mission & { applicationSource: ApplicationProblemSource } {
  return (
    mission as Grade2Mission & { applicationSource?: ApplicationProblemSource }
  ).applicationSource?.schemaVersion === 'generated-application-problem-v1'
}
