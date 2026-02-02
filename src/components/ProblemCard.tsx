'use client'

import MathText from './MathText'
import NumberKeypad from './NumberKeypad'
import type { Problem } from '@/lib/types'

interface ProblemCardProps {
  problem: Problem
  answer: string | null
  onAnswer: (answer: string) => void
}

export default function ProblemCard({ problem, answer, onAnswer }: ProblemCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      {/* 문제 */}
      <div className="text-xl md:text-2xl font-medium text-gray-800 mb-8 text-center leading-relaxed">
        <MathText>{problem.prompt}</MathText>
      </div>

      {/* 답 입력 */}
      {problem.type === 'choice' && problem.choices ? (
        <div className="grid grid-cols-2 gap-4">
          {problem.choices.map((choice, index) => (
            <button
              key={index}
              data-choice={index}
              onClick={() => onAnswer(String(index))}
              className={`
                p-4 md:p-6 rounded-xl text-lg md:text-xl font-medium
                transition-all duration-200 touch-manipulation
                min-h-touch border-2
                ${answer === String(index)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                }
              `}
            >
              <span className="mr-2 text-sm opacity-60">
                {['①', '②', '③', '④'][index]}
              </span>
              <MathText>{choice}</MathText>
            </button>
          ))}
        </div>
      ) : (
        <NumberKeypad
          value={answer || ''}
          onChange={onAnswer}
        />
      )}
    </div>
  )
}
