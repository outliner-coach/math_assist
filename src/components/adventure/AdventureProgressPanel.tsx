import React from 'react'

import {
  ADVENTURE_DAILY_GOAL,
  ADVENTURE_XP_PER_LEVEL,
  getAdventureAchievements,
  getAdventureLevel,
  getLearningStreak,
  getMasteryStars,
  type AdventureState,
} from '@/lib/adventure-progression'

interface AdventureProgressPanelProps {
  progress: AdventureState & { todaySolvedCount: number }
  totalMissionCount: number
  tone?: 'green' | 'blue'
  now?: number
}

const achievementNames = {
  'first-step': '첫걸음',
  'level-2': '성장 시작',
  'daily-treasure': '오늘의 보물',
  'three-day-journey': '3일 탐험',
  'mastery-collector': '별 수집가',
}

export default function AdventureProgressPanel({
  progress,
  totalMissionCount,
  tone = 'green',
  now = Date.now(),
}: AdventureProgressPanelProps) {
  const level = getAdventureLevel(progress.xp)
  const levelXp = progress.xp % ADVENTURE_XP_PER_LEVEL
  const streak = getLearningStreak(progress.learningDates, now)
  const totalStars = Object.values(progress.masteryByMissionId)
    .reduce((sum, mastery) => sum + getMasteryStars(mastery), 0)
  const achievements = getAdventureAchievements(progress, now)
  const accent = tone === 'green' ? '#58cc02' : '#2563eb'
  const soft = tone === 'green' ? '#f0ffe7' : '#eff6ff'

  return (
    <section
      className="rounded-[2rem] border-2 border-[#d8e3ef] bg-white p-5 md:p-6"
      data-testid="adventure-progress-panel"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: accent }}>
            나의 성장
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#0f172a]">레벨 {level} 탐험가</h2>
        </div>
        <p className="text-sm font-bold text-[#64748b]">새 문제를 풀고 XP와 별을 모아요.</p>
      </div>

      <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#e5e7eb]" aria-label={`레벨 경험치 ${levelXp}/${ADVENTURE_XP_PER_LEVEL}`}>
        <div className="h-full rounded-full transition-all" style={{ width: `${levelXp}%`, backgroundColor: accent }} />
      </div>
      <p className="mt-2 text-right text-xs font-black text-[#64748b]">XP {progress.xp} · 다음 레벨까지 {ADVENTURE_XP_PER_LEVEL - levelXp}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['오늘의 보물', `${Math.min(progress.todaySolvedCount, ADVENTURE_DAILY_GOAL)}/${ADVENTURE_DAILY_GOAL}`, 'daily-goal'],
          ['연속 학습', `${streak}일`, 'learning-streak'],
          ['숙련도 별', `${totalStars}/${totalMissionCount * 3}`, 'mastery-stars'],
          ['새 문제 기록', `${progress.solvedVariantKeys.length}개`, 'variant-count'],
        ].map(([label, value, testId]) => (
          <div key={label} className="rounded-2xl border-2 border-[#e5e7eb] p-4 text-center" style={{ backgroundColor: soft }}>
            <p className="text-xs font-black text-[#64748b]">{label}</p>
            <p className="mt-1 text-2xl font-black text-[#0f172a]" data-testid={testId}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" data-testid="achievement-list">
        {Object.entries(achievementNames).map(([id, label]) => {
          const unlocked = achievements.includes(id as keyof typeof achievementNames)
          return (
            <span
              key={id}
              className={`rounded-full border-2 px-3 py-1 text-xs font-black ${
                unlocked ? 'border-[#ffc700] bg-[#fff8d9] text-[#854d0e]' : 'border-[#e5e7eb] bg-[#f8fafc] text-[#94a3b8]'
              }`}
              aria-label={`${label} ${unlocked ? '획득' : '잠김'}`}
            >
              {unlocked ? '★' : '☆'} {label}
            </span>
          )
        })}
      </div>
    </section>
  )
}
