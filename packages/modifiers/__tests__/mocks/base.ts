/**
 * Mock BaseModifier for testing without core dependencies
 */

export class BaseModifier<T = any> {
  readonly properties: T
  readonly type: string = 'base'
  readonly priority: number = 50

  constructor(properties: T) {
    this.properties = properties
  }

  applyStyles(element: any, styles: Record<string, any>) {
    if (element?.style) {
      Object.assign(element.style, styles)
    }
  }

  apply(node: any, context: any): any {
    return undefined
  }

  toCSSValue(value: number | string): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return String(value)
  }
}
