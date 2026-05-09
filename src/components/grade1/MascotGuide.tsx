'use client'

import React from 'react'
import {
  grade1Mascots,
  type Grade1Asset,
} from '@/lib/grade1-assets'

import Grade1AssetImage from './Grade1AssetImage'

interface MascotGuideProps {
  asset?: Grade1Asset
  eyebrow?: string
  message: string
  tone?: 'neutral' | 'hint' | 'success'
}

const toneStyles = {
  neutral: 'border-[#e5e5e5] bg-white',
  hint: 'border-[#ffc700] bg-[#fff8d9]',
  success: 'border-[#58cc02] bg-[#f0ffe7]',
}

export default function MascotGuide({
  asset = grade1Mascots.donggeuriDefault,
  eyebrow = '탐험 친구',
  message,
  tone = 'neutral',
}: MascotGuideProps) {
  return (
    <aside
      className={`flex items-center gap-4 rounded-2xl border-2 p-4 ${toneStyles[tone]}`}
      data-testid="mascot-guide"
    >
      <div className="h-20 w-20 shrink-0">
        <Grade1AssetImage
          asset={asset}
          className="h-full w-full object-contain"
          fallback={
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1cb0f6] text-3xl font-black text-white">
              ?
            </div>
          }
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#58cc02]">
          {eyebrow}
        </p>
        <p className="mt-1 text-lg font-black leading-snug text-[#3c3c3c]">
          {message}
        </p>
      </div>
    </aside>
  )
}
