import type { SymbolProps } from '../types.js'

/**
 * Accessibility utilities for Symbol component
 */
export class SymbolAccessibility {
  
  static generateAccessibilityProps(props: SymbolProps): Record<string, string> {
    const {
      accessibilityLabel,
      accessibilityDescription,
      isDecorative,
      name
    } = props
    
    if (isDecorative) {
      return {
        'aria-hidden': 'true',
        'focusable': 'false',
        'role': 'img'
      }
    }
    
    const nameValue = typeof name === 'function' ? name() : name
    const label = accessibilityLabel || this.generateDefaultLabel(nameValue)
    const accessibilityProps: Record<string, string> = {
      'role': 'img',
      'aria-label': label,
      'focusable': 'false'
    }
    
    if (accessibilityDescription) {
      const descId = `symbol-desc-${nameValue.replace(/[^a-zA-Z0-9]/g, '-')}`
      accessibilityProps['aria-describedby'] = descId
    }
    
    return accessibilityProps
  }
  
  private static generateDefaultLabel(iconName: string): string {
    // Convert kebab-case or camelCase to human readable
    return iconName
      .replace(/[-_]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase())
  }
  
  static generateDescription(props: SymbolProps): string | undefined {
    const { variant, effect, accessibilityDescription, name, isDecorative } = props
    
    // Don't generate descriptions for decorative symbols
    if (isDecorative) {
      return undefined
    }
    
    if (accessibilityDescription && accessibilityDescription.trim()) {
      return accessibilityDescription
    }
    
    const nameValue = typeof name === 'function' ? name() : name
    let description = this.generateDefaultLabel(nameValue)
    
    const variantValue = typeof variant === 'function' ? variant() : variant
    if (variantValue && variantValue !== 'none') {
      description += `, ${variantValue} variant`
    }
    
    const effectValue = typeof effect === 'function' ? effect() : effect
    if (effectValue && effectValue !== 'none') {
      description += `, ${effectValue} animation`
    }
    
    return description
  }
  
  static createDescriptionElement(props: SymbolProps): HTMLElement | null {
    // Return null for decorative symbols
    if (props.isDecorative) {
      return null
    }
    
    // Return null if accessibilityDescription is explicitly empty
    if (props.accessibilityDescription === '') {
      return null
    }
    
    const description = this.generateDescription(props)
    if (!description) {
      return null
    }
    
    const nameValue = typeof props.name === 'function' ? props.name() : props.name
    const descElement = document.createElement('div')
    descElement.id = `symbol-desc-${nameValue.replace(/[^a-zA-Z0-9]/g, '-')}`
    descElement.className = 'sr-only' // Screen reader only
    descElement.textContent = description
    descElement.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;'
    
    return descElement
  }
}

/**
 * WCAG compliance checks and utilities
 */
export class WCAGCompliance {
  
  static checkColorContrast(
    foreground: string, 
    background: string,
    level: 'AA' | 'AAA' = 'AA'
  ): { passes: boolean; ratio: number } {
    const ratio = this.calculateContrastRatio(foreground, background)
    const passes = level === 'AA' ? ratio >= 4.5 : ratio >= 7
    
    return { passes, ratio }
  }
  
  static ensureMinimumSize(size: number): boolean {
    // WCAG recommends minimum 44px touch targets
    return size >= 44
  }
  
  static validateAccessibilityLabel(label?: string): string[] {
    const issues: string[] = []
    
    if (!label || label.trim() === '') {
      issues.push('Missing accessibility label')
    }
    
    if (label && label.length > 100) {
      issues.push('Accessibility label too long (>100 characters)')
    }
    
    return issues
  }
  
  private static calculateContrastRatio(foreground: string, background: string): number {
    const fgLuminance = this.getLuminance(foreground)
    const bgLuminance = this.getLuminance(background)
    
    const lighter = Math.max(fgLuminance, bgLuminance)
    const darker = Math.min(fgLuminance, bgLuminance)
    
    return (lighter + 0.05) / (darker + 0.05)
  }
  
  private static getLuminance(color: string): number {
    // Convert color to RGB
    const rgb = this.hexToRgb(color)
    if (!rgb) return 0
    
    // Apply gamma correction
    const rsRGB = rgb.r / 255
    const gsRGB = rgb.g / 255
    const bsRGB = rgb.b / 255
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // Handle various color formats
    if (hex.startsWith('#')) {
      hex = hex.slice(1)
    }
    
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }
    
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}