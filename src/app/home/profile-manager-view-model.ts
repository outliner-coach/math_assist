import {
  DEFAULT_MASCOT_ID,
  MASCOT_PREFERENCE_KEY,
  isMascotId,
  type MascotId,
} from '@/lib/mascot'
import type { LocalProfileRegistryV1 } from '@/lib/local-profile'
import { createProfileScopedStorageKey } from '@/lib/profile-scoped-storage'

interface ProfileMascotStorage {
  getItem(key: string): string | null
}

export interface ProfileManagerViewModelEntry {
  profileId: string
  nickname: string | null
  mascotId: MascotId
}

export function readProfileMascotId(
  profileId: string,
  storage: ProfileMascotStorage,
): MascotId {
  try {
    const key = createProfileScopedStorageKey(profileId, MASCOT_PREFERENCE_KEY)
    const parsed = JSON.parse(storage.getItem(key) ?? 'null') as { avatarId?: unknown } | null
    return isMascotId(parsed?.avatarId) ? parsed.avatarId : DEFAULT_MASCOT_ID
  } catch {
    return DEFAULT_MASCOT_ID
  }
}

export function buildProfileManagerViewModel(
  registry: LocalProfileRegistryV1,
  storage: ProfileMascotStorage,
): ProfileManagerViewModelEntry[] {
  return registry.profiles.map((profile) => ({
    profileId: profile.profileId,
    nickname: profile.nickname,
    mascotId: readProfileMascotId(profile.profileId, storage),
  }))
}
