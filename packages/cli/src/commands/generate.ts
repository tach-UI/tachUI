/**
 * Tacho CLI - Generate Command
 *
 * Code generation and scaffolding for TachUI components with Phase 6 patterns
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import ora from 'ora'
import prompts from 'prompts'

interface GeneratorTemplate {
  name: string
  description: string
  prompts: prompts.PromptObject[]
  generate: (answers: Record<string, unknown>, componentName: string) => { [path: string]: string }
}

const generators: Record<string, GeneratorTemplate> = {
  component: {
    name: 'Basic Component',
    description: 'Generate a basic TachUI component with modifiers',
    prompts: [
      {
        type: 'text',
        name: 'description',
        message: 'Component description:',
        initial: 'A TachUI component',
      },
      {
        type: 'confirm',
        name: 'withState',
        message: 'Include @State example?',
        initial: true,
      },
      {
        type: 'confirm',
        name: 'withModifiers',
        message: 'Include modifier examples?',
        initial: true,
      },
    ],
    generate: (answers, componentName) => ({
      [`src/components/${componentName}.ts`]: `import { Layout, Text, Button } from '@tachui/core'${
        answers.withState
          ? `
import { State } from '@tachui/core/state'`
          : ''
      }

/**
 * ${componentName}
 * 
 * ${answers.description}
 */
export function ${componentName}() {${
        answers.withState
          ? `
  const isActive = State(false)`
          : ''
      }

  return Layout.VStack({
    children: [
      Text('${componentName} Component')${
        answers.withModifiers
          ? `
        .fontSize(20)
        .fontWeight('bold')
        .foregroundColor('#007AFF')
        .build()`
          : ''
      },${
        answers.withState
          ? `
      
      Text(() => \`Status: \${isActive.wrappedValue ? 'Active' : 'Inactive'}\`)${
        answers.withModifiers
          ? `
        .fontSize(16)
        .foregroundColor('#666')
        .margin({ bottom: 16 })
        .build()`
          : ''
      },
      
      Button({
        title: 'Toggle State',
        onTap: () => isActive.wrappedValue = !isActive.wrappedValue
      })${
        answers.withModifiers
          ? `
      .backgroundColor('#007AFF')
      .foregroundColor('#ffffff')
      .padding(12, 24)
      .cornerRadius(8)
      .build()`
          : ''
      }`
          : ''
      }
    ],
    spacing: 12,
    alignment: 'center'
  })${
    answers.withModifiers
      ? `
  .padding(24)
  .backgroundColor('#f8f9fa')
  .cornerRadius(12)
  .build()`
      : ''
  }
}`,
    }),
  },

  screen: {
    name: 'Screen Component',
    description: 'Generate a screen component with navigation support',
    prompts: [
      {
        type: 'text',
        name: 'description',
        message: 'Screen description:',
        initial: 'A TachUI screen',
      },
      {
        type: 'confirm',
        name: 'withNavigation',
        message: 'Include navigation examples?',
        initial: true,
      },
      {
        type: 'confirm',
        name: 'withLifecycle',
        message: 'Include lifecycle modifiers?',
        initial: true,
      },
      {
        type: 'confirm',
        name: 'withState',
        message: 'Include state management?',
        initial: true,
      },
    ],
    generate: (answers, componentName) => ({
      [`src/screens/${componentName}.ts`]: `import { Layout, Text, Button } from '@tachui/core'${
        answers.withState
          ? `
import { State } from '@tachui/core/state'`
          : ''
      }${
        answers.withNavigation
          ? `
import { NavigationLink, useNavigation } from '@tachui/navigation'`
          : ''
      }

/**
 * ${componentName}
 * 
 * ${answers.description}
 */
