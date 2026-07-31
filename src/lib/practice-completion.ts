import { loadConceptProgress, recordConceptProgress } from './progress'
import {
  createLearningSetCompletionRecord,
  projectLearningCompletion,
  recordLearningSetCompletion,
  type LearningSetCompletionRecord,
} from './learning-activity'
import {
  buildSessionResult,
  clearSession,
  loadResult,
  resolvePracticeGrade,
  resolvePracticeItemCount,
  saveResult,
} from './session'
import type { PracticeSession, SessionResult, SubmissionResult } from './types'

export type PracticeCompletionWriteResult =
  | {
      status: 'completed'
      result: SessionResult
      completion: ReturnType<typeof derivePracticeSetCompletion>
    }
  | { status: 'storage-blocked'; target: 'result' | 'progress' }

function sameCompletedSession(left: SessionResult, right: SessionResult): boolean {
  if (
    left.sessionId !== right.sessionId
    || left.conceptId !== right.conceptId
    || left.setId !== right.setId
    || left.mode !== right.mode
    || resolvePracticeGrade(left.grade) !== resolvePracticeGrade(right.grade)
    || resolvePracticeItemCount(left.itemCount, resolvePracticeGrade(left.grade))
      !== resolvePracticeItemCount(right.itemCount, resolvePracticeGrade(right.grade))
    || left.score !== right.score
    || left.total !== right.total
    || left.wrongCount !== right.wrongCount
    || left.results.length !== right.results.length
  ) {
    return false
  }
  return left.results.every((entry, index) => {
    const other = right.results[index]
    return entry.index === other.index
      && entry.correct === other.correct
      && entry.userAnswer === other.userAnswer
      && entry.correctAnswer === other.correctAnswer
      && entry.problem.templateId === other.problem.templateId
  })
}

export function derivePracticeSetCompletion(
  session: PracticeSession,
  results: SubmissionResult[],
  record: LearningSetCompletionRecord = createLearningSetCompletionRecord(),
  legacyCompleted = false,
) {
  const grade = resolvePracticeGrade(session.grade)
  const expectedItemCount = resolvePracticeItemCount(session.itemCount, grade)
  const sessionProblemByIndex = new Map(
    session.problems.map((problem) => [problem.index, problem] as const),
  )
  if (sessionProblemByIndex.size !== session.problems.length) {
    throw new Error('Practice completion problem indexes must be unique')
  }
  const resultByPosition = new Map<number, SubmissionResult>()
  for (const result of results) {
    if (resultByPosition.has(result.index)) {
      throw new Error('Practice completion result indexes must be unique')
    }
    const sessionProblem = session.problems[result.index]
    if (!sessionProblem || sessionProblem.templateId !== result.problem.templateId) {
      throw new Error('Practice completion results must match the active session')
    }
    resultByPosition.set(result.index, result)
  }

  const completion = recordLearningSetCompletion(record, {
    activityId: session.conceptId,
    mode: expectedItemCount === 5 ? 'basic' : 'practice',
    expectedItemCount,
    responses: session.problems.map((problem, index) => {
      const result = resultByPosition.get(index)
      const checked = typeof session.checkedAnswers[index] === 'boolean' && result !== undefined
      return {
        itemId: problem.templateId,
        checked,
        correct: checked ? result!.correct : null,
      }
    }),
  })

  return {
    ...completion,
    projection: projectLearningCompletion({
      activityId: session.conceptId,
      record: completion.record,
      legacyCompleted,
    }),
  }
}

export function persistCompletedPractice(
  session: PracticeSession,
  results: SubmissionResult[],
  completedAt = Date.now(),
): PracticeCompletionWriteResult {
  const completion = derivePracticeSetCompletion(session, results)
  if (session.mode === 'standard' && !completion.completed) {
    throw new Error('A complete set must be checked before practice completion is persisted')
  }

  const candidate = buildSessionResult(session, results, completedAt)
  const grade = resolvePracticeGrade(session.grade)
  const existingResult = loadResult(grade)
  const isRepeatedSession = existingResult?.sessionId === candidate.sessionId
  if (isRepeatedSession && !sameCompletedSession(existingResult, candidate)) {
    throw new Error('A completed practice session cannot be changed on re-entry')
  }
  const result = isRepeatedSession ? existingResult : candidate
  if (!isRepeatedSession && !saveResult(result)) {
    return { status: 'storage-blocked', target: 'result' }
  }

  const currentProgress = loadConceptProgress(result.conceptId, grade)
  if (isRepeatedSession && currentProgress?.lastCompletedAt === result.completedAt) {
    clearSession(grade)
    return { status: 'completed', result, completion }
  }

  const progressWrite = recordConceptProgress(result)
  if (!progressWrite.saved) return { status: 'storage-blocked', target: 'progress' }

  clearSession(grade)
  return { status: 'completed', result, completion }
}
