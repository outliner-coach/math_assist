import React from 'react'

import type { MascotMode } from '@/lib/experience-preset'
import {
  getMascotAssetPath,
  MASCOT_PROFILES,
  MASCOT_STATE_LABELS,
  type MascotId,
  type MascotState,
} from '@/lib/mascot'

const STATE_POSITIONS: Record<MascotState, string> = {
  welcome: '0%',
  think: '25%',
  hint: '50%',
  recover: '75%',
  celebrate: '100%',
}

const MODE_WIDTHS: Record<MascotMode, string> = {
  full: 'w-28 md:w-36',
  companion: 'w-24 md:w-28',
  coach: 'w-16 md:w-20',
}

const COMPACT_MODE_WIDTHS: Record<MascotMode, string> = {
  full: 'w-10 md:w-36',
  companion: 'w-9 md:w-28',
  coach: 'w-8 md:w-20',
}

export interface MascotCharacterProps {
  mascotId: MascotId
  state?: MascotState
  mode?: MascotMode
  compactOnMobile?: boolean
  className?: string
}

export default function MascotCharacter({
  mascotId,
  state = 'welcome',
  mode = 'companion',
  compactOnMobile = false,
  className = '',
}: MascotCharacterProps) {
  const profile = MASCOT_PROFILES[mascotId]

  return (
    <div
      role="img"
      aria-label={`${profile.name}가 ${MASCOT_STATE_LABELS[state]}`}
      className={`${compactOnMobile ? COMPACT_MODE_WIDTHS[mode] : MODE_WIDTHS[mode]} ${className}`.trim()}
      data-mascot-id={mascotId}
      data-mascot-state={state}
      data-mascot-mode={mode}
    >
      <div
        className="w-full overflow-hidden rounded-[1.5rem] bg-white bg-no-repeat shadow-sm"
        style={{
          aspectRatio: '1 / 2',
          backgroundColor: profile.surface,
          backgroundImage: `url(${getMascotAssetPath(mascotId)})`,
          backgroundPosition: `${STATE_POSITIONS[state]} center`,
          backgroundSize: '500% 100%',
        }}
      />
    </div>
  )
}
