const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'templates',
  'pattern.json'
)

const familyBySlot = [
  'pattern-rule-multiplicative',
  'pattern-rule-additive',
  'pattern-rule-affine',
  'pattern-inverse-multiplicative',
  'pattern-context-equal-groups',
  'pattern-context-fixed-plus-rate',
  'pattern-inverse-affine',
  'pattern-shift-then-scale',
  'pattern-rule-comparison-gap',
  'pattern-additive-error-gap',
]

const setConfigs = {
  A: {
    ranges: {
      k: { min: 2, max: 3 },
      d: { min: 2, max: 3 },
      t: { min: 6, max: 8 },
    },
    prompts: [
      '입력 수의 {{k}}배인 수가 대응합니다. 입력 수가 {{t}}일 때 대응하는 수를 구하세요.',
      '입력 수보다 {{d}}만큼 큰 수가 대응합니다. 입력 수가 {{t}}일 때 대응하는 수를 구하세요.',
      '입력 수의 {{k}}배에 {{d}}만큼 더한 수가 대응합니다. 입력 수가 {{t}}일 때 대응하는 수를 구하세요.',
      '입력 수의 {{k}}배가 대응하는 수이고, 대응하는 수가 {{k * t}}입니다. 입력 수를 구하세요.',
      '다음은 생활 속 대응 관계입니다. 한 봉지에 붙임 딱지를 {{k}}장씩 넣습니다. 봉지가 {{t}}개일 때 붙임 딱지는 모두 몇 장인가요?',
      '다음은 생활 속 대응 관계입니다. 구슬 장식을 만들 때 처음에 구슬 {{d}}개를 놓고, 한 줄마다 {{k}}개씩 더 놓습니다. 줄이 {{t}}개일 때 구슬은 모두 몇 개인가요?',
      '다음은 생활 속 대응 관계입니다. 입장할 때 놀이 토큰 {{d}}개를 내고, 놀이 기구 한 번마다 {{k}}개씩 더 냅니다. 토큰을 모두 {{k * t + d}}개 냈다면 놀이 기구를 몇 번 탔나요?',
      '다음은 생활 속 대응 관계입니다. 한 모둠에 학생 {{t}}명과 도우미 {{d}}명이 있습니다. 같은 모둠이 {{k}}개일 때 사람은 모두 몇 명인가요?',
      '규칙 가는 입력 수의 {{k}}배에 {{d}}만큼 더합니다. 규칙 나는 입력 수의 {{k + 1}}배입니다. 입력 수가 {{t}}일 때 두 결과의 차이는 얼마인가요?',
      '실제 규칙은 입력 수의 {{k}}배를 구하는 것입니다. 민수는 잘못하여 입력 수보다 {{k}}만큼 큰 수를 구했습니다. 입력 수가 {{t}}일 때 실제 결과와 민수의 결과의 차이는 얼마인가요?',
    ],
  },
  B: {
    ranges: {
      k: { min: 3, max: 4 },
      d: { min: 2, max: 4 },
      t: { min: 7, max: 10 },
    },
    prompts: [
      '수 기계에 넣는 수가 {{t}}이면 넣은 수의 {{k}}배가 나옵니다. 나오는 수를 구하세요.',
      '대응표에서 아래쪽 수는 위쪽 수보다 {{d}}만큼 큽니다. 위쪽 수가 {{t}}일 때 아래쪽 수를 구하세요.',
      '대응하는 수는 입력 수의 {{k}}배보다 {{d}}만큼 큽니다. 입력 수가 {{t}}일 때 대응하는 수를 구하세요.',
      '어떤 수를 {{k}}배 했더니 {{k * t}}가 되었습니다. 어떤 수를 구하세요.',
      '다음은 생활 속 대응 관계입니다. 의자 한 줄에 {{k}}명씩 앉습니다. 줄이 {{t}}개일 때 앉을 수 있는 사람은 모두 몇 명인가요?',
      '다음은 생활 속 대응 관계입니다. 택배 상자에는 완충재 {{d}}개를 먼저 넣고, 물건 한 개마다 완충재 {{k}}개씩 더 넣습니다. 물건이 {{t}}개일 때 완충재는 모두 몇 개인가요?',
      '다음은 생활 속 대응 관계입니다. 기본 점수 {{d}}점에 성공 한 번마다 {{k}}점씩 더해 {{k * t + d}}점이 되었습니다. 몇 번 성공했나요?',
      '다음은 생활 속 대응 관계입니다. 화분 한 줄에 큰 화분 {{t}}개와 작은 화분 {{d}}개를 놓습니다. 같은 줄이 {{k}}줄일 때 화분은 모두 몇 개인가요?',
      '수 기계 가는 입력 수의 {{k}}배보다 {{d}}만큼 큰 수를 내보내고, 수 기계 나는 입력 수의 {{k + 1}}배를 내보냅니다. 넣은 수가 {{t}}일 때 나오는 두 수의 차이는 얼마인가요?',
      '대응 규칙은 입력 수의 {{k}}배입니다. 서윤이는 곱셈을 덧셈으로 잘못 보고 입력 수보다 {{k}}만큼 큰 수를 구했습니다. 입력 수가 {{t}}일 때 두 결과의 차이는 얼마인가요?',
    ],
  },
  C: {
    ranges: {
      k: { min: 4, max: 6 },
      d: { min: 3, max: 5 },
      t: { min: 9, max: 12 },
    },
    prompts: [
      '대응 관계가 출력 수 = 입력 수 × {{k}}입니다. 입력 수가 {{t}}일 때 출력 수를 구하세요.',
      '대응 관계가 출력 수 = 입력 수 + {{d}}입니다. 입력 수가 {{t}}일 때 출력 수를 구하세요.',
      '대응 관계가 출력 수 = 입력 수 × {{k}} + {{d}}입니다. 입력 수가 {{t}}일 때 출력 수를 구하세요.',
      '출력 수 = 입력 수 × {{k}}이고 출력 수가 {{k * t}}입니다. 입력 수를 구하세요.',
      '다음은 생활 속 대응 관계입니다. 정사각형 무늬 한 줄에 타일 {{k}}개씩 놓습니다. 같은 줄을 {{t}}줄 만들 때 타일은 모두 몇 개인가요?',
      '다음은 생활 속 대응 관계입니다. 배달 요금은 기본 {{d}}천 원에 이동 거리 1칸마다 {{k}}천 원씩 더해집니다. {{t}}칸 이동할 때 요금을 천 원 단위의 수로 나타내면 얼마인가요?',
      '다음은 생활 속 대응 관계입니다. 출력 수 = 입력 수 × {{k}} + {{d}}이고 출력 수가 {{k * t + d}}입니다. 입력 수를 구하세요.',
      '다음은 생활 속 대응 관계입니다. 상자 한 개에 연필 {{t}}자루와 지우개 {{d}}개를 함께 넣습니다. 같은 상자가 {{k}}개일 때 물건은 모두 몇 개인가요?',
      '규칙 가는 출력 수 = 입력 수 × {{k}} + {{d}}, 규칙 나는 출력 수 = 입력 수 × {{k + 1}}입니다. 입력 수가 {{t}}일 때 두 출력 수의 차이는 얼마인가요?',
      '입력 수의 {{k}}배를 구해야 하는데, 준호는 입력 수보다 {{k}}만큼 큰 수를 구했습니다. 입력 수가 {{t}}일 때 올바른 결과와 준호의 결과의 차이는 얼마인가요?',
    ],
  },
}

