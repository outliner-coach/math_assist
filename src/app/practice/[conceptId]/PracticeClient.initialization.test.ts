// @vitest-environment jsdom

import * as React from 'react'
import { StrictMode, act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Problem } from '@/lib/types'

const mocks = vi.hoisted(() => ({
  route: { conceptId: 'area-001', search: 'set=A' },
  getConceptById: vi.fn(),
  getTemplatesByConceptId: vi.fn(),
  generateProblems: vi.fn(),
  buildApprovedPracticeProblemCandidates: vi.fn(),
  canGradePracticeProblem: vi.fn(),
  isCurriculumGradeReleased: vi.fn(),
  routerPush: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ conceptId: mocks.route.conceptId }),
  useRouter: () => ({ push: mocks.routerPush }),
  useSearchParams: () => new URLSearchParams(mocks.route.search),
}))

vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => createElement('a', null, children) }))

vi.mock('@/lib/data', () => ({
  getConceptById: mocks.getConceptById,
  getTemplatesByConceptId: mocks.getTemplatesByConceptId,
}))

vi.mock('@/lib/problem-generator', () => ({
  generateProblems: mocks.generateProblems,
}))

vi.mock('@/lib/application-problems/grade5-practice-runtime', () => ({
  buildApprovedGrade5PracticeProblemCandidates: mocks.buildApprovedPracticeProblemCandidates,
}))

vi.mock('@/lib/application-problems/grade6-practice-runtime', () => ({
  buildApprovedGrade6PracticeProblemCandidates: mocks.buildApprovedPracticeProblemCandidates,
}))

vi.mock('@/lib/application-problems/practice-interaction-gate', () => ({
  canGradePracticeProblem: mocks.canGradePracticeProblem,
}))

vi.mock('@/lib/grade-release', () => ({
  isCurriculumGradeReleased: mocks.isCurriculumGradeReleased,
}))

vi.mock('@/components', async () => {
  const { createElement: createReactElement } = await import('react')
  return {
    AnswerFeedback: () => null,
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => createReactElement('button', props, children),
    GradeReleaseBlocked: () => null,
    MathText: () => null,
    ProgressIndicator: () => null,
    ScratchPad: () => null,
    ProblemCard: ({ problem, onAnswer }: { problem: Problem; onAnswer: (answer: string) => void }) =>
      createReactElement('div', {
        'data-testid': 'problem-card',
        'data-template-id': problem.templateId,
      }, createReactElement('button', {
        'data-testid': 'mock-answer',
        onClick: () => onAnswer('1'),
      }, '답하기')),
  }
})

import PracticeClient from './PracticeClient'

function problem(templateId: string, index = 0): Problem {
  return {
    index,
    templateId,
    setId: 'A',
    params: {},
    prompt: templateId,
    type: 'number',
    correctAnswer: '1',
    solutionSteps: ['풀이'],
  }
}

function applicationProblem(version: number, seed: number): Problem {
  return {
    ...problem(`application-g6-ratio-part-whole-v${version}`),
    placementDifficulty: 2,
    applicationSource: {
      schemaVersion: 'generated-application-problem-v1',
      instanceId: `g6-ratio-part-whole@${version}:${seed}:0`,
      familyId: 'g6-ratio-part-whole',
      generatorVersion: version,
      packId: 'pack-unit-6-1-ratio',
      packVersion: 1,
      seed,
      variantIndex: 0,
      curriculumCodes: ['[6수02-02]', '[6수02-03]'],
    },
  } as Problem
}

function standardProblemsWithApplication(
  application: Problem,
  itemCount = 5,
): Problem[] {
  return [
    application,
    ...Array.from(
      { length: itemCount - 1 },
      (_, index) => problem(`standard-${index + 2}`, index + 1),
    ),
  ]
}

