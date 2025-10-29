# Modifier System Examples

This guide provides practical examples of using TachUI's SwiftUI-inspired modifier system in real-world scenarios, updated with the latest multi-property modifiers and CSS modifier support.

> **Latest Update**: Examples updated to include new multi-property modifiers (size, margin, typography, border), flexbox modifiers, utility modifiers, and the raw CSS modifier for maximum flexibility.

## Basic Examples

### Styled Button

```typescript
import { Button } from '@tachui/core'

const primaryButton = Button('Get Started', () => console.log('Getting started!'))
  .backgroundColor('#007AFF')
  .foregroundColor('#ffffff')
  .fontSize(16)
  .fontWeight('600')
  .padding(24, 12) // horizontal, vertical
  .cornerRadius(8)
  .transition('all', 200)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0, 122, 255, 0.3)' })
  .build()
```

### Card Component

```typescript
import { VStack, Text, Image } from '@tachui/core'

const productCard = VStack({
  children: [
    Image({
      src: '/product-image.jpg',
      alt: 'Product'
    })
    .frame({ width: '100%', height: 200 })
    .cornerRadius(8)
    .build(),
    
    VStack({
      children: [
        Text("Premium Headphones")
          .fontSize(18)
          .fontWeight('bold')
          .foregroundColor('#1a1a1a')
          .build(),
        
        Text("High-quality wireless headphones with noise cancellation")
          .fontSize(14)
          .foregroundColor('#666')
          .lineHeight(1.4)
          .build(),
        
        Text("$299.99")
          .fontSize(20)
          .fontWeight('bold')
          .foregroundColor('#007AFF')
          .build()
      ],
      spacing: 8
    })
    .padding(16)
    .build()
  ],
  spacing: 0
})
.backgroundColor('#ffffff')
.cornerRadius(8)
.shadow({ x: 0, y: 4, radius: 12, color: 'rgba(0,0,0,0.1)' })
.border(1, '#f0f0f0')
.frame({ width: 300 })
.build()
```

## Advanced Modifier Examples

### Layout Priority and Advanced Positioning

```typescript
import { HStack, Text, Button } from '@tachui/core'

// Using detailed padding modifiers
const preciseCard = Text('Precisely padded content')
  .padding({ top: 20, right: 16, bottom: 24, left: 16 })
  .margin({ top: 8, right: 12, bottom: 16, left: 12 })
  .backgroundColor('#f8f9fa')
  .cornerRadius(8)
  .build()

// Button row with consistent styling
const buttonRow = HStack({
  children: [
    Button('Cancel', () => {})
      .padding(16, 8) // horizontal: 16, vertical: 8
      .backgroundColor('#6c757d')
      .foregroundColor('#ffffff')
      .cornerRadius(6)
      .build(),
    
    Button('Confirm', () => {})
      .padding(20, 10) // More prominent button
      .backgroundColor('#007AFF')
      .foregroundColor('#ffffff')
      .cornerRadius(6)
      .build()
  ],
  spacing: 12
})
.padding(16)
.build()
```

### Animation and Transition Examples

```typescript
import { Text, createSignal } from '@tachui/core'

// Advanced transition controls
const [isVisible, setIsVisible] = createSignal(false)
const animatedCard = Text('Animated content')
  .opacity(() => isVisible() ? 1 : 0)
  .transform(() => isVisible() ? 'translateY(0)' : 'translateY(20px)')
  .transition({
    property: 'opacity, transform',
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 100
  })
  .backgroundColor('#ffffff')
  .padding(20)
  .cornerRadius(12)
  .shadow({ x: 0, y: 4, radius: 16, color: 'rgba(0,0,0,0.1)' })
  .build()

// Simple animations
const fadeInBox = Text('Fade in animation')
  .animation('fadeIn', 300)
  .backgroundColor('#e6f3ff')
  .padding(16)
  .cornerRadius(8)
  .build()

const slideInBox = Text('Slide in from left')
  .animation('slideInLeft', 400)
  .backgroundColor('#f0f8ff')
  .padding(16)
  .cornerRadius(8)
  .build()

const scaleInBox = Text('Scale in animation')
  .animation('scaleIn', 300)
  .backgroundColor('#fff5f5')
  .padding(16)
  .cornerRadius(8)
  .build()
```

### Reactive Modifiers with Signals

