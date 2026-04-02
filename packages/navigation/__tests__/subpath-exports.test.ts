import { describe, expect, it } from 'vitest'

import * as environmentSubpath from '../src/environment'
import * as linkSubpath from '../src/link'
import * as modifiersSubpath from '../src/modifiers'
import * as modifiersRegisterSubpath from '../src/modifiers-register'
import * as pathSubpath from '../src/path'
import * as stackSubpath from '../src/stack'
import * as tabsSubpath from '../src/tabs'

describe('navigation granular subpath entrypoints', () => {
  it('exports stack APIs from stack subpath only', () => {
    expect(typeof stackSubpath.NavigationStack).toBe('function')
    expect(typeof stackSubpath.NavigationSplitView).toBe('function')
    expect('sheet' in stackSubpath).toBe(false)
    expect('NavigationLink' in stackSubpath).toBe(false)
  })

  it('exports link APIs from link subpath only', () => {
    expect(typeof linkSubpath.NavigationLink).toBe('function')
    expect(typeof linkSubpath.NavigationLinkBuilder).toBe('object')
    expect('NavigationStack' in linkSubpath).toBe(false)
    expect('sheet' in linkSubpath).toBe(false)
  })

  it('exports tab APIs from tabs subpath only', () => {
    expect(typeof tabsSubpath.SimpleTabView).toBe('function')
    expect(typeof tabsSubpath.TabView).toBe('function')
    expect('NavigationStack' in tabsSubpath).toBe(false)
    expect('sheet' in tabsSubpath).toBe(false)
  })

  it('exports path APIs from path subpath only', () => {
    expect(typeof pathSubpath.NavigationPath).toBe('function')
    expect(typeof pathSubpath.createNavigationPath).toBe('function')
    expect(typeof pathSubpath.ProgrammaticNavigationPath).toBe('function')
    expect('NavigationStack' in pathSubpath).toBe(false)
  })

  it('exports environment APIs from environment subpath only', () => {
    expect(typeof environmentSubpath.NavigationEnvironmentProvider).toBe(
      'function'
    )
    expect(typeof environmentSubpath.DocumentHead).toBe('function')
    expect('NavigationStack' in environmentSubpath).toBe(false)
    expect('sheet' in environmentSubpath).toBe(false)
  })

  it('exports modifier functions without stack/link runtime APIs', () => {
    expect(typeof modifiersSubpath.navigationTitle).toBe('function')
    expect(typeof modifiersSubpath.sheet).toBe('function')
    expect(typeof modifiersSubpath.searchable).toBe('function')
    expect('NavigationStack' in modifiersSubpath).toBe(false)
    expect('NavigationLink' in modifiersSubpath).toBe(false)
  })

  it('exposes explicit side-effectful modifier registration subpath', () => {
    expect(typeof modifiersRegisterSubpath.navigationTitle).toBe('function')
    expect(typeof modifiersRegisterSubpath.sheet).toBe('function')
  })
})
