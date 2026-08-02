export interface AdventureViewTime {
  replayRound: number
  seedNow: number
  progressNow: number
}

export function captureAdventureViewTime(
  replayRound: number,
  now: number,
): AdventureViewTime {
  return { replayRound, seedNow: now, progressNow: now }
}

export function captureAdventureReplayTime(
  replayRound: number,
  now: number,
): AdventureViewTime {
  return captureAdventureViewTime(replayRound, now)
}

export function refreshAdventureProgressTime(
  current: AdventureViewTime,
  now: number,
): AdventureViewTime {
  return { ...current, progressNow: now }
}
