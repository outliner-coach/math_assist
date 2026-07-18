const fs = require('fs')
const path = require('path')

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
  return {
    id: `tmpl-${concept.replace('-001', '')}-${set.id}-${String(index).padStart(2, '0')}`,
    concept_id: concept,
    type,
    difficulty,
    set_id: set.id,
    problem_family: `${concept.replace('-001', '')}-${family}`,
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
  return [
    template(set, 'perimeter-001', 1, 'rectangle-perimeter', 1, 'number', {
      param_schema: { w: range(4, 9, s), h: range(2, 6, s) },
      prompt_template: '그림의 직사각형 둘레는 몇 cm인가요?',
      solver_rule: '2 * (w + h)',
      solution_steps_template: ['가로와 세로를 한 번씩 더하면 {{w + h}}cm입니다.', '둘레는 {{w + h}} × 2 = {{2 * (w + h)}}cm입니다.'],
      hint_steps_template: ['가로 2개와 세로 2개의 길이를 모두 더해요.', '(가로 + 세로) × 2를 계산해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 2, 'square-perimeter', 1, 'number', {
      param_schema: { side: range(3, 8, s) },
      prompt_template: '한 변의 길이가 표시된 정사각형의 둘레는 몇 cm인가요?',
      solver_rule: '4 * side',
      solution_steps_template: ['정사각형은 네 변의 길이가 같습니다.', '{{side}} × 4 = {{4 * side}}cm입니다.'],
      hint_steps_template: ['같은 길이의 변이 4개예요.', '한 변의 길이에 4를 곱해요.'],
      visual_template: polygonVisual('square', { a: '{{side}}' }),
    }),
    template(set, 'perimeter-001', 3, 'rectangle-perimeter-choice', 1, 'choice', {
      param_schema: { w: range(5, 10, s), h: range(2, 5, s) },
      prompt_template: '직사각형의 둘레로 알맞은 값을 고르세요.',
      solver_rule: '2 * (w + h)',
      choices_template: safeOffsetChoices('2 * (w + h)', 2),
      solution_steps_template: ['(가로 + 세로) × 2를 이용합니다.', '({{w}} + {{h}}) × 2 = {{2 * (w + h)}}cm입니다.'],
      hint_steps_template: ['가로와 세로를 먼저 더해요.', '그 합을 2배 해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 4, 'triangle-perimeter', 1, 'number', {
      param_schema: { a: range(4, 8, s), b: range(5, 9, s), c: range(6, 10, s) },
      prompt_template: '세 변의 길이가 표시된 삼각형의 둘레는 몇 cm인가요?',
      solver_rule: 'a + b + c',
      solution_steps_template: ['세 변의 길이를 모두 더합니다.', '{{a}} + {{b}} + {{c}} = {{a + b + c}}cm입니다.'],
      hint_steps_template: ['둘레는 도형의 가장자리 길이의 합이에요.', '세 변을 빠짐없이 더해요.'],
      visual_template: polygonVisual('triangle', { a: '{{a}}', b: '{{b}}', c: '{{c}}', measurementMode: 'sides' }),
    }),
    template(set, 'perimeter-001', 5, 'rectangle-area', 2, 'number', {
      param_schema: { w: range(4, 9, s), h: range(3, 7, s) },
      prompt_template: '직사각형의 넓이는 몇 cm²인가요?',
      solver_rule: 'w * h',
      solution_steps_template: ['직사각형의 넓이는 가로 × 세로입니다.', '{{w}} × {{h}} = {{w * h}}cm²입니다.'],
      hint_steps_template: ['1cm² 정사각형이 몇 개인지 생각해요.', '가로와 세로를 곱해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 6, 'square-area-choice', 2, 'choice', {
      param_schema: { side: range(3, 8, s) },
      prompt_template: '정사각형의 넓이로 알맞은 값을 고르세요.',
      solver_rule: 'side * side',
      choices_template: safeOffsetChoices('side * side', 1),
      solution_steps_template: ['정사각형의 넓이는 한 변 × 한 변입니다.', '{{side}} × {{side}} = {{side * side}}cm²입니다.'],
      hint_steps_template: ['같은 길이를 두 번 곱해요.', '둘레를 구하는 문제가 아닌지 확인해요.'],
      visual_template: polygonVisual('square', { a: '{{side}}' }),
    }),
    template(set, 'perimeter-001', 7, 'rectangle-width-from-area', 2, 'number', {
      param_schema: { w: range(4, 9, s), h: range(2, 6, s) },
      prompt_template: '넓이가 {{w * h}}cm²이고 세로가 {{h}}cm인 직사각형의 가로는 몇 cm인가요?',
      solver_rule: 'w',
      solution_steps_template: ['가로 × {{h}} = {{w * h}}입니다.', '{{w * h}} ÷ {{h}} = {{w}}cm입니다.'],
      hint_steps_template: ['넓이를 알고 있으므로 나눗셈을 이용해요.', '넓이 ÷ 세로를 계산해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 8, 'rectangle-height-from-area', 2, 'number', {
      param_schema: { w: range(5, 10, s), h: range(3, 7, s) },
      prompt_template: '넓이가 {{w * h}}cm²이고 가로가 {{w}}cm인 직사각형의 세로는 몇 cm인가요?',
      solver_rule: 'h',
      solution_steps_template: ['{{w}} × 세로 = {{w * h}}입니다.', '{{w * h}} ÷ {{w}} = {{h}}cm입니다.'],
      hint_steps_template: ['넓이 ÷ 가로를 계산해요.', '구한 세로를 다시 곱해 확인해요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 9, 'rectangle-side-from-perimeter', 3, 'number', {
      param_schema: { w: range(6, 12, s), h: range(3, 8, s) },
      prompt_template: '둘레가 {{2 * (w + h)}}cm이고 가로가 {{w}}cm인 직사각형의 세로는 몇 cm인가요?',
      solver_rule: 'h',
      solution_steps_template: ['둘레의 절반은 가로 + 세로이므로 {{w + h}}cm입니다.', '{{w + h}} - {{w}} = {{h}}cm입니다.'],
      hint_steps_template: ['둘레를 2로 나누어 가로와 세로의 합을 구해요.', '그 합에서 가로를 빼요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'perimeter-001', 10, 'fence-with-gate', 3, 'number', {
      param_schema: { w: range(8, 14, s), h: range(5, 10, s), gate: range(1, 3) },
      prompt_template: '가로 {{w}}m, 세로 {{h}}m인 직사각형 꽃밭 둘레에 울타리를 두르되, {{gate}}m인 출입구에는 울타리를 놓지 않습니다. 필요한 울타리는 몇 m인가요?',
      solver_rule: '2 * (w + h) - gate',
      solution_steps_template: ['꽃밭 전체 둘레는 ({{w}} + {{h}}) × 2 = {{2 * (w + h)}}m입니다.', '출입구 {{gate}}m를 빼면 {{2 * (w + h) - gate}}m입니다.'],
      hint_steps_template: ['먼저 꽃밭의 전체 둘레를 구해요.', '울타리를 놓지 않는 출입구 길이를 빼요.'],
      visual_template: { type: 'polygon', shape: 'rectangle', a: '{{w}}', b: '{{h}}', unit: 'm' },
    }),
  ]
}

function polygonAreaTemplates(set) {
  const s = set.shift
  return [
    template(set, 'polygonarea-001', 1, 'parallelogram-area', 1, 'number', {
      param_schema: { base: range(4, 9, s), height: range(2, 6, s), side: range(3, 7, s) },
      prompt_template: '평행사변형의 넓이는 몇 cm²인가요?',
      solver_rule: 'base * height',
      solution_steps_template: ['평행사변형의 넓이는 밑변 × 높이입니다.', '{{base}} × {{height}} = {{base * height}}cm²입니다.'],
      hint_steps_template: ['기울어진 변의 길이 대신 높이를 사용해요.', '밑변과 높이를 곱해요.'],
      visual_template: polygonVisual('parallelogram', { a: '{{base}}', b: '{{side}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 2, 'triangle-area', 1, 'number', {
      param_schema: { base: range(4, 8, s * 2), height: range(3, 7, s) },
      prompt_template: '삼각형의 넓이는 몇 cm²인가요?',
      solver_rule: 'base * height / 2',
      solution_steps_template: ['삼각형의 넓이는 밑변 × 높이 ÷ 2입니다.', '{{base}} × {{height}} ÷ 2 = {{base * height / 2}}cm²입니다.'],
      hint_steps_template: ['같은 밑변과 높이의 평행사변형 절반이에요.', '밑변과 높이를 곱한 뒤 2로 나눠요.'],
      visual_template: polygonVisual('triangle', { a: '{{base}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 3, 'trapezoid-area', 1, 'number', {
      param_schema: { top: range(3, 7, s), bottom: range(8, 12, s), height: range(4, 8, s * 2), side: range(4, 7, s) },
      prompt_template: '사다리꼴의 넓이는 몇 cm²인가요?',
      solver_rule: '(top + bottom) * height / 2',
      solution_steps_template: ['윗변과 아랫변의 합은 {{top + bottom}}cm입니다.', '({{top}} + {{bottom}}) × {{height}} ÷ 2 = {{(top + bottom) * height / 2}}cm²입니다.'],
      hint_steps_template: ['평행한 두 변의 길이를 먼저 더해요.', '그 합에 높이를 곱하고 2로 나눠요.'],
      visual_template: polygonVisual('trapezoid', { a: '{{top}}', b: '{{bottom}}', c: '{{side}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 4, 'rhombus-area', 1, 'number', {
      param_schema: { d1: range(4, 8, s * 2), d2: range(5, 11, s) },
      prompt_template: '두 대각선의 길이가 표시된 마름모의 넓이는 몇 cm²인가요?',
      solver_rule: 'd1 * d2 / 2',
      solution_steps_template: ['마름모의 넓이는 두 대각선의 곱 ÷ 2입니다.', '{{d1}} × {{d2}} ÷ 2 = {{d1 * d2 / 2}}cm²입니다.'],
      hint_steps_template: ['두 대각선이 만드는 직사각형을 생각해요.', '두 대각선을 곱하고 2로 나눠요.'],
      visual_template: polygonVisual('rhombus', { a: '{{d1}}', b: '{{d2}}' }),
    }),
    template(set, 'polygonarea-001', 5, 'parallelogram-height', 2, 'number', {
      param_schema: { base: range(5, 10, s), height: range(3, 7, s), side: range(4, 8, s) },
      prompt_template: '넓이가 {{base * height}}cm²이고 밑변이 {{base}}cm인 평행사변형의 높이는 몇 cm인가요?',
      solver_rule: 'height',
      solution_steps_template: ['밑변 × 높이 = {{base * height}}입니다.', '{{base * height}} ÷ {{base}} = {{height}}cm입니다.'],
      hint_steps_template: ['넓이를 밑변으로 나눠요.', '기울어진 변의 길이와 높이를 구별해요.'],
      visual_template: polygonVisual('parallelogram', { a: '{{base}}', b: '{{side}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 6, 'triangle-height', 2, 'number', {
      param_schema: { base: range(4, 8, s * 2), height: range(3, 8, s) },
      prompt_template: '넓이가 {{base * height / 2}}cm²이고 밑변이 {{base}}cm인 삼각형의 높이는 몇 cm인가요?',
      solver_rule: 'height',
      solution_steps_template: ['넓이에 2를 곱하면 {{base * height}}입니다.', '{{base * height}} ÷ {{base}} = {{height}}cm입니다.'],
      hint_steps_template: ['먼저 넓이를 2배 해요.', '그 값을 밑변으로 나눠요.'],
      visual_template: polygonVisual('triangle', { a: '{{base}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 7, 'trapezoid-bottom', 2, 'number', {
      param_schema: { top: range(3, 7, s), bottom: range(8, 13, s), height: range(4, 8, s * 2), side: range(4, 8, s) },
      prompt_template: '넓이가 {{(top + bottom) * height / 2}}cm²이고 윗변이 {{top}}cm, 높이가 {{height}}cm인 사다리꼴의 아랫변은 몇 cm인가요?',
      solver_rule: 'bottom',
      solution_steps_template: ['넓이 × 2 ÷ 높이로 윗변과 아랫변의 합 {{top + bottom}}cm를 구합니다.', '{{top + bottom}} - {{top}} = {{bottom}}cm입니다.'],
      hint_steps_template: ['평행한 두 변의 합을 먼저 역산해요.', '그 합에서 윗변을 빼요.'],
      visual_template: polygonVisual('trapezoid', { a: '{{top}}', b: '{{bottom}}', c: '{{side}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 8, 'two-shape-area-sum', 2, 'number', {
      param_schema: { base: range(4, 8, s * 2), height: range(3, 7, s), pbase: range(5, 10, s), pheight: range(2, 6, s) },
      prompt_template: '밑변 {{base}}cm, 높이 {{height}}cm인 삼각형과 밑변 {{pbase}}cm, 높이 {{pheight}}cm인 평행사변형의 넓이 합은 몇 cm²인가요?',
      solver_rule: 'base * height / 2 + pbase * pheight',
      solution_steps_template: ['삼각형의 넓이는 {{base * height / 2}}cm²입니다.', '평행사변형의 넓이 {{pbase * pheight}}cm²를 더하면 {{base * height / 2 + pbase * pheight}}cm²입니다.'],
      hint_steps_template: ['두 도형의 넓이를 따로 구해요.', '삼각형에서는 ÷2를 빠뜨리지 않아요.'],
      visual_template: polygonVisual('triangle', { a: '{{base}}', height: '{{height}}' }),
    }),
    template(set, 'polygonarea-001', 9, 'rectangle-minus-triangle', 3, 'number', {
      param_schema: { w: range(8, 14, s), h: range(6, 10, s), base: range(4, 8, s * 2), triHeight: range(2, 5, s) },
      prompt_template: '가로 {{w}}cm, 세로 {{h}}cm인 직사각형에서 밑변 {{base}}cm, 높이 {{triHeight}}cm인 삼각형을 잘라냈습니다. 남은 넓이는 몇 cm²인가요?',
      solver_rule: 'w * h - base * triHeight / 2',
      solution_steps_template: ['직사각형의 넓이는 {{w * h}}cm²입니다.', '삼각형의 넓이 {{base * triHeight / 2}}cm²를 빼면 {{w * h - base * triHeight / 2}}cm²입니다.'],
      hint_steps_template: ['전체 직사각형 넓이를 먼저 구해요.', '잘라낸 삼각형 넓이를 빼요.'],
      visual_template: polygonVisual('rectangle', { a: '{{w}}', b: '{{h}}' }),
    }),
    template(set, 'polygonarea-001', 10, 'rhombus-missing-diagonal', 3, 'number', {
      param_schema: { d1: range(4, 8, s * 2), d2: range(6, 12, s) },
      prompt_template: '넓이가 {{d1 * d2 / 2}}cm²이고 한 대각선이 {{d1}}cm인 마름모의 다른 대각선은 몇 cm인가요?',
      solver_rule: 'd2',
      solution_steps_template: ['넓이에 2를 곱하면 두 대각선의 곱 {{d1 * d2}}를 얻습니다.', '{{d1 * d2}} ÷ {{d1}} = {{d2}}cm입니다.'],
      hint_steps_template: ['넓이를 먼저 2배 해요.', '그 값을 알고 있는 대각선 길이로 나눠요.'],
      visual_template: polygonVisual('rhombus', { a: '{{d1}}', b: '{{d2}}' }),
    }),
  ]
}

function congruenceTemplates(set) {
  const s = set.shift
  const choiceFields = (variant) => ({
    solver_rule: `geometryOption(1, ${variant}, 0)`,
    choices_template: [0, 1, 2, 3].map(offset => `{{geometryOption(1, ${variant}, ${offset})}}`),
  })
  return [
    template(set, 'congruence-001', 1, 'corresponding-vertex', 1, 'choice', {
      param_schema: { variant: range(1, 4) },
      prompt_template: '합동인 두 도형에서 꼭짓점 ㄱ에 대응하는 도형 2의 꼭짓점을 고르세요.',
      ...choiceFields('variant'),
      solution_steps_template: ['도형을 돌리거나 뒤집어 같은 위치의 꼭짓점을 찾습니다.', 'ㄱ에 대응하는 꼭짓점은 {{geometryOption(1, variant, 0)}}입니다.'],
      hint_steps_template: ['ㄱ에서 만나는 두 변의 방향을 살펴봐요.', '도형의 위치가 아니라 연결 관계를 비교해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}' },
    }),
    template(set, 'congruence-001', 2, 'corresponding-angle', 1, 'choice', {
      param_schema: { variant: range(1, 4) },
      prompt_template: '각 ㄱ과 크기가 같은 대응각의 꼭짓점을 고르세요.',
      ...choiceFields('variant'),
      solution_steps_template: ['합동인 도형의 대응각 크기는 같습니다.', '각 ㄱ의 대응각은 {{geometryOption(1, variant, 0)}}입니다.'],
      hint_steps_template: ['합동인 도형에서 같은 모양의 모서리를 찾아요.', 'ㄱ에 연결된 변의 순서를 따라가요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}' },
    }),
    template(set, 'congruence-001', 3, 'congruence-statement-order', 1, 'choice', {
      param_schema: { variant: range(1, 4) },
      prompt_template: '도형 1과 도형 2의 대응 순서를 바르게 나타낼 때, ㄱ과 짝지어야 할 글자를 고르세요.',
      ...choiceFields('variant'),
      solution_steps_template: ['합동 기호를 쓸 때 대응하는 꼭짓점은 같은 순서에 둡니다.', 'ㄱ과 짝지어야 할 글자는 {{geometryOption(1, variant, 0)}}입니다.'],
      hint_steps_template: ['각 꼭짓점 주변의 변을 비교해요.', '대응하는 순서가 바뀌지 않게 해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}' },
    }),
    template(set, 'congruence-001', 4, 'same-correspondence', 1, 'choice', {
      param_schema: { variant: range(1, 4) },
      prompt_template: '도형을 옮기거나 돌려 겹쳤을 때 ㄱ과 포개지는 꼭짓점을 고르세요.',
      ...choiceFields('variant'),
      solution_steps_template: ['옮기기와 돌리기는 도형의 크기와 모양을 바꾸지 않습니다.', '포개지는 꼭짓점은 {{geometryOption(1, variant, 0)}}입니다.'],
      hint_steps_template: ['도형을 머릿속으로 돌려 봐요.', '변의 연결 순서를 기준으로 판단해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}' },
    }),
    template(set, 'congruence-001', 5, 'corresponding-side-length', 2, 'number', {
      param_schema: { variant: range(1, 4), a: range(4, 9, s), b: range(5, 10, s), c: range(6, 11, s) },
      prompt_template: '합동인 두 도형에서 ㄱㄴ의 길이가 {{a}}cm입니다. 대응하는 변의 길이는 몇 cm인가요?',
      solver_rule: 'a',
      solution_steps_template: ['합동인 도형의 대응변 길이는 같습니다.', 'ㄱㄴ의 대응변도 {{a}}cm입니다.'],
      hint_steps_template: ['합동인 도형의 대응변 성질을 떠올려요.', '모양을 돌려도 길이는 변하지 않아요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 6, 'missing-corresponding-side', 2, 'number', {
      param_schema: { variant: range(1, 4), a: range(5, 10, s), b: range(6, 11, s), c: range(7, 12, s) },
      prompt_template: '합동인 두 사각형에서 한 변과 그 대응변의 길이가 같습니다. 도형 1의 표시된 변이 {{b}}cm라면 도형 2의 대응변은 몇 cm인가요?',
      solver_rule: 'b',
      solution_steps_template: ['서로 대응하는 변을 확인합니다.', '합동인 도형이므로 대응변은 {{b}}cm입니다.'],
      hint_steps_template: ['대응하는 위치의 변을 찾아요.', '합동이면 대응변의 길이는 같아요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 7, 'congruent-perimeter', 2, 'number', {
      param_schema: { variant: range(1, 4), a: range(4, 8, s), b: range(5, 9, s), c: range(6, 10, s) },
      prompt_template: '합동인 두 직사각형 중 도형 1의 가로가 {{a}}cm, 세로가 {{b}}cm입니다. 도형 2의 둘레는 몇 cm인가요?',
      solver_rule: '2 * (a + b)',
      solution_steps_template: ['합동인 두 직사각형의 가로와 세로 길이는 각각 같습니다.', '도형 2의 둘레는 ({{a}} + {{b}}) × 2 = {{2 * (a + b)}}cm입니다.'],
      hint_steps_template: ['도형 1과 도형 2의 대응변은 같아요.', '직사각형 둘레 공식을 적용해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 8, 'congruent-area', 2, 'number', {
      param_schema: { variant: range(1, 4), a: range(4, 9, s), b: range(3, 7, s), c: range(6, 10, s) },
      prompt_template: '합동인 두 직사각형 중 도형 1의 가로가 {{a}}cm, 세로가 {{b}}cm입니다. 도형 2의 넓이는 몇 cm²인가요?',
      solver_rule: 'a * b',
      solution_steps_template: ['합동인 도형은 크기와 모양이 같으므로 넓이도 같습니다.', '{{a}} × {{b}} = {{a * b}}cm²입니다.'],
      hint_steps_template: ['합동인 도형의 대응변 길이를 옮겨 생각해요.', '가로와 세로를 곱해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 9, 'two-missing-sides', 3, 'number', {
      param_schema: { variant: range(1, 4), a: range(5, 10, s), b: range(6, 11, s), c: range(7, 12, s) },
      prompt_template: '합동인 두 도형에서 도형 2의 표시되지 않은 두 대응변은 각각 {{a}}cm와 {{c}}cm입니다. 두 길이의 합은 몇 cm인가요?',
      solver_rule: 'a + c',
      solution_steps_template: ['도형 1의 대응변에서 두 길이 {{a}}cm와 {{c}}cm를 찾습니다.', '{{a}} + {{c}} = {{a + c}}cm입니다.'],
      hint_steps_template: ['두 변에 각각 대응하는 변을 찾아요.', '찾은 두 길이를 더해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
    template(set, 'congruence-001', 10, 'perimeter-difference', 3, 'number', {
      param_schema: { variant: range(1, 4), a: range(5, 10, s), b: range(6, 11, s), c: range(7, 12, s) },
      prompt_template: '합동인 두 도형의 둘레 차이는 몇 cm인가요? 도형의 위치와 방향은 서로 다릅니다.',
      solver_rule: '0',
      solution_steps_template: ['합동인 도형은 모든 대응변의 길이가 같습니다.', '따라서 두 도형의 둘레가 같으므로 차이는 0cm입니다.'],
      hint_steps_template: ['방향이 달라도 합동의 성질은 변하지 않아요.', '같은 두 수의 차를 생각해요.'],
      visual_template: { type: 'congruence', mode: 'pair', variant: '{{variant}}', a: '{{a}}', b: '{{b}}', c: '{{c}}', unit: 'cm' },
    }),
  ]
}

function symmetryTemplates(set) {
  const s = set.shift
  return [
    [1, 'square-axes', 1, 1, '정사각형'],
    [2, 'rectangle-axes', 1, 2, '직사각형'],
    [3, 'equilateral-triangle-axes', 1, 3, '정삼각형'],
    [4, 'rhombus-axes', 1, 5, '마름모'],
  ].map(([index, family, difficulty, shape, name]) => template(set, 'symmetry-001', index, family, difficulty, 'number', {
    param_schema: { shape: { min: shape, max: shape } },
    prompt_template: `${name}의 대칭축은 몇 개인가요?`,
    solver_rule: 'symmetryAxisCount(shape)',
    solution_steps_template: [`${name}을 접었을 때 완전히 겹치는 선을 모두 찾습니다.`, `대칭축은 {{symmetryAxisCount(shape)}}개입니다.`],
    hint_steps_template: ['가로, 세로, 대각선 방향으로 접어 보세요.', '완전히 겹치는 경우만 세어요.'],
    visual_template: { type: 'symmetry', mode: 'axes', variant: '{{shape}}' },
  })).concat([
    template(set, 'symmetry-001', 5, 'vertical-reflection-x', 2, 'number', {
      param_schema: { x: range(1, 3), y: range(2, 6), axis: range(4, 5) },
      prompt_template: '점 P({{x}}, {{y}})를 직선 x={{axis}}에 대하여 선대칭 이동한 점의 x좌표는?',
      solver_rule: '2 * axis - x',
      solution_steps_template: ['P에서 대칭축까지의 가로 거리는 {{axis - x}}칸입니다.', '축의 반대쪽으로 같은 거리만큼 가면 x좌표는 {{2 * axis - x}}입니다.'],
      hint_steps_template: ['점과 대칭축 사이의 칸 수를 세어요.', '축 반대편에 같은 거리로 표시해요.'],
      visual_template: { type: 'symmetry', mode: 'line-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', axis: '{{axis}}' },
    }),
    template(set, 'symmetry-001', 6, 'vertical-reflection-distance', 2, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 6), axis: range(4, 5) },
      prompt_template: '점 P와 직선 x={{axis}}에 대한 대칭점 사이의 가로 거리는 몇 칸인가요?',
      solver_rule: '2 * (axis - x)',
      solution_steps_template: ['P에서 대칭축까지는 {{axis - x}}칸입니다.', '양쪽 거리를 합하면 {{2 * (axis - x)}}칸입니다.'],
      hint_steps_template: ['대칭축까지 거리를 먼저 구해요.', '같은 거리가 축 반대쪽에도 있어요.'],
      visual_template: { type: 'symmetry', mode: 'line-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', axis: '{{axis}}' },
    }),
    template(set, 'symmetry-001', 7, 'point-reflection-x', 2, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 3), cx: range(4, 5), cy: range(4, 5) },
      prompt_template: '점 P({{x}}, {{y}})를 중심 ({{cx}}, {{cy}})에 대하여 점대칭 이동한 점의 x좌표는?',
      solver_rule: '2 * cx - x',
      solution_steps_template: ['중심은 두 점을 이은 선분의 중점입니다.', 'x좌표는 {{2 * cx}} - {{x}} = {{2 * cx - x}}입니다.'],
      hint_steps_template: ['중심에서 P까지의 가로 거리를 구해요.', '중심 반대쪽으로 같은 거리만큼 이동해요.'],
      visual_template: { type: 'symmetry', mode: 'point-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', centerX: '{{cx}}', centerY: '{{cy}}' },
    }),
    template(set, 'symmetry-001', 8, 'point-reflection-y', 2, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 3), cx: range(4, 5), cy: range(4, 5) },
      prompt_template: '점 P({{x}}, {{y}})를 중심 ({{cx}}, {{cy}})에 대하여 점대칭 이동한 점의 y좌표는?',
      solver_rule: '2 * cy - y',
      solution_steps_template: ['중심에서 위아래 거리가 같아야 합니다.', 'y좌표는 {{2 * cy}} - {{y}} = {{2 * cy - y}}입니다.'],
      hint_steps_template: ['중심에서 P까지의 세로 거리를 구해요.', '반대쪽으로 같은 거리만큼 이동해요.'],
      visual_template: { type: 'symmetry', mode: 'point-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', centerX: '{{cx}}', centerY: '{{cy}}' },
    }),
    template(set, 'symmetry-001', 9, 'point-reflection-coordinate-sum', 3, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 3), cx: range(4, 5), cy: range(4, 5) },
      prompt_template: '점 P({{x}}, {{y}})를 중심 ({{cx}}, {{cy}})에 대하여 점대칭 이동한 점의 x좌표와 y좌표의 합은?',
      solver_rule: '2 * cx - x + 2 * cy - y',
      solution_steps_template: ['대칭점은 ({{2 * cx - x}}, {{2 * cy - y}})입니다.', '두 좌표의 합은 {{2 * cx - x}} + {{2 * cy - y}} = {{2 * cx - x + 2 * cy - y}}입니다.'],
      hint_steps_template: ['대칭점의 x좌표와 y좌표를 각각 구해요.', '마지막에 두 좌표를 더해요.'],
      visual_template: { type: 'symmetry', mode: 'point-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', centerX: '{{cx}}', centerY: '{{cy}}' },
    }),
    template(set, 'symmetry-001', 10, 'two-reflections', 3, 'number', {
      param_schema: { x: range(1, 3), y: range(1, 4), axis: range(4, 5), cx: range(4, 5) },
      prompt_template: '점 P({{x}}, {{y}})를 먼저 직선 x={{axis}}에 선대칭 이동했습니다. 이동한 점의 x좌표에서 원래 x좌표를 뺀 값은?',
      solver_rule: '2 * axis - 2 * x',
      solution_steps_template: ['선대칭 이동한 점의 x좌표는 {{2 * axis - x}}입니다.', '{{2 * axis - x}} - {{x}} = {{2 * axis - 2 * x}}입니다.'],
      hint_steps_template: ['먼저 대칭점의 x좌표를 구해요.', '구한 좌표에서 원래 x좌표를 빼요.'],
      visual_template: { type: 'symmetry', mode: 'line-coordinate', variant: 1, x: '{{x}}', y: '{{y}}', axis: '{{axis}}' },
    }),
  ])
}

function cuboidTemplates(set) {
  const s = set.shift
  const visual = { type: 'cuboid', width: '{{w}}', height: '{{h}}', depth: '{{d}}', unit: 'cm' }
  return [
    template(set, 'cuboid-001', 1, 'face-count', 1, 'number', {
      param_schema: { w: range(5, 8, s), h: range(3, 6, s), d: range(2, 5, s) },
      prompt_template: '직육면체의 면은 모두 몇 개인가요?', solver_rule: '6',
      solution_steps_template: ['서로 마주 보는 면이 3쌍입니다.', '3쌍은 모두 6개입니다.'],
      hint_steps_template: ['앞뒤, 위아래, 양옆을 세어 봐요.', '마주 보는 면을 한 쌍씩 세어요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 2, 'edge-count', 1, 'number', {
      param_schema: { w: range(5, 8, s), h: range(3, 6, s), d: range(2, 5, s) },
      prompt_template: '직육면체의 모서리는 모두 몇 개인가요?', solver_rule: '12',
      solution_steps_template: ['윗면과 아랫면에 모서리가 각각 4개씩 있습니다.', '두 면을 잇는 모서리 4개를 더하면 12개입니다.'],
      hint_steps_template: ['보이는 모서리와 숨은 모서리를 함께 세어요.', '4 + 4 + 4로 묶어 볼 수 있어요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 3, 'vertex-count', 1, 'number', {
      param_schema: { w: range(5, 8, s), h: range(3, 6, s), d: range(2, 5, s) },
      prompt_template: '직육면체의 꼭짓점은 모두 몇 개인가요?', solver_rule: '8',
      solution_steps_template: ['윗면과 아랫면에 꼭짓점이 각각 4개씩 있습니다.', '4 + 4 = 8개입니다.'],
      hint_steps_template: ['위쪽 네 모서리 끝과 아래쪽 네 모서리 끝을 세어요.', '숨은 꼭짓점도 빠뜨리지 않아요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 4, 'edges-at-vertex', 1, 'number', {
      param_schema: { w: range(5, 8, s), h: range(3, 6, s), d: range(2, 5, s) },
      prompt_template: '직육면체의 한 꼭짓점에서 만나는 모서리는 몇 개인가요?', solver_rule: '3',
      solution_steps_template: ['한 꼭짓점에서는 가로, 세로, 높이 방향의 모서리가 만납니다.', '따라서 3개입니다.'],
      hint_steps_template: ['한 꼭짓점에서 뻗어 나가는 선을 찾아요.', '서로 다른 세 방향을 확인해요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 5, 'total-edge-length', 2, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s), d: range(2, 6, s) },
      prompt_template: '가로 {{w}}cm, 세로 {{d}}cm, 높이 {{h}}cm인 직육면체의 모든 모서리 길이의 합은 몇 cm인가요?',
      solver_rule: '4 * (w + h + d)',
      solution_steps_template: ['가로, 세로, 높이 길이의 모서리는 각각 4개씩입니다.', '({{w}} + {{h}} + {{d}}) × 4 = {{4 * (w + h + d)}}cm입니다.'],
      hint_steps_template: ['같은 길이의 모서리를 4개씩 묶어요.', '가로 + 세로 + 높이를 먼저 계산해요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 6, 'missing-width-from-edges', 2, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s), d: range(2, 6, s) },
      prompt_template: '모든 모서리 길이의 합이 {{4 * (w + h + d)}}cm이고 세로가 {{d}}cm, 높이가 {{h}}cm인 직육면체의 가로는 몇 cm인가요?',
      solver_rule: 'w',
      solution_steps_template: ['전체 모서리 길이를 4로 나누면 가로 + 세로 + 높이인 {{w + h + d}}cm입니다.', '{{w + h + d}} - {{d}} - {{h}} = {{w}}cm입니다.'],
      hint_steps_template: ['전체 길이를 먼저 4로 나눠요.', '세로와 높이를 차례로 빼요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 7, 'front-face-area', 2, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s), d: range(2, 6, s) },
      prompt_template: '그림에서 가로 {{w}}cm, 높이 {{h}}cm인 앞면의 넓이는 몇 cm²인가요?', solver_rule: 'w * h',
      solution_steps_template: ['앞면은 가로 {{w}}cm, 세로 {{h}}cm인 직사각형입니다.', '{{w}} × {{h}} = {{w * h}}cm²입니다.'],
      hint_steps_template: ['앞면만 떼어 평면으로 생각해요.', '직사각형 넓이를 구해요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 8, 'front-face-perimeter', 2, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s), d: range(2, 6, s) },
      prompt_template: '그림에서 앞면의 둘레는 몇 cm인가요?', solver_rule: '2 * (w + h)',
      solution_steps_template: ['앞면의 가로는 {{w}}cm, 세로는 {{h}}cm입니다.', '({{w}} + {{h}}) × 2 = {{2 * (w + h)}}cm입니다.'],
      hint_steps_template: ['앞면은 직사각형이에요.', '가로와 높이를 이용해 둘레를 구해요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 9, 'missing-depth-from-edges', 3, 'number', {
      param_schema: { w: range(6, 10, s), h: range(4, 8, s), d: range(3, 7, s) },
      prompt_template: '모든 모서리 길이의 합이 {{4 * (w + h + d)}}cm이고 가로가 {{w}}cm, 높이가 {{h}}cm인 직육면체의 세로는 몇 cm인가요?',
      solver_rule: 'd',
      solution_steps_template: ['전체를 4로 나누면 {{w + h + d}}cm입니다.', '{{w + h + d}} - {{w}} - {{h}} = {{d}}cm입니다.'],
      hint_steps_template: ['같은 길이의 모서리가 각각 4개씩 있어요.', '가로 + 세로 + 높이를 역산해요.'], visual_template: visual,
    }),
    template(set, 'cuboid-001', 10, 'three-face-area-sum', 3, 'number', {
      param_schema: { w: range(5, 9, s), h: range(3, 7, s), d: range(2, 6, s) },
      prompt_template: '서로 다른 크기의 세 면을 한 장씩 골랐습니다. 세 면의 넓이 합은 몇 cm²인가요?',
      solver_rule: 'w * h + w * d + h * d',
      solution_steps_template: ['세 면의 넓이는 각각 {{w * h}}cm², {{w * d}}cm², {{h * d}}cm²입니다.', '합은 {{w * h + w * d + h * d}}cm²입니다.'],
      hint_steps_template: ['가로×높이, 가로×세로, 높이×세로를 각각 구해요.', '서로 다른 세 넓이를 더해요.'], visual_template: visual,
    }),
  ]
}

function cuboidNetTemplates(set) {
  const optionChoices = [0, 1, 2, 3].map(offset => `{{geometryOption(2, variant, ${offset})}}`)
  return [
    template(set, 'cuboidnet-001', 1, 'net-face-count', 1, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: '직육면체 전개도는 직사각형 몇 개로 이루어져 있나요?', solver_rule: '6',
      solution_steps_template: ['직육면체의 면은 6개입니다.', '전개도에도 면 6개가 빠짐없이 나타납니다.'],
      hint_steps_template: ['전개도의 칸을 하나씩 세어요.', '겹치거나 빠진 칸이 없는지 확인해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}' },
    }),
    template(set, 'cuboidnet-001', 2, 'opposite-face-one', 1, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: '전개도를 접었을 때 1번 면과 마주 보는 면은 몇 번인가요?', solver_rule: 'cuboidOppositeFace(1)',
      solution_steps_template: ['1번 면 주변의 네 면을 먼저 접어 올립니다.', '마지막에 덮이는 6번 면이 1번 면과 마주 봅니다.'],
      hint_steps_template: ['1번 면과 변을 공유하는 면은 마주 보는 면이 아니에요.', '가장 멀리 이어진 면을 접어 봐요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: 1 },
    }),
    template(set, 'cuboidnet-001', 3, 'opposite-face-two', 1, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: '전개도를 접었을 때 2번 면과 마주 보는 면은 몇 번인가요?', solver_rule: 'cuboidOppositeFace(2)',
      solution_steps_template: ['2번 면과 3번 면은 중심 면의 양쪽에 있습니다.', '접으면 서로 마주 보므로 정답은 3번입니다.'],
      hint_steps_template: ['중심 면의 왼쪽과 오른쪽 면을 찾아요.', '두 면을 접어 올린 모습을 생각해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: 2 },
    }),
    template(set, 'cuboidnet-001', 4, 'valid-net-choice', 1, 'choice', {
      param_schema: { variant: range(1, 4) }, prompt_template: '직육면체로 접을 수 있는 전개도를 고르세요.', solver_rule: 'geometryOption(2, variant, 0)', choices_template: optionChoices,
      solution_steps_template: ['각 전개도를 접을 때 면이 겹치는지 확인합니다.', '{{geometryOption(2, variant, 0)}} 전개도는 여섯 면이 겹치지 않고 직육면체가 됩니다.'],
      hint_steps_template: ['한 면을 바닥으로 두고 주변 면을 접어 봐요.', '같은 자리를 차지하는 면이 생기면 안 돼요.'], visual_template: { type: 'cuboid-net', mode: 'options', variant: '{{variant}}' },
    }),
    template(set, 'cuboidnet-001', 5, 'opposite-face-input', 2, 'number', {
      param_schema: { variant: range(1, 4), face: range(1, 6) }, prompt_template: '전개도를 접었을 때 {{face}}번 면과 마주 보는 면은 몇 번인가요?', solver_rule: 'cuboidOppositeFace(face)',
      solution_steps_template: ['전개도에서 {{face}}번 면을 기준으로 접습니다.', '마주 보는 면은 {{cuboidOppositeFace(face)}}번입니다.'],
      hint_steps_template: ['변을 직접 공유하는 면은 이웃한 면이에요.', '접었을 때 반대쪽에 놓이는 면을 찾아요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: '{{face}}' },
    }),
    template(set, 'cuboidnet-001', 6, 'opposite-pair-count', 2, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: '직육면체에서 서로 마주 보는 면의 쌍은 모두 몇 쌍인가요?', solver_rule: '3',
      solution_steps_template: ['앞뒤, 좌우, 위아래 면이 각각 한 쌍입니다.', '따라서 모두 3쌍입니다.'],
      hint_steps_template: ['면 6개를 두 개씩 짝지어요.', '서로 평행하면서 만나지 않는 면을 찾아요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}' },
    }),
    template(set, 'cuboidnet-001', 7, 'top-bottom-pair', 2, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: '전개도에서 4번 면과 마주 보는 면의 번호는?', solver_rule: 'cuboidOppositeFace(4)',
      solution_steps_template: ['4번과 5번 면은 중심 면의 위와 아래에 있습니다.', '접으면 서로 마주 보므로 5번입니다.'],
      hint_steps_template: ['중심 면의 위쪽과 아래쪽을 살펴봐요.', '접어 올렸을 때의 위치를 생각해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: 4 },
    }),
    template(set, 'cuboidnet-001', 8, 'net-square-perimeter', 2, 'number', {
      param_schema: { variant: range(1, 4), side: range(2, 6, set.shift) }, prompt_template: '전개도의 각 면이 한 변 {{side}}cm인 정사각형입니다. 한 면의 둘레는 몇 cm인가요?', solver_rule: '4 * side',
      solution_steps_template: ['한 면은 네 변의 길이가 같은 정사각형입니다.', '{{side}} × 4 = {{4 * side}}cm입니다.'],
      hint_steps_template: ['한 면만 떼어 생각해요.', '한 변의 길이를 4번 더해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}' },
    }),
    template(set, 'cuboidnet-001', 9, 'opposite-label-sum', 3, 'number', {
      param_schema: { variant: range(1, 4), face: range(1, 6) }, prompt_template: '{{face}}번 면과 그 면의 맞은편 면에 적힌 두 수의 합은?', solver_rule: 'face + cuboidOppositeFace(face)',
      solution_steps_template: ['{{face}}번 면의 맞은편은 {{cuboidOppositeFace(face)}}번입니다.', '{{face}} + {{cuboidOppositeFace(face)}} = {{face + cuboidOppositeFace(face)}}입니다.'],
      hint_steps_template: ['먼저 마주 보는 면의 번호를 찾아요.', '두 면의 번호를 더해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}', focusFace: '{{face}}' },
    }),
    template(set, 'cuboidnet-001', 10, 'all-opposite-pair-sums', 3, 'number', {
      param_schema: { variant: range(1, 4) }, prompt_template: '전개도의 세 맞은편 면 쌍에서 각 쌍의 두 번호를 모두 더한 값은?', solver_rule: '1 + 6 + 2 + 3 + 4 + 5',
      solution_steps_template: ['맞은편 면 쌍은 (1,6), (2,3), (4,5)입니다.', '모든 번호를 더하면 1 + 6 + 2 + 3 + 4 + 5 = 21입니다.'],
      hint_steps_template: ['마주 보는 면을 세 쌍으로 묶어요.', '1번부터 6번까지 한 번씩 더해요.'], visual_template: { type: 'cuboid-net', mode: 'single', variant: '{{variant}}' },
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

fs.mkdirSync(OUT_DIR, { recursive: true })
for (const [filename, templates] of Object.entries(banks)) {
  fs.writeFileSync(path.join(OUT_DIR, filename), `${JSON.stringify(templates, null, 2)}\n`)
  console.log(`${filename}: ${templates.length} templates`)
}
