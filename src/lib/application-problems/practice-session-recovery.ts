import type { AdditionalProblemCandidate } from '../problem-generator'
import type { PracticeGrade, PracticeSession, Problem } from '../types'
import { canGradePracticeProblem } from './practice-interaction-gate'
import { hasApplicationProblemSource } from './template-adapter'

type InteractionEligibilityCheck = (
  problem: Problem,
  grade: PracticeGrade,
) => Promise<boolean>

function placementDifficulty(problem: Problem): 1 | 2 | 3 | null {
  const value = (problem as Problem & { placementDifficulty?: unknown }).placementDifficulty
  return value === 1 || value === 2 || value === 3 ? value : null
}

function candidateVersion(candidate: AdditionalProblemCandidate, familyId: string): number | null {
  const prefix = `${familyId}@`
  if (!candidate.id.startsWith(prefix)) return null
  const version = Number(candidate.id.slice(prefix.length))
  return Number.isSafeInteger(version) && version > 0 ? version : null
}

function jsonCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function replaceBlockedApplicationProblemsInSession(input: {
  session: PracticeSession
  grade: PracticeGrade
  candidates: readonly AdditionalProblemCandidate[]
  isInteractionEligible?: InteractionEligibilityCheck
}): Promise<PracticeSession | null> {
  const isInteractionEligible = input.isInteractionEligible ?? canGradePracticeProblem
  const initialEligibility = await Promise.all(
    input.session.problems.map((problem) => isInteractionEligible(problem, input.grade)),
  )
  const blockedIndexes = initialEligibility.flatMap((eligible, index) => (
    eligible ? [] : [index]
  ))
  if (blockedIndexes.length === 0) return null

  const problems = [...input.session.problems]
  const answers = [...input.session.answers]
  const checkedAnswers = [...input.session.checkedAnswers]
  const archive = [...(input.session.applicationProblemReplacementArchive ?? [])]

  for (const arrayIndex of blockedIndexes) {
    const original = input.session.problems[arrayIndex]
    if (!hasApplicationProblemSource(original)) return null
    const difficulty = placementDifficulty(original)
    if (!difficulty) return null
    const originalVersion = original.applicationSource.generatorVersion
    const candidate = input.candidates.find((entry) => {
      const version = candidateVersion(entry, original.applicationSource.familyId)
      return entry.difficulty === difficulty && version !== null && version > originalVersion
    })
    if (!candidate) return null

    let replacement: Problem
    try {
      replacement = candidate.generate({
        seed: input.session.startedAt,
        variantIndex: arrayIndex,
        index: original.index,
        setId: input.session.setId,
      })
    } catch {
      return null
    }
    const replacementVersion = candidateVersion(candidate, original.applicationSource.familyId)
    if (
      !hasApplicationProblemSource(replacement) ||
      replacement.applicationSource.familyId !== original.applicationSource.familyId ||
      replacement.applicationSource.generatorVersion !== replacementVersion ||
      replacement.applicationSource.generatorVersion <= originalVersion ||
      replacement.applicationSource.instanceId === original.applicationSource.instanceId ||
      replacement.index !== original.index ||
      replacement.setId !== input.session.setId ||
      placementDifficulty(replacement) !== difficulty ||
      !await isInteractionEligible(replacement, input.grade)
    ) {
      return null
    }

    problems[arrayIndex] = jsonCopy(replacement)
    answers[arrayIndex] = null
    checkedAnswers[arrayIndex] = null
    if (!archive.some((entry) => entry.originalInstanceId === original.applicationSource.instanceId)) {
      archive.push({
        problemIndex: original.index,
        originalInstanceId: original.applicationSource.instanceId,
        replacementInstanceId: replacement.applicationSource.instanceId,
        originalProblem: jsonCopy(original),
      })
    }
  }

  const recovered = {
    ...input.session,
    problems,
    answers,
    checkedAnswers,
    applicationProblemReplacementArchive: archive,
  }
  const finalEligibility = await Promise.all(
    recovered.problems.map((problem) => isInteractionEligible(problem, input.grade)),
  )
  return finalEligibility.every(Boolean) ? recovered : null
}
