/**
 * Enhanced ScrollView Component (Phase 5.5)
 *
 * SwiftUI-inspired ScrollView component with performance optimization,
 * smooth scrolling, pull-to-refresh, and advanced scroll handling.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, createSignal, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps } from '@tachui/core'
import { withModifiers } from '@tachui/core'

/**
 * Scroll direction
 */
export type ScrollDirection = 'vertical' | 'horizontal' | 'both'

/**
 * Scroll behavior for programmatic scrolling
 */
export type ScrollBehavior = 'auto' | 'smooth' | 'instant'

/**
 * Content offset position
 */
export interface ContentOffset {
  x: number
  y: number
}

/**
 * Scroll edge detection
 */
export interface ScrollEdges {
  top: boolean
  bottom: boolean
  left: boolean
  right: boolean
}

/**
 * Pull-to-refresh state
 */
export type PullToRefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing'

/**
 * Scroll event information
 */
export interface ScrollEventInfo {
  offset: ContentOffset
  velocity: ContentOffset
  contentSize: { width: number; height: number }
  containerSize: { width: number; height: number }
  edges: ScrollEdges
}

/**
 * ScrollView component properties
 */
export interface ScrollViewProps extends ComponentProps {
  // Content
  children?: ComponentInstance[]

  // Scroll behavior
  direction?: ScrollDirection
  showsScrollIndicator?: boolean
  bounces?: boolean
  scrollEnabled?: boolean | Signal<boolean>

  // Content sizing
  contentOffset?: Signal<ContentOffset>
  contentSize?: Signal<{ width: number; height: number }>

  // Pull to refresh
  refreshControl?: {
    enabled: boolean
    onRefresh: () => Promise<void>
    refreshing?: Signal<boolean>
    threshold?: number
    tintColor?: string
  }

  // Scroll events
  onScroll?: (info: ScrollEventInfo) => void
  onScrollBegin?: () => void
  onScrollEnd?: () => void
  onReachTop?: () => void
  onReachBottom?: () => void
  onReachLeft?: () => void
  onReachRight?: () => void

  // Performance
  scrollEventThrottle?: number
  decelerationRate?: 'normal' | 'fast' | number

  // Content insets
  contentInset?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }

  // Snap behavior
  pagingEnabled?: boolean
  snapToAlignment?: 'start' | 'center' | 'end'
  snapToInterval?: number

  // Keyboard behavior
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive'

  // Accessibility
  accessibilityLabel?: string
  accessibilityRole?: string
}

/**
 * Enhanced ScrollView component class
 */
