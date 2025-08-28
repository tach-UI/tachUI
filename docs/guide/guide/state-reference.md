# State Management Reference

This comprehensive reference covers advanced state management patterns in TachUI. For a quick overview, see the [State Management Guide](/guide/state-management).

TachUI provides SwiftUI-inspired state management with property wrappers, reactive binding, and global state patterns. Build predictable, reactive applications with clean data flow.

## ⚠️ Component Context Requirement

**All state management functions (`State`, `ObservedObject`, `EnvironmentObject`) require a TachUI component context to function properly.**

This means they can only be called:
- ✅ Inside component functions that are called by TachUI
- ✅ Inside component render functions
- ❌ NOT in utility functions, global scope, or class constructors

```typescript
// ✅ WORKS - Component functions have automatic context
export function MyComponent() {
  const state = State(0) // ✓ Component context available
  return VStack({ children: [] })
}

export function AnotherComponent() {
  const user = ObservedObject(new UserStore()) // ✓ Works here too
  return Text(user.wrappedValue.name)
}

// ❌ FAILS - No component context
const globalState = State(0) // ❌ ERROR!

class MyClass {
  private state = State(0) // ❌ ERROR!
}

function utilityFunction() {
  const temp = State(0) // ❌ ERROR!
  return temp.wrappedValue
}

// ✅ Use signals instead for non-component state
import { createSignal } from '@tachui/core'

const [globalValue, setGlobalValue] = createSignal(0) // ✓ Works anywhere
```

## Overview

Import state management from `@tachui/core`:

```typescript
import { 
  State, 
  ObservedObject, 
  EnvironmentObject,
  VStack, HStack, ZStack,
  createBinding,
  createEnvironmentKey
} from '@tachui/core'
```

## @State Property Wrapper

Local component state that automatically triggers UI updates when changed.

✅ **Note**: `State()` works seamlessly within TachUI component functions through automatic component context management.

### Basic Usage

```typescript
// ✅ CORRECT: State() inside a component function
function CounterComponent() {
  // This works because TachUI provides component context automatically
  const count = State(0)
  const message = State("Hello, TachUI!")
  
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
        
      Button("Increment", () => {
        count.wrappedValue += 1
        message.wrappedValue = `Count is now ${count.wrappedValue}`
      })
    ],
    spacing: 16
  })
}
```

### State with Complex Data

```typescript
function TodoApp() {
  const todos = State([
    { id: '1', text: 'Learn TachUI', completed: false },
    { id: '2', text: 'Build an app', completed: false }
  ])
  
  const addTodo = (text: string) => {
    const newTodo = {
      id: Date.now().toString(),
      text,
      completed: false
    }
    todos.wrappedValue = [...todos.wrappedValue, newTodo]
  }
  
  const toggleTodo = (id: string) => {
    todos.wrappedValue = todos.wrappedValue.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  }
  
  return VStack({
    children: [
      AddTodoForm({ onAdd: addTodo }),
      TodoList({ 
        todos: todos.projectedValue, 
        onToggle: toggleTodo 
      })
    ],
    spacing: 20
  })
}
```

### State Properties

```typescript
// Create state
const state = State(initialValue)

// Read current value
const currentValue = state.wrappedValue

// Write new value (triggers UI update)
state.wrappedValue = newValue

// Get binding for child components  
const binding = state.projectedValue
```

## @Binding Property Wrapper

Two-way data binding between parent and child components.

### Basic Binding

```typescript
function ParentComponent() {
  const text = State("Initial text")
  
  return VStack({
    children: [
      Text(() => `Parent: ${text.wrappedValue}`),
      
      // Pass binding to child
      ChildEditor(text.projectedValue)
    ],
    spacing: 16
  })
}

function ChildEditor(textBinding: Binding<string>) {
  return VStack({
    children: [
      Text(() => `Child: ${textBinding.get()}`),
      
      TextField(textBinding, "Edit text"),
      
      Button("Clear", () => textBinding.set(""))
    ],
    spacing: 12
  })
}
```

