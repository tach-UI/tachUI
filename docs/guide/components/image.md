# Image Component

Display images with loading states, content modes, and advanced features like lazy loading and error handling.

## Overview

The Image component provides SwiftUI-style image display with modern web features:

- **Multiple content modes** - control how images fit their containers
- **Loading states** - built-in loading, loaded, and error states
- **Lazy loading** - performance optimization for large image sets
- **Accessibility support** - automatic alt text and ARIA attributes
- **Asset integration** - works with tachUI's ImageAsset system

## Basic Usage

```typescript
import { Image } from '@tachui/core'

// Simple image
Image({ src: 'photo.jpg' })

// With alt text for accessibility
Image({ 
  src: 'profile.jpg',
  alt: 'User profile photo'
})
```

## Props

```typescript
interface ImageProps {
  src?: string | Signal<string> | ImageAsset
  alt?: string
  contentMode?: 'fit' | 'fill' | 'aspectFit' | 'aspectFill'
  loadingStrategy?: 'eager' | 'lazy'
  placeholder?: string
  fallback?: string
  onLoad?: () => void
  onError?: (error: Event) => void
  debugLabel?: string
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string \| Signal<string> \| ImageAsset` | - | Image source URL or asset |
| `alt` | `string` | - | Alternative text for accessibility |
| `contentMode` | `'fit' \| 'fill' \| 'aspectFit' \| 'aspectFill'` | `'fit'` | How image fits container |
| `loadingStrategy` | `'eager' \| 'lazy'` | `'lazy'` | Loading behavior |
| `placeholder` | `string` | - | Placeholder image during loading |
| `fallback` | `string` | - | Fallback image on error |
| `onLoad` | `() => void` | - | Callback when image loads |
| `onError` | `(error: Event) => void` | - | Callback on load error |
| `debugLabel` | `string` | - | Debug identifier |

## Content Modes

Control how images fit within their containers:

### Fit (Default)
Scales image to fit container while preserving aspect ratio:

```typescript
import { Image, VStack } from '@tachui/core'

VStack()
  .modifier
  .size({ width: 300, height: 200 })
  .backgroundColor('#f0f0f0')
  .build()
  .children([
    Image({ 
      src: 'wide-photo.jpg',
      contentMode: 'fit' // Image fits within bounds
    })
  ])
```

### Fill
Stretches image to fill container exactly:

```typescript
Image({ 
  src: 'photo.jpg',
  contentMode: 'fill' // May distort aspect ratio
})
.modifier
.size({ width: 200, height: 200 })
.build()
```

### Aspect Fit
Scales to fit while preserving aspect ratio:

```typescript
Image({ 
  src: 'tall-photo.jpg',
  contentMode: 'aspectFit' // Maintains aspect ratio, may have empty space
})
.modifier
.size({ width: 300, height: 200 })
.build()
```

### Aspect Fill
Scales to fill while preserving aspect ratio (crops if needed):

```typescript
Image({ 
  src: 'landscape.jpg',
  contentMode: 'aspectFill' // Fills container, may crop content
})
.modifier
.size({ width: 300, height: 200 })
.overflow('hidden') // Hide cropped portions
.build()
```

## Loading States

Handle image loading with built-in state management:

### Loading Callbacks

```typescript
import { Image, createSignal } from '@tachui/core'

const [isLoading, setLoading] = createSignal(true)
const [hasError, setError] = createSignal(false)

Image({
  src: 'large-image.jpg',
  onLoad: () => {
    setLoading(false)
    console.log('Image loaded successfully')
  },
  onError: (error) => {
    setLoading(false)
    setError(true)
    console.error('Failed to load image:', error)
  }
})
```

### Placeholder and Fallback

```typescript
import { Image } from '@tachui/core'

// With loading placeholder and error fallback
Image({
  src: 'photo.jpg',
  placeholder: 'loading-spinner.gif', // Shown while loading
  fallback: 'error-placeholder.png',  // Shown on error
  alt: 'Profile photo'
})
```

### Custom Loading States

