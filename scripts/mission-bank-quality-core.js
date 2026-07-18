const fs = require('fs')
const os = require('os')
const path = require('path')
const ts = require('typescript')

const ROOT_DIR = path.join(__dirname, '..')

function createIssue(severity, code, message, details = {}) {
  return { severity, code, message, ...details }
}

function compileTsModule(sourcePath, moduleName) {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  })

  const outPath = path.join(os.tmpdir(), `${moduleName}-${process.pid}-${Date.now()}.cjs`)
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

function loadGrade1Module() {
  return compileTsModule(path.join(ROOT_DIR, 'src', 'lib', 'grade1-problems.ts'), 'grade1-problems')
}

function loadGrade2Module() {
  return compileTsModule(path.join(ROOT_DIR, 'src', 'lib', 'grade2-problems.ts'), 'grade2-problems')
}

function textLength(value) {
  return String(value ?? '').replace(/\{\{[^}]+\}\}/g, '0').trim().length
}

function hasLongPrompt(template, maxLength) {
  return textLength(template.promptTemplate) > maxLength
}

function collectDuplicateRenderedPrompts(items, keySelector) {
  const seen = new Map()
  const duplicates = []
  for (const item of items) {
    const key = `${keySelector(item)}:${item.prompt}`
    const existing = seen.get(key)
    if (existing) {
      duplicates.push([existing, item])
    } else {
      seen.set(key, item)
    }
  }
  return duplicates
}

function auditChoiceIntegrity(grade, template, mission, errors) {
  const needsChoices = mission.answerType === 'choice' || mission.answerType === 'label'
  if (!needsChoices) return
  if (!mission.choices || mission.choices.length < 2) {
    errors.push(createIssue('error', 'missing_choices', `${grade} ${template.id}: needs at least two rendered choices`, { missionId: template.id }))
    return
  }

  const uniqueChoices = new Set(mission.choices)
  if (uniqueChoices.size !== mission.choices.length) {
    errors.push(createIssue('error', 'duplicate_choices', `${grade} ${template.id}: duplicate rendered choices`, { missionId: template.id }))
  }

  const correctCount = mission.choices.filter((choice) => choice === mission.correctAnswer).length
  if (correctCount !== 1) {
    errors.push(createIssue('error', 'choice_correct_count', `${grade} ${template.id}: expected one correct choice, got ${correctCount}`, { missionId: template.id }))
  }
}

function auditGrade1() {
  const {
    grade1MissionTemplates,
    grade1Islands,
    getGrade1Missions,
    validateGrade1MissionBank,
  } = loadGrade1Module()
  const validation = validateGrade1MissionBank()
  const errors = validation.errors.map((message) => createIssue('error', 'grade1_validator', message))
  const warnings = validation.warnings.map((message) => createIssue('warning', 'grade1_validator', message))
  const missions = getGrade1Missions(20260509)
  const byIsland = new Map()

  for (const template of grade1MissionTemplates) {
    if (!template.learnerGoal.trim()) errors.push(createIssue('error', 'missing_goal', `Grade 1 ${template.id}: missing learner goal`, { missionId: template.id }))
    if (!template.promptTemplate.trim()) errors.push(createIssue('error', 'missing_prompt', `Grade 1 ${template.id}: missing prompt`, { missionId: template.id }))
    if (!template.hintStepsTemplate.length) errors.push(createIssue('error', 'missing_hint', `Grade 1 ${template.id}: missing hint`, { missionId: template.id }))
    if (!template.solutionStepsTemplate.length) errors.push(createIssue('error', 'missing_solution', `Grade 1 ${template.id}: missing solution`, { missionId: template.id }))
    if (hasLongPrompt(template, 58)) warnings.push(createIssue('warning', 'prompt_too_long', `Grade 1 ${template.id}: prompt is too long for early readers`, { missionId: template.id }))

    const bucket = byIsland.get(template.islandId) ?? { total: 0, difficulties: new Set() }
    bucket.total += 1
    bucket.difficulties.add(template.difficulty)
    byIsland.set(template.islandId, bucket)
  }

  for (const mission of missions) {
    const template = grade1MissionTemplates.find((item) => item.id === mission.id)
    auditChoiceIntegrity('Grade 1', template, mission, errors)
  }

  for (const [first, second] of collectDuplicateRenderedPrompts(missions, (mission) => mission.islandId)) {
    warnings.push(createIssue('warning', 'duplicate_prompt', `Grade 1 ${first.islandId}: repeated prompt "${first.prompt}"`, { missionId: second.id }))
  }

  if (grade1MissionTemplates.length !== 96) {
    errors.push(createIssue('error', 'grade1_v1_count', `Grade 1 V1 expects 96 missions, got ${grade1MissionTemplates.length}`))
  }

  for (const island of grade1Islands) {
    const bucket = byIsland.get(island.id)
    if (!bucket || bucket.total < 2) {
      errors.push(createIssue('error', 'grade1_island_coverage', `Grade 1 ${island.id}: needs multiple missions`))
      continue
    }
    if (!bucket.difficulties.has(1) || !bucket.difficulties.has(2) || !bucket.difficulties.has(3)) {
      warnings.push(createIssue('warning', 'grade1_difficulty_coverage', `Grade 1 ${island.id}: should include difficulty 1, 2, and 3`))
    }
  }

  return {
    grade: 'grade1',
    templateCount: grade1MissionTemplates.length,
    errors,
    warnings,
  }
}

