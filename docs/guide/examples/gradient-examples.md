# Gradient Examples

Comprehensive examples showcasing TachUI's gradient system with TypeScript annotations and real-world use cases.

## Basic Examples

### Simple Linear Gradient Button

```typescript
import { Button, LinearGradient } from '@tachui/core'

const createGradientButton = (text: string, action: () => void) => {
  return Button(text, action)
    .modifier
    .background(
      LinearGradient({
        colors: ['#667eea', '#764ba2'],
        startPoint: 'top',
        endPoint: 'bottom'
      })
    )
    .foregroundColor('white')
    .fontWeight('600')
    .padding(16)
    .cornerRadius(8)
    .build()
}

// Usage
const myButton = createGradientButton('Click Me', () => {
  console.log('Gradient button clicked!')
})
```

### Diagonal Gradient Card

```typescript
import { VStack, Text, LinearGradient } from '@tachui/core'

const createHeroCard = (title: string, subtitle: string) => {
  const heroGradient = LinearGradient({
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing',
    stops: [0, 50, 100]
  })

  return VStack({ children: [
    Text(title)
      .fontSize(28)
      .fontWeight('bold')
      .foregroundColor('white'),
    Text(subtitle)
      .fontSize(16)
      .opacity(0.9)
      .foregroundColor('white')
  ] })
    .modifier
    .background(heroGradient)
    .padding(32)
    .cornerRadius(16)
    .shadow({ x: 0, y: 4, radius: 20, color: 'rgba(0,0,0,0.1)' })
    .build()
}

// Usage
const heroSection = createHeroCard(
  'Welcome to TachUI',
  'SwiftUI-inspired web framework with gradient support'
)
```

## Theme-Reactive Examples

### Light/Dark Adaptive Gradient

```typescript
import { 
  createGradientAsset, 
  LinearGradient, 
  VStack, 
  Text 
} from '@tachui/core'

const adaptiveGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#ffffff', '#f8f9fa', '#e9ecef'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  dark: LinearGradient({
    colors: ['#343a40', '#495057', '#212529'],
    startPoint: 'top',
    endPoint: 'bottom'
  })
})

const createAdaptiveCard = (content: string) => {
  return VStack({ children: [
    Text(content)
      .fontSize(16)
      .padding(24)
  ] })
    .modifier
    .background(adaptiveGradient)
    .cornerRadius(12)
    .border(1, '#dee2e6')
    .build()
}

// This card automatically adapts to light/dark themes
const adaptiveCard = createAdaptiveCard('This card adapts to your theme!')
```

### Mixed Asset and Static Colors

```typescript
import { Assets, LinearGradient, Button } from '@tachui/core'

// Assumes you have these assets defined
// Assets.brandPrimary, Assets.brandSecondary

const brandGradient = LinearGradient({
  colors: [
    Assets.brandPrimary,    // Theme-reactive brand color
    '#FF6B6B',              // Static accent color
    Assets.brandSecondary,  // Theme-reactive brand color
    'rgba(255, 255, 255, 0.1)' // Static overlay
  ],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing',
  stops: [0, 35, 65, 100]
})

const createBrandButton = (text: string, action: () => void) => {
  return Button(text, action)
    .modifier
    .background(brandGradient)
    .foregroundColor('white')
    .fontWeight('semibold')
    .padding({ top: 12, bottom: 12, left: 24, right: 24 })
    .cornerRadius(25)
    .build()
}
```

## Application Examples

### Calculator Button Grid

```typescript
import { 
  Button, 
  HStack, 
  VStack, 
  LinearGradient, 
  createGradientAsset 
} from '@tachui/core'

// Gradient definitions for different button types
const numberGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#f8f9fa', '#e9ecef'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  dark: LinearGradient({
    colors: ['#495057', '#343a40'],
    startPoint: 'top',
    endPoint: 'bottom'
  })
})

const operatorGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#ff9500', '#ff6b00'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  dark: LinearGradient({
    colors: ['#ff9500', '#cc7700'],
    startPoint: 'top',
    endPoint: 'bottom'
  })
})

const functionGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#6c757d', '#495057'],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  dark: LinearGradient({
    colors: ['#adb5bd', '#868e96'],
    startPoint: 'top',
    endPoint: 'bottom'
  })
})

// Button factory functions
const createNumberButton = (number: string, action: () => void) => {
  return Button(number, action)
    .modifier
    .background(numberGradient)
    .foregroundColor(Assets.textPrimary)
    .fontSize(24)
    .fontWeight('400')
    .frame(60, 60)
    .cornerRadius(30)
    .build()
}

const createOperatorButton = (operator: string, action: () => void) => {
  return Button(operator, action)
    .modifier
    .background(operatorGradient)
    .foregroundColor('white')
    .fontSize(24)
    .fontWeight('600')
    .frame(60, 60)
    .cornerRadius(30)
    .build()
}

const createFunctionButton = (fn: string, action: () => void) => {
  return Button(fn, action)
    .modifier
    .background(functionGradient)
    .foregroundColor('white')
    .fontSize(18)
    .fontWeight('500')
    .frame(60, 60)
    .cornerRadius(30)
    .build()
}

// Calculator layout
const createCalculatorButtons = () => {
  return VStack({ children: [
    // Function row
    HStack({ children: [
      createFunctionButton('AC', () => console.log('Clear')),
      createFunctionButton('±', () => console.log('Plus/Minus')),
      createFunctionButton('%', () => console.log('Percent')),
      createOperatorButton('÷', () => console.log('Divide'))
    ] }),
    
    // Number rows
    HStack({ children: [
      createNumberButton('7', () => console.log('7')),
      createNumberButton('8', () => console.log('8')),
      createNumberButton('9', () => console.log('9')),
      createOperatorButton('×', () => console.log('Multiply'))
    ] }),
    
    HStack({ children: [
      createNumberButton('4', () => console.log('4')),
      createNumberButton('5', () => console.log('5')),
      createNumberButton('6', () => console.log('6')),
      createOperatorButton('−', () => console.log('Subtract'))
    ] }),
    
    HStack({ children: [
      createNumberButton('1', () => console.log('1')),
      createNumberButton('2', () => console.log('2')),
      createNumberButton('3', () => console.log('3')),
      createOperatorButton('+', () => console.log('Add'))
    ] })
  ] })
    .modifier
    .gap(8)
    .build()
}
```

