import React from 'react'

import type { ValidatedApplicationVisualScene } from '@/lib/application-problems/visual-validator'

import ApplicationProblemVisual from '../ApplicationProblemVisual'

interface Grade2ApplicationLengthVisualProps {
  scene: ValidatedApplicationVisualScene
  showAnswer?: boolean
}

export default function Grade2ApplicationLengthVisual({
  scene,
  showAnswer = false,
}: Grade2ApplicationLengthVisualProps) {
  return <ApplicationProblemVisual scene={scene} showAnswer={showAnswer} />
}
