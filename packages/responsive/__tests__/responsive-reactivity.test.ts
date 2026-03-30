import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createRoot,
  createSignal,
  flushSync,
  setTheme,
} from '@tachui/core/reactive'
import { ColorAsset } from '@tachui/core'
import { createResponsiveModifier } from '../src/modifiers/responsive'
import {
  getCurrentBreakpoint,
  __resetResponsiveSystemForTests,
  __syncResponsiveSignalsForTests,
} from '../src/modifiers/responsive/breakpoints'

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}

function cssOutput(
  modifier: ReturnType<typeof createResponsiveModifier>
): string {
  const generated = modifier.getGeneratedCSS()
  return generated?.cssRules.join('\n') ?? ''
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getBaseRuleValue(css: string, property: string): string {
  const baseSection = css.split('@media')[0] ?? ''
  const propertyName = toKebabCase(property)
  const match = baseSection.match(
    new RegExp(`${escapeForRegExp(propertyName)}:\\s*([^;]+);`)
  )
  return match?.[1]?.trim() ?? ''
}

function getMediaRuleValue(
  css: string,
  minWidth: string,
  property: string
): string {
  const propertyName = toKebabCase(property)
  const mediaRegex = new RegExp(
    `@media\\s*\\(min-width:\\s*${escapeForRegExp(minWidth)}\\)\\s*\\{[\\s\\S]*?${escapeForRegExp(propertyName)}:\\s*([^;]+);`
  )
  const match = css.match(mediaRegex)
  return match?.[1]?.trim() ?? ''
}

const disposers = new Set<() => void>()
let warnSpy: ReturnType<typeof vi.spyOn> | null = null

async function waitForAssetRuleRegeneration(): Promise<void> {
  // Theme-backed responsive rules are regenerated on the next task.
  await new Promise(resolve => setTimeout(resolve, 0))
}

function mountModifier(
  modifier: ReturnType<typeof createResponsiveModifier>,
  element: HTMLElement
): void {
  createRoot(dispose => {
    disposers.add(dispose)
    modifier.apply(
      { element } as any,
      {
        componentId: `responsive-reactive-${Math.random().toString(36).slice(2)}`,
        element,
        phase: 'creation',
      } as any
    )
  })
}

describe('@tachui/responsive combined reactivity', () => {
  beforeEach(() => {
    // Suppress expected responsive warnings in this suite.
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    __resetResponsiveSystemForTests()
    setTheme('light')
    window.innerWidth = 1024
    __syncResponsiveSignalsForTests()
  })

  afterEach(() => {
    disposers.forEach(dispose => dispose())
    disposers.clear()
    warnSpy?.mockRestore()
    warnSpy = null
  })

  it('Signal + Breakpoint: updates only the targeted breakpoint rule', () => {
    const element = document.createElement('div')
    const [mdSize, setMdSize] = createSignal(16)
    const modifier = createResponsiveModifier({
      fontSize: {
        base: 12,
        md: mdSize,
        lg: 24,
      },
    })

    mountModifier(modifier, element)
    let css = cssOutput(modifier)

    expect(getBaseRuleValue(css, 'fontSize')).toBe('12px')
    expect(getMediaRuleValue(css, '768px', 'fontSize')).toBe('16px')
    expect(getMediaRuleValue(css, '1024px', 'fontSize')).toBe('24px')

    setMdSize(20)
    flushSync()
    css = cssOutput(modifier)

    expect(getBaseRuleValue(css, 'fontSize')).toBe('12px')
    expect(getMediaRuleValue(css, '768px', 'fontSize')).toBe('20px')
    expect(getMediaRuleValue(css, '1024px', 'fontSize')).toBe('24px')
  })

  it('ColorAsset + Breakpoint + Theme: re-resolves only the breakpoint using the asset', async () => {
    const element = document.createElement('div')
    const brandSurface = ColorAsset.init({
      name: 'brand-surface',
      default: '#f6f6f6',
      light: '#f6f6f6',
      dark: '#101010',
    })

    const modifier = createResponsiveModifier({
      backgroundColor: {
        base: brandSurface as any,
        md: '#d9d9d9',
      },
    })

    mountModifier(modifier, element)
    let css = cssOutput(modifier)

    expect(getBaseRuleValue(css, 'backgroundColor')).toBe('#f6f6f6')
    expect(getMediaRuleValue(css, '768px', 'backgroundColor')).toBe('#d9d9d9')

    setTheme('dark')
    flushSync()
    await waitForAssetRuleRegeneration()
    css = cssOutput(modifier)

    expect(getBaseRuleValue(css, 'backgroundColor')).toBe('#101010')
    expect(getMediaRuleValue(css, '768px', 'backgroundColor')).toBe('#d9d9d9')
  })

  it('Signal + ColorAsset in one responsive config: both reactive paths update independently', async () => {
    const element = document.createElement('div')
    const [mdPadding, setMdPadding] = createSignal(18)
    const [mdColor, setMdColor] = createSignal('#336699')
    const themedText = ColorAsset.init({
      name: 'themed-text',
      default: '#222222',
      light: '#222222',
      dark: '#dddddd',
    })

    const modifier = createResponsiveModifier({
      color: {
        base: themedText as any,
        md: mdColor,
        lg: themedText as any,
      },
      padding: {
        base: 8,
        md: mdPadding,
      },
    })

    mountModifier(modifier, element)
    let css = cssOutput(modifier)

    expect(getBaseRuleValue(css, 'color')).toBe('#222222')
    expect(getMediaRuleValue(css, '768px', 'color')).toBe('#336699')
    expect(getMediaRuleValue(css, '1024px', 'color')).toBe('#222222')
    expect(getMediaRuleValue(css, '768px', 'padding')).toBe('18px')

    setTheme('dark')
    flushSync()
    await waitForAssetRuleRegeneration()
    css = cssOutput(modifier)

    expect(getBaseRuleValue(css, 'color')).toBe('#dddddd')
    expect(getMediaRuleValue(css, '768px', 'color')).toBe('#336699')
    expect(getMediaRuleValue(css, '1024px', 'color')).toBe('#dddddd')

    setMdColor('#884422')
    setMdPadding(26)
    flushSync()
    css = cssOutput(modifier)

    expect(getBaseRuleValue(css, 'color')).toBe('#dddddd')
    expect(getMediaRuleValue(css, '768px', 'color')).toBe('#884422')
    expect(getMediaRuleValue(css, '1024px', 'color')).toBe('#dddddd')
    expect(getMediaRuleValue(css, '768px', 'padding')).toBe('26px')
  })

  it('Breakpoint change + active signal: preserves the correct rule set during interleaved updates', () => {
    window.innerWidth = 700
    __syncResponsiveSignalsForTests()
    expect(getCurrentBreakpoint()()).toBe('sm')

    const element = document.createElement('div')
    const [desktopMargin, setDesktopMargin] = createSignal(48)
    const modifier = createResponsiveModifier({
      margin: {
        base: 8,
        md: 20,
        lg: desktopMargin,
      },
    })

    mountModifier(modifier, element)

    // Interleave updates before a single flush to cover signal+breakpoint ordering.
    setDesktopMargin(72)
    window.innerWidth = 1200
    __syncResponsiveSignalsForTests()
    flushSync()

    const css = cssOutput(modifier)
    expect(getCurrentBreakpoint()()).toBe('lg')
    expect(getBaseRuleValue(css, 'margin')).toBe('8px')
    expect(getMediaRuleValue(css, '768px', 'margin')).toBe('20px')
    expect(getMediaRuleValue(css, '1024px', 'margin')).toBe('72px')
  })

  it('Breakpoint change + active signal: preserves the correct rule set during interleaved updates (reverse order)', () => {
    window.innerWidth = 700
    __syncResponsiveSignalsForTests()
    expect(getCurrentBreakpoint()()).toBe('sm')

    const element = document.createElement('div')
    const [desktopMargin, setDesktopMargin] = createSignal(48)
    const modifier = createResponsiveModifier({
      margin: {
        base: 8,
        md: 20,
        lg: desktopMargin,
      },
    })

    mountModifier(modifier, element)

    window.innerWidth = 1200
    __syncResponsiveSignalsForTests()
    setDesktopMargin(72)
    flushSync()

    const css = cssOutput(modifier)
    expect(getCurrentBreakpoint()()).toBe('lg')
    expect(getBaseRuleValue(css, 'margin')).toBe('8px')
    expect(getMediaRuleValue(css, '768px', 'margin')).toBe('20px')
    expect(getMediaRuleValue(css, '1024px', 'margin')).toBe('72px')
  })
})
