const ALLOWED_TASK_ACTIONS = new Set([
  'recognize',
  'classify',
  'compare',
  'calculate',
  'measure',
  'construct',
  'model',
  'interpret',
  'explain',
  'analyze_error',
  'reason',
])

function explicitTaskActionsFor(definition) {
  const { taskActions } = definition
  if (!Array.isArray(taskActions) || taskActions.length === 0) {
    throw new Error(
      `${definition.family}: explicit Grade 6 taskActions are required on the source definition`,
    )
  }
  const unsupported = taskActions.filter((action) => !ALLOWED_TASK_ACTIONS.has(action))
  if (unsupported.length > 0) {
    throw new Error(
      `${definition.family}: unsupported Grade 6 taskActions: ${unsupported.join(', ')}`,
    )
  }
  if (new Set(taskActions).size !== taskActions.length) {
    throw new Error(`${definition.family}: Grade 6 taskActions must not contain duplicates`)
  }
  return [...taskActions]
}

module.exports = {
  ALLOWED_TASK_ACTIONS,
  explicitTaskActionsFor,
}