```typescript
import { Image, VStack, Text, createSignal } from '@tachui/core'

const ImageWithLoader = ({ src, alt }: { src: string, alt: string }) => {
  const [loadingState, setLoadingState] = createSignal<'loading' | 'loaded' | 'error'>('loading')
  
  return VStack({
    children: [
      // Conditional loading indicator
      Show({
        when: () => loadingState() === 'loading',
        children: [
          Text("Loading...")
            .modifier
            .opacity(0.6)
            .build()
        ]
      }),
      
      // Main image
      Image({
        src,
        alt,
        onLoad: () => setLoadingState('loaded'),
        onError: () => setLoadingState('error')
      })
      .modifier
      .opacity(() => loadingState() === 'loaded' ? 1 : 0.5)
      .transition('opacity', 300)
      .build(),
      
      // Error message
      Show({
        when: () => loadingState() === 'error',
        children: [
          Text("Failed to load image")
            .modifier
            .foregroundColor('#ff4444')
            .build()
        ]
      })
    ]
  })
}
```

## Lazy Loading

Optimize performance with lazy loading:

```typescript
import { Image, VStack } from '@tachui/core'

const ImageGallery = ({ images }: { images: string[] }) =>
  VStack({
    children: images.map((src, index) =>
      Image({
        src,
        loadingStrategy: index < 3 ? 'eager' : 'lazy', // Load first 3 eagerly
        alt: `Gallery image ${index + 1}`
      })
      .modifier
      .cornerRadius(8)
      .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      .build()
    ),
    spacing: 16
  })
```

## Asset Integration

Use with tachUI's ImageAsset system:

```typescript
import { Image, ImageAsset, Assets } from '@tachui/core'

// Define image assets
const profileImage = new ImageAsset({
  light: 'profile-light.jpg',
  dark: 'profile-dark.jpg'
})

// Register globally
Assets.register('profileImage', profileImage)

// Use in component
Image({
  src: Assets.profileImage, // Automatically theme-aware
  alt: 'User profile'
})

// Or use directly
Image({
  src: profileImage,
  alt: 'User profile'
})
```

## Responsive Images

Create responsive images that adapt to different screen sizes:

```typescript
import { Image, createSignal, createEffect } from '@tachui/core'

const ResponsiveImage = ({ baseSrc, alt }: { baseSrc: string, alt: string }) => {
  const [imageSrc, setImageSrc] = createSignal(baseSrc)
  
  createEffect(() => {
    const updateImageSrc = () => {
      if (window.innerWidth > 1200) {
        setImageSrc(`${baseSrc}?w=1200`)
      } else if (window.innerWidth > 800) {
        setImageSrc(`${baseSrc}?w=800`)
      } else {
        setImageSrc(`${baseSrc}?w=400`)
      }
    }
    
    updateImageSrc()
    window.addEventListener('resize', updateImageSrc)
    return () => window.removeEventListener('resize', updateImageSrc)
  })
  
  return Image({
    src: imageSrc,
    alt,
    contentMode: 'aspectFill'
  })
  .modifier
  .width('100%')
  .maxWidth('100%')
  .height('auto')
  .build()
}
```

## Image Effects

Apply visual effects and styling:

```typescript
import { Image } from '@tachui/core'

// Rounded profile image
Image({ src: 'avatar.jpg', alt: 'User avatar' })
  .modifier
  .size({ width: 80, height: 80 })
  .cornerRadius(40) // Circular
  .border({ width: 2, color: '#ddd' })
  .build()

// Hero image with overlay
Image({ src: 'hero.jpg', alt: 'Hero image' })
  .modifier
  .css({ 
    width: '100%', 
    height: '400px',
    position: 'relative'
  })
  .contentMode('aspectFill')
  .after({
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.5))'
  })
  .build()

// Image with hover effects
Image({ src: 'photo.jpg', alt: 'Photo' })
  .modifier
  .transition('all', 300)
  .hover({
    transform: 'scale(1.05)',
    filter: 'brightness(1.1)'
  })
  .cursor('pointer')
  .build()
```

