import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  parseGeneratedApplicationProblemV1,
  type GeneratedApplicationProblemV1,
  type JsonValue,
} from '../lib/application-problems/contracts'
import {
  generateG5AreaCompositeInverseProblem,
  generateG5AreaOverlapReconstructionProblem,
  generateG5PerimeterBoundaryRebuildProblem,
} from '../lib/application-problems/families/grade5-geometry-families'
import { GRADE5_APPLICATION_PROBLEM_REGISTRY_V1 } from '../lib/application-problems/grade5-registry'
import type { ApplicationProblemRegistryV1 } from '../lib/application-problems/registry'
import { parseApplicationVisualSceneV1 } from '../lib/application-problems/visual-model'
import Grade5ApplicationGeometryVisual from './Grade5ApplicationGeometryVisual'

function approvedRegistry(familyId: string): ApplicationProblemRegistryV1 {
  const approveFamily = <T extends ApplicationProblemRegistryV1['releaseLedger'][number]>(
    family: T,
  ): T => family.familyId === familyId
    ? {
        ...family,
        releaseStatus: 'approved' as const,
        approval: {
          ownerStatus: 'approved' as const,
          ownerId: 'grade5-visual-test-owner',
          approvedAt: '2026-07-23T00:00:00.000Z',
          evidenceRefs: ['src/components/Grade5ApplicationGeometryVisual.test.ts'],
          expertStatus: 'not-reviewed' as const,
        },
      }
    : family
  return {
    entries: GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.entries.map((entry) => ({
      ...entry,
      family: approveFamily(entry.family),
    })),
    releaseLedger: GRADE5_APPLICATION_PROBLEM_REGISTRY_V1.releaseLedger.map(approveFamily),
  }
}

function renderPair(
  problem: ReturnType<typeof generateG5PerimeterBoundaryRebuildProblem>,
  availableWidth: number,
  availableHeight = 844,
) {
  return {
    hidden: renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
      problem,
      showAnswer: false,
      applicationProblemRegistry: approvedRegistry(problem.familyId),
      availableWidth,
      availableHeight,
    })),
    revealed: renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
      problem,
      showAnswer: true,
      applicationProblemRegistry: approvedRegistry(problem.familyId),
      availableWidth,
      availableHeight,
    })),
  }
}

function answerChannels(markup: string): string {
  return [
    ...Array.from(markup.matchAll(/<(?:title|text)[^>]*>(.*?)<\/(?:title|text)>/g)),
    ...Array.from(markup.matchAll(/(?:aria-label|data-[a-z-]+)="([^"]*)"/g)),
  ].map((match) => match[1]).join(' ')
}

function renderProblem(problem: GeneratedApplicationProblemV1): string {
  return renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
    problem,
    showAnswer: false,
    applicationProblemRegistry: approvedRegistry(problem.familyId),
    availableWidth: 390,
    availableHeight: 844,
  }))
}

function withMathModel(
  problem: GeneratedApplicationProblemV1,
  mathModel: JsonValue,
): GeneratedApplicationProblemV1 {
  return { ...problem, visual: { ...problem.visual, mathModel } }
}

