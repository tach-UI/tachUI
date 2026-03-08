# Event System and Signals Development Guide

This guide covers how to effectively use TachUI's reactive signal system and event handling to create interactive, data-driven components. Understanding these concepts is essential for building responsive user interfaces.

## Signal System Overview

TachUI uses a SolidJS-inspired reactive signal system that provides automatic dependency tracking and efficient updates.

### Core Signal API

```typescript
import { createSignal, createEffect, createComputed } from '@tachui/core'

// Create a signal
const [count, setCount] = createSignal(0)

// Read signal value
console.log(count()) // 0

// Update signal value
setCount(5)
setCount(c => c + 1) // Functional update
```

### Signal Characteristics

- **Reactive**: Changes automatically trigger dependent computations
- **Lazy**: Only compute when accessed
- **Batched**: Multiple updates in the same tick are batched
- **Memory Safe**: Automatic cleanup when no longer referenced

## Creating Reactive Components

### Basic Reactive Text

The most common pattern is reactive text that updates when data changes:

```typescript
// ✅ Correct: Pass function for reactivity
const counterDisplay = Text(() => `Count: ${count()}`)
  .modifier
  .fontSize(18)
  .build()

// ❌ Wrong: Snapshot value, won't update
const counterDisplay = Text(`Count: ${count()}`)
```

**Key Point**: Always pass a **function** to components for reactive content, not the current value.

### Complex Reactive Components

For more complex reactive logic:

```typescript
const [user, setUser] = createSignal(null)
const [loading, setLoading] = createSignal(true)

// Reactive component with conditional logic
const userProfile = Text(() => {
  if (loading()) return 'Loading...'
  if (!user()) return 'No user found'
  return `Welcome, ${user().name}!`
})
  .modifier
  .fontSize(16)
  .foregroundColor(() => loading() ? '#999' : '#000')
  .build()
```

### Reactive Styling

Modifiers can also be reactive:

```typescript
const [isActive, setIsActive] = createSignal(false)

const button = Button('Toggle', () => setIsActive(!isActive()))
  .modifier
  .backgroundColor(() => isActive() ? '#007AFF' : '#ccc')
  .foregroundColor(() => isActive() ? 'white' : 'black')
  .build()
```

## Event Handling Patterns

### Button Event Handling

Buttons accept an action function as the second parameter:

```typescript
// Simple click handler
const incrementButton = Button('Increment', () => {
  setCount(c => c + 1)
})

// Async action handler
const saveButton = Button('Save', async () => {
  try {
    await saveData(formData())
    setStatus('Saved successfully')
  } catch (error) {
    setStatus('Save failed')
  }
})

// Complex event logic
const deleteButton = Button('Delete', () => {
  if (confirm('Are you sure?')) {
    deleteItem(item.id)
    onItemDeleted()
  }
})
```

### Text Field Event Handling

Text fields use the `onTextChange` callback:

```typescript
const [name, setName] = createSignal('')

const nameField = TextField(name(), 'Enter your name', {
  onTextChange: (value: string) => {
    setName(value)
    // Additional validation or side effects
    validateName(value)
  },
  onFocus: () => {
    console.log('Name field focused')
  },
  onBlur: () => {
    console.log('Name field blurred')
  }
})
```

**Important**: Pass the current signal value (`name()`), not the signal itself, to TextField.

### Custom Event Handlers

For custom components, define event props in the component interface:

```typescript
interface CustomButtonProps extends ComponentProps {
  onCustomEvent?: (data: any) => void
  onLongPress?: () => void
}

class CustomButton implements ComponentInstance<CustomButtonProps> {
  render() {
    return h('button', {
      onClick: this.props.onCustomEvent,
      onMouseDown: this.handleMouseDown.bind(this),
      onMouseUp: this.handleMouseUp.bind(this)
    }, /* children */)
  }
  
  private handleMouseDown() {
    this.longPressTimer = setTimeout(() => {
      this.props.onLongPress?.()
    }, 1000)
  }
  
  private handleMouseUp() {
    clearTimeout(this.longPressTimer)
  }
}
```

## State Management Patterns

### Local Component State

For component-specific state:

```typescript
export function Counter() {
  const [count, setCount] = createSignal(0)
  const [step, setStep] = createSignal(1)
  
  return VStack({
    children: [
      Text(() => `Count: ${count()}`),
      
      HStack({
        children: [
          Button('-', () => setCount(c => c - step())),
          Button('+', () => setCount(c => c + step()))
        ]
      }),
      
      TextField(step().toString(), 'Step size', {
        onTextChange: (value) => setStep(parseInt(value) || 1)
      })
    ]
  })
}
```

