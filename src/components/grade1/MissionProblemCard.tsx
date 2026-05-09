'use client'

import React from 'react'
import { grade1Mascots } from '@/lib/grade1-assets'
import type { Grade1Mission } from '@/lib/grade1-problems'

import GameButton from './GameButton'
import Grade1MissionVisual from './Grade1MissionVisual'
import MascotGuide from './MascotGuide'

interface MissionProblemCardProps {
  mission: Grade1Mission
  selectedAnswer: string | null
  numberAnswer: string
  showHint: boolean
  wrongAttemptCount: number
  onAnswer: (answer: string) => void
  onNumberAnswerChange: (answer: string) => void
  onShowHint: () => void
}

export default function MissionProblemCard({
  mission,
  selectedAnswer,
  numberAnswer,
  showHint,
  wrongAttemptCount,
  onAnswer,
  onNumberAnswerChange,
  onShowHint,
}: MissionProblemCardProps) {
  const isCorrect = selectedAnswer === mission.correctAnswer
  const isWrong = selectedAnswer !== null && !isCorrect
  const emphasizeVisual = wrongAttemptCount >= 2 && !isCorrect
  const showSolutionPath = wrongAttemptCount >= 3 && !isCorrect

  return (
    <section
      id="grade1-mission"
      className="scroll-mt-6 rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-5 md:p-6"
      data-testid="mission-problem-card"
      data-mission-id={mission.id}
    >
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#58cc02]">
            오늘의 미션
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#3c3c3c]">
            {mission.prompt}
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border-2 border-[#e5e5e5] px-4 py-2 text-sm font-black text-[#777777]">
          <span className="h-3 w-3 rounded-full bg-[#58cc02]" />
          1학년 · 난이도 {mission.difficulty}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Grade1MissionVisual mission={mission} emphasize={emphasizeVisual} />

        <div className="space-y-4">
          <MascotGuide
            asset={isWrong ? grade1Mascots.donggeuriRetry : grade1Mascots.donggeuriDefault}
            eyebrow={isWrong ? '다시 해보기' : '동그리의 말'}
            message={
              isWrong
                ? wrongAttemptCount >= 2
                  ? '노란 표시를 보고 다시 천천히 확인해요.'
                  : '괜찮아요. 힌트를 보고 다시 해봐요.'
                : mission.learnerGoal
            }
            tone={isWrong ? 'hint' : 'neutral'}
          />

          {showHint && !isCorrect && (
            <div
              className="space-y-2 rounded-2xl border-2 border-[#ffc700] bg-[#fff8d9] p-4 text-base font-black leading-snug text-[#3c3c3c]"
              data-testid="mission-hint"
            >
              {mission.hintSteps.map((hint) => (
                <p key={hint}>{hint}</p>
              ))}
            </div>
          )}

          {showSolutionPath && (
            <div
              className="space-y-2 rounded-2xl border-2 border-[#1cb0f6] bg-sky-50 p-4 text-sm font-black leading-snug text-[#3c3c3c]"
              data-testid="mission-solution-path"
            >
              {mission.solutionSteps.map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          )}

          {mission.answerType === 'choice' && (
            <div className="grid grid-cols-3 gap-3" aria-label="정답 선택">
              {(mission.choices ?? []).map((choice) => {
                const active = selectedAnswer === choice
                return (
                  <button
                    key={choice}
                    type="button"
                    data-testid={`grade1-choice-${choice}`}
                    onClick={() => onAnswer(choice)}
                    className={`min-h-[64px] rounded-2xl border-2 px-2 text-xl font-black transition md:text-2xl ${
                      active
                        ? isCorrect
                          ? 'border-[#58cc02] bg-[#58cc02] text-white shadow-[0_5px_0_#3f8f01]'
                          : 'border-[#ff4b4b] bg-[#fff2f2] text-[#3c3c3c] shadow-[0_5px_0_#ffb3b3]'
                        : 'border-[#e5e5e5] bg-white text-[#3c3c3c] shadow-[0_5px_0_#d1d5db] hover:bg-[#f0ffe7]'
                    }`}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>
          )}

          {mission.answerType === 'number' && (
            <div className="space-y-3">
              <label className="block text-sm font-black text-[#777777]" htmlFor="grade1-number-answer">
                답을 숫자로 써요
              </label>
              <input
                id="grade1-number-answer"
                data-testid="grade1-number-input"
                inputMode="numeric"
                value={numberAnswer}
                onChange={(event) => onNumberAnswerChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onAnswer(numberAnswer.trim())
                }}
                className="min-h-[64px] w-full rounded-2xl border-2 border-[#e5e5e5] px-4 text-center text-3xl font-black text-[#3c3c3c] outline-none focus:border-[#1cb0f6]"
              />
              <GameButton
                className="w-full"
                onClick={() => onAnswer(numberAnswer.trim())}
                disabled={numberAnswer.trim().length === 0}
                data-testid="grade1-number-submit"
              >
                답 확인
              </GameButton>
            </div>
          )}

          {!isCorrect && (
            <GameButton
              variant="secondary"
              className="w-full"
              onClick={onShowHint}
              data-testid="show-hint-button"
            >
              힌트 보기
            </GameButton>
          )}

          {isCorrect && (
            <div
              className="rounded-2xl border-2 border-[#58cc02] bg-[#f0ffe7] p-4 text-center text-lg font-black text-[#3c3c3c]"
              data-testid="mission-success"
            >
              맞았어요. 다음 길이 열렸어요!
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
