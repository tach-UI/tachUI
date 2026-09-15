#!/usr/bin/env node
/**
 * Keeps `packages/cli/__tests__/templates/starter-apps.test.ts` in step with the
 * starter templates it renders.
 *
 * The test has to run the template bodies, and a test module cannot import a
 * `.ts.template`. So the bodies are copied in — and a copy that drifts is a test
 * proving something nobody ships. This regenerates the copy (`--write`) or fails
 * if it is stale.
 *
 * Why the test exists at all: `release:smoke` builds a generated project with
 * Vite, which strips types without checking them and never executes `App()`.
 * Both templates shipped in 0.11.0 importing `Text` and `Layout.VStack` from
 * `@tachui/core`, where neither exists, and every scaffolded app threw on first
 * render with the smoke test green.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TEST_PATH = join(ROOT, 'packages/cli/__tests__/templates/starter-apps.test.ts')

/**
 * Lines `main.ts.template` must keep. The render test mounts `App()` directly,
 * so nothing executes the scaffold's own entry — drop the modifier preload
 * there and every test still passes while a scaffolded app renders unstyled.
 */
const MAIN_REQUIRED = [
  "import { mountRoot } from '@tachui/core'",
  "import '@tachui/modifiers/preload/basic'",
  'mountRoot(() => App())',
]

const TEMPLATES = [
  { id: 'basic', fn: 'BasicApp', path: 'packages/cli/templates/basic/src/App.ts.template' },
  { id: 'advanced', fn: 'AdvancedApp', path: 'packages/cli/templates/advanced/src/App.ts.template' },
]

/** The template body with its imports removed and `App` renamed. */
function bodyOf({ fn, path }) {
  const source = readFileSync(join(ROOT, path), 'utf8')
  return source
    .split('\n')
    .filter((line) => !line.startsWith('import '))
    .join('\n')
    .trim()
    .replace('export function App()', `export function ${fn}()`)
}

const GENERATED = `/**
 * The scaffolded starter apps have to *render*, not merely compile.
 *
 * \`release:smoke\` type-checks and builds a generated project, which catches an
 * import that does not resolve — but neither step executes \`App()\`. These are
 * the template bodies, copied verbatim apart from the function name, mounted
 * for real. \`tools/check-template-apps.mjs\` keeps the copies in step with the
 * templates; run it with \`--write\` after changing either one.
 *
 * GENERATED SECTION BELOW — edit the templates, not this file.
 */

import { describe, expect, it } from 'vitest'
import { flushSync, mount } from '@tachui/core'
import { State } from '@tachui/core/state'
import { Button, HStack, Text, VStack } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'

${TEMPLATES.map((t) => `// --- ${t.path} ---\n${bodyOf(t)}`).join('\n\n')}

const render = (build: () => any, id: string): HTMLElement => {
  const host = document.createElement('div')
  host.id = id
  document.body.appendChild(host)
  mount(build, \`#\${id}\`)
  return host
}

describe('scaffolded starter apps', () => {
  it('renders the basic template', () => {
    const host = render(() => BasicApp(), 'basic-host')

    expect(host.textContent).toContain('Welcome to TachUI')
    expect(host.textContent).toContain('Your starter app is ready.')
    expect(host.textContent).toContain('Get Started')
  })

  it('renders the advanced template and its counter responds', () => {
    const host = render(() => AdvancedApp(), 'advanced-host')

    expect(host.textContent).toContain('TachUI Advanced Starter')
    expect(host.textContent).toContain('Counter: 0')

    const increment = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '+'
    )
    expect(increment).toBeDefined()

    increment!.click()
    flushSync()

    expect(host.textContent).toContain('Counter: 1')
  })
})
`

const mainProblems = []
for (const { id } of TEMPLATES) {
  const mainPath = join(ROOT, `packages/cli/templates/${id}/src/main.ts.template`)
  // Compared line by line with comments stripped: a substring match passes a
  // commented-out preload, which is exactly the edit that would leave every
  // test green and every scaffolded app unstyled.
  const active = readFileSync(mainPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//') && !line.startsWith('*'))
  for (const line of MAIN_REQUIRED) {
    if (!active.includes(line)) {
      mainProblems.push(`templates/${id}/src/main.ts.template no longer contains: ${line}`)
    }
  }
}
if (mainProblems.length) {
  console.error('Starter entry points have lost something nothing executes:\n')
  for (const p of mainProblems) console.error(`  ${p}`)
  process.exit(1)
}

if (process.argv.includes('--write')) {
  writeFileSync(TEST_PATH, GENERATED)
  console.log('Regenerated starter-apps.test.ts from the templates.')
  process.exit(0)
}

const current = readFileSync(TEST_PATH, 'utf8')
if (current !== GENERATED) {
  console.error(
    'starter-apps.test.ts is out of step with the starter templates.\n' +
      'Run `node tools/check-template-apps.mjs --write` and commit the result.'
  )
  process.exit(1)
}
console.log('Starter template render tests are in step with the templates.')
