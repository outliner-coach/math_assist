const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const TEMPLATE_DIR = path.join(ROOT, 'public', 'data', 'templates')
const MIGRATED_BANKS = [
  'area.json',
  'average.json',
  'commonden.json',
  'congruence.json',
  'cuboid.json',
  'cuboidnet.json',
  'decimalmul.json',
  'divisor.json',
  'estimate.json',
  'fracadd.json',
  'fracmul.json',
  'fracsub.json',
  'gcd.json',
  'lcm.json',
  'mixedcalc.json',
  'multiple.json',
  'pattern.json',
  'perimeter.json',
  'polygonarea.json',
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
  'mixedcalc-001': [
    'mixedcalc-add-multiply-order', 'mixedcalc-multiply-add-order',
    'mixedcalc-parenthesized-sum-product', 'mixedcalc-multiply-subtract-order',
    'mixedcalc-three-operation-order', 'mixedcalc-parentheses-then-subtract',
    'mixedcalc-parenthesized-factor-product', 'mixedcalc-difference-times-factor',
    'mixedcalc-two-parentheses-product', 'mixedcalc-sum-of-two-products'
  ],
  'divisor-001': [
    'divisor-identify', 'divisor-greatest', 'divisor-least', 'divisor-count',
    'divisor-smallest-nonunit', 'divisor-largest-two-gap', 'divisor-largest-proper',
    'divisor-identify', 'divisor-second-largest', 'divisor-second-largest'
  ],
  'multiple-001': [
    'multiple-identify', 'multiple-nth', 'multiple-identify-nonmultiple', 'multiple-nth',
    'multiple-sum-two-terms', 'multiple-scale-term', 'multiple-difference-two-terms',
    'multiple-identify', 'multiple-difference-two-terms', 'multiple-nth'
  ],
  'gcd-001': [
    'gcd-direct', 'gcd-direct', 'gcd-identify-common-divisor', 'gcd-direct',
    'gcd-equal-group-maximum', 'gcd-equal-group-maximum', 'gcd-double', 'gcd-double',
    'gcd-quotient-sum', 'gcd-quotient-sum'
  ],
  'lcm-001': [
    'lcm-direct', 'lcm-direct', 'lcm-identify-non-common-multiple', 'lcm-direct',
    'lcm-simultaneous-cycle', 'lcm-double', 'lcm-offset', 'lcm-offset',
    'lcm-simultaneous-cycle', 'lcm-offset'
  ],
  'pattern-001': [
    'pattern-infer-multiplicative', 'pattern-infer-additive', 'pattern-infer-affine',
    'pattern-apply-additive', 'pattern-apply-affine', 'pattern-apply-subtractive',
    'pattern-infer-multiplicative', 'pattern-apply-affine', 'pattern-apply-affine',
    'pattern-shift-then-scale'
  ],
  'simplify-001': [
    'simplify-reduce-fraction', 'simplify-reduced-numerator', 'simplify-reduced-denominator',
    'simplify-reduce-fraction', 'simplify-component-sum', 'simplify-reduced-numerator',
    'simplify-reduced-denominator', 'simplify-reduced-denominator',
    'simplify-component-difference', 'simplify-component-sum'
  ],
  'commonden-001': [
    'commonden-find-denominator', 'commonden-find-denominator',
    'commonden-convert-numerator', 'commonden-convert-numerator',
    'commonden-convert-numerator', 'commonden-convert-numerator',
    'commonden-denominator-offset', 'commonden-converted-numerator-sum',
    'commonden-converted-numerator-difference', 'commonden-find-denominator'
  ],
  'fracadd-001': [
    'fracadd-direct', 'fracadd-direct', 'fracadd-direct', 'fracadd-direct',
    'fracadd-direct', 'fracadd-context-total', 'fracadd-common-denominator-numerator-sum',
    'fracadd-common-denominator-numerator-sum', 'fracadd-adjusted-result', 'fracadd-direct'
  ],
  'fracsub-001': [
    'fracsub-direct', 'fracsub-direct', 'fracsub-direct', 'fracsub-direct',
    'fracsub-direct', 'fracsub-context-difference', 'fracsub-common-denominator-numerator-difference',
    'fracsub-common-denominator-numerator-difference', 'fracsub-adjusted-result', 'fracsub-direct'
  ],
  'rounding-001': [
    'rounding-direct-at-place', 'rounding-direct-at-place', 'rounding-direct-at-place',
    'rounding-direct-at-place', 'rounding-direct-at-place', 'rounding-direct-at-place',
    'rounding-direct-at-place', 'rounding-direct-at-place', 'rounding-context-estimate',
    'rounding-direct-at-place'
  ],
  'estimate-001': [
    'estimate-round-up-at-place', 'estimate-round-down-at-place',
    'estimate-round-up-at-place', 'estimate-round-down-at-place',
    'estimate-round-up-at-place', 'estimate-round-down-at-place',
    'estimate-round-up-at-place', 'estimate-round-down-at-place',
    'estimate-context-round-up', 'estimate-context-round-down'
  ],
  'fracmul-001': [
    'fracmul-direct', 'fracmul-direct', 'fracmul-direct', 'fracmul-direct',
    'fracmul-direct', 'fracmul-context-product', 'fracmul-numerator-product',
    'fracmul-reduced-component-sum', 'fracmul-adjusted-result', 'fracmul-direct'
  ],
  'decimalmul-001': [
    'decimalmul-decimal-by-natural', 'decimalmul-decimal-by-natural',
    'decimalmul-decimal-by-decimal', 'decimalmul-decimal-by-decimal',
    'decimalmul-decimal-by-natural', 'decimalmul-decimal-by-natural',
    'decimalmul-decimal-by-decimal', 'decimalmul-decimal-by-decimal',
    'decimalmul-product-offset', 'decimalmul-decimal-by-decimal'
  ],
  'average-001': [
    'average-direct', 'average-direct', 'average-direct', 'average-direct',
    'average-direct', 'average-direct', 'average-offset', 'average-context-mean',
    'average-inverse-total', 'average-inverse-total'
  ]
})

