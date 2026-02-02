/**
 * 데이터 로딩 유틸리티
 */

import type { Unit, Concept, ProblemTemplate } from './types'

// 단원 목록 로드
export async function getUnits(): Promise<Unit[]> {
  const res = await fetch('/data/units.json')
  if (!res.ok) throw new Error('Failed to load units')
  return res.json()
}

// 개념 목록 로드
export async function getConcepts(): Promise<Concept[]> {
  const res = await fetch('/data/concepts.json')
  if (!res.ok) throw new Error('Failed to load concepts')
  return res.json()
}

// 단원별 개념 필터링
export async function getConceptsByUnit(unitId: string): Promise<Concept[]> {
  const concepts = await getConcepts()
  return concepts
    .filter(c => c.unit_id === unitId)
    .sort((a, b) => a.order - b.order)
}

// 개념 상세 로드
export async function getConceptById(conceptId: string): Promise<Concept | null> {
  const concepts = await getConcepts()
  return concepts.find(c => c.id === conceptId) ?? null
}

// 템플릿 로드 (개념별)
export async function getTemplatesByConceptId(conceptId: string): Promise<ProblemTemplate[]> {
  // 개념 ID에서 파일명 추출 (예: "divisor-001" → "divisor")
  const prefix = conceptId.split('-')[0]

  try {
    const res = await fetch(`/data/templates/${prefix}.json`)
    if (!res.ok) return []

    const templates: ProblemTemplate[] = await res.json()
    return templates.filter(t => t.concept_id === conceptId)
  } catch {
    return []
  }
}

// 단원 상세 로드
export async function getUnitById(unitId: string): Promise<Unit | null> {
  const units = await getUnits()
  return units.find(u => u.id === unitId) ?? null
}
