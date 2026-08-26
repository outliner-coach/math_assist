import { readFileSync } from 'node:fs'
import path from 'node:path'

import { buildApprovedGrade5PracticeProblemCandidates } from '../src/lib/application-problems/grade5-practice-runtime'
import { buildApprovedGrade6PracticeProblemCandidates } from '../src/lib/application-problems/grade6-practice-runtime'
import { generateProblems } from '../src/lib/problem-generator'
import type { PracticeGrade, PracticeSession, ProblemTemplate } from '../src/lib/types'

const TEMPLATE_PATHS = {
  'area-001': path.join(process.cwd(), 'public/data/templates/area.json'),
  'g6ratio-001': path.join(process.cwd(), 'public/data/templates/g6ratio.json'),
} as const

type DeterministicConceptId = keyof typeof TEMPLATE_PATHS

export function buildDeterministicPracticeSession(input: {
  grade: PracticeGrade
  conceptId: DeterministicConceptId
  setId: 'A' | 'B' | 'C'
  seed: number
}): PracticeSession {
  const templates = JSON.parse(
    readFileSync(TEMPLATE_PATHS[input.conceptId], 'utf8'),
  ) as ProblemTemplate[]
  const additionalCandidates = input.grade === 5
    ? buildApprovedGrade5PracticeProblemCandidates({ conceptId: input.conceptId })
    : buildApprovedGrade6PracticeProblemCandidates({ conceptId: input.conceptId })
  const problems = generateProblems(templates, {
    count: 10,
    setId: input.setId,
    difficultyMix: { 1: 4, 2: 4, 3: 2 },
    seed: input.seed,
    additionalCandidates,
  })
  const startedAt = Date.now()

  return {
    sessionId: `e2e-${input.grade}-${input.conceptId}-${input.setId}-${input.seed}`,
    conceptId: input.conceptId,
    setId: input.setId,
    mode: 'standard',
    grade: input.grade,
    itemCount: 10,
    problems,
    answers: Array(problems.length).fill(null),
    checkedAnswers: Array(problems.length).fill(null),
    currentIndex: 0,
    startedAt,
    expiresAt: startedAt + 2 * 60 * 60 * 1000,
  }
}
