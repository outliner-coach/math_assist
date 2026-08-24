import type { Page } from '@playwright/test'

import {
  isLearnerOwnedStorageKey,
  PROFILE_SCOPED_STORAGE_PREFIX,
} from '../src/lib/profile-scoped-storage'
import { LOCAL_PROFILE_REGISTRY_KEY } from '../src/lib/local-profile'

function requireLearnerKey(key: string): void {
  if (!isLearnerOwnedStorageKey(key)) {
    throw new TypeError(`E2E storage key is not learner-owned: ${key}`)
  }
}

export async function activeLearnerStorageKey(page: Page, legacyKey: string): Promise<string> {
  requireLearnerKey(legacyKey)
  await page.waitForFunction(
    (registryKey) => localStorage.getItem(registryKey) !== null,
    LOCAL_PROFILE_REGISTRY_KEY,
  )
  return page.evaluate(({ key, prefix, registryKey }) => {
    const raw = localStorage.getItem(registryKey)
    if (!raw) throw new Error('Active learner profile registry is missing')
    const registry = JSON.parse(raw) as { activeProfileId?: unknown }
    if (typeof registry.activeProfileId !== 'string') {
      throw new Error('Active learner profile registry is corrupt')
    }
    return `${prefix}${registry.activeProfileId}:${key}`
  }, { key: legacyKey, prefix: PROFILE_SCOPED_STORAGE_PREFIX, registryKey: LOCAL_PROFILE_REGISTRY_KEY })
}

export async function readLearnerStorageItem(page: Page, legacyKey: string): Promise<string | null> {
  const key = await activeLearnerStorageKey(page, legacyKey)
  return page.evaluate((resolvedKey) => localStorage.getItem(resolvedKey), key)
}

export async function readLearnerStorageJson<T>(page: Page, legacyKey: string): Promise<T | null> {
  const raw = await readLearnerStorageItem(page, legacyKey)
  return raw === null ? null : JSON.parse(raw) as T
}

export async function writeLearnerStorageItem(page: Page, legacyKey: string, value: string): Promise<void> {
  const key = await activeLearnerStorageKey(page, legacyKey)
  await page.evaluate(({ resolvedKey, nextValue }) => {
    localStorage.setItem(resolvedKey, nextValue)
  }, { resolvedKey: key, nextValue: value })
}

export async function removeLearnerStorageItem(page: Page, legacyKey: string): Promise<void> {
  const key = await activeLearnerStorageKey(page, legacyKey)
  await page.evaluate((resolvedKey) => localStorage.removeItem(resolvedKey), key)
}

export async function waitForLearnerStorageItem(page: Page, legacyKey: string): Promise<void> {
  const key = await activeLearnerStorageKey(page, legacyKey)
  await page.waitForFunction((resolvedKey) => Boolean(localStorage.getItem(resolvedKey)), key)
}

export async function listLearnerStorageKeys(page: Page, legacyPrefix: string): Promise<string[]> {
  requireLearnerKey(`${legacyPrefix}probe`)
  const activePrefix = await activeLearnerStorageKey(page, legacyPrefix)
  return page.evaluate((resolvedPrefix) => Object.keys(localStorage).filter(
    (key) => key.startsWith(resolvedPrefix),
  ), activePrefix)
}

// Sketch documents stay under raw learner-identity keys, not the scoped prefix.
export async function listSketchStorageKeys(page: Page): Promise<string[]> {
  return page.evaluate(() => Object.keys(localStorage).filter(
    (key) => key.startsWith('mathAssist_sketch_v1:'),
  ))
}
