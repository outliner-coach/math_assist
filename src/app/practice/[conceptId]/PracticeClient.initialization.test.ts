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
  isCurriculumGradeReleased: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ conceptId: mocks.route.conceptId }),
  useRouter: () => ({ push: vi.fn() }),
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
    ProblemCard: ({ problem }: { problem: Problem }) => createReactElement('div', {
      'data-testid': 'problem-card',
      'data-template-id': problem.templateId,
    }),
  }
})

import PracticeClient from './PracticeClient'

function problem(templateId: string): Problem {
  return {
    index: 0,
    templateId,
    setId: 'A',
    params: {},
    prompt: templateId,
    type: 'number',
    correctAnswer: '1',
    solutionSteps: ['풀이'],
  }
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
    mocks.generateProblems.mockReset().mockImplementation(() => [
      problem(`generated-${mocks.generateProblems.mock.calls.length}`),
    ])
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

    const stored = JSON.parse(storageData.get('mathAssist_currentSession') ?? 'null')
    expect(stored.problems[0].templateId).toBe('generated-1')
    expect(container.querySelector('[data-testid="problem-card"]')?.getAttribute('data-template-id'))
      .toBe('generated-1')
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
    expect(storageData.get('mathAssist_grade6CurrentSession')).toContain('generated-1')
    expect(storageData.get('mathAssist_currentSession')).toBe('{"keep":"grade5"}')
  })
})
