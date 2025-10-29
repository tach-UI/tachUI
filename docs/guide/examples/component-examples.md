# TachUI Component Examples

Complete examples showcasing TachUI's SwiftUI-inspired components and their integration with the modifier system.

## Enhanced Components

> **Latest Update**: Now includes ScrollView and List components with comprehensive examples and testing patterns.

### Text Component Examples

#### Basic Text Usage

```typescript
import { Text, createSignal } from '@tachui/core'

// Static text
const title = Text("Welcome to TachUI")
  .modifier
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#1a1a1a')
  .textAlign('center')
  .build()

// Dynamic text with signals
const [count, setCount] = createSignal(0)
const counter = Text(() => `Count: ${count()}`)
  .modifier
  .fontSize(18)
  .foregroundColor('#007AFF')
  .fontWeight('500')
  .build()

// Multi-line text with styling
const description = Text("This is a longer description that demonstrates text wrapping and styling capabilities.")
  .modifier
  .fontSize(16)
  .lineHeight(1.5)
  .foregroundColor('#666')
  .maxWidth(400)
  .textAlign('left')
  .build()
```

#### Typography Presets

```typescript
// Using typography presets
const headline = Text("Headline Text")
  .modifier
  .typography('headline')
  .build()

const body = Text("Body text content")
  .modifier
  .typography('body')
  .build()

const caption = Text("Caption text")
  .modifier
  .typography('caption')
  .foregroundColor('#888')
  .build()
```

### Enhanced Button Component Examples

#### Button Variants and States

```typescript
import { Button, createSignal } from '@tachui/core'

// Primary button
const primaryButton = Button("Primary Action")
  .modifier
  .variant('filled')
  .role('none')
  .backgroundColor('#007AFF')
  .foregroundColor('#ffffff')
  .cornerRadius(8)
  .padding({ horizontal: 20, vertical: 12 })
  .onTap(() => console.log('Primary action!'))
  .build()

// Secondary button
const secondaryButton = Button("Secondary")
  .modifier
  .variant('outlined')
  .role('none')
  .borderColor('#007AFF')
  .foregroundColor('#007AFF')
  .cornerRadius(8)
  .padding({ horizontal: 20, vertical: 12 })
  .build()

// Destructive button
const deleteButton = Button("Delete")
  .modifier
  .variant('filled')
  .role('destructive')
  .backgroundColor('#ff3b30')
  .foregroundColor('#ffffff')
  .cornerRadius(6)
  .padding({ horizontal: 16, vertical: 10 })
  .build()
```

#### Interactive Button States

```typescript
// Loading state button
const [isLoading, setIsLoading] = createSignal(false)
const submitButton = Button(() => isLoading() ? "Loading..." : "Submit")
  .modifier
  .variant('filled')
  .disabled(isLoading)
  .backgroundColor(() => isLoading() ? '#ccc' : '#007AFF')
  .foregroundColor('#ffffff')
  .cornerRadius(8)
  .padding({ horizontal: 24, vertical: 12 })
  .onTap(async () => {
    setIsLoading(true)
    try {
      await submitForm()
    } finally {
      setIsLoading(false)
    }
  })
  .build()

// Toggle button
const [isToggled, setIsToggled] = createSignal(false)
const toggleButton = Button(() => isToggled() ? "ON" : "OFF")
  .modifier
  .variant('bordered')
  .backgroundColor(() => isToggled() ? '#007AFF' : 'transparent')
  .foregroundColor(() => isToggled() ? '#ffffff' : '#007AFF')
  .borderColor('#007AFF')
  .cornerRadius(20)
  .padding({ horizontal: 16, vertical: 8 })
  .onTap(() => setIsToggled(!isToggled()))
  .build()
```

### Enhanced Image Component Examples

#### Basic Image Usage

```typescript
import { Image, ImageUtils, ImageContentModes, createSignal } from '@tachui/core'

// Basic image with modifiers
const profilePicture = Image('user-avatar.jpg')
  .modifier
  .width(120)
  .height(120)
  .cornerRadius(60)
  .border(2, '#007AFF')
  .build()

// Dynamic image source
const [selectedImage, setSelectedImage] = createSignal('default.jpg')
const dynamicImage = Image(() => selectedImage())
  .modifier
  .width(400)
  .height(300)
  .cornerRadius(12)
  .transition('opacity', 300)
  .build()

// Responsive image that adapts to container
const responsiveImage = Image('hero-banner.jpg')
  .modifier
  .width('100%')
  .height('auto')
  .maxWidth(1200)
  .aspectRatio(16/9)
  .contentMode('cover')
  .build()
```

#### Loading States and Progressive Loading

```typescript
// Image with loading state management
const [isLoading, setIsLoading] = createSignal(true)
const [hasError, setHasError] = createSignal(false)

const loadingAwareImage = Image('large-photo.jpg')
  .modifier
  .width(600)
  .height(400)
  .placeholder('loading-placeholder.jpg')
  .errorPlaceholder('error-image.jpg')
  .onLoadStart(() => setIsLoading(true))
  .onLoad(() => setIsLoading(false))
  .onError(() => {
    setIsLoading(false)
    setHasError(true)
  })
  .opacity(() => isLoading() ? 0.7 : 1.0)
  .build()

// Progressive loading for better UX
const progressiveImage = ImageUtils.progressive(
  'thumbnail.jpg',        // Low quality, fast loading
  'full-resolution.jpg'   // High quality, slower loading
)
.modifier
.width(800)
.height(600)
.cornerRadius(16)
.shadow({ x: 0, y: 8, radius: 24, color: 'rgba(0,0,0,0.15)' })
.build()

// Responsive image with multiple sources
const responsiveHero = ImageUtils.responsive([
  { src: 'hero-mobile.jpg', width: 480, media: '(max-width: 768px)' },
  { src: 'hero-tablet.jpg', width: 1024, media: '(max-width: 1200px)' },
  { src: 'hero-desktop.jpg', width: 1920 }
], 'hero-fallback.jpg')
.modifier
.width('100%')
.height(400)
.contentMode('cover')
.build()
```

#### Content Modes and Aspect Ratios

