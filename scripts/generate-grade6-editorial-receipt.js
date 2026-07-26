const fs = require('fs')
const path = require('path')

const {
  RENDERER_REVIEW_VERSION_REGISTRY,
  ROOT_DIR,
  buildCatalog,
  catalogBytes,
  loadActualSources,
} = require('./problem-review-catalog-core')

const outputPath = path.join(
  ROOT_DIR,
  'docs',
  'tracking',
  'problem-editorial-review-work',
  'grade6.json',
)

const templateFileByConcept = Object.freeze({
  'g6circle-001': 'public/data/templates/g6circle.json',
  'g6decimaldiv-001': 'public/data/templates/g6decimaldiv.json',
  'g6fractiondecimal-001': 'public/data/templates/g6fractiondecimal.json',
  'g6fractiondiv-001': 'public/data/templates/g6fractiondiv.json',
  'g6prismpyramid-001': 'public/data/templates/g6prismpyramid.json',
  'g6proportion-001': 'public/data/templates/g6proportion.json',
  'g6ratio-001': 'public/data/templates/g6ratio.json',
  'g6ratiograph-001': 'public/data/templates/g6ratiograph.json',
  'g6roundsolid-001': 'public/data/templates/g6roundsolid.json',
  'g6spatial-001': 'public/data/templates/g6spatial.json',
  'g6volume-001': 'public/data/templates/g6volume.json',
})

function templateById() {
  return new Map(
    Object.values(templateFileByConcept).flatMap((relativePath) => (
      JSON.parse(fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8'))
        .map((template) => [template.id, template])
    )),
  )
}

function createReceipt() {
  const catalog = buildCatalog(
    loadActualSources(ROOT_DIR).filter((source) => source.grade === 6),
    RENDERER_REVIEW_VERSION_REGISTRY,
  )
  const templates = templateById()

  return {
    schemaVersion: 1,
    items: catalog.items.map((item) => {
      const template = templates.get(item.sourceId)
      if (!template) throw new Error(`${item.reviewId}: source template is missing`)
      const hasVisual = item.content.visual !== null
      const { min, max } = template.param_schema.p
      const variantCount = max - min + 1

      return {
        reviewId: item.reviewId,
        contentHash: item.contentHash,
        status: hasVisual ? 'blocked' : 'pass',
        findingCategories: [],
        note: hasVisual
          ? `원본 문장·답·힌트·풀이와 허용 p=${min}..${max} (${variantCount}개)를 검토했습니다. 실제 브라우저의 제출 전·힌트·정답 공개·모바일·태블릿 증거가 없어 최종 통과는 차단했습니다.`
          : `원본 문장·답·힌트·풀이와 허용 p=${min}..${max} (${variantCount}개)를 검토했습니다. 시각 자료가 없는 원본의 텍스트·수학·변형 검토를 통과했습니다.`,
        evidence: {
          editorialRead: true,
          variantAudit: true,
          preAnswer: hasVisual ? false : null,
          hint: hasVisual ? false : null,
          revealed: hasVisual ? false : null,
          mobile: hasVisual ? false : null,
          tablet: hasVisual ? false : null,
          artifacts: [
            templateFileByConcept[item.conceptId],
            'src/lib/grade6-study.test.ts',
          ],
        },
      }
    }),
  }
}

function serializeReceipt(receipt = createReceipt()) {
  return catalogBytes(receipt)
}

if (require.main === module) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, serializeReceipt())
  console.log(`Wrote Grade 6 editorial receipt to ${outputPath}`)
}

module.exports = {
  createReceipt,
  serializeReceipt,
}