### Shared State (Global Signals)

For application-wide state:

```typescript
// AppState.ts
export const [user, setUser] = createSignal(null)
export const [tasks, setTasks] = createSignal([])
export const [currentView, setCurrentView] = createSignal('tasks')

// In components
import { user, tasks, setTasks } from './AppState'

const taskList = VStack({
  children: tasks().map(task => 
    TaskItem({ task, onDelete: (id) => setTasks(tasks => tasks.filter(t => t.id !== id)) })
  )
})
```

### Derived State with createComputed

For computed values based on other signals:

```typescript
const [tasks, setTasks] = createSignal([])

// Automatically updates when tasks change
const completedCount = createComputed(() => 
  tasks().filter(task => task.completed).length
)

const progress = createComputed(() => {
  const total = tasks().length
  return total === 0 ? 0 : (completedCount() / total) * 100
})

const progressText = Text(() => `${progress().toFixed(1)}% Complete`)
```

## Side Effects with createEffect

### Data Fetching

```typescript
const [userId, setUserId] = createSignal(null)
const [userData, setUserData] = createSignal(null)
const [loading, setLoading] = createSignal(false)

// Effect runs when userId changes
createEffect(async () => {
  const id = userId()
  if (!id) return
  
  setLoading(true)
  try {
    const data = await fetchUser(id)
    setUserData(data)
  } catch (error) {
    console.error('Failed to fetch user:', error)
  } finally {
    setLoading(false)
  }
})
```

### Local Storage Sync

```typescript
const [preferences, setPreferences] = createSignal({
  theme: 'light',
  language: 'en'
})

// Save to localStorage when preferences change
createEffect(() => {
  localStorage.setItem('preferences', JSON.stringify(preferences()))
})

// Load from localStorage on startup
const savedPrefs = localStorage.getItem('preferences')
if (savedPrefs) {
  setPreferences(JSON.parse(savedPrefs))
}
```

### DOM Side Effects

```typescript
const [isModalOpen, setIsModalOpen] = createSignal(false)

createEffect(() => {
  if (isModalOpen()) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }
})
```

## Event System Internals

### Event Binding Process

1. **Component Render**: Event props are attached to DOM nodes
2. **DOM Creation**: DOM renderer detects event props (starting with 'on')
3. **Event Registration**: `addEventListener` is called on the HTML element
4. **Cleanup**: Event listeners are automatically removed when component unmounts

### Event Prop Detection

The DOM renderer automatically handles props starting with 'on':

```typescript
// In renderer.ts
if (key.startsWith('on') && typeof value === 'function') {
  this.applyEventListener(element, key, value)
}

// Converts onClick -> click event
private applyEventListener(element: Element, eventName: string, handler: Function) {
  const event = eventName.slice(2).toLowerCase() // onClick -> click
  element.addEventListener(event, handler)
}
```

### Supported Events

Common events that work automatically:

- `onClick` → `click`
- `onInput` → `input`
- `onChange` → `change`
- `onFocus` → `focus`
- `onBlur` → `blur`
- `onMouseEnter` → `mouseenter`
- `onMouseLeave` → `mouseleave`
- `onKeyDown` → `keydown`
- `onSubmit` → `submit`

## Common Patterns and Best Practices

### 1. Form Handling

```typescript
function UserForm() {
  const [formData, setFormData] = createSignal({
    name: '',
    email: '',
    age: 0
  })
  
  const [errors, setErrors] = createSignal({})
  
  const updateField = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [field]: null }))
  }
  
  const handleSubmit = async () => {
    const validationErrors = validateForm(formData())
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    try {
      await submitForm(formData())
      setFormData({ name: '', email: '', age: 0 })
    } catch (error) {
      setErrors({ submit: 'Failed to submit form' })
    }
  }
  
  return VStack({
    children: [
      TextField(formData().name, 'Name', {
        onTextChange: updateField('name')
      }),
      
      TextField(formData().email, 'Email', {
        onTextChange: updateField('email')
      }),
      
      TextField(formData().age.toString(), 'Age', {
        onTextChange: updateField('age')
      }),
      
      Button('Submit', handleSubmit)
        .modifier
        .backgroundColor('#007AFF')
        .build()
    ]
  })
}
```

### 2. List Management

