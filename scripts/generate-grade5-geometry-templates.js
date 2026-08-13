const fs = require('fs')
const path = require('path')
const { getReviewedBlueprint } = require('./migrate-grade5-blueprints')

const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'data', 'templates')

const SETS = [
  { id: 'A', shift: 0 },
  { id: 'B', shift: 2 },
  { id: 'C', shift: 4 },
]

function range(min, max, shift = 0) {
  return { min: min + shift, max: max + shift }
}

function template(set, concept, index, family, difficulty, type, fields) {
  const base = {
    id: `tmpl-${concept.replace('-001', '')}-${set.id}-${String(index).padStart(2, '0')}`,
    concept_id: concept,
    type,
    difficulty,
    set_id: set.id,
    problem_family: `${concept.replace('-001', '')}-${family}`,
  }
  return {
    ...base,
    blueprint: getReviewedBlueprint(base),
    ...fields,
  }
}

function safeOffsetChoices(expression, step = 1) {
  return [
    `{{${expression}}}`,
    `{{${expression} + ${step}}}`,
    `{{${expression} + ${step * 2}}}`,
    `{{${expression} + ${step * 3}}}`,
  ]
}

function polygonVisual(shape, fields) {
  return { type: 'polygon', shape, unit: 'cm', ...fields }
}

