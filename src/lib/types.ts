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
  friendly_explanation: string
  key_points: string[]
  steps: string[]
  visual_aids: VisualAid[]
  mini_checks: { question: string; answer: string }[]
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
  set_id: 'A' | 'B' | 'C'
  param_schema: Record<string, { min: number; max: number }>
  prompt_template: string
  choices_template?: string[] // 객관식인 경우
  solver_rule: string
  solution_steps_template: string[]
  hint_steps_template?: string[]
}

// 생성된 문제
export interface Problem {
  index: number
  templateId: string
  setId: 'A' | 'B' | 'C'
  params: Record<string, number>
  prompt: string
  type: 'choice' | 'number'
  choices?: string[] // 객관식인 경우 (셔플된 보기)
  correctAnswer: string
  correctChoiceIndex?: number // 객관식인 경우 정답 인덱스
  solutionSteps: string[]
  hintSteps?: string[]
}

// 연습 세션
export interface PracticeSession {
  sessionId: string
  conceptId: string
  setId: 'A' | 'B' | 'C'
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
  setId: 'A' | 'B' | 'C'
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

export type VisualAid =
  | {
      type: 'number_line'
      props: { start: number; end: number; highlights: number[] }
    }
  | {
      type: 'bar_model'
      props: { total: number; parts: number[]; labels?: string[] }
    }
  | {
      type: 'array_grid'
      props: { rows: number; cols: number; filled?: number }
    }
  | {
      type: 'rule_table'
      props: { inputs: number[]; outputs: number[]; rule: string }
    }
  | {
      type: 'factor_tree'
      props: { value: number; factors: number[] }
    }
