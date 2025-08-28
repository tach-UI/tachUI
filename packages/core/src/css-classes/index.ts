/**
 * CSS Classes Enhancement - Public API
 * 
 * Exports the public API for CSS class integration system.
 */

// Types
export type { 
  CSSClassesProps,
  CSSClassProcessor,
  CSSClassConfig,
  ClassProcessingResult
} from './types'

// Core Manager
export { 
  CSSClassManager,
  cssClassManager,
  configureCSSClasses,
  getCSSClassConfig
} from './css-class-manager'

// Component Base
export { ComponentWithCSSClasses } from './component-base'

// Utilities
export { createCSSClassUtilities } from './utilities'

// DOM Integration
export type { DOMNodeWithClasses, CSSClassDOMApplicator } from './dom-integration'
export { 
  DOMCSSClassApplicator,
  domCSSClassApplicator,
  createDOMNodeWithClasses,
  extractCSSClasses
} from './dom-integration'

// Enhanced Renderer
export type { CSSClassRendererMixin } from './enhanced-renderer'
export {
  cssClassRendererMixin,
  enhanceRendererWithCSSClasses,
  createCSSClassDOMNode,
  hasCSSClassSupport
} from './enhanced-renderer'