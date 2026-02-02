// 단원 (Unit)
export interface Unit {
  id: string
  grade: number
  semester: string // "5-1" | "5-2"
  order: number
  title: string
  description?: string
}

// 개념 (Concept)
export interface Concept {
  id: string
  unit_id: string
  concept_title: string
  base_explanation: string
  examples: string[]
  pitfalls: string[]
  order: number
}

// 문제 템플릿
export interface ProblemTemplate {
  id: string
  concept_id: string
  type: 'choice' | 'number'
  difficulty: 1 | 2 | 3
  param_schema: Record<string, { min: number; max: number }>
  prompt_template: string
  choices_template?: string[] // 객관식인 경우
  solver_rule: string
  solution_steps_template: string[]
}

// 생성된 문제
export interface Problem {
  index: number
  templateId: string
  params: Record<string, number>
  prompt: string
  type: 'choice' | 'number'
  choices?: string[] // 객관식인 경우 (셔플된 보기)
  correctAnswer: string
  correctChoiceIndex?: number // 객관식인 경우 정답 인덱스
  solutionSteps: string[]
}

// 연습 세션
export interface PracticeSession {
  sessionId: string
  conceptId: string
  problems: Problem[]
  answers: (string | null)[]
  currentIndex: number
  startedAt: number
  expiresAt: number
}

// 제출 결과
export interface SubmissionResult {
  index: number
  correct: boolean
  userAnswer: string | null
  correctAnswer: string
  solutionSteps: string[]
}

export interface SessionResult {
  sessionId: string
  conceptId: string
  score: number
  total: number
  results: SubmissionResult[]
  completedAt: number
}

// 채점용 정규화된 값
export interface NormalizedValue {
  type: 'integer' | 'decimal' | 'fraction'
  numerator: number
  denominator: number
}