```typescript
import { createSignal, createMemo, Text, VStack } from '@tachui/core'

// Dynamic styling based on state
const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
const [isActive, setIsActive] = createSignal(false)
const [progress, setProgress] = createSignal(0)

// Computed modifier values
const themeColors = createMemo(() => ({
  background: theme() === 'dark' ? '#1a1a1a' : '#ffffff',
  text: theme() === 'dark' ? '#ffffff' : '#1a1a1a',
  border: theme() === 'dark' ? '#333333' : '#e0e0e0'
}))

const reactiveCard = Text('Reactive themed card')
  .backgroundColor(() => themeColors().background)
  .foregroundColor(() => themeColors().text)
  .border(1, () => themeColors().border)
  .borderColor(() => isActive() ? '#007AFF' : themeColors().border)
  .transform(() => isActive() ? 'scale(1.02)' : 'scale(1)')
  .shadow(() => isActive() 
    ? { x: 0, y: 8, radius: 20, color: 'rgba(0,122,255,0.3)' }
    : { x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' }
  )
  .transition('all', 200, 'ease-out')
  .padding(20)
  .cornerRadius(12)
  .onTap(() => setIsActive(!isActive()))
  .build()

// Progress bar with reactive width
const progressBar = VStack()
  .frame({ width: () => `${progress()}%`, height: 8 })
  .backgroundColor('#007AFF')
  .cornerRadius(4)
  .transition('width', 300, 'ease-out')
  .build()

const progressContainer = VStack({ children: [progressBar] })
  .frame({ width: '100%', height: 8 })
  .backgroundColor('#e0e0e0')
  .cornerRadius(4)
  .build()
```

### Preset Modifier Combinations

```typescript
import { Text, Button, TextField } from '@tachui/core'

// Using component styling patterns
const cardWithStyling = Text('Card with preset styling')
  .padding(20)
  .backgroundColor('#ffffff')
  .cornerRadius(8)
  .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
  .build()

const primaryButton = Button('Primary Button', () => {})
  .backgroundColor('#007AFF')
  .foregroundColor('#ffffff')
  .padding(12, 8)
  .cornerRadius(6)
  .build()

const styledInput = TextField({ placeholder: 'Enter text...' })
  .padding(12)
  .border(1, '#e0e0e0')
  .cornerRadius(6)
  .fontSize(16)
  .build()

// Typography styles
const titleText = Text("Page Title")
  .fontSize(28)
  .fontWeight('bold')
  .foregroundColor('#1a1a1a')
  .build()

const headingText = Text("Section Heading")
  .fontSize(20)
  .fontWeight('600')
  .foregroundColor('#333333')
  .build()

const bodyText = Text("Regular body text content goes here.")
  .fontSize(16)
  .lineHeight(1.5)
  .foregroundColor('#666666')
  .build()

const captionText = Text("Small caption or helper text")
  .fontSize(12)
  .foregroundColor('#999999')
  .build()
```

## Interactive Examples

### Toggle Switch

```typescript
import { Toggle, VStack, HStack, Text, createSignal } from '@tachui/core'

function ToggleSwitch(props: { label: string; initialValue?: boolean }) {
  const [isOn, setIsOn] = createSignal(props.initialValue || false)
  
  const toggle = HStack({
    children: [
      Text(props.label)
        .fontSize(16)
        .foregroundColor('#1a1a1a')
        .build(),
      
      Toggle({ 
        isOn: isOn(), 
        onToggle: (value) => setIsOn(value) 
      })
    ],
    spacing: 12,
    alignment: 'center'
  })
  .padding(12, 12)
  .build()
  
  return toggle
}

const settingsPanel = VStack({
  children: [
    ToggleSwitch({ label: 'Enable notifications', initialValue: true }),
    ToggleSwitch({ label: 'Dark mode' }),
    ToggleSwitch({ label: 'Auto-sync' })
  ],
  spacing: 16
})
.backgroundColor('#f8f9fa')
.cornerRadius(8)
.padding(16)
.build()
```

### Input Form

```typescript
import { VStack, Text, TextField, Button, createSignal } from '@tachui/core'

function LoginForm() {
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [isLoading, setIsLoading] = createSignal(false)
  
  const handleSubmit = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }
  
  return VStack({
    children: [
      Text("Welcome Back")
        .fontSize(24)
        .fontWeight('bold')
        .foregroundColor('#1a1a1a')
        .margin({ bottom: 8 })
        .build(),
      
      Text("Sign in to your account")
        .fontSize(16)
        .foregroundColor('#666')
        .margin({ bottom: 24 })
        .build(),
      
      TextField({
        type: 'email',
        placeholder: 'Email address',
        value: email(),
        onChange: setEmail
      })
      .padding(12)
      .fontSize(16)
      .border(1, '#e0e0e0')
      .cornerRadius(8)
      .frame({ width: '100%' })
      .transition('border-color', 200)
      .margin({ bottom: 16 })
      .build(),
      
      TextField({
        type: 'password',
        placeholder: 'Password',
        value: password(),
        onChange: setPassword
      })
      .padding(12)
      .fontSize(16)
      .border(1, '#e0e0e0')
      .cornerRadius(8)
      .frame({ width: '100%' })
      .transition('border-color', 200)
      .margin({ bottom: 24 })
      .build(),
      
      Button(
        () => isLoading() ? 'Signing in...' : 'Sign In',
        handleSubmit
      )
      .backgroundColor('#007AFF')
      .foregroundColor('#ffffff')
      .fontSize(16)
      .fontWeight('600')
      .padding(12)
      .cornerRadius(8)
      .frame({ width: '100%' })
      .disabled(isLoading())
      .transition('all', 200)
      .build()
    ],
    spacing: 0,
    alignment: 'center'
  })
  .backgroundColor('#ffffff')
  .padding(32)
  .cornerRadius(12)
  .shadow({ x: 0, y: 8, radius: 24, color: 'rgba(0,0,0,0.1)' })
  .frame({ maxWidth: 400 })
  .build()
}
```