// Every Grade 5 content correction has been reviewed and is eligible for a
// complete blueprint. Keep the exported set as an explicit release gate.
const BLOCKED_CONTENT_TEMPLATE_IDS = new Set()

const ADDITIONAL_REVIEWED_FAMILY_BLUEPRINTS = Object.freeze({
  // Natural-number mixed calculation: all current items execute known rules.
  'mixedcalc-add-multiply-order': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'low' }),
  'mixedcalc-multiply-add-order': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'low' }),
  'mixedcalc-parenthesized-sum-product': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'low' }),
  'mixedcalc-multiply-subtract-order': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'low' }),
  'mixedcalc-three-operation-order': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'multi_step', primaryStandard: '6수01-01', estimatedSteps: 3, readingLoad: 'medium' }),
  'mixedcalc-parentheses-then-subtract': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'multi_step', primaryStandard: '6수01-01', estimatedSteps: 3, readingLoad: 'medium' }),
  'mixedcalc-parenthesized-factor-product': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'multi_step', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'medium' }),
  'mixedcalc-difference-times-factor': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'multi_step', primaryStandard: '6수01-01', estimatedSteps: 2, readingLoad: 'medium' }),
  'mixedcalc-two-parentheses-product': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'multi_step', primaryStandard: '6수01-01', estimatedSteps: 3, readingLoad: 'medium' }),
  'mixedcalc-sum-of-two-products': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'multi_step', primaryStandard: '6수01-01', estimatedSteps: 3, readingLoad: 'medium' }),

  // Divisors and multiples
  'divisor-identify': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-04', estimatedSteps: 1, readingLoad: 'low' }),
  'divisor-greatest': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-04', estimatedSteps: 1, readingLoad: 'low' }),
  'divisor-least': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-04', estimatedSteps: 1, readingLoad: 'low' }),
  'divisor-count': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'divisor-smallest-nonunit': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'divisor-largest-two-gap': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'divisor-largest-proper': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'divisor-second-largest': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'multiple-identify': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-05', estimatedSteps: 1, readingLoad: 'low' }),
  'multiple-nth': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-05', estimatedSteps: 1, readingLoad: 'low' }),
  'multiple-identify-nonmultiple': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-05', estimatedSteps: 1, readingLoad: 'low' }),
  'multiple-sum-two-terms': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium' }),
  'multiple-scale-term': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium' }),
  'multiple-difference-two-terms': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium' }),

  // GCD and LCM
  'gcd-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-04', estimatedSteps: 1, readingLoad: 'low' }),
  'gcd-identify-common-divisor': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-04', estimatedSteps: 1, readingLoad: 'low' }),
  'gcd-equal-group-maximum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'gcd-double': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-04', estimatedSteps: 2, readingLoad: 'medium' }),
  'gcd-quotient-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-04', estimatedSteps: 3, readingLoad: 'medium' }),
  'lcm-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-05', estimatedSteps: 1, readingLoad: 'low' }),
  'lcm-identify-non-common-multiple': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'constraint', primaryStandard: '6수01-05', estimatedSteps: 1, readingLoad: 'medium' }),
  'lcm-simultaneous-cycle': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'model_and_check', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'lcm-double': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium' }),
  'lcm-offset': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-05', estimatedSteps: 2, readingLoad: 'medium' }),

  // Correspondence patterns
  'pattern-infer-multiplicative': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'pattern_generalization', primaryStandard: '6수02-01', estimatedSteps: 2, readingLoad: 'medium' }),
  'pattern-infer-additive': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'pattern_generalization', primaryStandard: '6수02-01', estimatedSteps: 2, readingLoad: 'medium' }),
  'pattern-infer-affine': reviewedText({ cognitiveDomain: 'reasoning', reasoningPattern: 'pattern_generalization', primaryStandard: '6수02-01', estimatedSteps: 3, readingLoad: 'high' }),
  'pattern-apply-additive': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수02-01', estimatedSteps: 1, readingLoad: 'low' }),
  'pattern-apply-affine': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수02-01', estimatedSteps: 2, readingLoad: 'medium' }),
  'pattern-apply-subtractive': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수02-01', estimatedSteps: 2, readingLoad: 'medium' }),
  'pattern-shift-then-scale': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수02-01', estimatedSteps: 2, readingLoad: 'medium' }),

  // Fraction equivalence and common denominators
  'simplify-reduce-fraction': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-06', estimatedSteps: 1, readingLoad: 'low' }),
  'simplify-reduced-numerator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-06', estimatedSteps: 1, readingLoad: 'low' }),
  'simplify-reduced-denominator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-06', estimatedSteps: 1, readingLoad: 'low' }),
  'simplify-component-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'medium' }),
  'simplify-component-difference': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'medium' }),
  'commonden-find-denominator': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-06', estimatedSteps: 1, readingLoad: 'low' }),
  'commonden-convert-numerator': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'medium' }),
  'commonden-denominator-offset': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-06', estimatedSteps: 2, readingLoad: 'medium' }),
  'commonden-converted-numerator-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'medium' }),
  'commonden-converted-numerator-difference': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-06', estimatedSteps: 3, readingLoad: 'medium' }),

  // Fraction addition and subtraction
  'fracadd-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'low' }),
  'fracadd-context-total': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'fracadd-common-denominator-numerator-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', connectedStandards: ['6수01-06'], estimatedSteps: 3, readingLoad: 'medium' }),
  'fracadd-adjusted-result': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'high' }),
  'fracsub-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-08', estimatedSteps: 2, readingLoad: 'low' }),
  'fracsub-context-difference': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'fracsub-common-denominator-numerator-difference': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', connectedStandards: ['6수01-06'], estimatedSteps: 3, readingLoad: 'medium' }),
  'fracsub-adjusted-result': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-08', estimatedSteps: 3, readingLoad: 'high' }),

  // Rounding and directed estimation
  'rounding-direct-at-place': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low' }),
  'rounding-context-estimate': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'medium', contextType: 'real_world' }),
  'estimate-round-up-at-place': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low' }),
  'estimate-round-down-at-place': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'low' }),
  'estimate-context-round-up': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'medium', contextType: 'real_world' }),
  'estimate-context-round-down': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-03', estimatedSteps: 1, readingLoad: 'medium', contextType: 'real_world' }),

  // Fraction and decimal multiplication
  'fracmul-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-09', estimatedSteps: 2, readingLoad: 'low' }),
  'fracmul-context-product': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-09', estimatedSteps: 3, readingLoad: 'medium', contextType: 'real_world' }),
  'fracmul-numerator-product': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-09', estimatedSteps: 1, readingLoad: 'medium' }),
  'fracmul-reduced-component-sum': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-09', connectedStandards: ['6수01-06'], estimatedSteps: 3, readingLoad: 'high' }),
  'fracmul-adjusted-result': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-09', estimatedSteps: 3, readingLoad: 'high' }),
  'decimalmul-decimal-by-natural': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-13', estimatedSteps: 1, readingLoad: 'low' }),
  'decimalmul-decimal-by-decimal': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수01-13', estimatedSteps: 1, readingLoad: 'low' }),
  'decimalmul-product-offset': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수01-13', estimatedSteps: 2, readingLoad: 'medium' }),

  // Average
  'average-direct': reviewedText({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'low' }),
  'average-offset': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수04-01', estimatedSteps: 3, readingLoad: 'medium' }),
  'average-context-mean': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world' }),
  'average-inverse-total': reviewedText({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수04-01', estimatedSteps: 2, readingLoad: 'medium' })
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
  'perimeter-rectangle-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-13', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'perimeter-square-area-choice': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-13', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'perimeter-rectangle-width-from-area': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-13', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'perimeter-rectangle-height-from-area': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-13', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'perimeter-rectangle-side-from-perimeter': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-11', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'perimeter-fence-with-gate': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-11', estimatedSteps: 2, readingLoad: 'medium', contextType: 'real_world', visualSemantics: 'quantitative' }),

  // Polygon area
  'polygonarea-parallelogram-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'polygonarea-triangle-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'polygonarea-trapezoid-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'polygonarea-rhombus-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-14', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'polygonarea-parallelogram-height': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-14', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'polygonarea-triangle-height': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-14', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'polygonarea-trapezoid-bottom': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-14', estimatedSteps: 3, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'polygonarea-two-shape-area-sum': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-14', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'polygonarea-rectangle-minus-triangle': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-14', connectedStandards: ['6수03-13'], estimatedSteps: 3, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'polygonarea-rhombus-missing-diagonal': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-14', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),

  // Congruence
  'congruence-corresponding-vertex': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'congruence-corresponding-angle': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'congruence-congruence-statement-order': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'medium', visualSemantics: 'schematic' }),
  'congruence-same-correspondence': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'medium', visualSemantics: 'schematic' }),
  'congruence-corresponding-side-length': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'congruence-missing-corresponding-side': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-01', estimatedSteps: 1, readingLoad: 'medium', visualSemantics: 'schematic' }),
  'congruence-congruent-perimeter': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-01', connectedStandards: ['6수03-11'], estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'congruence-congruent-area': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-01', connectedStandards: ['6수03-13'], estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'congruence-two-missing-sides': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-01', estimatedSteps: 2, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'congruence-perimeter-difference': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check', primaryStandard: '6수03-01', connectedStandards: ['6수03-11'], estimatedSteps: 1, readingLoad: 'medium', visualSemantics: 'schematic' }),

  // Line and point symmetry
  'symmetry-square-axes': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'symmetry-rectangle-axes': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'symmetry-equilateral-triangle-axes': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'symmetry-rhombus-axes': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-02', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'symmetry-vertical-reflection-x': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'symmetry-vertical-reflection-distance': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'symmetry-point-reflection-x': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'symmetry-point-reflection-y': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-02', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'symmetry-point-reflection-coordinate-sum': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-02', estimatedSteps: 3, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'symmetry-two-reflections': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-02', estimatedSteps: 3, readingLoad: 'high', visualSemantics: 'quantitative' }),

  // Cuboid properties
  'cuboid-face-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboid-edge-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboid-vertex-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboid-edges-at-vertex': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboid-total-edge-length': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-03', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'cuboid-missing-width-from-edges': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-03', estimatedSteps: 2, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'cuboid-front-face-area': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', connectedStandards: ['6수03-13'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'cuboid-front-face-perimeter': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', connectedStandards: ['6수03-11'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'quantitative' }),
  'cuboid-missing-depth-from-edges': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'inverse', primaryStandard: '6수03-03', estimatedSteps: 2, readingLoad: 'high', visualSemantics: 'quantitative' }),
  'cuboid-three-face-area-sum': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-03', connectedStandards: ['6수03-13'], estimatedSteps: 3, readingLoad: 'medium', visualSemantics: 'quantitative' }),

  // Cuboid nets
  'cuboidnet-net-face-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-opposite-face-one': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-opposite-face-two': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'representation_shift', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-valid-net-choice': reviewed({ cognitiveDomain: 'reasoning', reasoningPattern: 'model_and_check', primaryStandard: '6수03-04', estimatedSteps: 2, readingLoad: 'medium', contextType: 'puzzle', visualSemantics: 'schematic' }),
  'cuboidnet-opposite-face-input': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-opposite-pair-count': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-03', connectedStandards: ['6수03-04'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-top-bottom-pair': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'representation_shift', primaryStandard: '6수03-04', connectedStandards: ['6수03-03'], estimatedSteps: 1, readingLoad: 'low', visualSemantics: 'schematic' }),
  'cuboidnet-net-square-perimeter': reviewed({ cognitiveDomain: 'knowing', reasoningPattern: 'direct', primaryStandard: '6수03-04', connectedStandards: ['6수03-11'], estimatedSteps: 1, readingLoad: 'medium', visualSemantics: 'quantitative' }),
  'cuboidnet-opposite-label-sum': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'multi_step', primaryStandard: '6수03-04', estimatedSteps: 2, readingLoad: 'medium', visualSemantics: 'schematic' }),
  'cuboidnet-all-opposite-pair-sums': reviewed({ cognitiveDomain: 'applying', reasoningPattern: 'systematic_counting', primaryStandard: '6수03-04', estimatedSteps: 3, readingLoad: 'medium', visualSemantics: 'schematic' }),
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

function getReviewedBlueprint(template) {
  if (BLOCKED_CONTENT_TEMPLATE_IDS.has(template.id)) {
    throw new Error(`${template.id}: blueprint blocked by unresolved content semantics`)
  }
  const family = getReviewedProblemFamily(template)
  const reviewedBlueprint = REVIEWED_FAMILY_BLUEPRINTS[family]
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
    representations: [...reviewedBlueprint.representations]
  }
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
      const existingToken = `"blueprint": ${JSON.stringify(template.blueprint)},`
      const blueprintIndex = migrated.indexOf(existingToken, idIndex)
      if (blueprintIndex < 0 || (nextObjectIndex >= 0 && blueprintIndex > nextObjectIndex)) {
        throw new Error(`${filename} ${template.id}: existing blueprint line not found in object`)
      }
      const replacement = `"blueprint": ${JSON.stringify(blueprint)},`
      migrated = `${migrated.slice(0, blueprintIndex)}${replacement}${migrated.slice(blueprintIndex + existingToken.length)}`
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
  getReviewedProblemFamily,
  getReviewedBlueprint,
  migrateTemplateFile,
  runMigration
}
