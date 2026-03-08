# ForEach Component

The ForEach component efficiently renders lists of items with automatic updates when the data changes. It's the primary way to render dynamic lists in TachUI.

## Signature

```typescript
interface ForEachProps<T = any> {
  data: T[] | Signal<T[]>
  children: (item: T, index: number) => ComponentInstance | ComponentInstance[]
  getItemId?: (item: T, index: number) => string | number
  key?: string | number
  ref?: ComponentRef
}

function ForEach<T>(props: ForEachProps<T>): ComponentInstance
// Also exported as ForEachComponent
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `T[] \| Signal<T[]>` | Array or reactive signal containing items to render |
| `children` | `(item: T, index: number) => ComponentInstance \| ComponentInstance[]` | Function that renders each item |
| `getItemId` | `(item: T, index: number) => string \| number` | Optional function to provide unique keys for efficient updates |
| `key` | `string \| number` | Component key for React-style reconciliation |
| `ref` | `ComponentRef` | Reference to the component instance |

## Basic Usage

### With Arrays

```typescript
import { ForEach, Text } from '@tachui/core'

const fruits = ['Apple', 'Banana', 'Orange']

ForEach({
  data: fruits,
  children: (fruit, index) => 
    Text(`${index + 1}. ${fruit}`)
      .modifier
      .fontSize(16)
      .padding(8)
      .build()
})
```

### With Signals

```typescript
import { ForEach, Text, Button, VStack, createSignal, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

function DynamicList(): VStack {
  const [items, setItems]: [Signal<string[]>, Setter<string[]>] = createSignal<string[]>(['First', 'Second'])
  
  const addItem = (): void => {
    setItems((prevItems: string[]) => [...prevItems, `Item ${prevItems.length + 1}`])
  }
  
  return VStack({
    children: [
      ForEach({
        data: items,  // Pass signal directly
        children: (item: string, index: number): ComponentInstance => 
          Text(`${index + 1}. ${item}`)
            .modifier
            .fontSize(16)
            .padding(8)
            .backgroundColor(index % 2 === 0 ? '#f5f5f5' : 'white')
            .cornerRadius(4)
            .build()
      }),
      
      Button("Add Item", addItem)
        .modifier
        .marginTop(16)
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12, 24)
        .cornerRadius(8)
        .build()
    ],
    spacing: 8
  })
}
```

### With State Management

```typescript
import { ForEach, Text, VStack, State, type StateWrapper, type ComponentInstance } from '@tachui/core'

