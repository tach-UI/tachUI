---
cssclasses:
  - full-page
---

# Enhancement: Code Component Plugin for tachUI

**Status**: Design Phase  
**Priority**: Medium  
**Timeline**: 4-6 weeks  
**Bundle Impact**: ~85KB (when used)  

## Overview

A comprehensive Code component plugin that provides syntax highlighting, Prettier formatting, and interactive code editing capabilities as an optional tachUI plugin. This maintains framework modularity while offering powerful developer-focused functionality.

## Technical Architecture

### Plugin Structure
```
packages/code/
├── src/
│   ├── components/
│   │   ├── Code.ts              # Main Code component
│   │   ├── CodeEditor.ts        # Editable code component
│   │   └── CodeBlock.ts         # Read-only formatted display
│   ├── formatters/
│   │   ├── prettier-integration.ts  # Prettier wrapper
│   │   ├── language-parsers.ts     # Language-specific parsers
│   │   └── formatter-registry.ts   # Plugin formatter system
│   ├── highlighters/
│   │   ├── prism-integration.ts    # Prism.js syntax highlighting
│   │   ├── theme-manager.ts        # Theme system
│   │   └── language-detection.ts   # Auto-detect languages
│   ├── themes/
│   │   ├── presets.ts              # Built-in themes
│   │   └── theme-types.ts          # Theme interfaces
│   ├── utils/
│   │   ├── lazy-loader.ts          # Dynamic imports
│   │   ├── cache-manager.ts        # Formatting cache
│   │   └── performance-monitor.ts   # Performance tracking
│   ├── plugin.ts                   # Main plugin entry
│   └── index.ts                    # Public API exports
├── tests/                          # Comprehensive test suite
├── docs/                           # Plugin documentation
├── examples/                       # Usage examples
├── package.json                    # Plugin dependencies
└── vite.config.ts                 # Build configuration
```

### Core Component API

#### Basic Code Component
```typescript
import { Code } from '@tachui/code'

// Simple usage
Code('const hello = "world"', { language: 'typescript' })

// With formatting
Code(unformattedCode, {
  language: 'typescript',
  format: true,
  theme: 'github-dark',
  showLineNumbers: true,
  prettier: {
    semi: false,
    singleQuote: true,
    tabWidth: 2
  }
})

// Modifier chain style
Code(source)
  .modifier
  .language('javascript')
  .format({ prettier: true, parser: 'babel' })
  .theme('vscode-dark')
  .lineNumbers(true)
  .highlightLines([5, 10, 15])
  .maxHeight(400)
  .copyButton(true)
  .build()
```

#### Interactive Code Editor
```typescript
import { CodeEditor } from '@tachui/code'

CodeEditor(initialCode, {
  language: 'typescript',
  onChange: (code) => console.log('Code changed:', code),
  onFormat: (formatted) => console.log('Code formatted:', formatted),
  formatOnSave: true,
  autoComplete: true,
  linting: true
})
```

#### Read-only Code Block
```typescript
import { CodeBlock } from '@tachui/code'

CodeBlock(source, {
  language: 'json',
  theme: 'github-light',
  collapsible: true,
  title: 'Configuration Example',
  showLanguage: true
})
```

## Detailed Implementation Plan

### Phase 1: Core Plugin Architecture (Week 1-2)

#### 1.1 Plugin Foundation
- **Create plugin package structure**
  - Set up `packages/code/` directory
  - Configure build system with Vite
  - Establish TypeScript configuration
  - Set up testing infrastructure

- **Core Plugin System**
  ```typescript
  export interface CodePluginOptions {
    defaultTheme?: string
    prettierConfig?: PrettierOptions
    enableCache?: boolean
    lazyLoading?: boolean
    maxCacheSize?: number
  }

  export class CodePlugin implements TachUIPlugin {
    name = '@tachui/code'
    version = '1.0.0'
    
    install(tachui: TachUIInstance, options: CodePluginOptions) {
      // Plugin registration logic
      tachui.registerComponent('Code', CodeComponent)
      tachui.registerComponent('CodeEditor', CodeEditorComponent)
      tachui.registerComponent('CodeBlock', CodeBlockComponent)
    }
  }
  ```

