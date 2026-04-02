import { access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { resolve } from 'node:path'

const requiredArtifacts = [
  'dist/index.mjs',
  'dist/index.js',
  'dist/modifiers/index.mjs',
  'dist/modifiers/index.js',
]

async function assertArtifactExists(relativePath) {
  const artifactPath = resolve(process.cwd(), relativePath)
  try {
    await access(artifactPath, fsConstants.F_OK)
  } catch {
    throw new Error(`[responsive build] missing required artifact: ${relativePath}`)
  }
}

await Promise.all(requiredArtifacts.map(assertArtifactExists))
