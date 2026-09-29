import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../src')
const modifierDocsSource = readFileSync(
  resolve(SRC_DIR, 'commands/modifier-docs.ts'),
  'utf8',
)
const globalsSource = readFileSync(resolve(SRC_DIR, 'globals.d.ts'), 'utf8')

describe('modifier-docs command', () => {
  it('registers no conflicts subcommand', () => {
    expect(modifierDocsSource).not.toMatch(/\.command\(\s*['"]conflicts['"]/)
    for (const command of ['list', 'show', 'generate', 'validate', 'cheat-sheet']) {
      expect(modifierDocsSource, command).toMatch(
        new RegExp(`\\.command\\(\\s*['"]${command}[\\s'"<]`),
      )
    }
  })

  it('keeps no snapshot-loading or conflict-reporting code', () => {
    for (const removed of [
      'loadModifierSnapshot',
      'showModifierConflicts',
      'ModifierMetadataSnapshot',
      'modifier-metadata.snapshot.json',
    ]) {
      expect(modifierDocsSource, removed).not.toContain(removed)
    }
  })

  it('exports the remaining commands and not the conflict report', async () => {
    const module = await import('../../src/commands/modifier-docs')
    expect(Object.keys(module).sort()).toEqual([
      'generateFullDocumentation',
      'listModifiers',
      'showCheatSheet',
      'showModifierDetails',
      'validateModifierParameters',
    ])
  })

  it('declares no @tachui/core modules in its globals', () => {
    const declared = Array.from(
      globalsSource.matchAll(/declare module ['"]([^'"]+)['"]/g),
      (match) => match[1],
    )
    expect(declared).toEqual(['@tachui/devtools'])
  })
})