```typescript
// Different content modes for various use cases
const photoGallery = [
  // Aspect fit - shows entire image, may have letterboxing
  Image('landscape.jpg')
    .modifier
    .contentMode(ImageContentModes.fit)
    .frame(300, 200)
    .border(1, '#e0e0e0')
    .build(),
  
  // Aspect fill - fills container, may crop image
  Image('portrait.jpg')
    .modifier
    .contentMode(ImageContentModes.fill)
    .frame(300, 200)
    .cornerRadius(8)
    .build(),
  
  // Center - shows image at original size, centered
  Image('icon.png')
    .modifier
    .contentMode(ImageContentModes.center)
    .frame(100, 100)
    .backgroundColor('#f5f5f5')
    .build(),
  
  // Scale down - shrinks if needed, never enlarges
  Image('small-logo.png')
    .modifier
    .contentMode(ImageContentModes.scaleDown)
    .frame(200, 200)
    .backgroundColor('#ffffff')
    .build()
]

// Aspect ratio controlled images
const instagramPost = Image('square-photo.jpg')
  .modifier
  .aspectRatio(1) // Perfect square
  .width('100%')
  .maxWidth(400)
  .cornerRadius(12)
  .build()

const cinematicImage = Image('movie-still.jpg')
  .modifier
  .aspectRatio(21/9) // Ultra-wide cinematic
  .width('100%')
  .maxWidth(800)
  .cornerRadius(8)
  .build()
```

#### Visual Effects and Filters

```typescript
// Interactive hover effects
const [isHovered, setIsHovered] = createSignal(false)
const interactiveImage = Image('hover-effect.jpg')
  .modifier
  .width(300)
  .height(200)
  .blur(() => isHovered() ? 2 : 0)
  .opacity(() => isHovered() ? 0.8 : 1.0)
  .scale(() => isHovered() ? 1.05 : 1.0)
  .transition('all', 300, 'ease-out')
  .onHover(setIsHovered)
  .cornerRadius(12)
  .build()

// Filter effects for mood/style
const vintagePhoto = Image('old-photo.jpg')
  .modifier
  .sepia(true)
  .opacity(0.9)
  .border(8, '#8B4513')
  .cornerRadius(4)
  .shadow({ x: 0, y: 4, radius: 12, color: 'rgba(0,0,0,0.3)' })
  .build()

const backgroundBlur = Image('background.jpg')
  .modifier
  .blur(8)
  .opacity(0.3)
  .position('absolute')
  .width('100%')
  .height('100%')
  .zIndex(-1)
  .build()

// Dynamic filter controls
const [saturation, setSaturation] = createSignal(1.0)
const [brightness, setBrightness] = createSignal(1.0)
const adjustableImage = Image('adjustable.jpg')
  .modifier
  .filter(() => `saturate(${saturation()}) brightness(${brightness()})`)
  .transition('filter', 200)
  .build()
```

#### Performance Optimized Images

```typescript
// Lazy loading with intersection observer
const lazyImage = Image('below-fold.jpg')
  .modifier
  .loadingStrategy('lazy')
  .placeholder('lazy-placeholder.svg')
  .width(400)
  .height(300)
  .build()

// High priority hero image
const heroImage = Image('hero.jpg')
  .modifier
  .loadingStrategy('eager')
  .fetchPriority('high')
  .decoding('sync')
  .width('100%')
  .height(500)
  .contentMode('cover')
  .build()

// Cross-origin images with proper handling
const externalImage = Image('https://external-cdn.com/image.jpg')
  .modifier
  .crossOrigin('anonymous')
  .width(300)
  .height(200)
  .placeholder('external-placeholder.jpg')
  .errorPlaceholder('external-error.svg')
  .build()
```

#### Image Gallery Example

```typescript
const imageGallery = VStack({
  children: [
    // Gallery header
    Text("Photo Gallery")
      .modifier
      .fontSize(24)
      .fontWeight('bold')
      .margin({ bottom: 20 })
      .build(),
    
    // Grid of images
    HStack({
      children: photos.map((photo, index) => 
        Image(photo.src)
          .modifier
          .width(200)
          .height(200)
          .contentMode('cover')
          .cornerRadius(12)
          .border(2, 'transparent')
          .transition('all', 200)
          .onTap(() => openLightbox(photo))
          .onHover((hovered) => {
            // Add hover effect styling
          })
          .shadow(() => isSelected(photo.id) 
            ? { x: 0, y: 8, radius: 16, color: 'rgba(0,122,255,0.3)' }
            : { x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' }
          )
          .build()
      ),
      spacing: 16,
      wrap: true
    })
  ],
  spacing: 0
})
.modifier
.padding(20)
.build()
```

### Enhanced TextField Component Examples

#### Basic Input Fields

```typescript
import { TextField, createSignal } from '@tachui/core'

// Simple text input
const [name, setName] = createSignal("")
const nameField = TextField(() => name())
  .modifier
  .placeholder("Enter your name")
  .onChange(setName)
  .padding(12)
  .border(1, '#ddd')
  .cornerRadius(8)
  .fontSize(16)
  .build()

// Email input with validation
const [email, setEmail] = createSignal("")
const emailField = TextField(() => email())
  .modifier
  .placeholder("Enter your email")
  .inputType('email')
  .validation('email')
  .required(true)
  .onChange(setEmail)
  .padding(12)
  .border(1, '#ddd')
  .cornerRadius(8)
  .focusBorderColor('#007AFF')
  .build()
```

#### Advanced Input Patterns

```typescript
// Password field with strength validation
const [password, setPassword] = createSignal("")
const passwordField = TextField(() => password())
  .modifier
  .placeholder("Create a password")
  .inputType('password')
  .secureTextEntry(true)
  .validation((value) => {
    if (value.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters" }
    }
    if (!/[A-Z]/.test(value)) {
      return { isValid: false, message: "Password must contain uppercase letter" }
    }
    if (!/[0-9]/.test(value)) {
      return { isValid: false, message: "Password must contain a number" }
    }
    return { isValid: true }
  })
  .onChange(setPassword)
  .padding(12)
  .border(1, '#ddd')
  .cornerRadius(8)
  .build()

// Multiline text area
const [comment, setComment] = createSignal("")
const commentField = TextField(() => comment())
  .modifier
  .placeholder("Enter your comment...")
  .multiline(true)
  .rows(4)
  .maxLength(500)
  .onChange(setComment)
  .padding(12)
  .border(1, '#ddd')
  .cornerRadius(8)
  .resize('vertical')
  .build()

// Number input with formatting
const [price, setPrice] = createSignal("")
const priceField = TextField(() => price())
  .modifier
  .placeholder("0.00")
  .inputType('number')
  .formatter('currency')
  .validation((value) => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) {
      return { isValid: false, message: "Please enter a valid price" }
    }
    return { isValid: true }
  })
  .onChange(setPrice)
  .padding(12)
  .border(1, '#ddd')
  .cornerRadius(8)
  .textAlign('right')
  .build()
```

