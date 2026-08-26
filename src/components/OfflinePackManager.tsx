'use client'

/**
 * OfflinePackManager — 학년별 오프라인 팩 설치·업데이트·제거 UI (T5).
 *
 * Unwired by contract: shell integration belongs to a later task, so this
 * component is not registered anywhere. It renders an accessible group
 * (role="group"), a polite live region (role="status" aria-live="polite"),
 * native keyboard-operable buttons with ≥48px touch targets, and human-readable
 * state text. Fixed error codes are translated to Korean guidance and never
 * rendered raw.
 *
 * Store access uses useSyncExternalStore: the service worker message stream is
 * the external system, the server snapshot is a deterministic initial state,
 * and no setState runs inside effect bodies.
 */

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'

import {
  createBrowserOfflinePackClient,
  isOfflineGrade,
  type OfflineGradeValue,
  type OfflinePackClient,
  type OfflineSnapshot,
} from '@/lib/offline-pack'

const DEFAULT_GRADES: readonly OfflineGradeValue[] = [1, 2, 3, 4, 5, 6]
const GRADE_ORDER: readonly OfflineGradeValue[] = [1, 2, 3, 4, 5, 6]

export interface OfflinePackManagerProps {
  grades?: readonly number[]
  client?: OfflinePackClient | null
}

interface OfflineStore {
  subscribe(listener: (snapshot: OfflineSnapshot) => void): () => void
  getSnapshot(): OfflineSnapshot
  getServerSnapshot(): OfflineSnapshot
}

interface GradeView {
  grade: OfflineGradeValue
  statusLabel: string
  actionLabel: string
  detail: string | null
  busy: boolean
  canInstall: boolean
  canRemove: boolean
  canUpdate: boolean
}

function createInitialSnapshot(): OfflineSnapshot {
  const grades = {} as OfflineSnapshot['grades']
  for (const grade of GRADE_ORDER) {
    grades[grade] = { status: 'not-installed', completed: null, total: null, errorCode: null }
  }
  return {
    ready: false,
    updateReady: false,
    appRelease: null,
    contentRelease: null,
    grades,
  }
}

function describeError(snapshot: OfflineSnapshot, grade: OfflineGradeValue): string | null {
  const code = snapshot.grades[grade].errorCode
  if (!code) {
    return null
  }
  switch (code) {
    case 'QUOTA_EXCEEDED':
      return '저장 공간 부족으로 설치하지 못했어요. 공간을 정리한 뒤 다시 시도할 수 있어요.'
    case 'ASSET_FETCH_FAILED':
      return '네트워크 문제로 설치하지 못했어요. 연결 후 다시 시도해 주세요.'
    case 'VERIFY_FAILED':
    case 'PACK_MANIFEST_INVALID':
      return '팩을 검증하지 못했어요. 다시 시도해 주세요.'
    default:
      return '지금은 처리할 수 없어요. 잠시 후 다시 시도해 주세요.'
  }
}

function buildGradeView(grade: OfflineGradeValue, snapshot: OfflineSnapshot): GradeView {
  const snapshotGrade = snapshot.grades[grade]
  const errorText = describeError(snapshot, grade)
  let statusLabel = '설치되지 않음'
  let actionLabel = '설치'
  let busy = false
  let canInstall = true
  let canRemove = false
  let canUpdate = false

  switch (snapshotGrade.status) {
    case 'installed':
      statusLabel = '설치됨'
      actionLabel = '제거'
      canInstall = false
      canRemove = true
      break
    case 'update-available':
      statusLabel = '업데이트 있음'
      actionLabel = '업데이트'
      canInstall = true
      canRemove = true
      canUpdate = true
      break
    case 'installing':
      statusLabel = `설치 중${snapshotGrade.total !== null ? ` ${snapshotGrade.completed ?? 0} / ${snapshotGrade.total}` : ''}`
      actionLabel = '설치 중…'
      busy = true
      canInstall = false
      break
    case 'removing':
      statusLabel = '제거 중…'
      actionLabel = '제거 중…'
      busy = true
      canRemove = false
      break
    case 'error':
      statusLabel = '오류'
      actionLabel = '다시 시도'
      break
    default:
      break
  }

  return {
    grade,
    statusLabel,
    actionLabel,
    detail: errorText,
    busy,
    canInstall,
    canRemove,
    canUpdate,
  }
}

