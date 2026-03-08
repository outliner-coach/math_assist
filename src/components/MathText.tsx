import React, { Fragment } from 'react'
import katex from 'katex'

interface MathTextProps {
  children: string
  className?: string
  block?: boolean
}

type MathSegment =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string }

function splitMathSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = []
  let lastIndex = 0
  const regex = /\$([^$]+)\$/g
  let match: RegExpExecArray | null = null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }

    segments.push({ type: 'math', value: match[1] })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: text })
  }

  return segments
}

export default function MathText({ children, className = '', block = false }: MathTextProps) {
  const parts = splitMathSegments(children)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <Fragment key={`text-${index}`}>{part.value}</Fragment>
        }

        try {
          const html = katex.renderToString(part.value, {
            throwOnError: false,
            displayMode: block,
          })

          return (
            <span
              key={`math-${index}`}
              className={block ? 'block overflow-x-auto py-1' : ''}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        } catch {
          return <Fragment key={`math-${index}`}>{`$${part.value}$`}</Fragment>
        }
      })}
    </span>
  )
}
