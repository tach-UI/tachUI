# DOM Bridge System

TachUI's DOM bridge is the critical layer that connects your component instances to actual browser DOM elements. This system enables TachUI components to render properly in the browser with full support for modifiers, events, and reactive updates.

## Overview

The DOM bridge system provides four essential capabilities:

1. **Component Mounting** - Mount component trees to DOM containers
2. **Modifier Application** - Apply modifier chains to DOM elements  
3. **Event Handler Binding** - Connect component events to DOM listeners
4. **Recursive Rendering** - Handle nested component children

## Getting Started

### Basic Application Setup

Every TachUI application starts with `mountRoot()`:

```typescript
import { mountRoot } from '@tachui/core'

// Your main application component
const App = createComponent(() => {
  return h('div', { className: 'app' },
    h('h1', null, 'My TachUI App'),
    h('p', null, 'Ready for production!')
  )
})

// Mount to DOM (requires <div id="app"></div> in your HTML)
mountRoot(() => App({}))
```

### HTML Setup

Your HTML file needs a container element:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TachUI App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## Component Mounting

### Single Component

```typescript
const WelcomeMessage = createComponent(() => {
  return Text('Welcome to TachUI!')
    .fontSize(24)
    .foregroundColor('#2563eb')
})

mountRoot(() => WelcomeMessage({}))
```

### Nested Components

The DOM bridge automatically handles component hierarchies:

```typescript
const Header = createComponent(() => 
  Text('Site Header')
    .fontSize(20)
    .fontWeight('bold')
)

const Navigation = createComponent(() =>
  HStack([
    Text('Home').onTap(() => navigate('/home')),
    Text('About').onTap(() => navigate('/about')),
    Text('Contact').onTap(() => navigate('/contact'))
  ]).gap(16)
)

const App = createComponent(() => {
  return VStack([
    Header({}),
    Navigation({}),
    Text('Main content area')
  ]).padding(20)
})

mountRoot(() => App({}))
```

## Modifier Integration

### Style Modifiers

All TachUI modifiers are automatically applied to the underlying DOM elements:

```typescript
const StyledCard = createComponent(() => {
  return VStack([
    Text('Card Title')
      .fontSize(18)
      .fontWeight('bold')
      .foregroundColor('#1f2937'),
    
    Text('Card description with multiple lines of content.')
      .fontSize(14)
      .foregroundColor('#6b7280')
      .lineHeight(1.5)
  ])
    .backgroundColor('#f9fafb')
    .padding(20)
    .cornerRadius(8)
    .border(1, '#e5e7eb')
    .maxWidth(300)
})

mountRoot(() => StyledCard({}))
```

### Layout Modifiers

Layout modifiers create proper CSS layouts:

```typescript
const ResponsiveLayout = createComponent(() => {
  return HStack([
    VStack([
      Text('Sidebar Item 1'),
      Text('Sidebar Item 2'),
      Text('Sidebar Item 3')
    ])
      .width(200)
      .backgroundColor('#f3f4f6')
      .padding(16),
    
    VStack([
      Text('Main Content Area'),
      Text('This area grows to fill available space')
    ])
      .flexGrow(1)
      .padding(20)
  ])
    .height('100vh')
    .gap(0)
})

mountRoot(() => ResponsiveLayout({}))
```

## Event Handling

### Component Events

Events defined on components are automatically bound to DOM listeners:

```typescript
const InteractiveDemo = createComponent(() => {
  const [message, setMessage] = createSignal('Click a button!')
  const [count, setCount] = createSignal(0)
  
  return VStack([
    Text(message)
      .fontSize(16)
      .foregroundColor('#374151'),
    
    Text(() => `Button clicked ${count()} times`)
      .fontSize(14)
      .foregroundColor('#6b7280'),
    
    Button('Click Me!')
      .onTap(() => {
        setCount(c => c + 1)
        setMessage(`Button was clicked!`)
      })
      .backgroundColor('#3b82f6')
      .foregroundColor('white')
      .padding(12, 24)
      .cornerRadius(6)
  ]).gap(12)
})

mountRoot(() => InteractiveDemo({}))
```

### Modifier Events

Events can also be added via modifiers:

```typescript
const HoverableCard = createComponent(() => {
  const [isHovered, setIsHovered] = createSignal(false)
  
  return VStack([
    Text('Hover over this card'),
    Text(() => isHovered() ? 'Hovered!' : 'Not hovered')
  ])
    .padding(20)
    .backgroundColor(() => isHovered() ? '#dbeafe' : '#f9fafb')
    .cornerRadius(8)
    .border(1, '#e5e7eb')
    .onHover((hovered) => setIsHovered(hovered))
    .cursor('pointer')
})

mountRoot(() => HoverableCard({}))
```

## Reactive Updates

### Signal Integration

The DOM bridge maintains live connections between signals and DOM:

