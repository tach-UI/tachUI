/**
 * Slider Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { Slider } from '../src/components/advanced/Slider'

describe('Slider', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create Slider component', () => {
    const slider = Slider({
      value: 50,
      in: [0, 100],
    })

    expect(slider).toBeDefined()
    expect(slider.type).toBe('component')
  })

  it('should handle static values', () => {
    const slider = Slider({
      value: 25,
      in: [0, 100],
    })

    expect(slider).toBeDefined()
    expect(typeof slider).toBe('object')
  })

  it('should support step values', () => {
    const slider = Slider({
      value: 50,
      in: [0, 100],
      step: 10,
    })

    expect(slider).toBeDefined()
  })

  it('should support range configuration', () => {
    const slider = Slider({
      value: 50,
      in: [0, 100],
      step: 5,
    })

    expect(slider).toBeDefined()
    expect(typeof slider).toBe('object')
  })
})
