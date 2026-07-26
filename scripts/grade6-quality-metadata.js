const TASK_ACTIONS_BY_REASONING_PATTERN = Object.freeze({
  direct: Object.freeze(['calculate']),
  systematic_counting: Object.freeze(['model', 'calculate']),
  representation_shift: Object.freeze(['interpret', 'calculate']),
  multi_step: Object.freeze(['model', 'calculate']),
  inverse: Object.freeze(['reason', 'calculate']),
  error_analysis: Object.freeze(['analyze_error', 'calculate']),
  compare_methods: Object.freeze(['compare', 'calculate']),
  model_and_check: Object.freeze(['model', 'reason', 'calculate']),
})

function explicitTaskActionsFor(definition) {
  const actions = TASK_ACTIONS_BY_REASONING_PATTERN[definition.pattern]
  if (!actions) {
    throw new Error(
      `${definition.family}: explicit Grade 6 taskActions are missing for ${definition.pattern}`,
    )
  }
  return [...actions]
}

module.exports = {
  TASK_ACTIONS_BY_REASONING_PATTERN,
  explicitTaskActionsFor,
}
