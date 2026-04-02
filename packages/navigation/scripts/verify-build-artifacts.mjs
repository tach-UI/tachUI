import { constants as fsConstants } from 'node:fs'
import { access } from 'node:fs/promises'
import { resolve } from 'node:path'

const requiredArtifacts = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/modifiers.js',
  'dist/modifiers.d.ts',
  'dist/modifiers-register.js',
  'dist/modifiers-register.d.ts',
  'dist/sheet.js',
  'dist/sheet.d.ts',
  'dist/stack.js',
  'dist/stack.d.ts',
  'dist/link.js',
  'dist/link.d.ts',
  'dist/tabs.js',
  'dist/tabs.d.ts',
  'dist/path.js',
  'dist/path.d.ts',
  'dist/environment.js',
  'dist/environment.d.ts',
  'dist/types.js',
  'dist/types.d.ts',
]

async function assertArtifactExists(relativePath) {
  const artifactPath = resolve(process.cwd(), relativePath)
  try {
    await access(artifactPath, fsConstants.F_OK)
  } catch {
    throw new Error(`[navigation build] missing required artifact: ${relativePath}`)
  }
}

await Promise.all(requiredArtifacts.map(assertArtifactExists))
