import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { validateDirectCurriculumCoverage } from '../../scripts/curriculum-direct-link-core.js'
import { grade1Islands } from './grade1-problems'
import { grade2Units } from './grade2-problems'

const root = process.cwd()
const allocationPath = join(
  root,
  'public/data/curriculum-allocations-v1.json'
)
const allocationSource = readFileSync(allocationPath, 'utf8')
const allocation = JSON.parse(allocationSource)
const grade12Allocations = allocation.allocations.filter(
  (entry: { band: string }) => entry.band === '1-2'
)

const officialTextByCode: Record<string, string> = {
  '[2수01-01]': '수의 필요성을 인식하면서 0과 100까지의 수 개념을 이해하고, 수를 세고 읽고 쓸 수 있다.',
  '[2수01-02]': '일, 십, 백, 천의 자릿값과 위치적 기수법을 이해하고, 네 자리 이하의 수를 읽고 쓸 수 있다.',
  '[2수01-03]': '네 자리 이하의 수의 범위에서 수의 계열을 이해하고, 수의 크기를 비교할 수 있다.',
  '[2수01-04]': '하나의 수를 두 수로 분해하고 두 수를 하나의 수로 합성하는 활동을 통하여 수 감각을 기른다.',
  '[2수01-05]': '덧셈과 뺄셈이 이루어지는 실생활 상황과 연결하여 덧셈과 뺄셈의 의미를 이해한다.',
  '[2수01-06]': '두 자리 수의 범위에서 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.',
  '[2수01-07]': '덧셈과 뺄셈의 관계를 이해한다.',
  '[2수01-08]': '두 자리 수의 범위에서 세 수의 덧셈과 뺄셈을 할 수 있다.',
  '[2수01-09]': '□가 사용된 덧셈식과 뺄셈식을 만들고, □의 값을 구할 수 있다.',
  '[2수01-10]': '곱셈이 이루어지는 실생활 상황과 연결하여 곱셈의 의미를 이해한다.',
  '[2수01-11]': '곱셈구구를 이해하고, 한 자리 수의 곱셈을 할 수 있다.',
  '[2수02-01]': '물체, 무늬, 수 등의 배열에서 규칙을 찾아 여러 가지 방법으로 표현할 수 있다.',
  '[2수02-02]': '자신이 정한 규칙에 따라 물체, 무늬, 수 등을 배열할 수 있다.',
  '[2수03-01]': '교실 및 생활 주변에서 여러 가지 물건을 관찰하여 직육면체, 원기둥, 구의 모양을 찾고, 이를 이용하여 여러 가지 모양을 만들 수 있다.',
  '[2수03-02]': '쌓기나무를 이용하여 여러 가지 입체도형의 모양을 만들고, 그 모양에 대해 위치나 방향을 이용하여 말할 수 있다.',
  '[2수03-03]': '교실 및 생활 주변에서 여러 가지 물건을 관찰하여 삼각형, 사각형, 원의 모양을 찾고, 이를 이용하여 여러 가지 모양을 만들 수 있다.',
  '[2수03-04]': '삼각형, 사각형, 원을 직관적으로 이해하고, 그 모양을 그릴 수 있다.',
  '[2수03-05]': '삼각형, 사각형에서 각각의 공통점을 찾아 말할 수 있다.',
  '[2수03-06]': '구체물의 길이, 들이, 무게, 넓이를 비교하여 각각 ‘길다, 짧다’, ‘많다, 적다’, ‘무겁다, 가볍다’, ‘넓다, 좁다’ 등을 구별하여 말할 수 있다.',
  '[2수03-07]': '시계를 보고 시각을 ‘몇 시 몇 분’까지 읽을 수 있다.',
  '[2수03-08]': '1시간과 1분의 관계를 이해하고, 시간을 ‘시간’, ‘분’으로 표현할 수 있다.',
  '[2수03-09]': '실생활 문제 상황과 연결하여 1분, 1시간, 1일, 1주일, 1개월, 1년 사이의 관계를 이해한다.',
  '[2수03-10]': '길이 단위 1cm와 1m를 알고, 이를 이용하여 주변 사물의 길이를 측정할 수 있다.',
  '[2수03-11]': '1m와 1cm의 관계를 이해하고, 길이를 ‘몇 m 몇 cm’와 ‘몇 cm’로 표현할 수 있다.',
  '[2수03-12]': '여러 가지 물건의 길이를 어림하고, 길이에 대한 양감을 기른다.',
  '[2수03-13]': '실생활 문제 상황과 연결하여 길이의 덧셈과 뺄셈을 할 수 있다.',
  '[2수04-01]': '여러 가지 사물을 정해진 기준 또는 자신이 정한 기준으로 분류하여 개수를 세어 보고, 기준에 따른 결과를 말할 수 있다.',
  '[2수04-02]': '자료를 분류하여 표로 나타내고, 자료를 표로 나타내면 편리한 점을 말할 수 있다.',
  '[2수04-03]': '자료를 분류하여 ○, ×, / 등을 이용한 그래프로 나타내고, 자료를 그래프로 나타내면 편리한 점을 말할 수 있다.',
}

const expectedCodes = Object.keys(officialTextByCode)