## Layout Examples

### Dashboard Grid

```typescript
import { VStack, HStack, Text } from '@tachui/core'

function StatCard(props: { title: string; value: string; change: string; trend: 'up' | 'down' }) {
  const trendColor = props.trend === 'up' ? '#28a745' : '#dc3545'
  
  return VStack({
    children: [
      Text(props.title)
        .fontSize(14)
        .foregroundColor('#666')
        .fontWeight('500')
        .build(),
      
      Text(props.value)
        .fontSize(32)
        .fontWeight('bold')
        .foregroundColor('#1a1a1a')
        .margin({ vertical: 8 })
        .build(),
      
      Text(props.change)
        .fontSize(14)
        .foregroundColor(trendColor)
        .fontWeight('500')
        .build()
    ],
    spacing: 0,
    alignment: 'leading'
  })
  .backgroundColor('#ffffff')
  .padding(20)
  .cornerRadius(8)
  .border(1, '#f0f0f0')
  .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.08)' })
  .frame({ minWidth: 200 })
  .build()
}

const dashboard = VStack({
  children: [
    Text("Dashboard")
      .fontSize(28)
      .fontWeight('bold')
      .margin({ bottom: 24 })
      .build(),
    
    // Stats grid (would need CSS Grid or custom layout for real grid)
    HStack({
      children: [
        StatCard({ title: 'Total Revenue', value: '$12,345', change: '+12.5%', trend: 'up' }),
        StatCard({ title: 'Active Users', value: '8,234', change: '+5.2%', trend: 'up' }),
        StatCard({ title: 'Conversion Rate', value: '3.2%', change: '-0.8%', trend: 'down' }),
        StatCard({ title: 'Avg. Order Value', value: '$85.40', change: '+8.1%', trend: 'up' })
      ],
      spacing: 16
    })
  ],
  spacing: 0
})
.padding(24)
.backgroundColor('#f8f9fa')
.frame({ minHeight: '100vh' })
.build()
```

### Navigation Bar

```typescript
import { HStack, Text, Button } from '@tachui/core'

function NavigationBar() {
  return HStack({
    children: [
      // Logo
      Text("TachUI")
        .fontSize(20)
        .fontWeight('bold')
        .foregroundColor('#007AFF')
        .build(),
      
      // Spacer (would need flex-grow implementation)
      Text('')
        .frame({ flex: 1 })
        .build(),
      
      // Navigation links
      HStack({
        children: [
          Text("Home")
            .fontSize(16)
            .foregroundColor('#1a1a1a')
            .onTap(() => console.log('Home clicked'))
            .padding({ horizontal: 12, vertical: 8 })
            .cornerRadius(4)
            .transition('background-color', 200)
            .build(),
          
          Text("About")
            .fontSize(16)
            .foregroundColor('#1a1a1a')
            .onTap(() => console.log('About clicked'))
            .padding({ horizontal: 12, vertical: 8 })
            .cornerRadius(4)
            .transition('background-color', 200)
            .build(),
          
          Text("Contact")
            .fontSize(16)
            .foregroundColor('#1a1a1a')
            .onTap(() => console.log('Contact clicked'))
            .padding({ horizontal: 12, vertical: 8 })
            .cornerRadius(4)
            .transition('background-color', 200)
            .build(),
          
          Button('Get Started', () => {})
            .backgroundColor('#007AFF')
            .foregroundColor('#ffffff')
            .fontSize(14)
            .fontWeight('500')
            .padding({ horizontal: 16, vertical: 8 })
            .cornerRadius(6)
            .transition('all', 200)
            .build()
        ],
        spacing: 8
      })
    ],
    alignment: 'center'
  })
  .backgroundColor('#ffffff')
  .padding({ horizontal: 24, vertical: 16 })
  .border({ bottom: 1, color: '#f0f0f0' })
  .build()
}
```

## Advanced Examples

### Animated Modal

