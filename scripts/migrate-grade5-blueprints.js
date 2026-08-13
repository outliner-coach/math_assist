const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const TEMPLATE_DIR = path.join(ROOT, 'public', 'data', 'templates')
const MIGRATED_BANKS = [
  'area.json',
  'areaunit.json',
  'average.json',
  'commonden.json',
  'congruence.json',
  'cuboid.json',
  'cuboidnet.json',
  'decimalmul.json',
  'divisor.json',
  'estimate.json',
  'fracadd.json',
  'fraccompare.json',
  'fracmul.json',
  'fracsub.json',
  'gcd.json',
  'lcm.json',
  'mixedcalc.json',
  'multiple.json',
  'numberrange.json',
  'pattern.json',
  'perimeter.json',
  'polygonarea.json',
  'possibility.json',
  'rounding.json',
  'simplify.json',
  'symmetry.json',
]

function reviewed({
  cognitiveDomain,
  reasoningPattern,
  primaryStandard,
  estimatedSteps,
  readingLoad,
  visualSemantics,
  contextType = 'pure_math',
  connectedStandards = [],
  representations = ['text', 'diagram']
}) {
  return {
    cognitiveDomain,
    reasoningPattern,
    primaryStandard,
    ...(connectedStandards.length > 0 ? { connectedStandards } : {}),
    representations,
    contextType,
    estimatedSteps,
    readingLoad,
    ...(visualSemantics ? { visualSemantics } : {})
  }
}

function reviewedText(fields) {
  return reviewed({ ...fields, representations: ['text', 'equation'] })
}

