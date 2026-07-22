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
  applicationVisual: GeneratedApplicationVisualV1
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
    applicationVisual: problem.visual,
  }
}
