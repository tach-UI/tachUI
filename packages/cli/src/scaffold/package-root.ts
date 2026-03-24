import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function isPackageRoot(path: string): boolean {
  return existsSync(resolve(path, 'package.json')) && existsSync(resolve(path, 'templates'))
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