function StateList(): VStack {
  const items: StateWrapper<string[]> = State<string[]>(['Task 1', 'Task 2', 'Task 3'])
  
  return VStack({
    children: [
      ForEach({
        data: (): string[] => items.wrappedValue,  // Function wrapper needed
        children: (item: string, index: number): ComponentInstance => 
          Text(`${index + 1}. ${item}`)
            .modifier
            .fontSize(16)
            .padding(8)
            .backgroundColor('#f8f9fa')
            .cornerRadius(4)
            .build()
      })
    ],
    spacing: 8
  })
}
```

## Working with Objects

### Simple Objects

```typescript
import { ForEach, VStack, Text, createSignal, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

function UserList(): VStack {
  const [users, setUsers]: [Signal<User[]>, Setter<User[]>] = createSignal<User[]>([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user' }
  ])

  return VStack({
    children: [
      ForEach({
        data: users,
        children: (user: User): ComponentInstance => 
          VStack({
            children: [
              Text(user.name)
                .modifier
                .fontSize(18)
                .fontWeight('bold')
                .foregroundColor('#1a1a1a')
                .build(),
              Text(user.email)
                .modifier
                .fontSize(14)
                .foregroundColor('#666')
                .build(),
              Text(user.role.toUpperCase())
                .modifier
                .fontSize(12)
                .fontWeight('600')
                .foregroundColor('#007AFF')
                .backgroundColor('#f0f8ff')
                .padding(4, 8)
                .cornerRadius(4)
                .build()
            ],
            spacing: 4
          })
            .modifier
            .padding(16)
            .backgroundColor('#ffffff')
            .cornerRadius(8)
            .shadow({ x: 0, y: 1, radius: 3, color: 'rgba(0,0,0,0.1)' })
            .build(),
        getItemId: (user: User): number => user.id  // Essential for efficient updates
      })
    ],
    spacing: 12
  })
}
```

### Complex Objects with Interactions

```typescript
interface Todo {
  id: number
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

function TodoList(): VStack {
  const [todos, setTodos] = createSignal<Todo[]>([])
  
  const toggleTodo = (id: number) => {
    setTodos(todos().map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    ))
  }
  
  const removeTodo = (id: number) => {
    setTodos(todos().filter(todo => todo.id !== id))
  }
  
  const getPriorityColor = (priority: Todo['priority']): string => {
    switch (priority) {
      case 'high': return '#FF3B30'
      case 'medium': return '#FF9500'
      case 'low': return '#34C759'
    }
  }
  
  return VStack({
    children: [
      ForEach({
        data: todos,
        children: (todo) => 
          HStack({
            children: [
              // Checkbox
              Button(
                todo.completed ? "☑" : "☐",
                () => toggleTodo(todo.id)
              )
                .modifier
                .fontSize(18)
                .padding(4)
                .build(),
              
              // Todo text
              Text(todo.text)
                .modifier
                .fontSize(16)
                .textDecoration(todo.completed ? 'line-through' : 'none')
                .foregroundColor(todo.completed ? '#999' : '#000')
                .flexGrow(1)
                .build(),
              
              // Priority indicator
              Text(todo.priority.toUpperCase())
                .modifier
                .fontSize(12)
                .fontWeight('bold')
                .foregroundColor(getPriorityColor(todo.priority))
                .padding(4, 8)
                .backgroundColor(getPriorityColor(todo.priority) + '20')
                .cornerRadius(4)
                .build(),
              
              // Remove button
              Button("×", () => removeTodo(todo.id))
                .modifier
                .fontSize(18)
                .foregroundColor('#FF3B30')
                .padding(4)
                .build()
            ],
            spacing: 12,
            alignment: 'center'
          })
            .modifier
            .padding(12)
            .backgroundColor('#ffffff')
            .cornerRadius(8)
            .shadow({ x: 0, y: 1, radius: 3, color: 'rgba(0,0,0,0.1)' })
            .marginBottom(8)
            .build(),
        getItemId: (todo) => todo.id
      })
    ]
  })
}
```

## Advanced Usage

### Computed Lists

```typescript
function FilteredTodoList(): VStack {
  const [todos, setTodos] = createSignal<Todo[]>([])
  const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = createSignal('')
  
  // Computed filtered list
  const filteredTodos = createMemo(() => {
    let filtered = todos()
    
    // Apply status filter
    if (filter() === 'active') {
      filtered = filtered.filter(todo => !todo.completed)
    } else if (filter() === 'completed') {
      filtered = filtered.filter(todo => todo.completed)
    }
    
    // Apply search filter
    const term = searchTerm().toLowerCase()
    if (term) {
      filtered = filtered.filter(todo => 
        todo.text.toLowerCase().includes(term)
      )
    }
    
    return filtered
  })
  
  return VStack({
    children: [
      // Filter controls
      HStack({
        children: [
          TextField(searchTerm, setSearchTerm, "Search todos..."),
          
          Picker({
            selection: filter,
            onSelectionChange: setFilter,
            options: [
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' }
            ]
          })
        ]
      }),
      
      // Filtered list
      Text(() => `Showing ${filteredTodos().length} of ${todos().length} todos`),
      
      ForEach({
        data: filteredTodos,  // Use computed signal
        children: (todo) => TodoItemView({ todo }),
        getItemId: (todo) => todo.id
      })
    ]
  })
}
```

### Nested Lists

```typescript
interface Category {
  id: string
  name: string
  items: Item[]
}

function CategorizedList(): VStack {
  const [categories, setCategories] = createSignal<Category[]>([])
  
  return ForEach({
    data: categories,
    children: (category) => 
      VStack({
        children: [
          Text(category.name)
            .modifier
            .fontSize(20)
            .fontWeight('bold')
            .marginBottom(8)
            .build(),
          
          ForEach({
            data: category.items,
            children: (item) => ItemView({ item }),
            getItemId: (item) => item.id
          })
        ]
      }),
    getItemId: (category) => category.id
  })
}
```

### Virtualized Lists (Large Data)

For large datasets, use the List component which provides virtual scrolling:

```typescript
import { List } from '@tachui/core'

function LargeDataList(): ComponentInstance {
  const [items, setItems] = createSignal<Item[]>(generateLargeDataset())
  
  return List({
    data: items,
    renderItem: (item, index) => 
      ItemView({ item }),
    virtualScrolling: {
      enabled: true,
      itemHeight: 60,
      overscan: 5
    },
    getItemId: (item) => item.id
  })
}
```

## Performance Optimization

### Always Use getItemId for Objects

```typescript
// ✅ Good - Efficient updates with unique keys
ForEach({
  data: users,
  children: (user) => UserCard({ user }),
  getItemId: (user) => user.id
})

// ❌ Avoid - Poor performance without keys
ForEach({
  data: users,
  children: (user) => UserCard({ user })
  // Missing getItemId - will recreate all items on changes
})
```

### Stable Item IDs

```typescript
// ✅ Good - Stable, unique IDs
const todos = [
  { id: 'todo-1', text: 'Learn TachUI' },
  { id: 'todo-2', text: 'Build app' }
]

// ❌ Avoid - Unstable IDs based on index
ForEach({
  data: items,
  children: (item, index) => ItemView({ item }),
  getItemId: (item, index) => index  // Index changes when items are reordered
})
```

### Minimize Re-renders

```typescript
// ✅ Good - Stable child functions
const renderTodo = (todo: Todo) => TodoView({ todo })

ForEach({
  data: todos,
  children: renderTodo,  // Function reference doesn't change
  getItemId: (todo) => todo.id
})

// ❌ Avoid - New function on every render
ForEach({
  data: todos,
  children: (todo) => TodoView({ todo }),  // New function every time
  getItemId: (todo) => todo.id
})
```

## Type Safety

### Generic Type Support

```typescript
// Type inference works automatically
const [numbers, setNumbers] = createSignal([1, 2, 3, 4, 5])

ForEach({
  data: numbers,
  children: (num) => {  // num is inferred as number
    return Text(num.toString())
  }
})

// Explicit type annotation
ForEach<User>({
  data: users,
  children: (user: User) => UserCard({ user }),
  getItemId: (user: User) => user.id
})
```

### Complex Type Constraints

```typescript
interface ListItem {
  id: string
  displayName: string
}

interface User extends ListItem {
  email: string
  role: 'admin' | 'user'
}

interface Product extends ListItem {
  price: number
  category: string
}

function GenericList<T extends ListItem>({ 
  items, 
  renderItem 
}: { 
  items: Signal<T[]>, 
  renderItem: (item: T) => ComponentInstance 
}): ComponentInstance {
  return ForEach({
    data: items,
    children: renderItem,
    getItemId: (item) => item.id
  })
}
```

## Common Patterns

### Empty States

```typescript
function TodoList(): VStack {
  const [todos, setTodos] = createSignal<Todo[]>([])
  
  return VStack({
    children: [
      Show({
        when: () => todos().length > 0,
        children: ForEach({
          data: todos,
          children: (todo) => TodoItem({ todo }),
          getItemId: (todo) => todo.id
        }),
        fallback: VStack({
          children: [
            Text("No todos yet")
              .modifier
              .fontSize(18)
              .foregroundColor('#999')
              .textAlign('center')
              .build(),
            Text("Add your first todo to get started")
              .modifier
              .fontSize(14)
              .foregroundColor('#666')
              .textAlign('center')
              .build()
          ]
        })
      })
    ]
  })
}
```

### Loading States

```typescript
function DataList(): ComponentInstance {
  const [items, setItems] = createSignal<Item[]>([])
  const [loading, setLoading] = createSignal(true)
  
  return Show({
    when: () => !loading(),
    children: ForEach({
      data: items,
      children: (item) => ItemView({ item }),
      getItemId: (item) => item.id
    }),
    fallback: Text("Loading...")
      .modifier
      .textAlign('center')
      .fontSize(16)
      .foregroundColor('#999')
      .build()
  })
}
```

### Grouping and Sorting

```typescript
function GroupedList(): VStack {
  const [items, setItems] = createSignal<Item[]>([])
  
  const groupedItems = createMemo(() => {
    const groups = new Map<string, Item[]>()
    
    items().forEach(item => {
      const key = item.category
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(item)
    })
    
    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.name.localeCompare(b.name))
    }))
  })
  
  return ForEach({
    data: groupedItems,
    children: (group) => 
      VStack({
        children: [
          Text(group.category)
            .modifier
            .fontSize(18)
            .fontWeight('bold')
            .marginTop(16)
            .marginBottom(8)
            .build(),
          
          ForEach({
            data: group.items,
            children: (item) => ItemView({ item }),
            getItemId: (item) => item.id
          })
        ]
      }),
    getItemId: (group) => group.category
  })
}
```

## Migration from Other Frameworks

### From React

```typescript
// React
{items.map((item, index) => (
  <ItemView key={item.id} item={item} index={index} />
))}

// TachUI
ForEach({
  data: items,
  children: (item, index) => ItemView({ item, index }),
  getItemId: (item) => item.id
})
```

### From Vue

```typescript
// Vue
<ItemView 
  v-for="(item, index) in items" 
  :key="item.id" 
  :item="item" 
  :index="index" 
/>

// TachUI
ForEach({
  data: items,
  children: (item, index) => ItemView({ item, index }),
  getItemId: (item) => item.id
})
```

### From SolidJS

```typescript
// SolidJS
<For each={items}>
  {(item, index) => <ItemView item={item} index={index()} />}
</For>

// TachUI ForEach
ForEach({
  data: items,
  children: (item, index) => ItemView({ item, index })
})

// TachUI For (SolidJS-compatible)
For({
  each: items,
  children: (item, index) => ItemView({ item, index })
})
```

## See Also

- **[For Component](/components/for)** - SolidJS-style list rendering
- **[Show Component](/components/show)** - Conditional rendering
- **[List Component](../guide/layout#list-component)** - Advanced list with virtual scrolling
- **[State Management Guide](/guide/state-management)** - Managing list state
- **[Signals Guide](/guide/signals)** - Understanding reactive signals