// Every slot is assigned by reviewed prompt/solver meaning. Repeated names are
// intentional: answer mode or larger numbers do not create a new problem family.
const REVIEWED_SLOT_FAMILIES = Object.freeze({
  'areaunit-001': [
    'areaunit-one-square-meter', 'areaunit-one-square-kilometer',
    'areaunit-square-meters-forward', 'areaunit-square-kilometers-forward',
    'areaunit-square-centimeters-reverse', 'areaunit-square-meters-reverse',
    'areaunit-rectangle-to-square-centimeters', 'areaunit-mixed-land-total',
    'areaunit-one-direction-error', 'areaunit-rectangle-one-side-error'
  ],
  'possibility-001': [
    'possibility-verbal-impossible-certain', 'possibility-verbal-comparison',
    'possibility-numeric-half', 'possibility-numeric-impossible',
    'possibility-predict-from-half', 'possibility-compare-relative-frequency',
    'possibility-predicted-count-gap', 'possibility-sample-size-reliability',
    'possibility-raw-count-error', 'possibility-pooled-data-prediction'
  ],
  'mixedcalc-001': [
    'mixedcalc-add-multiply-order', 'mixedcalc-multiply-add-order',
    'mixedcalc-parenthesized-sum-product', 'mixedcalc-multiply-subtract-order',
    'mixedcalc-context-stock-after-use', 'mixedcalc-context-combined-groups-after-use',
    'mixedcalc-context-boxed-assortment', 'mixedcalc-context-team-difference',
    'mixedcalc-missing-parentheses-error', 'mixedcalc-model-correction-gap'
  ],
  'divisor-001': [
    'divisor-missing-factor', 'divisor-greatest', 'divisor-least', 'divisor-count',
    'divisor-context-rectangle', 'divisor-largest-proper', 'divisor-smallest-nonunit',
    'divisor-factor-pair-sum', 'divisor-remainder-counterexample', 'divisor-nondivisor-count'
  ],
  'multiple-001': [
    'multiple-second', 'multiple-nth', 'multiple-order-from-value', 'multiple-next',
    'multiple-context-packages', 'multiple-context-repeated-distance',
    'multiple-next-after-known', 'multiple-missing-multiplier',
    'multiple-addition-error-gap', 'multiple-between-consecutive'
  ],
  'gcd-001': [
    'gcd-structured-direct', 'gcd-common-divisor', 'gcd-first-quotient', 'gcd-second-quotient',
    'gcd-context-equal-groups', 'gcd-context-items-per-group',
    'gcd-context-square-tile', 'gcd-quotient-sum',
    'gcd-too-large-candidate', 'gcd-product-confusion'
  ],
  'lcm-001': [
    'lcm-structured-direct', 'lcm-common-multiple', 'lcm-first-multiplier', 'lcm-second-common',
    'lcm-context-simultaneous-cycle', 'lcm-context-package-total',
    'lcm-context-second-meeting', 'lcm-missing-cycle-count',
    'lcm-product-error-gap', 'lcm-sum-error-gap'
  ],
  'pattern-001': [
    'pattern-rule-multiplicative', 'pattern-rule-additive',
    'pattern-rule-affine', 'pattern-inverse-multiplicative',
    'pattern-context-equal-groups', 'pattern-context-fixed-plus-rate',
    'pattern-inverse-affine', 'pattern-shift-then-scale',
    'pattern-rule-comparison-gap', 'pattern-additive-error-gap'
  ],
  'simplify-001': [
    'simplify-reduce-scaled-fraction', 'simplify-identify-numerator',
    'simplify-identify-denominator', 'simplify-greatest-common-factor',
    'simplify-equivalent-numerator', 'simplify-context-part',
    'simplify-missing-scale-factor', 'simplify-component-sum',
    'simplify-one-sided-division-error', 'simplify-additive-change-error'
  ],
  'commonden-001': [
    'commonden-consecutive-denominators', 'commonden-first-converted-numerator',
    'commonden-second-converted-numerator', 'commonden-first-scale-factor',
    'commonden-compare-first-numerator', 'commonden-converted-numerator-sum',
    'commonden-inverse-original-numerator', 'commonden-converted-numerator-gap',
    'commonden-denominator-sum-error', 'commonden-scale-factor-error'
  ],
  'fraccompare-001': [
    'fraccompare-same-numerator-larger', 'fraccompare-unit-fraction-smaller',
    'fraccompare-near-half-larger', 'fraccompare-common-denominator-gap',
    'fraccompare-context-larger-share', 'fraccompare-context-share-gap',
    'fraccompare-context-nearer-whole', 'fraccompare-half-threshold-gap',
    'fraccompare-denominator-only-error', 'fraccompare-cross-product-direction-error'
  ],
  'fracadd-001': [
    'fracadd-unlike-direct', 'fracadd-multiple-denominator',
    'fracadd-complement-to-whole', 'fracadd-common-denominator-numerator-sum',
    'fracadd-context-total', 'fracadd-context-three-part-total',
    'fracadd-missing-addend', 'fracadd-context-perimeter',
    'fracadd-denominator-sum-error', 'fracadd-balanced-missing-numerator'
  ],
  'fracsub-001': [
    'fracsub-unlike-direct', 'fracsub-same-numerator',
    'fracsub-from-whole', 'fracsub-common-denominator-numerator-difference',
    'fracsub-context-remaining', 'fracsub-context-distance-gap',
    'fracsub-missing-subtrahend', 'fracsub-missing-minuend',
    'fracsub-unconverted-numerator-error', 'fracsub-addition-instead-error'
  ],
  'rounding-001': [
    'rounding-direct-tens', 'rounding-direct-hundreds', 'rounding-direct-thousands',
    'rounding-boundary-value', 'rounding-context-total', 'rounding-context-difference',
    'rounding-inverse-lower-bound', 'rounding-inverse-upper-bound',
    'rounding-interval-boundary-sum', 'rounding-method-gap'
  ],
  'estimate-001': [
    'estimate-ceil-direct-tens', 'estimate-floor-direct-tens',
    'estimate-ceil-direct-hundreds', 'estimate-floor-direct-hundreds',
    'estimate-safe-capacity-ceil', 'estimate-complete-groups-floor',
    'estimate-ceil-extra', 'estimate-floor-remainder',
    'estimate-wrong-bound-shortage', 'estimate-bound-sum'
  ],
  'numberrange-001': [
    'numberrange-lower-inclusive-first', 'numberrange-lower-exclusive-first',
    'numberrange-upper-inclusive-last', 'numberrange-upper-exclusive-last',
    'numberrange-inclusive-count', 'numberrange-exclusive-count',
    'numberrange-mixed-bound-count', 'numberrange-context-qualified-count',
    'numberrange-endpoint-confusion-gap', 'numberrange-two-rule-gap'
  ],
  'fracmul-001': [
    'fracmul-fraction-natural', 'fracmul-natural-fraction',
    'fracmul-fraction-fraction', 'fracmul-cancel-before-product',
    'fracmul-context-part-of-quantity', 'fracmul-context-part-of-part',
    'fracmul-missing-factor', 'fracmul-context-fractional-area',
    'fracmul-denominator-omission-error', 'fracmul-product-size-gap'
  ],
  'decimalmul-001': [
    'decimalmul-decimal-by-natural', 'decimalmul-decimal-by-decimal',
    'decimalmul-place-value-natural-product', 'decimalmul-place-value-double-decimal',
    'decimalmul-context-repeated-quantity', 'decimalmul-context-combined-total',
    'decimalmul-context-rectangle-area', 'decimalmul-context-remaining-quantity',
    'decimalmul-missed-decimal-error', 'decimalmul-factor-scale-gap'
  ],
  'average-001': [
    'average-balanced-three', 'average-balanced-four',
    'average-from-total-three', 'average-from-total-four',
    'average-context-three', 'average-context-four',
    'average-missing-value', 'average-target-next-value',
    'average-wrong-divisor-error', 'average-record-correction-error'
  ]
})

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

function reviewedActions(...actions) {
  if (actions.length === 0) {
    throw new Error('reviewed Grade 5 task actions must not be empty')
  }
  const unsupported = actions.filter(action => !ALLOWED_TASK_ACTIONS.has(action))
  if (unsupported.length > 0) {
    throw new Error(`unsupported Grade 5 task actions: ${unsupported.join(', ')}`)
  }
  if (new Set(actions).size !== actions.length) {
    throw new Error(`duplicate Grade 5 task actions: ${actions.join(', ')}`)
  }
  return Object.freeze(actions)
}

