'use client'

import React from 'react'

import GeometryProblemVisual from '@/components/GeometryProblemVisual'
import ProblemDiagram, {
  isProblemVisual,
} from '@/components/ProblemDiagram'
import { Grade1MissionVisual } from '@/components/grade1'
import { Grade2MissionVisual } from '@/components/grade2'
import { Grade3MissionVisual } from '@/components/grade3'
import { Grade4MissionVisual } from '@/components/grade4'
import type { ProblemReviewRow } from '@/lib/problem-review'

export type ProblemReviewState = 'pre' | 'hint' | 'revealed'

interface ProblemReviewRendererProps {
  row: ProblemReviewRow
  state: ProblemReviewState
}

export default function ProblemReviewRenderer({
  row,
  state,
}: ProblemReviewRendererProps) {
  const showAnswer = state === 'revealed'
  const emphasize = state === 'hint'
  let renderedVisual
  let renderedSupport: React.ReactNode = null

  if (row.renderer === 'grade1') {
    renderedVisual = (
      <Grade1MissionVisual
        mission={row.mission}
        emphasize={emphasize}
        showAnswer={showAnswer}
      />
    )
  } else if (row.renderer === 'grade2') {
    renderedVisual = (
      <Grade2MissionVisual
        mission={row.mission}
        emphasize={emphasize}
        showAnswer={showAnswer}
      />
    )
  } else if (row.renderer === 'grade3') {
    renderedVisual = (
      <Grade3MissionVisual
        mission={row.mission}
        emphasize={emphasize}
        showAnswer={showAnswer}
      />
    )
    if (state === 'hint') {
      renderedSupport = (
        <section
          data-testid="problem-review-scaffold"
          className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4"
        >
          <h3 className="text-sm font-black text-amber-950">학습 발판</h3>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {row.mission.scaffoldConfig.prompt}
          </p>
          {row.mission.scaffoldConfig.options && (
            <div className="mt-3 flex flex-wrap gap-2">
              {row.mission.scaffoldConfig.options.map(option => (
                <span
                  key={option}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold"
                >
                  {option}
                </span>
              ))}
            </div>
          )}
        </section>
      )
    }
  } else if (row.renderer === 'grade4') {
    renderedVisual = (
      <Grade4MissionVisual mission={row.mission} showAnswer={showAnswer} />
    )
    if (row.mission.supportTool !== 'none') {
      renderedSupport = (
        <section
          data-testid="problem-review-tool"
          className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-950"
        >
          학습 도구: {row.mission.supportTool}
        </section>
      )
    }
  } else if (!row.problem.visual) {
    renderedVisual = (
      <div
        className="grid min-h-48 place-items-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center font-bold text-slate-500"
        data-testid="problem-review-no-visual"
      >
        이 원문은 시각 자료가 없는 텍스트 문제입니다.
      </div>
    )
  } else if (isProblemVisual(row.problem.visual)) {
    renderedVisual = <ProblemDiagram visual={row.problem.visual} />
  } else {
    renderedVisual = (
      <GeometryProblemVisual
        visual={row.problem.visual}
        showAnswer={showAnswer}
      />
    )
  }

  return (
    <div
      data-actual-renderer={row.renderer}
      data-review-source-id={row.sourceId}
      data-review-visual-state={state}
      className={emphasize ? 'rounded-[2rem] ring-4 ring-amber-200' : ''}
    >
      {renderedVisual}
      {renderedSupport}
    </div>
  )
}
