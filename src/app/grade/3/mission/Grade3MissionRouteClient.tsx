'use client'

import { useSearchParams } from 'next/navigation'

import { getGrade3MissionsByUnit, grade3Units, normalizeGrade3Mode } from '@/lib/grade3-problems'

import Grade3GameClient from '../Grade3GameClient'

export default function Grade3MissionRouteClient() {
  const searchParams = useSearchParams()
  const requestedUnitId = searchParams.get('unitId')
  const initialUnitId = requestedUnitId && grade3Units.some((unit) => unit.id === requestedUnitId)
    ? requestedUnitId
    : grade3Units[0].id
  const initialMode = normalizeGrade3Mode(searchParams.get('mode'))
  const requestedMissionId = searchParams.get('missionId')
  const initialMissionId = requestedMissionId
    && getGrade3MissionsByUnit(initialUnitId).some((mission) => mission.id === requestedMissionId)
    ? requestedMissionId
    : undefined

  return (
    <Grade3GameClient
      initialUnitId={initialUnitId}
      initialMode={initialMode}
      initialMissionId={initialMissionId}
    />
  )
}