```typescript
import { VStack, HStack, ZStack, Text, Button, createSignal } from '@tachui/core'

function AnimatedModal(props: { isOpen: boolean; onClose: () => void }) {
  const modalContent = VStack({
    children: [
      // Header
      HStack({
        children: [
          Text("Confirm Action")
            .fontSize(20)
            .fontWeight('bold')
            .build(),
          
          Button('×', props.onClose)
            .fontSize(24)
            .backgroundColor('transparent')
            .padding(4)
            .cornerRadius(4)
            .build()
        ],
        alignment: 'center'
      }),
      
      // Body
      Text("Are you sure you want to delete this item? This action cannot be undone.")
        .fontSize(16)
        .foregroundColor('#666')
        .lineHeight(1.5)
        .margin({ vertical: 16 })
        .build(),
      
      // Footer
      HStack({
        children: [
          Button('Cancel', props.onClose)
            .backgroundColor('#f0f0f0')
            .foregroundColor('#333')
            .fontSize(16)
            .padding({ horizontal: 20, vertical: 10 })
            .cornerRadius(6)
            .transition('all', 200)
            .build(),
          
          Button('Delete', () => {})
            .backgroundColor('#dc3545')
            .foregroundColor('#ffffff')
            .fontSize(16)
            .padding({ horizontal: 20, vertical: 10 })
            .cornerRadius(6)
            .transition('all', 200)
            .build()
        ],
        spacing: 12
      })
    ],
    spacing: 0
  })
  .backgroundColor('#ffffff')
  .cornerRadius(12)
  .padding(24)
  .shadow({ x: 0, y: 10, radius: 30, color: 'rgba(0,0,0,0.3)' })
  .frame({ maxWidth: 400 })
  .build()
  
  if (!props.isOpen) return null
  
  return ZStack({
    children: [
      // Backdrop
      VStack()
        .backgroundColor('rgba(0,0,0,0.5)')
        .frame({ width: '100vw', height: '100vh' })
        .animation('fadeIn', 200)
        .onTap(props.onClose)
        .build(),
      
      // Modal
      modalContent
    ],
    alignment: 'center'
  })
  .frame({ width: '100vw', height: '100vh' })
  .build()
}

// Usage
function App() {
  const [showModal, setShowModal] = createSignal(false)
  
  return VStack({
    children: [
      Button('Open Modal', () => setShowModal(true))
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12)
        .cornerRadius(8)
        .build(),
      
      AnimatedModal({
        isOpen: showModal(),
        onClose: () => setShowModal(false)
      })
    ]
  })
}
```

### Responsive Card Grid

```typescript
import { VStack, Text } from '@tachui/core'

function ResponsiveCardGrid(props: { items: Array<{ title: string; description: string }> }) {
  return VStack({
    children: props.items.map(item => 
      VStack({
        children: [
          Text(item.title)
            .fontSize(18)
            .fontWeight('bold')
            .margin({ bottom: 8 })
            .build(),
          
          Text(item.description)
            .fontSize(14)
            .foregroundColor('#666')
            .lineHeight(1.4)
        ]
      })
      .backgroundColor('#ffffff')
      .padding(16)
      .cornerRadius(8)
      .border(1, '#f0f0f0')
      .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.08)' })
      // Responsive behavior would be handled via CSS media queries
      .frame({ width: '100%' }) // Mobile: 1 column
    ),
    spacing: 16
  })
  .padding(16)
}
```

### Theme Switcher

```typescript
import { VStack, Text, Button, createSignal } from '@tachui/core'

// Simplified theme example using signals
function ThemedApp() {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
  
  const toggleTheme = () => {
    setTheme(theme() === 'light' ? 'dark' : 'light')
  }
  
  const colors = () => ({
    light: { bg: '#ffffff', text: '#1a1a1a', border: '#f0f0f0' },
    dark: { bg: '#2d2d2d', text: '#ffffff', border: '#404040' }
  })[theme()]
  
  const themedCard = (title: string, content: string) => VStack({
    children: [
      Text(title)
        .fontSize(18)
        .fontWeight('bold')
        .foregroundColor(() => colors().text)
        .margin({ bottom: 8 }),
      
      Text(content)
        .fontSize(14)
        .foregroundColor(() => colors().text)
        .opacity(0.8)
    ]
  })
  .backgroundColor(() => colors().bg)
  .border(1, () => colors().border)
  .cornerRadius(8)
  .padding(16)
  .transition('all', 300)
  
  const themeToggle = Button(
    () => theme() === 'light' ? '🌙 Dark' : '☀️ Light',
    toggleTheme
  )
  .backgroundColor(() => theme() === 'light' ? '#1a1a1a' : '#ffffff')
  .foregroundColor(() => theme() === 'light' ? '#ffffff' : '#1a1a1a')
  .padding({ horizontal: 16, vertical: 8 })
  .cornerRadius(6)
  .transition('all', 300)
  
  return VStack({
    children: [
      themeToggle,
      themedCard('Card Title', 'This card adapts to the current theme')
    ],
    spacing: 16
  })
}
```

