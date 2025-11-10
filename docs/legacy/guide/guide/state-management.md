# State Management Guide

TachUI provides SwiftUI-inspired state management with property wrappers, reactive binding, and global state patterns. Build predictable, reactive applications with clean data flow.

## Overview

Import state management from `@tachui/core`:

```typescript
import { 
  State, 
  ObservedObject, 
  EnvironmentObject,
  VStack, HStack, ZStack,
  createBinding,
  createEnvironmentKey,
  type StateWrapper,
  type Binding,
  type ObservableObjectBase
} from '@tachui/core'
```

## @State Property Wrapper

Local component state that automatically triggers UI updates when changed.

✅ **Note**: `State()` works automatically in TachUI component functions through the framework's component context system.

### Basic Usage

```typescript
import { State, VStack, Text, Button } from '@tachui/core'
import type { StateWrapper } from '@tachui/core'

interface CounterComponentProps {
  initialValue?: number
  title?: string
}

function CounterComponent(props: CounterComponentProps = {}): VStack {
  // State() works automatically inside component functions
  const count: StateWrapper<number> = State(props.initialValue ?? 0)
  const message: StateWrapper<string> = State("Hello, TachUI!")
  
  const handleIncrement = (): void => {
    count.wrappedValue += 1
    message.wrappedValue = `Count is now ${count.wrappedValue}`
  }
  
  return VStack({
    children: [
      Text(() => `Count: ${count.wrappedValue}`)
        .modifier
        .fontSize(24)
        .build(),
        
      Text(() => message.wrappedValue)
        .modifier
        .fontSize(16)
        .build(),
        
      Button("Increment", handleIncrement)
    ],
    spacing: 16
  })
}

// ❌ INCORRECT: State() used outside component context
// This will throw: "@State can only be used within a component context"
const globalState = State(0) // DON'T do this!

function BrokenComponent() {
  // This State() call happens outside the TachUI component context
  // and will fail at runtime
  return VStack({ children: [] })
}
```
```

### Component Context Requirement

**Why does State() require a component context?**

TachUI's State system needs to:
1. Track which component owns the state for cleanup
2. Trigger re-renders when state changes
3. Manage the reactive lifecycle properly

Component functions called by TachUI automatically have this context set up:

```typescript
// ✅ These are component functions - context is automatically provided
export function MyComponent() {
  const state = State(0) // Works!
  return VStack({ children: [] })
}

export function AnotherComponent() {
  const state = State('hello') // Works!
  return Text(state.wrappedValue)
}

// ❌ Regular utility functions don't have component context
function calculateSomething() {
  const temp = State(0) // ERROR: No component context!
  return temp.wrappedValue
}

// ✅ Use signals for non-component reactive state
import { createSignal } from '@tachui/core'

function calculateSomething() {
  const [value, setValue] = createSignal(0) // This works anywhere
  return value
}
```

### Component Context Wrapping

**When component functions are called by other components and use State(), you need to wrap them with `withComponentContext`:**

```typescript
import { State, VStack, Text, withComponentContext } from '@tachui/core'
import type { StateWrapper, ComponentInstance } from '@tachui/core'

// ❌ This will fail when called by another component
function BrokenDisplay(): ComponentInstance {
  const isVisible: StateWrapper<boolean> = State(true) // ERROR: No component context!
  return Text(() => isVisible.wrappedValue ? "Visible" : "Hidden")
}

// ✅ Correct approach - wrap component with context
function _Display(): ComponentInstance {
  const isVisible: StateWrapper<boolean> = State(true) // Works!
  
  return VStack({
    children: [
      Text(() => isVisible.wrappedValue ? "Visible" : "Hidden"),
      Button("Toggle", () => {
        isVisible.wrappedValue = !isVisible.wrappedValue
      })
    ]
  })
}

// Export the wrapped version
export const Display = withComponentContext(_Display, 'Display')

// Now this works correctly
function ParentComponent(): ComponentInstance {
  return VStack({
    children: [
      Text("Parent Component"),
      Display() // ✅ Display now has proper component context
    ]
  })
}
```

**Real-world example from Calculator app:**

```typescript
// apps/calculator/src/components/CalculatorDisplay.ts
import { State, VStack, Text, withComponentContext } from '@tachui/core'
import type { StateWrapper, ComponentInstance } from '@tachui/core'

interface CalculatorDisplayProps {
  value: string | (() => string)
  // ... other props
}

