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

export interface Grade1MissionTemplate {
  id: string
  islandId: string
  stageOrder: number
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

export interface Grade1Mission {
  id: string
  islandId: string
  stageOrder: number
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

const grade1AlphaMissionTemplates: Grade1MissionTemplate[] = [
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
    visualConfig: { object: 'star', count: '{{count}}', slots: '{{slots}}' },
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

const grade1BetaMissionTemplates: Grade1MissionTemplate[] = [
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
    learnerGoal: '10과 몇으로 나누어 세어요',
    parentSummaryTag: 'counting-to-20',
    promptTemplate: '10묶음 블록은 모두 몇 개일까요?',
    answerType: 'choice',
    paramSchema: { count: { min: 15, max: 18 }, slots: { min: 20, max: 20 } },
    solverRule: 'count',
    choicesTemplate: ['{{count}}', '{{count - 1}}', '{{count + 1}}'],
    visualModel: 'counting-grid',
    visualConfig: { object: 'block', count: '{{count}}', slots: '{{slots}}' },
    hintStepsTemplate: ['10개를 먼저 묶어요.', '남은 블록을 이어 세어요.'],
    solutionStepsTemplate: ['10개와 나머지를 합쳐요.', '모두 {{count}}개예요.'],
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
    visualConfig: { object: 'apple', count: '{{count}}', slots: '{{slots}}' },
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
    learnerGoal: '두 수 사이의 수를 찾아요',
    parentSummaryTag: 'before-after',
    promptTemplate: '{{start}}와 {{start + 2}} 사이의 수는 무엇일까요?',
    answerType: 'number',
    paramSchema: { start: { min: 4, max: 12 } },
    solverRule: 'start + 1',
    visualModel: 'number-cards',
    visualConfig: { cards: '{{start}},?,{{start + 2}}', target: '{{start + 1}}' },
    hintStepsTemplate: ['{{start}} 다음 수를 생각해요.', '{{start + 2}} 바로 앞의 수도 같아요.'],
    solutionStepsTemplate: ['{{start}} 다음은 {{start + 1}}이에요.', '그래서 사이의 수는 {{start + 1}}이에요.'],
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
    learnerGoal: '10을 채워 더해요',
    parentSummaryTag: 'addition-within-20',
    promptTemplate: '{{left}} + {{right}}은 얼마일까요?',
    answerType: 'choice',
    paramSchema: { left: { min: 8, max: 9 }, right: { min: 4, max: 7 } },
    solverRule: 'left + right',
    choicesTemplate: ['{{left + right}}', '{{left + right - 1}}', '{{left + right + 2}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'star', operation: 'add', left: '{{left}}', right: '{{right}}' },
    hintStepsTemplate: ['{{left}}에서 10까지 먼저 채워요.', '남은 수를 더해요.'],
    solutionStepsTemplate: ['{{left}}와 {{right}}를 합치면 {{left + right}}예요.'],
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
    learnerGoal: '10을 기준으로 빼요',
    parentSummaryTag: 'subtraction-within-20',
    promptTemplate: '{{total}} - {{take}}은 얼마일까요?',
    answerType: 'choice',
    paramSchema: { total: { min: 12, max: 16 }, take: { min: 3, max: 6 } },
    solverRule: 'total - take',
    choicesTemplate: ['{{total - take}}', '{{total - take + 2}}', '{{total - take - 1}}'],
    visualModel: 'object-groups',
    visualConfig: { object: 'marble', operation: 'sub', total: '{{total}}', take: '{{take}}' },
    hintStepsTemplate: ['{{take}}개를 덜어내요.', '남은 개수를 세어 확인해요.'],
    solutionStepsTemplate: ['{{total}} - {{take}} = {{total - take}}예요.'],
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
    learnerGoal: '변의 수를 비교해요',
    parentSummaryTag: 'shape-properties',
    promptTemplate: '변이 4개인 모양은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '네모',
    choicesTemplate: ['네모', '세모', '동그라미'],
    visualModel: 'shape-cards',
    visualConfig: { shapes: '세모,네모,동그라미', target: '네모' },
    hintStepsTemplate: ['반듯한 변을 세어요.', '변이 4개인 모양을 찾아요.'],
    solutionStepsTemplate: ['네모는 변이 4개예요.'],
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
    learnerGoal: '정각을 다시 읽어요',
    parentSummaryTag: 'time-hour',
    promptTemplate: '시계는 몇 시일까요?',
    answerType: 'choice',
    paramSchema: { hour: { min: 1, max: 5 }, minute: { min: 0, max: 0 } },
    solverRule: '{{hour}}시',
    choicesTemplate: ['{{hour}}시', '{{hour + 1}}시', '{{hour + 2}}시'],
    visualModel: 'clock-face',
    visualConfig: { hour: '{{hour}}', minute: '{{minute}}' },
    hintStepsTemplate: ['긴 바늘이 12를 가리켜요.', '짧은 바늘의 숫자를 읽어요.'],
    solutionStepsTemplate: ['짧은 바늘이 {{hour}}를 가리키므로 {{hour}}시예요.'],
    rewardId: 'clockBadge',
  },
  {
    id: 'clock-tower-04',
    islandId: 'clock-tower',
    stageOrder: 53,
    skill: 'time',
    difficulty: 1,
    learnerGoal: '생활 순서를 골라요',
    parentSummaryTag: 'daily-order',
    promptTemplate: '아침에 먼저 하는 일은 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '일어나기',
    choicesTemplate: ['일어나기', '저녁 먹기', '잠자기'],
    visualModel: 'number-cards',
    visualConfig: { cards: '일어나기,저녁 먹기,잠자기', target: '일어나기' },
    hintStepsTemplate: ['하루를 시작할 때를 생각해요.', '잠에서 깬 뒤 하는 일을 골라요.'],
    solutionStepsTemplate: ['아침에는 먼저 일어나요.'],
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
    learnerGoal: '하루 순서를 생각해요',
    parentSummaryTag: 'daily-order',
    promptTemplate: '아침 다음에 오는 때는 무엇일까요?',
    answerType: 'choice',
    paramSchema: {},
    solverRule: '점심',
    choicesTemplate: ['점심', '새벽', '밤'],
    visualModel: 'number-cards',
    visualConfig: { cards: '아침,점심,저녁', target: '점심' },
    hintStepsTemplate: ['하루의 순서를 떠올려요.', '아침 뒤에는 점심이 와요.'],
    solutionStepsTemplate: ['아침 다음은 점심이에요.'],
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

const grade1BaseMissionTemplates: Grade1MissionTemplate[] = [
  ...grade1AlphaMissionTemplates,
  ...grade1BetaMissionTemplates,
]

const grade1IslandTargets: Record<string, number> = {
  'count-cove': 14,
  'order-bridge': 14,
  'orchard-port': 14,
  'river-dock': 14,
  'shape-forest': 14,
  'clock-tower': 13,
  'pattern-cave': 13,
}

function buildGrade1V1MissionTemplates(): Grade1MissionTemplate[] {
  let stageOrder = 1
  const result: Grade1MissionTemplate[] = []

  for (const island of grade1Islands) {
    const originals = grade1BaseMissionTemplates
      .filter((mission) => mission.islandId === island.id)
      .sort((left, right) => left.stageOrder - right.stageOrder)
    const target = grade1IslandTargets[island.id] ?? originals.length

    for (const original of originals) {
      result.push({ ...original, stageOrder })
      stageOrder += 1
    }

    for (let index = originals.length; index < target; index += 1) {
      const source = originals[(index - originals.length) % originals.length]
      const round = index - originals.length + 1
      result.push({
        ...source,
        id: `${source.id}-v1-${round}`,
        stageOrder,
        learnerGoal: `도전 ${round} · ${source.learnerGoal}`,
        promptTemplate: `도전 ${round}! ${source.promptTemplate}`,
      })
      stageOrder += 1
    }
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

export function renderGrade1Mission(
  template: Grade1MissionTemplate,
  seed = template.stageOrder
): Grade1Mission {
  const random = seededRandom(seed + template.stageOrder * 997)
  const params = generateParams(template.paramSchema, random)
  const correctAnswer = renderTemplate(template.solverRule, params)
  const choices = template.choicesTemplate
    ? template.choicesTemplate.map((choice) => renderTemplate(choice, params))
    : undefined
  const shuffledChoices = choices ? shuffleArray(choices, random) : undefined

  return {
    id: template.id,
    islandId: template.islandId,
    stageOrder: template.stageOrder,
    skill: template.skill,
    difficulty: template.difficulty,
    learnerGoal: template.learnerGoal,
    parentSummaryTag: template.parentSummaryTag,
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

export interface Grade1ValidationResult {
  errors: string[]
  warnings: string[]
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
  if (templates.length !== 96) errors.push(`V1 expects 96 missions, got ${templates.length}`)

  return { errors, warnings }
}
