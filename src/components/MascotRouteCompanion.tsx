'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { resolveExperiencePreset, type MascotMode } from '@/lib/experience-preset'
import {
  DEFAULT_MASCOT_ID,
  isMascotId,
  loadMascotPreference,
  MASCOT_PROFILES,
  MASCOT_REACTION_EVENT,
  MASCOT_SELECTION_EVENT,
  MASCOT_STATE_MESSAGES,
  type MascotId,
  type MascotState,
} from '@/lib/mascot'

import MascotCharacter from './MascotCharacter'

function gradeFromPath(pathname: string): number | null {
  const match = pathname.match(/\/grade\/(\d)(?:\/|$)/)
  if (match) return Number(match[1])
  if (/\/(practice|concept|unit|result)(?:\/|$)/.test(pathname)) return 5
  return null
}

export default function MascotRouteCompanion() {
  const pathname = usePathname()
  const [mascotId, setMascotId] = useState<MascotId>(DEFAULT_MASCOT_ID)
  const [state, setState] = useState<MascotState>('think')
  const [practiceGrade, setPracticeGrade] = useState<number | null>(null)

  useEffect(() => {
    setMascotId(loadMascotPreference())
    const params = new URLSearchParams(window.location.search)
    setPracticeGrade(params.get('grade') === '6' ? 6 : null)
  }, [pathname])

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    const react = (event: Event) => {
      const next = (event as CustomEvent<MascotState>).detail
      if (!MASCOT_STATE_MESSAGES[next]) return
      setState(next)
      if (resetTimer) clearTimeout(resetTimer)
      if (next !== 'think') resetTimer = setTimeout(() => setState('think'), 3200)
    }
    const select = (event: Event) => {
      const next = (event as CustomEvent<MascotId>).detail
      if (isMascotId(next)) setMascotId(next)
    }
    window.addEventListener(MASCOT_REACTION_EVENT, react)
    window.addEventListener(MASCOT_SELECTION_EVENT, select)
    return () => {
      if (resetTimer) clearTimeout(resetTimer)
      window.removeEventListener(MASCOT_REACTION_EVENT, react)
      window.removeEventListener(MASCOT_SELECTION_EVENT, select)
    }
  }, [])

  const grade = practiceGrade ?? gradeFromPath(pathname)
  const mode = useMemo<MascotMode>(() => grade ? resolveExperiencePreset(grade).mascotMode : 'coach', [grade])

  if (!grade || pathname.endsWith('/review/problems')) return null

  const profile = MASCOT_PROFILES[mascotId]
  return (
    <aside
      className="pointer-events-none fixed bottom-2 right-2 z-40 flex items-end gap-2 opacity-95 md:bottom-5 md:right-5 md:opacity-100"
      aria-live="polite"
      data-testid="service-mascot"
      data-mascot-id={mascotId}
      data-mascot-state={state}
      data-mascot-mode={mode}
    >
      <p className="hidden max-w-[210px] rounded-2xl border-2 border-[#d8e3ef] bg-white px-4 py-3 text-sm font-bold leading-5 text-[#475569] shadow-lg md:block">
        <strong className="block text-[#0f172a]">{profile.name}</strong>
        {MASCOT_STATE_MESSAGES[state]}
      </p>
      <MascotCharacter mascotId={mascotId} state={state} mode={mode} compactOnMobile />
    </aside>
  )
}
