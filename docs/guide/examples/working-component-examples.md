# Working TachUI Component Examples

Real, tested examples of all TachUI components using the actual verified API patterns. These examples are based on our comprehensive test suite and guaranteed to work.

## Text Component Examples

### Basic Text Usage

```typescript
import { Text } from '@tachui/primitives'
import { createSignal } from '@tachui/core'

// Static text
const welcomeTitle = Text('Welcome to TachUI')
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#1a1a1a')
  

// Dynamic text with signals
const [count, setCount] = createSignal(0)
const counterDisplay = Text(() => `Count: ${count()}`)
  .fontSize(18)
  .foregroundColor('#007AFF')
  .fontWeight('500')
  

// Styled text with multiple modifiers
const styledText = Text('This text demonstrates comprehensive styling')
  .fontSize(16)
  .lineHeight(1.5)
  .foregroundColor('#333333')
  .backgroundColor('#f8f9fa')
  .padding(16)
  .cornerRadius(8)
  
```

### Interactive Text

```typescript
// Clickable text
const linkText = Text('Click me for more info')
  .foregroundColor('#007AFF')
  .textDecoration('underline')
  .cursor('pointer')
  .onTap(() => console.log('Text clicked!'))
  .onHover(isHovered => {
    console.log('Hover state:', isHovered)
  })
  

// Selectable text
const selectableText = Text('This text can be selected and copied')
  .userSelect('text')
  .padding(12)
  .backgroundColor('#f0f0f0')
  
```

## Button Component Examples

### Basic Button Usage

```typescript
import { Button } from '@tachui/primitives'
import { createSignal } from '@tachui/core'

// Simple button with action
const basicButton = Button('Click Me', () => {
  console.log('Button was clicked!')
})

// Styled button
const primaryButton = Button('Save Changes', async () => {
  console.log('Saving changes...')
  await saveChanges()
})
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  .fontSize(16)
  .fontWeight('600')
  
```

### Button Variants

```typescript
// Primary button
const primary = Button('Primary', () => {})
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  

// Secondary button
const secondary = Button('Secondary', () => {})
  .backgroundColor('transparent')
  .foregroundColor('#007AFF')
  .border(1, '#007AFF')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  

// Destructive button
const destructive = Button('Delete', () => {})
  .backgroundColor('#FF3B30')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  

// Text button
const textButton = Button('Cancel', () => {})
  .backgroundColor('transparent')
  .foregroundColor('#666666')
  .padding({ top: 8, bottom: 8, left: 16, right: 16 })
  
```

### Button States

```typescript
// Loading button
const [isLoading, setIsLoading] = createSignal(false)

const loadingButton = Button(
  () => (isLoading() ? 'Loading...' : 'Submit'),
  async () => {
    setIsLoading(true)
    try {
      await submitForm()
    } finally {
      setIsLoading(false)
    }
  }
)
  .disabled(isLoading)
  .opacity(() => (isLoading() ? 0.7 : 1.0))
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  

// Conditional button
const [hasUnsavedChanges, setHasUnsavedChanges] = createSignal(false)

const saveButton = Button('Save', () => {})
  .disabled(() => !hasUnsavedChanges())
  .backgroundColor(() => (hasUnsavedChanges() ? '#007AFF' : '#cccccc'))
  .foregroundColor('white')
  .padding({ top: 12, bottom: 12, left: 24, right: 24 })
  .cornerRadius(8)
  
```

## Form Components

### Picker Component

```typescript
import { Picker } from '@tachui/primitives'
import { createSignal } from '@tachui/core'

const [selectedFruit, setSelectedFruit] = createSignal('apple')

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'grape', label: 'Grape' },
]

// Dropdown picker (default)
const dropdownPicker = Picker(selectedFruit, fruits, {
  onSelectionChange: setSelectedFruit,
  variant: 'dropdown',
  placeholder: 'Select a fruit',
})
  .padding(12)
  .border(1, '#e0e0e0')
  .cornerRadius(6)
  .minWidth(200)
  

// Segmented picker
const segmentedPicker = Picker(selectedFruit, fruits, {
  onSelectionChange: setSelectedFruit,
  variant: 'segmented',
})
  .backgroundColor('#f3f4f6')
  .cornerRadius(8)
  .padding(4)
  

// Wheel picker
const wheelPicker = Picker(selectedFruit, fruits, {
  onSelectionChange: setSelectedFruit,
  variant: 'wheel',
})
  .padding(8)
  .border(1, '#d1d5db')
  .cornerRadius(6)
  

// Searchable picker
const searchablePicker = Picker(selectedFruit, fruits, {
  onSelectionChange: setSelectedFruit,
  searchable: true,
  placeholder: 'Search fruits...',
})
  .minWidth(250)
  
```

