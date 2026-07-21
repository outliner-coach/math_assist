export const MASCOT_PREFERENCE_KEY = 'mathAssist_mascot_v1'
export const MASCOT_REACTION_EVENT = 'math-assist:mascot-reaction'
export const MASCOT_SELECTION_EVENT = 'math-assist:mascot-selection'

export const MASCOT_IDS = ['suri', 'moa', 'lumi'] as const
export type MascotId = (typeof MASCOT_IDS)[number]

export const MASCOT_STATES = ['welcome', 'think', 'hint', 'recover', 'celebrate'] as const
export type MascotState = (typeof MASCOT_STATES)[number]

export const DEFAULT_MASCOT_ID: MascotId = 'suri'

export const MASCOT_PROFILES: Record<MascotId, {
  name: string
  animal: string
  role: string
  asset: string
  surface: string
}> = {
  suri: {
    name: '수리',
    animal: '수달',
    role: '호기심 많은 탐험 안내자',
    asset: 'suri-states.png',
    surface: '#f8fff7',
  },
  moa: {
    name: '모아',
    animal: '부엉이',
    role: '차분한 풀이 전략 친구',
    asset: 'moa-states.png',
    surface: '#f7faff',
  },
  lumi: {
    name: '루미',
    animal: '여우',
    role: '용기를 북돋는 도전 파트너',
    asset: 'lumi-states.png',
    surface: '#fff9f2',
  },
}

export const MASCOT_STATE_LABELS: Record<MascotState, string> = {
  welcome: '반갑게 맞이하는 모습',
  think: '함께 생각하는 모습',
  hint: '힌트를 알려 주는 모습',
  recover: '다시 도전하자고 격려하는 모습',
  celebrate: '학습을 축하하는 모습',
}

export const MASCOT_STATE_MESSAGES: Record<MascotState, string> = {
  welcome: '반가워요! 오늘도 한 문제씩 시작해요.',
  think: '천천히 생각해도 괜찮아요.',
  hint: '힌트에서 다음 한 걸음을 찾아봐요.',
  recover: '틀린 답도 좋은 단서예요. 다시 살펴봐요.',
  celebrate: '좋아요! 생각한 방법이 힘이 됐어요.',
}

interface MascotStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function browserStorage(): MascotStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function isMascotId(value: unknown): value is MascotId {
  return typeof value === 'string' && MASCOT_IDS.includes(value as MascotId)
}

export function loadMascotPreference(storage: MascotStorage | null = browserStorage()): MascotId {
  if (!storage) return DEFAULT_MASCOT_ID
  try {
    const parsed = JSON.parse(storage.getItem(MASCOT_PREFERENCE_KEY) ?? 'null') as { avatarId?: unknown } | null
    return isMascotId(parsed?.avatarId) ? parsed.avatarId : DEFAULT_MASCOT_ID
  } catch {
    return DEFAULT_MASCOT_ID
  }
}

export function saveMascotPreference(
  mascotId: MascotId,
  storage: MascotStorage | null = browserStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(MASCOT_PREFERENCE_KEY, JSON.stringify({ avatarId: mascotId }))
    return true
  } catch {
    return false
  }
}

export function getMascotAssetPath(mascotId: MascotId): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  return `${basePath}/assets/mascots/${MASCOT_PROFILES[mascotId].asset}`
}

export function mascotReactionForAnswer(correct: boolean | null): MascotState {
  if (correct === null) return 'think'
  return correct ? 'celebrate' : 'recover'
}

export function dispatchMascotReaction(state: MascotState): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<MascotState>(MASCOT_REACTION_EVENT, { detail: state }))
}

export function dispatchMascotSelection(mascotId: MascotId): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<MascotId>(MASCOT_SELECTION_EVENT, { detail: mascotId }))
}
