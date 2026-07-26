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
})

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
  return visual === null
    ? 'none'
    : grade <= 4
      ? `grade${grade}-mission-visual`
      : 'practice-problem-visual'
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

function adaptGrade4(rootDir) {
  const { grade4MissionTemplates, grade4Units } = loadGradeModule(rootDir, 4)
  const unitById = new Map(grade4Units.map(unit => [unit.id, unit]))
  return grade4MissionTemplates.map(template => {
    const buildSource = template.build.toString()
    const visual = sourceVisual(template.representation, { buildSource })
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
      visualKind: template.representation ?? null,
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
      },
    }
  })
}

function readPracticeData(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data')
  const units = JSON.parse(fs.readFileSync(path.join(dataDir, 'units.json'), 'utf8'))
  const concepts = JSON.parse(fs.readFileSync(path.join(dataDir, 'concepts.json'), 'utf8'))
  const unitById = new Map(units.map(unit => [unit.id, unit]))
  const conceptById = new Map(concepts.map(concept => [concept.id, concept]))
  const templateDir = path.join(dataDir, 'templates')
  const templates = fs.readdirSync(templateDir)
    .filter(fileName => fileName.endsWith('.json'))
    .sort()
    .flatMap(fileName => {
      const value = JSON.parse(fs.readFileSync(path.join(templateDir, fileName), 'utf8'))
      if (!Array.isArray(value)) throw new Error(`${fileName}: template file must contain an array`)
      return value
    })
  return { unitById, conceptById, templates }
}

function adaptPracticeGrade(rootDir, grade) {
  const { unitById, conceptById, templates } = readPracticeData(rootDir)
  return templates.flatMap(template => {
    const concept = conceptById.get(template.concept_id)
    const unit = concept ? unitById.get(concept.unit_id) : undefined
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
      requiredEvidence: actualEvidence({ visual, tool: null, scaffold: null }),
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
        scaffold: template.scaffold ?? null,
        tool: template.tool ?? null,
        visual,
      },
    }]
  })
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
  GRADE_ADAPTER_REGISTRY,
  RENDERER_REVIEW_VERSION_REGISTRY,
  ROOT_DIR,
  buildCatalog,
  catalogBytes,
  loadActualSources,
  loadContractModule,
  readSourceFixture,
}
