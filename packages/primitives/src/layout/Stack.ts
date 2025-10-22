/**
 * Layout Stack Components
 *
 * Thin wrappers around the core layout stack implementations to maintain the
 * @tachui/primitives public surface while benefiting from the shared cloning
 * and proxy infrastructure that lives in @tachui/core.
 */

import { withModifiers } from '@tachui/core'
import {
  Layout as CoreLayout,
  LayoutComponent as CoreLayoutComponent,
  type VStackLayoutProps as CoreVStackProps,
  type HStackLayoutProps as CoreHStackProps,
  type ZStackLayoutProps as CoreZStackProps,
} from '@tachui/core/components'

export { withModifiers }
export { CoreLayoutComponent as LayoutComponent }

export type VStackProps = CoreVStackProps
export type HStackProps = CoreHStackProps
export type ZStackProps = CoreZStackProps

export function VStack(props: VStackProps = {}) {
  return CoreLayout.VStack(props)
}

export function HStack(props: HStackProps = {}) {
  return CoreLayout.HStack(props)
}

export function ZStack(props: ZStackProps = {}) {
  return CoreLayout.ZStack(props)
}
