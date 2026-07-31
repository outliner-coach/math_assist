export type Grade1Skill =
  | 'counting'
  | 'comparison'
  | 'addition'
  | 'subtraction'
  | 'shape'
  | 'time'
  | 'pattern'

export type Grade1VisualModel =
  | 'counting-grid'
  | 'object-groups'
  | 'number-cards'
  | 'shape-cards'
  | 'clock-face'
  | 'pattern-strip'

export type Grade1AnswerType = 'choice' | 'number'
export type Grade1Mode = 'basic' | 'practice'
export type Grade1CognitiveDomain = 'knowing' | 'applying' | 'reasoning'

export type Grade1TaskAction =
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

export type Grade1VisualSemantics = 'decorative' | 'schematic' | 'quantitative'

interface Grade1QualityMetadata {
  curriculumCodes: string[]
  directCurriculumCodes: string[]
  taskActions: Grade1TaskAction[]
  visualSemantics: Grade1VisualSemantics
  cognitiveDomain: Grade1CognitiveDomain
  problemFamily: string
  contextType: string
  representationTypes: string[]
  reasoningPattern: string
  authoredSourceKey: string
}

export interface Grade1Island {
  id: string
  title: string
  subtitle: string
  rewardId: Grade1RewardId
}

export type Grade1RewardId =
  | 'numberShard'
  | 'shapeBadge'
  | 'clockBadge'
  | 'patternRibbon'

export type Grade1VisualConfig = Record<string, string | number | boolean>

export interface Grade1MissionTemplate extends Grade1QualityMetadata {
  id: string
  islandId: string
  stageOrder: number
  mode: Grade1Mode
  skill: Grade1Skill
  difficulty: 1 | 2 | 3
  learnerGoal: string
  parentSummaryTag: string
  promptTemplate: string
  answerType: Grade1AnswerType
  paramSchema: Record<string, { min: number; max: number }>
  solverRule: string
  choicesTemplate?: string[]
  visualModel: Grade1VisualModel
  visualConfig: Grade1VisualConfig
  hintStepsTemplate: string[]
  solutionStepsTemplate: string[]
  rewardId: Grade1RewardId
}

export interface Grade1Mission extends Grade1QualityMetadata {
  id: string
  islandId: string
  stageOrder: number
  mode: Grade1Mode
  skill: Grade1Skill
  difficulty: 1 | 2 | 3
  learnerGoal: string
  parentSummaryTag: string
  prompt: string
  answerType: Grade1AnswerType
  params: Record<string, number>
  choices?: string[]
  correctAnswer: string
  correctChoiceIndex?: number
  visualModel: Grade1VisualModel
  visualConfig: Grade1VisualConfig
  hintSteps: string[]
  solutionSteps: string[]
  rewardId: Grade1RewardId
}

export const grade1Islands: Grade1Island[] = [
  {
    id: 'count-cove',
    title: '수 세기 만',
    subtitle: '보고, 짚고, 개수를 말해요',
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge',
    title: '순서 다리',
    subtitle: '앞뒤 수와 큰 수를 찾아요',
    rewardId: 'numberShard',
  },
  {
    id: 'orchard-port',
    title: '더하기 항구',
    subtitle: '두 모음을 합쳐요',
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock',
    title: '빼기 나루',
    subtitle: '남은 개수를 알아봐요',
    rewardId: 'patternRibbon',
  },
  {
    id: 'shape-forest',
    title: '모양 숲',
    subtitle: '같은 모양을 찾아요',
    rewardId: 'shapeBadge',
  },
  {
    id: 'clock-tower',
    title: '시계 탑',
    subtitle: '시각을 읽어요',
    rewardId: 'clockBadge',
  },
  {
    id: 'pattern-cave',
    title: '규칙 동굴',
    subtitle: '다음에 올 것을 찾아요',
    rewardId: 'patternRibbon',
  },
]

export const grade1AllowedCurriculumCodesByIsland: Record<string, readonly string[]> = {
  'count-cove': ['[2수01-01]'],
  'order-bridge': ['[2수01-03]'],
  'orchard-port': ['[2수01-04]', '[2수01-05]', '[2수01-06]', '[2수01-08]'],
  'river-dock': ['[2수01-05]', '[2수01-06]'],
  'shape-forest': ['[2수03-03]', '[2수03-04]', '[2수03-05]'],
  'clock-tower': ['[2수03-07]', '[2수03-09]'],
  'pattern-cave': ['[2수02-01]'],
}

type Grade1MissionTemplateSource = Omit<
  Grade1MissionTemplate,
  keyof Grade1QualityMetadata | 'mode'
>

function quality(
  curriculumCode: string,
  taskAction: Grade1TaskAction,
  visualSemantics: Grade1VisualSemantics
): Grade1QualityMetadata {
  return {
    curriculumCodes: [curriculumCode],
    directCurriculumCodes: [],
    taskActions: [taskAction],
    visualSemantics,
    cognitiveDomain: 'knowing',
    problemFamily: '',
    contextType: '',
    representationTypes: [],
    reasoningPattern: '',
    authoredSourceKey: '',
  }
}

const grade1QualityMetadataBySourceId: Record<string, Grade1QualityMetadata> = {
  'count-cove-01': quality('[2수01-01]', 'calculate', 'quantitative'),
  'count-cove-02': quality('[2수01-01]', 'calculate', 'quantitative'),
  'count-cove-03': quality('[2수01-01]', 'calculate', 'quantitative'),
  'count-cove-04': quality('[2수01-01]', 'calculate', 'quantitative'),
  'count-cove-05': quality('[2수01-01]', 'calculate', 'quantitative'),
  'count-cove-06': quality('[2수01-01]', 'calculate', 'quantitative'),
  'count-cove-07': quality('[2수01-01]', 'analyze_error', 'quantitative'),
  'count-cove-08': quality('[2수01-01]', 'calculate', 'quantitative'),
  'count-cove-09': quality('[2수01-01]', 'calculate', 'quantitative'),
  'order-bridge-01': quality('[2수01-03]', 'compare', 'schematic'),
  'order-bridge-02': quality('[2수01-03]', 'compare', 'schematic'),
  'order-bridge-03': quality('[2수01-03]', 'compare', 'schematic'),
  'order-bridge-04': quality('[2수01-03]', 'compare', 'schematic'),
  'order-bridge-05': quality('[2수01-03]', 'compare', 'schematic'),
  'order-bridge-06': quality('[2수01-03]', 'compare', 'schematic'),
  'order-bridge-07': quality('[2수01-03]', 'analyze_error', 'schematic'),
  'order-bridge-08': quality('[2수01-03]', 'compare', 'schematic'),
  'order-bridge-09': quality('[2수01-03]', 'compare', 'schematic'),
  'orchard-port-01': quality('[2수01-05]', 'calculate', 'quantitative'),
  'orchard-port-02': quality('[2수01-05]', 'calculate', 'quantitative'),
  'orchard-port-03': quality('[2수01-05]', 'calculate', 'quantitative'),
  'orchard-port-04': quality('[2수01-05]', 'calculate', 'quantitative'),
  'orchard-port-05': quality('[2수01-05]', 'calculate', 'quantitative'),
  'orchard-port-06': quality('[2수01-05]', 'calculate', 'quantitative'),
  'orchard-port-07': quality('[2수01-06]', 'analyze_error', 'quantitative'),
  'orchard-port-08': quality('[2수01-05]', 'calculate', 'quantitative'),
  'orchard-port-09': quality('[2수01-05]', 'calculate', 'quantitative'),
  'orchard-port-10': quality('[2수01-08]', 'calculate', 'quantitative'),
  'river-dock-01': quality('[2수01-05]', 'calculate', 'quantitative'),
  'river-dock-02': quality('[2수01-05]', 'calculate', 'quantitative'),
  'river-dock-03': quality('[2수01-05]', 'calculate', 'quantitative'),
  'river-dock-04': quality('[2수01-05]', 'calculate', 'quantitative'),
  'river-dock-05': quality('[2수01-05]', 'calculate', 'quantitative'),
  'river-dock-06': quality('[2수01-05]', 'calculate', 'quantitative'),
  'river-dock-07': quality('[2수01-06]', 'analyze_error', 'quantitative'),
  'river-dock-08': quality('[2수01-05]', 'calculate', 'quantitative'),
  'river-dock-09': quality('[2수01-05]', 'calculate', 'quantitative'),
  'river-dock-10': quality('[2수01-05]', 'calculate', 'quantitative'),
  'shape-forest-01': quality('[2수03-04]', 'recognize', 'schematic'),
  'shape-forest-02': quality('[2수03-04]', 'recognize', 'schematic'),
  'shape-forest-03': quality('[2수03-04]', 'recognize', 'schematic'),
  'shape-forest-04': quality('[2수03-04]', 'recognize', 'schematic'),
  'shape-forest-05': quality('[2수03-04]', 'recognize', 'schematic'),
  'shape-forest-06': quality('[2수03-05]', 'classify', 'schematic'),
  'shape-forest-07': quality('[2수03-05]', 'analyze_error', 'schematic'),
  'shape-forest-08': quality('[2수03-05]', 'classify', 'schematic'),
  'shape-forest-09': quality('[2수03-05]', 'classify', 'schematic'),
  'clock-tower-01': quality('[2수03-07]', 'interpret', 'quantitative'),
  'clock-tower-02': quality('[2수03-07]', 'interpret', 'quantitative'),
  'clock-tower-03': quality('[2수03-07]', 'interpret', 'quantitative'),
  'clock-tower-04': quality('[2수03-09]', 'reason', 'schematic'),
  'clock-tower-05': quality('[2수03-07]', 'interpret', 'quantitative'),
  'clock-tower-06': quality('[2수03-07]', 'interpret', 'quantitative'),
  'clock-tower-07': quality('[2수03-09]', 'reason', 'schematic'),
  'pattern-cave-01': quality('[2수02-01]', 'reason', 'schematic'),
  'pattern-cave-02': quality('[2수02-01]', 'reason', 'schematic'),
  'pattern-cave-03': quality('[2수02-01]', 'reason', 'schematic'),
  'pattern-cave-04': quality('[2수02-01]', 'reason', 'schematic'),
  'pattern-cave-05': quality('[2수02-01]', 'reason', 'schematic'),
  'pattern-cave-06': quality('[2수02-01]', 'reason', 'schematic'),
}

