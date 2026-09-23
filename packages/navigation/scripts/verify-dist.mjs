#!/usr/bin/env node
/**
 * Checks the built package for what workspace tests cannot see: they resolve
 * every `@tachui/*` import to source through aliases, so there is only ever
 * one registry and one builder, whatever the bundler would have done.
 *
 * - No chunk may carry a copy of the modifier registry. A bundled copy of
 *   `@tachui/modifiers/preload/basic` registers the basic modifiers into a
 *   registry the app's builder never reads, and navigation's own `.padding()`
 *   chains then throw "not found in registry".
 * - The basic-modifier preload must stay an external import.
 * - The builder must come from `@tachui/core/modifiers`, external, so the
 *   navigation methods are installed on the app's builder, not a private one.
 * - The navigation methods (`.navigationTitle()` and the rest) must be in the
 *   build, and the `modifiers/register` entry must load them. They used to be
 *   a module side effect that the build dropped.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '../dist')

if (!existsSync(dist)) {
  console.error(
    '@tachui/navigation dist check: no build to check. Run ' +
      '`bun run --filter @tachui/navigation build` first.'
  )
  process.exit(1)
}

const chunks = readdirSync(dist)
  .filter(file => file.endsWith('.js'))
  .map(file => ({ file, source: readFileSync(path.join(dist, file), 'utf8') }))

const failures = []

for (const { file, source } of chunks) {
  if (source.includes('ModifierRegistry instance created')) {
    failures.push(`${file} bundles its own modifier registry`)
  }
}

if (!chunks.some(({ source }) => source.includes('import "@tachui/modifiers/preload/basic"'))) {
  failures.push('no chunk imports @tachui/modifiers/preload/basic externally')
}

const install = chunks.find(({ source }) =>
  source.includes('navigationBarTitleDisplayMode = function')
)
if (!install) {
  failures.push('the navigation builder methods are missing from the build')
} else {
  if (!install.source.includes('from "@tachui/core/modifiers"')) {
    failures.push(`${install.file} does not take the builder from @tachui/core/modifiers`)
  }
  const register = chunks.find(({ file }) => file === 'modifiers-register.js')
  if (!register?.source.includes(`"./${install.file}"`)) {
    failures.push(`modifiers-register.js does not load ${install.file}`)
  }
}

if (failures.length > 0) {
  console.error('@tachui/navigation dist check failed:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('@tachui/navigation dist check passed')
