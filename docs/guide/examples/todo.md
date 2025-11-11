# Todo List Example

A comprehensive todo list application that demonstrates advanced TachUI patterns including state management, form handling, filtering, and persistence.

## Overview

This example showcases:
- **Complex state management** with multiple signals
- **Form handling** with validation
- **List manipulation** (add, remove, update)
- **Filtering and search** functionality
- **Local storage persistence**
- **Component composition** with reusable components
- **Advanced styling** with conditional modifiers

## Live Demo

```typescript
import { 
  createSignal, 
  createMemo,
  createEffect,
  Text, 
  Button, 
  TextField,
  VStack, 
  HStack,
  Form,
  Toggle,
  renderComponent 
} from '@tachui/core'

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: Date
  priority: 'low' | 'medium' | 'high'
}

function TodoApp() {
  // State management
  const [todos, setTodos] = createSignal<Todo[]>([])
  const [newTodoText, setNewTodoText] = createSignal('')
  const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = createSignal('')
  const [nextId, setNextId] = createSignal(1)
  
  // Load todos from localStorage on startup
  createEffect(() => {
    const saved = localStorage.getItem('tachui-todos')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTodos(parsed.map(todo => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        })))
        setNextId(Math.max(...parsed.map(t => t.id), 0) + 1)
      } catch (error) {
        console.error('Failed to load todos:', error)
      }
    }
  })
  
  // Save todos to localStorage when they change
  createEffect(() => {
    localStorage.setItem('tachui-todos', JSON.stringify(todos()))
  })
  
  // Computed values
  const filteredTodos = createMemo(() => {
    let filtered = todos()
    
    // Apply search filter
    const query = searchQuery().toLowerCase()
    if (query) {
      filtered = filtered.filter(todo =>
        todo.text.toLowerCase().includes(query)
      )
    }
    
    // Apply status filter
    const currentFilter = filter()
    if (currentFilter === 'active') {
      filtered = filtered.filter(todo => !todo.completed)
    } else if (currentFilter === 'completed') {
      filtered = filtered.filter(todo => todo.completed)
    }
    
    return filtered.sort((a, b) => {
      // Sort by priority first, then by creation date
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  })
  
  const stats = createMemo(() => ({
    total: todos().length,
    active: todos().filter(t => !t.completed).length,
    completed: todos().filter(t => t.completed).length
  }))
  
  // Actions
  const addTodo = () => {
    const text = newTodoText().trim()
    if (!text) return
    
    const newTodo: Todo = {
      id: nextId(),
      text,
      completed: false,
      createdAt: new Date(),
      priority: 'medium'
    }
    
    setTodos(prev => [...prev, newTodo])
    setNewTodoText('')
    setNextId(prev => prev + 1)
  }
  
  const toggleTodo = (id: number) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }
  
  const deleteTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }
  
  const updateTodoText = (id: number, newText: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, text: newText } : todo
    ))
  }
  
  const updateTodoPriority = (id: number, priority: Todo['priority']) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, priority } : todo
    ))
  }
  
  const clearCompleted = () => {
    setTodos(prev => prev.filter(todo => !todo.completed))
  }
  
  const toggleAll = () => {
    const allCompleted = todos().every(todo => todo.completed)
    setTodos(prev => prev.map(todo => ({
      ...todo,
      completed: !allCompleted
    })))
  }
  
  return VStack({
    children: [
      // Header
      VStack({
        children: [
          Text("Todo List")
            .fontSize(32)
            .fontWeight('bold')
            .foregroundColor('#2c3e50')
            .textAlign('center')
            ,
          
          Text(() => {
            const { total, active, completed } = stats()
            return `${total} total • ${active} active • ${completed} completed`
          })
            .fontSize(14)
            .foregroundColor('#7f8c8d')
            .textAlign('center')
            
        ],
        spacing: 8
      })
      .padding({ bottom: 24 })
      ,
      
      // Add todo form
      Form({
        onSubmit: addTodo,
        children: [
          HStack({
            children: [
              TextField(newTodoText, setNewTodoText, "What needs to be done?")
                .flexGrow(1)
                .padding(12)
                .border(1, '#ddd')
                .cornerRadius(8)
                .fontSize(16)
                ,
              
              Button("Add", addTodo)
                .backgroundColor('#3498db')
                .foregroundColor('white')
                .padding({ horizontal: 20, vertical: 12 })
                .cornerRadius(8)
                .disabled(() => !newTodoText().trim())
                .fontWeight('600')
                
            ],
            spacing: 12,
            alignment: 'center'
          })
        ]
      })
      .padding({ bottom: 24 })
      ,
      
      // Search and filters
      VStack({
        children: [
          // Search
          TextField(searchQuery, setSearchQuery, "Search todos...")
            .padding(10)
            .border(1, '#ddd')
            .cornerRadius(6)
            .backgroundColor('#f8f9fa')
            ,
          
          // Filter buttons
          HStack({
            children: [
              ...(['all', 'active', 'completed'] as const).map(filterType =>
                Button(
                  filterType.charAt(0).toUpperCase() + filterType.slice(1),
                  () => setFilter(filterType)
                )
                  .backgroundColor(() => 
                    filter() === filterType ? '#3498db' : '#ecf0f1'
                  )
                  .foregroundColor(() => 
                    filter() === filterType ? 'white' : '#2c3e50'
                  )
                  .padding({ horizontal: 16, vertical: 8 })
                  .cornerRadius(6)
                  .fontSize(14)
                  
              ),
              
              // Bulk actions
              Button("Toggle All", toggleAll)
                .backgroundColor('#f39c12')
                .foregroundColor('white')
                .padding({ horizontal: 16, vertical: 8 })
                .cornerRadius(6)
                .fontSize(14)
                .disabled(() => todos().length === 0)
                ,
              
              Button("Clear Completed", clearCompleted)
                .backgroundColor('#e74c3c')
                .foregroundColor('white')
                .padding({ horizontal: 16, vertical: 8 })
                .cornerRadius(6)
                .fontSize(14)
                .disabled(() => stats().completed === 0)
                
            ],
            spacing: 8,
            alignment: 'center'
          })
        ],
        spacing: 16
      })
      .padding({ bottom: 24 })
      ,
      
      // Todo list
      VStack({
        children: [
          () => filteredTodos().length === 0 ? 
            Text(() => {
              if (todos().length === 0) {
                return "No todos yet. Add one above!"
              }
              if (searchQuery()) {
                return `No todos match "${searchQuery()}"`
              }
              return `No ${filter()} todos`
            })
              .fontSize(16)
              .foregroundColor('#7f8c8d')
              .textAlign('center')
              .padding(40)
              .backgroundColor('#f8f9fa')
              .cornerRadius(8)
              
            : null,
          
          ...filteredTodos().map(todo => TodoItem({ 
            todo, 
            onToggle: toggleTodo,
            onDelete: deleteTodo,
            onUpdateText: updateTodoText,
            onUpdatePriority: updateTodoPriority
          }))
        ],
        spacing: 8
      })
    ],
    spacing: 0,
    alignment: 'stretch'
  })
  .padding(24)
  .backgroundColor('#ffffff')
  .minHeight('100vh')
  
}

// Todo item component
function TodoItem({ 
  todo, 
  onToggle, 
  onDelete, 
  onUpdateText, 
  onUpdatePriority 
}: {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
  onUpdateText: (id: number, text: string) => void
  onUpdatePriority: (id: number, priority: Todo['priority']) => void
}) {
  const [isEditing, setIsEditing] = createSignal(false)
  const [editText, setEditText] = createSignal(todo.text)
  
  const startEdit = () => {
    setEditText(todo.text)
    setIsEditing(true)
  }
  
  const saveEdit = () => {
    const newText = editText().trim()
    if (newText) {
      onUpdateText(todo.id, newText)
    }
    setIsEditing(false)
  }
  
  const cancelEdit = () => {
    setEditText(todo.text)
    setIsEditing(false)
  }
  
  const priorityColors = {
    high: '#e74c3c',
    medium: '#f39c12',
    low: '#95a5a6'
  }
  
  return VStack({
    children: [
      HStack({
        children: [
          // Priority indicator
          VStack({
            children: []
          })
            .width(4)
            .height(20)
            .backgroundColor(priorityColors[todo.priority])
            .cornerRadius(2)
            ,
          
          // Checkbox
          Toggle({
            isOn: () => todo.completed,
            onToggle: () => onToggle(todo.id),
            variant: 'checkbox'
          }),
          
          // Todo text or edit field
          () => isEditing() ?
            HStack({
              children: [
                TextField(editText, setEditText, "Todo text")
                  .flexGrow(1)
                  .padding(8)
                  .border(1, '#3498db')
                  .cornerRadius(4)
                  ,
                
                Button("Save", saveEdit)
                  .backgroundColor('#27ae60')
                  .foregroundColor('white')
                  .padding({ horizontal: 12, vertical: 6 })
                  .cornerRadius(4)
                  .fontSize(12)
                  ,
                
                Button("Cancel", cancelEdit)
                  .backgroundColor('#95a5a6')
                  .foregroundColor('white')
                  .padding({ horizontal: 12, vertical: 6 })
                  .cornerRadius(4)
                  .fontSize(12)
                  
              ],
              spacing: 8,
              alignment: 'center'
            })
            :
            HStack({
              children: [
                Text(todo.text)
                  .flexGrow(1)
                  .fontSize(16)
                  .foregroundColor(() => todo.completed ? '#7f8c8d' : '#2c3e50')
                  .textDecoration(() => todo.completed ? 'line-through' : 'none')
                  .onTap(startEdit)
                  ,
                
                // Priority selector
                HStack({
                  children: (['high', 'medium', 'low'] as const).map(priority =>
                    Button(priority[0].toUpperCase(), () => onUpdatePriority(todo.id, priority))
                      .width(24)
                      .height(24)
                      .backgroundColor(() => 
                        todo.priority === priority ? priorityColors[priority] : '#ecf0f1'
                      )
                      .foregroundColor(() => 
                        todo.priority === priority ? 'white' : '#7f8c8d'
                      )
                      .cornerRadius(12)
                      .fontSize(10)
                      .fontWeight('bold')
                      
                  ),
                  spacing: 4,
                  alignment: 'center'
                }),
                
                Button("Delete", () => onDelete(todo.id))
                  .backgroundColor('#e74c3c')
                  .foregroundColor('white')
                  .padding({ horizontal: 12, vertical: 6 })
                  .cornerRadius(4)
                  .fontSize(12)
                  
              ],
              spacing: 12,
              alignment: 'center'
            }),
        ],
        spacing: 12,
        alignment: 'center'
      }),
      
      // Creation date
      Text(() => `Created ${todo.createdAt.toLocaleDateString()}`)
        .fontSize(11)
        .foregroundColor('#bdc3c7')
        .padding({ left: 32, top: 4 })
        
    ],
    spacing: 0,
    alignment: 'stretch'
  })
  .padding(16)
  .backgroundColor(() => todo.completed ? '#f8f9fa' : 'white')
  .border(1, '#e9ecef')
  .cornerRadius(8)
  .shadow(() => todo.completed ? 
    { x: 0, y: 1, radius: 2, color: 'rgba(0,0,0,0.05)' } :
    { x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' }
  )
  
}

// Render the app
const container = document.getElementById('app')
renderComponent(TodoApp(), container)
```

