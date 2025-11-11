# Advanced Visual Effects Examples

Real-world examples showcasing tachUI's advanced visual effects, hover interactions, and modern CSS features.

## Glassmorphism Card

Create modern glass-like UI elements with backdrop blur and transparency:

```typescript
import { VStack, HStack, Text, Button } from '@tachui/core'

const GlassmorphismCard = () =>
  VStack([
    Text("Glassmorphism Card")
      .font({ size: 24, weight: 'bold' })
      .foregroundColor('white')
      ,
    
    Text("Beautiful glass effect with backdrop blur")
      .opacity(0.9)
      .foregroundColor('white')
      ,
    
    Button("Learn More")
      .backgroundColor('rgba(255,255,255,0.2)')
      .foregroundColor('white')
      .border({ width: 1, color: 'rgba(255,255,255,0.3)' })
      .cornerRadius(8)
      .padding({ horizontal: 20, vertical: 10 })
      .hoverEffect('highlight')
      
  ])
  .glassmorphism('medium') // Built-in glassmorphism preset
  .padding(32)
  .cornerRadius(20)
  .border({ width: 1, color: 'rgba(255,255,255,0.2)' })
  .shadow({ x: 0, y: 8, blur: 32, color: 'rgba(0,0,0,0.12)' })
  
```

## Interactive Hover Gallery

Image gallery with advanced hover effects and transforms:

```typescript
import { HStack, VStack, Image, Text } from '@tachui/core'

const ImageCard = ({ src, title }: { src: string, title: string }) =>
  VStack([
    Image({ src })
      .css({ 
        width: '100%', 
        height: '200px', 
        objectFit: 'cover' 
      })
      .cornerRadius(12)
      .transition('all', 300, 'ease-out')
      .hover({
        transform: 'scale(1.05)',
        filter: 'brightness(1.1) saturate(1.2)'
      })
      ,
    
    Text(title)
      .font({ size: 16, weight: '600' })
      .textAlign('center')
      
  ])
  .padding(16)
  .backgroundColor('white')
  .cornerRadius(16)
  .shadow({ x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.1)' })
  .hoverWithTransition({
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
  }, 250)
  .cursor('pointer')
  

const HoverGallery = () =>
  HStack([
    ImageCard({ src: 'nature1.jpg', title: 'Mountain Vista' }),
    ImageCard({ src: 'nature2.jpg', title: 'Ocean Waves' }),
    ImageCard({ src: 'nature3.jpg', title: 'Forest Path' })
  ])
  .gap(24)
  .padding(32)
  
```

## Animated Filter Effects

Dynamic filter effects with smooth transitions:

```typescript
import { VStack, Button, Image, createSignal } from '@tachui/core'

const FilterDemo = () => {
  const [currentFilter, setCurrentFilter] = createSignal('none')
  
  const getFilterStyle = () => {
    switch (currentFilter()) {
      case 'vintage': return 'sepia(0.8) contrast(1.2) brightness(1.1)'
      case 'bw': return 'grayscale(1) contrast(1.1)'
      case 'warm': return 'hue-rotate(15deg) saturate(1.3) brightness(1.1)'
      case 'cool': return 'hue-rotate(-15deg) saturate(1.2) brightness(0.95)'
      case 'blur': return 'blur(3px) brightness(1.1)'
      default: return 'none'
    }
  }
  
  return VStack([
    // Image with dynamic filter
    Image({ src: 'sample-photo.jpg' })
      .css({ 
        width: '400px', 
        height: '300px', 
        objectFit: 'cover' 
      })
      .filter(() => getFilterStyle())
      .transition('filter', 400, 'ease-out')
      .cornerRadius(16)
      ,
    
    // Filter control buttons
    HStack([
      Button("None", () => setCurrentFilter('none')),
      Button("Vintage", () => setCurrentFilter('vintage')),
      Button("B&W", () => setCurrentFilter('bw')),
      Button("Warm", () => setCurrentFilter('warm')),
      Button("Cool", () => setCurrentFilter('cool')),
      Button("Blur", () => setCurrentFilter('blur'))
    ])
    .gap(12)
    
  ])
  .padding(32)
  .gap(24)
  
}
```

## 3D Transform Showcase

Interactive 3D effects and transforms:

```typescript
import { VStack, Button, Text, createSignal } from '@tachui/core'

const Transform3DCard = () => {
  const [rotationX, setRotationX] = createSignal(0)
  const [rotationY, setRotationY] = createSignal(0)
  const [isFlipped, setFlipped] = createSignal(false)
  
  return VStack([
    // 3D rotating card
    VStack([
      Text("3D Transform Card")
        .font({ size: 20, weight: 'bold' })
        .foregroundColor('white')
        ,
      
      Text(() => `X: ${rotationX()}° Y: ${rotationY()}°`)
        .foregroundColor('rgba(255,255,255,0.8)')
        
    ])
    .css({ 
      width: '300px', 
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    })
    .backgroundColor('#4F46E5')
    .cornerRadius(16)
    .perspective(1000)
    .transform(() => `rotateX(${rotationX()}deg) rotateY(${rotationY()}deg)`)
    .transition('transform', 300, 'ease-out')
    ,
    
    // Control buttons
    HStack([
      Button("Rotate X+", () => setRotationX(rotationX() + 15)),
      Button("Rotate X-", () => setRotationX(rotationX() - 15)),
      Button("Rotate Y+", () => setRotationY(rotationY() + 15)),
      Button("Rotate Y-", () => setRotationY(rotationY() - 15)),
      Button("Reset", () => {
        setRotationX(0)
        setRotationY(0)
      })
    ])
    .gap(8)
    ,
    
    // Flip card demo
    VStack()
      .css({ 
        width: '200px', 
        height: '120px',
        position: 'relative'
      })
      .perspective(1000)
      .onTap(() => setFlipped(!isFlipped()))
      .cursor('pointer')
      
  ])
  .padding(32)
  .gap(32)
  .alignItems('center')
  
}
```

## Loading States with Blur

Create engaging loading states using blur effects:

```typescript
import { VStack, Text, Button, createSignal, createEffect } from '@tachui/core'

const BlurLoadingDemo = () => {
  const [isLoading, setLoading] = createSignal(false)
  const [content, setContent] = createSignal("Click to load content")
  
  const simulateLoading = async () => {
    setLoading(true)
    setContent("Loading...")
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setContent("Content loaded successfully!")
    setLoading(false)
  }
  
  return VStack([
    // Content with conditional blur
    VStack([
      Text(() => content())
        .font({ size: 18 })
        .textAlign('center')
        ,
      
      Text("This content blurs while loading")
        .opacity(0.7)
        .textAlign('center')
        
    ])
    .padding(32)
    .backgroundColor('white')
    .cornerRadius(12)
    .blur(() => isLoading() ? 4 : 0)
    .transition('filter', 300, 'ease-out')
    ,
    
    // Loading overlay
    VStack([
      Text("Loading...")
        .font({ size: 16, weight: '600' })
        .foregroundColor('#4F46E5')
        
    ])
    .css({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    })
    .opacity(() => isLoading() ? 1 : 0)
    .transition('opacity', 200)
    ,
    
    Button("Simulate Loading", simulateLoading)
      .padding({ horizontal: 20, vertical: 10 })
      
  ])
  .css({ position: 'relative' })
  .padding(32)
  .gap(24)
  
}
```

## Advanced Hover Menu

Create sophisticated navigation with multiple hover effects:

```typescript
import { HStack, VStack, Text, createSignal } from '@tachui/core'

const NavItem = (title: string, isActive = false) => {
  const [isHovered, setHovered] = createSignal(false)
  
  return VStack([
    Text(title)
      .foregroundColor(() => 
        isActive ? '#4F46E5' : 
        isHovered() ? '#6366F1' : '#6B7280'
      )
      .font({ weight: isActive ? '600' : '500' })
      ,
    
    // Animated underline
    VStack()
      .css({ height: '2px' })
      .backgroundColor('#4F46E5')
      .cornerRadius(1)
      .scaleEffect(() => (isActive || isHovered()) ? 1 : 0, 1)
      .transition('transform', 200, 'ease-out')
      
  ])
  .padding({ horizontal: 16, vertical: 12 })
  .cursor('pointer')
  .onMouseEnter(() => setHovered(true))
  .onMouseLeave(() => setHovered(false))
  .hoverWithTransition({
    transform: 'translateY(-2px)'
  }, 150)
  
}

const AdvancedNavMenu = () =>
  HStack([
    NavItem("Home", true),
    NavItem("About"),
    NavItem("Services"),
    NavItem("Portfolio"),
    NavItem("Contact")
  ])
  .backgroundColor('white')
  .shadow({ x: 0, y: 2, blur: 8, color: 'rgba(0,0,0,0.1)' })
  .cornerRadius(12)
  .padding({ horizontal: 8, vertical: 4 })
  
```

## Performance Tips

### Optimizing Visual Effects

```typescript
// ✅ Good - Use transform and opacity for smooth animations
VStack()
  .transition('transform', 200) // Hardware accelerated
  .hoverEffect('scale')
  

// ✅ Good - Combine filters efficiently  
Image({ src: 'photo.jpg' })
  .filter('blur(2px) brightness(1.1) contrast(1.2)') // Single filter declaration
  

// ✅ Good - Use presets for common effects
VStack()
  .glassmorphism('medium') // Optimized preset
  

// ❌ Avoid - Multiple individual filter calls
Image({ src: 'photo.jpg' })
  .blur(2)
  .brightness(1.1)
  .contrast(1.2) // Creates multiple filter declarations
  
```

### Hardware Acceleration

```typescript
// Force hardware acceleration for complex animations
VStack()
  .css({ willChange: 'transform' }) // Hint to browser
  .transform('translateZ(0)') // Force compositing layer
  
```

These examples demonstrate how tachUI's advanced visual effects can create modern, engaging user interfaces with smooth animations and professional polish. The combination of SwiftUI-style APIs with modern CSS capabilities provides both developer ergonomics and high performance.