## Layout Components Examples

### VStack (Vertical Stack)

```typescript
import { VStack, HStack, ZStack, Text, Button } from '@tachui/core'

// Simple vertical layout
const profileCard = VStack({
  children: [
    Text("John Doe")
      .modifier
      .fontSize(20)
      .fontWeight('bold')
      .build(),
    
    Text("Software Developer")
      .modifier
      .fontSize(16)
      .foregroundColor('#666')
      .build(),
    
    Button("Contact")
      .modifier
      .variant('outlined')
      .cornerRadius(6)
      .padding({ horizontal: 16, vertical: 8 })
      .build()
  ],
  spacing: 12,
  alignment: 'center'
})
.modifier
.padding(20)
.backgroundColor('#ffffff')
.cornerRadius(12)
.shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
.build()
```

### HStack (Horizontal Stack)

```typescript
// Navigation bar layout
const navigationBar = HStack({
  children: [
    Button("← Back")
      .modifier
      .variant('plain')
      .foregroundColor('#007AFF')
      .build(),
    
    Text("Profile")
      .modifier
      .fontSize(18)
      .fontWeight('600')
      .build(),
    
    Button("Edit")
      .modifier
      .variant('plain')
      .foregroundColor('#007AFF')
      .build()
  ],
  spacing: 16,
  alignment: 'center',
  distribution: 'spaceBetween'
})
.modifier
.padding({ horizontal: 16, vertical: 12 })
.backgroundColor('#f9f9f9')
.borderBottom(1, '#e0e0e0')
.build()
```

### ZStack (Layered Stack)

```typescript
// Hero section with overlay
const heroSection = ZStack({
  children: [
    // Background image
    HTML.div()
      .modifier
      .backgroundColor('#007AFF')
      .backgroundImage('url(/hero-bg.jpg)')
      .backgroundSize('cover')
      .backgroundPosition('center')
      .width('100%')
      .height(300)
      .build(),
    
    // Overlay gradient
    HTML.div()
      .modifier
      .width('100%')
      .height(300)
      .background('linear-gradient(45deg, rgba(0,122,255,0.8), rgba(0,122,255,0.4))')
      .build(),
    
    // Content
    VStack({
      children: [
        Text("Welcome to TachUI")
          .modifier
          .fontSize(32)
          .fontWeight('bold')
          .foregroundColor('#ffffff')
          .textAlign('center')
          .build(),
        
        Text("SwiftUI-inspired web development")
          .modifier
          .fontSize(18)
          .foregroundColor('#ffffff')
          .textAlign('center')
          .opacity(0.9)
          .build(),
        
        Button("Get Started")
          .modifier
          .variant('filled')
          .backgroundColor('#ffffff')
          .foregroundColor('#007AFF')
          .cornerRadius(8)
          .padding({ horizontal: 24, vertical: 12 })
          .fontWeight('600')
          .build()
      ],
      spacing: 16,
      alignment: 'center'
    })
  ],
  alignment: 'center'
})
.modifier
.width('100%')
.cornerRadius(12)
.overflow('hidden')
.build()
```

## ScrollView and List Components

### ScrollView Component Examples

#### Basic Scrolling Patterns

```typescript
import { ScrollView, ScrollViewUtils, createSignal } from '@tachui/core'

// Basic vertical scrolling
const basicScroll = ScrollView({
  children: [
    Text("Item 1").padding(16).build(),
    Text("Item 2").padding(16).build(),
    Text("Item 3").padding(16).build(),
    Text("Item 4").padding(16).build(),
    Text("Item 5").padding(16).build()
  ]
})
.modifier
.frame(undefined, 400)
.backgroundColor('#f9f9f9')
.cornerRadius(8)
.border(1, '#e0e0e0')
.build()

// Horizontal scrolling with spacing
const horizontalScroll = ScrollView({
  children: [
    Image('photo1.jpg').frame(200, 150).cornerRadius(8).build(),
    Image('photo2.jpg').frame(200, 150).cornerRadius(8).build(),
    Image('photo3.jpg').frame(200, 150).cornerRadius(8).build(),
    Image('photo4.jpg').frame(200, 150).cornerRadius(8).build()
  ],
  direction: 'horizontal'
})
.modifier
.frame(undefined, 170)
.padding(16)
.build()

// Both directions scrolling for large content
const bidirectionalScroll = ScrollView({
  children: [
    HTML.div()
      .modifier
      .width(1200)
      .height(800)
      .backgroundColor('#f0f8ff')
      .border(2, '#007AFF')
      .cornerRadius(12)
      .padding(20)
      .build()
  ],
  direction: 'both'
})
.modifier
.frame(600, 400)
.border(1, '#ddd')
.build()
```

#### Pull-to-Refresh and Edge Detection

```typescript
// Pull-to-refresh implementation
const [isRefreshing, setIsRefreshing] = createSignal(false)
const [items, setItems] = createSignal(generateInitialItems())

const refreshableScroll = ScrollView({
  children: items().map(item => 
    HStack({
      children: [
        Image(item.avatar).frame(40, 40).cornerRadius(20).build(),
        VStack({
          children: [
            Text(item.name).fontWeight('600').build(),
            Text(item.message).fontSize(14).foregroundColor('#666').build()
          ],
          spacing: 4,
          alignment: 'leading'
        })
      ],
      spacing: 12,
      alignment: 'center'
    })
    .modifier
    .padding(16)
    .backgroundColor('#ffffff')
    .cornerRadius(8)
    .shadow({ x: 0, y: 1, radius: 3, color: 'rgba(0,0,0,0.1)' })
    .build()
  ),
  direction: 'vertical',
  refreshControl: {
    enabled: true,
    onRefresh: async () => {
      setIsRefreshing(true)
      try {
        const newItems = await fetchLatestItems()
        setItems(newItems)
      } finally {
        setIsRefreshing(false)
      }
    },
    threshold: 80,
    tintColor: '#007AFF',
    title: 'Pull to refresh...'
  }
})
.modifier
.frame(undefined, 500)
.backgroundColor('#f5f5f5')
.cornerRadius(12)
.build()

// Edge detection and infinite loading
const [hasMore, setHasMore] = createSignal(true)
const [loading, setLoading] = createSignal(false)

const infiniteScroll = ScrollView({
  children: [
    ...items().map(item => createItemComponent(item)),
    ...(loading() ? [createLoadingIndicator()] : [])
  ],
  onScroll: (info) => {
    console.log(`Scroll offset: ${info.offset.y}, velocity: ${info.velocity.y}`)
  },
  onReachBottom: async () => {
    if (!loading() && hasMore()) {
      setLoading(true)
      try {
        const newItems = await loadMoreItems()
        if (newItems.length === 0) {
          setHasMore(false)
        } else {
          setItems([...items(), ...newItems])
        }
      } finally {
        setLoading(false)
      }
    }
  },
  scrollEventThrottle: 16 // 60fps scroll events
})
.modifier
.frame(undefined, 600)
.build()
```