// These actions were selected slot by slot from the learner-facing prompt and
// solver meaning. This is deliberately an explicit source table: no action is
// inferred from difficulty, cognitiveDomain, or reasoningPattern.
const REVIEWED_SLOT_TASK_ACTIONS = Object.freeze({
  'area-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'reason'),
    reviewedActions('reason', 'calculate'),
  ],
  'areaunit-001': [
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'average-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'commonden-001': [
    reviewedActions('calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'congruence-001': [
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'interpret'),
    reviewedActions('analyze_error', 'reason'),
  ],
  'cuboid-001': [
    reviewedActions('recognize'),
    reviewedActions('recognize'),
    reviewedActions('recognize'),
    reviewedActions('recognize'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'cuboidnet-001': [
    reviewedActions('recognize'),
    reviewedActions('construct', 'interpret'),
    reviewedActions('construct', 'interpret'),
    reviewedActions('construct', 'reason'),
    reviewedActions('construct', 'interpret'),
    reviewedActions('recognize'),
    reviewedActions('construct', 'interpret'),
    reviewedActions('calculate'),
    reviewedActions('construct', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'decimalmul-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('compare', 'calculate'),
  ],
  'divisor-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('classify', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('classify'),
    reviewedActions('classify'),
    reviewedActions('calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('classify', 'calculate'),
  ],
  'estimate-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('compare', 'calculate'),
  ],
  'fracadd-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('reason', 'calculate'),
  ],
  'fraccompare-001': [
    reviewedActions('compare'),
    reviewedActions('compare'),
    reviewedActions('compare', 'calculate'),
    reviewedActions('compare', 'calculate'),
    reviewedActions('model', 'compare'),
    reviewedActions('model', 'compare', 'calculate'),
    reviewedActions('compare', 'reason'),
    reviewedActions('compare', 'calculate'),
    reviewedActions('analyze_error', 'compare', 'calculate'),
    reviewedActions('analyze_error', 'compare', 'calculate'),
  ],
  'fracmul-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('compare', 'calculate'),
  ],
  'fracsub-001': [
    reviewedActions('calculate'),
    reviewedActions('compare', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'gcd-001': [
    reviewedActions('calculate'),
    reviewedActions('classify', 'calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'lcm-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'mixedcalc-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'model', 'calculate'),
  ],
  'multiple-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('reason', 'calculate'),
  ],
  'numberrange-001': [
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('classify', 'calculate'),
    reviewedActions('classify', 'calculate'),
    reviewedActions('classify', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('compare', 'calculate'),
  ],
  'pattern-001': [
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('compare', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'perimeter-001': [
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'polygonarea-001': [
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'possibility-001': [
    reviewedActions('classify'),
    reviewedActions('compare', 'model'),
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('model', 'calculate'),
    reviewedActions('compare', 'interpret'),
    reviewedActions('model', 'calculate'),
    reviewedActions('interpret', 'reason'),
    reviewedActions('analyze_error', 'compare', 'calculate'),
    reviewedActions('model', 'reason', 'calculate'),
  ],
  'rounding-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('compare', 'calculate'),
  ],
  'simplify-001': [
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('calculate'),
    reviewedActions('model', 'calculate'),
    reviewedActions('reason', 'calculate'),
    reviewedActions('calculate'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
  'symmetry-001': [
    reviewedActions('recognize'),
    reviewedActions('recognize'),
    reviewedActions('recognize'),
    reviewedActions('recognize'),
    reviewedActions('interpret'),
    reviewedActions('interpret', 'calculate'),
    reviewedActions('interpret'),
    reviewedActions('interpret'),
    reviewedActions('analyze_error', 'calculate'),
    reviewedActions('analyze_error', 'calculate'),
  ],
})

// A shared family name may still contain independently authored A/B/C sources.
// These overrides record the representation or learner action that makes the
// first two area-unit sources semantically distinct rather than numeric clones.
const REVIEWED_TEMPLATE_BLUEPRINT_OVERRIDES = Object.freeze({
  'tmpl-areaunit-A-01': Object.freeze({
    representations: Object.freeze(['text', 'equation', 'diagram']),
    taskActions: reviewedActions('interpret', 'calculate'),
  }),
  'tmpl-areaunit-A-02': Object.freeze({
    representations: Object.freeze(['text', 'equation', 'diagram']),
    taskActions: reviewedActions('interpret', 'calculate'),
  }),
  'tmpl-areaunit-B-01': Object.freeze({
    representations: Object.freeze(['text', 'diagram', 'manipulative']),
    taskActions: reviewedActions('model', 'calculate'),
  }),
  'tmpl-areaunit-B-02': Object.freeze({
    representations: Object.freeze(['text', 'diagram', 'manipulative']),
    taskActions: reviewedActions('model', 'calculate'),
  }),
  'tmpl-areaunit-C-01': Object.freeze({
    representations: Object.freeze(['text', 'equation', 'diagram']),
    taskActions: reviewedActions('calculate'),
  }),
  'tmpl-areaunit-C-02': Object.freeze({
    representations: Object.freeze(['text', 'equation', 'diagram']),
    taskActions: reviewedActions('calculate'),
  }),
})

// Every Grade 5 content correction has been reviewed and is eligible for a
// complete blueprint. Keep the exported set as an explicit release gate.
const BLOCKED_CONTENT_TEMPLATE_IDS = new Set()

const ADDITIONAL_REVIEWED_FAMILY_BLUEPRINTS = Object.freeze({
  'numberrange-lower-inclusive-first': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'numberrange-lower-exclusive-first': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'numberrange-upper-inclusive-last': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'numberrange-upper-exclusive-last': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'numberrange-inclusive-count': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'numberrange-exclusive-count': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'numberrange-mixed-bound-count': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'numberrange-context-qualified-count': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-02', estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'numberrange-endpoint-confusion-gap': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-02', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'numberrange-two-rule-gap': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'compare_methods', primaryStandard: '6수01-02', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Area-unit relations
  'areaunit-one-square-meter': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-12', estimatedSteps: 2, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'areaunit-one-square-kilometer': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-12', estimatedSteps: 2, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'areaunit-square-meters-forward': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-12', estimatedSteps: 2, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'areaunit-square-kilometers-forward': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-12', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'areaunit-square-centimeters-reverse': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-12', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'areaunit-square-meters-reverse': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-12', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'areaunit-rectangle-to-square-centimeters': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-12', connectedStandards: ['6수03-13'], estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'areaunit-mixed-land-total': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-12', estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'areaunit-one-direction-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-12', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'areaunit-rectangle-one-side-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-12', connectedStandards: ['6수03-13'], estimatedSteps: 5, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Possibility language, numeric expression, and data-grounded prediction
  'possibility-verbal-impossible-certain': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수04-04', estimatedSteps: 1, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'possibility-verbal-comparison': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수04-04', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'possibility-numeric-half': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수04-05', connectedStandards: ['6수04-04'], estimatedSteps: 2, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'possibility-numeric-impossible': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수04-05', connectedStandards: ['6수04-04'], estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'possibility-predict-from-half': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수04-06', connectedStandards: ['6수04-05'], estimatedSteps: 2, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'possibility-compare-relative-frequency': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'compare_methods', primaryStandard: '6수04-06', connectedStandards: ['6수04-05'], estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'possibility-predicted-count-gap': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수04-06', connectedStandards: ['6수04-05'], estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'possibility-sample-size-reliability': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'data_sufficiency', primaryStandard: '6수04-06', connectedStandards: ['6수04-05'], estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'possibility-raw-count-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수04-06', connectedStandards: ['6수04-05'], estimatedSteps: 5, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'possibility-pooled-data-prediction': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'data_sufficiency', primaryStandard: '6수04-06', connectedStandards: ['6수04-05'], estimatedSteps: 5, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Natural-number mixed calculation: direct rules, transferred contexts, and
  // two genuine comparison/error-analysis families.
  'mixedcalc-add-multiply-order': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'low' }),
  'mixedcalc-multiply-add-order': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'low' }),
  'mixedcalc-parenthesized-sum-product': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'low' }),
  'mixedcalc-multiply-subtract-order': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'low' }),
  'mixedcalc-context-stock-after-use': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-01', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'mixedcalc-context-combined-groups-after-use': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-01', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'mixedcalc-context-boxed-assortment': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'mixedcalc-context-team-difference': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'mixedcalc-missing-parentheses-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-01', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),
  'mixedcalc-model-correction-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check', primaryStandard: '6수01-01', estimatedSteps: 4, readingLoad: 'high', contextType: 'real_world' }),

  // Divisors and multiples
  'divisor-missing-factor': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'inverse', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'low' }),
  'divisor-greatest': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-04', estimatedSteps: 1, readingLoad: 'low' }),
  'divisor-least': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-04', estimatedSteps: 1, readingLoad: 'low' }),
  'divisor-count': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'divisor-context-rectangle': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'divisor-largest-proper': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'divisor-smallest-nonunit': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'divisor-factor-pair-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'divisor-remainder-counterexample': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-04', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'divisor-nondivisor-count': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-04', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'multiple-second': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-05', estimatedSteps: 1, readingLoad: 'low' }),
  'multiple-nth': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-05', estimatedSteps: 1, readingLoad: 'low' }),
  'multiple-order-from-value': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'inverse', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'low' }),
  'multiple-next': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium' }),
  'multiple-context-packages': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'multiple-context-repeated-distance': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'multiple-next-after-known': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium' }),
  'multiple-missing-multiplier': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium', contextType: 'puzzle' }),
  'multiple-addition-error-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-05', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'multiple-between-consecutive': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'constraint', primaryStandard: '6수01-05', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),

  // GCD and LCM
  'gcd-structured-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'low' }),
  'gcd-common-divisor': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'low' }),
  'gcd-first-quotient': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'inverse', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'low' }),
  'gcd-second-quotient': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'inverse', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'gcd-context-equal-groups': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'gcd-context-items-per-group': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-04', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'gcd-context-square-tile': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-04', connectedStandards: ['6수03-14'], estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'gcd-quotient-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-04', estimatedSteps: 3, readingLoad: 'medium' }),
  'gcd-too-large-candidate': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-04', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'gcd-product-confusion': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-04', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'lcm-structured-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'low' }),
  'lcm-common-multiple': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'low' }),
  'lcm-first-multiplier': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'inverse', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'low' }),
  'lcm-second-common': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium' }),
  'lcm-context-simultaneous-cycle': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'lcm-context-package-total': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'lcm-context-second-meeting': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-05', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'lcm-missing-cycle-count': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-05', estimatedSteps: 3, readingLoad: 'medium', contextType: 'puzzle' }),
  'lcm-product-error-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-05', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'lcm-sum-error-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-05', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),

  // Correspondence patterns
  'pattern-rule-multiplicative': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수02-01', estimatedSteps: 1, readingLoad: 'low' }),
  'pattern-rule-additive': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수02-01', estimatedSteps: 1, readingLoad: 'low' }),
  'pattern-rule-affine': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'multi_step', primaryStandard: '6수02-01', estimatedSteps: 2, readingLoad: 'medium' }),
  'pattern-inverse-multiplicative': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'inverse', primaryStandard: '6수02-01', estimatedSteps: 2, readingLoad: 'medium' }),
  'pattern-context-equal-groups': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수02-01', connectedStandards: ['6수01-01'], estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'pattern-context-fixed-plus-rate': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수02-01', connectedStandards: ['6수01-01'], estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'pattern-inverse-affine': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수02-01', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'pattern-shift-then-scale': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수02-01', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'pattern-rule-comparison-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check', primaryStandard: '6수02-01', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),
  'pattern-additive-error-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수02-01', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),

  // Fraction equivalence and common denominators
  'simplify-reduce-scaled-fraction': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-06', estimatedSteps: 1, readingLoad: 'low' }),
  'simplify-identify-numerator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'low' }),
  'simplify-identify-denominator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'low' }),
  'simplify-greatest-common-factor': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-06', connectedStandards: ['6수01-04'], estimatedSteps: 2, readingLoad: 'medium' }),
  'simplify-equivalent-numerator': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'medium' }),
  'simplify-context-part': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'simplify-missing-scale-factor': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'medium', contextType: 'puzzle' }),
  'simplify-component-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'medium' }),
  'simplify-one-sided-division-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'simplify-additive-change-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'commonden-consecutive-denominators': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'low' }),
  'commonden-first-converted-numerator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'low' }),
  'commonden-second-converted-numerator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'low' }),
  'commonden-first-scale-factor': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'inverse', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'medium' }),
  'commonden-compare-first-numerator': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'medium' }),
  'commonden-converted-numerator-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'medium' }),
  'commonden-inverse-original-numerator': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'medium', contextType: 'puzzle' }),
  'commonden-converted-numerator-gap': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'medium' }),
  'commonden-denominator-sum-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'commonden-scale-factor-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),

  // Unlike-denominator fraction comparison
  'fraccompare-same-numerator-larger': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-07', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'fraccompare-unit-fraction-smaller': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-07', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'fraccompare-near-half-larger': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-07', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'fraccompare-common-denominator-gap': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-07', connectedStandards: ['6수01-06'], estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'fraccompare-context-larger-share': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-07', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'fraccompare-context-share-gap': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-07', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'fraccompare-context-nearer-whole': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'compare_methods', primaryStandard: '6수01-07', estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'fraccompare-half-threshold-gap': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'constraint', primaryStandard: '6수01-07', estimatedSteps: 3, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'fraccompare-denominator-only-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-07', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'fraccompare-cross-product-direction-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-07', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Fraction addition and subtraction
  'fracadd-unlike-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'low' }),
  'fracadd-multiple-denominator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-08', connectedStandards: ['6수01-06'], estimatedSteps: 2, readingLoad: 'low' }),
  'fracadd-complement-to-whole': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'medium' }),
  'fracadd-common-denominator-numerator-sum': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-08', connectedStandards: ['6수01-06'], estimatedSteps: 2, readingLoad: 'medium' }),
  'fracadd-context-total': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'fracadd-context-three-part-total': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'fracadd-missing-addend': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'medium', contextType: 'puzzle' }),
  'fracadd-context-perimeter': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-08', connectedStandards: ['6수03-13'], estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'fracadd-denominator-sum-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-08', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),
  'fracadd-balanced-missing-numerator': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'constraint', primaryStandard: '6수01-08', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),
  'fracsub-unlike-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'low' }),
  'fracsub-same-numerator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'low' }),
  'fracsub-from-whole': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'medium' }),
  'fracsub-common-denominator-numerator-difference': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-08', connectedStandards: ['6수01-06'], estimatedSteps: 2, readingLoad: 'medium' }),
  'fracsub-context-remaining': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'fracsub-context-distance-gap': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'fracsub-missing-subtrahend': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'medium', contextType: 'puzzle' }),
  'fracsub-missing-minuend': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'medium', contextType: 'puzzle' }),
  'fracsub-unconverted-numerator-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-08', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),
  'fracsub-addition-instead-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-08', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),

  // Rounding and directed estimation
  'rounding-direct-tens': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low', contextType: 'real_world' }),
  'rounding-direct-hundreds': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low', contextType: 'real_world' }),
  'rounding-direct-thousands': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low', contextType: 'real_world' }),
  'rounding-boundary-value': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'puzzle' }),
  'rounding-context-total': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'rounding-context-difference': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'rounding-inverse-lower-bound': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'puzzle' }),
  'rounding-inverse-upper-bound': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'puzzle' }),
  'rounding-interval-boundary-sum': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-03', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'rounding-method-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'compare_methods', primaryStandard: '6수01-03', estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world' }),
  'estimate-ceil-direct-tens': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low', contextType: 'real_world' }),
  'estimate-floor-direct-tens': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low', contextType: 'real_world' }),
  'estimate-ceil-direct-hundreds': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low', contextType: 'real_world' }),
  'estimate-floor-direct-hundreds': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low', contextType: 'real_world' }),
  'estimate-safe-capacity-ceil': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'constraint', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'estimate-complete-groups-floor': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'constraint', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'estimate-ceil-extra': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'estimate-floor-remainder': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-03', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'estimate-wrong-bound-shortage': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-03', estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world' }),
  'estimate-bound-sum': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'compare_methods', primaryStandard: '6수01-03', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),

  // Fraction and decimal multiplication
  'fracmul-fraction-natural': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-09', estimatedSteps: 2, readingLoad: 'low' }),
  'fracmul-natural-fraction': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-09', estimatedSteps: 2, readingLoad: 'low' }),
  'fracmul-fraction-fraction': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-09', estimatedSteps: 2, readingLoad: 'low' }),
  'fracmul-cancel-before-product': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-09', connectedStandards: ['6수01-06'], estimatedSteps: 3, readingLoad: 'medium' }),
  'fracmul-context-part-of-quantity': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수01-09', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'fracmul-context-part-of-part': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-09', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'fracmul-missing-factor': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수01-09', connectedStandards: ['6수01-06'], estimatedSteps: 3, readingLoad: 'high' }),
  'fracmul-context-fractional-area': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-09', connectedStandards: ['6수03-13'], estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world' }),
  'fracmul-denominator-omission-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-09', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),
  'fracmul-product-size-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'compare_methods', primaryStandard: '6수01-09', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle' }),
  'decimalmul-decimal-by-natural': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-13', estimatedSteps: 1, readingLoad: 'low' }),
  'decimalmul-decimal-by-decimal': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-13', estimatedSteps: 1, readingLoad: 'low' }),
  'decimalmul-place-value-natural-product': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-13', estimatedSteps: 2, readingLoad: 'medium' }),
  'decimalmul-place-value-double-decimal': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수01-13', estimatedSteps: 2, readingLoad: 'medium' }),
  'decimalmul-context-repeated-quantity': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수01-13', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'decimalmul-context-combined-total': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-13', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'decimalmul-context-rectangle-area': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-13', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'decimalmul-context-remaining-quantity': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-13', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'decimalmul-missed-decimal-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수01-13', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),
  'decimalmul-factor-scale-gap': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'compare_methods', primaryStandard: '6수01-13', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle' }),

  // Average: exact balanced values, transferred contexts, inverse targets, and
  // two genuine error-analysis families.
  'average-balanced-three': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'low' }),
  'average-balanced-four': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'low' }),
  'average-from-total-three': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'low' }),
  'average-from-total-four': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'low' }),
  'average-context-three': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'average-context-four': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'average-missing-value': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수04-01', estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world' }),
  'average-target-next-value': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수04-01', estimatedSteps: 3, readingLoad: 'high', contextType: 'real_world' }),
  'average-wrong-divisor-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수04-01', estimatedSteps: 4, readingLoad: 'high', contextType: 'real_world' }),
  'average-record-correction-error': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수04-01', estimatedSteps: 4, readingLoad: 'high', contextType: 'real_world' })
})