describe('Grade5ApplicationGeometryVisual', () => {
  it.each([
    { availableWidth: 390, availableHeight: 844 },
    { availableWidth: 1024, availableHeight: 768 },
  ])('fits required quantitative SVG uniformly at $availableWidth×$availableHeight without fixed overflow', ({ availableWidth, availableHeight }) => {
    const problem = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const { hidden } = renderPair(problem, availableWidth, availableHeight)
    expect(hidden).toContain(`max-width:${Math.min(availableWidth, 672)}px`)
    expect(hidden).toContain('width:100%')
    expect(hidden).toContain('preserveAspectRatio="xMidYMid meet"')
    expect(hidden).not.toMatch(/<svg[^>]+width="[0-9]+"/)
    expect(hidden).not.toContain('정량 그림을 만들 수 없습니다')
  })

  it('omits the required perimeter answer from text, metadata, aria, and data channels until disclosure', () => {
    const problem = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const answer = problem.answer.normalized
    const { hidden, revealed } = renderPair(problem, 390)
    expect(answerChannels(hidden)).not.toMatch(new RegExp(`(?:^|\\D)${answer}(?:\\D|$)`))
    expect(answerChannels(revealed)).toMatch(new RegExp(`(?:^|\\D)${answer}(?:\\D|$)`))
    expect(hidden).toContain('둘레 ?')
  })

  it('omits the inverse width and requested perimeter until disclosure', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const width = String(problem.params.rectangleWidth)
    const answer = problem.answer.normalized
    const hidden = renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
      problem,
      showAnswer: false,
      applicationProblemRegistry: approvedRegistry(problem.familyId),
      availableWidth: 1024,
    }))
    const revealed = renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
      problem,
      showAnswer: true,
      applicationProblemRegistry: approvedRegistry(problem.familyId),
      availableWidth: 1024,
    }))
    expect(answerChannels(hidden)).not.toMatch(new RegExp(`(?:^|\\D)${width}(?:\\D|$)`))
    expect(answerChannels(hidden)).not.toMatch(new RegExp(`(?:^|\\D)${answer}(?:\\D|$)`))
    expect(answerChannels(revealed)).toMatch(new RegExp(`(?:^|\\D)${width}(?:\\D|$)`))
    expect(answerChannels(revealed)).toMatch(new RegExp(`(?:^|\\D)${answer}(?:\\D|$)`))
  })

  it('omits the unknown overlap and the exact zero region before and after disclosure', () => {
    const problem = generateG5AreaOverlapReconstructionProblem({ seed: 0, variantIndex: 0 })
    const target = problem.answer.normalized
    const zeroPair = String(problem.params.zeroPair)
    const hidden = renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
      problem,
      showAnswer: false,
      applicationProblemRegistry: approvedRegistry(problem.familyId),
      availableWidth: 390,
    }))
    const revealed = renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
      problem,
      showAnswer: true,
      applicationProblemRegistry: approvedRegistry(problem.familyId),
      availableWidth: 390,
    }))
    expect(answerChannels(hidden)).not.toMatch(new RegExp(`(?:^|\\D)${target}(?:\\D|$)`))
    expect(answerChannels(revealed)).toMatch(new RegExp(`(?:^|\\D)${target}(?:\\D|$)`))
    expect(hidden).not.toContain(`region-${zeroPair}`)
    expect(revealed).not.toContain(`region-${zeroPair}`)
    expect(hidden).not.toContain('0 cm')
    expect(revealed).not.toContain('0 cm')
  })

  it('treats malformed required geometry as fatal instead of falling back to a schematic', () => {
    const problem = generateG5AreaOverlapReconstructionProblem({ seed: 0, variantIndex: 0 })
    const broken = {
      ...problem,
      visual: { ...problem.visual, mathModel: { broken: true } },
    }
    const markup = renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
      problem: broken,
      showAnswer: false,
      applicationProblemRegistry: approvedRegistry(problem.familyId),
      availableWidth: 390,
    }))
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('rejects a valid scene carried under the wrong family visual generator identity', () => {
    const problem = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const mismatched = {
      ...problem,
      visual: {
        ...problem.visual,
        generatorId: 'g5-area-composite-inverse-visual',
      },
    }
    const markup = renderToStaticMarkup(createElement(Grade5ApplicationGeometryVisual, {
      problem: mismatched,
      showAnswer: false,
      applicationProblemRegistry: approvedRegistry(problem.familyId),
      availableWidth: 390,
      availableHeight: 844,
    }))
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks contract-valid forged curriculum provenance before rendering', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const forged = parseGeneratedApplicationProblemV1({
      ...problem,
      curriculumCodes: ['[forged]'],
    })

    const markup = renderProblem(forged)
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks a contract-valid required-to-support visual policy downgrade', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const downgraded = parseGeneratedApplicationProblemV1({
      ...problem,
      visual: { ...problem.visual, role: 'support', answerCritical: false },
    })

    const markup = renderProblem(downgraded)
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks an answer-critical policy downgrade before rendering', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const downgraded: GeneratedApplicationProblemV1 = {
      ...problem,
      visual: { ...problem.visual, answerCritical: false },
    }

    const markup = renderProblem(downgraded)
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks a contract-valid visual semantics change before rendering', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const changed = parseGeneratedApplicationProblemV1({
      ...problem,
      visual: { ...problem.visual, semantics: 'schematic' },
    })

    const markup = renderProblem(changed)
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks a valid same-family scene substituted from a different generated instance', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const other = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 1 })
    expect(other.answer.normalized).toBe(problem.answer.normalized)
    expect(other.params.attachmentPosition).not.toBe(problem.params.attachmentPosition)

    const markup = renderProblem(withMathModel(problem, other.visual.mathModel as JsonValue))
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks joint params and scene substitution from a same-answer generated instance', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const other = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 1 })
    expect(other.answer.normalized).toBe(problem.answer.normalized)
    const substituted: GeneratedApplicationProblemV1 = {
      ...problem,
      params: other.params,
      visual: { ...problem.visual, mathModel: other.visual.mathModel },
    }

    const markup = renderProblem(substituted)
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks forged generator provenance even when math params and scene still agree', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const forged: GeneratedApplicationProblemV1 = {
      ...problem,
      params: { ...problem.params, __generation: { forged: true } },
    }

    const markup = renderProblem(forged)
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks a contract-valid forged answer that no longer closes over the quantitative model', () => {
    const problem = generateG5AreaCompositeInverseProblem({ seed: 0, variantIndex: 0 })
    const forgedIndex = problem.choices?.findIndex((choice) => choice !== problem.answer.normalized)
    if (forgedIndex === undefined || forgedIndex < 0 || !problem.choices) {
      throw new Error('expected distractor')
    }
    const forged: GeneratedApplicationProblemV1 = {
      ...problem,
      answer: { ...problem.answer, normalized: problem.choices[forgedIndex] },
      correctChoiceIndex: forgedIndex,
    }

    const markup = renderProblem(forged)
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks an otherwise valid scene with an undeclared detached primitive', () => {
    const problem = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
    if (scene.surface !== 'diagram') throw new Error('expected a diagram')
    const forgedScene = {
      ...scene,
      primitives: [...scene.primitives, {
        kind: 'polygon' as const,
        key: 'forged-primitive',
        points: [{ x: 0.25, y: 0.25 }, { x: 1.25, y: 0.25 }, { x: 0.25, y: 1.25 }],
        disclosure: 'given' as const,
        styleRole: 'primary' as const,
        emphasis: 'normal' as const,
      }],
    }

    const markup = renderProblem(withMathModel(problem, forgedScene as unknown as JsonValue))
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks an otherwise valid scene with an undeclared label', () => {
    const problem = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
    if (scene.surface !== 'diagram') throw new Error('expected a diagram')
    const forgedScene = {
      ...scene,
      labels: [...scene.labels, {
        key: 'forged-label',
        x: 1,
        y: 1,
        content: { before: { text: '추가 정보', disclosure: 'given' as const } },
        styleRole: 'primary' as const,
      }],
    }

    const markup = renderProblem(withMathModel(problem, forgedScene as unknown as JsonValue))
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks an otherwise valid scene with an undeclared constraint', () => {
    const problem = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const scene = parseApplicationVisualSceneV1(problem.visual.mathModel)
    if (scene.surface !== 'diagram') throw new Error('expected a diagram')
    const forgedScene = {
      ...scene,
      constraints: [...scene.constraints, scene.constraints[0]],
    }

    const markup = renderProblem(withMathModel(problem, forgedScene as unknown as JsonValue))
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })

  it('blocks an otherwise valid problem with an undeclared unused parameter', () => {
    const problem = generateG5PerimeterBoundaryRebuildProblem({ seed: 0, variantIndex: 0 })
    const forged: GeneratedApplicationProblemV1 = {
      ...problem,
      params: { ...problem.params, detachedValue: 123 },
    }

    const markup = renderProblem(forged)
    expect(markup).toContain('정량 그림을 만들 수 없습니다')
    expect(markup).not.toContain('<svg')
  })
})
