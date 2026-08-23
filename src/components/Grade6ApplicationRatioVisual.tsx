import React, { type ReactNode } from 'react'

import type {
  GeneratedApplicationProblemV1,
  GeneratedApplicationVisualV1,
} from '../lib/application-problems/contracts'
import type { ApplicationProblemRegistryV1 } from '../lib/application-problems/registry'
import {
  resolveGrade6ApplicationRatioProblem,
  resolveGrade6ApplicationRatioVisual,
} from '../lib/application-problems/grade6-visual-resolution'
import ApplicationProblemVisual from './ApplicationProblemVisual'

interface Grade6ApplicationRatioVisualProps {
  visual: GeneratedApplicationVisualV1
  source?: { familyId: string; generatorVersion: number }
  problem?: GeneratedApplicationProblemV1
  applicationProblemRegistry?: ApplicationProblemRegistryV1
  beforeVisual?: ReactNode
  showAnswer?: boolean
  children?: ReactNode
}

export { resolveGrade6ApplicationRatioVisual } from '../lib/application-problems/grade6-visual-resolution'

export default function Grade6ApplicationRatioVisual({
  visual,
  source,
  problem,
  applicationProblemRegistry,
  beforeVisual,
  showAnswer = false,
  children,
}: Grade6ApplicationRatioVisualProps) {
  const resolution = problem
    ? resolveGrade6ApplicationRatioProblem(problem, applicationProblemRegistry)
    : resolveGrade6ApplicationRatioVisual(visual, source, applicationProblemRegistry)
  if (resolution.status === 'ready') {
    return <>
      {beforeVisual}
      <div className={children ? 'mb-8' : undefined}>
        <ApplicationProblemVisual scene={resolution.scene} showAnswer={showAnswer} />
      </div>
      {children}
    </>
  }
  if (resolution.status === 'blocked') {
    return <p role="alert">비율 그림을 확인할 수 없어 이 문제를 표시하지 않았어요.</p>
  }
  return null
}
