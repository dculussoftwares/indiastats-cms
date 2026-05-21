import { readFileSync } from 'fs'
import { join } from 'path'
import type { StateConfig } from '@/config/states/types'

const cache = new Map<string, object>()

export function loadStateGeoJson(stateConfig: StateConfig): object | null {
  const mapPath = stateConfig.mapGeoJson.replace(/^\//, '')
  if (cache.has(mapPath)) return cache.get(mapPath)!
  try {
    const filePath = join(process.cwd(), 'public', mapPath)
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8'))
    cache.set(mapPath, parsed)
    return parsed
  } catch {
    return null
  }
}
