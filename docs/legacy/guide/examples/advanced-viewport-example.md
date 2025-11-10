# Advanced Viewport Management Example

This example demonstrates TachUI's advanced viewport management features including window grouping strategies, state synchronization, window pooling, and lifecycle management.

## Live Example: Advanced Document Editor

```typescript
import { 
  App, 
  Window, 
  WindowGroup,
  useOpenWindow,
  useViewportManager 
} from '@tachui/core/viewport'
import { 
  VStack, 
  HStack, 
  Text, 
  Button, 
  TextField, 
  List,
  Picker,
  Toggle,
  Divider
} from '@tachui/core'

// Document data models
class Document {
  constructor(
    public id: string,
    public title: string,
    public content: string = '',
    public lastModified: Date = new Date(),
    public projectId?: string
  ) {}
}

class Project {
  constructor(
    public id: string,
    public name: string,
    public theme: 'light' | 'dark' = 'light',
    public documents: Document[] = []
  ) {}
}

// Project-aware document editor with state synchronization
function DocumentEditor({ document }: { document: Document }) {
  const [content, setContent] = createSignal(document.content)
  const [hasChanges, setHasChanges] = createSignal(false)
  const [projectTheme, setProjectTheme] = createSignal<'light' | 'dark'>('light')
  const dismissWindow = useDismissWindow()
  
  // Get the window group for state sync
  const manager = useViewportManager()
  const projectGroup = manager.getWindowGroup(`project-${document.projectId}`)
  
  // Listen for project state changes
  createEffect(() => {
    if (projectGroup) {
      // Listen for theme changes across all project windows
      projectGroup.onStateChange('theme', (theme: 'light' | 'dark') => {
        setProjectTheme(theme)
        // Apply theme to editor
        applyTheme(theme)
      })
      
      // Get initial theme
      const currentTheme = projectGroup.getSharedState<'light' | 'dark'>('theme')
      if (currentTheme) {
        setProjectTheme(currentTheme)
      }
    }
  })
  
  const handleSave = () => {
    document.content = content()
    document.lastModified = new Date()
    setHasChanges(false)
    
    // Broadcast document update to other windows
    if (projectGroup) {
      projectGroup.syncState('documentUpdated', {
        documentId: document.id,
        timestamp: Date.now()
      })
    }
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
    backgroundColor: () => projectTheme() === 'dark' ? '#2a2a2a' : '#ffffff',
    children: [
      // Document header with project context
      HStack({
        spacing: 12,
        children: [
          VStack({
            alignment: 'leading',
            spacing: 4,
            children: [
              Text({ 
                content: () => document.title + (hasChanges() ? ' •' : ''),
                fontSize: 18,
                fontWeight: 'bold',
                color: () => projectTheme() === 'dark' ? '#ffffff' : '#000000'
              }),
              Text({
                content: `Project: ${document.projectId}`,
                fontSize: 12,
                opacity: 0.7,
                color: () => projectTheme() === 'dark' ? '#cccccc' : '#666666'
              })
            ]
          }),
          Spacer(),
          Text({
            content: () => `Synced • ${projectTheme()} theme`,
            fontSize: 12,
            opacity: 0.7,
            color: () => projectTheme() === 'dark' ? '#cccccc' : '#666666'
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
        minHeight: 400,
        backgroundColor: () => projectTheme() === 'dark' ? '#1a1a1a' : '#f8f8f8',
        color: () => projectTheme() === 'dark' ? '#ffffff' : '#000000'
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
            action: handleClose,
            backgroundColor: () => projectTheme() === 'dark' ? '#444444' : '#e0e0e0'
          })
        ]
      })
    ]
  })
}

// Project management with advanced window grouping
function ProjectManager() {
  const [projects, setProjects] = createSignal<Project[]>([
    new Project('1', 'Website Redesign'),
    new Project('2', 'Mobile App'),
    new Project('3', 'Documentation')
  ])
  
  const [selectedStrategy, setSelectedStrategy] = createSignal<'tabs' | 'cascade' | 'tile'>('tabs')
  const [poolingEnabled, setPoolingEnabled] = createSignal(true)
  const [maxInstances, setMaxInstances] = createSignal(8)
  const [globalTheme, setGlobalTheme] = createSignal<'light' | 'dark'>('light')
  
  const manager = useViewportManager()
  const openWindow = useOpenWindow()
  
  // Sync global theme across all projects
  createEffect(() => {
    manager.syncGlobalState('globalTheme', globalTheme())
  })
  
  const openProject = async (project: Project) => {
    // Create or get window group for this project
    const projectGroup = manager.createWindowGroup(`project-${project.id}`)
    
    // Configure the window group with Version 1.2 features
    projectGroup.setGroupingStrategy(selectedStrategy())
    
    // Configure tabbing for desktop
    projectGroup.configureTabbing({
      enabled: true,
      maxTabs: 12,
      tabPosition: 'top',
      allowDetach: true,
      allowReorder: true
    })
    
    // Configure window pooling
    projectGroup.configurePool({
      enabled: poolingEnabled(),
      maxPoolSize: 5,
      reuseThreshold: 30000, // 30 seconds
      keepAliveTime: 300000  // 5 minutes
    })
    
    // Enable state sync within project
    projectGroup.enableStateSync('group')
    projectGroup.setMaxInstances(maxInstances())
    
    // Set default window options
    projectGroup.setDefaultOptions({
      width: 900,
      height: 700,
      resizable: true
    })
    
    // Set project theme
    projectGroup.syncState('theme', project.theme)
    
    // Listen for group events
    projectGroup.onGroupEmpty(() => {
      console.log(`Project ${project.name} closed all windows`)
    })
    
    projectGroup.onGroupFull(() => {
      console.log(`Project ${project.name} reached maximum windows`)
      showNotification(`Maximum ${maxInstances()} windows reached for ${project.name}`)
    })
    
    // Open project overview window
    await ProjectOverview.openForData(project)
  }
  
  const createDocument = async (project: Project) => {
    const doc = new Document(
      `${Date.now()}`,
      `Document ${project.documents.length + 1}`,
      '',
      new Date(),
      project.id
    )
    
    project.documents.push(doc)
    setProjects([...projects()])
    
    // Open in project-specific window group
    const projectGroup = manager.getWindowGroup(`project-${project.id}`)
    if (projectGroup) {
      await projectGroup.openWindow(doc, (doc) => DocumentEditor({ document: doc }))
    }
  }
  
  return VStack({
    padding: 20,
    spacing: 20,
    children: [
      // Global settings
      VStack({
        spacing: 16,
        children: [
          Text({ 
            content: 'Project Manager - Version 1.2 Features',
            fontSize: 24,
            fontWeight: 'bold'
          }),
          
          Divider(),
          
          // Window grouping settings
          Text({ 
            content: 'Window Management',
            fontSize: 18,
            fontWeight: 'semibold'
          }),
          
          HStack({
            spacing: 16,
            children: [
              VStack({
                alignment: 'leading',
                spacing: 8,
                children: [
                  Text({ content: 'Grouping Strategy', fontSize: 14, fontWeight: 'medium' }),
                  Picker({
                    selection: selectedStrategy,
                    options: [
                      { value: 'tabs', title: 'Tabs (Desktop)' },
                      { value: 'cascade', title: 'Cascade Windows' },
                      { value: 'tile', title: 'Tile Layout' }
                    ],
                    onChange: setSelectedStrategy
                  })
                ]
              }),
              
              VStack({
                alignment: 'leading',
                spacing: 8,
                children: [
                  Text({ content: 'Max Windows', fontSize: 14, fontWeight: 'medium' }),
                  TextField({
                    value: () => maxInstances().toString(),
                    onChange: (val) => setMaxInstances(parseInt(val) || 8),
                    width: 80
                  })
                ]
              }),
              
              VStack({
                alignment: 'leading',
                spacing: 8,
                children: [
                  Toggle({
                    title: 'Window Pooling',
                    isOn: poolingEnabled,
                    onChange: setPoolingEnabled
                  }),
                  Toggle({
                    title: 'Dark Theme',
                    isOn: () => globalTheme() === 'dark',
                    onChange: (isDark) => setGlobalTheme(isDark ? 'dark' : 'light')
                  })
                ]
              })
            ]
          })
        ]
      }),
      
      Divider(),
      
      // Projects list
      VStack({
        spacing: 12,
        children: [
          Text({ 
            content: 'Projects',
            fontSize: 18,
            fontWeight: 'semibold'
          }),
          
          List({
            items: projects,
            itemBuilder: (project) => VStack({
              padding: 16,
              spacing: 12,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              children: [
                HStack({
                  children: [
                    VStack({
                      alignment: 'leading',
                      spacing: 4,
                      children: [
                        Text({ 
                          content: project.name,
                          fontSize: 16,
                          fontWeight: 'semibold'
                        }),
                        Text({
                          content: `${project.documents.length} documents`,
                          fontSize: 14,
                          opacity: 0.7
                        })
                      ]
                    }),
                    Spacer(),
                    Text({
                      content: `Theme: ${project.theme}`,
                      fontSize: 12,
                      opacity: 0.7
                    })
                  ]
                }),
                
                HStack({
                  spacing: 8,
                  children: [
                    Button({
                      title: 'Open Project',
                      action: () => openProject(project),
                      variant: 'primary'
                    }),
                    Button({
                      title: 'New Document',
                      action: () => createDocument(project)
                    }),
                    Button({
                      title: () => {
                        const group = manager.getWindowGroup(`project-${project.id}`)
                        const windowCount = group?.getAllWindows().length || 0
                        const poolCount = group?.getPooledWindows().length || 0
                        return `Windows: ${windowCount} (${poolCount} pooled)`
                      }
                    })
                  ]
                })
              ]
            })
          })
        ]
      })
    ]
  })
}

// Project overview with state synchronization
function ProjectOverview({ project }: { project: Project }) {
  const [selectedTool, setSelectedTool] = createSignal('edit')
  const [projectStats, setProjectStats] = createSignal({
    openWindows: 0,
    pooledWindows: 0,
    totalDocuments: project.documents.length
  })
  
  const manager = useViewportManager()
  const projectGroup = manager.getWindowGroup(`project-${project.id}`)
  
  // Listen for project state changes
  createEffect(() => {
    if (projectGroup) {
      // Listen for tool changes
      projectGroup.onStateChange('selectedTool', (tool: string) => {
        setSelectedTool(tool)
      })
      
      // Update stats periodically
      const updateStats = () => {
        setProjectStats({
          openWindows: projectGroup.getAllWindows().length,
          pooledWindows: projectGroup.getPooledWindows().length,
          totalDocuments: project.documents.length
        })
      }
      
      updateStats()
      const interval = setInterval(updateStats, 1000)
      
      onCleanup(() => clearInterval(interval))
    }
  })
  
  const syncTool = (tool: string) => {
    setSelectedTool(tool)
    if (projectGroup) {
      projectGroup.syncState('selectedTool', tool)
    }
  }
  
  return VStack({
    padding: 20,
    spacing: 16,
    children: [
      Text({ 
        content: `${project.name} - Overview`,
        fontSize: 20,
        fontWeight: 'bold'
      }),
      
      // Project stats
      HStack({
        spacing: 20,
        children: [
          VStack({
            alignment: 'center',
            children: [
              Text({ content: () => projectStats().openWindows.toString(), fontSize: 24, fontWeight: 'bold' }),
              Text({ content: 'Open Windows', fontSize: 12 })
            ]
          }),
          VStack({
            alignment: 'center',
            children: [
              Text({ content: () => projectStats().pooledWindows.toString(), fontSize: 24, fontWeight: 'bold' }),
              Text({ content: 'Pooled', fontSize: 12 })
            ]
          }),
          VStack({
            alignment: 'center',
            children: [
              Text({ content: () => projectStats().totalDocuments.toString(), fontSize: 24, fontWeight: 'bold' }),
              Text({ content: 'Documents', fontSize: 12 })
            ]
          })
        ]
      }),
      
      Divider(),
      
      // Synchronized tool selection
      VStack({
        spacing: 12,
        children: [
          Text({ content: 'Shared Tool (synced across all windows)', fontSize: 16, fontWeight: 'medium' }),
          
          HStack({
            spacing: 8,
            children: [
              Button({
                title: 'Edit',
                action: () => syncTool('edit'),
                variant: () => selectedTool() === 'edit' ? 'primary' : 'secondary'
              }),
              Button({
                title: 'Review',
                action: () => syncTool('review'),
                variant: () => selectedTool() === 'review' ? 'primary' : 'secondary'
              }),
              Button({
                title: 'Comment',
                action: () => syncTool('comment'),
                variant: () => selectedTool() === 'comment' ? 'primary' : 'secondary'
              })
            ]
          }),
          
          Text({ 
            content: () => `Current tool: ${selectedTool()} (synced to ${projectStats().openWindows} windows)`,
            fontSize: 14,
            opacity: 0.7
          })
        ]
      })
    ]
  })
}

// Enhanced application with Version 1.2 features
const AdvancedApp = App({
  children: [
    // Main project manager
    Window({
      id: 'project-manager',
      title: 'Advanced Project Manager',
      width: 800,
      height: 600,
      children: () => ProjectManager()
    }),
    
    // Project overview windows (one per project)
    WindowGroup({
      id: 'project-overview',
      title: 'Project Overview',
      for: Project,
      children: (project: Project) => ProjectOverview({ project }),
      width: 600,
      height: 400,
      // Version 1.2: Configure grouping strategy
      groupingStrategy: 'stack', // Each project gets its own overview
      // Version 1.2: No pooling for overview windows
      poolConfig: { enabled: false }
    })
  ]
})

// Initialize application with analytics
async function startAdvancedApp() {
  await AdvancedApp.initialize()
  
  // Set up global viewport analytics
  const manager = useViewportManager()
  
  manager.onWindowOpened((window) => {
    console.log(`Window opened: ${window.id}`)
    analytics.track('window_opened', { windowId: window.id })
  })
  
  manager.onWindowClosed((windowId) => {
    console.log(`Window closed: ${windowId}`)
    analytics.track('window_closed', { windowId })
  })
  
  // Open main window
  await AdvancedApp.openScene('project-manager')
}

// Start the application
startAdvancedApp()
```