## Performance Optimization

### Image Preloading

```typescript
import { Image } from '@tachui/core'

// Preload critical images
const preloadImage = (src: string) => {
  const img = new window.Image()
  img.src = src
}

// Preload hero images
preloadImage('hero-1.jpg')
preloadImage('hero-2.jpg')

// Use preloaded images
Image({ 
  src: 'hero-1.jpg',
  loadingStrategy: 'eager' // Already preloaded
})
```

### Image Optimization

```typescript
// ✅ Good - Specify dimensions for layout stability
Image({ src: 'photo.jpg' })
  .modifier
  .size({ width: 300, height: 200 })
  .build()

// ✅ Good - Use appropriate content mode
Image({ 
  src: 'thumbnail.jpg',
  contentMode: 'aspectFill' // Good for thumbnails
})

// ✅ Good - Lazy load below-the-fold images
Image({
  src: 'gallery-item.jpg',
  loadingStrategy: 'lazy'
})

// ❌ Avoid - Large images without size constraints
Image({ src: 'huge-image.jpg' }) // May cause layout shifts
```

## Accessibility

Ensure images are accessible to all users:

```typescript
import { Image } from '@tachui/core'

// Decorative image (empty alt)
Image({ 
  src: 'decoration.jpg',
  alt: '' // Indicates decorative image
})

// Informative image
Image({
  src: 'chart.jpg', 
  alt: 'Sales increased 25% from Q1 to Q2 2024'
})

// Complex image with additional context
Image({
  src: 'infographic.jpg',
  alt: 'Climate change impact infographic - see detailed description below'
})
.modifier
.aria({ 
  describedBy: 'infographic-description',
  role: 'img'
})
.build()
```

## Common Patterns

### Image Gallery

```typescript
import { HStack, VStack, Image } from '@tachui/core'

const ImageGallery = ({ images }: { images: Array<{src: string, alt: string}> }) =>
  VStack({
    children: [
      // Featured image
      Image({
        src: images[0]?.src,
        alt: images[0]?.alt,
        contentMode: 'aspectFill'
      })
      .modifier
      .css({ width: '100%', height: '300px' })
      .cornerRadius(12)
      .build(),
      
      // Thumbnail strip
      HStack({
        children: images.slice(1, 5).map(img =>
          Image({
            src: img.src,
            alt: img.alt,
            contentMode: 'aspectFill'
          })
          .modifier
          .size({ width: 80, height: 80 })
          .cornerRadius(8)
          .cursor('pointer')
          .hoverEffect('scale')
          .build()
        ),
        spacing: 8
      })
    ],
    spacing: 16
  })
```

### Avatar Component

```typescript
import { Image, Text, VStack } from '@tachui/core'

const Avatar = ({ 
  src, 
  name, 
  size = 'medium' 
}: { 
  src?: string
  name: string
  size?: 'small' | 'medium' | 'large' 
}) => {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80
  }
  
  const avatarSize = sizeMap[size]
  
  return VStack({
    children: src ? [
      Image({
        src,
        alt: `${name}'s profile picture`,
        contentMode: 'aspectFill'
      })
      .modifier
      .size({ width: avatarSize, height: avatarSize })
      .cornerRadius(avatarSize / 2)
      .border({ width: 2, color: '#fff' })
      .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
      .build()
    ] : [
      // Fallback to initials
      Text(name.split(' ').map(n => n[0]).join('').toUpperCase())
        .modifier
        .size({ width: avatarSize, height: avatarSize })
        .backgroundColor('#4F46E5')
        .foregroundColor('white')
        .cornerRadius(avatarSize / 2)
        .css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        })
        .font({ size: avatarSize * 0.4, weight: 'bold' })
        .build()
    ]
  })
}
```

## See Also

- **[ImageAsset](/guide/assets-system)** - Asset management system
- **[Layout Components](/components/layout)** - Container layouts
- **[Visual Effects API](/api/visual-effects)** - Image filters and effects
- **[Semantic HTML Guide](/guide/semantic-html)** - Making images accessible with semantic markup