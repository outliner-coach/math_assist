import { describe, expect, it } from 'vitest'

import {
  STORAGE_UNAVAILABLE_WARNING,
  classifyStorageError,
} from './storage-health'

describe('STORAGE_UNAVAILABLE_WARNING', () => {
  it('uses the agreed learner-facing sentence', () => {
    expect(STORAGE_UNAVAILABLE_WARNING).toBe(
      '학습은 계속되지만 기록이 남지 않을 수 있어요.',
    )
  })
})

describe('classifyStorageError', () => {
  it.each([
    ['write', new DOMException('full', 'QuotaExceededError')],
    ['read', new DOMException('full', 'QuotaExceededError')],
  ] as const)('maps quota errors during %s to a storage kind', (operation, error) => {
    expect(classifyStorageError(error, operation)).toBe(`storage-${operation}`)
  })

  it('maps security errors through the attempted operation', () => {
    const error = new DOMException('blocked', 'SecurityError')
    expect(classifyStorageError(error, 'write')).toBe('storage-write')
    expect(classifyStorageError(error, 'read')).toBe('storage-read')
  })

  it('recognizes legacy quota signals', () => {
    const chromeLegacy = { name: 'DOMException', code: 22 }
    const firefoxLegacy = { name: 'DOMException', code: 1014 }
    const firefoxName = { name: 'NS_ERROR_DOM_QUOTA_REACHED', code: 0 }
    expect(classifyStorageError(chromeLegacy, 'write')).toBe('storage-write')
    expect(classifyStorageError(firefoxLegacy, 'read')).toBe('storage-read')
    expect(classifyStorageError(firefoxName, 'write')).toBe('storage-write')
  })

  it('falls back to unknown for unrelated failures', () => {
    expect(classifyStorageError(new Error('boom'), 'write')).toBe('unknown')
    expect(classifyStorageError(null, 'read')).toBe('unknown')
    expect(classifyStorageError(undefined, 'write')).toBe('unknown')
  })
})
