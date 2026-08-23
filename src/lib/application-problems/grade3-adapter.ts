import type { Grade3Mission } from '../grade3-problems'
import type { ApplicationProblemSource } from '../types'
import {
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationProblemV1,
  type GeneratedApplicationVisualV1,
  type JsonValue,
} from './contracts'
import { applicationProblemSourceOf } from './template-adapter'

export type Grade3ApplicationMissionV1 = Grade3Mission & {
  applicationSource: ApplicationProblemSource
  applicationParams: Record<string, JsonValue>
  applicationMisconceptionRefs: string[]
  applicationVisual: GeneratedApplicationVisualV1
  applicationPlacement: {
    schemaVersion: 'grade3-application-placement-v1'
    baseMissionId: string
    baseSeed: number
  }
}

function numberParam(problem: GeneratedApplicationProblemV1, key: string): number {
  const value = problem.params[key]
  if (!Number.isSafeInteger(value)) throw new TypeError(`${key} must be a safe integer`)
  return value as number
}

function textParam(problem: GeneratedApplicationProblemV1, key: string): string {
  const value = problem.params[key]
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${key} must be text`)
  return value
}

function angleKind(angle: number): '예각' | '직각' | '둔각' {
  return angle < 90 ? '예각' : angle === 90 ? '직각' : '둔각'
}

function uniqueChoices(correct: string, distractors: readonly string[]): string[] {
  const choices = Array.from(new Set([correct, ...distractors])).filter((choice) => choice.trim() !== '')
  if (choices.length < 3) throw new TypeError('Grade 3 text application requires three distinct choices')
  return choices.slice(0, 3)
}

function textAnswerChoices(problem: GeneratedApplicationProblemV1): string[] {
  const correct = problem.answer.normalized
  switch (problem.familyId) {
    case 'g3-1-lines-map-classification': {
      const lineKind = textParam(problem, 'lineKind')
      const kind = angleKind(numberParam(problem, 'angle'))
      const otherKind = kind === '예각' ? '둔각' : '예각'
      const otherLine = lineKind === '직선' ? '선분' : '직선'
      return uniqueChoices(correct, [`${lineKind}, ${otherKind}`, `${otherLine}, ${kind}`])
    }
    case 'g3-1-length-time-trip-conversion': {
      const km = numberParam(problem, 'km')
      const m = numberParam(problem, 'm')
      const hour = numberParam(problem, 'hour')
      const minute = numberParam(problem, 'minute')
      return uniqueChoices(correct, [
        `${km * 100 + m}m, ${hour * 60 + minute}분`,
        `${km * 1000 + m}m, ${hour * 100 + minute}분`,
      ])
    }
    case 'g3-1-fraction-decimal-tenths-conversion': {
      const shaded = numberParam(problem, 'shaded')
      return uniqueChoices(correct, [
        `${shaded}/10 = ${shaded}.0`,
        `${10 - shaded}/10 = 0.${10 - shaded}`,
      ])
    }
    case 'g3-1-fraction-decimal-decimal-claim-error': {
      const numerator = numberParam(problem, 'numerator')
      const claimed = numberParam(problem, 'claimedDecimalNumerator')
      return uniqueChoices(correct, [`0.${claimed}`, `${numerator}.0`])
    }
    case 'g3-2-division-share-remainder': {
      const total = numberParam(problem, 'total')
      const divisor = numberParam(problem, 'divisor')
      const quotient = Math.floor(total / divisor)
      const remainder = total % divisor
      return uniqueChoices(correct, [
        `${quotient + 1}개씩, ${remainder}개 남아요`,
        `${quotient}개씩, ${remainder + 1}개 남아요`,
      ])
    }
    case 'g3-2-division-quotient-error': {
      const total = numberParam(problem, 'total')
      const divisor = numberParam(problem, 'divisor')
      const claimed = numberParam(problem, 'claimedQuotient')
      const quotient = Math.floor(total / divisor)
      const remainder = total % divisor
      return uniqueChoices(correct, [
        `${claimed}, 나머지 ${remainder}`,
        `${quotient}, 나머지 ${remainder + 1}`,
      ])
    }
    case 'g3-2-fraction-representation-shift': {
      const whole = numberParam(problem, 'whole')
      const numerator = numberParam(problem, 'numerator')
      const denominator = numberParam(problem, 'denominator')
      return uniqueChoices(correct, [
        `${whole + numerator}/${denominator}`,
        `${whole * denominator}/${denominator}`,
      ])
    }
    case 'g3-2-capacity-weight-measure-pair': {
      const liters = numberParam(problem, 'liters')
      const milliliters = numberParam(problem, 'milliliters')
      const kg = numberParam(problem, 'kg')
      const g = numberParam(problem, 'g')
      const capacity = liters * 1000 + milliliters
      const weight = kg * 1000 + g
      return uniqueChoices(correct, [
        `${liters * 100 + milliliters}mL, ${weight}g`,
        `${capacity}mL, ${kg * 100 + g}g`,
      ])
    }
    default:
      throw new TypeError(`unsupported Grade 3 text application ${problem.familyId}`)
  }
}

export function adaptGeneratedApplicationProblemToGrade3Replacement(input: {
  shell: Grade3Mission
  problem: GeneratedApplicationProblemV1
  baseSeed: number
}): Grade3ApplicationMissionV1 {
  const problem = parseGeneratedApplicationProblemV1(input.problem)
  const choiceProblem = problem.answer.format === 'choice'
  const choices = choiceProblem
    ? [...problem.choices!]
    : problem.answer.format === 'text'
      ? textAnswerChoices(problem)
      : undefined
  const answerType = choices ? 'choice' as const : 'integer' as const
  if (choices && !choices.includes(problem.answer.normalized)) {
    throw new TypeError('Grade 3 application choices must include the correct answer')
  }
  return {
    ...input.shell,
    prompt: problem.prompt,
    answerType,
    answerConfig: answerType === 'choice'
      ? { kind: 'choice' }
      : { kind: 'integer', inputLabel: '답을 숫자로 써요' },
    correctAnswer: problem.answer.normalized,
    choices,
    hintSteps: [...problem.hintSteps],
    solutionSteps: [...problem.solutionSteps],
    curriculumCode: problem.curriculumCodes[0] ?? input.shell.curriculumCode,
    directCurriculumCodes: [...problem.curriculumCodes],
    taskActions: [...input.shell.taskActions],
    visualSemantics: problem.visual.semantics ?? input.shell.visualSemantics,
    applicationSource: applicationProblemSourceOf(problem),
    applicationParams: { ...problem.params },
    applicationMisconceptionRefs: [...problem.misconceptionRefs],
    applicationVisual: problem.visual,
    applicationPlacement: {
      schemaVersion: 'grade3-application-placement-v1',
      baseMissionId: input.shell.id,
      baseSeed: input.baseSeed,
    },
  }
}

export function isGrade3ApplicationMission(
  mission: Grade3Mission,
): mission is Grade3ApplicationMissionV1 {
  const candidate = mission as Partial<Grade3ApplicationMissionV1>
  return (
    candidate.applicationSource?.schemaVersion === 'generated-application-problem-v1'
    && typeof candidate.applicationParams === 'object'
    && candidate.applicationParams !== null
    && typeof candidate.applicationVisual === 'object'
    && candidate.applicationVisual !== null
    && candidate.applicationPlacement?.schemaVersion === 'grade3-application-placement-v1'
  )
}
