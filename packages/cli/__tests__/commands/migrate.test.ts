/**
 * Migrate Command Tests
 *
 * Tests for migration command which converts React/Vue code to TachUI
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CLITester, createCLITestEnvironment, fsTestUtils } from '../utils/cli-tester'
import { reactComponentSamples, vueComponentSamples } from '../fixtures/sample-project'
import path from 'path'

describe('TachUI CLI - Migrate Command', () => {
  let cliTester: CLITester
  let tempDir: string

  beforeEach(async () => {
    cliTester = await createCLITestEnvironment()
    tempDir = await cliTester.createTempDir()
  })

  afterEach(async () => {
    await cliTester.cleanup()
  })

  describe('React Migration', () => {
    it.skip('should migrate React components', async () => {
      // Create React component
      await fsTestUtils.createTestFile(
        path.join(tempDir, 'Counter.jsx'),
        reactComponentSamples['Counter.jsx']
      )

      const result = await cliTester.expectSuccess('migrate', {
        args: ['--from', 'react', '--yes'],
        cwd: tempDir
      })

      expect(result.stdout).toContain('migrated')
      expect(result.stdout).toContain('Counter')

      // Check migrated file exists
      const migratedPath = path.join(tempDir, 'Counter.ts')
      expect(await fsTestUtils.fileExists(migratedPath)).toBe(true)

      const content = await fsTestUtils.readTestFile(migratedPath)
      expect(content).toContain('State')
      expect(content).toContain('Button')
      expect(content).toContain('@tachui/core')
    })
  })

  describe('Vue Migration', () => {
    it.skip('should migrate Vue components', async () => {
      await fsTestUtils.createTestFile(
        path.join(tempDir, 'Counter.vue'),
        vueComponentSamples['Counter.vue']
      )

      const result = await cliTester.expectSuccess('migrate', {
        args: ['--from', 'vue', '--yes'],
        cwd: tempDir
      })

      expect(result.stdout).toContain('migrated')

      const migratedPath = path.join(tempDir, 'Counter.ts')
      const content = await fsTestUtils.readTestFile(migratedPath)
      expect(content).toContain('State')
      expect(content).toContain('@tachui/core')
    })
  })

  describe('Migration Options', () => {
    it.skip('should generate migration report', async () => {
      await fsTestUtils.createTestFile(
        path.join(tempDir, 'test.jsx'),
        reactComponentSamples['Counter.jsx']
      )

      const result = await cliTester.expectSuccess('migrate', {
        args: ['--report', '--yes'],
        cwd: tempDir
      })

      expect(result.stdout).toContain('Migration Report')
      expect(result.stdout).toContain('files processed')
    })

    it.skip('should create backups', async () => {
      await fsTestUtils.createTestFile(
        path.join(tempDir, 'test.jsx'),
        reactComponentSamples['Counter.jsx']
      )

      await cliTester.expectSuccess('migrate', {
        args: ['--backup', '--yes'],
        cwd: tempDir
      })

      expect(await fsTestUtils.fileExists(
        path.join(tempDir, 'test.jsx.backup')
      )).toBe(true)
    })
  })
})
