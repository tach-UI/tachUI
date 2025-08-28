import { describe, it, expect, vi } from 'vitest'
import {
  LinearGradientPresets,
  InteractiveGradientPresets,
  GradientUtilities as GradientUtils,
  GradientValidation,
  GradientTypeGuards,
  GradientExamples,
  GradientDebugger,
} from '../../src/gradients/index'
import { LinearGradient } from '../../src/gradients/index'

describe('Phase 4 Features', () => {
  describe('Gradient Presets', () => {
    it('should provide linear gradient presets', () => {
      const oceanGradient = LinearGradientPresets.ocean()
      expect(oceanGradient.type).toBe('linear')
      expect(oceanGradient.options.colors).toHaveLength(2)
    })

    it('should provide iOS blue preset', () => {
      const iosBlue = LinearGradientPresets.iosBlue()
      expect(iosBlue.type).toBe('linear')
      expect(iosBlue.options.startPoint).toBe('top')
      expect(iosBlue.options.endPoint).toBe('bottom')
    })

    it('should provide interactive presets', () => {
      const primaryButton = InteractiveGradientPresets.primaryButton()
      expect(primaryButton.default).toBeDefined()
      expect(primaryButton.hover).toBeDefined()
      expect(primaryButton.active).toBeDefined()
      expect(primaryButton.animation).toBeDefined()
    })

    it('should provide danger button preset', () => {
      const dangerButton = InteractiveGradientPresets.dangerButton()
      expect(dangerButton.default).toBeDefined()
      expect(dangerButton.hover).toBeDefined()
      expect(dangerButton.active).toBeDefined()
      expect(dangerButton.disabled).toBe('#CCCCCC')
    })
  })

  describe('Gradient Utilities', () => {
    const testGradient = LinearGradient({
      colors: ['#ff0000', '#0000ff'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    it('should reverse gradient colors', () => {
      const reversed = GradientUtils.reverse(testGradient)
      expect(reversed.options.colors).toEqual(['#0000ff', '#ff0000'])
    })

    it('should mirror linear gradient', () => {
      const mirrored = GradientUtils.mirror(testGradient)
      expect(mirrored.options.startPoint).toBe('bottom')
      expect(mirrored.options.endPoint).toBe('top')
    })

    it('should analyze gradient complexity', () => {
      const complexity = GradientUtils.getComplexityScore(testGradient)
      expect(typeof complexity).toBe('number')
      expect(complexity).toBeGreaterThan(0)
    })

    it('should get performance impact', () => {
      const impact = GradientUtils.getPerformanceImpact(testGradient)
      expect(['low', 'medium', 'high']).toContain(impact)
    })

    it('should extract colors from gradient', () => {
      const colors = GradientUtils.extractColors(testGradient)
      expect(colors).toEqual(['#ff0000', '#0000ff'])
    })

    it('should convert gradient to radial', () => {
      const radial = GradientUtils.toRadial(testGradient, 50)
      expect(radial.type).toBe('radial')
      expect(radial.options.colors).toEqual(['#ff0000', '#0000ff'])
    })
  })

  describe('Color Utilities', () => {
    it('should lighten colors', () => {
      const lighter = GradientUtils.lighten('#007AFF', 0.2)
      expect(typeof lighter).toBe('string')
      expect(lighter).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should darken colors', () => {
      const darker = GradientUtils.darken('#007AFF', 0.2)
      expect(typeof darker).toBe('string')
      expect(darker).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should add alpha to colors', () => {
      const withAlpha = GradientUtils.withAlpha('#007AFF', 0.5)
      expect(withAlpha).toContain('rgba')
      expect(withAlpha).toContain('0.5')
    })

    it('should get complementary color', () => {
      const complement = GradientUtils.complement('#ff0000')
      expect(typeof complement).toBe('string')
      expect(complement).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should blend colors', () => {
      const blended = GradientUtils.blendColors('#ff0000', '#0000ff', 0.5)
      expect(typeof blended).toBe('string')
      expect(blended).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('Gradient Validation', () => {
    it('should validate linear gradients', () => {
      const validGradient = LinearGradient({
        colors: ['#ff0000', '#0000ff'],
        startPoint: 'top',
        endPoint: 'bottom',
      })

      const validation = GradientValidation.validateGradient(validGradient)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect invalid gradients', () => {
      const invalidGradient = {
        type: 'linear',
        options: {
          colors: ['invalid-color'],
          startPoint: 'invalid-point',
          endPoint: 'bottom',
        },
      } as any

      const validation = GradientValidation.validateGradient(invalidGradient)
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should validate color formats', () => {
      const validHex = GradientValidation.validateColor('#ff0000')
      expect(validHex.valid).toBe(true)

      const validRgb = GradientValidation.validateColor('rgb(255, 0, 0)')
      expect(validRgb.valid).toBe(true)

      const invalidColor = GradientValidation.validateColor('not-a-color')
      expect(invalidColor.valid).toBe(false)
    })

    it('should validate color arrays', () => {
      const validColors = GradientValidation.validateColors([
        '#ff0000',
        '#00ff00',
      ])
      expect(validColors.valid).toBe(true)

      const invalidColors = GradientValidation.validateColors(['#ff0000'])
      expect(invalidColors.valid).toBe(false) // Need at least 2 colors
    })
  })

  describe('Type Guards', () => {
    const testGradient = LinearGradient({
      colors: ['#ff0000', '#0000ff'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    it('should identify gradient definitions', () => {
      expect(GradientTypeGuards.isGradientDefinition(testGradient)).toBe(true)
      expect(GradientTypeGuards.isGradientDefinition('not-a-gradient')).toBe(
        false
      )
      expect(GradientTypeGuards.isGradientDefinition(null)).toBe(false)
    })

    it('should identify linear gradients', () => {
      expect(GradientTypeGuards.isLinearGradient(testGradient)).toBe(true)
      expect(
        GradientTypeGuards.isLinearGradient({ type: 'radial', options: {} })
      ).toBe(false)
    })

    it('should identify state gradient options', () => {
      const stateOptions = { default: testGradient, hover: testGradient }
      expect(GradientTypeGuards.isStateGradientOptions(stateOptions)).toBe(true)
      expect(GradientTypeGuards.isStateGradientOptions(testGradient)).toBe(
        false
      )
    })

    it('should identify gradient start points', () => {
      expect(GradientTypeGuards.isGradientStartPoint('top')).toBe(true)
      expect(GradientTypeGuards.isGradientStartPoint('topLeading')).toBe(true)
      expect(GradientTypeGuards.isGradientStartPoint('invalid')).toBe(false)
    })

    it('should identify gradient centers', () => {
      expect(GradientTypeGuards.isGradientCenter('center')).toBe(true)
      expect(GradientTypeGuards.isGradientCenter([50, 50])).toBe(true)
      expect(GradientTypeGuards.isGradientCenter('invalid')).toBe(false)
      expect(GradientTypeGuards.isGradientCenter([50])).toBe(false) // Need 2 coordinates
    })
  })

  describe('Gradient Generators', () => {
    it('should generate rainbow gradient', () => {
      const rainbow = GradientUtils.rainbow(6)
      expect(rainbow.type).toBe('linear')
      expect(rainbow.options.colors).toHaveLength(6)
    })

    it('should generate monochromatic gradient', () => {
      const mono = GradientUtils.monochromatic('#007AFF', 5)
      expect(mono.type).toBe('linear')
      expect(mono.options.colors).toHaveLength(5)
    })

    it('should generate complementary gradient', () => {
      const comp = GradientUtils.complementary('#ff0000')
      expect(comp.type).toBe('linear')
      expect(comp.options.colors).toHaveLength(2)
    })
  })

  describe('State Gradient Utilities', () => {
    const baseGradient = LinearGradient({
      colors: ['#007AFF', '#0051D2'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    it('should create hover effects', () => {
      const hoverEffect = GradientUtils.createHoverEffect(baseGradient, 0.1)
      expect(hoverEffect.default).toBeDefined()
      expect(hoverEffect.hover).toBeDefined()
      expect(hoverEffect.animation).toBeDefined()
    })

    it('should create button states', () => {
      const buttonStates = GradientUtils.createButtonStates(
        '#007AFF',
        'primary'
      )
      expect(buttonStates.default).toBeDefined()
      expect(buttonStates.hover).toBeDefined()
      expect(buttonStates.active).toBeDefined()
      expect(buttonStates.disabled).toBe('#cccccc')
    })

    it('should create card hover effect', () => {
      const cardHover = GradientUtils.createCardHover('#ffffff')
      expect(cardHover.default).toBe('#ffffff')
      expect(cardHover.hover).toBeDefined()
      expect(cardHover.animation).toBeDefined()
    })
  })

  describe('Gradient Examples', () => {
    it('should provide button gradient examples', () => {
      expect(GradientExamples.Button.iosPrimary).toBeDefined()
      expect(GradientExamples.Button.materialRaised).toBeDefined()
      expect(GradientExamples.Button.glassMorphism).toBeDefined()
      expect(GradientExamples.Button.ctaButton).toBeDefined()
    })

    it('should provide card gradient examples', () => {
      expect(GradientExamples.Card.subtleHover).toBeDefined()
      expect(GradientExamples.Card.darkCard).toBeDefined()
      expect(GradientExamples.Card.heroCard).toBeDefined()
    })

    it('should create component gradients', () => {
      const iosGradients = GradientExamples.createComponentGradients('ios')
      expect(iosGradients.Button.primary).toBeDefined()
      expect(iosGradients.Card.default).toBeDefined()
      expect(iosGradients.Input.default).toBeDefined()
      expect(iosGradients.Background.app).toBeDefined()
    })
  })

  describe('Gradient Debugger', () => {
    const testGradient = LinearGradient({
      colors: ['#ff0000', '#0000ff'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    it('should debug gradient configurations', () => {
      const debug = GradientDebugger.debugGradient(testGradient)
      expect(debug.isValid).toBe(true)
      expect(debug.errors).toHaveLength(0)
      expect(debug.performance.complexity).toBeGreaterThan(0)
      expect(['low', 'medium', 'high']).toContain(debug.performance.impact)
      expect(debug.cssOutput).toContain('linear-gradient')
    })

    it('should debug state gradient configurations', () => {
      const stateGradient = {
        default: testGradient,
        hover: testGradient,
        animation: { duration: 200, easing: 'ease' },
      }

      const debug = GradientDebugger.debugStateGradient(stateGradient)
      expect(debug.isValid).toBe(true)
      expect(debug.stateAnalysis.default).toBeDefined()
      expect(debug.stateAnalysis.hover).toBeDefined()
    })

    it('should profile operations', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = GradientDebugger.profileOperation('test-operation', () => {
        return 'test-result'
      })

      expect(result).toBe('test-result')

      // In development mode, should log timing
      if (process.env.NODE_ENV === 'development') {
        expect(consoleSpy).toHaveBeenCalled()
      }

      consoleSpy.mockRestore()
    })
  })

  describe('CSS Utilities', () => {
    const testGradient = LinearGradient({
      colors: ['#ff0000', '#0000ff'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    it('should convert gradients to CSS', () => {
      const css = GradientUtils.toCSS(testGradient)
      expect(css).toContain('linear-gradient')
      expect(css).toContain('#ff0000')
      expect(css).toContain('#0000ff')
    })

    it('should handle string backgrounds', () => {
      const css = GradientUtils.toCSS('#ff0000')
      expect(css).toBe('#ff0000')
    })

    it('should handle state gradient backgrounds', () => {
      const stateGradient = { default: testGradient, hover: testGradient }
      const css = GradientUtils.toCSS(stateGradient)
      expect(css).toContain('linear-gradient')
    })
  })

  describe('Gradient Cloning and Comparison', () => {
    const testGradient = LinearGradient({
      colors: ['#ff0000', '#0000ff'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    it('should clone gradients', () => {
      const cloned = GradientUtils.clone(testGradient)
      expect(cloned).toEqual(testGradient)
      expect(cloned).not.toBe(testGradient) // Different object reference
    })

    it('should compare gradients for equality', () => {
      const gradient1 = LinearGradient({
        colors: ['#ff0000', '#0000ff'],
        startPoint: 'top',
        endPoint: 'bottom',
      })

      const gradient2 = LinearGradient({
        colors: ['#ff0000', '#0000ff'],
        startPoint: 'top',
        endPoint: 'bottom',
      })

      const gradient3 = LinearGradient({
        colors: ['#00ff00', '#0000ff'],
        startPoint: 'top',
        endPoint: 'bottom',
      })

      expect(GradientUtils.equals(gradient1, gradient2)).toBe(true)
      expect(GradientUtils.equals(gradient1, gradient3)).toBe(false)
    })
  })
})