// Internal component function that uses State()
function _CalculatorDisplay({ value }: CalculatorDisplayProps): ComponentInstance {
  // This State() call requires component context
  const isHiding: StateWrapper<boolean> = State(true)
  
  return VStack({
    children: [
      // ... component content
      Text(() => isHiding.wrappedValue ? "Hidden" : "Shown")
    ]
  })
}

// Export wrapped with component context 
export const CalculatorDisplay = withComponentContext(_CalculatorDisplay, 'CalculatorDisplay')

// Usage in parent component works correctly:
function CalculatorApp(): ComponentInstance {
  return VStack({
    children: [
      CalculatorDisplay({ value: "123" }) // ✅ Context automatically provided
    ]
  })
}
```

**When to use `withComponentContext`:**
- ✅ Component functions that use `State()` and are called by other components
- ✅ Components that need isolation for state management
- ✅ Reusable components that manage their own local state
- ❌ Don't use for components that only use props and don't need state
- ❌ Don't use for simple utility functions (use `createSignal` instead)

### State Properties

```typescript
// ✅ Inside a component function - context is available
function MyComponent() {
  // Create typed state
  const state: StateWrapper<number> = State(42)
  const textState: StateWrapper<string> = State("initial value")

  // Read current value with type safety
  const currentValue: number = state.wrappedValue
  const currentText: string = textState.wrappedValue

  // Write new value (triggers UI update) with type checking
  state.wrappedValue = 100 // ✅ Valid - number
  // state.wrappedValue = "invalid" // ❌ TypeScript error

  // Get binding for child components with proper typing
  const binding: Binding<number> = state.projectedValue
  const textBinding: Binding<string> = textState.projectedValue
  
  return VStack({ children: [] })
}
```

## @Binding Property Wrapper

Two-way data binding between parent and child components.

### Basic Binding

```typescript
interface ParentComponentProps {
  initialText?: string
}

function ParentComponent(props: ParentComponentProps = {}): VStack {
  const text: StateWrapper<string> = State(props.initialText ?? "Initial text")
  
  return VStack({
    children: [
      Text(() => `Parent: ${text.wrappedValue}`),
      
      // Pass binding to child with proper typing
      ChildEditor({ binding: text.projectedValue })
    ],
    spacing: 16
  })
}

interface ChildEditorProps {
  binding: Binding<string>
  placeholder?: string
}

function ChildEditor(props: ChildEditorProps): VStack {
  const { binding, placeholder = "Edit text" } = props
  
  const handleClear = (): void => {
    binding.set("")
  }
  
  return VStack({
    children: [
      Text(() => `Child: ${binding.get()}`),
      
      TextField(binding, placeholder),
      
      Button("Clear", handleClear)
    ],
    spacing: 12
  })
}
```

### Manual Binding Creation

```typescript
interface CustomData {
  value: string
  isValid: boolean
}

// Type-safe custom binding
const customBinding: Binding<string> = createBinding<string>(
  (): string => getSomeValue(),           // getter with return type
  (newValue: string): void => setSomeValue(newValue)  // setter with parameter type
)

// Generic binding with complex data
const dataBinding: Binding<CustomData> = createBinding<CustomData>(
  (): CustomData => ({ value: "current", isValid: true }),
  (newData: CustomData): void => updateData(newData)
)

TextField(customBinding, "Custom field")
```

## @ObservedObject Property Wrapper

Observe external objects that conform to the observable pattern.

### Creating Observable Objects

```typescript
interface User {
  id: string
  name: string
  email: string
  avatar?: string
  isActive: boolean
  createdAt: Date
}

interface UserStoreState {
  users: User[]
  isLoading: boolean
  error: string | null
  selectedUserId: string | null
}

class UserStore extends ObservableObjectBase {
  private _users: User[] = []
  private _isLoading: boolean = false
  private _error: string | null = null
  private _selectedUserId: string | null = null
  
  // Type-safe getters
  get users(): User[] { return this._users }
  get isLoading(): boolean { return this._isLoading }
  get error(): string | null { return this._error }
  get selectedUser(): User | null {
    return this._selectedUserId 
      ? this._users.find(u => u.id === this._selectedUserId) ?? null
      : null
  }
  
