# State Management vs Signals: When to Use Each

TachUI provides two powerful reactive systems: SwiftUI-inspired State Management (@State, @Binding, @ObservedObject, @EnvironmentObject) and SolidJS-inspired Signals (createSignal, createEffect, createMemo). This guide helps you understand when to use each approach.

## 🔧 Component Context System

**State Management functions** (`State`, `ObservedObject`, `EnvironmentObject`) work automatically inside TachUI component functions through the framework's component context system.

**Signals** (`createSignal`, `createEffect`, `createMemo`) can be used anywhere - in components, utility functions, or global scope.

```typescript
// ✅ Component functions have automatic context
function MyComponent() {
  const state = State(0)               // ✓ Works in components
  const [signal] = createSignal(0)     // ✓ Works anywhere
  return VStack({ children: [] })
}

// ✅ Signals work everywhere
const [globalSignal] = createSignal(0) // ✓ Works in global scope

function utilityFunction() {
  const [value] = createSignal(0)      // ✓ Works in utility functions
  return value
}
```

## Quick Decision Guide

### Use State Management When:
- ✅ **Inside component functions only**
- Building SwiftUI-style components
- Working with form inputs and UI controls
- Managing component-local state
- Sharing state between parent-child components
- Building class-based data stores
- Managing app-wide settings/configuration

### Use Signals When:
- ✅ **Can use anywhere** (components, utilities, global scope)
- Need fine-grained reactivity control
- Building low-level reactive primitives
- Optimizing performance-critical updates
- Working with computed values
- Managing side effects explicitly
- Building custom reactive patterns

## Understanding the Systems

### State Management (SwiftUI Pattern)
```typescript
import { State, ObservedObject, EnvironmentObject, VStack, Text, Button, type StateWrapper } from '@tachui/core'

// ✅ Component with local state and proper TypeScript types
// State() works because this is a component function
function Counter(): VStack {
  const count: StateWrapper<number> = State(0)  // ✓ Component context provided
  
  const handleIncrement = (): void => {
    count.wrappedValue++
  }
  
  return VStack({
    children: [
      Text(() => `Count: ${count.wrappedValue}`)
        .modifier
        .fontSize(18)
        .build(),
      Button("Increment", handleIncrement)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .build()
    ],
    spacing: 16
  })
}
```

### Signals (SolidJS Pattern)
```typescript
import { createSignal, createEffect, createMemo, VStack, Text, Button, type Signal, type Setter } from '@tachui/core'

// ✅ Component with signal and explicit TypeScript types
// createSignal() works anywhere - no special context required
function Counter(): VStack {
  const [count, setCount]: [Signal<number>, Setter<number>] = createSignal<number>(0)  // ✓ Works anywhere
  
  const handleIncrement = (): void => {
    setCount((prev: number) => prev + 1)
  }
  
  return VStack({
    children: [
      Text(() => `Count: ${count()}`)
        .modifier
        .fontSize(18)
        .build(),
      Button("Increment", handleIncrement)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .build()
    ],
    spacing: 16
  })
}
```

## Key Differences

### 1. API Style

**State Management:**
- Property wrapper pattern from SwiftUI
- Access via `.wrappedValue` property
- Binding through `.projectedValue`
- Class-based for complex objects

**Signals:**
- Function-based API from SolidJS
- Access via function call `signal()`
- Update via setter function
- Functional programming style

### 2. Use Cases

**State Management is Better For:**
```typescript
import { State, Form, TextField, Button, type StateWrapper, type Binding } from '@tachui/core'

interface UserFormData {
  name: string
  email: string
}

// Form inputs with two-way binding and proper TypeScript
function UserForm(): Form {
  const name: StateWrapper<string> = State("")
  const email: StateWrapper<string> = State("")
  
  const handleSubmit = (): void => {
    const formData: UserFormData = {
      name: name.wrappedValue,
      email: email.wrappedValue
    }
    console.log('Submitting form:', formData)
  }
  
  return Form({
    children: [
      TextField(name.projectedValue, "Name")
        .modifier
        .padding(12)
        .border(1, '#ddd')
        .cornerRadius(8)
        .build(),
      TextField(email.projectedValue, "Email")
        .modifier
        .padding(12)
        .border(1, '#ddd')
        .cornerRadius(8)
        .build(),
      Button("Submit", handleSubmit)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12, 24)
        .cornerRadius(8)
        .build()
    ],
    spacing: 16
  })
}

// Observable data stores with full TypeScript
interface Todo {
  id: number
  text: string
  done: boolean
  createdAt: Date
}

class TodoStore extends ObservableObjectBase {
  private _todos: Todo[] = []
  
  get todos(): readonly Todo[] { 
    return [...this._todos] 
  }
  
  addTodo(text: string): void {
    const newTodo: Todo = { 
      id: Date.now(), 
      text, 
      done: false,
      createdAt: new Date()
    }
    this._todos.push(newTodo)
    this.notifyChange()
  }
  
  toggleTodo(id: number): void {
    const todo = this._todos.find(t => t.id === id)
    if (todo) {
      todo.done = !todo.done
      this.notifyChange()
    }
  }
  
  removeTodo(id: number): void {
    this._todos = this._todos.filter(t => t.id !== id)
    this.notifyChange()
  }
}

// App-wide settings with TypeScript
interface ThemeStore {
  theme: 'light' | 'dark' | 'auto'
  accentColor: string
  fontSize: number
}

const defaultTheme: ThemeStore = {
  theme: 'light',
  accentColor: '#007AFF',
  fontSize: 16
}

const ThemeSettings = createEnvironmentKey<ThemeStore>(defaultTheme)
```