### Dashboard Card System

```typescript
import { 
  VStack, 
  HStack, 
  Text, 
  LinearGradient, 
  createGradientAsset 
} from '@tachui/core'

// Gradient themes for different card types
const successGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#d4edda', '#c3e6cb'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),
  dark: LinearGradient({
    colors: ['#155724', '#1e7e34'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  })
})

const warningGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#fff3cd', '#ffeaa7'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),
  dark: LinearGradient({
    colors: ['#856404', '#b8860b'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  })
})

const infoGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#cce7ff', '#b8daff'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),
  dark: LinearGradient({
    colors: ['#004085', '#0056b3'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  })
})

interface MetricCardProps {
  title: string
  value: string
  change: string
  type: 'success' | 'warning' | 'info'
}

const createMetricCard = ({ title, value, change, type }: MetricCardProps) => {
  const gradientMap = {
    success: successGradient,
    warning: warningGradient,
    info: infoGradient
  }

  return VStack({ children: [
    Text(title)
      .fontSize(14)
      .fontWeight('500')
      .opacity(0.8),
    Text(value)
      .fontSize(28)
      .fontWeight('bold')
      .margin({ top: 8 }),
    Text(change)
      .fontSize(12)
      .opacity(0.7)
      .margin({ top: 4 })
  ] })
    .modifier
    .background(gradientMap[type])
    .padding(20)
    .cornerRadius(16)
    .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
    .minWidth(200)
    .build()
}

// Dashboard layout
const createDashboard = () => {
  return VStack({ children: [
    Text('Dashboard Overview')
      .fontSize(24)
      .fontWeight('bold')
      .margin({ bottom: 24 }),
    
    HStack({ children: [
      createMetricCard({
        title: 'Total Revenue',
        value: '$124,563',
        change: '+12.5% from last month',
        type: 'success'
      }),
      createMetricCard({
        title: 'Active Users',
        value: '8,429',
        change: '+2.1% from last week',
        type: 'info'
      }),
      createMetricCard({
        title: 'Server Load',
        value: '78%',
        change: 'Approaching capacity',
        type: 'warning'
      })
    ] })
      .modifier
      .gap(20)
      .build()
  ] })
    .modifier
    .padding(32)
    .build()
}
```

### Navigation Header with Gradient

```typescript
import { 
  HStack, 
  Text, 
  Button, 
  LinearGradient, 
  createGradientAsset 
} from '@tachui/core'

const headerGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#667eea', '#764ba2', '#8b4cb8'],
    startPoint: 'leading',
    endPoint: 'trailing'
  }),
  dark: LinearGradient({
    colors: ['#4a5568', '#2d3748', '#1a202c'],
    startPoint: 'leading',
    endPoint: 'trailing'
  })
})

const createNavHeader = () => {
  return HStack({ children: [
    // Logo/Brand
    Text('TachUI')
      .fontSize(20)
      .fontWeight('bold')
      .foregroundColor('white'),
    
    // Spacer (this would need to be implemented)
    // Spacer(),
    
    // Navigation items
    HStack({ children: [
      Button('Features', () => console.log('Features'))
        .modifier
        .foregroundColor('white')
        .backgroundColor('rgba(255,255,255,0.1)')
        .padding({ top: 8, bottom: 8, left: 16, right: 16 })
        .cornerRadius(6)
        .build(),
      
      Button('Docs', () => console.log('Docs'))
        .modifier
        .foregroundColor('white')
        .backgroundColor('rgba(255,255,255,0.1)')
        .padding({ top: 8, bottom: 8, left: 16, right: 16 })
        .cornerRadius(6)
        .build(),
      
      Button('GitHub', () => console.log('GitHub'))
        .modifier
        .foregroundColor('white')
        .backgroundColor('rgba(255,255,255,0.2)')
        .padding({ top: 8, bottom: 8, left: 16, right: 16 })
        .cornerRadius(6)
        .border(1, 'rgba(255,255,255,0.3)')
        .build()
    ] })
      .modifier
      .gap(12)
      .build()
  ] })
    .modifier
    .background(headerGradient)
    .padding({ top: 16, bottom: 16, left: 32, right: 32 })
    .justifyContent('space-between')
    .alignItems('center')
    .build()
}
```