## Key Version 1.2 Features Demonstrated

### 1. Window Grouping Strategies

```typescript
// Configure different grouping strategies
projectGroup.setGroupingStrategy('tabs')     // Desktop-style tabs
projectGroup.setGroupingStrategy('cascade')  // Cascaded windows
projectGroup.setGroupingStrategy('tile')     // Grid layout
```

### 2. State Synchronization

```typescript
// Group-level state sync
projectGroup.syncState('selectedTool', 'edit')
projectGroup.onStateChange('selectedTool', (tool) => {
  updateUI(tool)
})

// Global state sync
manager.syncGlobalState('globalTheme', 'dark')
```

### 3. Window Pooling

```typescript
projectGroup.configurePool({
  enabled: true,
  maxPoolSize: 5,
  reuseThreshold: 30000,
  keepAliveTime: 300000
})

// Check pool status
const pooledWindows = projectGroup.getPooledWindows()
```

### 4. Lifecycle Events

```typescript
projectGroup.onWindowCreated((window) => {
  analytics.track('window_created')
})

projectGroup.onGroupEmpty(() => {
  console.log('All project windows closed')
})

projectGroup.onWindowReused((window, previousData) => {
  cleanupWindowState(window)
})
```

### 5. Tab Configuration

```typescript
projectGroup.configureTabbing({
  enabled: true,
  maxTabs: 12,
  tabPosition: 'top',
  allowDetach: true,
  allowReorder: true
})
```

## Advanced Patterns

### 1. Project-Based Window Groups

Each project gets its own window group with isolated state synchronization.

### 2. Performance Optimization

Window pooling reduces memory usage and improves open/close performance.

### 3. User Experience

- Synchronized themes across all project windows
- Shared tool state for consistent editing experience
- Visual feedback for window management state

### 4. Analytics Integration

Track window lifecycle events for usage analytics.

## Platform Adaptations

### Desktop
- Native window tabbing
- Full cascade/tile arrangements
- Multi-monitor support

### Web
- Modal tab containers
- Optimized pooling for browser limits
- Responsive layout adaptations

### Mobile
- Sheet-based presentation
- Touch-optimized controls
- Reduced feature set for performance

This example showcases the advanced capabilities of TachUI's Version 1.2 viewport management, demonstrating how complex multi-window applications can be built with sophisticated state management and user experience features.