#### 1.2 Base Component Implementation
- **Code Component Foundation**
  ```typescript
  export interface CodeComponentProps {
    source: string | Signal<string>
    language?: string
    theme?: string | CodeTheme
    showLineNumbers?: boolean
    format?: boolean | FormatOptions
    highlightLines?: number[]
    maxHeight?: number
    copyable?: boolean
    title?: string
  }

  export function Code(
    source: string | Signal<string>,
    options: CodeComponentProps = {}
  ): ComponentInstance {
    // Base implementation with Text component
    // No formatting or highlighting yet
  }
  ```

### Phase 2: Prettier Integration (Week 2-3)

#### 2.1 Prettier Wrapper System
- **Dynamic Prettier Loading**
  ```typescript
  class PrettierFormatter {
    private prettierCache = new Map<string, any>()
    
    async loadPrettier(parser: string): Promise<any> {
      if (this.prettierCache.has(parser)) {
        return this.prettierCache.get(parser)
      }
      
      const [prettier, parserPlugin] = await Promise.all([
        import('prettier/standalone'),
        this.loadParser(parser)
      ])
      
      this.prettierCache.set(parser, { prettier, parser: parserPlugin })
      return { prettier, parser: parserPlugin }
    }
    
    private async loadParser(parser: string) {
      switch (parser) {
        case 'typescript':
          return import('prettier/parser-typescript')
        case 'babel':
          return import('prettier/parser-babel')
        case 'html':
          return import('prettier/parser-html')
        case 'css':
          return import('prettier/parser-postcss')
        default:
          return import('prettier/parser-babel')
      }
    }
    
    async format(code: string, options: FormatOptions): Promise<string> {
      const { prettier, parser } = await this.loadPrettier(options.parser || 'babel')
      
      return prettier.format(code, {
        parser: options.parser || 'babel',
        plugins: [parser],
        semi: options.semi ?? true,
        singleQuote: options.singleQuote ?? false,
        tabWidth: options.tabWidth ?? 2,
        ...options.prettierOptions
      })
    }
  }
  ```

#### 2.2 Caching System
- **Intelligent Formatting Cache**
  ```typescript
  class FormattingCache {
    private cache = new Map<string, CacheEntry>()
    private maxSize: number
    
    getFormatted(code: string, options: FormatOptions): string | null {
      const key = this.generateKey(code, options)
      const entry = this.cache.get(key)
      
      if (entry && !this.isExpired(entry)) {
        entry.lastAccessed = Date.now()
        return entry.formatted
      }
      
      return null
    }
    
    setFormatted(code: string, options: FormatOptions, formatted: string): void {
      const key = this.generateKey(code, options)
      
      if (this.cache.size >= this.maxSize) {
        this.evictLRU()
      }
      
      this.cache.set(key, {
        formatted,
        timestamp: Date.now(),
        lastAccessed: Date.now()
      })
    }
  }
  ```

### Phase 3: Syntax Highlighting (Week 3-4)

#### 3.1 Prism.js Integration
- **Highlight System**
  ```typescript
  class SyntaxHighlighter {
    private highlightCache = new Map<string, string>()
    
    async highlight(code: string, language: string, theme: string): Promise<string> {
      const cacheKey = `${language}:${theme}:${this.hash(code)}`
      
      if (this.highlightCache.has(cacheKey)) {
        return this.highlightCache.get(cacheKey)!
      }
      
      await this.loadLanguage(language)
      await this.loadTheme(theme)
      
      const highlighted = Prism.highlight(code, Prism.languages[language], language)
      this.highlightCache.set(cacheKey, highlighted)
      
      return highlighted
    }
    
    private async loadLanguage(language: string): Promise<void> {
      if (!Prism.languages[language]) {
        await import(`prismjs/components/prism-${language}`)
      }
    }
  }
  ```

