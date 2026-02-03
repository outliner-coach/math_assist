import fs from 'fs'
import path from 'path'
import UnitClient from './UnitClient'

export function generateStaticParams() {
  const filePath = path.join(process.cwd(), 'public/data/units.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return data.map((unit: { id: string }) => ({ unitId: unit.id }))
}

export default function UnitPage() {
  return <UnitClient />
}
