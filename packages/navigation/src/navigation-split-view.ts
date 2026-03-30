/**
 * NavigationSplitView Component Implementation
 *
 * Two-column master/detail layout with responsive collapse behavior.
 */

import { h, mountComponentTree } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'
import { Button, Text, VStack, HStack } from '@tachui/primitives'

export interface NavigationSplitViewContext<TSelection = unknown> {
  selectDetail: (value: TSelection) => void
  selectedValue: () => TSelection | null
  showSidebar: () => void
  showDetail: () => void
  isCollapsed: () => boolean
}

export interface NavigationSplitViewProps<TSelection = unknown> {
  sidebar: (
    context: NavigationSplitViewContext<TSelection>
  ) => ComponentInstance
  detail: (
    context: NavigationSplitViewContext<TSelection>
  ) => ComponentInstance
  breakpoint?: number
  backLabel?: string
  detailTitle?: string
}

const splitViewContextStack: NavigationSplitViewContext[] = []

function withSplitViewContext<T>(
  context: NavigationSplitViewContext,
  fn: () => T
): T {
  splitViewContextStack.push(context)
  try {
    return fn()
  } finally {
    splitViewContextStack.pop()
  }
}

export function useNavigationSplitView<TSelection = unknown>():
  | NavigationSplitViewContext<TSelection>
  | null {
  const current = splitViewContextStack[splitViewContextStack.length - 1] ?? null
  return current as
    | NavigationSplitViewContext<TSelection>
    | null
}

let navigationSplitViewIdCounter = 0

export function NavigationSplitView<TSelection = unknown>(
  props: NavigationSplitViewProps<TSelection>
): ComponentInstance {
  const breakpoint = props.breakpoint ?? 768
  const backLabel = props.backLabel ?? 'Back'
  const detailTitle = props.detailTitle ?? 'Detail'
  let viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  let selectedValue: TSelection | null = null
  let mobileShowsDetail = false
  let hostElement: HTMLElement | null = null
  let mountedContentCleanup: (() => void) | null = null
  let resizeDebounceTimer: number | null = null
  let lastCollapsedState = viewportWidth < breakpoint

  const renderIntoHost = () => {
    if (!hostElement) {
      return
    }

    mountedContentCleanup?.()
    mountedContentCleanup = mountComponentTree(buildLayout(), hostElement)
  }

  const splitContext: NavigationSplitViewContext<TSelection> = {
    selectDetail: (value: TSelection) => {
      selectedValue = value
      mobileShowsDetail = true
      renderIntoHost()
    },
    selectedValue: () => selectedValue,
    showSidebar: () => {
      mobileShowsDetail = false
      renderIntoHost()
    },
    showDetail: () => {
      mobileShowsDetail = true
      renderIntoHost()
    },
    isCollapsed: () => viewportWidth < breakpoint,
  }

  const buildSidebarRegion = (): ComponentInstance =>
    VStack({
      children: [
        withSplitViewContext(splitContext as NavigationSplitViewContext, () =>
          props.sidebar(splitContext)
        ),
      ],
      spacing: 0,
      alignment: 'leading',
    })
      .role('region')
      .ariaLabel('NavigationSplitView sidebar')
      .width('100%')
      .build()

  const buildDetailRegion = (): ComponentInstance =>
    VStack({
      children: [
        withSplitViewContext(splitContext as NavigationSplitViewContext, () =>
          props.detail(splitContext)
        ),
      ],
      spacing: 0,
      alignment: 'leading',
    })
      .role('region')
      .ariaLabel('NavigationSplitView detail')
      .width('100%')
      .build()

  const buildLayout = (): ComponentInstance => {
    if (!splitContext.isCollapsed()) {
      return HStack({
        children: [
          VStack({
            children: [buildSidebarRegion()],
            spacing: 0,
            alignment: 'leading',
          })
            .width(280)
            .maxWidth(320)
            .border({ width: 1, color: '#e5e7eb' })
            .build(),
          VStack({
            children: [buildDetailRegion()],
            spacing: 0,
            alignment: 'leading',
          })
            .minWidth(0)
            .width('100%')
            .build(),
        ],
        spacing: 0,
        alignment: 'leading',
      })
        .role('group')
        .ariaLabel('NavigationSplitView two-column')
        .width('100%')
        .build()
    }

    if (!mobileShowsDetail) {
      return buildSidebarRegion()
    }

    return VStack({
      children: [
        Button(backLabel, () => {
          splitContext.showSidebar()
        })
          .backgroundColor('transparent')
          .foregroundColor('#007AFF')
          .border(0)
          .padding({ top: 8, right: 12, bottom: 8, left: 12 })
          .build(),
        Text(detailTitle)
          .fontWeight('600')
          .padding({ bottom: 8 })
          .build(),
        buildDetailRegion(),
      ],
      spacing: 8,
      alignment: 'leading',
    })
      .role('region')
      .ariaLabel('NavigationSplitView detail')
      .width('100%')
      .build()
  }

  const component = {
    type: 'component',
    id: `nav-split-${navigationSplitViewIdCounter++}`,
    mounted: false,
    cleanup: [],
    props: {},
    render: () =>
      h('div', {
        style: {
          width: '100%',
        },
      }),
  } as unknown as ComponentInstance

  ;(component as any)._enhancedLifecycle = {
    onDOMReady: (_elements: Map<string, Element>, primary?: Element) => {
      if (!(primary instanceof HTMLElement)) {
        return undefined
      }

      hostElement = primary
      renderIntoHost()

      const onResize = () => {
        if (resizeDebounceTimer !== null) {
          window.clearTimeout(resizeDebounceTimer)
        }

        resizeDebounceTimer = window.setTimeout(() => {
          viewportWidth = window.innerWidth
          const nextCollapsedState = viewportWidth < breakpoint
          if (nextCollapsedState !== lastCollapsedState) {
            lastCollapsedState = nextCollapsedState
            renderIntoHost()
          }
          resizeDebounceTimer = null
        }, 100)
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', onResize)
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', onResize)
          if (resizeDebounceTimer !== null) {
            window.clearTimeout(resizeDebounceTimer)
            resizeDebounceTimer = null
          }
        }
        mountedContentCleanup?.()
        mountedContentCleanup = null
        hostElement = null
      }
    },
  }

  ;(component as any)._navigationSplitView = {
    type: 'NavigationSplitView',
    breakpoint,
    context: splitContext,
  }

  return component
}
