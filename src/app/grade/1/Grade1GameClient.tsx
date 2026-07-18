'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import {
  GameButton,
  GameMap,
  Grade1AssetImage,
  MascotGuide,
  MissionProblemCard,
  RewardCollection,
  RewardReveal,
  getGrade1RewardCounts,
} from '@/components/grade1'
import { AdventureProgressPanel } from '@/components/adventure'
import { grade1Mascots, grade1Objects } from '@/lib/grade1-assets'
import {
  getGrade1MissionById,
  getGrade1Missions,
  type Grade1Mission,
} from '@/lib/grade1-problems'
import {
  createInitialGrade1Progress,
  dismissGrade1Intro,
  loadGrade1Progress,
  recordGrade1Attempt,
  resetGrade1Progress,
  saveGrade1Progress,
  type Grade1Progress,
} from '@/lib/grade1-progress'
import {
  getAdventureLevel,
  getAdventureVariantKey,
  getDailyAdventureSeed,
  getMasteryStars,
} from '@/lib/adventure-progression'

const introGuideItems = [
  {
    title: '그림은 재미 담당',
    body: '캐릭터와 보상은 흥미를 만들고, 정답 판단은 코드로 만든 수학 규칙이 맡아요.',
    asset: grade1Mascots.donggeuriHint,
  },
  {
    title: '큰 터치 버튼',
    body: '스테이지와 보기 버튼은 1학년 손가락으로 누르기 쉽게 크게 만들었어요.',
    asset: grade1Objects.star,
  },
  {
    title: '실패는 다시 도전',
    body: '틀리면 점수를 깎기보다 힌트를 열고 복습섬에 남겨 다시 볼 수 있어요.',
    asset: grade1Mascots.donggeuriRetry,
  },
]

function firstOpenMission(missions: Grade1Mission[], progress: Grade1Progress): Grade1Mission {
  const reviewMission = missions.find((mission) => progress.reviewStageIds.includes(mission.id))
  if (reviewMission) return reviewMission

  const nextPathMission = firstUnlockedIncompleteMission(missions, progress)
  return nextPathMission ?? missions[0] ?? getGrade1MissionById('')
}

function firstUnlockedIncompleteMission(
  missions: Grade1Mission[],
  progress: Grade1Progress
): Grade1Mission | null {
  const firstIncomplete = missions.find((mission, index) => {
    if (progress.completedStageIds.includes(mission.id)) return false
    if (index === 0) return true
    return progress.completedStageIds.includes(missions[index - 1].id)
  })

  return firstIncomplete ?? null
}

function strongestTag(progress: Grade1Progress): string {
  const entries = Object.entries(progress.skillSummaryByTag)
  if (entries.length === 0) return '아직 시작 전'
  return entries
    .slice()
    .sort(([, a], [, b]) => b.correct - a.correct || b.attempted - a.attempted)[0][0]
}