```typescript
const ReactiveCounter = createComponent(() => {
  const [count, setCount] = createSignal(0)
  const [color, setColor] = createSignal('#3b82f6')
  
  // Reactive text content
  const counterText = () => `Count: ${count()}`
  
  // Reactive styling
  const buttonColor = () => count() > 10 ? '#ef4444' : color()
  
  return VStack([
    Text(counterText)
      .fontSize(24)
      .fontWeight('bold')
      .foregroundColor(buttonColor),
    
    HStack([
      Button('Increment')
        .onTap(() => setCount(c => c + 1))
        .backgroundColor(buttonColor)
        .foregroundColor('white')
        .padding(8, 16)
        .cornerRadius(4),
      
      Button('Reset')
        .onTap(() => setCount(0))
        .backgroundColor('#6b7280')
        .foregroundColor('white')
        .padding(8, 16)
        .cornerRadius(4),
      
      Button('Change Color')
        .onTap(() => setColor(color() === '#3b82f6' ? '#059669' : '#3b82f6'))
        .backgroundColor('#8b5cf6')
        .foregroundColor('white')
        .padding(8, 16)
        .cornerRadius(4)
    ]).gap(8)
  ]).gap(16)
})

mountRoot(() => ReactiveCounter({}))
```

### Computed Values

Computed values automatically update DOM elements:

```typescript
const ComputedExample = createComponent(() => {
  const [firstName, setFirstName] = createSignal('John')
  const [lastName, setLastName] = createSignal('Doe')
  
  // Computed full name
  const fullName = () => `${firstName()} ${lastName()}`
  const initials = () => `${firstName()[0]}${lastName()[0]}`
  
  return VStack([
    Text(fullName)
      .fontSize(20)
      .fontWeight('bold'),
    
    Text(() => `Initials: ${initials()}`)
      .fontSize(14)
      .foregroundColor('#6b7280'),
    
    HStack([
      TextInput(firstName, setFirstName)
        .placeholder('First name')
        .width(120),
      
      TextInput(lastName, setLastName)
        .placeholder('Last name')
        .width(120)
    ]).gap(8)
  ]).gap(12)
})

mountRoot(() => ComputedExample({}))
```

## Form Handling

### Input Components

Form inputs work seamlessly with the DOM bridge:

```typescript
const ContactForm = createComponent(() => {
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [message, setMessage] = createSignal('')
  const [submitted, setSubmitted] = createSignal(false)
  
  const handleSubmit = () => {
    console.log('Form submitted:', { name: name(), email: email(), message: message() })
    setSubmitted(true)
  }
  
  const isValid = () => name().length > 0 && email().includes('@') && message().length > 0
  
  if (submitted()) {
    return VStack([
      Text('Thank you for your message!')
        .fontSize(18)
        .foregroundColor('#059669'),
      
      Button('Submit Another')
        .onTap(() => {
          setSubmitted(false)
          setName('')
          setEmail('')
          setMessage('')
        })
        .backgroundColor('#3b82f6')
        .foregroundColor('white')
        .padding(8, 16)
        .cornerRadius(4)
    ]).gap(12)
  }
  
  return VStack([
    Text('Contact Form')
      .fontSize(20)
      .fontWeight('bold'),
    
    TextInput(name, setName)
      .placeholder('Your name')
      .width(300),
    
    TextInput(email, setEmail)
      .placeholder('Your email')
      .width(300),
    
    TextArea(message, setMessage)
      .placeholder('Your message')
      .width(300)
      .height(100),
    
    Button('Submit')
      .onTap(handleSubmit)
      .backgroundColor(isValid() ? '#3b82f6' : '#9ca3af')
      .foregroundColor('white')
      .padding(12, 24)
      .cornerRadius(6)
      .disabled(!isValid())
  ]).gap(12)
})

mountRoot(() => ContactForm({}))
```

## Advanced Patterns

### Conditional Rendering

```typescript
const ConditionalDemo = createComponent(() => {
  const [showDetails, setShowDetails] = createSignal(false)
  const [userType, setUserType] = createSignal<'guest' | 'user' | 'admin'>('guest')
  
  return VStack([
    Text('Conditional Rendering Demo')
      .fontSize(18)
      .fontWeight('bold'),
    
    // Simple conditional
    showDetails() ? 
      Text('Here are the details!')
        .fontSize(14)
        .foregroundColor('#059669') :
      null,
    
    // Complex conditional rendering
    (() => {
      switch (userType()) {
        case 'admin':
          return Text('Admin Panel')
            .fontSize(16)
            .foregroundColor('#dc2626')
            .fontWeight('bold')
        case 'user':
          return Text('User Dashboard')
            .fontSize(16)
            .foregroundColor('#3b82f6')
        default:
          return Text('Please log in')
            .fontSize(16)
            .foregroundColor('#6b7280')
      }
    })(),
    
    HStack([
      Button(showDetails() ? 'Hide Details' : 'Show Details')
        .onTap(() => setShowDetails(!showDetails()))
        .backgroundColor('#8b5cf6')
        .foregroundColor('white')
        .padding(8, 16)
        .cornerRadius(4),
      
      Picker(userType, setUserType, [
        { value: 'guest', label: 'Guest' },
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' }
      ])
        .width(120)
    ]).gap(8)
  ]).gap(12)
})

mountRoot(() => ConditionalDemo({}))
```

