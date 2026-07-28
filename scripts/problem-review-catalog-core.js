const fs = require('fs')
const os = require('os')
const path = require('path')
const ts = require('typescript')

const ROOT_DIR = path.join(__dirname, '..')

const RENDERER_REVIEW_VERSION_REGISTRY = Object.freeze({
  none: 'no-visual-review-v1',
  'grade1-mission-visual': 'grade1-mission-visual-review-v1',
  'grade2-mission-visual': 'grade2-mission-visual-review-v1',
  'grade3-mission-visual': 'grade3-mission-visual-review-v1',
  'grade4-mission-visual': 'grade4-mission-visual-review-v1',
  'practice-problem-visual': 'practice-problem-visual-review-v1',
  'practice-problem-visual:cuboid': 'practice-problem-cuboid-review-v2',
  'practice-problem-visual:three_shape_overlap': 'practice-problem-three-shape-overlap-review-v2',
  'grade5-practice-text': 'grade5-practice-text-particles-v1',
  'grade5-practice-visual': 'grade5-practice-visual-particles-v1',
  'grade5-practice-visual:cuboid': 'grade5-practice-cuboid-v2-particles-v1',
  'grade5-practice-visual:three_shape_overlap': 'grade5-practice-three-shape-overlap-v2-particles-v1',
})

// Grade 4 generation uses positiveModulo(..., 9) + 1, so the review catalog
// exhausts variants 1..9. Each variant has the fixed seed 2026072600 + variant.
const GRADE4_REVIEW_CHOICE_SEED_BASE = 2026072600
const GRADE4_REVIEW_BUILD_CASES = Object.freeze(
  Array.from({ length: 9 }, (_, index) => {
    const variant = index + 1
    return Object.freeze({
      key: `variant-${variant}`,
      variant,
      choiceSeed: GRADE4_REVIEW_CHOICE_SEED_BASE + variant,
    })
  })
)

let contractModule

function compileTsModule(sourcePath, moduleName) {
  const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  })
  const outPath = path.join(
    os.tmpdir(),
    `${moduleName}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.cjs`
  )
  fs.writeFileSync(outPath, compiled.outputText)
  try {
    delete require.cache[outPath]
    return require(outPath)
  } finally {
    try {
      fs.unlinkSync(outPath)
    } catch {
      // Best-effort cleanup only.
    }
  }
}

function loadContractModule() {
  if (!contractModule) {
    contractModule = compileTsModule(
      path.join(ROOT_DIR, 'src', 'lib', 'problem-review-catalog.ts'),
      'problem-review-catalog'
    )
  }
  return contractModule
}

function loadGradeModule(rootDir, grade) {
  return compileTsModule(
    path.join(rootDir, 'src', 'lib', `grade${grade}-problems.ts`),
    `grade${grade}-problem-review-source`
  )
}

function actualEvidence({ visual, tool, scaffold }) {
  return [
    'text',
    ...(visual === null ? [] : ['visual']),
    ...(tool === null ? [] : ['tool']),
    ...(scaffold === null ? [] : ['scaffold']),
  ]
}

function rendererKey(grade, visual) {
  if (grade === 5) {
    if (visual === null) return 'grade5-practice-text'
    if (visual.kind === 'cuboid' || visual.kind === 'three_shape_overlap') {
      return `grade5-practice-visual:${visual.kind}`
    }
    return 'grade5-practice-visual'
  }
  if (visual === null) return 'none'
  if (grade <= 4) return `grade${grade}-mission-visual`
  if (visual.kind === 'cuboid' || visual.kind === 'three_shape_overlap') {
    return `practice-problem-visual:${visual.kind}`
  }
  return 'practice-problem-visual'
}

function sourceVisual(visualKind, config) {
  return visualKind ? { kind: visualKind, config } : null
}