describe('PracticeClient initialization', () => {
  let container: HTMLDivElement
  let root: Root | null = null
  let storageData: Map<string, string>

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal('React', React)
    storageData = new Map()
    mocks.route.conceptId = 'area-001'
    mocks.route.search = 'set=A'
    const storage = {
      getItem: (key: string) => storageData.get(key) ?? null,
      setItem: (key: string, value: string) => storageData.set(key, value),
      removeItem: (key: string) => storageData.delete(key),
    }
    vi.stubGlobal('localStorage', storage)
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
    mocks.getConceptById.mockReset().mockResolvedValue({
      id: 'area-001',
      concept_title: '다각형의 둘레와 넓이 응용',
    })
    mocks.getTemplatesByConceptId.mockReset().mockResolvedValue([{}])
    mocks.isCurriculumGradeReleased.mockReset().mockResolvedValue(true)
    mocks.generateProblems.mockReset().mockImplementation((
      _templates: unknown,
      options: { count: number },
    ) => Array.from(
      { length: options.count },
      (_, index) => problem(
        `generated-${mocks.generateProblems.mock.calls.length}-${index + 1}`,
        index,
      ),
    ))
    mocks.buildApprovedPracticeProblemCandidates.mockReset().mockReturnValue([])
    mocks.canGradePracticeProblem.mockReset().mockResolvedValue(true)
    mocks.routerPush.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) await act(async () => root?.unmount())
    root = null
    container.remove()
    vi.unstubAllGlobals()
  })

  it('commits only the active async run when Strict Mode remounts the effect', async () => {
    await act(async () => {
      root?.render(createElement(StrictMode, null, createElement(PracticeClient)))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mocks.getConceptById).toHaveBeenCalledTimes(2)
    expect(mocks.getTemplatesByConceptId).toHaveBeenCalledTimes(1)
    expect(mocks.generateProblems).toHaveBeenCalledTimes(1)
    expect(mocks.generateProblems).toHaveBeenCalledWith([{}], expect.objectContaining({
      count: 10,
      difficultyMix: { 1: 4, 2: 4, 3: 2 },
      additionalCandidates: [],
    }))
    expect(mocks.buildApprovedPracticeProblemCandidates).toHaveBeenCalledWith({
      conceptId: 'area-001',
    })

    const stored = JSON.parse(storageData.get('mathAssist_currentSession') ?? 'null')
    expect(stored.problems[0].templateId).toBe('generated-1-1')
    expect(container.querySelector('[data-testid="problem-card"]')?.getAttribute('data-template-id'))
      .toBe('generated-1-1')
  })

  it('preserves corrupt Grade 6 session bytes until the learner explicitly resets only that key', async () => {
    mocks.route.conceptId = 'g6ratio-001'
    mocks.route.search = 'set=A&count=5'
    mocks.getConceptById.mockResolvedValue({ id: 'g6ratio-001', concept_title: '비와 비율' })
    storageData.set('mathAssist_grade6CurrentSession', '{corrupt-grade6-session')
    storageData.set('mathAssist_currentSession', '{"keep":"grade5"}')

    await act(async () => {
      root?.render(createElement(PracticeClient))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="grade6-session-recovery"]')).not.toBeNull()
    expect(storageData.get('mathAssist_grade6CurrentSession')).toBe('{corrupt-grade6-session')
    expect(storageData.get('mathAssist_currentSession')).toBe('{"keep":"grade5"}')
    expect(mocks.generateProblems).not.toHaveBeenCalled()

    const reset = container.querySelector('[data-testid="reset-grade6-session"]') as HTMLButtonElement
    await act(async () => {
      reset.click()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="grade6-session-recovery"]')).toBeNull()
    expect(container.querySelector('[data-testid="problem-card"]')).not.toBeNull()
    expect(mocks.generateProblems).toHaveBeenCalledWith([{}], expect.objectContaining({
      count: 5,
      difficultyMix: { 1: 2, 2: 2, 3: 1 },
      additionalCandidates: [],
    }))
    expect(mocks.buildApprovedPracticeProblemCandidates).toHaveBeenCalledWith({
      conceptId: 'g6ratio-001',
    })
    expect(storageData.get('mathAssist_grade6CurrentSession')).toContain('generated-1-1')
    expect(storageData.get('mathAssist_currentSession')).toBe('{"keep":"grade5"}')
  })

  it('does not create or partially save a session when generation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.generateProblems.mockImplementation(() => {
      throw new Error('all deterministic application seeds failed')
    })

    await act(async () => {
      root?.render(createElement(PracticeClient))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(storageData.has('mathAssist_currentSession')).toBe(false)
    expect(storageData.has('mathAssist_grade6CurrentSession')).toBe(false)
    expect(container.querySelector('[data-testid="problem-card"]')).toBeNull()
  })

  it('hides a blocked saved application session and explicitly replaces it with archived evidence', async () => {
    mocks.route.conceptId = 'g6ratio-001'
    mocks.route.search = 'set=A&count=5'
    mocks.getConceptById.mockResolvedValue({ id: 'g6ratio-001', concept_title: '비와 비율' })
    const original = applicationProblem(1, 42)
    const replacement = applicationProblem(2, 999)
    const storedSession = {
      sessionId: 'grade6-blocked-application-session',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: standardProblemsWithApplication(original),
      answers: ['0', null, null, null, null],
      checkedAnswers: [false, null, null, null, null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    const raw = JSON.stringify(storedSession)
    storageData.set('mathAssist_grade6CurrentSession', raw)
    mocks.canGradePracticeProblem.mockImplementation(async (candidate: Problem) => (
      candidate.applicationSource?.generatorVersion !== 1
    ))
    mocks.buildApprovedPracticeProblemCandidates.mockReturnValue([{
      id: 'g6-ratio-part-whole@2',
      difficulty: 2,
      generate: ({ index, setId }: { index: number; setId: 'A' | 'B' | 'C' }) => ({
        ...replacement,
        index,
        setId,
      }),
    }])

    await act(async () => {
      root?.render(createElement(PracticeClient))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="blocked-application-session-recovery"]'))
      .not.toBeNull()
    expect(container.querySelector('[data-testid="problem-card"]')).toBeNull()
    expect(container.textContent).not.toContain(original.prompt)
    expect(storageData.get('mathAssist_grade6CurrentSession')).toBe(raw)

    await act(async () => {
      ;(container.querySelector('[data-testid="replace-blocked-application-session"]') as HTMLButtonElement)
        .click()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="blocked-application-session-recovery"]'))
      .toBeNull()
    expect(container.querySelector('[data-testid="problem-card"]')?.getAttribute('data-template-id'))
      .toBe(replacement.templateId)
    const recovered = JSON.parse(storageData.get('mathAssist_grade6CurrentSession') ?? 'null')
    expect(recovered.problems[0].applicationSource.generatorVersion).toBe(2)
    expect(recovered.answers).toEqual(Array(5).fill(null))
    expect(recovered.checkedAnswers).toEqual(Array(5).fill(null))
    expect(recovered.applicationProblemReplacementArchive).toEqual([{
      problemIndex: 0,
      originalInstanceId: original.applicationSource?.instanceId,
      replacementInstanceId: replacement.applicationSource?.instanceId,
      originalProblem: original,
    }])
  })

  it('preflights and preserves an expired blocked application session even when the route does not match', async () => {
    mocks.route.conceptId = 'g6other-001'
    mocks.route.search = 'set=B&count=5'
    mocks.getConceptById.mockResolvedValue({ id: 'g6other-001', concept_title: '다른 6학년 개념' })
    const original = applicationProblem(1, 42)
    const storedSession = {
      sessionId: 'grade6-expired-unmatched-blocked-session',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: standardProblemsWithApplication(original),
      answers: ['0', null, null, null, null],
      checkedAnswers: [false, null, null, null, null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() - 1,
    }
    const raw = JSON.stringify(storedSession)
    storageData.set('mathAssist_grade6CurrentSession', raw)
    mocks.canGradePracticeProblem.mockResolvedValue(false)

    await act(async () => {
      root?.render(createElement(PracticeClient))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="blocked-application-session-recovery"]'))
      .not.toBeNull()
    expect(container.querySelector('[data-testid="problem-card"]')).toBeNull()
    expect(storageData.get('mathAssist_grade6CurrentSession')).toBe(raw)
    expect(mocks.generateProblems).not.toHaveBeenCalled()
  })

  it('returns an explicitly recovered unmatched session to its own practice route', async () => {
    mocks.route.conceptId = 'g6other-001'
    mocks.route.search = 'set=B&count=10'
    mocks.getConceptById.mockResolvedValue({ id: 'g6other-001', concept_title: '다른 6학년 개념' })
    const original = applicationProblem(1, 42)
    const replacement = applicationProblem(2, 999)
    const storedSession = {
      sessionId: 'grade6-unmatched-blocked-session',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: standardProblemsWithApplication(original),
      answers: ['0', null, null, null, null],
      checkedAnswers: [false, null, null, null, null],
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() + 10_000,
    }
    storageData.set('mathAssist_grade6CurrentSession', JSON.stringify(storedSession))
    mocks.canGradePracticeProblem.mockImplementation(async (candidate: Problem) => (
      candidate.applicationSource?.generatorVersion !== 1
    ))
    mocks.buildApprovedPracticeProblemCandidates.mockReturnValue([{
      id: 'g6-ratio-part-whole@2',
      difficulty: 2,
      generate: ({ index, setId }: { index: number; setId: 'A' | 'B' | 'C' }) => ({
        ...replacement,
        index,
        setId,
      }),
    }])

    await act(async () => {
      root?.render(createElement(PracticeClient))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    await act(async () => {
      ;(container.querySelector('[data-testid="replace-blocked-application-session"]') as HTMLButtonElement)
        .click()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mocks.routerPush).toHaveBeenCalledWith(
      '/practice/g6ratio-001?set=A&count=5',
    )
    expect(container.querySelector('[data-testid="problem-card"]')).toBeNull()
    const recovered = JSON.parse(storageData.get('mathAssist_grade6CurrentSession') ?? 'null')
    expect(recovered.conceptId).toBe('g6ratio-001')
    expect(recovered.problems[0].applicationSource.generatorVersion).toBe(2)
  })

  it('expires an eligible application session only after semantic preflight', async () => {
    mocks.route.conceptId = 'g6ratio-001'
    mocks.route.search = 'set=A&count=5'
    mocks.getConceptById.mockResolvedValue({ id: 'g6ratio-001', concept_title: '비와 비율' })
    const storedSession = {
      sessionId: 'grade6-expired-eligible-session',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      problems: standardProblemsWithApplication(applicationProblem(1, 42)),
      answers: Array(5).fill(null),
      checkedAnswers: Array(5).fill(null),
      currentIndex: 0,
      startedAt: 100,
      expiresAt: Date.now() - 1,
    }
    storageData.set('mathAssist_grade6CurrentSession', JSON.stringify(storedSession))
    mocks.canGradePracticeProblem.mockResolvedValue(true)

    await act(async () => {
      root?.render(createElement(PracticeClient))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mocks.canGradePracticeProblem).toHaveBeenCalledWith(storedSession.problems[0], 6)
    expect(mocks.generateProblems).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-testid="problem-card"]')?.getAttribute('data-template-id'))
      .toBe('generated-1-1')
  })

  it('persists a blocked direct-retry snapshot before offering its explicit replacement', async () => {
    mocks.route.conceptId = 'g6ratio-001'
    mocks.route.search = 'set=A&count=5&mode=retry-wrong&source=source-result'
    mocks.getConceptById.mockResolvedValue({ id: 'g6ratio-001', concept_title: '비와 비율' })
    const original = applicationProblem(1, 42)
    const replacement = applicationProblem(2, 999)
    const originalStandardProblems = standardProblemsWithApplication(original)
    storageData.set('mathAssist_grade6LastResult', JSON.stringify({
      sessionId: 'source-result',
      conceptId: 'g6ratio-001',
      setId: 'A',
      mode: 'standard',
      grade: 6,
      itemCount: 5,
      score: 4,
      total: 5,
      wrongCount: 1,
      completedAt: 100,
      results: originalStandardProblems.map((entry, index) => ({
        index: entry.index,
        correct: index !== 0,
        userAnswer: index === 0 ? '0' : entry.correctAnswer,
        correctAnswer: entry.correctAnswer,
        solutionSteps: entry.solutionSteps,
        problem: entry,
      })),
    }))
    mocks.canGradePracticeProblem.mockImplementation(async (candidate: Problem) => (
      candidate.applicationSource?.generatorVersion !== 1
    ))
    mocks.buildApprovedPracticeProblemCandidates.mockReturnValue([{
      id: 'g6-ratio-part-whole@2',
      difficulty: 2,
      generate: ({ index, setId }: { index: number; setId: 'A' | 'B' | 'C' }) => ({
        ...replacement,
        index,
        setId,
      }),
    }])

    await act(async () => {
      root?.render(createElement(PracticeClient))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(container.querySelector('[data-testid="blocked-application-session-recovery"]'))
      .not.toBeNull()
    const blocked = JSON.parse(storageData.get('mathAssist_grade6CurrentSession') ?? 'null')
    expect(blocked.mode).toBe('retry-wrong')
    expect(blocked.problems).toEqual([original])
    expect(blocked.answers).toEqual([null])
    expect(blocked.checkedAnswers).toEqual([null])

    await act(async () => {
      ;(container.querySelector('[data-testid="replace-blocked-application-session"]') as HTMLButtonElement)
        .click()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const recovered = JSON.parse(storageData.get('mathAssist_grade6CurrentSession') ?? 'null')
    expect(recovered.problems[0].applicationSource.generatorVersion).toBe(2)
    expect(recovered.applicationProblemReplacementArchive[0].originalProblem).toEqual(original)
  })

  it('does not grade or mutate a saved answer when a required visual is blocked', async () => {
    let eligibilityCalls = 0
    mocks.canGradePracticeProblem.mockImplementation(async () => {
      eligibilityCalls += 1
      return eligibilityCalls <= 10
    })

    await act(async () => {
      root?.render(createElement(PracticeClient))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    const answer = container.querySelector('[data-testid="mock-answer"]') as HTMLButtonElement
    await act(async () => answer.click())
    const check = container.querySelector('[data-testid="check-answer-button"]') as HTMLButtonElement
    await act(async () => {
      check.click()
      await Promise.resolve()
    })

    const stored = JSON.parse(storageData.get('mathAssist_currentSession') ?? 'null')
    expect(stored.answers[0]).toBe('1')
    expect(stored.checkedAnswers[0]).toBeNull()
    expect(container.querySelector('[data-testid="number-input-error"]')?.textContent)
      .toContain('채점하지 않았어요')
  })
})