#### Advanced ScrollView Patterns

```typescript
// Paged scrolling (carousel-like)
const pagedContent = [
  createPageContent("Page 1", "#ff6b6b"),
  createPageContent("Page 2", "#4ecdc4"),
  createPageContent("Page 3", "#45b7d1"),
  createPageContent("Page 4", "#96ceb4")
]

const pagedScroll = ScrollViewUtils.paged(pagedContent)
.modifier
.frame(400, 300)
.cornerRadius(16)
.shadow({ x: 0, y: 8, radius: 24, color: 'rgba(0,0,0,0.15)' })
.build()

// Performance optimized for heavy content
const heavyContentScroll = ScrollView({
  children: generateHeavyContent(1000), // 1000 items
  bounces: false,
  showsScrollIndicator: true,
  scrollEventThrottle: 32, // 30fps for better performance
  decelerationRate: 'fast'
})
.modifier
.frame(undefined, 400)
.backgroundColor('#ffffff')
.build()

// Nested scrolling with proper behavior
const nestedScroll = ScrollView({
  children: [
    Text("Outer Scroll Content").padding(20).build(),
    
    // Inner horizontal scroll
    ScrollView({
      children: [
        HTML.div().width(200).height(100).backgroundColor('#ff6b6b').build(),
        HTML.div().width(200).height(100).backgroundColor('#4ecdc4').build(),
        HTML.div().width(200).height(100).backgroundColor('#45b7d1').build()
      ],
      direction: 'horizontal'
    })
    .modifier
    .frame(undefined, 120)
    .backgroundColor('#f8f8f8')
    .cornerRadius(8)
    .build(),
    
    Text("More outer content").padding(20).build()
  ]
})
.modifier
.frame(undefined, 500)
.build()
```

### List Component Examples

#### Basic List Patterns

```typescript
import { List, ForEachComponent, ListUtils, createSignal } from '@tachui/core'

// Simple data list
const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Designer' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Developer' },
  { id: 3, name: 'Carol Wilson', email: 'carol@example.com', role: 'Manager' }
]

const basicList = List({
  data: users,
  renderItem: (user, index) => 
    HStack({
      children: [
        HTML.div()
          .modifier
          .width(40)
          .height(40)
          .backgroundColor('#007AFF')
          .cornerRadius(20)
          .display('flex')
          .alignItems('center')
          .justifyContent('center')
          .build(),
        
        VStack({
          children: [
            Text(user.name).fontWeight('600').fontSize(16).build(),
            Text(user.email).fontSize(14).foregroundColor('#666').build(),
            Text(user.role).fontSize(12).foregroundColor('#999').build()
          ],
          spacing: 2,
          alignment: 'leading'
        })
      ],
      spacing: 12,
      alignment: 'center'
    })
    .modifier
    .padding(16)
    .backgroundColor('#ffffff')
    .borderRadius(8)
    .build()
})
.modifier
.backgroundColor('#f5f5f5')
.cornerRadius(12)
.build()
```

#### List with Selection and Interaction

```typescript
// Selectable list with multiple selection modes
const [selectedItems, setSelectedItems] = createSignal(new Set<number>())
const [selectionMode, setSelectionMode] = createSignal<'none' | 'single' | 'multiple'>('single')

const selectableList = List({
  data: users,
  renderItem: (user, index) => {
    const isSelected = selectedItems().has(user.id)
    return HStack({
      children: [
        // Selection indicator
        HTML.div()
          .modifier
          .width(20)
          .height(20)
          .backgroundColor(isSelected ? '#007AFF' : 'transparent')
          .border(2, isSelected ? '#007AFF' : '#ddd')
          .cornerRadius(10)
          .display('flex')
          .alignItems('center')
          .justifyContent('center')
          .build(),
        
        // User info
        VStack({
          children: [
            Text(user.name).fontWeight('600').build(),
            Text(user.email).fontSize(14).foregroundColor('#666').build()
          ],
          spacing: 4,
          alignment: 'leading'
        }),
        
        // Action button
        Button("View")
          .modifier
          .variant('outlined')
          .fontSize(14)
          .padding({ horizontal: 12, vertical: 6 })
          .onTap(() => viewUserDetails(user))
          .build()
      ],
      spacing: 12,
      alignment: 'center'
    })
    .modifier
    .padding(16)
    .backgroundColor(isSelected ? '#f0f8ff' : '#ffffff')
    .border(1, isSelected ? '#007AFF' : '#e0e0e0')
    .cornerRadius(8)
    .transition('all', 200)
    .build()
  },
  selectionMode: selectionMode,
  selectedItems: selectedItems,
  onSelectionChange: (selection) => setSelectedItems(selection),
  onItemTap: (user, index) => {
    console.log(`Tapped user: ${user.name}`)
  },
  getItemId: (user) => user.id
})
.modifier
.frame(undefined, 400)
.backgroundColor('#f9f9f9')
.cornerRadius(12)
.padding(8)
.build()
```

#### Virtual Scrolling for Large Datasets

```typescript
// Generate large dataset for virtual scrolling demo
const [largeDataset] = createSignal(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  avatar: `https://i.pravatar.cc/40?img=${i % 70}`,
  lastSeen: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString()
})))

