/**
 * Tests for Grid Animation System (Phase 3)
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  LazyVGrid,
  LazyHGrid,
  Grid,
  GridItem,
  GridAnimations,
  type GridAnimationConfig,
  GridCSSGenerator,
} from '../../src/components/Grid'
import { Text } from '@tachui/primitives'

describe('Grid Animation System', () => {
  describe('GridAnimationConfig Interface', () => {
    it('should support layout change animations', () => {
      const config: GridAnimationConfig = {
        layoutChanges: {
          duration: 300,
          easing: 'ease-out',
          delay: 0,
        },
      }

      expect(config.layoutChanges).toBeDefined()
      expect(typeof config.layoutChanges).toBe('object')
      expect((config.layoutChanges as any).duration).toBe(300)
    })

    it('should support item change animations', () => {
      const config: GridAnimationConfig = {
        itemChanges: {
          enter: {
            duration: 250,
            easing: 'ease-out',
            from: 'fade',
          },
          exit: {
            duration: 200,
            easing: 'ease-in',
            to: 'scale',
          },
        },
      }

      expect(config.itemChanges).toBeDefined()
      expect(config.itemChanges?.enter?.duration).toBe(250)
      expect(config.itemChanges?.exit?.duration).toBe(200)
    })

    it('should support boolean shorthand for animations', () => {
      const config: GridAnimationConfig = {
        layoutChanges: true,
        responsive: true,
        sections: true,
      }

      expect(config.layoutChanges).toBe(true)
      expect(config.responsive).toBe(true)
      expect(config.sections).toBe(true)
    })
  })

  describe('GridCSSGenerator Animation Methods', () => {
    it('should generate layout change CSS', () => {
      const animations: GridAnimationConfig = {
        layoutChanges: {
          duration: 300,
          easing: 'ease-out',
          delay: 100,
        },
      }

      const css = GridCSSGenerator.generateGridAnimationCSS(animations)

      expect(css.transition).toContain(
        'grid-template-columns 300ms ease-out 100ms'
      )
      expect(css.transition).toContain(
        'grid-template-rows 300ms ease-out 100ms'
      )
    })

    it('should generate responsive change CSS', () => {
      const animations: GridAnimationConfig = {
        responsive: {
          duration: 250,
          easing: 'ease-in-out',
        },
      }

      const css = GridCSSGenerator.generateGridAnimationCSS(animations)

      expect(css.transition).toContain(
        'grid-template-columns 250ms ease-in-out'
      )
      expect(css.transition).toContain('gap 250ms ease-in-out')
    })

    it('should combine multiple animation types', () => {
      const animations: GridAnimationConfig = {
        layoutChanges: {
          duration: 300,
          easing: 'ease-out',
        },
        responsive: {
          duration: 200,
          easing: 'ease-in',
        },
      }

      const css = GridCSSGenerator.generateGridAnimationCSS(animations)

      expect(css.transition).toContain('300ms ease-out')
      expect(css.transition).toContain('200ms ease-in')
    })

    it('should generate item animation keyframes', () => {
      const fadeKeyframes = GridCSSGenerator.generateItemAnimationKeyframes(
        'enter',
        'fade'
      )
      const scaleKeyframes = GridCSSGenerator.generateItemAnimationKeyframes(
        'exit',
        'scale'
      )

      expect(fadeKeyframes['@keyframes grid-item-enter-fade']).toContain(
        'opacity: 0'
      )
      expect(fadeKeyframes['@keyframes grid-item-enter-fade']).toContain(
        'opacity: 1'
      )
      expect(scaleKeyframes['@keyframes grid-item-exit-scale']).toContain(
        'scale(1)'
      )
      expect(scaleKeyframes['@keyframes grid-item-exit-scale']).toContain(
        'scale(0.8)'
      )
    })

    it('should generate slide animation keyframes', () => {
      const slideUpKeyframes = GridCSSGenerator.generateItemAnimationKeyframes(
        'enter',
        'slide-up'
      )
      const slideDownKeyframes =
        GridCSSGenerator.generateItemAnimationKeyframes('exit', 'slide-down')

      expect(slideUpKeyframes['@keyframes grid-item-enter-slide-up']).toContain(
        'translateY(20px)'
      )
      expect(slideUpKeyframes['@keyframes grid-item-enter-slide-up']).toContain(
        'translateY(0)'
      )
      expect(
        slideDownKeyframes['@keyframes grid-item-exit-slide-down']
      ).toContain('translateY(0)')
      expect(
        slideDownKeyframes['@keyframes grid-item-exit-slide-down']
      ).toContain('translateY(20px)')
    })
  })

  describe('GridAnimations Preset Functions', () => {
    it('should create fade-in animation config', () => {
      const config = GridAnimations.fadeIn(300, 50)

      expect(config.itemChanges?.enter?.duration).toBe(300)
      expect(config.itemChanges?.enter?.delay).toBe(50)
      expect(config.itemChanges?.enter?.from).toBe('fade')
      expect(config.itemChanges?.enter?.easing).toBe('ease-out')
    })

    it('should create scale-in animation config', () => {
      const config = GridAnimations.scaleIn(400)

      expect(config.itemChanges?.enter?.duration).toBe(400)
      expect(config.itemChanges?.enter?.from).toBe('scale')
      expect(config.itemChanges?.enter?.easing).toBe(
        'cubic-bezier(0.34, 1.56, 0.64, 1)'
      )
    })

    it('should create slide-in animation config', () => {
      const config = GridAnimations.slideIn('left', 200)

      expect(config.itemChanges?.enter?.duration).toBe(200)
      expect(config.itemChanges?.enter?.from).toBe('slide-left')
    })

    it('should create smooth layout animation config', () => {
      const config = GridAnimations.smoothLayout(350)

      expect(config.layoutChanges?.duration).toBe(350)
      expect(config.layoutChanges?.easing).toBe('ease-out')
    })

    it('should create comprehensive animation config', () => {
      const config = GridAnimations.comprehensive(250, 300)

      expect(config.itemChanges?.enter?.duration).toBe(250)
      expect(config.layoutChanges?.duration).toBe(300)
      expect(config.responsive?.duration).toBe(300)
      expect(config.sections?.duration).toBe(250)
    })
  })

  describe('LazyVGrid Animation Integration', () => {
    it('should accept animation configuration', () => {
      const animations = GridAnimations.fadeIn()
      const children = [Text('Item 1'), Text('Item 2')]

      expect(() => {
        LazyVGrid({
          columns: [GridItem.flexible()],
          children,
          animations,
        })
      }).not.toThrow()
    })

    it('should apply animation styles to rendered element', () => {
      const animations: GridAnimationConfig = {
        layoutChanges: {
          duration: 300,
          easing: 'ease-out',
        },
      }

      const grid = LazyVGrid({
        columns: [GridItem.flexible()],
        children: [Text('Item 1')],
        animations,
      })

      const rendered = grid.render()
      const element = rendered[0]

      expect(element.props.style.transition).toContain('grid-template-columns')
      expect(element.props.style.transition).toContain('300ms ease-out')
    })
  })

  describe('LazyHGrid Animation Integration', () => {
    it('should accept animation configuration', () => {
      const animations = GridAnimations.scaleIn()
      const children = [Text('Item 1'), Text('Item 2')]

      expect(() => {
        LazyHGrid({
          rows: [GridItem.flexible()],
          children,
          animations,
        })
      }).not.toThrow()
    })

    it('should apply animation styles to rendered element', () => {
      const animations: GridAnimationConfig = {
        responsive: {
          duration: 250,
          easing: 'ease-in-out',
        },
      }

      const grid = LazyHGrid({
        rows: [GridItem.flexible()],
        children: [Text('Item 1')],
        animations,
      })

      const rendered = grid.render()
      const element = rendered[0]

      expect(element.props.style.transition).toContain('grid-template-rows')
      expect(element.props.style.transition).toContain('250ms ease-in-out')
    })
  })

  describe('Grid Animation Integration', () => {
    it('should accept animation configuration', () => {
      const animations = GridAnimations.smoothLayout()
      const children = [Text('Item 1')]

      expect(() => {
        Grid({
          children,
          animations,
        })
      }).not.toThrow()
    })

    it('should apply animation styles to rendered element', () => {
      const animations: GridAnimationConfig = {
        layoutChanges: true,
      }

      const grid = Grid({
        children: [Text('Item 1')],
        animations,
      })

      const rendered = grid.render()
      const element = rendered[0]

      // Should have default animation values when boolean true is used
      expect(element.props.style.transition).toContain('grid-template-columns')
      expect(element.props.style.transition).toContain('ease-out')
    })
  })

  describe('Animation Performance', () => {
    it('should not apply animations when config is undefined', () => {
      const grid = LazyVGrid({
        columns: [GridItem.flexible()],
        children: [Text('Item 1')],
        // No animations config
      })

      const rendered = grid.render()
      const element = rendered[0]

      expect(element.props.style.transition).toBeUndefined()
    })

    it('should handle empty animation config gracefully', () => {
      const animations: GridAnimationConfig = {}

      const grid = LazyVGrid({
        columns: [GridItem.flexible()],
        children: [Text('Item 1')],
        animations,
      })

      const rendered = grid.render()
      const element = rendered[0]

      expect(element.props.style.transition).toBeUndefined()
    })
  })

  describe('Animation Accessibility', () => {
    it('should apply animation styles without debug attributes by default', () => {
      const animations = GridAnimations.fadeIn()

      const grid = LazyVGrid({
        columns: [GridItem.flexible()],
        children: [Text('Item 1')],
        animations,
        debugLabel: 'test-grid',
      })

      const rendered = grid.render()
      const element = rendered[0]

      // Animation styles should be applied
      expect(element.props.style).toBeDefined()
      expect(element.props.className).toContain('tachui-lazy-vgrid')

      // Debug attributes are only present when debug mode is enabled
      // In test environment, debug is typically disabled
      expect(element.props['data-tachui-component']).toBeUndefined()
    })

    it('should maintain accessibility with animations', () => {
      const animations = GridAnimations.comprehensive()

      const grid = LazyVGrid({
        columns: [GridItem.flexible()],
        children: [Text('Item 1')],
        animations,
      })

      const rendered = grid.render()
      const element = rendered[0]

      // Grid should maintain proper structure with animations
      expect(element.tag).toBe('div')
      expect(element.props.style.display).toBe('grid')
      expect(element.props.style.transition).toBeDefined()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid animation types gracefully', () => {
      expect(() => {
        GridCSSGenerator.generateItemAnimationKeyframes(
          'enter',
          'invalid' as any
        )
      }).not.toThrow()
    })

    it('should handle negative duration values', () => {
      const animations: GridAnimationConfig = {
        layoutChanges: {
          duration: -100,
          easing: 'ease-out',
        },
      }

      const css = GridCSSGenerator.generateGridAnimationCSS(animations)
      expect(css.transition).toContain('-100ms')
    })

    it('should handle missing easing values', () => {
      const animations: GridAnimationConfig = {
        layoutChanges: {
          duration: 300,
          // easing not provided
        },
      }

      const css = GridCSSGenerator.generateGridAnimationCSS(animations)
      expect(css.transition).toContain('ease-out') // Default easing
    })
  })
})
