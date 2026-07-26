const fs = require('fs')
const path = require('path')
const { explicitTaskActionsFor } = require('./grade6-quality-metadata')

const outputPath = path.join(__dirname, '..', 'public', 'data', 'templates', 'g6spatial.json')
const sets = ['A', 'B', 'C']

const spatialVisual = (heights, mode) => ({
  type: 'cube-stack',
  semantics: 'quantitative',
  heights,
  mode,
})

const setModels = {
  A: {
    heights: [['{{p}}', 1], [2, 0]],
    total: 'p + 3',
    occupied: '3',
    lower: 'p',
    frontSum: 'p + 1',
    sideSum: 'p + 2',
    raised: 'p + 6',
    totalGap: '2',
    topGap: '1',
    repeatedTotalGap: '2 * p',
    repeatedTopGap: 'p + 1',
    p: { min: 2, max: 5 },
  },
  B: {
    heights: [['{{p}}', 2], [1, 1]],
    total: 'p + 4',
    occupied: '4',
    lower: 'p',
    frontSum: 'p + 2',
    sideSum: 'p + 1',
    raised: 'p + 8',
    totalGap: '2',
    topGap: '1',
    repeatedTotalGap: '2 * p',
    repeatedTopGap: 'p + 1',
    p: { min: 3, max: 6 },
  },
  C: {
    heights: [['{{p}}', 1, 2], [0, 2, 1]],
    total: 'p + 6',
    occupied: '5',
    lower: 'p + 1',
    frontSum: 'p + 4',
    sideSum: 'p + 2',
    raised: 'p + 11',
    totalGap: '4',
    topGap: '1',
    repeatedTotalGap: '4 * p',
    repeatedTopGap: 'p + 1',
    p: { min: 3, max: 6 },
  },
}

