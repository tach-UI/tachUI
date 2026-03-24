import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function isPackageRoot(path: string): boolean {
  const packageJsonPath = resolve(path, 'package.json')
  if (!existsSync(packageJsonPath) || !existsSync(resolve(path, 'templates'))) {
    return false
  }

  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: unknown }
    return parsed.name === '@tachui/cli'
  } catch {
    return false
  }
}

export function resolvePackageRoot(moduleUrl: string): string {
  const modulePath = fileURLToPath(moduleUrl)
  const startDir = dirname(modulePath)

  const candidates = [
    resolve(startDir, '..'),
    resolve(startDir, '../..'),
    resolve(startDir, '../../..'),
    resolve(startDir, '../../../..'),
    resolve(startDir, '../../../../..'),
  ]

  for (const candidate of candidates) {
    if (isPackageRoot(candidate)) {
      return candidate
    }
  }

  throw new Error('Unable to resolve @tachui/cli package root for template loading')
}
