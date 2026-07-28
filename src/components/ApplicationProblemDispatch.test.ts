import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  generateG2LengthRouteTotal,
} from '@/lib/application-problems/families/g2-length-route-total'
import {
  generateG5PerimeterBoundaryRebuildProblem,
} from '@/lib/application-problems/families/grade5-geometry-families'
import { generateG6RatioPartWhole } from '@/lib/application-problems/families/g6-ratio'
import { adaptGeneratedApplicationProblemToGrade2 } from '@/lib/application-problems/grade2-adapter'
import { adaptGeneratedApplicationProblemToPractice } from '@/lib/application-problems/template-adapter'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from '@/lib/application-problems/grade5-registry'
import type { ApplicationProblemRegistryV1 } from '@/lib/application-problems/registry'
import type { Grade2Mission } from '@/lib/grade2-problems'
import type { Problem, SubmissionResult } from '@/lib/types'

import ProblemCard from './ProblemCard'
import ResultCard from './ResultCard'
import Grade5ApplicationGeometryVisual from './Grade5ApplicationGeometryVisual'
import Grade6ApplicationRatioVisual from './Grade6ApplicationRatioVisual'
import Grade2MissionCard from './grade2/Grade2MissionCard'
import Grade2MissionVisual from './grade2/Grade2MissionVisual'

function numericParams(params: Readonly<Record<string, unknown>>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    ),
  )
}

function practiceProblem(
  generated:
    | ReturnType<typeof generateG5PerimeterBoundaryRebuildProblem>
    | ReturnType<typeof generateG6RatioPartWhole>,
  difficulty: 1 | 2 | 3,
): Problem {
  return adaptGeneratedApplicationProblemToPractice({
    problem: generated,
    placement: {
      index: 0,
      templateId: `application-${generated.familyId}-v1`,
      setId: 'A',
      difficulty,
    },
    mapParams: numericParams,
  })
}

function grade2Mission(): Grade2Mission {
  const generated = generateG2LengthRouteTotal({ seed: 0, variantIndex: 0 })
  return adaptGeneratedApplicationProblemToGrade2({
    shell: {
      id: 'g2-2-length-application-route-total-v1',
      unitId: 'g2-2-length',
      semester: '2-2',
      stageOrder: 145,
      unitMissionOrder: 13,
      skill: 'length',
      difficultyStep: 'applied',
      curriculumCode: '[2수03-13]',
      learnerGoal: 'm와 cm를 같은 단위로 바꾸어 이어진 길이를 구해요.',
      parentSummaryTag: 'length-route-application',
      prompt: '준비 중',
      answerType: 'length',
      answerConfig: { kind: 'length', unit: 'cm', inputLabel: '길이를 cm로 써요' },
      params: {},
      correctAnswer: '1cm',
      visualModel: 'length-bars',
      visualConfig: { leftLabel: '길이', leftCm: 1, rightLabel: '길이', rightCm: 1 },
      hintSteps: ['힌트 1', '힌트 2'],
      solutionSteps: ['풀이'],
      rewardId: 'measureTape',
    },
    problem: generated,
    mapAnswer: ({ answer }) => `${answer.normalized}cm`,
  })
}

