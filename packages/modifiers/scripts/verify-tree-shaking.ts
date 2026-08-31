import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const preloadChecks: Array<{ fixture: string; registryKeys: string[] }> = [
  { fixture: 'tree-shake-effects.ts', registryKeys: ['transformStyle'] },
  { fixture: 'tree-shake-filters.ts', registryKeys: ['blur'] },
  { fixture: 'tree-shake-shadows.ts', registryKeys: ['shadow'] },
  { fixture: 'tree-shake-transforms.ts', registryKeys: ['transformStyle'] },
  { fixture: 'tree-shake-backdrop.ts', registryKeys: ['backdropFilter'] },
  { fixture: 'tree-shake-both.ts', registryKeys: ['padding', 'transformStyle'] },
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

// The preload entries register on import. `registerBasicModifiers` announces
// itself to the registry as a plugin named '@tachui/modifiers', and the
// effects registration lists modifier names directly — both are string
// literals that only survive if the registration code itself survives.
// Bundling the DIST (not src) is the point: #260 was invisible to every other
// fixture here because src/preload/*.ts is covered by the package's
// sideEffects globs while the hashed dist chunks the build emits are not.
const distChecks: Array<{ fixture: string; sentinel: string; label: string }> = [
  {
    fixture: 'tree-shake-dist-basic.ts',
    sentinel: '@tachui/modifiers',
    label: 'basic modifier registration',
  },
  {
    fixture: 'tree-shake-dist-effects.ts',
    sentinel: 'glassmorphism',
    label: 'effect modifier registration',
  },
]

async function verify() {
  const output = await buildFixtureOutput('tree-shake-basic.ts')

  if (output.includes('Glassmorphism') || output.includes('DropShadow')) {
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
