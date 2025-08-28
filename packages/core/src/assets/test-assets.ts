/**
 * Test file for the Assets system
 *
 * This file demonstrates the usage of the Assets system and can be used for manual testing.
 */

import { getCurrentTheme, setTheme } from '../reactive'
import { Assets, ColorAsset, ImageAsset, registerAsset } from './index'

// Register test assets
registerAsset('testPrimary', ColorAsset.init('#007AFF', '#0A84FF', 'testPrimary'))
registerAsset('testBackground', ColorAsset.init('#FFFFFF', '#1a1a1a', 'testBackground'))
registerAsset('testImage', ImageAsset.init('/logo-light.png', '/logo-dark.png', 'testImage'))

// Test functions
function testAssetAccess() {
  console.log('=== Asset Access Tests ===')

  // Test basic asset access
  console.log('Assets.testPrimary:', Assets.testPrimary)
  console.log('Assets.testPrimary.light:', Assets.testPrimary.light)
  console.log('Assets.testPrimary.dark:', Assets.testPrimary.dark)

  // Test resolution
  console.log('Current theme:', getCurrentTheme())
  console.log('Assets.testPrimary.resolve():', Assets.testPrimary.resolve())

  // Test image assets
  console.log('Assets.testImage:', Assets.testImage)
  console.log('Assets.testImage.light:', Assets.testImage.light)
  console.log('Assets.testImage.dark:', Assets.testImage.dark)
  console.log('Assets.testImage.resolve():', Assets.testImage.resolve())
}

function testThemeSwitching() {
  console.log('\n=== Theme Switching Tests ===')

  // Test light theme
  setTheme('light')
  console.log('Light theme - Primary color:', Assets.testPrimary.resolve())
  console.log('Light theme - Background color:', Assets.testBackground.resolve())
  console.log('Light theme - Image source:', Assets.testImage.resolve())

  // Test dark theme
  setTheme('dark')
  console.log('Dark theme - Primary color:', Assets.testPrimary.resolve())
  console.log('Dark theme - Background color:', Assets.testBackground.resolve())
  console.log('Dark theme - Image source:', Assets.testImage.resolve())
}

function testSystemAssets() {
  console.log('\n=== System Assets Tests ===')

  // Test system colors
  console.log('System Blue (light):', Assets.systemBlue.light)
  console.log('System Blue (dark):', Assets.systemBlue.dark)
  console.log('System Blue (resolved):', Assets.systemBlue.resolve())

  console.log('System Green (light):', Assets.systemGreen.light)
  console.log('System Green (dark):', Assets.systemGreen.dark)
  console.log('System Green (resolved):', Assets.systemGreen.resolve())
}

// Run tests
console.log('Running Assets System Tests...')
testAssetAccess()
testThemeSwitching()
testSystemAssets()
console.log('\nAll tests completed!')
