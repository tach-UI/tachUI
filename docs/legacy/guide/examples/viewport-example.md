# Viewport Management Example

This example demonstrates TachUI's viewport management system with Window and WindowGroup components, showing how to create a multi-window document-based application.

## Live Example

```typescript
import { 
  App, 
  Window, 
  WindowGroup,
  useOpenWindow,
  useDismissWindow 
} from '@tachui/core/viewport'
import { 
  VStack, 
  HStack, 
  Text, 
  Button, 
  TextField, 
  List 
} from '@tachui/core'

// Document data model
class TextDocument {
  constructor(
    public id: string,
    public title: string,
    public content: string = '',
    public lastModified: Date = new Date()
  ) {}
}

// Document editor window
function DocumentEditor({ document }: { document: TextDocument }) {
  const [content, setContent] = createSignal(document.content)
  const [hasChanges, setHasChanges] = createSignal(false)
  const dismissWindow = useDismissWindow()
  
  const handleSave = () => {
    document.content = content()
    document.lastModified = new Date()
    setHasChanges(false)
    // Could integrate with persistence layer here
  }
  
  const handleClose = () => {
    if (hasChanges()) {
      const confirmed = confirm('You have unsaved changes. Close anyway?')
      if (!confirmed) return
    }
    dismissWindow(`document-${document.id}`)
  }
  
  return VStack({
    padding: 20,
    spacing: 16,
    children: [
      // Document header
      HStack({
        spacing: 12,
        children: [
          Text({ 
            content: () => document.title + (hasChanges() ? ' •' : ''),
            fontSize: 18,
            fontWeight: 'bold'
          }),
          Spacer(),
          Text({
            content: () => `Last saved: ${document.lastModified.toLocaleTimeString()}`,
            fontSize: 12,
            opacity: 0.7
          })
        ]
      }),
      
      // Text editor
      TextField({
        value: content,
        onChange: (value) => {
          setContent(value)
          setHasChanges(true)
        },
        placeholder: 'Start writing...',
        multiline: true,
        minHeight: 300
      }),
      
      // Action buttons
      HStack({
        spacing: 12,
        children: [
          Button({
            title: 'Save',
            action: handleSave,
            disabled: () => !hasChanges(),
            variant: 'primary'
          }),
          Button({
            title: 'Close',
            action: handleClose
          })
        ]
      })
    ]
  })
}

// Document browser window
function DocumentBrowser() {
  const [documents, setDocuments] = createSignal<TextDocument[]>([
    new TextDocument('1', 'Welcome.txt', 'Welcome to TachUI!'),
    new TextDocument('2', 'README.txt', 'This is a sample document.'),
    new TextDocument('3', 'Ideas.txt', 'Collect your thoughts here.')
  ])
  
  const openWindow = useOpenWindow()
  
  const createNewDocument = async () => {
    const doc = new TextDocument(
      Date.now().toString(),
      `Untitled-${documents().length + 1}.txt`
    )
    setDocuments(prev => [...prev, doc])
    
    // Open in new window using WindowGroup
    await DocumentApp.openScene('textEditor', doc)
  }
  
  const openDocument = async (doc: TextDocument) => {
    await DocumentApp.openScene('textEditor', doc)
  }
  
  const openSettings = async () => {
    await DocumentApp.openScene('settings')
  }
  
  return VStack({
    padding: 20,
    spacing: 16,
    children: [
      // Header
      HStack({
        children: [
          Text({ 
            content: 'Document Manager',
            fontSize: 20,
            fontWeight: 'bold'
          }),
          Spacer(),
          Button({
            title: 'Settings',
            action: openSettings
          })
        ]
      }),
      
      // New document button
      Button({
        title: '+ New Document',
        action: createNewDocument,
        variant: 'primary'
      }),
      
      // Document list
      List({
        items: documents,
        itemBuilder: (doc) => HStack({
          padding: 12,
          spacing: 12,
          children: [
            VStack({
              alignment: 'leading',
              spacing: 4,
              children: [
                Text({ 
                  content: doc.title,
                  fontWeight: 'medium'
                }),
                Text({
                  content: `Modified: ${doc.lastModified.toLocaleDateString()}`,
                  fontSize: 12,
                  opacity: 0.7
                })
              ]
            }),
            Spacer(),
            Button({
              title: 'Open',
              action: () => openDocument(doc)
            })
          ]
        })
      })
    ]
  })
}

// Settings window
function SettingsPanel() {
  const [autosave, setAutosave] = createSignal(true)
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
  const dismissWindow = useDismissWindow()
  
  return VStack({
    padding: 20,
    spacing: 16,
    children: [
      Text({ 
        content: 'Settings',
        fontSize: 18,
        fontWeight: 'bold'
      }),
      
      Toggle({
        title: 'Auto-save documents',
        isOn: autosave,
        onChange: setAutosave
      }),
      
      Picker({
        title: 'Theme',
        selection: theme,
        options: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        onChange: setTheme
      }),
      
      HStack({
        spacing: 12,
        children: [
          Spacer(),
          Button({
            title: 'Close',
            action: () => dismissWindow('settings')
          })
        ]
      })
    ]
  })
}

// Application definition
const DocumentApp = App({
  children: [
    // Main document browser
    Window({
      id: 'browser',
      title: 'Document Manager',
      width: 600,
      height: 500,
      children: () => DocumentBrowser()
    }),
    
    // Document editor windows (multiple instances)
    WindowGroup({
      id: 'textEditor',
      title: 'Text Editor',
      for: TextDocument,
      children: (document: TextDocument) => DocumentEditor({ document }),
      width: 800,
      height: 600,
      resizable: true
    }),
    
    // Settings window (singleton)
    Window({
      id: 'settings',
      title: 'Settings',
      width: 400,
      height: 300,
      modal: true,
      resizable: false,
      children: () => SettingsPanel()
    })
  ]
})

// Initialize and start the application
async function startApp() {
  await DocumentApp.initialize()
  await DocumentApp.openScene('browser') // Open main window
}

startApp()
```

