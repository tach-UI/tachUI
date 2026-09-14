/**
 * The scaffolded starter apps have to *render*, not merely compile.
 *
 * `release:smoke` type-checks and builds a generated project, which catches an
 * import that does not resolve — but neither step executes `App()`. These are
 * the template bodies, copied verbatim apart from the function name, mounted
 * for real. `tools/check-template-apps.mjs` keeps the copies in step with the
 * templates; run it with `--write` after changing either one.
 *
 * GENERATED SECTION BELOW — edit the templates, not this file.
 */

import { describe, expect, it } from 'vitest'
import { flushSync, mount } from '@tachui/core'
import { State } from '@tachui/core/state'
import { Button, HStack, Text, VStack } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'

// --- packages/cli/templates/basic/src/App.ts.template ---
export function BasicApp() {
  return VStack({
    children: [
      Text('Welcome to TachUI')
        .fontSize(30)
        .fontWeight('bold')
        .margin({ bottom: 12 }),

      Text('Your starter app is ready.')
        .fontSize(18)
        .foregroundColor('#666')
        .margin({ bottom: 24 }),

      Button('Get Started', () => console.log('TachUI starter ready'))
        .backgroundColor('#0a84ff')
        .foregroundColor('#fff')
        .padding({ vertical: 12, horizontal: 20 })
        .cornerRadius(10),
    ],
    spacing: 0,
    alignment: 'center',
  })
    .frame(undefined, '100vh')
    .justifyContent('center')
    .alignItems('center')
    .build()
}

// --- packages/cli/templates/advanced/src/App.ts.template ---
export function AdvancedApp() {
  const count = State(0)

  return VStack({
    children: [
      Text('TachUI Advanced Starter')
        .fontSize(30)
        .fontWeight('bold')
        .margin({ bottom: 12 }),

      Text(() => `Counter: ${count.wrappedValue}`)
        .fontSize(20)
        .margin({ bottom: 20 }),

      HStack({
        children: [
          Button('-', () => {
            count.wrappedValue -= 1
          })
            .padding({ vertical: 10, horizontal: 14 })
            .cornerRadius(8),

          Button('+', () => {
            count.wrappedValue += 1
          })
            .padding({ vertical: 10, horizontal: 14 })
            .cornerRadius(8),
        ],
        spacing: 12,
        alignment: 'center',
      }),
    ],
    spacing: 0,
    alignment: 'center',
  })
    .frame(undefined, '100vh')
    .justifyContent('center')
    .alignItems('center')
    .build()
}

const render = (build: () => any, id: string): HTMLElement => {
  const host = document.createElement('div')
  host.id = id
  document.body.appendChild(host)
  mount(build, `#${id}`)
  return host
}

describe('scaffolded starter apps', () => {
  it('renders the basic template', () => {
    const host = render(() => BasicApp(), 'basic-host')

    expect(host.textContent).toContain('Welcome to TachUI')
    expect(host.textContent).toContain('Your starter app is ready.')
    expect(host.textContent).toContain('Get Started')
  })

  it('renders the advanced template and its counter responds', () => {
    const host = render(() => AdvancedApp(), 'advanced-host')

    expect(host.textContent).toContain('TachUI Advanced Starter')
    expect(host.textContent).toContain('Counter: 0')

    const increment = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '+'
    )
    expect(increment).toBeDefined()

    increment!.click()
    flushSync()

    expect(host.textContent).toContain('Counter: 1')
  })
})