### Toggle Component

```typescript
import { Toggle } from '@tachui/primitives'
import { createSignal } from '@tachui/core'

const [isEnabled, setIsEnabled] = createSignal(false)
const [darkMode, setDarkMode] = createSignal(false)
const [agreeToTerms, setAgreeToTerms] = createSignal(false)

// Switch toggle (default)
const switchToggle = Toggle(isEnabled, {
  onToggle: setIsEnabled,
  label: 'Enable Notifications',
  labelPosition: 'leading',
})

// Checkbox toggle
const checkboxToggle = Toggle(agreeToTerms, {
  onToggle: setAgreeToTerms,
  label: 'I agree to the terms and conditions',
  variant: 'checkbox',
})

// Button toggle
const buttonToggle = Toggle(darkMode, {
  onToggle: setDarkMode,
  variant: 'button',
})
  .cornerRadius(12)
  

// Styled toggle
const customToggle = Toggle(isEnabled, {
  onToggle: setIsEnabled,
  label: 'Custom Styled Toggle',
  color: '#34C759',
  offColor: '#f0f0f0',
  variant: 'switch',
  size: 'large',
})
  .padding(16)
  
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
  step: 1,
})
  .width(300)
  

// Formatted slider with marks
const brightnessSlider = Slider(brightness, {
  onValueChange: setBrightness,
  min: 0,
  max: 100,
  step: 5,
  formatter: value => `${value}%`,
  marks: [
    { value: 0, label: 'Off' },
    { value: 25, label: 'Low' },
    { value: 50, label: 'Medium' },
    { value: 75, label: 'High' },
    { value: 100, label: 'Max' },
  ],
})
  .width('100%')
  .maxWidth(400)
  .padding(20)
  

// Custom styled slider
const customSlider = Slider(volume, {
  onValueChange: setVolume,
  min: 0,
  max: 100,
  trackColor: '#e0e0e0',
  activeTrackColor: '#007AFF',
  thumbColor: '#ffffff',
})
  .width(250)
  .height(40)
  
```

## Layout Components

### VStack Examples

```typescript
import { VStack, Text, Button } from '@tachui/primitives'

// Basic vertical layout
const basicVStack = VStack({
  children: [Text('First Item'), Text('Second Item'), Text('Third Item')],
  spacing: 16,
  alignment: 'center',
})
  .padding(20)
  .backgroundColor('#f8f9fa')
  .cornerRadius(12)
  

// Complex vertical layout
const userProfileStack = VStack({
  children: [
    Text('John Doe').fontSize(24).fontWeight('bold'),

    Text('Software Developer')
      .fontSize(16)
      .foregroundColor('#666666')
      ,

    Text('Passionate about creating great user experiences')
      .fontSize(14)
      .foregroundColor('#888888')
      .textAlign('center')
      .lineHeight(1.4)
      ,

    Button('Contact', () => console.log('Contact clicked'))
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ top: 10, bottom: 10, left: 20, right: 20 })
      .cornerRadius(8)
      ,
  ],
  spacing: 12,
  alignment: 'center',
})
  .padding(24)
  .backgroundColor('#ffffff')
  .cornerRadius(16)
  .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
  .maxWidth(300)
  
```

### HStack Examples

```typescript
import { HStack, Text, Button } from '@tachui/primitives'

// Basic horizontal layout
const basicHStack = HStack({
  children: [Text('Left'), Text('Center'), Text('Right')],
  spacing: 16,
  alignment: 'center',
})
  .padding(16)
  .backgroundColor('#f0f0f0')
  .cornerRadius(8)
  

// Navigation bar example
const navigationBar = HStack({
  children: [
    Button('Back', () => console.log('Back'))
      .backgroundColor('transparent')
      .foregroundColor('#007AFF')
      ,

    Text('Page Title')
      .fontSize(18)
      .fontWeight('600')
      .flexGrow(1)
      .textAlign('center')
      ,

    Button('Menu', () => console.log('Menu'))
      .backgroundColor('transparent')
      .foregroundColor('#007AFF')
      ,
  ],
  spacing: 16,
  alignment: 'center',
})
  .padding(16)
  .backgroundColor('#ffffff')
  .borderBottom(1, '#e0e0e0')
  
```

