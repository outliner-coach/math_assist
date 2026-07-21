'use client'

import React from 'react'

import type { Grade4Mission } from '@/lib/grade4-problems'

import Grade4MissionVisual from './Grade4MissionVisual'

const domainLabel = { knowing: '알기', applying: '적용', reasoning: '추론' }

interface Grade4MissionCardProps {
  mission: Grade4Mission
  selectedAnswer: string | null
  textAnswer: string
  inputError: string | null
  wrongAttemptCount: number
  showHint: boolean
  solved: boolean
  onChoiceAnswer: (answer: string) => void
  onTextAnswerChange: (answer: string) => void
  onSubmitText: () => void
  onShowHint: () => void
}

export default function Grade4MissionCard({
  mission,
  selectedAnswer,
  textAnswer,
  inputError,
  wrongAttemptCount,
  showHint,
  solved,
  onChoiceAnswer,
  onTextAnswerChange,
  onSubmitText,
  onShowHint,
}: Grade4MissionCardProps) {
  return (
    <section data-testid="grade4-mission-card" data-mission-id={mission.id} className="rounded-[2rem] border-2 border-[#c7d2fe] bg-white p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-black text-[#6366f1]">{mission.curriculumCode} · {domainLabel[mission.cognitiveDomain]}</p>
        <span className="rounded-full bg-[#eef2ff] px-4 py-2 text-sm font-black text-[#4338ca]">4학년 Bridge</span>
      </div>
      <h2 className="text-2xl font-black leading-tight text-[#0f172a] md:text-3xl">{mission.prompt}</h2>
      <p className="mt-3 text-base font-bold text-[#64748b]">오늘 목표: {mission.learnerGoal}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Grade4MissionVisual mission={mission} showAnswer={solved} />
        <div className="space-y-4">
          {mission.answerType === 'choice' ? (
            <div className="grid gap-3" aria-label="정답 선택">
              {(mission.choices ?? []).map((choice) => (
                <button key={choice} type="button" data-testid={`grade4-choice-${choice}`} onClick={() => onChoiceAnswer(choice)} disabled={solved}
                  className={`min-h-[58px] rounded-2xl border-2 px-3 text-lg font-black ${selectedAnswer === choice ? (solved ? 'border-[#16a34a] bg-[#dcfce7]' : 'border-[#f97316] bg-[#fff7ed]') : 'border-[#c7d2fe] bg-white text-[#0f172a]'}`}>
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <label htmlFor="grade4-integer-input" className="block text-sm font-black text-[#475569]">답을 숫자로 써요</label>
              <input id="grade4-integer-input" data-testid="grade4-integer-input" inputMode="numeric" value={textAnswer} disabled={solved}
                onChange={(event) => onTextAnswerChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSubmitText() }}
                className="min-h-[64px] w-full rounded-2xl border-2 border-[#c7d2fe] px-4 text-center text-3xl font-black text-[#0f172a] outline-none focus:border-[#4f46e5]" />
              <button type="button" data-testid="grade4-integer-submit" onClick={onSubmitText} disabled={solved}
                className="min-h-[56px] w-full rounded-xl bg-[#4f46e5] px-5 py-3 text-base font-black text-white shadow-[0_5px_0_#3730a3] disabled:opacity-60">답 확인</button>
            </div>
          )}

          {inputError && <p data-testid="grade4-input-error" className="rounded-2xl border-2 border-[#f97316] bg-[#fff7ed] p-4 text-sm font-black text-[#9a3412]">{inputError}</p>}
          {!solved && wrongAttemptCount > 0 && <p data-testid="grade4-wrong-feedback" className="rounded-2xl bg-[#fff7ed] p-4 text-sm font-black text-[#9a3412]">아직 아니에요. 자릿값을 다시 확인해요.</p>}
          {!solved && !showHint && <button type="button" onClick={onShowHint} data-testid="grade4-show-hint" className="min-h-[48px] w-full rounded-xl border-2 border-[#f59e0b] bg-[#fffbeb] px-4 font-black text-[#92400e]">단계 힌트</button>}
          {showHint && !solved && <div data-testid="grade4-hint" className="space-y-2 rounded-2xl border-2 border-[#f59e0b] bg-[#fffbeb] p-4 text-sm font-black text-[#0f172a]">{mission.hintSteps.map((hint) => <p key={hint}>{hint}</p>)}</div>}
          {solved && <div data-testid="grade4-solution" className="space-y-2 rounded-2xl border-2 border-[#16a34a] bg-[#f0fdf4] p-4 text-sm font-black text-[#166534]">{mission.solutionSteps.map((step) => <p key={step}>{step}</p>)}</div>}
        </div>
      </div>
    </section>
  )
}
