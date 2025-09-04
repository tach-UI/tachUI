/**
 * CSS Classes Enhancement - Public API
 *
 * Exports the public API for CSS class integration system.
 */
export type {
  CSSClassesProps,
  CSSClassProcessor,
  CSSClassConfig,
  ClassProcessingResult,
} from './types'
export {
  CSSClassManager,
  cssClassManager,
  configureCSSClasses,
  getCSSClassConfig,
} from './css-class-manager'
export { ComponentWithCSSClasses } from './component-base'
export { createCSSClassUtilities } from './utilities'
export type {
  DOMNodeWithClasses,
  CSSClassDOMApplicator,
} from './dom-integration'
export {
  DOMCSSClassApplicator,
  domCSSClassApplicator,
  createDOMNodeWithClasses,
  extractCSSClasses,
} from './dom-integration'
export type { CSSClassRendererMixin } from './enhanced-renderer'
export {
  cssClassRendererMixin,
  enhanceRendererWithCSSClasses,
  createCSSClassDOMNode,
  hasCSSClassSupport,
} from './enhanced-renderer'
//# sourceMappingURL=index.d.ts.map
