import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import path from 'node:path'
import { CLITester, createCLITestEnvironment, fsTestUtils } from '../utils/cli-tester'

const SAMPLE_INPUT = `import { Text } from '@tachui/primitives'

export function ExampleView() {
  return Text('Hello')
    .modifier.padding(16)
    .modifier.backgroundColor('#222')
}

export function optionalChain(maybeComponent: any) {
  return maybeComponent?.modifier?.padding(12)
}
`

describe('TachUI CLI - migrate remove-modifier-trigger', () => {
  let cliTester: CLITester
  let tempDir: string

  beforeEach(async () => {
    cliTester = await createCLITestEnvironment()
    tempDir = await cliTester.createTempDir()
  })

  afterEach(async () => {
    await cliTester.cleanup()
  })

  it('rewrites legacy modifier chains in place', async () => {
    const filePath = path.join(tempDir, 'src/view.ts')
    await fsTestUtils.createTestFile(filePath, SAMPLE_INPUT)

    const result = await cliTester.expectSuccess('migrate remove-modifier-trigger', {
      cwd: tempDir,
    })

    const updated = await fsTestUtils.readTestFile(filePath)

    expect(updated).not.toContain('.modifier.')
    expect(updated).toContain(".padding(16)")
    expect(updated).toContain(".backgroundColor('#222')")
    expect(updated).toContain('maybeComponent?.padding(12)')
    expect(result.stdout).toContain('Updated 1 file')
  })

  it('supports dry-run mode without touching files', async () => {
    const filePath = path.join(tempDir, 'src/dry-run.ts')
    await fsTestUtils.createTestFile(filePath, SAMPLE_INPUT)

    const result = await cliTester.expectSuccess('migrate remove-modifier-trigger', {
      args: ['--dry-run'],
      cwd: tempDir,
    })

    const after = await fsTestUtils.readTestFile(filePath)
    expect(after).toBe(SAMPLE_INPUT)
    expect(result.stdout).toContain('Dry run')
    expect(result.stdout).toContain('would be updated')
  })
})
