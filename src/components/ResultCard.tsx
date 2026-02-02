'use client'

import MathText from './MathText'
import type { SubmissionResult, Problem } from '@/lib/types'

interface ResultCardProps {
  result: SubmissionResult
  problem: Problem
}

export default function ResultCard({ result, problem }: ResultCardProps) {
  const { correct, userAnswer, correctAnswer, solutionSteps } = result

  return (
    <div className={`
      bg-white rounded-2xl shadow-md p-6
      border-l-4 ${correct ? 'border-green-500' : 'border-red-500'}
    `}>
      {/* 문제 */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-lg font-medium text-gray-800">
          <span className="text-gray-400 mr-2">Q{result.index + 1}.</span>
          <MathText>{problem.prompt}</MathText>
        </div>
        <span className={`
          px-3 py-1 rounded-full text-sm font-bold
          ${correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
        `}>
          {correct ? '정답' : '오답'}
        </span>
      </div>

      {/* 내 답안 / 정답 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded-lg ${correct ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-500 mb-1">내 답</p>
          <p className={`text-lg font-medium ${correct ? 'text-green-700' : 'text-red-700'}`}>
            {userAnswer !== null ? (
              problem.type === 'choice' && problem.choices
                ? <MathText>{problem.choices[parseInt(userAnswer)]}</MathText>
                : <MathText>{userAnswer}</MathText>
            ) : (
              <span className="text-gray-400">미응답</span>
            )}
          </p>
        </div>
        {!correct && (
          <div className="p-3 rounded-lg bg-green-50">
            <p className="text-xs text-gray-500 mb-1">정답</p>
            <p className="text-lg font-medium text-green-700">
              <MathText>{correctAnswer}</MathText>
            </p>
          </div>
        )}
      </div>

      {/* 풀이 과정 */}
      {!correct && solutionSteps.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">풀이 과정</p>
          <ol className="space-y-1 text-sm text-gray-700">
            {solutionSteps.map((step, i) => (
              <li key={i} className="flex">
                <span className="text-gray-400 mr-2">{i + 1}.</span>
                <MathText>{step}</MathText>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