const virtualList = ListUtils.virtual(
  largeDataset,
  (user, index) => 
    HStack({
      children: [
        Image(user.avatar)
          .modifier
          .width(40)
          .height(40)
          .cornerRadius(20)
          .build(),
        
        VStack({
          children: [
            Text(`${user.name} (#${user.id})`).fontWeight('600').build(),
            Text(user.email).fontSize(14).foregroundColor('#666').build(),
            Text(`Last seen: ${user.lastSeen}`).fontSize(12).foregroundColor('#999').build()
          ],
          spacing: 2,
          alignment: 'leading'
        })
      ],
      spacing: 12,
      alignment: 'center'
    })
    .modifier
    .padding(12)
    .borderBottom(1, '#f0f0f0')
    .build(),
  {
    enabled: true,
    estimatedItemHeight: 70,
    overscan: 5, // Render 5 items outside viewport
    scrollingDelay: 150
  }
)
.modifier
.frame(undefined, 500)
.backgroundColor('#ffffff')
.border(1, '#e0e0e0')
.cornerRadius(8)
.build()
```

#### Sectioned Lists

```typescript
// Grouped data for sectioned list
const contactSections = [
  {
    id: 'favorites',
    header: 'Favorites',
    items: [
      { id: 1, name: 'Mom', phone: '+1 (555) 123-4567' },
      { id: 2, name: 'Dad', phone: '+1 (555) 234-5678' }
    ]
  },
  {
    id: 'recent',
    header: 'Recent',
    footer: 'Recently contacted',
    items: [
      { id: 3, name: 'Alice Johnson', phone: '+1 (555) 345-6789' },
      { id: 4, name: 'Bob Smith', phone: '+1 (555) 456-7890' }
    ]
  },
  {
    id: 'all',
    header: 'All Contacts',
    items: [
      { id: 5, name: 'Carol Wilson', phone: '+1 (555) 567-8901' },
      { id: 6, name: 'David Brown', phone: '+1 (555) 678-9012' },
      { id: 7, name: 'Eve Davis', phone: '+1 (555) 789-0123' }
    ]
  }
]

const sectionedList = ListUtils.sectioned(
  contactSections,
  (contact, index) => 
    HStack({
      children: [
        HTML.div()
          .modifier
          .width(44)
          .height(44)
          .backgroundColor('#007AFF')
          .cornerRadius(22)
          .display('flex')
          .alignItems('center')
          .justifyContent('center')
          .build(),
        
        VStack({
          children: [
            Text(contact.name).fontWeight('600').fontSize(16).build(),
            Text(contact.phone).fontSize(14).foregroundColor('#666').build()
          ],
          spacing: 2,
          alignment: 'leading'
        }),
        
        Button("Call")
          .modifier
          .variant('outlined')
          .fontSize(14)
          .padding({ horizontal: 12, vertical: 6 })
          .onTap(() => callContact(contact))
          .build()
      ],
      spacing: 12,
      alignment: 'center'
    })
    .modifier
    .padding(16)
    .backgroundColor('#ffffff')
    .borderBottom(1, '#f0f0f0')
    .build()
)
.modifier
.backgroundColor('#f9f9f9')
.cornerRadius(12)
.build()
```

#### ForEach Component for Dynamic Lists

```typescript
// Reactive todo list with ForEach
const [todos, setTodos] = createSignal([
  { id: 1, text: 'Buy groceries', completed: false, priority: 'high' },
  { id: 2, text: 'Walk the dog', completed: true, priority: 'medium' },
  { id: 3, text: 'Finish project', completed: false, priority: 'high' },
  { id: 4, text: 'Call dentist', completed: false, priority: 'low' }
])

const todoList = ForEachComponent({
  data: todos,
  children: (todo, index) => {
    const priorityColors = {
      high: '#ff3b30',
      medium: '#ff9500',
      low: '#34c759'
    }
    
    return HStack({
      children: [
        // Completion checkbox
        HTML.div()
          .modifier
          .width(24)
          .height(24)
          .backgroundColor(todo.completed ? '#34c759' : 'transparent')
          .border(2, todo.completed ? '#34c759' : '#ddd')
          .cornerRadius(12)
          .display('flex')
          .alignItems('center')
          .justifyContent('center')
          .onTap(() => toggleTodo(todo.id))
          .cursor('pointer')
          .build(),
        
        // Todo content
        VStack({
          children: [
            Text(todo.text)
              .modifier
              .fontSize(16)
              .fontWeight('500')
              .textDecoration(todo.completed ? 'line-through' : 'none')
              .foregroundColor(todo.completed ? '#999' : '#1a1a1a')
              .build(),
            
            Text(`Priority: ${todo.priority}`)
              .modifier
              .fontSize(12)
              .foregroundColor(priorityColors[todo.priority])
              .fontWeight('600')
              .build()
          ],
          spacing: 4,
          alignment: 'leading'
        }),
        
        // Delete button
        Button("Delete")
          .modifier
          .variant('plain')
          .foregroundColor('#ff3b30')
          .fontSize(14)
          .padding({ horizontal: 8, vertical: 4 })
          .onTap(() => deleteTodo(todo.id))
          .build()
      ],
      spacing: 12,
      alignment: 'center'
    })
    .modifier
    .padding(16)
    .backgroundColor(todo.completed ? '#f8f8f8' : '#ffffff')
    .cornerRadius(8)
    .border(1, '#e0e0e0')
    .transition('all', 200)
    .build()
  },
  getItemId: (todo) => todo.id
})
.modifier
.backgroundColor('#f5f5f5')
.cornerRadius(12)
.padding(8)
.build()
```

#### Advanced List Features

```typescript
// List with search, filtering, and empty state
const [searchTerm, setSearchTerm] = createSignal('')
const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all')

const filteredTodos = computed(() => {
  let filtered = todos()
  
  // Apply search filter
  if (searchTerm()) {
    filtered = filtered.filter(todo => 
      todo.text.toLowerCase().includes(searchTerm().toLowerCase())
    )
  }
  
  // Apply status filter
  if (filter() !== 'all') {
    filtered = filtered.filter(todo => 
      filter() === 'completed' ? todo.completed : !todo.completed
    )
  }
  
  return filtered
})

