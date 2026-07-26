const fs = require('fs')
const path = require('path')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6circle.json')
const sets = ['A', 'B', 'C']

const circle = (radius, focus, measureLabel, overrides = {}) => ({
  type: 'circle-measurement',
  semantics: 'quantitative',
  radius,
  pi: 3.14,
  focus,
  measureLabel,
  copies: 1,
  unit: 'cm',
  ...overrides,
})

const setDefinitions = {
  A: [
    { family: 'a-diameter-from-radius', domain: 'knowing', pattern: 'direct', standard: '[6수03-15]', prompt: '반지름이 {{p}}cm인 원의 지름은 몇 cm인가요?', solver: '2 * p', steps: ['지름은 반지름의 2배입니다.', '{{p}}×2={{2 * p}}cm입니다.'], visual: circle('{{p}}', 'composite', 'radius') },
    { family: 'a-measured-circumference-diameter-ratio', domain: 'knowing', pattern: 'model_and_check', standard: '[6수03-15]', prompt: '그림의 원주를 지름으로 나눈 값은 얼마인가요?', solver: '3.14', steps: ['원주는 {{628 * p / 100}}cm이고 지름은 {{2 * p}}cm입니다.', '{{628 * p / 100}}÷{{2 * p}}=3.14이므로 원주율은 3.14입니다.'], visual: circle('{{p}}', 'pi', 'diameter') },
    { family: 'a-circumference-from-diameter', domain: 'knowing', pattern: 'direct', standard: '[6수03-16]', prompt: '지름이 {{2 * p}}cm인 원의 원주를 원주율 3.14로 구하세요.', solver: '628 * p / 100', steps: ['원주=지름×원주율입니다.', '{{2 * p}}×3.14={{628 * p / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'diameter') },
    { family: 'a-area-from-radius', domain: 'knowing', pattern: 'direct', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 원의 넓이를 원주율 3.14로 구하세요.', solver: '314 * p * p / 100', steps: ['원의 넓이=반지름×반지름×원주율입니다.', '{{p}}×{{p}}×3.14={{314 * p * p / 100}}cm²입니다.'], visual: circle('{{p}}', 'area', 'radius') },
    { family: 'a-wheel-two-turn-distance', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 바퀴가 미끄러지지 않고 2바퀴 굴렀습니다. 이동한 거리는 몇 cm인가요?', solver: '1256 * p / 100', steps: ['바퀴 한 바퀴의 이동 거리는 원주인 {{628 * p / 100}}cm입니다.', '2바퀴는 {{628 * p / 100}}×2={{1256 * p / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'radius', { copies: 2 }) },
    { family: 'a-semicircle-curved-arc', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 반원의 굽은 부분 길이는 몇 cm인가요? 원주율은 3.14로 계산하세요.', solver: '314 * p / 100', steps: ['반원의 굽은 부분은 같은 반지름인 원주의 절반입니다.', '{{628 * p / 100}}÷2={{314 * p / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'radius') },
    { family: 'a-circular-fence-with-gate', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}m인 원 모양 화단 둘레에 울타리를 치되 2m 너비의 출입구는 비워 둡니다. 필요한 울타리 길이는 몇 m인가요?', solver: '(628 * p - 200) / 100', steps: ['화단의 원주는 {{628 * p / 100}}m입니다.', '출입구 2m를 빼면 {{628 * p / 100}}-2={{(628 * p - 200) / 100}}m입니다.'], visual: circle('{{p}}', 'circumference', 'radius', { unit: 'm' }) },
    { family: 'a-two-circular-mats-area', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 같은 원 모양 매트 2장의 넓이 합은 몇 cm²인가요?', solver: '628 * p * p / 100', steps: ['매트 한 장의 넓이는 {{314 * p * p / 100}}cm²입니다.', '2장의 넓이는 {{314 * p * p / 100}}×2={{628 * p * p / 100}}cm²입니다.'], visual: circle('{{p}}', 'area', 'radius', { copies: 2 }) },
    { family: 'a-radius-used-as-diameter-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 같은 원 2개의 원주를 구하면서 각 원의 반지름을 지름처럼 3.14에 곱했습니다. 두 원에서 올바른 원주와 잘못 구한 값의 차를 모두 합하면 몇 cm인가요?', solver: '628 * p / 100', steps: ['원 하나의 올바른 원주는 {{628 * p / 100}}cm이고 잘못 구한 값은 {{314 * p / 100}}cm입니다.', '원 하나에서 차는 {{314 * p / 100}}cm입니다.', '두 원의 차를 합하면 {{314 * p / 100}}×2={{628 * p / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'radius', { copies: 2 }) },
    { family: 'a-circumference-formula-used-for-area', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 같은 원 2개의 넓이를 각각 반지름×2×3.14로 잘못 구했습니다. 두 원에서 올바른 넓이와 잘못 구한 값의 차를 모두 합하면 몇 cm²인가요?', solver: '628 * (p * p - 2 * p) / 100', steps: ['원 하나의 올바른 넓이는 {{314 * p * p / 100}}cm²이고 잘못 구한 값은 {{628 * p / 100}}입니다.', '원 하나에서 차는 {{314 * (p * p - 2 * p) / 100}}cm²입니다.', '두 원의 차를 합하면 {{628 * (p * p - 2 * p) / 100}}cm²입니다.'], visual: circle('{{p}}', 'area', 'radius', { copies: 2 }) },
  ],
  B: [
    { family: 'b-radius-from-diameter', domain: 'knowing', pattern: 'inverse', standard: '[6수03-15]', prompt: '지름이 {{2 * p}}cm인 원의 반지름은 몇 cm인가요?', solver: 'p', steps: ['반지름은 지름의 절반입니다.', '{{2 * p}}÷2={{p}}cm입니다.'], visual: circle('{{p}}', 'composite', 'diameter') },
    { family: 'b-object-pi-ratio-check', domain: 'knowing', pattern: 'model_and_check', standard: '[6수03-15]', prompt: '원 모양 물체의 지름과 측정한 원주를 그림처럼 얻었습니다. 원주÷지름의 값을 구하세요.', solver: '3.14', steps: ['원주는 {{628 * p / 100}}cm, 지름은 {{2 * p}}cm입니다.', '{{628 * p / 100}}÷{{2 * p}}=3.14입니다.'], visual: circle('{{p}}', 'pi', 'diameter') },
    { family: 'b-circumference-from-radius', domain: 'knowing', pattern: 'direct', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 원의 원주를 원주율 3.14로 구하세요.', solver: '628 * p / 100', steps: ['지름은 {{2 * p}}cm입니다.', '{{2 * p}}×3.14={{628 * p / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'radius') },
    { family: 'b-area-from-diameter', domain: 'knowing', pattern: 'multi_step', standard: '[6수03-16]', prompt: '지름이 {{2 * p}}cm인 원의 넓이를 원주율 3.14로 구하세요.', solver: '314 * p * p / 100', steps: ['반지름은 {{2 * p}}÷2={{p}}cm입니다.', '{{p}}×{{p}}×3.14={{314 * p * p / 100}}cm²입니다.'], visual: circle('{{p}}', 'area', 'diameter') },
    { family: 'b-three-wheels-one-turn', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 같은 바퀴 3개가 각각 한 바퀴씩 굴렀습니다. 세 바퀴의 이동 거리 합은 몇 cm인가요?', solver: '1884 * p / 100', steps: ['한 바퀴의 원주는 {{628 * p / 100}}cm입니다.', '3개의 합은 {{628 * p / 100}}×3={{1884 * p / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'radius', { copies: 3 }) },
    { family: 'b-one-unit-wide-circular-ring', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '바깥 반지름이 {{p + 1}}cm이고 안쪽 반지름이 {{p}}cm인 고리 모양의 넓이는 몇 cm²인가요?', solver: '314 * (2 * p + 1) / 100', steps: ['바깥 원 넓이는 {{314 * (p + 1) * (p + 1) / 100}}cm²입니다.', '안쪽 원 넓이 {{314 * p * p / 100}}cm²를 빼면 {{314 * (2 * p + 1) / 100}}cm²입니다.'], visual: circle('{{p + 1}}', 'area', 'none', { innerRadius: '{{p}}' }) },
    { family: 'b-one-unit-hole-painted-area', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 원판에서 반지름이 {{p - 1}}cm인 가운데 원을 칠하지 않았습니다. 칠한 넓이는 몇 cm²인가요?', solver: '314 * (2 * p - 1) / 100', steps: ['전체 원판 넓이는 {{314 * p * p / 100}}cm²입니다.', '가운데 넓이 {{314 * (p - 1) * (p - 1) / 100}}cm²를 빼면 {{314 * (2 * p - 1) / 100}}cm²입니다.'], visual: circle('{{p}}', 'area', 'none', { innerRadius: '{{p - 1}}' }) },
    { family: 'b-semicircle-area', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 반원의 넓이는 몇 cm²인가요? 원주율은 3.14로 계산하세요.', solver: '157 * p * p / 100', steps: ['같은 반지름인 원의 넓이는 {{314 * p * p / 100}}cm²입니다.', '그 절반은 {{157 * p * p / 100}}cm²입니다.'], visual: circle('{{p}}', 'area', 'radius') },
    { family: 'b-diameter-squared-area-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 같은 원 2개의 넓이를 각각 지름×지름×3.14로 잘못 구했습니다. 두 원에서 잘못 구한 넓이와 올바른 넓이의 차를 모두 합하면 몇 cm²인가요?', solver: '1884 * p * p / 100', steps: ['원 하나의 올바른 넓이는 {{314 * p * p / 100}}cm²이고 잘못 구한 값은 {{1256 * p * p / 100}}cm²입니다.', '원 하나에서 차는 {{942 * p * p / 100}}cm²입니다.', '두 원의 차를 합하면 {{1884 * p * p / 100}}cm²입니다.'], visual: circle('{{p}}', 'area', 'radius', { copies: 2 }) },
    { family: 'b-pi-three-circumference-gap', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-15]', prompt: '반지름이 {{p}}cm인 같은 원 3개에서 원주율 3으로 어림한 원주와 원주율 3.14로 구한 원주의 차를 모두 합하면 몇 cm인가요?', solver: '84 * p / 100', steps: ['원 하나에서 원주율 3.14를 쓴 원주는 {{628 * p / 100}}cm, 원주율 3을 쓴 값은 {{6 * p}}cm입니다.', '원 하나에서 차는 {{28 * p / 100}}cm입니다.', '세 원의 차를 합하면 {{28 * p / 100}}×3={{84 * p / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'radius', { copies: 3 }) },
  ],
  C: [
    { family: 'c-diameter-from-larger-radius', domain: 'knowing', pattern: 'direct', standard: '[6수03-15]', prompt: '반지름이 {{p + 1}}cm인 원의 지름은 몇 cm인가요?', solver: '2 * p + 2', steps: ['지름은 반지름의 2배입니다.', '{{p + 1}}×2={{2 * p + 2}}cm입니다.'], visual: circle('{{p + 1}}', 'composite', 'radius') },
    { family: 'c-half-diameter-radius', domain: 'knowing', pattern: 'inverse', standard: '[6수03-15]', prompt: '지름이 {{2 * p}}cm인 원에서 중심부터 원 위까지의 거리는 몇 cm인가요?', solver: 'p', steps: ['중심부터 원 위까지의 거리는 반지름입니다.', '지름의 절반인 {{p}}cm입니다.'], visual: circle('{{p}}', 'composite', 'diameter') },
    { family: 'c-measured-pi-constant', domain: 'knowing', pattern: 'model_and_check', standard: '[6수03-15]', prompt: '그림에서 측정한 원주와 지름의 비를 소수로 나타내세요.', solver: '3.14', steps: ['원주 {{628 * p / 100}}cm를 지름 {{2 * p}}cm로 나눕니다.', '그 비는 3.14로 일정합니다.'], visual: circle('{{p}}', 'pi', 'diameter') },
    { family: 'c-area-from-larger-radius', domain: 'knowing', pattern: 'direct', standard: '[6수03-16]', prompt: '반지름이 {{p + 1}}cm인 원의 넓이를 원주율 3.14로 구하세요.', solver: '314 * (p + 1) * (p + 1) / 100', steps: ['원의 넓이는 반지름×반지름×원주율입니다.', '{{p + 1}}×{{p + 1}}×3.14={{314 * (p + 1) * (p + 1) / 100}}cm²입니다.'], visual: circle('{{p + 1}}', 'area', 'radius') },
    { family: 'c-table-edge-ribbon-with-knot', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 원형 탁자 가장자리를 리본으로 한 바퀴 두르고 매듭에 1cm를 더 씁니다. 리본은 몇 cm 필요한가요?', solver: '(628 * p + 100) / 100', steps: ['탁자 가장자리 길이는 {{628 * p / 100}}cm입니다.', '매듭 1cm를 더하면 {{(628 * p + 100) / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'radius') },
    { family: 'c-four-semicircular-arcs', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 같은 반원 4개의 굽은 부분 길이를 모두 더하면 몇 cm인가요?', solver: '1256 * p / 100', steps: ['반원 하나의 굽은 부분은 {{314 * p / 100}}cm입니다.', '4개의 합은 {{314 * p / 100}}×4={{1256 * p / 100}}cm입니다.'], visual: circle('{{p}}', 'circumference', 'radius', { copies: 4 }) },
    { family: 'c-two-unit-wide-pond-ring', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '바깥 반지름이 {{p + 2}}m이고 안쪽 반지름이 {{p}}m인 원형 산책로의 넓이는 몇 m²인가요?', solver: '1256 * (p + 1) / 100', steps: ['바깥 원 넓이에서 안쪽 원 넓이를 뺍니다.', '3.14×(({{p + 2}}×{{p + 2}})-({{p}}×{{p}}))={{1256 * (p + 1) / 100}}m²입니다.'], visual: circle('{{p + 2}}', 'area', 'none', { innerRadius: '{{p}}', unit: 'm' }) },
    { family: 'c-doubled-radius-area-increase', domain: 'applying', pattern: 'multi_step', standard: '[6수03-16]', prompt: '원의 반지름을 {{p}}cm에서 {{2 * p}}cm로 늘렸습니다. 넓이는 몇 cm² 늘어났나요?', solver: '942 * p * p / 100', steps: ['큰 원의 넓이는 {{1256 * p * p / 100}}cm²입니다.', '처음 원의 넓이 {{314 * p * p / 100}}cm²를 빼면 {{942 * p * p / 100}}cm²입니다.'], visual: circle('{{2 * p}}', 'area', 'none', { innerRadius: '{{p}}' }) },
    { family: 'c-radius-used-for-pi-ratio-error', domain: 'reasoning', pattern: 'error_analysis', standard: '[6수03-15]', prompt: '같은 크기의 원 {{p + 1}}개에서 원주를 지름이 아니라 반지름으로 나누어 원주율을 구했습니다. 잘못 구한 값과 올바른 원주율의 차를 모두 합하면 얼마인가요?', solver: '314 * (p + 1) / 100', steps: ['원주를 반지름으로 나누면 6.28이 되어 올바른 3.14보다 3.14 큽니다.', '이 실수를 {{p + 1}}번 반복하면 차의 합은 3.14×{{p + 1}}={{314 * (p + 1) / 100}}입니다.'], visual: circle('{{p}}', 'pi', 'diameter') },
    { family: 'c-area-circumference-numeric-gap', domain: 'reasoning', pattern: 'compare_methods', standard: '[6수03-16]', prompt: '반지름이 {{p}}cm인 같은 원 2개에서 넓이의 수와 원주의 수를 각각 원주율 3.14로 구했습니다. 두 원의 넓이 수 합은 원주 수 합보다 얼마 큰가요?', solver: '628 * (p * p - 2 * p) / 100', steps: ['원 하나에서 넓이의 수는 {{314 * p * p / 100}}, 원주의 수는 {{628 * p / 100}}입니다.', '원 하나에서 차는 {{314 * (p * p - 2 * p) / 100}}입니다.', '두 원의 차를 합하면 {{628 * (p * p - 2 * p) / 100}}입니다.'], visual: circle('{{p}}', 'composite', 'radius', { copies: 2 }) },
  ],
}

const templates = sets.flatMap((setId) => setDefinitions[setId].map((definition, index) => ({
  id: `tmpl-g6circle-${setId}-${String(index + 1).padStart(2, '0')}`,
  concept_id: 'g6circle-001',
  type: 'number',
  difficulty: index < 4 ? 1 : index < 8 ? 2 : 3,
  set_id: setId,
  problem_family: definition.family,
  blueprint: {
    problemFamily: definition.family,
    cognitiveDomain: definition.domain,
    reasoningPattern: definition.pattern,
    primaryStandard: definition.standard,
    connectedStandards: [
      definition.standard === '[6수03-16]' ? '[6수03-15]' : '[6수03-16]',
    ],
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
    definition.standard === '[6수03-15]'
      ? '지름은 반지름의 2배이고, 원주율은 원주를 지름으로 나눈 값이에요.'
      : '원주는 지름×원주율, 넓이는 반지름×반지름×원주율로 구해요.',
    index >= 8
      ? '올바른 식과 제시된 식을 각각 계산한 뒤 차가 무엇을 뜻하는지 확인해요.'
      : '반지름과 지름 중 어떤 길이가 주어졌는지 먼저 표시하고 단위를 확인해요.',
  ],
  visual_template: definition.visual,
})))

function serializeTemplates(value = templates) {
  return `${JSON.stringify(value, null, 2)}\n`
}

if (require.main === module) {
  fs.writeFileSync(outputPath, serializeTemplates())
  console.log(`Wrote ${templates.length} Grade 6 circle templates to ${outputPath}`)
}

module.exports = { templates, serializeTemplates }