## Key Features Demonstrated

### 1. Multi-Window Architecture

The example shows three types of windows:
- **Browser Window**: Main application window (singleton)
- **Editor Windows**: Document editing (multiple instances via WindowGroup)
- **Settings Window**: Modal configuration dialog (singleton)

### 2. Document Management

```typescript
// WindowGroup for multiple document instances
WindowGroup({
  id: 'textEditor',
  title: 'Text Editor',
  for: TextDocument,  // Type-safe data binding
  children: (document: TextDocument) => DocumentEditor({ document })
})

// Open specific document
await DocumentApp.openScene('textEditor', myDocument)
```

### 3. Window Communication

Windows can communicate through:
- Shared state management
- Event system
- Direct method calls

### 4. Lifecycle Management

```typescript
const handleClose = () => {
  if (hasChanges()) {
    const confirmed = confirm('You have unsaved changes. Close anyway?')
    if (!confirmed) return
  }
  dismissWindow(`document-${document.id}`)
}
```

## Platform Adaptations

The viewport system automatically adapts to different platforms:

### Desktop (Electron)
- Native BrowserWindow instances
- Full window management controls
- Multi-monitor support

### Web Browser
- Popup windows when supported
- Modal overlay fallbacks
- Portal rendering for embedded content

### Mobile
- Stack-based navigation
- Sheet presentations
- Gesture-based dismissal

## Usage Patterns

### Opening Windows

```typescript
// Using environment hook
const openWindow = useOpenWindow()
await openWindow('settings', SettingsPanel())

// Using app scene management
await DocumentApp.openScene('settings')
await DocumentApp.openScene('textEditor', document)

// Direct window methods
await SettingsWindow.open()
```

### Managing Window State

```typescript
// Check if window exists
const manager = useViewportManager()
const existing = manager.getWindow('settings')

if (existing) {
  // Focus existing window
  await existing.focus()
} else {
  // Open new window
  await openWindow('settings', SettingsPanel())
}
```

### Handling Multiple Documents

```typescript
// Get all windows in a group
const editorWindows = DocumentWindows.getWindows()
console.log(`${editorWindows.length} documents open`)

// Close all documents
await DocumentWindows.closeAll()
```

## Best Practices Shown

### 1. Data-Driven Windows
Use `WindowGroup` with typed data for document-based applications.

### 2. Proper State Management
Handle unsaved changes and prevent accidental data loss.

### 3. Responsive Design
Adapt UI and behavior based on platform capabilities.

### 4. Resource Cleanup
Properly dispose of resources when windows close.

## Extending the Example

### Add More Document Types

```typescript
class MarkdownDocument extends TextDocument {
  preview: string = ''
}

WindowGroup({
  id: 'markdownEditor',
  for: MarkdownDocument,
  children: (doc) => MarkdownEditor({ document: doc })
})
```

### Add Window Persistence

```typescript
// Save window positions and state
const saveWindowState = () => {
  const state = {
    openDocuments: documents().map(doc => doc.id),
    windowPositions: getWindowPositions()
  }
  localStorage.setItem('windowState', JSON.stringify(state))
}
```

### Add Cross-Window Communication

```typescript
// Broadcast changes to all windows
const broadcastDocumentUpdate = (document: TextDocument) => {
  const manager = useViewportManager()
  manager.broadcastMessage({
    type: 'document-updated',
    document: document.id
  })
}
```

This example provides a solid foundation for building multi-window applications with TachUI's viewport management system.