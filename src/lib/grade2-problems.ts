import type { Grade2AnswerType } from './grade2-answer-normalizers'

export type Grade2Semester = '2-1' | '2-2'

export type Grade2DifficultyStep = 'easy' | 'medium' | 'applied'

export type Grade2Skill =
  | 'place-value'
  | 'number-comparison'
  | 'addition-subtraction'
  | 'multiplication-meaning'
  | 'multiplication-facts'
  | 'solid-shapes'
  | 'plane-shapes'
  | 'length'
  | 'time'
  | 'classification'
  | 'table-graph'
  | 'pattern'

export type Grade2VisualModel =
  | 'place-value-blocks'
  | 'expanded-number-cards'
  | 'vertical-operation'
  | 'box-equation'
  | 'array-groups'
  | 'multiplication-table'
  | 'solid-shape-cards'
  | 'stack-cubes'
  | 'ruler-line'
  | 'length-bars'
  | 'clock-face'
  | 'calendar-strip'
  | 'classification-table'
  | 'mark-graph'
  | 'pattern-strip'

export type Grade2RewardId =
  | 'numberGem'
  | 'shapeCompass'
  | 'operationBadge'
  | 'measureTape'
  | 'multiplyMedal'
  | 'clockStar'
  | 'graphBadge'
  | 'patternKey'

export type Grade2VisualConfig = Record<string, string | number | boolean>

export interface Grade2AnswerConfig {
  kind: Grade2AnswerType
  unit?: 'cm' | 'm-cm' | 'minutes'
  timeMode?: 'time-of-day' | 'duration'
  inputLabel?: string
}

export interface Grade2Unit {
  id: string
  semester: Grade2Semester
  order: number
  title: string
  subtitle: string
  curriculumCodes: string[]
  rewardId: Grade2RewardId
}

export interface Grade2MissionTemplate {
  id: string
  unitId: string
  semester: Grade2Semester
  stageOrder: number
  unitMissionOrder: number
  skill: Grade2Skill
  difficultyStep: Grade2DifficultyStep
  curriculumCode: string
  learnerGoal: string
  parentSummaryTag: string
  promptTemplate: string
  answerType: Grade2AnswerType
  answerConfig: Grade2AnswerConfig
  paramSchema: Record<string, { min: number; max: number }>
  solverRule: string
  choicesTemplate?: string[]
  visualModel: Grade2VisualModel
  visualConfig: Grade2VisualConfig
  hintStepsTemplate: string[]
  solutionStepsTemplate: string[]
  rewardId: Grade2RewardId
}

export interface Grade2Mission {
  id: string
  unitId: string
  semester: Grade2Semester
  stageOrder: number
  unitMissionOrder: number
  skill: Grade2Skill
  difficultyStep: Grade2DifficultyStep
  curriculumCode: string
  learnerGoal: string
  parentSummaryTag: string
  prompt: string
  answerType: Grade2AnswerType
  answerConfig: Grade2AnswerConfig
  params: Record<string, number>
  choices?: string[]
  correctAnswer: string
  correctChoiceIndex?: number
  visualModel: Grade2VisualModel
  visualConfig: Grade2VisualConfig
  hintSteps: string[]
  solutionSteps: string[]
  rewardId: Grade2RewardId
}

export const grade2Units: Grade2Unit[] = [
  {
    id: 'g2-1-place-value',
    semester: '2-1',
    order: 1,
    title: '세 자리 수',
    subtitle: '백, 십, 일을 나누어 보아요',
    curriculumCodes: ['[2수01-02]', '[2수01-03]'],
    rewardId: 'numberGem',
  },
  {
    id: 'g2-1-shapes',
    semester: '2-1',
    order: 2,
    title: '여러 가지 도형',
    subtitle: '입체도형과 평면도형을 찾아요',
    curriculumCodes: ['[2수03-01]', '[2수03-02]', '[2수03-03]', '[2수03-04]', '[2수03-05]'],
    rewardId: 'shapeCompass',
  },
  {
    id: 'g2-1-add-sub',
    semester: '2-1',
    order: 3,
    title: '덧셈과 뺄셈',
    subtitle: '세로셈과 빈칸 값을 풀어요',
    curriculumCodes: ['[2수01-05]', '[2수01-06]', '[2수01-07]', '[2수01-08]', '[2수01-09]'],
    rewardId: 'operationBadge',
  },
  {
    id: 'g2-1-length',
    semester: '2-1',
    order: 4,
    title: '길이 재기',
    subtitle: 'cm와 m를 읽고 비교해요',
    curriculumCodes: ['[2수03-06]', '[2수03-10]', '[2수03-12]'],
    rewardId: 'measureTape',
  },
  {
    id: 'g2-1-classification',
    semester: '2-1',
    order: 5,
    title: '분류하기',
    subtitle: '기준에 따라 나누고 세어요',
    curriculumCodes: ['[2수04-01]'],
    rewardId: 'graphBadge',
  },
  {
    id: 'g2-1-multiplication',
    semester: '2-1',
    order: 6,
    title: '곱셈',
    subtitle: '같은 수 묶음을 곱셈으로 말해요',
    curriculumCodes: ['[2수01-10]'],
    rewardId: 'multiplyMedal',
  },
  {
    id: 'g2-2-place-value',
    semester: '2-2',
    order: 7,
    title: '네 자리 수',
    subtitle: '천 자리까지 수를 읽어요',
    curriculumCodes: ['[2수01-02]', '[2수01-03]'],
    rewardId: 'numberGem',
  },
  {
    id: 'g2-2-facts',
    semester: '2-2',
    order: 8,
    title: '곱셈구구',
    subtitle: '구구표와 배열을 연결해요',
    curriculumCodes: ['[2수01-11]'],
    rewardId: 'multiplyMedal',
  },
  {
    id: 'g2-2-length',
    semester: '2-2',
    order: 9,
    title: '길이 재기',
    subtitle: '길이를 더하고 빼요',
    curriculumCodes: ['[2수03-10]', '[2수03-11]', '[2수03-12]', '[2수03-13]'],
    rewardId: 'measureTape',
  },
  {
    id: 'g2-2-time',
    semester: '2-2',
    order: 10,
    title: '시각과 시간',
    subtitle: '시각과 걸린 시간을 구별해요',
    curriculumCodes: ['[2수03-07]', '[2수03-08]', '[2수03-09]'],
    rewardId: 'clockStar',
  },
  {
    id: 'g2-2-table-graph',
    semester: '2-2',
    order: 11,
    title: '표와 그래프',
    subtitle: '표식 그래프를 읽어요',
    curriculumCodes: ['[2수04-02]', '[2수04-03]'],
    rewardId: 'graphBadge',
  },
  {
    id: 'g2-2-pattern',
    semester: '2-2',
    order: 12,
    title: '규칙 찾기',
    subtitle: '반복과 증가 규칙을 찾아요',
    curriculumCodes: ['[2수02-01]', '[2수02-02]'],
    rewardId: 'patternKey',
  },
]

export const SAFE_GRADE2_MISSION_ID = 'g2-1-place-value-01'

function template(template: Grade2MissionTemplate): Grade2MissionTemplate {
  return template
}

const integerAnswerConfig: Grade2AnswerConfig = { kind: 'integer', inputLabel: '답을 숫자로 써요' }
const choiceAnswerConfig: Grade2AnswerConfig = { kind: 'choice' }
const labelAnswerConfig: Grade2AnswerConfig = { kind: 'label' }
const centimeterLengthAnswerConfig: Grade2AnswerConfig = { kind: 'length', unit: 'cm', inputLabel: '길이를 cm로 써요' }
const lengthAnswerConfig: Grade2AnswerConfig = { kind: 'length', unit: 'm-cm', inputLabel: '길이를 써요' }
const timeOfDayAnswerConfig: Grade2AnswerConfig = {
  kind: 'time-of-day',
  timeMode: 'time-of-day',
  inputLabel: '시각을 써요',
}
const durationAnswerConfig: Grade2AnswerConfig = {
  kind: 'duration',
  unit: 'minutes',
  timeMode: 'duration',
  inputLabel: '걸린 시간을 써요',
}