const advancedList = VStack({
  children: [
    // Search and filter controls
    HStack({
      children: [
        TextField(() => searchTerm())
          .modifier
          .placeholder('Search todos...')
          .onChange(setSearchTerm)
          .padding(12)
          .border(1, '#ddd')
          .cornerRadius(8)
          .flex(1)
          .build(),
        
        Button(filter())
          .modifier
          .variant('outlined')
          .padding({ horizontal: 16, vertical: 12 })
          .onTap(() => {
            const filters = ['all', 'active', 'completed']
            const current = filters.indexOf(filter())
            const next = (current + 1) % filters.length
            setFilter(filters[next])
          })
          .build()
      ],
      spacing: 12,
      alignment: 'center'
    }),
    
    // List with empty state
    Show({
      when: () => filteredTodos().length > 0,
      children: () => [
        List({
          data: filteredTodos,
          renderItem: (todo, index) => createTodoItem(todo, index),
          emptyState: Text("No todos found")
            .modifier
            .fontSize(16)
            .foregroundColor('#999')
            .textAlign('center')
            .padding(40)
            .build()
        })
      ],
      fallback: () => [
        Text("No todos match your criteria")
          .modifier
          .fontSize(16)
          .foregroundColor('#999')
          .textAlign('center')
          .padding(40)
          .build()
      ]
    })
  ],
  spacing: 16
})
.modifier
.padding(16)
.build()
```

## Real-World Component Combinations

### Login Form

```typescript
const [email, setEmail] = createSignal("")
const [password, setPassword] = createSignal("")
const [isLoading, setIsLoading] = createSignal(false)

const loginForm = VStack({
  children: [
    Text("Sign In")
      .modifier
      .fontSize(28)
      .fontWeight('bold')
      .textAlign('center')
      .margin({ bottom: 32 })
      .build(),
    
    TextField(() => email())
      .modifier
      .placeholder("Email")
      .inputType('email')
      .validation('email')
      .required(true)
      .onChange(setEmail)
      .padding(16)
      .border(1, '#e0e0e0')
      .cornerRadius(8)
      .focusBorderColor('#007AFF')
      .build(),
    
    TextField(() => password())
      .modifier
      .placeholder("Password")
      .inputType('password')
      .secureTextEntry(true)
      .required(true)
      .onChange(setPassword)
      .padding(16)
      .border(1, '#e0e0e0')
      .cornerRadius(8)
      .focusBorderColor('#007AFF')
      .build(),
    
    Button(() => isLoading() ? "Signing in..." : "Sign In")
      .modifier
      .variant('filled')
      .disabled(() => isLoading() || !email() || !password())
      .backgroundColor('#007AFF')
      .foregroundColor('#ffffff')
      .cornerRadius(8)
      .padding(16)
      .fontSize(16)
      .fontWeight('600')
      .onTap(async () => {
        setIsLoading(true)
        try {
          await signIn(email(), password())
        } finally {
          setIsLoading(false)
        }
      })
      .build()
  ],
  spacing: 16,
  alignment: 'stretch'
})
.modifier
.maxWidth(400)
.padding(32)
.backgroundColor('#ffffff')
.cornerRadius(12)
.shadow({ x: 0, y: 4, radius: 16, color: 'rgba(0,0,0,0.1)' })
.build()
```

### Product Card Grid

```typescript
const productGrid = VStack({
  children: products.map(product => 
    HStack({
      children: [
        HTML.img({
          src: product.image,
          alt: product.name,
          width: 80,
          height: 80
        })
        .modifier
        .cornerRadius(8)
        .build(),
        
        VStack({
          children: [
            Text(product.name)
              .modifier
              .fontSize(16)
              .fontWeight('600')
              .foregroundColor('#1a1a1a')
              .build(),
            
            Text(product.description)
              .modifier
              .fontSize(14)
              .foregroundColor('#666')
              .lineHeight(1.4)
              .numberOfLines(2)
              .build(),
            
            HStack({
              children: [
                Text(`$${product.price}`)
                  .modifier
                  .fontSize(18)
                  .fontWeight('bold')
                  .foregroundColor('#007AFF')
                  .build(),
                
                Button("Add to Cart")
                  .modifier
                  .variant('filled')
                  .backgroundColor('#007AFF')
                  .foregroundColor('#ffffff')
                  .cornerRadius(6)
                  .padding({ horizontal: 12, vertical: 6 })
                  .fontSize(14)
                  .build()
              ],
              spacing: 12,
              alignment: 'center',
              distribution: 'spaceBetween'
            })
          ],
          spacing: 8,
          alignment: 'leading'
        })
        .modifier
        .flex(1)
        .build()
      ],
      spacing: 16,
      alignment: 'top'
    })
    .modifier
    .padding(16)
    .backgroundColor('#ffffff')
    .cornerRadius(12)
    .border(1, '#f0f0f0')
    .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.05)' })
    .build()
  ),
  spacing: 16
})
.modifier
.padding(16)
.build()
```

## Performance Optimizations

### Conditional Rendering

```typescript
import { Show, ForEachComponent } from '@tachui/core'

// Conditional component rendering
const conditionalContent = Show({
  when: () => isLoggedIn(),
  children: () => [
    Text("Welcome back!")
      .modifier
      .fontSize(18)
      .fontWeight('500')
      .build()
  ],
  fallback: () => [
    Button("Sign In")
      .modifier
      .variant('outlined')
      .build()
  ]
})

// Efficient list rendering with ForEach
const todoList = ForEachComponent({
  data: () => todos(),
  children: (todo, index) => 
    HStack({
      children: [
        Text(() => todo().title)
          .modifier
          .flex(1)
          .fontSize(16)
          .build(),
        
        Button("Complete")
          .modifier
          .variant('outlined')
          .fontSize(14)
          .padding({ horizontal: 8, vertical: 4 })
          .onTap(() => completeTodo(todo().id))
          .build()
      ],
      spacing: 12,
      alignment: 'center'
    })
    .modifier
    .padding(12)
    .borderBottom(1, '#f0f0f0')
    .build(),
  getItemId: (todo) => todo().id
})
```

## Testing Patterns for Advanced Components

### ScrollView Testing Examples

```typescript
import { render, screen, fireEvent } from '@testing-library/dom'
import { ScrollView, createSignal } from '@tachui/core'

// Test basic scrolling behavior
test('ScrollView handles vertical scrolling', () => {
  const content = Array.from({ length: 100 }, (_, i) => 
    Text(`Item ${i + 1}`).padding(16).build()
  )
  
  const scrollView = ScrollView({ children: content })
    .modifier
    .frame(300, 200)
    .build()
  
  const container = document.createElement('div')
  render(scrollView, container)
  
  const scrollContainer = container.querySelector('[data-testid="scroll-container"]')
  expect(scrollContainer).toBeInTheDocument()
  expect(scrollContainer.scrollHeight).toBeGreaterThan(200)
})

