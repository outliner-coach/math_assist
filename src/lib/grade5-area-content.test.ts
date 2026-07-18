import { describe, expect, it } from 'vitest'

import concepts from '../../public/data/concepts.json'
import areaTemplates from '../../public/data/templates/area.json'
import units from '../../public/data/units.json'

describe('Grade 5 polygon area content', () => {
  it('registers the new unit and concept in the Grade 5 curriculum', () => {
    expect(units).toContainEqual(expect.objectContaining({
      id: 'unit-5-1-perimeter-area',
      grade: 5,
      semester: '5-1'
    }))
    expect(concepts).toContainEqual(expect.objectContaining({
      id: 'area-001',
      unit_id: 'unit-5-1-perimeter-area'
    }))
  })

  it('provides ten balanced problems per set with visual and applied coverage', () => {
    expect(areaTemplates).toHaveLength(30)

    for (const setId of ['A', 'B', 'C']) {
      const set = areaTemplates.filter(template => template.set_id === setId)
      expect(set).toHaveLength(10)
      expect(set.filter(template => template.difficulty === 1)).toHaveLength(4)
      expect(set.filter(template => template.difficulty === 2)).toHaveLength(4)
      expect(set.filter(template => template.difficulty === 3)).toHaveLength(2)
      expect(set.every(template => template.visual_template)).toBe(true)
      expect(set.filter(template => template.difficulty === 3).every(template =>
        template.solution_steps_template.length >= 4 &&
        /triple-overlap|perimeter-from-area/.test(template.problem_family ?? '')
      )).toBe(true)
    }
  })

  it('keeps rectangle-square applications inside Grade 5 arithmetic', () => {
    const compositeProblems = areaTemplates.filter(template =>
      template.problem_family?.startsWith('rectangle-square')
    )

    expect(compositeProblems).toHaveLength(6)
    expect(compositeProblems.every(template => template.prompt_template.includes('한 변이 {{s}} cm'))).toBe(true)
    expect(compositeProblems.every(template => !/□\s*×\s*□|조건을 만족하는|전체 넓이를 만족하는/.test(
      [template.prompt_template, ...template.solution_steps_template, ...(template.hint_steps_template ?? [])].join(' ')
    ))).toBe(true)
    expect(areaTemplates.some(template => template.problem_family === 'rectangle-square-reverse')).toBe(false)
  })

  it('declares a visual unit matching each rendered prompt unit', () => {
    for (const template of areaTemplates) {
      const promptUnit = /(^|[^c])m(?:²|\b)/.test(template.prompt_template) ? 'm' : 'cm'
      expect(template.visual_template?.props?.unit, template.id).toBe(promptUnit)
    }
  })
})
