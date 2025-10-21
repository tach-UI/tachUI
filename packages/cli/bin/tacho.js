#!/usr/bin/env node

const moduleCandidates = [
  '../dist/index.js',
  '../dist/cli/src/index.js',
]

async function start() {
  for (const candidate of moduleCandidates) {
    try {
      const { main } = await import(candidate)
      await main()
      return
    } catch (error) {
      if (error && error.code !== 'ERR_MODULE_NOT_FOUND') {
        console.error('Failed to start Tacho CLI:', error)
        process.exit(1)
      }
    }
  }

  console.error(
    'Failed to start Tacho CLI: build artifacts not found. Run "pnpm --filter @tachui/cli build" first.'
  )
  process.exit(1)
}

start()
