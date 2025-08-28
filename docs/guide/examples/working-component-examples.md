# Working TachUI Component Examples

Real, tested examples of all TachUI components using the actual verified API patterns. These examples are based on our comprehensive test suite and guaranteed to work.

## Text Component Examples

### Basic Text Usage

```typescript
import { Text, createSignal } from '@tachui/core'

// Static text
const welcomeTitle = Text("Welcome to TachUI")
  .modifier
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#1a1a1a')
  .build()

// Dynamic text with signals
const [count, setCount] = createSignal(0)
const counterDisplay = Text(() => `Count: ${count()}`)
  .modifier
  .fontSize(18)
  .foregroundColor('#007AFF')
  .fontWeight('500')
  .build()

// Styled text with multiple modifiers
const styledText = Text("This text demonstrates comprehensive styling")
  .modifier
  .fontSize(16)
  .lineHeight(1.5)
  .foregroundColor('#333333')
  .backgroundColor('#f8f9fa')
  .padding(16)
  .cornerRadius(8)
  .build()
```

### Interactive Text

```typescript
// Clickable text
const linkText = Text("Click me for more info")
  .modifier
  .foregroundColor('#007AFF')
  .textDecoration('underline')
  .cursor('pointer')
  .onTap(() => console.log('Text clicked!'))
  .onHover((isHovered) => {
    console.log('Hover state:', isHovered)
  })
  .build()

// Selectable text
const selectableText = Text("This text can be selected and copied")
  .modifier
  .userSelect('text')
  .padding(12)
  .backgroundColor('#f0f0f0')
  .build()
```

## Button Component Examples

### Basic Button Usage

```typescript
import { Button, createSignal } from '@tachui/core'

// Simple button with action
const basicButton = Button('Click Me', () => {
  console.log('Button was clicked!')
})

// Styled button
const primaryButton = Button('Save Changes', async () => {
  console.log('Saving changes...')
  await saveChanges()
})
  .modifier
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  .fontSize(16)
  .fontWeight('600')
  .build()
```

### Button Variants

```typescript
// Primary button
const primary = Button('Primary', () => {})
  .modifier
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  .build()

// Secondary button
const secondary = Button('Secondary', () => {})
  .modifier
  .backgroundColor('transparent')
  .foregroundColor('#007AFF')
  .border(1, '#007AFF')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  .build()

// Destructive button
const destructive = Button('Delete', () => {})
  .modifier
  .backgroundColor('#FF3B30')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  .build()

// Text button
const textButton = Button('Cancel', () => {})
  .modifier
  .backgroundColor('transparent')
  .foregroundColor('#666666')
  .padding({ top: 8, bottom: 8, left: 16, right: 16 })
  .build()
```

### Button States

```typescript
// Loading button
const [isLoading, setIsLoading] = createSignal(false)

const loadingButton = Button(() => isLoading() ? 'Loading...' : 'Submit', async () => {
  setIsLoading(true)
  try {
    await submitForm()
  } finally {
    setIsLoading(false)
  }
})
  .modifier
  .disabled(isLoading)
  .opacity(() => isLoading() ? 0.7 : 1.0)
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  .build()

// Conditional button
const [hasUnsavedChanges, setHasUnsavedChanges] = createSignal(false)

const saveButton = Button('Save', () => {})
  .modifier
  .disabled(() => !hasUnsavedChanges())
  .backgroundColor(() => hasUnsavedChanges() ? '#007AFF' : '#cccccc')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  .build()
```

## Form Components

### Picker Component

```typescript
import { Picker, createSignal } from '@tachui/core'

const [selectedFruit, setSelectedFruit] = createSignal('apple')

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'grape', label: 'Grape' }
]

// Dropdown picker (default)
const dropdownPicker = Picker(selectedFruit, fruits, {
  onSelectionChange: setSelectedFruit,
  variant: 'dropdown',
  placeholder: 'Select a fruit'
})
  .modifier
  .padding(12)
  .border(1, '#e0e0e0')
  .cornerRadius(6)
  .minWidth(200)
  .build()

// Segmented picker
const segmentedPicker = Picker(selectedFruit, fruits, {
  onSelectionChange: setSelectedFruit,
  variant: 'segmented'
})
  .modifier
  .backgroundColor('#f3f4f6')
  .cornerRadius(8)
  .padding(4)
  .build()

// Wheel picker
const wheelPicker = Picker(selectedFruit, fruits, {
  onSelectionChange: setSelectedFruit,
  variant: 'wheel'
})
  .modifier
  .padding(8)
  .border(1, '#d1d5db')
  .cornerRadius(6)
  .build()

// Searchable picker
const searchablePicker = Picker(selectedFruit, fruits, {
  onSelectionChange: setSelectedFruit,
  searchable: true,
  placeholder: 'Search fruits...'
})
  .modifier
  .minWidth(250)
  .build()
```