function auditGrade2LengthPrompt(template, warnings) {
  if (template.answerType !== 'length') return
  const prompt = template.promptTemplate
  const unit = template.answerConfig?.unit
  if ((prompt.includes('모두 몇 cm') || prompt.includes('몇 cm일까요')) && unit !== 'cm') {
    warnings.push(createIssue('warning', 'length_prompt_unit_mismatch', `Grade 2 ${template.id}: cm prompt should use cm-only input`, { missionId: template.id }))
  }
  if (prompt.includes('m와 cm로') && unit !== 'm-cm') {
    warnings.push(createIssue('warning', 'length_prompt_unit_mismatch', `Grade 2 ${template.id}: m/cm prompt should use structured m-cm input`, { missionId: template.id }))
  }
}

function auditGrade2TimePrompt(template, warnings) {
  if (template.promptTemplate.includes('걸린 시간') && template.answerType !== 'duration') {
    warnings.push(createIssue('warning', 'time_prompt_type_mismatch', `Grade 2 ${template.id}: elapsed-time prompt should use duration`, { missionId: template.id }))
  }
  if (template.promptTemplate.includes('시각') && template.answerType !== 'time-of-day') {
    warnings.push(createIssue('warning', 'time_prompt_type_mismatch', `Grade 2 ${template.id}: clock-time prompt should use time-of-day`, { missionId: template.id }))
  }
}

function auditGrade2VisualSafety(template, warnings) {
  if (template.skill === 'classification' && template.visualModel === 'classification-table' && template.visualConfig.countDisplay !== 'marks') {
    warnings.push(createIssue('warning', 'classification_answer_count_visible', `Grade 2 ${template.id}: classification counts should render as marks before reveal`, { missionId: template.id }))
  }
  if (
    template.visualModel === 'length-bars' &&
    template.answerConfig?.unit === 'm-cm' &&
    template.visualConfig.rightLabel &&
    !template.visualConfig.hideRightLabelUntilReveal &&
    String(template.promptTemplate).includes('m와 cm로')
  ) {
    warnings.push(createIssue('warning', 'equivalent_length_label_visible', `Grade 2 ${template.id}: equivalent m/cm label should be hidden before reveal`, { missionId: template.id }))
  }
}