export function ${componentName}() {${
        answers.withState
          ? `
  const isLoading = State(false)
  const data = State<string>('')`
          : ''
      }${
        answers.withNavigation
          ? `
  const navigation = useNavigation()`
          : ''
      }

  return Layout.VStack({
    children: [
      Text('${componentName}')
        .fontSize(28)
        .fontWeight('bold')
        .textAlign('center')
        .margin({ bottom: 24 })
        .build(),${
          answers.withState
            ? `
      
      Text(() => isLoading.wrappedValue ? 'Loading...' : 'Ready')
        .fontSize(18)
        .foregroundColor('#666')
        .margin({ bottom: 16 })
        .build(),`
            : ''
        }${
          answers.withNavigation
            ? `
      
      NavigationLink(
        () => DetailScreen(),
        Text('Go to Detail')
          .fontSize(16)
          .foregroundColor('#007AFF')
          .build()
      ),
      
      Button({
        title: 'Go Back',
        onTap: () => navigation.pop()
      })
      .backgroundColor('#f0f0f0')
      .foregroundColor('#333')
      .padding(12, 24)
      .cornerRadius(8)
      .margin({ top: 16 })
      .build()`
            : ''
        }
    ],
    spacing: 0,
    alignment: 'center'
  })
  .padding(24)
  .frame(undefined, '100vh')
  .justifyContent('center')${
    answers.withLifecycle
      ? `
  .onAppear(() => {
    console.log('${componentName} appeared')${
      answers.withState
        ? `
    isLoading.wrappedValue = true`
        : ''
    }
  })${
    answers.withState
      ? `
  .task(async () => {
    // Simulate data loading
    await new Promise(resolve => setTimeout(resolve, 1000))
    data.wrappedValue = 'Loaded data for ${componentName}'
    isLoading.wrappedValue = false
  })`
      : ''
  }`
      : ''
  }
  .build()
}`,
    }),
  },

  store: {
    name: 'Observable Store',
    description: 'Generate a store class with @ObservedObject pattern',
    prompts: [
      {
        type: 'text',
        name: 'description',
        message: 'Store description:',
        initial: 'A data store',
      },
      {
        type: 'text',
        name: 'dataType',
        message: 'Primary data type:',
        initial: 'string',
      },
      {
        type: 'confirm',
        name: 'withCRUD',
        message: 'Include CRUD operations?',
        initial: true,
      },
      {
        type: 'confirm',
        name: 'withPersistence',
        message: 'Include localStorage persistence?',
        initial: false,
      },
    ],
    generate: (answers, componentName) => {
      const storeName = componentName
      // const itemName = componentName.replace(/Store$/, '')

      return {
        [`src/stores/${storeName}.ts`]: `import { ObservableObjectBase } from '@tachui/core/state'

/**
 * ${storeName}
 * 
 * ${answers.description}
 */
export class ${storeName} extends ObservableObjectBase {
  private _items: ${answers.dataType}[] = []${
    answers.withPersistence
      ? `
  private readonly STORAGE_KEY = '${storeName.toLowerCase()}_data'`
      : ''
  }

  constructor() {
    super()${
      answers.withPersistence
        ? `
    this.loadFromStorage()`
        : ''
    }
  }

  get items(): ${answers.dataType}[] {
    return this._items
  }

  get count(): number {
    return this._items.length
  }${
    answers.withCRUD
      ? `

  add(item: ${answers.dataType}): void {
    this._items.push(item)
    this.notifyChange()${
      answers.withPersistence
        ? `
    this.saveToStorage()`
        : ''
    }
  }

  remove(index: number): void {
    if (index >= 0 && index < this._items.length) {
      this._items.splice(index, 1)
      this.notifyChange()${
        answers.withPersistence
          ? `
      this.saveToStorage()`
          : ''
      }
    }
  }

  update(index: number, item: ${answers.dataType}): void {
    if (index >= 0 && index < this._items.length) {
      this._items[index] = item
      this.notifyChange()${
        answers.withPersistence
          ? `
      this.saveToStorage()`
          : ''
      }
    }
  }

  clear(): void {
    this._items = []
    this.notifyChange()${
      answers.withPersistence
        ? `
    this.saveToStorage()`
        : ''
    }
  }`
      : ''
  }${
    answers.withPersistence
      ? `

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._items))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this._items = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
      this._items = []
    }
  }`
      : ''
  }
}

// Example usage:
// const store = new ${storeName}()
// const observedStore = ObservedObject(store)
// 
// In component:
// observedStore.wrappedValue.add("new item")
`,
      }
    },
  },

  form: {
    name: 'Form Component',
    description: 'Generate a form component with validation',
    prompts: [
      {
        type: 'text',
        name: 'description',
        message: 'Form description:',
        initial: 'A form component',
      },
      {
        type: 'confirm',
        name: 'withValidation',
        message: 'Include form validation?',
        initial: true,
      },
      {
        type: 'confirm',
        name: 'withSubmission',
        message: 'Include form submission handler?',
        initial: true,
      },
    ],
    generate: (answers, componentName) => ({
      [`src/components/${componentName}.ts`]: `import { Layout, Text, Button } from '@tachui/core'