### Toggle Component

```typescript
import { Toggle, createSignal } from '@tachui/core'

const [isEnabled, setIsEnabled] = createSignal(false)
const [darkMode, setDarkMode] = createSignal(false)
const [agreeToTerms, setAgreeToTerms] = createSignal(false)

// Switch toggle (default)
const switchToggle = Toggle(isEnabled, {
  onToggle: setIsEnabled,
  label: 'Enable Notifications',
  labelPosition: 'leading'
})

// Checkbox toggle
const checkboxToggle = Toggle(agreeToTerms, {
  onToggle: setAgreeToTerms,
  label: 'I agree to the terms and conditions',
  variant: 'checkbox'
})

// Button toggle
const buttonToggle = Toggle(darkMode, {
  onToggle: setDarkMode,
  variant: 'button'
})
  .modifier
  .cornerRadius(12)
  .build()

// Styled toggle
const customToggle = Toggle(isEnabled, {
  onToggle: setIsEnabled,
  label: 'Custom Styled Toggle',
  color: '#34C759',
  offColor: '#f0f0f0',
  variant: 'switch',
  size: 'large'
})
  .modifier
  .padding(16)
  .build()
```

### Slider Component

```typescript
import { createSignal } from '@tachui/core'
import { Slider } from '@tachui/advanced-forms'

const [volume, setVolume] = createSignal(50)
const [brightness, setBrightness] = createSignal(75)

// Basic slider
const volumeSlider = Slider(volume, {
  onValueChange: setVolume,
  min: 0,
  max: 100,
  step: 1
})
  .modifier
  .width(300)
  .build()

// Formatted slider with marks
const brightnessSlider = Slider(brightness, {
  onValueChange: setBrightness,
  min: 0,
  max: 100,
  step: 5,
  formatter: (value) => `${value}%`,
  marks: [
    { value: 0, label: 'Off' },
    { value: 25, label: 'Low' },
    { value: 50, label: 'Medium' },
    { value: 75, label: 'High' },
    { value: 100, label: 'Max' }
  ]
})
  .modifier
  .width('100%')
  .maxWidth(400)
  .padding(20)
  .build()

// Custom styled slider
const customSlider = Slider(volume, {
  onValueChange: setVolume,
  min: 0,
  max: 100,
  trackColor: '#e0e0e0',
  activeTrackColor: '#007AFF',
  thumbColor: '#ffffff'
})
  .modifier
  .width(250)
  .height(40)
  .build()
```

## Layout Components

### VStack Examples

```typescript
import { VStack, Text, Button } from '@tachui/core'

// Basic vertical layout
const basicVStack = VStack({
  children: [
    Text('First Item'),
    Text('Second Item'),
    Text('Third Item')
  ],
  spacing: 16,
  alignment: 'center'
})
  .modifier
  .padding(20)
  .backgroundColor('#f8f9fa')
  .cornerRadius(12)
  .build()

// Complex vertical layout
const userProfileStack = VStack({
  children: [
    Text('John Doe')
      .modifier
      .fontSize(24)
      .fontWeight('bold')
      .build(),
    
    Text('Software Developer')
      .modifier
      .fontSize(16)
      .foregroundColor('#666666')
      .build(),
    
    Text('Passionate about creating great user experiences')
      .modifier
      .fontSize(14)
      .foregroundColor('#888888')
      .textAlign('center')
      .lineHeight(1.4)
      .build(),
    
    Button('Contact', () => console.log('Contact clicked'))
      .modifier
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ top: 10, bottom: 10, left: 20, right: 20 })
      .cornerRadius(8)
      .build()
  ],
  spacing: 12,
  alignment: 'center'
})
  .modifier
  .padding(24)
  .backgroundColor('#ffffff')
  .cornerRadius(16)
  .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
  .maxWidth(300)
  .build()
```

### HStack Examples

```typescript
import { HStack, Text, Button } from '@tachui/core'

// Basic horizontal layout
const basicHStack = HStack({
  children: [
    Text('Left'),
    Text('Center'),
    Text('Right')
  ],
  spacing: 16,
  alignment: 'center'
})
  .modifier
  .padding(16)
  .backgroundColor('#f0f0f0')
  .cornerRadius(8)
  .build()

// Navigation bar example
const navigationBar = HStack({
  children: [
    Button('Back', () => console.log('Back'))
      .modifier
      .backgroundColor('transparent')
      .foregroundColor('#007AFF')
      .build(),
    
    Text('Page Title')
      .modifier
      .fontSize(18)
      .fontWeight('600')
      .flexGrow(1)
      .textAlign('center')
      .build(),
    
    Button('Menu', () => console.log('Menu'))
      .modifier
      .backgroundColor('transparent')
      .foregroundColor('#007AFF')
      .build()
  ],
  spacing: 16,
  alignment: 'center'
})
  .modifier
  .padding(16)
  .backgroundColor('#ffffff')
  .borderBottom(1, '#e0e0e0')
  .build()
```

