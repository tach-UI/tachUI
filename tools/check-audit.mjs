#!/usr/bin/env node
/**
 * Guard: fail when `bun audit` reports a high or critical advisory.
 *
 * `npm audit` cannot read bun.lock (it stops with ENOLOCK), so this gate runs
 * `bun audit` instead. Severity comes from `bun audit --json`; that output
 * carries no dependency paths, so the paths come from the text report.
 *
 * One carve-out: advisories reached only through jsdom are exempt. jsdom is a
 * test-environment dependency whose vulnerable transitive copies are tracked
 * separately. An advisory is exempt only when every path the report lists for
 * it runs through jsdom; a package with no parseable paths is never exempt.
 */
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const BLOCKING_SEVERITIES = new Set(['high', 'critical'])
const EXEMPT_VIA = 'jsdom'
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g
const GROUP_HEADER = /^(\S+)\s{2,}\S/
const SEVERITY_LINE = /^\s+(info|low|moderate|high|critical):/

/**
 * Map each package in the `bun audit` text report to the dependency paths
 * listed under it (e.g. "workspace:@tachui/core › jsdom").
 */
export function parseAuditPaths(reportText) {
  const pathsByPackage = new Map()
  let currentPaths = null

  for (const rawLine of reportText.replace(ANSI_PATTERN, '').split('\n')) {
    const header = rawLine.match(GROUP_HEADER)
    if (header) {
      currentPaths = []
      pathsByPackage.set(header[1], currentPaths)
      continue
    }
    if (!rawLine.trim()) {
      currentPaths = null
      continue
    }
    if (currentPaths && /^\s/.test(rawLine) && !SEVERITY_LINE.test(rawLine)) {
      currentPaths.push(rawLine.trim())
    }
  }

  return pathsByPackage
}

function runsThroughExemptPackage(path) {
  return path
    .split('›')
    .slice(1)
    .some(segment => segment.trim() === EXEMPT_VIA)
}

/**
 * Return the high/critical advisories that are not exempt, given the parsed
 * `bun audit --json` object and the paths from `parseAuditPaths`.
 */
export function findBlockingAdvisories(advisoriesByPackage, pathsByPackage) {
  const blocking = []

  for (const [packageName, advisories] of Object.entries(advisoriesByPackage)) {
    const paths = pathsByPackage.get(packageName) ?? []
    const exempt = paths.length > 0 && paths.every(runsThroughExemptPackage)

    for (const advisory of advisories) {
      if (!BLOCKING_SEVERITIES.has(advisory.severity) || exempt) continue
      blocking.push({ packageName, advisory, paths })
    }
  }

  return blocking
}

function runBunAudit(extraArgs) {
  const result = spawnSync('bun', ['audit', ...extraArgs], {
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.error) {
    throw result.error
  }
  // `bun audit` exits nonzero whenever it finds any advisory, so the exit
  // status alone says nothing about severity; the output decides.
  return result.stdout
}

function main() {
  let advisoriesByPackage
  const jsonOutput = runBunAudit(['--json'])
  try {
    advisoriesByPackage = JSON.parse(jsonOutput)
  } catch (error) {
    console.error(`✗ Could not parse \`bun audit --json\` output (${error.message}):`)
    console.error(jsonOutput)
    process.exit(1)
  }

  const pathsByPackage = parseAuditPaths(runBunAudit([]))
  const blocking = findBlockingAdvisories(advisoriesByPackage, pathsByPackage)

  if (blocking.length > 0) {
    console.error('✗ Dependency audit found high or critical advisories:')
    for (const { packageName, advisory, paths } of blocking) {
      console.error(`  - ${packageName} ${advisory.vulnerable_versions}: ${advisory.severity}: ${advisory.title} - ${advisory.url}`)
      for (const path of paths.length > 0 ? paths : ['(no dependency path reported)']) {
        console.error(`      ${path}`)
      }
    }
    process.exit(1)
  }

  const total = Object.values(advisoriesByPackage).flat().length
  console.log(`✓ Dependency audit passed (${total} advisories, none high or critical outside ${EXEMPT_VIA})`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
