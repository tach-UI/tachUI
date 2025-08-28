# Show Component

The Show component provides reactive conditional rendering based on a boolean condition, similar to SwiftUI's conditional view modifiers.

## Signature

```typescript
interface ShowProps {
  when: boolean | (() => boolean) | Signal<boolean> | ComputedValue<boolean>
  children: ComponentInstance
  fallback?: ComponentInstance
}

function Show(props: ShowProps): ComponentInstance
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `when` | `boolean \| (() => boolean) \| Signal<boolean> \| ComputedValue<boolean>` | Condition for showing content |
| `children` | `ComponentInstance` | Content to show when condition is true |
| `fallback` | `ComponentInstance` | Optional content to show when condition is false |

## Basic Usage

### With Static Boolean

```typescript
import { Show, Text } from '@tachui/core'

Show({
  when: true,
  children: Text("Always visible"),
  fallback: Text("Never shown")
})
```

### With Signals

```typescript
import { Show, Text, Button, VStack, createSignal, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

function ConditionalView(): VStack {
  const [isVisible, setIsVisible]: [Signal<boolean>, Setter<boolean>] = createSignal<boolean>(false)
  
  const handleToggle = (): void => {
    setIsVisible((prev: boolean) => !prev)
  }
  
  const getButtonText = (): string => {
    return isVisible() ? "Hide" : "Show"
  }
  
  return VStack({
    children: [
      Show({
        when: isVisible,  // Pass signal directly
        children: Text("Now you see me!")
          .modifier
          .fontSize(18)
          .foregroundColor('#007AFF')
          .build(),
        fallback: Text("Now you don't!")
          .modifier
          .fontSize(18)
          .foregroundColor('#999')
          .build()
      }),
      
      Button(getButtonText, handleToggle)
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

### With State Management

```typescript
import { Show, Text, Button, VStack, State, type StateWrapper, type ComponentInstance } from '@tachui/core'

function ConditionalView(): VStack {
  const isVisible: StateWrapper<boolean> = State<boolean>(false)
  
  const handleToggle = (): void => {
    isVisible.wrappedValue = !isVisible.wrappedValue
  }
  
  const getButtonText = (): string => {
    return isVisible.wrappedValue ? "Hide" : "Show"
  }
  
  return VStack({
    children: [
      Show({
        when: (): boolean => isVisible.wrappedValue,  // Function wrapper needed
        children: Text("State-managed visibility")
          .modifier
          .fontSize(18)
          .foregroundColor('#22c55e')
          .build(),
        fallback: Text("Hidden state")
          .modifier
          .fontSize(18)
          .foregroundColor('#ef4444')
          .build()
      }),
      
      Button(getButtonText, handleToggle)
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

## Advanced Usage

### Complex Conditions

```typescript
import { Show, Text, VStack, createSignal, createMemo, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

function UserProfile(): VStack {
  const [user, setUser]: [Signal<User | null>, Setter<User | null>] = createSignal<User | null>(null)
  const [loading, setLoading]: [Signal<boolean>, Setter<boolean>] = createSignal<boolean>(false)
  
  // Computed condition with explicit typing
  const showProfile: Signal<boolean> = createMemo((): boolean => 
    !loading() && user() !== null
  )
  
  const getUserName = (): string => {
    const currentUser = user()
    return currentUser ? currentUser.name : ""
  }
  
  const getUserEmail = (): string => {
    const currentUser = user()
    return currentUser ? currentUser.email : ""
  }
  
  return VStack({
    children: [
      Show({
        when: showProfile,
        children: VStack({
          children: [
            Text((): string => `Welcome, ${getUserName()}!`)
              .modifier
              .fontSize(24)
              .fontWeight('bold')
              .foregroundColor('#1a1a1a')
              .build(),
            Text((): string => getUserEmail())
              .modifier
              .fontSize(16)
              .foregroundColor('#666')
              .build()
          ],
          spacing: 8,
          alignment: 'center'
        }),
        fallback: Show({
          when: loading,
          children: Text("Loading...")
            .modifier
            .fontSize(16)
            .foregroundColor('#999')
            .textAlign('center')
            .build(),
          fallback: Text("Please log in")
            .modifier
            .fontSize(16)
            .foregroundColor('#FF3B30')
            .textAlign('center')
            .build()
        })
      })
    ],
    spacing: 16
  })
}
```

### Nested Conditions

```typescript
function PermissionGate(): ComponentInstance {
  const [user, setUser] = createSignal<User | null>(null)
  const [permissions, setPermissions] = createSignal<string[]>([])
  
  return Show({
    when: () => user() !== null,
    children: Show({
      when: () => permissions().includes('admin'),
      children: AdminPanel(),
      fallback: Show({
        when: () => permissions().includes('user'),
        children: UserPanel(),
        fallback: Text("Insufficient permissions")
      })
    }),
    fallback: LoginForm()
  })
}
```

### With Authentication

```typescript
interface AuthenticatedViewProps {
  children: ComponentInstance
  loginPrompt?: ComponentInstance
}

function AuthenticatedView(props: AuthenticatedViewProps): ComponentInstance {
  const auth = EnvironmentObject<AuthStore>({ key: AuthKey, required: true })
  
  return Show({
    when: () => auth.wrappedValue.isAuthenticated,
    children: props.children,
    fallback: props.loginPrompt || Text("Please log in to continue")
  })
}

// Usage
AuthenticatedView({
  children: DashboardView(),
  loginPrompt: VStack({
    children: [
      Text("Access Restricted")
        .modifier
        .fontSize(20)
        .fontWeight('bold')
        .build(),
      Button("Sign In", () => showLoginModal())
    ]
  })
})
```

## Performance Characteristics

### Reactive Updates

The Show component automatically tracks dependencies and only re-evaluates when the condition changes:

```typescript
const [count, setCount] = createSignal(0)
const [threshold, setThreshold] = createSignal(10)

// This only re-evaluates when count or threshold changes
Show({
  when: () => count() > threshold(),
  children: Text(() => `Count ${count()} exceeds ${threshold()}`),
  fallback: Text(() => `Count ${count()} is within limit`)
})
```

### Lazy Evaluation

Children are only rendered when the condition is true:

```typescript
Show({
  when: () => expensiveCondition(),
  children: ExpensiveComponent(),  // Only created when needed
  fallback: SimpleComponent()
})
```

## Type Safety

The Show component provides full TypeScript support:

```typescript
// Type inference works with complex conditions
const [status, setStatus] = createSignal<'loading' | 'success' | 'error'>('loading')

Show({
  when: () => status() === 'success',
  children: SuccessView(),
  fallback: Show({
    when: () => status() === 'error',
    children: ErrorView(),
    fallback: LoadingView()
  })
})
```

## Best Practices

### 1. Use Reactive Conditions

```typescript
// ✅ Good - Reactive condition
const [isEnabled, setIsEnabled] = createSignal(false)
Show({
  when: isEnabled,
  children: EnabledContent()
})

// ❌ Avoid - Static condition (won't update)
Show({
  when: false,
  children: SomeContent()
})
```

### 2. Provide Meaningful Fallbacks

```typescript
// ✅ Good - Clear fallback content
Show({
  when: () => data() !== null,
  children: DataView({ data: data()! }),
  fallback: Text("No data available")
    .modifier
    .textAlign('center')
    .foregroundColor('#999')
    .build()
})

// ❌ Avoid - No fallback for important states
Show({
  when: () => data() !== null,
  children: DataView({ data: data()! })
  // Missing fallback - shows nothing when data is null
})
```

### 3. Keep Conditions Simple

```typescript
// ✅ Good - Simple, readable condition
const canEdit = createMemo(() => user() && user()!.permissions.includes('edit'))
Show({
  when: canEdit,
  children: EditButton()
})

// ❌ Avoid - Complex inline conditions
Show({
  when: () => user() && user()!.permissions.includes('edit') && !readonly() && hasChanges(),
  children: EditButton()
})
```

### 4. Use Computed Values for Complex Logic

```typescript
// ✅ Good - Computed condition with descriptive name
const shouldShowUpgrade = createMemo(() => {
  const u = user()
  return u && u.plan === 'free' && u.usage > u.limits.requests * 0.8
})

Show({
  when: shouldShowUpgrade,
  children: UpgradePrompt()
})
```

## Common Patterns

### Loading States

```typescript
function DataView(): ComponentInstance {
  const [data, setData] = createSignal(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal(null)
  
  return Show({
    when: () => !loading(),
    children: Show({
      when: () => error() === null,
      children: Show({
        when: () => data() !== null,
        children: DataDisplay({ data: data()! }),
        fallback: Text("No data found")
      }),
      fallback: ErrorDisplay({ error: error()! })
    }),
    fallback: LoadingSpinner()
  })
}
```

### Feature Flags

```typescript
function FeatureToggle({ feature, children }: { feature: string, children: ComponentInstance }): ComponentInstance {
  const flags = EnvironmentObject<FeatureFlags>({ key: FeatureFlagsKey })
  
  return Show({
    when: () => flags.wrappedValue.isEnabled(feature),
    children: children
  })
}

// Usage
FeatureToggle({
  feature: 'beta-dashboard',
  children: BetaDashboard()
})
```

### Responsive Design

```typescript
function ResponsiveLayout(): ComponentInstance {
  const [screenWidth, setScreenWidth] = createSignal(window.innerWidth)
  
  // Update on resize
  createEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  })
  
  return Show({
    when: () => screenWidth() >= 768,
    children: DesktopLayout(),
    fallback: MobileLayout()
  })
}
```

## Common Mistakes

### ❌ Passing Arrays Instead of Single Components

```typescript
// ❌ Wrong - Show expects single components, not arrays
Show({
  when: condition,
  children: [  // ERROR: Array not allowed
    Text("Hello"),
    Text("World")
  ],
  fallback: [  // ERROR: Array not allowed
    Text("Fallback")
  ]
})

// ✅ Correct - Pass single components
Show({
  when: condition,
  children: VStack({  // Wrap multiple components in a container
    children: [
      Text("Hello"),
      Text("World")
    ]
  }),
  fallback: Text("Fallback")
})

// ✅ Also correct - Single component
Show({
  when: condition,
  children: Text("Hello"),
  fallback: Text("Fallback")
})
```

### ❌ Using Functions That Return Arrays

```typescript
// ❌ Wrong - Function returning array
Show({
  when: condition,
  children: () => [  // ERROR: Function returns array
    SomeComponent()
  ]
})

// ✅ Correct - Function returning single component or direct component
Show({
  when: condition,
  children: SomeComponent()  // Direct component
})
```

### ❌ Incorrect State Usage

```typescript
// ❌ Wrong - Using State wrapper object directly
const isVisible = State(true)
Show({
  when: isVisible,  // ERROR: Should use wrappedValue or function
  children: Content()
})

// ✅ Correct - Use function to access State value
Show({
  when: () => isVisible.wrappedValue,
  children: Content()
})
```

## Migration from Other Frameworks

### From React

```typescript
// React
{isVisible && <Content />}
{isVisible ? <Content /> : <Fallback />}

// TachUI
Show({
  when: isVisible,
  children: Content()
})

Show({
  when: isVisible,
  children: Content(),
  fallback: Fallback()
})
```

### From Vue

```typescript
// Vue
<Content v-if="isVisible" />
<Fallback v-else />

// TachUI
Show({
  when: isVisible,
  children: Content(),
  fallback: Fallback()
})
```

## See Also

- **[ForEach Component](/components/foreach)** - Rendering lists of items
- **[For Component](/components/for)** - SolidJS-style list rendering
- **[State Management Guide](/guide/state-management)** - Managing component state
- **[Signals Guide](/guide/signals)** - Understanding reactive signals