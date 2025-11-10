/**
 * Package Information
 *
 * Provides consistent package name and version exports for @tachui/mobile.
 */

import * as packageJson from '../package.json'

export const TACHUI_PACKAGE = (packageJson as any).name
export const TACHUI_PACKAGE_VERSION = (packageJson as any).version
