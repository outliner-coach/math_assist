import { recordConceptProgress } from './progress'
import {
  buildSessionResult,
  clearSession,
  persistApplicationProblemRecoveryEvidence,
  resolvePracticeGrade,
  saveResult,
} from './session'
import type { PracticeSession, SessionResult, SubmissionResult } from './types'

export type PracticeCompletionWriteResult =
  | { status: 'completed'; result: SessionResult }
  | { status: 'storage-blocked'; target: 'recovery-evidence' | 'result' | 'progress' }

export function persistCompletedPractice(
  session: PracticeSession,
  results: SubmissionResult[],
  completedAt = Date.now(),
): PracticeCompletionWriteResult {
  if (!persistApplicationProblemRecoveryEvidence(session)) {
    return { status: 'storage-blocked', target: 'recovery-evidence' }
  }
  const result = buildSessionResult(session, results, completedAt)
  if (!saveResult(result)) return { status: 'storage-blocked', target: 'result' }

  const progressWrite = recordConceptProgress(result)
  if (!progressWrite.saved) return { status: 'storage-blocked', target: 'progress' }

  clearSession(resolvePracticeGrade(session.grade))
  return { status: 'completed', result }
}