#### 3.2 Theme System
- **Dynamic Theme Management**
  ```typescript
  export interface CodeTheme {
    name: string
    background: string
    text: string
    keyword: string
    string: string
    number: string
    comment: string
    operator: string
    punctuation: string
  }

  class ThemeManager {
    private themes = new Map<string, CodeTheme>()
    
    registerTheme(theme: CodeTheme): void {
      this.themes.set(theme.name, theme)
      this.generateCSS(theme)
    }
    
    private generateCSS(theme: CodeTheme): void {
      const css = `
        .code-theme-${theme.name} {
          background-color: ${theme.background};
          color: ${theme.text};
        }
        .code-theme-${theme.name} .token.keyword { color: ${theme.keyword}; }
        .code-theme-${theme.name} .token.string { color: ${theme.string}; }
        /* ... more token styles */
      `
      this.injectCSS(css)
    }
  }
  ```

### Phase 4: Advanced Features (Week 4-5)

#### 4.1 Interactive Code Editor
- **Editable Code Component**
  ```typescript
  export function CodeEditor(
    initialCode: string,
    options: CodeEditorProps
  ): ComponentInstance {
    const [code, setCode] = useState(initialCode)
    const [isDirty, setIsDirty] = useState(false)
    
    const handleFormat = async () => {
      if (options.format) {
        const formatted = await formatter.format(code, options.formatOptions)
        setCode(formatted)
        setIsDirty(false)
        options.onFormat?.(formatted)
      }
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleFormat()
      }
    }
    
    return VStack({
      children: [
        // Toolbar
        HStack({
          children: [
            Button('Format (⌘S)', handleFormat)
              .modifier
              .disabled(!isDirty)
              .build(),
            Button('Copy', () => navigator.clipboard.writeText(code))
              .modifier
              .buttonStyle('secondary')
              .build()
          ]
        }),
        
        // Editor
        Text(code)
          .modifier
          .contentEditable(true)
          .font({ family: 'monospace' })
          .onInput(e => {
            setCode(e.target.textContent || '')
            setIsDirty(true)
            options.onChange?.(e.target.textContent || '')
          })
          .onKeyDown(handleKeyDown)
          .build()
      ]
    })
  }
  ```

#### 4.2 Performance Optimizations
- **Virtual Scrolling for Large Files**
- **Web Worker for Syntax Highlighting**
- **Incremental Parsing**

### Phase 5: Polish & Documentation (Week 5-6)

#### 5.1 Advanced Features
- **Line highlighting**
- **Code folding**
- **Search within code**
- **Multiple cursor support**
- **Auto-completion**

#### 5.2 Developer Experience
- **TypeScript definitions**
- **Comprehensive examples**
- **Performance monitoring**
- **Error handling & recovery**

## Testing Strategy

### Unit Tests (Jest + Vitest)
```typescript
describe('Code Component', () => {
  test('renders basic code without formatting', () => {
    const code = 'const x = 1'
    const component = Code(code, { language: 'javascript' })
    expect(component.render()).toContain('const x = 1')
  })
  
  test('formats code with Prettier', async () => {
    const unformatted = 'const x=1;const y=2'
    const component = Code(unformatted, { 
      language: 'javascript',
      format: true 
    })
    
    await waitFor(() => {
      expect(component.render()).toContain('const x = 1;\nconst y = 2;')
    })
  })
  
  test('applies syntax highlighting', async () => {
    const code = 'const hello = "world"'
    const component = Code(code, { 
      language: 'javascript',
      theme: 'github-dark'
    })
    
    await waitFor(() => {
      const html = component.render()
      expect(html).toContain('token keyword')
      expect(html).toContain('token string')
    })
  })
})
```

### Integration Tests
```typescript
describe('Code Plugin Integration', () => {
  test('registers components correctly', () => {
    const tachui = new TachUIInstance()
    tachui.use(CodePlugin, { defaultTheme: 'github-dark' })
    
    expect(tachui.hasComponent('Code')).toBe(true)
    expect(tachui.hasComponent('CodeEditor')).toBe(true)
  })
  
  test('works with reactive signals', () => {
    const codeSignal = signal('const x = 1')
    const component = Code(codeSignal, { language: 'javascript' })
    
    expect(component.render()).toContain('const x = 1')
    
    codeSignal.value = 'const y = 2'
    expect(component.render()).toContain('const y = 2')
  })
})
```