**Signals are Better For:**
```typescript
import { createSignal, createMemo, createEffect, type Signal, type Setter } from '@tachui/core'

// Fine-grained updates with explicit types
const [firstName, setFirstName]: [Signal<string>, Setter<string>] = createSignal<string>("John")
const [lastName, setLastName]: [Signal<string>, Setter<string>] = createSignal<string>("Doe")

const fullName: Signal<string> = createMemo((): string => 
  `${firstName()} ${lastName()}`
)

// Complex side effects with proper TypeScript
interface UserData {
  id: string
  name: string
  email: string
  preferences: Record<string, any>
}

const [userData, setUserData]: [Signal<UserData | null>, Setter<UserData | null>] = createSignal<UserData | null>(null)

createEffect((): void => {
  const data: UserData | null = userData()
  if (data) {
    try {
      localStorage.setItem('user', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save user data:', error)
    }
  }
})

// Performance-critical updates with typed interfaces
interface Item {
  id: string
  name: string
  active: boolean
  category: string
  priority: 'low' | 'medium' | 'high'
}

const [items, setItems]: [Signal<Item[]>, Setter<Item[]>] = createSignal<Item[]>([])

const activeItems: Signal<Item[]> = createMemo((): Item[] => 
  items().filter((item: Item) => item.active)
)

const highPriorityItems: Signal<Item[]> = createMemo((): Item[] =>
  activeItems().filter((item: Item) => item.priority === 'high')
)
```

## Working with Dynamic Components

### Show Component
Both systems work seamlessly with Show:

```typescript
import { Show, Text, Button, VStack, State, createSignal, type StateWrapper, type Signal, type Setter } from '@tachui/core'

// With State Management - proper TypeScript
function LoginViewWithState(): VStack {
  const isLoggedIn: StateWrapper<boolean> = State(false)
  
  const handleToggle = (): void => {
    isLoggedIn.wrappedValue = !isLoggedIn.wrappedValue
  }
  
  return VStack({
    children: [
      Show({
        when: (): boolean => isLoggedIn.wrappedValue,
        children: Text("Welcome back!")
          .modifier
          .fontSize(18)
          .foregroundColor('#22c55e')
          .build(),
        fallback: Text("Please log in")
          .modifier
          .fontSize(18)
          .foregroundColor('#ef4444')
          .build()
      }),
      Button("Toggle", handleToggle)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12, 24)
        .cornerRadius(8)
        .build()
    ],
    spacing: 16
  })
}

// With Signals - explicit TypeScript types
function LoginViewWithSignals(): VStack {
  const [isLoggedIn, setIsLoggedIn]: [Signal<boolean>, Setter<boolean>] = createSignal<boolean>(false)
  
  const handleToggle = (): void => {
    setIsLoggedIn((prev: boolean) => !prev)
  }
  
  return VStack({
    children: [
      Show({
        when: isLoggedIn,  // Can pass signal directly
        children: Text("Welcome back!")
          .modifier
          .fontSize(18)
          .foregroundColor('#22c55e')
          .build(),
        fallback: Text("Please log in")
          .modifier
          .fontSize(18)
          .foregroundColor('#ef4444')
          .build()
      }),
      Button("Toggle", handleToggle)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12, 24)
        .cornerRadius(8)
        .build()
    ],
    spacing: 16
  })
}
```

### ForEach Component
Dynamic lists with both approaches:

