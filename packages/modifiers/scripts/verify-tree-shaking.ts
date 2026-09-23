import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Core lists the effect modifier names, to say which import registers one
// that is called before it is registered. Any bundle that includes core
// therefore contains those names whether or not the effects code survived, so
// a fixture that pulls in core (basic, or both) is checked for a string only
// the effects implementation emits: `backdrop-filter`, from the backdrop
// factory, `drop-shadow`, from the filter and shadow factories, and
// `translate3d(`, from the transform factories. Each is shaken out with its
// factory when nothing registers it.
const EFFECTS_ONLY = ['backdrop-filter', 'drop-shadow', 'translate3d(']

// The basic registration, as a string nothing else emits: the first tuple of
// its registration list. `padding` alone, or the '@tachui/modifiers' plugin
// name, also appear in core, so they survive without it.
const BASIC_REGISTRATION = '["padding"'

// Core's list of effect names carries the effects import path. The fixtures
// for one group of effects check a registered name that is also in that list,
// which only means something while the list is not in their bundle, so they
// also check that it is not.
const CORE_EFFECT_LIST = 'preload/effects'

const preloadChecks: Array<{
  fixture: string
  registryKeys: string[]
  absent?: string[]
}> = [
  { fixture: 'tree-shake-effects.ts', registryKeys: EFFECTS_ONLY },
  { fixture: 'tree-shake-filters.ts', registryKeys: ['blur'], absent: [CORE_EFFECT_LIST] },
  { fixture: 'tree-shake-shadows.ts', registryKeys: ['shadow'], absent: [CORE_EFFECT_LIST] },
  {
    fixture: 'tree-shake-transforms.ts',
    registryKeys: ['transformStyle'],
    absent: [CORE_EFFECT_LIST],
  },
  {
    fixture: 'tree-shake-backdrop.ts',
    registryKeys: ['backdropFilter'],
    absent: [CORE_EFFECT_LIST],
  },
  { fixture: 'tree-shake-both.ts', registryKeys: [BASIC_REGISTRATION, ...EFFECTS_ONLY] },
]

async function buildFixtureOutput(fixture: string): Promise<string> {
  const result = await build({
    entryPoints: [path.resolve(__dirname, `../__tests__/fixtures/${fixture}`)],
    bundle: true,
    format: 'iife',
    treeShaking: true,
    minify: true,
    write: false,
    logLevel: 'silent',
  })

  const output = result.outputFiles?.[0]?.text ?? ''
  if (!output) throw new Error(`Empty bundle output for fixture ${fixture}`)
  return output
}

// The preload entries register on import, so each is detected by a string
// that survives only with its registration: the basic list's first tuple (see
// BASIC_REGISTRATION), and what the effect factories emit (see EFFECTS_ONLY).
// Bundling the DIST (not src) is the point: #260 was invisible to every other
// fixture here because src/preload/*.ts is covered by the package's
// sideEffects globs while the hashed dist chunks the build emits are not.
const distChecks: Array<{ fixture: string; sentinel: string; label: string }> = [
  {
    fixture: 'tree-shake-dist-basic.ts',
    sentinel: BASIC_REGISTRATION,
    label: 'basic modifier registration',
  },
  {
    fixture: 'tree-shake-dist-effects.ts',
    sentinel: 'backdrop-filter',
    label: 'effect modifier registration',
  },
]

async function verify() {
  const output = await buildFixtureOutput('tree-shake-basic.ts')

  if (EFFECTS_ONLY.some(sentinel => output.includes(sentinel))) {
    console.error('❌ Tree-shaking failed: effects code detected in basic preload bundle')
    process.exit(1)
  }

  for (const check of preloadChecks) {
    const bundledOutput = await buildFixtureOutput(check.fixture)
    for (const registryKey of check.registryKeys) {
      if (!bundledOutput.includes(registryKey)) {
        console.error(
          `❌ Tree-shaking failed: expected "${registryKey}" in ${check.fixture} bundle`
        )
        process.exit(1)
      }
    }
    for (const absent of check.absent ?? []) {
      if (bundledOutput.includes(absent)) {
        console.error(
          `❌ Tree-shaking failed: "${absent}" in ${check.fixture} bundle, so ` +
            `its registered names no longer show the registration survived`
        )
        process.exit(1)
      }
    }
  }

  for (const check of distChecks) {
    const bundledOutput = await buildFixtureOutput(check.fixture)
    if (!bundledOutput.includes(check.sentinel)) {
      console.error(
        `❌ Tree-shaking failed: ${check.label} was eliminated from the built ` +
          `dist bundle (${check.fixture}). A consumer importing this preload ` +
          `would get "Modifier not found in registry" at runtime — see #260.`
      )
      process.exit(1)
    }
  }

  console.log(
    '✅ Tree-shaking verification passed (basic stays segmented; src and dist preload bundles retain their registrations)'
  )
}

verify()