### Lists and Arrays

```typescript
const TodoList = createComponent(() => {
  const [todos, setTodos] = createSignal([
    { id: 1, text: 'Learn TachUI', completed: false },
    { id: 2, text: 'Build an app', completed: false },
    { id: 3, text: 'Deploy to production', completed: false }
  ])
  const [newTodo, setNewTodo] = createSignal('')
  
  const addTodo = () => {
    if (newTodo().trim()) {
      setTodos(todos => [...todos, {
        id: Date.now(),
        text: newTodo(),
        completed: false
      }])
      setNewTodo('')
    }
  }
  
  const toggleTodo = (id: number) => {
    setTodos(todos => todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }
  
  return VStack([
    Text('Todo List')
      .fontSize(20)
      .fontWeight('bold'),
    
    HStack([
      TextInput(newTodo, setNewTodo)
        .placeholder('Add a new todo')
        .width(250),
      
      Button('Add')
        .onTap(addTodo)
        .backgroundColor('#3b82f6')
        .foregroundColor('white')
        .padding(8, 16)
        .cornerRadius(4)
    ]).gap(8),
    
    VStack(todos().map(todo =>
      HStack([
        Text(todo.text)
          .fontSize(14)
          .foregroundColor(todo.completed ? '#6b7280' : '#374151')
          .textDecoration(todo.completed ? 'line-through' : 'none')
          .flexGrow(1),
        
        Button(todo.completed ? 'Undo' : 'Done')
          .onTap(() => toggleTodo(todo.id))
          .backgroundColor(todo.completed ? '#f59e0b' : '#059669')
          .foregroundColor('white')
          .padding(4, 12)
          .cornerRadius(4)
          .fontSize(12)
      ])
        .gap(8)
        .padding(8)
        .backgroundColor('#f9fafb')
        .cornerRadius(4)
        .border(1, '#e5e7eb')
    )).gap(8)
  ]).gap(16)
})

mountRoot(() => TodoList({}))
```

## Performance Considerations

### Efficient Updates

The DOM bridge only updates parts of the DOM that actually changed:

```typescript
const EfficientUpdates = createComponent(() => {
  const [counter1, setCounter1] = createSignal(0)
  const [counter2, setCounter2] = createSignal(0)
  const [staticText] = createSignal('This never changes')
  
  return VStack([
    // Only updates when counter1 changes
    Text(() => `Counter 1: ${counter1()}`)
      .fontSize(16),
    
    // Only updates when counter2 changes  
    Text(() => `Counter 2: ${counter2()}`)
      .fontSize(16),
    
    // Never updates - completely static
    Text(staticText)
      .fontSize(16),
    
    HStack([
      Button('Increment 1')
        .onTap(() => setCounter1(c => c + 1)),
      
      Button('Increment 2')
        .onTap(() => setCounter2(c => c + 1))
    ]).gap(8)
  ]).gap(8)
})

mountRoot(() => EfficientUpdates({}))
```

### Batched Updates

Multiple signal updates in the same synchronous execution are automatically batched:

```typescript
const BatchedDemo = createComponent(() => {
  const [x, setX] = createSignal(0)
  const [y, setY] = createSignal(0)
  const [color, setColor] = createSignal('#3b82f6')
  
  const updateAll = () => {
    // All three updates happen in a single DOM update
    setX(Math.random() * 100)
    setY(Math.random() * 100)  
    setColor(`hsl(${Math.random() * 360}, 70%, 50%)`)
  }
  
  return VStack([
    Text(() => `Position: (${x().toFixed(1)}, ${y().toFixed(1)})`)
      .fontSize(16)
      .foregroundColor(color),
    
    Button('Update All')
      .onTap(updateAll)
      .backgroundColor(color)
      .foregroundColor('white')
      .padding(8, 16)
      .cornerRadius(4)
  ]).gap(12)
})

mountRoot(() => BatchedDemo({}))
```

## Debugging

### Component Tree Inspection

Use browser developer tools to inspect the component tree:

```typescript
import { DOMBridgeDebug } from '@tachui/core'

// In development, expose debugging utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).TachUIDebug = DOMBridgeDebug
}

// Then in browser console:
// TachUIDebug.getMountedComponents()
// TachUIDebug.validateMounting()
```

### Performance Monitoring

```typescript
import { enablePerformanceTracking } from '@tachui/core'

if (process.env.NODE_ENV === 'development') {
  enablePerformanceTracking()
}
```

## Next Steps

- [Component Guide](/guide/components) - Learn about TachUI components
- [Modifiers](/guide/modifiers) - Master the modifier system
- [State Management](/guide/state-management) - Manage application state
- [Performance](/guide/performance) - Optimize your applications
- [Testing](/guide/testing) - Test TachUI components