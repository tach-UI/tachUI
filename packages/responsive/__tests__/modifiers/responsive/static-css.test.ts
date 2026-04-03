import { describe, expect, it } from 'vitest'
import { ResponsiveModifier } from '../../../src/modifiers/responsive/responsive-modifier'

describe('responsive modifier static css extraction', () => {
  it('emits @media rules for responsive breakpoints', () => {
    const modifier = new ResponsiveModifier({
      fontSize: {
        sm: '14px',
        md: '18px',
      },
    })

    const rules = modifier.getStaticCSS?.('[data-component-id="cmp-responsive"]') ?? []
    const css = rules.join('\n')

    expect(css).toContain('@media')
    expect(css).toContain('[data-component-id="cmp-responsive"]')
    expect(css).toContain('font-size')
    expect(css).toContain('(min-width: 640px)')
    expect(css).toContain('(min-width: 768px)')
  })

  it('includes base rule and responsive overrides when both are provided', () => {
    const modifier = new ResponsiveModifier({
      color: '#333',
      fontSize: {
        base: '12px',
        lg: '20px',
      },
    })

    const rules = modifier.getStaticCSS?.('[data-component-id="cmp-responsive-mixed"]') ?? []
    const css = rules.join('\n')

    expect(css).toContain('[data-component-id="cmp-responsive-mixed"]')
    expect(css).toContain('color: #333')
    expect(css).toContain('font-size: 12px')
    expect(css).toContain('(min-width: 1024px)')
    expect(css).toContain('font-size: 20px')
  })
})
