'use client'

interface ProgressIndicatorProps {
  total: number
  current: number
  answers: (string | null)[]
  onSelect?: (index: number) => void
}

export default function ProgressIndicator({
  total,
  current,
  answers,
  onSelect
}: ProgressIndicatorProps) {
  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = answers[i] !== null
        const isCurrent = i === current

        return (
          <button
            key={i}
            onClick={() => onSelect?.(i)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              font-medium text-sm transition-all duration-200
              touch-manipulation min-w-touch min-h-touch
              ${isCurrent
                ? 'bg-primary-600 text-white ring-4 ring-primary-200 animate-pulse-ring'
                : isAnswered
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                  : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
              }
            `}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
