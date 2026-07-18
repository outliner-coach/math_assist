'use client'

interface ProgressIndicatorProps {
  total: number
  current: number
  answers: (string | null)[]
  checkedAnswers?: (boolean | null)[]
  onSelect?: (index: number) => void
}

export default function ProgressIndicator({
  total,
  current,
  answers,
  checkedAnswers = [],
  onSelect
}: ProgressIndicatorProps) {
  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = typeof answers[i] === 'string' && answers[i]!.trim() !== ''
        const checked = checkedAnswers[i]
        const isCurrent = i === current
        const statusClass = checked === true
          ? 'bg-green-100 text-green-800 border-2 border-green-400'
          : checked === false
            ? 'bg-red-100 text-red-800 border-2 border-red-400'
            : isAnswered
              ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
              : 'bg-gray-100 text-gray-500 border-2 border-gray-200'

        return (
          <button
            key={i}
            onClick={() => onSelect?.(i)}
            data-testid={`progress-step-${i + 1}`}
            aria-label={`문제 ${i + 1}${checked === true ? ', 정답 확인 완료' : checked === false ? ', 오답 확인 완료' : ''}`}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              font-medium text-sm transition-all duration-200
              touch-manipulation min-w-touch min-h-touch
              ${statusClass}
              ${isCurrent ? 'ring-4 ring-primary-200 animate-pulse-ring' : ''}
            `}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