function perimeterTemplates(set) {
  const s = set.shift
  const prompts = {
    A: [
      '그림의 직사각형 둘레는 몇 cm인가요?',
      '한 변의 길이가 표시된 정사각형의 둘레는 몇 cm인가요?',
      '직사각형의 둘레로 알맞은 값을 고르세요.',
      '세 변의 길이가 표시된 삼각형의 둘레는 몇 cm인가요?',
      '가로 {{w}}cm, 세로 {{h}}cm인 직사각형 색종이의 넓이는 몇 cm²인가요?',
      '한 변이 {{side}}cm인 정사각형 타일의 넓이로 알맞은 값을 고르세요.',
      '넓이가 {{w * h}}cm²이고 세로가 {{h}}cm인 직사각형의 가로는 몇 cm인가요?',
      '넓이가 {{w * h}}cm²이고 가로가 {{w}}cm인 직사각형의 세로는 몇 cm인가요?',
      '가로 {{w}}cm, 세로 {{h}}cm인 직사각형의 둘레를 구하면서 가로와 세로를 한 번씩만 더했습니다. 이 값은 올바른 둘레보다 몇 cm 작은가요?',
      '한 변이 {{side}}cm인 정사각형의 둘레를 구하면서 {{side}} × 4 대신 {{side}} + 4를 계산했습니다. 올바른 둘레는 잘못 구한 값보다 몇 cm 큰가요?',
    ],
    B: [
      '가로와 세로가 표시된 직사각형 액자의 테두리 길이는 몇 cm인가요?',
      '정사각형 상자의 네 변을 리본으로 두를 때 필요한 길이는 몇 cm인가요?',
      '그림에 표시된 직사각형 표지판의 둘레를 고르세요.',
      '삼각형 깃발의 세 변을 따라 잰 전체 길이는 몇 cm인가요?',
      '가로 {{w}}cm, 세로 {{h}}cm인 직사각형 메모판이 차지하는 넓이는 몇 cm²인가요?',
      '한 변이 {{side}}cm인 정사각형 화단의 넓이로 알맞은 값을 고르세요.',
      '직사각형 돗자리의 넓이는 {{w * h}}cm²이고 세로는 {{h}}cm입니다. 가로는 몇 cm인가요?',
      '직사각형 전시판의 넓이는 {{w * h}}cm²이고 가로는 {{w}}cm입니다. 세로는 몇 cm인가요?',
      '직사각형 액자의 둘레를 구하며 가로 {{w}}cm와 세로 {{h}}cm만 한 번씩 더했습니다. 빠뜨린 길이는 모두 몇 cm인가요?',
      '한 변이 {{side}}cm인 정사각형의 테두리 길이를 구하면서 한 변의 길이에 4를 더했습니다. 올바른 값과 잘못 구한 값의 차이는 몇 cm인가요?',
    ],
    C: [
      '직사각형에서 가로 두 변과 세로 두 변의 길이 합을 구하세요.',
      '네 변의 길이가 모두 같은 정사각형의 둘레는 몇 cm인가요?',
      '가로와 세로가 주어진 직사각형의 전체 변 길이를 고르세요.',
      '서로 다른 세 변이 표시된 삼각형의 둘레를 구하세요.',
      '가로 {{w}}cm와 세로 {{h}}cm가 대응하는 직사각형의 넓이를 구하세요.',
      '한 변의 길이가 {{side}}cm인 정사각형의 넓이를 고르세요.',
      '직사각형의 넓이 {{w * h}}cm²를 세로 {{h}}cm로 나누어 찾는 가로는 몇 cm인가요?',
      '직사각형의 넓이 {{w * h}}cm²를 가로 {{w}}cm로 나누어 찾는 세로는 몇 cm인가요?',
      '직사각형의 둘레를 (가로 + 세로)만 계산해 {{w + h}}cm라고 했습니다. 실제 둘레와의 차이는 몇 cm인가요?',
      '한 변이 {{side}}cm인 정사각형의 둘레를 {{side}} + 4로 잘못 계산했습니다. {{side}} × 4로 계산한 값과의 차이는 몇 cm인가요?',
    ],
  }[set.id]
  return [
    template(set, 'perimeter-001', 1, 'rectangle-perimeter', 1, 'number', {
      param_schema: { w: range(4, 9, s), h: range(2, 6, s) },
      prompt_template: prompts[0],
      solver_rule: '2 * (w + h)',
      solution_steps_template: ['가로와 세로를 한 번씩 더하면 {{w + h}}cm입니다.', '둘레는 {{w + h}} × 2 = {{2 * (w + h)}}cm입니다.'],
      hint_steps_template: ['가로 2개와 세로 2개의 길이를 모두 더해요.', '(가로 + 세로) × 2를 계산해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 2, 'square-perimeter', 1, 'number', {
      param_schema: { side: range(3, 8, s) },
      prompt_template: prompts[1],
      solver_rule: '4 * side',
      solution_steps_template: ['정사각형은 네 변의 길이가 같습니다.', '{{side}} × 4 = {{4 * side}}cm입니다.'],
      hint_steps_template: ['같은 길이의 변이 4개예요.', '한 변의 길이에 4를 곱해요.'],
      visual_template: polygonVisual('square', { a: '{{side}}' }),
    }),
    template(set, 'perimeter-001', 3, 'rectangle-perimeter-choice', 1, 'choice', {
      param_schema: { w: range(5, 10, s), h: range(2, 5, s) },
      prompt_template: prompts[2],
      solver_rule: '2 * (w + h)',
      choices_template: safeOffsetChoices('2 * (w + h)', 2),
      solution_steps_template: ['(가로 + 세로) × 2를 이용합니다.', '({{w}} + {{h}}) × 2 = {{2 * (w + h)}}cm입니다.'],
      hint_steps_template: ['가로와 세로를 먼저 더해요.', '그 합을 2배 해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 4, 'triangle-perimeter', 1, 'number', {
      param_schema: { a: range(4, 8, s), b: range(5, 9, s) },
      prompt_template: prompts[3],
      solver_rule: '2 * (a + b) - 2',
      solution_steps_template: ['세 번째 변은 {{a + b - 2}}cm이므로 세 변의 길이를 모두 더합니다.', '{{a}} + {{b}} + {{a + b - 2}} = {{2 * (a + b) - 2}}cm입니다.'],
      hint_steps_template: ['둘레는 도형의 가장자리 길이의 합이에요.', '세 변을 빠짐없이 더해요.'],
      visual_template: polygonVisual('triangle', { a: '{{a}}', b: '{{b}}', c: '{{a + b - 2}}', measurementMode: 'sides' }),
    }),
    template(set, 'perimeter-001', 5, 'rectangle-area-context', 2, 'number', {
      param_schema: { w: range(4, 9, s), h: range(3, 7, s) },
      prompt_template: prompts[4],
      solver_rule: 'w * h',
      solution_steps_template: ['직사각형의 넓이는 가로 × 세로입니다.', '{{w}} × {{h}} = {{w * h}}cm²입니다.'],
      hint_steps_template: ['1cm² 정사각형이 몇 개인지 생각해요.', '가로와 세로를 곱해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 6, 'square-area-context', 2, 'choice', {
      param_schema: { side: range(3, 8, s) },
      prompt_template: prompts[5],
      solver_rule: 'side * side',
      choices_template: safeOffsetChoices('side * side', 1),
      solution_steps_template: ['정사각형의 넓이는 한 변 × 한 변입니다.', '{{side}} × {{side}} = {{side * side}}cm²입니다.'],
      hint_steps_template: ['같은 길이를 두 번 곱해요.', '둘레를 구하는 문제가 아닌지 확인해요.'],
      visual_template: polygonVisual('square', { a: '{{side}}' }),
    }),
    template(set, 'perimeter-001', 7, 'rectangle-width-from-area', 2, 'number', {
      param_schema: { w: range(4, 9, s), h: range(2, 6, s) },
      prompt_template: prompts[6],
      solver_rule: 'w',
      solution_steps_template: ['가로 × {{h}} = {{w * h}}입니다.', '{{w * h}} ÷ {{h}} = {{w}}cm입니다.'],
      hint_steps_template: ['넓이를 알고 있으므로 나눗셈을 이용해요.', '넓이 ÷ 세로를 계산해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}', unknownMeasurement: 'a' }),
    }),
    template(set, 'perimeter-001', 8, 'rectangle-height-from-area', 2, 'number', {
      param_schema: { w: range(5, 10, s), h: range(3, 7, s) },
      prompt_template: prompts[7],
      solver_rule: 'h',
      solution_steps_template: ['{{w}} × 세로 = {{w * h}}입니다.', '{{w * h}} ÷ {{w}} = {{h}}cm입니다.'],
      hint_steps_template: ['넓이 ÷ 가로를 계산해요.', '구한 세로를 다시 곱해 확인해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}', unknownMeasurement: 'b' }),
    }),
    template(set, 'perimeter-001', 9, 'half-perimeter-error', 3, 'number', {
      param_schema: { w: range(6, 12, s), h: range(3, 8, s) },
      prompt_template: prompts[8],
      solver_rule: 'w + h',
      solution_steps_template: ['올바른 둘레는 ({{w}} + {{h}}) × 2 = {{2 * (w + h)}}cm입니다.', '한 번씩만 더한 값은 {{w + h}}cm이므로 차이는 {{w + h}}cm입니다.'],
      hint_steps_template: ['직사각형에는 같은 길이의 가로와 세로가 각각 2개씩 있어요.', '올바른 둘레와 한 번씩만 더한 값을 비교해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 10, 'addition-instead-multiplication-error', 3, 'number', {
      param_schema: { side: range(5, 9, s) },
      prompt_template: prompts[9],
      solver_rule: '4 * side - (side + 4)',
      solution_steps_template: ['올바른 둘레는 {{side}} × 4 = {{4 * side}}cm이고, 잘못 구한 값은 {{side}} + 4 = {{side + 4}}cm입니다.', '두 값의 차이는 {{4 * side}} - {{side + 4}} = {{4 * side - (side + 4)}}cm입니다.'],
      hint_steps_template: ['정사각형에는 같은 길이의 변이 4개 있어요.', '곱한 값과 더한 값을 각각 구해 비교해요.'],
      visual_template: polygonVisual('square', { a: '{{side}}' }),
    }),
  ]
}

function polygonAreaTemplates(set) {
  const s = set.shift
  const prompts = {
    A: [
      '평행사변형의 넓이는 몇 cm²인가요?',
      '삼각형의 넓이는 몇 cm²인가요?',
      '사다리꼴의 넓이는 몇 cm²인가요?',
      '두 대각선의 길이가 표시된 마름모의 넓이는 몇 cm²인가요?',
      '넓이가 {{base * height}}cm²이고 밑변이 {{base}}cm인 평행사변형의 높이는 몇 cm인가요?',
      '넓이가 {{b * height}}cm²이고 밑변이 {{b * 2}}cm인 삼각형의 높이는 몇 cm인가요?',
      '넓이가 {{(top + bottom) * h}}cm²이고 윗변이 {{top}}cm, 높이가 {{h * 2}}cm인 사다리꼴의 아랫변은 몇 cm인가요?',
      '그림과 같은 밑변 {{b * 2}}cm, 높이 {{height}}cm인 삼각형 깃발을 2장 만들었습니다. 두 깃발의 넓이 합은 몇 cm²인가요?',
      '삼각형의 넓이를 구하면서 ÷2를 빠뜨려 {{b * 2 * height}}cm²라고 했습니다. 이 값은 올바른 넓이보다 몇 cm² 큰가요?',
      '사다리꼴 넓이를 구하면서 윗변을 빠뜨리고 아랫변 {{bottom}}cm만 사용했습니다. 높이가 {{h * 2}}cm일 때 잘못 구한 넓이는 올바른 넓이보다 몇 cm² 작은가요?',
    ],
    B: [
      '평행사변형 모양 천의 밑변과 높이를 이용해 넓이를 구하세요.',
      '삼각형 표지판의 밑변과 높이가 표시되어 있습니다. 넓이는 몇 cm²인가요?',
      '평행한 두 변과 높이가 표시된 사다리꼴의 넓이를 구하세요.',
      '두 대각선이 서로 가로지르는 마름모의 넓이는 몇 cm²인가요?',
      '평행사변형 화단의 넓이는 {{base * height}}cm²이고 밑변은 {{base}}cm입니다. 높이는 몇 cm인가요?',
      '삼각형 천의 넓이는 {{b * height}}cm²이고 밑변은 {{b * 2}}cm입니다. 높이는 몇 cm인가요?',
      '사다리꼴 판의 넓이는 {{(top + bottom) * h}}cm², 윗변은 {{top}}cm, 높이는 {{h * 2}}cm입니다. 아랫변은 몇 cm인가요?',
      '밑변 {{b * 2}}cm, 높이 {{height}}cm인 같은 삼각형 조각 2개의 넓이를 모두 구하세요.',
      '밑변 {{b * 2}}cm, 높이 {{height}}cm인 삼각형을 밑변 × 높이로만 계산했습니다. 잘못 구한 넓이와 실제 넓이의 차이는 몇 cm²인가요?',
      '윗변 {{top}}cm, 아랫변 {{bottom}}cm, 높이 {{h * 2}}cm인 사다리꼴에서 아랫변만 넓이 식에 넣었습니다. 빠진 윗변 때문에 생긴 넓이의 차이는 몇 cm²인가요?',
    ],
    C: [
      '밑변 × 높이로 나타내는 평행사변형의 넓이를 구하세요.',
      '밑변 × 높이 ÷ 2로 나타내는 삼각형의 넓이를 구하세요.',
      '(윗변 + 아랫변) × 높이 ÷ 2로 나타내는 사다리꼴의 넓이를 구하세요.',
      '대각선의 곱 ÷ 2로 나타내는 마름모의 넓이를 구하세요.',
      '평행사변형의 넓이 {{base * height}}cm²를 밑변 {{base}}cm로 나누어 높이를 구하세요.',
      '삼각형의 넓이 {{b * height}}cm²를 2배 한 뒤 밑변 {{b * 2}}cm로 나누어 높이를 구하세요.',
      '사다리꼴의 넓이 {{(top + bottom) * h}}cm², 윗변 {{top}}cm, 높이 {{h * 2}}cm를 이용해 아랫변을 구하세요.',
      '그림과 같은 삼각형 2개의 전체 넓이를 구하세요. 한 삼각형의 밑변은 {{b * 2}}cm, 높이는 {{height}}cm입니다.',
      '삼각형 넓이 식에서 ÷2를 하지 않은 결과 {{b * 2 * height}}cm²와 올바른 넓이의 차이는 몇 cm²인가요?',
      '사다리꼴 넓이 식에서 윗변 {{top}}cm를 빼고 계산했습니다. 높이가 {{h * 2}}cm일 때 두 계산 결과의 차이는 몇 cm²인가요?',
    ],
  }[set.id]
  return [
    template(set, 'polygonarea-001', 1, 'parallelogram-area', 1, 'number', {
      param_schema: { base: range(4, 9, s), height: range(2, 6, s) },
      prompt_template: prompts[0],
      solver_rule: 'base * height',
      solution_steps_template: ['평행사변형의 넓이는 밑변 × 높이입니다.', '{{base}} × {{height}} = {{base * height}}cm²입니다.'],
      hint_steps_template: ['기울어진 변의 길이 대신 높이를 사용해요.', '밑변과 높이를 곱해요.'],
      visual_template: polygonVisual('parallelogram', { a: '{{base}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 2, 'triangle-area', 1, 'number', {
      param_schema: { b: range(2, 4, s), height: range(3, 7, s) },
      prompt_template: prompts[1],
      solver_rule: 'b * height',
      solution_steps_template: ['삼각형의 넓이는 밑변 × 높이 ÷ 2입니다.', '{{b * 2}} × {{height}} ÷ 2 = {{b * height}}cm²입니다.'],
      hint_steps_template: ['같은 밑변과 높이의 평행사변형 절반이에요.', '밑변과 높이를 곱한 뒤 2로 나눠요.'],
      visual_template: polygonVisual('triangle', { a: '{{b * 2}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 3, 'trapezoid-area', 1, 'number', {
      param_schema: { top: range(3, 7, s), bottom: range(8, 12, s), h: range(2, 4, s) },
      prompt_template: prompts[2],
      solver_rule: '(top + bottom) * h',
      solution_steps_template: ['윗변과 아랫변의 합은 {{top + bottom}}cm입니다.', '({{top}} + {{bottom}}) × {{h * 2}} ÷ 2 = {{(top + bottom) * h}}cm²입니다.'],
      hint_steps_template: ['평행한 두 변의 길이를 먼저 더해요.', '그 합에 높이를 곱하고 2로 나눠요.'],
      visual_template: polygonVisual('trapezoid', { a: '{{top}}', b: '{{bottom}}', height: '{{h * 2}}' }),
    }),
    template(set, 'polygonarea-001', 4, 'rhombus-area', 1, 'number', {
      param_schema: { d: range(2, 4, s), d2: range(5, 11, s) },
      prompt_template: prompts[3],
      solver_rule: 'd * d2',
      solution_steps_template: ['마름모의 넓이는 두 대각선의 곱 ÷ 2입니다.', '{{d * 2}} × {{d2}} ÷ 2 = {{d * d2}}cm²입니다.'],
      hint_steps_template: ['두 대각선이 만드는 직사각형을 생각해요.', '두 대각선을 곱하고 2로 나눠요.'],
      visual_template: polygonVisual('rhombus', { a: '{{d * 2}}', b: '{{d2}}' }),
    }),
    template(set, 'polygonarea-001', 5, 'parallelogram-height', 2, 'number', {
      param_schema: { base: range(5, 10, s), height: range(3, 7, s) },
      prompt_template: prompts[4],
      solver_rule: 'height',
      solution_steps_template: ['밑변 × 높이 = {{base * height}}입니다.', '{{base * height}} ÷ {{base}} = {{height}}cm입니다.'],
      hint_steps_template: ['넓이를 밑변으로 나눠요.', '기울어진 변의 길이와 높이를 구별해요.'],
      visual_template: polygonVisual('parallelogram', { a: '{{base}}', height: '{{height}}', unknownMeasurement: 'height' }),
    }),
    template(set, 'polygonarea-001', 6, 'triangle-height', 2, 'number', {
      param_schema: { b: range(2, 4, s), height: range(3, 8, s) },
      prompt_template: prompts[5],
      solver_rule: 'height',
      solution_steps_template: ['넓이 {{b * height}}cm²를 2배 하면 {{b * 2 * height}}입니다.', '{{b * 2 * height}} ÷ {{b * 2}} = {{height}}cm입니다.'],
      hint_steps_template: ['먼저 넓이를 2배 해요.', '그 값을 밑변으로 나눠요.'],
      visual_template: polygonVisual('triangle', { a: '{{b * 2}}', height: '{{height}}', unknownMeasurement: 'height' }),
    }),
    template(set, 'polygonarea-001', 7, 'trapezoid-bottom', 2, 'number', {
      param_schema: { top: range(3, 7, s), bottom: range(8, 13, s), h: range(2, 4, s) },
      prompt_template: prompts[6],
      solver_rule: 'bottom',
      solution_steps_template: ['넓이 {{(top + bottom) * h}}cm²를 {{h * 2}}cm 높이에 맞게 역산하면 두 평행한 변의 합은 {{top + bottom}}cm입니다.', '{{top + bottom}} - {{top}} = {{bottom}}cm입니다.'],
      hint_steps_template: ['평행한 두 변의 합을 먼저 역산해요.', '그 합에서 윗변을 빼요.'],
      visual_template: polygonVisual('trapezoid', { a: '{{top}}', b: '{{bottom}}', height: '{{h * 2}}', unknownMeasurement: 'b' }),
    }),
    template(set, 'polygonarea-001', 8, 'congruent-triangle-total', 2, 'number', {
      param_schema: { b: range(2, 4, s), height: range(3, 7, s) },
      prompt_template: prompts[7],
      solver_rule: '2 * b * height',
      solution_steps_template: ['삼각형 한 개의 넓이는 {{b * 2}} × {{height}} ÷ 2 = {{b * height}}cm²입니다.', '같은 삼각형이 2개이므로 넓이 합은 {{2 * b * height}}cm²입니다.'],
      hint_steps_template: ['먼저 삼각형 한 개의 넓이를 구해요.', '같은 넓이가 2개임을 반영해요.'],
      visual_template: polygonVisual('triangle', { a: '{{b * 2}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 9, 'triangle-double-error', 3, 'number', {
      param_schema: { b: range(2, 5, s), height: range(4, 8, s) },
      prompt_template: prompts[8],
      solver_rule: 'b * height',
      solution_steps_template: ['올바른 삼각형 넓이는 {{b * 2}} × {{height}} ÷ 2 = {{b * height}}cm²입니다.', '÷2를 빠뜨린 값 {{b * 2 * height}}cm²는 올바른 값보다 {{b * height}}cm² 큽니다.'],
      hint_steps_template: ['삼각형 넓이 식의 ÷2가 무엇을 뜻하는지 확인해요.', '잘못 구한 값에서 올바른 값을 빼요.'],
      visual_template: polygonVisual('triangle', { a: '{{b * 2}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 10, 'trapezoid-base-omission-error', 3, 'number', {
      param_schema: { top: range(3, 7, s), bottom: range(8, 13, s), h: range(2, 5, s) },
      prompt_template: prompts[9],
      solver_rule: 'top * h',
      solution_steps_template: ['올바른 넓이는 ({{top}} + {{bottom}}) × {{h * 2}} ÷ 2 = {{(top + bottom) * h}}cm²입니다.', '아랫변만 사용한 값 {{bottom * h}}cm²와의 차이는 {{top * h}}cm²입니다.'],
      hint_steps_template: ['사다리꼴 넓이에는 윗변과 아랫변이 모두 필요해요.', '빠진 윗변이 넓이에 주는 부분을 계산해요.'],
      visual_template: polygonVisual('trapezoid', { a: '{{top}}', b: '{{bottom}}', height: '{{h * 2}}' }),
    }),
  ]
}

function congruenceTemplates(set) {
  const s = set.shift
  const prompts = {
    A: [
      '합동인 두 도형에서 꼭짓점 ㄱ에 대응하는 도형 2의 꼭짓점을 고르세요.',
      '각 ㄱ과 크기가 같은 대응각의 꼭짓점을 고르세요.',
      '도형 1과 도형 2의 대응 순서를 바르게 나타낼 때, ㄱ과 짝지어야 할 글자를 고르세요.',
      '도형을 옮기거나 돌려 겹쳤을 때 ㄱ과 포개지는 꼭짓점을 고르세요.',
      '합동인 두 장식판을 서로 다른 방향으로 놓았습니다. 도형 1의 ㄱㄴ이 {{a}}cm일 때 도형 2에서 이에 대응하는 변은 몇 cm인가요?',
      '합동인 두 타일에서 도형 1의 {{b}}cm인 표시 변과 대응하는 도형 2의 변 길이는 몇 cm인가요?',
      '합동인 두 직사각형 중 도형 1의 가로가 {{a}}cm, 세로가 {{b}}cm입니다. 도형 2의 둘레는 몇 cm인가요?',
      '합동인 두 직사각형 중 도형 1의 가로가 {{a}}cm, 세로가 {{b}}cm입니다. 도형 2의 넓이는 몇 cm²인가요?',
      '도형 1의 ㄱㄴ은 {{a}}cm, ㄴㄷ은 {{a + d}}cm입니다. 도형 2에서 ㄱㄴ의 대응변을 찾으면서 ㄴㄷ의 대응변을 골라 {{a + d}}cm라고 했습니다. 이 답은 올바른 길이보다 몇 cm 큰가요?',
      '두 합동 도형 중 하나를 돌려 놓자 둘레가 {{d}}cm 늘었다고 주장했습니다. 이 주장과 실제 둘레 변화량의 차이는 몇 cm인가요?',
    ],
    B: [
      '합동인 두 퍼즐 조각에서 도형 1의 ㄱ과 같은 자리에 포개지는 도형 2의 꼭짓점을 고르세요.',
      '합동인 두 판을 돌려 겹칠 때 각 ㄱ과 포개지는 각의 꼭짓점을 고르세요.',
      '두 합동 사각형의 꼭짓점을 대응 순서대로 적을 때 ㄱ 다음에 짝지을 도형 2의 글자를 고르세요.',
      '방향이 다른 두 합동 도형을 포개면 ㄱ과 만나는 꼭짓점은 어느 것인가요?',
      '같은 틀로 만든 두 표지판의 방향이 다릅니다. 도형 1의 ㄱㄴ이 {{a}}cm이면 도형 2의 대응변 길이는 몇 cm인가요?',
      '서로 합동인 두 조각을 맞추려고 합니다. 도형 1에서 {{b}}cm로 표시된 변과 맞닿을 도형 2의 변은 몇 cm인가요?',
      '가로 {{a}}cm, 세로 {{b}}cm인 직사각형 액자와 합동인 액자의 테두리 길이는 몇 cm인가요?',
      '가로 {{a}}cm, 세로 {{b}}cm인 직사각형 카드와 합동인 카드의 넓이는 몇 cm²인가요?',
      'ㄱㄴ이 {{a}}cm이고 이웃한 ㄴㄷ이 {{a + d}}cm인 합동 도형입니다. 도형 2에서 ㄱㄴ의 대응변 대신 긴 이웃 변을 골랐다면 답이 몇 cm 커지나요?',
      '합동인 판을 옮기고 돌렸더니 둘레가 {{d}}cm 커졌다고 말했습니다. 합동의 성질로 판단한 실제 변화량과 말한 값의 차이는 몇 cm인가요?',
    ],
    C: [
      '연결된 변의 순서를 비교하여 도형 1의 ㄱ에 대응하는 도형 2의 꼭짓점을 고르세요.',
      '도형의 방향과 관계없이 각 ㄱ에 대응하여 크기가 같은 각의 꼭짓점을 고르세요.',
      '합동을 나타낼 때 대응 꼭짓점을 같은 순서에 놓습니다. ㄱ과 같은 순서에 올 글자를 고르세요.',
      '한 도형을 90° 돌려 다른 도형에 포갤 때 ㄱ과 일치하는 꼭짓점을 고르세요.',
      '합동인 두 부품에서 도형 1의 ㄱㄴ 길이 {{a}}cm를 도형 2의 대응변에 옮겨 표시하려고 합니다. 표시할 길이는 몇 cm인가요?',
      '도형 1과 합동인 도형 2를 다른 방향으로 놓았습니다. 도형 1의 표시 변 {{b}}cm에 대응하는 변의 길이를 구하세요.',
      '가로 {{a}}cm와 세로 {{b}}cm가 대응하는 두 합동 직사각형에서 도형 2의 둘레를 구하세요.',
      '가로 {{a}}cm와 세로 {{b}}cm가 대응하는 두 합동 직사각형에서 도형 2의 넓이를 구하세요.',
      'ㄱㄴ={{a}}cm, ㄴㄷ={{a + d}}cm인 도형과 합동인 도형에서 ㄱㄴ의 대응변 대신 ㄴㄷ의 대응변을 선택했습니다. 잘못 고른 길이와 올바른 길이의 차이는 몇 cm인가요?',
      '합동인 도형은 위치와 방향만 바뀌었습니다. 둘레가 {{d}}cm 변했다는 값과 실제 변화량의 차이를 구하세요.',
    ],
  }[set.id]
  const choiceFields = (variant) => ({
    solver_rule: `geometryOption(1, ${variant}, 0)`,
    choices_template: [0, 1, 2, 3].map(offset => `{{geometryOption(1, ${variant}, ${offset})}}`),
  })
  return [
    template(set, 'congruence-001', 1, 'corresponding-vertex', 1, 'choice', {
      param_schema: { variant: range(1, 4) },
      prompt_template: prompts[0],
      ...choiceFields('variant'),
      solution_steps_template: ['도형을 돌리거나 뒤집어 같은 위치의 꼭짓점을 찾습니다.', 'ㄱ에 대응하는 꼭짓점은 {{geometryOption(1, variant, 0)}}입니다.'],
      hint_steps_template: ['ㄱ에서 만나는 두 변의 방향을 살펴봐요.', '도형의 위치가 아니라 연결 관계를 비교해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}' },
    }),
    template(set, 'congruence-001', 2, 'corresponding-angle', 1, 'choice', {
      param_schema: { variant: range(1, 4) },
      prompt_template: prompts[1],
      ...choiceFields('variant'),
      solution_steps_template: ['합동인 도형의 대응각 크기는 같습니다.', '각 ㄱ의 대응각은 {{geometryOption(1, variant, 0)}}입니다.'],
      hint_steps_template: ['합동인 도형에서 같은 모양의 모서리를 찾아요.', 'ㄱ에 연결된 변의 순서를 따라가요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}' },
    }),
    template(set, 'congruence-001', 3, 'congruence-statement-order', 1, 'choice', {
      param_schema: { variant: range(1, 4) },
      prompt_template: prompts[2],
      ...choiceFields('variant'),
      solution_steps_template: ['합동 기호를 쓸 때 대응하는 꼭짓점은 같은 순서에 둡니다.', 'ㄱ과 짝지어야 할 글자는 {{geometryOption(1, variant, 0)}}입니다.'],
      hint_steps_template: ['각 꼭짓점 주변의 변을 비교해요.', '대응하는 순서가 바뀌지 않게 해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}' },
    }),
    template(set, 'congruence-001', 4, 'same-correspondence', 1, 'choice', {
      param_schema: { variant: range(1, 4) },
      prompt_template: prompts[3],
      ...choiceFields('variant'),
      solution_steps_template: ['옮기기와 돌리기는 도형의 크기와 모양을 바꾸지 않습니다.', '포개지는 꼭짓점은 {{geometryOption(1, variant, 0)}}입니다.'],
      hint_steps_template: ['도형을 머릿속으로 돌려 봐요.', '변의 연결 순서를 기준으로 판단해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}' },
    }),
    template(set, 'congruence-001', 5, 'corresponding-side-length', 2, 'number', {
      param_schema: { variant: range(1, 4), a: range(4, 9, s), b: range(5, 10, s), c: range(6, 11, s) },
      prompt_template: prompts[4],
      solver_rule: 'a',
      solution_steps_template: ['합동인 도형의 대응변 길이는 같습니다.', 'ㄱㄴ의 대응변도 {{a}}cm입니다.'],
      hint_steps_template: ['합동인 도형의 대응변 성질을 떠올려요.', '모양을 돌려도 길이는 변하지 않아요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 6, 'missing-corresponding-side', 2, 'number', {
      param_schema: { variant: range(1, 4), a: range(5, 10, s), b: range(6, 11, s), c: range(7, 12, s) },
      prompt_template: prompts[5],
      solver_rule: 'b',
      solution_steps_template: ['서로 대응하는 변을 확인합니다.', '합동인 도형이므로 대응변은 {{b}}cm입니다.'],
      hint_steps_template: ['대응하는 위치의 변을 찾아요.', '합동이면 대응변의 길이는 같아요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 7, 'congruent-perimeter', 2, 'number', {
      param_schema: { variant: range(1, 4), a: range(4, 8, s), b: range(5, 9, s) },
      prompt_template: prompts[6],
      solver_rule: '2 * (a + b)',
      solution_steps_template: ['합동인 두 직사각형의 가로와 세로 길이는 각각 같습니다.', '도형 2의 둘레는 ({{a}} + {{b}}) × 2 = {{2 * (a + b)}}cm입니다.'],
      hint_steps_template: ['도형 1과 도형 2의 대응변은 같아요.', '직사각형 둘레 공식을 적용해요.'],
      visual_template: { type: 'congruence', mode: 'pair', shape: 'rectangle', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 8, 'congruent-area', 2, 'number', {
      param_schema: { variant: range(1, 4), a: range(4, 9, s), b: range(3, 7, s) },
      prompt_template: prompts[7],
      solver_rule: 'a * b',
      solution_steps_template: ['합동인 도형은 크기와 모양이 같으므로 넓이도 같습니다.', '{{a}} × {{b}} = {{a * b}}cm²입니다.'],
      hint_steps_template: ['합동인 도형의 대응변 길이를 옮겨 생각해요.', '가로와 세로를 곱해요.'],
      visual_template: { type: 'congruence', mode: 'pair', shape: 'rectangle', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 9, 'wrong-corresponding-side-error', 3, 'number', {
      param_schema: { variant: range(1, 4), a: range(5, 9, s), d: range(2, 5, s), c: range(7, 11, s) },
      prompt_template: prompts[8],
      solver_rule: 'd',
      solution_steps_template: ['ㄱㄴ의 올바른 대응변 길이는 합동의 성질에 따라 {{a}}cm입니다.', '잘못 고른 이웃 변은 {{a + d}}cm이므로 {{a + d}} - {{a}} = {{d}}cm 큽니다.'],
      hint_steps_template: ['꼭짓점의 대응 순서를 먼저 확인해요.', '잘못 고른 길이에서 올바른 대응변 길이를 빼요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{a + d}}', c: '{{c}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 10, 'perimeter-invariance', 3, 'number', {
      param_schema: { variant: range(1, 4), a: range(5, 10, s), b: range(6, 11, s), c: range(7, 12, s), d: range(2, 6, s) },
      prompt_template: prompts[9],
      solver_rule: 'd',
      solution_steps_template: ['합동인 도형은 모든 대응변의 길이가 같으므로 위치와 방향이 바뀌어도 실제 둘레 변화량은 0cm입니다.', '주장한 {{d}}cm와 실제 변화량 0cm의 차이는 {{d}}cm입니다.'],
      hint_steps_template: ['옮기기와 돌리기가 변의 길이를 바꾸는지 판단해요.', '주장한 변화량과 실제 변화량을 비교해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
  ]
}

function symmetryTemplates(set) {
  const s = set.shift
  const axisPrompts = {
    A: ['정사각형의 대칭축은 몇 개인가요?', '직사각형의 대칭축은 몇 개인가요?', '정삼각형의 대칭축은 몇 개인가요?', '마름모의 대칭축은 몇 개인가요?'],
    B: ['정사각형 종이를 완전히 포개어 접을 수 있는 대칭축은 몇 개인가요?', '직사각형 카드를 완전히 포개는 대칭축은 몇 개인가요?', '정삼각형 조각을 완전히 포개는 대칭축은 몇 개인가요?', '마름모 장식을 완전히 포개는 대칭축은 몇 개인가요?'],
    C: ['가로·세로·대각선 방향을 모두 살펴 정사각형의 대칭축 수를 구하세요.', '두 중점을 지나는 방향을 살펴 직사각형의 대칭축 수를 구하세요.', '각 꼭짓점과 맞은편 변의 중점을 잇는 정삼각형의 대칭축 수를 구하세요.', '두 대각선을 기준으로 살펴 마름모의 대칭축 수를 구하세요.'],
  }[set.id]
  const prompts = {
    A: [
      '점 P({{x}}, {{y}})를 직선 x={{axis}}에 대하여 선대칭 이동한 점의 x좌표는?',
      '점 P와 직선 x={{axis}}에 대한 대칭점 사이의 가로 거리는 몇 칸인가요?',
      '점 P({{x}}, {{y}})를 중심 ({{cx}}, {{cy}})에 대하여 점대칭 이동한 점의 x좌표는?',
      '점 P({{x}}, {{y}})를 중심 ({{cx}}, {{cy}})에 대하여 점대칭 이동한 점의 y좌표는?',
      '점 P({{x}}, {{y}})에서 직선 x={{axis}}까지의 거리를 먼저 구했습니다. 그 결과는 {{axis - x}}입니다. 이 수를 대칭점의 x좌표라고 했을 때 올바른 x좌표와의 차이는 얼마인가요?',
      '점 P({{x}}, {{y}})를 중심 ({{cx}}, {{cy}})에 점대칭 이동하면서 x좌표만 바꾸었습니다. 바꾼 x좌표는 {{2 * cx - x}}이고, 그대로 둔 y좌표는 {{y}}입니다. 올바른 y좌표와의 차이는 얼마인가요?',
    ],
    B: [
      '모눈에서 P({{x}}, {{y}})를 대칭축 x={{axis}} 반대편 같은 거리에 찍을 때 새 점의 x좌표를 구하세요.',
      'P({{x}}, {{y}})와 직선 x={{axis}}에 대한 선대칭점 사이의 가로 칸 수를 구하세요.',
      '중심 ({{cx}}, {{cy}})이 두 점의 중점이 되도록 P({{x}}, {{y}})의 점대칭점 x좌표를 구하세요.',
      'P({{x}}, {{y}})를 중심 ({{cx}}, {{cy}}) 반대편에 같은 거리로 옮긴 점의 y좌표를 구하세요.',
      '선대칭점의 x좌표를 구해야 하는데 P에서 x={{axis}}까지의 거리 {{axis - x}}만 답으로 썼습니다. 올바른 x좌표와 이 답의 차이는 얼마인가요?',
      '중심 ({{cx}}, {{cy}})에 대한 점대칭에서 x좌표만 바꾸고 y좌표는 그대로 두었습니다. 그대로 둔 값은 {{y}}입니다. 올바른 y좌표와 얼마만큼 차이 나나요?',
    ],
    C: [
      '대칭축은 직선 x={{axis}}입니다. 이 직선이 P({{x}}, {{y}})와 대칭점의 가운데에 있을 때 대칭점의 x좌표를 구하세요.',
      '선대칭축 x={{axis}}에서 P까지의 거리와 반대편 거리를 이용해 두 점 사이의 가로 거리를 구하세요.',
      '({{cx}}, {{cy}})가 P({{x}}, {{y}})와 점대칭점의 중점일 때 점대칭점의 x좌표를 구하세요.',
      '({{cx}}, {{cy}})가 P({{x}}, {{y}})와 점대칭점의 중점일 때 점대칭점의 y좌표를 구하세요.',
      'P의 선대칭점 x좌표로 적은 답은 {{axis - x}}입니다. 축까지 거리와 좌표를 혼동한 이 답은 올바른 값과 얼마만큼 차이 나나요?',
      'P의 점대칭점으로 적은 좌표는 ({{2 * cx - x}}, {{y}})입니다. 중심이 두 점의 중점이라는 조건을 만족시키려면 y좌표를 얼마만큼 고쳐야 하나요?',
    ],
  }[set.id]
  return [
    [1, 'square-axes', 1, 1, '정사각형'],
    [2, 'rectangle-axes', 1, 2, '직사각형'],
    [3, 'equilateral-triangle-axes', 1, 3, '정삼각형'],
    [4, 'rhombus-axes', 1, 5, '마름모'],
  ].map(([index, family, difficulty, shape, name]) => template(set, 'symmetry-001', index, family, difficulty, 'number', {
    param_schema: { shape: { min: shape, max: shape } },
    prompt_template: axisPrompts[index - 1],
    solver_rule: 'symmetryAxisCount(shape)',
    solution_steps_template: [`${name}을 접었을 때 완전히 겹치는 선을 모두 찾습니다.`, `대칭축은 {{symmetryAxisCount(shape)}}개입니다.`],
    hint_steps_template: ['가로, 세로, 대각선 방향으로 접어 보세요.', '완전히 겹치는 경우만 세어요.'],
    visual_template: { type: 'symmetry', mode: 'axes', variant: '{{shape}}' },
  })).concat([
    template(set, 'symmetry-001', 5, 'vertical-reflection-x', 2, 'number', {
      param_schema: { x: range(1, 3), y: range(2, 6), axis: range(4, 5) },
      prompt_template: prompts[0],
      solver_rule: '2 * axis - x',
      solution_steps_template: ['P에서 대칭축까지의 가로 거리는 {{axis - x}}칸입니다.', '축의 반대쪽으로 같은 거리만큼 가면 x좌표는 {{2 * axis - x}}입니다.'],
      hint_steps_template: ['점과 대칭축 사이의 칸 수를 세어요.', '축 반대편에 같은 거리로 표시해요.'],
      visual_template: { type: 'symmetry', mode: 'line-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', axis: '{{axis}}' },
    }),
    template(set, 'symmetry-001', 6, 'vertical-reflection-distance', 2, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 6), axis: range(4, 5) },
      prompt_template: prompts[1],
      solver_rule: '2 * (axis - x)',
      solution_steps_template: ['P에서 대칭축까지는 {{axis - x}}칸입니다.', '양쪽 거리를 합하면 {{2 * (axis - x)}}칸입니다.'],
      hint_steps_template: ['대칭축까지 거리를 먼저 구해요.', '같은 거리가 축 반대쪽에도 있어요.'],
      visual_template: { type: 'symmetry', mode: 'line-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', axis: '{{axis}}' },
    }),
    template(set, 'symmetry-001', 7, 'point-reflection-x', 2, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 3), cx: range(4, 5), cy: range(4, 5) },
      prompt_template: prompts[2],
      solver_rule: '2 * cx - x',
      solution_steps_template: ['중심은 두 점을 이은 선분의 중점입니다.', 'x좌표는 {{2 * cx}} - {{x}} = {{2 * cx - x}}입니다.'],
      hint_steps_template: ['중심에서 P까지의 가로 거리를 구해요.', '중심 반대쪽으로 같은 거리만큼 이동해요.'],
      visual_template: { type: 'symmetry', mode: 'point-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', centerX: '{{cx}}', centerY: '{{cy}}' },
    }),
    template(set, 'symmetry-001', 8, 'point-reflection-y', 2, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 3), cx: range(4, 5), cy: range(4, 5) },
      prompt_template: prompts[3],
      solver_rule: '2 * cy - y',
      solution_steps_template: ['중심에서 위아래 거리가 같아야 합니다.', 'y좌표는 {{2 * cy}} - {{y}} = {{2 * cy - y}}입니다.'],
      hint_steps_template: ['중심에서 P까지의 세로 거리를 구해요.', '반대쪽으로 같은 거리만큼 이동해요.'],
      visual_template: { type: 'symmetry', mode: 'point-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', centerX: '{{cx}}', centerY: '{{cy}}' },
    }),
    template(set, 'symmetry-001', 9, 'line-reflection-distance-error', 3, 'number', {
      param_schema: { x: range(1, 3), y: range(2, 6), axis: range(4, 5) },
      prompt_template: prompts[4],
      solver_rule: 'axis',
      solution_steps_template: ['축까지의 거리는 {{axis - x}}이고, 이 값은 좌표가 아니라 P가 이동해야 할 거리의 절반입니다. 올바른 대칭점의 x좌표는 {{2 * axis - x}}입니다.', '두 답의 차를 계산하는 식은 {{2 * axis - x}} - {{axis - x}} = {{axis}}입니다. 따라서 차이는 {{axis}}입니다.'],
      hint_steps_template: ['축까지의 거리와 대칭점의 x좌표를 구분해요.', '올바른 좌표에서 잘못 쓴 값을 빼요.'],
      visual_template: { type: 'symmetry', mode: 'line-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', axis: '{{axis}}' },
    }),
    template(set, 'symmetry-001', 10, 'point-reflection-one-coordinate-error', 3, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 3), cx: range(4, 5), cy: range(4, 5) },
      prompt_template: prompts[5],
      solver_rule: '2 * (cy - y)',
      solution_steps_template: ['점대칭에서는 x좌표와 y좌표를 모두 중심 반대편 같은 거리로 옮겨야 합니다. 올바른 y좌표는 {{2 * cy - y}}입니다.', '잘못 적은 y좌표 {{y}}, 올바른 y좌표 {{2 * cy - y}}의 차이는 {{2 * cy - 2 * y}}입니다.'],
      hint_steps_template: ['중심에서 P까지의 세로 거리를 확인해요.', '중심 반대편 y좌표와 그대로 둔 y좌표를 비교해요.'],
      visual_template: { type: 'symmetry', mode: 'point-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', centerX: '{{cx}}', centerY: '{{cy}}' },
    }),
  ])
}

function cuboidTemplates(set) {
  const s = set.shift
  const cuboidVisual = (focus, dimensions = {}) => ({
    type: 'cuboid',
    focus,
    unit: 'cm',
    ...dimensions,
  })
  const allDimensions = {
    width: '{{w}}',
    height: '{{h}}',
    depth: '{{d}}',
  }
  const frontFaceDimensions = {
    width: '{{w}}',
    height: '{{h}}',
  }
  const prompts = {
    A: [
      '직육면체의 면은 모두 몇 개인가요?',
      '직육면체의 모서리는 모두 몇 개인가요?',
      '직육면체의 꼭짓점은 모두 몇 개인가요?',
      '직육면체의 한 꼭짓점에서 만나는 모서리는 몇 개인가요?',
      '가로 {{w}} cm, 세로 {{d}} cm, 높이 {{h}} cm인 직육면체 철사 틀을 만들 때 필요한 철사의 전체 길이는 몇 cm인가요?',
      '모든 모서리 길이의 합이 {{4 * (w + h + d)}} cm이고 세로가 {{d}} cm, 높이가 {{h}} cm인 직육면체의 가로는 몇 cm인가요?',
      '가로 {{w}} cm, 높이 {{h}} cm인 직육면체 상자의 앞면에 종이를 붙입니다. 필요한 종이의 넓이는 몇 cm²인가요?',
      '직육면체 상자의 앞면 가장자리에 띠를 두릅니다. 앞면의 가로가 {{w}} cm, 높이가 {{h}} cm일 때 띠의 길이는 몇 cm인가요?',
      '직육면체의 모든 모서리 길이를 구하면서 가로·세로·높이 길이를 각각 2번씩만 더했습니다. 올바른 값보다 몇 cm 부족한가요?',
      '직육면체의 겉넓이를 구하면서 서로 다른 크기의 면을 한 장씩만 골라 넓이를 더했습니다. 올바른 겉넓이보다 몇 cm² 부족한가요?',
    ],
    B: [
      '직육면체 상자를 이루는 직사각형 면의 수를 구하세요.',
      '직육면체 철사 틀의 모서리 수를 구하세요.',
      '직육면체에서 세 모서리의 끝이 만나는 꼭짓점 수를 구하세요.',
      '직육면체의 한 꼭짓점에서 서로 다른 방향으로 뻗는 모서리는 몇 개인가요?',
      '가로 {{w}} cm, 세로 {{d}} cm, 높이 {{h}} cm인 직육면체 모형의 12개 모서리를 철사로 만들려고 합니다. 철사는 모두 몇 cm 필요한가요?',
      '직육면체 철사 틀의 전체 길이는 {{4 * (w + h + d)}} cm입니다. 세로 {{d}} cm와 높이 {{h}} cm를 이용해 가로를 구하세요.',
      '가로 {{w}} cm, 높이 {{h}} cm인 직육면체 수납함의 앞면을 색종이로 덮을 때 색종이 넓이는 몇 cm²인가요?',
      '가로 {{w}} cm, 높이 {{h}} cm인 직육면체 액자의 앞면 테두리 길이는 몇 cm인가요?',
      '모서리 전체 길이를 계산하며 가로·세로·높이가 각각 2개씩만 있다고 생각했습니다. 실제로는 각각 4개일 때 계산 결과의 부족분은 몇 cm인가요?',
      '직육면체의 겉넓이를 앞·옆·윗면의 넓이만 더해 구했습니다. 마주 보는 세 면을 빠뜨린 값은 실제 겉넓이보다 몇 cm² 작은가요?',
    ],
    C: [
      '서로 마주 보는 면 3쌍으로 이루어진 직육면체의 전체 면 수를 구하세요.',
      '가로·세로·높이 방향 모서리가 각각 4개인 직육면체의 전체 모서리 수를 구하세요.',
      '윗면과 아랫면의 꼭짓점을 모두 세어 직육면체의 꼭짓점 수를 구하세요.',
      '한 꼭짓점에서 가로·세로·높이 방향으로 만나는 모서리 수를 구하세요.',
      '가로 {{w}} cm, 세로 {{d}} cm, 높이 {{h}} cm인 모서리가 각각 4개 있습니다. 모든 모서리 길이의 합을 구하세요.',
      '모든 모서리 길이의 합 {{4 * (w + h + d)}} cm를 4로 나눈 뒤 세로 {{d}} cm와 높이 {{h}} cm를 빼서 가로를 구하세요.',
      '직육면체 앞면의 가로 {{w}} cm와 높이 {{h}} cm를 이용해 앞면 넓이를 구하세요.',
      '직육면체 앞면의 가로 {{w}} cm와 높이 {{h}} cm를 이용해 앞면 둘레를 구하세요.',
      '모서리 길이의 합을 2 × (가로 + 세로 + 높이)로 잘못 계산했습니다. 4 × (가로 + 세로 + 높이)로 계산한 값과의 차이는 몇 cm인가요?',
      '겉넓이를 가로×높이 + 가로×세로 + 높이×세로로만 계산했습니다. 마주 보는 면까지 포함한 겉넓이와의 차이는 몇 cm²인가요?',
    ],
  }[set.id]
  return [
    template(set, 'cuboid-001', 1, 'face-count', 1, 'number', {
      param_schema: {},
      prompt_template: prompts[0], solver_rule: '6',
      solution_steps_template: ['서로 마주 보는 면이 3쌍입니다.', '3쌍은 모두 6개입니다.'],
      hint_steps_template: ['앞뒤, 위아래, 양옆을 세어 봐요.', '마주 보는 면을 한 쌍씩 세어요.'],
      visual_template: cuboidVisual('face'),
    }),
    template(set, 'cuboid-001', 2, 'edge-count', 1, 'number', {
      param_schema: {},
      prompt_template: prompts[1], solver_rule: '12',
      solution_steps_template: ['윗면과 아랫면에 모서리가 각각 4개씩 있습니다.', '두 면을 잇는 모서리 4개를 더하면 12개입니다.'],
      hint_steps_template: ['보이는 모서리와 숨은 모서리를 함께 세어요.', '4 + 4 + 4로 묶어 볼 수 있어요.'],
      visual_template: cuboidVisual('edge'),
    }),
    template(set, 'cuboid-001', 3, 'vertex-count', 1, 'number', {
      param_schema: {},
      prompt_template: prompts[2], solver_rule: '8',
      solution_steps_template: ['윗면과 아랫면에 꼭짓점이 각각 4개씩 있습니다.', '4 + 4 = 8개입니다.'],
      hint_steps_template: ['위쪽 네 모서리 끝과 아래쪽 네 모서리 끝을 세어요.', '숨은 꼭짓점도 빠뜨리지 않아요.'],
      visual_template: cuboidVisual('vertex'),
    }),
    template(set, 'cuboid-001', 4, 'edges-at-vertex', 1, 'number', {
      param_schema: {},
      prompt_template: prompts[3], solver_rule: '3',
      solution_steps_template: ['한 꼭짓점에서는 가로, 세로, 높이 방향의 모서리가 만납니다.', '따라서 3개입니다.'],
      hint_steps_template: ['한 꼭짓점에서 뻗어 나가는 선을 찾아요.', '서로 다른 세 방향을 확인해요.'],
      visual_template: cuboidVisual('edges-at-vertex'),
    }),
    template(set, 'cuboid-001', 5, 'total-edge-length', 2, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s), d: range(2, 6, s) },
      prompt_template: prompts[4],
      solver_rule: '4 * (w + h + d)',
      solution_steps_template: ['가로, 세로, 높이 길이의 모서리는 각각 4개씩입니다.', '({{w}} + {{h}} + {{d}}) × 4 = {{4 * (w + h + d)}}cm입니다.'],
      hint_steps_template: ['같은 길이의 모서리를 4개씩 묶어요.', '가로 + 세로 + 높이를 먼저 계산해요.'],
      visual_template: cuboidVisual('total-edge-length', allDimensions),
    }),
    template(set, 'cuboid-001', 6, 'missing-width-from-edges', 2, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s), d: range(2, 6, s) },
      prompt_template: prompts[5],
      solver_rule: 'w',
      solution_steps_template: ['전체 모서리 길이를 4로 나누면 가로 + 세로 + 높이인 {{w + h + d}}cm입니다.', '{{w + h + d}} - {{d}} - {{h}} = {{w}}cm입니다.'],
      hint_steps_template: ['전체 길이를 먼저 4로 나눠요.', '세로와 높이를 차례로 빼요.'],
      visual_template: cuboidVisual('total-edge-length', {
        ...allDimensions,
        unknownMeasurement: 'width',
      }),
    }),
    template(set, 'cuboid-001', 7, 'front-face-area', 2, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s) },
      prompt_template: prompts[6], solver_rule: 'w * h',
      solution_steps_template: ['앞면은 가로 {{w}}cm, 세로 {{h}}cm인 직사각형입니다.', '{{w}} × {{h}} = {{w * h}}cm²입니다.'],
      hint_steps_template: ['앞면만 떼어 평면으로 생각해요.', '직사각형 넓이를 구해요.'],
      visual_template: cuboidVisual('front-face', frontFaceDimensions),
    }),
    template(set, 'cuboid-001', 8, 'front-face-perimeter', 2, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s) },
      prompt_template: prompts[7], solver_rule: '2 * (w + h)',
      solution_steps_template: ['앞면의 가로는 {{w}}cm, 세로는 {{h}}cm입니다.', '({{w}} + {{h}}) × 2 = {{2 * (w + h)}}cm입니다.'],
      hint_steps_template: ['앞면은 직사각형이에요.', '가로와 높이를 이용해 둘레를 구해요.'],
      visual_template: cuboidVisual('front-face', frontFaceDimensions),
    }),
    template(set, 'cuboid-001', 9, 'half-edge-count-error', 3, 'number', {
      param_schema: { w: range(6, 10, s), h: range(4, 8, s), d: range(3, 7, s) },
      prompt_template: prompts[8],
      solver_rule: '2 * (w + h + d)',
      solution_steps_template: ['올바른 전체 길이는 4 × ({{w}} + {{h}} + {{d}}) = {{4 * (w + h + d)}}cm입니다.', '2번씩만 센 값은 {{2 * (w + h + d)}}cm이므로 부족한 길이는 {{2 * (w + h + d)}}cm입니다.'],
      hint_steps_template: ['각 길이의 모서리가 실제로 몇 개인지 비교해요.', '올바른 전체 길이에서 잘못 센 길이를 빼요.'],
      visual_template: cuboidVisual('total-edge-length', allDimensions),
    }),
    template(set, 'cuboid-001', 10, 'one-of-each-face-area-error', 3, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s), d: range(2, 6, s) },
      prompt_template: prompts[9],
      solver_rule: 'w * h + w * d + h * d',
      solution_steps_template: ['서로 다른 세 면의 넓이 합은 {{w * h}} + {{w * d}} + {{h * d}} = {{w * h + w * d + h * d}}cm²입니다.', '각 면과 합동인 맞은편 면을 한 장씩 빠뜨렸으므로 이 합만큼 부족합니다.'],
      hint_steps_template: ['서로 마주 보는 면은 크기와 모양이 같아요.', '빠뜨린 앞·옆·윗면 한 장씩의 넓이를 더해요.'],
      visual_template: cuboidVisual('surface-area', allDimensions),
    }),
  ]
}