```typescript
import { ForEach, VStack, Button, State, createSignal, type StateWrapper, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

// Define Todo interface for type safety
interface Todo {
  id: number
  text: string
  done: boolean
  createdAt: Date
}

interface TodoItemProps {
  todo: Todo
}

function TodoItem(props: TodoItemProps): ComponentInstance {
  // Implementation of todo item component
  return Text(props.todo.text)
    .modifier
    .fontSize(16)
    .padding(8)
    .build()
}

// With State Management - full TypeScript
function TodoListWithState(): VStack {
  const todos: StateWrapper<Todo[]> = State<Todo[]>([])
  
  const addTodo = (text: string): void => {
    const newTodo: Todo = {
      id: Date.now(),
      text,
      done: false,
      createdAt: new Date()
    }
    todos.wrappedValue = [...todos.wrappedValue, newTodo]
  }
  
  const handleAddTodo = (): void => {
    addTodo("New Task")
  }
  
  return VStack({
    children: [
      ForEach({
        data: (): Todo[] => todos.wrappedValue,
        children: (todo: Todo): ComponentInstance => TodoItem({ todo }),
        getItemId: (todo: Todo): number => todo.id
      }),
      Button("Add Todo", handleAddTodo)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12, 24)
        .cornerRadius(8)
        .build()
    ],
    spacing: 16
  })
}

// With Signals - explicit TypeScript types
function TodoListWithSignals(): VStack {
  const [todos, setTodos]: [Signal<Todo[]>, Setter<Todo[]>] = createSignal<Todo[]>([])
  
  const addTodo = (text: string): void => {
    const newTodo: Todo = {
      id: Date.now(),
      text,
      done: false,
      createdAt: new Date()
    }
    setTodos((prev: Todo[]) => [...prev, newTodo])
  }
  
  const handleAddTodo = (): void => {
    addTodo("New Task")
  }
  
  return VStack({
    children: [
      ForEach({
        data: todos,  // Can pass signal directly
        children: (todo: Todo): ComponentInstance => TodoItem({ todo }),
        getItemId: (todo: Todo): number => todo.id
      }),
      Button("Add Todo", handleAddTodo)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12, 24)
        .cornerRadius(8)
        .build()
    ],
    spacing: 16
  })
}
```

## Migration Patterns

### Converting State to Signals
```typescript
import { State, createSignal, Text, type StateWrapper, type Signal, type Setter } from '@tachui/core'

// From State Management
const counter: StateWrapper<number> = State(0)
counter.wrappedValue++
Text((): string => `Count: ${counter.wrappedValue}`)

// To Signals
const [counter, setCounter]: [Signal<number>, Setter<number>] = createSignal<number>(0)
setCounter((prev: number) => prev + 1)
Text((): string => `Count: ${counter()}`)
```

### Converting Signals to State
```typescript
import { createSignal, State, TextField, type Signal, type Setter, type StateWrapper } from '@tachui/core'

// From Signals
const [value, setValue]: [Signal<string>, Setter<string>] = createSignal<string>("")
TextField(value, setValue, "Enter text")

// To State Management
const value: StateWrapper<string> = State<string>("")
TextField(value.projectedValue, "Enter text")
```

## Best Practices

### 1. Choose Based on Pattern Consistency
```typescript
import { App, VStack, NavigationView, Show, createSignal, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

// If building SwiftUI-style app, use State Management
function SwiftUIStyleApp(): App {
  return App({
    body: VStack({
      children: [
        NavigationView({
          content: MainView()
        })
      ]
    })
  })
}

// If building SolidJS-style app, use Signals
function SolidStyleApp(): App {
  const [route, setRoute]: [Signal<string>, Setter<string>] = createSignal<string>('home')
  
  return App({
    body: Show({
      when: (): boolean => route() === 'home',
      children: HomeView(),
      fallback: OtherView()
    })
  })
}

function MainView(): ComponentInstance {
  // Implementation
  return VStack({ children: [] })
}

function HomeView(): ComponentInstance {
  // Implementation
  return VStack({ children: [] })
}

function OtherView(): ComponentInstance {
  // Implementation
  return VStack({ children: [] })
}
```