## New Multi-Property Modifiers Examples

### Size and Layout Modifiers

```typescript
import { VStack, Text, Image } from '@tachui/core'

// Responsive card with comprehensive sizing
const responsiveCard = VStack({
  children: [
    Image({ src: '/hero.jpg', alt: 'Hero' })
      .size({
        width: '100%',
        height: 200,
        maxWidth: 800,
        minHeight: 150
      })
      .cornerRadius(8)
      .build(),
    
    Text('Responsive content card')
      .typography({
        size: 18,
        weight: '600',
        align: 'center',
        letterSpacing: '0.5px'
      })
      .margin({ top: 16, horizontal: 12 })
      .build()
  ]
})
.backgroundColor('#ffffff')
.cornerRadius(12)
.margin({ all: 16 })
.maxWidth(600)
.build()

// Flexbox layout with modern styling
const flexContainer = VStack({
  children: [
    Text('Header').typography({ size: 24, weight: 'bold' }).build(),
    Text('Content').flexGrow(1).build(),
    Text('Footer').typography({ size: 14, color: '#666' }).build()
  ]
})
.display('flex')
.justifyContent('space-between')
.alignItems('stretch')
.gap(16)
.minHeight('100vh')
.padding({ all: 24 })
.build()
```

### Comprehensive Border Examples

```typescript
import { createSignal } from '@tachui/core'

// 1. Simple borders (backward compatible)
const basicCard = Text('Basic border card')
  .padding(16)
  .border(1, '#e0e0e0', 'solid')     // Simple 1px solid border
  .backgroundColor('#f9f9f9')
  .cornerRadius(8)
  .build()

// 2. Individual border sides
const customCard = VStack({ children: [...] })
  .padding(20)
  .border({
    top: { width: 3, color: '#007AFF', style: 'solid' },      // Thick top
    right: { width: 1, color: '#ddd', style: 'dashed' },      // Dashed right
    bottom: { width: 2, color: '#34C759', style: 'dotted' },  // Dotted bottom
    left: { width: 4, color: '#FF3B30' }                      // Left accent
  })
  .backgroundColor('#ffffff')
  .cornerRadius(8)
  .build()

// 3. SwiftUI terminology (LTR-aware)
const swiftUICard = Text('SwiftUI-style borders')
  .padding(16)
  .border({
    leading: { width: 4, color: '#007AFF' },    // Maps to left in LTR
    trailing: { width: 1, color: '#ddd' },      // Maps to right in LTR
    top: { width: 1, color: '#e0e0e0' },
    bottom: { width: 2, color: '#007AFF' }
  })
  .backgroundColor('#f8f9fa')
  .cornerRadius(6)
  .build()

// 4. Shorthand properties
const shorthandCard = VStack({ children: [...] })
  .padding(24)
  .border({
    horizontal: { width: 2, color: '#007AFF', style: 'solid' }, // Left + right
    vertical: { width: 1, color: '#ddd', style: 'dashed' }      // Top + bottom
  })
  .backgroundColor('#ffffff')
  .cornerRadius(12)
  .build()

// 5. Border direction functions
const functionalCard = Text('Direction functions')
  .padding(16)
  .borderTop(3, '#007AFF', 'solid')         // Top border
  .borderHorizontal(1, '#ddd')              // Left + right borders
  .borderLeading(4, '#34C759')              // SwiftUI leading border
  .backgroundColor('#f9f9f9')
  .cornerRadius(8)
  .build()

// 6. Advanced features with border images
const gradientBorderCard = VStack({ children: [...] })
  .padding(20)
  .border({
    width: 3,
    color: 'transparent', // Required for border-image
    image: 'linear-gradient(45deg, #007AFF, #FF3B30, #34C759)',
    style: 'solid'
  })
  .backgroundColor('#ffffff')
  .cornerRadius(12)
  .build()

// 7. Integrated corner radius with borders
const integratedCard = Text('Border with integrated radius')
  .padding(20)
  .border({
    width: 2,
    color: '#007AFF',
    style: 'solid',
    radius: { 
      topLeft: 12, 
      topRight: 12, 
      bottomLeft: 4, 
      bottomRight: 4 
    }
  })
  .backgroundColor('#f8f9fa')
  .build()

// 8. Reactive borders with Signals
const [isActive, setIsActive] = createSignal(false)
const [theme, setTheme] = createSignal({ borderColor: '#007AFF', accentColor: '#34C759' })

const reactiveCard = Text('Reactive border card')
  .padding(16)
  .border({
    width: () => isActive() ? 3 : 1,              // Dynamic width
    color: () => isActive() 
      ? theme().accentColor 
      : theme().borderColor,                      // Dynamic color
    style: () => isActive() ? 'solid' : 'dashed'  // Dynamic style
  })
  .backgroundColor(() => isActive() ? '#f0f8ff' : '#ffffff')
  .cornerRadius(8)
  .onTap(() => setIsActive(!isActive()))
  .build()

// 9. Typography with emphasis borders
const styledQuote = Text('"Design is not just what it looks like. Design is how it works." - Steve Jobs')
  .typography({
    size: 18,
    weight: '400',
    family: 'Georgia, serif',
    lineHeight: 1.6,
    align: 'center',
    style: 'italic',
    color: '#2c3e50'
  })
  .margin({ vertical: 24, horizontal: 16 })
  .padding({ vertical: 20, horizontal: 24 })
  .borderLeft(4, '#3498db')                    // Left accent border
  .backgroundColor('#f8f9fa')
  .cornerRadius(8)
  .build()

// 10. Call-to-action with complex borders
const ctaCard = VStack({
  children: [
    Text('Special Offer!')
      .typography({
        size: 20,
        weight: 'bold',
        transform: 'uppercase',
        letterSpacing: '1px',
        color: '#e74c3c'
      })
      .build(),
    
    Text('Get 50% off your first purchase')
      .typography({
        size: 16,
        lineHeight: 1.4,
        color: '#2c3e50'
      })
      .margin({ vertical: 12 })
      .build()
  ]
})
.padding({ all: 24 })
.backgroundColor('#ffffff')
.border({
  top: { width: 3, color: '#e74c3c' },
  bottom: { width: 3, color: '#e74c3c' },
  horizontal: { width: 1, color: '#f1c0bd' }   // Subtle side borders
})
.cornerRadius(8)
.shadow({ x: 0, y: 4, radius: 12, color: 'rgba(231, 76, 60, 0.2)' })
.build()
```

