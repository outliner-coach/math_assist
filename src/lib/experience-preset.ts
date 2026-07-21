export type ExperienceAgeBand = 'play' | 'bridge' | 'study'
export type MascotMode = 'full' | 'companion' | 'coach'
export type RewardCadence = 'mission' | 'chapter' | 'mastery'
export type TextDensity = 'low' | 'medium' | 'high'

export interface ExperiencePreset {
  ageBand: ExperienceAgeBand
  minItems: number
  defaultItems: number
  maxItems: number
  mascotMode: MascotMode
  rewardCadence: RewardCadence
  textDensity: TextDensity
  baseScratchTools: readonly ['pen', 'eraser', 'undo', 'clear']
  supportToolLimit: 1
}

const BASE_SCRATCH_TOOLS = Object.freeze([
  'pen',
  'eraser',
  'undo',
  'clear',
] as const)

const PLAY_PRESET: ExperiencePreset = Object.freeze({
  ageBand: 'play',
  minItems: 1,
  defaultItems: 1,
  maxItems: 3,
  mascotMode: 'full',
  rewardCadence: 'mission',
  textDensity: 'low',
  baseScratchTools: BASE_SCRATCH_TOOLS,
  supportToolLimit: 1,
})

const BRIDGE_PRESET: ExperiencePreset = Object.freeze({
  ageBand: 'bridge',
  minItems: 3,
  defaultItems: 3,
  maxItems: 5,
  mascotMode: 'companion',
  rewardCadence: 'chapter',
  textDensity: 'medium',
  baseScratchTools: BASE_SCRATCH_TOOLS,
  supportToolLimit: 1,
})

const STUDY_PRESET: ExperiencePreset = Object.freeze({
  ageBand: 'study',
  minItems: 5,
  defaultItems: 5,
  maxItems: 10,
  mascotMode: 'coach',
  rewardCadence: 'mastery',
  textDensity: 'high',
  baseScratchTools: BASE_SCRATCH_TOOLS,
  supportToolLimit: 1,
})

export function resolveExperiencePreset(grade: number): ExperiencePreset {
  if (grade === 1 || grade === 2) return PLAY_PRESET
  if (grade === 3 || grade === 4) return BRIDGE_PRESET
  if (grade === 5 || grade === 6) return STUDY_PRESET
  throw new RangeError(`Unsupported grade: ${grade}`)
}