### 2. Mix When Appropriate
```typescript
import { VStack, TextField, Button, Text, State, createSignal, createMemo, type StateWrapper, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

// You can use both in the same component
function HybridComponent(): VStack {
  // UI state with State Management
  const inputValue: StateWrapper<string> = State<string>("")
  
  // Business logic with Signals
  const [items, setItems]: [Signal<string[]>, Setter<string[]>] = createSignal<string[]>([])
  const itemCount: Signal<number> = createMemo((): number => items().length)
  
  const handleAddItem = (): void => {
    if (inputValue.wrappedValue.trim()) {
      setItems((prevItems: string[]) => [...prevItems, inputValue.wrappedValue])
      inputValue.wrappedValue = ""
    }
  }
  
  return VStack({
    children: [
      TextField(inputValue.projectedValue, "Add item")
        .modifier
        .padding(12)
        .border(1, '#ddd')
        .cornerRadius(8)
        .build(),
      Button("Add", handleAddItem)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12, 24)
        .cornerRadius(8)
        .build(),
      Text((): string => `Total items: ${itemCount()}`)
        .modifier
        .fontSize(16)
        .fontWeight('600')
        .foregroundColor('#666')
        .build()
    ],
    spacing: 16
  })
}
```

### 3. Performance Considerations
```typescript
import { State, createSignal, type StateWrapper, type Signal, type Setter } from '@tachui/core'

interface FormData {
  name: string
  email: string
  phone: string
}

// State Management - Good for UI state
const formData: StateWrapper<FormData> = State<FormData>({
  name: "",
  email: "",
  phone: ""
})
// Updates entire object

// Signals - Better for granular updates
const [name, setName]: [Signal<string>, Setter<string>] = createSignal<string>("")
const [email, setEmail]: [Signal<string>, Setter<string>] = createSignal<string>("")
const [phone, setPhone]: [Signal<string>, Setter<string>] = createSignal<string>("")
// Updates only what changes

// Example usage
const updateFormData = (field: keyof FormData, value: string): void => {
  formData.wrappedValue = {
    ...formData.wrappedValue,
    [field]: value
  }
}

const updateName = (value: string): void => {
  setName(value) // Only triggers name-dependent updates
}
```

## Common Patterns

### Form Handling
```typescript
// State Management Approach (Recommended for forms)
function ContactForm(): Form {
  const formState = State({
    name: "",
    email: "",
    message: ""
  })
  
  const handleSubmit = () => {
    console.log("Submitting:", formState.wrappedValue)
  }
  
  return Form({
    onSubmit: handleSubmit,
    children: [
      TextField(
        createBinding(
          () => formState.wrappedValue.name,
          (v) => formState.wrappedValue = {...formState.wrappedValue, name: v}
        ),
        "Name"
      ),
      TextField(
        createBinding(
          () => formState.wrappedValue.email,
          (v) => formState.wrappedValue = {...formState.wrappedValue, email: v}
        ),
        "Email"
      ),
      Button("Submit", handleSubmit)
    ]
  })
}
```

### Computed Values
```typescript
// Signals Approach (Recommended for computed values)
function ShoppingCart(): VStack {
  const [items, setItems] = createSignal<CartItem[]>([])
  
  const subtotal = createMemo(() => 
    items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  
  const tax = createMemo(() => subtotal() * 0.08)
  const total = createMemo(() => subtotal() + tax())
  
  return VStack({
    children: [
      ForEach({
        data: items,
        children: (item) => CartItemView({ item })
      }),
      Text(() => `Subtotal: $${subtotal().toFixed(2)}`),
      Text(() => `Tax: $${tax().toFixed(2)}`),
      Text(() => `Total: $${total().toFixed(2)}`)
    ]
  })
}
```

### Global State
```typescript
// State Management Approach (Recommended for app-wide state)
class AppStateStore extends ObservableObjectBase {
  private _user: User | null = null
  private _theme: Theme = 'light'
  
  get user() { return this._user }
  get theme() { return this._theme }
  
  login(user: User) {
    this._user = user
    this.notifyChange()
  }
  
  setTheme(theme: Theme) {
    this._theme = theme
    this.notifyChange()
  }
}

// Use with EnvironmentObject
const AppStateKey = createEnvironmentKey<AppStateStore>(new AppStateStore())
```

## Summary

### Use State Management for:
- SwiftUI-style components
- Form inputs and controls
- Class-based data models
- Parent-child data sharing
- App-wide configuration

### Use Signals for:
- Fine-grained reactivity
- Computed/derived values
- Complex side effects
- Performance optimization
- Functional programming patterns

### Can Use Either for:
- Component local state
- Dynamic rendering (Show, ForEach)
- Event handling
- Basic reactivity

The choice often comes down to your app's architecture and personal preference. Both systems are fully supported and can be mixed within the same application.

## Related Documentation

- [State Management Guide](/guide/state-management) - Deep dive into State Management
- [Signals Guide](/guide/signals) - Understanding reactive signals
- [Components Guide](/guide/components) - Using components with both systems
- [Effects Guide](/guide/effects) - Managing side effects