// Each entry was reviewed against its prompt, solver, solution and visual. The
// map deliberately does not read or derive from template.difficulty.
const REVIEWED_FAMILY_BLUEPRINTS = Object.freeze({
  ...ADDITIONAL_REVIEWED_FAMILY_BLUEPRINTS,
  // Integrated perimeter and area applications
  'rectangle-area-foundation': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-13', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'rectangle-perimeter-foundation': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-11', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'parallelogram-area-foundation': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'triangle-area-foundation': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'l-shape-perimeter': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-11', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'l-shape-subtractive-area': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-13', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'overlapping-rectangles': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-13', estimatedSteps: 3, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'rectangle-square-perimeter': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-11', connectedStandards: ['6수03-13'], estimatedSteps: 4, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'triple-overlap-inclusion': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check', primaryStandard: '6수03-14', connectedStandards: ['6수03-13'], estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'rectangle-square-perimeter-from-area': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'inverse', primaryStandard: '6수03-11', connectedStandards: ['6수03-13'], estimatedSteps: 4, readingLoad: 'high', visualSemantics: 'quantitative' }),

  // Perimeter and basic rectangle/square area
  'perimeter-rectangle-perimeter': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-11', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'perimeter-square-perimeter': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-11', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'perimeter-rectangle-perimeter-choice': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-11', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'perimeter-triangle-perimeter': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-11', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'perimeter-rectangle-area-context': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수03-13', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'perimeter-square-area-context': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수03-13', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'perimeter-rectangle-width-from-area': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-13', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'perimeter-rectangle-height-from-area': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-13', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'perimeter-half-perimeter-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-11', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'perimeter-addition-instead-multiplication-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-11', connectedStandards: ['6수01-01'], estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Polygon area
  'polygonarea-parallelogram-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'polygonarea-triangle-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'polygonarea-trapezoid-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'polygonarea-rhombus-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'polygonarea-parallelogram-height': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-14', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'polygonarea-triangle-height': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-14', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'polygonarea-trapezoid-bottom': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-14', estimatedSteps: 3, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'polygonarea-congruent-triangle-total': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-14', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'polygonarea-triangle-double-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-14', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'polygonarea-trapezoid-base-omission-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-14', estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Congruence
  'congruence-corresponding-vertex': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'congruence-corresponding-angle': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'congruence-congruence-statement-order': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'medium', visualSemantics: 'schematic' }),
  'congruence-same-correspondence': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'medium', visualSemantics: 'schematic' }),
  'congruence-corresponding-side-length': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'congruence-missing-corresponding-side': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'congruence-congruent-perimeter': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-01', connectedStandards: ['6수03-11'], estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'congruence-congruent-area': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-01', connectedStandards: ['6수03-13'], estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'congruence-wrong-corresponding-side-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-01', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'congruence-perimeter-invariance': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-01', connectedStandards: ['6수03-11'], estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Line and point symmetry
  'symmetry-square-axes': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'symmetry-rectangle-axes': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'symmetry-equilateral-triangle-axes': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'symmetry-rhombus-axes': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'symmetry-vertical-reflection-x': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'symmetry-vertical-reflection-distance': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'symmetry-point-reflection-x': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'symmetry-point-reflection-y': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'symmetry-line-reflection-distance-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-02', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'symmetry-point-reflection-one-coordinate-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-02', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Cuboid properties
  'cuboid-face-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboid-edge-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboid-vertex-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboid-edges-at-vertex': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboid-total-edge-length': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-03', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'cuboid-missing-width-from-edges': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-03', estimatedSteps: 2, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'cuboid-front-face-area': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수03-03', connectedStandards: ['6수03-13'], estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'cuboid-front-face-perimeter': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수03-03', connectedStandards: ['6수03-11'], estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'cuboid-half-edge-count-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-03', estimatedSteps: 3, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
  'cuboid-one-of-each-face-area-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-03', connectedStandards: ['6수03-13'], estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),

  // Cuboid nets
  'cuboidnet-net-face-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-opposite-face-one': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-opposite-face-two': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-valid-net-choice': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check', primaryStandard: '6수03-04', estimatedSteps: 2, readingLoad: 'medium', contextType: 'puzzle', visualSemantics: 'schematic' }),
  'cuboidnet-opposite-face-input': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-opposite-pair-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', connectedStandards: ['6수03-04'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-top-bottom-pair': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-net-square-perimeter': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수03-04', connectedStandards: ['6수03-11'], estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),
  'cuboidnet-opposite-label-sum': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-04', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'schematic' }),
  'cuboidnet-shared-edge-perimeter-error': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'error_analysis', primaryStandard: '6수03-04', connectedStandards: ['6수03-11'], estimatedSteps: 4, readingLoad: 'high', contextType: 'puzzle', visualSemantics: 'quantitative' }),
})

