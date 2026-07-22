import React from 'react'

import type { GeneratedApplicationVisualV1, JsonValue } from '@/lib/application-problems/contracts'
import { validateG2LengthClaimCheckScene } from '@/lib/application-problems/families/g2-length-claim-check'
import { validateG2LengthMissingSegmentScene } from '@/lib/application-problems/families/g2-length-missing-segment'
import { validateG2LengthRouteTotalScene } from '@/lib/application-problems/families/g2-length-route-total'
import {
  resolveApplicationVisual,
  type ApplicationVisualResolution,
} from '@/lib/application-problems/visual-validator'

import ApplicationProblemVisual from '../ApplicationProblemVisual'

interface Grade2ApplicationLengthVisualProps {
  visual: GeneratedApplicationVisualV1
  params: Readonly<Record<string, JsonValue>>
  showAnswer?: boolean
}

export function resolveGrade2ApplicationLengthVisual(
  visual: GeneratedApplicationVisualV1,
  params: Readonly<Record<string, JsonValue>>,
): ApplicationVisualResolution {
  const familyValidator =
    visual.generatorId === 'g2-length-route-bars'
      ? validateG2LengthRouteTotalScene
      : visual.generatorId === 'g2-length-missing-bars'
        ? validateG2LengthMissingSegmentScene
        : visual.generatorId === 'g2-length-claim-bars'
          ? validateG2LengthClaimCheckScene
          : undefined

  return resolveApplicationVisual(visual, {
    familyValidator: familyValidator
      ? (scene) => familyValidator(scene, params)
      : () => [
          {
            code: 'unsupported_g2_length_visual_generator',
            path: 'visual.generatorId',
            message: 'Grade 2 length visual generator is not registered in the family wrapper',
          },
        ],
  })
}

export default function Grade2ApplicationLengthVisual({
  visual,
  params,
  showAnswer = false,
}: Grade2ApplicationLengthVisualProps) {
  const resolution = resolveGrade2ApplicationLengthVisual(visual, params)
  if (resolution.status !== 'ready') {
    const details =
      'issues' in resolution
        ? resolution.issues.map((entry) => entry.code).join(', ')
        : resolution.status
    throw new Error(`Required Grade 2 length visual failed validation: ${details}`)
  }
  return <ApplicationProblemVisual scene={resolution.scene} showAnswer={showAnswer} />
}
