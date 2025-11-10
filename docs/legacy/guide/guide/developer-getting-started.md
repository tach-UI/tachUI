# Developer Getting Started Guide

**Build your first TachUI web application in under 15 minutes!**

This guide will walk you through creating a real web application using TachUI's SwiftUI-inspired syntax. You'll experience the beauty of declarative UI development with familiar SwiftUI patterns, but for the web.

> **📚 New to TachUI Components?** Check out our comprehensive [TachUI Components Guide](/guide/tachui-components) for detailed documentation on all components, modifiers, and TachUI-specific syntax patterns.

## 🎯 What You'll Build

By the end of this guide, you'll have created a beautiful task management app featuring:
- ✅ **Pure SwiftUI syntax** - VStack, HStack, Text, Button with modifier chaining
- ✅ **Reactive state management** - @State-style property wrappers  
- ✅ **Live hot-reloading** development server
- ✅ **Modern build pipeline** with Vite
- ✅ **Production-ready** optimized build

**Time to complete: ~15 minutes**

## 📋 Prerequisites

- **Node.js 18+** and **npm** installed
- **Basic JavaScript/TypeScript knowledge**
- **Text editor** (VS Code recommended)
- **Modern web browser**

## 🚀 Quick Start with Tacho CLI

### Step 1: Install TachUI CLI

```bash
# Install the Tacho CLI globally
npm install -g @tachui/cli

# Or use npx without installing
npx @tachui/cli --version
```

### Step 2: Create Your Project with Tacho

```bash
# Create a new TachUI project (interactive setup)
tacho init my-tachui-app

# Or with options for faster setup
tacho init my-tachui-app --template=full-featured --yes
```

The Tacho CLI will guide you through a simple interactive setup:

```
🚀 Welcome to TachUI Project Setup!

? Project name: › my-tachui-app
? Select a template: › 
  ● basic - Simple TachUI application with core components
    full-featured - Advanced app with @State, navigation, and lifecycle features

? Skip interactive prompts? › No

✅ Creating project structure...
✅ Generating template files...
✅ Installing dependencies...
```

### Step 3: Project Created Automatically!

Tacho creates a complete, production-ready project structure:

```
my-tachui-app/
├── public/
│   ├── index.html              ✅ Generated automatically
│   ├── favicon.ico
│   ├── manifest.json           ✅ PWA support
│   └── robots.txt
├── src/
│   ├── main.ts                 ✅ TachUI app bootstrap
│   ├── App.ts                  ✅ Root component
│   ├── router.ts               ✅ Navigation setup
│   ├── components/             ✅ Component organization
│   ├── stores/                 ✅ State management
│   ├── services/               ✅ API integrations
│   ├── utils/                  ✅ Helper functions
│   ├── types/                  ✅ TypeScript definitions
│   └── styles/                 ✅ CSS organization
├── tests/                      ✅ Testing setup
├── vite.config.ts             ✅ Optimized build config
├── tsconfig.json              ✅ TypeScript config
├── package.json               ✅ Dependencies & scripts
└── README.md                  ✅ Project documentation
```

### Step 4: Start Development Server

```bash
# Navigate to your project
cd my-tachui-app

# Start the development server (with hot reloading)
tacho dev

# Or use npm scripts
npm run dev
```

Your TachUI app will automatically open at `http://localhost:5173` with:
- ✅ **Hot Module Replacement** - Instant updates as you code
- ✅ **TypeScript Support** - Full intellisense and error checking  
- ✅ **Enhanced Error Messages** - TachUI-specific debugging tips
- ✅ **Development Optimizations** - Better performance in dev mode

## 🎨 Customize Your App with SwiftUI Syntax

The generated app already includes a working SwiftUI-style component! Let's customize it to build our task management app.

### Step 5: Build the Task Manager

Replace the contents of `src/App.ts` with pure SwiftUI syntax:

```typescript
// src/App.ts
import { 
  State,
  Text, 
  Button, 
  VStack,
  HStack,
  Elements 
} from '@tachui/core'

console.log('🚀 TachUI Task Manager Starting...')

// SwiftUI-style State management (using Tacho's built-in State)
const tasks = State([
  { id: 1, text: 'Learn TachUI SwiftUI syntax', completed: false },
  { id: 2, text: 'Build beautiful UIs declaratively', completed: false },
  { id: 3, text: 'Deploy to production', completed: false }
])

const newTaskText = State('')

// Computed properties (like SwiftUI's computed vars)
const activeTasks = () => tasks.wrappedValue.filter(task => !task.completed)
const completedTasks = () => tasks.wrappedValue.filter(task => task.completed)
const completionPercentage = () => {
  const total = tasks.wrappedValue.length
  return total > 0 ? Math.round((completedTasks().length / total) * 100) : 0
}

// Actions (like SwiftUI methods)
const addTask = () => {
  if (newTaskText.wrappedValue.trim()) {
    const newTask = {
      id: Date.now(),
      text: newTaskText.wrappedValue.trim(),
      completed: false
    }
    tasks.wrappedValue = [...tasks.wrappedValue, newTask]
    newTaskText.wrappedValue = ''
  }
}

const toggleTask = (taskId) => {
  tasks.wrappedValue = tasks.wrappedValue.map(task =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  )
}

const removeTask = (taskId) => {
  tasks.wrappedValue = tasks.wrappedValue.filter(task => task.id !== taskId)
}

// SwiftUI-style component composition
const TaskRow = (task) => {
  return HStack({
    children: [
      // Completion checkbox
      Button(task.completed ? "✅" : "⭕")
        .modifier
        .backgroundColor('transparent')
        .border(0)
        .fontSize(20)
        .padding(8)
        .cornerRadius(4)
        .onTap(() => toggleTask(task.id))
        .transition('all', 200)
        .onHover(true, {
          transform: 'scale(1.1)'
        })
        .build(),

      // Task text
      Text(task.text)
        .modifier
        .fontSize(16)
        .foregroundColor(task.completed ? '#999' : '#333')
        .textDecoration(task.completed ? 'line-through' : 'none')
        .frame({ flex: 1 })
        .build(),

      // Remove button  
      Button("🗑️")
        .modifier
        .backgroundColor('transparent')
        .border(0)
        .fontSize(16)
        .padding(8)
        .cornerRadius(4)
        .opacity(0.6)
        .onTap(() => removeTask(task.id))
        .onHover(true, {
          opacity: 1,
          backgroundColor: '#ffebee'
        })
        .transition('all', 200)
        .build()
    ],
    alignment: 'center',
    spacing: 12
  })
  .modifier
  .backgroundColor('#ffffff')
  .padding(16)
  .marginVertical(4)
  .cornerRadius(8)
  .border(1, '#f0f0f0')
  .onHover(true, {
    borderColor: '#e0e0e0',
    transform: 'translateY(-1px)',
    shadow: { x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' }
  })
  .transition('all', 200)
  .build()
}

const ProgressBar = () => {
  return VStack({
    children: [
      HStack({
        children: [
          Text("Progress")
            .modifier
            .fontSize(14)
            .fontWeight('500')
            .foregroundColor('#666')
            .build(),

          Elements.div()
            .modifier
            .frame({ flex: 1 })
            .build(),

          Text(() => `${completionPercentage()}%`)
            .modifier
            .fontSize(14)
            .fontWeight('600')
            .foregroundColor('#007AFF')
            .build()
        ],
        alignment: 'center'
      })
      .modifier
      .marginBottom(8)
      .build(),

      // Progress bar background
      Elements.div({
        children: [
          // Progress bar fill
          Elements.div()
            .modifier
            .height(6)
            .backgroundColor('#007AFF')
            .cornerRadius(3)
            .transition('width', 300)
            .width(() => `${completionPercentage()}%`)
            .build()
        ]
      })
      .modifier
      .backgroundColor('#f0f0f0')
      .height(6)
      .cornerRadius(3)
      .build()
    ],
    spacing: 0
  })
  .modifier
  .padding(20)
  .backgroundColor('#f8f9fa')
  .cornerRadius(8)
  .marginBottom(20)
  .build()
}

const AddTaskForm = () => {
  return HStack({
    children: [
      Elements.input({
        type: 'text',
        placeholder: 'Add a new task...',
        value: () => newTaskText.wrappedValue,
        onInput: (e) => newTaskText.wrappedValue = e.target.value,
        onKeyPress: (e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addTask()
          }
        }
      })
      .modifier
      .fontSize(16)
      .padding(12)
      .border(1, '#ddd')
      .cornerRadius(8)
      .frame({ flex: 1 })
      .onFocus(true, {
        borderColor: '#007AFF',
        outline: 'none'
      })
      .transition('border-color', 200)
      .build(),

      Button("Add Task")
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .fontSize(16)
        .fontWeight('600')
        .paddingSymmetric(20, 12) // horizontal, vertical
        .cornerRadius(8)
        .border(0)
        .onTap(addTask)
        .onHover(true, {
          backgroundColor: '#0056b3'
        })
        .transition('all', 200)
        .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0, 122, 255, 0.3)' })
        .build()
    ],
    spacing: 12,
    alignment: 'center'
  })
  .modifier
  .marginBottom(24)
  .build()
}

const StatsSection = () => {
  return HStack({
    children: [
      VStack({
        children: [
          Text(() => activeTasks().length.toString())
            .modifier
            .fontSize(24)
            .fontWeight('bold')
            .foregroundColor('#007AFF')
            .build(),

          Text("Active")
            .modifier
            .fontSize(14)
            .foregroundColor('#666')
            .build()
        ],
        alignment: 'center',
        spacing: 4
      })
      .modifier
      .frame({ flex: 1 })
      .build(),

      VStack({
        children: [
          Text(() => completedTasks().length.toString())
            .modifier
            .fontSize(24)
            .fontWeight('bold')
            .foregroundColor('#28a745')
            .build(),

          Text("Completed")
            .modifier
            .fontSize(14)
            .foregroundColor('#666')
            .build()
        ],
        alignment: 'center',
        spacing: 4
      })
      .modifier
      .frame({ flex: 1 })
      .build(),

      VStack({
        children: [
          Text(() => tasks.wrappedValue.length.toString())
            .modifier
            .fontSize(24)
            .fontWeight('bold')
            .foregroundColor('#6c757d')
            .build(),

          Text("Total")
            .modifier
            .fontSize(14)
            .foregroundColor('#666')
            .build()
        ],
        alignment: 'center',
        spacing: 4
      })
      .modifier
      .frame({ flex: 1 })
      .build()
    ],
    alignment: 'center'
  })
  .modifier
  .backgroundColor('#ffffff')
  .padding(20)
  .cornerRadius(12)
  .shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
  .marginBottom(24)
  .build()
}

// Main App Component - Pure SwiftUI structure (exported for Tacho)
export function App() {
  return VStack({
    children: [
      // Header
      Text("✅ Task Manager")
        .modifier
        .fontSize(28)
        .fontWeight('bold')
        .foregroundColor('#1a1a1a')
        .textAlign('center')
        .marginBottom(8)
        .build(),

      Text("Built with TachUI SwiftUI syntax")
        .modifier
        .fontSize(16)
        .foregroundColor('#666')
        .textAlign('center')
        .marginBottom(32)
        .build(),

      // Progress tracking
      ProgressBar(),

      // Statistics
      StatsSection(),

      // Add task form
      AddTaskForm(),

      // Task list
      VStack({
        children: () => tasks.wrappedValue.map(task => TaskRow(task)),
        spacing: 0
      })
      .modifier
      .build()
    ],
    spacing: 0,
    alignment: 'stretch'
  })
  .modifier
  .maxWidth(600)
  .marginHorizontal('auto')
  .padding(24)
  .minHeight('100vh')
  .backgroundColor('#fafafa')
  .build()
}

// Tacho automatically mounts this App component via src/main.ts
```

