#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { globSync } from 'glob'

const root = process.cwd()
const allowlistPath = path.join(root, 'tools', 'readme-version-pins-allowlist.json')

let allowlist = new Set()
if (existsSync(allowlistPath)) {
  try {
    const parsed = JSON.parse(readFileSync(allowlistPath, 'utf8'))
    if (Array.isArray(parsed)) {
      allowlist = new Set(parsed)
    }
  } catch (error) {
    console.error(`Failed to parse allowlist: ${allowlistPath}`)
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

const readmeFiles = globSync('packages/*/README.md', { cwd: root, nodir: true })
const pinnedRegex = /@tachui\/[a-z0-9-]+@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/g
const violations = []

for (const relativeFile of readmeFiles) {
  if (allowlist.has(relativeFile)) continue
  const content = readFileSync(path.join(root, relativeFile), 'utf8')
  for (const match of content.matchAll(pinnedRegex)) {
    violations.push({ file: relativeFile, match: match[0] })
  }
}

if (violations.length > 0) {
  console.error('Pinned package versions are disallowed in package READMEs unless allowlisted.')
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.match}`)
  }
  process.exit(1)
}