  async loadUsers(): Promise<void> {
    this._isLoading = true
    this._error = null
    this.notifyChange() // Trigger UI update
    
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }
      this._users = await response.json() as User[]
    } catch (error) {
      this._error = error instanceof Error ? error.message : 'Unknown error'
    } finally {
      this._isLoading = false
      this.notifyChange() // Trigger UI update
    }
  }
  
  addUser(user: Omit<User, 'id' | 'createdAt'>): void {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    this._users.push(newUser)
    this.notifyChange()
  }
  
  removeUser(userId: string): boolean {
    const initialLength = this._users.length
    this._users = this._users.filter(u => u.id !== userId)
    if (this._users.length !== initialLength) {
      this.notifyChange()
      return true
    }
    return false
  }
  
  selectUser(userId: string | null): void {
    this._selectedUserId = userId
    this.notifyChange()
  }
}
```

### Using ObservedObject

```typescript
interface UserListComponentProps {
  onUserSelect?: (user: User) => void
  showAddButton?: boolean
}

interface UserCardProps {
  user: User
  onRemove: (userId: string) => void
  onSelect?: (user: User) => void
  isSelected?: boolean
}

function UserListComponent(props: UserListComponentProps = {}): VStack {
  const userStore: UserStore = new UserStore()
  const observedStore = ObservedObject(userStore)
  
  // Load users on component mount
  createEffect(() => {
    observedStore.wrappedValue.loadUsers()
  })
  
  const handleUserRemove = (userId: string): void => {
    const success = observedStore.wrappedValue.removeUser(userId)
    if (!success) {
      console.warn(`Failed to remove user with ID: ${userId}`)
    }
  }
  
  const handleUserSelect = (user: User): void => {
    observedStore.wrappedValue.selectUser(user.id)
    props.onUserSelect?.(user)
  }
  
  const renderUserCard = (user: User, index: number): UserCard => {
    return UserCard({ 
      user,
      onRemove: handleUserRemove,
      onSelect: handleUserSelect,
      isSelected: observedStore.wrappedValue.selectedUser?.id === user.id
    })
  }
  
  return VStack({
    children: [
      // Error state
      () => observedStore.wrappedValue.error ? 
        Text(`Error: ${observedStore.wrappedValue.error}`)
          .modifier
          .foregroundColor('#dc2626')
          .textAlign('center')
          .build() : 
        null,
        
      // Loading state
      () => observedStore.wrappedValue.isLoading ?
        Text("Loading users...")
          .modifier
          .textAlign('center')
          .build() :
        null,
      
      // User list
      List({
        data: observedStore.wrappedValue.users,
        renderItem: renderUserCard
      }),
      
      // Add button
      () => props.showAddButton ? 
        Button("Add User", () => {
          observedStore.wrappedValue.addUser({
            name: "New User",
            email: `user${Date.now()}@example.com`,
            isActive: true
          })
        }) : null
    ],
    spacing: 16
  })
}

function UserCard(props: UserCardProps): HStack {
  const { user, onRemove, onSelect, isSelected = false } = props
  
  const handleRemove = (): void => onRemove(user.id)
  const handleSelect = (): void => onSelect?.(user)
  
  return HStack({
    children: [
      Text(user.name)
        .modifier
        .fontSize(16)
        .fontWeight(isSelected ? 'bold' : 'normal')
        .build(),
        
      Text(user.email)
        .modifier
        .fontSize(14)
        .foregroundColor('#666666')
        .build(),
        
      Button("Remove", handleRemove)
        .modifier
        .backgroundColor('#dc2626')
        .foregroundColor('#ffffff')
        .build()
    ],
    spacing: 12
  })
}
```

## @EnvironmentObject Property Wrapper

Share state across the entire component tree without prop drilling.

### Creating Environment Objects

```typescript
// Define the shape of your environment object with strict typing
interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'es' | 'fr' | 'de' | 'zh'
  fontSize: number
  notifications: boolean
  autoSave: boolean
  maxRetries: number
}

// Default settings with type safety
const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'en',
  fontSize: 16,
  notifications: true,
  autoSave: true,
  maxRetries: 3
} as const

// Create environment key with default value
const AppSettingsKey = createEnvironmentKey<AppSettings>(defaultSettings)

// Type-safe settings validation
interface SettingsUpdatePayload {
  key: keyof AppSettings
  value: AppSettings[keyof AppSettings]
}

// Create the actual settings store with comprehensive TypeScript
class AppSettingsStore extends ObservableObjectBase {
  private _settings: AppSettings = { ...defaultSettings }
  