function adaptGrade1(rootDir) {
  const { grade1MissionTemplates } = loadGradeModule(rootDir, 1)
  return grade1MissionTemplates.map(template => {
    const visual = sourceVisual(template.visualModel, template.visualConfig)
    return {
      grade: 1,
      sourceKind: 'mission',
      sourceId: template.id,
      semester: template.semester ?? null,
      unitId: template.islandId,
      conceptId: null,
      family: template.parentSummaryTag,
      curriculumCodes: template.curriculumCodes ?? [],
      answerKind: template.answerType,
      taskActions: template.taskActions ?? [],
      requiredEvidence: actualEvidence({ visual, tool: null, scaffold: null }),
      visualKind: template.visualModel ?? null,
      visualSemantics: visual === null ? 'none' : template.visualSemantics,
      rendererReviewKey: rendererKey(1, visual),
      isPublic: true,
      content: {
        prompt: template.promptTemplate,
        choices: template.choicesTemplate ?? [],
        answerRule: template.solverRule,
        hints: template.hintStepsTemplate,
        solution: template.solutionStepsTemplate,
        scaffold: null,
        tool: null,
        visual,
      },
    }
  })
}

function adaptGrade2(rootDir) {
  const { grade2MissionTemplates } = loadGradeModule(rootDir, 2)
  return grade2MissionTemplates.map(template => {
    const visual = sourceVisual(template.visualModel, template.visualConfig)
    return {
      grade: 2,
      sourceKind: 'mission',
      sourceId: template.id,
      semester: template.semester,
      unitId: template.unitId,
      conceptId: null,
      family: template.parentSummaryTag,
      curriculumCodes: template.curriculumCodes ?? [template.curriculumCode].filter(Boolean),
      answerKind: template.answerType,
      taskActions: template.taskActions ?? [],
      requiredEvidence: actualEvidence({ visual, tool: null, scaffold: null }),
      visualKind: template.visualModel ?? null,
      visualSemantics: visual === null ? 'none' : template.visualSemantics,
      rendererReviewKey: rendererKey(2, visual),
      isPublic: true,
      content: {
        prompt: template.promptTemplate,
        choices: template.choicesTemplate ?? [],
        answerRule: {
          solverRule: template.solverRule,
          answerConfig: template.answerConfig,
        },
        hints: template.hintStepsTemplate,
        solution: template.solutionStepsTemplate,
        scaffold: null,
        tool: null,
        visual,
      },
    }
  })
}

function adaptGrade3(rootDir) {
  const { grade3MissionTemplates } = loadGradeModule(rootDir, 3)
  return grade3MissionTemplates.map(template => {
    const visual = sourceVisual(template.visualModel, template.visualConfig)
    const scaffold = template.scaffoldConfig ?? null
    return {
      grade: 3,
      sourceKind: 'mission',
      sourceId: template.id,
      semester: template.semester,
      unitId: template.unitId,
      conceptId: null,
      family: template.parentSummaryTag,
      curriculumCodes: template.curriculumCodes ?? [template.curriculumCode].filter(Boolean),
      answerKind: template.answerType,
      taskActions: template.taskActions ?? [],
      requiredEvidence: actualEvidence({ visual, tool: null, scaffold }),
      visualKind: template.visualModel ?? null,
      visualSemantics: visual === null ? 'none' : template.visualSemantics,
      rendererReviewKey: rendererKey(3, visual),
      isPublic: true,
      content: {
        prompt: template.prompt,
        choices: template.choices ?? [],
        answerRule: {
          correctAnswer: template.correctAnswer,
          answerConfig: template.answerConfig,
        },
        hints: template.hintSteps,
        solution: template.solutionSteps,
        scaffold,
        tool: null,
        visual,
      },
    }
  })
}

