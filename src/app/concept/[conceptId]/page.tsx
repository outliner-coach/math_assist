import fs from 'fs'
import path from 'path'
import ConceptClient from './ConceptClient'

export function generateStaticParams() {
  const filePath = path.join(process.cwd(), 'public/data/concepts.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return data.map((concept: { id: string }) => ({ conceptId: concept.id }))
}

export default function ConceptPage() {
  return <ConceptClient />
}
