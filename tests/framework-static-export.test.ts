import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { generateStaticParams as generateConceptParams } from '../src/app/concept/[conceptId]/page'
import { generateStaticParams as generatePracticeParams } from '../src/app/practice/[conceptId]/page'
import { generateStaticParams as generateUnitParams } from '../src/app/unit/[unitId]/page'

const require = createRequire(import.meta.url)
const projectRoot = path.resolve(__dirname, '..')
const appRoot = path.join(projectRoot, 'src/app')
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
)
const nextConfig = require(path.join(projectRoot, 'next.config.js'))

describe('Next.js 16 static export contract', () => {
  it('pins the Node 24 and Next.js 16 framework stack', () => {
    expect(packageJson.engines).toEqual({ node: '24.x' })
    expect(packageJson.scripts.lint).toBe('eslint .')
    expect(packageJson.dependencies).toMatchObject({
      '@sentry/browser': '10.69.0',
      next: '16.2.12',
      react: '19.2.8',
      'react-dom': '19.2.8',
    })
    expect(packageJson.devDependencies).toMatchObject({
      '@axe-core/playwright': '4.12.1',
      '@types/node': '24.13.3',
      '@types/react': '19.2.18',
      '@types/react-dom': '19.2.4',
      eslint: '9.39.5',
      'eslint-config-next': '16.2.12',
      typescript: '5.9.3',
    })
  })

  it('keeps the GitHub Pages export settings', () => {
    expect(nextConfig).toMatchObject({
      output: 'export',
      basePath: '/math_assist',
      assetPrefix: '/math_assist/',
      trailingSlash: true,
      allowedDevOrigins: ['127.0.0.1'],
      images: { unoptimized: true },
      env: { NEXT_PUBLIC_BASE_PATH: '/math_assist' },
    })
  })

  it('keeps CSS imports ahead of framework directives and style rules', () => {
    const globalCss = fs.readFileSync(path.join(appRoot, 'globals.css'), 'utf8')
    expect(globalCss.trimStart().startsWith("@import 'katex/dist/katex.min.css';")).toBe(true)
  })

  it('scopes server-side review data tracing below approved static roots', () => {
    const reviewSource = fs.readFileSync(
      path.join(projectRoot, 'src/lib/problem-review.ts'),
      'utf8',
    )
    expect(reviewSource).not.toContain('path.join(process.cwd(), ...segments)')
    expect(reviewSource).toContain(
      "path.join(process.cwd(), 'public', 'data', ...segments)",
    )
    expect(reviewSource).toContain(
      "path.join(process.cwd(), 'docs', 'tracking', fileName)",
    )
  })

  it('keeps every direct-load static page entry', () => {
    const pages = [
      'page.tsx',
      'home/page.tsx',
      ...Array.from({ length: 6 }, (_, index) => `grade/${index + 1}/page.tsx`),
      'result/page.tsx',
      'review/problems/page.tsx',
    ]

    expect(pages.every((page) => fs.existsSync(path.join(appRoot, page)))).toBe(true)
  })

  it('generates all data-backed unit, concept, and practice routes', () => {
    const concepts = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'public/data/concepts.json'), 'utf8'),
    ) as Array<{ id: string }>
    const units = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'public/data/units.json'), 'utf8'),
    ) as Array<{ id: string }>

    const conceptParams = concepts.map(({ id }) => ({ conceptId: id }))
    expect(generateConceptParams()).toEqual(conceptParams)
    expect(generatePracticeParams()).toEqual(conceptParams)
    expect(generateUnitParams()).toEqual(units.map(({ id }) => ({ unitId: id })))
  })
})
