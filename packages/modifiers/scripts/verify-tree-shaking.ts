import { build } from 'esbuild'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

async function verify() {
  const result = await build({
    entryPoints: [path.resolve(__dirname, '../__tests__/fixtures/tree-shake-basic.ts')],
    bundle: true,
    format: 'esm',
    treeShaking: true,
    minify: true,
    write: false,
    logLevel: 'silent',
  })

  const output = result.outputFiles?.[0]?.text ?? ''

  if (output.includes('Glassmorphism') || output.includes('DropShadow')) {
    console.error('❌ Tree-shaking failed: effects code detected in basic preload bundle')
    process.exit(1)
  }

  console.log('✅ Tree-shaking verification passed (no effects code in basic preload)')
}

verify()