### ZStack Examples

```typescript
import { ZStack, Text } from '@tachui/core'

// Layered layout
const cardWithOverlay = ZStack({
  children: [
    // Background
    Text('')
      .modifier
      .backgroundColor('#007AFF')
      .frame({ width: 200, height: 120 })
      .cornerRadius(12)
      .build(),
    
    // Overlay content
    VStack({
      children: [
        Text('Card Title')
          .modifier
          .fontSize(18)
          .fontWeight('bold')
          .foregroundColor('white')
          .build(),
        
        Text('Card description text')
          .modifier
          .fontSize(14)
          .foregroundColor('rgba(255,255,255,0.9)')
          .textAlign('center')
          .build()
      ],
      spacing: 8,
      alignment: 'center'
    })
  ],
  alignment: 'center'
})
```

## Form Examples

### Complete User Registration Form

```typescript
import { Form, Section, Picker, Toggle, Button, VStack } from '@tachui/core'
import { Slider } from '@tachui/advanced-forms'

function UserRegistrationForm() {
  // Form state
  const [formData, setFormData] = createSignal({
    name: '',
    email: '',
    country: 'us',
    notifications: true,
    experience: 3
  })

  // Form options
  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' }
  ]

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    console.log('Form submitted:', formData())
  }

  return VStack({
    children: [
      Form([
        // Personal Information Section
        Section([], {
          title: 'Personal Information',
          footer: 'This information helps us personalize your experience'
        }),

        // Country Selection
        Picker(() => formData().country, countries, {
          onSelectionChange: (value) => updateField('country', value),
          placeholder: 'Select your country'
        })
          .modifier
          .padding(12)
          .border(1, '#e0e0e0')
          .cornerRadius(6)
          .marginBottom(16)
          .build(),

        // Preferences Section
        Section([], {
          title: 'Preferences'
        }),

        // Notifications Toggle
        Toggle(() => formData().notifications, {
          onToggle: (value) => updateField('notifications', value),
          label: 'Enable email notifications',
          labelPosition: 'leading'
        })
          .modifier
          .marginBottom(16)
          .build(),

        // Experience Slider
        VStack({
          children: [
            Text(() => `Experience Level: ${formData().experience} years`)
              .modifier
              .fontSize(14)
              .fontWeight('500')
              .marginBottom(8)
              .build(),

            Slider(() => formData().experience, {
              onValueChange: (value) => updateField('experience', value),
              min: 0,
              max: 10,
              step: 1,
              marks: [
                { value: 0, label: 'Beginner' },
                { value: 5, label: 'Intermediate' },
                { value: 10, label: 'Expert' }
              ]
            })
              .modifier
              .width('100%')
              .build()
          ],
          spacing: 8,
          alignment: 'stretch'
        })
      ], {
        onSubmit: handleSubmit
      })
        .modifier
        .padding(20)
        .backgroundColor('#ffffff')
        .cornerRadius(12)
        .border(1, '#e0e0e0')
        .build(),

      // Submit Button
      Button('Create Account', handleSubmit)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('white')
        .padding({ top: 16, bottom: 16, left: 32, right: 32 })
        .cornerRadius(8)
        .fontSize(16)
        .fontWeight('600')
        .marginTop(24)
        .build()
    ],
    spacing: 16,
    alignment: 'stretch'
  })
    .modifier
    .padding(20)
    .maxWidth(500)
    .backgroundColor('#f8f9fa')
    .build()
}
```

## Navigation Examples

### Enhanced TabView

