#!/usr/bin/env node

const moduleCandidates = [
  new URL('../dist/index.js', import.meta.url).href,
  new URL('../dist/cli/src/index.js', import.meta.url).href,
]

const isMissingModule = (error, candidate) => {
  if (!error) return false
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    return true
  }
  return (
    typeof error.message === 'string' &&
    error.message.includes(candidate)
  )
}

async function start() {
  for (const candidate of moduleCandidates) {
    try {
      const { main } = await import(candidate)
      if (typeof main === 'function') {
        await main()
        return
      }
    } catch (error) {
      if (!isMissingModule(error, candidate)) {
        console.error('Failed to start Tacho CLI:', error)
        process.exit(1)
      }
    }
  }

  await startFromSource()
}

async function startFromSource() {
  try {
    // Register TSX loader so we can import TypeScript sources without building
    await import('tsx/esm')
    const { main } = await import(
      new URL('../src/index.ts', import.meta.url).href
    )

    if (typeof main !== 'function') {
      throw new Error('CLI entry did not export a main() function')
    }

    await main()
  } catch (error) {
    console.error(
      'Failed to start Tacho CLI. Build artifacts missing and TSX loader unavailable.',
      error
    )
    process.exit(1)
  }
}

start()
