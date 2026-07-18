'use client'

import { useSearchParams } from 'next/navigation'

import { grade3Units } from '@/lib/grade3-problems'

import Grade3GameClient from '../Grade3GameClient'

export default function Grade3MissionRouteClient() {
  const searchParams = useSearchParams()
  const requestedUnitId = searchParams.get('unitId')
  const initialUnitId = requestedUnitId && grade3Units.some((unit) => unit.id === requestedUnitId)
    ? requestedUnitId
    : grade3Units[0].id

  return <Grade3GameClient initialUnitId={initialUnitId} />
}
