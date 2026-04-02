import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('navigation package subpath export contract', () => {
  it('declares the expected granular subpath exports', () => {
    const packageJsonPath = resolve(import.meta.dirname, '../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      exports?: Record<string, unknown>
    }

    const exportKeys = Object.keys(packageJson.exports ?? {})

    expect(exportKeys).toContain('./modifiers')
    expect(exportKeys).toContain('./modifiers/register')
    expect(exportKeys).toContain('./sheet')
    expect(exportKeys).toContain('./stack')
    expect(exportKeys).toContain('./link')
    expect(exportKeys).toContain('./tabs')
    expect(exportKeys).toContain('./path')
    expect(exportKeys).toContain('./environment')
    expect(exportKeys).toContain('./types')
  })
})
