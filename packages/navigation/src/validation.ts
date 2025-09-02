/**
 * Navigation Package Component Validation
 *
 * Validation for @tachui/navigation components that registers with the Core
 * validation system, following proper plugin architecture.
 */

// Import from core to register with the validation system
import { getComponentValidator } from '@tachui/core'

/**
 * TachUI Navigation validation error class
 */
export class NavigationValidationError extends Error {
  constructor(
    message: string,
    public context: {
      component: string
      property?: string
      suggestion?: string
      documentation?: string
      example?: {
        wrong: string
        correct: string
      }
    }
  ) {
    super(message)
    this.name = 'NavigationValidationError'
  }

  getFormattedMessage(): string {
    const { component, suggestion, example, documentation } = this.context

    let formatted = `❌ [@tachui/navigation] ${component} Component Error: ${this.message}\n`

    if (suggestion) {
      formatted += `\n💡 Suggestion: ${suggestion}\n`
    }

    if (example) {
      formatted += `\n❌ Wrong: ${example.wrong}`
      formatted += `\n✅ Correct: ${example.correct}\n`
    }

    if (documentation) {
      formatted += `\n📚 Documentation: ${documentation}`
    }

    return formatted
  }
}

/**
 * Navigation Components Validation
 */
export const NavigationComponentValidation = {
  // NavigationView Component (Legacy)
  validateNavigationView(args: unknown[]): void {
    if (args.length === 0) {
      throw new NavigationValidationError(
        'NavigationView component requires content',
        {
          component: 'NavigationView',
          suggestion: 'Add content: NavigationView(rootContent)',
          documentation:
            'https://docs.tachui.dev/navigation/components/navigationview',
          example: {
            wrong: 'NavigationView()',
            correct: 'NavigationView(HomeView)',
          },
        }
      )
    }

    const [content] = args
    if (!content) {
      throw new NavigationValidationError(
        'NavigationView content cannot be null or undefined',
        {
          component: 'NavigationView',
          suggestion: 'Provide valid content component',
          example: {
            wrong: 'NavigationView(null)',
            correct: 'NavigationView(HomeView)',
          },
        }
      )
    }
  },

  // NavigationStack Component
  validateNavigationStack(args: unknown[]): void {
    if (args.length === 0) {
      throw new NavigationValidationError(
        'NavigationStack component requires content',
        {
          component: 'NavigationStack',
          suggestion: 'Add content: NavigationStack(rootContent)',
          documentation:
            'https://docs.tachui.dev/navigation/components/navigationstack',
          example: {
            wrong: 'NavigationStack()',
            correct: 'NavigationStack(HomeView)',
          },
        }
      )
    }

    const [content] = args
    if (!content) {
      throw new NavigationValidationError(
        'NavigationStack content cannot be null or undefined',
        {
          component: 'NavigationStack',
          suggestion: 'Provide valid content component',
          example: {
            wrong: 'NavigationStack(null)',
            correct: 'NavigationStack(HomeView)',
          },
        }
      )
    }
  },

  // NavigationLink Component
  validateNavigationLink(args: unknown[]): void {
    if (args.length === 0) {
      throw new NavigationValidationError(
        'NavigationLink component requires destination or content',
        {
          component: 'NavigationLink',
          suggestion:
            'Add destination: NavigationLink({ destination: "/path", label: "Link" })',
          documentation:
            'https://docs.tachui.dev/navigation/components/navigationlink',
          example: {
            wrong: 'NavigationLink()',
            correct:
              'NavigationLink({ destination: "/about", label: "About" })',
          },
        }
      )
    }

    const [props] = args
    if (typeof props === 'string') {
      // Simple usage: NavigationLink("Label", destination)
      if (args.length < 2) {
        throw new NavigationValidationError(
          'NavigationLink with string label requires destination',
          {
            component: 'NavigationLink',
            suggestion: 'Add destination as second parameter',
            example: {
              wrong: 'NavigationLink("About")',
              correct: 'NavigationLink("About", "/about")',
            },
          }
        )
      }
    } else if (props && typeof props === 'object') {
      // Object usage: NavigationLink({ destination, label })
      const propsObj = props as any
      if (!propsObj.destination && !propsObj.content) {
        throw new NavigationValidationError(
          'NavigationLink requires either destination or content property',
          {
            component: 'NavigationLink',
            suggestion: 'Provide destination or content',
            example: {
              wrong: 'NavigationLink({ label: "Link" })',
              correct:
                'NavigationLink({ destination: "/path", label: "Link" })',
            },
          }
        )
      }
    }
  },

  // TabView Component (Legacy)
  validateTabView(args: unknown[]): void {
    if (args.length === 0) {
      throw new NavigationValidationError(
        'TabView component requires tabs array',
        {
          component: 'TabView',
          suggestion:
            'Add tabs: TabView([{ title: "Tab 1", content: Content1 }])',
          documentation:
            'https://docs.tachui.dev/navigation/components/tabview',
          example: {
            wrong: 'TabView()',
            correct: 'TabView([{ title: "Home", content: HomeView }])',
          },
        }
      )
    }

    const [tabs] = args
    if (!Array.isArray(tabs)) {
      throw new NavigationValidationError('TabView tabs must be an array', {
        component: 'TabView',
        suggestion: 'Provide an array of tab objects',
        example: {
          wrong: 'TabView({ title: "Tab", content: Content })',
          correct: 'TabView([{ title: "Tab", content: Content }])',
        },
      })
    }

    if (tabs.length === 0) {
      throw new NavigationValidationError(
        'TabView must have at least one tab',
        {
          component: 'TabView',
          suggestion: 'Add at least one tab to the array',
          example: {
            wrong: 'TabView([])',
            correct: 'TabView([{ title: "Home", content: HomeView }])',
          },
        }
      )
    }

    // Validate tab structure
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      if (!tab || typeof tab !== 'object') {
        throw new NavigationValidationError(
          `Tab at index ${i} must be an object`,
          {
            component: 'TabView',
            suggestion: 'Each tab must be an object with title and content',
            example: {
              wrong: `tabs: [${i > 0 ? '..., ' : ''}"invalid tab"]`,
              correct: `tabs: [${i > 0 ? '..., ' : ''}{ title: "Tab", content: Content }]`,
            },
          }
        )
      }

      if (!tab.title) {
        throw new NavigationValidationError(
          `Tab at index ${i} is missing required title property`,
          {
            component: 'TabView',
            suggestion: 'Each tab must have a title property',
            example: {
              wrong: `{ content: Content }`,
              correct: `{ title: "Tab ${i + 1}", content: Content }`,
            },
          }
        )
      }
    }
  },

  // SimpleTabView Component
  validateSimpleTabView(args: unknown[]): void {
    if (args.length === 0) {
      throw new NavigationValidationError(
        'SimpleTabView component requires tabs array',
        {
          component: 'SimpleTabView',
          suggestion: 'Add tabs: SimpleTabView([tabItem("Home", HomeView)])',
          documentation:
            'https://docs.tachui.dev/navigation/components/simpletabview',
          example: {
            wrong: 'SimpleTabView()',
            correct: 'SimpleTabView([tabItem("Home", HomeView)])',
          },
        }
      )
    }

    const [tabs] = args
    if (!Array.isArray(tabs)) {
      throw new NavigationValidationError(
        'SimpleTabView tabs must be an array',
        {
          component: 'SimpleTabView',
          suggestion: 'Provide an array of tab items created with tabItem()',
          example: {
            wrong: 'SimpleTabView(tabItem("Home", HomeView))',
            correct: 'SimpleTabView([tabItem("Home", HomeView)])',
          },
        }
      )
    }

    if (tabs.length === 0) {
      throw new NavigationValidationError(
        'SimpleTabView must have at least one tab',
        {
          component: 'SimpleTabView',
          suggestion: 'Add at least one tab using tabItem()',
          example: {
            wrong: 'SimpleTabView([])',
            correct: 'SimpleTabView([tabItem("Home", HomeView)])',
          },
        }
      )
    }
  },
}

