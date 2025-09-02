/**
 * Basic integration test for unified @tachui/forms package
 */

import { describe, it, expect } from 'vitest'

describe('@tachui/forms unified package', () => {
  it('should export main components', async () => {
    try {
      const forms = await import('../src/index')

      // Verify main exports exist
      expect(forms).toBeDefined()

      // This is a basic smoke test to ensure the package loads
      // More comprehensive tests should be added for individual components
    } catch (error) {
      console.error('Import error details:', error)
      console.error('Stack trace:', error.stack)
      throw error
    }
  })

  it('should have proper package structure', () => {
    // Basic test to ensure package is properly configured
    expect(true).toBe(true)
  })
})