import { TextField } from '@tachui/forms'
import { State } from '@tachui/core/state'

/**
 * ${componentName}
 * 
 * ${answers.description}
 */
export function ${componentName}() {
  const formData = State({
    name: '',
    email: '',
    message: ''
  })
  
  const isSubmitting = State(false)${
    answers.withValidation
      ? `
  const errors = State<Record<string, string>>({})`
      : ''
  }${
    answers.withValidation
      ? `

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.wrappedValue.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.wrappedValue.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.wrappedValue.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.wrappedValue.message.trim()) {
      newErrors.message = 'Message is required'
    }
    
    errors.wrappedValue = newErrors
    return Object.keys(newErrors).length === 0
  }`
      : ''
  }${
    answers.withSubmission
      ? `

  const handleSubmit = async () => {${
    answers.withValidation
      ? `
    if (!validateForm()) {
      return
    }`
      : ''
  }
    
    isSubmitting.wrappedValue = true
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Form submitted:', formData.wrappedValue)
      
      // Reset form
      formData.wrappedValue = {
        name: '',
        email: '',
        message: ''
      }${
        answers.withValidation
          ? `
      
      errors.wrappedValue = {}`
          : ''
      }
      
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      isSubmitting.wrappedValue = false
    }
  }`
      : ''
  }

  return Layout.VStack({
    children: [
      Text('${componentName}')
        .fontSize(24)
        .fontWeight('bold')
        .margin({ bottom: 24 })
        .build(),
      
      // Name field
      Layout.VStack({
        children: [
          Text('Name')
            .fontSize(16)
            .fontWeight('medium')
            .margin({ bottom: 8 })
            .build(),
          
          TextField({
            placeholder: 'Enter your name',
            text: formData.projectedValue.map(
              (data) => data.name,
              (newName, data) => ({ ...data, name: newName })
            )
          })
          .padding(12)
          .border('1px solid #ddd')
          .cornerRadius(8)
          .build(),${
            answers.withValidation
              ? `
          
          ...(errors.wrappedValue.name ? [
            Text(errors.wrappedValue.name)
              .fontSize(14)
              .foregroundColor('#ef4444')
              .margin({ top: 4 })
              .build()
          ] : [])`
              : ''
          }
        ],
        spacing: 0,
        alignment: 'leading'
      }),
      
      // Email field
      Layout.VStack({
        children: [
          Text('Email')
            .fontSize(16)
            .fontWeight('medium')
            .margin({ bottom: 8 })
            .build(),
          
          TextField({
            placeholder: 'Enter your email',
            text: formData.projectedValue.map(
              (data) => data.email,
              (newEmail, data) => ({ ...data, email: newEmail })
            )
          })
          .padding(12)
          .border('1px solid #ddd')
          .cornerRadius(8)
          .build(),${
            answers.withValidation
              ? `
          
          ...(errors.wrappedValue.email ? [
            Text(errors.wrappedValue.email)
              .fontSize(14)
              .foregroundColor('#ef4444')
              .margin({ top: 4 })
              .build()
          ] : [])`
              : ''
          }
        ],
        spacing: 0,
        alignment: 'leading'
      }),
      
      // Message field
      Layout.VStack({
        children: [
          Text('Message')
            .fontSize(16)
            .fontWeight('medium')
            .margin({ bottom: 8 })
            .build(),
          
          TextField({
            placeholder: 'Enter your message',
            text: formData.projectedValue.map(
              (data) => data.message,
              (newMessage, data) => ({ ...data, message: newMessage })
            )
          })
          .padding(12)
          .border('1px solid #ddd')
          .cornerRadius(8)
          .minHeight(100)
          .build(),${
            answers.withValidation
              ? `
          
          ...(errors.wrappedValue.message ? [
            Text(errors.wrappedValue.message)
              .fontSize(14)
              .foregroundColor('#ef4444')
              .margin({ top: 4 })
              .build()
          ] : [])`
              : ''
          }
        ],
        spacing: 0,
        alignment: 'leading'
      }),
      
      // Submit button
      Button({
        title: isSubmitting.wrappedValue ? 'Submitting...' : 'Submit',
        onTap: ${answers.withSubmission ? 'handleSubmit' : '() => console.log("Form submitted:", formData.wrappedValue)'},
        disabled: isSubmitting.wrappedValue
      })
      .backgroundColor(isSubmitting.wrappedValue ? '#ccc' : '#007AFF')
      .foregroundColor('#ffffff')
      .padding(16, 32)
      .cornerRadius(8)
      .margin({ top: 24 })
      .build()
    ],
    spacing: 16,
    alignment: 'stretch'
  })
  .padding(24)
  .maxWidth(500)
  .build()
}`,
    }),
  },
}

export const generateCommand = new Command('generate')
  .description('Generate TachUI components and code')
  .alias('g')
  .argument('[type]', 'Generator type (component, screen, store, form)')
  .argument('[name]', 'Component name')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-d, --dir <directory>', 'Output directory')
  .action(async (type?: string, name?: string, options?: { yes?: boolean; dir?: string }) => {
    try {
      let selectedType = type
      let componentName = name

      // Show available generators if no type specified
      if (!selectedType) {
        const response = await prompts({
          type: 'select',
          name: 'type',
          message: 'What would you like to generate?',
          choices: Object.entries(generators).map(([key, generator]) => ({
            title: generator.name,
            description: generator.description,
            value: key,
          })),
        })

        if (!response.type) {
          console.log(chalk.yellow('Operation cancelled'))
          return
        }

        selectedType = response.type
      }

      const generator = generators[selectedType!]
      if (!generator) {
        console.error(chalk.red(`Generator "${selectedType}" not found`))
        console.log(chalk.yellow('Available generators:'), Object.keys(generators).join(', '))
        return
      }

      // Get component name if not provided
      if (!componentName) {
        const response = await prompts({
          type: 'text',
          name: 'name',
          message: `${generator.name} name:`,
          validate: (value) => {
            if (!value.trim()) return 'Name is required'
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
              return 'Name must start with capital letter and contain only letters/numbers'
            }
            return true
          },
        })

        if (!response.name) {
          console.log(chalk.yellow('Operation cancelled'))
          return
        }

        componentName = response.name!
      }

      // Validate component name
      if (!componentName || !/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
        console.error(
          chalk.red(
            'Component name must start with capital letter and contain only letters/numbers'
          )
        )
        return
      }

      // Get generator-specific configuration
      let answers = {}
      if (!options?.yes && generator.prompts.length > 0) {
        answers = await prompts(generator.prompts)
      }

      const spinner = ora(`Generating ${generator.name}...`).start()

      // Generate files
      const files = generator.generate(answers, componentName!)
      const baseDir = options?.dir || process.cwd()

      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = resolve(baseDir, filePath)
        const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))

        // Create directory if it doesn't exist
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }

        // Check if file already exists
        if (existsSync(fullPath)) {
          const overwrite = await prompts({
            type: 'confirm',
            name: 'overwrite',
            message: `File ${filePath} already exists. Overwrite?`,
            initial: false,
          })

          if (!overwrite.overwrite) {
            continue
          }
        }

        writeFileSync(fullPath, content as string)
      }

      spinner.succeed(`${generator.name} generated successfully!`)

      // Show created files
      console.log(`\n${chalk.green('✅ Files created:')}`)
      Object.keys(files).forEach((filePath) => {
        console.log(chalk.gray(`  ${filePath}`))
      })

      // Show usage instructions
      console.log(`\n${chalk.yellow('💡 Usage:')}`)
      const importPath = Object.keys(files)[0]
        .replace(/^src\//, './')
        .replace(/\.ts$/, '')
      console.log(chalk.gray(`  import { ${componentName} } from '${importPath}'`))
      console.log(chalk.gray(`  // Use ${componentName}() in your app`))

      console.log(`\n${chalk.green('Happy coding with TachUI! 🚀')}`)
    } catch (error) {
      console.error(chalk.red('Error generating code:'), (error as Error).message)
      process.exit(1)
    }
  })
