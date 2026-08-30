'use client'

/**
 * OfflinePackManager — 학년별 오프라인 팩 설치·업데이트·제거 UI (T5).
 *
 * The guest home renders this component as the public offline control surface.
 * It renders an accessible group
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

export interface OfflineStore {
  subscribe(listener: (snapshot: OfflineSnapshot) => void): () => void
  getSnapshot(): OfflineSnapshot
  getServerSnapshot(): OfflineSnapshot
  installGradePack(grade: OfflineGradeValue): Promise<void>
  removeGradePack(grade: OfflineGradeValue): Promise<void>
}

type OfflinePackClientFactory = () => OfflinePackClient | null

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

export function createLazyOfflineStore(
  createClient: OfflinePackClientFactory = createBrowserOfflinePackClient,
): OfflineStore {
  const initial = createInitialSnapshot()
  let created: OfflinePackClient | null = null
  let queryStarted = false

  function getOrCreateClient(): OfflinePackClient | null {
    if (!created) {
      created = createClient()
    }
    return created
  }

  function queryStateOnce(activeClient: OfflinePackClient): void {
    if (queryStarted) {
      return
    }
    queryStarted = true
    void activeClient.queryState().catch(() => {})
  }

  return {
    subscribe(listener) {
      const activeClient = getOrCreateClient()
      if (!activeClient) {
        return () => {}
      }
      const unsubscribe = activeClient.subscribe(listener)
      queryStateOnce(activeClient)
      return unsubscribe
    },
    getSnapshot() {
      return created ? created.getSnapshot() : initial
    },
    getServerSnapshot() {
      return initial
    },
    installGradePack(grade) {
      const activeClient = getOrCreateClient()
      return activeClient ? activeClient.installGradePack(grade) : Promise.resolve()
    },
    removeGradePack(grade) {
      const activeClient = getOrCreateClient()
      return activeClient ? activeClient.removeGradePack(grade) : Promise.resolve()
    },
  }
}

function createStoreForClient(client: OfflinePackClient | null): OfflineStore {
  // An injected client is an explicit deterministic snapshot source (tests,
  // future shell wiring), so both snapshots read from it directly.
  if (client) {
    let queryStarted = false
    return {
      subscribe(listener) {
        const unsubscribe = client.subscribe(listener)
        if (!queryStarted) {
          queryStarted = true
          void client.queryState().catch(() => {})
        }
        return unsubscribe
      },
      getSnapshot() {
        return client.getSnapshot()
      },
      getServerSnapshot() {
        return client.getSnapshot()
      },
      installGradePack(grade) {
        return client.installGradePack(grade)
      },
      removeGradePack(grade) {
        return client.removeGradePack(grade)
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
    installGradePack() {
      return Promise.resolve()
    },
    removeGradePack() {
      return Promise.resolve()
    },
  }
}

const TOUCH_TARGET_STYLE = { minWidth: '48px', minHeight: '48px' } as const

const GRADE_ACCENT_CLASSES: Record<OfflineGradeValue, string> = {
  1: 'bg-[#dcfce7] text-[#15803d]',
  2: 'bg-[#e0f2fe] text-[#0369a1]',
  3: 'bg-[#ede9fe] text-[#6d28d9]',
  4: 'bg-[#ffedd5] text-[#c2410c]',
  5: 'bg-[#fce7f3] text-[#be185d]',
  6: 'bg-[#e0e7ff] text-[#4338ca]',
}

function statusTone(status: OfflineSnapshot['grades'][OfflineGradeValue]['status']): string {
  switch (status) {
    case 'installed':
      return 'bg-[#dcfce7] text-[#166534]'
    case 'update-available':
      return 'bg-[#fef3c7] text-[#92400e]'
    case 'installing':
      return 'bg-[#dbeafe] text-[#1d4ed8]'
    case 'removing':
      return 'bg-[#e2e8f0] text-[#475569]'
    case 'error':
      return 'bg-[#fee2e2] text-[#b91c1c]'
    default:
      return 'bg-white text-[#64748b]'
  }
}

function actionTone(view: GradeView): string {
  if (view.busy) {
    return 'cursor-wait border-[#cbd5e1] bg-[#e2e8f0] text-[#64748b]'
  }
  if (view.canRemove && !view.canInstall) {
    return 'border-[#cbd5e1] bg-white text-[#475569] hover:border-[#94a3b8] hover:bg-[#f8fafc]'
  }
  return 'border-[#1d4ed8] bg-[#2563eb] text-white shadow-sm hover:bg-[#1d4ed8]'
}

export default function OfflinePackManager({ grades, client }: OfflinePackManagerProps) {
  const resolvedGrades = useMemo<readonly OfflineGradeValue[]>(() => {
    if (!grades || grades.length === 0) {
      return DEFAULT_GRADES
    }
    return grades.filter(isOfflineGrade)
  }, [grades])

  const [lazyStore] = useState<OfflineStore>(() => createLazyOfflineStore())
  const store = useMemo<OfflineStore>(
    () => (client !== undefined ? createStoreForClient(client) : lazyStore),
    [client, lazyStore],
  )

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)

  const handleAction = useCallback(
    async (grade: OfflineGradeValue, view: GradeView) => {
      if (view.canUpdate) {
        await store.installGradePack(grade)
        return
      }
      if (view.canRemove && !view.canInstall) {
        await store.removeGradePack(grade)
        return
      }
      if (view.canInstall) {
        await store.installGradePack(grade)
      }
    },
    [store],
  )

  const liveMessage =
    snapshot.ready === false
      ? '오프라인 상태를 확인하는 중이에요.'
      : resolveLiveMessage(snapshot)

  return (
    <section
      role="group"
      aria-label="오프라인 학년 팩"
      className="space-y-5"
      data-testid="offline-pack-manager"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#dbeafe] text-[#2563eb]"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 18a4.6 4.6 0 0 1-.8-9.1A6.3 6.3 0 0 1 18.1 10 4 4 0 0 1 18 18H7Z" />
              <path d="M12 10v6" />
              <path d="m9.5 13.5 2.5 2.5 2.5-2.5" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#2563eb]">인터넷 없이도 계속</p>
            <h2 className="mt-1 text-xl font-black text-[#0f172a]">오프라인 학습 준비</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[#64748b]">
              필요한 학년만 이 기기에 저장해 두면, 인터넷이 잠시 끊겨도 학습을 이어갈 수 있어요.
            </p>
          </div>
        </div>
        <p
          role="status"
          aria-live="polite"
          className="inline-flex min-h-[40px] shrink-0 items-center gap-2 self-start rounded-full bg-[#eff6ff] px-4 py-2 text-sm font-bold text-[#1e40af] lg:self-auto"
        >
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#60a5fa]" />
          {liveMessage}
        </p>
      </div>
      <ul data-testid="offline-pack-grid" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resolvedGrades.map(grade => {
          const view = buildGradeView(grade, snapshot)
          const status = snapshot.grades[grade].status
          return (
            <li
              key={grade}
              data-testid={`offline-pack-grade-${grade}`}
              className="flex min-w-0 flex-col rounded-2xl border-2 border-[#e2e8f0] bg-[#f8fafc] p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-black ${GRADE_ACCENT_CLASSES[grade]}`}
                >
                  {grade}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-black text-[#0f172a]">{`${grade}학년`}</p>
                  <strong
                    data-grade-status={view.statusLabel}
                    className={`mt-1 inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-black ${statusTone(status)}`}
                  >
                    {view.statusLabel}
                  </strong>
                </div>
              </div>
              {view.detail !== null ? (
                <small className="mt-3 block rounded-xl bg-[#fff1f2] px-3 py-2 text-xs font-bold leading-5 text-[#b91c1c]">
                  {view.detail}
                </small>
              ) : null}
              <button
                type="button"
                style={TOUCH_TARGET_STYLE}
                className={`mt-4 inline-flex w-full items-center justify-center rounded-xl border-2 px-4 py-2.5 font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#bfdbfe] disabled:opacity-80 ${actionTone(view)}`}
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