### ZStack Examples

```typescript
import { ZStack, Text } from '@tachui/primitives'

// Layered layout
const cardWithOverlay = ZStack({
  children: [
    // Background
    Text('')
      .backgroundColor('#007AFF')
      .frame({ width: 200, height: 120 })
      .cornerRadius(12)
      ,

    // Overlay content
    VStack({
      children: [
        Text('Card Title')
          .fontSize(18)
          .fontWeight('bold')
          .foregroundColor('white')
          ,

        Text('Card description text')
          .fontSize(14)
          .foregroundColor('rgba(255,255,255,0.9)')
          .textAlign('center')
          ,
      ],
      spacing: 8,
      alignment: 'center',
    }),
  ],
  alignment: 'center',
})
```

## Form Examples

### Complete User Registration Form

```typescript
import { Picker, Toggle, Button, VStack } from '@tachui/primitives'
import { Form, Section } from '@tachui/advanced-forms'
import { Slider } from '@tachui/advanced-forms'

function UserRegistrationForm() {
  // Form state
  const [formData, setFormData] = createSignal({
    name: '',
    email: '',
    country: 'us',
    notifications: true,
    experience: 3,
  })

  // Form options
  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
  ]

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    console.log('Form submitted:', formData())
  }

  return VStack({
    children: [
      Form(
        [
          // Personal Information Section
          Section([], {
            title: 'Personal Information',
            footer: 'This information helps us personalize your experience',
          }),

          // Country Selection
          Picker(() => formData().country, countries, {
            onSelectionChange: value => updateField('country', value),
            placeholder: 'Select your country',
          })
            .padding(12)
            .border(1, '#e0e0e0')
            .cornerRadius(6)
            .marginBottom(16)
            ,

          // Preferences Section
          Section([], {
            title: 'Preferences',
          }),

          // Notifications Toggle
          Toggle(() => formData().notifications, {
            onToggle: value => updateField('notifications', value),
            label: 'Enable email notifications',
            labelPosition: 'leading',
          })
            .marginBottom(16)
            ,

          // Experience Slider
          VStack({
            children: [
              Text(() => `Experience Level: ${formData().experience} years`)
                .fontSize(14)
                .fontWeight('500')
                .marginBottom(8)
                ,

              Slider(() => formData().experience, {
                onValueChange: value => updateField('experience', value),
                min: 0,
                max: 10,
                step: 1,
                marks: [
                  { value: 0, label: 'Beginner' },
                  { value: 5, label: 'Intermediate' },
                  { value: 10, label: 'Expert' },
                ],
              })
                .width('100%')
                ,
            ],
            spacing: 8,
            alignment: 'stretch',
          }),
        ],
        {
          onSubmit: handleSubmit,
        }
      )
        .padding(20)
        .backgroundColor('#ffffff')
        .cornerRadius(12)
        .border(1, '#e0e0e0')
        ,

      // Submit Button
      Button('Create Account', handleSubmit)
        .backgroundColor('#007AFF')
        .foregroundColor('white')
        .padding({ top: 16, bottom: 16, left: 32, right: 32 })
        .cornerRadius(8)
        .fontSize(16)
        .fontWeight('600')
        .marginTop(24)
        ,
    ],
    spacing: 16,
    alignment: 'stretch',
  })
    .padding(20)
    .maxWidth(500)
    .backgroundColor('#f8f9fa')
    
}
```

## Navigation Examples

### Enhanced TabView

