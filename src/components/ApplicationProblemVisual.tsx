import React, { type CSSProperties, type ReactElement } from 'react'

import type {
  ApplicationVisualContent,
  ApplicationVisualPrimitive,
} from '../lib/application-problems/visual-model'
import type { ValidatedApplicationVisualScene } from '../lib/application-problems/visual-validator'

interface ApplicationProblemVisualProps {
  scene: ValidatedApplicationVisualScene
  showAnswer?: boolean
}

const diagramStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: '42rem',
  height: 'auto',
  marginInline: 'auto',
}

const palette = {
  primary: { stroke: '#2563eb', fill: '#dbeafe' },
  secondary: { stroke: '#0f766e', fill: '#ccfbf1' },
  accent: { stroke: '#c2410c', fill: '#ffedd5' },
  muted: { stroke: '#64748b', fill: '#f1f5f9' },
} as const

function isPublicDisclosure(disclosure: ApplicationVisualPrimitive['disclosure']): boolean {
  return disclosure === 'given' || disclosure === 'identifier'
}

function visibleContent(content: ApplicationVisualContent, showAnswer: boolean): string | null {
  if (showAnswer && content.after) return content.after.text
  return content.before?.text ?? null
}

function primitiveClassName(primitive: ApplicationVisualPrimitive): string {
  return [
    'application-visual__primitive',
    `application-visual__primitive--${primitive.styleRole}`,
    primitive.emphasis === 'answer' ? 'application-visual--answer' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function isCompactDiagram(scene: Extract<ValidatedApplicationVisualScene, { surface: 'diagram' }>): boolean {
  return scene.viewBox.width <= 32 && scene.viewBox.height <= 32
}

function diagramLabelFontSize(
  scene: Extract<ValidatedApplicationVisualScene, { surface: 'diagram' }>,
): number {
  if (isCompactDiagram(scene)) return Math.min(1.4, Math.max(1, scene.viewBox.width / 20))
  return Math.min(20, Math.max(13, scene.viewBox.width / 18))
}

function renderPrimitive(primitive: ApplicationVisualPrimitive): ReactElement {
  const colors = palette[primitive.styleRole]
  const common = {
    className: primitiveClassName(primitive),
    'data-application-visual-primitive': primitive.key,
    stroke: colors.stroke,
    strokeWidth: primitive.emphasis === 'answer' ? 3 : 2,
    vectorEffect: 'non-scaling-stroke' as const,
  }
  if (primitive.kind === 'line') {
    return (
      <line
        key={primitive.key}
        {...common}
        x1={primitive.x1}
        y1={primitive.y1}
        x2={primitive.x2}
        y2={primitive.y2}
      />
    )
  }
  if (primitive.kind === 'rect') {
    return (
      <rect
        key={primitive.key}
        {...common}
        x={primitive.x}
        y={primitive.y}
        width={primitive.width}
        height={primitive.height}
        fill={colors.fill}
        fillOpacity={0.65}
      />
    )
  }
  if (primitive.kind === 'circle') {
    return (
      <circle
        key={primitive.key}
        {...common}
        cx={primitive.cx}
        cy={primitive.cy}
        r={primitive.radius}
        fill={colors.fill}
        fillOpacity={0.65}
      />
    )
  }
  const points = primitive.points.map((point) => `${point.x},${point.y}`).join(' ')
  if (primitive.kind === 'polygon') {
    return (
      <polygon
        key={primitive.key}
        {...common}
        points={points}
        fill={colors.fill}
        fillOpacity={0.65}
      />
    )
  }
  return <polyline key={primitive.key} {...common} points={points} fill="none" />
}

function ApplicationDiagram({
  scene,
  showAnswer,
}: {
  scene: Extract<ValidatedApplicationVisualScene, { surface: 'diagram' }>
  showAnswer: boolean
}) {
  const description = scene.description
    ? visibleContent(scene.description, showAnswer)
    : null
  const visibleLabels = scene.labels.flatMap((label) => {
    const text = visibleContent(label.content, showAnswer)
    return text === null ? [] : [{ label, text }]
  })
  const accessibleName =
    [description, ...visibleLabels.map(({ text }) => text)].filter((text): text is string => Boolean(text)).join('. ') ||
    '문제 풀이를 돕는 그림'
  const compact = isCompactDiagram(scene)
  const fontSize = diagramLabelFontSize(scene)
  const lineHeight = fontSize * 1.65
  const renderedHeight = compact
    ? scene.viewBox.height + 1 + lineHeight * visibleLabels.length
    : scene.viewBox.height
  return (
    <svg
      className="application-visual application-visual__diagram"
      viewBox={`0 0 ${scene.viewBox.width} ${renderedHeight}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={accessibleName}
      style={diagramStyle}
    >
      <title>{accessibleName}</title>
      {scene.primitives
        .filter((primitive) => showAnswer || isPublicDisclosure(primitive.disclosure))
        .map(renderPrimitive)}
      {visibleLabels.map(({ label, text }, labelIndex) => {
        return (
          <text
            key={label.key}
            className={`application-visual__label application-visual__label--${label.styleRole}`}
            data-application-visual-label={label.key}
            data-application-visual-target={label.targetKey}
            fontSize={fontSize}
            x={compact ? scene.viewBox.width / 2 : label.x}
            y={compact ? scene.viewBox.height + 1 + lineHeight * (labelIndex + 0.5) : label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={palette[label.styleRole].stroke}
          >
            {text}
          </text>
        )
      })}
    </svg>
  )
}

function ApplicationTable({
  scene,
  showAnswer,
}: {
  scene: Extract<ValidatedApplicationVisualScene, { surface: 'table' }>
  showAnswer: boolean
}) {
  return (
    <table className="application-visual application-visual__table">
      <caption>{visibleContent(scene.caption, showAnswer)}</caption>
      <thead>
        <tr>
          {scene.columns.map((column, index) => (
            <th key={index} scope="col">
              {visibleContent(column, showAnswer)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {scene.rows.map((row) => (
          <tr key={row.key}>
            {row.cells.map((cell, index) => (
              <td key={index}>{visibleContent(cell, showAnswer)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ApplicationProblemVisual({
  scene,
  showAnswer = false,
}: ApplicationProblemVisualProps) {
  if (scene.surface === 'diagram') {
    return <ApplicationDiagram scene={scene} showAnswer={showAnswer} />
  }
  return <ApplicationTable scene={scene} showAnswer={showAnswer} />
}
