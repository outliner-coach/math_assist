'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import type { Problem } from '@/lib/types'
import type { ApplicationProblemRegistryV1 } from '@/lib/application-problems/registry'
import { restoreGeneratedApplicationProblemFromPractice } from '@/lib/application-problems/template-adapter'

function LoadingApplicationVisual() {
  return <p className="mb-8" aria-live="polite">필수 그림을 확인하고 있어요.</p>
}

const Grade5ApplicationGeometryVisual = dynamic(
  () => import('./Grade5ApplicationGeometryVisual'),
  { loading: LoadingApplicationVisual },
)
const Grade6ApplicationRatioVisual = dynamic(
  () => import('./Grade6ApplicationRatioVisual'),
  { loading: LoadingApplicationVisual },
)

function FatalApplicationVisual() {
  return (
    <p role="alert">
      필수 그림을 확인할 수 없어 이 문제를 표시하지 않았어요. 문제를 다시 불러와 주세요.
    </p>
  )
}

export default function ApplicationPracticeVisual({
  problem,
  showAnswer = false,
  applicationProblemRegistry,
  beforeVisual,
  children,
}: {
  problem: Problem
  showAnswer?: boolean
  applicationProblemRegistry?: ApplicationProblemRegistryV1
  beforeVisual?: ReactNode
  children?: ReactNode
}) {
  const generated = restoreGeneratedApplicationProblemFromPractice(problem)
  if (!generated) return <FatalApplicationVisual />

  if (generated.familyId.startsWith('g5-')) {
    return <Grade5ApplicationGeometryVisual
      problem={generated}
      showAnswer={showAnswer}
      applicationProblemRegistry={applicationProblemRegistry}
      beforeVisual={beforeVisual}
    >
      {children}
    </Grade5ApplicationGeometryVisual>
  }
  if (generated.familyId.startsWith('g6-')) {
    return <Grade6ApplicationRatioVisual
      visual={generated.visual}
      source={generated}
      problem={generated}
      showAnswer={showAnswer}
      applicationProblemRegistry={applicationProblemRegistry}
      beforeVisual={beforeVisual}
    >
      {children}
    </Grade6ApplicationRatioVisual>
  }
  return <FatalApplicationVisual />
}
