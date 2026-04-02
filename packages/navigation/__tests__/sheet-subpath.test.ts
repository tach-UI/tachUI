import { describe, expect, it } from 'vitest'

import * as sheetSubpath from '../src/sheet'

describe('navigation sheet subpath entrypoint', () => {
  it('exports sheet presentation modifiers', () => {
    expect(typeof sheetSubpath.sheet).toBe('function')
    expect(typeof sheetSubpath.fullScreenCover).toBe('function')
    expect(typeof sheetSubpath.popover).toBe('function')
    expect(typeof sheetSubpath.confirmationDialog).toBe('function')
    expect(typeof sheetSubpath.inspector).toBe('function')
  })

  it('does not re-export unrelated stack APIs', () => {
    expect('NavigationStack' in sheetSubpath).toBe(false)
    expect('createNavigationRouter' in sheetSubpath).toBe(false)
  })
})
