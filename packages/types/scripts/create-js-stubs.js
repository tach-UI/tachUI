#!/usr/bin/env node
import { readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')

// Create stub .js files for all .d.ts files
const files = readdirSync(distDir).filter(f => f.endsWith('.d.ts'))

for (const file of files) {
  const jsFile = join(distDir, file.replace('.d.ts', '.js'))

  // modifiers.ts has ModifierPriority const that needs runtime export
  if (file === 'modifiers.d.ts') {
    writeFileSync(jsFile, `// Runtime exports for modifiers types
export const ModifierPriority = {
  LAYOUT: 100,
  APPEARANCE: 200,
  INTERACTION: 300,
  ANIMATION: 400,
  CUSTOM: 500,
}
`)
  } else if (file === 'reactive.d.ts') {
    // reactive.ts has ComputationState const that needs runtime export
    writeFileSync(jsFile, `// Runtime exports for reactive types
export const ComputationState = {
  Clean: 0,
  Check: 1,
  Dirty: 2,
  Disposed: 3,
}
`)
  } else {
    // Empty module for other type-only files
    writeFileSync(jsFile, '// Type-only module\n')
  }
}

console.log(`Created ${files.length} stub .js files`)