function adaptGrade4Templates(grade4MissionTemplates, grade4Units) {
  const unitById = new Map(grade4Units.map(unit => [unit.id, unit]))
  return grade4MissionTemplates.map(template => {
    const reviewVariants = GRADE4_REVIEW_BUILD_CASES.map(reviewCase => {
      const built = template.build(reviewCase.variant, reviewCase.choiceSeed)
      if (!built || typeof built.visualModel !== 'string') {
        throw new Error(`${template.id}: Grade 4 review build ${reviewCase.key} is missing visualModel`)
      }
      return {
        key: reviewCase.key,
        prompt: built.prompt,
        choices: built.choices ?? [],
        correctAnswer: built.correctAnswer,
        solution: built.solutionSteps,
        visualKind: built.visualModel,
        visualConfig: built.visualConfig,
      }
    })
    const visualKinds = new Set(reviewVariants.map(variant => variant.visualKind))
    if (visualKinds.size !== 1) {
      const variantKinds = reviewVariants
        .map(variant => `${variant.key}=${variant.visualKind}`)
        .join(', ')
      throw new Error(
        `${template.id}: Grade 4 review variants disagree on visualModel: ${variantKinds}`
      )
    }
    const visualKind = reviewVariants[0].visualKind
    const buildSource = template.build.toString()
    const visual = sourceVisual(visualKind, {
      reviewCases: reviewVariants.map(variant => ({
        key: variant.key,
        visualConfig: variant.visualConfig,
      })),
    })
    const tool = template.supportTool === 'none' ? null : { kind: template.supportTool }
    return {
      grade: 4,
      sourceKind: 'mission',
      sourceId: template.id,
      semester: unitById.get(template.unitId)?.semester ?? null,
      unitId: template.unitId,
      conceptId: null,
      family: template.problemFamily,
      curriculumCodes: template.curriculumCodes ?? [template.curriculumCode].filter(Boolean),
      answerKind: template.answerType,
      taskActions: template.taskActions ?? [],
      requiredEvidence: actualEvidence({ visual, tool, scaffold: null }),
      visualKind,
      visualSemantics: visual === null ? 'none' : template.visualSemantics,
      rendererReviewKey: rendererKey(4, visual),
      isPublic: unitById.get(template.unitId)?.releaseStatus === 'released',
      content: {
        prompt: template.promptTemplate,
        choices: [],
        answerRule: { buildSource },
        hints: template.hintSteps,
        solution: [],
        scaffold: null,
        tool,
        visual,
        reviewVariants,
      },
    }
  })
}

function adaptGrade4(rootDir) {
  const { grade4MissionTemplates, grade4Units } = loadGradeModule(rootDir, 4)
  return adaptGrade4Templates(grade4MissionTemplates, grade4Units)
}

function readPracticeData(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data')
  const units = JSON.parse(fs.readFileSync(path.join(dataDir, 'units.json'), 'utf8'))
  const concepts = JSON.parse(fs.readFileSync(path.join(dataDir, 'concepts.json'), 'utf8'))
  const templateDir = path.join(dataDir, 'templates')
  const templates = fs.readdirSync(templateDir)
    .filter(fileName => fileName.endsWith('.json'))
    .sort()
    .flatMap(fileName => {
      const value = JSON.parse(fs.readFileSync(path.join(templateDir, fileName), 'utf8'))
      if (!Array.isArray(value)) throw new Error(`${fileName}: template file must contain an array`)
      return value
    })
  return { units, concepts, templates }
}

