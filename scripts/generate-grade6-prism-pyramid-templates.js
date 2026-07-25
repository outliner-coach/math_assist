const fs = require('fs')
const path = require('path')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6prismpyramid.json')
const sets = ['A', 'B', 'C']

const solid = (kind) => ({
  type: 'poly-solid',
  semantics: 'quantitative',
  kind,
  baseSides: '{{p}}',
})

const net = (overrides = {}) => ({
  type: 'prism-net',
  semantics: 'quantitative',
  baseSides: '{{p}}',
  lateralFaces: '{{p}}',
  baseCount: 2,
  ...overrides,
})

const setDefinitions = {
  A: [
    { family: 'a-prism-face-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '밑면이 {{p}}각형인 각기둥의 면은 모두 몇 개인가요?', solver: 'p + 2', steps: ['{{p}}각기둥은 합동이고 평행한 밑면 2개와 옆면 {{p}}개로 이루어집니다.', '면의 수는 {{p}}+2={{p + 2}}개입니다.'], visual: solid('prism') },
    { family: 'a-prism-edge-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '밑면이 {{p}}각형인 각기둥의 모서리는 모두 몇 개인가요?', solver: '3 * p', steps: ['두 밑면의 모서리는 {{p}}개씩이고 옆 모서리는 {{p}}개입니다.', '{{p}}×3={{3 * p}}개입니다.'], visual: solid('prism') },
    { family: 'a-pyramid-vertex-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '밑면이 {{p}}각형인 각뿔의 꼭짓점은 모두 몇 개인가요?', solver: 'p + 1', steps: ['밑면의 꼭짓점은 {{p}}개입니다.', '꼭대기점 1개를 더하면 {{p + 1}}개입니다.'], visual: solid('pyramid') },
    { family: 'a-prism-net-lateral-count', domain: 'knowing', pattern: 'representation_shift', standard: '[6수03-06]', prompt: '{{p}}각기둥의 전개도에서 직사각형 모양의 옆면은 몇 개인가요?', solver: 'p', steps: ['밑면의 변 하나마다 옆면 하나가 이어집니다.', '밑면이 {{p}}각형이므로 옆면은 {{p}}개입니다.'], visual: net() },
    { family: 'a-inverse-prism-from-faces', domain: 'applying', pattern: 'inverse', standard: '[6수03-05]', prompt: '어떤 각기둥의 면이 모두 {{p + 2}}개입니다. 이 각기둥의 밑면은 몇 각형인가요? 각의 수를 쓰세요.', solver: 'p', steps: ['각기둥의 면 수는 밑면의 변 수+2입니다.', '{{p + 2}}-2={{p}}이므로 밑면은 {{p}}각형입니다.'] },
    { family: 'a-prism-pyramid-edge-difference', domain: 'applying', pattern: 'model_and_check', standard: '[6수03-05]', prompt: '밑면이 모두 {{p}}각형인 각기둥과 각뿔이 있습니다. 각기둥의 모서리는 각뿔보다 몇 개 더 많나요?', solver: 'p', steps: ['각기둥의 모서리는 3×{{p}}={{3 * p}}개입니다.', '각뿔의 모서리는 2×{{p}}={{2 * p}}개이므로 차는 {{p}}개입니다.'] },
    { family: 'a-corner-protector-combination', domain: 'applying', pattern: 'multi_step', standard: '[6수03-05]', prompt: '밑면이 각각 {{p}}각형인 각기둥 상자와 각뿔 장식의 모든 꼭짓점에 보호 덮개를 하나씩 씌웁니다. 덮개는 모두 몇 개인가요?', solver: '3 * p + 1', steps: ['각기둥의 꼭짓점은 {{2 * p}}개입니다.', '각뿔의 꼭짓점 {{p + 1}}개를 더하면 {{3 * p + 1}}개입니다.'] },
    { family: 'a-prism-net-total-pieces', domain: 'applying', pattern: 'representation_shift', standard: '[6수03-06]', prompt: '{{p}}각기둥 모양 상자를 전개도대로 한 면씩 잘라 냈습니다. 밑면과 옆면 조각은 모두 몇 개인가요?', solver: 'p + 2', steps: ['옆면은 밑면의 변 수와 같은 {{p}}개입니다.', '밑면 2개를 더하면 {{p + 2}}개입니다.'], visual: net() },
    { family: 'a-prism-double-face-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-05]', prompt: '한 학생이 “{{p}}각기둥은 밑면이 2개이므로 면이 {{2 * p}}개”라고 했습니다. 면을 종류별로 다시 세어 올바른 면 수와 학생이 말한 수의 차를 구하세요.', solver: 'p - 2', steps: ['밑면 2개와 옆면 {{p}}개이므로 올바른 면 수는 {{p + 2}}개입니다.', '학생이 말한 수는 {{2 * p}}개입니다.', '{{2 * p}}-{{p + 2}}={{p - 2}}개 차이입니다.'], visual: solid('prism') },
    { family: 'a-prism-net-missing-lateral', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-06]', prompt: '{{p}}각기둥 전개도를 만들었는데 밑면 2개와 직사각형 {{p - 1}}개만 있습니다. 완성하려면 면 조각을 몇 개 더 붙여야 하나요?', solver: '1', steps: ['{{p}}각기둥에는 옆면이 {{p}}개 필요합니다.', '현재 옆면은 {{p - 1}}개입니다.', '{{p}}-{{p - 1}}=1개를 더 붙여야 합니다.'], visual: net({ lateralFaces: '{{p - 1}}' }) },
  ],
  B: [
    { family: 'b-pyramid-face-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '밑면이 {{p}}각형인 각뿔의 면은 모두 몇 개인가요?', solver: 'p + 1', steps: ['옆면은 삼각형 {{p}}개이고 밑면은 1개입니다.', '면의 수는 {{p}}+1={{p + 1}}개입니다.'], visual: solid('pyramid') },
    { family: 'b-pyramid-edge-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '밑면이 {{p}}각형인 각뿔의 모서리는 모두 몇 개인가요?', solver: '2 * p', steps: ['밑면의 모서리는 {{p}}개입니다.', '꼭대기점으로 이어지는 모서리 {{p}}개를 더하면 {{2 * p}}개입니다.'], visual: solid('pyramid') },
    { family: 'b-prism-vertex-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '밑면이 {{p}}각형인 각기둥의 꼭짓점은 모두 몇 개인가요?', solver: '2 * p', steps: ['합동인 두 밑면에 꼭짓점이 {{p}}개씩 있습니다.', '{{p}}×2={{2 * p}}개입니다.'], visual: solid('prism') },
    { family: 'b-prism-net-base-count', domain: 'knowing', pattern: 'representation_shift', standard: '[6수03-06]', prompt: '{{p}}각기둥의 완전한 전개도에 서로 합동인 밑면은 몇 개인가요?', solver: '2', steps: ['각기둥은 서로 합동이고 평행한 두 밑면을 가집니다.', '전개도에도 밑면은 2개입니다.'], visual: net() },
    { family: 'b-inverse-pyramid-from-edges', domain: 'applying', pattern: 'inverse', standard: '[6수03-05]', prompt: '어떤 각뿔의 모서리가 모두 {{2 * p}}개입니다. 밑면은 몇 각형인가요? 각의 수를 쓰세요.', solver: 'p', steps: ['각뿔의 모서리 수는 밑면의 변 수의 2배입니다.', '{{2 * p}}÷2={{p}}이므로 밑면은 {{p}}각형입니다.'] },
    { family: 'b-face-labels-for-two-solids', domain: 'applying', pattern: 'multi_step', standard: '[6수03-05]', prompt: '밑면이 각각 {{p}}각형인 각기둥과 각뿔의 모든 면에 번호표를 한 장씩 붙입니다. 번호표는 모두 몇 장 필요한가요?', solver: '2 * p + 3', steps: ['각기둥의 면은 {{p + 2}}개입니다.', '각뿔의 면 {{p + 1}}개를 더하면 {{2 * p + 3}}개입니다.'] },
    { family: 'b-prism-edge-vertex-gap', domain: 'applying', pattern: 'model_and_check', standard: '[6수03-05]', prompt: '{{p}}각기둥의 모든 모서리에 테이프를 한 줄씩, 모든 꼭짓점에 스티커를 하나씩 붙입니다. 테이프 줄 수는 스티커 수보다 몇 개 더 많나요?', solver: 'p', steps: ['모서리는 {{3 * p}}개이고 꼭짓점은 {{2 * p}}개입니다.', '{{3 * p}}-{{2 * p}}={{p}}개 더 많습니다.'], visual: solid('prism') },
    { family: 'b-two-prism-nets-lateral-panels', domain: 'applying', pattern: 'multi_step', standard: '[6수03-06]', prompt: '같은 {{p}}각기둥 상자 2개의 전개도를 만듭니다. 두 전개도에 필요한 직사각형 옆면은 모두 몇 개인가요?', solver: '2 * p', steps: ['전개도 하나에 옆면이 {{p}}개 필요합니다.', '두 개에는 {{p}}×2={{2 * p}}개 필요합니다.'], visual: net() },
    { family: 'b-pyramid-double-vertex-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-05]', prompt: '한 학생이 “{{p}}각뿔의 꼭짓점은 밑면의 꼭짓점과 옆면 수를 더해 {{2 * p}}개”라고 했습니다. 꼭대기점을 기준으로 다시 세어 학생이 실제보다 몇 개 더 세었는지 구하세요.', solver: 'p - 1', steps: ['밑면의 꼭짓점 {{p}}개와 꼭대기점 1개이므로 실제는 {{p + 1}}개입니다.', '학생은 {{2 * p}}개라고 했습니다.', '{{2 * p}}-{{p + 1}}={{p - 1}}개 더 셌습니다.'], visual: solid('pyramid') },
    { family: 'b-prism-net-missing-base', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-06]', prompt: '{{p}}각기둥 전개도에 직사각형 {{p}}개와 {{p}}각형 1개만 그려져 있습니다. 완전한 전개도가 되려면 밑면을 몇 개 더 그려야 하나요?', solver: '1', steps: ['각기둥 전개도에는 합동인 밑면이 2개 있어야 합니다.', '현재 밑면은 1개입니다.', '2-1=1개를 더 그려야 합니다.'], visual: net({ baseCount: 1 }) },
  ],
  C: [
    { family: 'c-prism-face-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '{{p}}각기둥에서 밑면과 옆면을 빠짐없이 세면 면은 모두 몇 개인가요?', solver: 'p + 2', steps: ['밑면은 2개이고 옆면은 {{p}}개입니다.', '모두 {{p + 2}}개입니다.'], visual: solid('prism') },
    { family: 'c-pyramid-edge-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '{{p}}각뿔에서 밑면 모서리와 옆 모서리를 모두 세면 몇 개인가요?', solver: '2 * p', steps: ['밑면 모서리와 옆 모서리는 각각 {{p}}개입니다.', '모두 {{2 * p}}개입니다.'], visual: solid('pyramid') },
    { family: 'c-prism-edge-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '{{p}}각기둥의 두 밑면 모서리와 옆 모서리를 모두 세면 몇 개인가요?', solver: '3 * p', steps: ['두 밑면에 {{p}}개씩, 옆으로 잇는 모서리가 {{p}}개 있습니다.', '{{p}}×3={{3 * p}}개입니다.'], visual: solid('prism') },
    { family: 'c-pyramid-vertex-count', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-05]', prompt: '{{p}}각뿔의 밑면 꼭짓점과 꼭대기점을 모두 세면 몇 개인가요?', solver: 'p + 1', steps: ['밑면의 꼭짓점은 {{p}}개입니다.', '꼭대기점 1개를 더해 {{p + 1}}개입니다.'], visual: solid('pyramid') },
    { family: 'c-inverse-prism-from-vertices', domain: 'applying', pattern: 'inverse', standard: '[6수03-05]', prompt: '어떤 각기둥의 꼭짓점이 {{2 * p}}개입니다. 한 밑면은 몇 각형인가요? 각의 수를 쓰세요.', solver: 'p', steps: ['각기둥의 꼭짓점은 두 밑면에 같은 수만큼 있습니다.', '{{2 * p}}÷2={{p}}이므로 한 밑면은 {{p}}각형입니다.'] },
    { family: 'c-combined-edge-tape', domain: 'applying', pattern: 'multi_step', standard: '[6수03-05]', prompt: '밑면이 각각 {{p}}각형인 각기둥과 각뿔의 모든 모서리에 한 줄씩 색 테이프를 붙입니다. 테이프는 모두 몇 줄 필요한가요?', solver: '5 * p', steps: ['각기둥은 {{3 * p}}줄, 각뿔은 {{2 * p}}줄 필요합니다.', '합은 {{3 * p}}+{{2 * p}}={{5 * p}}줄입니다.'] },
    { family: 'c-two-prism-face-stickers', domain: 'applying', pattern: 'multi_step', standard: '[6수03-05]', prompt: '같은 {{p}}각기둥 2개의 모든 면에 스티커를 한 장씩 붙입니다. 스티커는 모두 몇 장 필요한가요?', solver: '2 * p + 4', steps: ['각기둥 하나의 면은 {{p + 2}}개입니다.', '두 개에는 2×({{p}}+2)={{2 * p + 4}}장 필요합니다.'], visual: solid('prism') },
    { family: 'c-three-prism-nets-lateral-panels', domain: 'applying', pattern: 'multi_step', standard: '[6수03-06]', prompt: '같은 {{p}}각기둥 포장 상자 3개의 전개도를 만듭니다. 직사각형 옆면 조각은 모두 몇 개 필요한가요?', solver: '3 * p', steps: ['상자 하나의 옆면 조각은 {{p}}개입니다.', '세 상자에는 {{p}}×3={{3 * p}}개 필요합니다.'], visual: net() },
    { family: 'c-prism-double-edge-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-05]', prompt: '한 학생이 “{{p}}각기둥의 모서리는 두 밑면만 세면 되어 {{2 * p}}개”라고 했습니다. 빠뜨린 모서리 묶음을 찾아 올바른 수와 학생이 말한 수의 차를 구하세요.', solver: 'p', steps: ['두 밑면 모서리 {{2 * p}}개 외에 옆 모서리 {{p}}개가 있습니다.', '올바른 모서리 수는 {{3 * p}}개입니다.', '{{3 * p}}-{{2 * p}}={{p}}개 차이입니다.'], visual: solid('prism') },
    { family: 'c-prism-net-extra-lateral', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-06]', prompt: '{{p}}각기둥 전개도에 밑면 2개와 직사각형 {{p + 1}}개를 그렸습니다. 밑면의 변과 이어질 옆면을 일대일로 대응해 보아 몇 개를 지워야 하나요?', solver: '1', steps: ['{{p}}각기둥의 옆면은 밑면의 변 수와 같은 {{p}}개입니다.', '현재 직사각형은 {{p + 1}}개입니다.', '{{p + 1}}-{{p}}=1개를 지워야 합니다.'], visual: net({ lateralFaces: '{{p + 1}}' }) },
  ],
}

const templates = sets.flatMap((setId) => setDefinitions[setId].map((definition, index) => {
  const hasVisual = Boolean(definition.visual)
  return {
    id: `tmpl-g6prismpyramid-${setId}-${String(index + 1).padStart(2, '0')}`,
    concept_id: 'g6prismpyramid-001',
    type: 'number',
    difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
    set_id: setId,
    problem_family: definition.family,
    blueprint: {
      problemFamily: definition.family,
      cognitiveDomain: definition.domain,
      reasoningPattern: definition.pattern,
      primaryStandard: definition.standard,
      connectedStandards: definition.standard === '[6수03-06]'
        ? ['[6수03-05]']
        : [],
      representations: hasVisual
        ? index >= 4 ? ['text', 'equation', 'diagram'] : ['text', 'diagram']
        : ['text', 'equation'],
      contextType: index < 4 ? 'pure_math' : index < 8 ? 'real_world' : 'puzzle',
      estimatedSteps: index >= 8 ? 3 : 2,
      readingLoad: index >= 8 ? 'medium' : 'low',
      ...(hasVisual ? { visualSemantics: 'quantitative' } : {}),
    },
    param_schema: {
      p: {
        min: setId === 'A' ? 3 : setId === 'B' ? 4 : 5,
        max: setId === 'A' ? 6 : setId === 'B' ? 7 : 8,
      },
    },
    prompt_template: definition.prompt,
    solver_rule: definition.solver,
    solution_steps_template: definition.steps,
    hint_steps_template: [
      definition.standard === '[6수03-06]'
        ? '밑면의 변 하나와 직사각형 옆면 하나가 어떻게 대응하는지 확인해 보세요.'
        : '밑면의 변 수를 기준으로 면, 모서리, 꼭짓점을 종류별로 나누어 세어 보세요.',
      index >= 8
        ? '제시된 수와 구조에서 직접 센 올바른 수를 각각 구한 뒤 차이를 계산해요.'
        : '각기둥과 각뿔의 밑면 수가 서로 다르다는 점을 확인해요.',
    ],
    ...(hasVisual ? { visual_template: definition.visual } : {}),
  }
}))

function serializeTemplates(value = templates) {
  return `${JSON.stringify(value, null, 2)}\n`
}

if (require.main === module) {
  fs.writeFileSync(outputPath, serializeTemplates())
  console.log(`Wrote ${templates.length} Grade 6 prism and pyramid templates to ${outputPath}`)
}

module.exports = { templates, serializeTemplates }