## Key Features Demonstrated

### 1. Complex State Management

```typescript
const [todos, setTodos] = createSignal<Todo[]>([])
const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all')
const [searchQuery, setSearchQuery] = createSignal('')
```

Multiple interconnected signals managing different aspects of the application state.

### 2. Computed Values for Derived State

```typescript
const filteredTodos = createMemo(() => {
  let filtered = todos()
  
  // Chain multiple filters
  if (searchQuery()) {
    filtered = filtered.filter(todo =>
      todo.text.toLowerCase().includes(searchQuery().toLowerCase())
    )
  }
  
  if (filter() === 'active') {
    filtered = filtered.filter(todo => !todo.completed)
  }
  
  return filtered.sort(sortByPriorityAndDate)
})
```

Efficient filtering and sorting that only recalculates when dependencies change.

### 3. Persistent Storage

```typescript
// Save to localStorage when todos change
createEffect(() => {
  localStorage.setItem('tachui-todos', JSON.stringify(todos()))
})

// Load from localStorage on startup
createEffect(() => {
  const saved = localStorage.getItem('tachui-todos')
  if (saved) {
    setTodos(JSON.parse(saved))
  }
})
```

Automatic persistence with localStorage integration.

### 4. Form Handling and Validation

```typescript
const addTodo = () => {
  const text = newTodoText().trim()
  if (!text) return // Validation
  
  const newTodo = {
    id: nextId(),
    text,
    completed: false,
    createdAt: new Date(),
    priority: 'medium'
  }
  
  setTodos(prev => [...prev, newTodo])
  setNewTodoText('') // Clear form
}
```

