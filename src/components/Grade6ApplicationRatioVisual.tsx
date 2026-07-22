import React from 'react'

import type { GeneratedApplicationVisualV1 } from '../lib/application-problems/contracts'
import {
  createApplicationVisualResolver,
  type ApplicationVisualResolution,
} from '../lib/application-problems/visual-validator'
import {
  validateG6RatioPartWholeVisual,
  validateG6RatioRelativeComparisonVisual,
  validateG6RatioRepresentationCheckVisual,
} from '../lib/application-problems/families/g6-ratio'
import ApplicationProblemVisual from './ApplicationProblemVisual'

interface Grade6ApplicationRatioVisualProps {
  visual: GeneratedApplicationVisualV1
  showAnswer?: boolean
}

export const resolveGrade6ApplicationRatioVisual: (
  visual: GeneratedApplicationVisualV1,
) => ApplicationVisualResolution = createApplicationVisualResolver({
  'g6-ratio-part-whole-visual': validateG6RatioPartWholeVisual,
  'g6-ratio-relative-comparison-visual': validateG6RatioRelativeComparisonVisual,
  'g6-ratio-representation-check-visual': validateG6RatioRepresentationCheckVisual,
})

export default function Grade6ApplicationRatioVisual({
  visual,
  showAnswer = false,
}: Grade6ApplicationRatioVisualProps) {
  const resolution = resolveGrade6ApplicationRatioVisual(visual)
  if (resolution.status === 'ready') {
    return <ApplicationProblemVisual scene={resolution.scene} showAnswer={showAnswer} />
  }
  if (resolution.status === 'blocked') {
    return <p role="alert">비율 그림을 확인할 수 없어 이 문제를 표시하지 않았어요.</p>
  }
  return null
}
