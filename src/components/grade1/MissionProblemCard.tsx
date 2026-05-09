'use client'

import React from 'react'
import { grade1Mascots, grade1Objects } from '@/lib/grade1-assets'

import GameButton from './GameButton'
import Grade1AssetImage from './Grade1AssetImage'
import MascotGuide from './MascotGuide'

interface MissionProblemCardProps {
  selectedAnswer: number | null
  showHint: boolean
  onAnswer: (answer: number) => void
  onShowHint: () => void
}

const CORRECT_ANSWER = 7
const choices = [6, 7, 8]

function CountingScene() {
  return (
    <div
      className="rounded-[1.5rem] border-2 border-[#e5e5e5] bg-[#fbfffa] p-4"
      aria-label="사과 7개가 놓여 있습니다"
    >
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, index) => {
          const filled = index < CORRECT_ANSWER
          return (
            <div
              key={index}
              className={`flex aspect-square min-h-[44px] items-center justify-center rounded-2xl border-2 ${
                filled
                  ? 'border-[#ffc700] bg-[#fff8d9]'
                  : 'border-dashed border-[#e5e5e5] bg-white'
              }`}
            >
              {filled ? (
                <span className="block h-10 w-10">
                  <Grade1AssetImage
                    asset={{ ...grade1Objects.apple, decorative: true, alt: '' }}
                    className="h-full w-full object-contain"
                    fallback={<span className="block h-8 w-8 rounded-full bg-red-400" />}
                  />
                </span>
              ) : (
                <span className="h-3 w-3 rounded-full bg-[#e5e5e5]" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MissionProblemCard({
  selectedAnswer,
  showHint,
  onAnswer,
  onShowHint,
}: MissionProblemCardProps) {
  const isCorrect = selectedAnswer === CORRECT_ANSWER
  const isWrong = selectedAnswer !== null && !isCorrect

  return (
    <section
      id="grade1-mission"
      className="scroll-mt-6 rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-5 md:p-6"
      data-testid="mission-problem-card"
    >
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#58cc02]">
            오늘의 미션
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[#3c3c3c]">
            사과는 모두 몇 개일까요?
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border-2 border-[#e5e5e5] px-4 py-2 text-sm font-black text-[#777777]">
          <span className="h-3 w-3 rounded-full bg-[#58cc02]" />
          1학년 수 세기
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <CountingScene />

        <div className="space-y-4">
          <MascotGuide
            asset={isWrong ? grade1Mascots.donggeuriRetry : grade1Mascots.donggeuriDefault}
            eyebrow={isWrong ? '다시 해보기' : '동그리의 말'}
            message={
              isWrong
                ? '빈칸 말고 사과가 있는 칸만 다시 세어봐요.'
                : '손가락으로 하나씩 짚으며 세어도 좋아요.'
            }
            tone={isWrong ? 'hint' : 'neutral'}
          />

          {showHint && !isCorrect && (
            <div
              className="rounded-2xl border-2 border-[#ffc700] bg-[#fff8d9] p-4 text-base font-black leading-snug text-[#3c3c3c]"
              data-testid="mission-hint"
            >
              위 줄에는 5개, 아래 줄에는 2개가 있어요. 5와 2를 이어서 세어봐요.
            </div>
          )}

          <div className="grid grid-cols-3 gap-3" aria-label="정답 선택">
            {choices.map((choice) => {
              const active = selectedAnswer === choice
              return (
                <button
                  key={choice}
                  type="button"
                  data-testid={`grade1-choice-${choice}`}
                  onClick={() => onAnswer(choice)}
                  className={`min-h-[64px] rounded-2xl border-2 text-2xl font-black transition ${
                    active
                      ? 'border-[#58cc02] bg-[#58cc02] text-white shadow-[0_5px_0_#3f8f01]'
                      : 'border-[#e5e5e5] bg-white text-[#3c3c3c] shadow-[0_5px_0_#d1d5db] hover:bg-[#f0ffe7]'
                  }`}
                >
                  {choice}
                </button>
              )
            })}
          </div>

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
              맞았어요. 숫자 조각을 얻었어요!
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
