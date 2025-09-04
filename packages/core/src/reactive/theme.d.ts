/**
 * Theme Management System for TachUI
 *
 * Provides reactive theme management with light/dark mode support.
 */
import { type Computed } from './computed'
export type Theme = 'light' | 'dark' | 'system'
export declare function getCurrentTheme(): Theme
export declare function setTheme(theme: Theme): void
export declare function getThemeSignal(): Computed<'light' | 'dark'>
export declare function detectSystemTheme(): 'light' | 'dark'
//# sourceMappingURL=theme.d.ts.map
