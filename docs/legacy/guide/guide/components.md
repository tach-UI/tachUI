# Basic Components

TachUI provides a comprehensive set of SwiftUI-inspired components that make building web UIs intuitive and powerful. All components follow SwiftUI patterns with modifier chaining and reactive state management.

## Overview

Import components from `@tachui/core`:

```typescript
// Core Components
import { 
  Text, 
  Button, 
  TextField, 
  Image, 
  VStack, HStack, ZStack,
  Spacer,
  ScrollView, List,
  Show, For, ForEach
} from '@tachui/core'

// Form Components
import {
  Form,
  Section,
  Picker,
  Slider,
  Toggle
} from '@tachui/core'

// Navigation Components
import {
  NavigationView,
  NavigationLink,
  TabView
} from '@tachui/core'
```

## Text Component

The Text component displays static or dynamic text with full typography control.

### Basic Usage

```typescript
// Simple text
Text("Hello, World!")
  .modifier
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#007AFF')
  .build()

// Reactive text with signal
const [message, setMessage] = createSignal("Dynamic content")
Text(message)
  .modifier
  .fontSize(18)
  .italic()
  .build()

// Dynamic text with state
const [count, setCount] = createSignal(0)
Text(() => `Count: ${count()}`)
  .modifier
  .fontSize(18)
  .textAlign('center')
  .build()
```

### Typography Presets

TachUI includes SwiftUI-style typography presets:

```typescript
TextStyles.LargeTitle("Main Heading")
TextStyles.Title("Section Title")  
TextStyles.Headline("Important Info")
TextStyles.Body("Regular content text")
TextStyles.Caption("Small details")
```

### Advanced Text Styling

```typescript
Text("Styled Text")
  .modifier
  .font({
    family: 'system-ui',
    size: 20,
    weight: '600',
    style: 'italic'
  })
  .textDecoration('underline')
  .textTransform('uppercase')
  .lineHeight(1.4)
  .letterSpacing(0.5)
  .lineLimit(3)
  .truncationMode('tail')
  .build()
```

### Text Properties

```typescript
interface TextProps {
  // Typography
  font?: {
    family?: string
    size?: number | string  
    weight?: 'normal' | 'bold' | '100'-'900'
    style?: 'normal' | 'italic' | 'oblique'
  }
  
  // Styling
  color?: string | Signal<string>
  backgroundColor?: string | Signal<string>
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: 'none' | 'underline' | 'line-through'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  
  // Layout
  lineLimit?: number
  truncationMode?: 'head' | 'tail' | 'middle'
  allowsSelection?: boolean
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityRole?: 'text' | 'heading' | 'label'
  accessibilityLevel?: 1 | 2 | 3 | 4 | 5 | 6
  
  // Interactive
  onTap?: () => void
  onLongPress?: () => void
}
```

## Button Component

Interactive buttons with press states, variants, and actions.

### Basic Usage

```typescript
// Simple button
Button("Click Me", () => console.log("Clicked!"))
  .modifier
  .backgroundColor('#007AFF')
  .foregroundColor('#ffffff')
  .padding(12, 24)
  .cornerRadius(8)
  .build()

// Button with reactive state
const [isLoading, setIsLoading] = createSignal(false)
Button(() => isLoading() ? "Loading..." : "Submit", async () => {
  setIsLoading(true)
  await submitData()
  setIsLoading(false)
})
```

### Button Variants

Pre-configured button styles following SwiftUI patterns:

```typescript
// Primary filled button
ButtonStyles.Filled("Save", handleSave)
  .modifier
  .cornerRadius(8)
  .build()

// Outlined button  
ButtonStyles.Outlined("Cancel", handleCancel)
  .modifier
  .cornerRadius(8)
  .build()

// Destructive action
ButtonStyles.Destructive("Delete", handleDelete)
  .modifier
  .cornerRadius(8)
  .build()

// Plain text button
ButtonStyles.Plain("Learn More", showDetails)
  .modifier
  .fontSize(16)
  .build()
```

### Button States and Interactions