## Visual Effects & Backdrop Filter Examples

### Backdrop Filter Modifiers

```typescript
// Modern glassmorphism with backdrop filter modifiers
const modernGlassmorphismCard = VStack({
  children: [
    Text('Native Backdrop Filters')
      .fontSize(20)
      .fontWeight('600')
      .foregroundColor('#ffffff')
      .build(),
      
    Text('Built-in browser compatibility and fallbacks')
      .fontSize(14)
      .foregroundColor('rgba(255, 255, 255, 0.8)')
      .marginTop(8)
      .build()
  ]
})
.backdropFilter(
  { 
    blur: 16, 
    saturate: 1.3, 
    brightness: 1.1 
  },
  'rgba(255, 255, 255, 0.85)' // Automatic fallback for unsupported browsers
)
.backgroundColor('rgba(255, 255, 255, 0.1)')
.padding(24)
.cornerRadius(16)
.border(1, 'rgba(255, 255, 255, 0.2)')
.shadow({ x: 0, y: 8, radius: 20, color: 'rgba(0, 0, 0, 0.15)' })
.build()

// Glassmorphism presets
const lightGlassCard = Text('Light Glass Effect')
  .glassmorphism('light') // Preset with optimized parameters
  .backgroundColor('rgba(255, 255, 255, 0.08)')
  .padding(16)
  .cornerRadius(12)
  .build()

const heavyGlassCard = Text('Heavy Glass Effect')
  .glassmorphism('heavy') // Strong glassmorphism for emphasis
  .backgroundColor('rgba(255, 255, 255, 0.15)')
  .padding(20)
  .cornerRadius(16)
  .border(1, 'rgba(255, 255, 255, 0.25)')
  .build()

// ColorAsset integration
import { Colors } from './assets'
const themedGlassCard = Text('Themed Glass Effect')
  .backdropFilter(
    { blur: 12, saturate: 1.2 },
    Colors.glass.fallback // ColorAsset fallback
  )
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .padding(20)
  .cornerRadius(14)
  .build()

// Complex backdrop filters
const advancedBackdropCard = VStack({
  children: [
    Text('Advanced Backdrop Effects')
      .fontSize(18)
      .fontWeight('600')
      .build()
  ]
})
.backdropFilter({
  blur: 20,
  brightness: 1.15,
  contrast: 1.05,
  saturate: 1.4,
  dropShadow: {
    x: 0,
    y: 4,
    blur: 8,
    color: 'rgba(0, 0, 0, 0.2)'
  }
})
.backgroundColor('rgba(255, 255, 255, 0.12)')
.padding(24)
.cornerRadius(16)
.border(1, 'rgba(255, 255, 255, 0.18)')
.build()

// CSS string format for custom effects
const customBackdropCard = Text('Custom Backdrop Filter')
  .backdropFilter('blur(15px) hue-rotate(45deg) saturate(1.6)')
  .backgroundColor('rgba(255, 255, 255, 0.1)')
  .padding(18)
  .cornerRadius(12)
  .build()
```

