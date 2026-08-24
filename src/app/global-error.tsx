'use client'

import { useEffect } from 'react'

import ErrorScreenView from '@/components/ErrorScreenView'
import { reportTechnicalError } from '@/lib/error-reporting'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    void reportTechnicalError({ routeTemplate: 'unknown', errorKind: 'render' })
  }, [error])

  return (
    <html lang="ko">
      <body>
        <ErrorScreenView onRetry={reset} screenTemplate="unknown" />
      </body>
    </html>
  )
}