### Step 6: Add Beautiful Styling

Update `src/styles/globals.css` (already created by Tacho):

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
}

/* Custom scrollbar for better aesthetics */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive design */
@media (max-width: 768px) {
  #app {
    padding: 10px;
  }
}
```

### Step 7: Test Your SwiftUI App

Your app is already running! If not, start it with:

```bash
tacho dev
```

Open `http://localhost:5173` in your browser. You should see:

1. **A beautiful SwiftUI-style interface** with proper spacing and typography
2. **Live progress tracking** that updates automatically 
3. **Smooth animations** on hover and interactions
4. **Add, complete, and remove tasks** with instant updates
5. **Responsive design** that works on mobile
6. **Real-time statistics** showing active/completed/total counts

**Try these SwiftUI-powered interactions:**
- ✅ Add new tasks using the input field and button
- ✅ Toggle task completion with the checkbox buttons
- ✅ Remove tasks with the trash button  
- ✅ Watch the progress bar animate in real-time
- ✅ Hover over elements to see smooth transitions
- ✅ Resize the browser to see responsive behavior

## 🛠️ Powerful Tacho CLI Features

Now that your app is running, explore Tacho's development tools:

### Generate Components Instantly

```bash
# Generate a new SwiftUI-style component
tacho generate component UserProfile
tacho generate screen LoginScreen
tacho generate store UserStore
tacho generate form ContactForm

# Interactive generator selection
tacho generate
```

