import type { ErrorKind } from './error-reporting'

export type StorageOperation = 'read' | 'write'

export type StorageHealthKind = Extract<
  ErrorKind,
  'storage-read' | 'storage-write' | 'unknown'
>

export const STORAGE_UNAVAILABLE_WARNING =
  '학습은 계속되지만 기록이 남지 않을 수 있어요.'

const QUOTA_ERROR_NAMES = new Set([
  'QuotaExceededError',
  'NS_ERROR_DOM_QUOTA_REACHED',
])

const LEGACY_QUOTA_CODES = new Set([22, 1014])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function classifyStorageError(
  error: unknown,
  operation: StorageOperation,
): StorageHealthKind {
  if (!isRecord(error)) return 'unknown'
  const name = typeof error.name === 'string' ? error.name : ''
  const code = typeof error.code === 'number' ? error.code : Number.NaN
  const isQuota = QUOTA_ERROR_NAMES.has(name) || LEGACY_QUOTA_CODES.has(code)
  const isSecurity = name === 'SecurityError'
  if (isQuota || isSecurity) {
    return operation === 'write' ? 'storage-write' : 'storage-read'
  }
  return 'unknown'
}
