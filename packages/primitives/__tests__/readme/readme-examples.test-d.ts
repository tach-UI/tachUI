/**
 * README examples, type-checked.
 *
 * `check-readme-imports` proves the names a README imports exist, and
 * `readme-intros.test.ts` mounts the openings that build UI. Neither covers the
 * shape of a call: the mobile, devtools, grid and responsive examples were
 * rewritten against the real export names and still would not compile —
 * `ActionSheet` takes `buttons` of `{ label, onPress }`, not `actions` of
 * `{ title }`; `AlertButton`'s callback is `action`; `DevToolsConfig` has no
 * `trackReactiveOperations`; `Grid` reads template areas from
 * `styling.templateAreas`; `getCurrentBreakpoint()` returns a Signal and its
 * keys are `base | sm | md | lg | xl | 2xl`, not device names.
 *
 * Every one of those passed an import check. This is where a documented call
 * form is held to the contract it is documenting.
 */

import { describe, it } from 'vitest'
import { createSignal } from '@tachui/core'
import { Text } from '@tachui/primitives'
import { ActionSheet, Alert } from '@tachui/mobile'
import { globalDevTools } from '@tachui/devtools'
import { Grid } from '@tachui/grid'
import {
  DEFAULT_BREAKPOINTS,
  getBreakpointsAbove,
  getCurrentBreakpoint,
  isBreakpointAbove,
  isBreakpointBelow,
  useBreakpoint,
} from '@tachui/responsive'

describe('README examples type-check', () => {
  // Exactly what the READMEs show. This needed a hand-built `Signal` until
  // #372: `createSignal` attached `peek` at runtime and declared only
  // `() => T`, so the natural form did not satisfy a `Signal<boolean>` prop.
  const [isPresented] = createSignal(false)

  it('mobile: ActionSheet quick start', () => {
    ActionSheet({
      isPresented,
      title: 'Choose an action',
      message: 'What would you like to do?',
      buttons: [
        { label: 'Share', onPress: () => {} },
        { label: 'Edit', onPress: () => {} },
        { label: 'Delete', role: 'destructive', onPress: () => {} },
        { label: 'Cancel', role: 'cancel', onPress: () => {} },
      ],
    })
  })

  it('mobile: Alert quick start', () => {
    Alert({
      isPresented,
      title: 'Confirm Action',
      message: 'Are you sure you want to delete this item?',
      buttons: [
        { title: 'Cancel', role: 'cancel' },
        { title: 'Delete', role: 'destructive', action: () => {} },
      ],
    })
  })

  it('devtools: the inspector example', () => {
    globalDevTools.configure({ trackAllComponents: true, trackMemoryUsage: true })
    globalDevTools.enable()
    globalDevTools.getComponentTree()
    globalDevTools.getRootComponents()
    globalDevTools.getComponentTreeSignal()
    globalDevTools.findComponentsByName('Button')
    globalDevTools.getDebugEvents()
  })

  it('grid: the dashboard template-areas example', () => {
    Grid({
      styling: {
        templateAreas: [
          'header header header',
          'stats chart chart',
          'footer footer footer',
        ],
      },
      children: [Text('header').gridArea('header')],
    })
  })

  it('responsive: the breakpoint helpers example', () => {
    useBreakpoint()
    console.log(DEFAULT_BREAKPOINTS)

    const currentBreakpoint = getCurrentBreakpoint()
    const current = currentBreakpoint()

    isBreakpointAbove(current, 'md')
    isBreakpointBelow(current, 'lg')
    getBreakpointsAbove('md')
  })
})
