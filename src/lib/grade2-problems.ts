import type { Grade2AnswerType } from './grade2-answer-normalizers'

export type Grade2Semester = '2-1' | '2-2'

export type Grade2DifficultyStep = 'easy' | 'medium' | 'applied'

export type Grade2Mode = 'basic' | 'practice'

export type Grade2CognitiveDomain = 'knowing' | 'applying' | 'reasoning'

export type Grade2TaskAction =
  | 'recognize'
  | 'classify'
  | 'compare'
  | 'calculate'
  | 'measure'
  | 'construct'
  | 'model'
  | 'interpret'
  | 'explain'
  | 'analyze_error'
  | 'reason'

export type Grade2VisualSemantics = 'decorative' | 'schematic' | 'quantitative'

interface Grade2QualityMetadata {
  taskActions: Grade2TaskAction[]
  visualSemantics: Grade2VisualSemantics
}

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

export interface Grade2MissionTemplate extends Grade2QualityMetadata {
  id: string
  unitId: string
  semester: Grade2Semester
  mode: Grade2Mode
  cognitiveDomain: Grade2CognitiveDomain
  stageOrder: number
  unitMissionOrder: number
  skill: Grade2Skill
  difficultyStep: Grade2DifficultyStep
  curriculumCode: string
  directCurriculumCodes: string[]
  curriculumText: string
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

export interface Grade2Mission extends Grade2QualityMetadata {
  id: string
  unitId: string
  semester: Grade2Semester
  mode: Grade2Mode
  cognitiveDomain: Grade2CognitiveDomain
  stageOrder: number
  unitMissionOrder: number
  skill: Grade2Skill
  difficultyStep: Grade2DifficultyStep
  curriculumCode: string
  directCurriculumCodes: string[]
  curriculumText: string
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

export type Grade2MissionProvider = (seed: number) => readonly Grade2Mission[]

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

type Grade2BaseMissionTemplate = Omit<
  Grade2MissionTemplate,
  'mode' | 'cognitiveDomain' | 'directCurriculumCodes' | 'curriculumText'
>
type Grade2MissionTemplateSource = Omit<Grade2BaseMissionTemplate, keyof Grade2QualityMetadata>

function quality(
  taskAction: Grade2TaskAction,
  visualSemantics: Grade2VisualSemantics
): Grade2QualityMetadata {
  return { taskActions: [taskAction], visualSemantics }
}

const grade2QualityMetadataBySourceId: Record<string, Grade2QualityMetadata> = {
  'g2-1-place-value-01': quality('interpret', 'quantitative'),
  'g2-1-place-value-02': quality('compare', 'schematic'),
  'g2-1-place-value-03': quality('model', 'schematic'),
  'g2-1-place-value-04': quality('interpret', 'quantitative'),
  'g2-1-place-value-05': quality('compare', 'schematic'),
  'g2-1-place-value-06': quality('model', 'schematic'),
  'g2-1-shapes-01': quality('recognize', 'schematic'),
  'g2-1-shapes-02': quality('classify', 'schematic'),
  'g2-1-shapes-03': quality('calculate', 'quantitative'),
  'g2-1-shapes-04': quality('recognize', 'schematic'),
  'g2-1-shapes-05': quality('classify', 'schematic'),
  'g2-1-shapes-06': quality('calculate', 'quantitative'),
  'g2-1-add-sub-01': quality('calculate', 'schematic'),
  'g2-1-add-sub-02': quality('calculate', 'schematic'),
  'g2-1-add-sub-03': quality('calculate', 'schematic'),
  'g2-1-add-sub-04': quality('calculate', 'schematic'),
  'g2-1-add-sub-05': quality('calculate', 'schematic'),
  'g2-1-add-sub-06': quality('calculate', 'schematic'),
  'g2-1-length-01': quality('measure', 'quantitative'),
  'g2-1-length-02': quality('model', 'quantitative'),
  'g2-1-length-03': quality('compare', 'quantitative'),
  'g2-1-length-04': quality('measure', 'quantitative'),
  'g2-1-length-05': quality('model', 'quantitative'),
  'g2-1-length-06': quality('compare', 'quantitative'),
  'g2-1-classification-01': quality('interpret', 'quantitative'),
  'g2-1-classification-02': quality('compare', 'quantitative'),
  'g2-1-classification-03': quality('calculate', 'quantitative'),
  'g2-1-classification-04': quality('interpret', 'quantitative'),
  'g2-1-classification-05': quality('compare', 'quantitative'),
  'g2-1-classification-06': quality('calculate', 'quantitative'),
  'g2-1-multiplication-01': quality('calculate', 'quantitative'),
  'g2-1-multiplication-02': quality('calculate', 'quantitative'),
  'g2-1-multiplication-03': quality('model', 'quantitative'),
  'g2-1-multiplication-04': quality('calculate', 'quantitative'),
  'g2-1-multiplication-05': quality('calculate', 'quantitative'),
  'g2-1-multiplication-06': quality('model', 'quantitative'),
  'g2-2-place-value-01': quality('interpret', 'quantitative'),
  'g2-2-place-value-02': quality('compare', 'schematic'),
  'g2-2-place-value-03': quality('model', 'schematic'),
  'g2-2-place-value-04': quality('interpret', 'quantitative'),
  'g2-2-place-value-05': quality('compare', 'schematic'),
  'g2-2-place-value-06': quality('model', 'schematic'),
  'g2-2-facts-01': quality('calculate', 'quantitative'),
  'g2-2-facts-02': quality('calculate', 'quantitative'),
  'g2-2-facts-03': quality('model', 'quantitative'),
  'g2-2-facts-04': quality('calculate', 'quantitative'),
  'g2-2-facts-05': quality('calculate', 'quantitative'),
  'g2-2-facts-06': quality('model', 'quantitative'),
  'g2-2-length-01': quality('calculate', 'quantitative'),
  'g2-2-length-02': quality('calculate', 'quantitative'),
  'g2-2-length-03': quality('model', 'quantitative'),
  'g2-2-length-04': quality('calculate', 'quantitative'),
  'g2-2-length-05': quality('calculate', 'quantitative'),
  'g2-2-length-06': quality('model', 'quantitative'),
  'g2-2-time-01': quality('interpret', 'quantitative'),
  'g2-2-time-02': quality('calculate', 'quantitative'),
  'g2-2-time-03': quality('reason', 'schematic'),
  'g2-2-time-04': quality('interpret', 'quantitative'),
  'g2-2-time-05': quality('calculate', 'quantitative'),
  'g2-2-time-06': quality('reason', 'schematic'),
  'g2-2-table-graph-01': quality('interpret', 'quantitative'),
  'g2-2-table-graph-02': quality('compare', 'quantitative'),
  'g2-2-table-graph-03': quality('calculate', 'quantitative'),
  'g2-2-table-graph-04': quality('interpret', 'quantitative'),
  'g2-2-table-graph-05': quality('compare', 'quantitative'),
  'g2-2-table-graph-06': quality('calculate', 'quantitative'),
  'g2-2-pattern-01': quality('reason', 'schematic'),
  'g2-2-pattern-02': quality('reason', 'schematic'),
  'g2-2-pattern-03': quality('reason', 'quantitative'),
  'g2-2-pattern-04': quality('reason', 'schematic'),
  'g2-2-pattern-05': quality('reason', 'schematic'),
  'g2-2-pattern-06': quality('reason', 'quantitative'),
}

function template(source: Grade2MissionTemplateSource): Grade2BaseMissionTemplate {
  const metadata = grade2QualityMetadataBySourceId[source.id]
  if (!metadata) throw new Error(`${source.id}: missing explicit Grade 2 quality metadata`)
  return { ...source, ...metadata }
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

const grade2AlphaMissionTemplates: Grade2BaseMissionTemplate[] = [
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
    curriculumCode: '[2수03-02]',
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
    curriculumCode: '[2수01-06]',
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
    curriculumCode: '[2수01-06]',
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
    curriculumCode: '[2수03-10]',
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
    curriculumCode: '[2수03-11]',
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
    curriculumCode: '[2수03-11]',
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
    promptTemplate: '6 x 4의 값은 얼마일까요?',
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
    curriculumCode: '[2수03-13]',
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
    curriculumCode: '[2수03-11]',
    learnerGoal: '동치 길이 답안을 써요',
    parentSummaryTag: 'equivalent-length',
    promptTemplate: '120cm와 같은 길이를 m와 cm로 나타내면 얼마일까요?',
    answerType: 'length',
    answerConfig: lengthAnswerConfig,
    paramSchema: {},
    solverRule: '1m20cm',
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
    curriculumCode: '[2수02-01]',
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
    curriculumCode: '[2수02-01]',
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

const grade2BetaMissionTemplates: Grade2BaseMissionTemplate[] = [
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
    curriculumCode: '[2수03-02]',
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
    curriculumCode: '[2수01-06]',
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
    curriculumCode: '[2수01-06]',
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
    curriculumCode: '[2수03-10]',
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
    curriculumCode: '[2수03-11]',
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
    curriculumCode: '[2수03-11]',
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
    promptTemplate: '3 x 6의 값은 얼마일까요?',
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
    curriculumCode: '[2수03-13]',
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
    curriculumCode: '[2수03-11]',
    learnerGoal: '같은 길이를 바꾸어 써요',
    parentSummaryTag: 'equivalent-length',
    promptTemplate: '230cm와 같은 길이를 m와 cm로 나타내면 얼마일까요?',
    answerType: 'length',
    answerConfig: lengthAnswerConfig,
    paramSchema: {},
    solverRule: '2m30cm',
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
    curriculumCode: '[2수02-01]',
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
    curriculumCode: '[2수02-01]',
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

const grade2BaseMissionTemplates: Grade2BaseMissionTemplate[] = [
  ...grade2AlphaMissionTemplates,
  ...grade2BetaMissionTemplates,
]

export const grade2OfficialStandardText: Record<string, string> = {
  '[2수01-02]': '일, 십, 백, 천의 자릿값과 위치적 기수법을 이해하고, 네 자리 이하의 수를 읽고 쓸 수 있다.',
  '[2수01-03]': '네 자리 이하의 수의 범위에서 수의 계열을 이해하고, 수의 크기를 비교할 수 있다.',
  '[2수01-05]': '덧셈과 뺄셈이 이루어지는 실생활 상황과 연결하여 덧셈과 뺄셈의 의미를 이해한다.',
  '[2수01-06]': '두 자리 수의 범위에서 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.',
  '[2수01-07]': '덧셈과 뺄셈의 관계를 이해한다.',
  '[2수01-08]': '두 자리 수의 범위에서 세 수의 덧셈과 뺄셈을 할 수 있다.',
  '[2수01-09]': '□가 사용된 덧셈식과 뺄셈식을 만들고, □의 값을 구할 수 있다.',
  '[2수01-10]': '곱셈이 이루어지는 실생활 상황과 연결하여 곱셈의 의미를 이해한다.',
  '[2수01-11]': '곱셈구구를 이해하고, 한 자리 수의 곱셈을 할 수 있다.',
  '[2수02-01]': '물체, 무늬, 수 등의 배열에서 규칙을 찾아 여러 가지 방법으로 표현할 수 있다.',
  '[2수02-02]': '자신이 정한 규칙에 따라 물체, 무늬, 수 등을 배열할 수 있다.',
  '[2수03-01]': '교실 및 생활 주변에서 여러 가지 물건을 관찰하여 직육면체, 원기둥, 구의 모양을 찾고, 이를 이용하여 여러 가지 모양을 만들 수 있다.',
  '[2수03-02]': '쌓기나무를 이용하여 여러 가지 입체도형의 모양을 만들고, 그 모양에 대해 위치나 방향을 이용하여 말할 수 있다.',
  '[2수03-03]': '교실 및 생활 주변에서 여러 가지 물건을 관찰하여 삼각형, 사각형, 원의 모양을 찾고, 이를 이용하여 여러 가지 모양을 만들 수 있다.',
  '[2수03-04]': '삼각형, 사각형, 원을 직관적으로 이해하고, 그 모양을 그릴 수 있다.',
  '[2수03-05]': '삼각형, 사각형에서 각각의 공통점을 찾아 말할 수 있다.',
  '[2수03-06]': '구체물의 길이, 들이, 무게, 넓이를 비교하여 각각 ‘길다, 짧다’, ‘많다, 적다’, ‘무겁다, 가볍다’, ‘넓다, 좁다’ 등을 구별하여 말할 수 있다.',
  '[2수03-07]': '시계를 보고 시각을 ‘몇 시 몇 분’까지 읽을 수 있다.',
  '[2수03-08]': '1시간과 1분의 관계를 이해하고, 시간을 ‘시간’, ‘분’으로 표현할 수 있다.',
  '[2수03-09]': '실생활 문제 상황과 연결하여 1분, 1시간, 1일, 1주일, 1개월, 1년 사이의 관계를 이해한다.',
  '[2수03-10]': '길이 단위 1cm와 1m를 알고, 이를 이용하여 주변 사물의 길이를 측정할 수 있다.',
  '[2수03-11]': '1m와 1cm의 관계를 이해하고, 길이를 ‘몇 m 몇 cm’와 ‘몇 cm’로 표현할 수 있다.',
  '[2수03-12]': '여러 가지 물건의 길이를 어림하고, 길이에 대한 양감을 기른다.',
  '[2수03-13]': '실생활 문제 상황과 연결하여 길이의 덧셈과 뺄셈을 할 수 있다.',
  '[2수04-01]': '여러 가지 사물을 정해진 기준 또는 자신이 정한 기준으로 분류하여 개수를 세어 보고, 기준에 따른 결과를 말할 수 있다.',
  '[2수04-02]': '자료를 분류하여 표로 나타내고, 자료를 표로 나타내면 편리한 점을 말할 수 있다.',
  '[2수04-03]': '자료를 분류하여 ○, ×, / 등을 이용한 그래프로 나타내고, 자료를 그래프로 나타내면 편리한 점을 말할 수 있다.',
}

interface Grade2Authorship {
  curriculumCode: string
  cognitiveDomain: Grade2CognitiveDomain
}

function authored(
  curriculumCode: string,
  cognitiveDomain: Grade2CognitiveDomain,
): Grade2Authorship {
  return { curriculumCode, cognitiveDomain }
}

const grade2BasicAuthorshipById: Record<string, Grade2Authorship> = {
  'g2-1-place-value-01': authored('[2수01-02]', 'knowing'),
  'g2-1-place-value-02': authored('[2수01-03]', 'knowing'),
  'g2-1-place-value-03': authored('[2수01-02]', 'knowing'),
  'g2-1-place-value-04': authored('[2수01-02]', 'applying'),
  'g2-1-place-value-05': authored('[2수01-03]', 'applying'),
  'g2-1-place-value-06': authored('[2수01-02]', 'reasoning'),
  'g2-1-shapes-01': authored('[2수03-01]', 'knowing'),
  'g2-1-shapes-02': authored('[2수03-02]', 'knowing'),
  'g2-1-shapes-03': authored('[2수03-03]', 'knowing'),
  'g2-1-shapes-04': authored('[2수03-04]', 'knowing'),
  'g2-1-shapes-05': authored('[2수03-05]', 'knowing'),
  'g2-1-shapes-06': authored('[2수03-02]', 'reasoning'),
  'g2-1-add-sub-01': authored('[2수01-05]', 'knowing'),
  'g2-1-add-sub-02': authored('[2수01-06]', 'knowing'),
  'g2-1-add-sub-03': authored('[2수01-07]', 'knowing'),
  'g2-1-add-sub-04': authored('[2수01-08]', 'knowing'),
  'g2-1-add-sub-05': authored('[2수01-09]', 'knowing'),
  'g2-1-add-sub-06': authored('[2수01-05]', 'reasoning'),
  'g2-1-length-01': authored('[2수03-06]', 'knowing'),
  'g2-1-length-02': authored('[2수03-10]', 'knowing'),
  'g2-1-length-03': authored('[2수03-12]', 'knowing'),
  'g2-1-length-04': authored('[2수03-06]', 'applying'),
  'g2-1-length-05': authored('[2수03-11]', 'knowing'),
  'g2-1-length-06': authored('[2수03-11]', 'reasoning'),
  'g2-1-classification-01': authored('[2수04-01]', 'knowing'),
  'g2-1-classification-02': authored('[2수04-01]', 'knowing'),
  'g2-1-classification-03': authored('[2수04-01]', 'knowing'),
  'g2-1-classification-04': authored('[2수04-01]', 'applying'),
  'g2-1-classification-05': authored('[2수04-01]', 'applying'),
  'g2-1-classification-06': authored('[2수04-01]', 'reasoning'),
  'g2-1-multiplication-01': authored('[2수01-10]', 'knowing'),
  'g2-1-multiplication-02': authored('[2수01-10]', 'knowing'),
  'g2-1-multiplication-03': authored('[2수01-10]', 'knowing'),
  'g2-1-multiplication-04': authored('[2수01-10]', 'applying'),
  'g2-1-multiplication-05': authored('[2수01-10]', 'applying'),
  'g2-1-multiplication-06': authored('[2수01-10]', 'reasoning'),
  'g2-2-place-value-01': authored('[2수01-02]', 'knowing'),
  'g2-2-place-value-02': authored('[2수01-03]', 'knowing'),
  'g2-2-place-value-03': authored('[2수01-02]', 'knowing'),
  'g2-2-place-value-04': authored('[2수01-02]', 'applying'),
  'g2-2-place-value-05': authored('[2수01-03]', 'applying'),
  'g2-2-place-value-06': authored('[2수01-02]', 'reasoning'),
  'g2-2-facts-01': authored('[2수01-11]', 'knowing'),
  'g2-2-facts-02': authored('[2수01-11]', 'knowing'),
  'g2-2-facts-03': authored('[2수01-11]', 'knowing'),
  'g2-2-facts-04': authored('[2수01-11]', 'applying'),
  'g2-2-facts-05': authored('[2수01-11]', 'applying'),
  'g2-2-facts-06': authored('[2수01-11]', 'reasoning'),
  'g2-2-length-01': authored('[2수03-11]', 'knowing'),
  'g2-2-length-02': authored('[2수03-13]', 'knowing'),
  'g2-2-length-03': authored('[2수03-11]', 'knowing'),
  'g2-2-length-04': authored('[2수03-11]', 'applying'),
  'g2-2-length-05': authored('[2수03-13]', 'applying'),
  'g2-2-length-06': authored('[2수03-11]', 'reasoning'),
  'g2-2-time-01': authored('[2수03-07]', 'knowing'),
  'g2-2-time-02': authored('[2수03-08]', 'knowing'),
  'g2-2-time-03': authored('[2수03-09]', 'knowing'),
  'g2-2-time-04': authored('[2수03-07]', 'applying'),
  'g2-2-time-05': authored('[2수03-08]', 'knowing'),
  'g2-2-time-06': authored('[2수03-09]', 'reasoning'),
  'g2-2-table-graph-01': authored('[2수04-02]', 'knowing'),
  'g2-2-table-graph-02': authored('[2수04-03]', 'knowing'),
  'g2-2-table-graph-03': authored('[2수04-03]', 'knowing'),
  'g2-2-table-graph-04': authored('[2수04-02]', 'applying'),
  'g2-2-table-graph-05': authored('[2수04-03]', 'applying'),
  'g2-2-table-graph-06': authored('[2수04-03]', 'reasoning'),
  'g2-2-pattern-01': authored('[2수02-01]', 'knowing'),
  'g2-2-pattern-02': authored('[2수02-02]', 'knowing'),
  'g2-2-pattern-03': authored('[2수02-01]', 'knowing'),
  'g2-2-pattern-04': authored('[2수02-01]', 'applying'),
  'g2-2-pattern-05': authored('[2수02-01]', 'applying'),
  'g2-2-pattern-06': authored('[2수02-01]', 'reasoning'),
}

type Grade2ContentOverride = Partial<Omit<
  Grade2BaseMissionTemplate,
  'id' | 'unitId' | 'semester' | 'stageOrder' | 'unitMissionOrder' | 'rewardId' | 'curriculumCode'
>>

interface Grade2PracticeSpec extends Grade2Authorship, Grade2ContentOverride {
  promptTemplate: string
  solverRule: string
  visualConfig: Grade2VisualConfig
}

function practice(
  curriculumCode: string,
  cognitiveDomain: Grade2CognitiveDomain,
  promptTemplate: string,
  solverRule: string,
  visualConfig: Grade2VisualConfig,
  override: Grade2ContentOverride = {},
): Grade2PracticeSpec {
  return { curriculumCode, cognitiveDomain, promptTemplate, solverRule, visualConfig, ...override }
}

const grade2BasicContentOverrides: Partial<Record<string, Grade2ContentOverride>> = {
  'g2-1-shapes-02': { promptTemplate: '쌓기나무 그림에서 위층은 아래층의 어느 쪽에 있을까요?', solverRule: '위', answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['위', '아래', '옆'], visualModel: 'stack-cubes', visualConfig: { bottom: 4, top: 2 }, hintStepsTemplate: ['바닥에 닿은 층을 먼저 찾아요.', '그 층보다 높은 위치를 말해요.'], solutionStepsTemplate: ['아래층보다 높은 위치는 위예요.'], taskActions: ['interpret'] },
  'g2-1-shapes-03': { promptTemplate: '교통 표지판에서 찾을 수 있는 세 변의 평면도형은 무엇일까요?', solverRule: '삼각형', answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['삼각형', '사각형', '원'], visualModel: 'solid-shape-cards', visualConfig: { shapes: '삼각형,사각형,원', target: '삼각형', flat: true }, hintStepsTemplate: ['표지판의 곧은 변을 세어요.', '변이 세 개인 모양을 찾아요.'], solutionStepsTemplate: ['곧은 변이 세 개인 평면도형은 삼각형이에요.'], taskActions: ['recognize'] },
  'g2-1-shapes-04': { promptTemplate: '곧은 선 네 개를 이어 그릴 수 있는 모양은 무엇일까요?', solverRule: '사각형', choicesTemplate: ['사각형', '삼각형', '원'], visualConfig: { shapes: '사각형,삼각형,원', target: '사각형', flat: true }, hintStepsTemplate: ['곧은 선을 네 번 이어 보아요.', '변이 네 개인 모양을 찾아요.'], solutionStepsTemplate: ['곧은 변 네 개로 그리는 모양은 사각형이에요.'], taskActions: ['construct'] },
  'g2-1-shapes-05': { promptTemplate: '크기와 놓인 방향이 다른 삼각형 여러 개에서 찾을 수 있는 공통점은 무엇일까요?', solverRule: '변이 3개이고 꼭짓점이 3개예요', choicesTemplate: ['변이 3개이고 꼭짓점이 3개예요', '변이 4개이고 꼭짓점이 4개예요', '꼭짓점이 없어요'], visualConfig: { shapes: '삼각형,삼각형,삼각형', target: '삼각형 공통점' }, hintStepsTemplate: ['삼각형마다 둘레의 변을 세어요.', '변이 만나는 꼭짓점도 각각 세어요.'], solutionStepsTemplate: ['삼각형은 크기나 방향이 달라도 변이 3개이고 꼭짓점이 3개예요.'], taskActions: ['compare', 'explain'] },
  'g2-1-add-sub-01': { promptTemplate: '연필 38자루에 27자루를 더 놓았습니다. 모두 몇 자루일까요?', taskActions: ['model', 'calculate'] },
  'g2-1-add-sub-03': { promptTemplate: '28 + 19 = 47을 이용하면 47 - 19의 답은 얼마일까요?', solverRule: '28', visualConfig: { left: '?', operator: '+', right: 19, result: 47, missing: 'left' }, taskActions: ['reason'] },
  'g2-1-add-sub-04': { promptTemplate: '18 + 24 - 11의 계산 결과는 얼마일까요?', solverRule: '31', visualModel: 'pattern-strip', visualConfig: { pattern: '18,+24,-11,=,?' }, hintStepsTemplate: ['먼저 18과 24를 더해요.', '구한 합에서 11을 빼요.'], solutionStepsTemplate: ['18 + 24 = 42이고, 42 - 11 = 31이에요.'], taskActions: ['calculate'] },
  'g2-1-add-sub-05': { promptTemplate: '76 - □ = 34가 되도록 뺄셈식을 완성하세요.', solverRule: '42', visualModel: 'box-equation', visualConfig: { left: 76, operator: '-', right: '?', result: 34, missing: 'right' }, hintStepsTemplate: ['76에서 34가 남도록 덜어 낸 수를 찾아요.', '76 - 34로 빈칸을 확인해요.'], solutionStepsTemplate: ['76 - 34 = 42이므로 빈칸은 42예요.'], taskActions: ['construct', 'calculate'] },
  'g2-1-length-01': { promptTemplate: '자에 놓인 연필과 6cm 지우개를 비교했습니다. 더 긴 연필의 길이는 몇 cm일까요?', solverRule: '8cm', visualModel: 'ruler-line', visualConfig: { startCm: 0, endCm: 8, maxCm: 12, object: 'pencil' }, hintStepsTemplate: ['자의 0cm 눈금부터 연필 끝까지 읽어요.', '연필의 길이와 6cm인 지우개를 비교해요.'], solutionStepsTemplate: ['연필은 8cm이고 지우개는 6cm이므로, 더 긴 연필의 길이는 8cm예요.'], taskActions: ['measure', 'compare'] },
  'g2-1-length-02': { promptTemplate: '게시판의 긴 쪽을 1m 자와 20cm 자로 이어 재었습니다. 잰 길이는 모두 몇 cm일까요?', solverRule: '120cm', visualModel: 'length-bars', visualConfig: { leftLabel: '1m 자', leftCm: 100, rightLabel: '20cm 자', rightCm: 20, totalCm: 120 }, hintStepsTemplate: ['1m는 100cm예요.', '100cm와 20cm를 이어 더해요.'], solutionStepsTemplate: ['100cm + 20cm = 120cm이므로 잰 길이는 120cm예요.'], taskActions: ['measure'] },
  'g2-1-length-03': { promptTemplate: '교실 문의 높이로 가장 알맞게 어림한 값은 무엇일까요?', solverRule: '2m', choicesTemplate: ['2m', '20cm', '20m'], visualConfig: { leftLabel: '어림한 문 높이', leftCm: 200, rightLabel: '1m 기준', rightCm: 100, target: '2m' }, hintStepsTemplate: ['1m의 길이를 기준으로 생각해요.', '교실 문에는 1m가 대략 두 번 들어가요.'], solutionStepsTemplate: ['교실 문 높이의 어림값으로 2m가 알맞아요.'], taskActions: ['measure', 'reason'] },
  'g2-1-multiplication-01': { promptTemplate: '접시 4개에 귤을 3개씩 담았습니다. 귤은 모두 몇 개일까요?', taskActions: ['model', 'calculate'] },
  'g2-1-multiplication-05': { promptTemplate: '책장 3칸에 동화책을 4권씩 꽂았습니다. 동화책은 모두 몇 권일까요?', taskActions: ['model', 'calculate'] },
  'g2-2-facts-05': { promptTemplate: '구구표에서 곱이 32인 8단의 □를 찾으세요.', taskActions: ['interpret', 'calculate'] },
  'g2-2-time-02': { promptTemplate: '1시간은 모두 몇 분일까요?', solverRule: '60분', visualConfig: { hour: 1, minute: 0, endHour: 2, endMinute: 0 }, hintStepsTemplate: ['시계의 긴바늘이 한 바퀴 도는 시간을 생각해요.', '한 바퀴는 60분이에요.'], solutionStepsTemplate: ['1시간은 60분이에요.'], taskActions: ['interpret'] },
  'g2-2-table-graph-01': { learnerGoal: '원자료를 분류해 표를 완성해요', promptTemplate: '원자료 딸기, 포도, 딸기, 수박, 딸기, 포도를 종류별로 분류하여 표를 완성할 때 딸기 칸에 쓸 수는 얼마일까요?', solverRule: '3', visualConfig: { categories: '딸기,포도,수박', counts: '3,2,1', target: '딸기', countDisplay: 'marks' }, hintStepsTemplate: ['원자료에서 딸기만 하나씩 골라 표시해요.', '딸기 표식의 수를 세어 표의 빈칸을 채워요.'], solutionStepsTemplate: ['원자료의 딸기는 세 번 나오므로 딸기 칸에는 3을 써요.'], taskActions: ['classify', 'construct'] },
  'g2-2-table-graph-04': { learnerGoal: '표로 나타낼 때의 편리함을 설명해요', promptTemplate: '원자료를 종류별로 분류한 뒤 표로 나타내면 편리한 점은 무엇일까요?', solverRule: '종류별 개수를 한눈에 비교할 수 있어요', answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['종류별 개수를 한눈에 비교할 수 있어요', '물건의 무게를 알 수 있어요', '조사한 날짜가 바뀌어요'], visualConfig: { categories: '딸기,포도,수박', counts: '4,6,5', target: '' }, hintStepsTemplate: ['표의 행마다 종류와 개수가 함께 보이는지 살펴요.', '원자료를 하나씩 다시 세지 않아도 되는 점을 생각해요.'], solutionStepsTemplate: ['표로 나타내면 종류별 개수를 한눈에 비교할 수 있어 편리해요.'], taskActions: ['classify', 'explain'] },
  'g2-2-pattern-02': { learnerGoal: '내 규칙과 배열을 함께 구성해요', promptTemplate: '커지는 규칙을 직접 정해 수 배열을 완성하려고 합니다. 규칙과 배열이 바르게 짝지어진 것을 고르세요.', solverRule: '4씩 커지기: 3, 7, 11, 15', answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['4씩 커지기: 3, 7, 11, 15', '4씩 커지기: 3, 6, 9, 12', '3씩 커지기: 4, 8, 12, 16'], visualConfig: { pattern: '시작 수 3,내가 고른 규칙,?,?,?' }, hintStepsTemplate: ['보기에서 먼저 내가 사용할 규칙을 골라요.', '고른 규칙을 매번 똑같이 적용한 배열인지 확인해요.'], solutionStepsTemplate: ['4씩 커지기를 고르면 3에 4를 차례로 더해 3, 7, 11, 15를 구성해요.'], taskActions: ['construct', 'explain'] },
}

export const grade2OfficialContentPairs = [
  ['[2수01-02]', 'g2-2-place-value', 'g2-2-place-value-01', 'g2-2-place-value-03-v1'],
  ['[2수01-03]', 'g2-2-place-value', 'g2-2-place-value-02', 'g2-2-place-value-04-v1'],
  ['[2수01-05]', 'g2-1-add-sub', 'g2-1-add-sub-01', 'g2-1-add-sub-01-v1'],
  ['[2수01-06]', 'g2-1-add-sub', 'g2-1-add-sub-02', 'g2-1-add-sub-02-v1'],
  ['[2수01-07]', 'g2-1-add-sub', 'g2-1-add-sub-03', 'g2-1-add-sub-03-v1'],
  ['[2수01-08]', 'g2-1-add-sub', 'g2-1-add-sub-04', 'g2-1-add-sub-04-v1'],
  ['[2수01-09]', 'g2-1-add-sub', 'g2-1-add-sub-05', 'g2-1-add-sub-05-v1'],
  ['[2수01-10]', 'g2-1-multiplication', 'g2-1-multiplication-01', 'g2-1-multiplication-03-v1'],
  ['[2수01-11]', 'g2-2-facts', 'g2-2-facts-01', 'g2-2-facts-03-v1'],
  ['[2수02-01]', 'g2-2-pattern', 'g2-2-pattern-01', 'g2-2-pattern-03-v1'],
  ['[2수02-02]', 'g2-2-pattern', 'g2-2-pattern-02', 'g2-2-pattern-04-v1'],
  ['[2수03-01]', 'g2-1-shapes', 'g2-1-shapes-01', 'g2-1-shapes-01-v1'],
  ['[2수03-02]', 'g2-1-shapes', 'g2-1-shapes-02', 'g2-1-shapes-02-v1'],
  ['[2수03-03]', 'g2-1-shapes', 'g2-1-shapes-03', 'g2-1-shapes-03-v1'],
  ['[2수03-04]', 'g2-1-shapes', 'g2-1-shapes-04', 'g2-1-shapes-04-v1'],
  ['[2수03-05]', 'g2-1-shapes', 'g2-1-shapes-05', 'g2-1-shapes-05-v1'],
  ['[2수03-06]', 'g2-1-length', 'g2-1-length-01', 'g2-1-length-04-v1'],
  ['[2수03-07]', 'g2-2-time', 'g2-2-time-01', 'g2-2-time-04-v1'],
  ['[2수03-08]', 'g2-2-time', 'g2-2-time-02', 'g2-2-time-02-v1'],
  ['[2수03-09]', 'g2-2-time', 'g2-2-time-03', 'g2-2-time-03-v1'],
  ['[2수03-10]', 'g2-1-length', 'g2-1-length-02', 'g2-1-length-02-v1'],
  ['[2수03-11]', 'g2-2-length', 'g2-2-length-01', 'g2-2-length-03-v1'],
  ['[2수03-12]', 'g2-1-length', 'g2-1-length-03', 'g2-1-length-03-v1'],
  ['[2수03-13]', 'g2-2-length', 'g2-2-length-02', 'g2-2-length-04-v1'],
  ['[2수04-01]', 'g2-1-classification', 'g2-1-classification-01', 'g2-1-classification-03-v1'],
  ['[2수04-02]', 'g2-2-table-graph', 'g2-2-table-graph-01', 'g2-2-table-graph-03-v1'],
  ['[2수04-03]', 'g2-2-table-graph', 'g2-2-table-graph-02', 'g2-2-table-graph-04-v1'],
].map(([standardCode, unitId, basicMissionId, applyingMissionId]) => ({
  standardCode,
  unitId,
  basicMissionId,
  applyingMissionId,
  officialText: grade2OfficialStandardText[standardCode],
}))

const grade2PracticeSpecsBySourceId: Record<string, Grade2PracticeSpec> = {
  'g2-1-place-value-01': practice('[2수01-02]', 'knowing', '백 모형 4개, 십 모형 3개, 일 모형 5개로 만든 수를 쓰세요.', '435', { number: 435, hundreds: 4, tens: 3, ones: 5 }, { taskActions: ['construct'] }),
  'g2-1-place-value-02': practice('[2수01-03]', 'knowing', '수 카드 446, 500, 426을 작은 수부터 배열할 때 첫 번째 수를 고르세요.', '426', { cards: '446,500,426', target: 426, mode: 'compare' }, { learnerGoal: '세 수를 작은 수부터 배열해요', choicesTemplate: ['426', '446', '500'], taskActions: ['construct', 'compare'] }),
  'g2-1-place-value-03': practice('[2수01-02]', 'applying', '678에서 십의 자리 숫자 7이 나타내는 값은 얼마일까요?', '70', { parts: '600,70,8', target: 70, mode: 'expanded' }, { taskActions: ['interpret'] }),
  'g2-1-place-value-04': practice('[2수01-03]', 'applying', '252보다 100만큼 큰 수를 자리값 모형으로 만든 결과를 쓰세요.', '352', { number: 352, hundreds: 3, tens: 5, ones: 2 }, { taskActions: ['reason'] }),
  'g2-1-place-value-05': practice('[2수01-02]', 'applying', '712를 백, 십, 일의 값으로 바르게 나타낸 것은 무엇일까요?', '700과 10과 2', { cards: '700과 10과 2,700과 12,70과 12', target: '700과 10과 2', mode: 'compare' }, { choicesTemplate: ['700과 10과 2', '700과 12', '70과 12'], taskActions: ['model'] }),
  'g2-1-place-value-06': practice('[2수01-03]', 'reasoning', '백의 자리와 일의 자리를 바꾸어 845보다 작은 수를 만드세요.', '548', { parts: '500,40,8', target: 548, mode: 'expanded' }, { taskActions: ['reason'] }),

  'g2-1-shapes-01': practice('[2수03-01]', 'applying', '휴지 심과 닮은 모양을 골라 연필꽂이를 만들려고 합니다. 알맞은 입체도형은 무엇일까요?', '원기둥', { shapes: '구,원기둥,직육면체', target: '원기둥' }, { choicesTemplate: ['구', '원기둥', '직육면체'], taskActions: ['model'] }),
  'g2-1-shapes-02': practice('[2수03-02]', 'applying', '쌓기나무 그림에서 아래층 바로 위에 있는 층을 무엇이라고 말할까요?', '위층', { bottom: 5, top: 3 }, { answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['위층', '아래층', '옆층'], visualModel: 'stack-cubes', taskActions: ['interpret'] }),
  'g2-1-shapes-03': practice('[2수03-03]', 'applying', '삼각 깃발과 같은 모양을 이용해 꾸미려면 어떤 평면도형을 고를까요?', '삼각형', { shapes: '삼각형,사각형,원', target: '삼각형', flat: true }, { answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['삼각형', '사각형', '원'], visualModel: 'solid-shape-cards', taskActions: ['model'] }),
  'g2-1-shapes-04': practice('[2수03-04]', 'applying', '둥근 선 하나로 그릴 수 있고 꼭짓점이 없는 모양은 무엇일까요?', '원', { shapes: '원,삼각형,사각형', target: '원', flat: true }, { choicesTemplate: ['원', '삼각형', '사각형'], taskActions: ['construct'] }),
  'g2-1-shapes-05': practice('[2수03-05]', 'applying', '크기와 놓인 방향이 다른 사각형 여러 개에서 찾을 수 있는 공통점은 무엇일까요?', '변이 4개이고 꼭짓점이 4개예요', { shapes: '사각형,사각형,사각형', target: '사각형 공통점' }, { learnerGoal: '여러 사각형의 공통점을 설명해요', choicesTemplate: ['변이 4개이고 꼭짓점이 4개예요', '변이 3개이고 꼭짓점이 3개예요', '꼭짓점이 없어요'], taskActions: ['compare', 'explain'] }),
  'g2-1-shapes-06': practice('[2수03-02]', 'reasoning', '위층 쌓기나무 3개를 아래층으로 옮기면 아래층은 모두 몇 개가 될까요?', '8', { bottom: 5, top: 3 }, { taskActions: ['reason'] }),

  'g2-1-add-sub-01': practice('[2수01-05]', 'applying', '도서관 그림책이 45권에서 74권이 되었습니다. 더 들어온 그림책은 몇 권일까요?', '29', { left: 45, operator: '+', right: '?', result: 74, missing: 'right' }, { learnerGoal: '덧셈 상황의 늘어난 양을 역으로 구해요', visualModel: 'box-equation', taskActions: ['model', 'reason'] }),
  'g2-1-add-sub-02': practice('[2수01-06]', 'applying', '60 - □ = 29가 되도록 받아내림 뺄셈의 빈칸을 구하세요.', '31', { left: 60, operator: '-', right: '?', result: 29, missing: 'right' }, { learnerGoal: '받아내림 결과로 빼는 수를 구해요', visualModel: 'box-equation', taskActions: ['construct', 'calculate'] }),
  'g2-1-add-sub-03': practice('[2수01-07]', 'applying', '54 - 23 = 31과 같은 관계를 나타내는 덧셈식을 고르세요.', '31 + 23 = 54', { pattern: '54,-23,=31,짝이 되는 덧셈식,?' }, { learnerGoal: '뺄셈과 짝이 되는 덧셈식을 설명해요', answerType: 'choice', answerConfig: choiceAnswerConfig, choicesTemplate: ['31 + 23 = 54', '54 + 23 = 31', '31 - 23 = 54'], visualModel: 'pattern-strip', taskActions: ['model', 'explain'] }),
  'g2-1-add-sub-04': practice('[2수01-08]', 'applying', '선물 46개 중 12개를 나누고 25개를 더 받았습니다. 46 - 12 + 25를 계산하면 몇 개일까요?', '59', { pattern: '46,-12,+25,=,?' }, { visualModel: 'pattern-strip', taskActions: ['model', 'calculate'] }),
  'g2-1-add-sub-05': practice('[2수01-09]', 'applying', '□ + 37 = 87이 되도록 덧셈식의 □ 값을 구하세요.', '50', { left: '?', operator: '+', right: 37, result: 87, missing: 'left' }, { learnerGoal: '덧셈식의 처음 수를 역관계로 구해요', visualModel: 'box-equation', taskActions: ['reason', 'calculate'] }),
  'g2-1-add-sub-06': practice('[2수01-07]', 'reasoning', '□ - 23 = 24를 덧셈식으로 바꾸어 □의 값을 설명하세요.', '47', { left: '?', operator: '-', right: 23, result: 24, missing: 'left' }, { visualModel: 'box-equation', taskActions: ['explain', 'reason'] }),

  'g2-1-length-01': practice('[2수03-10]', 'knowing', '자의 1cm 눈금에서 시작해 10cm 눈금까지 닿은 붓의 길이는 몇 cm일까요?', '9cm', { startCm: 1, endCm: 10, maxCm: 12, object: 'brush' }, { taskActions: ['measure'] }),
  'g2-1-length-02': practice('[2수03-10]', 'applying', '리본을 자에 맞추어 재었더니 35cm였습니다. 이 길이를 cm로 쓰세요.', '35cm', { startCm: 0, endCm: 35, maxCm: 40, object: 'ribbon' }, { visualModel: 'ruler-line', taskActions: ['measure'] }),
  'g2-1-length-03': practice('[2수03-12]', 'applying', '필통의 길이를 어림한 값으로 가장 알맞은 것은 무엇일까요?', '20cm', { leftLabel: '어림 20cm', leftCm: 20, rightLabel: '1m 기준', rightCm: 100, target: '20cm' }, { choicesTemplate: ['20cm', '2m', '20m'], taskActions: ['measure', 'reason'] }),
  'g2-1-length-04': practice('[2수03-06]', 'applying', '두 막대를 직접 맞대어 보았습니다. 더 짧은 막대는 무엇일까요?', '주황 막대', { leftLabel: '파란 막대', leftCm: 8, rightLabel: '주황 막대', rightCm: 6, target: '주황 막대' }, { answerType: 'choice', answerConfig: choiceAnswerConfig, choicesTemplate: ['주황 막대', '파란 막대', '길이가 같아요'], visualModel: 'length-bars', taskActions: ['compare'] }),
  'g2-1-length-05': practice('[2수03-11]', 'reasoning', '1m 자를 두 번 이어 놓으면 전체 길이는 몇 cm일까요?', '200cm', { leftLabel: '1m 자', leftCm: 100, rightLabel: '1m 자', rightCm: 100, totalCm: 200 }, { taskActions: ['model', 'reason'] }),
  'g2-1-length-06': practice('[2수03-12]', 'applying', '책상 너비를 1m 22cm로 어림하고 재어 보니 1m 9cm였습니다. 어림한 길이는 실제보다 몇 cm 길까요?', '13cm', { leftLabel: '어림 1m 22cm', leftCm: 122, rightLabel: '실제 1m 9cm', rightCm: 109, totalCm: 13 }, { answerType: 'length', answerConfig: centimeterLengthAnswerConfig, choicesTemplate: undefined, taskActions: ['compare', 'calculate'] }),

  'g2-1-classification-01': practice('[2수04-01]', 'knowing', '빨강·파랑·노랑 단추를 나눈 기준으로 알맞은 것을 고르세요.', '색깔', { categories: '빨강,파랑,노랑', counts: '5,3,2', target: '', countDisplay: 'marks' }, { learnerGoal: '분류 결과에서 사용한 기준을 설명해요', answerType: 'choice', answerConfig: choiceAnswerConfig, choicesTemplate: ['색깔', '크기', '쓰임새'], taskActions: ['classify', 'explain'] }),
  'g2-1-classification-02': practice('[2수04-01]', 'knowing', '장난감을 쓰임새 기준으로 분류했습니다. 가장 많은 무리는 무엇일까요?', '동물', { categories: '동물,탈것,과일', counts: '7,4,6', target: '동물', countDisplay: 'marks' }, { choicesTemplate: ['동물', '탈것', '과일'], taskActions: ['classify'] }),
  'g2-1-classification-03': practice('[2수04-01]', 'applying', '과일을 내가 정한 “씨가 보이는가” 기준으로 나눈 뒤 사과와 배의 수 차를 구하세요.', '3', { categories: '사과,배,귤', counts: '7,4,3', target: '사과-배', countDisplay: 'marks' }, { taskActions: ['classify', 'calculate'] }),
  'g2-1-classification-04': practice('[2수04-01]', 'applying', '학용품을 색깔별로 다시 분류했습니다. 노란 학용품은 몇 개일까요?', '5', { categories: '빨강,파랑,노랑', counts: '2,4,5', target: '노랑', countDisplay: 'marks' }, { taskActions: ['classify', 'interpret'] }),
  'g2-1-classification-05': practice('[2수04-01]', 'applying', '그림 카드를 생물과 탈것과 먹을거리로 나누었습니다. 가장 적은 무리를 고르세요.', '탈것', { categories: '동물,탈것,과일', counts: '5,3,6', target: '탈것', countDisplay: 'marks' }, { choicesTemplate: ['동물', '탈것', '과일'], taskActions: ['classify', 'compare'] }),
  'g2-1-classification-06': practice('[2수04-01]', 'reasoning', '파란 블록과 노란 블록의 수가 같아지려면 노란 블록을 몇 개 더 놓아야 할까요?', '4', { categories: '빨강,파랑,노랑', counts: '3,7,3', target: '파랑-노랑', countDisplay: 'marks' }, { taskActions: ['reason', 'calculate'] }),

  'g2-1-multiplication-01': practice('[2수01-10]', 'knowing', '화분이 5개 있습니다. 화분마다 꽃을 3송이씩 심을 때 알맞은 곱셈식과 꽃 수를 짝지은 것을 고르세요.', '5 x 3 = 15', { groups: 5, each: 3, rows: 5, cols: 3 }, { learnerGoal: '같은 수 묶음을 곱셈식과 전체 수로 설명해요', answerType: 'choice', answerConfig: choiceAnswerConfig, choicesTemplate: ['5 x 3 = 15', '3 x 3 = 9', '5 + 3 = 8'], taskActions: ['model', 'explain'] }),
  'g2-1-multiplication-02': practice('[2수01-10]', 'knowing', '의자 3줄에 학생이 6명씩 앉았습니다. 학생은 모두 몇 명일까요?', '18', { rows: 3, cols: 6, groups: 3, each: 6 }, { taskActions: ['model', 'calculate'] }),
  'g2-1-multiplication-03': practice('[2수01-10]', 'applying', '접시 4개에 쿠키를 5개씩 담았습니다. 이 상황과 같은 반복 덧셈식을 고르세요.', '5 + 5 + 5 + 5', { groups: 4, each: 5, rows: 4, cols: 5 }, { learnerGoal: '곱셈 상황을 반복 덧셈으로 설명해요', choicesTemplate: ['5 + 5 + 5 + 5', '5 + 5 + 5', '4 + 5'], taskActions: ['model', 'explain'] }),
  'g2-1-multiplication-04': practice('[2수01-10]', 'applying', '연필 3자루씩 들어 있는 봉지가 6개 있습니다. 연필은 모두 몇 자루일까요?', '18', { groups: 6, each: 3, rows: 6, cols: 3 }, { taskActions: ['model', 'calculate'] }),
  'g2-1-multiplication-05': practice('[2수01-10]', 'applying', '한 줄에 창문이 5개씩 있는 건물이 4줄입니다. 화분 20개를 하나씩 놓을 때 알맞은 계산을 고르세요.', '4 x 5 = 20, 남는 화분은 0개', { rows: 4, cols: 5, groups: 4, each: 5, available: 20 }, { learnerGoal: '배열의 전체 수와 준비한 수를 비교해요', answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['4 x 5 = 20, 남는 화분은 0개', '4 + 5 = 9, 남는 화분은 11개', '5 x 5 = 25, 화분은 5개 부족'], taskActions: ['model', 'compare', 'calculate'] }),
  'g2-1-multiplication-06': practice('[2수01-10]', 'reasoning', '5줄에 6개씩 놓인 배열을 줄 수와 한 줄의 수를 바꾸어도 전체가 같은 까닭을 고르세요.', '6 x 5', { groups: 5, each: 6, rows: 5, cols: 6 }, { answerType: 'choice', answerConfig: choiceAnswerConfig, choicesTemplate: ['6 x 5', '6 + 5', '5 + 5'], taskActions: ['reason'] }),

  'g2-2-place-value-01': practice('[2수01-02]', 'knowing', '천 모형 2개, 백 모형 6개, 십 모형 6개, 일 모형 8개로 만든 수를 쓰세요.', '2668', { number: 2668, thousands: 2, hundreds: 6, tens: 6, ones: 8 }, { taskActions: ['construct'] }),
  'g2-2-place-value-02': practice('[2수01-03]', 'knowing', '수 카드 3430, 3160, 3032를 큰 수부터 배열할 때 첫 번째 수를 고르세요.', '3430', { cards: '3430,3160,3032', target: 3430, mode: 'compare' }, { learnerGoal: '세 네 자리 수를 큰 수부터 배열해요', choicesTemplate: ['3430', '3160', '3032'], taskActions: ['construct', 'compare'] }),
  'g2-2-place-value-03': practice('[2수01-02]', 'applying', '7539에서 백의 자리 숫자 5가 나타내는 값은 얼마일까요?', '500', { parts: '7000,500,30,9', target: 500, mode: 'expanded' }, { taskActions: ['interpret'] }),
  'g2-2-place-value-04': practice('[2수01-03]', 'applying', '4350보다 1000만큼 작은 수를 자리값 모형으로 만든 결과를 쓰세요.', '3350', { number: 3350, thousands: 3, hundreds: 3, tens: 5, ones: 0 }, { taskActions: ['reason'] }),
  'g2-2-place-value-05': practice('[2수01-02]', 'applying', '5821을 천, 백, 십, 일의 값으로 나타낸 것을 고르세요.', '5000과 800과 20과 1', { cards: '5000과 800과 20과 1,5000과 821,5800과 21', target: '5000과 800과 20과 1', mode: 'compare' }, { choicesTemplate: ['5000과 800과 20과 1', '5000과 821', '5800과 21'], taskActions: ['model'] }),
  'g2-2-place-value-06': practice('[2수01-03]', 'reasoning', '4, 8, 7, 0을 한 번씩 써서 4870보다 작은 수 중 가장 큰 수를 만드세요.', '4807', { parts: '4000,800,7', target: 4807, mode: 'expanded' }, { taskActions: ['construct', 'reason'] }),

  'g2-2-facts-01': practice('[2수01-11]', 'knowing', '7 x □ = 28에서 □에 들어갈 수를 구하세요.', '4', { dan: 7, factor: 4, product: 28, missing: 'factor' }, { learnerGoal: '곱을 보고 곱하는 수를 찾아요', taskActions: ['interpret', 'calculate'] }),
  'g2-2-facts-02': practice('[2수01-11]', 'knowing', '8 x □ = 48에서 □에 들어갈 곱하는 수를 쓰세요.', '6', { dan: 8, factor: 6, product: 48, missing: 'factor' }, { taskActions: ['interpret'] }),
  'g2-2-facts-03': practice('[2수01-11]', 'applying', '5줄에 8개씩인 배열을 돌려 보아도 전체 수가 같은 곱셈식을 고르세요.', '8 x 5', { rows: 5, cols: 8, groups: 5, each: 8 }, { learnerGoal: '돌린 배열의 곱셈식을 설명해요', choicesTemplate: ['8 x 5', '8 + 5', '5 x 5'], visualModel: 'array-groups', taskActions: ['reason', 'explain'] }),
  'g2-2-facts-04': practice('[2수01-11]', 'applying', '“4 x 7 = 24”라고 계산한 친구의 오류를 고쳐 올바른 곱을 쓰세요.', '28', { dan: 4, factor: 7, product: 28 }, { learnerGoal: '구구 계산 오류를 찾아 고쳐요', taskActions: ['analyze_error', 'calculate'] }),
  'g2-2-facts-05': practice('[2수01-11]', 'applying', '9씩 몇 번 더하면 36이 되는지 9 x □ = 36의 빈칸을 채우세요.', '4', { dan: 9, factor: 4, product: 36, missing: 'factor' }, { taskActions: ['model', 'calculate'] }),
  'g2-2-facts-06': practice('[2수01-11]', 'reasoning', '6줄에 8개인 배열과 전체가 같은 곱셈식을 고르세요.', '8 x 6', { rows: 6, cols: 8, groups: 6, each: 8 }, { answerType: 'choice', answerConfig: choiceAnswerConfig, choicesTemplate: ['8 x 6', '8 + 6', '6 + 6'], visualModel: 'array-groups', taskActions: ['reason'] }),

  'g2-2-length-01': practice('[2수03-11]', 'knowing', '185cm를 몇 m 몇 cm로 바꾸어 쓰세요.', '1m85cm', { leftLabel: '185cm', leftCm: 185, rightLabel: '1m 85cm', rightCm: 185, totalCm: 185, hideRightLabelUntilReveal: true }, { answerConfig: lengthAnswerConfig, taskActions: ['interpret'] }),
  'g2-2-length-02': practice('[2수03-13]', 'knowing', '2m 10cm 리본에서 55cm를 잘랐습니다. 남은 길이는 몇 cm일까요?', '155cm', { leftLabel: '2m 10cm', leftCm: 210, rightLabel: '55cm', rightCm: 55, totalCm: 155, operation: 'subtract' }, { answerConfig: centimeterLengthAnswerConfig, taskActions: ['model', 'calculate'] }),
  'g2-2-length-03': practice('[2수03-11]', 'applying', '130cm 높이의 화분 받침을 m와 cm로 나타내세요.', '1m30cm', { leftLabel: '130cm', leftCm: 130, rightLabel: '1m 30cm', rightCm: 130, totalCm: 130, hideRightLabelUntilReveal: true }, { taskActions: ['interpret'] }),
  'g2-2-length-04': practice('[2수03-13]', 'applying', '1m 20cm 끈과 35cm 끈을 이어 만든 전체 길이는 몇 cm일까요?', '155cm', { leftLabel: '1m 20cm', leftCm: 120, rightLabel: '35cm', rightCm: 35, totalCm: 155 }, { answerConfig: centimeterLengthAnswerConfig, taskActions: ['model', 'calculate'] }),
  'g2-2-length-05': practice('[2수03-11]', 'applying', '1m 90cm와 같은 길이를 cm만 사용해 나타내세요.', '190cm', { leftLabel: '1m 90cm', leftCm: 190, rightLabel: '190cm', rightCm: 190, totalCm: 190, hideRightLabelUntilReveal: true }, { taskActions: ['interpret'] }),
  'g2-2-length-06': practice('[2수03-13]', 'reasoning', '240cm 줄에서 70cm를 자르고 30cm를 이었습니다. 줄의 길이는 몇 cm일까요?', '200cm', { leftLabel: '240cm - 70cm', leftCm: 170, rightLabel: '+ 30cm', rightCm: 30, totalCm: 200 }, { answerConfig: centimeterLengthAnswerConfig, taskActions: ['reason', 'calculate'] }),

  'g2-2-time-01': practice('[2수03-07]', 'knowing', '시계를 4시 6분이라고 읽은 친구의 오류를 고쳐 올바른 시각을 고르세요.', '4시 30분', { hour: 4, minute: 30 }, { learnerGoal: '분침을 잘못 읽은 시각을 고쳐요', answerType: 'choice', answerConfig: choiceAnswerConfig, choicesTemplate: ['4시 30분', '4시 6분', '6시 20분'], taskActions: ['analyze_error', 'explain'] }),
  'g2-2-time-02': practice('[2수03-08]', 'applying', '1시간 20분은 모두 몇 분일까요?', '80분', { hour: 1, minute: 0, endHour: 2, endMinute: 20 }, { taskActions: ['interpret', 'calculate'] }),
  'g2-2-time-03': practice('[2수03-09]', 'applying', '여름 방학 달력에서 2주 동안 지난 날은 모두 며칠일까요?', '14', { days: '월,화,수,목,금,토,일,월,화,수,목,금,토,일', target: 14 }, { taskActions: ['model', 'calculate'] }),
  'g2-2-time-04': practice('[2수03-07]', 'applying', '분침이 9를 가리키고 시침이 6과 7 사이에 있는 시각을 고르세요.', '6시 45분', { hour: 6, minute: 45 }, { learnerGoal: '시곗바늘 위치를 시각으로 설명해요', answerType: 'choice', answerConfig: choiceAnswerConfig, choicesTemplate: ['6시 45분', '9시 30분', '6시 9분'], taskActions: ['interpret', 'explain'] }),
  'g2-2-time-05': practice('[2수03-08]', 'reasoning', '4시 20분에서 35분 뒤의 시각은 몇 시 몇 분일까요?', '4:55', { hour: 4, minute: 20, endHour: 4, endMinute: 55 }, { answerType: 'time-of-day', answerConfig: timeOfDayAnswerConfig, taskActions: ['reason', 'calculate'] }),
  'g2-2-time-06': practice('[2수03-09]', 'applying', '도서 대여 기간 3주는 모두 며칠인지 계산하세요.', '21', { days: '월,화,수,목,금,토,일,월,화,수,목,금,토,일,월,화,수,목,금,토,일', target: 21 }, { taskActions: ['model', 'calculate'] }),

  'g2-2-table-graph-01': practice('[2수04-02]', 'knowing', '과일 원자료를 종류별로 분류해 표로 나타내면 편리한 점을 고르세요.', '종류별 개수를 한눈에 비교할 수 있어요', { categories: '딸기,포도,수박', counts: '7,4,5', target: '' }, { learnerGoal: '원자료와 표를 비교해 편리함을 설명해요', answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['종류별 개수를 한눈에 비교할 수 있어요', '과일의 맛을 알 수 있어요', '조사 인원이 늘어나요'], taskActions: ['classify', 'explain'] }),
  'g2-2-table-graph-02': practice('[2수04-03]', 'knowing', '운동 선호 자료를 막대 표식으로 나타낸 그래프에서 가장 적은 종목을 고르세요.', '축구', { categories: '축구,야구,피구', counts: '5,8,6', target: '축구' }, { choicesTemplate: ['축구', '야구', '피구'], taskActions: ['interpret', 'compare'] }),
  'g2-2-table-graph-03': practice('[2수04-02]', 'applying', '원자료 축구, 야구, 야구, 피구, 야구, 축구를 종목별로 분류해 표를 완성할 때 야구는 몇 개일까요?', '3', { categories: '축구,야구,피구', counts: '2,3,1', target: '야구', countDisplay: 'marks' }, { learnerGoal: '운동 원자료를 분류해 표를 완성해요', visualModel: 'classification-table', taskActions: ['classify', 'construct'] }),
  'g2-2-table-graph-04': practice('[2수04-03]', 'applying', '과일 조사 자료를 표식 그래프로 옮겼습니다. 포도 표식은 몇 개 그려야 할까요?', '6', { categories: '딸기,포도,수박', counts: '7,6,5', target: '포도' }, { taskActions: ['construct', 'interpret'] }),
  'g2-2-table-graph-05': practice('[2수04-02]', 'applying', '표에서 바로 찾기 편리한 정보로 알맞은 것은 무엇일까요?', '종목별 친구 수', { categories: '축구,야구,피구', counts: '5,8,6', target: '야구' }, { answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['종목별 친구 수', '친구의 키', '운동 시간'], taskActions: ['explain'] }),
  'g2-2-table-graph-06': practice('[2수04-03]', 'reasoning', '그래프에서 피구 표식 2개를 축구로 옮기면 두 종목의 표식 수는 어떻게 될까요?', '같아져요', { categories: '축구,야구,피구', counts: '4,6,8', target: '' }, { answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['같아져요', '피구가 더 많아요', '축구가 더 많아요'], taskActions: ['reason'] }),

  'g2-2-pattern-01': practice('[2수02-01]', 'knowing', '파랑, 빨강이 번갈아 나오는 무늬를 말로 표현한 규칙을 고르세요.', '파랑과 빨강이 번갈아 나와요', { pattern: '파랑,빨강,파랑,빨강,?' }, { choicesTemplate: ['파랑과 빨강이 번갈아 나와요', '파랑만 반복해요', '빨강 두 개 뒤 파랑이 와요'], taskActions: ['explain'] }),
  'g2-2-pattern-02': practice('[2수02-02]', 'knowing', '색 무늬의 반복 규칙을 직접 정해 배열하려고 합니다. 내가 고른 규칙과 배열이 바르게 짝지어진 것을 고르세요.', '노랑 뒤 초록 두 개: 노랑, 초록, 초록, 노랑, 초록, 초록', { pattern: '내가 고른 색 규칙,노랑,초록,초록,노랑,?,?' }, { learnerGoal: '내 색 반복 규칙으로 무늬 배열을 구성해요', answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['노랑 뒤 초록 두 개: 노랑, 초록, 초록, 노랑, 초록, 초록', '노랑 뒤 초록 두 개: 노랑, 초록, 노랑, 초록, 노랑, 초록', '노랑과 초록 번갈기: 노랑, 초록, 초록, 노랑, 초록, 초록'], taskActions: ['construct', 'compare', 'explain'] }),
  'g2-2-pattern-03': practice('[2수02-01]', 'applying', '운동 횟수가 날마다 6회씩 늘어납니다. 6, 12, 18, 24 다음 횟수는 얼마일까요?', '30', { dan: 6, factor: 5, product: 30, sequence: '6,12,18,24,?' }, { taskActions: ['model', 'reason'] }),
  'g2-2-pattern-04': practice('[2수02-02]', 'applying', '반복 규칙을 직접 정해 무늬 배열을 완성하려고 합니다. 내가 고른 규칙과 배열이 바르게 짝지어진 것을 고르세요.', '빨강 하나 뒤 파랑 두 개: 빨강, 파랑, 파랑, 빨강, 파랑, 파랑', { pattern: '내가 고른 규칙,빨강,파랑,파랑,빨강,?,?' }, { learnerGoal: '내 반복 규칙으로 무늬 배열을 구성해요', choicesTemplate: ['빨강 하나 뒤 파랑 두 개: 빨강, 파랑, 파랑, 빨강, 파랑, 파랑', '빨강 하나 뒤 파랑 두 개: 빨강, 파랑, 빨강, 파랑, 빨강, 파랑', '빨강과 파랑 번갈기: 빨강, 파랑, 파랑, 빨강, 파랑, 파랑'], taskActions: ['construct', 'explain'] }),
  'g2-2-pattern-05': practice('[2수02-01]', 'applying', '버스 번호 배열 8, 17, 26, 35에서 찾은 변화 규칙은 무엇일까요?', '9씩 커져요', { pattern: '8,17,26,35,?' }, { answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['9씩 커져요', '8씩 커져요', '10씩 커져요'], taskActions: ['explain'] }),
  'g2-2-pattern-06': practice('[2수02-02]', 'reasoning', '수 규칙을 직접 정해 배열을 만들려고 합니다. 규칙과 완성한 배열이 바르게 짝지어진 것을 고르세요.', '5씩 커지기: 5, 10, 15, 20, 25, 30', { pattern: '시작 수 5,내가 고른 규칙,?,?,?,?' }, { learnerGoal: '내 규칙으로 긴 수 배열을 만들고 검토해요', answerType: 'label', answerConfig: labelAnswerConfig, choicesTemplate: ['5씩 커지기: 5, 10, 15, 20, 25, 30', '4씩 커지기: 5, 10, 15, 20, 25, 30', '5씩 커지기: 5, 9, 13, 17, 21, 25'], visualModel: 'pattern-strip', taskActions: ['construct', 'reason'] }),
}

interface Grade2PracticeFeedback {
  hintStepsTemplate: [string, ...string[]]
  solutionStepsTemplate: [string, ...string[]]
}

function feedback(hint: string, solution: string): Grade2PracticeFeedback {
  return { hintStepsTemplate: [hint], solutionStepsTemplate: [solution] }
}

const grade2PracticeFeedbackBySourceId: Record<string, Grade2PracticeFeedback> = {
  'g2-1-place-value-01': feedback('백 모형, 십 모형, 일 모형의 개수를 각 자리에 써요.', '백이 4개, 십이 3개, 일이 5개이므로 만든 수는 435예요.'),
  'g2-1-place-value-02': feedback('백의 자리부터 비교해 세 수의 순서를 정해요.', '426, 446, 500을 작은 수부터 놓으면 첫 번째 수는 426이에요.'),
  'g2-1-place-value-03': feedback('678에서 7이 놓인 자리가 십의 자리인지 확인해요.', '십의 자리 숫자 7은 십이 7개라는 뜻이므로 70이에요.'),
  'g2-1-place-value-04': feedback('252에 백 한 묶음을 더한 자리값 모형을 생각해요.', '252보다 100만큼 큰 수는 252 + 100 = 352예요.'),
  'g2-1-place-value-05': feedback('712를 백, 십, 일의 값으로 각각 나누어요.', '712는 700과 10과 2를 합쳐 만든 수예요.'),
  'g2-1-place-value-06': feedback('845의 백과 일의 자리 숫자를 서로 바꾸어요.', '백의 자리 8과 일의 자리 5를 바꾸면 548이고 845보다 작아요.'),

  'g2-1-shapes-01': feedback('휴지 심의 위아래 면과 옆면 모양을 살펴요.', '휴지 심처럼 위아래가 둥글고 옆면이 있는 입체도형은 원기둥이에요.'),
  'g2-1-shapes-02': feedback('바닥에 닿은 아래층 바로 위의 위치를 말해요.', '아래층보다 한 층 높은 위치이므로 위층이라고 말해요.'),
  'g2-1-shapes-03': feedback('깃발의 곧은 변이 몇 개인지 세어요.', '곧은 변이 세 개인 깃발 모양은 삼각형이에요.'),
  'g2-1-shapes-04': feedback('굽은 선으로 이어지고 꼭짓점이 없는 도형을 찾아요.', '둥근 선 하나로 그리며 꼭짓점이 없는 평면도형은 원이에요.'),
  'g2-1-shapes-05': feedback('각 사각형의 변과 꼭짓점을 따로 세어 비교해요.', '사각형은 크기와 방향이 달라도 변이 4개이고 꼭짓점이 4개예요.'),
  'g2-1-shapes-06': feedback('옮기기 전 아래층 수와 위층에서 옮길 수를 더해요.', '아래층 5개에 옮긴 3개를 더하면 5 + 3 = 8개예요.'),

  'g2-1-add-sub-01': feedback('처음 수에 얼마를 더하면 전체 수가 되는지 빈칸식으로 나타내요.', '45 + □ = 74이므로 □는 74 - 45 = 29예요.'),
  'g2-1-add-sub-02': feedback('60에서 어떤 수를 빼면 29가 되는지 거꾸로 더해 보아요.', '29 + 31 = 60이므로 60 - 31 = 29이고 빈칸은 31이에요.'),
  'g2-1-add-sub-03': feedback('뺄셈의 차와 뺀 수를 더해 처음 수가 되는 식을 찾아요.', '54 - 23 = 31과 짝인 덧셈식은 31 + 23 = 54예요.'),
  'g2-1-add-sub-04': feedback('46에서 12를 먼저 빼고 그 결과에 25를 더해요.', '46 - 12 = 34이고 34 + 25 = 59이므로 59개예요.'),
  'g2-1-add-sub-05': feedback('87에서 37을 빼서 처음 덧셈 수를 구해요.', '87 - 37 = 50이므로 50 + 37 = 87이에요.'),
  'g2-1-add-sub-06': feedback('차와 뺀 수를 더하면 처음 수가 된다는 관계를 사용해요.', '24 + 23 = 47이므로 47 - 23 = 24이고 빈칸은 47이에요.'),

  'g2-1-length-01': feedback('끝 눈금에서 시작 눈금을 빼면 실제 길이가 돼요.', '10cm 눈금에서 1cm 눈금을 빼면 붓의 길이는 9cm예요.'),
  'g2-1-length-02': feedback('리본의 시작을 0에 맞추고 끝 눈금을 읽어요.', '0cm에서 시작한 리본 끝이 35cm 눈금이므로 길이는 35cm예요.'),
  'g2-1-length-03': feedback('필통은 손 한 뼘 정도라는 길이 감각을 사용해요.', '필통 길이에는 20cm가 알맞고 2m나 20m는 너무 길어요.'),
  'g2-1-length-04': feedback('두 막대의 한쪽 끝을 맞춘 뒤 먼저 끝나는 막대를 찾아요.', '6cm인 주황 막대가 8cm인 파란 막대보다 짧아요.'),
  'g2-1-length-05': feedback('1m를 100cm로 바꾼 뒤 두 자의 길이를 더해요.', '1m는 100cm이므로 100cm + 100cm = 200cm예요.'),
  'g2-1-length-06': feedback('두 길이를 모두 cm로 바꾸고 차를 구해요.', '1m 22cm는 122cm이고 1m 9cm는 109cm이므로 차는 13cm예요.'),

  'g2-1-classification-01': feedback('빨강, 파랑, 노랑이라는 범주가 무엇을 나타내는지 생각해요.', '빨강, 파랑, 노랑은 물건의 색깔을 기준으로 나눈 범주예요.'),
  'g2-1-classification-02': feedback('각 무리의 표식을 세어 가장 큰 수를 찾아요.', '동물 7개, 탈것 4개, 과일 6개이므로 동물 무리가 가장 많아요.'),
  'g2-1-classification-03': feedback('정한 기준으로 나눈 뒤 사과 수에서 배 수를 빼요.', '사과 7개와 배 4개의 차는 7 - 4 = 3개예요.'),
  'g2-1-classification-04': feedback('색깔별 표식 중 노랑 범주의 표식만 세어요.', '노란 학용품 표식은 모두 5개이므로 표의 수는 5예요.'),
  'g2-1-classification-05': feedback('세 무리의 개수를 비교해 가장 작은 수를 찾아요.', '동물 5개, 탈것 3개, 과일 6개 중 탈것이 가장 적어요.'),
  'g2-1-classification-06': feedback('파란 블록 수와 노란 블록 수의 차를 구해요.', '파랑 7개와 노랑 3개의 차는 4개이므로 노랑을 4개 더 놓아요.'),

  'g2-1-multiplication-01': feedback('화분 수를 묶음 수로, 화분마다 꽃 수를 한 묶음 수로 보아요.', '5묶음에 3송이씩이므로 5 x 3 = 15로 짝지을 수 있어요.'),
  'g2-1-multiplication-02': feedback('줄 수와 한 줄에 앉은 학생 수를 곱해요.', '3줄에 6명씩 앉았으므로 3 x 6 = 18명이에요.'),
  'g2-1-multiplication-03': feedback('한 접시의 쿠키 5개를 접시 수만큼 반복해서 더해요.', '접시가 4개이므로 반복 덧셈식은 5 + 5 + 5 + 5예요.'),
  'g2-1-multiplication-04': feedback('한 봉지의 연필 수와 봉지 수를 곱해요.', '봉지 6개에 연필이 3자루씩 있으므로 6 x 3 = 18자루예요.'),
  'g2-1-multiplication-05': feedback('창문 배열의 전체 칸 수와 준비한 화분 수를 비교해요.', '4줄에 5개씩인 창문은 4 x 5 = 20개라서 화분 20개가 남김없이 쓰여요.'),
  'g2-1-multiplication-06': feedback('배열을 돌려 줄과 칸을 바꾸어도 전체 점 수가 같은지 보아요.', '5 x 6의 배열을 돌리면 6 x 5이고 두 식의 전체는 모두 30이에요.'),

  'g2-2-place-value-01': feedback('천, 백, 십, 일 모형의 개수를 각 자리에 써요.', '천 2개, 백 6개, 십 6개, 일 8개를 합치면 2668이에요.'),
  'g2-2-place-value-02': feedback('천의 자리부터 비교해 가장 큰 수를 먼저 놓아요.', '3430, 3160, 3032 중 천의 자리가 같을 때 백의 자리가 큰 3430이 첫 번째예요.'),
  'g2-2-place-value-03': feedback('7539에서 5가 놓인 자리가 백의 자리인지 확인해요.', '백의 자리 숫자 5는 백이 5개라는 뜻이므로 500이에요.'),
  'g2-2-place-value-04': feedback('4350에서 천 한 묶음을 덜어 낸 모형을 생각해요.', '4350보다 1000만큼 작은 수는 4350 - 1000 = 3350이에요.'),
  'g2-2-place-value-05': feedback('각 자리 숫자가 나타내는 값을 천부터 차례로 써요.', '5821은 5000과 800과 20과 1을 합친 수예요.'),
  'g2-2-place-value-06': feedback('천의 자리는 4로 두고 남은 숫자로 4870 바로 아래의 큰 수를 만들어요.', '4천에서 백을 8로 두고 4870보다 작게 배열하면 가장 큰 수는 4807이에요.'),

  'g2-2-facts-01': feedback('7단에서 곱이 28이 되는 차례를 찾아요.', '7을 4번 더하면 28이므로 7 x 4 = 28이고 빈칸은 4예요.'),
  'g2-2-facts-02': feedback('8단에서 곱이 48이 되는 값을 찾아요.', '8을 6번 더하면 48이므로 8 x 6 = 48이고 빈칸은 6이에요.'),
  'g2-2-facts-03': feedback('배열을 돌리면 줄 수와 한 줄의 수가 서로 바뀌어요.', '5 x 8 배열을 돌리면 8 x 5가 되고 전체 수는 그대로 40이에요.'),
  'g2-2-facts-04': feedback('4를 일곱 번 더해 24가 맞는지 확인해요.', '4 + 4 + 4 + 4 + 4 + 4 + 4 = 28이므로 올바른 곱은 28이에요.'),
  'g2-2-facts-05': feedback('9단에서 곱이 36인 칸을 찾아 빈칸을 확인해요.', '9를 4번 더하면 36이므로 9 x 4 = 36이고 빈칸은 4예요.'),
  'g2-2-facts-06': feedback('배열을 돌렸을 때 줄 수와 한 줄의 수를 바꾸어 써요.', '6 x 8 배열을 돌려도 전체가 같으므로 같은 식은 8 x 6이에요.'),

  'g2-2-length-01': feedback('100cm를 1m로 묶고 남는 cm를 써요.', '185cm에서 100cm는 1m이고 85cm가 남으므로 1m 85cm예요.'),
  'g2-2-length-02': feedback('2m 10cm를 210cm로 바꾼 뒤 자른 길이를 빼요.', '210cm - 55cm = 155cm이므로 남은 리본은 155cm예요.'),
  'g2-2-length-03': feedback('130cm에서 100cm를 1m로 바꾸어요.', '130cm는 100cm와 30cm이므로 1m 30cm예요.'),
  'g2-2-length-04': feedback('1m 20cm를 120cm로 바꾸고 35cm를 더해요.', '120cm + 35cm = 155cm이므로 이어 만든 길이는 155cm예요.'),
  'g2-2-length-05': feedback('1m를 100cm로 바꾸어 90cm와 더해요.', '1m 90cm는 100cm + 90cm이므로 190cm예요.'),
  'g2-2-length-06': feedback('자른 뒤의 길이를 먼저 구하고 이어 붙인 길이를 더해요.', '240cm - 70cm = 170cm이고 170cm + 30cm = 200cm예요.'),

  'g2-2-time-01': feedback('분침이 6을 가리킬 때 몇 분인지 먼저 읽어요.', '분침이 6이면 30분이고 시침이 4와 5 사이이므로 4시 30분이에요.'),
  'g2-2-time-02': feedback('1시간을 60분으로 바꾼 뒤 20분을 더해요.', '1시간 20분은 60분 + 20분이므로 모두 80분이에요.'),
  'g2-2-time-03': feedback('1주는 7일이라는 관계를 두 번 적용해요.', '2주는 7일이 두 번이므로 7 x 2 = 14일이에요.'),
  'g2-2-time-04': feedback('분침이 숫자 9에 있을 때 45분임을 떠올려요.', '분침이 9이면 45분이고 시침이 6과 7 사이이므로 6시 45분이에요.'),
  'g2-2-time-05': feedback('4시 20분에서 35분을 더하되 60분을 넘는지 확인해요.', '20분 + 35분 = 55분이므로 35분 뒤의 시각은 4시 55분이에요.'),
  'g2-2-time-06': feedback('1주가 7일이므로 3주에는 7일이 몇 번인지 생각해요.', '3주는 7일이 세 번이므로 7 x 3 = 21일이에요.'),

  'g2-2-table-graph-01': feedback('원자료를 표로 옮겼을 때 다시 세지 않아도 되는 정보를 찾아요.', '표에서는 종류별 개수가 모여 보여 한눈에 비교할 수 있어요.'),
  'g2-2-table-graph-02': feedback('각 종목의 표식 수를 세어 가장 작은 수를 찾아요.', '축구 5개, 야구 8개, 피구 6개 중 축구 표식이 가장 적어요.'),
  'g2-2-table-graph-03': feedback('원자료에서 야구만 골라 하나씩 표시해요.', '원자료에 야구가 세 번 나오므로 표의 야구 칸에는 3을 써요.'),
  'g2-2-table-graph-04': feedback('원자료에서 포도를 고른 응답 수만큼 표식을 만들어요.', '포도를 고른 응답은 6개이므로 그래프에 표식 6개를 그려요.'),
  'g2-2-table-graph-05': feedback('표의 행마다 무엇이 한데 모여 보이는지 살펴요.', '표에서는 종목마다 고른 친구 수를 바로 비교할 수 있어요.'),
  'g2-2-table-graph-06': feedback('옮긴 뒤 축구와 피구의 표식 수를 각각 다시 계산해요.', '축구는 4 + 2 = 6개, 피구는 8 - 2 = 6개가 되어 같아져요.'),

  'g2-2-pattern-01': feedback('첫째와 셋째, 둘째와 넷째 무늬가 같은지 살펴요.', '파랑과 빨강이 한 칸씩 번갈아 반복되는 규칙이에요.'),
  'g2-2-pattern-02': feedback('보기에서 고른 색 무늬 묶음이 배열 전체에 되풀이되는지 살펴요.', '노랑 뒤 초록 두 개 규칙을 고르면 노랑, 초록, 초록 묶음이 두 번 반복돼요.'),
  'g2-2-pattern-03': feedback('이웃한 운동 횟수끼리 얼마나 늘었는지 비교해요.', '매일 6회씩 늘어나므로 24 다음은 24 + 6 = 30회예요.'),
  'g2-2-pattern-04': feedback('고른 무늬 규칙이 처음부터 끝까지 반복되는지 확인해요.', '빨강 하나 뒤 파랑 두 개 규칙이면 빨강, 파랑, 파랑이 두 번 반복돼요.'),
  'g2-2-pattern-05': feedback('17 - 8과 26 - 17을 구해 같은 변화량인지 확인해요.', '이웃한 수의 차가 모두 9이므로 9씩 커지는 규칙이에요.'),
  'g2-2-pattern-06': feedback('고른 규칙을 연속한 모든 수 사이에 적용해 검토해요.', '5에서 시작해 5씩 커지기를 적용하면 5, 10, 15, 20, 25, 30이에요.'),
}

const grade2PracticeFollowUpHintBySourceId: Record<string, string> = {
  'g2-1-place-value-01': '각 자리 숫자를 백, 십, 일 순서로 이어 써요.',
  'g2-1-place-value-02': '백의 자리가 같다면 십의 자리, 일의 자리 순서로 비교해요.',
  'g2-1-place-value-03': '십 하나는 10이므로 십이 몇 개인지 값으로 바꾸어요.',
  'g2-1-place-value-04': '백의 자리만 한 묶음 커지고 십과 일은 그대로인지 확인해요.',
  'g2-1-place-value-05': '각 자리 값을 다시 합쳐 원래 수가 되는지 확인해요.',
  'g2-1-place-value-06': '바꾼 수가 조건보다 작은지도 마지막에 비교해요.',
  'g2-1-shapes-01': '공처럼 모든 면이 둥근 모양과 상자 모양은 제외해요.',
  'g2-1-shapes-02': '위와 아래를 바꾸어 말하지 않았는지 그림에서 확인해요.',
  'g2-1-shapes-03': '삼각형, 사각형, 원 카드의 변 수를 서로 비교해요.',
  'g2-1-shapes-04': '원의 둘레에는 곧은 변이나 꺾이는 점이 없어요.',
  'g2-1-shapes-05': '크기와 기울기가 달라도 변과 꼭짓점 수가 같은지 확인해요.',
  'g2-1-shapes-06': '옮긴 뒤 위층에서 줄어든 수와 아래층에서 늘어난 수를 구별해요.',
  'g2-1-add-sub-01': '전체에서 처음 있던 양을 빼면 늘어난 양을 확인할 수 있어요.',
  'g2-1-add-sub-02': '구한 수를 원래 뺄셈식에 넣어 결과가 맞는지 확인해요.',
  'g2-1-add-sub-03': '차와 뺀 수의 위치가 바뀌지 않은 덧셈식을 골라요.',
  'g2-1-add-sub-04': '앞 계산의 결과를 다음 계산의 첫 수로 사용해요.',
  'g2-1-add-sub-05': '구한 수와 37을 더해 87이 되는지 검산해요.',
  'g2-1-add-sub-06': '덧셈으로 구한 처음 수를 뺄셈식에 다시 넣어요.',
  'g2-1-length-01': '자가 0이 아닌 눈금에서 시작했다는 점을 놓치지 마세요.',
  'g2-1-length-02': '시작 눈금이 0이면 끝 눈금 수가 곧 길이가 돼요.',
  'g2-1-length-03': 'm와 cm의 크기를 비교해 실제 필통에 알맞은 단위를 골라요.',
  'g2-1-length-04': '끝점이 덜 뻗은 막대의 이름을 고르세요.',
  'g2-1-length-05': '같은 단위인 cm끼리 바꾼 다음 두 길이를 합쳐요.',
  'g2-1-length-06': 'm 부분과 cm 부분을 빠뜨리지 않고 전체 cm로 나타내요.',
  'g2-1-classification-01': '범주 이름들의 공통된 특징을 한 단어로 말해요.',
  'g2-1-classification-02': '표식 수가 가장 큰 범주의 이름을 고르세요.',
  'g2-1-classification-03': '두 범주의 차이이므로 큰 수에서 작은 수를 빼요.',
  'g2-1-classification-04': '다른 색의 표식은 세지 않고 노랑만 표시해요.',
  'g2-1-classification-05': '가장 적다는 말은 개수가 가장 작다는 뜻이에요.',
  'g2-1-classification-06': '같아지려면 부족한 쪽에 차이만큼 더해야 해요.',
  'g2-1-multiplication-01': '묶음 수와 한 묶음 수의 순서가 맞는 식을 골라요.',
  'g2-1-multiplication-02': '같은 수가 세 줄에 반복된 상황을 식으로 나타내요.',
  'g2-1-multiplication-03': '한 접시의 수를 접시 개수만큼 쓴 덧셈식을 찾으세요.',
  'g2-1-multiplication-04': '봉지 수만큼 3을 반복해서 더한 값과 비교해요.',
  'g2-1-multiplication-05': '창문 한 칸마다 화분 하나가 필요한지 대응시켜 보아요.',
  'g2-1-multiplication-06': '줄 수와 한 줄의 수만 맞바꾼 곱셈식을 찾으세요.',
  'g2-2-place-value-01': '0인 자리가 없더라도 네 자리를 빠짐없이 써요.',
  'g2-2-place-value-02': '천의 자리가 모두 같으면 백의 자리에서 큰 수를 찾아요.',
  'g2-2-place-value-03': '숫자 5 자체와 자릿값 500을 구별해요.',
  'g2-2-place-value-04': '천의 자리만 하나 줄고 나머지 자리는 그대로인지 보아요.',
  'g2-2-place-value-05': '천, 백, 십, 일의 값을 모두 쓴 보기를 골라요.',
  'g2-2-place-value-06': '각 숫자를 한 번씩만 사용했는지 확인해요.',
  'g2-2-facts-01': '구구표의 7단에서 곱 28이 놓인 열을 찾아요.',
  'g2-2-facts-02': '구한 수를 8과 곱해 48이 되는지 확인해요.',
  'g2-2-facts-03': '돌린 뒤에는 줄 수와 한 줄의 수가 서로 바뀌어요.',
  'g2-2-facts-04': '4단을 차례로 말해 일곱 번째 곱을 확인해요.',
  'g2-2-facts-05': '빈칸은 9를 더하는 횟수를 나타내요.',
  'g2-2-facts-06': '두 배열의 전체 칸 수가 같은 식만 고르세요.',
  'g2-2-length-01': '100cm씩 묶은 수는 m 자리에, 남은 수는 cm 자리에 써요.',
  'g2-2-length-02': '두 길이의 단위를 cm로 통일한 뒤 빼요.',
  'g2-2-length-03': '100cm를 덜어 내고 남은 cm를 함께 써요.',
  'g2-2-length-04': '이어 붙인 상황이므로 두 길이를 빼지 않고 더해요.',
  'g2-2-length-05': 'm 부분을 cm로 바꾸고 기존 cm에 합쳐요.',
  'g2-2-length-06': '빼기와 더하기의 순서를 문제 상황대로 지켜요.',
  'g2-2-time-01': '긴바늘은 분, 짧은바늘은 시를 나타낸다는 점을 구별해요.',
  'g2-2-time-02': '시간과 분을 같은 분 단위로 통일해요.',
  'g2-2-time-03': '달력에서 일주일 묶음이 몇 개인지 표시해 보아요.',
  'g2-2-time-04': '긴바늘이 숫자 하나를 지날 때마다 5분씩 늘어나요.',
  'g2-2-time-05': '분을 더한 값이 60보다 작은지 확인해 시 올림을 판단해요.',
  'g2-2-time-06': '7일짜리 묶음을 세 번 이어 붙여 생각해요.',
  'g2-2-table-graph-01': '표와 원자료 중 종류별 수를 더 빨리 찾을 수 있는 쪽을 생각해요.',
  'g2-2-table-graph-02': '표식 하나가 친구 한 명을 뜻하는지 확인하고 세어요.',
  'g2-2-table-graph-03': '축구와 피구 항목을 섞지 않고 야구 응답만 세어요.',
  'g2-2-table-graph-04': '포도 응답 하나마다 표식 하나를 대응시켜요.',
  'g2-2-table-graph-05': '표의 열을 따라가며 종목과 친구 수가 함께 보이는지 살펴요.',
  'g2-2-table-graph-06': '한쪽에서 뺀 표식 수를 다른 쪽에 그대로 더해요.',
  'g2-2-pattern-01': '두 칸짜리 무늬 묶음이 되풀이되는지 확인해요.',
  'g2-2-pattern-02': '규칙 이름에 나온 색의 순서와 개수가 배열과 같은지 비교해요.',
  'g2-2-pattern-03': '같은 변화량을 마지막 수에도 한 번 더 적용해요.',
  'g2-2-pattern-04': '정한 세 칸 무늬 묶음이 빠짐없이 반복되는 보기를 골라요.',
  'g2-2-pattern-05': '모든 이웃한 수의 차가 같은지 두 번 이상 확인해요.',
  'g2-2-pattern-06': '규칙 이름과 여섯 수 사이의 변화가 모두 맞아야 해요.',
}

function buildGrade2V1MissionTemplates(): Grade2MissionTemplate[] {
  let stageOrder = 1
  const result: Grade2MissionTemplate[] = []

  for (const unit of grade2Units.slice().sort((left, right) => left.order - right.order)) {
    const originals = grade2BaseMissionTemplates
      .filter((mission) => mission.unitId === unit.id)
      .sort((left, right) => left.unitMissionOrder - right.unitMissionOrder)

    originals.forEach((original, index) => {
      const authorship = grade2BasicAuthorshipById[original.id]
      if (!authorship) throw new Error(`${original.id}: missing explicit basic authorship`)
      const content = grade2BasicContentOverrides[original.id] ?? {}
      const curriculumText = grade2OfficialStandardText[authorship.curriculumCode]
      if (!curriculumText) throw new Error(`${original.id}: missing official curriculum text`)
      result.push({
        ...original,
        ...content,
        mode: 'basic',
        cognitiveDomain: authorship.cognitiveDomain,
        curriculumCode: authorship.curriculumCode,
        directCurriculumCodes: [authorship.curriculumCode],
        curriculumText,
        stageOrder,
        unitMissionOrder: index + 1,
      })
      stageOrder += 1
    })

    originals.forEach((source, index) => {
      const practice = grade2PracticeSpecsBySourceId[source.id]
      if (!practice) throw new Error(`${source.id}: missing explicit authored practice source`)
      const authoredFeedback = grade2PracticeFeedbackBySourceId[source.id]
      if (!authoredFeedback) throw new Error(`${source.id}: missing explicit authored practice feedback`)
      const followUpHint = grade2PracticeFollowUpHintBySourceId[source.id]
      if (!followUpHint) throw new Error(`${source.id}: missing explicit authored follow-up hint`)
      const curriculumText = grade2OfficialStandardText[practice.curriculumCode]
      if (!curriculumText) throw new Error(`${source.id}-v1: missing official curriculum text`)
      result.push({
        ...source,
        ...practice,
        id: `${source.id}-v1`,
        mode: 'practice',
        cognitiveDomain: practice.cognitiveDomain,
        curriculumCode: practice.curriculumCode,
        directCurriculumCodes: [practice.curriculumCode],
        curriculumText,
        learnerGoal: practice.learnerGoal ?? `${source.learnerGoal} 연습`,
        hintStepsTemplate: [...authoredFeedback.hintStepsTemplate, followUpHint],
        solutionStepsTemplate: authoredFeedback.solutionStepsTemplate,
        stageOrder,
        unitMissionOrder: index + 1,
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

export function renderGrade2MissionFromParams(
  template: Grade2MissionTemplate,
  params: Record<string, number>,
  random: () => number
): Grade2Mission {
  const correctAnswer = renderTemplate(template.solverRule, params)
  const choices = template.choicesTemplate
    ? template.choicesTemplate.map((choice) => renderTemplate(choice, params))
    : undefined
  const shuffledChoices = choices ? shuffleArray(choices, random) : undefined

  return {
    id: template.id,
    unitId: template.unitId,
    semester: template.semester,
    mode: template.mode,
    cognitiveDomain: template.cognitiveDomain,
    stageOrder: template.stageOrder,
    unitMissionOrder: template.unitMissionOrder,
    skill: template.skill,
    difficultyStep: template.difficultyStep,
    curriculumCode: template.curriculumCode,
    directCurriculumCodes: template.directCurriculumCodes,
    curriculumText: template.curriculumText,
    taskActions: template.taskActions,
    visualSemantics: template.visualSemantics,
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

export function renderGrade2Mission(
  template: Grade2MissionTemplate,
  seed = template.stageOrder
): Grade2Mission {
  const random = seededRandom(seed + template.stageOrder * 997)
  const params = generateParams(template.paramSchema, random)
  return renderGrade2MissionFromParams(template, params, random)
}

export function getGrade2Missions(
  seed = 20260510,
  additionalMissionProvider?: Grade2MissionProvider,
): Grade2Mission[] {
  const legacyMissions = grade2MissionTemplates
    .slice()
    .sort((a, b) => a.stageOrder - b.stageOrder)
    .map((template) => renderGrade2Mission(template, seed))
  const additionalMissions = [...(additionalMissionProvider?.(seed) ?? [])]
  const legacyIds = new Set(legacyMissions.map((mission) => mission.id))
  const additionalIds = new Set<string>()
  const additionalStageOrders = new Set<number>()
  const additionalUnitOrders = new Set<string>()
  const lastLegacyUnitOrder = new Map<string, number>()
  legacyMissions.forEach((mission) => {
    lastLegacyUnitOrder.set(
      mission.unitId,
      Math.max(lastLegacyUnitOrder.get(mission.unitId) ?? 0, mission.unitMissionOrder),
    )
  })
  const lastLegacyOrder = legacyMissions.at(-1)?.stageOrder ?? 0
  additionalMissions.forEach((mission) => {
    if (legacyIds.has(mission.id) || additionalIds.has(mission.id)) {
      throw new Error(`Duplicate Grade 2 mission id: ${mission.id}`)
    }
    if (mission.stageOrder <= lastLegacyOrder) {
      throw new Error(`Additional Grade 2 mission must follow the legacy bank: ${mission.id}`)
    }
    if (additionalStageOrders.has(mission.stageOrder)) {
      throw new Error(`Duplicate additional Grade 2 stage order: ${mission.stageOrder}`)
    }
    const lastUnitOrder = lastLegacyUnitOrder.get(mission.unitId)
    if (lastUnitOrder === undefined) {
      throw new Error(`Additional Grade 2 mission has unknown unit: ${mission.unitId}`)
    }
    if (mission.unitMissionOrder <= lastUnitOrder) {
      throw new Error(`Additional Grade 2 mission must follow the legacy unit: ${mission.id}`)
    }
    const unitOrderKey = `${mission.unitId}:${mission.unitMissionOrder}`
    if (additionalUnitOrders.has(unitOrderKey)) {
      throw new Error(`Duplicate additional Grade 2 unit order: ${unitOrderKey}`)
    }
    additionalIds.add(mission.id)
    additionalStageOrders.add(mission.stageOrder)
    additionalUnitOrders.add(unitOrderKey)
  })
  return [...legacyMissions, ...additionalMissions.sort((a, b) => a.stageOrder - b.stageOrder)]
}

export function getGrade2MissionsByUnit(
  unitId: string,
  seed = 20260510,
  additionalMissionProvider?: Grade2MissionProvider,
): Grade2Mission[] {
  return getGrade2Missions(seed, additionalMissionProvider)
    .filter((mission) => mission.unitId === unitId)
}

export function normalizeGrade2Mode(
  value: string | null | undefined,
  missionId?: string | null,
): Grade2Mode {
  if (value == null && missionId?.endsWith('-v1')) return 'practice'
  return value === 'practice' ? 'practice' : 'basic'
}

export function getGrade2MissionSet(
  unitId: string,
  mode: Grade2Mode | string | null | undefined = 'basic',
  seed = 20260510,
  additionalMissionProvider?: Grade2MissionProvider,
): Grade2Mission[] {
  const normalizedMode = normalizeGrade2Mode(mode)
  return getGrade2MissionsByUnit(unitId, seed, additionalMissionProvider)
    .filter((mission) => mission.mode === normalizedMode)
    .sort((left, right) => left.unitMissionOrder - right.unitMissionOrder)
}

export function getSafeGrade2Mission(seed = 20260510): Grade2Mission {
  const safeTemplate = grade2MissionTemplates.find((template) => template.id === SAFE_GRADE2_MISSION_ID)
  if (!safeTemplate) throw new Error('Safe Grade 2 mission is missing')
  return renderGrade2Mission(safeTemplate, seed)
}

export function getGrade2MissionById(
  id: string,
  seed = 20260510,
  additionalMissionProvider?: Grade2MissionProvider,
): Grade2Mission {
  const template = grade2MissionTemplates.find((item) => item.id === id)
  if (template) return renderGrade2Mission(template, seed)
  return getGrade2Missions(seed, additionalMissionProvider)
    .find((mission) => mission.id === id) ?? getSafeGrade2Mission(seed)
}

export function getGrade2UnitById(id: string): Grade2Unit | undefined {
  return grade2Units.find((unit) => unit.id === id)
}

export interface Grade2ValidationResult {
  errors: string[]
  warnings: string[]
}

export interface Grade2VariantAuditResult {
  sourceCount: number
  variantCount: number
  errors: string[]
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

function enumerateGrade2Params(
  schema: Grade2MissionTemplate['paramSchema']
): Record<string, number>[] {
  let variants: Record<string, number>[] = [{}]
  for (const [name, range] of Object.entries(schema)) {
    const next: Record<string, number>[] = []
    for (const variant of variants) {
      for (let value = range.min; value <= range.max; value += 1) {
        next.push({ ...variant, [name]: value })
      }
    }
    variants = next
  }
  return variants
}

function renderedGrade2TextHasPlaceholder(mission: Grade2Mission) {
  return [
    mission.prompt,
    mission.correctAnswer,
    ...(mission.choices ?? []),
    ...mission.hintSteps,
    ...mission.solutionSteps,
    ...Object.values(mission.visualConfig).map(String),
  ].some((value) => /{{|}}/.test(value))
}

function renderedGrade2TextHasBrokenParticle(mission: Grade2Mission) {
  return [
    mission.prompt,
    ...(mission.choices ?? []),
    ...mission.hintSteps,
    ...mission.solutionSteps,
  ].some((value) => /(?:딸기|포도)은|딸기이|\d+\s*x\s*\d+는/.test(value))
}

function grade2VisualAnswer(mission: Grade2Mission): string | undefined {
  const config = mission.visualConfig
  if (mission.visualModel === 'place-value-blocks') {
    const answer = String(config.number)
    return answer === mission.correctAnswer ? answer : undefined
  }
  if (mission.visualModel === 'expanded-number-cards') {
    const answer = String(config.target)
    return answer === mission.correctAnswer ? answer : undefined
  }
  if (mission.visualModel === 'vertical-operation') return String(config.result)
  if (mission.visualModel === 'box-equation') {
    const right = Number(config.right)
    const result = Number(config.result)
    if (config.missing === 'left' && config.operator === '+') return String(result - right)
    if (config.missing === 'left' && config.operator === '-') return String(result + right)
  }
  if (mission.visualModel === 'solid-shape-cards') {
    const target = String(config.target)
    return target && target === mission.correctAnswer ? target : undefined
  }
  if (mission.visualModel === 'stack-cubes') {
    if (config.targetLayer !== 'top' && config.targetLayer !== 'bottom') return undefined
    const answer = String(config.targetLayer === 'top' ? config.top : config.bottom)
    return answer === mission.correctAnswer ? answer : undefined
  }
  if (mission.visualModel === 'ruler-line') {
    return `${Number(config.endCm) - Number(config.startCm)}cm`
  }
  if (mission.visualModel === 'array-groups' && !mission.correctAnswer.includes('x')) {
    return String(Number(config.rows) * Number(config.cols))
  }
  if (mission.visualModel === 'multiplication-table') {
    if (mission.prompt.includes('□')) return String(config.factor)
    return String(config.product)
  }
  if (mission.visualModel === 'calendar-strip') return String(config.target)
  if (mission.visualModel === 'classification-table' || mission.visualModel === 'mark-graph') {
    const categories = splitList(config.categories)
    const counts = splitList(config.counts).map(Number)
    const target = String(config.target)
    if (target.includes('-')) {
      const [left, right] = target.split('-')
      return String(counts[categories.indexOf(left)] - counts[categories.indexOf(right)])
    }
    const targetCount = counts[categories.indexOf(target)]
    if (/^\d+$/.test(mission.correctAnswer)) return String(targetCount)
    return categories.includes(mission.correctAnswer) && target === mission.correctAnswer
      ? target
      : undefined
  }
  return undefined
}

export function auditGrade2MissionVariants(
  templates: Grade2MissionTemplate[] = grade2MissionTemplates
): Grade2VariantAuditResult {
  const errors: string[] = []
  let variantCount = 0

  for (const template of templates) {
    const variants = enumerateGrade2Params(template.paramSchema)
    for (let index = 0; index < variants.length; index += 1) {
      const mission = renderGrade2MissionFromParams(
        template,
        variants[index],
        seededRandom(template.stageOrder * 10_000 + index + 1)
      )
      variantCount += 1
      const label = `${template.id} variant ${index + 1}`
      if (renderedGrade2TextHasPlaceholder(mission)) errors.push(`${label}: unresolved template placeholder`)
      if (renderedGrade2TextHasBrokenParticle(mission)) errors.push(`${label}: broken Korean particle`)
      if (!mission.correctAnswer.trim()) errors.push(`${label}: empty correct answer`)

      if (mission.answerType === 'choice' || mission.answerType === 'label') {
        const choices = mission.choices ?? []
        if (new Set(choices).size !== choices.length) errors.push(`${label}: duplicate choices`)
        const correctCount = choices.filter((choice) => choice === mission.correctAnswer).length
        if (correctCount !== 1) errors.push(`${label}: expected one correct choice, got ${correctCount}`)
      }
      if (mission.prompt.includes('m와 cm로') && !/^\d+m\d+cm$/.test(mission.correctAnswer)) {
        errors.push(`${label}: answer must use the requested m-and-cm format`)
      }

      const visualAnswer = grade2VisualAnswer(mission)
      if (visualAnswer !== undefined && visualAnswer !== mission.correctAnswer) {
        errors.push(`${label}: visual answer ${visualAnswer} does not match ${mission.correctAnswer}`)
      }
    }
  }

  return { sourceCount: templates.length, variantCount, errors }
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
  const unitModeCounts = new Map<string, number>()
  const unitDomains = new Map<string, Record<Grade2CognitiveDomain, number>>()

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
    if (
      template.directCurriculumCodes.length === 0
      || !template.directCurriculumCodes.includes(template.curriculumCode)
    ) {
      errors.push(`${template.id}: directCurriculumCodes must include curriculumCode`)
    }
    if (template.curriculumText !== grade2OfficialStandardText[template.curriculumCode]) {
      errors.push(`${template.id}: curriculumText must match the official standard`)
    }
    if (template.mode !== 'basic' && template.mode !== 'practice') {
      errors.push(`${template.id}: invalid mode ${template.mode}`)
    }
    if (!['knowing', 'applying', 'reasoning'].includes(template.cognitiveDomain)) {
      errors.push(`${template.id}: invalid cognitiveDomain ${template.cognitiveDomain}`)
    }
    if (template.taskActions.length === 0) errors.push(`${template.id}: missing taskActions`)
    if (template.visualSemantics !== 'schematic' && template.visualSemantics !== 'quantitative') {
      errors.push(`${template.id}: visualSemantics must match the required visual`)
    }
    if (template.answerConfig.kind !== template.answerType) {
      errors.push(`${template.id}: answerConfig.kind must match answerType`)
    }
    if (!rewardIds.has(template.rewardId)) errors.push(`${template.id}: unknown reward ${template.rewardId}`)
    if (!template.learnerGoal.trim()) errors.push(`${template.id}: missing learnerGoal`)
    if (!template.parentSummaryTag.trim()) errors.push(`${template.id}: missing parentSummaryTag`)
    if (template.hintStepsTemplate.length < 2) errors.push(`${template.id}: needs at least two hints`)
    if (template.solutionStepsTemplate.length === 0) errors.push(`${template.id}: missing solution steps`)

    unitCounts.set(template.unitId, (unitCounts.get(template.unitId) ?? 0) + 1)
    const modeKey = `${template.unitId}:${template.mode}`
    unitModeCounts.set(modeKey, (unitModeCounts.get(modeKey) ?? 0) + 1)
    const domains = unitDomains.get(template.unitId) ?? { knowing: 0, applying: 0, reasoning: 0 }
    domains[template.cognitiveDomain] += 1
    unitDomains.set(template.unitId, domains)

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
    for (const mode of ['basic', 'practice'] as const) {
      const modeCount = unitModeCounts.get(`${unit.id}:${mode}`) ?? 0
      if (modeCount !== 6) errors.push(`${unit.id}: ${mode} expects 6 missions, got ${modeCount}`)
    }
    const domains = unitDomains.get(unit.id)
    if (!domains || domains.knowing !== 5 || domains.applying !== 5 || domains.reasoning !== 2) {
      errors.push(`${unit.id}: expects K/A/R 5/5/2, got ${domains?.knowing ?? 0}/${domains?.applying ?? 0}/${domains?.reasoning ?? 0}`)
    }
  }

  if (templates.length !== 144) errors.push(`V1 expects 144 missions, got ${templates.length}`)
  if (!ids.has(SAFE_GRADE2_MISSION_ID)) errors.push(`Safe mission id is missing: ${SAFE_GRADE2_MISSION_ID}`)
  errors.push(...auditGrade2MissionVariants(templates).errors)

  return { errors, warnings }
}