### Creating Custom Bindings

```typescript
function CustomSlider({ value, min = 0, max = 100 }) {
  return HTML.input({
    type: 'range',
    min,
    max,
    value: () => value.get(),
    onInput: (e) => value.set(Number(e.target.value))
  })
  .modifier
  .width('100%')
  .build()
}

// Usage
function VolumeControl() {
  const volume = State(50)
  
  return VStack({
    children: [
      Text(() => `Volume: ${volume.wrappedValue}%`),
      CustomSlider({ 
        value: volume.projectedValue,
        min: 0,
        max: 100 
      })
    ]
  })
}
```

### Manual Binding Creation

```typescript
const customBinding = createBinding(
  () => getSomeValue(),       // getter
  (newValue) => setSomeValue(newValue)  // setter
)

TextField(customBinding, "Custom field")
```

## @ObservedObject Property Wrapper

Observe external objects that conform to the observable pattern.

### Creating Observable Objects

```typescript
class UserStore extends ObservableObjectBase {
  private _users: User[] = []
  private _isLoading = false
  
  get users() { return this._users }
  get isLoading() { return this._isLoading }
  
  async loadUsers() {
    this._isLoading = true
    this.notifyChange() // Trigger UI update
    
    try {
      this._users = await fetchUsers()
    } finally {
      this._isLoading = false
      this.notifyChange() // Trigger UI update
    }
  }
  
  addUser(user: User) {
    this._users.push(user)
    this.notifyChange()
  }
  
  removeUser(id: string) {
    this._users = this._users.filter(u => u.id !== id)
    this.notifyChange()
  }
  
  getUserById(id: string) {
    return this._users.find(u => u.id === id)
  }
}
```

### Using ObservedObject

```typescript
function UserListComponent() {
  const userStore = new UserStore()
  const observedStore = ObservedObject(userStore)
  
  // Load users on component mount
  createEffect(() => {
    observedStore.wrappedValue.loadUsers()
  })
  
  return VStack({
    children: [
      // Show loading state
      () => observedStore.wrappedValue.isLoading ?
        Text("Loading users...")
          .modifier
          .textAlign('center')
          .build() :
        null,
      
      // User list
      List({
        data: observedStore.wrappedValue.users,
        renderItem: (user, index) =>
          UserCard({ 
            user,
            onRemove: () => observedStore.wrappedValue.removeUser(user.id)
          }),
        emptyState: EmptyUsersList()
      }),
      
      // Add user button
      Button("Add User", () => {
        const newUser = { id: uuid(), name: "New User", email: "" }
        observedStore.wrappedValue.addUser(newUser)
      })
    ],
    spacing: 16
  })
}
```

### Advanced Observable Patterns

```typescript
class ShoppingCart extends ObservableObjectBase {
  private _items: CartItem[] = []
  
  get items() { return this._items }
  get totalPrice() { 
    return this._items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }
  get itemCount() {
    return this._items.reduce((sum, item) => sum + item.quantity, 0)
  }
  
  addItem(product: Product, quantity = 1) {
    const existingItem = this._items.find(item => item.productId === product.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      this._items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity
      })
    }
    
    this.notifyChange()
  }
  
  updateQuantity(productId: string, quantity: number) {
    const item = this._items.find(item => item.productId === productId)
    if (item) {  
      if (quantity <= 0) {
        this.removeItem(productId)
      } else {
        item.quantity = quantity
        this.notifyChange()
      }
    }
  }
  
  removeItem(productId: string) {
    this._items = this._items.filter(item => item.productId !== productId)
    this.notifyChange()
  }
  
  clear() {
    this._items = []
    this.notifyChange()
  }
}

// Usage in component
function ShoppingCartComponent() {
  const cart = new ShoppingCart()
  const observedCart = ObservedObject(cart)
  
  return VStack({
    children: [
      // Cart summary
      HStack({
        children: [
          Text(() => `Items: ${observedCart.wrappedValue.itemCount}`),
          Text(() => `Total: $${observedCart.wrappedValue.totalPrice.toFixed(2)}`)
        ],
        spacing: 20
      }),
      
      // Cart items
      List({
        data: observedCart.wrappedValue.items,
        renderItem: (item, index) =>
          CartItemRow({ 
            item,
            onUpdateQuantity: (quantity) => 
              observedCart.wrappedValue.updateQuantity(item.productId, quantity),
            onRemove: () => 
              observedCart.wrappedValue.removeItem(item.productId)
          })
      })
    ]
  })
}
```

