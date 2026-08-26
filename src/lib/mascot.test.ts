import { describe, expect, it, vi } from 'vitest'

import { LOCAL_PROFILE_REGISTRY_KEY, createInitialLocalProfileRegistry } from './local-profile'
import {
  DEFAULT_MASCOT_ID,
  MASCOT_PREFERENCE_KEY,
  loadMascotPreference,
  mascotReactionForAnswer,
  saveMascotPreference,
} from './mascot'

function storageWith(value: string | null) {
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn(),
  }
}

describe('mascot preference', () => {
  it('loads only the approved trio and keeps malformed values read-only', () => {
    expect(loadMascotPreference(storageWith(JSON.stringify({ avatarId: 'lumi' })))).toBe('lumi')
    expect(loadMascotPreference(storageWith(JSON.stringify({ avatarId: 'unknown' })))).toBe(DEFAULT_MASCOT_ID)
    expect(loadMascotPreference(storageWith('{broken'))).toBe(DEFAULT_MASCOT_ID)
  })

  it('stores only the selected avatar id in the device-local preference', () => {
    const storage = storageWith(null)

    expect(saveMascotPreference('moa', storage)).toBe(true)
    expect(storage.setItem).toHaveBeenCalledWith(
      MASCOT_PREFERENCE_KEY,
      JSON.stringify({ avatarId: 'moa' }),
    )
  })

  it('derives presentation reactions without changing answer meaning', () => {
    expect(mascotReactionForAnswer(null)).toBe('think')
    expect(mascotReactionForAnswer(false)).toBe('recover')
    expect(mascotReactionForAnswer(true)).toBe('celebrate')
  })
})

describe('mascot preference learner bootstrap routing', () => {
  const BOOTSTRAP_PROFILE_A = 'local_00000000-0000-4000-8000-000000000001'

  it('routes the default storage source through the learner bootstrap adapter', () => {
    const values = new Map<string, string>()
    const base = {
      get length() { return values.size },
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
      removeItem: (key: string) => { values.delete(key) },
    }
    values.set(LOCAL_PROFILE_REGISTRY_KEY, JSON.stringify(createInitialLocalProfileRegistry({
      now: () => 1,
      randomUUID: () => '00000000-0000-4000-8000-000000000001',
      migrationStatus: 'not-needed',
    })))
    vi.stubGlobal('window', { localStorage: base })

    expect(saveMascotPreference('lumi')).toBe(true)
    expect(values.get(`mathAssist_profile_v1:${BOOTSTRAP_PROFILE_A}:${MASCOT_PREFERENCE_KEY}`))
      .toBe(JSON.stringify({ avatarId: 'lumi' }))
    expect(values.has(MASCOT_PREFERENCE_KEY)).toBe(false)
    expect(loadMascotPreference()).toBe('lumi')
    vi.unstubAllGlobals()
  })
})
