'use client'

import React from 'react'
import { grade1MapAssets } from '@/lib/grade1-assets'

import Grade1AssetImage from './Grade1AssetImage'

export type StageStatus = 'open' | 'complete' | 'locked' | 'review'

interface StageNodeProps {
  title: string
  subtitle: string
  status: StageStatus
  index: number
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
  title,
  subtitle,
  status,
  index,
  onSelect,
}: StageNodeProps) {
  const disabled = status === 'locked'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      data-testid={`stage-node-${index}`}
      className={`grid min-h-[88px] grid-cols-[56px_1fr] items-center gap-3 rounded-2xl border-2 p-3 text-left transition hover:-translate-y-0.5 disabled:hover:translate-y-0 ${statusStyle[status]}`}
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
        <span className="block text-xs font-black text-[#777777]">
          {statusLabel[status]}
        </span>
        <span className="mt-1 block text-base font-black leading-tight text-[#3c3c3c]">
          {title}
        </span>
        <span className="mt-1 block text-sm font-bold leading-snug text-[#777777]">
          {subtitle}
        </span>
      </span>
    </button>
  )
}
