import { createContentDedupeKey } from './attempt-receipt'
import type { LearningGrade } from './learning-activity'
import {
  createLocalProgressRepository,
  type ReadonlyLearningStorage,
} from './local-progress-repository'
import type { LegacyProgressBaseline } from './remote-progress'

const LEGACY_PROGRESS_KEYS: Record<LearningGrade, string> = {
  1: 'mathAssist_grade1Progress',
  2: 'mathAssist_grade2Progress',
  3: 'mathAssist_grade3Progress',
  4: 'mathAssist_grade4Progress',
  5: 'mathAssist_progress_v1',
  6: 'mathAssist_grade6Progress',
}

const LEGACY_GRADES: readonly LearningGrade[] = [1, 2, 3, 4, 5, 6]

export function createLegacyProgressBaselines(
  storage: ReadonlyLearningStorage,
  now = Date.now(),
): { baselines: LegacyProgressBaseline[]; corruptedGrades: LearningGrade[] } {
  const baselines: LegacyProgressBaseline[] = []
  const corruptedGrades: LearningGrade[] = []
  const progressOnlyStorage: ReadonlyLearningStorage = {
    getItem(key) {
      return key === 'mathAssist_currentSession' || key === 'mathAssist_grade6CurrentSession'
        ? null
        : storage.getItem(key)
    },
  }
  const repository = createLocalProgressRepository(progressOnlyStorage)

  for (const grade of LEGACY_GRADES) {
    const sourceKey = LEGACY_PROGRESS_KEYS[grade]
    const raw = storage.getItem(sourceKey)
    if (raw === null) continue
    const projection = repository.readProgress(grade, now)
    if (projection.corrupted) {
      corruptedGrades.push(grade)
      continue
    }
    baselines.push({
      sourceKey,
      sourceSchemaVersion: projection.schemaVersion,
      sourceHash: createContentDedupeKey(raw),
      grade,
      completedIds: [...projection.completed],
      reviewIds: [...projection.review],
      recentActivityId: projection.resume?.activityId ?? null,
      recentActivityAt: projection.lastActivityAt,
      selectedUnitId: projection.resume?.contextId ?? null,
    })
  }

  return { baselines, corruptedGrades }
}
