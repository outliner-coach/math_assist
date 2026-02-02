'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'

interface MathTextProps {
  children: string
  className?: string
  block?: boolean
}

export default function MathText({ children, className = '', block = false }: MathTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // $...$ 패턴을 찾아서 KaTeX로 렌더링
    const text = children
    const parts: (string | { math: string })[] = []
    let lastIndex = 0

    const regex = /\$([^$]+)\$/g
    let match

    while ((match = regex.exec(text)) !== null) {
      // 이전 텍스트 부분
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      // 수학 부분
      parts.push({ math: match[1] })
      lastIndex = regex.lastIndex
    }

    // 남은 텍스트
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    // 렌더링
    containerRef.current.innerHTML = ''

    parts.forEach(part => {
      if (typeof part === 'string') {
        containerRef.current!.appendChild(document.createTextNode(part))
      } else {
        const span = document.createElement('span')
        try {
          katex.render(part.math, span, {
            throwOnError: false,
            displayMode: block,
          })
        } catch {
          span.textContent = `$${part.math}$`
        }
        containerRef.current!.appendChild(span)
      }
    })
  }, [children, block])

  return <span ref={containerRef} className={className} />
}