## @EnvironmentObject Property Wrapper

Share state across the entire component tree without prop drilling.

### Creating Environment Objects

```typescript
// Define the shape of your environment object
interface AppSettings {
  theme: 'light' | 'dark'
  language: string
  fontSize: number
  notifications: boolean
}

// Create environment key
const AppSettingsKey = createEnvironmentKey<AppSettings>({
  theme: 'light',
  language: 'en',
  fontSize: 16,
  notifications: true
})

// Create the actual settings store
class AppSettingsStore extends ObservableObjectBase {
  private _settings: AppSettings = {
    theme: 'light',
    language: 'en', 
    fontSize: 16,
    notifications: true
  }
  
  get settings() { return this._settings }
  
  updateTheme(theme: 'light' | 'dark') {
    this._settings.theme = theme
    this.notifyChange()
  }
  
  updateLanguage(language: string) {
    this._settings.language = language
    this.notifyChange()
  }
  
  updateFontSize(fontSize: number) {
    this._settings.fontSize = fontSize
    this.notifyChange()
  }
  
  toggleNotifications() {
    this._settings.notifications = !this._settings.notifications
    this.notifyChange()
  }
}
```

### Providing Environment Objects

```typescript
function App() {
  // Create the settings store
  const settingsStore = new AppSettingsStore()
  
  // Create environment provider
  const provider = createEnvironmentObjectProvider(AppSettingsKey, settingsStore)
  
  // Provide to the component tree
  provider.provide()
  
  return VStack({
    children: [
      HeaderComponent(),
      MainContentComponent(),
      SettingsComponent()
    ]
  })
}
```

### Using Environment Objects

```typescript
function ThemeAwareComponent() {
  const settingsStore = EnvironmentObject({ 
    key: AppSettingsKey, 
    required: true 
  })
  
  const theme = () => settingsStore.wrappedValue.settings.theme
  const fontSize = () => settingsStore.wrappedValue.settings.fontSize
  
  return Text("Themed content")
    .modifier
    .fontSize(fontSize())
    .foregroundColor(theme() === 'dark' ? '#ffffff' : '#000000')  
    .backgroundColor(theme() === 'dark' ? '#000000' : '#ffffff')
    .build()
}

function SettingsPanel() {
  const settingsStore = EnvironmentObject({ 
    key: AppSettingsKey, 
    required: true 
  })
  
  return VStack({
    children: [
      // Theme toggle
      HStack({
        children: [
          Text("Dark Mode"),
          
          Button(
            () => settingsStore.wrappedValue.settings.theme === 'dark' ? "On" : "Off",
            () => {
              const newTheme = settingsStore.wrappedValue.settings.theme === 'dark' ? 'light' : 'dark'
              settingsStore.wrappedValue.updateTheme(newTheme)
            }
          )
        ]
      }),
      
      // Font size slider
      HStack({
        children: [
          Text("Font Size"),
          
          HTML.input({
            type: 'range',
            min: 12,
            max: 24,
            value: () => settingsStore.wrappedValue.settings.fontSize,
            onInput: (e) => settingsStore.wrappedValue.updateFontSize(Number(e.target.value))
          })
        ]
      }),
      
      // Notifications toggle
      HStack({
        children: [
          Text("Notifications"),
          
          Button(
            () => settingsStore.wrappedValue.settings.notifications ? "Enabled" : "Disabled",
            () => settingsStore.wrappedValue.toggleNotifications()
          )
        ]
      })
    ],
    spacing: 16
  })
}
```