```typescript
function TodoList() {
  const [todos, setTodos] = createSignal([])
  const [newTodoText, setNewTodoText] = createSignal('')
  
  const addTodo = () => {
    if (newTodoText().trim()) {
      setTodos(prev => [...prev, {
        id: Date.now(),
        text: newTodoText(),
        completed: false
      }])
      setNewTodoText('')
    }
  }
  
  const toggleTodo = (id: number) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }
  
  const deleteTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }
  
  return VStack({
    children: [
      HStack({
        children: [
          TextField(newTodoText(), 'Add new todo', {
            onTextChange: setNewTodoText
          }),
          Button('Add', addTodo)
        ]
      }),
      
      VStack({
        children: todos().map(todo =>
          TodoItem({
            todo,
            onToggle: () => toggleTodo(todo.id),
            onDelete: () => deleteTodo(todo.id)
          })
        )
      })
    ]
  })
}
```

### 3. Modal Management

```typescript
function App() {
  const [showModal, setShowModal] = createSignal(false)
  const [modalContent, setModalContent] = createSignal('')
  
  const openModal = (content: string) => {
    setModalContent(content)
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setModalContent('')
  }
  
  return VStack({
    children: [
      Button('Open Modal', () => openModal('Hello World!')),
      
      // Conditional rendering
      ...(showModal() ? [
        Modal({
          content: modalContent(),
          onClose: closeModal
        })
      ] : [])
    ]
  })
}
```

## Debugging Reactive Systems

### Common Issues

**Issue**: Component not updating when signal changes
```typescript
// ❌ Wrong: Static snapshot
const text = Text(`Count: ${count()}`)

// ✅ Correct: Reactive function  
const text = Text(() => `Count: ${count()}`)
```

**Issue**: Infinite update loops
```typescript
// ❌ Wrong: Creates infinite loop
createEffect(() => {
  setCount(count() + 1) // Updates count, triggers effect again
})

// ✅ Correct: Use external condition
createEffect(() => {
  if (shouldIncrement()) {
    setCount(c => c + 1)
  }
})
```

**Issue**: Memory leaks from effects
```typescript
// ❌ Wrong: No cleanup
createEffect(() => {
  const timer = setInterval(() => updateTime(), 1000)
  // Timer never cleared
})

// ✅ Correct: Cleanup in component
constructor() {
  const effect = createEffect(() => {
    const timer = setInterval(() => updateTime(), 1000)
    // Return cleanup function or store for later cleanup
  })
  this.cleanup.push(() => effect.dispose())
}
```

### Debugging Tools

1. **Console Logging**: Track signal updates
```typescript
const [count, setCount] = createSignal(0)

createEffect(() => {
  console.log('Count changed to:', count())
})
```

2. **Effect Dependencies**: Understand what triggers updates
```typescript
createEffect(() => {
  console.log('Dependencies:', { count: count(), user: user() })
  // Logic that uses both signals
})
```

3. **Browser DevTools**: Use React DevTools browser extension for signal inspection

## Performance Optimization

### 1. Minimize Signal Access

```typescript
// ❌ Inefficient: Multiple signal calls
const expensiveComputation = () => {
  return processData(data()) + calculateSum(data()) + formatData(data())
}

// ✅ Efficient: Single signal access
const expensiveComputation = () => {
  const currentData = data()
  return processData(currentData) + calculateSum(currentData) + formatData(currentData)
}
```

### 2. Use createComputed for Expensive Calculations

```typescript
// ❌ Inefficient: Recalculated on every access
const processedData = () => expensiveProcessing(rawData())

// ✅ Efficient: Cached with createComputed
const processedData = createComputed(() => expensiveProcessing(rawData()))
```

### 3. Batch Updates

```typescript
import { batch } from '@tachui/core'

// ❌ Inefficient: Multiple separate updates
setName('John')
setAge(30)
setEmail('john@example.com')

// ✅ Efficient: Batched updates
batch(() => {
  setName('John')
  setAge(30)
  setEmail('john@example.com')
})
```

## Conclusion

Effective use of TachUI's signal and event systems enables you to build highly interactive and performant applications. Key takeaways:

1. **Always use functions for reactive content**, not current values
2. **Handle events through component props** (onClick, onTextChange, etc.)
3. **Use createEffect for side effects**, createComputed for derived state
4. **Clean up resources** in component cleanup arrays
5. **Batch updates** when changing multiple signals
6. **Debug systematically** by tracking signal dependencies and updates

Understanding these patterns will help you build robust, maintainable TachUI applications with excellent user experience.