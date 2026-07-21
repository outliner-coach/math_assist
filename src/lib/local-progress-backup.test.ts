import { describe, expect, it } from 'vitest'

import {
  LOCAL_PROGRESS_BACKUP_PREFIX,
  createLocalProgressBackup,
  previewLocalProgressRestore,
  restoreLocalProgressBackup,
  type MutableLocalProgressStorage,
} from './local-progress-backup'

function storage(initial: Record<string, string> = {}): MutableLocalProgressStorage & {
  values: Map<string, string>
} {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, value) },
    removeItem(key) { values.delete(key) },
  }
}

describe('local progress backup', () => {
  it('captures the exact known progress payloads without account secrets', () => {
    const local = storage({
      mathAssist_grade1Progress: '{"completedStageIds":["a"]}',
      mathAssist_grade4Progress: '{"completedVariantKeys":["g4-a"]}',
      mathAssist_grade6Progress: '{"completedActivityIds":["g6-a"]}',
      mathAssist_grade6CurrentSession: '{"sessionId":"g6-s1"}',
      mathAssist_grade6LastResult: '{"userAnswer":"raw-answer"}',
      mathAssist_currentSession: '{"sessionId":"s1"}',
      unrelated: 'keep',
      learnerPin: '1234',
    })
    const result = createLocalProgressBackup(local, 1_721_520_000_000)

    expect(result.status).toBe('saved')
    expect(result.backupKey).toBe(`${LOCAL_PROGRESS_BACKUP_PREFIX}1721520000000`)
    const raw = local.getItem(result.backupKey!)!
    expect(raw).toContain('mathAssist_grade1Progress')
    expect(raw).toContain('mathAssist_grade6Progress')
    expect(raw).toContain('mathAssist_grade6CurrentSession')
    expect(raw).not.toContain('mathAssist_grade6LastResult')
    expect(raw).not.toContain('raw-answer')
    expect(raw).toContain('mathAssist_currentSession')
    expect(raw).toContain('mathAssist_grade4Progress')
    expect(raw).not.toContain('learnerPin')
    expect(raw).not.toContain('1234')
    expect(local.getItem('unrelated')).toBe('keep')
  })

  it('previews and explicitly restores exact values including previously missing keys', () => {
    const local = storage({ mathAssist_grade2Progress: '{"old":true}' })
    const backup = createLocalProgressBackup(local, 100)
    expect(backup.status).toBe('saved')

    local.setItem('mathAssist_grade2Progress', '{"new":true}')
    local.setItem('mathAssist_grade3Progress', '{"added":true}')

    const preview = previewLocalProgressRestore(local, backup.backupKey!)
    expect(preview).toMatchObject({ valid: true, changedKeys: ['mathAssist_grade2Progress', 'mathAssist_grade3Progress'] })
    expect(restoreLocalProgressBackup(local, backup.backupKey!)).toEqual({ status: 'restored', restoredKeys: 10 })
    expect(local.getItem('mathAssist_grade2Progress')).toBe('{"old":true}')
    expect(local.getItem('mathAssist_grade3Progress')).toBeNull()
  })

  it('does not mutate learning records when a backup is corrupt or storage fails', () => {
    const local = storage({
      mathAssist_grade1Progress: '{"keep":true}',
      badBackup: '{bad json',
    })
    expect(restoreLocalProgressBackup(local, 'badBackup')).toEqual({ status: 'invalid', restoredKeys: 0 })
    expect(local.getItem('mathAssist_grade1Progress')).toBe('{"keep":true}')

    const failing = storage({ mathAssist_grade1Progress: '{"keep":true}' })
    failing.setItem = () => { throw new Error('quota') }
    expect(createLocalProgressBackup(failing, 200)).toEqual({ status: 'failed', backupKey: null })
    expect(failing.getItem('mathAssist_grade1Progress')).toBe('{"keep":true}')
  })
})