  // Readonly getter for settings
  get settings(): Readonly<AppSettings> { 
    return { ...this._settings } 
  }
  
  // Type-safe theme updates
  updateTheme(theme: AppSettings['theme']): void {
    if (!(['light', 'dark', 'auto'] as const).includes(theme)) {
      throw new Error(`Invalid theme: ${theme}`)
    }
    this._settings.theme = theme
    this.notifyChange()
  }
  
  // Type-safe language updates
  updateLanguage(language: AppSettings['language']): void {
    if (!(['en', 'es', 'fr', 'de', 'zh'] as const).includes(language)) {
      throw new Error(`Unsupported language: ${language}`)
    }
    this._settings.language = language
    this.notifyChange()
  }
  
  // Type-safe fontSize with validation
  updateFontSize(fontSize: number): void {
    if (fontSize < 10 || fontSize > 32) {
      throw new Error('Font size must be between 10 and 32')
    }
    this._settings.fontSize = fontSize
    this.notifyChange()
  }
  
  // Toggle methods with type safety
  toggleNotifications(): boolean {
    this._settings.notifications = !this._settings.notifications
    this.notifyChange()
    return this._settings.notifications
  }
  
  toggleAutoSave(): boolean {
    this._settings.autoSave = !this._settings.autoSave
    this.notifyChange()
    return this._settings.autoSave
  }
  
  // Bulk update with validation
  updateSettings(updates: Partial<AppSettings>): void {
    const newSettings: AppSettings = { ...this._settings, ...updates }
    
    // Validate all settings
    if (newSettings.fontSize < 10 || newSettings.fontSize > 32) {
      throw new Error('Invalid fontSize in bulk update')
    }
    if (newSettings.maxRetries < 0 || newSettings.maxRetries > 10) {
      throw new Error('Invalid maxRetries in bulk update')
    }
    
    this._settings = newSettings
    this.notifyChange()
  }
  
  // Export settings for persistence
  exportSettings(): string {
    return JSON.stringify(this._settings)
  }
  
  // Import settings with validation
  importSettings(settingsJson: string): void {
    try {
      const imported = JSON.parse(settingsJson) as Partial<AppSettings>
      this.updateSettings(imported)
    } catch (error) {
      throw new Error(`Failed to import settings: ${error}`)
    }
  }
}
```

### Using Environment Objects

```typescript
interface ThemeAwareComponentProps {
  content: string
  className?: string
}

function ThemeAwareComponent(props: ThemeAwareComponentProps): Text {
  const settingsStore = EnvironmentObject<AppSettingsStore>({ 
    key: AppSettingsKey, 
    required: true 
  })
  
  // Type-safe computed values with proper return types
  const theme = (): AppSettings['theme'] => settingsStore.wrappedValue.settings.theme
  const fontSize = (): number => settingsStore.wrappedValue.settings.fontSize
  
  // Computed theme colors with type safety
  const getThemeColors = (): { text: string; background: string } => {
    const currentTheme = theme()
    return {
      text: currentTheme === 'dark' ? '#ffffff' : '#000000',
      background: currentTheme === 'dark' ? '#000000' : '#ffffff'
    }
  }
  
  const colors = getThemeColors()
  
  return Text(props.content)
    .modifier
    .fontSize(fontSize())
    .foregroundColor(colors.text)  
    .backgroundColor(colors.background)
    .build()
}

interface SettingsPanelProps {
  onClose?: () => void
  showAdvanced?: boolean
}

