'use client'

import {
  MASCOT_IDS,
  MASCOT_PROFILES,
  type MascotId,
} from '@/lib/mascot'

import MascotCharacter from './MascotCharacter'

interface MascotPickerProps {
  selected: MascotId
  onSelect: (mascotId: MascotId) => void
}

export default function MascotPicker({ selected, onSelect }: MascotPickerProps) {
  return (
    <section className="rounded-[2rem] border-2 border-[#e2e8f0] bg-white p-5 md:p-7" data-testid="mascot-picker">
      <div className="text-center">
        <p className="text-sm font-black text-[#0f766e]">나의 수학 친구</p>
        <h2 className="mt-1 text-2xl font-black text-[#0f172a]">함께 공부할 친구를 골라요</h2>
        <p className="mt-2 text-sm font-bold text-[#64748b]">언제든 바꿀 수 있고, 정답과 진도에는 영향을 주지 않아요.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {MASCOT_IDS.map((mascotId) => {
          const profile = MASCOT_PROFILES[mascotId]
          const active = mascotId === selected
          return (
            <button
              key={mascotId}
              type="button"
              onClick={() => onSelect(mascotId)}
              aria-pressed={active}
              data-testid={`choose-mascot-${mascotId}`}
              className="flex min-h-[210px] items-center gap-4 rounded-3xl border-2 p-4 text-left transition hover:-translate-y-0.5 sm:flex-col sm:text-center"
              style={{
                borderColor: active ? '#0f766e' : '#e2e8f0',
                backgroundColor: active ? profile.surface : '#ffffff',
                boxShadow: active ? '0 5px 0 #99f6e4' : undefined,
              }}
            >
              <MascotCharacter mascotId={mascotId} state="welcome" mode="coach" className="shrink-0" />
              <span>
                <span className="block text-xl font-black text-[#0f172a]">{profile.name} <small className="text-sm text-[#64748b]">{profile.animal}</small></span>
                <span className="mt-1 block text-sm font-bold leading-5 text-[#64748b]">{profile.role}</span>
                <span className="mt-2 block text-sm font-black text-[#0f766e]">{active ? '함께 공부하는 중' : '선택하기'}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
