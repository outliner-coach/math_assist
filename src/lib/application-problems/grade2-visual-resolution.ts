import type { GeneratedApplicationVisualV1, JsonValue } from './contracts'
import { validateG2LengthClaimCheckScene } from './families/g2-length-claim-check'
import { validateG2LengthMissingSegmentScene } from './families/g2-length-missing-segment'
import { validateG2LengthRouteTotalScene } from './families/g2-length-route-total'
import {
  resolveApplicationVisual,
  type ApplicationVisualResolution,
} from './visual-validator'

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
