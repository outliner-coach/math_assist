'use client'

import type { VisualAid as VisualAidType } from '@/lib/types'

interface VisualAidProps {
  aid: VisualAidType
}

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa']

export default function VisualAid({ aid }: VisualAidProps) {
  switch (aid.type) {
    case 'number_line': {
      const { start, end, highlights } = aid.props
      const range = end - start
      const width = 320
      const height = 60
      const padding = 16
      const points = Array.from({ length: range + 1 }, (_, i) => start + i)
      const scale = (width - padding * 2) / range

      return (
        <div className="w-full overflow-x-auto">
          <svg width={width} height={height} className="mx-auto">
            <line
              x1={padding}
              y1={30}
              x2={width - padding}
              y2={30}
              stroke="#9ca3af"
              strokeWidth={2}
            />
            {points.map((value) => {
              const x = padding + (value - start) * scale
              const isHighlight = highlights.includes(value)
              return (
                <g key={value}>
                  <line x1={x} y1={24} x2={x} y2={36} stroke="#9ca3af" strokeWidth={1} />
                  <circle cx={x} cy={30} r={isHighlight ? 5 : 3} fill={isHighlight ? '#2563eb' : '#9ca3af'} />
                  <text x={x} y={52} textAnchor="middle" fontSize={10} fill="#6b7280">
                    {value}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )
    }
    case 'bar_model': {
      const { total, parts, labels } = aid.props
      return (
        <div className="w-full">
          <div className="flex w-full h-8 rounded-lg overflow-hidden border border-gray-200">
            {parts.map((part, index) => (
              <div
                key={index}
                className="flex items-center justify-center text-xs font-medium text-white"
                style={{
                  width: `${(part / total) * 100}%`,
                  backgroundColor: COLORS[index % COLORS.length]
                }}
              >
                {labels?.[index] ?? part}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">전체: {total}</p>
        </div>
      )
    }
    case 'array_grid': {
      const { rows, cols, filled } = aid.props
      const total = rows * cols
      const fillCount = Math.min(filled ?? 0, total)
      return (
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1.25rem)` }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-sm border ${i < fillCount ? 'bg-blue-400 border-blue-500' : 'bg-white border-gray-300'}`}
            />
          ))}
        </div>
      )
    }
    case 'rule_table': {
      const { inputs, outputs, rule } = aid.props
      return (
        <div className="w-full">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left text-gray-600">입력</th>
                <th className="p-2 text-left text-gray-600">규칙</th>
                <th className="p-2 text-left text-gray-600">출력</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((input, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{input}</td>
                  <td className="p-2 text-gray-500">{rule}</td>
                  <td className="p-2">{outputs[index] ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'factor_tree': {
      const { value, factors } = aid.props
      return (
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <p className="text-gray-600 mb-2">소인수 분해</p>
          <p className="text-lg font-semibold text-gray-800">{value}</p>
          <p className="text-gray-700 mt-2">
            {value} = {factors.join(' × ')}
          </p>
        </div>
      )
    }
    default:
      return null
  }
}