export class EnhancedScrollView implements ComponentInstance<ScrollViewProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []

  private scrollElement: HTMLElement | null = null
  public contentOffsetSignal: () => ContentOffset
  private setContentOffset: (offset: ContentOffset) => void
  public contentSizeSignal: () => { width: number; height: number }
  private setContentSize: (size: { width: number; height: number }) => void
  private setIsScrolling: (scrolling: boolean) => void
  private pullToRefreshStateSignal: () => PullToRefreshState
  private setPullToRefreshState: (state: PullToRefreshState) => void

  // Performance tracking
  private scrollEventThrottle: number
  private lastScrollTime = 0
  private scrollVelocity: ContentOffset = { x: 0, y: 0 }
  private lastScrollOffset: ContentOffset = { x: 0, y: 0 }

  // Pull to refresh tracking
  private pullStartY = 0
  private isPulling = false

  constructor(public props: ScrollViewProps) {
    this.id = `scrollview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.scrollEventThrottle = props.scrollEventThrottle || 16 // 60fps default

    // Create reactive signals
    const [contentOffsetSignal, setContentOffset] = createSignal<ContentOffset>(
      { x: 0, y: 0 }
    )
    this.contentOffsetSignal = contentOffsetSignal
    this.setContentOffset = setContentOffset

    const [contentSizeSignal, setContentSize] = createSignal({
      width: 0,
      height: 0,
    })
    this.contentSizeSignal = contentSizeSignal
    this.setContentSize = setContentSize

    const [, setIsScrolling] = createSignal(false)
    this.setIsScrolling = setIsScrolling

    const [pullToRefreshStateSignal, setPullToRefreshState] =
      createSignal<PullToRefreshState>('idle')
    this.pullToRefreshStateSignal = pullToRefreshStateSignal
    this.setPullToRefreshState = setPullToRefreshState

    // Connect external content offset signal
    if (props.contentOffset && isSignal(props.contentOffset)) {
      // Set initial value
      this.setContentOffset(props.contentOffset())

      const effect = createEffect(() => {
        if (props.contentOffset && isSignal(props.contentOffset)) {
          this.setContentOffset(props.contentOffset())
        }
      })
      this.cleanup.push(() => effect.dispose())
    }

    // Connect external content size signal
    if (props.contentSize && isSignal(props.contentSize)) {
      // Set initial value
      this.setContentSize(props.contentSize())

      const effect = createEffect(() => {
        if (props.contentSize && isSignal(props.contentSize)) {
          this.setContentSize(props.contentSize())
        }
      })
      this.cleanup.push(() => effect.dispose())
    }
  }

  /**
   * Calculate scroll velocity
   */
  private calculateVelocity(
    currentOffset: ContentOffset,
    deltaTime: number
  ): ContentOffset {
    const deltaX = currentOffset.x - this.lastScrollOffset.x
    const deltaY = currentOffset.y - this.lastScrollOffset.y

    return {
      x: deltaTime > 0 ? deltaX / deltaTime : 0,
      y: deltaTime > 0 ? deltaY / deltaTime : 0,
    }
  }

  /**
   * Detect scroll edges
   */
  private detectScrollEdges(): ScrollEdges {
    if (!this.scrollElement) {
      return { top: false, bottom: false, left: false, right: false }
    }

    const {
      scrollTop,
      scrollLeft,
      scrollHeight,
      scrollWidth,
      clientHeight,
      clientWidth,
    } = this.scrollElement

    return {
      top: scrollTop <= 0,
      bottom: scrollTop + clientHeight >= scrollHeight - 1,
      left: scrollLeft <= 0,
      right: scrollLeft + clientWidth >= scrollWidth - 1,
    }
  }

  /**
   * Handle scroll events
   */
  private handleScroll = (_event: Event) => {
    if (!this.scrollElement) return

    const now = performance.now()
    const deltaTime = now - this.lastScrollTime

    // Throttle scroll events for performance
    if (deltaTime < this.scrollEventThrottle) return

    const currentOffset: ContentOffset = {
      x: this.scrollElement.scrollLeft,
      y: this.scrollElement.scrollTop,
    }

    // Calculate velocity
    this.scrollVelocity = this.calculateVelocity(currentOffset, deltaTime)

    // Update signals
    this.setContentOffset(currentOffset)
    this.setContentSize({
      width: this.scrollElement.scrollWidth,
      height: this.scrollElement.scrollHeight,
    })

    // Detect edges
    const edges = this.detectScrollEdges()

    // Create scroll event info
    const scrollInfo: ScrollEventInfo = {
      offset: currentOffset,
      velocity: this.scrollVelocity,
      contentSize: {
        width: this.scrollElement.scrollWidth,
        height: this.scrollElement.scrollHeight,
      },
      containerSize: {
        width: this.scrollElement.clientWidth,
        height: this.scrollElement.clientHeight,
      },
      edges,
    }

    // Call scroll callbacks
    if (this.props.onScroll) {
      this.props.onScroll(scrollInfo)
    }

    // Edge callbacks
    if (edges.top && this.props.onReachTop) this.props.onReachTop()
    if (edges.bottom && this.props.onReachBottom) this.props.onReachBottom()
    if (edges.left && this.props.onReachLeft) this.props.onReachLeft()
    if (edges.right && this.props.onReachRight) this.props.onReachRight()

    // Update tracking variables
    this.lastScrollOffset = currentOffset
    this.lastScrollTime = now
  }

  /**
   * Handle scroll start
   */
  private handleScrollStart = () => {
    this.setIsScrolling(true)
    if (this.props.onScrollBegin) {
      this.props.onScrollBegin()
    }
  }

  /**
   * Handle scroll end
   */
  private handleScrollEnd = () => {
    this.setIsScrolling(false)
    if (this.props.onScrollEnd) {
      this.props.onScrollEnd()
    }
  }

  /**
   * Handle touch start for pull to refresh
   */
  private handleTouchStart = (event: TouchEvent) => {
    if (!this.props.refreshControl?.enabled) return

    this.pullStartY = event.touches[0].clientY
    this.isPulling = false
  }

  /**
   * Handle touch move for pull to refresh
   */
  private handleTouchMove = (event: TouchEvent) => {
    if (!this.props.refreshControl?.enabled || !this.scrollElement) return

    const currentY = event.touches[0].clientY
    const deltaY = currentY - this.pullStartY
    const threshold = this.props.refreshControl.threshold || 80

    // Only trigger pull to refresh at the top
    if (this.scrollElement.scrollTop <= 0 && deltaY > 0) {
      this.isPulling = true

      if (deltaY > threshold) {
        this.setPullToRefreshState('ready')
      } else {
        this.setPullToRefreshState('pulling')
      }
    }
  }

  /**
   * Handle touch end for pull to refresh
   */
  private handleTouchEnd = async () => {
    if (!this.props.refreshControl?.enabled || !this.isPulling) return

    const state = this.pullToRefreshStateSignal()

    if (state === 'ready') {
      this.setPullToRefreshState('refreshing')

      try {
        await this.props.refreshControl.onRefresh()
      } catch (error) {
        console.error('Pull to refresh error:', error)
      } finally {
        this.setPullToRefreshState('idle')
      }
    } else {
      this.setPullToRefreshState('idle')
    }

    this.isPulling = false
  }

  /**
   * Set up scroll event handlers
   */
  private setupScrollHandlers(element: HTMLElement): void {
    let scrollTimer: NodeJS.Timeout

    const throttledScrollStart = () => {
      clearTimeout(scrollTimer)
      this.handleScrollStart()
    }

    const throttledScrollEnd = () => {
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        this.handleScrollEnd()
      }, 150) // 150ms after scroll stops
    }

    const scrollHandler = (event: Event) => {
      throttledScrollStart()
      this.handleScroll(event)
      throttledScrollEnd()
    }

    element.addEventListener('scroll', scrollHandler, { passive: true })
    element.addEventListener('touchstart', this.handleTouchStart, {
      passive: true,
    })
    element.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    })
    element.addEventListener('touchend', this.handleTouchEnd, { passive: true })

    this.cleanup.push(() => {
      element.removeEventListener('scroll', scrollHandler)
      element.removeEventListener('touchstart', this.handleTouchStart)
      element.removeEventListener('touchmove', this.handleTouchMove)
      element.removeEventListener('touchend', this.handleTouchEnd)
      clearTimeout(scrollTimer)
    })
  }

  /**
   * Get overflow styles based on direction
   */
  private getOverflowStyles(
    direction: ScrollDirection
  ): Record<string, string> {
    switch (direction) {
      case 'vertical':
        return {
          overflowX: 'hidden',
          overflowY: 'auto',
        }
      case 'horizontal':
        return {
          overflowX: 'auto',
          overflowY: 'hidden',
        }
      case 'both':
        return {
          overflow: 'auto',
        }
      default:
        return {
          overflowX: 'hidden',
          overflowY: 'auto',
        }
    }
  }

  /**
   * Apply additional scroll view styling (position and overflow already set in initial render)
   */
  private applyScrollViewStyles(element: HTMLElement): void {
    const { showsScrollIndicator = true, bounces = true } = this.props

    // Scroll indicator visibility
    if (!showsScrollIndicator) {
      element.style.scrollbarWidth = 'none' // Firefox
      ;(element.style as any).msOverflowStyle = 'none' // IE/Edge

      // Webkit browsers
      const style = document.createElement('style')
      style.textContent = `
        #${element.id}::-webkit-scrollbar {
          display: none;
        }
      `
      document.head.appendChild(style)

      this.cleanup.push(() => {
        document.head.removeChild(style)
      })
    }

    // Bounce behavior (webkit-specific)
    if (bounces) {
      ;(element.style as any).webkitOverflowScrolling = 'touch'
    } else {
      element.style.overscrollBehavior = 'none'
    }

    // Smooth scrolling
    element.style.scrollBehavior = 'smooth'
  }

  /**
   * Apply content insets
   */
  private applyContentInsets(contentElement: HTMLElement): void {
    const { contentInset } = this.props

    if (contentInset) {
      const { top = 0, bottom = 0, left = 0, right = 0 } = contentInset
      contentElement.style.padding = `${top}px ${right}px ${bottom}px ${left}px`
    }
  }

  /**
   * Create pull to refresh indicator
   */
  private createPullToRefreshIndicator(): ComponentInstance | null {
    if (!this.props.refreshControl?.enabled) return null

    const state = this.pullToRefreshStateSignal()
    const tintColor = this.props.refreshControl.tintColor || '#007AFF'

    let content = ''
    switch (state) {
      case 'pulling':
        content = '↓ Pull to refresh'
        break
      case 'ready':
        content = '↑ Release to refresh'
        break
      case 'refreshing':
        content = '⟳ Refreshing...'
        break
      default:
        content = ''
    }

    if (!content) return null

    return {
      type: 'component',
      id: `${this.id}-refresh`,
      mounted: false,
      cleanup: [],
      props: {},
      render: () => [
        h(
          'div',
          {
            style: {
              position: 'absolute',
              top: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '20px',
              color: tintColor,
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              opacity: state === 'idle' ? 0 : 1,
            },
          },
          content
        ),
      ],
    }
  }

  /**
   * Scroll to specific position
   */
  public scrollTo(
    offset: Partial<ContentOffset>,
    behavior: ScrollBehavior = 'smooth'
  ): void {
    if (!this.scrollElement) return

    const scrollOptions: ScrollToOptions = { behavior }
    if (offset.x !== undefined) scrollOptions.left = offset.x
    if (offset.y !== undefined) scrollOptions.top = offset.y

    this.scrollElement.scrollTo(scrollOptions)
  }

  /**
   * Scroll to top
   */
  public scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
    this.scrollTo({ x: 0, y: 0 }, behavior)
  }

  /**
   * Scroll to bottom
   */
  public scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    if (!this.scrollElement) return

    this.scrollTo(
      {
        x: 0,
        y: this.scrollElement.scrollHeight - this.scrollElement.clientHeight,
      },
      behavior
    )
  }

  /**
   * Render the scroll view component
   */
  render() {
    const { children = [], scrollEnabled = true } = this.props

    // Create content container
    const contentContainer = h(
      'div',
      {
        class: 'tachui-scrollview-content',
        style: {
          minHeight: '100%',
          minWidth: '100%',
        },
      },
      ...children.flatMap(child => child.render())
    )

    // Create pull to refresh indicator
    const refreshIndicator = this.createPullToRefreshIndicator()

    // Create scroll container children
    const scrollChildren: any[] = []

    // Add refresh indicator if present
    if (refreshIndicator) {
      const result = refreshIndicator.render()
      const arr = Array.isArray(result) ? result : [result]
      scrollChildren.push(...arr.filter((x: any) => x))
    }

    // Add content container
    scrollChildren.push(contentContainer)

    // Create scroll container with default overflow styles
    const { direction = 'vertical' } = this.props

    // Determine overflow styles based on direction
    const overflowStyles = this.getOverflowStyles(direction)

    const scrollContainer = h(
      'div',
      {
        id: this.id,
        class: 'tachui-scrollview',
        style: {
          height: '100%',
          width: '100%',
          position: 'relative',
          ...overflowStyles,
        },
      },
      ...scrollChildren
    )

    // Apply styles and event handlers when element is created
    if (scrollContainer.element) {
      const element = scrollContainer.element as HTMLElement
      this.scrollElement = element

      this.applyScrollViewStyles(element)
      this.setupScrollHandlers(element)

      // Apply content insets to content container
      if (contentContainer.element) {
        this.applyContentInsets(contentContainer.element as HTMLElement)
      }

      // Handle scroll enabled state
      const updateScrollEnabled = () => {
        const enabled = isSignal(scrollEnabled)
          ? scrollEnabled()
          : scrollEnabled
        element.style.overflow = enabled ? 'auto' : 'hidden'
        element.style.pointerEvents = enabled ? 'auto' : 'none'
      }

      if (isSignal(scrollEnabled)) {
        const effect = createEffect(updateScrollEnabled)
        this.cleanup.push(() => effect.dispose())
      } else {
        updateScrollEnabled()
      }
    }

    return [scrollContainer]
  }
}

/**
 * Create enhanced ScrollView component with modifier support
 */
export function ScrollView(
  props: ScrollViewProps = {}
): ModifiableComponent<ScrollViewProps> & {
  modifier: ModifierBuilder<ModifiableComponent<ScrollViewProps>>
} {
  const component = new EnhancedScrollView(props)
  return withModifiers(component)
}

/**
 * ScrollView utility functions
 */
export const ScrollViewUtils = {
  /**
   * Create a scroll view with pull to refresh
   */
  withRefresh(
    children: ComponentInstance[],
    onRefresh: () => Promise<void>,
    options: Partial<ScrollViewProps['refreshControl']> = {}
  ): ModifiableComponent<ScrollViewProps> & {
    modifier: ModifierBuilder<ModifiableComponent<ScrollViewProps>>
  } {
    return ScrollView({
      children,
      refreshControl: {
        enabled: true,
        onRefresh,
        ...options,
      },
    })
  },

  /**
   * Create a horizontal scroll view
   */
  horizontal(
    children: ComponentInstance[],
    props: Omit<ScrollViewProps, 'children' | 'direction'> = {}
  ): ModifiableComponent<ScrollViewProps> & {
    modifier: ModifierBuilder<ModifiableComponent<ScrollViewProps>>
  } {
    return ScrollView({
      ...props,
      children,
      direction: 'horizontal',
    })
  },

  /**
   * Create a paged scroll view
   */
  paged(
    children: ComponentInstance[],
    props: Omit<ScrollViewProps, 'children' | 'pagingEnabled'> = {}
  ): ModifiableComponent<ScrollViewProps> & {
    modifier: ModifierBuilder<ModifiableComponent<ScrollViewProps>>
  } {
    return ScrollView({
      ...props,
      children,
      pagingEnabled: true,
    })
  },
}