function SettingsPanel(props: SettingsPanelProps = {}): VStack {
  const settingsStore = EnvironmentObject<AppSettingsStore>({ 
    key: AppSettingsKey, 
    required: true 
  })
  
  const handleThemeChange = (newTheme: AppSettings['theme']): void => {
    try {
      settingsStore.wrappedValue.updateTheme(newTheme)
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
  }
  
  const handleFontSizeChange = (event: Event): void => {
    const target = event.target as HTMLInputElement
    const newSize = parseInt(target.value, 10)
    try {
      settingsStore.wrappedValue.updateFontSize(newSize)
    } catch (error) {
      console.error('Failed to update font size:', error)
    }
  }
  
  const currentSettings = settingsStore.wrappedValue.settings
  
  return VStack({
    children: [
      // Theme selector
      HStack({
        children: [
          Text("Theme:"),
          
          Button(
            currentSettings.theme,
            () => {
              const themes: AppSettings['theme'][] = ['light', 'dark', 'auto']
              const currentIndex = themes.indexOf(currentSettings.theme)
              const nextTheme = themes[(currentIndex + 1) % themes.length]
              handleThemeChange(nextTheme)
            }
          )
        ]
      }),
      
      // Font size slider
      HStack({
        children: [
          Text(`Font Size: ${currentSettings.fontSize}px`),
          
          HTML.input({
            type: 'range',
            min: 10,
            max: 32,
            value: currentSettings.fontSize,
            onInput: handleFontSizeChange
          } as HTMLInputElement)
        ]
      }),
      
      // Notifications toggle
      HStack({
        children: [
          Text("Notifications:"),
          
          Button(
            currentSettings.notifications ? "Enabled" : "Disabled",
            () => settingsStore.wrappedValue.toggleNotifications()
          )
            .modifier
            .backgroundColor(currentSettings.notifications ? '#22c55e' : '#6b7280')
            .foregroundColor('#ffffff')
            .build()
        ]
      }),
      
      // Advanced settings (conditional rendering)
      ...(props.showAdvanced ? [
        HStack({
          children: [
            Text("Auto Save:"),
            Button(
              currentSettings.autoSave ? "On" : "Off",
              () => settingsStore.wrappedValue.toggleAutoSave()
            )
          ]
        }),
        
        HStack({
          children: [
            Text(`Max Retries: ${currentSettings.maxRetries}`),
            Button("+", () => {
              if (currentSettings.maxRetries < 10) {
                settingsStore.wrappedValue.updateSettings({
                  maxRetries: currentSettings.maxRetries + 1
                })
              }
            }),
            Button("-", () => {
              if (currentSettings.maxRetries > 0) {
                settingsStore.wrappedValue.updateSettings({
                  maxRetries: currentSettings.maxRetries - 1
                })
              }
            })
          ]
        })
      ] : []),
      
      // Close button
      ...(props.onClose ? [
        Button("Close", props.onClose)
          .modifier
          .backgroundColor('#ef4444')
          .foregroundColor('#ffffff')
          .build()
      ] : [])
    ],
    spacing: 16
  })
}
```

## Best Practices

### 1. Use the Right State Type

```typescript
// ✅ Good - Local UI state with explicit typing
const isExpanded: StateWrapper<boolean> = State(false)
const selectedTab: StateWrapper<'home' | 'profile' | 'settings'> = State('home')

// ✅ Good - Shared business logic with typed class
class DataStore extends ObservableObjectBase {
  private _items: Item[] = []
  
  get items(): readonly Item[] { return this._items }
  
  addItem(item: Omit<Item, 'id'>): void {
    const newItem: Item = { ...item, id: crypto.randomUUID() }
    this._items.push(newItem)
    this.notifyChange()
  }
}
const observedStore = ObservedObject(new DataStore())

// ✅ Good - Global app state with typed environment
const appSettings = EnvironmentObject<AppSettingsStore>({ 
  key: AppSettingsKey,
  required: true 
})
```

### 2. Keep State Minimal

```typescript
interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

// ✅ Good - Store minimal state, compute derived values with proper typing
const todos: StateWrapper<Todo[]> = State([])
const completedCount = createMemo((): number => 
  todos.wrappedValue.filter(t => t.completed).length
)
const highPriorityTodos = createMemo((): Todo[] =>
  todos.wrappedValue.filter(t => t.priority === 'high' && !t.completed)
)

// ❌ Avoid - Storing derived state separately (will get out of sync)
const todos: StateWrapper<Todo[]> = State([])
const completedCount: StateWrapper<number> = State(0) // Will get out of sync
const highPriorityCount: StateWrapper<number> = State(0) // Manual sync required
```

### 3. Use Immutable Updates

```typescript
// ✅ Good - Immutable updates with proper typing
const addTodo = (text: string, priority: Todo['priority'] = 'medium'): void => {
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    priority,
    createdAt: new Date()
  }
  todos.wrappedValue = [...todos.wrappedValue, newTodo]
}

const toggleTodo = (id: string): void => {
  todos.wrappedValue = todos.wrappedValue.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  )
}

const updateTodoPriority = (id: string, priority: Todo['priority']): void => {
  todos.wrappedValue = todos.wrappedValue.map(todo =>
    todo.id === id ? { ...todo, priority } : todo
  )
}