### Interactive Glass Effects

```typescript
// Reactive glassmorphism based on state
const [isActive, setIsActive] = createSignal(false)
const interactiveGlassButton = Text('Interactive Glass')
  .glassmorphism(() => isActive() ? 'heavy' : 'medium')
  .backgroundColor(() => 
    isActive() 
      ? 'rgba(0, 122, 255, 0.15)' 
      : 'rgba(255, 255, 255, 0.1)'
  )
  .foregroundColor(() => isActive() ? '#007AFF' : '#000000')
  .padding({ horizontal: 20, vertical: 12 })
  .cornerRadius(10)
  .cursor('pointer')
  .transition('all', 200, 'ease-out')
  .onTap(() => setIsActive(!isActive()))
  .build()

// Hover-responsive glass effect
const [isHovered, setIsHovered] = createSignal(false)
const hoverGlassCard = VStack({
  children: [
    Text('Hover for Enhanced Glass')
      .fontSize(16)
      .fontWeight('500')
      .build()
  ]
})
.backdropFilter(
  () => isHovered() 
    ? { blur: 24, saturate: 1.5, brightness: 1.2 }
    : { blur: 12, saturate: 1.2, brightness: 1.05 }
)
.backgroundColor(() => 
  isHovered() 
    ? 'rgba(255, 255, 255, 0.18)' 
    : 'rgba(255, 255, 255, 0.1)'
)
.padding(20)
.cornerRadius(14)
.border(1, () => 
  isHovered() 
    ? 'rgba(255, 255, 255, 0.3)' 
    : 'rgba(255, 255, 255, 0.15)'
)
.transform(() => isHovered() ? 'translateY(-2px)' : 'translateY(0)')
.transition('all', 300, 'cubic-bezier(0.4, 0, 0.2, 1)')
.onHover(setIsHovered)
.cursor('pointer')
.build()
```

### Glassmorphism Navigation

```typescript
// Glass navigation bar
const glassNavigation = HStack({
  children: [
    Text('Home').padding({ horizontal: 16, vertical: 8 }).build(),
    Text('About').padding({ horizontal: 16, vertical: 8 }).build(),
    Text('Contact').padding({ horizontal: 16, vertical: 8 }).build()
  ],
  spacing: 12
})
.glassmorphism('light')
.backgroundColor('rgba(255, 255, 255, 0.8)')
.padding({ horizontal: 20, vertical: 12 })
.cornerRadius(24)
.border(1, 'rgba(255, 255, 255, 0.3)')
.position('fixed')
.top(20)
.left('50%')
.transform('translateX(-50%)')
.shadow({ x: 0, y: 4, radius: 16, color: 'rgba(0, 0, 0, 0.08)' })
.zIndex(100)
.build()

// Glass modal overlay
const glassModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null
  
  return VStack({
    children: [
      VStack({
        children: [
          Text('Glass Modal')
            .fontSize(20)
            .fontWeight('600')
            .marginBottom(16)
            .build(),
            
          Text('Beautiful backdrop blur with automatic fallbacks')
            .fontSize(14)
            .opacity(0.8)
            .textAlign('center')
            .marginBottom(20)
            .build(),
            
          Button('Close', onClose)
            .backgroundColor('#007AFF')
            .foregroundColor('#ffffff')
            .padding({ horizontal: 20, vertical: 10 })
            .cornerRadius(8)
            .build()
        ]
      })
      .glassmorphism('heavy')
      .backgroundColor('rgba(255, 255, 255, 0.15)')
      .padding(32)
      .cornerRadius(20)
      .border(1, 'rgba(255, 255, 255, 0.2)')
      .shadow({ x: 0, y: 16, radius: 32, color: 'rgba(0, 0, 0, 0.2)' })
      .maxWidth(400)
      .build()
    ]
  })
  .position('fixed')
  .top(0)
  .left(0)
  .width('100vw')
  .height('100vh')
  .backgroundColor('rgba(0, 0, 0, 0.4)')
  .justifyContent('center')
  .alignItems('center')
  .zIndex(1000)
  .onTap((e) => {
    if (e.target === e.currentTarget) onClose()
  })
  .build()
}
```

## Raw CSS Modifier Examples

### Legacy CSS Implementation