```typescript
const [isPressed, setIsPressed] = createSignal(false)

Button("Interactive Button", handleClick)
  .modifier
  .backgroundColor(() => isPressed() ? '#0056b3' : '#007AFF')
  .transform(() => isPressed() ? 'scale(0.95)' : 'scale(1)')
  .onTouchStart(() => setIsPressed(true))
  .onTouchEnd(() => setIsPressed(false))
  .transition('all', 150)
  .build()
```

### Button Properties

```typescript
interface ButtonProps {
  // Content
  title?: string | (() => string) | Signal<string>
  systemImage?: string
  
  // Behavior  
  action?: () => void | Promise<void>
  role?: 'destructive' | 'cancel' | 'none'
  isEnabled?: boolean | Signal<boolean>
  
  // Appearance
  variant?: 'filled' | 'outlined' | 'plain' | 'bordered'
  size?: 'small' | 'medium' | 'large'
  tint?: string | Signal<string>
  
  // State
  isPressed?: Signal<boolean>
  isLoading?: boolean | Signal<boolean>
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
}
```

## TextField Component

Text input with validation, formatting, and SwiftUI-style binding.

### Basic Usage

```typescript
const [email, setEmail] = createSignal("")

TextField(email, setEmail, "Enter email address")
  .modifier
  .padding(12)
  .border(1, '#ddd')
  .cornerRadius(8)
  .build()
```

### TextField with State Binding

```typescript
const userEmail = State("")

TextField(userEmail.projectedValue, "Email")
  .modifier
  .padding(12)
  .border(1, '#e0e0e0')
  .cornerRadius(8)
  .onFocus(true, {
    borderColor: '#007AFF'
  })
  .build()
```

### TextField Variants

```typescript
// Email input
TextFieldStyles.Email(emailState.projectedValue, "Email address")

// Password input  
TextFieldStyles.Secure(passwordState.projectedValue, "Password")

// Phone number
TextFieldStyles.Phone(phoneState.projectedValue, "Phone number")

// Search field
TextFieldStyles.Search(queryState.projectedValue, "Search...")

// Multiline text
TextFieldStyles.Multiline(notesState.projectedValue, "Notes", 4)
```

### Validation and Formatting

```typescript
const email = State("")

TextField(email.projectedValue, "Email")
  .modifier
  .validator(TextFieldValidators.email)
  .validateOnBlur(true)
  .onValidation((result) => {
    if (!result.isValid) {
      console.log("Validation error:", result.message)
    }
  })
  .build()

// Format phone numbers automatically
const phone = State("")

TextField(phone.projectedValue, "Phone")
  .modifier
  .formatter(TextFieldFormatters.phone)
  .keyboardType('tel')
  .build()
```

### TextField Properties

```typescript
interface TextFieldProps {
  // Content
  text?: string | Signal<string>
  placeholder?: string | Signal<string>
  
  // Input configuration
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
  maxLength?: number
  minLength?: number
  
  // Behavior
  isEnabled?: boolean | Signal<boolean>
  isRequired?: boolean
  autoFocus?: boolean
  autoComplete?: string
  
  // Validation
  validator?: (value: string) => ValidationResult
  validateOnChange?: boolean
  validateOnBlur?: boolean
  
  // Events
  onTextChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onSubmit?: (value: string) => void
  
  // Appearance
  textColor?: string | Signal<string>
  placeholderColor?: string | Signal<string>
  backgroundColor?: string | Signal<string>
  borderColor?: string | Signal<string>
}
```

## Image Component

Display images with loading states, content modes, and progressive loading.

### Basic Usage

```typescript
Image("/path/to/image.jpg")
  .modifier
  .width(200)
  .height(200)
  .cornerRadius(12)
  .contentMode('fit')
  .build()
```

### Responsive Images

```typescript
Image("/hero-image.jpg")
  .modifier
  .width('100%')
  .aspectRatio(16/9)
  .contentMode('cover')
  .build()
```

### Progressive Loading

```typescript
const [imageState, setImageState] = createSignal('loading')

Image("/large-image.jpg")  
  .modifier
  .width(300)
  .height(200)
  .placeholder('/thumbnail.jpg')
  .loadingStrategy('lazy')
  .onLoadingStateChange(setImageState)
  .opacity(() => imageState() === 'loaded' ? 1 : 0.7)
  .transition('opacity', 300)
  .build()
```