function auditGrade2() {
  const {
    grade2MissionTemplates,
    grade2Units,
    getGrade2Missions,
    validateGrade2MissionBank,
  } = loadGrade2Module()
  const validation = validateGrade2MissionBank()
  const errors = validation.errors.map((message) => createIssue('error', 'grade2_validator', message))
  const warnings = validation.warnings.map((message) => createIssue('warning', 'grade2_validator', message))
  const missions = getGrade2Missions(20260510)
  const byUnit = new Map()

  for (const template of grade2MissionTemplates) {
    if (!template.curriculumCode.trim()) errors.push(createIssue('error', 'missing_curriculum_code', `Grade 2 ${template.id}: missing curriculum code`, { missionId: template.id }))
    if (!template.learnerGoal.trim()) errors.push(createIssue('error', 'missing_goal', `Grade 2 ${template.id}: missing learner goal`, { missionId: template.id }))
    if (!template.promptTemplate.trim()) errors.push(createIssue('error', 'missing_prompt', `Grade 2 ${template.id}: missing prompt`, { missionId: template.id }))
    if (template.hintStepsTemplate.length < 2) errors.push(createIssue('error', 'missing_hint', `Grade 2 ${template.id}: needs at least two hints`, { missionId: template.id }))
    if (!template.solutionStepsTemplate.length) errors.push(createIssue('error', 'missing_solution', `Grade 2 ${template.id}: missing solution`, { missionId: template.id }))
    if (hasLongPrompt(template, 64)) warnings.push(createIssue('warning', 'prompt_too_long', `Grade 2 ${template.id}: prompt is too long for early readers`, { missionId: template.id }))
    if (template.answerConfig.kind !== template.answerType) {
      errors.push(createIssue('error', 'answer_config_mismatch', `Grade 2 ${template.id}: answerConfig.kind must match answerType`, { missionId: template.id }))
    }

    auditGrade2LengthPrompt(template, warnings)
    auditGrade2TimePrompt(template, warnings)
    auditGrade2VisualSafety(template, warnings)

    const bucket = byUnit.get(template.unitId) ?? { total: 0, steps: { easy: 0, medium: 0, applied: 0 } }
    bucket.total += 1
    bucket.steps[template.difficultyStep] += 1
    byUnit.set(template.unitId, bucket)
  }

  for (const mission of missions) {
    const template = grade2MissionTemplates.find((item) => item.id === mission.id)
    auditChoiceIntegrity('Grade 2', template, mission, errors)
  }

  for (const [first, second] of collectDuplicateRenderedPrompts(missions, (mission) => mission.unitId)) {
    warnings.push(createIssue('warning', 'duplicate_prompt', `Grade 2 ${first.unitId}: repeated prompt "${first.prompt}"`, { missionId: second.id }))
  }

  if (grade2MissionTemplates.length !== 144) {
    errors.push(createIssue('error', 'grade2_v1_count', `Grade 2 V1 expects 144 missions, got ${grade2MissionTemplates.length}`))
  }

  for (const unit of grade2Units) {
    const bucket = byUnit.get(unit.id)
    if (!bucket) {
      errors.push(createIssue('error', 'grade2_unit_coverage', `Grade 2 ${unit.id}: missing missions`))
      continue
    }
    if (bucket.total !== 12) errors.push(createIssue('error', 'grade2_unit_count', `Grade 2 ${unit.id}: V1 expects 12 missions, got ${bucket.total}`))
    for (const step of ['easy', 'medium', 'applied']) {
      if (bucket.steps[step] !== 4) {
        warnings.push(createIssue('warning', 'grade2_difficulty_balance', `Grade 2 ${unit.id}: expected 4 ${step} missions, got ${bucket.steps[step]}`))
      }
    }
  }

  return {
    grade: 'grade2',
    templateCount: grade2MissionTemplates.length,
    errors,
    warnings,
  }
}

function generateMissionBankQualityReport() {
  const gradeReports = [auditGrade1(), auditGrade2()]
  const errors = gradeReports.flatMap((report) => report.errors)
  const warnings = gradeReports.flatMap((report) => report.warnings)

  return {
    summary: {
      gradeCount: gradeReports.length,
      templateCount: gradeReports.reduce((sum, report) => sum + report.templateCount, 0),
      errorCount: errors.length,
      warningCount: warnings.length,
    },
    gradeReports,
    errors,
    warnings,
  }
}

module.exports = {
  generateMissionBankQualityReport,
}