```typescript
import { EnhancedTabView } from '@tachui/core'

// Create tab content components
const HomeContent = () => VStack({
  children: [
    Text('Welcome to the Home tab')
      .modifier
      .fontSize(18)
      .textAlign('center')
      .build()
  ],
  spacing: 16,
  alignment: 'center'
})

const SearchContent = () => VStack({
  children: [
    Text('Search functionality here')
      .modifier
      .fontSize(18)
      .textAlign('center')
      .build()
  ],
  spacing: 16,
  alignment: 'center'
})

const ProfileContent = () => VStack({
  children: [
    Text('User profile information')
      .modifier
      .fontSize(18)
      .textAlign('center')
      .build()
  ],
  spacing: 16,
  alignment: 'center'
})

// Create tabs
const tabs = [
  createTabItem('home', 'Home', HomeContent(), { icon: '🏠' }),
  createTabItem('search', 'Search', SearchContent(), { icon: '🔍', badge: '3' }),
  createTabItem('profile', 'Profile', ProfileContent(), { icon: '👤' })
]

// Floating tab view (modern style)
const modernTabView = EnhancedTabView(tabs, {
  style: 'floating',
  material: 'glass',
  customization: 'visible',
  allowReordering: true,
  onSelectionChange: (tabId) => {
    console.log('Tab selected:', tabId)
  }
})

// Sidebar adaptable (responsive)
const responsiveTabView = EnhancedTabView(tabs, {
  style: 'sidebar-adaptable',
  breakpoint: 768,
  material: 'blur',
  prominence: 'increased'
})
```

## Advanced Examples

### Reactive Component with Multiple States

```typescript
function InteractiveCard() {
  const [isHovered, setIsHovered] = createSignal(false)
  const [isSelected, setIsSelected] = createSignal(false)
  const [likeCount, setLikeCount] = createSignal(42)

  const handleLike = () => {
    setLikeCount(prev => prev + 1)
  }

  const handleSelect = () => {
    setIsSelected(!isSelected())
  }

  return VStack({
    children: [
      // Header
      HStack({
        children: [
          Text('Interactive Card')
            .modifier
            .fontSize(18)
            .fontWeight('600')
            .flexGrow(1)
            .build(),
          
          Button(() => isSelected() ? '✓' : '○', handleSelect)
            .modifier
            .backgroundColor('transparent')
            .foregroundColor(() => isSelected() ? '#34C759' : '#666666')
            .fontSize(18)
            .build()
        ],
        spacing: 12,
        alignment: 'center'
      }),

      // Content
      Text('This card demonstrates reactive state management with hover, selection, and interaction states.')
        .modifier
        .fontSize(14)
        .lineHeight(1.4)
        .foregroundColor('#666666')
        .build(),

      // Actions
      HStack({
        children: [
          Button(`❤️ ${likeCount()}`, handleLike)
            .modifier
            .backgroundColor('transparent')
            .foregroundColor('#FF3B30')
            .fontSize(14)
            .build(),
          
          Button('Share', () => console.log('Share'))
            .modifier
            .backgroundColor('#007AFF')
            .foregroundColor('white')
            .padding({ top: 6, bottom: 6, left: 12, right: 12 })
            .cornerRadius(6)
            .fontSize(14)
            .build()
        ],
        spacing: 12,
        alignment: 'center'
      })
    ],
    spacing: 16,
    alignment: 'stretch'
  })
    .modifier
    .padding(20)
    .backgroundColor(() => isHovered() ? '#f8f9fa' : '#ffffff')
    .border(2, () => isSelected() ? '#007AFF' : '#e0e0e0')
    .cornerRadius(12)
    .shadow(() => isHovered() ? 
      { x: 0, y: 4, radius: 12, color: 'rgba(0,0,0,0.15)' } :
      { x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' }
    )
    .onHover(setIsHovered)
    .cursor('pointer')
    .transition('all', 200, 'ease-out')
    .build()
}
```

## Testing Examples

All these components can be tested using Vitest. Here's an example test pattern:

```typescript
import { describe, it, expect } from 'vitest'
import { createSignal } from '@tachui/core'
import { Button } from '@tachui/core'

describe('Button Component Examples', () => {
  it('should create a basic button', () => {
    const button = Button('Test Button', () => {})
    
    expect(button).toBeDefined()
    expect(button.render).toBeDefined()
  })

  it('should handle reactive state', () => {
    const [clicked, setClicked] = createSignal(false)
    
    const button = Button(() => clicked() ? 'Clicked!' : 'Click Me', () => {
      setClicked(true)
    })
    
    expect(button).toBeDefined()
  })

  it('should apply modifiers correctly', () => {
    const styledButton = Button('Styled', () => {})
      .modifier
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ top: 12, bottom: 12, left: 24, right: 24 })
      .cornerRadius(8)
      .build()
    
    expect(styledButton).toBeDefined()
  })
})
```

---

## Notes

- All examples use the verified API patterns from TachUI's test suite
- Each component follows the `ComponentFunction(params, props)` pattern
- Modifiers always use the `.modifier.property().build()` pattern
- Reactive values use signals: `() => signal()` for dynamic properties
- These examples are guaranteed to work with the current TachUI implementation

For more comprehensive documentation, see the [Complete Components Guide](/guide/complete-components-guide).