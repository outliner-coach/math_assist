import fs from 'fs'
import path from 'path'
import { Suspense } from 'react'
import PracticeClient from './PracticeClient'

export function generateStaticParams() {
  const filePath = path.join(process.cwd(), 'public/data/concepts.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return data.map((concept: { id: string }) => ({ conceptId: concept.id }))
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="text-center py-12">로딩 중...</div>}>
      <PracticeClient />
    </Suspense>
  )
}
