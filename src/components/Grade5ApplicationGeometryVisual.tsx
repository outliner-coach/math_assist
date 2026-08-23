import React, { type CSSProperties, type ReactNode } from 'react'

import type { GeneratedApplicationProblemV1 } from '../lib/application-problems/contracts'
import type { ApplicationProblemRegistryV1 } from '../lib/application-problems/registry'
import { resolveApplicationVisual } from '../lib/application-problems/visual-validator'
import { resolveGrade5ApplicationGeometryVisual } from '../lib/application-problems/grade5-visual-resolution'
import ApplicationProblemVisual from './ApplicationProblemVisual'

interface Grade5ApplicationGeometryVisualProps {
  problem: GeneratedApplicationProblemV1
  showAnswer?: boolean
  availableWidth?: number
  availableHeight?: number
  applicationProblemRegistry?: ApplicationProblemRegistryV1
  beforeVisual?: ReactNode
  children?: ReactNode
}

function FatalGeometry() {
  return (
    <div className="grade5-application-geometry__fatal" role="alert">
      정량 그림을 만들 수 없습니다. 문제를 계속 풀지 말고 다시 불러와 주세요.
    </div>
  )
}

function boundedWidth(
  width: number | undefined,
  height: number | undefined,
  scene: Extract<ReturnType<typeof resolveApplicationVisual>, { status: 'ready' }>['scene'],
): number {
  const widthBound = width === undefined
    ? 672
    : (!Number.isFinite(width) || width <= 0 ? 320 : Math.min(Math.floor(width), 672))
  if (
    scene.surface !== 'diagram' ||
    height === undefined ||
    !Number.isFinite(height) ||
    height <= 0
  ) {
    return widthBound
  }
  const heightBound = Math.floor(height * scene.viewBox.width / scene.viewBox.height)
  return Math.max(1, Math.min(widthBound, heightBound))
}

export default function Grade5ApplicationGeometryVisual({
  problem,
  showAnswer = false,
  availableWidth,
  availableHeight,
  applicationProblemRegistry,
  beforeVisual,
  children,
}: Grade5ApplicationGeometryVisualProps) {
  const resolution = resolveGrade5ApplicationGeometryVisual(problem, applicationProblemRegistry)
  if (resolution.status !== 'ready') {
    return <FatalGeometry />
  }
  const style: CSSProperties = {
    width: '100%',
    maxWidth: `${boundedWidth(availableWidth, availableHeight, resolution.scene)}px`,
    minWidth: 0,
    marginInline: 'auto',
    overflow: 'hidden',
  }
  return <>
    {beforeVisual}
    <div className={`grade5-application-geometry${children ? ' mb-8' : ''}`} style={style}>
      <ApplicationProblemVisual scene={resolution.scene} showAnswer={showAnswer} />
    </div>
    {children}
  </>
}