function createLazyStore(): OfflineStore {
  const initial = createInitialSnapshot()
  let created: ReturnType<typeof createBrowserOfflinePackClient> = null

  return {
    subscribe(listener) {
      if (!created) {
        created = createBrowserOfflinePackClient()
      }
      return created ? created.subscribe(listener) : () => {}
    },
    getSnapshot() {
      return created ? created.getSnapshot() : initial
    },
    getServerSnapshot() {
      return initial
    },
  }
}

function createStoreForClient(client: OfflinePackClient | null): OfflineStore {
  // An injected client is an explicit deterministic snapshot source (tests,
  // future shell wiring), so both snapshots read from it directly.
  if (client) {
    return {
      subscribe(listener) {
        return client.subscribe(listener)
      },
      getSnapshot() {
        return client.getSnapshot()
      },
      getServerSnapshot() {
        return client.getSnapshot()
      },
    }
  }
  const initial = createInitialSnapshot()
  return {
    subscribe() {
      return () => {}
    },
    getSnapshot() {
      return initial
    },
    getServerSnapshot() {
      return initial
    },
  }
}

const TOUCH_TARGET_STYLE = { minWidth: '48px', minHeight: '48px' } as const

export default function OfflinePackManager({ grades, client }: OfflinePackManagerProps) {
  const resolvedGrades = useMemo<readonly OfflineGradeValue[]>(() => {
    if (!grades || grades.length === 0) {
      return DEFAULT_GRADES
    }
    return grades.filter(isOfflineGrade)
  }, [grades])

  const [lazyStore] = useState<OfflineStore>(() => createLazyStore())
  const store = useMemo<OfflineStore>(
    () => (client !== undefined ? createStoreForClient(client) : lazyStore),
    [client, lazyStore],
  )

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)

  const handleAction = useCallback(
    async (grade: OfflineGradeValue, view: GradeView) => {
      if (!client) {
        return
      }
      if (view.canUpdate) {
        await client.installGradePack(grade)
        return
      }
      if (view.canRemove && !view.canInstall) {
        await client.removeGradePack(grade)
        return
      }
      if (view.canInstall) {
        await client.installGradePack(grade)
      }
    },
    [client],
  )

  const liveMessage =
    snapshot.ready === false
      ? '오프라인 상태를 확인하는 중이에요.'
      : resolveLiveMessage(snapshot)

  return (
    <section role="group" aria-label="오프라인 학년 팩">
      <h2>오프라인 학습 준비</h2>
      <p role="status" aria-live="polite">
        {liveMessage}
      </p>
      <ul>
        {resolvedGrades.map(grade => {
          const view = buildGradeView(grade, snapshot)
          return (
            <li key={grade}>
              <span>{`${grade}학년`}</span>
              <strong data-grade-status={view.statusLabel}>{view.statusLabel}</strong>
              {view.detail !== null ? <small>{view.detail}</small> : null}
              <button
                type="button"
                style={TOUCH_TARGET_STYLE}
                disabled={view.busy}
                onClick={() => {
                  void handleAction(grade, view)
                }}
                aria-label={`${grade}학년 오프라인 팩 ${view.actionLabel}`}
              >
                {view.actionLabel}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function resolveLiveMessage(snapshot: OfflineSnapshot): string {
  if (snapshot.updateReady) {
    return '새 버전으로 다시 시작할 수 있어요.'
  }
  const installing = GRADE_ORDER.filter(grade => snapshot.grades[grade].status === 'installing')
  if (installing.length > 0) {
    return `${installing.map(grade => `${grade}학년`).join(', ')} 팩을 저장하는 중이에요.`
  }
  return '오프라인 학습 상태가 갱신되었어요.'
}