// Test pull-to-refresh functionality
test('ScrollView triggers refresh on pull', async () => {
  const refreshHandler = vi.fn()
  const [isRefreshing, setIsRefreshing] = createSignal(false)
  
  const scrollView = ScrollView({
    children: [Text("Content")],
    refreshControl: {
      enabled: true,
      onRefresh: refreshHandler,
      threshold: 80
    }
  })
  
  // Simulate pull gesture
  const scrollContainer = screen.getByTestId('scroll-container')
  fireEvent.scroll(scrollContainer, { target: { scrollY: -100 } })
  
  expect(refreshHandler).toHaveBeenCalled()
})
```

### List Component Testing Examples

```typescript
// Test list rendering and selection
test('List renders items and handles selection', () => {
  const items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ]
  
  const [selectedItems, setSelectedItems] = createSignal(new Set<number>())
  
  const list = List({
    data: items,
    renderItem: (item, index) => Text(item.name),
    selectionMode: 'multiple',
    selectedItems: selectedItems,
    onSelectionChange: setSelectedItems,
    getItemId: (item) => item.id
  })
  
  const container = document.createElement('div')
  render(list, container)
  
  // Check all items are rendered
  expect(screen.getByText('Item 1')).toBeInTheDocument()
  expect(screen.getByText('Item 2')).toBeInTheDocument()
  expect(screen.getByText('Item 3')).toBeInTheDocument()
  
  // Test selection
  fireEvent.click(screen.getByText('Item 1'))
  expect(selectedItems().has(1)).toBe(true)
})