const REAL_WORLD_TEMPLATE_IDS = new Set([
  'tmpl-area-B-01', 'tmpl-area-C-01',
  'tmpl-area-B-02', 'tmpl-area-C-02',
  'tmpl-area-B-03', 'tmpl-area-C-03',
  'tmpl-area-B-04', 'tmpl-area-C-04',
  'tmpl-area-B-05', 'tmpl-area-C-05',
  'tmpl-area-B-06', 'tmpl-area-C-06',
  'tmpl-area-B-07', 'tmpl-area-C-07',
  'tmpl-gcd-A-05', 'tmpl-gcd-B-05', 'tmpl-gcd-C-05',
])

function getReviewedProblemFamily(template) {
  const slotFamilies = REVIEWED_SLOT_FAMILIES[template.concept_id]
  if (!slotFamilies) {
    if (!template.problem_family) {
      throw new Error(`${template.id}: missing problem_family and no reviewed slot mapping`)
    }
    return template.problem_family
  }

  const match = template.id.match(/-(\d{2})$/)
  const slot = match ? Number(match[1]) : NaN
  const reviewedFamily = slotFamilies[slot - 1]
  if (!reviewedFamily) {
    throw new Error(`${template.id}: no reviewed problem family for slot ${match?.[1] || 'unknown'}`)
  }
  if (template.problem_family && template.problem_family !== reviewedFamily) {
    throw new Error(`${template.id}: existing problem_family differs from reviewed slot mapping`)
  }
  return reviewedFamily
}