### Performance Tests
```typescript
describe('Code Component Performance', () => {
  test('handles large files efficiently', async () => {
    const largeFile = 'x'.repeat(100000)
    const startTime = performance.now()
    
    const component = Code(largeFile, { 
      language: 'javascript',
      format: true 
    })
    
    await component.render()
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(1000) // Under 1 second
  })
  
  test('caches formatting results', async () => {
    const code = 'const x = 1'
    const options = { language: 'javascript', format: true }
    
    // First format
    const start1 = performance.now()
    await Code(code, options).render()
    const time1 = performance.now() - start1
    
    // Second format (should be cached)
    const start2 = performance.now()
    await Code(code, options).render()
    const time2 = performance.now() - start2
    
    expect(time2).toBeLessThan(time1 * 0.1) // 10x faster
  })
})
```

### Browser Compatibility Tests
- Test across Chrome, Firefox, Safari, Edge
- Mobile device testing
- Performance profiling
- Memory leak detection

## Bundle Analysis

### Size Breakdown
```
@tachui/code (total: ~85KB)
├── Core component logic: ~15KB
├── Prettier (lazy-loaded): ~45KB
│   ├── prettier/standalone: ~35KB
│   └── Parser plugins: ~10KB each
├── Prism.js (lazy-loaded): ~20KB
│   ├── Core: ~8KB
│   └── Language packs: ~2KB each
└── Theme system: ~5KB
```

### Loading Strategy
- **Critical path**: 15KB (core component)
- **Lazy loaded**: 70KB (formatters + highlighters)
- **On-demand**: Language-specific parsers

## Documentation Plan

### API Documentation
```markdown
# @tachui/code Plugin

## Installation
```bash
pnpm add @tachui/code
```

## Basic Usage
```typescript
import { Code } from '@tachui/code'

// Simple code display
Code('const hello = "world"', { language: 'typescript' })

// With formatting and highlighting
Code(source, {
  language: 'typescript',
  format: true,
  theme: 'github-dark',
  showLineNumbers: true
})
```

### Configuration Guide
- Plugin installation and setup
- Theme customization
- Performance tuning
- Caching strategies

### Migration Guide
- From existing code highlighting solutions
- Integration with existing TachUI applications
- Performance optimization tips

### Examples Repository
- Basic code display
- Interactive editor
- Custom themes
- Performance patterns
- Real-world use cases

## Plugin Registration

### TachUI Integration
```typescript
// main.ts
import { TachUI } from '@tachui/core'
import { CodePlugin } from '@tachui/code'

const app = TachUI.createApp(AppComponent)

app.use(CodePlugin, {
  defaultTheme: 'github-dark',
  prettierConfig: {
    semi: false,
    singleQuote: true,
    tabWidth: 2
  },
  enableCache: true,
  lazyLoading: true
})

app.mount('#app')
```

## Success Criteria

### Functional Requirements
- ✅ Code component renders properly in all browsers
- ✅ Prettier formatting works for TypeScript, JavaScript, HTML, CSS, JSON
- ✅ Syntax highlighting supports 20+ languages
- ✅ Theme system supports light/dark modes
- ✅ Interactive editor supports basic editing operations
- ✅ Performance remains acceptable for files up to 10,000 lines

### Performance Requirements
- ✅ Initial bundle impact < 20KB
- ✅ Lazy loading reduces unused features impact to 0KB
- ✅ Formatting operations complete in < 500ms for typical files
- ✅ Memory usage remains stable during extended use
- ✅ No memory leaks in reactive scenarios

### Developer Experience
- ✅ TypeScript definitions provide full IntelliSense
- ✅ Documentation covers all use cases
- ✅ Error messages are clear and actionable
- ✅ Plugin integrates seamlessly with existing TachUI apps
- ✅ Examples demonstrate real-world usage patterns

## Future Enhancements

### Phase 2 Features (Post-1.0)
- **Language Server Protocol integration**
- **Advanced auto-completion**
- **Code linting integration**
- **Collaborative editing support**
- **Plugin system for custom formatters**
- **VS Code theme compatibility**
- **Mobile editing optimizations**
- **Accessibility enhancements**

### Integration Opportunities
- **@tachui/docs integration** - Enhanced documentation code examples
- **@tachui/forms integration** - Code input fields with validation
- **@tachui/charts integration** - Code metrics visualization
- **Development tools** - Interactive playground components

This plugin architecture ensures the Code component remains optional while providing comprehensive functionality for developers who need advanced code display and editing capabilities.