function cuboidNetTemplates(set) {
  const optionChoices = [0, 1, 2, 3].map(offset => `{{geometryOption(2, variant, ${offset})}}`)
  const prompts = {
    A: [
      '직육면체 전개도는 직사각형 몇 개로 이루어져 있나요?',
      '전개도를 접었을 때 1번 면과 마주 보는 면은 몇 번인가요?',
      '전개도를 접었을 때 2번 면과 마주 보는 면은 몇 번인가요?',
      '직육면체로 접을 수 있는 전개도를 고르세요.',
      '전개도에서 {{face}}번 면에 동그라미를 쳤습니다. 접으면 이 면과 마주 보는 면은 몇 번인가요?',
      '직육면체에서 서로 마주 보는 면의 쌍은 모두 몇 쌍인가요?',
      '전개도에서 4번 면과 마주 보는 면의 번호는 무엇인가요?',
      '전개도의 각 면이 한 변 {{side}}cm인 정사각형입니다. 한 면의 가장자리에 띠를 두를 때 필요한 길이는 몇 cm인가요?',
      '{{face}}번 면과 그 면의 맞은편 면에 적힌 두 수의 합은 얼마인가요?',
      '한 변이 {{side}}cm인 정사각형 6개로 만든 전개도의 둘레를 구하면서 여섯 정사각형의 둘레를 모두 더했습니다. 이 값은 실제 전개도 둘레보다 몇 cm 큰가요?',
    ],
    B: [
      '직육면체 상자를 펼쳤을 때 나타나는 면의 수를 구하세요.',
      '1번 면을 바닥으로 두고 접을 때 천장이 되는 면의 번호를 구하세요.',
      '2번 면과 서로 평행하며 만나지 않는 면의 번호를 구하세요.',
      '네 보기 중 면이 겹치지 않고 직육면체가 되는 전개도를 고르세요.',
      '{{face}}번 면을 기준으로 전개도를 접을 때 반대쪽에 놓이는 면 번호를 구하세요.',
      '앞뒤·좌우·위아래로 짝지은 직육면체의 맞은편 면은 모두 몇 쌍인가요?',
      '4번 면을 접어 올릴 때 그 면과 마주 보게 되는 면 번호를 구하세요.',
      '한 변 {{side}}cm인 정사각형 면 하나의 테두리에 끈을 붙입니다. 필요한 끈의 길이는 몇 cm인가요?',
      '{{face}}번 면과 접은 뒤 맞은편에 놓이는 면의 번호를 더한 값은 얼마인가요?',
      '정사각형 6개의 둘레 합으로 전개도 바깥 둘레를 구해 {{24 * side}}cm라고 했습니다. 서로 붙은 변을 빼면 실제 값과 몇 cm 차이 나나요?',
    ],
    C: [
      '접기 전 전개도에 있는 여섯 면을 세어 전체 면 수를 구하세요.',
      '중심인 1번 면과 접었을 때 마주 보는 끝 면의 번호를 구하세요.',
      '중심 면의 왼쪽과 오른쪽에서 접어 올라가는 2번 면의 맞은편 번호를 구하세요.',
      '각 면의 접힌 방향을 추적하여 직육면체가 되는 전개도를 고르세요.',
      '{{face}}번 면과 변을 공유하지 않고 접은 뒤 반대쪽에 놓이는 면의 번호를 구하세요.',
      '면 6개를 서로 마주 보는 두 면씩 묶었을 때 생기는 쌍의 수를 구하세요.',
      '중심 면의 위와 아래에서 접히는 4번 면의 맞은편 번호를 구하세요.',
      '정사각형 한 면의 네 변이 각각 {{side}}cm일 때 그 면의 둘레를 구하세요.',
      '{{face}}번 면과 그 맞은편 면 번호의 합을 구하세요.',
      '전개도의 정사각형 6개에는 변이 24개 있지만, 서로 붙은 5개 변은 안쪽에서 두 번씩 셌습니다. 한 변이 {{side}}cm일 때 잘못 더한 길이와 바깥 둘레의 차이는 몇 cm인가요?',
    ],
  }[set.id]
  return [
    template(set, 'cuboidnet-001', 1, 'net-face-count', 1, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: prompts[0], solver_rule: '6',
      solution_steps_template: ['직육면체의 면은 6개입니다.', '전개도에도 면 6개가 빠짐없이 나타납니다.'],
      hint_steps_template: ['전개도의 칸을 하나씩 세어요.', '겹치거나 빠진 칸이 없는지 확인해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}' },
    }),
    template(set, 'cuboidnet-001', 2, 'opposite-face-one', 1, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: prompts[1], solver_rule: 'cuboidOppositeFace(1)',
      solution_steps_template: ['1번 면 주변의 네 면을 먼저 접어 올립니다.', '마지막에 덮이는 6번 면이 1번 면과 마주 봅니다.'],
      hint_steps_template: ['1번 면과 변을 공유하는 면은 마주 보는 면이 아니에요.', '가장 멀리 이어진 면을 접어 봐요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: 1 },
    }),
    template(set, 'cuboidnet-001', 3, 'opposite-face-two', 1, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: prompts[2], solver_rule: 'cuboidOppositeFace(2)',
      solution_steps_template: ['2번 면과 3번 면은 중심 면의 양쪽에 있습니다.', '접으면 서로 마주 보므로 정답은 3번입니다.'],
      hint_steps_template: ['중심 면의 왼쪽과 오른쪽 면을 찾아요.', '두 면을 접어 올린 모습을 생각해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: 2 },
    }),
    template(set, 'cuboidnet-001', 4, 'valid-net-choice', 1, 'choice', {
      param_schema: { variant: range(1, 4) }, prompt_template: prompts[3], solver_rule: 'geometryOption(2, variant, 0)', choices_template: optionChoices,
      solution_steps_template: ['각 전개도를 접을 때 면이 겹치는지 확인합니다.', '{{geometryOption(2, variant, 0)}} 전개도는 여섯 면이 겹치지 않고 직육면체가 됩니다.'],
      hint_steps_template: ['한 면을 바닥으로 두고 주변 면을 접어 봐요.', '같은 자리를 차지하는 면이 생기면 안 돼요.'], visual_template: { type: 'cuboid-net', mode: 'options', variant: '{{variant}}' },
    }),
    template(set, 'cuboidnet-001', 5, 'opposite-face-input', 2, 'number', {
      param_schema: { variant: range(1, 4), face: range(1, 6) }, prompt_template: prompts[4], solver_rule: 'cuboidOppositeFace(face)',
      solution_steps_template: ['전개도에서 {{face}}번 면을 기준으로 접습니다.', '마주 보는 면은 {{cuboidOppositeFace(face)}}번입니다.'],
      hint_steps_template: ['변을 직접 공유하는 면은 이웃한 면이에요.', '접었을 때 반대쪽에 놓이는 면을 찾아요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: '{{face}}' },
    }),
    template(set, 'cuboidnet-001', 6, 'opposite-pair-count', 2, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: prompts[5], solver_rule: '3',
      solution_steps_template: ['앞뒤, 좌우, 위아래 면이 각각 한 쌍입니다.', '따라서 모두 3쌍입니다.'],
      hint_steps_template: ['면 6개를 두 개씩 짝지어요.', '서로 평행하면서 만나지 않는 면을 찾아요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}' },
    }),
    template(set, 'cuboidnet-001', 7, 'top-bottom-pair', 2, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: prompts[6], solver_rule: 'cuboidOppositeFace(4)',
      solution_steps_template: ['4번과 5번 면은 중심 면의 위와 아래에 있습니다.', '접으면 서로 마주 보므로 5번입니다.'],
      hint_steps_template: ['중심 면의 위쪽과 아래쪽을 살펴봐요.', '접어 올렸을 때의 위치를 생각해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: 4 },
    }),
    template(set, 'cuboidnet-001', 8, 'net-square-perimeter', 2, 'number', {
      param_schema: { variant: range(1, 4), side: range(2, 6, set.shift) }, prompt_template: prompts[7], solver_rule: '4 * side',
      solution_steps_template: ['한 면은 네 변의 길이가 같은 정사각형입니다.', '{{side}} × 4 = {{4 * side}}cm입니다.'],
      hint_steps_template: ['한 면만 떼어 생각해요.', '한 변의 길이를 4번 더해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', side: '{{side}}' },
    }),
    template(set, 'cuboidnet-001', 9, 'opposite-label-sum', 3, 'number', {
      param_schema: { variant: range(1, 4), face: range(1, 6) }, prompt_template: prompts[8], solver_rule: 'face + cuboidOppositeFace(face)',
      solution_steps_template: ['{{face}}번 면의 맞은편은 {{cuboidOppositeFace(face)}}번입니다.', '{{face}} + {{cuboidOppositeFace(face)}} = {{face + cuboidOppositeFace(face)}}입니다.'],
      hint_steps_template: ['먼저 마주 보는 면의 번호를 찾아요.', '두 면의 번호를 더해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: '{{face}}' },
    }),
    template(set, 'cuboidnet-001', 10, 'shared-edge-perimeter-error', 3, 'number', {
      param_schema: { variant: range(1, 4), side: range(2, 6, set.shift) }, prompt_template: prompts[9], solver_rule: '10 * side',
      solution_steps_template: ['정사각형 6개의 변은 모두 24개이지만 전개도 안에서 서로 붙은 변 5개는 양쪽 정사각형에서 두 번씩 셌습니다.', '겹쳐 센 길이는 {{side}} × 5 × 2 = {{10 * side}}cm이므로 이만큼 크게 계산했습니다.'],
      hint_steps_template: ['전개도 안쪽의 공유 변을 찾아요.', '공유 변 하나마다 같은 길이를 두 번 빼야 해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', side: '{{side}}' },
    }),
  ]
}

const banks = {
  'perimeter.json': SETS.flatMap(perimeterTemplates),
  'polygonarea.json': SETS.flatMap(polygonAreaTemplates),
  'congruence.json': SETS.flatMap(congruenceTemplates),
  'symmetry.json': SETS.flatMap(symmetryTemplates),
  'cuboid.json': SETS.flatMap(cuboidTemplates),
  'cuboidnet.json': SETS.flatMap(cuboidNetTemplates),
}

function serializeTemplates(templates) {
  let serialized = JSON.stringify(templates, null, 2)

  for (const template of templates) {
    const prettyBlueprint = JSON.stringify(template.blueprint, null, 2)
      .replace(/\n/g, '\n    ')
    serialized = serialized.replace(
      `"blueprint": ${prettyBlueprint}`,
      `"blueprint": ${JSON.stringify(template.blueprint)}`
    )
  }

  return `${serialized}\n`
}

if (require.main === module) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const [filename, templates] of Object.entries(banks)) {
    fs.writeFileSync(path.join(OUT_DIR, filename), serializeTemplates(templates))
    console.log(`${filename}: ${templates.length} templates`)
  }
}

module.exports = { banks, serializeTemplates }
