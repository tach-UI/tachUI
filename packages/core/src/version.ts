/**
 * Package Information
 *
 * Provides consistent package name and version exports across all TachUI packages
 */

import * as packageJson from '../package.json'

/**
 * The name of this TachUI package (from package.json)
 */
export const TACHUI_PACKAGE = (packageJson as any).name

/**
 * The version of this TachUI package (from package.json)
 */
export const TACHUI_PACKAGE_VERSION = (packageJson as any).version

/**
 * Legacy version export for backwards compatibility
 * @deprecated Use TACHUI_PACKAGE_VERSION instead
 */
export const VERSION = (packageJson as any).version