// ❌ Avoid - Mutating existing state (won't trigger updates)
const addTodoIncorrect = (text: string): void => {
  todos.wrappedValue.push({ 
    id: crypto.randomUUID(), 
    text, 
    completed: false,
    priority: 'medium',
    createdAt: new Date()
  }) // Won't trigger updates - direct mutation
}

const toggleTodoIncorrect = (id: string): void => {
  const todo = todos.wrappedValue.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed // Direct mutation - won't trigger updates
  }
}
```

## Troubleshooting

### "State can only be used within a component context" Error

**Error Message:**
```
Uncaught Error: @State can only be used within a component context. 
Make sure you are using @State inside a TachUI component render function.
```

**Most Common Cause:** Component functions that use `State()` are being called by other components without proper context wrapping.

**Quick Fix - Wrap with `withComponentContext`:**

```typescript
import { State, withComponentContext } from '@tachui/core'

// ❌ This causes the error
function MyComponent() {
  const state = State(0) // ERROR: No component context!
  return Text(state.wrappedValue)
}

// ✅ Fix: Wrap the component 
function _MyComponent() {
  const state = State(0) // Works!
  return Text(state.wrappedValue)
}

export const MyComponent = withComponentContext(_MyComponent, 'MyComponent')
```

**Other Common Causes and Solutions:**

1. **Using State() in utility functions:**
   ```typescript
   // ❌ Wrong - State() in utility function
   function createCounter() {
     return State(0) // Error!
   }
   
   // ✅ Right - Use createSignal() instead
   import { createSignal } from '@tachui/core'
   function createCounter() {
     return createSignal(0) // Works everywhere
   }
   ```

2. **Using State() outside component functions:**
   ```typescript
   // ❌ Wrong - Module-level State()
   const globalCount = State(0) // Error!
   
   // ✅ Right - Use signals for global state
   import { createSignal } from '@tachui/core'
   const [globalCount, setGlobalCount] = createSignal(0)
   ```

3. **Calling component functions directly in tests:**
   ```typescript
   // ❌ Wrong - Direct call in tests
   test('component works', () => {
     const result = MyComponent() // Error if MyComponent uses State()
   })
   
   // ✅ Right - Use runWithComponentContext for testing
   import { runWithComponentContext, createComponentContext } from '@tachui/core'
   
   test('component works', () => {
     const context = createComponentContext('test')
     const result = runWithComponentContext(context, () => {
       return MyComponent() // Works!
     })
   })
   ```

### State Not Updating UI

**Problem:** Changing `state.wrappedValue` doesn't update the UI.

**Solution:** Ensure you're using immutable updates for objects and arrays:

```typescript
// ❌ Wrong - Direct mutation
const items = State([{ id: 1, name: 'Item 1' }])
items.wrappedValue[0].name = 'Updated' // Won't trigger update
items.wrappedValue.push({ id: 2, name: 'Item 2' }) // Won't trigger update

// ✅ Right - Immutable updates
items.wrappedValue = items.wrappedValue.map(item => 
  item.id === 1 ? { ...item, name: 'Updated' } : item
)
items.wrappedValue = [...items.wrappedValue, { id: 2, name: 'Item 2' }]
```

### Performance Issues with State

**Problem:** Too many State() calls or complex state objects causing performance issues.

**Solutions:**

1. **Combine related state:**
   ```typescript
   // ❌ Many individual states
   const firstName = State('')
   const lastName = State('')
   const email = State('')
   const phone = State('')
   
   // ✅ Combined state object
   interface UserForm {
     firstName: string
     lastName: string
     email: string
     phone: string
   }
   const userForm = State<UserForm>({
     firstName: '', lastName: '', email: '', phone: ''
   })
   ```

2. **Use computed values for derived state:**
   ```typescript
   // ❌ Redundant state
   const todos = State([])
   const completedTodos = State([]) // Gets out of sync
   
   // ✅ Computed derived state
   const todos = State([])
   const completedTodos = createMemo(() => 
     todos.wrappedValue.filter(t => t.completed)
   )
   ```

## Next Steps

- **[State Reference Guide](/guide/state-reference)** - Comprehensive state management patterns and advanced examples
- [Learn about Signals](/guide/signals) for low-level reactive primitives
- [Explore Computed Values](/guide/computed) for derived state
- [Check out Effects](/guide/effects) for side effects
- [See Navigation](/guide/navigation) for routing patterns