function adaptPracticeTemplates(grade, templates, concepts, units) {
  const unitById = new Map(units.map(unit => [unit.id, unit]))
  const conceptById = new Map(concepts.map(concept => [concept.id, concept]))
  return templates.flatMap(template => {
    const sourceId = typeof template.id === 'string' && template.id
      ? template.id
      : '(missing template id)'
    if (typeof template.concept_id !== 'string' || !template.concept_id) {
      throw new Error(`${sourceId}: concept_id is required`)
    }
    const concept = conceptById.get(template.concept_id)
    if (!concept) {
      throw new Error(`${sourceId}: concept lookup failed for ${template.concept_id}`)
    }
    const unit = unitById.get(concept.unit_id)
    if (!unit) {
      throw new Error(`${sourceId}: unit lookup failed for ${concept.unit_id}`)
    }
    if (unit?.grade !== grade) return []

    const visualKind = typeof template.visual_template?.type === 'string'
      ? template.visual_template.type
      : null
    const visual = template.visual_template
      ? { kind: visualKind, config: template.visual_template }
      : null
    const explicitCodes = [
      template.blueprint?.primaryStandard,
      ...(template.blueprint?.connectedStandards ?? []),
    ].filter(Boolean)
    const scaffold = template.scaffold ?? null
    const tool = template.tool ?? null
    return [{
      grade,
      sourceKind: 'template',
      sourceId: template.id,
      semester: unit.semester,
      unitId: unit.id,
      conceptId: concept.id,
      family: template.problem_family,
      curriculumCodes: template.curriculumCodes ?? explicitCodes,
      answerKind: template.answerKind ?? template.type,
      taskActions: template.taskActions ?? template.blueprint?.taskActions ?? [],
      requiredEvidence: actualEvidence({ visual, tool, scaffold }),
      visualKind,
      visualSemantics: visual === null ? 'none' : template.visualSemantics ?? template.blueprint?.visualSemantics,
      rendererReviewKey: rendererKey(grade, visual),
      isPublic: true,
      content: {
        prompt: template.prompt_template,
        choices: template.choices_template ?? [],
        answerRule: template.solver_rule,
        hints: template.hint_steps_template ?? [],
        solution: template.solution_steps_template ?? [],
        scaffold,
        tool,
        visual,
      },
    }]
  })
}

function adaptPracticeGrade(rootDir, grade) {
  const { units, concepts, templates } = readPracticeData(rootDir)
  return adaptPracticeTemplates(grade, templates, concepts, units)
}

const GRADE_ADAPTER_REGISTRY = Object.freeze({
  1: { grade: 1, sourceKind: 'mission', load: adaptGrade1 },
  2: { grade: 2, sourceKind: 'mission', load: adaptGrade2 },
  3: { grade: 3, sourceKind: 'mission', load: adaptGrade3 },
  4: { grade: 4, sourceKind: 'mission', load: adaptGrade4 },
  5: { grade: 5, sourceKind: 'template', load: rootDir => adaptPracticeGrade(rootDir, 5) },
  6: { grade: 6, sourceKind: 'template', load: rootDir => adaptPracticeGrade(rootDir, 6) },
})

function loadActualSources(rootDir = ROOT_DIR) {
  return Object.values(GRADE_ADAPTER_REGISTRY)
    .sort((left, right) => left.grade - right.grade)
    .flatMap(adapter => adapter.load(rootDir))
}

function buildCatalog(sources, rendererReviewVersions = RENDERER_REVIEW_VERSION_REGISTRY) {
  return loadContractModule().buildProblemReviewCatalog(sources, rendererReviewVersions)
}

function catalogBytes(catalog) {
  return loadContractModule().stableJsonStringify(catalog)
}

function readSourceFixture(sourcePath) {
  const fixture = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
  if (!fixture || !Array.isArray(fixture.sources)) {
    throw new Error(`${sourcePath}: source fixture must contain a sources array`)
  }
  return {
    sources: fixture.sources,
    rendererReviewVersions:
      fixture.rendererReviewVersions ?? RENDERER_REVIEW_VERSION_REGISTRY,
  }
}

module.exports = {
  GRADE4_REVIEW_BUILD_CASES,
  GRADE_ADAPTER_REGISTRY,
  RENDERER_REVIEW_VERSION_REGISTRY,
  ROOT_DIR,
  adaptGrade4Templates,
  adaptPracticeTemplates,
  buildCatalog,
  catalogBytes,
  loadActualSources,
  loadContractModule,
  readSourceFixture,
}