function getReviewedTaskActions(template) {
  const templateOverride = REVIEWED_TEMPLATE_BLUEPRINT_OVERRIDES[template.id]
  if (templateOverride?.taskActions) {
    return [...templateOverride.taskActions]
  }
  const slotActions = REVIEWED_SLOT_TASK_ACTIONS[template.concept_id]
  if (!slotActions || slotActions.length !== 10) {
    throw new Error(
      `${template.id}: expected 10 explicit task-action slots for ${template.concept_id}`,
    )
  }
  const match = template.id.match(/-(\d{2})$/)
  const slot = match ? Number(match[1]) : NaN
  const taskActions = slotActions[slot - 1]
  if (!taskActions) {
    throw new Error(`${template.id}: no reviewed task actions for slot ${match?.[1] || 'unknown'}`)
  }
  return [...taskActions]
}

function getReviewedBlueprint(template) {
  if (BLOCKED_CONTENT_TEMPLATE_IDS.has(template.id)) {
    throw new Error(`${template.id}: blueprint blocked by unresolved content semantics`)
  }
  const family = getReviewedProblemFamily(template)
  const reviewedBlueprint = REVIEWED_FAMILY_BLUEPRINTS[family]
  const templateOverride = REVIEWED_TEMPLATE_BLUEPRINT_OVERRIDES[template.id]
  if (!reviewedBlueprint) {
    throw new Error(`${template.id}: no reviewed blueprint for ${family || 'missing problem_family'}`)
  }

  return {
    problemFamily: family,
    ...reviewedBlueprint,
    ...(REAL_WORLD_TEMPLATE_IDS.has(template.id) ? { contextType: 'real_world' } : {}),
    ...(reviewedBlueprint.connectedStandards
      ? { connectedStandards: [...reviewedBlueprint.connectedStandards] }
      : {}),
    representations: [
      ...(templateOverride?.representations ?? reviewedBlueprint.representations),
    ],
    taskActions: getReviewedTaskActions(template),
  }
}