### Image Utilities

```typescript
// Progressive loading
ImageUtils.progressive("/thumb.jpg", "/full.jpg")
  .modifier
  .aspectRatio(4/3)
  .build()

// Responsive images
ImageUtils.responsive([
  { src: "/small.jpg", maxWidth: 480 },
  { src: "/medium.jpg", maxWidth: 768 },
  { src: "/large.jpg", maxWidth: 1200 }
], "/fallback.jpg")
```

### Image Properties

```typescript
interface ImageProps {
  // Source
  src?: string | Signal<string>
  srcSet?: string | Signal<string>
  alt?: string | Signal<string>
  
  // Dimensions  
  width?: number | string | Signal<number | string>
  height?: number | string | Signal<number | string>
  aspectRatio?: number | Signal<number>
  
  // Content mode
  contentMode?: 'fit' | 'fill' | 'stretch' | 'center'
  resizeMode?: 'cover' | 'contain' | 'fill' | 'none'
  
  // Loading
  loadingStrategy?: 'eager' | 'lazy'
  placeholder?: string | ComponentInstance
  errorPlaceholder?: string | ComponentInstance
  
  // Events
  onLoad?: (event: Event) => void
  onError?: (event: Event) => void
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityRole?: string
}
```

## Component Composition

Combine components to build complex UIs:

```typescript
function UserCard({ user }) {
  const [isExpanded, setIsExpanded] = createSignal(false)
  
  // SwiftUI-aligned syntax (recommended)
  return VStack({
    children: [
      // Header with avatar and name
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
              Text(user.name)
                .modifier
                .fontSize(18)
                .fontWeight('600')
                .build(),
                
              Text(user.email)
                .modifier
                .fontSize(14)
                .foregroundColor('#666')
                .build()
            ],
            spacing: 2,
            alignment: 'leading'
          })
        ],
        spacing: 12,
        alignment: 'center'
      }),
      
      // Expandable bio section
      () => isExpanded() ? 
        Text(user.bio)
          .modifier
          .fontSize(14)
          .lineHeight(1.4)
          .build() : null,
      
      // Expand/collapse button
      Button(() => isExpanded() ? "Show Less" : "Show More", 
        () => setIsExpanded(!isExpanded())
      )
      .modifier
      .fontSize(14)
      .foregroundColor('#007AFF')
      .build()
    ],
    spacing: 12,
    alignment: 'stretch'
  })
  .modifier
  .padding(16)
  .backgroundColor('#ffffff')
  .cornerRadius(12)
  .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
  .build()
}

// Modern clean syntax with updated API
function UserCardModern({ user }) {
  const [isExpanded, setIsExpanded] = createSignal(false)
  
  return VStack({
    children: [
      // Header with avatar and name
      HStack({
        children: [
          Image(user.avatar)
            .width(40)
            .height(40)
            .cornerRadius(20),
            
          VStack({
            children: [
              Text(user.name)
                .fontSize(18)
                .fontWeight('600'),
                
              Text(user.email)
                .fontSize(14)
                .foregroundColor('#666')
            ],
            spacing: 2,
            alignment: 'leading'
          })
        ],
        spacing: 12,
        alignment: 'center'
      }),
      
      // Expandable bio section
      () => isExpanded() ? 
        Text(user.bio)
          .fontSize(14)
          .lineHeight(1.4) : null,
      
      // Expand/collapse button
      Button(() => isExpanded() ? "Show Less" : "Show More", 
        () => setIsExpanded(!isExpanded())
      )
      .fontSize(14)
      .foregroundColor('#007AFF')
    ],
    spacing: 12,
    alignment: 'stretch'
  })
  .padding(16)
  .backgroundColor('#ffffff')
  .cornerRadius(12)
  .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
}
```

## Dynamic Rendering Components

TachUI provides three essential components for dynamic, reactive rendering that automatically update when their data sources change.

### Show Component

The Show component provides reactive conditional rendering based on a boolean condition, similar to SwiftUI's conditional view modifiers.

#### Basic Usage

