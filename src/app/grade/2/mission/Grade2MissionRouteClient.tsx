'use client'

import { useSearchParams } from 'next/navigation'

import { grade2Units } from '@/lib/grade2-problems'

import Grade2GameClient from '../Grade2GameClient'

export default function Grade2MissionRouteClient() {
  const searchParams = useSearchParams()
  const requestedUnitId = searchParams.get('unitId')
  const initialUnitId = requestedUnitId && grade2Units.some((unit) => unit.id === requestedUnitId)
    ? requestedUnitId
    : grade2Units[0].id

  return <Grade2GameClient initialUnitId={initialUnitId} />
}
