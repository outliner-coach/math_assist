'use client'

import { useState } from 'react'

interface NumberKeypadProps {
  value: string
  onChange: (value: string) => void
  onComplete?: () => void
  inputHint?: string
  disabled?: boolean
}

export default function NumberKeypad({
  value,
  onChange,
  onComplete,
  inputHint,
  disabled = false
}: NumberKeypadProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleKey = (key: string) => {
    switch (key) {
      case 'clear':
        onChange('')
        break
      case 'backspace':
        onChange(value.slice(0, -1))
        break
      case 'done':
        setIsOpen(false)
        onComplete?.()
        break
      case ' ':
        // 공백 (대분수용) - 이미 공백이 있으면 추가하지 않음
        if (!value.includes(' ') && value.length > 0) {
          onChange(value + ' ')
        }
        break
      case '/':
        // 슬래시 - 이미 있으면 추가하지 않음
        if (!value.includes('/')) {
          onChange(value + '/')
        }
        break
      case '-':
        // 음수 부호 - 맨 앞에만
        if (value === '') {
          onChange('-')
        }
        break
      case '.':
        // 소수점 - 이미 있으면 추가하지 않음
        if (!value.includes('.') && !value.includes('/')) {
          onChange(value + '.')
        }
        break
      default:
        // 숫자
        onChange(value + key)
    }
  }

  const keys = [
    ['7', '8', '9', 'backspace'],
    ['4', '5', '6', '/'],
    ['1', '2', '3', ' '],
    ['-', '0', '.', 'done'],
  ]

  const getKeyLabel = (key: string): string => {
    switch (key) {
      case 'backspace': return '←'
      case 'clear': return 'C'
      case 'done': return '완료'
      case ' ': return '␣'
      default: return key
    }
  }

  const getKeyStyle = (key: string): string => {
    if (key === 'done') return 'bg-primary-600 text-white'
    if (key === 'backspace') return 'bg-red-100 text-red-600'
    return 'bg-white'
  }

  return (
    <div className="w-full">
      {/* 입력 필드 */}
      <div
        data-testid="keypad-display"
        className={`w-full p-4 text-2xl text-center border-2 rounded-xl mb-4 min-h-[60px] ${disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-600'
          : 'cursor-pointer border-gray-300 bg-white'
        }`}
        aria-disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(true)
        }}
      >
        {value || <span className="text-gray-400">터치하여 입력</span>}
      </div>

      {/* 키패드 */}
      {isOpen && (
        <div className="grid grid-cols-4 gap-2">
          {keys.flat().map((key, index) => (
            <button
              key={index}
              data-testid={`key-${encodeURIComponent(key)}`}
              disabled={disabled}
              className={`p-4 text-xl font-medium rounded-xl min-h-touch touch-manipulation transition-colors ${getKeyStyle(key)} border border-gray-200 active:bg-gray-100`}
              onClick={() => handleKey(key)}
            >
              {getKeyLabel(key)}
            </button>
          ))}
        </div>
      )}

      {/* 힌트 */}
      <p className="text-sm text-gray-500 mt-2 text-center">
        {inputHint ?? '분수: 1/2 | 대분수: 1 1/2 (공백으로 구분)'}
      </p>
    </div>
  )
}
