/**
 * NavigationSplitView Component Implementation
 *
 * Two-column master/detail layout with responsive collapse behavior.
 */

import { h, mountComponentTree } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'
import { Button, HTML, Text, VStack, HStack } from '@tachui/primitives'

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
  content?: (
    context: NavigationSplitViewContext<TSelection>
  ) => ComponentInstance
  detail: (
    context: NavigationSplitViewContext<TSelection>
  ) => ComponentInstance
  breakpoint?: number
  backLabel?: string
  detailTitle?: string
  columnWidths?: {
    sidebar?: number | { min?: number; preferred?: number; max?: number }
    content?: number | { min?: number; preferred?: number; max?: number }
    detail?: number | { min?: number; preferred?: number; max?: number }
  }
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

/**
 * Read the current split-view context during synchronous render.
 *
 * The context is only available while NavigationSplitView is building
 * `sidebar`/`detail` content. Calling this from async/effect/event scopes
 * may return null.
 */
export function useNavigationSplitView<TSelection = unknown>():
  | NavigationSplitViewContext<TSelection>
  | null {
  const current = splitViewContextStack[splitViewContextStack.length - 1] ?? null
  return current as
    | NavigationSplitViewContext<TSelection>
    | null
}

let navigationSplitViewIdCounter = 0

function createMountHost(
  onHostReady: (host: HTMLElement | null) => void
): ComponentInstance {
  const host = HTML.div({}).build()
  const existingLifecycle = (host as any)._enhancedLifecycle ?? {}
  const existingOnDOMReady = existingLifecycle.onDOMReady as
    | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
    | undefined

  ;(host as any)._enhancedLifecycle = {
    ...existingLifecycle,
    onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
      const existingCleanup = existingOnDOMReady?.(elements, primary)
      onHostReady(primary instanceof HTMLElement ? primary : null)

      return () => {
        onHostReady(null)
        if (typeof existingCleanup === 'function') {
          existingCleanup()
        }
      }
    },
  }

  return host
}