```typescript
import { Show, Text, createSignal, State } from '@tachui/core'

// With Signals
const [isLoggedIn, setIsLoggedIn] = createSignal(false)

Show({
  when: isLoggedIn,  // Can pass signal directly
  children: Text('Welcome back!')
    .modifier
    .fontSize(18)
    .foregroundColor('#007AFF')
    .build(),
  fallback: Text('Please sign in')
    .modifier
    .fontSize(18)
    .foregroundColor('#FF3B30')
    .build()
})

// With State Management
const isLoggedIn = State(false)

Show({
  when: () => isLoggedIn.wrappedValue,
  children: Text('Welcome back!'),
  fallback: Text('Please sign in')
})

#### Advanced Patterns

```typescript
// With complex conditions
const [user, setUser] = createSignal(null)
const [loading, setLoading] = createSignal(false)

Show({
  when: () => !loading() && user() !== null,
  children: VStack({
    children: [
      Text(() => `Hello, ${user().name}!`)
        .modifier
        .fontSize(24)
        .fontWeight('bold')
        .build(),
      
      Text(() => user().email)
        .modifier
        .fontSize(16)
        .foregroundColor('#666')
        .build()
    ],
    spacing: 8,
    alignment: 'center'
  }),
  fallback: loading() 
    ? Text('Loading...')
        .modifier
        .fontSize(16)
        .foregroundColor('#666')
        .build()
    : Text('No user found')
        .modifier
        .fontSize(16)
        .foregroundColor('#FF3B30')
        .build()
})
```

#### Key Features

- **Reactive Conditions**: Automatically updates when signal dependencies change
- **Fallback Support**: Optional fallback content when condition is false
- **Performance Optimized**: Only renders the active content path
- **Type Safe**: Full TypeScript support for condition and content types

#### Best Practices

```typescript
// ✅ Good - Use function for reactive conditions
Show({
  when: () => isAuthenticated(),
  children: DashboardView(),
  fallback: LoginView()
})

// ❌ Avoid - Static boolean (won't be reactive)
Show({
  when: true,
  children: SomeView()
})

// ✅ Good - Persistent signal state for app-level conditions
const [isAuthenticated, setIsAuthenticated] = createSignal(false)

// ✅ Good - Complex conditions with reactive dependencies
Show({
  when: () => user() && user().permissions.includes('admin'),
  children: AdminPanel(),
  fallback: UnauthorizedView()
})
```

### ForEach Component

The ForEach component efficiently renders lists of items with automatic updates when the data changes. It's the primary way to render dynamic lists in TachUI.

#### Basic Usage

```typescript
import { ForEach, createSignal, State } from '@tachui/core'

// With Signals
const [items, setItems] = createSignal(['Apple', 'Banana', 'Orange'])

ForEach({
  data: items,  // Pass signal directly
  children: (item, index) => 
    Text(`${index + 1}. ${item}`)
      .modifier
      .fontSize(16)
      .padding(8)
      .build()
})

// With State Management
const items = State(['Apple', 'Banana', 'Orange'])

ForEach({
  data: () => items.wrappedValue,
  children: (item, index) => Text(`${index + 1}. ${item}`)
})
```

#### Complex Objects with Keys

For optimal performance with object arrays, always provide a `getItemId` function:

```typescript
interface Todo {
  id: number
  text: string
  completed: boolean
}

const [todos, setTodos] = createSignal<Todo[]>([
  { id: 1, text: 'Learn TachUI', completed: false },
  { id: 2, text: 'Build an app', completed: true }
])

ForEach({
  data: todos,
  children: (todo) => 
    HStack({
      children: [
        Toggle(
          () => todo.completed,
          (value) => updateTodo(todo.id, { completed: value })
        ),
        Text(todo.text)
          .modifier
          .textDecoration(() => todo.completed ? 'line-through' : 'none')
          .build()
      ]
    }),
  getItemId: (todo) => todo.id  // Essential for efficient updates
})
```

### For Component (SolidJS Compatibility)

The For component provides SolidJS-style syntax for developers migrating from SolidJS:

#### Basic Usage

```typescript
const [items, setItems] = createSignal(['Apple', 'Banana', 'Orange'])