## Advanced State Patterns

### Computed State

Create derived state that automatically updates:

```typescript
function ShoppingApp() {
  const cart = new ShoppingCart()
  const observedCart = ObservedObject(cart)
  
  // Computed values that automatically update
  const subtotal = createMemo(() => 
    observedCart.wrappedValue.totalPrice
  )
  
  const tax = createMemo(() => 
    subtotal() * 0.08
  )
  
  const total = createMemo(() => 
    subtotal() + tax()
  )
  
  return VStack({
    children: [
      CartItems({ cart: observedCart.projectedValue }),
      
      // Order summary with computed values
      VStack({
        children: [
          HStack({
            children: [
              Text("Subtotal:"),
              Text(() => `$${subtotal().toFixed(2)}`)
            ]
          }),
          HStack({
            children: [
              Text("Tax:"),
              Text(() => `$${tax().toFixed(2)}`)
            ]
          }),
          HStack({
            children: [
              Text("Total:")
                .modifier
                .fontWeight('bold')
                .build(),
              Text(() => `$${total().toFixed(2)}`)
                .modifier
                .fontWeight('bold')
                .build()
            ]
          })
        ],
        spacing: 8
      })
    ]
  })
}
```

### State Synchronization

Sync state with external systems:

```typescript
function SyncedComponent() {
  const localData = State([])
  
  // Sync with localStorage
  createEffect(() => {
    const saved = localStorage.getItem('app-data')
    if (saved) {
      localData.wrappedValue = JSON.parse(saved)
    }
  })
  
  // Save to localStorage when state changes
  createEffect(() => {
    localStorage.setItem('app-data', JSON.stringify(localData.wrappedValue))
  })
  
  // Sync with server
  const [isSyncing, setIsSyncing] = createSignal(false)
  
  const syncWithServer = async () => {
    setIsSyncing(true)
    try {
      const serverData = await fetchFromServer()
      localData.wrappedValue = serverData
    } finally {
      setIsSyncing(false)
    }
  }
  
  return VStack({
    children: [
      Button(
        () => isSyncing() ? "Syncing..." : "Sync", 
        syncWithServer
      )
      .modifier
      .disabled(isSyncing)
      .build(),
      
      DataList({ data: localData.projectedValue })
    ]
  })
}
```

### Multi-Store Architecture

Organize complex apps with multiple stores:

```typescript
// User management store
class UserStore extends ObservableObjectBase {
  private _currentUser: User | null = null
  private _isAuthenticated = false
  
  get currentUser() { return this._currentUser }
  get isAuthenticated() { return this._isAuthenticated }
  
  async signIn(email: string, password: string) {
    const user = await authService.signIn(email, password)
    this._currentUser = user
    this._isAuthenticated = true
    this.notifyChange()
  }
  
  signOut() {
    this._currentUser = null
    this._isAuthenticated = false
    this.notifyChange()
  }
}

// Navigation store
class NavigationStore extends ObservableObjectBase {
  private _currentRoute = '/'
  private _history: string[] = ['/']
  
  get currentRoute() { return this._currentRoute }
  get canGoBack() { return this._history.length > 1 }
  
  navigate(route: string) {
    this._history.push(route)
    this._currentRoute = route
    this.notifyChange()
  }
  
  goBack() {
    if (this.canGoBack) {
      this._history.pop()
      this._currentRoute = this._history[this._history.length - 1]
      this.notifyChange()
    }
  }
}

// App-wide store container
class AppStore extends ObservableObjectBase {
  public readonly user = new UserStore()
  public readonly navigation = new NavigationStore()
  public readonly cart = new ShoppingCart()
}

// Environment setup
const AppStoreKey = createEnvironmentKey<AppStore>(new AppStore())

function App() {
  const appStore = new AppStore()
  const provider = createEnvironmentObjectProvider(AppStoreKey, appStore)
  provider.provide()
  
  return AppRouter()
}

// Using stores in components
function HeaderComponent() {
  const appStore = EnvironmentObject({ key: AppStoreKey, required: true })
  const userStore = appStore.wrappedValue.user
  const navStore = appStore.wrappedValue.navigation
  
  return HStack({
    children: [
      Button("← Back", () => navStore.goBack())
        .modifier
        .disabled(!navStore.canGoBack)
        .build(),
        
      Text(() => navStore.currentRoute)
        .modifier
        .frame({ flex: 1 })
        .textAlign('center')
        .build(),
        
      () => userStore.isAuthenticated ?
        Button("Sign Out", () => userStore.signOut()) :
        Button("Sign In", () => navStore.navigate('/signin'))
    ]
  })
}
```