export function NavigationSplitView<TSelection = unknown>(
  props: NavigationSplitViewProps<TSelection>
): ComponentInstance {
  const breakpoint = props.breakpoint ?? 768
  const threeColumnBreakpoint = 1024
  const backLabel = props.backLabel ?? 'Back'
  const detailTitle = props.detailTitle ?? 'Detail'
  const hasContentColumn = Boolean(props.content)
  let viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  let selectedValue: TSelection | null = null
  let mobileShowsDetail = false
  let mediumSidebarVisible = !hasContentColumn
  let hostElement: HTMLElement | null = null
  let shellCleanup: (() => void) | null = null
  let sidebarRegionCleanup: (() => void) | null = null
  let contentRegionCleanup: (() => void) | null = null
  let detailRegionCleanup: (() => void) | null = null
  let sidebarRegionHost: HTMLElement | null = null
  let contentRegionHost: HTMLElement | null = null
  let detailRegionHost: HTMLElement | null = null
  let resizeDebounceTimer: number | null = null
  let lastLayoutMode: 'single' | 'two' | 'three' =
    viewportWidth >= threeColumnBreakpoint
      ? 'three'
      : viewportWidth >= breakpoint
        ? 'two'
        : 'single'

  const resolveColumnWidth = (
    value?: number | { min?: number; preferred?: number; max?: number }
  ): { minWidth?: string; width?: string; maxWidth?: string } => {
    if (typeof value === 'number') {
      const px = `${value}px`
      return {
        minWidth: px,
        width: px,
        maxWidth: px,
      }
    }
    if (!value) {
      return {}
    }
    return {
      minWidth: typeof value.min === 'number' ? `${value.min}px` : undefined,
      width:
        typeof value.preferred === 'number' ? `${value.preferred}px` : undefined,
      maxWidth: typeof value.max === 'number' ? `${value.max}px` : undefined,
    }
  }

  const sidebarColumnWidth = resolveColumnWidth(props.columnWidths?.sidebar)
  const contentColumnWidth = resolveColumnWidth(props.columnWidths?.content)
  const detailColumnWidth = resolveColumnWidth(props.columnWidths?.detail)

  const splitContext: NavigationSplitViewContext<TSelection> = {
    selectDetail: (value: TSelection) => {
      selectedValue = value
      mobileShowsDetail = true
      const layoutMode = getLayoutMode()
      if (layoutMode === 'single') {
        renderShellIntoHost()
      } else if (layoutMode === 'two') {
        if (hasContentColumn) {
          mediumSidebarVisible = false
          renderShellIntoHost()
        } else {
          remountDetailRegion()
        }
      } else {
        remountDetailRegion()
      }
    },
    selectedValue: () => selectedValue,
    showSidebar: () => {
      const layoutMode = getLayoutMode()
      if (layoutMode === 'single') {
        mobileShowsDetail = false
        renderShellIntoHost()
      } else if (layoutMode === 'two') {
        mediumSidebarVisible = true
        renderShellIntoHost()
      }
    },
    showDetail: () => {
      const layoutMode = getLayoutMode()
      if (layoutMode === 'single') {
        mobileShowsDetail = true
        renderShellIntoHost()
      } else if (layoutMode === 'two') {
        if (hasContentColumn) {
          mediumSidebarVisible = false
          renderShellIntoHost()
        } else {
          remountDetailRegion()
        }
      } else {
        remountDetailRegion()
      }
    },
    isCollapsed: () => viewportWidth < breakpoint,
  }

  const getLayoutMode = (): 'single' | 'two' | 'three' => {
    if (viewportWidth >= threeColumnBreakpoint) {
      return hasContentColumn ? 'three' : 'two'
    }
    if (viewportWidth >= breakpoint) {
      return 'two'
    }
    return 'single'
  }

  const shouldRenderSidebar = (): boolean =>
    getLayoutMode() === 'three'
      ? true
      : getLayoutMode() === 'two'
        ? hasContentColumn
          ? mediumSidebarVisible
          : true
        : !mobileShowsDetail
  const shouldRenderContent = (): boolean =>
    Boolean(props.content) && getLayoutMode() === 'three'
  const shouldRenderDetail = (): boolean =>
    getLayoutMode() !== 'single' || mobileShowsDetail

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

  const buildContentRegion = (): ComponentInstance =>
    VStack({
      children: [
        withSplitViewContext(splitContext as NavigationSplitViewContext, () =>
          props.content!(splitContext)
        ),
      ],
      spacing: 0,
      alignment: 'leading',
    })
      .role('region')
      .ariaLabel('NavigationSplitView content')
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

  const remountSidebarRegion = (): void => {
    sidebarRegionCleanup?.()
    sidebarRegionCleanup = null
    if (!shouldRenderSidebar() || !sidebarRegionHost) {
      return
    }
    sidebarRegionCleanup = mountComponentTree(buildSidebarRegion(), sidebarRegionHost)
  }

  const remountDetailRegion = (): void => {
    detailRegionCleanup?.()
    detailRegionCleanup = null
    if (!shouldRenderDetail() || !detailRegionHost) {
      return
    }
    detailRegionCleanup = mountComponentTree(buildDetailRegion(), detailRegionHost)
  }

  const remountContentRegion = (): void => {
    contentRegionCleanup?.()
    contentRegionCleanup = null
    if (!shouldRenderContent() || !contentRegionHost) {
      return
    }
    contentRegionCleanup = mountComponentTree(buildContentRegion(), contentRegionHost)
  }

  const buildSidebarMountHost = (): ComponentInstance =>
    createMountHost(nextHost => {
      sidebarRegionHost = nextHost
      if (nextHost === null) {
        sidebarRegionCleanup?.()
        sidebarRegionCleanup = null
        return
      }
      remountSidebarRegion()
    })

  const buildDetailMountHost = (): ComponentInstance =>
    createMountHost(nextHost => {
      detailRegionHost = nextHost
      if (nextHost === null) {
        detailRegionCleanup?.()
        detailRegionCleanup = null
        return
      }
      remountDetailRegion()
    })

  const buildContentMountHost = (): ComponentInstance =>
    createMountHost(nextHost => {
      contentRegionHost = nextHost
      if (nextHost === null) {
        contentRegionCleanup?.()
        contentRegionCleanup = null
        return
      }
      remountContentRegion()
    })

  const buildLayoutShell = (): ComponentInstance => {
    const layoutMode = getLayoutMode()

    if (layoutMode === 'three') {
      return HStack({
        children: [
          VStack({
            children: [buildSidebarMountHost()],
            spacing: 0,
            alignment: 'leading',
          })
            .minWidth(sidebarColumnWidth.minWidth ?? '220px')
            .width(sidebarColumnWidth.width ?? '280px')
            .maxWidth(sidebarColumnWidth.maxWidth ?? '320px')
            .border({ width: 1, color: '#e5e7eb' })
            .build(),
          VStack({
            children: [buildContentMountHost()],
            spacing: 0,
            alignment: 'leading',
          })
            .minWidth(contentColumnWidth.minWidth ?? '240px')
            .width(contentColumnWidth.width ?? '320px')
            .maxWidth(contentColumnWidth.maxWidth ?? '420px')
            .border({ width: 1, color: '#e5e7eb' })
            .build(),
          VStack({
            children: [buildDetailMountHost()],
            spacing: 0,
            alignment: 'leading',
          })
            .minWidth(detailColumnWidth.minWidth ?? '0')
            .width(detailColumnWidth.width ?? '100%')
            .maxWidth(detailColumnWidth.maxWidth)
            .build(),
        ],
        spacing: 0,
        alignment: 'leading',
      })
        .role('group')
        .ariaLabel('NavigationSplitView three-column')
        .width('100%')
        .build()
    }

    if (layoutMode === 'two') {
      return HStack({
        children: [
          ...(shouldRenderSidebar()
            ? [
                VStack({
                  children: [buildSidebarMountHost()],
                  spacing: 0,
                  alignment: 'leading',
                })
                  .minWidth(sidebarColumnWidth.minWidth ?? '220px')
                  .width(sidebarColumnWidth.width ?? '280px')
                  .maxWidth(sidebarColumnWidth.maxWidth ?? '320px')
                  .border({ width: 1, color: '#e5e7eb' })
                  .build(),
              ]
            : []),
          VStack({
            children: [
              ...(hasContentColumn
                ? [
                    Button(
                      shouldRenderSidebar() ? 'Hide Sidebar' : 'Show Sidebar',
                      () => {
                        mediumSidebarVisible = !mediumSidebarVisible
                        renderShellIntoHost()
                      }
                    )
                      .backgroundColor('transparent')
                      .foregroundColor('#007AFF')
                      .border(0)
                      .padding({ top: 8, right: 12, bottom: 8, left: 12 })
                      .build(),
                  ]
                : []),
              buildDetailMountHost(),
            ],
            spacing: 0,
            alignment: 'leading',
          })
            .minWidth(detailColumnWidth.minWidth ?? '0')
            .width(detailColumnWidth.width ?? '100%')
            .maxWidth(detailColumnWidth.maxWidth)
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
      return VStack({
        children: [buildSidebarMountHost()],
        spacing: 0,
        alignment: 'leading',
      })
        .role('region')
        .ariaLabel('NavigationSplitView sidebar')
        .width('100%')
        .build()
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
        buildDetailMountHost(),
      ],
      spacing: 8,
      alignment: 'leading',
    })
      .role('region')
      .ariaLabel('NavigationSplitView detail')
      .width('100%')
      .build()
  }

  const renderShellIntoHost = (): void => {
    if (!hostElement) {
      return
    }

    sidebarRegionCleanup?.()
    sidebarRegionCleanup = null
    contentRegionCleanup?.()
    contentRegionCleanup = null
    detailRegionCleanup?.()
    detailRegionCleanup = null
    shellCleanup?.()
    shellCleanup = mountComponentTree(buildLayoutShell(), hostElement)
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
      renderShellIntoHost()

      const onResize = () => {
        if (resizeDebounceTimer !== null) {
          window.clearTimeout(resizeDebounceTimer)
        }

        resizeDebounceTimer = window.setTimeout(() => {
          viewportWidth = window.innerWidth
          const nextLayoutMode = getLayoutMode()
          if (nextLayoutMode !== lastLayoutMode) {
            if (nextLayoutMode === 'two') {
              mediumSidebarVisible = !hasContentColumn
            }
            lastLayoutMode = nextLayoutMode
            renderShellIntoHost()
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
        sidebarRegionCleanup?.()
        sidebarRegionCleanup = null
        contentRegionCleanup?.()
        contentRegionCleanup = null
        detailRegionCleanup?.()
        detailRegionCleanup = null
        shellCleanup?.()
        shellCleanup = null
        sidebarRegionHost = null
        contentRegionHost = null
        detailRegionHost = null
        hostElement = null
      }
    },
  }

  ;(component as any)._navigationSplitView = {
    type: 'NavigationSplitView',
    breakpoint,
    threeColumnBreakpoint,
    context: splitContext,
    toggleSidebarVisibility: () => {
      if (getLayoutMode() === 'two') {
        mediumSidebarVisible = !mediumSidebarVisible
        renderShellIntoHost()
      }
    },
  }

  return component
}
