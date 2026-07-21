import { describe, expect, it, vi } from 'vitest'

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