describe('Grade 1-2 final curriculum allocation contract', () => {
  it('contains the exact official 29-code set and first-table wording once each', () => {
    expect(allocation.schemaVersion).toBe('2022-math-allocation-v1')
    expect(allocation.curriculumNotice).toBe('교육부 고시 제2022-33호 별책 8')
    expect(allocation.allocations).toHaveLength(121)
    expect(grade12Allocations).toHaveLength(29)

    const codes = grade12Allocations.map(
      (entry: { standardCode: string }) => entry.standardCode
    )
    expect(codes).toEqual(expectedCodes)
    expect(new Set(codes).size).toBe(29)
    expect(
      Object.fromEntries(
        grade12Allocations.map(
          (entry: { standardCode: string; officialText: string }) => [
            entry.standardCode,
            entry.officialText,
          ]
        )
      )
    ).toEqual(officialTextByCode)
  })

  it('assigns each standard to one grade, semester, and compatible existing scope', () => {
    const grade1IslandIds = new Set(grade1Islands.map((island) => island.id))
    const grade2UnitsById = new Map(grade2Units.map((unit) => [unit.id, unit]))

    for (const entry of grade12Allocations) {
      expect(entry.band).toBe('1-2')
      expect([1, 2]).toContain(entry.assignedGrade)
      expect(entry.semester).toMatch(new RegExp(`^${entry.assignedGrade}-[12]$`))
      expect(entry.reviewStatus).toBe('released')
      expect(entry.coverageStatus).toBe('existing-reference')
      expect(entry.sourceUrl).toBe(
        'https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0'
      )
      expect(entry.sourcePageDescriptor).toContain('첫 번째 성취기준 표')
      expect(entry.allocationRationale.trim()).not.toBe('')
      expect(entry.existingContentRefs.length).toBeGreaterThan(0)
      expect(entry.directContentRefs.length).toBeGreaterThan(0)
      expect(Array.isArray(entry.reviewContentRefs)).toBe(true)

      if (entry.assignedGrade === 1) {
        expect(grade1IslandIds.has(entry.unitId)).toBe(true)
      } else {
        const unit = grade2UnitsById.get(entry.unitId)
        expect(unit?.semester).toBe(entry.semester)
        expect(unit?.curriculumCodes).toContain(entry.standardCode)
      }
    }

    expect(
      grade12Allocations
        .filter((entry: { assignedGrade: number }) => entry.assignedGrade === 1)
        .map((entry: { standardCode: string; unitId: string }) => [
          entry.standardCode,
          entry.unitId,
        ])
    ).toEqual([
      ['[2수01-01]', 'count-cove'],
      ['[2수01-04]', 'orchard-port'],
    ])
  })

  it('keeps optional other-grade review intent outside the assigned denominator', () => {
    const reviewRows = grade12Allocations.filter(
      (entry: { otherGradeReviewIntent?: unknown }) => entry.otherGradeReviewIntent
    )
    expect(reviewRows.length).toBeGreaterThan(0)
    for (const entry of reviewRows) {
      expect(entry.otherGradeReviewIntent.grade).not.toBe(entry.assignedGrade)
      expect(entry.otherGradeReviewIntent.scopeIds.length).toBeGreaterThan(0)
      expect(entry.otherGradeReviewIntent.rationale.trim()).not.toBe('')
    }

    const grade1Assigned = grade12Allocations.filter(
      (entry: { assignedGrade: number }) => entry.assignedGrade === 1
    ).length
    const grade2Assigned = grade12Allocations.filter(
      (entry: { assignedGrade: number }) => entry.assignedGrade === 2
    ).length
    expect(grade1Assigned + grade2Assigned).toBe(29)
    expect({ grade1Assigned, grade2Assigned }).toEqual({
      grade1Assigned: 2,
      grade2Assigned: 27,
    })
  })

  it('uses problem-level direct links for coverage and keeps review links separate', () => {
    const assignedGrade1 = grade12Allocations.find(
      (entry: { standardCode: string }) => entry.standardCode === '[2수01-01]'
    )
    const assignedGrade2 = grade12Allocations.find(
      (entry: { standardCode: string }) => entry.standardCode === '[2수01-03]'
    )
    const result = validateDirectCurriculumCoverage({
      allocations: [
        {
          ...assignedGrade1,
          directContentRefs: ['1:mission:count-cove-direct'],
          reviewContentRefs: [],
        },
        {
          ...assignedGrade2,
          directContentRefs: ['2:mission:g2-place-value-direct'],
          reviewContentRefs: ['1:mission:order-bridge-review'],
        },
      ],
      publishedSources: [
        {
          reviewId: '1:mission:count-cove-direct',
          grade: 1,
          sourceKind: 'mission',
          published: true,
          qualityMetadata: { standards: ['[2수01-01]'] },
        },
        {
          reviewId: '2:mission:g2-place-value-direct',
          grade: 2,
          sourceKind: 'mission',
          published: true,
          qualityMetadata: { standards: ['[2수01-03]'] },
        },
        {
          reviewId: '1:mission:order-bridge-review',
          grade: 1,
          sourceKind: 'mission',
          published: true,
          qualityMetadata: { standards: ['[2수01-03]'] },
        },
      ],
    })

    expect(result.errors).toEqual([])
    expect(result.summary).toEqual({
      standardDenominator: 2,
      directlyCoveredStandardCount: 2,
      directContentLinkCount: 2,
      reviewContentLinkCount: 1,
    })
  })

  it('is deterministically formatted with final problem-level references', () => {
    expect(allocationSource).toBe(`${JSON.stringify(allocation, null, 2)}\n`)
    for (const entry of grade12Allocations) {
      expect(entry.directContentRefs.length).toBeGreaterThan(0)
      expect(Array.isArray(entry.reviewContentRefs)).toBe(true)
      expect(entry.existingContentRefs.length).toBeGreaterThan(0)
    }
  })
})
