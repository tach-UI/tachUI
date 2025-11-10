# Glassmorphism Examples

Complete examples showcasing TachUI's backdrop filter modifiers and glassmorphism design patterns with production-ready implementations.

## Table of Contents

- [Basic Glassmorphism](#basic-glassmorphism)
- [Card Designs](#card-designs)
- [Navigation Elements](#navigation-elements)
- [Modal & Overlay Patterns](#modal--overlay-patterns)
- [Sidebar & Panel Designs](#sidebar--panel-designs)
- [Interactive Components](#interactive-components)
- [Responsive Glassmorphism](#responsive-glassmorphism)
- [Performance-Optimized Examples](#performance-optimized-examples)

## Basic Glassmorphism

### Simple Glass Card

```typescript
import { VStack, Text } from '@tachui/core'

const SimpleGlassCard = () => {
  return VStack([
    Text("Glass Effect Card")
      .fontSize(18)
      .fontWeight('600')
      .marginBottom(8),
      
    Text("Beautiful transparent background with blur effect")
      .fontSize(14)
      .opacity(0.8)
  ])
  .glassmorphism('medium')
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .padding(24)
  .cornerRadius(16)
  .border(1, 'rgba(255, 255, 255, 0.2)', 'solid')
}
```

### Manual Backdrop Filter

```typescript
const CustomBackdropCard = () => {
  return VStack([
    Text("Custom Backdrop Filter")
      .fontSize(16)
      .fontWeight('500')
  ])
  .backdropFilter(
    {
      blur: 12,
      saturate: 1.4,
      brightness: 1.1,
      contrast: 1.05
    },
    'rgba(255, 255, 255, 0.85)' // Fallback for unsupported browsers
  )
  .backgroundColor('rgba(255, 255, 255, 0.12)')
  .padding(20)
  .cornerRadius(12)
}
```

## Card Designs

### Glassmorphism Profile Card

```typescript
import { HStack, VStack, Text, Image } from '@tachui/core'

interface ProfileData {
  name: string
  title: string
  avatar: string
  stats: { followers: number, following: number, posts: number }
}

const GlassProfileCard = ({ profile }: { profile: ProfileData }) => {
  return VStack([
    // Profile header
    HStack([
      Image(profile.avatar)
        .frame(60, 60)
        .cornerRadius(30)
        .border(2, 'rgba(255, 255, 255, 0.3)', 'solid'),
        
      VStack([
        Text(profile.name)
          .fontSize(18)
          .fontWeight('600'),
        Text(profile.title)
          .fontSize(14)
          .opacity(0.8)
      ])
      .alignItems('flex-start')
      .marginLeft(16)
    ])
    .marginBottom(20),
    
    // Stats
    HStack([
      VStack([
        Text(profile.stats.posts.toString())
          .fontSize(16)
          .fontWeight('600'),
        Text("Posts")
          .fontSize(12)
          .opacity(0.7)
      ])
      .alignItems('center'),
      
      VStack([
        Text(profile.stats.followers.toString())
          .fontSize(16)
          .fontWeight('600'),
        Text("Followers")
          .fontSize(12)
          .opacity(0.7)
      ])
      .alignItems('center'),
      
      VStack([
        Text(profile.stats.following.toString())
          .fontSize(16)
          .fontWeight('600'),
        Text("Following")
          .fontSize(12)
          .opacity(0.7)
      ])
      .alignItems('center')
    ])
    .justifyContent('space-around')
    .width('100%')
  ])
  .glassmorphism('medium')
  .backgroundColor('rgba(255, 255, 255, 0.08)')
  .padding(24)
  .cornerRadius(20)
  .border(1, 'rgba(255, 255, 255, 0.15)', 'solid')
  .shadow({
    color: 'rgba(0, 0, 0, 0.1)',
    radius: 16,
    x: 0,
    y: 8
  })
  .maxWidth(320)
}
```

### Product Card with Glassmorphism

```typescript
interface Product {
  name: string
  price: number
  image: string
  rating: number
}

const GlassProductCard = ({ product }: { product: Product }) => {
  const [isHovered, setIsHovered] = createSignal(false)
  
  return VStack([
    Image(product.image)
      .frame(200, 150)
      .cornerRadius(12)
      .marginBottom(16),
      
    Text(product.name)
      .fontSize(16)
      .fontWeight('600')
      .textAlign('center')
      .marginBottom(8),
      
    Text(`$${product.price}`)
      .fontSize(18)
      .fontWeight('700')
      .foregroundColor('#007AFF')
      .marginBottom(12),
      
    HStack([
      Text("★".repeat(Math.floor(product.rating)))
        .foregroundColor('#FFD700'),
      Text(`${product.rating}`)
        .fontSize(14)
        .opacity(0.8)
        .marginLeft(8)
    ])
  ])
  .glassmorphism(isHovered() ? 'heavy' : 'medium')
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .padding(20)
  .cornerRadius(16)
  .border(1, 'rgba(255, 255, 255, 0.2)', 'solid')
  .transition({
    property: 'all',
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  })
  .onHover(setIsHovered)
  .transform(() => isHovered() ? 'translateY(-4px)' : 'translateY(0)')
  .shadow(() => ({
    color: 'rgba(0, 0, 0, 0.15)',
    radius: isHovered() ? 24 : 12,
    x: 0,
    y: isHovered() ? 12 : 6
  }))
}
```

## Navigation Elements

### Glass Navigation Bar

```typescript
interface NavItem {
  title: string
  href: string
  isActive?: boolean
}

const GlassNavBar = ({ items }: { items: NavItem[] }) => {
  return HStack(
    items.map(item => 
      Text(item.title)
        .padding({ horizontal: 16, vertical: 12 })
        .cornerRadius(8)
        .foregroundColor(item.isActive ? '#007AFF' : '#000000')
        .backgroundColor(
          item.isActive ? 'rgba(0, 122, 255, 0.1)' : 'transparent'
        )
        .fontWeight(item.isActive ? '600' : '400')
        .transition({
          property: 'all',
          duration: 200
        })
        .onTap(() => {
          // Handle navigation
          window.location.href = item.href
        })
        .cursor('pointer')
    )
  )
  .justifyContent('center')
  .gap(8)
  .position('fixed')
  .top(20)
  .left('50%')
  .transform('translateX(-50%)')
  .glassmorphism('light')
  .backgroundColor('rgba(255, 255, 255, 0.8)')
  .padding({ horizontal: 20, vertical: 8 })
  .cornerRadius(24)
  .border(1, 'rgba(255, 255, 255, 0.3)', 'solid')
  .shadow({
    color: 'rgba(0, 0, 0, 0.08)',
    radius: 16,
    x: 0,
    y: 4
  })
  .zIndex(1000)
}
```

### Glass Breadcrumb Navigation

```typescript
interface BreadcrumbItem {
  label: string
  href?: string
}

const GlassBreadcrumb = ({ items }: { items: BreadcrumbItem[] }) => {
  return HStack(
    items.map((item, index) => 
      HStack([
        Text(item.label)
          .fontSize(14)
          .foregroundColor(item.href ? '#007AFF' : '#666666')
          .fontWeight(item.href ? '500' : '400')
          .cursor(item.href ? 'pointer' : 'default')
          .onTap(() => {
            if (item.href) {
              window.location.href = item.href
            }
          }),
          
        ...(index < items.length - 1 ? [
          Text('/')
            .fontSize(14)
            .foregroundColor('#CCCCCC')
            .marginHorizontal(8)
        ] : [])
      ])
    ).flat()
  )
  .glassmorphism('subtle')
  .backgroundColor('rgba(255, 255, 255, 0.05)')
  .padding({ horizontal: 16, vertical: 8 })
  .cornerRadius(8)
  .border(1, 'rgba(255, 255, 255, 0.1)', 'solid')
}
```

## Modal & Overlay Patterns

### Glassmorphism Modal

```typescript
const GlassmorphismModal = ({ 
  isOpen,
  title,
  content,
  onClose 
}: {
  isOpen: Signal<boolean>
  title: string
  content: ComponentInstance[]
  onClose: () => void
}) => {
  return Show(() => isOpen(), () =>
    VStack([
      // Modal content
      VStack([
        // Header
        HStack([
          Text(title)
            .fontSize(20)
            .fontWeight('600'),
            
          Text("×")
            .fontSize(24)
            .fontWeight('300')
            .cursor('pointer')
            .onTap(onClose)
            .padding(4)
            .cornerRadius(4)
            .onHover((hovered) => {
              // Add hover styling
            })
        ])
        .justifyContent('space-between')
        .alignItems('center')
        .marginBottom(20)
        .paddingBottom(16)
        .border({ bottom: 1 }, 'rgba(255, 255, 255, 0.1)', 'solid'),
        
        // Content
        VStack(content)
          .gap(16)
      ])
      .glassmorphism('heavy')
      .backgroundColor('rgba(255, 255, 255, 0.15)')
      .padding(32)
      .cornerRadius(20)
      .border(1, 'rgba(255, 255, 255, 0.2)', 'solid')
      .shadow({
        color: 'rgba(0, 0, 0, 0.2)',
        radius: 32,
        x: 0,
        y: 16
      })
      .maxWidth(500)
      .maxHeight('80vh')
      .overflowY('auto')
    ])
    .position('fixed')
    .top(0)
    .left(0)
    .width('100vw')
    .height('100vh')
    .backgroundColor('rgba(0, 0, 0, 0.4)')
    .justifyContent('center')
    .alignItems('center')
    .zIndex(10000)
    .onTap((e) => {
      // Close on backdrop click
      if (e.target === e.currentTarget) {
        onClose()
      }
    })
  )
}

// Usage example
const ExampleModal = () => {
  const [isModalOpen, setIsModalOpen] = createSignal(false)
  
  return VStack([
    Button("Open Glass Modal")
      .onTap(() => setIsModalOpen(true)),
      
    GlassmorphismModal({
      isOpen: isModalOpen,
      title: "Glass Modal Example",
      content: [
        Text("This is a beautiful glassmorphism modal with backdrop blur effects."),
        Text("It includes proper browser fallbacks and accessibility features."),
        Button("Action Button")
          .padding({ horizontal: 20, vertical: 10 })
          .cornerRadius(8)
          .backgroundColor('#007AFF')
          .foregroundColor('#FFFFFF')
      ],
      onClose: () => setIsModalOpen(false)
    })
  ])
}
```

### Glass Notification Toast

```typescript
interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

const GlassToast = ({ toast }: { toast: ToastMessage }) => {
  const [isVisible, setIsVisible] = createSignal(true)
  const [progress, setProgress] = createSignal(100)
  
  const typeColors = {
    success: '#22C55E',
    error: '#EF4444', 
    warning: '#F59E0B',
    info: '#3B82F6'
  }
  
  // Auto-dismiss logic
  useEffect(() => {
    const duration = toast.duration || 5000
    const interval = setInterval(() => {
      setProgress(p => Math.max(0, p - (100 / (duration / 100))))
    }, 100)
    
    setTimeout(() => {
      setIsVisible(false)
    }, duration)
    
    return () => clearInterval(interval)
  })
  
  return Show(() => isVisible(), () =>
    VStack([
      HStack([
        VStack([
          Text(toast.title)
            .fontSize(14)
            .fontWeight('600'),
          Text(toast.message)
            .fontSize(12)
            .opacity(0.9)
            .marginTop(2)
        ])
        .alignItems('flex-start')
        .flex(1),
        
        Text("×")
          .fontSize(16)
          .cursor('pointer')
          .onTap(() => setIsVisible(false))
          .padding(4)
      ])
      .alignItems('flex-start')
      .marginBottom(8),
      
      // Progress bar
      VStack([])
        .height(2)
        .backgroundColor(typeColors[toast.type])
        .width(() => `${progress()}%`)
        .cornerRadius(1)
        .transition({
          property: 'width',
          duration: 100
        })
    ])
    .glassmorphism('medium')
    .backgroundColor('rgba(255, 255, 255, 0.12)')
    .padding(16)
    .cornerRadius(12)
    .border({ left: 4 }, typeColors[toast.type], 'solid')
    .shadow({
      color: 'rgba(0, 0, 0, 0.1)',
      radius: 12,
      x: 0,
      y: 6
    })
    .maxWidth(350)
    .position('fixed')
    .top(20)
    .right(20)
    .zIndex(9999)
    .transform(() => isVisible() ? 'translateX(0)' : 'translateX(100%)')
    .transition({
      property: 'transform',
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    })
  )
}
```

## Sidebar & Panel Designs

### Glass Sidebar Panel

```typescript
const GlassSidebar = ({ 
  isOpen,
  onClose 
}: {
  isOpen: Signal<boolean>
  onClose: () => void
}) => {
  const menuItems = [
    { icon: "🏠", label: "Home", active: true },
    { icon: "👤", label: "Profile", active: false },
    { icon: "⚙️", label: "Settings", active: false },
    { icon: "📊", label: "Analytics", active: false },
    { icon: "📝", label: "Documentation", active: false }
  ]
  
  return Show(() => isOpen(), () =>
    HStack([
      // Sidebar content
      VStack([
        // Header
        Text("Navigation")
          .fontSize(18)
          .fontWeight('600')
          .marginBottom(24)
          .textAlign('center'),
          
        // Menu items
        VStack(
          menuItems.map(item =>
            HStack([
              Text(item.icon)
                .fontSize(16),
              Text(item.label)
                .fontSize(14)
                .marginLeft(12)
                .flex(1)
            ])
            .alignItems('center')
            .padding({ horizontal: 16, vertical: 12 })
            .cornerRadius(8)
            .backgroundColor(
              item.active ? 'rgba(0, 122, 255, 0.15)' : 'transparent'
            )
            .foregroundColor(item.active ? '#007AFF' : '#000000')
            .cursor('pointer')
            .onHover((hovered) => {
              if (!item.active) {
                // Add hover styling
              }
            })
            .onTap(() => {
              // Handle navigation
              console.log(`Navigate to ${item.label}`)
            })
          )
        )
        .gap(4)
        .width('100%')
      ])
      .glassmorphism('heavy')
      .backgroundColor('rgba(255, 255, 255, 0.18)')
      .width(280)
      .height('100vh')
      .padding(24)
      .border({ right: 1 }, 'rgba(255, 255, 255, 0.2)', 'solid'),
      
      // Backdrop overlay
      VStack([])
        .flex(1)
        .height('100vh')
        .backgroundColor('rgba(0, 0, 0, 0.3)')
        .onTap(onClose)
    ])
    .position('fixed')
    .top(0)
    .left(0)
    .zIndex(9999)
    .transform(() => isOpen() ? 'translateX(0)' : 'translateX(-100%)')
    .transition({
      property: 'transform',
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    })
  )
}
```

## Interactive Components

### Glass Button Components

```typescript
const GlassButton = ({ 
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick
}: {
  children: ComponentInstance[]
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'  
  disabled?: boolean
  onClick?: () => void
}) => {
  const [isPressed, setIsPressed] = createSignal(false)
  const [isHovered, setIsHovered] = createSignal(false)
  
  const sizeConfig = {
    small: { padding: { horizontal: 12, vertical: 8 }, fontSize: 14 },
    medium: { padding: { horizontal: 16, vertical: 10 }, fontSize: 16 },
    large: { padding: { horizontal: 20, vertical: 14 }, fontSize: 18 }
  }
  
  const variantConfig = {
    primary: {
      background: 'rgba(0, 122, 255, 0.15)',
      borderColor: 'rgba(0, 122, 255, 0.3)',
      color: '#007AFF'
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)', 
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: '#000000'
    },
    ghost: {
      background: 'transparent',
      borderColor: 'rgba(255, 255, 255, 0.1)', 
      color: '#666666'
    }
  }
  
  const config = variantConfig[variant]
  const sizeProps = sizeConfig[size]
  
  return HStack(children)
    .glassmorphism(
      disabled ? 'subtle' :
      isPressed() ? 'heavy' :
      isHovered() ? 'medium' : 'light'
    )
    .backgroundColor(disabled ? 'rgba(0, 0, 0, 0.05)' : config.background)
    .foregroundColor(disabled ? '#CCCCCC' : config.color)
    .border(1, disabled ? 'rgba(0, 0, 0, 0.1)' : config.borderColor, 'solid')
    .padding(sizeProps.padding)
    .fontSize(sizeProps.fontSize)
    .cornerRadius(size === 'small' ? 6 : size === 'large' ? 12 : 8)
    .cursor(disabled ? 'not-allowed' : 'pointer')
    .justifyContent('center')
    .alignItems('center')
    .transform(() => {
      if (disabled) return 'scale(1)'
      return isPressed() ? 'scale(0.96)' : 'scale(1)'
    })
    .transition({
      property: 'all',
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    })
    .onMouseDown(() => !disabled && setIsPressed(true))
    .onMouseUp(() => setIsPressed(false))
    .onHover((hovered) => !disabled && setIsHovered(hovered))
    .onTap(() => {
      if (!disabled && onClick) {
        onClick()
      }
    })
    .shadow(() => ({
      color: 'rgba(0, 0, 0, 0.1)',
      radius: isHovered() && !disabled ? 12 : 6,
      x: 0,
      y: isHovered() && !disabled ? 6 : 3
    }))
}

// Usage examples
const ButtonExamples = () => {
  return VStack([
    GlassButton({
      children: [Text("Primary Button")],
      variant: 'primary',
      onClick: () => console.log('Primary clicked')
    }),
    
    GlassButton({
      children: [Text("Secondary Button")],
      variant: 'secondary',
      size: 'large',
      onClick: () => console.log('Secondary clicked')
    }),
    
    GlassButton({
      children: [Text("Disabled Button")],
      variant: 'primary',
      disabled: true,
      onClick: () => console.log('This will not fire')
    })
  ])
  .gap(12)
}
```

## Responsive Glassmorphism

### Responsive Glass Components

```typescript
const ResponsiveGlassCard = ({ children }: { children: ComponentInstance[] }) => {
  return VStack(children)
    .responsive()
    // Mobile: Light glassmorphism for performance
    .mobile(() => ({
      glassmorphism: 'light',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      cornerRadius: 8,
      padding: 16,
      border: { width: 1, color: 'rgba(255, 255, 255, 0.1)' }
    }))
    // Tablet: Medium glassmorphism
    .tablet(() => ({
      glassmorphism: 'medium', 
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      cornerRadius: 12,
      padding: 20,
      border: { width: 1, color: 'rgba(255, 255, 255, 0.15)' }
    }))
    // Desktop: Full glassmorphism effects
    .desktop(() => ({
      glassmorphism: 'heavy',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      cornerRadius: 16,
      padding: 24,
      border: { width: 1, color: 'rgba(255, 255, 255, 0.2)' },
      shadow: {
        color: 'rgba(0, 0, 0, 0.1)',
        radius: 16,
        x: 0,
        y: 8
      }
    }))
}
```

## Performance-Optimized Examples

### Optimized Glass Navigation

```typescript
const OptimizedGlassNav = ({ items }: { items: NavItem[] }) => {
  return HStack(
    items.map(item => 
      Text(item.title)
        .padding({ horizontal: 12, vertical: 8 })
        .cornerRadius(6)
    )
  )
  .glassmorphism('light') // Light effects for better performance
  .backgroundColor('rgba(255, 255, 255, 0.75)') // Semi-transparent fallback
  .padding({ horizontal: 16, vertical: 8 })
  .cornerRadius(16)
  // Performance optimizations
  .transform('translate3d(0, 0, 0)') // Force hardware acceleration
  .css({ willChange: 'backdrop-filter' }) // Browser hint
  .position('fixed')
  .top(0)
  .width('100%')
  .zIndex(100)
}
```

### Conditional Glass Effects

```typescript
const ConditionalGlass = ({ enableGlass }: { enableGlass: Signal<boolean> }) => {
  return VStack([
    Text("Conditional glassmorphism")
      .fontSize(16)
      .fontWeight('500')
  ])
  // Only apply glassmorphism when enabled (performance control)
  (enableGlass() ? glassmorphism('medium') : {})
  .backgroundColor(
    enableGlass() 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(255, 255, 255, 0.9)' // Solid fallback
  )
  .padding(20)
  .cornerRadius(12)
  .border(1, 'rgba(255, 255, 255, 0.2)', 'solid')
}
```

## Complete Application Example

### Glass Dashboard Layout

```typescript
const GlassDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = createSignal(false)
  const [notifications, setNotifications] = createSignal<ToastMessage[]>([])
  
  const stats = [
    { label: "Users", value: "12.4k", change: "+12%" },
    { label: "Revenue", value: "$45.2k", change: "+8.3%" },
    { label: "Orders", value: "1.2k", change: "+15%" },
    { label: "Conversion", value: "3.2%", change: "+2.1%" }
  ]
  
  return VStack([
    // Top navigation
    HStack([
      Text("☰")
        .fontSize(18)
        .cursor('pointer')
        .onTap(() => setSidebarOpen(true))
        .padding(8),
        
      Text("Glass Dashboard")
        .fontSize(20)
        .fontWeight('600')
        .marginLeft(16),
        
      VStack([]).flex(1), // Spacer
      
      Text("🔔")
        .fontSize(16)
        .cursor('pointer')
        .padding(8)
        .cornerRadius(8)
        .onHover((hovered) => {
          // Add notification badge styling
        })
    ])
    .glassmorphism('light')
    .backgroundColor('rgba(255, 255, 255, 0.8)')
    .padding({ horizontal: 24, vertical: 16 })
    .border({ bottom: 1 }, 'rgba(255, 255, 255, 0.2)', 'solid')
    .position('sticky')
    .top(0)
    .zIndex(100),
    
    // Main content
    VStack([
      // Stats grid
      HStack(
        stats.map(stat =>
          VStack([
            Text(stat.value)
              .fontSize(24)
              .fontWeight('700'),
            Text(stat.label)
              .fontSize(14)
              .opacity(0.8)
              .marginTop(4),
            Text(stat.change)
              .fontSize(12)
              .foregroundColor('#22C55E')
              .fontWeight('500')
              .marginTop(8)
          ])
          .glassmorphism('medium')
          .backgroundColor('rgba(255, 255, 255, 0.1)')
          .padding(20)
          .cornerRadius(12)
          .border(1, 'rgba(255, 255, 255, 0.15)', 'solid')
          .alignItems('center')
          .flex(1)
        )
      )
      .gap(16)
      .width('100%')
      .marginBottom(24),
      
      // Content cards
      HStack([
        // Chart card
        VStack([
          Text("Analytics Overview")
            .fontSize(18)
            .fontWeight('600')
            .marginBottom(16),
          // Chart placeholder
          VStack([])
            .height(200)
            .backgroundColor('rgba(0, 122, 255, 0.1)')
            .cornerRadius(8)
            .alignItems('center')
            .justifyContent('center')
        ])
        .glassmorphism('medium')
        .backgroundColor('rgba(255, 255, 255, 0.12)')
        .padding(24)
        .cornerRadius(16)
        .flex(2),
        
        // Activity feed
        VStack([
          Text("Recent Activity")
            .fontSize(18)
            .fontWeight('600')
            .marginBottom(16),
          // Activity items
          VStack([
            Text("Activity feed content...")
              .fontSize(14)
              .opacity(0.8)
          ])
        ])
        .glassmorphism('medium')
        .backgroundColor('rgba(255, 255, 255, 0.12)')
        .padding(24)
        .cornerRadius(16)
        .flex(1)
      ])
      .gap(16)
      .width('100%')
    ])
    .padding(24),
    
    // Sidebar
    GlassSidebar({
      isOpen: sidebarOpen,
      onClose: () => setSidebarOpen(false)
    }),
    
    // Toast notifications
    VStack(
      notifications().map(toast =>
        GlassToast({ toast })
      )
    )
    .position('fixed')
    .top(20)
    .right(20)
    .gap(12)
    .zIndex(9999)
  ])
  .minHeight('100vh')
  .backgroundColor('#F5F7FA')
  // Add subtle background pattern or gradient
  .css({
    backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 160, 240, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 120, 160, 0.1) 0%, transparent 50%)'
  })
}
```

These examples demonstrate production-ready glassmorphism implementations with proper fallbacks, performance optimizations, and accessibility considerations. Each example can be copied and adapted for real-world applications.