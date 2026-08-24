'use client'

import { useEffect, useState } from 'react'

import { getActiveProfileId, subscribeLeaseRevocation } from './profile-bootstrap'
import { createBrowserProfileCoordinationChannel } from './profile-session-lease'

export type LearnerLeaseStatus = 'owned' | 'lost'

export function subscribeToLeaseLoss(onLost: () => void): () => void {
  return subscribeLeaseRevocation(() => onLost())
}

/**
 * Mirrors the memoized bootstrap lease AND the device-wide profile-change
 * broadcast. A document locks when either (a) its own lease is revoked or
 * (b) another tab made a different profile device-active while this document
 * booted under the previous one — non-holder tabs included, because every
 * learner write is refused once the active identity moved away.
 */
export function useLearnerLeaseStatus(): LearnerLeaseStatus {
  const [status, setStatus] = useState<LearnerLeaseStatus>('owned')
  useEffect(() => {
    const teardowns = [subscribeToLeaseLoss(() => setStatus('lost'))]
    const bootProfileId = getActiveProfileId()
    if (bootProfileId !== null) {
      try {
        const channel = createBrowserProfileCoordinationChannel()
        const unsubscribe = channel.subscribe((message) => {
          if (message.type === 'profile-changed' && message.profileId !== bootProfileId) {
            setStatus('lost')
          }
        })
        teardowns.push(() => {
          unsubscribe()
          channel.close()
        })
      } catch {
        // Without a working channel the lease subscription still guards holders.
      }
    }
    return () => {
      teardowns.forEach((teardown) => teardown())
    }
  }, [])
  return status
}
