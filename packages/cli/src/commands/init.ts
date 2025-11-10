/**
 * Tacho CLI - Init Command
 *
 * Initialize new TachUI projects with smart templates and Phase 6 features
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import ora from 'ora'
import prompts from 'prompts'

interface ProjectTemplate {
  name: string
  description: string
  features: string[]
  files: { [path: string]: string }
}

const templates: Record<string, ProjectTemplate> = {
  basic: {
    name: 'Basic TachUI App',
    description: 'Simple TachUI application with core components',
    features: ['Text & Button components', 'Layout system', 'Modifiers'],
    files: {
      'package.json': JSON.stringify(
        {
          name: '{projectName}',
          version: '1.0.0',
          description: 'TachUI application',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
            typecheck: 'tsc --noEmit',
          },
          dependencies: {
            '@tachui/core': '^0.1.0',
            '@tachui/forms': '^0.1.0',
          },
          devDependencies: {
            vite: '^5.0.0',
            typescript: '^5.0.0',
            '@types/node': '^20.0.0',
          },
        },
        null,
        2
      ),

      'vite.config.ts': `import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020'
  }
})`,

      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            moduleResolution: 'bundler',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            jsx: 'preserve',
            declaration: true,
            strict: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      ),

      'src/main.ts': `import { mount } from '@tachui/core'
import { App } from './App'

// Mount the app
mount('#app', App())`,

      'src/App.ts': `import { Layout, Text, Button } from '@tachui/core'

export function App() {
  return Layout.VStack({
    children: [
      Text('Welcome to TachUI!')
        .fontSize(32)
        .fontWeight('bold')
        .foregroundColor('#007AFF')
        .margin({ bottom: 16 })
        .build(),
      
      Text('SwiftUI-inspired web development')
        .fontSize(18)
        .foregroundColor('#666')
        .margin({ bottom: 24 })
        .build(),
      
      Button({
        title: 'Get Started',
        onTap: () => console.log('Hello TachUI!')
      })
      .backgroundColor('#007AFF')
      .foregroundColor('#ffffff')
      .padding(16, 32)
      .cornerRadius(8)
      .build()
    ],
    spacing: 0,
    alignment: 'center'
  })
  .frame(undefined, '100vh')
  .justifyContent('center')
  .alignItems('center')
  .backgroundColor('#f5f5f7')
  .build()
}`,

      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{projectName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,

      'README.md': `# {projectName}

A TachUI application built with SwiftUI-inspired components and reactive architecture.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run typecheck\` - Type check without building

## Learn More

- [TachUI Documentation](https://github.com/whoughton/TachUI)
- [TachUI Examples](https://github.com/whoughton/TachUI/tree/main/examples)
`,
    },
  },

  phase6: {
    name: 'Phase 6 Features App',
    description: 'Complete app with state management, lifecycle, and navigation',
    features: [
      '@State & @ObservedObject',
      'Lifecycle modifiers',
      'NavigationView & TabView',
      'Real-world patterns',
    ],
    files: {
      'package.json': JSON.stringify(
        {
          name: '{projectName}',
          version: '1.0.0',
          description: 'TachUI Phase 6 application with advanced features',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
            typecheck: 'tsc --noEmit',
          },
          dependencies: {
            '@tachui/core': '^0.1.0',
            '@tachui/forms': '^0.1.0',
          },
          devDependencies: {
            vite: '^5.0.0',
            typescript: '^5.0.0',
            '@types/node': '^20.0.0',
          },
        },
        null,
        2
      ),

      'vite.config.ts': `import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020'
  }
})`,

      'tsconfig.json': JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            moduleResolution: 'bundler',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            jsx: 'preserve',
            declaration: true,
            strict: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2
      ),

      'src/main.ts': `import { mount } from '@tachui/core'
import { App } from './App'

// Mount the app
mount('#app', App())`,

      'src/App.ts': `import { TabView, createTabItem } from '@tachui/core/navigation'
import { State } from '@tachui/core/state'
import { HomeScreen } from './screens/HomeScreen'
import { TodoScreen } from './screens/TodoScreen'
import { SettingsScreen } from './screens/SettingsScreen'

export function App() {
  const selectedTab = State('home')
  
  const tabs = [
    createTabItem(
      'home',
      'Home',
      HomeScreen(),
      { icon: '🏠' }
    ),
    createTabItem(
      'todos',
      'Todos',
      TodoScreen(),
      { icon: '📝' }
    ),
    createTabItem(
      'settings',
      'Settings', 
      SettingsScreen(),
      { icon: '⚙️' }
    )
  ]
  
  return TabView(tabs, {
    selection: selectedTab.projectedValue,
    tabPlacement: 'bottom',
    accentColor: '#007AFF'
  })
}`,

      'src/screens/HomeScreen.ts': `import { Layout, Text, Button } from '@tachui/core'
import { State } from '@tachui/core/state'

export function HomeScreen() {
  const welcomeMessage = State('Welcome to TachUI Phase 6!')
  const clickCount = State(0)
  
  return Layout.VStack({
    children: [
      Text(() => welcomeMessage.wrappedValue)
        .fontSize(28)
        .fontWeight('bold')
        .foregroundColor('#007AFF')
        .textAlign('center')
        .margin({ bottom: 24 })
        .build(),
      
      Text('This app demonstrates all Phase 6 features:')
        .fontSize(18)
        .foregroundColor('#333')
        .margin({ bottom: 16 })
        .build(),
      
      Layout.VStack({
        children: [
          Text('✅ @State reactive property wrapper'),
          Text('✅ Lifecycle modifiers (onAppear, task)'),
          Text('✅ TabView navigation system'),
          Text('✅ Real-world component patterns')
        ].map(text => 
          text.fontSize(16)
            .foregroundColor('#666')
            .padding({ vertical: 4 })
            .build()
        ),
        spacing: 4,
        alignment: 'leading'
      }),
      
      Button({
        title: \`Clicked \${() => clickCount.wrappedValue} times\`,
        onTap: () => clickCount.wrappedValue++
      })
      .backgroundColor('#007AFF')
      .foregroundColor('#ffffff')
      .padding(16, 24)
      .cornerRadius(8)
      .margin({ top: 32 })
      .build()
    ],
    spacing: 0,
    alignment: 'center'
  })
  .padding(24)
  .onAppear(() => {
    console.log('Home screen appeared!')
  })
  .task(async () => {
    // Simulate loading welcome message
    await new Promise(resolve => setTimeout(resolve, 1000))
    welcomeMessage.wrappedValue = 'Welcome to TachUI Phase 6! 🚀'
  })
  .build()
}`,

      'src/screens/TodoScreen.ts': `import { Layout, Text, Button } from '@tachui/core'
import { TextField } from '@tachui/forms'
import { State, ObservableObjectBase, ObservedObject } from '@tachui/core/state'

class TodoItem extends ObservableObjectBase {
  constructor(
    public id: string,
    private _text: string,
    private _completed: boolean = false
  ) {
    super()
  }
  
  get text() { return this._text }
  set text(value: string) {
    this._text = value
    this.notifyChange()
  }
  
  get completed() { return this._completed }
  set completed(value: boolean) {
    this._completed = value
    this.notifyChange()
  }
  
  toggle() {
    this.completed = !this.completed
  }
}

class TodoStore extends ObservableObjectBase {
  private _items: TodoItem[] = []
  
  get items() { return this._items }
  
  addItem(text: string) {
    const item = new TodoItem(Date.now().toString(), text)
    this._items.push(item)
    this.notifyChange()
  }
  
  removeItem(id: string) {
    this._items = this._items.filter(item => item.id !== id)
    this.notifyChange()
  }
  
  get completedCount() {
    return this._items.filter(item => item.completed).length
  }
}

export function TodoScreen() {
  const todoStore = ObservedObject(new TodoStore())
  const newTodoText = State('')
  
  const addTodo = () => {
    if (newTodoText.wrappedValue.trim()) {
      todoStore.wrappedValue.addItem(newTodoText.wrappedValue)
      newTodoText.wrappedValue = ''
    }
  }
  
  return Layout.VStack({
    children: [
      Text('My Todos')
        .fontSize(28)
        .fontWeight('bold')
        .margin({ bottom: 16 })
        .build(),
      
      Text(() => \`\${todoStore.wrappedValue.completedCount} of \${todoStore.wrappedValue.items.length} completed\`)
        .fontSize(16)
        .foregroundColor('#666')
        .margin({ bottom: 20 })
        .build(),
      
      Layout.HStack({
        children: [
          TextField({
            placeholder: 'Enter new todo',
            text: newTodoText.projectedValue
          })
          .flexGrow(1)
          .build(),
          
          Button({
            title: 'Add',
            onTap: addTodo
          })
          .backgroundColor('#007AFF')
          .foregroundColor('#ffffff')
          .padding(8, 16)
          .cornerRadius(6)
          .build()
        ],
        spacing: 12
      }),
      
      Layout.VStack({
        children: todoStore.wrappedValue.items.map(item => {
          const observedItem = ObservedObject(item)
          
          return Layout.HStack({
            children: [
              Button({
                title: observedItem.wrappedValue.completed ? '✅' : '⬜',
                onTap: () => observedItem.wrappedValue.toggle()
              })
              .backgroundColor('transparent')
              .border(0)
              .padding(0)
              .build(),
              
              Text(() => observedItem.wrappedValue.text)
                .fontSize(16)
                .foregroundColor(observedItem.wrappedValue.completed ? '#999' : '#333')
                .textDecoration(observedItem.wrappedValue.completed ? 'line-through' : 'none')
                .flexGrow(1)
                .build(),
              
              Button({
                title: '🗑️',
                onTap: () => todoStore.wrappedValue.removeItem(observedItem.wrappedValue.id)
              })
              .backgroundColor('transparent')
              .border(0)
              .padding(0)
              .build()
            ],
            spacing: 12,
            alignment: 'center'
          })
          .backgroundColor('#f8f9fa')
          .padding(12)
          .cornerRadius(8)
          .margin({ bottom: 8 })
          .build()
        }),
        spacing: 0
      })
      .margin({ top: 20 })
      .build()
    ],
    spacing: 0
  })
  .padding(24)
  .build()
}`,

      'src/screens/SettingsScreen.ts': `import { Layout, Text } from '@tachui/core'
import { State } from '@tachui/core/state'

export function SettingsScreen() {
  const version = State('1.0.0')
  
  return Layout.VStack({
    children: [
      Text('Settings')
        .fontSize(28)
        .fontWeight('bold')
        .margin({ bottom: 32 })
        .build(),
      
      Layout.VStack({
        children: [
          Text('App Information')
            .fontSize(20)
            .fontWeight('semibold')
            .margin({ bottom: 16 })
            .build(),
          
          Layout.HStack({
            children: [
              Text('Version:')
                .fontSize(16)
                .foregroundColor('#666')
                .build(),
              
              Text(() => version.wrappedValue)
                .fontSize(16)
                .fontWeight('medium')
                .build()
            ],
            spacing: 8,
            alignment: 'center'
          }),
          
          Layout.HStack({
            children: [
              Text('Framework:')
                .fontSize(16)
                .foregroundColor('#666')
                .build(),
              
              Text('TachUI Phase 6')
                .fontSize(16)
                .fontWeight('medium')
                .build()
            ],
            spacing: 8,
            alignment: 'center'
          }),
          
          Text('Built with SwiftUI-inspired components and reactive state management')
            .fontSize(14)
            .foregroundColor('#999')
            .textAlign('center')
            .margin({ top: 24 })
            .build()
        ],
        spacing: 12,
        alignment: 'leading'
      })
    ],
    spacing: 0
  })
  .padding(24)
  .build()
}`,

      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{projectName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f5f7;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,

      'README.md': `# {projectName}

A complete TachUI application showcasing Phase 6 features:

- **@State**: Reactive local state management
- **@ObservedObject**: External object observation
- **Lifecycle Modifiers**: onAppear, task, refreshable
- **Navigation**: TabView with multiple screens
- **Real-world Patterns**: Todo app with persistent state

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features Demonstrated

### State Management
- Local reactive state with \`@State\`
- Observable objects with \`@ObservedObject\`
- Property wrapper patterns from SwiftUI

### Lifecycle Management
- \`onAppear\` for component initialization
- \`task\` for async operations with automatic cancellation
- Component lifecycle integration

### Navigation System
- \`TabView\` for tab-based navigation
- Multiple screens with state preservation
- SwiftUI-style navigation patterns

### Real-world Patterns
- Todo application with CRUD operations
- Observable data models
- Reactive UI updates
- Component composition

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production  
- \`npm run preview\` - Preview production build
- \`npm run typecheck\` - Type check without building

## Learn More

- [TachUI Documentation](https://github.com/whoughton/TachUI)
- [Phase 6 Features Guide](https://github.com/whoughton/TachUI/blob/main/docs/api/phase-6-features.md)
`,
    },
  },
}

export const initCommand = new Command('init')
  .description('Initialize a new TachUI project')
  .argument('[project-name]', 'Project name')
  .option('-t, --template <template>', 'Project template (basic, phase6)', 'basic')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (projectName?: string, options?: { template?: string; yes?: boolean }) => {
    try {
      let finalProjectName = projectName
      let selectedTemplate = options?.template || 'basic'

      // Interactive prompts if not using --yes flag
      if (!options?.yes) {
        const response = await prompts([
          {
            type: 'text',
            name: 'projectName',
            message: 'Project name:',
            initial: projectName || 'my-tachui-app',
            validate: (value) => (value.length > 0 ? true : 'Project name is required'),
          },
          {
            type: 'select',
            name: 'template',
            message: 'Choose a template:',
            choices: Object.entries(templates).map(([key, template]) => ({
              title: template.name,
              description: template.description,
              value: key,
            })),
            initial: selectedTemplate === 'phase6' ? 1 : 0,
          },
        ])

        if (!response.projectName) {
          console.log(chalk.yellow('Operation cancelled'))
          return
        }

        finalProjectName = response.projectName
        selectedTemplate = response.template
      }

      if (!finalProjectName) {
        console.error(chalk.red('Project name is required'))
        process.exit(1)
      }

      const template = templates[selectedTemplate]
      if (!template) {
        console.error(chalk.red(`Template "${selectedTemplate}" not found`))
        process.exit(1)
      }

      const projectPath = resolve(finalProjectName)

      // Check if directory already exists
      if (existsSync(projectPath)) {
        console.error(chalk.red(`Directory "${finalProjectName}" already exists`))
        process.exit(1)
      }

      const spinner = ora('Creating TachUI project...').start()

      // Create project directory
      mkdirSync(projectPath, { recursive: true })

      // Create all template files
      for (const [filePath, content] of Object.entries(template.files)) {
        const fullPath = join(projectPath, filePath)
        const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))

        // Create directory if it doesn't exist
        if (dir !== projectPath) {
          mkdirSync(dir, { recursive: true })
        }

        // Replace template variables
        const processedContent = content.replace(/{projectName}/g, finalProjectName)

        writeFileSync(fullPath, processedContent)
      }

      spinner.succeed('TachUI project created successfully!')

      // Success message with features
      console.log(`
${chalk.green('✅ Project created:')} ${chalk.cyan(finalProjectName)}
${chalk.green('📁 Location:')} ${projectPath}
${chalk.green('🎨 Template:')} ${template.name}

${chalk.yellow('Features included:')}
${template.features.map((feature) => `  • ${feature}`).join('\n')}

${chalk.yellow('Next steps:')}
  cd ${finalProjectName}
  npm install
  npm run dev

${chalk.green('Happy coding with TachUI! 🚀')}
`)
    } catch (error) {
      console.error(chalk.red('Error creating project:'), (error as Error).message)
      process.exit(1)
    }
  })
