'use client'

import React from 'react'
import { grade1MapAssets } from '@/lib/grade1-assets'

import Grade1AssetImage from './Grade1AssetImage'

export type StageStatus = 'open' | 'complete' | 'locked' | 'review'

interface StageNodeProps {
  stageId?: string
  title: string
  subtitle: string
  status: StageStatus
  index: number
  selected?: boolean
  recommended?: boolean
  masteryStars?: 0 | 1 | 2 | 3
  onSelect?: () => void
}

const statusAsset = {
  open: grade1MapAssets.stageOpen,
  complete: grade1MapAssets.stageComplete,
  locked: grade1MapAssets.stageLocked,
  review: grade1MapAssets.stageOpen,
}

const statusLabel = {
  open: '도전 가능',
  complete: '완료',
  locked: '잠김',
  review: '복습 추천',
}

const statusStyle = {
  open: 'border-[#1cb0f6] bg-white',
  complete: 'border-[#58cc02] bg-[#f0ffe7]',
  locked: 'border-[#e5e5e5] bg-[#f7f7f7] opacity-75',
  review: 'border-[#ffc700] bg-[#fff8d9]',
}

export default function StageNode({
  stageId,
  title,
  subtitle,
  status,
  index,
  selected = false,
  recommended = false,
  masteryStars = 0,
  onSelect,
}: StageNodeProps) {
  const disabled = status === 'locked'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      data-testid={`stage-node-${index}`}
      data-stage-id={stageId}
      className={`grid min-h-[88px] grid-cols-[56px_1fr] items-center gap-3 rounded-2xl border-2 p-3 text-left transition hover:-translate-y-0.5 disabled:hover:translate-y-0 ${
        selected ? 'ring-4 ring-[#d7ffb8]' : ''
      } ${statusStyle[status]}`}
    >
      <div className="relative h-14 w-14">
        <Grade1AssetImage
          asset={statusAsset[status]}
          className="h-full w-full object-contain"
          fallback={
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#1cb0f6] text-xl font-black text-white">
              {index}
            </span>
          }
        />
        {status !== 'complete' && (
          <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-white">
            {index}
          </span>
        )}
      </div>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-xs font-black text-[#777777]">
          <span>{recommended ? '오늘 추천' : statusLabel[status]}</span>
          {selected && <span className="rounded-full bg-[#d7ffb8] px-2 py-0.5 text-[#3c3c3c]">선택됨</span>}
        </span>
        <span className="mt-1 block text-base font-black leading-tight text-[#3c3c3c]">
          {title}
        </span>
        <span className="mt-1 block text-sm font-bold leading-snug text-[#777777]">
          {subtitle}
        </span>
        <span className="mt-1 block text-sm font-black tracking-[0.12em] text-[#f59e0b]" aria-label={`숙련도 별 ${masteryStars}개`}>
          {'★'.repeat(masteryStars)}{'☆'.repeat(3 - masteryStars)}
        </span>
      </span>
    </button>
  )
}