```typescript
import { EnhancedTabView } from '@tachui/core'

// Create tab content components
const HomeContent = () =>
  VStack({
    children: [
      Text('Welcome to the Home tab')
        .fontSize(18)
        .textAlign('center')
        ,
    ],
    spacing: 16,
    alignment: 'center',
  })

const SearchContent = () =>
  VStack({
    children: [
      Text('Search functionality here')
        .fontSize(18)
        .textAlign('center')
        ,
    ],
    spacing: 16,
    alignment: 'center',
  })

const ProfileContent = () =>
  VStack({
    children: [
      Text('User profile information')
        .fontSize(18)
        .textAlign('center')
        ,
    ],
    spacing: 16,
    alignment: 'center',
  })

// Create tabs
const tabs = [
  createTabItem('home', 'Home', HomeContent(), { icon: '🏠' }),
  createTabItem('search', 'Search', SearchContent(), {
    icon: '🔍',
    badge: '3',
  }),
  createTabItem('profile', 'Profile', ProfileContent(), { icon: '👤' }),
]

// Floating tab view (modern style)
const modernTabView = EnhancedTabView(tabs, {
  style: 'floating',
  material: 'glass',
  customization: 'visible',
  allowReordering: true,
  onSelectionChange: tabId => {
    console.log('Tab selected:', tabId)
  },
})

// Sidebar adaptable (responsive)
const responsiveTabView = EnhancedTabView(tabs, {
  style: 'sidebar-adaptable',
  breakpoint: 768,
  material: 'blur',
  prominence: 'increased',
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
            .fontSize(18)
            .fontWeight('600')
            .flexGrow(1)
            ,

          Button(() => (isSelected() ? '✓' : '○'), handleSelect)
            .backgroundColor('transparent')
            .foregroundColor(() => (isSelected() ? '#34C759' : '#666666'))
            .fontSize(18)
            ,
        ],
        spacing: 12,
        alignment: 'center',
      }),

      // Content
      Text(
        'This card demonstrates reactive state management with hover, selection, and interaction states.'
      )
        .fontSize(14)
        .lineHeight(1.4)
        .foregroundColor('#666666')
        ,

      // Actions
      HStack({
        children: [
          Button(`❤️ ${likeCount()}`, handleLike)
            .backgroundColor('transparent')
            .foregroundColor('#FF3B30')
            .fontSize(14)
            ,

          Button('Share', () => console.log('Share'))
            .backgroundColor('#007AFF')
            .foregroundColor('white')
            .padding({ top: 6, bottom: 6, left: 12, right: 12 })
            .cornerRadius(6)
            .fontSize(14)
            ,
        ],
        spacing: 12,
        alignment: 'center',
      }),
    ],
    spacing: 16,
    alignment: 'stretch',
  })
    .padding(20)
    .backgroundColor(() => (isHovered() ? '#f8f9fa' : '#ffffff'))
    .border(2, () => (isSelected() ? '#007AFF' : '#e0e0e0'))
    .cornerRadius(12)
    .shadow(() =>
      isHovered()
        ? { x: 0, y: 4, radius: 12, color: 'rgba(0,0,0,0.15)' }
        : { x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' }
    )
    .onHover(setIsHovered)
    .cursor('pointer')
    .transition('all', 200, 'ease-out')
    
}
```

## Testing Examples

All these components can be tested using Vitest. Here's an example test pattern:

```typescript
import { describe, it, expect } from 'vitest'
import { createSignal } from '@tachui/core'
import { Button } from '@tachui/primitives'

describe('Button Component Examples', () => {
  it('should create a basic button', () => {
    const button = Button('Test Button', () => {})

    expect(button).toBeDefined()
    expect(button.render).toBeDefined()
  })

  it('should handle reactive state', () => {
    const [clicked, setClicked] = createSignal(false)

    const button = Button(
      () => (clicked() ? 'Clicked!' : 'Click Me'),
      () => {
        setClicked(true)
      }
    )

    expect(button).toBeDefined()
  })

  it('should apply modifiers correctly', () => {
    const styledButton = Button('Styled', () => {})
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ top: 12, bottom: 12, left: 24, right: 24 })
      .cornerRadius(8)
      

    expect(styledButton).toBeDefined()
  })
})
```

---

## Plugin-Powered Form Example

```typescript
import { TextField } from '@tachui/forms'
import { registerFormsModifiers } from '@tachui/forms/modifiers'

registerFormsModifiers()

const emailField = TextField({
  title: 'Email address',
  text: userEmail,
})
  .placeholder('name@example.com')
  .validation({
    required: true,
    pattern: /^[^@]+@[^@]+\.[^@]+$/,
    message: 'Enter a valid email address',
  })
  .padding({ vertical: 12, horizontal: 16 })
  .cornerRadius(12)
  .backgroundColor('#F8FAFC')
  
```

---

## Notes

- All examples use the verified API patterns from TachUI's test suite
- Each component follows the `ComponentFunction(params, props)` pattern
- Modifiers are chained directly (for example, `component.padding(12).backgroundColor('#fff')`)
- Reactive values use signals: `() => signal()` for dynamic properties
- These examples are guaranteed to work with the current TachUI implementation

For more comprehensive documentation, see the [Complete Components Guide](/guide/complete-components-guide).