export default function Grade1GameClient() {
  const [replayRound, setReplayRound] = useState(0)
  const missionSeed = useMemo(
    () => getDailyAdventureSeed('grade1', Date.now(), replayRound),
    [replayRound]
  )
  const missions = useMemo(() => getGrade1Missions(missionSeed), [missionSeed])
  const [progress, setProgress] = useState<Grade1Progress>(() =>
    createInitialGrade1Progress()
  )
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [storageRecovered, setStorageRecovered] = useState(false)
  const [selectedMissionId, setSelectedMissionId] = useState(() => missions[0]?.id ?? 'count-cove-01')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [numberAnswer, setNumberAnswer] = useState('')
  const [numberInputError, setNumberInputError] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [wrongAttemptCount, setWrongAttemptCount] = useState(0)
  const [confirmReset, setConfirmReset] = useState(false)

  const recommendedMission = firstOpenMission(missions, progress)
  const nextPathMission = firstUnlockedIncompleteMission(missions, progress)
  const selectedMission =
    missions.find((mission) => mission.id === selectedMissionId) ??
    recommendedMission
  const solved = selectedAnswer === selectedMission.correctAnswer
  const reviewRecommended = progress.reviewStageIds.includes(selectedMission.id)
  const totalMissionCount = missions.length
  const rewardCounts = useMemo(
    () => getGrade1RewardCounts(missions, progress.completedStageIds),
    [missions, progress.completedStageIds]
  )
  const currentRewardCount = solved ? rewardCounts[selectedMission.rewardId] : undefined
  const currentVariantKey = getAdventureVariantKey(selectedMission.id, JSON.stringify([
    selectedMission.prompt,
    selectedMission.correctAnswer,
    selectedMission.choices,
    selectedMission.visualConfig,
  ]))
  const showIntroGuide = progress.introDismissedAt === null

  useEffect(() => {
    const result = loadGrade1Progress()
    const recommended = firstOpenMission(missions, result.progress)
    setProgress(result.progress)
    setStorageAvailable(result.storageAvailable)
    setStorageRecovered((wasRecovered) => wasRecovered || result.recovered)
    setSelectedMissionId((current) =>
      missions.some((mission) => mission.id === current) ? current : recommended.id
    )
  }, [missions])

  useEffect(() => {
    if (typeof window === 'undefined') return
    ;(window as unknown as { render_game_to_text?: () => string }).render_game_to_text = () =>
      JSON.stringify({
        selectedMissionId,
        selectedPrompt: selectedMission.prompt,
        nextPathMissionId: nextPathMission?.id ?? null,
        solved,
        wrongAttemptCount,
        todaySolvedCount: progress.todaySolvedCount,
        reviewCount: progress.reviewStageIds.length,
        introDismissed: progress.introDismissedAt !== null,
        rewardCounts,
        xp: progress.xp,
        level: getAdventureLevel(progress.xp),
        masteryStars: getMasteryStars(progress.masteryByMissionId[selectedMission.id]),
        missionSeed,
      })
  }, [missionSeed, nextPathMission?.id, progress.introDismissedAt, progress.masteryByMissionId, progress.reviewStageIds.length, progress.todaySolvedCount, progress.xp, rewardCounts, selectedMission.id, selectedMission.prompt, selectedMissionId, solved, wrongAttemptCount])

  const persistProgress = (nextProgress: Grade1Progress) => {
    setProgress(nextProgress)
    const saved = saveGrade1Progress(nextProgress)
    setStorageAvailable(saved)
  }

  const dismissIntroGuide = (baseProgress = progress): Grade1Progress => {
    const nextProgress = dismissGrade1Intro(baseProgress)
    if (nextProgress !== baseProgress) {
      persistProgress(nextProgress)
    }
    return nextProgress
  }

  const resetMissionState = () => {
    setSelectedAnswer(null)
    setNumberAnswer('')
    setNumberInputError(null)
    setShowHint(false)
    setWrongAttemptCount(0)
  }

  const selectMission = (missionId: string) => {
    setConfirmReset(false)
    dismissIntroGuide()
    setSelectedMissionId(missionId)
    resetMissionState()
  }

  const scrollToMission = () => {
    document.getElementById('grade1-mission')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const continueToMission = (missionId: string) => {
    selectMission(missionId)
    window.requestAnimationFrame(scrollToMission)
  }

  const resetMission = () => {
    setReplayRound((current) => current + 1)
    resetMissionState()
    scrollToMission()
  }

  const resetAllProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    const nextProgress = resetGrade1Progress()
    setProgress(nextProgress)
    setStorageAvailable(true)
    setStorageRecovered(false)
    setSelectedMissionId(missions[0]?.id ?? selectedMission.id)
    setConfirmReset(false)
    resetMissionState()
  }

  const submitAnswer = (rawAnswer: string) => {
    if (solved) return

    const progressWithIntroDismissed = dismissGrade1Intro(progress)
    const answer = rawAnswer.trim()
    if (selectedMission.answerType === 'number' && !/^\d+$/.test(answer)) {
      if (progressWithIntroDismissed !== progress) {
        persistProgress(progressWithIntroDismissed)
      }
      setNumberInputError('숫자만 써요.')
      return
    }

    setNumberInputError(null)
    const correct = answer === selectedMission.correctAnswer
    setSelectedAnswer(answer)

    if (correct) {
      const nextProgress = recordGrade1Attempt(progressWithIntroDismissed, selectedMission, true, {
        hadHint: wrongAttemptCount > 0,
        wrongAttempts: wrongAttemptCount,
        variantKey: currentVariantKey,
        difficultyBonus: selectedMission.difficulty === 3 ? 5 : 0,
      })
      persistProgress(nextProgress)
      return
    }

    const nextWrongAttemptCount = wrongAttemptCount + 1
    setWrongAttemptCount(nextWrongAttemptCount)
    setShowHint(true)
    persistProgress(recordGrade1Attempt(progressWithIntroDismissed, selectedMission, false, {
      variantKey: currentVariantKey,
      wrongAttempts: nextWrongAttemptCount,
    }))
  }

  return (
    <main className="grade1-game-surface -mx-4 -my-6 min-h-screen px-4 py-5 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="grid gap-5 rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-5 md:grid-cols-[1fr_300px] md:items-center md:p-6">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-full border-2 border-[#e5e5e5] px-4 text-sm font-black text-[#1cb0f6]"
            >
              홈으로
            </Link>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-[#58cc02]">
              1학년 게임 모드
            </p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-[#3c3c3c] md:text-5xl">
              숫자 탐험섬
            </h1>
            <p className="mt-3 max-w-2xl text-lg font-bold leading-relaxed text-[#777777]">
              짧은 미션을 하나씩 풀며 섬 길을 열어요. 틀려도 힌트를 보고
              다시 도전할 수 있어요.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <GameButton
                onClick={() => {
                  continueToMission(recommendedMission.id)
                }}
                data-testid="start-grade1-mission"
              >
                오늘 추천 미션
              </GameButton>
              <GameButton
                variant="secondary"
                onClick={() => setShowHint(true)}
              >
                힌트 먼저 보기
              </GameButton>
              <GameButton
                variant="quiet"
                onClick={resetAllProgress}
                data-testid="grade1-reset-progress"
              >
                {confirmReset ? '한 번 더 누르면 초기화' : '진행 초기화'}
              </GameButton>
            </div>
          </div>

          <MascotGuide
            asset={grade1Mascots.nemoriCheer}
            eyebrow="혼자 10분"
            message={`전체 ${totalMissionCount}개 미션 중 오늘 추천 길을 하나씩 열어요.`}
            tone="success"
          />
        </header>

        {(!storageAvailable || storageRecovered) && (
          <section
            className="rounded-2xl border-2 border-[#ffc700] bg-[#fff8d9] p-4 text-sm font-black text-[#3c3c3c]"
            data-testid="grade1-storage-notice"
          >
            저장 기록을 다시 준비했어요. 지금 푸는 미션은 계속할 수 있어요.
          </section>
        )}

        {showIntroGuide && (
          <section
            className="rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-5 md:p-6"
            data-testid="grade1-intro-guide"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#58cc02]">
                  처음 안내
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#3c3c3c]">
                  이렇게 놀면서 풀어요
                </h2>
              </div>
              <GameButton
                variant="quiet"
                onClick={() => dismissIntroGuide()}
                data-testid="grade1-dismiss-intro"
              >
                안내 닫기
              </GameButton>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {introGuideItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border-2 border-[#e5e5e5] bg-[#fbfffa] p-4"
                >
                  <div className="mb-3 h-16 w-16">
                    <Grade1AssetImage
                      asset={item.asset}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-black text-[#3c3c3c]">{item.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-[#777777]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <AdventureProgressPanel
          progress={progress}
          totalMissionCount={totalMissionCount}
          tone="green"
        />

        <GameMap
          missions={missions}
          progress={progress}
          selectedMissionId={selectedMission.id}
          recommendedMissionId={recommendedMission.id}
          onSelectMission={selectMission}
        />

        <MissionProblemCard
          mission={selectedMission}
          selectedAnswer={selectedAnswer}
          numberAnswer={numberAnswer}
          showHint={showHint}
          wrongAttemptCount={wrongAttemptCount}
          onAnswer={submitAnswer}
          onNumberAnswerChange={(answer) => {
            setNumberAnswer(answer)
            setNumberInputError(null)
          }}
          onShowHint={() => setShowHint(true)}
        />

        {numberInputError && (
          <div
            className="rounded-2xl border-2 border-[#ff4b4b] bg-[#fff2f2] p-4 text-center text-base font-black text-[#3c3c3c]"
            data-testid="grade1-number-error"
          >
            {numberInputError}
          </div>
        )}

        <RewardReveal
          visible={solved}
          mission={selectedMission}
          nextMission={nextPathMission ?? undefined}
          reviewRecommended={reviewRecommended}
          rewardCount={currentRewardCount}
          onReset={resetMission}
          onNextMission={
            nextPathMission
              ? () => continueToMission(nextPathMission.id)
              : undefined
          }
          onOpenMap={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        <section
          className="grid gap-4 rounded-[2rem] border-2 border-[#e5e5e5] bg-white p-5 md:grid-cols-[1fr_1fr_1fr] md:p-6"
          data-testid="parent-summary"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#58cc02]">
              오늘 기록
            </p>
            <p className="mt-2 text-2xl font-black text-[#3c3c3c]">
              {progress.todaySolvedCount}개 해결
            </p>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1cb0f6]">
              잘한 영역
            </p>
            <p className="mt-2 text-lg font-black text-[#3c3c3c]">
              {strongestTag(progress)}
            </p>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#ffc700]">
              다시 볼 미션
            </p>
            <p className="mt-2 text-lg font-black text-[#3c3c3c]">
              {progress.reviewStageIds.length}개
            </p>
          </div>
        </section>

        <RewardCollection
          missions={missions}
          completedStageIds={progress.completedStageIds}
          highlightRewardId={solved ? selectedMission.rewardId : undefined}
        />
      </div>
    </main>
  )
}