Form submission with validation and state updates.

### 5. Inline Editing

```typescript
const [isEditing, setIsEditing] = createSignal(false)
const [editText, setEditText] = createSignal('')

// Toggle between display and edit modes
() => isEditing() ?
  EditingInterface() :
  DisplayInterface()
```

Conditional rendering for inline editing functionality.

## Advanced Patterns

### Optimistic Updates

```typescript
const deleteTodoOptimistic = async (id: number) => {
  // Optimistically remove from UI
  const originalTodos = todos()
  setTodos(prev => prev.filter(todo => todo.id !== id))
  
  try {
    await deleteTodoAPI(id)
  } catch (error) {
    // Revert on error
    setTodos(originalTodos)
    showError('Failed to delete todo')
  }
}
```

### Keyboard Shortcuts

```typescript
function TodoAppWithKeyboards() {
  const [todos, setTodos] = createSignal([])
  const [selectedIndex, setSelectedIndex] = createSignal(-1)
  
  createEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'j': // Next todo
          setSelectedIndex(prev => 
            Math.min(prev + 1, filteredTodos().length - 1)
          )
          break
        case 'k': // Previous todo
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case ' ': // Toggle selected
          if (selectedIndex() >= 0) {
            toggleTodo(filteredTodos()[selectedIndex()].id)
          }
          break
        case 'x': // Delete selected
          if (selectedIndex() >= 0) {
            deleteTodo(filteredTodos()[selectedIndex()].id)
          }
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  })
  
  // Rest of component...
}
```