/**
 * ComponentValidator interface for type safety
 */
interface ComponentValidator {
  packageName: string
  componentName: string
  validate: (args: unknown[]) => void
}

/**
 * Create Navigation component validators for registration
 */
export function createNavigationValidators(): ComponentValidator[] {
  return [
    {
      packageName: 'navigation',
      componentName: 'NavigationView',
      validate: NavigationComponentValidation.validateNavigationView,
    },
    {
      packageName: 'navigation',
      componentName: 'NavigationStack',
      validate: NavigationComponentValidation.validateNavigationStack,
    },
    {
      packageName: 'navigation',
      componentName: 'NavigationLink',
      validate: NavigationComponentValidation.validateNavigationLink,
    },
    {
      packageName: 'navigation',
      componentName: 'TabView',
      validate: NavigationComponentValidation.validateTabView,
    },
    {
      packageName: 'navigation',
      componentName: 'SimpleTabView',
      validate: NavigationComponentValidation.validateSimpleTabView,
    },
  ]
}

/**
 * Register Navigation validators with Core validation system
 */
export async function registerNavigationValidators(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependency
    const { registerComponentValidator } = await import(
      '@tachui/core/validation'
    )

    const validators = createNavigationValidators()

    for (const validator of validators) {
      registerComponentValidator(validator)
    }

    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `🔍 [@tachui/navigation] Registered ${validators.length} component validators`
      )
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '⚠️ [@tachui/navigation] Could not register validators with Core:',
        error
      )
    }
  }
}

// Auto-register when Navigation package loads
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  setTimeout(registerNavigationValidators, 10)
}
