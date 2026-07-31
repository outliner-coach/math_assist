'use client'

import { useSearchParams } from 'next/navigation'

import { grade4Units, SAFE_GRADE4_UNIT_ID } from '@/lib/grade4-problems'
import { resolveGrade4ActivityMode } from '@/lib/grade4-progress'

import Grade4BridgeClient from '../Grade4BridgeClient'

export default function Grade4MissionRouteClient() {
  const searchParams = useSearchParams()
  const requestedUnitId = searchParams.get('unitId')
  const initialUnitId = requestedUnitId && grade4Units.some((unit) => unit.id === requestedUnitId)
    ? requestedUnitId
    : SAFE_GRADE4_UNIT_ID
  const initialMode = resolveGrade4ActivityMode(searchParams.get('mode'))
  return <Grade4BridgeClient initialUnitId={initialUnitId} initialMode={initialMode} />
}
