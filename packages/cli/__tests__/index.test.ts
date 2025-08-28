/**
 * Main CLI Entry Point Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CLITester, createCLITestEnvironment } from './utils/cli-tester'

describe('TachUI CLI - Main Entry Point', () => {
  let cliTester: CLITester

  beforeEach(async () => {
    cliTester = await createCLITestEnvironment()
  })

  afterEach(async () => {
    await cliTester.cleanup()
  })

  describe('Basic CLI Functionality', () => {
    it('should display help when --help flag is used', async () => {
      const helpOutput = await cliTester.testHelpCommand()
      
      expect(helpOutput).toContain('Usage:')
      expect(helpOutput).toContain('Commands:')
      expect(helpOutput).toContain('init')
      expect(helpOutput).toContain('dev')
      expect(helpOutput).toContain('generate')
      expect(helpOutput).toContain('analyze')
      expect(helpOutput).toContain('migrate')
      expect(helpOutput).toContain('optimize')
    })

    it('should display version when --version flag is used', async () => {
      const version = await cliTester.testVersionCommand()
      
      // Should contain semantic version (may include banner)
      expect(version).toContain('0.1.0')
      expect(version).toMatch(/\d+\.\d+\.\d+/)
    })

    it('should show help for unknown commands', async () => {
      const result = await cliTester.expectFailure('unknown-command')
      
      expect(result.stderr).toContain('unknown command')
      expect(result.exitCode).toBe(1)
    })
  })

  describe('CLI Banner and Branding', () => {
    it('should display TachUI branding', async () => {
      const result = await cliTester.run('--help')
      
      // Should contain TachUI branding
      expect(result.stdout).toMatch(/TachUI|Tacho/)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid arguments gracefully', async () => {
      const result = await cliTester.expectFailure('init --invalid-flag')
      
      expect(result.exitCode).toBe(1)
      expect(result.stderr.length).toBeGreaterThan(0)
    })

    it('should provide helpful error messages', async () => {
      const result = await cliTester.expectFailure('nonexistent')
      
      expect(result.stderr).toContain('unknown command')
      // Should suggest similar commands or show help
      expect(result.stderr.toLowerCase()).toMatch(/help|available|command/)
    })
  })

  describe('Command Registration', () => {
    it('should register all expected commands', async () => {
      const helpOutput = await cliTester.testHelpCommand()
      
      const expectedCommands = [
        'init',
        'dev', 
        'generate',
        'analyze',
        'migrate',
        'optimize'
      ]

      expectedCommands.forEach(command => {
        expect(helpOutput).toContain(command)
      })
    })

    it('should provide command descriptions', async () => {
      const helpOutput = await cliTester.testHelpCommand()
      
      // Each command should have a description
      expect(helpOutput).toMatch(/init.*Initialize/i)
      expect(helpOutput).toMatch(/dev.*development/i)
      expect(helpOutput).toMatch(/generate.*Generate/i)
    })
  })

  describe('Global Options', () => {
    it('should handle unknown global flags gracefully', async () => {
      const result = await cliTester.expectFailure('--unknown-flag')
      
      // Should fail with unknown option error
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('unknown')
    })

    it.skip('should support help flag', async () => {
      // TODO: Help should always work without banner interference
      const result = await cliTester.run('--help')
      
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage')
    })
  })

  describe('Environment Detection', () => {
    it.skip('should work in different node environments', async () => {
      // TODO: Test with different NODE_ENV values - help should always work
      const result = await cliTester.run('--help', {
        env: { NODE_ENV: 'test' }
      })
      
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage')
    })

    it.skip('should show version regardless of directory context', async () => {
      // TODO: Test version command works in any directory without banner
      const result = await cliTester.run('--version')
      
      // Should show CLI version
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/)
    })
  })
})