function findJsonObjectEnd(source, objectStart, context) {
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = objectStart; index < source.length; index += 1) {
    const character = source[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === '"') {
        inString = false
      }
      continue
    }
    if (character === '"') {
      inString = true
    } else if (character === '{') {
      depth += 1
    } else if (character === '}') {
      depth -= 1
      if (depth === 0) return index + 1
    }
  }

  throw new Error(`${context}: unterminated blueprint object`)
}

function migrateTemplateFile(raw, filename) {
  const templates = JSON.parse(raw)
  let migrated = raw
  let changedCount = 0
  let changedFamilyCount = 0

  for (const template of templates) {
    if (BLOCKED_CONTENT_TEMPLATE_IDS.has(template.id)) continue
    const reviewedFamily = getReviewedProblemFamily(template)
    const blueprint = getReviewedBlueprint(template)
    const idToken = `"id": ${JSON.stringify(template.id)}`
    const idIndex = migrated.indexOf(idToken)
    if (idIndex < 0) throw new Error(`${filename} ${template.id}: id token not found`)

    const nextObjectIndex = migrated.indexOf('\n  },', idIndex)
    const familyToken = `"problem_family": ${JSON.stringify(reviewedFamily)},`
    let familyIndex = migrated.indexOf(familyToken, idIndex)
    if (familyIndex < 0 || (nextObjectIndex >= 0 && familyIndex > nextObjectIndex)) {
      const setToken = `"set_id": ${JSON.stringify(template.set_id)},`
      const setIndex = migrated.indexOf(setToken, idIndex)
      if (setIndex < 0 || (nextObjectIndex >= 0 && setIndex > nextObjectIndex)) {
        throw new Error(`${filename} ${template.id}: set_id line not found in object`)
      }
      const setLineEnd = migrated.indexOf('\n', setIndex)
      const setLineStart = migrated.lastIndexOf('\n', setIndex) + 1
      const indent = migrated.slice(setLineStart, setIndex)
      const familyLine = `${indent}${familyToken}`
      migrated = `${migrated.slice(0, setLineEnd + 1)}${familyLine}\n${migrated.slice(setLineEnd + 1)}`
      familyIndex = setLineEnd + 1 + indent.length
      changedFamilyCount += 1
    }

    if (template.blueprint === undefined) {
      const familyLineEnd = migrated.indexOf('\n', familyIndex)
      const familyLineStart = migrated.lastIndexOf('\n', familyIndex) + 1
      const indent = migrated.slice(familyLineStart, familyIndex)
      const blueprintLine = `${indent}"blueprint": ${JSON.stringify(blueprint)},`
      migrated = `${migrated.slice(0, familyLineEnd + 1)}${blueprintLine}\n${migrated.slice(familyLineEnd + 1)}`
      changedCount += 1
    } else if (JSON.stringify(template.blueprint) !== JSON.stringify(blueprint)) {
      const blueprintKey = '"blueprint":'
      const blueprintIndex = migrated.indexOf(blueprintKey, idIndex)
      if (blueprintIndex < 0 || (nextObjectIndex >= 0 && blueprintIndex > nextObjectIndex)) {
        throw new Error(`${filename} ${template.id}: existing blueprint line not found in object`)
      }
      const blueprintObjectStart = migrated.indexOf('{', blueprintIndex + blueprintKey.length)
      if (
        blueprintObjectStart < 0
        || (nextObjectIndex >= 0 && blueprintObjectStart > nextObjectIndex)
      ) {
        throw new Error(`${filename} ${template.id}: existing blueprint object not found`)
      }
      const blueprintObjectEnd = findJsonObjectEnd(
        migrated,
        blueprintObjectStart,
        `${filename} ${template.id}`,
      )
      const existingBlueprint = migrated.slice(blueprintObjectStart, blueprintObjectEnd)
      const blueprintLineStart = migrated.lastIndexOf('\n', blueprintIndex) + 1
      const blueprintIndent = migrated.slice(blueprintLineStart, blueprintIndex)
      const serializedBlueprint = existingBlueprint.includes('\n')
        ? JSON.stringify(blueprint, null, 2).replace(/\n/g, `\n${blueprintIndent}`)
        : JSON.stringify(blueprint)
      migrated = (
        `${migrated.slice(0, blueprintObjectStart)}` +
        `${serializedBlueprint}` +
        `${migrated.slice(blueprintObjectEnd)}`
      )
      changedCount += 1
    }
  }

  const migratedTemplates = JSON.parse(migrated)
  for (const template of migratedTemplates) {
    if (BLOCKED_CONTENT_TEMPLATE_IDS.has(template.id)) {
      if (template.blueprint !== undefined) {
        throw new Error(`${filename} ${template.id}: blocked template must not declare blueprint metadata`)
      }
      continue
    }
    if (JSON.stringify(template.blueprint) !== JSON.stringify(getReviewedBlueprint(template))) {
      throw new Error(`${filename} ${template.id}: migrated metadata verification failed`)
    }
  }

  return { content: migrated, changedCount, changedFamilyCount }
}

