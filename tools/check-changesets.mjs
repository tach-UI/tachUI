#!/usr/bin/env node
import { execSync } from 'node:child_process'

function run(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function getChangedFiles(baseRef) {
  const mergeBase = run(`git merge-base HEAD ${baseRef}`)
  const output = run(`git diff --name-only ${mergeBase}...HEAD`)
  return output ? output.split('\n').filter(Boolean) : []
}

function isPublishablePath(path) {
  if (!path.startsWith('packages/')) return false
  const segments = path.split('/')
  if (segments.length < 3) return false
  const packageName = segments[1]
  return packageName !== '' && packageName !== 'docs'
}

function isChangesetFile(path) {
  return path.startsWith('.changeset/') && path.endsWith('.md')
}

const isPullRequest = process.env.GITHUB_EVENT_NAME === 'pull_request'
if (!isPullRequest) {
  process.exit(0)
}

const baseBranch = process.env.GITHUB_BASE_REF || 'main'
const baseRef = `origin/${baseBranch}`

let changedFiles
try {
  changedFiles = getChangedFiles(baseRef)
} catch (error) {
  console.error(`Failed to compute changed files against ${baseRef}`)
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const touchesPublishable = changedFiles.some(isPublishablePath)
if (!touchesPublishable) {
  process.exit(0)
}

const hasChangeset = changedFiles.some(isChangesetFile)
if (!hasChangeset) {
  console.error('Publishable package changes detected without a changeset.')
  console.error('Add a changeset with `pnpm changeset` or an explicit no-release empty changeset with `pnpm changeset --empty`.')
  process.exit(1)
}