### Code Analysis & Optimization

```bash
# Analyze your TachUI codebase
tacho analyze --detailed --suggestions

# Optimize performance automatically
tacho optimize --category=performance --interactive

# Migration from other frameworks
tacho migrate react ./src/components
tacho migrate vue ./src/views
```

### Development Tools

```bash
# Enhanced development server
tacho dev --performance --debug

# Project analysis with health score
tacho analyze --output=report.json

# Code optimization with rules
tacho optimize --dry-run --report
```

## 🧠 Understanding TachUI SwiftUI Concepts

### SwiftUI-Style State Management

TachUI provides SwiftUI property wrappers for reactive state:

```javascript
// @State equivalent - local reactive state
const count = State(0)
const message = State('Hello, TachUI!')
const isVisible = State(true)

// Access and modify state
console.log(count.wrappedValue) // Read value
count.wrappedValue = 10 // Update triggers UI refresh

// Use in components
Text(() => `Count: ${count.wrappedValue}`)
  .modifier
  .fontSize(18)
  .build()
```

### Component Composition with VStack/HStack

Layout your UI exactly like SwiftUI:

```javascript
VStack({
  children: [
    Text("Title")
      .modifier
      .fontSize(24)
      .fontWeight('bold')
      .build(),
    
    HStack({
      children: [
        Button("Cancel")
          .modifier
          .variant('outlined')
          .build(),
        
        Button("Save")
          .modifier
          .backgroundColor('#007AFF')
          .foregroundColor('#ffffff')
          .build()
      ],
      spacing: 12
    })
  ],
  spacing: 16,
  alignment: 'center'
})
```

### Modifier Chaining

Apply styling and behavior with familiar SwiftUI modifiers:

```javascript
Button("Get Started")
  .modifier
  .backgroundColor('#007AFF')
  .foregroundColor('#ffffff')
  .fontSize(16)
  .fontWeight('600')
  .paddingSymmetric(24, 12) // horizontal, vertical  
  .cornerRadius(8)
  .onTap(() => console.log('Tapped!'))
  .onHover(true, { backgroundColor: '#0056b3' })
  .transition('all', 200)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0, 122, 255, 0.3)' })
  .build()
```

### Reactive UI Updates

Unlike manual DOM manipulation, TachUI automatically updates the UI when state changes:

```javascript
const [isVisible, setIsVisible] = createSignal(false)

// This automatically shows/hides based on state
VStack({
  children: () => isVisible() ? [
    Text("I'm visible!")
      .modifier
      .opacity(1)
      .build()
  ] : []
})
```

## 🏗️ TachUI Architectural Patterns

TachUI combines SwiftUI's declarative API with SolidJS's reactive performance. This creates unique architectural opportunities that differ from traditional React/Vue patterns.

### Component/Store Architecture (Recommended)

The best pattern for TachUI projects combines SwiftUI-style components with reactive stores:

```javascript
// stores/todoStore.js - Business logic and state
import { createSignal, createMemo } from '@tachui/core'

export function createTodoStore() {
  const [todos, setTodos] = createSignal([])
  const [filter, setFilter] = createSignal('all')
  
  // Computed values (like SwiftUI's computed properties)
  const filteredTodos = createMemo(() => 
    todos().filter(todo => {
      if (filter() === 'active') return !todo.completed
      if (filter() === 'completed') return todo.completed
      return true
    })
  )
  
  const stats = createMemo(() => ({
    total: todos().length,
    completed: todos().filter(t => t.completed).length,
    active: todos().filter(t => !t.completed).length
  }))
  
  // Actions (like SwiftUI methods)
  const addTodo = (text) => {
    setTodos(prev => [...prev, {
      id: Date.now(),
      text,
      completed: false
    }])
  }
  
  const toggleTodo = (id) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }
  
  return {
    // State
    todos: filteredTodos,
    filter,
    stats,
    // Actions
    addTodo,
    toggleTodo,
    setFilter
  }
}

// components/TodoListComponent.js - UI components
export function TodoListComponent() {
  // External business logic
  const todoStore = createTodoStore()
  
  // Local UI state
  const [newTodoText, setNewTodoText] = createSignal('')
  
  return VStack({
    children: [
      // Add todo form
      TodoForm({ 
        text: newTodoText,
        onTextChange: setNewTodoText,
        onSubmit: () => {
          todoStore.addTodo(newTodoText())
          setNewTodoText('')
        }
      }),
      
      // Filter controls
      TodoFilters({
        currentFilter: todoStore.filter,
        onFilterChange: todoStore.setFilter
      }),
      
      // Todo list
      TodoList({
        todos: todoStore.todos,
        onToggle: todoStore.toggleTodo
      }),
      
      // Statistics
      TodoStats({ stats: todoStore.stats })
    ],
    spacing: 16
  })
}
```

