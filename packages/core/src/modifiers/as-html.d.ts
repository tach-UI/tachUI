/**
 * AsHTML Modifier - Renders Text component content as HTML
 *
 * Security-first design with:
 * - Text component restriction only
 * - Built-in basic sanitization by default
 * - Non-reactive for performance
 * - Clear error messages for misuse
 */
import { BaseModifier } from './base'
import type { DOMNode, ComponentInstance } from '../runtime/types'
import type { ModifierContext } from './types'
import { type BasicSanitizerOptions } from './basic-sanitizer'
export interface AsHTMLOptions extends BasicSanitizerOptions {
  /** Skip basic sanitization (use with extreme caution) */
  skipSanitizer?: boolean
  /** Custom sanitization function */
  customSanitizer?: (html: string) => string
  /** Development-only validation */
  __devModeValidate?: boolean
  /** Suppress development warnings */
  __suppressWarnings?: boolean
}
/**
 * Text component interface for type safety
 */
export interface TextComponent extends ComponentInstance {
  readonly __tachui_component_type: 'Text'
  content: string
}
export declare class AsHTMLModifier extends BaseModifier<AsHTMLOptions> {
  readonly type = 'asHTML'
  readonly priority = 25
  constructor(options?: AsHTMLOptions)
  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined
  private isTextComponent
  private getTextComponentContent
  private sanitizeHTML
  private validateContent
}
/**
 * Create an asHTML modifier for rendering HTML content
 *
 * By default, applies basic sanitization to remove common XSS vectors.
 * Use { skipSanitizer: true } to bypass sanitization (dangerous).
 *
 * The modifier treats the component's content as HTML instead of plain text.
 * SECURITY: Only works on Text components.
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // Safe: Basic sanitization applied
 * Text('<p>Hello <strong>world</strong></p>').modifier.asHTML().build()
 *
 * // Dangerous: Skip sanitization
 * Text(serverTemplate).modifier.asHTML({ skipSanitizer: true }).build()
 *
 * // Custom sanitization
 * Text(content).modifier.asHTML({ customSanitizer: DOMPurify.sanitize }).build()
 * ```
 */
export declare function asHTML(options?: AsHTMLOptions): AsHTMLModifier
//# sourceMappingURL=as-html.d.ts.map
