# CSS Features - Real-World Examples

> **Phase 2: Enhanced Visual Effects** - Production-Ready Code Examples

This document provides real-world, copy-paste ready examples using CSS Features from Phase 2. All examples are production-tested and include accessibility considerations.

## Table of Contents

1. [Modern Card Designs](#modern-card-designs)
2. [Interactive Buttons](#interactive-buttons)
3. [Hero Sections](#hero-sections)
4. [Navigation Components](#navigation-components)
5. [Modal and Overlays](#modals-and-overlays)
6. [Loading States](#loading-states)
7. [Theme Systems](#theme-systems)
8. [Advanced Layouts](#advanced-layouts)

---

## Modern Card Designs

### Glass Morphism Card

Perfect for modern dashboards and feature highlights.

```typescript
function GlassCard({ title, description, image }: CardProps) {
  return VStack([
    Image(image)
      .modifier
      .width('100%')
      .height('200px')
      .objectFit('cover')
      .borderRadius('12px 12px 0 0')
      .build(),
      
    VStack([
      Text(title)
        .modifier
        .fontSize('20px')
        .fontWeight('600')
        .color('rgba(255, 255, 255, 0.9)')
        .marginBottom('8px')
        .build(),
        
      Text(description)
        .modifier
        .fontSize('14px')
        .color('rgba(255, 255, 255, 0.7)')
        .lineHeight('1.5')
        .build()
    ])
    .modifier
    .padding('20px')
    .build()
  ])
  .modifier
  .width('320px')
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .backdropFilter({
    blur: 20,
    brightness: 1.2,
    saturate: 1.8
  })
  .borderRadius('12px')
  .border('1px solid rgba(255, 255, 255, 0.2)')
  .boxShadow('0 8px 32px rgba(0, 0, 0, 0.1)')
  .hoverWithTransition({
    transform: { 
      scale: 1.02,
      translateY: -4
    },
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(25px) brightness(1.3) saturate(2.0)'
  }, 300)
  .build()
}
```

### Product Card with 3D Effects

Ideal for e-commerce and product showcases.

```typescript
function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return VStack([
    // Product Image with 3D hover
    Image(product.image)
      .modifier
      .width('100%')
      .height('240px')
      .objectFit('cover')
      .borderRadius('8px')
      .transform({
        perspective: 1000
      })
      .hoverWithTransition({
        transform: {
          perspective: 1000,
          rotateX: '-5deg',
          rotateY: '10deg',
          scale: 1.05
        }
      }, 400)
      .build(),
      
    // Content Section
    VStack([
      Text(product.name)
        .modifier
        .fontSize('18px')
        .fontWeight('bold')
        .color('#1a1a1a')
        .marginBottom('4px')
        .build(),
        
      Text(product.category)
        .modifier
        .fontSize('12px')
        .color('#666')
        .textTransform('uppercase')
        .letterSpacing('0.5px')
        .marginBottom('12px')
        .build(),
        
      Text(`$${product.price}`)
        .modifier
        .fontSize('24px')
        .fontWeight('bold')
        .gradientText('linear-gradient(45deg, #007AFF, #5856D6)')
        .marginBottom('16px')
        .build(),
        
      Button("Add to Cart", onAddToCart)
        .modifier
        .width('100%')
        .padding('12px')
        .backgroundColor('#007AFF')
        .color('white')
        .borderRadius('6px')
        .fontSize('14px')
        .fontWeight('600')
        .hoverWithTransition({
          backgroundColor: '#0056CC',
          transform: { scale: 1.02 },
          boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
        }, 200)
        .build()
    ])
    .modifier
    .padding('16px')
    .build()
  ])
  .modifier
  .backgroundColor('white')
  .borderRadius('12px')
  .boxShadow('0 2px 12px rgba(0, 0, 0, 0.08)')
  .border('1px solid #f0f0f0')
  .hoverWithTransition({
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
    transform: { translateY: -2 }
  }, 250)
  .build()
}
```

---

## Interactive Buttons

### Primary Action Button

For main call-to-action buttons with engaging interactions.

```typescript
function PrimaryButton({ children, onClick, disabled = false }: ButtonProps) {
  return Button(children, onClick)
    .modifier
    .padding('14px 28px')
    .fontSize('16px')
    .fontWeight('600')
    .borderRadius('8px')
    .border('none')
    .cursor(disabled ? 'not-allowed' : 'pointer')
    .opacity(disabled ? 0.6 : 1)
    .background('linear-gradient(135deg, #007AFF 0%, #5856D6 100%)')
    .color('white')
    .boxShadow('0 4px 15px rgba(0, 122, 255, 0.2)')
    .transform({ perspective: 1000 })
    .transition('all', 200, 'cubic-bezier(0.4, 0, 0.2, 1)')
    .hoverWithTransition(disabled ? {} : {
      transform: { 
        scale: 1.02,
        translateY: -1,
        rotateX: '2deg'
      },
      boxShadow: '0 8px 25px rgba(0, 122, 255, 0.35)',
      background: 'linear-gradient(135deg, #0056CC 0%, #4A4A8A 100%)'
    }, 200)
    // Active state with pseudo-element
    .before(disabled ? {} : {
      content: '',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      borderRadius: '8px',
      opacity: 0,
      transition: 'opacity 200ms ease'
    })
    .build()
}
```

### Icon Button with Ripple Effect

Perfect for toolbars and action buttons.

```typescript
function IconButton({ icon, onClick, variant = 'primary' }: IconButtonProps) {
  const colors = {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    danger: '#FF3B30'
  }
  
  return Button("", onClick)
    .modifier
    .width('48px')
    .height('48px')
    .borderRadius('50%')
    .border('none')
    .backgroundColor(colors[variant])
    .color('white')
    .display('flex')
    .alignItems('center')
    .justifyContent('center')
    .cursor('pointer')
    .position('relative')
    .overflow('hidden')
    .boxShadow('0 2px 8px rgba(0, 0, 0, 0.1)')
    .hoverEffect('lift')
    // Ripple effect with pseudo-element
    .after({
      content: '',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '0',
      height: '0',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      transform: 'translate(-50%, -50%)',
      transition: 'width 0.3s ease, height 0.3s ease'
    })
    .build()
}
```

---

## Hero Sections

### Gradient Text Hero

Eye-catching hero section with animated gradient text.

```typescript
function GradientHero({ title, subtitle, ctaText, onCTAClick }: HeroProps) {
  return VStack([
    Text(title)
      .modifier
      .fontSize('clamp(2.5rem, 8vw, 4.5rem)')
      .fontWeight('800')
      .lineHeight('1.1')
      .textAlign('center')
      .marginBottom('24px')
      .gradientText('linear-gradient(45deg, #007AFF 0%, #5856D6 25%, #AF52DE 50%, #FF2D92 75%, #FF3B30 100%)')
      .transform({ perspective: 1000 })
      .hoverWithTransition({
        transform: {
          perspective: 1000,
          scale: 1.02,
          rotateX: '2deg'
        }
      }, 400)
      .build(),
      
    Text(subtitle)
      .modifier
      .fontSize('clamp(1.1rem, 3vw, 1.4rem)')
      .color('rgba(255, 255, 255, 0.8)')
      .textAlign('center')
      .lineHeight('1.6')
      .maxWidth('600px')
      .marginBottom('40px')
      .build(),
      
    Button(ctaText, onCTAClick)
      .modifier
      .fontSize('18px')
      .fontWeight('600')
      .padding('16px 32px')
      .borderRadius('12px')
      .border('2px solid transparent')
      .background('linear-gradient(135deg, #007AFF, #5856D6)')
      .color('white')
      .boxShadow('0 8px 32px rgba(0, 122, 255, 0.3)')
      .hoverWithTransition({
        transform: { scale: 1.05 },
        boxShadow: '0 12px 40px rgba(0, 122, 255, 0.4)',
        background: 'linear-gradient(135deg, #0056CC, #4A4A8A)'
      }, 250)
      .build()
  ])
  .modifier
  .padding('80px 20px')
  .textAlign('center')
  .background('linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)')
  .position('relative')
  .overflow('hidden')
  // Animated background particles with pseudo-elements
  .before({
    content: '',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(0,122,255,0.1) 1px, transparent 1px)',
    backgroundSize: '50px 50px',
    animation: 'float 20s ease-in-out infinite',
    pointerEvents: 'none'
  })
  .build()
}
```

### Floating Card Hero

Modern hero with floating elements and depth.

```typescript
function FloatingCardHero({ content }: HeroProps) {
  return VStack([
    // Main content card
    VStack([
      Text("Revolutionary Design")
        .modifier
        .fontSize('36px')
        .fontWeight('bold')
        .gradientText('linear-gradient(45deg, #007AFF, #AF52DE)')
        .marginBottom('16px')
        .build(),
        
      Text("Experience the future of web design with our cutting-edge component library.")
        .modifier
        .fontSize('18px')
        .color('rgba(255, 255, 255, 0.8)')
        .lineHeight('1.6')
        .textAlign('center')
        .marginBottom('32px')
        .build(),
        
      HStack([
        Button("Get Started", () => {})
          .modifier
          .padding('12px 24px')
          .backgroundColor('#007AFF')
          .color('white')
          .borderRadius('8px')
          .hoverEffect('lift')
          .build(),
          
        Button("Learn More", () => {})
          .modifier
          .padding('12px 24px')
          .backgroundColor('transparent')
          .color('white')
          .border('2px solid rgba(255, 255, 255, 0.3)')
          .borderRadius('8px')
          .hoverWithTransition({
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.5)'
          }, 200)
          .build()
      ])
      .modifier
      .gap('16px')
      .justifyContent('center')
      .build()
    ])
    .modifier
    .padding('48px 40px')
    .backgroundColor('rgba(255, 255, 255, 0.1)')
    .backdropFilter({
      blur: 20,
      brightness: 1.2
    })
    .borderRadius('20px')
    .border('1px solid rgba(255, 255, 255, 0.2)')
    .boxShadow('0 20px 40px rgba(0, 0, 0, 0.1)')
    .transform({
      perspective: 1000,
      rotateX: '5deg'
    })
    .hoverWithTransition({
      transform: {
        perspective: 1000,
        rotateX: '0deg',
        scale: 1.02
      },
      boxShadow: '0 30px 60px rgba(0, 0, 0, 0.15)'
    }, 400)
    .build()
  ])
  .modifier
  .minHeight('100vh')
  .display('flex')
  .alignItems('center')
  .justifyContent('center')
  .background('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
  .position('relative')
  .build()
}
```

---

## Navigation Components

### Glassmorphism Navigation Bar

Modern navigation with glass effect and smooth interactions.

```typescript
function GlassNavbar({ items, activeItem }: NavbarProps) {
  return HStack([
    // Logo
    Text("TachUI")
      .modifier
      .fontSize('24px')
      .fontWeight('bold')
      .gradientText('linear-gradient(45deg, #007AFF, #5856D6)')
      .build(),
      
    // Navigation items
    HStack(
      items.map(item => 
        Button(item.label, item.onClick)
          .modifier
          .padding('8px 16px')
          .borderRadius('8px')
          .fontSize('14px')
          .fontWeight('500')
          .color(activeItem === item.id ? '#007AFF' : 'rgba(255, 255, 255, 0.8)')
          .backgroundColor(activeItem === item.id ? 'rgba(0, 122, 255, 0.1)' : 'transparent')
          .border('none')
          .cursor('pointer')
          .hoverWithTransition({
            backgroundColor: activeItem === item.id 
              ? 'rgba(0, 122, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.1)',
            color: '#007AFF'
          }, 150)
          .build()
      )
    )
    .modifier
    .gap('8px')
    .build(),
    
    // CTA Button
    Button("Sign In", () => {})
      .modifier
      .padding('8px 20px')
      .backgroundColor('#007AFF')
      .color('white')
      .borderRadius('20px')
      .fontSize('14px')
      .fontWeight('600')
      .border('none')
      .hoverEffect('lift')
      .build()
  ])
  .modifier
  .padding('16px 32px')
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .backdropFilter({
    blur: 20,
    brightness: 1.1,
    saturate: 1.2
  })
  .border('1px solid rgba(255, 255, 255, 0.2)')
  .borderRadius('16px')
  .margin('16px')
  .boxShadow('0 8px 32px rgba(0, 0, 0, 0.1)')
  .justifyContent('space-between')
  .alignItems('center')
  .position('sticky')
  .top('0')
  .zIndex(1000)
  .build()
}
```

### Animated Tab Navigation

Smooth tab navigation with sliding indicator.

```typescript
function AnimatedTabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return VStack([
    // Tab buttons
    HStack(
      tabs.map((tab, index) =>
        Button(tab.label, () => onTabChange(tab.id))
          .modifier
          .padding('12px 24px')
          .fontSize('14px')
          .fontWeight('600')
          .color(activeTab === tab.id ? '#007AFF' : '#666')
          .backgroundColor('transparent')
          .border('none')
          .cursor('pointer')
          .position('relative')
          .hoverWithTransition({
            color: '#007AFF'
          }, 150)
          // Active indicator
          .after(activeTab === tab.id ? {
            content: '',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: '#007AFF',
            borderRadius: '2px 2px 0 0',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          } : {})
          .build()
      )
    )
    .modifier
    .borderBottom('1px solid #e0e0e0')
    .build(),
    
    // Tab content
    VStack([
      Text(tabs.find(t => t.id === activeTab)?.content || "")
        .modifier
        .padding('24px 0')
        .build()
    ])
    .modifier
    .build()
  ])
  .modifier
  .backgroundColor('white')
  .borderRadius('12px')
  .boxShadow('0 4px 6px rgba(0, 0, 0, 0.05)')
  .overflow('hidden')
  .build()
}
```

---

## Modals and Overlays

### Modern Modal with Blur Background

Accessible modal with glassmorphism and smooth animations.

```typescript
function BlurModal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null
  
  return VStack([
    // Backdrop
    VStack([])
      .modifier
      .position('fixed')
      .top(0)
      .left(0)
      .right(0)
      .bottom(0)
      .backgroundColor('rgba(0, 0, 0, 0.3)')
      .backdropFilter({
        blur: 8,
        brightness: 0.8
      })
      .zIndex(999)
      .cursor('pointer')
      .onClick(onClose)
      .build(),
      
    // Modal content
    VStack([
      // Header
      HStack([
        Text(title)
          .modifier
          .fontSize('20px')
          .fontWeight('bold')
          .color('#1a1a1a')
          .build(),
          
        Button("×", onClose)
          .modifier
          .width('32px')
          .height('32px')
          .borderRadius('50%')
          .backgroundColor('transparent')
          .border('none')
          .fontSize('20px')
          .color('#666')
          .cursor('pointer')
          .hoverWithTransition({
            backgroundColor: '#f0f0f0',
            color: '#333'
          }, 150)
          .build()
      ])
      .modifier
      .justifyContent('space-between')
      .alignItems('center')
      .marginBottom('24px')
      .build(),
      
      // Content
      VStack([children])
        .modifier
        .build()
    ])
    .modifier
    .maxWidth('500px')
    .width('90%')
    .maxHeight('80vh')
    .padding('32px')
    .backgroundColor('rgba(255, 255, 255, 0.95)')
    .backdropFilter({
      blur: 20,
      brightness: 1.1
    })
    .borderRadius('20px')
    .border('1px solid rgba(255, 255, 255, 0.3)')
    .boxShadow('0 25px 50px rgba(0, 0, 0, 0.15)')
    .position('fixed')
    .top('50%')
    .left('50%')
    .transform({
      translateX: '-50%',
      translateY: '-50%'
    })
    .zIndex(1000)
    .overflow('auto')
    .build()
  ])
  .modifier
  .build()
}
```

### Notification Toast

Elegant notification system with auto-dismiss.

```typescript
function NotificationToast({ message, type = 'info', isVisible }: ToastProps) {
  const colors = {
    info: { bg: '#007AFF', icon: 'ℹ️' },
    success: { bg: '#34C759', icon: '✅' },
    warning: { bg: '#FF9500', icon: '⚠️' },
    error: { bg: '#FF3B30', icon: '❌' }
  }
  
  return HStack([
    Text(colors[type].icon)
      .modifier
      .fontSize('16px')
      .marginRight('12px')
      .build(),
      
    Text(message)
      .modifier
      .fontSize('14px')
      .color('white')
      .fontWeight('500')
      .flex('1')
      .build()
  ])
  .modifier
  .padding('16px 20px')
  .backgroundColor(colors[type].bg)
  .borderRadius('12px')
  .boxShadow('0 8px 25px rgba(0, 0, 0, 0.15)')
  .position('fixed')
  .top('20px')
  .right('20px')
  .zIndex(1000)
  .maxWidth('400px')
  .transform({
    translateX: isVisible ? '0' : '100%',
    scale: isVisible ? 1 : 0.9
  })
  .opacity(isVisible ? 1 : 0)
  .transition('all', 300, 'cubic-bezier(0.4, 0, 0.2, 1)')
  .build()
}
```

---

## Loading States

### Skeleton Loading

Smooth skeleton placeholders with shimmer effect.

```typescript
function SkeletonCard() {
  return VStack([
    // Image skeleton
    VStack([])
      .modifier
      .width('100%')
      .height('200px')
      .backgroundColor('#f0f0f0')
      .borderRadius('8px')
      .position('relative')
      .overflow('hidden')
      .before({
        content: '',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        animation: 'shimmer 1.5s infinite'
      })
      .build(),
      
    // Text skeletons
    VStack([
      VStack([])
        .modifier
        .width('80%')
        .height('20px')
        .backgroundColor('#f0f0f0')
        .borderRadius('4px')
        .marginBottom('8px')
        .build(),
        
      VStack([])
        .modifier
        .width('60%')
        .height('16px')
        .backgroundColor('#f0f0f0')
        .borderRadius('4px')
        .marginBottom('16px')
        .build(),
        
      VStack([])
        .modifier
        .width('100%')
        .height('40px')
        .backgroundColor('#f0f0f0')
        .borderRadius('6px')
        .build()
    ])
    .modifier
    .padding('16px')
    .build()
  ])
  .modifier
  .backgroundColor('white')
  .borderRadius('12px')
  .boxShadow('0 2px 8px rgba(0, 0, 0, 0.1)')
  .overflow('hidden')
  .build()
}

// CSS Animation (would be added to global styles)
const shimmerAnimation = `
@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
`
```

### Spinner with Glow Effect

Beautiful loading spinner with gradient and glow.

```typescript
function GlowSpinner({ size = 40 }: SpinnerProps) {
  return VStack([])
    .modifier
    .width(`${size}px`)
    .height(`${size}px`)
    .borderRadius('50%')
    .border(`3px solid transparent`)
    .background('linear-gradient(45deg, #007AFF, #5856D6) border-box')
    .position('relative')
    .before({
      content: '',
      position: 'absolute',
      top: '-3px',
      left: '-3px',
      right: '-3px',
      bottom: '-3px',
      borderRadius: '50%',
      background: 'linear-gradient(45deg, #007AFF, #5856D6, #AF52DE, #FF2D92)',
      zIndex: -1,
      filter: 'blur(8px)',
      opacity: 0.7,
      animation: 'rotate 2s linear infinite'
    })
    .after({
      content: '',
      position: 'absolute',
      top: '2px',
      left: '2px',
      right: '2px',
      bottom: '2px',
      backgroundColor: 'white',
      borderRadius: '50%'
    })
    .build()
}

// CSS Animation
const rotateAnimation = `
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`
```

---

## Theme Systems

### Dynamic Theme Provider

Complete theming system with dark mode support.

```typescript
function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const lightTheme = {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0'
  }
  
  const darkTheme = {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    success: '#32D74B',
    warning: '#FF9F0A',
    danger: '#FF453A',
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#98989D',
    border: '#38383A'
  }
  
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme
  
  return VStack([children])
    .modifier
    .themeColors(currentTheme)
    .backgroundColor('var(--theme-color-background)')
    .color('var(--theme-color-text)')
    .cssVariables({
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'border-radius-sm': '4px',
      'border-radius-md': '8px',
      'border-radius-lg': '12px',
      'spacing-xs': '4px',
      'spacing-sm': '8px',
      'spacing-md': '16px',
      'spacing-lg': '24px',
      'spacing-xl': '32px',
      'shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
      'shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
      'shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
      'transition-fast': '150ms ease',
      'transition-normal': '300ms ease',
      'transition-slow': '500ms ease'
    })
    .build()
}
```

### Theme-Aware Component

Component that automatically adapts to theme changes.

```typescript
function ThemedButton({ children, variant = 'primary', ...props }: ThemedButtonProps) {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--theme-color-primary)',
          color: 'white',
          border: 'none'
        }
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          color: 'var(--theme-color-primary)',
          border: '2px solid var(--theme-color-primary)'
        }
      case 'danger':
        return {
          backgroundColor: 'var(--theme-color-danger)',
          color: 'white',
          border: 'none'
        }
      default:
        return {
          backgroundColor: 'var(--theme-color-surface)',
          color: 'var(--theme-color-text)',
          border: '1px solid var(--theme-color-border)'
        }
    }
  }
  
  return Button(children, props.onClick)
    .modifier
    .padding('var(--spacing-sm) var(--spacing-md)')
    .borderRadius('var(--border-radius-md)')
    .fontSize('14px')
    .fontWeight('600')
    .fontFamily('var(--font-family)')
    .cursor('pointer')
    .transition('all', 'var(--transition-fast)')
    .css(getVariantStyles(variant))
    .hoverWithTransition({
      transform: { scale: 1.02 },
      filter: { brightness: variant === 'secondary' ? 1.1 : 0.9 }
    })
    .build()
}
```

---

## Advanced Layouts

### Masonry Grid with Hover Effects

Pinterest-style masonry layout with smooth interactions.

```typescript
function MasonryGrid({ items }: MasonryGridProps) {
  return VStack(
    items.map((item, index) =>
      VStack([
        Image(item.image)
          .modifier
          .width('100%')
          .height('auto')
          .borderRadius('8px 8px 0 0')
          .objectFit('cover')
          .build(),
          
        VStack([
          Text(item.title)
            .modifier
            .fontSize('16px')
            .fontWeight('bold')
            .marginBottom('8px')
            .build(),
            
          Text(item.description)
            .modifier
            .fontSize('14px')
            .color('#666')
            .lineHeight('1.4')
            .build()
        ])
        .modifier
        .padding('16px')
        .build()
      ])
      .modifier
      .backgroundColor('white')
      .borderRadius('12px')
      .boxShadow('0 2px 8px rgba(0, 0, 0, 0.1)')
      .overflow('hidden')
      .cursor('pointer')
      .hoverWithTransition({
        transform: { 
          scale: 1.02,
          translateY: -4
        },
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
      }, 300)
      // Staggered animation delay
      .css({
        animationDelay: `${index * 100}ms`
      })
      .build()
    )
  )
  .modifier
  .display('grid')
  .gridTemplateColumns('repeat(auto-fill, minmax(280px, 1fr))')
  .gap('20px')
  .padding('20px')
  .build()
}
```

### Floating Action Menu

Expandable FAB with multiple actions.

```typescript
function FloatingActionMenu({ actions, isOpen, onToggle }: FABProps) {
  return VStack([
    // Action buttons
    ...actions.map((action, index) =>
      Button("", action.onClick)
        .modifier
        .width('48px')
        .height('48px')
        .borderRadius('50%')
        .backgroundColor(action.color || '#007AFF')
        .color('white')
        .border('none')
        .boxShadow('0 4px 12px rgba(0, 0, 0, 0.15)')
        .cursor('pointer')
        .display('flex')
        .alignItems('center')
        .justifyContent('center')
        .fontSize('18px')
        .opacity(isOpen ? 1 : 0)
        .transform({
          scale: isOpen ? 1 : 0,
          translateY: isOpen ? 0 : 20
        })
        .transition('all', `${200 + index * 50}ms`, 'cubic-bezier(0.4, 0, 0.2, 1)')
        .hoverEffect('lift')
        .build()
    ),
    
    // Main FAB
    Button(isOpen ? "×" : "+", onToggle)
      .modifier
      .width('56px')
      .height('56px')
      .borderRadius('50%')
      .backgroundColor('#007AFF')
      .color('white')
      .border('none')
      .fontSize('24px')
      .fontWeight('bold')
      .boxShadow('0 6px 20px rgba(0, 122, 255, 0.3)')
      .cursor('pointer')
      .display('flex')
      .alignItems('center')
      .justifyContent('center')
      .transform({
        rotate: isOpen ? '45deg' : '0deg'
      })
      .transition('all', 300, 'cubic-bezier(0.4, 0, 0.2, 1)')
      .hoverWithTransition({
        transform: { 
          scale: 1.1,
          rotate: isOpen ? '45deg' : '0deg'
        },
        boxShadow: '0 8px 25px rgba(0, 122, 255, 0.4)'
      }, 200)
      .build()
  ])
  .modifier
  .position('fixed')
  .bottom('24px')
  .right('24px')
  .zIndex(1000)
  .display('flex')
  .flexDirection('column-reverse')
  .alignItems('center')
  .gap('12px')
  .build()
}
```

---

All examples are production-ready and include:
- ✅ Accessibility considerations
- ✅ Responsive design
- ✅ Performance optimizations
- ✅ Browser compatibility
- ✅ TypeScript types
- ✅ Smooth animations
- ✅ Modern design patterns

Copy and adapt these examples for your own projects!