## Advanced Color Techniques

### Multi-Stop Gradients

```typescript
import { LinearGradient } from '@tachui/core'

const sunsetGradient = LinearGradient({
  colors: [
    '#ff7f50',  // Coral
    '#ff6347',  // Tomato  
    '#ff4500',  // OrangeRed
    '#ff1493',  // DeepPink
    '#8a2be2'   // BlueViolet
  ],
  startPoint: 'top',
  endPoint: 'bottom',
  stops: [0, 25, 50, 75, 100]
})

const rainbowGradient = LinearGradient({
  colors: [
    '#ff0000', // Red
    '#ff7f00', // Orange
    '#ffff00', // Yellow
    '#00ff00', // Green
    '#0000ff', // Blue
    '#4b0082', // Indigo
    '#9400d3'  // Violet
  ],
  startPoint: 'leading',
  endPoint: 'trailing',
  stops: [0, 16.67, 33.33, 50, 66.67, 83.33, 100]
})
```

### Subtle UI Gradients

```typescript
import { LinearGradient, createGradientAsset } from '@tachui/core'

// Subtle gradients for modern UI elements
const subtleCardGradient = createGradientAsset({
  light: LinearGradient({
    colors: [
      'rgba(255, 255, 255, 1)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(248, 249, 250, 1)'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  }),
  dark: LinearGradient({
    colors: [
      'rgba(52, 58, 64, 1)',
      'rgba(52, 58, 64, 0.9)',
      'rgba(33, 37, 41, 1)'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  })
})

const glassEffectGradient = LinearGradient({
  colors: [
    'rgba(255, 255, 255, 0.25)',
    'rgba(255, 255, 255, 0.1)',
    'rgba(255, 255, 255, 0.05)'
  ],
  startPoint: 'topLeading',
  endPoint: 'bottomTrailing'
})
```

## TypeScript Integration

### Gradient Factory with Type Safety

```typescript
import { LinearGradient, createGradientAsset } from '@tachui/core'
import type { GradientDefinition, GradientAssetDefinitions } from '@tachui/core'

interface GradientTheme {
  primary: GradientDefinition
  secondary: GradientDefinition
  accent: GradientDefinition
}

interface AdaptiveGradientTheme {
  primary: GradientAsset
  secondary: GradientAsset
  accent: GradientAsset
}

const createGradientTheme = (): AdaptiveGradientTheme => {
  return {
    primary: createGradientAsset({
      light: LinearGradient({
        colors: ['#007bff', '#0056b3'],
        startPoint: 'top',
        endPoint: 'bottom'
      }),
      dark: LinearGradient({
        colors: ['#0d6efd', '#0b5ed7'],
        startPoint: 'top',
        endPoint: 'bottom'
      })
    }),
    
    secondary: createGradientAsset({
      light: LinearGradient({
        colors: ['#6c757d', '#495057'],
        startPoint: 'top',
        endPoint: 'bottom'
      }),
      dark: LinearGradient({
        colors: ['#adb5bd', '#6c757d'],
        startPoint: 'top',
        endPoint: 'bottom'
      })
    }),
    
    accent: createGradientAsset({
      light: LinearGradient({
        colors: ['#20c997', '#17a2b8'],
        startPoint: 'topLeading',
        endPoint: 'bottomTrailing'
      }),
      dark: LinearGradient({
        colors: ['#20c997', '#0dcaf0'],
        startPoint: 'topLeading',
        endPoint: 'bottomTrailing'
      })
    })
  }
}

// Usage with full type safety
const gradientTheme = createGradientTheme()
const primaryButton = Button('Primary', () => {})
  .modifier
  .background(gradientTheme.primary)
  .build()
```

## Testing Examples

### Gradient Testing Utilities

```typescript
import { LinearGradient, generateLinearGradientCSS } from '@tachui/core'

// Test gradient CSS generation
const testGradient = LinearGradient({
  colors: ['#ff0000', '#00ff00'],
  startPoint: 'top',
  endPoint: 'bottom'
})

// This should generate: 'linear-gradient(to bottom, #ff0000, #00ff00)'
const css = generateLinearGradientCSS(testGradient.options)
console.log('Generated CSS:', css)

// Test with color stops
const stoppedGradient = LinearGradient({
  colors: ['#ff0000', '#ffff00', '#00ff00'],
  startPoint: 'top',
  endPoint: 'bottom',
  stops: [0, 50, 100]
})

// This should generate: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 50%, #00ff00 100%)'
const stoppedCSS = generateLinearGradientCSS(stoppedGradient.options)
console.log('Stopped CSS:', stoppedCSS)
```

These examples demonstrate the full capabilities of TachUI's gradient system with proper TypeScript annotations and real-world use cases. All examples are ready to use and follow TachUI's component patterns.