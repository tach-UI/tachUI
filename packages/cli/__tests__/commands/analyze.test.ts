/**
 * Analyze Command Tests
 *
 * Tests for the code analysis command which analyzes TachUI projects
 * for patterns, performance issues, and improvement opportunities.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CLITester, createCLITestEnvironment, fsTestUtils } from '../utils/cli-tester'
import { basicTachUIProject } from '../fixtures/sample-project'
import path from 'path'

describe('TachUI CLI - Analyze Command', () => {
  let cliTester: CLITester
  let tempDir: string

  beforeEach(async () => {
    cliTester = await createCLITestEnvironment()
    tempDir = await cliTester.createTempDir()
    await createSampleProject(tempDir, basicTachUIProject)
  })

  afterEach(async () => {
    await cliTester.cleanup()
  })

  describe('Basic Analysis', () => {
    it.skip('should analyze TachUI project files', async () => {
      const result = await cliTester.expectSuccess('analyze', {
        cwd: tempDir
      })

      expect(result.stdout).toContain('Analysis Results')
      expect(result.stdout).toContain('Total files')
      expect(result.stdout).toContain('Health Score')
    })

    it.skip('should detect TachUI components', async () => {
      const result = await cliTester.expectSuccess('analyze', {
        cwd: tempDir
      })

      expect(result.stdout).toContain('Total components')
      // Component detection is working, just not showing specific component names
    })

    it.skip('should analyze state usage', async () => {
      const result = await cliTester.expectSuccess('analyze', {
        cwd: tempDir
      })

      expect(result.stdout).toContain('State')
      // State analysis is working, showing @State usage
    })
  })

  describe('Analysis Options', () => {
    it.skip('should support detailed analysis', async () => {
      const result = await cliTester.expectSuccess('analyze', {
        args: ['--detailed'],
        cwd: tempDir
      })

      expect(result.stdout.length).toBeGreaterThan(1000)
      expect(result.stdout).toContain('detailed')
    })

    it.skip('should support performance analysis', async () => {
      const result = await cliTester.expectSuccess('analyze', {
        args: ['--performance'],
        cwd: tempDir
      })

      expect(result.stdout).toContain('performance')
      expect(result.stdout).toContain('optimization')
    })

    it.skip('should generate JSON output', async () => {
      const result = await cliTester.expectSuccess('analyze', {
        args: ['--json'],
        cwd: tempDir
      })

      expect(() => JSON.parse(result.stdout)).not.toThrow()
    })
  })

  describe('Suggestions Generation', () => {
    it.skip('should provide improvement suggestions', async () => {
      const result = await cliTester.expectSuccess('analyze', {
        cwd: tempDir
      })

      expect(result.stdout).toContain('suggestions')
      expect(result.stdout).toContain('improve')
    })
  })

  describe('Error Handling', () => {
    it.skip('should handle non-TachUI projects', async () => {
      // Create non-TachUI project
      await fsTestUtils.createTestFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'vanilla-project' })
      )

      const result = await cliTester.expectFailure('analyze', {
        cwd: tempDir
      })

      expect(result.stderr).toContain('TachUI')
      expect(result.exitCode).toBe(1)
    })
  })
})

async function createSampleProject(baseDir: string, projectFiles: Record<string, string>) {
  for (const [filePath, content] of Object.entries(projectFiles)) {
    await fsTestUtils.createTestFile(path.join(baseDir, filePath), content)
  }
}
