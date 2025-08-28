/**
 * Simple test for the Assets system
 *
 * This test verifies that the Assets system is working correctly
 * by creating and using some basic assets.
 */

import { Assets, ColorAsset, ImageAsset, registerAsset } from './index'

// Register some test assets
registerAsset('testColor', ColorAsset.init('#FF0000', '#00FF00', 'testColor'))
registerAsset('testImage', ImageAsset.init('/test-light.png', '/test-dark.png', 'testImage'))

// Test accessing assets
console.log('Assets.testColor:', Assets.testColor)
console.log('Assets.testColor.light:', Assets.testColor.light)
console.log('Assets.testColor.dark:', Assets.testColor.dark)

// Test resolving assets
console.log('Assets.testColor.resolve():', Assets.testColor.resolve())

// Test image assets
console.log('Assets.testImage:', Assets.testImage)
console.log('Assets.testImage.light:', Assets.testImage.light)
console.log('Assets.testImage.dark:', Assets.testImage.dark)
console.log('Assets.testImage.resolve():', Assets.testImage.resolve())

console.log('Assets system test completed successfully!')
