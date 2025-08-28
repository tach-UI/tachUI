# For Component

The For component provides SolidJS-compatible syntax for list rendering, making migration from SolidJS easier while maintaining full TachUI reactivity.

## Signature

```typescript
interface ForProps<T = any> {
  each: T[] | Signal<T[]>
  children: (item: T, index: number) => ComponentInstance | ComponentInstance[]
  fallback?: ComponentInstance
  key?: string | number
  ref?: ComponentRef
}

function For<T>(props: ForProps<T>): ComponentInstance
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `each` | `T[] \| Signal<T[]>` | Array or reactive signal containing items to render (SolidJS-style prop name) |
| `children` | `(item: T, index: number) => ComponentInstance \| ComponentInstance[]` | Function that renders each item |
| `fallback` | `ComponentInstance` | Optional content to show when the list is empty |
| `key` | `string \| number` | Component key for React-style reconciliation |
| `ref` | `ComponentRef` | Reference to the component instance |

## Key Differences from ForEach

The For component is essentially an alias for ForEach with SolidJS-compatible naming:

| Feature | For | ForEach |
|---------|-----|---------|
| Data prop | `each` | `data` |
| Empty state | `fallback` | Not built-in (use Show) |
| Key function | Not supported | `getItemId` |
| Purpose | SolidJS compatibility | Primary TachUI API |

## Basic Usage

### Simple Array Rendering

```typescript
import { For, Text, VStack, createSignal, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

function FruitList(): VStack {
  const [fruits, setFruits]: [Signal<string[]>, Setter<string[]>] = createSignal<string[]>(['Apple', 'Banana', 'Orange'])
  
  return VStack({
    children: [
      For({
        each: fruits,  // SolidJS-style prop name
        children: (fruit: string, index: number): ComponentInstance => 
          Text(`${index + 1}. ${fruit}`)
            .modifier
            .fontSize(16)
            .padding(8)
            .backgroundColor('#f8f9fa')
            .cornerRadius(4)
            .build(),
        fallback: Text("No fruits available")  // Built-in empty state
          .modifier
          .fontSize(14)
          .foregroundColor('#999')
          .textAlign('center')
          .build()
      })
    ],
    spacing: 8
  })
}
```

### With Dynamic Updates

```typescript
import { For, VStack, HStack, Text, Button, createSignal, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

function DynamicList(): VStack {
  const [items, setItems]: [Signal<string[]>, Setter<string[]>] = createSignal<string[]>([])
  
  const addItem = (): void => {
    setItems((prevItems: string[]) => [...prevItems, `Item ${prevItems.length + 1}`])
  }
  
  const removeItem = (index: number): void => {
    setItems((prevItems: string[]) => prevItems.filter((_: string, i: number) => i !== index))
  }
  
  return VStack({
    children: [
      For({
        each: items,
        children: (item: string, index: number): ComponentInstance => 
          HStack({
            children: [
              Text(item)
                .modifier
                .flexGrow(1)
                .fontSize(16)
                .build(),
              Button("Remove", (): void => removeItem(index))
                .modifier
                .backgroundColor('#FF3B30')
                .foregroundColor('white')
                .padding(8, 16)
                .cornerRadius(6)
                .build()
            ],
            spacing: 12,
            alignment: 'center'
          })
            .modifier
            .padding(12)
            .backgroundColor('#ffffff')
            .cornerRadius(8)
            .shadow({ x: 0, y: 1, radius: 2, color: 'rgba(0,0,0,0.1)' })
            .build(),
        fallback: Text("No items yet - add some!")
          .modifier
          .textAlign('center')
          .foregroundColor('#999')
          .fontSize(16)
          .padding(32)
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
    spacing: 12
  })
}
```

## Working with Objects

### User List Example

```typescript
import { For, VStack, HStack, Text, createSignal, type Signal, type Setter, type ComponentInstance } from '@tachui/core'

interface User {
  id: number
  name: string
  email: string
  avatar?: string
  department: string
}

function UserList(): VStack {
  const [users, setUsers]: [Signal<User[]>, Setter<User[]>] = createSignal<User[]>([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Design' },
    { id: 3, name: 'Carol Davis', email: 'carol@example.com', department: 'Product' }
  ])
  
  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
  }
  
  return VStack({
    children: [
      Text("Team Members")
        .modifier
        .fontSize(24)
        .fontWeight('bold')
        .marginBottom(16)
        .foregroundColor('#1a1a1a')
        .build(),
      
      For({
        each: users,
        children: (user: User): ComponentInstance => 
          HStack({
            children: [
              // Avatar placeholder
              VStack({
                children: [
                  Text(getInitials(user.name))
                    .modifier
                    .fontSize(20)
                    .fontWeight('bold')
                    .foregroundColor('white')
                    .build()
                ]
              })
                .modifier
                .width(50)
                .height(50)
                .backgroundColor('#007AFF')
                .cornerRadius(25)
                .justifyContent('center')
                .alignItems('center')
                .build(),
              
              // User info
              VStack({
                children: [
                  Text(user.name)
                    .modifier
                    .fontSize(16)
                    .fontWeight('600')
                    .foregroundColor('#1a1a1a')
                    .build(),
                  Text(user.email)
                    .modifier
                    .fontSize(14)
                    .foregroundColor('#666')
                    .build(),
                  Text(user.department)
                    .modifier
                    .fontSize(12)
                    .fontWeight('500')
                    .foregroundColor('#007AFF')
                    .backgroundColor('#f0f8ff')
                    .padding(4, 8)
                    .cornerRadius(4)
                    .build()
                ],
                spacing: 4
              })
                .modifier
                .flexGrow(1)
                .alignItems('flex-start')
                .build()
            ],
            spacing: 12,
            alignment: 'center'
          })
            .modifier
            .padding(16)
            .backgroundColor('white')
            .cornerRadius(8)
            .shadow({ x: 0, y: 1, radius: 3, color: 'rgba(0,0,0,0.1)' })
            .marginBottom(8)
            .build(),
        
        fallback: Text("No team members found")
          .modifier
          .textAlign('center')
          .foregroundColor('#999')
          .fontSize(16)
          .padding(32)
          .build()
      })
    ],
    spacing: 8
  })
}
```

## Advanced Patterns

### Nested Lists with Categories

```typescript
interface Category {
  name: string
  items: string[]
}

function CategorizedItems(): VStack {
  const [categories, setCategories] = createSignal<Category[]>([
    { name: 'Fruits', items: ['Apple', 'Banana', 'Orange'] },
    { name: 'Vegetables', items: ['Carrot', 'Broccoli', 'Spinach'] },
    { name: 'Grains', items: ['Rice', 'Quinoa', 'Oats'] }
  ])
  
  return For({
    each: categories,
    children: (category) => 
      VStack({
        children: [
          Text(category.name)
            .modifier
            .fontSize(20)
            .fontWeight('bold')
            .marginTop(category === categories()[0] ? 0 : 16)
            .marginBottom(8)
            .foregroundColor('#007AFF')
            .build(),
          
          For({
            each: category.items,
            children: (item, index) => 
              Text(`• ${item}`)
                .modifier
                .fontSize(16)
                .marginLeft(16)
                .marginBottom(4)
                .build(),
            fallback: Text("No items in this category")
              .modifier
              .fontSize(14)
              .foregroundColor('#999')
              .marginLeft(16)
              .build()
          })
        ]
      }),
    
    fallback: Text("No categories available")
      .modifier
      .textAlign('center')
      .foregroundColor('#999')
      .padding(32)
      .build()
  })
}
```

### Filtered Lists

```typescript
function FilteredProductList(): VStack {
  const [products, setProducts] = createSignal([
    { name: 'iPhone', category: 'Electronics', price: 999 },
    { name: 'MacBook', category: 'Electronics', price: 1299 },
    { name: 'T-Shirt', category: 'Clothing', price: 29 },
    { name: 'Jeans', category: 'Clothing', price: 79 }
  ])
  
  const [filter, setFilter] = createSignal<'All' | 'Electronics' | 'Clothing'>('All')
  
  const filteredProducts = createMemo(() => {
    const currentFilter = filter()
    if (currentFilter === 'All') return products()
    return products().filter(product => product.category === currentFilter)
  })
  
  return VStack({
    children: [
      // Filter buttons
      HStack({
        children: [
          Button("All", () => setFilter('All'))
            .modifier
            .backgroundColor(() => filter() === 'All' ? '#007AFF' : '#E5E5E7')
            .foregroundColor(() => filter() === 'All' ? 'white' : 'black')
            .build(),
          
          Button("Electronics", () => setFilter('Electronics'))
            .modifier
            .backgroundColor(() => filter() === 'Electronics' ? '#007AFF' : '#E5E5E7')
            .foregroundColor(() => filter() === 'Electronics' ? 'white' : 'black')
            .build(),
          
          Button("Clothing", () => setFilter('Clothing'))
            .modifier
            .backgroundColor(() => filter() === 'Clothing' ? '#007AFF' : '#E5E5E7')
            .foregroundColor(() => filter() === 'Clothing' ? 'white' : 'black')
            .build()
        ],
        spacing: 8
      }),
      
      // Products list
      Text(() => `${filteredProducts().length} products`)
        .modifier
        .fontSize(14)
        .foregroundColor('#666')
        .marginTop(16)
        .marginBottom(8)
        .build(),
      
      For({
        each: filteredProducts,
        children: (product) => 
          HStack({
            children: [
              VStack({
                children: [
                  Text(product.name)
                    .modifier
                    .fontSize(16)
                    .fontWeight('600')
                    .build(),
                  Text(product.category)
                    .modifier
                    .fontSize(14)
                    .foregroundColor('#666')
                    .build()
                ]
              })
                .modifier
                .flexGrow(1)
                .alignItems('flex-start')
                .build(),
              
              Text(`$${product.price}`)
                .modifier
                .fontSize(18)
                .fontWeight('bold')
                .foregroundColor('#007AFF')
                .build()
            ]
          })
            .modifier
            .padding(16)
            .backgroundColor('white')
            .cornerRadius(8)
            .shadow({ x: 0, y: 1, radius: 2, color: 'rgba(0,0,0,0.1)' })
            .marginBottom(8)
            .build(),
        
        fallback: Text("No products match the current filter")
          .modifier
          .textAlign('center')
          .foregroundColor('#999')
          .padding(32)
          .build()
      })
    ]
  })
}
```

## Comparison with ForEach

### When to Use For vs ForEach

**Use For when:**
- Migrating from SolidJS
- You want built-in empty state handling
- Working with simple arrays without complex key requirements
- Prefer SolidJS-style syntax

**Use ForEach when:**
- Building new TachUI applications
- Need optimal performance with `getItemId`
- Working with complex object arrays
- Want more explicit control over rendering

### Migration Example

```typescript
// SolidJS original
<For each={items} fallback={<div>No items</div>}>
  {(item, index) => <ItemView item={item} index={index()} />}
</For>

// TachUI For (closest migration)
For({
  each: items,
  children: (item, index) => ItemView({ item, index }),
  fallback: Text("No items")
})

// TachUI ForEach (recommended for new code)
ForEach({
  data: items,
  children: (item, index) => ItemView({ item, index }),
  getItemId: (item) => item.id  // Better performance
})
```

## State Management Integration

### With State Management

```typescript
function TaskList(): VStack {
  const tasks = State<Task[]>([])
  
  return VStack({
    children: [
      For({
        each: () => tasks.wrappedValue,  // Function wrapper needed
        children: (task) => TaskItem({ task }),
        fallback: Text("No tasks yet")
      })
    ]
  })
}
```

### With Signals

```typescript
function TaskList(): VStack {
  const [tasks, setTasks] = createSignal<Task[]>([])
  
  return VStack({
    children: [
      For({
        each: tasks,  // Direct signal passing
        children: (task) => TaskItem({ task }),
        fallback: Text("No tasks yet")
      })
    ]
  })
}
```

## Performance Considerations

### Limitations vs ForEach

The For component doesn't support `getItemId`, which means:

```typescript
// ❌ For - Less efficient for object arrays
For({
  each: users,
  children: (user) => UserCard({ user })
  // No key function - may recreate components unnecessarily
})

// ✅ ForEach - More efficient with keys
ForEach({
  data: users,
  children: (user) => UserCard({ user }),
  getItemId: (user) => user.id  // Optimal performance
})
```

### Best Practices

```typescript
// ✅ Good - Use For for simple lists
For({
  each: stringArray,
  children: (str) => Text(str)
})

// ✅ Good - Use ForEach for complex object lists
ForEach({
  data: objectArray,
  children: (obj) => ComplexView({ obj }),
  getItemId: (obj) => obj.id
})

// ✅ Good - Stable child functions
const renderItem = (item: Item) => ItemView({ item })

For({
  each: items,
  children: renderItem  // Function reference doesn't change
})
```

## Type Safety

### Generic Support

```typescript
interface Product {
  id: string
  name: string
  price: number
}

// Type inference works automatically
const [products, setProducts] = createSignal<Product[]>([])

For({
  each: products,
  children: (product) => {  // product is inferred as Product
    return ProductCard({ product })
  }
})

// Explicit type annotation
For<Product>({
  each: products,
  children: (product: Product) => ProductCard({ product })
})
```

## Common Patterns

### Loading States with Fallback

```typescript
function DataList(): ComponentInstance {
  const [data, setData] = createSignal<Item[]>([])
  const [loading, setLoading] = createSignal(true)
  
  return Show({
    when: () => !loading(),
    children: For({
      each: data,
      children: (item) => ItemView({ item }),
      fallback: Text("No data available")
        .modifier
        .textAlign('center')
        .foregroundColor('#999')
        .build()
    }),
    fallback: Text("Loading...")
      .modifier
      .textAlign('center')
      .build()
  })
}
```

### Search Results

```typescript
function SearchResults(): VStack {
  const [query, setQuery] = createSignal('')
  const [results, setResults] = createSignal<SearchResult[]>([])
  
  return VStack({
    children: [
      TextField(query, setQuery, "Search..."),
      
      For({
        each: results,
        children: (result) => 
          SearchResultItem({ result }),
        fallback: Show({
          when: () => query().length > 0,
          children: Text("No results found")
            .modifier
            .textAlign('center')
            .foregroundColor('#999')
            .build(),
          fallback: Text("Enter a search term")
            .modifier
            .textAlign('center')
            .foregroundColor('#666')
            .build()
        })
      })
    ]
  })
}
```

## See Also

- **[ForEach Component](/components/foreach)** - Primary TachUI list rendering
- **[Show Component](/components/show)** - Conditional rendering
- **[List Component](../guide/layout#list-component)** - Advanced list with virtual scrolling
- **[State vs Signals Guide](/guide/state-vs-signals)** - Choosing the right reactive system
- **[Migration Guide](/guide/migration)** - Migrating from other frameworks