function definitionsFor(setId) {
  const model = setModels[setId]
  const prefix = setId.toLowerCase()
  const viewLabel = setId === 'C' ? '여섯 칸' : '네 칸'
  return [
    {
      family: `${prefix}-stack-total-cubes`,
      domain: 'knowing',
      pattern: 'systematic_counting',
      standard: '[6수03-09]',
      prompt: '그림의 각 자리에 쌓인 나무 수를 층별로 모두 세면 쌓기나무는 몇 개인가요?',
      solver: model.total,
      steps: [
        '각 자리의 기둥 높이는 그림의 쌓기나무 수와 같습니다.',
        `모든 기둥을 더하면 {{${model.total}}}개입니다.`,
      ],
      mode: 'stack',
    },
    {
      family: `${prefix}-top-view-occupied-cells`,
      domain: 'knowing',
      pattern: 'representation_shift',
      standard: '[6수03-10]',
      prompt: '이 입체도형을 위에서 보았을 때 쌓기나무가 보이는 칸은 몇 칸인가요?',
      solver: model.occupied,
      steps: [
        '위에서 보면 높이에 관계없이 쌓기나무가 하나라도 있는 자리가 한 칸으로 보입니다.',
        `빈 자리를 빼면 {{${model.occupied}}}칸입니다.`,
      ],
      mode: 'top',
    },
    {
      family: `${prefix}-front-view-highest-column`,
      domain: 'knowing',
      pattern: 'representation_shift',
      standard: '[6수03-10]',
      prompt: '앞에서 본 모양에서 가장 높은 세로줄의 칸 수는 몇 칸인가요?',
      solver: 'p',
      steps: [
        '앞에서 같은 가로 위치에 겹치는 기둥 중 가장 높은 높이를 봅니다.',
        '가장 높은 세로줄은 {{p}}칸입니다.',
      ],
      mode: 'front',
    },
    {
      family: `${prefix}-side-view-highest-column`,
      domain: 'knowing',
      pattern: 'representation_shift',
      standard: '[6수03-10]',
      prompt: '옆에서 본 모양에서 가장 높은 세로줄의 칸 수는 몇 칸인가요?',
      solver: 'p',
      steps: [
        '옆에서 같은 깊이 위치에 겹치는 기둥 중 가장 높은 높이를 봅니다.',
        '가장 높은 세로줄은 {{p}}칸입니다.',
      ],
      mode: 'side',
    },
    {
      family: `${prefix}-cubes-below-top-layer`,
      domain: 'applying',
      pattern: 'multi_step',
      standard: '[6수03-09]',
      prompt: '각 기둥의 맨 위 쌓기나무를 하나씩 빼면 남는 쌓기나무는 몇 개인가요?',
      solver: model.lower,
      steps: [
        `전체 쌓기나무는 {{${model.total}}}개이고, 쌓기나무가 있는 자리는 {{${model.occupied}}}곳입니다.`,
        `각 자리에서 하나씩 빼면 {{${model.total}}}-{{${model.occupied}}}={{${model.lower}}}개가 남습니다.`,
      ],
      mode: 'stack',
    },
    {
      family: `${prefix}-front-view-square-total`,
      domain: 'applying',
      pattern: 'model_and_check',
      standard: '[6수03-10]',
      prompt: '앞에서 본 모양을 단위 정사각형으로 채우려면 정사각형은 모두 몇 개 필요한가요?',
      solver: model.frontSum,
      steps: [
        '앞에서 같은 가로 위치의 기둥은 가장 높은 높이만 남깁니다.',
        `앞 모양의 세로줄 높이를 더하면 {{${model.frontSum}}}개입니다.`,
      ],
      mode: 'front',
    },
    {
      family: `${prefix}-side-view-square-total`,
      domain: 'applying',
      pattern: 'model_and_check',
      standard: '[6수03-10]',
      prompt: '옆에서 본 모양을 단위 정사각형으로 채우려면 정사각형은 모두 몇 개 필요한가요?',
      solver: model.sideSum,
      steps: [
        '옆에서 같은 깊이 위치의 기둥은 가장 높은 높이만 남깁니다.',
        `옆 모양의 세로줄 높이를 더하면 {{${model.sideSum}}}개입니다.`,
      ],
      mode: 'side',
    },
    {
      family: `${prefix}-raise-every-occupied-column`,
      domain: 'applying',
      pattern: 'multi_step',
      standard: '[6수03-09]',
      prompt: '쌓기나무가 있는 모든 자리의 맨 위에 쌓기나무를 하나씩 더 놓았습니다. 새 입체도형의 쌓기나무는 모두 몇 개인가요?',
      solver: model.raised,
      steps: [
        `처음에는 {{${model.total}}}개이고, 위에서 보이는 {{${model.occupied}}}개 자리에 하나씩 더 놓습니다.`,
        `따라서 {{${model.total}}}+{{${model.occupied}}}={{${model.raised}}}개입니다.`,
      ],
      mode: 'stack',
    },
    {
      family: `${prefix}-projection-used-as-total-error`,
      domain: 'reasoning',
      pattern: 'error_analysis',
      standard: '[6수03-09]',
      prompt: '한 학생이 그림과 같은 입체도형 {{p}}개에서 각각 앞에서 본 정사각형 수를 전체 쌓기나무 수로 잘못 답했습니다. 실제 전체와 잘못 센 수의 차를 모두 합하면 몇 개인가요?',
      solver: model.repeatedTotalGap,
      steps: [
        `앞에서 보이는 정사각형은 {{${model.frontSum}}}개이지만, 뒤에 가려진 쌓기나무도 있습니다.`,
        `입체도형 하나에서 실제 전체 {{${model.total}}}개와의 차는 {{${model.totalGap}}}개입니다.`,
        `같은 실수를 {{p}}번 반복했으므로 차의 합은 {{${model.repeatedTotalGap}}}개입니다.`,
      ],
      mode: 'all-views',
    },
    {
      family: `${prefix}-top-view-empty-cell-error`,
      domain: 'reasoning',
      pattern: 'error_analysis',
      standard: '[6수03-10]',
      prompt: `한 학생이 그림과 같은 입체도형을 {{p + 1}}번 관찰하면서 위에서 본 ${viewLabel}을 매번 모두 채워 그렸습니다. 실제 모양과 비교해 잘못 채운 칸 수를 모두 합하면 몇 칸인가요?`,
      solver: model.repeatedTopGap,
      steps: [
        `위에서 본 전체 격자는 ${viewLabel}이지만 쌓기나무가 없는 빈자리가 있습니다.`,
        `실제로 보이는 칸은 {{${model.occupied}}}칸이므로 한 번에 잘못 채운 칸은 {{${model.topGap}}}칸입니다.`,
        `{{p + 1}}번 그렸으므로 잘못 채운 칸은 모두 {{${model.repeatedTopGap}}}칸입니다.`,
      ],
      mode: 'all-views',
    },
  ]
}

const templates = sets.flatMap((setId) => definitionsFor(setId).map((definition, index) => ({
  id: `tmpl-g6spatial-${setId}-${String(index + 1).padStart(2, '0')}`,
  concept_id: 'g6spatial-001',
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
    connectedStandards: [
      definition.standard === '[6수03-09]' ? '[6수03-10]' : '[6수03-09]',
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
    p: setModels[setId].p,
  },
  prompt_template: definition.prompt,
  solver_rule: definition.solver,
  solution_steps_template: definition.steps,
  hint_steps_template: [
    definition.standard === '[6수03-09]'
      ? '각 자리의 높이를 따로 세고, 가려진 쌓기나무까지 빠짐없이 더해 보세요.'
      : '위에서는 차지한 자리, 앞과 옆에서는 같은 방향으로 겹친 기둥의 가장 큰 높이를 봐요.',
    index >= 8
      ? '친구가 센 대상이 전체 입체인지 한 방향의 그림인지 먼저 구별해요.'
      : '입체도형과 한 방향에서 본 평면 모양을 서로 비교해 검산해요.',
  ],
  visual_template: spatialVisual(setModels[setId].heights, definition.mode),
})))

function serializeTemplates(value = templates) {
  return `${JSON.stringify(value, null, 2)}\n`
}

if (require.main === module) {
  fs.writeFileSync(outputPath, serializeTemplates())
  console.log(`Wrote ${templates.length} Grade 6 spatial templates to ${outputPath}`)
}

module.exports = { templates, serializeTemplates }