// SolidJS-style syntax with 'each'
For({
  each: items,
  children: (item, index) => 
    Text(`${index + 1}. ${item}`)
      .modifier
      .fontSize(16)
      .padding(8)
      .build(),
  fallback: Text("No items to display")  // Optional empty state
})
```

#### Reactive Lists

```typescript
const [todos, setTodos] = createSignal([
  { id: 1, text: 'Learn TachUI', completed: false },
  { id: 2, text: 'Build an app', completed: true }
])

For({
  each: todos,
  children: (todo, index) => 
    HStack({
      children: [
        Text(todo.text)
          .modifier
          .fontSize(16)
          .strikethrough(todo.completed)
          .build(),
        
        Button('Toggle', () => {
          const updatedTodos = todos().map(t => 
            t.id === todo.id ? { ...t, completed: !t.completed } : t
          )
          setTodos(updatedTodos)
        })
      ],
      spacing: 12,
      alignment: 'center'
    })
})
```

#### Dynamic Lists

```typescript
const [features, setFeatures] = createSignal([
  'Task Management',
  'Team Collaboration'
])

const addFeature = () => {
  setFeatures([...features(), 'Real-time Updates'])
}

VStack({
  children: [
    Text('Features:')
      .modifier
      .fontSize(18)
      .fontWeight('bold')
      .build(),
    
    For({
      each: features,
      children: (feature, index) => 
        Text(`• ${feature}`)
          .modifier
          .fontSize(14)
          .padding({ left: 16, bottom: 4 })
          .build()
    }),
    
    Button('Add Feature', addFeature)
      .modifier
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding(12)
      .cornerRadius(8)
      .build()
  ],
  spacing: 16
})
```

### Dynamic Components with State vs Signals

Both State Management and Signals work seamlessly with dynamic components. Here's how to choose:

#### When to Use State Management
```typescript
import { State, VStack, TextField, Button, ForEach, type StateWrapper, type ComponentInstance } from '@tachui/core'

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: Date
}

interface TodoItemProps {
  todo: Todo
}

function TodoItem(props: TodoItemProps): ComponentInstance {
  // Todo item implementation
  return Text(props.todo.text)
    .modifier
    .fontSize(16)
    .strikethrough(props.todo.completed)
    .build()
}

