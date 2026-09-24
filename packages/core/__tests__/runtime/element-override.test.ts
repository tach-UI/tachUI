/**
 * Element override validation for layout stacks
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ElementTagValidator,
  processElementOverride,
} from '../../src/runtime/element-override'

const LAYOUT_STACKS = ['HStack', 'VStack', 'ZStack'] as const
const INTERACTIVE_TAGS = ['button', 'a', 'input', 'select', 'textarea']

describe('element override validation on layout stacks', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let infoSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  for (const componentType of LAYOUT_STACKS) {
    for (const tag of INTERACTIVE_TAGS) {
      it(`reports '${tag}' on ${componentType} as valid without warnings`, () => {
        const result = ElementTagValidator.validate(tag, componentType)

        expect(result.valid).toBe(true)
        expect(result.warnings).toEqual([])
        expect(warnSpy).not.toHaveBeenCalled()
      })
    }

    it(`stays quiet across repeated ${componentType} button overrides`, () => {
      for (let index = 0; index < 5; index++) {
        const { tag, validation } = processElementOverride(
          componentType,
          'div',
          'button'
        )
        expect(tag).toBe('button')
        expect(validation.valid).toBe(true)
        expect(validation.warnings).toEqual([])
      }

      expect(warnSpy).not.toHaveBeenCalled()
    })
  }

  it('still reports invalid tags', () => {
    const result = ElementTagValidator.validate('notatag', 'HStack')

    expect(result.valid).toBe(false)
    expect(result.severity).toBe('error')
    expect(result.warning).toContain("Invalid HTML tag 'notatag'")
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('still reports heading tags on layout stacks', () => {
    const result = ElementTagValidator.validate('h1', 'VStack')

    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings?.[0].message).toContain("heading tag 'h1'")
    expect(infoSpy).toHaveBeenCalledTimes(1)
  })

  it('still reports form tags outside form contexts', () => {
    const result = ElementTagValidator.validate('form', 'Text')

    expect(result.warnings).toHaveLength(1)
    expect(result.warnings?.[0].message).toContain("Form tag 'form'")
  })

  it('still warns on problematic overrides for interactive components', () => {
    processElementOverride('Button', 'button', 'div')

    expect(warnSpy).toHaveBeenCalledWith(
      "Element override: Button changed from 'button' to 'div'"
    )
  })
})