```typescript
// Legacy glassmorphism effect with CSS modifiers (for comparison)
const legacyGlassmorphismCard = VStack({
  children: [
    Text('Glassmorphism UI')
      .typography({
        size: 24,
        weight: '600',
        color: 'white'
      })
      .build(),
    
    Text('Beautiful frosted glass effect using modern CSS')
      .typography({
        size: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 1.5
      })
      .margin({ top: 8 })
      .build()
  ]
})
.padding({ all: 32 })
.css({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px) saturate(200%)',
  WebkitBackdropFilter: 'blur(10px) saturate(200%)', // Safari support
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
})
.cornerRadius(16)
.build()

// Container queries for responsive design
const containerQueryCard = VStack({
  children: [
    Text('Responsive with Container Queries')
      .typography({ size: 18, weight: '600' })
      .build()
  ]
})
.padding({ all: 16 })
.backgroundColor('#f0f8ff')
.css({
  containerType: 'inline-size',
  '@container (min-width: 300px)': {
    padding: '24px',
    fontSize: '20px'
  },
  '@container (min-width: 500px)': {
    padding: '32px',
    fontSize: '24px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  }
})
.build()
```

### CSS Custom Properties and Theming

```typescript
import { createSignal } from '@tachui/core'

// Theme-aware component with CSS variables
function ThemedComponent() {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
  
  const themeButton = Button(
    () => `Switch to ${theme() === 'light' ? 'dark' : 'light'} theme`,
    () => setTheme(theme() === 'light' ? 'dark' : 'light')
  )
  .cssVariable('primary-color', () => theme() === 'light' ? '#007AFF' : '#64D2FF')
  .cssVariable('bg-color', () => theme() === 'light' ? '#ffffff' : '#1a1a1a')
  .cssVariable('text-color', () => theme() === 'light' ? '#1a1a1a' : '#ffffff')
  .css({
    backgroundColor: 'var(--primary-color)',
    color: 'var(--bg-color)',
    border: 'none',
    transition: 'all 0.3s ease'
  })
  .padding({ horizontal: 20, vertical: 12 })
  .cornerRadius(8)
  .build()
  
  const themedCard = VStack({
    children: [
      Text('CSS Variables Demo')
        .typography({ size: 20, weight: 'bold' })
        .css({ color: 'var(--text-color)' })
        .build(),
      
      themedButton
    ],
    spacing: 16
  })
  .cssVariable('bg-color', () => theme() === 'light' ? '#ffffff' : '#1a1a1a')
  .cssVariable('text-color', () => theme() === 'light' ? '#1a1a1a' : '#ffffff')
  .cssVariable('border-color', () => theme() === 'light' ? '#e0e0e0' : '#404040')
  .css({
    backgroundColor: 'var(--bg-color)',
    borderColor: 'var(--border-color)',
    transition: 'all 0.3s ease'
  })
  .padding({ all: 24 })
  .border(1, 'transparent')
  .cornerRadius(12)
  .build()
  
  return themedCard
}
```

### Advanced Grid and Layout

```typescript
// CSS Grid with modern layout features
const gridGallery = VStack({
  children: [
    Text('Photo Gallery')
      .typography({ size: 24, weight: 'bold', align: 'center' })
      .margin({ bottom: 24 })
      .build(),
    
    VStack({ children: [] }) // Grid container
      .css({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'clamp(1rem, 2vw, 2rem)',
        gridAutoRows: 'minmax(200px, auto)',
        // Modern CSS features
        aspectRatio: 'auto',
        containerType: 'inline-size'
      })
      .build()
  ]
})
.padding({ all: 32 })
.css({
  // Scroll snap for smooth scrolling
  scrollSnapType: 'y mandatory',
  scrollBehavior: 'smooth'
})
.build()

// Sticky navigation with scroll effects
const stickyNav = VStack({
  children: [
    Text('Navigation')
      .typography({ size: 18, weight: '600', color: 'white' })
      .build()
  ]
})
.padding({ horizontal: 24, vertical: 16 })
.backgroundColor('#007AFF')
.css({
  position: 'sticky',
  top: '0',
  zIndex: '100',
  backdropFilter: 'blur(8px) saturate(180%)',
  background: 'rgba(0, 122, 255, 0.9)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
})
.build()
```

### Performance and Accessibility

```typescript
// Optimized component with accessibility features
const accessibleCard = VStack({
  children: [
    Text('Accessible Content')
      .typography({
        size: 20,
        weight: '600',
        color: '#1a1a1a'
      })
      .build()
  ]
})
.padding({ all: 20 })
.backgroundColor('#ffffff')
.cornerRadius(8)
.css({
  // Performance optimizations
  willChange: 'transform',
  contain: 'layout style paint',
  
  // Accessibility improvements
  outline: '2px solid transparent',
  outlineOffset: '2px',
  
  // Focus states
  '&:focus-visible': {
    outline: '2px solid #007AFF',
    outlineOffset: '2px'
  },
  
  // Reduced motion support
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    animation: 'none'
  },
  
  // High contrast mode
  '@media (prefers-contrast: high)': {
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#000000'
  }
})
.onTap(() => console.log('Card clicked'))
.accessibilityLabel('Interactive content card')
.build()
```

These examples demonstrate the power and flexibility of TachUI's modifier system for creating complex, interactive, and responsive user interfaces with a clean, declarative API.