function buildSetDefinitions(config) {
  const { k, d, t } = config.ranges

  return [
    {
      params: { k, t },
      solver: 'k * t',
      steps: ['입력 수 {{t}}의 {{k}}배를 구합니다.', '{{t}} × {{k}} = {{k * t}}입니다.'],
    },
    {
      params: { d, t },
      solver: 't + d',
      steps: ['입력 수 {{t}}보다 {{d}}만큼 큰 수를 구합니다.', '{{t}} + {{d}} = {{t + d}}입니다.'],
    },
    {
      params: { k, d, t },
      solver: 'k * t + d',
      steps: ['입력 수 {{t}}의 {{k}}배는 {{k * t}}입니다.', '{{k * t}}보다 {{d}}만큼 큰 수는 {{k * t + d}}입니다.'],
    },
    {
      params: { k, t },
      solver: 't',
      steps: ['대응하는 수와 곱한 수를 이용해 나눗셈식으로 나타냅니다.', '{{k * t}} ÷ {{k}} = {{t}}입니다.'],
    },
    {
      params: { k, t },
      solver: 'k * t',
      steps: ['한 묶음의 수와 묶음 수가 각각 {{k}}, {{t}}입니다.', '{{k}} × {{t}} = {{k * t}}입니다.'],
    },
    {
      params: { k, d, t },
      solver: 'k * t + d',
      steps: ['반복해서 더하는 양은 {{k}} × {{t}} = {{k * t}}입니다.', '처음의 고정된 양 {{d}}를 더하면 {{k * t + d}}입니다.'],
    },
    {
      params: { k, d, t },
      solver: 't',
      steps: ['전체는 {{k * t + d}}, 처음의 고정된 양은 {{d}}이므로 반복해서 늘어난 양은 {{k * t}}입니다.', '{{k * t}} ÷ {{k}} = {{t}}입니다.'],
    },
    {
      params: { k, d, t },
      solver: '(t + d) * k',
      steps: ['한 묶음의 수는 {{t}} + {{d}} = {{t + d}}입니다.', '묶음이 {{k}}개이므로 {{t + d}} × {{k}} = {{(t + d) * k}}입니다.'],
    },
    {
      params: { k, d, t },
      solver: 't - d',
      steps: ['규칙 가의 결과는 {{k * t}} + {{d}} = {{k * t + d}}입니다.', '규칙 나의 결과는 {{(k + 1) * t}}이므로 두 결과의 차는 {{t - d}}입니다.'],
    },
    {
      params: { k, t },
      solver: 'k * t - (t + k)',
      steps: ['올바른 결과는 {{t}} × {{k}} = {{k * t}}이고, 잘못 구한 결과는 {{t}} + {{k}} = {{t + k}}입니다.', '두 결과의 차는 {{k * t}} - {{t + k}} = {{k * t - (t + k)}}입니다.'],
    },
  ].map((definition, index) => ({
    ...definition,
    prompt: config.prompts[index],
  }))
}

