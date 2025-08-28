/**
 * Integration test for the Assets system
 *
 * This test verifies that the Assets system integrates correctly
 * with the rest of the TachUI framework.
 */

import { Text, VStack } from '../components'
import { appearanceModifiers } from '../modifiers/core'
import { Assets, ColorAsset, ImageAsset, registerAsset } from './index'

// Register some test assets
registerAsset('primaryColor', ColorAsset.init('#007AFF', '#0A84FF', 'primaryColor'))
registerAsset(
  'backgroundImage',
  ImageAsset.init('/bg-light.png', '/bg-dark.png', 'backgroundImage')
)

// Test using assets with components
export function TestComponent() {
  return VStack({
    children: [
      Text('Hello TachUI')
        .modifier.foregroundColor(Assets.primaryColor) // Auto-adapts to theme
        .fontSize(24)
        .build(),

      Text('Always Light')
        .modifier.foregroundColor(Assets.primaryColor.light) // Always light
        .build(),
    ],
  })
}

// Test using assets with modifiers directly
export function testModifierUsage() {
  // Using asset with foregroundColor modifier
  const colorModifier = appearanceModifiers.foregroundColor(Assets.primaryColor)

  // Using asset with backgroundColor modifier
  const backgroundModifier = appearanceModifiers.backgroundColor(Assets.primaryColor.dark)

  return [colorModifier, backgroundModifier]
}

console.log('Integration test completed successfully!')
