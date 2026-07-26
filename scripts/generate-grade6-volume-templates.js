const fs = require('fs')
const path = require('path')
const { explicitTaskActionsFor } = require('./grade6-quality-metadata')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6volume.json')
const sets = ['A', 'B', 'C']

const cuboid = (width, height, depth, focus, overrides = {}) => ({
  type: 'cuboid',
  semantics: 'quantitative',
  width,
  height,
  depth,
  focus,
  unit: 'cm',
  ...overrides,
})

const setDefinitions = {
  A: [
    { family: 'a-cuboid-surface-area', domain: 'knowing', pattern: 'direct', standard: '[6수03-17]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 2cm인 직육면체의 겉넓이는 몇 cm²인가요?', solver: '2 * (p * (p + 1) + 2 * p + 2 * (p + 1))', steps: ['서로 다른 세 면의 넓이는 {{p * (p + 1)}}, {{2 * p}}, {{2 * (p + 1)}}cm²입니다.', '각 면이 두 장씩이므로 합의 2배인 {{2 * (p * (p + 1) + 2 * p + 2 * (p + 1))}}cm²입니다.'], visual: cuboid('{{p}}', 2, '{{p + 1}}', 'faces') },
    { family: 'a-cube-surface-area', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-17]', prompt: '한 모서리가 {{p}}cm인 정육면체의 겉넓이는 몇 cm²인가요?', solver: '6 * p * p', steps: ['한 면의 넓이는 {{p}}×{{p}}={{p * p}}cm²입니다.', '같은 면 6개의 넓이는 {{6 * p * p}}cm²입니다.'], visual: cuboid('{{p}}', '{{p}}', '{{p}}', 'faces') },
    { family: 'a-cuboid-volume', domain: 'knowing', pattern: 'direct', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 2cm인 직육면체의 부피는 몇 cm³인가요?', solver: '2 * p * (p + 1)', steps: ['부피=가로×세로×높이입니다.', '{{p}}×{{p + 1}}×2={{2 * p * (p + 1)}}cm³입니다.'], visual: cuboid('{{p}}', 2, '{{p + 1}}', 'structure') },
    { family: 'a-cube-volume', domain: 'knowing', pattern: 'direct', standard: '[6수03-19]', prompt: '한 모서리가 {{p}}cm인 정육면체의 부피는 몇 cm³인가요?', solver: 'p * p * p', steps: ['정육면체의 부피는 한 모서리를 세 번 곱합니다.', '{{p}}×{{p}}×{{p}}={{p * p * p}}cm³입니다.'], visual: cuboid('{{p}}', '{{p}}', '{{p}}', 'structure') },
    { family: 'a-open-top-box-surface', domain: 'applying', pattern: 'multi_step', standard: '[6수03-17]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 2cm인 뚜껑 없는 상자의 겉면을 모두 색칠합니다. 색칠하는 넓이는 몇 cm²인가요?', solver: '2 * (2 * p + p * (p + 1) + 2 * (p + 1)) - p * (p + 1)', steps: ['닫힌 상자의 겉넓이는 {{2 * (2 * p + p * (p + 1) + 2 * (p + 1))}}cm²입니다.', '뚜껑 한 면 {{p * (p + 1)}}cm²를 빼면 {{2 * (2 * p + p * (p + 1) + 2 * (p + 1)) - p * (p + 1)}}cm²입니다.'], visual: cuboid('{{p}}', 2, '{{p + 1}}', 'faces', { openTop: true }) },
    { family: 'a-half-filled-box-volume', domain: 'applying', pattern: 'multi_step', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 4cm인 직육면체 상자를 높이의 절반까지 채웠습니다. 채운 부분의 부피는 몇 cm³인가요?', solver: '2 * p * (p + 1)', steps: ['상자 전체 부피는 {{4 * p * (p + 1)}}cm³입니다.', '높이의 절반까지 채웠으므로 {{4 * p * (p + 1)}}÷2={{2 * p * (p + 1)}}cm³입니다.'], visual: cuboid('{{p}}', 4, '{{p + 1}}', 'structure', { fillFraction: 0.5 }) },
    { family: 'a-find-height-from-volume', domain: 'applying', pattern: 'inverse', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 2cm인 직육면체의 부피가 {{6 * p}}cm³입니다. 높이는 몇 cm인가요?', solver: '3', steps: ['밑면의 넓이는 {{p}}×2={{2 * p}}cm²입니다.', '높이={{6 * p}}÷{{2 * p}}=3cm입니다.'], visual: cuboid('{{p}}', 3, 2, 'structure', { unknownMeasurement: 'height' }) },
    { family: 'a-one-cubic-meter-conversion', domain: 'applying', pattern: 'representation_shift', standard: '[6수03-18]', prompt: '1m³는 몇 cm³인가요?', solver: '1000000', steps: ['1m=100cm이므로 세 방향의 길이를 모두 100cm로 바꿉니다.', '100×100×100=1000000이므로 1m³=1000000cm³입니다.'], visual: cuboid(100, 100, 100, 'structure') },
    { family: 'a-opposite-faces-omitted-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-17]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 2cm인 직육면체의 겉넓이를 구하면서 서로 다른 세 면의 넓이를 한 번씩만 더했습니다. 올바른 겉넓이보다 몇 cm² 작게 구했나요?', solver: 'p * (p + 1) + 2 * p + 2 * (p + 1)', steps: ['서로 다른 세 면의 넓이 합은 {{p * (p + 1) + 2 * p + 2 * (p + 1)}}cm²입니다.', '마주 보는 면까지 포함한 겉넓이는 그 2배입니다.', '따라서 빠뜨린 세 면의 합도 {{p * (p + 1) + 2 * p + 2 * (p + 1)}}cm²입니다.'], visual: cuboid('{{p}}', 2, '{{p + 1}}', 'faces') },
    { family: 'a-dimensions-added-for-volume-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 2cm, 높이 3cm인 직육면체의 부피를 세 길이를 더해 {{p + 5}}cm³라고 했습니다. 올바른 부피와의 차는 몇 cm³인가요?', solver: '5 * p - 5', steps: ['올바른 부피는 {{p}}×2×3={{6 * p}}cm³입니다.', '잘못 구한 값은 {{p + 5}}cm³입니다.', '차는 {{6 * p}}-{{p + 5}}={{5 * p - 5}}cm³입니다.'], visual: cuboid('{{p}}', 3, 2, 'structure') },
  ],
  B: [
    { family: 'b-larger-cube-surface-area', domain: 'knowing', pattern: 'direct', standard: '[6수03-17]', prompt: '한 모서리가 {{p + 1}}cm인 정육면체의 겉넓이는 몇 cm²인가요?', solver: '6 * (p + 1) * (p + 1)', steps: ['한 면의 넓이는 {{(p + 1) * (p + 1)}}cm²입니다.', '같은 면 6개이므로 {{6 * (p + 1) * (p + 1)}}cm²입니다.'], visual: cuboid('{{p + 1}}', '{{p + 1}}', '{{p + 1}}', 'faces') },
    { family: 'b-one-layer-unit-cubes', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-18]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 1cm인 한 층을 1cm³ 쌓기나무로 채웁니다. 몇 개 필요한가요?', solver: 'p * (p + 1)', steps: ['높이 1cm인 한 층에는 밑면의 1cm² 칸 수만큼 들어갑니다.', '{{p}}×{{p + 1}}={{p * (p + 1)}}개입니다.'], visual: cuboid('{{p}}', 1, '{{p + 1}}', 'structure') },
    { family: 'b-cuboid-volume-three-four', domain: 'knowing', pattern: 'direct', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 4cm, 높이 3cm인 직육면체의 부피는 몇 cm³인가요?', solver: '12 * p', steps: ['부피=가로×세로×높이입니다.', '{{p}}×4×3={{12 * p}}cm³입니다.'], visual: cuboid('{{p}}', 3, 4, 'structure') },
    { family: 'b-multiple-cubic-meter-conversion', domain: 'knowing', pattern: 'representation_shift', standard: '[6수03-18]', prompt: '{{p}}m³는 몇 cm³인가요?', solver: '1000000 * p', steps: ['1m³=1000000cm³입니다.', '{{p}}m³는 1000000×{{p}}={{1000000 * p}}cm³입니다.'], visual: cuboid(100, 100, 100, 'structure') },
    { family: 'b-wrapping-paper-surface', domain: 'applying', pattern: 'multi_step', standard: '[6수03-17]', prompt: '가로 {{p}}cm, 세로 {{p + 2}}cm, 높이 2cm인 상자를 빈틈없이 포장할 때 필요한 최소 종이 넓이는 몇 cm²인가요?', solver: '2 * (p * (p + 2) + 2 * p + 2 * (p + 2))', steps: ['서로 다른 세 면의 넓이를 구해 더합니다.', '그 합의 2배는 {{2 * (p * (p + 2) + 2 * p + 2 * (p + 2))}}cm²입니다.'], visual: cuboid('{{p}}', 2, '{{p + 2}}', 'faces') },
    { family: 'b-aquarium-capacity', domain: 'applying', pattern: 'multi_step', standard: '[6수03-19]', prompt: '안쪽 가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 3cm인 직육면체 수조를 가득 채우면 물의 부피는 몇 cm³인가요?', solver: '3 * p * (p + 1)', steps: ['수조 안쪽의 세 길이를 곱합니다.', '{{p}}×{{p + 1}}×3={{3 * p * (p + 1)}}cm³입니다.'], visual: cuboid('{{p}}', 3, '{{p + 1}}', 'structure', { openTop: true, fillFraction: 1 }) },
    { family: 'b-doubled-height-volume-increase', domain: 'applying', pattern: 'multi_step', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm인 상자의 높이를 2cm에서 4cm로 늘렸습니다. 부피는 몇 cm³ 늘어났나요?', solver: '2 * p * (p + 1)', steps: ['높이는 4-2=2cm 늘었습니다.', '늘어난 부피는 밑넓이×늘어난 높이={{p}}×{{p + 1}}×2={{2 * p * (p + 1)}}cm³입니다.'], visual: cuboid('{{p}}', 4, '{{p + 1}}', 'structure', { fillFraction: 0.5 }) },
    { family: 'b-cube-surface-growth', domain: 'applying', pattern: 'compare_methods', standard: '[6수03-17]', prompt: '정육면체의 한 모서리를 {{p}}cm에서 {{p + 1}}cm로 늘렸습니다. 겉넓이는 몇 cm² 늘어났나요?', solver: '12 * p + 6', steps: ['큰 정육면체 겉넓이는 {{6 * (p + 1) * (p + 1)}}cm²입니다.', '작은 정육면체 겉넓이 {{6 * p * p}}cm²를 빼면 {{12 * p + 6}}cm²입니다.'], visual: cuboid('{{p + 1}}', '{{p + 1}}', '{{p + 1}}', 'faces') },
    { family: 'b-base-area-used-as-volume-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 3cm인 직육면체의 부피를 밑넓이만 구해 답했습니다. 올바른 부피보다 몇 cm³ 작게 구했나요?', solver: '2 * p * (p + 1)', steps: ['올바른 부피는 {{3 * p * (p + 1)}}cm³입니다.', '밑넓이만 구한 값은 {{p * (p + 1)}}입니다.', '차는 {{2 * p * (p + 1)}}cm³입니다.'], visual: cuboid('{{p}}', 3, '{{p + 1}}', 'structure') },
    { family: 'b-cubic-meter-place-value-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-18]', prompt: '{{p}}m³를 {{10000 * p}}cm³라고 잘못 바꾸었습니다. 올바른 값과의 차는 몇 cm³인가요?', solver: '990000 * p', steps: ['1m³는 100×100×100=1000000cm³입니다.', '올바른 값은 {{1000000 * p}}cm³입니다.', '{{1000000 * p}}-{{10000 * p}}={{990000 * p}}cm³입니다.'], visual: cuboid(100, 100, 100, 'structure') },
  ],
  C: [
    { family: 'c-cuboid-surface-area-three', domain: 'knowing', pattern: 'direct', standard: '[6수03-17]', prompt: '가로 {{p}}cm, 세로 {{p + 2}}cm, 높이 3cm인 직육면체의 겉넓이는 몇 cm²인가요?', solver: '2 * (p * (p + 2) + 3 * p + 3 * (p + 2))', steps: ['서로 다른 세 면의 넓이는 {{p * (p + 2)}}, {{3 * p}}, {{3 * (p + 2)}}cm²입니다.', '합의 2배는 {{2 * (p * (p + 2) + 3 * p + 3 * (p + 2))}}cm²입니다.'], visual: cuboid('{{p}}', 3, '{{p + 2}}', 'faces') },
    { family: 'c-larger-cube-volume', domain: 'knowing', pattern: 'direct', standard: '[6수03-19]', prompt: '한 모서리가 {{p + 1}}cm인 정육면체의 부피는 몇 cm³인가요?', solver: '(p + 1) * (p + 1) * (p + 1)', steps: ['한 모서리를 세 번 곱합니다.', '{{p + 1}}×{{p + 1}}×{{p + 1}}={{(p + 1) * (p + 1) * (p + 1)}}cm³입니다.'], visual: cuboid('{{p + 1}}', '{{p + 1}}', '{{p + 1}}', 'structure') },
    { family: 'c-unit-cubes-in-one-meter-cube', domain: 'knowing', pattern: 'representation_shift', standard: '[6수03-18]', prompt: '한 모서리가 1cm인 정육면체를 한 모서리가 1m인 정육면체 안에 빈틈없이 채우면 몇 개 필요한가요?', solver: '1000000', steps: ['1m=100cm이므로 한 방향에 100개씩 놓입니다.', '100×100×100=1000000개가 필요합니다.'], visual: cuboid(100, 100, 100, 'structure') },
    { family: 'c-larger-cube-six-faces', domain: 'knowing', pattern: 'systematic_counting', standard: '[6수03-17]', prompt: '한 모서리가 {{p + 1}}cm인 정육면체의 여섯 면 넓이 합은 몇 cm²인가요?', solver: '6 * (p + 1) * (p + 1)', steps: ['한 면의 넓이는 {{(p + 1) * (p + 1)}}cm²입니다.', '여섯 면의 합은 {{6 * (p + 1) * (p + 1)}}cm²입니다.'], visual: cuboid('{{p + 1}}', '{{p + 1}}', '{{p + 1}}', 'faces') },
    { family: 'c-open-top-storage-surface', domain: 'applying', pattern: 'multi_step', standard: '[6수03-17]', prompt: '가로 {{p}}cm, 세로 {{p + 2}}cm, 높이 3cm인 뚜껑 없는 수납함의 바깥 다섯 면 넓이 합은 몇 cm²인가요?', solver: '2 * (p * (p + 2) + 3 * p + 3 * (p + 2)) - p * (p + 2)', steps: ['닫힌 상자 겉넓이는 {{2 * (p * (p + 2) + 3 * p + 3 * (p + 2))}}cm²입니다.', '윗면 {{p * (p + 2)}}cm²를 빼면 {{2 * (p * (p + 2) + 3 * p + 3 * (p + 2)) - p * (p + 2)}}cm²입니다.'], visual: cuboid('{{p}}', 3, '{{p + 2}}', 'faces', { openTop: true }) },
    { family: 'c-half-full-container', domain: 'applying', pattern: 'multi_step', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 {{p + 2}}cm, 높이 4cm인 통에 내용물을 절반만 채웠습니다. 내용물의 부피는 몇 cm³인가요?', solver: '2 * p * (p + 2)', steps: ['통 전체 부피는 {{4 * p * (p + 2)}}cm³입니다.', '절반은 {{2 * p * (p + 2)}}cm³입니다.'], visual: cuboid('{{p}}', 4, '{{p + 2}}', 'structure', { openTop: true, fillFraction: 0.5 }) },
    { family: 'c-remove-one-unit-layer', domain: 'applying', pattern: 'multi_step', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 {{p + 1}}cm, 높이 5cm인 직육면체에서 높이 1cm인 맨 위 한 층을 덜어 냈습니다. 남은 부피는 몇 cm³인가요?', solver: '4 * p * (p + 1)', steps: ['처음 부피는 {{5 * p * (p + 1)}}cm³입니다.', '한 층의 부피 {{p * (p + 1)}}cm³를 빼면 {{4 * p * (p + 1)}}cm³입니다.'], visual: cuboid('{{p}}', 5, '{{p + 1}}', 'structure', { fillFraction: 0.8 }) },
    { family: 'c-find-height-from-base-and-volume', domain: 'applying', pattern: 'inverse', standard: '[6수03-19]', prompt: '가로 {{p}}cm, 세로 {{p + 2}}cm인 직육면체의 부피가 {{3 * p * (p + 2)}}cm³입니다. 높이는 몇 cm인가요?', solver: '3', steps: ['밑넓이는 {{p * (p + 2)}}cm²입니다.', '높이는 {{3 * p * (p + 2)}}÷{{p * (p + 2)}}=3cm입니다.'], visual: cuboid('{{p}}', 3, '{{p + 2}}', 'structure', { unknownMeasurement: 'height' }) },
    { family: 'c-volume-used-for-surface-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-17]', prompt: '가로 {{p}}cm, 세로 2cm, 높이 2cm인 직육면체의 겉넓이를 세 길이의 곱으로 잘못 구했습니다. 올바른 겉넓이와 잘못 구한 값의 차는 몇 cm²인가요?', solver: '4 * p + 8', steps: ['올바른 겉넓이는 2×({{2 * p}}+{{2 * p}}+4)={{8 * p + 8}}cm²입니다.', '세 길이의 곱은 {{4 * p}}입니다.', '차는 {{8 * p + 8}}-{{4 * p}}={{4 * p + 8}}cm²입니다.'], visual: cuboid('{{p}}', 2, 2, 'faces') },
    { family: 'c-six-volumes-used-for-surface-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-17]', prompt: '가로 {{p}}cm, 세로 3cm, 높이 2cm인 직육면체의 겉넓이를 가로×세로×높이×6으로 잘못 구했습니다. 잘못 구한 값은 올바른 겉넓이보다 몇 cm² 큰가요?', solver: '26 * p - 12', steps: ['잘못 구한 값은 {{p}}×3×2×6={{36 * p}}입니다.', '올바른 겉넓이는 2×({{3 * p}}+{{2 * p}}+6)={{10 * p + 12}}cm²입니다.', '차는 {{36 * p}}-{{10 * p + 12}}={{26 * p - 12}}cm²입니다.'], visual: cuboid('{{p}}', 2, 3, 'faces') },
  ],
}

const connectedStandards = {
  '[6수03-17]': ['[6수03-19]'],
  '[6수03-18]': ['[6수03-19]'],
  '[6수03-19]': ['[6수03-17]', '[6수03-18]'],
}

const templates = sets.flatMap((setId) => setDefinitions[setId].map((definition, index) => ({
  id: `tmpl-g6volume-${setId}-${String(index + 1).padStart(2, '0')}`,
  concept_id: 'g6volume-001',
  type: 'number',
  difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
  set_id: setId,
  taskActions: explicitTaskActionsFor(definition),
  problem_family: definition.family,
  blueprint: {
    problemFamily: definition.family,
    cognitiveDomain: definition.domain,
    reasoningPattern: definition.pattern,
    primaryStandard: definition.standard,
    connectedStandards: connectedStandards[definition.standard],
    representations: index >= 4
      ? ['text', 'equation', 'diagram']
      : ['text', 'diagram'],
    contextType: index < 4 ? 'pure_math' : index < 8 ? 'real_world' : 'puzzle',
    estimatedSteps: index >= 8 ? 3 : 2,
    readingLoad: index >= 8 ? 'medium' : 'low',
    visualSemantics: 'quantitative',
  },
  param_schema: {
    p: {
      min: setId === 'A' ? 3 : setId === 'B' ? 3 : 4,
      max: setId === 'A' ? 6 : setId === 'B' ? 7 : 8,
    },
  },
  prompt_template: definition.prompt,
  solver_rule: definition.solver,
  solution_steps_template: definition.steps,
  hint_steps_template: [
    definition.standard === '[6수03-17]'
      ? '서로 다른 세 면의 넓이를 구하고 마주 보는 면이 두 장씩인지 확인해요.'
      : definition.standard === '[6수03-18]'
        ? '길이 단위를 먼저 바꾸고 가로·세로·높이 세 방향에 모두 적용해요.'
        : '가로×세로로 한 층의 넓이를 구한 뒤 높이만큼 쌓인 층 수를 곱해요.',
    index >= 8
      ? '올바른 식과 제시된 식을 각각 계산해 빠뜨리거나 더 센 양을 비교해요.'
      : 'cm²는 면의 넓이, cm³는 1cm³ 쌓기나무의 개수라는 뜻을 확인해요.',
  ],
  visual_template: definition.visual,
})))

function serializeTemplates(value = templates) {
  return `${JSON.stringify(value, null, 2)}\n`
}

if (require.main === module) {
  fs.writeFileSync(outputPath, serializeTemplates())
  console.log(`Wrote ${templates.length} Grade 6 surface-area/volume templates to ${outputPath}`)
}

module.exports = { templates, serializeTemplates }