## State Management Best Practices

### 1. Use the Right State Type

```typescript
// ✅ Good - Local UI state
const isExpanded = State(false)

// ✅ Good - Shared business logic
class DataStore extends ObservableObjectBase { ... }
const observedStore = ObservedObject(dataStore)

// ✅ Good - Global app state
const appSettings = EnvironmentObject({ key: SettingsKey })
```

### 2. Keep State Minimal

```typescript
// ✅ Good - Store minimal state, compute derived values
const todos = State([])
const completedCount = createMemo(() => 
  todos.wrappedValue.filter(t => t.completed).length
)

// ❌ Avoid - Storing derived state separately
const todos = State([])
const completedCount = State(0) // Will get out of sync
```

### 3. Use Immutable Updates

```typescript
// ✅ Good - Immutable updates
const addTodo = (text: string) => {
  todos.wrappedValue = [...todos.wrappedValue, { id: uuid(), text, completed: false }]
}

// ❌ Avoid - Mutating existing state
const addTodo = (text: string) => {
  todos.wrappedValue.push({ id: uuid(), text, completed: false }) // Won't trigger updates
}
```

### 4. Organize Complex State

```typescript
// ✅ Good - Organized with clear boundaries
class UserProfileStore extends ObservableObjectBase {
  private _profile: UserProfile | null = null
  private _preferences: UserPreferences = defaultPreferences
  private _isLoading = false
  
  // Clear public interface
  get profile() { return this._profile }
  get preferences() { return this._preferences }
  get isLoading() { return this._isLoading }
  
  // Focused methods
  async loadProfile(id: string) { ... }
  updatePreference(key: string, value: any) { ... }
}
```

### 5. Handle Async Operations

```typescript
// ✅ Good - Clear async state management
class DataStore extends ObservableObjectBase {
  private _data: Item[] = []
  private _isLoading = false
  private _error: string | null = null
  
  get data() { return this._data }
  get isLoading() { return this._isLoading }
  get error() { return this._error }
  
  async loadData() {
    this._isLoading = true
    this._error = null
    this.notifyChange()
    
    try {
      this._data = await fetchData()
    } catch (error) {
      this._error = error.message
    } finally {
      this._isLoading = false
      this.notifyChange()
    }
  }
}
```

## Performance Tips

1. **Use ObservedObject for complex state** - Better than many individual State objects
2. **Minimize Environment Objects** - Only for truly global state
3. **Use createMemo for expensive computations** - Avoids recalculation
4. **Keep state close to where it's used** - Avoid unnecessary re-renders
5. **Use immutable updates** - Ensures proper change detection

## Next Steps

- Learn about [Navigation](/guide/navigation) for routing and screens
- Explore [Components](/guide/components) for UI building blocks
- Check out [Examples](/examples/) for complete app patterns