// Form-driven lists with two-way binding
function TodoApp(): VStack {
  const todos: StateWrapper<Todo[]> = State<Todo[]>([])
  const newTodoText: StateWrapper<string> = State<string>("")
  
  const addTodo = (): void => {
    if (newTodoText.wrappedValue.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        text: newTodoText.wrappedValue,
        completed: false,
        createdAt: new Date()
      }
      todos.wrappedValue = [...todos.wrappedValue, newTodo]
      newTodoText.wrappedValue = ""
    }
  }
  
  return VStack({
    children: [
      TextField(newTodoText.projectedValue, "New todo")
        .modifier
        .padding(12)
        .border(1, '#ddd')
        .cornerRadius(8)
        .build(),
      Button("Add", addTodo)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12, 24)
        .cornerRadius(8)
        .build(),
      ForEach({
        data: (): Todo[] => todos.wrappedValue,
        children: (todo: Todo): ComponentInstance => TodoItem({ todo }),
        getItemId: (todo: Todo): number => todo.id
      })
    ],
    spacing: 16
  })
}
```

#### When to Use Signals
```typescript
import { createSignal, createMemo, VStack, TextField, Text, ForEach, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

interface Item {
  id: string
  name: string
  category: string
  price: number
  active: boolean
}

interface ItemViewProps {
  item: Item
}

function ItemView(props: ItemViewProps): ComponentInstance {
  return VStack({
    children: [
      Text(props.item.name)
        .modifier
        .fontSize(16)
        .fontWeight('bold')
        .build(),
      Text(`$${props.item.price}`)
        .modifier
        .fontSize(14)
        .foregroundColor('#007AFF')
        .build()
    ]
  })
}

// Performance-critical lists with computed values
function FilteredList(): VStack {
  const [items, setItems]: [Signal<Item[]>, Setter<Item[]>] = createSignal<Item[]>([])
  const [filter, setFilter]: [Signal<string>, Setter<string>] = createSignal<string>("")
  
  // Efficient computed filtering with explicit return type
  const filteredItems: Signal<Item[]> = createMemo((): Item[] => {
    const term: string = filter().toLowerCase()
    return items().filter((item: Item): boolean => 
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    )
  })
  
  return VStack({
    children: [
      TextField(filter, setFilter, "Search...")
        .modifier
        .padding(12)
        .border(1, '#ddd')
        .cornerRadius(8)
        .build(),
      Text((): string => `Showing ${filteredItems().length} of ${items().length} items`)
        .modifier
        .fontSize(14)
        .foregroundColor('#666')
        .marginVertical(8)
        .build(),
      ForEach({
        data: filteredItems,  // Reactive computed data
        children: (item: Item): ComponentInstance => ItemView({ item }),
        getItemId: (item: Item): string => item.id
      })
    ],
    spacing: 16
  })
}
```

#### For vs ForEach

TachUI provides both `For` (SolidJS-style) and `ForEach` (TachUI-style) components:

```typescript
// SolidJS-compatible syntax
For({
  each: items,
  children: (item, index) => Text(item)
})

// TachUI native syntax  
ForEach({
  data: items,
  children: (item, index) => Text(item)
})
```

Use `For` when migrating from SolidJS, use `ForEach` for new TachUI projects.

#### Key Features

- **Reactive Updates**: Automatically updates when the underlying array changes
- **SolidJS Compatibility**: Use familiar `each` prop syntax
- **Type Safety**: Full TypeScript support with generic item types
- **Performance**: Efficient DOM updates with proper keying
- **Flexible Rendering**: Support for any component hierarchy

#### Best Practices

**Use reactive signals for dynamic data:**
```typescript
// ✅ Good - Reactive array
const [items, setItems] = createSignal(['Item 1', 'Item 2'])

For({
  each: items,
  children: (item) => Text(item)
})
```

**Provide stable keys for complex items:**
```typescript
// ✅ Good - Use unique IDs for objects
const [users, setUsers] = createSignal([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])

For({
  each: users,
  children: (user) => Text(user.name),
  key: user => user.id  // Use unique ID as key
})
```

**Handle empty states gracefully:**
```typescript
const [items, setItems] = createSignal([])

VStack({
  children: [
    Show({
      when: () => items().length > 0,
      children: For({
        each: items,
        children: (item) => Text(item)
      }),
      fallback: Text('No items found')
        .modifier
        .fontSize(16)
        .foregroundColor('#666')
        .textAlign('center')
        .build()
    })
  ]
})
```

## Best Practices

### 1. Use Reactive State

```typescript
// ✅ Good - Reactive state
const count = State(0)
Text(() => `Count: ${count.wrappedValue}`)

// ❌ Avoid - Static values that should be dynamic
Text("Count: 0")
```

### 2. Leverage Typography Presets

```typescript
// ✅ Good - Consistent typography
TextStyles.Headline("Section Title")
TextStyles.Body("Content text")

// ❌ Avoid - Manual font sizing
Text("Title").fontSize(22).fontWeight('bold').build()
```

### 3. Use Semantic Button Variants

```typescript
// ✅ Good - Semantic variants
ButtonStyles.Destructive("Delete", handleDelete)
ButtonStyles.Filled("Save", handleSave)

// ❌ Avoid - Manual styling for common patterns
Button("Delete").backgroundColor('red').build()
```

### 4. Handle Loading States

```typescript
// ✅ Good - Loading states
const [isLoading, setIsLoading] = createSignal(false)

Button(() => isLoading() ? "Saving..." : "Save", async () => {
  setIsLoading(true)
  try {
    await save()
  } finally {
    setIsLoading(false)
  }
})
.modifier
.disabled(isLoading)
.build()
```

### 5. Use Proper Accessibility

```typescript
// ✅ Good - Accessible components
Button("Save Document", handleSave)
  .modifier
  .accessibilityLabel("Save the current document")
  .accessibilityHint("Saves your work to the cloud")
  .build()

Image("/profile.jpg")
  .modifier
  .accessibilityLabel("User profile photo")
  .build()
```

## Performance Tips

1. **Use signals for dynamic content** - Only updates when values change
2. **Leverage component composition** - Break complex UIs into smaller components
3. **Use lazy loading for images** - Improves initial page load
4. **Minimize re-renders** - Use computed values for derived state
5. **Optimize large lists** - Use virtual scrolling for performance

## Next Steps

- Learn about [Layout Components](/guide/layout) for organizing your UI
- Explore [State Management](/guide/state-management) for complex app state
- Check out the [API Reference](/api/) for complete component documentation

## Form Components

TachUI provides a comprehensive set of form components for building complex forms with validation, grouping, and interactive controls.

### Form Component

Container for form elements with validation and submission handling.

```typescript
const [formData, setFormData] = createSignal({
  name: '',
  email: '',
  preferences: {}
})

Form({
  onSubmit: (data) => console.log('Form submitted:', data),
  validate: (data) => ({
    isValid: data.name && data.email,
    errors: {}
  })
}, [
  // Form content here
])
  .modifier
  .padding(20)
  .background('white')
  .cornerRadius(12)
  .build()
```

### Section Component

Groups related form elements with optional header and footer.

```typescript
Section({
  title: 'Personal Information',
  footer: 'This information helps us personalize your experience'
}, [
  TextField(nameState, 'Full Name'),
  TextField(emailState, 'Email Address')
])
  .modifier
  .padding(16)
  .background('#f9f9f9')
  .build()
```

### Picker Component

Selection control with multiple variants (dropdown, wheel, segmented).

```typescript
const [selectedCountry, setSelectedCountry] = createSignal('us')

// Dropdown picker
Picker({
  selection: selectedCountry,
  onSelectionChange: setSelectedCountry,
  options: [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' }
  ],
  variant: 'dropdown'
})

// Segmented picker
Picker({
  selection: themeState,
  onSelectionChange: setTheme,
  options: [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' }
  ],
  variant: 'segmented'
})
```

### Slider Component

Range input with customizable formatting and marks.

```typescript
const [volume, setVolume] = createSignal(75)

Slider({
  value: volume,
  onValueChange: setVolume,
  min: 0,
  max: 100,
  step: 1,
  formatter: (value) => `${value}%`,
  marks: [
    { value: 0, label: 'Min' },
    { value: 50, label: 'Mid' },
    { value: 100, label: 'Max' }
  ]
})
  .modifier
  .accentColor('#007AFF')
  .padding(16)
  .build()
```

### Toggle Component

Switch-style boolean control with multiple variants.

```typescript
const [notificationsEnabled, setNotificationsEnabled] = createSignal(true)

// Switch toggle
Toggle({
  isOn: notificationsEnabled,
  onToggle: setNotificationsEnabled,
  label: 'Push Notifications',
  labelPosition: 'leading',
  variant: 'switch'
})

// Checkbox toggle
Toggle({
  isOn: agreeToTerms,
  onToggle: setAgreeToTerms,
  label: 'I agree to the terms and conditions',
  variant: 'checkbox'
})
```

### Complete Form Example

```typescript
const [formData, setFormData] = createSignal({
  name: '',
  email: '',
  country: 'us',
  volume: 50,
  notifications: true
})

Form({
  onSubmit: (data) => {
    console.log('Submitting:', data)
  },
  validateOnSubmit: true
}, [
  Section({ title: 'Personal Information' }, [
    TextField(() => formData().name, (value) => 
      setFormData(prev => ({ ...prev, name: value })), 
      'Full Name'
    ),
    TextField(() => formData().email, (value) => 
      setFormData(prev => ({ ...prev, email: value })), 
      'Email Address'
    ),
    Picker({
      selection: () => formData().country,
      onSelectionChange: (value) => 
        setFormData(prev => ({ ...prev, country: value })),
      options: [
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' }
      ]
    })
  ]),
  
  Section({ title: 'Preferences' }, [
    Slider({
      value: () => formData().volume,
      onValueChange: (value) => 
        setFormData(prev => ({ ...prev, volume: value })),
      min: 0,
      max: 100,
      formatter: (v) => `${v}%`
    }),
    Toggle({
      isOn: () => formData().notifications,
      onToggle: (value) => 
        setFormData(prev => ({ ...prev, notifications: value })),
      label: 'Enable Notifications'
    })
  ])
])
```

### Try the Interactive Demo

See all form components in action: [Forms Demo](https://github.com/whoughton/TachUI/blob/main/apps/examples/forms-demo.html)