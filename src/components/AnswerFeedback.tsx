'use client'

import React from 'react'
import MathText from './MathText'
import type { SubmissionResult } from '@/lib/types'

interface AnswerFeedbackProps {
  result: SubmissionResult
}

function getRenderedAnswer(result: SubmissionResult): string | null {
  if (result.userAnswer === null || result.userAnswer.trim() === '') return null
  if (result.problem.type !== 'choice' || !result.problem.choices) return result.userAnswer

  const choiceIndex = Number.parseInt(result.userAnswer, 10)
  return result.problem.choices[choiceIndex] ?? result.userAnswer
}

export default function AnswerFeedback({ result }: AnswerFeedbackProps) {
  const renderedAnswer = getRenderedAnswer(result)

  return (
    <section
      className={`rounded-2xl border-2 p-5 shadow-sm ${result.correct
        ? 'border-green-300 bg-green-50'
        : 'border-red-300 bg-red-50'
      }`}
      data-testid="answer-feedback"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className={`text-xl font-bold ${result.correct ? 'text-green-800' : 'text-red-800'}`}
            data-testid={result.correct ? 'feedback-correct' : 'feedback-wrong'}
          >
            {result.correct ? '정답이에요!' : '아쉬워요. 풀이를 확인해 보세요.'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            내 답: {renderedAnswer ? <MathText>{renderedAnswer}</MathText> : '미응답'}
          </p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-xs font-semibold text-gray-500">정답</p>
          <p className="text-lg font-bold text-green-700" data-testid="feedback-answer">
            <MathText>{result.correctAnswer}</MathText>
          </p>
        </div>
      </div>

      {result.solutionSteps.length > 0 && (
        <div className="mt-4 rounded-xl bg-white/80 p-4" data-testid="feedback-solution">
          <p className="mb-2 text-sm font-bold text-gray-700">풀이 과정</p>
          <ol className="space-y-2 text-sm text-gray-700">
            {result.solutionSteps.map((step, index) => (
              <li key={index} className="flex">
                <span className="mr-2 text-gray-400">{index + 1}.</span>
                <MathText>{step}</MathText>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