// Test virtual scrolling performance
test('Virtual list handles large datasets efficiently', () => {
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }))
  
  const virtualList = ListUtils.virtual(
    () => largeDataset,
    (item, index) => Text(item.name),
    {
      enabled: true,
      estimatedItemHeight: 50,
      overscan: 5
    }
  )
  
  const container = document.createElement('div')
  const startTime = performance.now()
  render(virtualList, container)
  const endTime = performance.now()
  
  // Should render quickly even with large dataset
  expect(endTime - startTime).toBeLessThan(100)
  
  // Should only render visible items plus overscan
  const renderedItems = container.querySelectorAll('[data-testid="list-item"]')
  expect(renderedItems.length).toBeLessThan(20) // Much less than 10000
})
```

### Integration Testing Examples

```typescript
// Test ScrollView + List integration
test('ScrollView with List maintains scroll position', () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` }))
  
  const scrollableList = ScrollView({
    children: [
      List({
        data: items,
        renderItem: (item, index) => Text(item.name)
      })
    ]
  })
  .modifier
  .frame(300, 200)
  .build()
  
  const container = document.createElement('div')
  render(scrollableList, container)
  
  const scrollContainer = container.querySelector('[data-testid="scroll-container"]')
  
  // Scroll to middle
  fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } })
  expect(scrollContainer.scrollTop).toBe(500)
  
  // Scroll position should be maintained during re-renders
  // ... additional assertions
})
```

## Performance Benchmarks

### Component Performance Metrics

```typescript
// ScrollView performance benchmark
const scrollViewBenchmark = {
  name: 'ScrollView with 1000 items',
  setup: () => {
    const items = Array.from({ length: 1000 }, (_, i) => 
      Text(`Item ${i}`).padding(8).build()
    )
    return ScrollView({ children: items })
      .modifier
      .frame(300, 400)
      .build()
  },
  metrics: {
    renderTime: '< 50ms',
    memoryUsage: '< 10MB',
    scrollPerformance: '60fps',
    updatePerformance: '< 5ms per item change'
  }
}

// List virtual scrolling benchmark
const virtualListBenchmark = {
  name: 'Virtual List with 10,000 items',
  setup: () => {
    const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
    return ListUtils.virtual(
      () => items,
      (item, index) => Text(item.name),
      { enabled: true, estimatedItemHeight: 40 }
    )
  },
  metrics: {
    initialRender: '< 100ms',
    memoryUsage: '< 5MB (only visible items)',
    scrollPerformance: '60fps',
    itemUpdateTime: '< 1ms'
  }
}
```

## BasicInput Component Examples (Version 1.1)

### Basic Input Usage

```typescript
import { BasicInput, createSignal } from '@tachui/core'

// Simple text input
const [username, setUsername] = createSignal('')

const usernameInput = BasicInput({
  text: username,
  setText: setUsername,
  placeholder: 'Enter username...',
  onChange: (value) => console.log('Username:', value),
  onSubmit: (value) => handleLogin(value)
})
  .modifier
  .padding(12, 16)
  .borderRadius(8)
  .fontSize(16)
  .width('300px')
  .build()
```

### Input Types and Validation

```typescript
// Email input with validation
const [email, setEmail] = createSignal('')
const [emailError, setEmailError] = createSignal('')

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const emailInput = BasicInput({
  text: email,
  setText: setEmail,
  inputType: 'email',
  placeholder: 'you@example.com',
  accessibilityLabel: 'Email address',
  onChange: (value) => {
    if (!validateEmail(value)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }
})
  .modifier
  .padding(12, 16)
  .borderRadius(6)
  .border(emailError() ? '2px solid #FF3B30' : '1px solid #D1D1D6')
  .fontSize(16)
  .build()

// Password input with strength indicator
const [password, setPassword] = createSignal('')
const [passwordStrength, setPasswordStrength] = createSignal('')

const checkPasswordStrength = (password: string) => {
  if (password.length < 6) return 'Weak'
  if (password.length < 12) return 'Medium'
  return 'Strong'
}

const passwordInput = BasicInput({
  text: password,
  setText: setPassword,
  inputType: 'password',
  placeholder: 'Enter secure password',
  onChange: (value) => {
    setPasswordStrength(checkPasswordStrength(value))
  }
})
  .modifier
  .padding(12, 16)
  .borderRadius(6)
  .fontSize(16)
  .width('100%')
  .build()
```

### Search Input with Debouncing

```typescript
// Search input with debounced API calls
const [searchQuery, setSearchQuery] = createSignal('')
const [searchResults, setSearchResults] = createSignal([])
const [isSearching, setIsSearching] = createSignal(false)

let searchTimeout: NodeJS.Timeout

const performSearch = async (query: string) => {
  if (query.length < 2) {
    setSearchResults([])
    return
  }
  
  setIsSearching(true)
  try {
    const results = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    setSearchResults(await results.json())
  } finally {
    setIsSearching(false)
  }
}

const searchInput = BasicInput({
  text: searchQuery,
  setText: setSearchQuery,
  inputType: 'search',
  placeholder: 'Search products...',
  onChange: (query) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => performSearch(query), 300)
  },
  onSubmit: (query) => performSearch(query)
})
  .modifier
  .padding(12, 16)
  .borderRadius(20)
  .backgroundColor('#F8F8F8')
  .fontSize(16)
  .width('100%')
  .build()
```

### Reactive Input Properties

```typescript
// Input with reactive properties
const [isEditing, setIsEditing] = createSignal(false)
const [currentValue, setCurrentValue] = createSignal('')
const [placeholder, setPlaceholder] = createSignal('Click to edit...')

const reactiveInput = BasicInput({
  text: currentValue,
  setText: setCurrentValue,
  placeholder,
  disabled: createComputed(() => !isEditing()),
  readonly: createComputed(() => !isEditing()),
  onFocus: () => {
    setIsEditing(true)
    setPlaceholder('Enter your text...')
  },
  onBlur: () => {
    setIsEditing(false)
    setPlaceholder('Click to edit...')
  }
})
  .modifier
  .padding(12, 16)
  .borderRadius(6)
  .backgroundColor(() => isEditing() ? '#FFFFFF' : '#F5F5F5')
  .border(() => isEditing() ? '2px solid #007AFF' : '1px solid #D1D1D6')
  .cursor(() => isEditing() ? 'text' : 'pointer')
  .build()
```

### Form-like Input Groups

```typescript
// Contact form using BasicInput components
const [firstName, setFirstName] = createSignal('')
const [lastName, setLastName] = createSignal('')
const [phone, setPhone] = createSignal('')
const [message, setMessage] = createSignal('')

const formatPhoneNumber = (value: string) => {
  // Simple US phone formatting: (123) 456-7890
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
}

const contactForm = VStack([
  // First Name
  BasicInput({
    text: firstName,
    setText: setFirstName,
    placeholder: 'First name',
    accessibilityLabel: 'First name'
  })
    .modifier
    .padding(12, 16)
    .borderRadius(8)
    .fontSize(16)
    .width('100%')
    .marginBottom(12)
    .build(),
  
  // Last Name  
  BasicInput({
    text: lastName,
    setText: setLastName,
    placeholder: 'Last name',
    accessibilityLabel: 'Last name'
  })
    .modifier
    .padding(12, 16)
    .borderRadius(8)
    .fontSize(16)
    .width('100%')
    .marginBottom(12)
    .build(),
  
  // Phone with formatting
  BasicInput({
    text: phone,
    setText: (value) => {
      const formatted = formatPhoneNumber(value)
      setPhone(formatted)
    },
    inputType: 'tel',
    placeholder: '(123) 456-7890',
    accessibilityLabel: 'Phone number'
  })
    .modifier
    .padding(12, 16)
    .borderRadius(8)
    .fontSize(16)
    .width('100%')
    .marginBottom(12)
    .build(),
  
  // Submit button
  Button('Send Message', () => {
    const formData = {
      firstName: firstName(),
      lastName: lastName(), 
      phone: phone(),
      message: message()
    }
    console.log('Form submitted:', formData)
  })
    .modifier
    .padding(14, 20)
    .borderRadius(8)
    .backgroundColor('#007AFF')
    .foregroundColor('#FFFFFF')
    .fontSize(16)
    .fontWeight('600')
    .build()
])
  .modifier
  .padding(20)
  .maxWidth(400)
  .build()
```

### Utility Functions Examples

```typescript
// Using BasicInput utility functions
const [searchText, setSearchText] = createSignal('')
const [userEmail, setUserEmail] = createSignal('')
const [userPassword, setUserPassword] = createSignal('')
const [phoneNumber, setPhoneNumber] = createSignal('')

// Search input utility
const searchInput = BasicInput(
  BasicInputUtils.search(searchText, setSearchText, (query) => {
    console.log('Search for:', query)
    performSearch(query)
  })
)
  .modifier
  .width('100%')
  .padding(12, 16)
  .borderRadius(20)
  .build()

// Email input utility  
const emailInput = BasicInput(
  BasicInputUtils.email(userEmail, setUserEmail)
)
  .modifier
  .width('100%')
  .padding(12, 16)
  .borderRadius(8)
  .build()

// Password input utility
const passwordInput = BasicInput(
  BasicInputUtils.password(userPassword, setUserPassword)
)
  .modifier
  .width('100%')
  .padding(12, 16)
  .borderRadius(8)
  .build()

// Phone input utility
const phoneInput = BasicInput(
  BasicInputUtils.phone(phoneNumber, setPhoneNumber)
)
  .modifier
  .width('100%')
  .padding(12, 16)
  .borderRadius(8)
  .build()
```

### Testing BasicInput Components

```typescript
import { render, screen, fireEvent } from '@testing-library/dom'
import { BasicInput, createSignal } from '@tachui/core'

// Test basic input functionality
test('BasicInput updates signal on user input', () => {
  const [text, setText] = createSignal('')
  
  const input = BasicInput({
    text,
    setText,
    placeholder: 'Test input'
  })
  
  const container = document.createElement('div')
  render(input, container)
  
  const inputElement = screen.getByPlaceholderText('Test input')
  
  // Simulate user typing
  fireEvent.input(inputElement, { target: { value: 'hello world' } })
  
  // Check signal was updated
  expect(text()).toBe('hello world')
})

// Test submit functionality
test('BasicInput calls onSubmit when Enter is pressed', () => {
  const [text, setText] = createSignal('test value')
  const onSubmit = vi.fn()
  
  const input = BasicInput({
    text,
    setText,
    onSubmit
  })
  
  const container = document.createElement('div')
  render(input, container)
  
  const inputElement = screen.getByDisplayValue('test value')
  
  // Simulate Enter key press
  fireEvent.keyDown(inputElement, { key: 'Enter' })
  
  expect(onSubmit).toHaveBeenCalledWith('test value')
})
```

These comprehensive examples demonstrate how BasicInput provides a lightweight yet powerful solution for text input in TachUI Core applications, with full reactive support, comprehensive event handling, and seamless modifier system integration.