function approvedGrade5Registry(): ApplicationProblemRegistryV1 {
  const approveFamily = <T extends ApplicationProblemRegistryV1['releaseLedger'][number]>(
    family: T,
  ): T => ({
    ...family,
    releaseStatus: 'approved' as const,
    approval: {
      ownerStatus: 'approved' as const,
      ownerId: 'application-dispatch-test-owner',
      approvedAt: '2026-07-23T00:00:00.000Z',
      evidenceRefs: ['src/components/ApplicationProblemDispatch.test.ts'],
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

describe('application problem render dispatch', () => {
  beforeEach(() => vi.stubGlobal('React', React))
  afterEach(() => vi.unstubAllGlobals())

  it('routes a Grade 5 saved application snapshot through the exact geometry renderer', () => {
    const generated = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const problem = practiceProblem(generated, 2)
    const markup = renderToStaticMarkup(React.createElement(ProblemCard, {
      problem,
      answer: null,
      onAnswer: () => undefined,
      applicationProblemRegistry: approvedGrade5Registry(),
    }))
    const exactMarkup = renderToStaticMarkup(React.createElement(
      Grade5ApplicationGeometryVisual,
      { problem: generated, applicationProblemRegistry: approvedGrade5Registry() },
    ))

    expect(markup).toContain('필수 그림을 확인하고 있어요')
    expect(markup).not.toContain('data-testid="choice-')
    expect(exactMarkup).toContain('grade5-application-geometry')
    expect(exactMarkup).toContain('<svg')
    expect(markup).not.toContain('필수 그림을 확인할 수 없어')
  })

  it('routes Grade 6 snapshots and reveals the saved visual in results', () => {
    const generated = generateG6RatioPartWhole({ seed: 0, variantIndex: 0 })
    const problem = practiceProblem(generated, 2)
    const result: SubmissionResult = {
      index: 0,
      correct: false,
      userAnswer: '1',
      correctAnswer: problem.correctAnswer,
      solutionSteps: problem.solutionSteps,
      problem,
    }
    const practiceMarkup = renderToStaticMarkup(React.createElement(ProblemCard, {
      problem,
      answer: null,
      onAnswer: () => undefined,
    }))
    const resultMarkup = renderToStaticMarkup(React.createElement(ResultCard, { result }))
    const exactMarkup = renderToStaticMarkup(React.createElement(
      Grade6ApplicationRatioVisual,
      { visual: generated.visual, showAnswer: true },
    ))

    expect(practiceMarkup).toContain('필수 그림을 확인하고 있어요')
    expect(resultMarkup).toContain('필수 그림을 확인하고 있어요')
    expect(exactMarkup).toContain('<svg')
    expect(exactMarkup).toContain(problem.correctAnswer)
    expect(resultMarkup).not.toContain(problem.correctAnswer)
  })

  it('dispatches Grade 2 application missions before the legacy visual switch', () => {
    const mission = grade2Mission()
    const hidden = renderToStaticMarkup(React.createElement(Grade2MissionVisual, {
      mission,
      showAnswer: false,
    }))
    const revealed = renderToStaticMarkup(React.createElement(Grade2MissionVisual, {
      mission,
      showAnswer: true,
    }))

    expect(hidden).toContain('<svg')
    expect(hidden).not.toContain(mission.correctAnswer)
    expect(revealed).toContain(mission.correctAnswer)
  })

  it('fails closed for malformed saved application visuals instead of using a legacy fallback', () => {
    const mission = grade2Mission() as Grade2Mission & {
      applicationVisual: { mathModel?: unknown }
    }
    const malformedMission = {
      ...mission,
      applicationVisual: { ...mission.applicationVisual, mathModel: { broken: true } },
    } as Grade2Mission
    const incompleteMission = { ...mission } as Grade2Mission & { applicationVisual?: unknown }
    delete incompleteMission.applicationVisual
    const practice = practiceProblem(
      generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 }),
      2,
    ) as Problem & { applicationVisual?: unknown }
    delete practice.applicationVisual

    const grade2Markup = renderToStaticMarkup(React.createElement(Grade2MissionVisual, {
      mission: malformedMission,
    }))
    const incompleteGrade2Markup = renderToStaticMarkup(React.createElement(Grade2MissionVisual, {
      mission: incompleteMission,
    }))
    const practiceMarkup = renderToStaticMarkup(React.createElement(ProblemCard, {
      problem: practice,
      answer: null,
      onAnswer: () => undefined,
    }))
    const missionCardMarkup = renderToStaticMarkup(React.createElement(Grade2MissionCard, {
      mission: incompleteMission,
      selectedAnswer: null,
      textAnswer: '',
      lengthAnswer: { meters: '', centimeters: '' },
      timeAnswer: { hours: '', minutes: '' },
      showHint: false,
      wrongAttemptCount: 0,
      inputError: null,
      solved: false,
      missionCount: 15,
      onChoiceAnswer: () => undefined,
      onTextAnswerChange: () => undefined,
      onLengthAnswerChange: () => undefined,
      onTimeAnswerChange: () => undefined,
      onSubmitText: () => undefined,
      onSubmitLength: () => undefined,
      onSubmitTime: () => undefined,
      onShowHint: () => undefined,
    }))

    expect(grade2Markup).toContain('role="alert"')
    expect(grade2Markup).not.toContain(mission.prompt)
    expect(incompleteGrade2Markup).toContain('role="alert"')
    expect(incompleteGrade2Markup).not.toContain('grade2-visual-length-bars')
    expect(practiceMarkup).toContain('role="alert"')
    expect(practiceMarkup).not.toContain('grade5-application-geometry')
    expect(practiceMarkup).not.toContain('data-testid="keypad-display"')
    expect(practiceMarkup).not.toContain('data-testid="choice-')
    expect(missionCardMarkup).toContain('role="alert"')
    expect(missionCardMarkup).not.toContain('data-testid="grade2-length-centimeters"')
    expect(missionCardMarkup).not.toContain('data-testid="grade2-show-hint"')
  })
})
