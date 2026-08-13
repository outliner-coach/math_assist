// @vitest-environment jsdom

import * as React from 'react'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateG5PerimeterBoundaryRebuildProblem } from '@/lib/application-problems/families/grade5-geometry-families'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from '@/lib/application-problems/grade5-registry'
import {
  createImmutableReleaseFamilySnapshot,
  type ApplicationProblemRegistryV1,
} from '@/lib/application-problems/registry'
import { adaptGeneratedApplicationProblemToPractice } from '@/lib/application-problems/template-adapter'
import type { Problem, SubmissionResult } from '@/lib/types'

import ProblemCard from './ProblemCard'
import ResultCard from './ResultCard'

function problem(): Problem {
  const generated = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
  return adaptGeneratedApplicationProblemToPractice({
    problem: generated,
    placement: {
      index: 0,
      templateId: 'application-g5-perimeter-boundary-rebuild-v1',
      setId: 'A',
      difficulty: 2,
    },
    mapParams: (params) => Object.fromEntries(
      Object.entries(params).filter(
        (entry): entry is [string, number] => typeof entry[1] === 'number',
      ),
    ),
  })
}

function approvedRegistry(): ApplicationProblemRegistryV1 {
  const approveFamily = <T extends ApplicationProblemRegistryV1['releaseLedger'][number]>(
    family: T,
  ): T => ({
    ...family,
    releaseStatus: 'approved' as const,
    approval: {
      ownerStatus: 'approved' as const,
      ownerId: 'application-dispatch-test-owner',
      approvedAt: '2026-07-23T00:00:00.000Z',
      evidenceRefs: ['src/components/ApplicationProblemDispatch.client.test.ts'],
      expertStatus: 'not-reviewed' as const,
    },
  })
  return {
    entries: GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => ({
      ...entry,
      family: approveFamily(entry.family),
    })),
    releaseLedger: GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.map(approveFamily),
  }
}

function draftRegistry(): ApplicationProblemRegistryV1 {
  const draftFamily = <T extends ApplicationProblemRegistryV1['releaseLedger'][number]>(
    family: T,
  ): T => ({
    ...family,
    releaseStatus: 'draft' as const,
    approval: {
      ownerStatus: 'pending' as const,
      evidenceRefs: [],
      expertStatus: 'not-reviewed' as const,
    },
  })
  const entries = GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => ({
    ...entry,
    family: draftFamily(entry.family),
  }))
  return {
    entries,
    releaseLedger: entries.map((entry) => createImmutableReleaseFamilySnapshot(entry.family)),
  }
}

function result(problem: Problem): SubmissionResult {
  return {
    index: problem.index,
    correct: false,
    userAnswer: '1',
    correctAnswer: problem.correctAnswer,
    solutionSteps: problem.solutionSteps,
    problem,
  }
}

describe('application problem client dispatch', () => {
  let container: HTMLDivElement
  let root: Root | null

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.stubGlobal('React', React)
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

  it('hides an unreleased application prompt and its answer controls', async () => {
    const draftProblem = problem()
    await act(async () => {
      root?.render(createElement(ProblemCard, {
        problem: draftProblem,
        answer: null,
        onAnswer: () => undefined,
        applicationProblemRegistry: draftRegistry(),
      }))
      await import('./Grade5ApplicationGeometryVisual')
      await Promise.resolve()
    })

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.textContent).not.toContain(draftProblem.prompt)
    expect(container.querySelector('[data-testid="choice-0"]')).toBeNull()
  })

  it('opens answer controls with the approved production default after visual validation', async () => {
    await act(async () => {
      root?.render(createElement(ProblemCard, {
        problem: problem(),
        answer: null,
        onAnswer: () => undefined,
      }))
      await import('./Grade5ApplicationGeometryVisual')
      await Promise.resolve()
    })

    expect(container.querySelector('.grade5-application-geometry svg')).not.toBeNull()
    expect(container.querySelector('[data-testid="choice-0"]')).not.toBeNull()
  })

  it('keeps answer controls absent when the saved required visual is incomplete', async () => {
    const incomplete = problem() as Problem & { applicationVisual?: unknown }
    delete incomplete.applicationVisual

    await act(async () => {
      root?.render(createElement(ProblemCard, {
        problem: incomplete,
        answer: null,
        onAnswer: () => undefined,
      }))
      await Promise.resolve()
    })

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="choice-0"]')).toBeNull()
    expect(container.querySelector('[data-testid="keypad-display"]')).toBeNull()
  })

  it('hides source-stripped application content instead of using the legacy renderer', async () => {
    const stripped = problem() as Problem & { applicationSource?: unknown }
    delete stripped.applicationSource

    await act(async () => {
      root?.render(createElement(ProblemCard, {
        problem: stripped,
        answer: null,
        onAnswer: () => undefined,
        applicationProblemRegistry: approvedRegistry(),
      }))
      await Promise.resolve()
    })

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.textContent).not.toContain(stripped.prompt)
    expect(container.querySelector('[data-testid="choice-0"]')).toBeNull()
    expect(container.querySelector('[data-testid="keypad-display"]')).toBeNull()
  })

  it('hides an unreleased result prompt, answer, and solution behind the same gate', async () => {
    const draftProblem = problem()
    await act(async () => {
      root?.render(createElement(ResultCard, {
        result: result(draftProblem),
        applicationProblemRegistry: draftRegistry(),
      }))
      await import('./Grade5ApplicationGeometryVisual')
      await Promise.resolve()
    })

    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.textContent).not.toContain(draftProblem.prompt)
    expect(container.textContent).not.toContain(draftProblem.correctAnswer)
    expect(container.textContent).not.toContain(draftProblem.solutionSteps[0])
  })

  it('reveals approved result content only after the required visual validates', async () => {
    const approvedProblem = problem()
    await act(async () => {
      root?.render(createElement(ResultCard, {
        result: result(approvedProblem),
        applicationProblemRegistry: approvedRegistry(),
      }))
      await import('./Grade5ApplicationGeometryVisual')
      await Promise.resolve()
    })

    expect(container.querySelector('.grade5-application-geometry svg')).not.toBeNull()
    expect(container.textContent).toContain(approvedProblem.prompt)
    expect(container.textContent).toContain(approvedProblem.correctAnswer)
    expect(container.textContent).toContain(approvedProblem.solutionSteps[0])
  })
})