const grade2AlphaMissionTemplates: Grade2MissionTemplate[] = [
  template({
    id: 'g2-1-place-value-01',
    unitId: 'g2-1-place-value',
    semester: '2-1',
    stageOrder: 1,
    unitMissionOrder: 1,
    skill: 'place-value',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-02]',
    learnerGoal: '백, 십, 일을 읽어요',
    parentSummaryTag: 'three-digit-place-value',
    promptTemplate: '그림의 백, 십, 일 모형은 어떤 수일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '342',
    visualModel: 'place-value-blocks',
    visualConfig: { number: 342, hundreds: 3, tens: 4, ones: 2 },
    hintStepsTemplate: ['백 모형은 100씩 세어요.', '300, 40, 2를 합쳐요.'],
    solutionStepsTemplate: ['백 3개는 300, 십 4개는 40, 일 2개는 2예요.', '300 + 40 + 2 = 342예요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-1-place-value-02',
    unitId: 'g2-1-place-value',
    semester: '2-1',
    stageOrder: 2,
    unitMissionOrder: 2,
    skill: 'number-comparison',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-03]',
    learnerGoal: '세 자리 수를 비교해요',
    parentSummaryTag: 'three-digit-comparison',
    promptTemplate: '428과 482 중 더 큰 수는 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '482',
    choicesTemplate: ['482', '428', '408'],
    visualModel: 'expanded-number-cards',
    visualConfig: { cards: '428,482,408', target: '482', mode: 'compare' },
    hintStepsTemplate: ['백의 자리부터 비교해요.', '백의 자리가 같으면 십의 자리를 비교해요.'],
    solutionStepsTemplate: ['두 수 모두 백의 자리는 4예요.', '십의 자리 8이 2보다 크므로 482가 더 커요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-1-place-value-03',
    unitId: 'g2-1-place-value',
    semester: '2-1',
    stageOrder: 3,
    unitMissionOrder: 3,
    skill: 'place-value',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-02]',
    learnerGoal: '전개식을 수로 바꾸어요',
    parentSummaryTag: 'three-digit-expanded-form',
    promptTemplate: '500 + 60 + 7을 수로 쓰면 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '567',
    visualModel: 'expanded-number-cards',
    visualConfig: { parts: '500,60,7', target: '567', mode: 'expanded' },
    hintStepsTemplate: ['백의 자리, 십의 자리, 일의 자리를 차례로 보아요.', '500, 60, 7을 합쳐요.'],
    solutionStepsTemplate: ['500은 백의 자리 5, 60은 십의 자리 6, 7은 일의 자리 7이에요.', '그래서 567이에요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-1-shapes-01',
    unitId: 'g2-1-shapes',
    semester: '2-1',
    stageOrder: 4,
    unitMissionOrder: 1,
    skill: 'solid-shapes',
    difficultyStep: 'easy',
    curriculumCode: '[2수03-01]',
    learnerGoal: '입체도형을 골라요',
    parentSummaryTag: 'solid-shape-recognition',
    promptTemplate: '공 모양과 가장 비슷한 입체도형은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '구',
    choicesTemplate: ['구', '원기둥', '직육면체'],
    visualModel: 'solid-shape-cards',
    visualConfig: { shapes: '구,원기둥,직육면체', target: '구' },
    hintStepsTemplate: ['어느 쪽으로 보아도 둥근 모양을 찾아요.', '공처럼 모서리가 없는 입체도형을 찾아요.'],
    solutionStepsTemplate: ['공처럼 둥근 입체도형은 구예요.'],
    rewardId: 'shapeCompass',
  }),
  template({
    id: 'g2-1-shapes-02',
    unitId: 'g2-1-shapes',
    semester: '2-1',
    stageOrder: 5,
    unitMissionOrder: 2,
    skill: 'plane-shapes',
    difficultyStep: 'medium',
    curriculumCode: '[2수03-03]',
    learnerGoal: '평면도형의 성질을 찾아요',
    parentSummaryTag: 'plane-shape-properties',
    promptTemplate: '변이 3개인 모양은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '삼각형',
    choicesTemplate: ['삼각형', '사각형', '원'],
    visualModel: 'solid-shape-cards',
    visualConfig: { shapes: '삼각형,사각형,원', target: '삼각형', flat: true },
    hintStepsTemplate: ['변을 하나씩 세어 보아요.', '세 변으로 둘러싸인 모양을 찾아요.'],
    solutionStepsTemplate: ['삼각형은 변이 3개예요.', '그래서 정답은 삼각형이에요.'],
    rewardId: 'shapeCompass',
  }),
  template({
    id: 'g2-1-shapes-03',
    unitId: 'g2-1-shapes',
    semester: '2-1',
    stageOrder: 6,
    unitMissionOrder: 3,
    skill: 'solid-shapes',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-05]',
    learnerGoal: '쌓기나무 위치를 말해요',
    parentSummaryTag: 'cube-position',
    promptTemplate: '위층에 있는 쌓기나무는 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '2',
    visualModel: 'stack-cubes',
    visualConfig: { bottom: 4, top: 2, targetLayer: 'top' },
    hintStepsTemplate: ['아래층은 빼고 위층만 보아요.', '위에 올려진 정육면체만 세어요.'],
    solutionStepsTemplate: ['위에 올려진 쌓기나무는 2개예요.'],
    rewardId: 'shapeCompass',
  }),
  template({
    id: 'g2-1-add-sub-01',
    unitId: 'g2-1-add-sub',
    semester: '2-1',
    stageOrder: 7,
    unitMissionOrder: 1,
    skill: 'addition-subtraction',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-05]',
    learnerGoal: '받아올림 덧셈을 해요',
    parentSummaryTag: 'vertical-addition',
    promptTemplate: '38 + 27은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '65',
    visualModel: 'vertical-operation',
    visualConfig: { top: 38, bottom: 27, operator: '+', result: 65, carry: 1 },
    hintStepsTemplate: ['일의 자리부터 더해요.', '8 + 7 = 15라서 십의 자리로 1을 올려요.'],
    solutionStepsTemplate: ['일의 자리 8 + 7 = 15예요.', '십의 자리 3 + 2 + 1 = 6이므로 65예요.'],
    rewardId: 'operationBadge',
  }),
  template({
    id: 'g2-1-add-sub-02',
    unitId: 'g2-1-add-sub',
    semester: '2-1',
    stageOrder: 8,
    unitMissionOrder: 2,
    skill: 'addition-subtraction',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-07]',
    learnerGoal: '받아내림 뺄셈을 해요',
    parentSummaryTag: 'vertical-subtraction',
    promptTemplate: '52 - 28은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '24',
    visualModel: 'vertical-operation',
    visualConfig: { top: 52, bottom: 28, operator: '-', result: 24, borrow: 1 },
    hintStepsTemplate: ['일의 자리 2에서 8을 뺄 수 없어요.', '십의 자리에서 1을 빌려 12 - 8을 해요.'],
    solutionStepsTemplate: ['12 - 8 = 4예요.', '십의 자리는 4 - 2 = 2이므로 24예요.'],
    rewardId: 'operationBadge',
  }),
  template({
    id: 'g2-1-add-sub-03',
    unitId: 'g2-1-add-sub',
    semester: '2-1',
    stageOrder: 9,
    unitMissionOrder: 3,
    skill: 'addition-subtraction',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-09]',
    learnerGoal: '빈칸 값을 찾아요',
    parentSummaryTag: 'box-equation',
    promptTemplate: '□ + 19 = 47일 때 □ 안에 들어갈 수는 무엇일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '28',
    visualModel: 'box-equation',
    visualConfig: { left: '?', operator: '+', right: 19, result: 47, missing: 'left' },
    hintStepsTemplate: ['더해서 47이 되는 수를 찾아요.', '47에서 19를 빼면 빈칸을 알 수 있어요.'],
    solutionStepsTemplate: ['47 - 19 = 28이에요.', '28 + 19 = 47이므로 빈칸은 28이에요.'],
    rewardId: 'operationBadge',
  }),
  template({
    id: 'g2-1-length-01',
    unitId: 'g2-1-length',
    semester: '2-1',
    stageOrder: 10,
    unitMissionOrder: 1,
    skill: 'length',
    difficultyStep: 'easy',
    curriculumCode: '[2수03-06]',
    learnerGoal: 'cm 눈금을 읽어요',
    parentSummaryTag: 'ruler-reading',
    promptTemplate: '연필의 길이는 몇 cm일까요?',
    answerType: 'length',
    answerConfig: centimeterLengthAnswerConfig,
    paramSchema: {},
    solverRule: '8cm',
    visualModel: 'ruler-line',
    visualConfig: { startCm: 0, endCm: 8, maxCm: 12, object: 'pencil' },
    hintStepsTemplate: ['0에서 시작해서 끝 눈금을 보아요.', '끝이 닿은 숫자가 길이예요.'],
    solutionStepsTemplate: ['연필은 0에서 8까지 이어져 있어요.', '따라서 8cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-1-length-02',
    unitId: 'g2-1-length',
    semester: '2-1',
    stageOrder: 11,
    unitMissionOrder: 2,
    skill: 'length',
    difficultyStep: 'medium',
    curriculumCode: '[2수03-10]',
    learnerGoal: 'm와 cm를 바꾸어 보아요',
    parentSummaryTag: 'length-conversion',
    promptTemplate: '1m 20cm는 모두 몇 cm일까요?',
    answerType: 'length',
    answerConfig: centimeterLengthAnswerConfig,
    paramSchema: {},
    solverRule: '120cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '1m', leftCm: 100, rightLabel: '20cm', rightCm: 20, totalCm: 120 },
    hintStepsTemplate: ['1m는 100cm예요.', '100cm와 20cm를 합쳐요.'],
    solutionStepsTemplate: ['1m = 100cm예요.', '100cm + 20cm = 120cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-1-length-03',
    unitId: 'g2-1-length',
    semester: '2-1',
    stageOrder: 12,
    unitMissionOrder: 3,
    skill: 'length',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-12]',
    learnerGoal: '길이를 비교해요',
    parentSummaryTag: 'length-comparison',
    promptTemplate: '90cm와 1m 중 더 긴 길이는 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '1m',
    choicesTemplate: ['1m', '90cm', '같아요'],
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '90cm', leftCm: 90, rightLabel: '1m', rightCm: 100, target: '1m' },
    hintStepsTemplate: ['1m를 cm로 바꾸어 비교해요.', '1m는 100cm예요.'],
    solutionStepsTemplate: ['1m = 100cm예요.', '100cm가 90cm보다 길어요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-1-classification-01',
    unitId: 'g2-1-classification',
    semester: '2-1',
    stageOrder: 13,
    unitMissionOrder: 1,
    skill: 'classification',
    difficultyStep: 'easy',
    curriculumCode: '[2수04-01]',
    learnerGoal: '기준에 맞게 분류해요',
    parentSummaryTag: 'classification-rule',
    promptTemplate: '색깔이 빨간 물건은 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '4',
    visualModel: 'classification-table',
    visualConfig: { categories: '빨강,파랑,노랑', counts: '4,3,2', target: '빨강', countDisplay: 'marks' },
    hintStepsTemplate: ['빨강 칸에 있는 개수만 보아요.', '다른 색은 세지 않아요.'],
    solutionStepsTemplate: ['빨강 물건은 4개예요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-1-classification-02',
    unitId: 'g2-1-classification',
    semester: '2-1',
    stageOrder: 14,
    unitMissionOrder: 2,
    skill: 'classification',
    difficultyStep: 'medium',
    curriculumCode: '[2수04-01]',
    learnerGoal: '범주별 개수를 읽어요',
    parentSummaryTag: 'classification-counts',
    promptTemplate: '가장 많은 종류는 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '동물',
    choicesTemplate: ['동물', '탈것', '과일'],
    visualModel: 'classification-table',
    visualConfig: { categories: '동물,탈것,과일', counts: '5,2,4', target: '동물', countDisplay: 'marks' },
    hintStepsTemplate: ['각 칸의 수를 비교해요.', '가장 큰 수가 있는 종류를 찾아요.'],
    solutionStepsTemplate: ['동물 5개, 탈것 2개, 과일 4개예요.', '가장 많은 것은 동물이에요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-1-classification-03',
    unitId: 'g2-1-classification',
    semester: '2-1',
    stageOrder: 15,
    unitMissionOrder: 3,
    skill: 'classification',
    difficultyStep: 'applied',
    curriculumCode: '[2수04-01]',
    learnerGoal: '두 범주의 차이를 구해요',
    parentSummaryTag: 'classification-difference',
    promptTemplate: '사과는 배보다 몇 개 더 많을까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '2',
    visualModel: 'classification-table',
    visualConfig: { categories: '사과,배,귤', counts: '6,4,3', target: '사과-배', countDisplay: 'marks' },
    hintStepsTemplate: ['사과와 배의 개수를 먼저 읽어요.', '더 많은 개수에서 적은 개수를 빼요.'],
    solutionStepsTemplate: ['사과는 6개, 배는 4개예요.', '6 - 4 = 2이므로 2개 더 많아요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-1-multiplication-01',
    unitId: 'g2-1-multiplication',
    semester: '2-1',
    stageOrder: 16,
    unitMissionOrder: 1,
    skill: 'multiplication-meaning',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-10]',
    learnerGoal: '같은 수 묶음을 세어요',
    parentSummaryTag: 'equal-groups',
    promptTemplate: '3개씩 4묶음이면 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '12',
    visualModel: 'array-groups',
    visualConfig: { groups: 4, each: 3, rows: 4, cols: 3 },
    hintStepsTemplate: ['한 묶음에 3개씩 있어요.', '3을 4번 더해요.'],
    solutionStepsTemplate: ['3 + 3 + 3 + 3 = 12예요.', '그래서 모두 12개예요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-1-multiplication-02',
    unitId: 'g2-1-multiplication',
    semester: '2-1',
    stageOrder: 17,
    unitMissionOrder: 2,
    skill: 'multiplication-meaning',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-10]',
    learnerGoal: '배열을 곱셈으로 보아요',
    parentSummaryTag: 'array-multiplication',
    promptTemplate: '2줄에 5개씩 놓인 별은 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '10',
    visualModel: 'array-groups',
    visualConfig: { rows: 2, cols: 5, groups: 2, each: 5 },
    hintStepsTemplate: ['한 줄에 5개씩 있어요.', '5가 2줄이에요.'],
    solutionStepsTemplate: ['5 + 5 = 10이에요.', '2 x 5 = 10으로 볼 수 있어요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-1-multiplication-03',
    unitId: 'g2-1-multiplication',
    semester: '2-1',
    stageOrder: 18,
    unitMissionOrder: 3,
    skill: 'multiplication-meaning',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-10]',
    learnerGoal: '반복 덧셈을 곱셈식으로 바꾸어요',
    parentSummaryTag: 'repeated-addition',
    promptTemplate: '4 + 4 + 4를 곱셈식으로 나타낸 것은 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '3 x 4',
    choicesTemplate: ['3 x 4', '4 x 4', '3 + 4'],
    visualModel: 'array-groups',
    visualConfig: { groups: 3, each: 4, rows: 3, cols: 4 },
    hintStepsTemplate: ['4가 몇 번 나오는지 세어요.', '같은 수가 반복된 횟수가 앞의 수가 돼요.'],
    solutionStepsTemplate: ['4가 3번 반복돼요.', '그래서 3 x 4예요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-2-place-value-01',
    unitId: 'g2-2-place-value',
    semester: '2-2',
    stageOrder: 19,
    unitMissionOrder: 1,
    skill: 'place-value',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-02]',
    learnerGoal: '네 자리 수를 읽어요',
    parentSummaryTag: 'four-digit-place-value',
    promptTemplate: '그림의 천, 백, 십, 일 모형은 어떤 수일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '2531',
    visualModel: 'place-value-blocks',
    visualConfig: { number: 2531, thousands: 2, hundreds: 5, tens: 3, ones: 1 },
    hintStepsTemplate: ['천, 백, 십, 일을 차례로 읽어요.', '모형의 개수를 자리마다 숫자로 놓아요.'],
    solutionStepsTemplate: ['천 2개, 백 5개, 십 3개, 일 1개예요.', '그래서 2531이에요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-2-place-value-02',
    unitId: 'g2-2-place-value',
    semester: '2-2',
    stageOrder: 20,
    unitMissionOrder: 2,
    skill: 'number-comparison',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-03]',
    learnerGoal: '네 자리 수를 비교해요',
    parentSummaryTag: 'four-digit-comparison',
    promptTemplate: '3412와 3142 중 더 큰 수는 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '3412',
    choicesTemplate: ['3412', '3142', '3014'],
    visualModel: 'expanded-number-cards',
    visualConfig: { cards: '3412,3142,3014', target: '3412', mode: 'compare' },
    hintStepsTemplate: ['천의 자리부터 비교해요.', '천의 자리가 같으면 백의 자리를 비교해요.'],
    solutionStepsTemplate: ['두 수의 천의 자리는 3이에요.', '백의 자리 4가 1보다 크므로 3412가 더 커요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-2-place-value-03',
    unitId: 'g2-2-place-value',
    semester: '2-2',
    stageOrder: 21,
    unitMissionOrder: 3,
    skill: 'place-value',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-02]',
    learnerGoal: '네 자리 전개식을 만들어요',
    parentSummaryTag: 'four-digit-expanded-form',
    promptTemplate: '6000 + 400 + 20 + 8은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '6428',
    visualModel: 'expanded-number-cards',
    visualConfig: { parts: '6000,400,20,8', target: '6428', mode: 'expanded' },
    hintStepsTemplate: ['각 자리의 숫자를 차례로 놓아요.', '천, 백, 십, 일의 값을 합쳐요.'],
    solutionStepsTemplate: ['6000, 400, 20, 8을 합치면 6428이에요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-2-facts-01',
    unitId: 'g2-2-facts',
    semester: '2-2',
    stageOrder: 22,
    unitMissionOrder: 1,
    skill: 'multiplication-facts',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-11]',
    learnerGoal: '구구를 계산해요',
    parentSummaryTag: 'multiplication-facts',
    promptTemplate: '6 x 4는 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '24',
    visualModel: 'multiplication-table',
    visualConfig: { dan: 6, factor: 4, product: 24 },
    hintStepsTemplate: ['6을 4번 더한다고 생각해요.', '6단에서 네 번째 값을 떠올려요.'],
    solutionStepsTemplate: ['6 + 6 + 6 + 6 = 24예요.', '6 x 4 = 24예요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-2-facts-02',
    unitId: 'g2-2-facts',
    semester: '2-2',
    stageOrder: 23,
    unitMissionOrder: 2,
    skill: 'multiplication-facts',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-11]',
    learnerGoal: '구구표 빈칸을 찾아요',
    parentSummaryTag: 'multiplication-table',
    promptTemplate: '7 x □ = 35일 때 □는 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '5',
    visualModel: 'multiplication-table',
    visualConfig: { dan: 7, factor: 5, product: 35, missing: 'factor' },
    hintStepsTemplate: ['7단에서 35가 되는 칸을 찾아요.', '7을 몇 번 더하면 35가 되는지 생각해요.'],
    solutionStepsTemplate: ['7 x 5 = 35예요.', '따라서 빈칸은 5예요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-2-facts-03',
    unitId: 'g2-2-facts',
    semester: '2-2',
    stageOrder: 24,
    unitMissionOrder: 3,
    skill: 'multiplication-facts',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-11]',
    learnerGoal: '배열과 곱셈식을 연결해요',
    parentSummaryTag: 'array-facts',
    promptTemplate: '4줄에 8개씩 있으면 알맞은 곱셈식은 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '4 x 8',
    choicesTemplate: ['4 x 8', '8 x 8', '4 + 8'],
    visualModel: 'array-groups',
    visualConfig: { rows: 4, cols: 8, groups: 4, each: 8 },
    hintStepsTemplate: ['줄 수와 한 줄의 개수를 차례로 보아요.', '4줄, 한 줄에 8개씩 있어요.'],
    solutionStepsTemplate: ['4줄이고 한 줄에 8개씩 있어요.', '그래서 4 x 8이에요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-2-length-01',
    unitId: 'g2-2-length',
    semester: '2-2',
    stageOrder: 25,
    unitMissionOrder: 1,
    skill: 'length',
    difficultyStep: 'easy',
    curriculumCode: '[2수03-11]',
    learnerGoal: 'm와 cm를 합쳐요',
    parentSummaryTag: 'length-addition',
    promptTemplate: '1m 30cm와 40cm를 합치면 얼마일까요?',
    answerType: 'length',
    answerConfig: lengthAnswerConfig,
    paramSchema: {},
    solverRule: '170cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '1m 30cm', leftCm: 130, rightLabel: '40cm', rightCm: 40, totalCm: 170 },
    hintStepsTemplate: ['1m 30cm를 cm로 바꾸어요.', '130cm와 40cm를 더해요.'],
    solutionStepsTemplate: ['1m 30cm = 130cm예요.', '130cm + 40cm = 170cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-2-length-02',
    unitId: 'g2-2-length',
    semester: '2-2',
    stageOrder: 26,
    unitMissionOrder: 2,
    skill: 'length',
    difficultyStep: 'medium',
    curriculumCode: '[2수03-13]',
    learnerGoal: '길이의 차를 구해요',
    parentSummaryTag: 'length-subtraction',
    promptTemplate: '2m에서 50cm를 빼면 얼마일까요?',
    answerType: 'length',
    answerConfig: lengthAnswerConfig,
    paramSchema: {},
    solverRule: '150cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '2m', leftCm: 200, rightLabel: '50cm', rightCm: 50, totalCm: 150, operation: 'subtract' },
    hintStepsTemplate: ['2m를 cm로 바꾸어요.', '200cm에서 50cm를 빼요.'],
    solutionStepsTemplate: ['2m = 200cm예요.', '200cm - 50cm = 150cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-2-length-03',
    unitId: 'g2-2-length',
    semester: '2-2',
    stageOrder: 27,
    unitMissionOrder: 3,
    skill: 'length',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-13]',
    learnerGoal: '동치 길이 답안을 써요',
    parentSummaryTag: 'equivalent-length',
    promptTemplate: '120cm와 같은 길이를 m와 cm로 나타내면 얼마일까요?',
    answerType: 'length',
    answerConfig: lengthAnswerConfig,
    paramSchema: {},
    solverRule: '120cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '120cm', leftCm: 120, rightLabel: '1m 20cm', rightCm: 120, totalCm: 120, hideRightLabelUntilReveal: true },
    hintStepsTemplate: ['100cm는 1m예요.', '120cm는 100cm와 20cm로 나눌 수 있어요.'],
    solutionStepsTemplate: ['120cm = 100cm + 20cm예요.', '100cm는 1m이므로 1m 20cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-2-time-01',
    unitId: 'g2-2-time',
    semester: '2-2',
    stageOrder: 28,
    unitMissionOrder: 1,
    skill: 'time',
    difficultyStep: 'easy',
    curriculumCode: '[2수03-07]',
    learnerGoal: '분 단위 시각을 읽어요',
    parentSummaryTag: 'clock-minute-reading',
    promptTemplate: '시계가 가리키는 시각은 몇 시 몇 분일까요?',
    answerType: 'time-of-day',
    answerConfig: timeOfDayAnswerConfig,
    paramSchema: {},
    solverRule: '3:25',
    visualModel: 'clock-face',
    visualConfig: { hour: 3, minute: 25 },
    hintStepsTemplate: ['짧은 바늘은 시, 긴 바늘은 분을 알려줘요.', '긴 바늘이 가리키는 작은 눈금을 세어요.'],
    solutionStepsTemplate: ['짧은 바늘은 3을 지나 있어요.', '긴 바늘은 25분을 가리키므로 3시 25분이에요.'],
    rewardId: 'clockStar',
  }),
  template({
    id: 'g2-2-time-02',
    unitId: 'g2-2-time',
    semester: '2-2',
    stageOrder: 29,
    unitMissionOrder: 2,
    skill: 'time',
    difficultyStep: 'medium',
    curriculumCode: '[2수03-08]',
    learnerGoal: '걸린 시간을 구해요',
    parentSummaryTag: 'elapsed-time',
    promptTemplate: '2시 10분부터 2시 45분까지 걸린 시간은 얼마일까요?',
    answerType: 'duration',
    answerConfig: durationAnswerConfig,
    paramSchema: {},
    solverRule: '35분',
    visualModel: 'clock-face',
    visualConfig: { hour: 2, minute: 10, endHour: 2, endMinute: 45 },
    hintStepsTemplate: ['시가 같으니 분끼리 비교해요.', '45분에서 10분을 빼요.'],
    solutionStepsTemplate: ['45 - 10 = 35예요.', '걸린 시간은 35분이에요.'],
    rewardId: 'clockStar',
  }),
  template({
    id: 'g2-2-time-03',
    unitId: 'g2-2-time',
    semester: '2-2',
    stageOrder: 30,
    unitMissionOrder: 3,
    skill: 'time',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-09]',
    learnerGoal: '일, 주, 월 관계를 알아요',
    parentSummaryTag: 'calendar-relationships',
    promptTemplate: '1주는 며칠일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '7',
    visualModel: 'calendar-strip',
    visualConfig: { days: '월,화,수,목,금,토,일', target: 7 },
    hintStepsTemplate: ['달력에서 한 줄을 보아요.', '월요일부터 일요일까지 하나씩 세어요.'],
    solutionStepsTemplate: ['월요일부터 일요일까지 모두 7일이에요.', '1주는 7일이에요.'],
    rewardId: 'clockStar',
  }),
  template({
    id: 'g2-2-table-graph-01',
    unitId: 'g2-2-table-graph',
    semester: '2-2',
    stageOrder: 31,
    unitMissionOrder: 1,
    skill: 'table-graph',
    difficultyStep: 'easy',
    curriculumCode: '[2수04-02]',
    learnerGoal: '표를 읽어요',
    parentSummaryTag: 'table-reading',
    promptTemplate: '표에서 딸기를 좋아하는 친구는 몇 명일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '6',
    visualModel: 'classification-table',
    visualConfig: { categories: '딸기,포도,수박', counts: '6,4,5', target: '딸기' },
    hintStepsTemplate: ['딸기 줄의 수를 보아요.', '딸기 옆에 적힌 숫자만 읽어요.'],
    solutionStepsTemplate: ['딸기 줄에는 6명이 있어요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-2-table-graph-02',
    unitId: 'g2-2-table-graph',
    semester: '2-2',
    stageOrder: 32,
    unitMissionOrder: 2,
    skill: 'table-graph',
    difficultyStep: 'medium',
    curriculumCode: '[2수04-03]',
    learnerGoal: '표식 그래프를 읽어요',
    parentSummaryTag: 'mark-graph-reading',
    promptTemplate: '표식 그래프에서 가장 적은 것은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '축구',
    choicesTemplate: ['축구', '야구', '피구'],
    visualModel: 'mark-graph',
    visualConfig: { categories: '축구,야구,피구', counts: '3,6,4', target: '축구' },
    hintStepsTemplate: ['표식이 가장 적은 줄을 찾아요.', '각 줄의 표식을 하나씩 세어 비교해요.'],
    solutionStepsTemplate: ['축구 3개, 야구 6개, 피구 4개예요.', '가장 적은 것은 축구예요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-2-table-graph-03',
    unitId: 'g2-2-table-graph',
    semester: '2-2',
    stageOrder: 33,
    unitMissionOrder: 3,
    skill: 'table-graph',
    difficultyStep: 'applied',
    curriculumCode: '[2수04-03]',
    learnerGoal: '그래프에서 차이를 구해요',
    parentSummaryTag: 'graph-difference',
    promptTemplate: '야구는 축구보다 몇 명 더 많을까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '3',
    visualModel: 'mark-graph',
    visualConfig: { categories: '축구,야구,피구', counts: '3,6,4', target: '야구-축구' },
    hintStepsTemplate: ['야구와 축구의 표식 수를 세어요.', '더 많은 수에서 적은 수를 빼요.'],
    solutionStepsTemplate: ['야구는 6명, 축구는 3명이에요.', '6 - 3 = 3이므로 3명 더 많아요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-2-pattern-01',
    unitId: 'g2-2-pattern',
    semester: '2-2',
    stageOrder: 34,
    unitMissionOrder: 1,
    skill: 'pattern',
    difficultyStep: 'easy',
    curriculumCode: '[2수02-01]',
    learnerGoal: '반복 규칙을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '빨강, 파랑, 빨강, 파랑 다음에는 무엇이 올까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '빨강',
    choicesTemplate: ['빨강', '파랑', '노랑'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '빨강,파랑,빨강,파랑,?' },
    hintStepsTemplate: ['빨강과 파랑이 번갈아 나와요.', '파랑 다음에는 다시 처음 색이 와요.'],
    solutionStepsTemplate: ['파랑 다음에는 다시 빨강이 와요.'],
    rewardId: 'patternKey',
  }),
  template({
    id: 'g2-2-pattern-02',
    unitId: 'g2-2-pattern',
    semester: '2-2',
    stageOrder: 35,
    unitMissionOrder: 2,
    skill: 'pattern',
    difficultyStep: 'medium',
    curriculumCode: '[2수02-02]',
    learnerGoal: '증가 규칙을 찾아요',
    parentSummaryTag: 'growing-patterns',
    promptTemplate: '2, 4, 6, 8 다음 수는 무엇일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '10',
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '2,4,6,8,?' },
    hintStepsTemplate: ['앞의 수에서 얼마씩 커지는지 보아요.', '모든 수가 2씩 커지고 있어요.'],
    solutionStepsTemplate: ['2씩 커지는 규칙이에요.', '8 다음은 10이에요.'],
    rewardId: 'patternKey',
  }),
  template({
    id: 'g2-2-pattern-03',
    unitId: 'g2-2-pattern',
    semester: '2-2',
    stageOrder: 36,
    unitMissionOrder: 3,
    skill: 'pattern',
    difficultyStep: 'applied',
    curriculumCode: '[2수02-02]',
    learnerGoal: '곱셈표 규칙을 찾아요',
    parentSummaryTag: 'multiplication-patterns',
    promptTemplate: '5단에서 5, 10, 15, 20 다음 수는 무엇일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '25',
    visualModel: 'multiplication-table',
    visualConfig: { dan: 5, factor: 5, product: 25, sequence: '5,10,15,20,?' },
    hintStepsTemplate: ['5단은 5씩 커져요.', '20 다음에 5를 한 번 더해요.'],
    solutionStepsTemplate: ['20에서 5를 더하면 25예요.', '그래서 다음 수는 25예요.'],
    rewardId: 'patternKey',
  }),
]

const grade2BetaMissionTemplates: Grade2MissionTemplate[] = [
  template({
    id: 'g2-1-place-value-04',
    unitId: 'g2-1-place-value',
    semester: '2-1',
    stageOrder: 37,
    unitMissionOrder: 4,
    skill: 'place-value',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-02]',
    learnerGoal: '자리 모형을 다시 읽어요',
    parentSummaryTag: 'three-digit-place-value',
    promptTemplate: '그림의 자리값 모형은 어떤 수일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '215',
    visualModel: 'place-value-blocks',
    visualConfig: { number: 215, hundreds: 2, tens: 1, ones: 5 },
    hintStepsTemplate: ['백, 십, 일 모형을 따로 보아요.', '200, 10, 5를 합쳐요.'],
    solutionStepsTemplate: ['백 2개, 십 1개, 일 5개예요.', '200 + 10 + 5 = 215예요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-1-place-value-05',
    unitId: 'g2-1-place-value',
    semester: '2-1',
    stageOrder: 38,
    unitMissionOrder: 5,
    skill: 'number-comparison',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-03]',
    learnerGoal: '세 자리 수 순서를 비교해요',
    parentSummaryTag: 'three-digit-comparison',
    promptTemplate: '619와 691 중 더 큰 수는 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '691',
    choicesTemplate: ['691', '619', '609'],
    visualModel: 'expanded-number-cards',
    visualConfig: { cards: '619,691,609', target: '691', mode: 'compare' },
    hintStepsTemplate: ['백의 자리는 모두 6이에요.', '십의 자리를 비교해요.'],
    solutionStepsTemplate: ['십의 자리 9가 1보다 커요.', '따라서 691이 더 커요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-1-place-value-06',
    unitId: 'g2-1-place-value',
    semester: '2-1',
    stageOrder: 39,
    unitMissionOrder: 6,
    skill: 'place-value',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-02]',
    learnerGoal: '전개식을 완성해요',
    parentSummaryTag: 'three-digit-expanded-form',
    promptTemplate: '700 + 30 + 4를 수로 쓰면 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '734',
    visualModel: 'expanded-number-cards',
    visualConfig: { parts: '700,30,4', target: '734', mode: 'expanded' },
    hintStepsTemplate: ['백의 자리 7, 십의 자리 3, 일의 자리 4를 보아요.', '세 자리 숫자로 차례로 써요.'],
    solutionStepsTemplate: ['700, 30, 4를 합치면 734예요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-1-shapes-04',
    unitId: 'g2-1-shapes',
    semester: '2-1',
    stageOrder: 40,
    unitMissionOrder: 4,
    skill: 'solid-shapes',
    difficultyStep: 'easy',
    curriculumCode: '[2수03-01]',
    learnerGoal: '상자 모양을 찾아요',
    parentSummaryTag: 'solid-shape-recognition',
    promptTemplate: '상자와 가장 비슷한 입체도형은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '직육면체',
    choicesTemplate: ['직육면체', '구', '원기둥'],
    visualModel: 'solid-shape-cards',
    visualConfig: { shapes: '직육면체,구,원기둥', target: '직육면체' },
    hintStepsTemplate: ['반듯한 면이 있는 모양을 찾아요.', '상자처럼 각진 입체도형을 찾아요.'],
    solutionStepsTemplate: ['상자와 비슷한 입체도형은 직육면체예요.'],
    rewardId: 'shapeCompass',
  }),
  template({
    id: 'g2-1-shapes-05',
    unitId: 'g2-1-shapes',
    semester: '2-1',
    stageOrder: 41,
    unitMissionOrder: 5,
    skill: 'plane-shapes',
    difficultyStep: 'medium',
    curriculumCode: '[2수03-04]',
    learnerGoal: '원의 특징을 말해요',
    parentSummaryTag: 'plane-shape-properties',
    promptTemplate: '변과 꼭짓점이 없는 평면도형은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '원',
    choicesTemplate: ['원', '삼각형', '사각형'],
    visualModel: 'solid-shape-cards',
    visualConfig: { shapes: '원,삼각형,사각형', target: '원', flat: true },
    hintStepsTemplate: ['둥근 모양을 찾아요.', '변과 꼭짓점이 없는 이름을 떠올려요.'],
    solutionStepsTemplate: ['원은 변과 꼭짓점이 없어요.'],
    rewardId: 'shapeCompass',
  }),
  template({
    id: 'g2-1-shapes-06',
    unitId: 'g2-1-shapes',
    semester: '2-1',
    stageOrder: 42,
    unitMissionOrder: 6,
    skill: 'solid-shapes',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-05]',
    learnerGoal: '쌓기나무 층을 구별해요',
    parentSummaryTag: 'cube-position',
    promptTemplate: '아래층에 있는 쌓기나무는 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '5',
    visualModel: 'stack-cubes',
    visualConfig: { bottom: 5, top: 3, targetLayer: 'bottom' },
    hintStepsTemplate: ['위에 올린 것은 빼고 아래층만 보아요.', '바닥에 닿은 정육면체를 세어요.'],
    solutionStepsTemplate: ['아래층 쌓기나무는 5개예요.'],
    rewardId: 'shapeCompass',
  }),
  template({
    id: 'g2-1-add-sub-04',
    unitId: 'g2-1-add-sub',
    semester: '2-1',
    stageOrder: 43,
    unitMissionOrder: 4,
    skill: 'addition-subtraction',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-05]',
    learnerGoal: '받아올림 없는 덧셈을 해요',
    parentSummaryTag: 'vertical-addition',
    promptTemplate: '24 + 13은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '37',
    visualModel: 'vertical-operation',
    visualConfig: { top: 24, bottom: 13, operator: '+', result: 37 },
    hintStepsTemplate: ['일의 자리부터 더해요.', '십의 자리도 차례로 더해요.'],
    solutionStepsTemplate: ['4 + 3 = 7, 2 + 1 = 3이에요.', '그래서 37이에요.'],
    rewardId: 'operationBadge',
  }),
  template({
    id: 'g2-1-add-sub-05',
    unitId: 'g2-1-add-sub',
    semester: '2-1',
    stageOrder: 44,
    unitMissionOrder: 5,
    skill: 'addition-subtraction',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-07]',
    learnerGoal: '받아내림 없는 뺄셈을 해요',
    parentSummaryTag: 'vertical-subtraction',
    promptTemplate: '76 - 34는 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '42',
    visualModel: 'vertical-operation',
    visualConfig: { top: 76, bottom: 34, operator: '-', result: 42 },
    hintStepsTemplate: ['일의 자리부터 빼요.', '십의 자리도 차례로 빼요.'],
    solutionStepsTemplate: ['6 - 4 = 2, 7 - 3 = 4예요.', '그래서 42예요.'],
    rewardId: 'operationBadge',
  }),
  template({
    id: 'g2-1-add-sub-06',
    unitId: 'g2-1-add-sub',
    semester: '2-1',
    stageOrder: 45,
    unitMissionOrder: 6,
    skill: 'addition-subtraction',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-09]',
    learnerGoal: '빈칸 뺄셈을 풀어요',
    parentSummaryTag: 'box-equation',
    promptTemplate: '□ - 16 = 28일 때 □ 안의 수는 무엇일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '44',
    visualModel: 'box-equation',
    visualConfig: { left: '?', operator: '-', right: 16, result: 28, missing: 'left' },
    hintStepsTemplate: ['빼기 전 수를 찾아야 해요.', '28에 16을 더해요.'],
    solutionStepsTemplate: ['28 + 16 = 44예요.', '44 - 16 = 28이므로 빈칸은 44예요.'],
    rewardId: 'operationBadge',
  }),
  template({
    id: 'g2-1-length-04',
    unitId: 'g2-1-length',
    semester: '2-1',
    stageOrder: 46,
    unitMissionOrder: 4,
    skill: 'length',
    difficultyStep: 'easy',
    curriculumCode: '[2수03-06]',
    learnerGoal: '자 눈금을 다시 읽어요',
    parentSummaryTag: 'ruler-reading',
    promptTemplate: '지우개의 길이는 몇 cm일까요?',
    answerType: 'length',
    answerConfig: centimeterLengthAnswerConfig,
    paramSchema: {},
    solverRule: '5cm',
    visualModel: 'ruler-line',
    visualConfig: { startCm: 0, endCm: 5, maxCm: 10, object: 'eraser' },
    hintStepsTemplate: ['0에서 시작한 끝 눈금을 보아요.', '끝이 5에 닿아 있어요.'],
    solutionStepsTemplate: ['지우개는 0에서 5까지 이어져 있어요.', '따라서 5cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-1-length-05',
    unitId: 'g2-1-length',
    semester: '2-1',
    stageOrder: 47,
    unitMissionOrder: 5,
    skill: 'length',
    difficultyStep: 'medium',
    curriculumCode: '[2수03-10]',
    learnerGoal: 'm를 cm로 바꾸어요',
    parentSummaryTag: 'length-conversion',
    promptTemplate: '2m는 모두 몇 cm일까요?',
    answerType: 'length',
    answerConfig: centimeterLengthAnswerConfig,
    paramSchema: {},
    solverRule: '200cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '1m', leftCm: 100, rightLabel: '1m', rightCm: 100, totalCm: 200 },
    hintStepsTemplate: ['1m는 100cm예요.', '2m는 100cm가 두 번이에요.'],
    solutionStepsTemplate: ['100cm + 100cm = 200cm예요.', '따라서 2m는 200cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-1-length-06',
    unitId: 'g2-1-length',
    semester: '2-1',
    stageOrder: 48,
    unitMissionOrder: 6,
    skill: 'length',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-12]',
    learnerGoal: '길이 차이를 비교해요',
    parentSummaryTag: 'length-comparison',
    promptTemplate: '1m 10cm와 105cm 중 더 긴 길이는 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '1m 10cm',
    choicesTemplate: ['1m 10cm', '105cm', '같아요'],
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '1m 10cm', leftCm: 110, rightLabel: '105cm', rightCm: 105, target: '1m 10cm' },
    hintStepsTemplate: ['1m 10cm를 cm로 바꾸어요.', '110cm와 105cm를 비교해요.'],
    solutionStepsTemplate: ['1m 10cm = 110cm예요.', '110cm가 105cm보다 길어요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-1-classification-04',
    unitId: 'g2-1-classification',
    semester: '2-1',
    stageOrder: 49,
    unitMissionOrder: 4,
    skill: 'classification',
    difficultyStep: 'easy',
    curriculumCode: '[2수04-01]',
    learnerGoal: '같은 기준으로 세어요',
    parentSummaryTag: 'classification-rule',
    promptTemplate: '노란 물건은 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '3',
    visualModel: 'classification-table',
    visualConfig: { categories: '빨강,파랑,노랑', counts: '2,4,3', target: '노랑', countDisplay: 'marks' },
    hintStepsTemplate: ['노랑 줄만 보아요.', '표식을 하나씩 세어요.'],
    solutionStepsTemplate: ['노란 물건은 3개예요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-1-classification-05',
    unitId: 'g2-1-classification',
    semester: '2-1',
    stageOrder: 50,
    unitMissionOrder: 5,
    skill: 'classification',
    difficultyStep: 'medium',
    curriculumCode: '[2수04-01]',
    learnerGoal: '가장 적은 범주를 찾아요',
    parentSummaryTag: 'classification-counts',
    promptTemplate: '가장 적은 종류는 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '탈것',
    choicesTemplate: ['탈것', '동물', '과일'],
    visualModel: 'classification-table',
    visualConfig: { categories: '동물,탈것,과일', counts: '4,2,5', target: '탈것', countDisplay: 'marks' },
    hintStepsTemplate: ['각 줄의 표식 수를 비교해요.', '가장 적은 줄의 이름을 골라요.'],
    solutionStepsTemplate: ['동물 4개, 탈것 2개, 과일 5개예요.', '가장 적은 것은 탈것이에요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-1-classification-06',
    unitId: 'g2-1-classification',
    semester: '2-1',
    stageOrder: 51,
    unitMissionOrder: 6,
    skill: 'classification',
    difficultyStep: 'applied',
    curriculumCode: '[2수04-01]',
    learnerGoal: '두 범주를 비교해요',
    parentSummaryTag: 'classification-difference',
    promptTemplate: '파랑은 노랑보다 몇 개 더 많을까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '2',
    visualModel: 'classification-table',
    visualConfig: { categories: '빨강,파랑,노랑', counts: '3,5,3', target: '파랑-노랑', countDisplay: 'marks' },
    hintStepsTemplate: ['파랑과 노랑의 표식을 세어요.', '더 많은 수에서 적은 수를 빼요.'],
    solutionStepsTemplate: ['파랑 5개, 노랑 3개예요.', '5 - 3 = 2예요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-1-multiplication-04',
    unitId: 'g2-1-multiplication',
    semester: '2-1',
    stageOrder: 52,
    unitMissionOrder: 4,
    skill: 'multiplication-meaning',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-10]',
    learnerGoal: '같은 묶음을 더해요',
    parentSummaryTag: 'equal-groups',
    promptTemplate: '2개씩 5묶음이면 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '10',
    visualModel: 'array-groups',
    visualConfig: { groups: 5, each: 2, rows: 5, cols: 2 },
    hintStepsTemplate: ['한 묶음에 2개씩 있어요.', '2를 5번 더해요.'],
    solutionStepsTemplate: ['2 + 2 + 2 + 2 + 2 = 10이에요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-1-multiplication-05',
    unitId: 'g2-1-multiplication',
    semester: '2-1',
    stageOrder: 53,
    unitMissionOrder: 5,
    skill: 'multiplication-meaning',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-10]',
    learnerGoal: '배열을 세어요',
    parentSummaryTag: 'array-multiplication',
    promptTemplate: '3줄에 4개씩 놓인 별은 모두 몇 개일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '12',
    visualModel: 'array-groups',
    visualConfig: { rows: 3, cols: 4, groups: 3, each: 4 },
    hintStepsTemplate: ['한 줄에 4개씩 있어요.', '4가 3줄이에요.'],
    solutionStepsTemplate: ['4 + 4 + 4 = 12예요.', '3 x 4로 볼 수 있어요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-1-multiplication-06',
    unitId: 'g2-1-multiplication',
    semester: '2-1',
    stageOrder: 54,
    unitMissionOrder: 6,
    skill: 'multiplication-meaning',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-10]',
    learnerGoal: '반복 덧셈을 고쳐 써요',
    parentSummaryTag: 'repeated-addition',
    promptTemplate: '5 + 5 + 5 + 5를 곱셈식으로 나타낸 것은 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '4 x 5',
    choicesTemplate: ['4 x 5', '5 x 5', '4 + 5'],
    visualModel: 'array-groups',
    visualConfig: { groups: 4, each: 5, rows: 4, cols: 5 },
    hintStepsTemplate: ['5가 몇 번 반복되는지 세어요.', '같은 수 5가 4번 나와요.'],
    solutionStepsTemplate: ['5가 4번 반복되므로 4 x 5예요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-2-place-value-04',
    unitId: 'g2-2-place-value',
    semester: '2-2',
    stageOrder: 55,
    unitMissionOrder: 4,
    skill: 'place-value',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-02]',
    learnerGoal: '네 자리 모형을 읽어요',
    parentSummaryTag: 'four-digit-place-value',
    promptTemplate: '그림의 네 자리 수는 무엇일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '4213',
    visualModel: 'place-value-blocks',
    visualConfig: { number: 4213, thousands: 4, hundreds: 2, tens: 1, ones: 3 },
    hintStepsTemplate: ['천, 백, 십, 일을 차례로 보아요.', '각 자리의 모형 개수를 숫자로 써요.'],
    solutionStepsTemplate: ['천 4개, 백 2개, 십 1개, 일 3개예요.', '그래서 4213이에요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-2-place-value-05',
    unitId: 'g2-2-place-value',
    semester: '2-2',
    stageOrder: 56,
    unitMissionOrder: 5,
    skill: 'number-comparison',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-03]',
    learnerGoal: '천의 자리 수를 비교해요',
    parentSummaryTag: 'four-digit-comparison',
    promptTemplate: '5080과 5800 중 더 큰 수는 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '5800',
    choicesTemplate: ['5800', '5080', '5008'],
    visualModel: 'expanded-number-cards',
    visualConfig: { cards: '5080,5800,5008', target: '5800', mode: 'compare' },
    hintStepsTemplate: ['천의 자리는 모두 5예요.', '백의 자리를 비교해요.'],
    solutionStepsTemplate: ['백의 자리 8이 0보다 커요.', '따라서 5800이 더 커요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-2-place-value-06',
    unitId: 'g2-2-place-value',
    semester: '2-2',
    stageOrder: 57,
    unitMissionOrder: 6,
    skill: 'place-value',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-02]',
    learnerGoal: '네 자리 전개식을 읽어요',
    parentSummaryTag: 'four-digit-expanded-form',
    promptTemplate: '3000 + 700 + 50 + 9는 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '3759',
    visualModel: 'expanded-number-cards',
    visualConfig: { parts: '3000,700,50,9', target: '3759', mode: 'expanded' },
    hintStepsTemplate: ['천, 백, 십, 일의 값을 차례로 보아요.', '각 자리 숫자를 이어 써요.'],
    solutionStepsTemplate: ['3000, 700, 50, 9를 합치면 3759예요.'],
    rewardId: 'numberGem',
  }),
  template({
    id: 'g2-2-facts-04',
    unitId: 'g2-2-facts',
    semester: '2-2',
    stageOrder: 58,
    unitMissionOrder: 4,
    skill: 'multiplication-facts',
    difficultyStep: 'easy',
    curriculumCode: '[2수01-11]',
    learnerGoal: '구구를 다시 계산해요',
    parentSummaryTag: 'multiplication-facts',
    promptTemplate: '3 x 6은 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '18',
    visualModel: 'multiplication-table',
    visualConfig: { dan: 3, factor: 6, product: 18 },
    hintStepsTemplate: ['3을 6번 더한다고 생각해요.', '3단의 여섯 번째 값을 찾아요.'],
    solutionStepsTemplate: ['3 + 3 + 3 + 3 + 3 + 3 = 18이에요.', '3 x 6 = 18이에요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-2-facts-05',
    unitId: 'g2-2-facts',
    semester: '2-2',
    stageOrder: 59,
    unitMissionOrder: 5,
    skill: 'multiplication-facts',
    difficultyStep: 'medium',
    curriculumCode: '[2수01-11]',
    learnerGoal: '구구표 빈칸을 다시 찾아요',
    parentSummaryTag: 'multiplication-table',
    promptTemplate: '8 x □ = 32일 때 □는 얼마일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '4',
    visualModel: 'multiplication-table',
    visualConfig: { dan: 8, factor: 4, product: 32, missing: 'factor' },
    hintStepsTemplate: ['8단에서 32가 되는 칸을 찾아요.', '8을 몇 번 더하면 32가 되는지 생각해요.'],
    solutionStepsTemplate: ['8 x 4 = 32예요.', '따라서 빈칸은 4예요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-2-facts-06',
    unitId: 'g2-2-facts',
    semester: '2-2',
    stageOrder: 60,
    unitMissionOrder: 6,
    skill: 'multiplication-facts',
    difficultyStep: 'applied',
    curriculumCode: '[2수01-11]',
    learnerGoal: '배열식을 고르어요',
    parentSummaryTag: 'array-facts',
    promptTemplate: '5줄에 7개씩 있으면 알맞은 곱셈식은 무엇일까요?',
    answerType: 'choice',
    answerConfig: choiceAnswerConfig,
    paramSchema: {},
    solverRule: '5 x 7',
    choicesTemplate: ['5 x 7', '7 x 7', '5 + 7'],
    visualModel: 'array-groups',
    visualConfig: { rows: 5, cols: 7, groups: 5, each: 7 },
    hintStepsTemplate: ['줄 수와 한 줄의 개수를 보아요.', '5줄, 한 줄에 7개씩 있어요.'],
    solutionStepsTemplate: ['5줄에 7개씩 있으므로 5 x 7이에요.'],
    rewardId: 'multiplyMedal',
  }),
  template({
    id: 'g2-2-length-04',
    unitId: 'g2-2-length',
    semester: '2-2',
    stageOrder: 61,
    unitMissionOrder: 4,
    skill: 'length',
    difficultyStep: 'easy',
    curriculumCode: '[2수03-11]',
    learnerGoal: '길이를 더해요',
    parentSummaryTag: 'length-addition',
    promptTemplate: '1m 10cm와 30cm를 합치면 얼마일까요?',
    answerType: 'length',
    answerConfig: lengthAnswerConfig,
    paramSchema: {},
    solverRule: '140cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '1m 10cm', leftCm: 110, rightLabel: '30cm', rightCm: 30, totalCm: 140 },
    hintStepsTemplate: ['1m 10cm를 110cm로 바꾸어요.', '110cm와 30cm를 더해요.'],
    solutionStepsTemplate: ['110cm + 30cm = 140cm예요.', '140cm는 1m 40cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-2-length-05',
    unitId: 'g2-2-length',
    semester: '2-2',
    stageOrder: 62,
    unitMissionOrder: 5,
    skill: 'length',
    difficultyStep: 'medium',
    curriculumCode: '[2수03-13]',
    learnerGoal: '길이를 빼요',
    parentSummaryTag: 'length-subtraction',
    promptTemplate: '1m 80cm에서 60cm를 빼면 얼마일까요?',
    answerType: 'length',
    answerConfig: lengthAnswerConfig,
    paramSchema: {},
    solverRule: '120cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '1m 80cm', leftCm: 180, rightLabel: '60cm', rightCm: 60, totalCm: 120, operation: 'subtract' },
    hintStepsTemplate: ['1m 80cm를 180cm로 바꾸어요.', '180cm에서 60cm를 빼요.'],
    solutionStepsTemplate: ['180cm - 60cm = 120cm예요.', '120cm는 1m 20cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-2-length-06',
    unitId: 'g2-2-length',
    semester: '2-2',
    stageOrder: 63,
    unitMissionOrder: 6,
    skill: 'length',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-13]',
    learnerGoal: '같은 길이를 바꾸어 써요',
    parentSummaryTag: 'equivalent-length',
    promptTemplate: '230cm와 같은 길이를 m와 cm로 나타내면 얼마일까요?',
    answerType: 'length',
    answerConfig: lengthAnswerConfig,
    paramSchema: {},
    solverRule: '230cm',
    visualModel: 'length-bars',
    visualConfig: { leftLabel: '230cm', leftCm: 230, rightLabel: '2m 30cm', rightCm: 230, totalCm: 230, hideRightLabelUntilReveal: true },
    hintStepsTemplate: ['100cm는 1m예요.', '230cm는 200cm와 30cm로 나눌 수 있어요.'],
    solutionStepsTemplate: ['230cm = 200cm + 30cm예요.', '200cm는 2m이므로 2m 30cm예요.'],
    rewardId: 'measureTape',
  }),
  template({
    id: 'g2-2-time-04',
    unitId: 'g2-2-time',
    semester: '2-2',
    stageOrder: 64,
    unitMissionOrder: 4,
    skill: 'time',
    difficultyStep: 'easy',
    curriculumCode: '[2수03-07]',
    learnerGoal: '분 단위 시각을 다시 읽어요',
    parentSummaryTag: 'clock-minute-reading',
    promptTemplate: '다른 시계가 가리키는 시각은 몇 시 몇 분일까요?',
    answerType: 'time-of-day',
    answerConfig: timeOfDayAnswerConfig,
    paramSchema: {},
    solverRule: '5:40',
    visualModel: 'clock-face',
    visualConfig: { hour: 5, minute: 40 },
    hintStepsTemplate: ['짧은 바늘은 시를 알려줘요.', '긴 바늘은 40분을 가리켜요.'],
    solutionStepsTemplate: ['짧은 바늘은 5를 지나 있어요.', '긴 바늘은 40분이므로 5시 40분이에요.'],
    rewardId: 'clockStar',
  }),
  template({
    id: 'g2-2-time-05',
    unitId: 'g2-2-time',
    semester: '2-2',
    stageOrder: 65,
    unitMissionOrder: 5,
    skill: 'time',
    difficultyStep: 'medium',
    curriculumCode: '[2수03-08]',
    learnerGoal: '분 차이를 구해요',
    parentSummaryTag: 'elapsed-time',
    promptTemplate: '4시 15분부터 4시 50분까지 걸린 시간은 얼마일까요?',
    answerType: 'duration',
    answerConfig: durationAnswerConfig,
    paramSchema: {},
    solverRule: '35분',
    visualModel: 'clock-face',
    visualConfig: { hour: 4, minute: 15, endHour: 4, endMinute: 50 },
    hintStepsTemplate: ['시는 같으니 분끼리 비교해요.', '50분에서 15분을 빼요.'],
    solutionStepsTemplate: ['50 - 15 = 35예요.', '걸린 시간은 35분이에요.'],
    rewardId: 'clockStar',
  }),
  template({
    id: 'g2-2-time-06',
    unitId: 'g2-2-time',
    semester: '2-2',
    stageOrder: 66,
    unitMissionOrder: 6,
    skill: 'time',
    difficultyStep: 'applied',
    curriculumCode: '[2수03-09]',
    learnerGoal: '달력 관계를 알아요',
    parentSummaryTag: 'calendar-relationships',
    promptTemplate: '2주는 며칠일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '14',
    visualModel: 'calendar-strip',
    visualConfig: { days: '월,화,수,목,금,토,일,월,화,수,목,금,토,일', target: 14 },
    hintStepsTemplate: ['1주는 7일이에요.', '2주는 7일이 두 번이에요.'],
    solutionStepsTemplate: ['7 + 7 = 14예요.', '2주는 14일이에요.'],
    rewardId: 'clockStar',
  }),
  template({
    id: 'g2-2-table-graph-04',
    unitId: 'g2-2-table-graph',
    semester: '2-2',
    stageOrder: 67,
    unitMissionOrder: 4,
    skill: 'table-graph',
    difficultyStep: 'easy',
    curriculumCode: '[2수04-02]',
    learnerGoal: '표의 수를 읽어요',
    parentSummaryTag: 'table-reading',
    promptTemplate: '표에서 포도를 좋아하는 친구는 몇 명일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '4',
    visualModel: 'classification-table',
    visualConfig: { categories: '딸기,포도,수박', counts: '7,4,5', target: '포도' },
    hintStepsTemplate: ['포도 줄을 찾아요.', '포도 옆 숫자를 읽어요.'],
    solutionStepsTemplate: ['포도 줄에는 4명이 있어요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-2-table-graph-05',
    unitId: 'g2-2-table-graph',
    semester: '2-2',
    stageOrder: 68,
    unitMissionOrder: 5,
    skill: 'table-graph',
    difficultyStep: 'medium',
    curriculumCode: '[2수04-03]',
    learnerGoal: '표식 그래프의 많은 것을 찾아요',
    parentSummaryTag: 'mark-graph-reading',
    promptTemplate: '표식 그래프에서 가장 많은 것은 무엇일까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '야구',
    choicesTemplate: ['야구', '축구', '피구'],
    visualModel: 'mark-graph',
    visualConfig: { categories: '축구,야구,피구', counts: '4,7,5', target: '야구' },
    hintStepsTemplate: ['표식이 가장 많은 줄을 찾아요.', '각 줄의 표식을 비교해요.'],
    solutionStepsTemplate: ['축구 4개, 야구 7개, 피구 5개예요.', '가장 많은 것은 야구예요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-2-table-graph-06',
    unitId: 'g2-2-table-graph',
    semester: '2-2',
    stageOrder: 69,
    unitMissionOrder: 6,
    skill: 'table-graph',
    difficultyStep: 'applied',
    curriculumCode: '[2수04-03]',
    learnerGoal: '그래프 차이를 다시 구해요',
    parentSummaryTag: 'graph-difference',
    promptTemplate: '피구는 축구보다 몇 명 더 많을까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '2',
    visualModel: 'mark-graph',
    visualConfig: { categories: '축구,야구,피구', counts: '4,6,6', target: '피구-축구' },
    hintStepsTemplate: ['피구와 축구의 표식 수를 세어요.', '더 많은 수에서 적은 수를 빼요.'],
    solutionStepsTemplate: ['피구는 6명, 축구는 4명이에요.', '6 - 4 = 2예요.'],
    rewardId: 'graphBadge',
  }),
  template({
    id: 'g2-2-pattern-04',
    unitId: 'g2-2-pattern',
    semester: '2-2',
    stageOrder: 70,
    unitMissionOrder: 4,
    skill: 'pattern',
    difficultyStep: 'easy',
    curriculumCode: '[2수02-01]',
    learnerGoal: '세 색 반복을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '빨강, 파랑, 노랑, 빨강, 파랑 다음에는 무엇이 올까요?',
    answerType: 'label',
    answerConfig: labelAnswerConfig,
    paramSchema: {},
    solverRule: '노랑',
    choicesTemplate: ['노랑', '빨강', '파랑'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '빨강,파랑,노랑,빨강,파랑,?' },
    hintStepsTemplate: ['빨강, 파랑, 노랑이 반복돼요.', '파랑 다음에는 노랑이 와요.'],
    solutionStepsTemplate: ['반복되는 묶음은 빨강, 파랑, 노랑이에요.'],
    rewardId: 'patternKey',
  }),
  template({
    id: 'g2-2-pattern-05',
    unitId: 'g2-2-pattern',
    semester: '2-2',
    stageOrder: 71,
    unitMissionOrder: 5,
    skill: 'pattern',
    difficultyStep: 'medium',
    curriculumCode: '[2수02-02]',
    learnerGoal: '3씩 커지는 규칙을 찾아요',
    parentSummaryTag: 'growing-patterns',
    promptTemplate: '3, 6, 9, 12 다음 수는 무엇일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '15',
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '3,6,9,12,?' },
    hintStepsTemplate: ['앞의 수에서 얼마씩 커지는지 보아요.', '모든 수가 3씩 커지고 있어요.'],
    solutionStepsTemplate: ['3씩 커지는 규칙이에요.', '12 다음은 15예요.'],
    rewardId: 'patternKey',
  }),
  template({
    id: 'g2-2-pattern-06',
    unitId: 'g2-2-pattern',
    semester: '2-2',
    stageOrder: 72,
    unitMissionOrder: 6,
    skill: 'pattern',
    difficultyStep: 'applied',
    curriculumCode: '[2수02-02]',
    learnerGoal: '구구단 증가 규칙을 찾아요',
    parentSummaryTag: 'multiplication-patterns',
    promptTemplate: '4단에서 4, 8, 12, 16 다음 수는 무엇일까요?',
    answerType: 'integer',
    answerConfig: integerAnswerConfig,
    paramSchema: {},
    solverRule: '20',
    visualModel: 'multiplication-table',
    visualConfig: { dan: 4, factor: 5, product: 20, sequence: '4,8,12,16,?' },
    hintStepsTemplate: ['4단은 4씩 커져요.', '16 다음에 4를 더해요.'],
    solutionStepsTemplate: ['16 + 4 = 20이에요.', '그래서 다음 수는 20이에요.'],
    rewardId: 'patternKey',
  }),
]

const grade2BaseMissionTemplates: Grade2MissionTemplate[] = [
  ...grade2AlphaMissionTemplates,
  ...grade2BetaMissionTemplates,
]

function buildGrade2V1MissionTemplates(): Grade2MissionTemplate[] {
  let stageOrder = 1
  const result: Grade2MissionTemplate[] = []

  for (const unit of grade2Units.slice().sort((left, right) => left.order - right.order)) {
    const originals = grade2BaseMissionTemplates
      .filter((mission) => mission.unitId === unit.id)
      .sort((left, right) => left.unitMissionOrder - right.unitMissionOrder)

    for (const original of originals) {
      result.push({ ...original, stageOrder, unitMissionOrder: result.filter((item) => item.unitId === unit.id).length + 1 })
      stageOrder += 1
    }

    originals.forEach((source, index) => {
      const unitMissionOrder = originals.length + index + 1
      result.push({
        ...source,
        id: `${source.id}-v1`,
        stageOrder,
        unitMissionOrder,
        learnerGoal: `두 번째 연습 · ${source.learnerGoal}`,
        promptTemplate: `한 번 더! ${source.promptTemplate}`,
      })
      stageOrder += 1
    })
  }

  return result
}

export const grade2MissionTemplates: Grade2MissionTemplate[] = buildGrade2V1MissionTemplates()

function seededRandom(seed: number): () => number {
  return function next() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

function randomInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function generateParams(
  schema: Grade2MissionTemplate['paramSchema'],
  random: () => number
): Record<string, number> {
  const params: Record<string, number> = {}
  for (const [key, range] of Object.entries(schema)) {
    params[key] = randomInt(range.min, range.max, random)
  }
  return params
}

function evaluateExpression(expr: string, params: Record<string, number>): string {
  let evalExpr = expr.trim()

  if (params[evalExpr] !== undefined) return String(params[evalExpr])

  for (const [key, value] of Object.entries(params)) {
    evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
  }

  if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
    try {
      return String(Function(`"use strict"; return (${evalExpr})`)())
    } catch {
      return expr
    }
  }

  return expr
}

function renderTemplate(template: string, params: Record<string, number>): string {
  if (!template.includes('{{')) return evaluateExpression(template, params)

  return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) =>
    evaluateExpression(expr, params)
  )
}

function coerceRenderedValue(value: string | number | boolean): string | number | boolean {
  if (typeof value !== 'string') return value
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  return value
}

function renderVisualConfig(
  config: Grade2VisualConfig,
  params: Record<string, number>
): Grade2VisualConfig {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (typeof value !== 'string') return [key, value]
      return [key, coerceRenderedValue(renderTemplate(value, params))]
    })
  )
}

export function renderGrade2Mission(
  template: Grade2MissionTemplate,
  seed = template.stageOrder
): Grade2Mission {
  const random = seededRandom(seed + template.stageOrder * 997)
  const params = generateParams(template.paramSchema, random)
  const correctAnswer = renderTemplate(template.solverRule, params)
  const choices = template.choicesTemplate
    ? template.choicesTemplate.map((choice) => renderTemplate(choice, params))
    : undefined
  const shuffledChoices = choices ? shuffleArray(choices, random) : undefined

  return {
    id: template.id,
    unitId: template.unitId,
    semester: template.semester,
    stageOrder: template.stageOrder,
    unitMissionOrder: template.unitMissionOrder,
    skill: template.skill,
    difficultyStep: template.difficultyStep,
    curriculumCode: template.curriculumCode,
    learnerGoal: template.learnerGoal,
    parentSummaryTag: template.parentSummaryTag,
    prompt: renderTemplate(template.promptTemplate, params),
    answerType: template.answerType,
    answerConfig: template.answerConfig,
    params,
    choices: shuffledChoices,
    correctAnswer,
    correctChoiceIndex: shuffledChoices?.indexOf(correctAnswer),
    visualModel: template.visualModel,
    visualConfig: renderVisualConfig(template.visualConfig, params),
    hintSteps: template.hintStepsTemplate.map((hint) => renderTemplate(hint, params)),
    solutionSteps: template.solutionStepsTemplate.map((step) => renderTemplate(step, params)),
    rewardId: template.rewardId,
  }
}

export function getGrade2Missions(seed = 20260510): Grade2Mission[] {
  return grade2MissionTemplates
    .slice()
    .sort((a, b) => a.stageOrder - b.stageOrder)
    .map((template) => renderGrade2Mission(template, seed))
}

export function getGrade2MissionsByUnit(unitId: string, seed = 20260510): Grade2Mission[] {
  return getGrade2Missions(seed).filter((mission) => mission.unitId === unitId)
}

export function getSafeGrade2Mission(seed = 20260510): Grade2Mission {
  const safeTemplate = grade2MissionTemplates.find((template) => template.id === SAFE_GRADE2_MISSION_ID)
  if (!safeTemplate) throw new Error('Safe Grade 2 mission is missing')
  return renderGrade2Mission(safeTemplate, seed)
}

export function getGrade2MissionById(id: string, seed = 20260510): Grade2Mission {
  const template = grade2MissionTemplates.find((item) => item.id === id)
  return template ? renderGrade2Mission(template, seed) : getSafeGrade2Mission(seed)
}

export function getGrade2UnitById(id: string): Grade2Unit | undefined {
  return grade2Units.find((unit) => unit.id === id)
}

export interface Grade2ValidationResult {
  errors: string[]
  warnings: string[]
}

const visualRequiredFields: Record<Grade2VisualModel, string[]> = {
  'place-value-blocks': ['number'],
  'expanded-number-cards': ['target'],
  'vertical-operation': ['top', 'bottom', 'operator', 'result'],
  'box-equation': ['operator', 'result', 'missing'],
  'array-groups': ['rows', 'cols'],
  'multiplication-table': ['dan'],
  'solid-shape-cards': ['shapes', 'target'],
  'stack-cubes': ['bottom', 'top'],
  'ruler-line': ['startCm', 'endCm', 'maxCm'],
  'length-bars': ['leftLabel', 'leftCm', 'rightLabel', 'rightCm'],
  'clock-face': ['hour', 'minute'],
  'calendar-strip': ['days'],
  'classification-table': ['categories', 'counts'],
  'mark-graph': ['categories', 'counts'],
  'pattern-strip': ['pattern'],
}

function splitList(value: string | number | boolean | undefined): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function validateCountVisual(template: Grade2MissionTemplate, errors: string[]) {
  if (template.visualModel !== 'classification-table' && template.visualModel !== 'mark-graph') {
    return
  }

  const categories = splitList(template.visualConfig.categories)
  const counts = splitList(template.visualConfig.counts).map(Number)
  if (categories.length === 0 || categories.length !== counts.length || counts.some((count) => !Number.isFinite(count))) {
    errors.push(`${template.id}: graph/classification categories and counts must match`)
  }
}

function validateClockVisual(template: Grade2MissionTemplate, errors: string[]) {
  if (template.visualModel !== 'clock-face') return
  const hour = Number(template.visualConfig.hour)
  const minute = Number(template.visualConfig.minute)
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    errors.push(`${template.id}: clock hour must be 0-23`)
  }
  if (!Number.isFinite(minute) || minute < 0 || minute >= 60) {
    errors.push(`${template.id}: clock minute must be 0-59`)
  }
}

function validateRulerVisual(template: Grade2MissionTemplate, errors: string[]) {
  if (template.visualModel !== 'ruler-line') return
  const start = Number(template.visualConfig.startCm)
  const end = Number(template.visualConfig.endCm)
  const max = Number(template.visualConfig.maxCm)
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(max) || start < 0 || end > max || start >= end) {
    errors.push(`${template.id}: ruler-line must stay inside ruler range`)
  }
}

export function validateGrade2MissionBank(
  templates: Grade2MissionTemplate[] = grade2MissionTemplates
): Grade2ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  const stageOrders = new Set<number>()
  const rewardIds = new Set<Grade2RewardId>(grade2Units.map((unit) => unit.rewardId))
  const unitCounts = new Map<string, number>()

  for (const template of templates) {
    if (ids.has(template.id)) errors.push(`Duplicate mission id: ${template.id}`)
    ids.add(template.id)

    if (stageOrders.has(template.stageOrder)) errors.push(`Duplicate stage order: ${template.stageOrder}`)
    stageOrders.add(template.stageOrder)

    const unit = getGrade2UnitById(template.unitId)
    if (!unit) errors.push(`${template.id}: unknown unit ${template.unitId}`)
    if (unit && unit.semester !== template.semester) {
      errors.push(`${template.id}: semester does not match unit`)
    }
    if (!template.curriculumCode.trim()) errors.push(`${template.id}: missing curriculumCode`)
    if (template.answerConfig.kind !== template.answerType) {
      errors.push(`${template.id}: answerConfig.kind must match answerType`)
    }
    if (!rewardIds.has(template.rewardId)) errors.push(`${template.id}: unknown reward ${template.rewardId}`)
    if (!template.learnerGoal.trim()) errors.push(`${template.id}: missing learnerGoal`)
    if (!template.parentSummaryTag.trim()) errors.push(`${template.id}: missing parentSummaryTag`)
    if (template.hintStepsTemplate.length < 2) errors.push(`${template.id}: needs at least two hints`)
    if (template.solutionStepsTemplate.length === 0) errors.push(`${template.id}: missing solution steps`)

    unitCounts.set(template.unitId, (unitCounts.get(template.unitId) ?? 0) + 1)

    for (const field of visualRequiredFields[template.visualModel]) {
      if (template.visualConfig[field] === undefined || template.visualConfig[field] === '') {
        errors.push(`${template.id}: ${template.visualModel} missing ${field}`)
      }
    }
    validateCountVisual(template, errors)
    validateClockVisual(template, errors)
    validateRulerVisual(template, errors)

    const needsChoices = template.answerType === 'choice' || template.answerType === 'label'
    if (needsChoices && (!template.choicesTemplate || template.choicesTemplate.length < 2)) {
      errors.push(`${template.id}: ${template.answerType} mission needs at least two choices`)
    }
    if (!needsChoices && template.choicesTemplate) {
      warnings.push(`${template.id}: ${template.answerType} mission ignores choicesTemplate`)
    }

    for (const seed of [1, 7, 23]) {
      const mission = renderGrade2Mission(template, seed)
      if (!mission.correctAnswer.trim()) errors.push(`${template.id}: empty answer at seed ${seed}`)
      if (needsChoices) {
        const uniqueChoices = new Set(mission.choices ?? [])
        if (!mission.choices || mission.choices.length < 2) {
          errors.push(`${template.id}: no rendered choices at seed ${seed}`)
        } else if (uniqueChoices.size !== mission.choices.length) {
          errors.push(`${template.id}: duplicate choices at seed ${seed}`)
        }
        const correctCount = (mission.choices ?? []).filter((choice) => choice === mission.correctAnswer).length
        if (correctCount !== 1) {
          errors.push(`${template.id}: expected one correct choice at seed ${seed}, got ${correctCount}`)
        }
        if (mission.correctChoiceIndex === undefined || mission.correctChoiceIndex < 0) {
          errors.push(`${template.id}: missing correctChoiceIndex at seed ${seed}`)
        }
      }
    }
  }

  for (const unit of grade2Units) {
    const count = unitCounts.get(unit.id) ?? 0
    if (count !== 12) errors.push(`${unit.id}: V1 expects 12 missions, got ${count}`)
  }

  if (templates.length !== 144) errors.push(`V1 expects 144 missions, got ${templates.length}`)
  if (!ids.has(SAFE_GRADE2_MISSION_ID)) errors.push(`Safe mission id is missing: ${SAFE_GRADE2_MISSION_ID}`)

  return { errors, warnings }
}