### Container/Presenter Pattern

For more complex applications, separate business logic from presentation:

```javascript
// containers/UserProfileContainer.js - Logic container
export function UserProfileContainer({ userId }) {
  const userStore = useUserStore()
  const [isEditing, setIsEditing] = createSignal(false)
  
  // Load user data
  createEffect(() => {
    userStore.loadUser(userId)
  })
  
  const handleSave = async (userData) => {
    await userStore.updateUser(userId, userData)
    setIsEditing(false)
  }
  
  return UserProfilePresenter({
    user: userStore.user,
    isLoading: userStore.isLoading,
    isEditing: isEditing(),
    onEdit: () => setIsEditing(true),
    onCancel: () => setIsEditing(false),
    onSave: handleSave
  })
}

// components/UserProfilePresenter.js - Pure UI
export function UserProfilePresenter({ 
  user, 
  isLoading, 
  isEditing, 
  onEdit, 
  onCancel, 
  onSave 
}) {
  if (isLoading) {
    return LoadingSpinner()
  }
  
  if (isEditing) {
    return UserEditForm({ 
      user, 
      onCancel, 
      onSave 
    })
  }
  
  return UserDisplayCard({ 
    user, 
    onEdit 
  })
}
```

### Combine-Style Reactive Patterns

TachUI's reactive system supports Combine-style reactive programming:

```javascript
// Advanced reactive patterns inspired by Combine
export function createReactiveUserService() {
  const [users, setUsers] = createSignal([])
  const [searchTerm, setSearchTerm] = createSignal('')
  const [sortBy, setSortBy] = createSignal('name')
  
  // Combine multiple signals (like combineLatest)
  const processedUsers = createMemo(() => {
    const allUsers = users()
    const term = searchTerm().toLowerCase()
    const sort = sortBy()
    
    return allUsers
      .filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
      .sort((a, b) => a[sort].localeCompare(b[sort]))
  })
  
  // Debounced search (like Combine's debounce)
  const debouncedSearch = createMemo(() => {
    const term = searchTerm()
    // Implement debouncing logic
    return term
  })
  
  // Side effects (like Combine's sink)
  createEffect(() => {
    const term = debouncedSearch()
    if (term.length > 2) {
      analytics.track('user_search', { term })
    }
  })
  
  return {
    users: processedUsers,
    searchTerm,
    sortBy,
    setSearchTerm,
    setSortBy,
    loadUsers: () => fetchUsers().then(setUsers)
  }
}
```

### Environment and Dependency Injection

Use TachUI's environment system for app-wide state (like SwiftUI's @EnvironmentObject):

```javascript
// services/AppContext.js
export const AppContext = {
  userService: createUserService(),
  settingsService: createSettingsService(),
  analyticsService: createAnalyticsService()
}

// App.js - Root component
export function App() {
  return EnvironmentProvider(AppContext, 
    VStack({
      children: [
        NavigationBar(),
        MainContent(),
        FooterBar()
      ]
    })
  )
}

// Any child component can access environment
export function UserProfile() {
  const { userService } = useEnvironment()
  
  return VStack({
    children: [
      Text(userService.currentUser().name),
      Button("Sign Out")
        .modifier
        .onTap(userService.signOut)
        .build()
    ]
  })
}
```

### Why This Architecture Works for TachUI

1. **SwiftUI Familiarity**: Component/Store mirrors SwiftUI's View/ObservableObject patterns
2. **Performance**: Fine-grained reactivity only updates what changed
3. **Testability**: Pure functions and isolated business logic
4. **Scalability**: Clear separation between UI and business logic
5. **Type Safety**: Full TypeScript support with reactive types

