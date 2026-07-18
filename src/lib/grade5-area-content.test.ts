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
        /겹|거꾸로|구하세요|찾아/.test(template.prompt_template)
      )).toBe(true)
    }
  })
})