### Drag and Drop Reordering

```typescript
function DragDropTodos() {
  const [todos, setTodos] = createSignal([])
  const [draggedIndex, setDraggedIndex] = createSignal(-1)
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }
  
  const handleDrop = (targetIndex: number) => {
    const dragIndex = draggedIndex()
    if (dragIndex === -1 || dragIndex === targetIndex) return
    
    setTodos(prev => {
      const newTodos = [...prev]
      const [draggedTodo] = newTodos.splice(dragIndex, 1)
      newTodos.splice(targetIndex, 0, draggedTodo)
      return newTodos
    })
    
    setDraggedIndex(-1)
  }
  
  // Todo items with drag handlers
  return VStack({
    children: todos().map((todo, index) =>
      TodoItem({ todo })
        .draggable(true)
        .onDragStart(() => handleDragStart(index))
        .onDrop(() => handleDrop(index))
        .opacity(() => draggedIndex() === index ? 0.5 : 1)
        
    )
  })
}
```

### Real-time Collaboration

```typescript
function CollaborativeTodos() {
  const [todos, setTodos] = createSignal([])
  const [socket, setSocket] = createSignal(null)
  
  // WebSocket connection
  createEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')
    setSocket(ws)
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data)
      
      switch (type) {
        case 'TODO_ADDED':
          setTodos(prev => [...prev, data])
          break
        case 'TODO_UPDATED':
          setTodos(prev => prev.map(todo =>
            todo.id === data.id ? data : todo
          ))
          break
        case 'TODO_DELETED':
          setTodos(prev => prev.filter(todo => todo.id !== data.id))
          break
      }
    }
    
    return () => ws.close()
  })
  
  const addTodo = (text: string) => {
    const newTodo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date()
    }
    
    // Optimistically add to local state
    setTodos(prev => [...prev, newTodo])
    
    // Send to server
    socket()?.send(JSON.stringify({
      type: 'ADD_TODO',
      data: newTodo
    }))
  }
  
  // Rest of component...
}
```

## Testing the Todo App

### Component Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createSignal } from '@tachui/core'

describe('Todo App Logic', () => {
  let todos, setTodos
  
  beforeEach(() => {
    [todos, setTodos] = createSignal([])
  })
  
  it('should add new todos', () => {
    const newTodo = {
      id: 1,
      text: 'Test todo',
      completed: false,
      createdAt: new Date()
    }
    
    setTodos(prev => [...prev, newTodo])
    
    expect(todos()).toHaveLength(1)
    expect(todos()[0].text).toBe('Test todo')
  })
  
  it('should toggle todo completion', () => {
    setTodos([{
      id: 1,
      text: 'Test',
      completed: false,
      createdAt: new Date()
    }])
    
    setTodos(prev => prev.map(todo =>
      todo.id === 1 ? { ...todo, completed: !todo.completed } : todo
    ))
    
    expect(todos()[0].completed).toBe(true)
  })
  
  it('should filter todos correctly', () => {
    const testTodos = [
      { id: 1, text: 'Active', completed: false, createdAt: new Date() },
      { id: 2, text: 'Completed', completed: true, createdAt: new Date() }
    ]
    
    setTodos(testTodos)
    
    const activeTodos = todos().filter(t => !t.completed)
    const completedTodos = todos().filter(t => t.completed)
    
    expect(activeTodos).toHaveLength(1)
    expect(completedTodos).toHaveLength(1)
  })
})
```

## What's Next?

This todo list demonstrates advanced TachUI patterns. To continue learning:

1. **[Data Fetching Example](/examples/data-fetching)** - API integration patterns
2. **[State Management Guide](/guide/state-management)** - Advanced state patterns
3. **[Form Components](/guide/components#forms)** - Form handling best practices
4. **[Testing Guide](/guide/testing)** - Testing reactive applications

The todo list showcases how TachUI's reactive system naturally handles complex application state while maintaining clean, readable code.