## 🛠️ Available SwiftUI Components

TachUI provides a comprehensive set of SwiftUI-inspired components:

### Layout Components
- **VStack** - Vertical stack layout
- **HStack** - Horizontal stack layout  
- **ZStack** - Layered stack layout
- **Layout.Grid** - Grid layouts

### UI Components
- **Text** - Rich text with typography
- **Button** - Interactive buttons with states
- **TextField** - Text input with validation
- **Image** - Image display with loading states
- **ScrollView** - Scrollable content areas
- **List** - Dynamic lists with selection

### Navigation Components
- **NavigationView** - Navigation container
- **NavigationLink** - Navigation transitions
- **TabView** - Tab-based navigation

### State Management
- **State()** - Local component state
- **ObservedObject()** - External object observation
- **EnvironmentObject()** - Global app state

## 🚀 Build for Production

When you're ready to deploy:

```bash
# Production build with Vite
npm run build

# Analyze your built app
tacho analyze --pattern="dist/**/*" --performance
```

This creates an optimized build in the `dist/` folder with:
- ✅ **Tree-shaken bundles** - Only code you use
- ✅ **Minified JavaScript** - Smallest possible size
- ✅ **Asset optimization** - Compressed images and fonts
- ✅ **Modern browser features** - ES modules and dynamic imports
- ✅ **TachUI optimizations** - Framework-specific optimizations

## 📁 Production-Ready Project Structure

For real-world applications, use this comprehensive project structure:

```
my-tachui-app/
├── public/                     # Static web assets
│   ├── index.html             # HTML entry point (ESSENTIAL)
│   ├── favicon.ico
│   ├── manifest.json          # PWA configuration
│   ├── robots.txt             # SEO
│   └── assets/
│       ├── icons/
│       └── images/
├── src/
│   ├── main.ts                # Application bootstrap
│   ├── App.ts                 # Root TachUI component
│   ├── router.ts              # Client-side routing
│   ├── components/            # UI components
│   │   ├── ui/                # Basic components (Button, Text, Card)
│   │   ├── layout/            # Layout components (Header, Sidebar)
│   │   └── feature/           # Feature-specific components
│   ├── stores/                # State management (Component/Store pattern)
│   │   ├── userStore.ts       # User-related state
│   │   ├── todoStore.ts       # Business logic stores
│   │   └── index.ts           # Store exports
│   ├── services/              # External integrations
│   │   ├── api/               # API clients
│   │   ├── storage/           # Local storage
│   │   └── analytics/         # Analytics integration
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript definitions
│   ├── styles/                # CSS files
│   │   ├── globals.css
│   │   ├── reset.css
│   │   └── variables.css
│   └── assets/                # Source assets
├── tests/                     # Test files
├── .env                       # Environment variables
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

**Essential index.html template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My TachUI App</title>
    <meta name="description" content="Modern web app built with TachUI SwiftUI syntax">
    <link rel="icon" href="/favicon.ico">
    <link rel="manifest" href="/manifest.json">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## 🎯 Next Steps

Now that you've built your first TachUI app, explore these advanced features:

1. **[Navigation System](/guide/navigation)** - Multi-screen apps with routing
2. **[Advanced State Management](/guide/state-management)** - Complex app state
3. **[Component Library](/guide/components)** - All available components  
4. **[Modifier Reference](/guide/modifiers)** - Complete styling options
5. **[Performance Guide](/guide/performance)** - Optimization techniques

## 🌟 Why Choose TachUI + Tacho CLI?

After building this app, you've experienced:

✅ **Familiar SwiftUI syntax** - No learning curve for iOS developers  
✅ **True reactivity** - State changes automatically update UI  
✅ **Type safety** - Full TypeScript support with intellisense  
✅ **Performance** - Fine-grained updates, no virtual DOM overhead  
✅ **Instant setup** - `tacho init` creates complete, production-ready projects  
✅ **Smart tooling** - Component generation, performance monitoring, AI assistance  
✅ **Modern development** - Hot reloading, DevTools, and deployment helpers  
✅ **Small bundle size** - Tree-shakeable, import only what you use

Ready to build production apps? TachUI + Tacho CLI scales from simple prototypes to complex applications while maintaining the same elegant SwiftUI syntax you just learned.

[Explore Advanced Features →](/guide/components)