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

export type PolygonShape =
  | 'rectangle'
  | 'square'
  | 'parallelogram'
  | 'triangle'
  | 'trapezoid'
  | 'rhombus'

export interface ThreeShapeOverlapModel {
  cellArea: 1
  regions: {
    aOnly: number
    bOnly: number
    cOnly: number
    abOnly: number
    acOnly: number
    bcOnly: number
    abc: number
  }
  shapeAreas: [number, number, number]
  unionArea: number
}

export type CognitiveDomain = 'knowing' | 'applying' | 'reasoning'

export type ReasoningPattern =
  | 'direct'
  | 'inverse'
  | 'constraint'
  | 'multi_step'
  | 'representation_shift'
  | 'compare_methods'
  | 'error_analysis'
  | 'pattern_generalization'
  | 'systematic_counting'
  | 'optimization'
  | 'data_sufficiency'
  | 'model_and_check'

export type ProblemRepresentation =
  | 'text'
  | 'equation'
  | 'table'
  | 'diagram'
  | 'graph'
  | 'manipulative'

export type ProblemContextType = 'pure_math' | 'real_world' | 'puzzle'
export type ReadingLoad = 'low' | 'medium' | 'high'
export type VisualSemantics = 'decorative' | 'schematic' | 'quantitative'

/**
 * A reviewed content-design axis that is independent from numeric difficulty.
 *
 * This metadata stays optional on legacy templates and saved problems only
 * during the staged Grade 5 migration. New metadata must be supplied as a
 * complete object; consumers must never infer it from `difficulty`.
 */
export interface ProblemBlueprintMeta {
  problemFamily: string
  cognitiveDomain: CognitiveDomain
  reasoningPattern: ReasoningPattern
  primaryStandard: string
  connectedStandards?: string[]
  representations: ProblemRepresentation[]
  contextType: ProblemContextType
  estimatedSteps: number
  readingLoad: ReadingLoad
  visualSemantics?: VisualSemantics
}

export type ProblemVisual =
  | {
      type: 'basic_shape'
      props: {
        shape: 'rectangle' | 'triangle' | 'parallelogram'
        width: number
        height: number
        unit: 'cm' | 'm'
      }
    }
  | {
      type: 'l_shape'
      props: {
        width: number
        height: number
        notchWidth: number
        notchHeight: number
        unit: 'cm' | 'm'
      }
    }
  | {
      type: 'overlap_rectangles'
      props: {
        totalWidth: number
        overlapWidth: number
        overlapArea: number
        unit: 'cm' | 'm'
      }
    }
  | {
      type: 'rectangle_square'
      props: {
        rectangleHeight: number
        squareSide: number
        totalWidth?: number
        totalArea?: number
        unit: 'cm' | 'm'
      }
    }
  | {
      type: 'three_shape_overlap'
      semantics: 'quantitative'
      props: {
        shapeArea: number
        exclusiveAreas: [number, number, number]
        tripleOverlap: number
        unit: 'cm' | 'm'
      }
      model?: ThreeShapeOverlapModel
    }
  | {
      type: 'ratio_table'
      semantics: 'quantitative'
      props: {
        caption: string
        columns: [string, string, string]
        rows: Array<{
          label: string
          values: [string | number, string | number]
        }>
      }
    }

export type GeometryVisual =
  | ProblemVisual
  | {
      type: 'polygon'
      shape: PolygonShape
      a: number
      b?: number
      c?: number
      height?: number
      unit?: string
      measurementMode?: 'area' | 'sides'
      unknownMeasurement?: 'a' | 'b' | 'c' | 'height'
    }
  | {
      type: 'congruence'
      mode: 'pair' | 'options'
      variant: number
      a?: number
      b?: number
      c?: number
      unit?: string
    }
  | {
      type: 'symmetry'
      mode: 'axes' | 'line-coordinate' | 'point-coordinate' | 'options'
      variant: number
      x?: number
      y?: number
      axis?: number
      centerX?: number
      centerY?: number
    }
  | {
      type: 'cuboid'
      width: number
      height: number
      depth: number
      focus?: 'structure' | 'edges' | 'faces'
      unit?: string
      unknownMeasurement?: 'width' | 'height' | 'depth'
    }
  | {
      type: 'cuboid-net'
      mode: 'single' | 'options'
      variant: number
      focusFace?: number
    }

export type VisualTemplateValue =
  | string
  | number
  | boolean
  | null
  | VisualTemplateValue[]
  | { [key: string]: VisualTemplateValue }

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
  problem_family?: string
  blueprint?: ProblemBlueprintMeta
  visual_template?: { [key: string]: VisualTemplateValue }
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
  problemFamily?: string
  blueprint?: ProblemBlueprintMeta
  visual?: GeometryVisual
}

export type PracticeMode = 'standard' | 'retry-wrong'
export type PracticeGrade = 5 | 6
export type PracticeItemCount = 5 | 10

// 연습 세션
export interface PracticeSession {
  sessionId: string
  conceptId: string
  setId: 'A' | 'B' | 'C'
  mode: PracticeMode
  grade?: PracticeGrade
  itemCount?: PracticeItemCount
  sourceResultId?: string
  sourceProblemIndexes?: number[]
  problems: Problem[]
  answers: (string | null)[]
  checkedAnswers: (boolean | null)[]
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
  problem: Problem
}

export interface SessionResult {
  sessionId: string
  conceptId: string
  setId: 'A' | 'B' | 'C'
  mode: PracticeMode
  grade?: PracticeGrade
  itemCount?: PracticeItemCount
  score: number
  total: number
  wrongCount: number
  results: SubmissionResult[]
  completedAt: number
}

export interface ConceptProgressSummary {
  conceptId: string
  attemptCount: number
  bestScore: number
  latestScore: number
  lastCompletedAt: number
  needsReview: boolean
  lastMode: PracticeMode
}

export type ConceptProgressMap = Record<string, ConceptProgressSummary>

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