const grade1AlphaMissionTemplates: Grade1MissionTemplateSource[] = [
  {
    id: 'count-cove-01',
    islandId: 'count-cove',
    stageOrder: 1,
    skill: 'counting',
    difficulty: 1,
    learnerGoal: '사과 7개를 세어요',
    parentSummaryTag: 'counting-to-10',
    promptTemplate: '사과는 모두 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { count: { min: 7, max: 7 }, slots: { min: 10, max: 10 } },
    solverRule: 'count',
    choicesTemplate: ['{{count}}', '{{count - 1}}', '{{count + 1}}'],
    visualModel: 'counting-grid',
    visualConfig: { object: 'apple', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['위 줄에는 5개, 아래 줄에는 2개가 있어요.', '5 다음에 6, 7로 이어서 세어요.'],
    solutionStepsTemplate: ['사과가 있는 칸만 세어요.', '5개와 2개를 이어 세면 7개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-02',
    islandId: 'count-cove',
    stageOrder: 2,
    skill: 'counting',
    difficulty: 1,
    learnerGoal: '10보다 큰 수를 세어요',
    parentSummaryTag: 'counting-to-20',
    promptTemplate: '블록은 모두 몇 개일까요?',
    answerType: 'number',
    paramSchema: { count: { min: 12, max: 12 }, slots: { min: 20, max: 20 } },
    solverRule: 'count',
    visualModel: 'counting-grid',
    visualConfig: { object: 'block', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['10개를 먼저 묶어 보아요.', '10 다음에 11, 12로 세어요.'],
    solutionStepsTemplate: ['첫 10칸을 채우면 10개예요.', '남은 2개를 더 세면 12개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-03',
    islandId: 'count-cove',
    stageOrder: 3,
    skill: 'counting',
    difficulty: 2,
    learnerGoal: '구슬 개수를 정확히 세어요',
    parentSummaryTag: 'counting-to-10',
    promptTemplate: '구슬은 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { count: { min: 6, max: 9 }, slots: { min: 10, max: 10 } },
    solverRule: 'count',
    choicesTemplate: ['{{count}}', '{{count - 2}}', '{{count + 1}}'],
    visualModel: 'counting-grid',
    visualConfig: { object: 'marble', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['빈칸은 빼고 구슬만 세어요.', '한 줄씩 천천히 세면 좋아요.'],
    solutionStepsTemplate: ['구슬이 있는 칸을 하나씩 세어요.', '모두 세면 {{count}}개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-04',
    islandId: 'count-cove',
    stageOrder: 4,
    skill: 'counting',
    difficulty: 2,
    learnerGoal: '10묶음과 낱개를 세어요',
    parentSummaryTag: 'counting-to-20',
    promptTemplate: '반짝이는 별은 모두 몇 개일까요?',
    answerType: 'number',
    paramSchema: { count: { min: 13, max: 16 }, slots: { min: 20, max: 20 } },
    solverRule: 'count',
    visualModel: 'counting-grid',
    visualConfig: { object: 'star', count: '{{count}}', slots: '{{slots}}', columns: 10 },
    hintStepsTemplate: ['10개를 먼저 찾고 남은 별을 세어요.', '10에 남은 개수를 더해요.'],
    solutionStepsTemplate: ['가득 찬 첫 줄은 10개예요.', '나머지 별까지 세면 {{count}}개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-01',
    islandId: 'order-bridge',
    stageOrder: 5,
    skill: 'comparison',
    difficulty: 1,
    learnerGoal: '더 큰 수를 골라요',
    parentSummaryTag: 'compare-numbers',
    promptTemplate: '{{left}}와 {{left + gap}} 중 더 큰 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 4, max: 7 }, gap: { min: 2, max: 5 } },
    solverRule: 'left + gap',
    choicesTemplate: ['{{left + gap}}', '{{left}}', '{{left + gap - 1}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{left}},{{left + gap}}', target: '{{left + gap}}' },
    hintStepsTemplate: ['수직선에서 오른쪽에 있는 수가 더 커요.', '{{left + gap}}은 {{left}}보다 뒤에 있어요.'],
    solutionStepsTemplate: ['두 수를 비교해요.', '{{left + gap}}이 {{left}}보다 크므로 정답은 {{left + gap}}예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-02',
    islandId: 'order-bridge',
    stageOrder: 6,
    skill: 'comparison',
    difficulty: 1,
    learnerGoal: '더 작은 수를 골라요',
    parentSummaryTag: 'compare-numbers',
    promptTemplate: '{{small}}와 {{small + gap}} 중 더 작은 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { small: { min: 3, max: 9 }, gap: { min: 2, max: 6 } },
    solverRule: 'small',
    choicesTemplate: ['{{small}}', '{{small + gap}}', '{{small + gap + 1}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{small}},{{small + gap}}', target: '{{small}}' },
    hintStepsTemplate: ['먼저 나오는 수가 더 작아요.', '{{small}}은 {{small + gap}}보다 앞에 있어요.'],
    solutionStepsTemplate: ['두 수를 왼쪽부터 생각해요.', '더 작은 수는 {{small}}이에요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-03',
    islandId: 'order-bridge',
    stageOrder: 7,
    skill: 'comparison',
    difficulty: 2,
    learnerGoal: '바로 앞의 수를 알아요',
    parentSummaryTag: 'before-after',
    promptTemplate: '{{n}} 바로 앞의 수는 무엇일까요?',
    answerType: 'number',
    paramSchema: { n: { min: 6, max: 15 } },
    solverRule: 'n - 1',
    visualModel: 'number-cards',
    visualConfig: { cards: '{{n - 2}},{{n - 1}},{{n}},?', target: '{{n - 1}}' },
    hintStepsTemplate: ['바로 앞은 하나 작은 수예요.', '{{n}}에서 하나 뒤로 가요.'],
    solutionStepsTemplate: ['하나 작은 수를 찾습니다.', '{{n}} 바로 앞은 {{n - 1}}이에요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-04',
    islandId: 'order-bridge',
    stageOrder: 8,
    skill: 'comparison',
    difficulty: 2,
    learnerGoal: '바로 뒤의 수를 알아요',
    parentSummaryTag: 'before-after',
    promptTemplate: '{{n}} 바로 뒤의 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { n: { min: 5, max: 14 } },
    solverRule: 'n + 1',
    choicesTemplate: ['{{n + 1}}', '{{n - 1}}', '{{n + 2}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{n - 1}},{{n}},?,{{n + 2}}', target: '{{n + 1}}' },
    hintStepsTemplate: ['바로 뒤는 하나 큰 수예요.', '{{n}} 다음 수를 말해요.'],
    solutionStepsTemplate: ['하나 큰 수를 찾습니다.', '{{n}} 바로 뒤는 {{n + 1}}이에요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'orchard-port-01',
    islandId: 'orchard-port',
    stageOrder: 9,
    skill: 'addition',
    difficulty: 1,
    learnerGoal: '두 모음을 합쳐요',
    parentSummaryTag: 'addition-within-10',
    promptTemplate: '사과 {{left}}개와 {{right}}개를 합치면 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 4, max: 4 }, right: { min: 3, max: 3 } },
    solverRule: 'left + right',
    choicesTemplate: ['{{left + right}}', '{{left + right - 1}}', '{{left + right + 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'apple', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['먼저 {{left}}개를 세고, 이어서 {{right}}개를 세어요.', '{{left}} 다음부터 이어 세면 돼요.'],
    solutionStepsTemplate: ['두 모음을 합칩니다.', '{{left}} + {{right}} = {{left + right}}이에요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-02',
    islandId: 'orchard-port',
    stageOrder: 10,
    skill: 'addition',
    difficulty: 1,
    learnerGoal: '블록을 합쳐 10 안의 덧셈을 해요',
    parentSummaryTag: 'addition-within-10',
    promptTemplate: '블록 {{left}}개와 {{right}}개를 합치면 몇 개일까요?',
    answerType: 'number',
    paramSchema: { left: { min: 5, max: 5 }, right: { min: 2, max: 2 } },
    solverRule: 'left + right',
    visualModel: 'object-groups',
    visualConfig: { object: 'block', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['{{left}}개에서 {{right}}개를 이어 세어요.', '손가락으로 하나씩 더해도 좋아요.'],
    solutionStepsTemplate: ['블록을 모두 모아요.', '{{left}} + {{right}} = {{left + right}}이에요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-03',
    islandId: 'orchard-port',
    stageOrder: 11,
    skill: 'addition',
    difficulty: 2,
    learnerGoal: '10을 넘는 덧셈을 이어 세어요',
    parentSummaryTag: 'addition-within-20',
    promptTemplate: '별 {{left}}개와 {{right}}개를 합치면 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 7, max: 9 }, right: { min: 3, max: 6 } },
    solverRule: 'left + right',
    choicesTemplate: ['{{left + right}}', '{{left + right - 2}}', '{{left + right + 2}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'star', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['큰 모음 {{left}}개를 먼저 세어요.', '그 다음 {{right}}개를 이어 세어요.'],
    solutionStepsTemplate: ['두 모음을 합칩니다.', '{{left}} + {{right}} = {{left + right}}이에요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-04',
    islandId: 'orchard-port',
    stageOrder: 12,
    skill: 'addition',
    difficulty: 3,
    learnerGoal: '이야기 덧셈을 풀어요',
    parentSummaryTag: 'addition-within-20',
    promptTemplate: '연필이 {{left}}자루 있었고 {{right}}자루를 더 받았어요. 모두 몇 자루일까요?',
    answerType: 'number',
    paramSchema: { left: { min: 8, max: 10 }, right: { min: 2, max: 5 } },
    solverRule: 'left + right',
    visualModel: 'object-groups',
    visualConfig: { object: 'pencil', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['더 받았으니 덧셈이에요.', '{{left}}에서 {{right}}를 이어 세어요.'],
    solutionStepsTemplate: ['처음 {{left}}자루에 {{right}}자루를 더합니다.', '{{left}} + {{right}} = {{left + right}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-01',
    islandId: 'river-dock',
    stageOrder: 13,
    skill: 'subtraction',
    difficulty: 1,
    learnerGoal: '빠진 만큼 남은 수를 세어요',
    parentSummaryTag: 'subtraction-within-10',
    promptTemplate: '구슬 {{total}}개 중 {{take}}개가 떠났어요. 몇 개가 남았을까요?',
    answerType: 'choice',
    paramSchema: { total: { min: 8, max: 8 }, take: { min: 3, max: 3 } },
    solverRule: 'total - take',
    choicesTemplate: ['{{total - take}}', '{{total - take - 1}}', '{{total - take + 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'marble', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['떠난 구슬은 빼고 남은 구슬만 세어요.', '{{total}}에서 {{take}}를 빼요.'],
    solutionStepsTemplate: ['{{total}}개 중 {{take}}개를 덜어냅니다.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-02',
    islandId: 'river-dock',
    stageOrder: 14,
    skill: 'subtraction',
    difficulty: 1,
    learnerGoal: '10 안의 뺄셈을 해요',
    parentSummaryTag: 'subtraction-within-10',
    promptTemplate: '별 {{total}}개 중 {{take}}개를 사용했어요. 몇 개가 남았을까요?',
    answerType: 'number',
    paramSchema: { total: { min: 10, max: 10 }, take: { min: 4, max: 4 } },
    solverRule: 'total - take',
    visualModel: 'object-groups',
    visualConfig: { object: 'star', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['사용한 별은 지우고 남은 별을 세어요.', '10에서 4를 빼요.'],
    solutionStepsTemplate: ['{{total}}개에서 {{take}}개를 뺍니다.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-03',
    islandId: 'river-dock',
    stageOrder: 15,
    skill: 'subtraction',
    difficulty: 2,
    learnerGoal: '20 안의 뺄셈을 해요',
    parentSummaryTag: 'subtraction-within-20',
    promptTemplate: '블록 {{total}}개 중 {{take}}개를 치웠어요. 몇 개가 남았을까요?',
    answerType: 'choice',
    paramSchema: { total: { min: 13, max: 16 }, take: { min: 4, max: 7 } },
    solverRule: 'total - take',
    choicesTemplate: ['{{total - take}}', '{{total - take + 2}}', '{{total - take - 2}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'block', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['치운 블록은 빼요.', '남은 블록만 다시 세어도 돼요.'],
    solutionStepsTemplate: ['{{total}}개에서 {{take}}개를 뺍니다.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-04',
    islandId: 'river-dock',
    stageOrder: 16,
    skill: 'subtraction',
    difficulty: 3,
    learnerGoal: '이야기 뺄셈을 풀어요',
    parentSummaryTag: 'subtraction-within-20',
    promptTemplate: '사과가 {{total}}개 있었는데 {{take}}개를 먹었어요. 몇 개가 남았을까요?',
    answerType: 'number',
    paramSchema: { total: { min: 14, max: 18 }, take: { min: 5, max: 8 } },
    solverRule: 'total - take',
    visualModel: 'object-groups',
    visualConfig: { object: 'apple', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['먹은 사과는 없어졌으니 빼기예요.', '{{total}}에서 {{take}}를 빼요.'],
    solutionStepsTemplate: ['처음 {{total}}개에서 {{take}}개를 뺍니다.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'shape-forest-01',
    islandId: 'shape-forest',
    stageOrder: 17,
    skill: 'shape',
    difficulty: 1,
    learnerGoal: '동그라미를 찾아요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '동그라미 모양은 어느 것일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '동그라미',
    choicesTemplate: ['동그라미', '세모', '네모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '동그라미,세모,네모', target: '동그라미' },
    hintStepsTemplate: ['모서리가 없이 둥근 모양을 찾아요.'],
    solutionStepsTemplate: ['동그라미는 둥글고 뾰족한 곳이 없어요.', '정답은 동그라미예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-02',
    islandId: 'shape-forest',
    stageOrder: 18,
    skill: 'shape',
    difficulty: 1,
    learnerGoal: '세모를 찾아요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '세모 모양은 어느 것일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '세모',
    choicesTemplate: ['세모', '동그라미', '네모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '동그라미,세모,네모', target: '세모' },
    hintStepsTemplate: ['뾰족한 꼭짓점이 3개인 모양을 찾아요.'],
    solutionStepsTemplate: ['세모는 꼭짓점이 3개예요.', '정답은 세모예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-03',
    islandId: 'shape-forest',
    stageOrder: 19,
    skill: 'shape',
    difficulty: 2,
    learnerGoal: '네모를 찾아요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '네모 모양은 어느 것일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '네모',
    choicesTemplate: ['네모', '동그라미', '세모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '네모,동그라미,세모', target: '네모' },
    hintStepsTemplate: ['반듯한 변이 4개인 모양을 찾아요.'],
    solutionStepsTemplate: ['네모는 변이 4개예요.', '정답은 네모예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-04',
    islandId: 'shape-forest',
    stageOrder: 20,
    skill: 'shape',
    difficulty: 2,
    learnerGoal: '같은 모양을 비교해요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '보기 중 사각형과 같은 모양은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '네모',
    choicesTemplate: ['네모', '동그라미', '세모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '동그라미,네모,세모', target: '네모' },
    hintStepsTemplate: ['사각형은 네모처럼 반듯한 변이 4개예요.'],
    solutionStepsTemplate: ['사각형과 같은 모양은 네모예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'clock-tower-01',
    islandId: 'clock-tower',
    stageOrder: 21,
    skill: 'time',
    difficulty: 2,
    learnerGoal: '정각을 읽어요',
    parentSummaryTag: 'time-hour',
    promptTemplate: '시계는 몇 시를 가리킬까요?',
    answerType: 'choice',
    paramSchema: { hour: { min: 3, max: 3 }, minute: { min: 0, max: 0 } },
    solverRule: '{{hour}}시',
    choicesTemplate: ['{{hour}}시', '{{hour - 1}}시', '{{hour + 1}}시'],
    visualModel: 'clock-face',
    visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘이 12를 가리키면 정각이에요.', '짧은 바늘이 {{hour}}를 가리켜요.'],
    solutionStepsTemplate: ['긴 바늘은 12에 있어요.', '짧은 바늘이 {{hour}}에 있으므로 {{hour}}시예요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'clock-tower-02',
    islandId: 'clock-tower',
    stageOrder: 22,
    skill: 'time',
    difficulty: 3,
    learnerGoal: '30분을 읽어요',
    parentSummaryTag: 'time-half-hour',
    promptTemplate: '시계는 몇 시 30분을 가리킬까요?',
    answerType: 'choice',
    paramSchema: { hour: { min: 7, max: 7 }, minute: { min: 30, max: 30 } },
    solverRule: '{{hour}}시 30분',
    choicesTemplate: ['{{hour}}시 30분', '{{hour}}시', '{{hour + 1}}시 30분'],
    visualModel: 'clock-face',
    visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘이 6을 가리키면 30분이에요.', '짧은 바늘은 {{hour}}와 {{hour + 1}} 사이에 있어요.'],
    solutionStepsTemplate: ['긴 바늘이 6에 있으므로 30분이에요.', '짧은 바늘이 {{hour}}를 지나서 {{hour}}시 30분이에요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'pattern-cave-01',
    islandId: 'pattern-cave',
    stageOrder: 23,
    skill: 'pattern',
    difficulty: 2,
    learnerGoal: '반복 규칙을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '동그라미, 세모, 동그라미, 세모 다음에는 무엇이 올까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '동그라미',
    choicesTemplate: ['동그라미', '세모', '네모'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '동그라미,세모,동그라미,세모,?' },
    hintStepsTemplate: ['동그라미와 세모가 번갈아 나와요.'],
    solutionStepsTemplate: ['동그라미 다음 세모가 반복돼요.', '세모 다음은 동그라미예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'pattern-cave-02',
    islandId: 'pattern-cave',
    stageOrder: 24,
    skill: 'pattern',
    difficulty: 3,
    learnerGoal: '세 가지 반복 규칙을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '별, 블록, 연필, 별, 블록 다음에는 무엇이 올까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '연필',
    choicesTemplate: ['연필', '별', '블록'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '별,블록,연필,별,블록,?' },
    hintStepsTemplate: ['별, 블록, 연필 순서가 반복돼요.'],
    solutionStepsTemplate: ['별, 블록, 연필이 한 묶음이에요.', '별, 블록 다음은 연필이에요.'],
    rewardId: 'patternRibbon',
  },
]

const grade1BetaMissionTemplates: Grade1MissionTemplateSource[] = [
  {
    id: 'count-cove-05',
    islandId: 'count-cove',
    stageOrder: 25,
    skill: 'counting',
    difficulty: 1,
    learnerGoal: '5 안의 수를 세어요',
    parentSummaryTag: 'counting-to-5',
    promptTemplate: '연필은 모두 몇 자루일까요?',
    answerType: 'choice',
    paramSchema: { count: { min: 3, max: 5 }, slots: { min: 5, max: 5 } },
    solverRule: 'count',
    choicesTemplate: ['{{count}}', '{{count - 1}}', '{{count + 1}}'],
    visualModel: 'counting-grid',
    visualConfig: { object: 'pencil', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['연필이 있는 칸만 세어요.', '하나씩 짚으며 세면 쉬워요.'],
    solutionStepsTemplate: ['연필을 하나씩 세어요.', '모두 {{count}}자루예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-06',
    islandId: 'count-cove',
    stageOrder: 26,
    skill: 'counting',
    difficulty: 1,
    learnerGoal: '빈칸 없이 차례로 세어요',
    parentSummaryTag: 'counting-to-10',
    promptTemplate: '별은 모두 몇 개일까요?',
    answerType: 'number',
    paramSchema: { count: { min: 8, max: 10 }, slots: { min: 10, max: 10 } },
    solverRule: 'count',
    visualModel: 'counting-grid',
    visualConfig: { object: 'star', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['첫 칸부터 차례로 세어요.', '마지막 별의 번호가 개수예요.'],
    solutionStepsTemplate: ['별을 하나씩 세면 {{count}}개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-07',
    islandId: 'count-cove',
    stageOrder: 27,
    skill: 'counting',
    difficulty: 2,
    learnerGoal: '10묶음을 빠뜨린 세기 오류를 고쳐요',
    parentSummaryTag: 'counting-error-check',
    promptTemplate: '친구가 첫 줄 10개를 빼고 {{count - 10}}개라고 했어요. 블록은 실제로 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { count: { min: 15, max: 18 }, slots: { min: 20, max: 20 } },
    solverRule: 'count',
    choicesTemplate: ['{{count}}', '{{count - 1}}', '{{count + 1}}'],
    visualModel: 'counting-grid',
    visualConfig: { object: 'block', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['첫 줄의 10개도 전체에 포함해요.', '10개와 남은 블록을 이어 세어요.'],
    solutionStepsTemplate: ['친구는 첫 10개를 빠뜨렸어요.', '10개와 나머지를 합치면 모두 {{count}}개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-08',
    islandId: 'count-cove',
    stageOrder: 28,
    skill: 'counting',
    difficulty: 2,
    learnerGoal: '빠진 칸을 피해 세어요',
    parentSummaryTag: 'counting-to-20',
    promptTemplate: '구슬은 모두 몇 개일까요?',
    answerType: 'number',
    paramSchema: { count: { min: 11, max: 14 }, slots: { min: 20, max: 20 } },
    solverRule: 'count',
    visualModel: 'counting-grid',
    visualConfig: { object: 'marble', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['구슬이 없는 칸은 세지 않아요.', '10 다음부터 이어 세어요.'],
    solutionStepsTemplate: ['구슬만 차례로 세면 {{count}}개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'count-cove-09',
    islandId: 'count-cove',
    stageOrder: 29,
    skill: 'counting',
    difficulty: 3,
    learnerGoal: '두 줄의 개수를 합쳐 세어요',
    parentSummaryTag: 'counting-to-20',
    promptTemplate: '사과를 두 줄로 세면 모두 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { count: { min: 16, max: 19 }, slots: { min: 20, max: 20 } },
    solverRule: 'count',
    choicesTemplate: ['{{count}}', '{{count - 2}}', '{{count + 1}}'],
    visualModel: 'counting-grid',
    visualConfig: { object: 'apple', count: '{{count}}', slots: '{{slots}}', columns: 10 },
    hintStepsTemplate: ['윗줄을 먼저 세고 아랫줄을 이어 세어요.', '10개를 기준으로 생각해도 좋아요.'],
    solutionStepsTemplate: ['두 줄의 사과를 모두 세면 {{count}}개예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-05',
    islandId: 'order-bridge',
    stageOrder: 30,
    skill: 'comparison',
    difficulty: 1,
    learnerGoal: '수의 크기를 비교해요',
    parentSummaryTag: 'compare-numbers',
    promptTemplate: '{{left}}와 {{right}} 중 더 큰 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 5, max: 8 }, right: { min: 11, max: 14 } },
    solverRule: 'right',
    choicesTemplate: ['{{right}}', '{{left}}', '{{right - 1}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{left}},{{right}}', target: '{{right}}' },
    hintStepsTemplate: ['두 수의 크기를 비교해요.', '더 뒤에 오는 수가 더 커요.'],
    solutionStepsTemplate: ['{{right}}은 {{left}}보다 큰 수예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-06',
    islandId: 'order-bridge',
    stageOrder: 31,
    skill: 'comparison',
    difficulty: 1,
    learnerGoal: '수 카드 중 작은 수를 찾아요',
    parentSummaryTag: 'compare-numbers',
    promptTemplate: '수 카드 중 가장 작은 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { small: { min: 2, max: 4 }, mid: { min: 6, max: 8 }, big: { min: 10, max: 12 } },
    solverRule: 'small',
    choicesTemplate: ['{{small}}', '{{mid}}', '{{big}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{small}},{{mid}},{{big}}', target: '{{small}}' },
    hintStepsTemplate: ['가장 앞에 오는 수를 찾아요.', '작은 수부터 차례로 말해 보아요.'],
    solutionStepsTemplate: ['{{small}}, {{mid}}, {{big}} 중 가장 작은 수는 {{small}}예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-07',
    islandId: 'order-bridge',
    stageOrder: 32,
    skill: 'comparison',
    difficulty: 2,
    learnerGoal: '수 사이를 건너뛴 오류를 고쳐요',
    parentSummaryTag: 'sequence-error-check',
    promptTemplate: '친구가 {{start}} 다음을 바로 {{start + 2}}라고 했어요. 빠뜨린 수는 무엇일까요?',
    answerType: 'number',
    paramSchema: { start: { min: 4, max: 12 } },
    solverRule: 'start + 1',
    visualModel: 'number-cards',
    visualConfig: { cards: '{{start}},?,{{start + 2}}', target: '{{start + 1}}' },
    hintStepsTemplate: ['하나씩 커지는 순서로 다시 말해요.', '{{start + 2}} 바로 앞의 수도 같아요.'],
    solutionStepsTemplate: ['{{start}} 다음은 {{start + 1}}이에요.', '친구가 빠뜨린 수는 {{start + 1}}이에요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-08',
    islandId: 'order-bridge',
    stageOrder: 33,
    skill: 'comparison',
    difficulty: 2,
    learnerGoal: '가장 큰 수를 찾아요',
    parentSummaryTag: 'compare-numbers',
    promptTemplate: '세 수 중 가장 큰 수는 무엇일까요?',
    answerType: 'choice',
    paramSchema: { base: { min: 6, max: 10 } },
    solverRule: 'base + 5',
    choicesTemplate: ['{{base + 5}}', '{{base + 2}}', '{{base}}'],
    visualModel: 'number-cards',
    visualConfig: { cards: '{{base}},{{base + 2}},{{base + 5}}', target: '{{base + 5}}' },
    hintStepsTemplate: ['가장 나중에 오는 수를 찾아요.', '수 카드의 크기를 차례로 비교해요.'],
    solutionStepsTemplate: ['{{base + 5}}가 가장 큰 수예요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'order-bridge-09',
    islandId: 'order-bridge',
    stageOrder: 34,
    skill: 'comparison',
    difficulty: 3,
    learnerGoal: '이야기에서 앞뒤 수를 찾아요',
    parentSummaryTag: 'before-after',
    promptTemplate: '{{n}}번 바로 뒤에 오는 번호는 무엇일까요?',
    answerType: 'number',
    paramSchema: { n: { min: 9, max: 18 } },
    solverRule: 'n + 1',
    visualModel: 'number-cards',
    visualConfig: { cards: '{{n - 1}},{{n}},?', target: '{{n + 1}}' },
    hintStepsTemplate: ['바로 뒤는 하나 큰 수예요.', '{{n}} 다음 수를 말해요.'],
    solutionStepsTemplate: ['{{n}}보다 하나 큰 수는 {{n + 1}}이에요.'],
    rewardId: 'numberShard',
  },
  {
    id: 'orchard-port-05',
    islandId: 'orchard-port',
    stageOrder: 35,
    skill: 'addition',
    difficulty: 1,
    learnerGoal: '작은 수를 더해요',
    parentSummaryTag: 'addition-within-10',
    promptTemplate: '연필 {{left}}자루와 {{right}}자루를 합치면 몇 자루일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 2, max: 4 }, right: { min: 2, max: 4 } },
    solverRule: 'left + right',
    choicesTemplate: ['{{left + right}}', '{{left + right - 1}}', '{{left + right + 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'pencil', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['왼쪽 모음을 먼저 세어요.', '오른쪽 모음을 이어 세어요.'],
    solutionStepsTemplate: ['{{left}} + {{right}} = {{left + right}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-06',
    islandId: 'orchard-port',
    stageOrder: 36,
    skill: 'addition',
    difficulty: 1,
    learnerGoal: '5를 만들어 더해요',
    parentSummaryTag: 'addition-within-10',
    promptTemplate: '{{left}}개와 {{right}}개를 합치면 몇 개일까요?',
    answerType: 'number',
    paramSchema: { left: { min: 3, max: 5 }, right: { min: 1, max: 4 } },
    solverRule: 'left + right',
    visualModel: 'object-groups',
    visualConfig: { object: 'block', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['큰 모음부터 세어요.', '남은 것을 이어 세어요.'],
    solutionStepsTemplate: ['두 모음을 모두 합치면 {{left + right}}개예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-07',
    islandId: 'orchard-port',
    stageOrder: 37,
    skill: 'addition',
    difficulty: 2,
    learnerGoal: '10만 만들고 멈춘 덧셈을 고쳐요',
    parentSummaryTag: 'addition-error-check',
    promptTemplate: '친구가 {{left}} + {{right}}에서 10만 만들고 답을 10이라고 했어요. 바른 답은?',
    answerType: 'choice',
    paramSchema: { left: { min: 8, max: 9 }, right: { min: 4, max: 7 } },
    solverRule: 'left + right',
    choicesTemplate: ['{{left + right}}', '{{left + right - 1}}', '{{left + right + 2}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'star', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['{{left}}에서 10까지 채운 뒤 남은 수도 더해야 해요.', '두 모음을 모두 세어 검산해요.'],
    solutionStepsTemplate: ['10을 만든 뒤 남은 수까지 더해요.', '{{left}}와 {{right}}를 합치면 {{left + right}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-08',
    islandId: 'orchard-port',
    stageOrder: 38,
    skill: 'addition',
    difficulty: 2,
    learnerGoal: '두 자리 안에서 이어 세어요',
    parentSummaryTag: 'addition-within-20',
    promptTemplate: '구슬 {{left}}개에 {{right}}개를 더하면 몇 개일까요?',
    answerType: 'number',
    paramSchema: { left: { min: 10, max: 13 }, right: { min: 2, max: 5 } },
    solverRule: 'left + right',
    visualModel: 'object-groups',
    visualConfig: { object: 'marble', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['{{left}}개를 먼저 생각해요.', '{{right}}개를 이어 더해요.'],
    solutionStepsTemplate: ['{{left}} + {{right}} = {{left + right}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-09',
    islandId: 'orchard-port',
    stageOrder: 39,
    skill: 'addition',
    difficulty: 3,
    learnerGoal: '이야기에서 더할 수를 찾아요',
    parentSummaryTag: 'addition-within-20',
    promptTemplate: '별 {{left}}개를 모았고 {{right}}개를 더 모았어요. 모두 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 9, max: 12 }, right: { min: 3, max: 6 } },
    solverRule: 'left + right',
    choicesTemplate: ['{{left + right}}', '{{left + right - 2}}', '{{left + right + 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'star', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['더 모았으니 덧셈이에요.', '처음 수에 더 모은 수를 합쳐요.'],
    solutionStepsTemplate: ['{{left}} + {{right}} = {{left + right}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'orchard-port-10',
    islandId: 'orchard-port',
    stageOrder: 40,
    skill: 'addition',
    difficulty: 3,
    learnerGoal: '세 수를 차례로 더해요',
    parentSummaryTag: 'addition-within-20',
    promptTemplate: '{{a}} + {{b}} + {{c}}은 얼마일까요?',
    answerType: 'number',
    paramSchema: { a: { min: 3, max: 5 }, b: { min: 4, max: 6 }, c: { min: 2, max: 4 } },
    solverRule: 'a + b + c',
    visualModel: 'object-groups',
    visualConfig: { object: 'apple', operation: 'add', left: '{{a + b}}', right: '{{c}}' },
    hintStepsTemplate: ['앞의 두 수를 먼저 더해요.', '그 값에 마지막 수를 더해요.'],
    solutionStepsTemplate: ['{{a}} + {{b}} = {{a + b}}예요.', '{{a + b}} + {{c}} = {{a + b + c}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-05',
    islandId: 'river-dock',
    stageOrder: 41,
    skill: 'subtraction',
    difficulty: 1,
    learnerGoal: '작은 수를 빼요',
    parentSummaryTag: 'subtraction-within-10',
    promptTemplate: '{{total}}개 중 {{take}}개를 빼면 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { total: { min: 6, max: 9 }, take: { min: 2, max: 4 } },
    solverRule: 'total - take',
    choicesTemplate: ['{{total - take}}', '{{total - take + 1}}', '{{total - take - 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'block', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['뺀 것은 세지 않아요.', '남은 것만 세어요.'],
    solutionStepsTemplate: ['{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-06',
    islandId: 'river-dock',
    stageOrder: 42,
    skill: 'subtraction',
    difficulty: 1,
    learnerGoal: '남은 별을 세어요',
    parentSummaryTag: 'subtraction-within-10',
    promptTemplate: '별 {{total}}개 중 {{take}}개를 지우면 몇 개가 남을까요?',
    answerType: 'number',
    paramSchema: { total: { min: 7, max: 10 }, take: { min: 1, max: 4 } },
    solverRule: 'total - take',
    visualModel: 'object-groups',
    visualConfig: { object: 'star', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['지운 별은 빼요.', '남은 별을 하나씩 세어요.'],
    solutionStepsTemplate: ['{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-07',
    islandId: 'river-dock',
    stageOrder: 43,
    skill: 'subtraction',
    difficulty: 2,
    learnerGoal: '전체와 덜어낸 수를 거꾸로 쓴 오류를 고쳐요',
    parentSummaryTag: 'subtraction-error-check',
    promptTemplate: '친구가 {{take}}에서 {{total}}을 빼려고 했어요. {{total}}개에서 {{take}}개를 빼면 얼마일까요?',
    answerType: 'choice',
    paramSchema: { total: { min: 12, max: 16 }, take: { min: 3, max: 6 } },
    solverRule: 'total - take',
    choicesTemplate: ['{{total - take}}', '{{total - take + 2}}', '{{total - take - 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'marble', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['전체인 {{total}}에서 없어진 {{take}}를 빼요.', '남은 개수를 세어 확인해요.'],
    solutionStepsTemplate: ['큰 전체에서 덜어낸 수를 빼야 해요.', '{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-08',
    islandId: 'river-dock',
    stageOrder: 44,
    skill: 'subtraction',
    difficulty: 2,
    learnerGoal: '두 자리 수에서 빼요',
    parentSummaryTag: 'subtraction-within-20',
    promptTemplate: '사과 {{total}}개 중 {{take}}개를 나누었어요. 몇 개가 남았을까요?',
    answerType: 'number',
    paramSchema: { total: { min: 15, max: 19 }, take: { min: 4, max: 8 } },
    solverRule: 'total - take',
    visualModel: 'object-groups',
    visualConfig: { object: 'apple', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['나누어 준 것은 없어졌어요.', '남은 사과를 계산해요.'],
    solutionStepsTemplate: ['{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-09',
    islandId: 'river-dock',
    stageOrder: 45,
    skill: 'subtraction',
    difficulty: 3,
    learnerGoal: '이야기에서 남은 수를 구해요',
    parentSummaryTag: 'subtraction-within-20',
    promptTemplate: '연필 {{total}}자루 중 {{take}}자루를 썼어요. 몇 자루가 남았을까요?',
    answerType: 'choice',
    paramSchema: { total: { min: 13, max: 18 }, take: { min: 5, max: 9 } },
    solverRule: 'total - take',
    choicesTemplate: ['{{total - take}}', '{{total - take + 1}}', '{{total - take + 3}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'pencil', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['쓴 연필은 빼요.', '처음 수에서 사용한 수를 빼요.'],
    solutionStepsTemplate: ['{{total}} - {{take}} = {{total - take}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'river-dock-10',
    islandId: 'river-dock',
    stageOrder: 46,
    skill: 'subtraction',
    difficulty: 3,
    learnerGoal: '차이를 구해요',
    parentSummaryTag: 'subtraction-within-20',
    promptTemplate: '{{big}}개는 {{small}}개보다 몇 개 더 많을까요?',
    answerType: 'number',
    paramSchema: { small: { min: 5, max: 8 }, big: { min: 12, max: 16 } },
    solverRule: 'big - small',
    visualModel: 'object-groups',
    visualConfig: { object: 'block', operation: 'sub', total: '{{big}}', take: '{{small}}' },
    hintStepsTemplate: ['더 많은 수에서 적은 수를 빼요.', '차이는 뺄셈으로 구해요.'],
    solutionStepsTemplate: ['{{big}} - {{small}} = {{big - small}}예요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'shape-forest-05',
    islandId: 'shape-forest',
    stageOrder: 47,
    skill: 'shape',
    difficulty: 1,
    learnerGoal: '같은 동그라미를 찾아요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '동그라미와 같은 모양은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '원',
    choicesTemplate: ['원', '삼각형', '사각형'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '원,삼각형,사각형', target: '원' },
    hintStepsTemplate: ['둥근 모양을 찾아요.'],
    solutionStepsTemplate: ['원은 둥근 모양이에요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-06',
    islandId: 'shape-forest',
    stageOrder: 48,
    skill: 'shape',
    difficulty: 1,
    learnerGoal: '꼭짓점이 있는 모양을 찾아요',
    parentSummaryTag: 'shape-recognition',
    promptTemplate: '꼭짓점이 3개인 모양은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '세모',
    choicesTemplate: ['세모', '동그라미', '원'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '동그라미,세모,원', target: '세모' },
    hintStepsTemplate: ['뾰족한 곳을 세어요.'],
    solutionStepsTemplate: ['세모는 꼭짓점이 3개예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-07',
    islandId: 'shape-forest',
    stageOrder: 49,
    skill: 'shape',
    difficulty: 2,
    learnerGoal: '변의 수를 잘못 센 설명을 고쳐요',
    parentSummaryTag: 'shape-error-check',
    promptTemplate: '친구가 네모의 변은 3개라고 했어요. 변을 다시 세면 어떤 모양일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '네모',
    choicesTemplate: ['네모', '세모', '동그라미'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '세모,네모,동그라미', target: '네모' },
    hintStepsTemplate: ['네모의 테두리를 따라 반듯한 변을 세어요.', '변이 4개인 모양을 찾아요.'],
    solutionStepsTemplate: ['친구가 한 변을 빠뜨렸어요.', '네모는 변이 4개예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-08',
    islandId: 'shape-forest',
    stageOrder: 50,
    skill: 'shape',
    difficulty: 2,
    learnerGoal: '모양 이름을 연결해요',
    parentSummaryTag: 'shape-properties',
    promptTemplate: '둥글고 모서리가 없는 모양은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '동그라미',
    choicesTemplate: ['동그라미', '세모', '네모'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '동그라미,세모,네모', target: '동그라미' },
    hintStepsTemplate: ['모서리가 없는 모양을 찾아요.', '둥근 모양의 이름을 떠올려요.'],
    solutionStepsTemplate: ['둥글고 모서리가 없는 모양은 동그라미예요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'shape-forest-09',
    islandId: 'shape-forest',
    stageOrder: 51,
    skill: 'shape',
    difficulty: 3,
    learnerGoal: '모양 설명을 듣고 찾아요',
    parentSummaryTag: 'shape-properties',
    promptTemplate: '변은 없고 둥근 모양은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '원',
    choicesTemplate: ['원', '삼각형', '사각형'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '삼각형,원,사각형', target: '원' },
    hintStepsTemplate: ['변이 없는 모양을 찾아요.', '둥근 카드를 골라요.'],
    solutionStepsTemplate: ['원은 변이 없고 둥근 모양이에요.'],
    rewardId: 'shapeBadge',
  },
  {
    id: 'clock-tower-03',
    islandId: 'clock-tower',
    stageOrder: 52,
    skill: 'time',
    difficulty: 1,
    learnerGoal: '한 시간 뒤의 정각을 구해요',
    parentSummaryTag: 'time-one-hour-later',
    promptTemplate: '시계가 {{hour}}시를 가리켜요. 한 시간 뒤는 몇 시일까요?',
    answerType: 'choice',
    paramSchema: { hour: { min: 1, max: 5 }, minute: { min: 0, max: 0 } },
    solverRule: '{{hour + 1}}시',
    choicesTemplate: ['{{hour + 1}}시', '{{hour}}시', '{{hour + 2}}시'],
    visualModel: 'clock-face',
    visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['한 시간 뒤에는 짧은 바늘이 다음 숫자로 가요.'],
    solutionStepsTemplate: ['{{hour}}시에서 한 시간 뒤는 {{hour + 1}}시예요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'clock-tower-04',
    islandId: 'clock-tower',
    stageOrder: 53,
    skill: 'time',
    difficulty: 1,
    learnerGoal: '하루와 시간의 관계를 알아요',
    parentSummaryTag: 'day-hour-relation',
    promptTemplate: '하루는 몇 시간일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '24시간',
    choicesTemplate: ['24시간', '12시간', '60시간'],
    visualModel: 'number-cards',
    visualConfig: { cards: '24시간,12시간,60시간', target: '24시간' },
    hintStepsTemplate: ['낮 12시간과 밤 12시간을 합쳐요.', '12 + 12를 계산해요.'],
    solutionStepsTemplate: ['12 + 12 = 24예요.', '하루는 24시간이에요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'clock-tower-05',
    islandId: 'clock-tower',
    stageOrder: 54,
    skill: 'time',
    difficulty: 2,
    learnerGoal: '30분 시각을 읽어요',
    parentSummaryTag: 'time-half-hour',
    promptTemplate: '긴 바늘이 6이면 몇 분일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '30분',
    choicesTemplate: ['30분', '0분', '60분'],
    visualModel: 'clock-face',
    visualConfig: { hour: 4, minute: 30 },
    hintStepsTemplate: ['긴 바늘이 6을 가리키면 반이에요.', '반은 30분이에요.'],
    solutionStepsTemplate: ['긴 바늘이 6이면 30분이에요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'clock-tower-06',
    islandId: 'clock-tower',
    stageOrder: 55,
    skill: 'time',
    difficulty: 2,
    learnerGoal: '몇 시 30분을 말해요',
    parentSummaryTag: 'time-half-hour',
    promptTemplate: '시계는 몇 시 30분일까요?',
    answerType: 'choice',
    paramSchema: { hour: { min: 5, max: 8 }, minute: { min: 30, max: 30 } },
    solverRule: '{{hour}}시 30분',
    choicesTemplate: ['{{hour}}시 30분', '{{hour}}시', '{{hour + 1}}시'],
    visualModel: 'clock-face',
    visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘은 6을 가리켜요.', '짧은 바늘은 {{hour}}를 지나 있어요.'],
    solutionStepsTemplate: ['시계는 {{hour}}시 30분을 가리켜요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'clock-tower-07',
    islandId: 'clock-tower',
    stageOrder: 56,
    skill: 'time',
    difficulty: 3,
    learnerGoal: '일주일의 날짜를 빠뜨린 설명을 고쳐요',
    parentSummaryTag: 'calendar-error-check',
    promptTemplate: '친구가 주말을 빼고 1주일은 5일이라고 했어요. 주말까지 세면 며칠일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '7일',
    choicesTemplate: ['7일', '5일', '10일'],
    visualModel: 'number-cards',
    visualConfig: { cards: '7일,5일,10일', target: '7일' },
    hintStepsTemplate: ['토요일과 일요일도 한 주에 들어가요.', '월요일부터 일요일까지 세어요.'],
    solutionStepsTemplate: ['평일 5일과 주말 2일을 모두 세어요.', '1주일은 7일이에요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'pattern-cave-03',
    islandId: 'pattern-cave',
    stageOrder: 57,
    skill: 'pattern',
    difficulty: 1,
    learnerGoal: '두 모양 반복을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '별, 달, 별, 달 다음에는 무엇이 올까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '별',
    choicesTemplate: ['별', '달', '연필'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '별,달,별,달,?' },
    hintStepsTemplate: ['별과 달이 번갈아 나와요.'],
    solutionStepsTemplate: ['달 다음에는 다시 별이에요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'pattern-cave-04',
    islandId: 'pattern-cave',
    stageOrder: 58,
    skill: 'pattern',
    difficulty: 1,
    learnerGoal: '색 반복을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '빨강, 파랑, 빨강, 파랑 다음은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '빨강',
    choicesTemplate: ['빨강', '파랑', '노랑'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '빨강,파랑,빨강,파랑,?' },
    hintStepsTemplate: ['두 색이 번갈아 나와요.'],
    solutionStepsTemplate: ['파랑 다음에는 빨강이 와요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'pattern-cave-05',
    islandId: 'pattern-cave',
    stageOrder: 59,
    skill: 'pattern',
    difficulty: 2,
    learnerGoal: '세 모양 반복을 찾아요',
    parentSummaryTag: 'repeating-patterns',
    promptTemplate: '사과, 별, 블록, 사과, 별 다음은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '블록',
    choicesTemplate: ['블록', '별', '사과'],
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '사과,별,블록,사과,별,?' },
    hintStepsTemplate: ['사과, 별, 블록이 한 묶음이에요.', '별 다음에는 블록이 와요.'],
    solutionStepsTemplate: ['반복되는 묶음은 사과, 별, 블록이에요.'],
    rewardId: 'patternRibbon',
  },
  {
    id: 'pattern-cave-06',
    islandId: 'pattern-cave',
    stageOrder: 60,
    skill: 'pattern',
    difficulty: 3,
    learnerGoal: '늘어나는 수 규칙을 찾아요',
    parentSummaryTag: 'growing-patterns',
    promptTemplate: '2, 4, 6, 8 다음 수는 무엇일까요?',
    answerType: 'number',
    paramSchema: {},
    solverRule: '10',
    visualModel: 'pattern-strip',
    visualConfig: { pattern: '2,4,6,8,?' },
    hintStepsTemplate: ['앞의 수보다 2씩 커져요.', '8에 2를 더해요.'],
    solutionStepsTemplate: ['2씩 커지는 규칙이므로 다음 수는 10이에요.'],
    rewardId: 'patternRibbon',
  },
]

type Grade1AuthoredExpansionSpec = Pick<
  Grade1MissionTemplateSource,
  | 'id'
  | 'islandId'
  | 'learnerGoal'
  | 'parentSummaryTag'
  | 'promptTemplate'
  | 'answerType'
  | 'paramSchema'
  | 'solverRule'
  | 'visualModel'
  | 'visualConfig'
  | 'hintStepsTemplate'
  | 'solutionStepsTemplate'
> & Partial<Pick<Grade1MissionTemplateSource, 'choicesTemplate' | 'difficulty'>>

const grade1ExpansionDefaults: Record<
  string,
  Pick<Grade1MissionTemplateSource, 'skill' | 'rewardId'>
> = {
  'count-cove': { skill: 'counting', rewardId: 'numberShard' },
  'order-bridge': { skill: 'comparison', rewardId: 'numberShard' },
  'orchard-port': { skill: 'addition', rewardId: 'patternRibbon' },
  'river-dock': { skill: 'subtraction', rewardId: 'patternRibbon' },
  'shape-forest': { skill: 'shape', rewardId: 'shapeBadge' },
  'clock-tower': { skill: 'time', rewardId: 'clockBadge' },
  'pattern-cave': { skill: 'pattern', rewardId: 'patternRibbon' },
}

function authoredExpansion(spec: Grade1AuthoredExpansionSpec): Grade1MissionTemplateSource {
  const defaults = grade1ExpansionDefaults[spec.islandId]
  if (!defaults) throw new Error(`${spec.id}: unknown Grade 1 expansion island`)
  return {
    ...defaults,
    ...spec,
    stageOrder: 0,
    difficulty: spec.difficulty ?? 2,
  }
}

const grade1AuthoredExpansionTemplates: Grade1MissionTemplateSource[] = [
  authoredExpansion({
    id: 'count-cove-01-v1-1', islandId: 'count-cove',
    learnerGoal: '아무것도 없는 모음을 0으로 나타내요', parentSummaryTag: 'zero-as-count',
    promptTemplate: '별이 하나도 없는 칸에는 몇 개라고 써야 할까요?', answerType: 'number',
    paramSchema: { count: { min: 0, max: 0 }, slots: { min: 5, max: 5 } }, solverRule: 'count',
    visualModel: 'counting-grid', visualConfig: { object: 'star', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['보이는 별이 하나도 없어요.', '하나도 없을 때는 0이라고 써요.'],
    solutionStepsTemplate: ['별을 세면 하나도 없어요.', '따라서 0개예요.'],
  }),
  authoredExpansion({
    id: 'count-cove-02-v1-2', islandId: 'count-cove',
    learnerGoal: '수 카드에 적힌 두 자리 수를 읽어요', parentSummaryTag: 'read-numbers-to-20',
    promptTemplate: '가운데 카드에 적힌 수는 얼마일까요?', answerType: 'choice',
    paramSchema: { number: { min: 14, max: 18 } }, solverRule: 'number',
    choicesTemplate: ['{{number}}', '{{number - 1}}', '{{number + 1}}'],
    visualModel: 'number-cards', visualConfig: { cards: '{{number - 1}},{{number}},{{number + 1}}', target: '{{number}}' },
    hintStepsTemplate: ['카드의 십의 자리와 일의 자리를 차례로 읽어요.'],
    solutionStepsTemplate: ['가운데 카드의 수는 {{number}}예요.'],
  }),
  authoredExpansion({
    id: 'count-cove-03-v1-3', islandId: 'count-cove',
    learnerGoal: '두 줄에 놓인 연필을 빠짐없이 세어요', parentSummaryTag: 'counting-to-20',
    promptTemplate: '연필은 모두 몇 자루일까요?', answerType: 'number',
    paramSchema: { count: { min: 17, max: 19 }, slots: { min: 20, max: 20 } }, solverRule: 'count',
    visualModel: 'counting-grid', visualConfig: { object: 'pencil', count: '{{count}}', slots: '{{slots}}', columns: 10 },
    hintStepsTemplate: ['첫 줄 10자루를 먼저 묶어요.', '둘째 줄을 이어서 세어요.'],
    solutionStepsTemplate: ['10자루와 나머지를 이어 세면 {{count}}자루예요.'],
  }),
  authoredExpansion({
    id: 'count-cove-04-v1-4', islandId: 'count-cove',
    learnerGoal: '0부터 센 수의 개수를 알아봐요', parentSummaryTag: 'zero-in-sequence',
    promptTemplate: '0부터 {{last}}까지 하나씩 말하면 수는 모두 몇 개일까요?', answerType: 'number',
    paramSchema: { last: { min: 5, max: 9 } }, solverRule: 'last + 1',
    visualModel: 'number-cards', visualConfig: { cards: '0,1,{{last}},?', target: '{{last + 1}}' },
    hintStepsTemplate: ['0도 하나의 수로 세어야 해요.', '마지막 수보다 개수가 하나 더 많아요.'],
    solutionStepsTemplate: ['0을 포함하므로 {{last}} + 1 = {{last + 1}}개예요.'],
  }),
  authoredExpansion({
    id: 'count-cove-05-v1-5', islandId: 'count-cove', difficulty: 3,
    learnerGoal: '잘못 센 수를 그림으로 검산해요', parentSummaryTag: 'counting-error-check',
    promptTemplate: '친구가 별을 {{count - 1}}개라고 셌어요. 그림을 다시 세면 몇 개일까요?', answerType: 'number',
    paramSchema: { count: { min: 15, max: 18 }, slots: { min: 20, max: 20 } }, solverRule: 'count',
    visualModel: 'counting-grid', visualConfig: { object: 'star', count: '{{count}}', slots: '{{slots}}', columns: 10 },
    hintStepsTemplate: ['10개가 찬 줄을 먼저 확인해요.', '남은 별을 한 번씩만 짚어요.'],
    solutionStepsTemplate: ['10개와 남은 별을 다시 세면 {{count}}개예요.'],
  }),

  authoredExpansion({
    id: 'order-bridge-01-v1-1', islandId: 'order-bridge',
    learnerGoal: '세 수 가운데 가장 큰 수를 골라요', parentSummaryTag: 'greatest-of-three',
    promptTemplate: '{{small}}, {{middle}}, {{large}} 중 가장 큰 수는 무엇일까요?', answerType: 'choice',
    paramSchema: { small: { min: 3, max: 6 }, middle: { min: 8, max: 11 }, large: { min: 14, max: 18 } },
    solverRule: 'large', choicesTemplate: ['{{large}}', '{{middle}}', '{{small}}'],
    visualModel: 'number-cards', visualConfig: { cards: '{{middle}},{{small}},{{large}}', target: '{{large}}' },
    hintStepsTemplate: ['수의 순서에서 가장 뒤에 있는 수를 찾아요.'],
    solutionStepsTemplate: ['{{large}}가 세 수 중 가장 커요.'],
  }),
  authoredExpansion({
    id: 'order-bridge-02-v1-2', islandId: 'order-bridge',
    learnerGoal: '세 수 가운데 가장 작은 수를 골라요', parentSummaryTag: 'least-of-three',
    promptTemplate: '{{large}}, {{small}}, {{middle}} 중 가장 작은 수는 무엇일까요?', answerType: 'choice',
    paramSchema: { small: { min: 2, max: 5 }, middle: { min: 7, max: 10 }, large: { min: 13, max: 17 } },
    solverRule: 'small', choicesTemplate: ['{{small}}', '{{middle}}', '{{large}}'],
    visualModel: 'number-cards', visualConfig: { cards: '{{large}},{{small}},{{middle}}', target: '{{small}}' },
    hintStepsTemplate: ['수의 순서에서 가장 앞에 있는 수를 찾아요.'],
    solutionStepsTemplate: ['{{small}}이 세 수 중 가장 작아요.'],
  }),
  authoredExpansion({
    id: 'order-bridge-03-v1-3', islandId: 'order-bridge',
    learnerGoal: '두 수 사이에 있는 수를 찾아요', parentSummaryTag: 'between-numbers',
    promptTemplate: '{{n}}과 {{n + 2}} 사이에 있는 수는 무엇일까요?', answerType: 'number',
    paramSchema: { n: { min: 4, max: 15 } }, solverRule: 'n + 1',
    visualModel: 'number-cards', visualConfig: { cards: '{{n}},?,{{n + 2}}', target: '{{n + 1}}' },
    hintStepsTemplate: ['{{n}} 다음 수를 한 번 말해 보아요.'],
    solutionStepsTemplate: ['{{n}} 다음이자 {{n + 2}} 앞의 수는 {{n + 1}}이에요.'],
  }),
  authoredExpansion({
    id: 'order-bridge-04-v1-4', islandId: 'order-bridge',
    learnerGoal: '큰 수부터 차례로 놓아요', parentSummaryTag: 'descending-order',
    promptTemplate: '{{small}}, {{large}}, {{middle}} 중 두 번째로 큰 수는 무엇일까요?', answerType: 'choice',
    paramSchema: { small: { min: 1, max: 5 }, middle: { min: 7, max: 11 }, large: { min: 14, max: 19 } },
    solverRule: 'middle', choicesTemplate: ['{{middle}}', '{{large}}', '{{small}}'],
    visualModel: 'number-cards', visualConfig: { cards: '{{small}},{{large}},{{middle}}', target: '{{middle}}' },
    hintStepsTemplate: ['가장 큰 수와 가장 작은 수를 먼저 찾으면 가운데 수가 남아요.'],
    solutionStepsTemplate: ['{{large}}, {{middle}}, {{small}} 순서이므로 두 번째는 {{middle}}이에요.'],
  }),
  authoredExpansion({
    id: 'order-bridge-05-v1-5', islandId: 'order-bridge', difficulty: 3,
    learnerGoal: '잘못 놓인 수 카드의 자리를 찾아요', parentSummaryTag: 'sequence-error-check',
    promptTemplate: '{{n}}, {{n + 2}}, {{n + 1}} 순서에서 두 번째 자리에 와야 할 수는 무엇일까요?', answerType: 'number',
    paramSchema: { n: { min: 5, max: 14 } }, solverRule: 'n + 1',
    visualModel: 'number-cards', visualConfig: { cards: '{{n}},{{n + 2}},{{n + 1}}', target: '{{n + 1}}' },
    hintStepsTemplate: ['하나씩 커지는 순서를 떠올려요.'],
    solutionStepsTemplate: ['{{n}} 다음 수는 {{n + 1}}이므로 두 번째 자리에 와야 해요.'],
  }),

  authoredExpansion({
    id: 'orchard-port-01-v1-1', islandId: 'orchard-port',
    learnerGoal: '10을 두 수로 나누어 빈 부분을 찾아요', parentSummaryTag: 'decompose-ten',
    promptTemplate: '사과 10개를 {{left}}개와 나머지로 나누었어요. 나머지는 몇 개일까요?', answerType: 'number',
    paramSchema: { total: { min: 10, max: 10 }, left: { min: 4, max: 7 } }, solverRule: 'total - left',
    visualModel: 'object-groups', visualConfig: { object: 'apple', operation: 'sub', total: '{{total}}', take: '{{left}}' },
    hintStepsTemplate: ['10에서 이미 나눈 {{left}}를 빼요.'],
    solutionStepsTemplate: ['10 - {{left}} = {{total - left}}이므로 나머지는 {{total - left}}개예요.'],
  }),
  authoredExpansion({
    id: 'orchard-port-02-v1-2', islandId: 'orchard-port',
    learnerGoal: '세 부분을 합쳐 하나의 수를 만들어요', parentSummaryTag: 'compose-three-parts',
    promptTemplate: '빨간 구슬 {{first}}개, 파란 구슬 {{second}}개, 노란 구슬 {{third}}개를 한 상자에 담으면 모두 몇 개일까요?', answerType: 'number',
    paramSchema: { first: { min: 2, max: 4 }, second: { min: 3, max: 5 }, third: { min: 1, max: 3 } }, solverRule: 'first + second + third',
    visualModel: 'number-cards', visualConfig: { cards: '{{first}},{{second}},{{third}}', target: '{{first + second + third}}' },
    hintStepsTemplate: ['세 부분을 빠짐없이 차례로 더해요.'],
    solutionStepsTemplate: ['{{first}} + {{second}} + {{third}} = {{first + second + third}}이므로 모두 {{first + second + third}}개예요.'],
  }),
  authoredExpansion({
    id: 'orchard-port-03-v1-3', islandId: 'orchard-port',
    learnerGoal: '10이 되도록 필요한 수를 적용해요', parentSummaryTag: 'make-ten',
    promptTemplate: '연필 {{left}}자루에 몇 자루를 더하면 10자루가 될까요?', answerType: 'number',
    paramSchema: { total: { min: 10, max: 10 }, left: { min: 5, max: 8 } }, solverRule: 'total - left',
    visualModel: 'object-groups', visualConfig: { object: 'pencil', operation: 'sub', total: '{{total}}', take: '{{left}}' },
    hintStepsTemplate: ['10에서 지금 있는 {{left}}를 빼요.'],
    solutionStepsTemplate: ['10은 {{left}}와 {{total - left}}로 나뉘므로 {{total - left}}자루가 필요해요.'],
  }),
  authoredExpansion({
    id: 'orchard-port-04-v1-4', islandId: 'orchard-port', difficulty: 3,
    learnerGoal: '수의 합성 설명이 맞는지 검산해요', parentSummaryTag: 'composition-error-check',
    promptTemplate: '친구가 {{left}}와 {{right}}를 합치면 {{left + right - 1}}이라고 했어요. 바른 수는 얼마일까요?', answerType: 'number',
    paramSchema: { left: { min: 6, max: 8 }, right: { min: 3, max: 5 } }, solverRule: 'left + right',
    visualModel: 'object-groups', visualConfig: { object: 'marble', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['두 모음의 구슬을 한 번씩 모두 세어요.'],
    solutionStepsTemplate: ['{{left}} + {{right}} = {{left + right}}이므로 바른 수는 {{left + right}}예요.'],
  }),

  authoredExpansion({
    id: 'river-dock-01-v1-1', islandId: 'river-dock',
    learnerGoal: '처음 수를 거꾸로 찾아요', parentSummaryTag: 'subtraction-missing-start',
    promptTemplate: '몇 개에서 {{take}}개를 빼니 {{remain}}개가 남았어요. 처음에는 몇 개였을까요?', answerType: 'number',
    paramSchema: { take: { min: 2, max: 5 }, remain: { min: 5, max: 9 } }, solverRule: 'take + remain',
    visualModel: 'number-cards', visualConfig: { cards: '{{remain}},{{take}},?', target: '{{take + remain}}' },
    hintStepsTemplate: ['남은 수와 뺀 수를 다시 합쳐요.'],
    solutionStepsTemplate: ['{{remain}} + {{take}} = {{take + remain}}이므로 처음에는 {{take + remain}}개였어요.'],
  }),
  authoredExpansion({
    id: 'river-dock-02-v1-2', islandId: 'river-dock',
    learnerGoal: '얼마를 빼야 하는지 찾아요', parentSummaryTag: 'subtraction-missing-take',
    promptTemplate: '{{total}}개에서 몇 개를 빼면 {{remain}}개가 남을까요?', answerType: 'number',
    paramSchema: { total: { min: 13, max: 18 }, remain: { min: 5, max: 8 } }, solverRule: 'total - remain',
    visualModel: 'number-cards', visualConfig: { cards: '{{total}},{{remain}},?', target: '{{total - remain}}' },
    hintStepsTemplate: ['전체와 남은 수의 차를 구해요.'],
    solutionStepsTemplate: ['{{total}} - {{remain}} = {{total - remain}}이므로 {{total - remain}}개를 빼야 해요.'],
  }),
  authoredExpansion({
    id: 'river-dock-03-v1-3', islandId: 'river-dock',
    learnerGoal: '두 번 줄어든 수를 구해요', parentSummaryTag: 'two-step-subtraction',
    promptTemplate: '블록 {{total}}개에서 {{first}}개를 치우고 또 {{second}}개를 치웠어요. 몇 개가 남았을까요?', answerType: 'number',
    paramSchema: { total: { min: 16, max: 19 }, first: { min: 3, max: 5 }, second: { min: 2, max: 4 } }, solverRule: 'total - first - second',
    visualModel: 'number-cards', visualConfig: { cards: '{{total}},{{first}},{{second}},?', target: '{{total - first - second}}' },
    hintStepsTemplate: ['두 번 치운 수를 차례로 빼요.'],
    solutionStepsTemplate: ['{{total}} - {{first}} - {{second}} = {{total - first - second}}이므로 {{total - first - second}}개가 남아요.'],
  }),
  authoredExpansion({
    id: 'river-dock-04-v1-4', islandId: 'river-dock', difficulty: 3,
    learnerGoal: '뺄셈의 순서 오류를 찾아 고쳐요', parentSummaryTag: 'subtraction-order-error',
    promptTemplate: '{{total}}개에서 {{take}}개를 빼야 하는데 거꾸로 계산했어요. 바른 나머지는 얼마일까요?', answerType: 'number',
    paramSchema: { total: { min: 14, max: 18 }, take: { min: 5, max: 8 } }, solverRule: 'total - take',
    visualModel: 'object-groups', visualConfig: { object: 'apple', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['전체인 {{total}}에서 없어진 {{take}}를 빼야 해요.'],
    solutionStepsTemplate: ['{{total}} - {{take}} = {{total - take}}이므로 바른 나머지는 {{total - take}}예요.'],
  }),

  authoredExpansion({
    id: 'shape-forest-01-v1-1', islandId: 'shape-forest',
    learnerGoal: '굴러가는 모양을 찾아요', parentSummaryTag: 'shape-in-life',
    promptTemplate: '바퀴처럼 굴러가는 평면 모양은 무엇일까요?', answerType: 'choice',
    paramSchema: {}, solverRule: '동그라미', choicesTemplate: ['동그라미', '세모', '네모'],
    visualModel: 'shape-cards', visualConfig: { shapes: '세모,동그라미,네모', target: '동그라미' },
    hintStepsTemplate: ['모서리가 없는 둥근 모양을 찾아요.'],
    solutionStepsTemplate: ['동그라미는 둥글어서 바퀴 모양으로 알맞아요.'],
  }),
  authoredExpansion({
    id: 'shape-forest-02-v1-2', islandId: 'shape-forest',
    learnerGoal: '막대 세 개로 만들 모양을 골라요', parentSummaryTag: 'shape-construction',
    promptTemplate: '길이가 같은 막대 3개를 끝끼리 이어 닫힌 모양을 만들려고 해요. 어떤 모양이 될까요?', answerType: 'choice',
    paramSchema: {}, solverRule: '세모', choicesTemplate: ['세모', '동그라미', '네모'],
    visualModel: 'shape-cards', visualConfig: { shapes: '동그라미,네모,세모', target: '세모' },
    hintStepsTemplate: ['막대 하나가 곧은 변 하나가 돼요.'],
    solutionStepsTemplate: ['막대 3개를 이어 만든 닫힌 모양은 변이 3개인 세모예요.'],
  }),
  authoredExpansion({
    id: 'shape-forest-03-v1-3', islandId: 'shape-forest',
    learnerGoal: '변의 수로 네모를 찾아요', parentSummaryTag: 'shape-by-sides',
    promptTemplate: '반듯한 변이 4개인 모양은 무엇일까요?', answerType: 'choice',
    paramSchema: {}, solverRule: '네모', choicesTemplate: ['네모', '세모', '동그라미'],
    visualModel: 'shape-cards', visualConfig: { shapes: '네모,동그라미,세모', target: '네모' },
    hintStepsTemplate: ['모양의 테두리를 따라 변을 세어요.'],
    solutionStepsTemplate: ['변이 4개인 모양은 네모예요.'],
  }),
  authoredExpansion({
    id: 'shape-forest-04-v1-4', islandId: 'shape-forest',
    learnerGoal: '생활 물건에 알맞은 모양을 적용해요', parentSummaryTag: 'shape-modeling',
    promptTemplate: '삼각 깃발을 나타내기에 알맞은 모양은 무엇일까요?', answerType: 'choice',
    paramSchema: {}, solverRule: '세모', choicesTemplate: ['세모', '네모', '동그라미'],
    visualModel: 'shape-cards', visualConfig: { shapes: '동그라미,세모,네모', target: '세모' },
    hintStepsTemplate: ['삼각 깃발은 세 변으로 둘러싸여 있어요.'],
    solutionStepsTemplate: ['삼각 깃발과 같은 모양은 세모예요.'],
  }),
  authoredExpansion({
    id: 'shape-forest-05-v1-5', islandId: 'shape-forest', difficulty: 3,
    learnerGoal: '모양의 성질을 잘못 말한 설명을 고쳐요', parentSummaryTag: 'shape-error-check',
    promptTemplate: '친구가 네모의 변은 3개라고 했어요. 네모의 변은 몇 개일까요?', answerType: 'number',
    paramSchema: { sides: { min: 4, max: 4 } }, solverRule: 'sides',
    visualModel: 'number-cards', visualConfig: { cards: '3,4,5', target: '{{sides}}' },
    hintStepsTemplate: ['네모의 테두리를 따라 선을 세어요.'],
    solutionStepsTemplate: ['네모는 반듯한 변이 4개예요.'],
  }),

  authoredExpansion({
    id: 'clock-tower-01-v1-1', islandId: 'clock-tower',
    learnerGoal: '아침 정각을 읽어요', parentSummaryTag: 'time-hour',
    promptTemplate: '등교 준비 시계는 몇 시를 가리킬까요?', answerType: 'choice',
    paramSchema: { hour: { min: 6, max: 8 }, minute: { min: 0, max: 0 } }, solverRule: '{{hour}}시',
    choicesTemplate: ['{{hour}}시', '{{hour - 1}}시', '{{hour + 1}}시'],
    visualModel: 'clock-face', visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘이 12면 정각이에요.'],
    solutionStepsTemplate: ['짧은 바늘이 {{hour}}를 가리켜 {{hour}}시예요.'],
  }),
  authoredExpansion({
    id: 'clock-tower-02-v1-2', islandId: 'clock-tower',
    learnerGoal: '오후 30분 시각을 읽어요', parentSummaryTag: 'time-half-hour',
    promptTemplate: '놀이 시간 시계는 몇 시 30분일까요?', answerType: 'choice',
    paramSchema: { hour: { min: 2, max: 5 }, minute: { min: 30, max: 30 } }, solverRule: '{{hour}}시 30분',
    choicesTemplate: ['{{hour}}시 30분', '{{hour}}시', '{{hour + 1}}시 30분'],
    visualModel: 'clock-face', visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘이 6이면 30분이에요.'],
    solutionStepsTemplate: ['긴 바늘은 30분, 짧은 바늘은 {{hour}}를 지나 {{hour}}시 30분이에요.'],
  }),
  authoredExpansion({
    id: 'clock-tower-03-v1-3', islandId: 'clock-tower',
    learnerGoal: '정각 시각의 짧은바늘을 읽어요', parentSummaryTag: 'clock-hands',
    promptTemplate: '긴 바늘이 12에 있을 때 짧은 바늘이 {{hour}}를 가리키면 몇 시일까요?', answerType: 'choice',
    paramSchema: { hour: { min: 4, max: 9 }, minute: { min: 0, max: 0 } }, solverRule: '{{hour}}시',
    choicesTemplate: ['{{hour}}시', '{{hour - 1}}시', '{{hour + 1}}시'],
    visualModel: 'clock-face', visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['정각에는 짧은 바늘이 가리키는 수를 읽어요.'],
    solutionStepsTemplate: ['짧은 바늘이 {{hour}}를 가리키므로 {{hour}}시예요.'],
  }),
  authoredExpansion({
    id: 'clock-tower-04-v1-4', islandId: 'clock-tower',
    learnerGoal: '한 시간 뒤의 시각을 구해요', parentSummaryTag: 'one-hour-later',
    promptTemplate: '{{hour}}시에 책 읽기를 시작해 1시간 뒤에 끝냈어요. 끝난 시각은 몇 시일까요?', answerType: 'choice',
    paramSchema: { hour: { min: 2, max: 8 }, minute: { min: 0, max: 0 } }, solverRule: '{{hour + 1}}시',
    choicesTemplate: ['{{hour + 1}}시', '{{hour}}시', '{{hour + 2}}시'],
    visualModel: 'clock-face', visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['짧은 바늘을 한 칸 앞으로 옮겨요.'],
    solutionStepsTemplate: ['{{hour}}시에서 1시간 뒤는 {{hour + 1}}시예요.'],
  }),
  authoredExpansion({
    id: 'clock-tower-05-v1-5', islandId: 'clock-tower',
    learnerGoal: '한 시간 전의 시각을 구해요', parentSummaryTag: 'one-hour-before',
    promptTemplate: '{{hour}}시보다 1시간 전은 몇 시일까요?', answerType: 'choice',
    paramSchema: { hour: { min: 3, max: 10 }, minute: { min: 0, max: 0 } }, solverRule: '{{hour - 1}}시',
    choicesTemplate: ['{{hour - 1}}시', '{{hour}}시', '{{hour + 1}}시'],
    visualModel: 'clock-face', visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['짧은 바늘을 한 칸 뒤로 옮겨요.'],
    solutionStepsTemplate: ['{{hour}}시에서 1시간 전은 {{hour - 1}}시예요.'],
  }),
  authoredExpansion({
    id: 'clock-tower-06-v1-6', islandId: 'clock-tower',
    learnerGoal: '두 일정 중 먼저인 시각을 골라요', parentSummaryTag: 'compare-times',
    promptTemplate: '{{early}}시와 {{late}}시 중 더 이른 시각은 언제일까요?', answerType: 'choice',
    paramSchema: { early: { min: 2, max: 5 }, late: { min: 7, max: 10 }, minute: { min: 0, max: 0 } }, solverRule: '{{early}}시',
    choicesTemplate: ['{{early}}시', '{{late}}시', '{{early + 1}}시'],
    visualModel: 'clock-face', visualConfig: { hour: '{{early}}', minute: '{{minute}}' },
    hintStepsTemplate: ['하루의 시각 순서에서 먼저 오는 수를 찾아요.'],
    solutionStepsTemplate: ['{{early}}시가 {{late}}시보다 먼저예요.'],
  }),
  authoredExpansion({
    id: 'clock-tower-07-v1-7', islandId: 'clock-tower', difficulty: 3,
    learnerGoal: '시계 읽기 오류를 바르게 고쳐요', parentSummaryTag: 'clock-error-check',
    promptTemplate: '긴 바늘이 6, 짧은 바늘이 {{hour}}를 지났는데 {{hour}}시라고 읽었어요. 바른 시각은?', answerType: 'choice',
    paramSchema: { hour: { min: 3, max: 8 }, minute: { min: 30, max: 30 } }, solverRule: '{{hour}}시 30분',
    choicesTemplate: ['{{hour}}시 30분', '{{hour}}시', '{{hour + 1}}시'],
    visualModel: 'clock-face', visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘이 6이면 30분을 꼭 붙여 읽어요.'],
    solutionStepsTemplate: ['짧은 바늘은 {{hour}}를 지났고 긴 바늘은 30분이므로 {{hour}}시 30분이에요.'],
  }),

  authoredExpansion({
    id: 'pattern-cave-01-v1-1', islandId: 'pattern-cave',
    learnerGoal: '반복 순서를 뒤바꾼 오류를 고쳐요', parentSummaryTag: 'pattern-error-check',
    promptTemplate: '네모, 동그라미가 번갈아 나오는데 친구가 동그라미 다음도 동그라미라고 했어요. 바른 다음 모양은?', answerType: 'choice',
    paramSchema: {}, solverRule: '네모', choicesTemplate: ['네모', '동그라미', '세모'],
    visualModel: 'pattern-strip', visualConfig: { pattern: '네모,동그라미,네모,동그라미,?' },
    hintStepsTemplate: ['두 모양이 한 묶음으로 번갈아 반복돼요.'],
    solutionStepsTemplate: ['친구는 같은 모양을 두 번 놓았어요.', '동그라미 다음에는 네모가 와요.'],
  }),
  authoredExpansion({
    id: 'pattern-cave-02-v1-2', islandId: 'pattern-cave',
    learnerGoal: '반복되는 한 묶음의 크기를 찾아요', parentSummaryTag: 'pattern-unit-size',
    promptTemplate: '별, 블록, 사과가 같은 순서로 반복돼요. 반복되는 한 묶음에는 물건이 몇 개일까요?', answerType: 'number',
    paramSchema: { unitSize: { min: 3, max: 3 } }, solverRule: 'unitSize',
    visualModel: 'pattern-strip', visualConfig: { pattern: '별,블록,사과,별,블록,사과' },
    hintStepsTemplate: ['처음과 똑같은 별이 다시 나오기 전까지 세어요.'],
    solutionStepsTemplate: ['별, 블록, 사과의 3개가 한 묶음이에요.'],
  }),
  authoredExpansion({
    id: 'pattern-cave-03-v1-3', islandId: 'pattern-cave',
    learnerGoal: '하나씩 커지는 수 규칙을 찾아요', parentSummaryTag: 'increase-by-one',
    promptTemplate: '{{start}}, {{start + 1}}, {{start + 2}}, {{start + 3}} 다음 수는 무엇일까요?', answerType: 'number',
    paramSchema: { start: { min: 2, max: 8 } }, solverRule: 'start + 4',
    visualModel: 'pattern-strip', visualConfig: { pattern: '{{start}},{{start + 1}},{{start + 2}},{{start + 3}},?' },
    hintStepsTemplate: ['앞의 수보다 1씩 커져요.'],
    solutionStepsTemplate: ['{{start + 3}}보다 1 큰 수는 {{start + 4}}예요.'],
  }),
  authoredExpansion({
    id: 'pattern-cave-04-v1-4', islandId: 'pattern-cave',
    learnerGoal: '두 번씩 나오는 모양 규칙을 적용해요', parentSummaryTag: 'paired-pattern',
    promptTemplate: '세모가 두 번, 네모가 두 번 나오는 규칙에서 다음 모양은 무엇일까요?', answerType: 'choice',
    paramSchema: {}, solverRule: '세모', choicesTemplate: ['세모', '네모', '동그라미'],
    visualModel: 'pattern-strip', visualConfig: { pattern: '세모,세모,네모,네모,?' },
    hintStepsTemplate: ['같은 모양이 두 번씩 나와요.'],
    solutionStepsTemplate: ['네모 두 번 뒤에는 다시 세모가 와요.'],
  }),
  authoredExpansion({
    id: 'pattern-cave-05-v1-5', islandId: 'pattern-cave',
    learnerGoal: '둘씩 커지는 규칙의 잘못된 수를 고쳐요', parentSummaryTag: 'increase-by-two-error',
    promptTemplate: '{{start}}, {{start + 2}}, {{start + 5}}, {{start + 6}}에서 규칙에 맞지 않는 세 번째 수를 무엇으로 고쳐야 할까요?', answerType: 'number',
    paramSchema: { start: { min: 1, max: 6 } }, solverRule: 'start + 4',
    visualModel: 'pattern-strip', visualConfig: { pattern: '{{start}},{{start + 2}},{{start + 5}},{{start + 6}}' },
    hintStepsTemplate: ['앞 수에 2를 더해 세 번째 수를 다시 만들어요.'],
    solutionStepsTemplate: ['{{start + 2}}에 2를 더한 {{start + 4}}로 고쳐야 해요.'],
  }),
  authoredExpansion({
    id: 'pattern-cave-06-v1-6', islandId: 'pattern-cave',
    learnerGoal: '거꾸로 하나씩 작아지는 규칙을 적용해요', parentSummaryTag: 'decrease-by-one',
    promptTemplate: '{{start}}, {{start - 1}}, {{start - 2}}, {{start - 3}} 다음 수는 무엇일까요?', answerType: 'number',
    paramSchema: { start: { min: 8, max: 12 } }, solverRule: 'start - 4',
    visualModel: 'pattern-strip', visualConfig: { pattern: '{{start}},{{start - 1}},{{start - 2}},{{start - 3}},?' },
    hintStepsTemplate: ['앞의 수보다 1씩 작아져요.'],
    solutionStepsTemplate: ['{{start - 3}}보다 1 작은 수는 {{start - 4}}예요.'],
  }),
  authoredExpansion({
    id: 'pattern-cave-01-v1-7', islandId: 'pattern-cave',
    learnerGoal: '색과 모양이 함께 바뀌는 규칙을 설명해요', parentSummaryTag: 'combined-pattern',
    promptTemplate: '동그라미, 동그라미, 세모가 반복될 때 물음표 자리는 무엇일까요?', answerType: 'choice',
    paramSchema: {}, solverRule: '동그라미', choicesTemplate: ['동그라미', '세모', '네모'],
    visualModel: 'pattern-strip', visualConfig: { pattern: '동그라미,동그라미,세모,동그라미,?' },
    hintStepsTemplate: ['동그라미 두 번 뒤에 세모 한 번이 나와요.'],
    solutionStepsTemplate: ['새 묶음의 두 번째 자리도 동그라미예요.'],
  }),
  authoredExpansion({
    id: 'pattern-cave-02-v1-8', islandId: 'pattern-cave', difficulty: 3,
    learnerGoal: '잘못 이어진 수 규칙을 찾아 고쳐요', parentSummaryTag: 'pattern-error-check',
    promptTemplate: '{{start}}, {{start + 2}}, {{start + 4}}, {{start + 7}}에서 마지막 수를 규칙에 맞게 고치면?', answerType: 'number',
    paramSchema: { start: { min: 2, max: 6 } }, solverRule: 'start + 6',
    visualModel: 'pattern-strip', visualConfig: { pattern: '{{start}},{{start + 2}},{{start + 4}},{{start + 7}},?' },
    hintStepsTemplate: ['앞의 두 칸이 얼마나 커지는지 비교해요.'],
    solutionStepsTemplate: ['2씩 커지는 규칙이므로 마지막 수는 {{start + 6}}이어야 해요.'],
  }),
]

const grade1BaseMissionTemplates: Grade1MissionTemplateSource[] = [
  ...grade1AlphaMissionTemplates,
  ...grade1BetaMissionTemplates,
]

const grade1IslandTargets: Record<string, number> = {
  'count-cove': 14,
  'order-bridge': 14,
  'orchard-port': 14,
  'river-dock': 14,
  'shape-forest': 14,
  'clock-tower': 14,
  'pattern-cave': 14,
}

const grade1LegacyIslandTargets: Record<string, number> = {
  'count-cove': 14,
  'order-bridge': 14,
  'orchard-port': 14,
  'river-dock': 14,
  'shape-forest': 14,
  'clock-tower': 13,
  'pattern-cave': 13,
}

function deriveGrade1ProblemFamily(source: Grade1MissionTemplateSource): string {
  switch (source.skill) {
    case 'counting':
      return 'counting-cardinality'
    case 'comparison':
      return /순서|사이|앞|뒤|두 번째/.test(source.promptTemplate)
        ? 'number-order'
        : 'number-comparison'
    case 'addition': {
      const plusCount = source.solverRule.match(/\+/g)?.length ?? 0
      if (source.solverRule.includes('-')) return 'part-whole-missing-part'
      return plusCount >= 2 ? 'addition-three-parts' : 'addition-composition'
    }
    case 'subtraction':
      return (source.solverRule.match(/-/g)?.length ?? 0) >= 2
        ? 'subtraction-two-step'
        : 'subtraction-take-away'
    case 'shape':
      if (source.answerType === 'number') return 'shape-property-count'
      return /만들|이어/.test(source.promptTemplate)
        ? 'shape-construction'
        : 'shape-identification'
    case 'time':
      if (/주일|요일|날짜|달력/.test(source.promptTemplate)) return 'calendar-relation'
      if (/동안|시간이 지났|몇 시간|한 시간 뒤/.test(source.promptTemplate)) return 'elapsed-time'
      return 'clock-reading-order'
    case 'pattern':
      if (/한 묶음/.test(source.promptTemplate)) return 'repeating-unit-size'
      return source.answerType === 'number' ? 'numeric-pattern' : 'repeating-pattern'
  }
}

function deriveGrade1ContextType(source: Grade1MissionTemplateSource): string {
  const object = source.visualConfig.object
  if (typeof object === 'string' && object.trim()) {
    const layout = source.visualConfig.columns ? 'grouped' : 'single'
    const story = /있었|모았|받았|주었|치웠|남았/.test(source.promptTemplate) ? 'story' : 'direct'
    return `objects:${object.trim()}:${layout}:${story}`
  }
  if (source.skill === 'comparison') {
    const cards = source.visualConfig.cards
    const cardCount = typeof cards === 'string' ? cards.split(',').length : 0
    return cardCount >= 3 ? 'number-set' : 'number-pair'
  }
  if (source.skill === 'shape') {
    return /바퀴|깃발|생활/.test(source.promptTemplate) ? 'life-shapes' : 'abstract-shapes'
  }
  if (source.skill === 'time') {
    if (/주일|요일|날짜|달력/.test(source.promptTemplate)) return 'calendar'
    if (/긴 바늘|짧은 바늘/.test(source.promptTemplate)) return 'clock-hands'
    if (/등교|준비|생활/.test(source.promptTemplate)) return 'daily-clock'
    return 'clock'
  }
  if (source.skill === 'pattern') {
    if (source.answerType === 'number') return 'number-sequence'
    if (/빨강|파랑|노랑|색/.test(source.promptTemplate)) return 'color-sequence'
    return 'object-shape-sequence'
  }
  return source.visualModel === 'number-cards' ? 'abstract-numbers' : source.visualModel
}

function deriveGrade1ReasoningPattern(
  actions: readonly Grade1TaskAction[],
  cognitiveDomain: Grade1CognitiveDomain,
): string {
  if (actions.includes('analyze_error')) return 'error-analysis'
  if (actions.includes('construct')) return 'construction'
  if (actions.includes('explain') || actions.includes('reason')) return 'justification'
  return cognitiveDomain
}

function buildGrade1V1MissionTemplates(): Grade1MissionTemplate[] {
  let stageOrder = 1
  const result: Grade1MissionTemplate[] = []

  for (const island of grade1Islands) {
    const originals = grade1BaseMissionTemplates
      .filter((mission) => mission.islandId === island.id)
      .sort((left, right) => left.stageOrder - right.stageOrder)
    const authored = [
      ...originals,
      ...grade1AuthoredExpansionTemplates.filter((mission) => mission.islandId === island.id),
    ]
    const target = grade1IslandTargets[island.id] ?? originals.length
    if (authored.length !== target) {
      throw new Error(`${island.id}: expected ${target} authored missions, got ${authored.length}`)
    }

    authored.forEach((source, islandIndex) => {
      const metadata = grade1QualityMetadataBySourceId[source.id]
      const fallbackCode = metadata?.curriculumCodes[0]
        ?? grade1AllowedCurriculumCodesByIsland[island.id]?.[0]
        ?? '[2수01-01]'
      const position = islandIndex % 7
      const cognitiveDomain: Grade1CognitiveDomain = position < 3
        ? 'knowing'
        : position < 6
          ? 'applying'
          : 'reasoning'
      const directCurriculumCodes = island.id === 'count-cove'
        ? ['[2수01-01]']
        : island.id === 'orchard-port'
          ? ['[2수01-04]']
          : []
      const taskActions = metadata?.taskActions ?? (
        cognitiveDomain === 'reasoning' ? ['analyze_error'] : ['model']
      )
      result.push({
        ...source,
        stageOrder,
        mode: islandIndex < 7 ? 'basic' : 'practice',
        curriculumCodes: Array.from(new Set([
          ...(metadata?.curriculumCodes ?? [fallbackCode]),
          ...directCurriculumCodes,
        ])),
        directCurriculumCodes,
        taskActions,
        visualSemantics: metadata?.visualSemantics ?? (
          source.visualModel === 'counting-grid' || source.visualModel === 'object-groups'
            ? 'quantitative'
            : 'schematic'
        ),
        cognitiveDomain,
        problemFamily: deriveGrade1ProblemFamily(source),
        contextType: deriveGrade1ContextType(source),
        representationTypes: [source.visualModel, `input:${source.answerType}`],
        reasoningPattern: deriveGrade1ReasoningPattern(taskActions, cognitiveDomain),
        authoredSourceKey: source.id,
      })
      stageOrder += 1
    })
  }

  return result
}

export const grade1MissionTemplates: Grade1MissionTemplate[] = buildGrade1V1MissionTemplates()

export const SAFE_GRADE1_MISSION_ID = 'count-cove-01'

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
  schema: Grade1MissionTemplate['paramSchema'],
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

  if (params[evalExpr] !== undefined) {
    return String(params[evalExpr])
  }

  for (const [key, value] of Object.entries(params)) {
    evalExpr = evalExpr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value))
  }

  if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
    try {
      // Internal mission templates only allow arithmetic after variable substitution.
      return String(Function(`"use strict"; return (${evalExpr})`)())
    } catch {
      return expr
    }
  }

  return expr
}

function renderTemplate(template: string, params: Record<string, number>): string {
  if (!template.includes('{{')) {
    return evaluateExpression(template, params)
  }

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
  config: Grade1VisualConfig,
  params: Record<string, number>
): Grade1VisualConfig {
  return Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (typeof value !== 'string') return [key, value]
      return [key, coerceRenderedValue(renderTemplate(value, params))]
    })
  )
}

export function renderGrade1MissionFromParams(
  template: Grade1MissionTemplate,
  params: Record<string, number>,
  random: () => number
): Grade1Mission {
  const correctAnswer = renderTemplate(template.solverRule, params)
  const choices = template.choicesTemplate
    ? template.choicesTemplate.map((choice) => renderTemplate(choice, params))
    : undefined
  const shuffledChoices = choices ? shuffleArray(choices, random) : undefined

  return {
    id: template.id,
    islandId: template.islandId,
    stageOrder: template.stageOrder,
    mode: template.mode,
    skill: template.skill,
    difficulty: template.difficulty,
    learnerGoal: template.learnerGoal,
    parentSummaryTag: template.parentSummaryTag,
    curriculumCodes: template.curriculumCodes,
    directCurriculumCodes: template.directCurriculumCodes,
    taskActions: template.taskActions,
    visualSemantics: template.visualSemantics,
    cognitiveDomain: template.cognitiveDomain,
    problemFamily: template.problemFamily,
    contextType: template.contextType,
    representationTypes: template.representationTypes,
    reasoningPattern: template.reasoningPattern,
    authoredSourceKey: template.authoredSourceKey,
    prompt: renderTemplate(template.promptTemplate, params),
    answerType: template.answerType,
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

export function renderGrade1Mission(
  template: Grade1MissionTemplate,
  seed = template.stageOrder
): Grade1Mission {
  const random = seededRandom(seed + template.stageOrder * 997)
  const params = generateParams(template.paramSchema, random)
  return renderGrade1MissionFromParams(template, params, random)
}

export function getGrade1Missions(seed = 20260509): Grade1Mission[] {
  return grade1MissionTemplates
    .slice()
    .sort((a, b) => a.stageOrder - b.stageOrder)
    .map((template) => renderGrade1Mission(template, seed))
}

export function getSafeGrade1Mission(seed = 20260509): Grade1Mission {
  const safeTemplate = grade1MissionTemplates.find((template) => template.id === SAFE_GRADE1_MISSION_ID)
  if (!safeTemplate) {
    throw new Error('Safe Grade 1 mission is missing')
  }
  return renderGrade1Mission(safeTemplate, seed)
}

export function getGrade1MissionById(id: string, seed = 20260509): Grade1Mission {
  const template = grade1MissionTemplates.find((item) => item.id === id)
  return template ? renderGrade1Mission(template, seed) : getSafeGrade1Mission(seed)
}

export function getGrade1IslandById(id: string): Grade1Island | undefined {
  return grade1Islands.find((island) => island.id === id)
}

export function getGrade1PracticeMissionIds(islandId: string): string[] {
  return grade1MissionTemplates
    .filter((mission) => mission.islandId === islandId && mission.mode === 'practice')
    .sort((left, right) => left.stageOrder - right.stageOrder)
    .map((mission) => mission.id)
}

export function getGrade1LegacyMissionIds(islandId: string): string[] {
  const originals = grade1BaseMissionTemplates
    .filter((mission) => mission.islandId === islandId)
    .sort((left, right) => left.stageOrder - right.stageOrder)
  const ids = originals.map((mission) => mission.id)
  const target = grade1LegacyIslandTargets[islandId] ?? originals.length
  for (let index = originals.length; index < target; index += 1) {
    const source = originals[(index - originals.length) % originals.length]
    const round = index - originals.length + 1
    ids.push(`${source.id}-v1-${round}`)
  }
  return ids
}

function normalizeGrade1SolutionRule(value: string): string {
  const identifierMap = new Map<string, string>()
  let identifierIndex = 0
  return value
    .replace(/\{\{|\}\}/g, '')
    .replace(/\d+(?:\.\d+)?/g, '#')
    .replace(/[A-Za-z_][A-Za-z0-9_]*/g, (identifier) => {
      const existing = identifierMap.get(identifier)
      if (existing) return existing
      const normalized = `v${identifierIndex + 1}`
      identifierIndex += 1
      identifierMap.set(identifier, normalized)
      return normalized
    })
    .replace(/\s+/g, '')
}

export function buildGrade1AuthoredMathSignature(
  template: Grade1MissionTemplate,
): string {
  return JSON.stringify({
    curriculumStandards: [...template.curriculumCodes].sort(),
    problemFamily: template.problemFamily,
    solutionRule: normalizeGrade1SolutionRule(template.solverRule),
    contextType: template.contextType,
    representationTypes: [...template.representationTypes].sort(),
    taskActions: [...template.taskActions].sort(),
    reasoningPattern: template.reasoningPattern,
  })
}

export interface Grade1ValidationResult {
  errors: string[]
  warnings: string[]
}

export interface Grade1VariantAuditResult {
  sourceCount: number
  variantCount: number
  errors: string[]
}

function enumerateGrade1Params(
  schema: Grade1MissionTemplate['paramSchema']
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

function renderedTextHasPlaceholder(mission: Grade1Mission) {
  return [
    mission.prompt,
    mission.correctAnswer,
    ...(mission.choices ?? []),
    ...mission.hintSteps,
    ...mission.solutionSteps,
    ...Object.values(mission.visualConfig).map(String),
  ].some((value) => /{{|}}/.test(value))
}

function expectedGrade1VisualAnswer(mission: Grade1Mission): string | undefined {
  if (mission.visualModel === 'counting-grid') {
    return String(mission.visualConfig.count)
  }
  if (mission.visualModel === 'object-groups') {
    const operation = String(mission.visualConfig.operation)
    if (operation === 'add') {
      return String(Number(mission.visualConfig.left) + Number(mission.visualConfig.right))
    }
    if (operation === 'sub') {
      return String(Number(mission.visualConfig.total) - Number(mission.visualConfig.take))
    }
  }
  if (mission.visualModel === 'number-cards' || mission.visualModel === 'shape-cards') {
    return String(mission.visualConfig.target)
  }
  return undefined
}

export function auditGrade1MissionVariants(
  templates: Grade1MissionTemplate[] = grade1MissionTemplates
): Grade1VariantAuditResult {
  const errors: string[] = []
  let variantCount = 0

  for (const template of templates) {
    const variants = enumerateGrade1Params(template.paramSchema)
    for (let index = 0; index < variants.length; index += 1) {
      const mission = renderGrade1MissionFromParams(
        template,
        variants[index],
        seededRandom(template.stageOrder * 10_000 + index + 1)
      )
      variantCount += 1
      const label = `${template.id} variant ${index + 1}`
      if (renderedTextHasPlaceholder(mission)) errors.push(`${label}: unresolved template placeholder`)
      if (!mission.correctAnswer.trim()) errors.push(`${label}: empty correct answer`)
      if (/^-\d/.test(mission.correctAnswer)) errors.push(`${label}: negative correct answer`)

      if (mission.answerType === 'choice') {
        const choices = mission.choices ?? []
        if (new Set(choices).size !== choices.length) errors.push(`${label}: duplicate choices`)
        const correctCount = choices.filter((choice) => choice === mission.correctAnswer).length
        if (correctCount !== 1) errors.push(`${label}: expected one correct choice, got ${correctCount}`)
      }

      const visualAnswer = expectedGrade1VisualAnswer(mission)
      if (visualAnswer !== undefined && visualAnswer !== mission.correctAnswer) {
        errors.push(`${label}: visual answer ${visualAnswer} does not match ${mission.correctAnswer}`)
      }
    }
  }

  return { sourceCount: templates.length, variantCount, errors }
}

export function validateGrade1MissionBank(
  templates: Grade1MissionTemplate[] = grade1MissionTemplates
): Grade1ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  const stageOrders = new Set<number>()
  const supportedVisualModels: Grade1VisualModel[] = [
    'counting-grid',
    'object-groups',
    'number-cards',
    'shape-cards',
    'clock-face',
    'pattern-strip',
  ]
  const rewardIds: Grade1RewardId[] = [
    'numberShard',
    'shapeBadge',
    'clockBadge',
    'patternRibbon',
  ]

  for (const template of templates) {
    if (ids.has(template.id)) errors.push(`Duplicate mission id: ${template.id}`)
    ids.add(template.id)

    if (stageOrders.has(template.stageOrder)) {
      errors.push(`Duplicate stage order: ${template.stageOrder}`)
    }
    stageOrders.add(template.stageOrder)

    if (!grade1Islands.some((island) => island.id === template.islandId)) {
      errors.push(`${template.id}: unknown island ${template.islandId}`)
    }
    if (!supportedVisualModels.includes(template.visualModel)) {
      errors.push(`${template.id}: unsupported visual model ${template.visualModel}`)
    }
    if (!rewardIds.includes(template.rewardId)) {
      errors.push(`${template.id}: unknown reward ${template.rewardId}`)
    }
    if (!template.learnerGoal.trim()) errors.push(`${template.id}: missing learnerGoal`)
    if (!template.parentSummaryTag.trim()) errors.push(`${template.id}: missing parentSummaryTag`)
    if (template.curriculumCodes.length === 0) errors.push(`${template.id}: missing curriculumCodes`)
    if (!template.authoredSourceKey || template.authoredSourceKey !== template.id) {
      errors.push(`${template.id}: must own its authored source identity`)
    }
    if (!template.problemFamily) errors.push(`${template.id}: missing problemFamily`)
    if (template.mode !== 'basic' && template.mode !== 'practice') {
      errors.push(`${template.id}: invalid learning mode`)
    }
    if (template.taskActions.length === 0) errors.push(`${template.id}: missing taskActions`)
    if (template.visualSemantics !== 'schematic' && template.visualSemantics !== 'quantitative') {
      errors.push(`${template.id}: visualSemantics must match the required visual`)
    }
    if (template.hintStepsTemplate.length === 0) errors.push(`${template.id}: missing hints`)
    if (template.solutionStepsTemplate.length === 0) errors.push(`${template.id}: missing solution steps`)
    if (template.answerType === 'choice' && (!template.choicesTemplate || template.choicesTemplate.length < 2)) {
      errors.push(`${template.id}: choice mission needs at least two choices`)
    }
    if (template.answerType === 'number' && template.choicesTemplate) {
      warnings.push(`${template.id}: number mission ignores choicesTemplate`)
    }

    for (const seed of [1, 7, 23]) {
      const mission = renderGrade1Mission(template, seed)
      if (!mission.correctAnswer.trim()) errors.push(`${template.id}: empty answer at seed ${seed}`)
      if (mission.answerType === 'choice') {
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

  if (!ids.has(SAFE_GRADE1_MISSION_ID)) {
    errors.push(`Safe mission id is missing: ${SAFE_GRADE1_MISSION_ID}`)
  }
  if (templates.length !== 98) errors.push(`V1 expects 98 missions, got ${templates.length}`)
  for (const island of grade1Islands) {
    const islandTemplates = templates.filter((template) => template.islandId === island.id)
    const expectedDomains: Record<Grade1CognitiveDomain, number> = {
      knowing: 6,
      applying: 6,
      reasoning: 2,
    }
    if (islandTemplates.length !== 14) {
      errors.push(`${island.id}: expected 14 missions, got ${islandTemplates.length}`)
    }
    for (const mode of ['basic', 'practice'] as const) {
      const count = islandTemplates.filter((template) => template.mode === mode).length
      if (count !== 7) errors.push(`${island.id}: expected 7 ${mode} missions, got ${count}`)
    }
    for (const [domain, expected] of Object.entries(expectedDomains)) {
      const count = islandTemplates.filter((template) => template.cognitiveDomain === domain).length
      if (count !== expected) {
        errors.push(`${island.id}: expected ${expected} ${domain} missions, got ${count}`)
      }
    }
  }
  for (const code of ['[2수01-01]', '[2수01-04]']) {
    const direct = templates.filter((template) => template.directCurriculumCodes.includes(code))
    if (!direct.some((template) => template.mode === 'basic' && template.cognitiveDomain === 'knowing')) {
      errors.push(`${code}: missing direct basic knowing mission`)
    }
    if (!direct.some((template) => template.mode === 'basic' && template.cognitiveDomain === 'applying')) {
      errors.push(`${code}: missing direct basic applying mission`)
    }
  }
  errors.push(...auditGrade1MissionVariants(templates).errors)

  return { errors, warnings }
}
