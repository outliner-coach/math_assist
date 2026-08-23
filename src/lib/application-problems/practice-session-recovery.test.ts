import { describe, expect, it } from 'vitest'

import type { AdditionalProblemCandidate } from '../problem-generator'
import type { PracticeSession, Problem } from '../types'
import { replaceBlockedApplicationProblemsInSession } from './practice-session-recovery'

function applicationProblem(version: number, instanceSuffix: string): Problem {
  return {
    index: 0,
    templateId: `application-g6-ratio-part-whole-v${version}`,
    setId: 'A',
    placementDifficulty: 2,
    params: { total: 12 },
    prompt: `비율 응용 ${instanceSuffix}`,
    type: 'choice',
    choices: ['1/3', '3'],
    correctAnswer: '1/3',
    correctChoiceIndex: 0,
    solutionSteps: ['풀이'],
    hintSteps: ['힌트'],
    applicationSource: {
      schemaVersion: 'generated-application-problem-v1',
      instanceId: `g6-ratio-part-whole@${version}:${instanceSuffix}:0`,
      familyId: 'g6-ratio-part-whole',
      generatorVersion: version,
      packId: 'pack-unit-6-1-ratio',
      packVersion: 1,
      seed: Number(instanceSuffix),
      variantIndex: 0,
      curriculumCodes: ['[6수02-02]', '[6수02-03]'],
    },
  } as Problem
}

function legacyProblem(): Problem {
  return {
    index: 1,
    templateId: 'legacy-ratio',
    setId: 'A',
    params: {},
    prompt: '1:2는?',
    type: 'number',
    correctAnswer: '0.5',
    solutionSteps: ['풀이'],
  }
}

function session(problem: Problem): PracticeSession {
  return {
    sessionId: 'grade6-session-recovery',
    conceptId: 'g6ratio-001',
    setId: 'A',
    mode: 'standard',
    grade: 6,
    itemCount: 5,
    problems: [problem, legacyProblem()],
    answers: ['0', '0.5'],
    checkedAnswers: [false, true],
    currentIndex: 0,
    startedAt: 100,
    expiresAt: 10_000,
  }
}

function replacementCandidate(replacement: Problem): AdditionalProblemCandidate {
  return {
    id: 'g6-ratio-part-whole@2',
    difficulty: 2,
    generate: ({ index, setId }) => ({ ...replacement, index, setId }),
  }
}

const onlyVersion2IsEligible = async (problem: Problem) => (
  !problem.applicationSource || problem.applicationSource.generatorVersion === 2
)

describe('practice application session recovery', () => {
  it('replaces only blocked instances and archives their immutable original snapshots', async () => {
    const original = applicationProblem(1, '42')
    const replacement = applicationProblem(2, '999')
    const input = session(original)

    const recovered = await replaceBlockedApplicationProblemsInSession({
      session: input,
      grade: 6,
      candidates: [replacementCandidate(replacement)],
      isInteractionEligible: onlyVersion2IsEligible,
    })

    expect(recovered).not.toBeNull()
    expect(input.problems[0]).toEqual(original)
    expect(recovered?.problems[0].applicationSource?.generatorVersion).toBe(2)
    expect(recovered?.problems[1]).toEqual(input.problems[1])
    expect(recovered?.answers).toEqual([null, '0.5'])
    expect(recovered?.checkedAnswers).toEqual([null, true])
    expect(recovered?.applicationProblemReplacementArchive).toEqual([{
      problemIndex: 0,
      originalInstanceId: original.applicationSource?.instanceId,
      replacementInstanceId: replacement.applicationSource?.instanceId,
      originalProblem: original,
    }])
  })

  it('fails without changing the session when no approved newer family version exists', async () => {
    const original = applicationProblem(1, '42')
    const input = session(original)

    expect(await replaceBlockedApplicationProblemsInSession({
      session: input,
      grade: 6,
      candidates: [],
      isInteractionEligible: onlyVersion2IsEligible,
    })).toBeNull()
    expect(input.problems[0]).toEqual(original)
  })

  it('rejects a same-version or still-blocked replacement', async () => {
    const original = applicationProblem(1, '42')
    const sameVersionCandidate = {
      ...replacementCandidate(applicationProblem(1, '999')),
      id: 'g6-ratio-part-whole@1',
    }
    const blockedReplacement = replacementCandidate(applicationProblem(2, '999'))

    expect(await replaceBlockedApplicationProblemsInSession({
      session: session(original),
      grade: 6,
      candidates: [sameVersionCandidate],
      isInteractionEligible: onlyVersion2IsEligible,
    })).toBeNull()
    expect(await replaceBlockedApplicationProblemsInSession({
      session: session(original),
      grade: 6,
      candidates: [blockedReplacement],
      isInteractionEligible: async () => false,
    })).toBeNull()
  })
})
