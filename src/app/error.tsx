'use client'

import { useEffect } from 'react'

import ErrorScreenView from '@/components/ErrorScreenView'
import {
  reportTechnicalError,
  routeTemplateFromPathname,
} from '@/lib/error-reporting'

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RouteError({ error, reset }: RouteErrorProps) {
  const screenTemplate = routeTemplateFromPathname(
    typeof window === 'undefined' ? null : window.location.pathname,
  )

  useEffect(() => {
    void reportTechnicalError({ routeTemplate: screenTemplate, errorKind: 'render' })
  }, [error, screenTemplate])

  return <ErrorScreenView onRetry={reset} screenTemplate={screenTemplate} />
}