function runMigration({ check = false } = {}) {
  let pendingCount = 0

  for (const filename of MIGRATED_BANKS) {
    const filePath = path.join(TEMPLATE_DIR, filename)
    const raw = fs.readFileSync(filePath, 'utf8')
    const result = migrateTemplateFile(raw, filename)
    pendingCount += result.changedCount

    if (!check && result.changedCount > 0) {
      fs.writeFileSync(filePath, result.content)
    }
    console.log(
      `${filename}: ${result.changedFamilyCount} problem-family and ` +
      `${result.changedCount} blueprint entries ${check ? 'pending' : 'added'}`
    )
  }

  if (check && pendingCount > 0) {
    process.exitCode = 1
  }
  return pendingCount
}

if (require.main === module) {
  runMigration({ check: process.argv.includes('--check') })
}

module.exports = {
  MIGRATED_BANKS,
  BLOCKED_CONTENT_TEMPLATE_IDS,
  REVIEWED_FAMILY_BLUEPRINTS,
  REVIEWED_SLOT_FAMILIES,
  REVIEWED_SLOT_TASK_ACTIONS,
  REVIEWED_TEMPLATE_BLUEPRINT_OVERRIDES,
  getReviewedProblemFamily,
  getReviewedTaskActions,
  getReviewedBlueprint,
  migrateTemplateFile,
  runMigration
}