const templates = Object.entries(setConfigs).flatMap(([setId, config]) =>
  buildSetDefinitions(config).map((definition, index) => {
    const slot = index + 1
    const difficulty = slot <= 4 ? 1 : slot <= 8 ? 2 : 3
    const type = slot % 2 === 1 ? 'choice' : 'number'
    const base = {
      id: `tmpl-pattern-${setId}-${String(slot).padStart(2, '0')}`,
      concept_id: 'pattern-001',
      type,
      difficulty,
      set_id: setId,
      problem_family: familyBySlot[index],
    }
    const template = {
      ...base,
      blueprint: getReviewedBlueprint(base),
      param_schema: definition.params,
      prompt_template: definition.prompt,
      solver_rule: definition.solver,
      solution_steps_template: definition.steps,
      hint_steps_template: [
        slot <= 3
          ? '입력 수에 어떤 계산을 차례로 하는지 확인해요.'
          : slot === 4
            ? '곱한 결과에서 처음 수를 찾으려면 나눗셈을 이용해요.'
            : slot <= 6
              ? '처음부터 있는 양과 반복해서 늘어나는 양을 구분해요.'
              : slot <= 8
                ? '계산 순서를 거꾸로 따라가거나 한 묶음의 수를 먼저 구해요.'
                : '두 규칙을 같은 입력 수에 각각 적용해 결과를 비교해요.',
        slot <= 3
          ? '곱셈을 먼저 하고 덧셈이 있으면 그다음에 계산해요.'
          : slot === 4
            ? '대응하는 수를 곱한 수로 나누어요.'
            : slot <= 6
              ? '반복되는 양은 한 번의 양 × 반복 횟수로 나타내요.'
              : slot <= 8
                ? '전체에서 고정된 양을 빼거나 괄호 안을 먼저 계산해요.'
                : '올바른 두 값을 모두 구한 뒤 큰 값에서 작은 값을 빼요.',
      ],
    }

    if (type === 'choice') {
      template.choices_template = [
        `{{${definition.solver}}}`,
        `{{(${definition.solver}) + 1}}`,
        `{{(${definition.solver}) + 2}}`,
        `{{(${definition.solver}) + 3}}`,
      ]
    }

    return template
  })
)

function writeTemplates() {
  fs.writeFileSync(outputPath, `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`Wrote ${templates.length} Grade 5 pattern templates to ${outputPath}`)
}

if (require.main === module) {
  writeTemplates()
}

module.exports = {
  familyBySlot,
  setConfigs,
  buildSetDefinitions,
  templates,
  writeTemplates,
}
