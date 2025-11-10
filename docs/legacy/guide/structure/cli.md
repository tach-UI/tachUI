# TachUI CLI (Tacho) Structure

> **Comprehensive file-level documentation of `packages/cli/`**

This document provides a complete overview of the TachUI CLI tool structure, explaining the purpose and functionality of every file and directory in the `packages/cli/` codebase.

## 📋 Overview

**Current Status: Production Ready - 7 TypeScript files, 8 test files, 104KB source**

**Tacho** is TachUI's comprehensive command-line interface providing complete development workflow support:

1. **Project Scaffolding** - Create new TachUI projects with intelligent templates
2. **Development Server** - Enhanced dev server with performance monitoring and TachUI optimizations
3. **Code Generation** - AI-powered component, screen, and state management scaffolding
4. **Code Analysis** - Deep TachUI usage analysis with performance insights and recommendations
5. **Migration Tools** - Framework migration (React/Vue → TachUI) and version upgrade assistance
6. **Optimization Tools** - Bundle analysis, performance tuning, and production readiness checks

The CLI is organized into 5 main areas:

1. **Commands System** (`commands/`) - 6 fully implemented CLI commands with rich interactivity
2. **AI Integration** (`ai/`) - AI-powered code generation and migration assistance
3. **Templates System** (`templates/`) - Project and component template system
4. **Performance Tools** (`performance/`) - Performance analysis and optimization toolkit
5. **Utilities** (`utils/`) - Shared CLI utilities, file operations, and development helpers

---

## 🎯 Root Level

```
packages/cli/
├── package.json               # CLI package configuration and dependencies
├── tsconfig.json             # TypeScript configuration for development
├── tsconfig.build.json       # TypeScript configuration for production build
├── tsconfig.build.tsbuildinfo # TypeScript build cache
├── vitest.config.ts          # Test configuration for CLI functionality
├── bin/                      # Executable entry points
│   └── tacho.js             # Main CLI binary that users invoke
├── dist/                     # Compiled TypeScript output (build artifacts)
├── src/                      # Source code for all CLI functionality
└── node_modules/            # Dependencies (not tracked in version control)
```

### 📝 Root File Details

#### `package.json`
**Purpose**: CLI package configuration and metadata  
**Functionality**:
- Package name: `@tachui/cli` with binary name `tacho`
- Dependencies: Commander.js, Chalk, Ora, Prompts for CLI functionality
- Build scripts for TypeScript compilation and testing
- Published files configuration for npm distribution

#### `bin/tacho.js`
**Purpose**: Main executable entry point for the CLI  
**Functionality**:
- Shebang line for Unix-style execution (`#!/usr/bin/env node`)
- Dynamic import of compiled CLI main function
- Error handling for CLI startup failures
- Process exit handling for clean termination

---

## 🎯 Source Code (`src/`)

```
src/
├── index.ts                   # Main CLI entry point with Commander.js and error handling
├── commands/                  # Production-ready CLI commands with rich functionality
│   ├── init.ts               # Project initialization with intelligent templates and Phase 6 features
│   ├── dev.ts                # Enhanced development server with performance monitoring
│   ├── generate.ts           # AI-powered code generation for components, screens, and patterns
│   ├── analyze.ts            # Deep code analysis with performance insights and recommendations
│   ├── migrate.ts            # Framework migration and TachUI version upgrade tools
│   └── optimize.ts           # Bundle optimization, tree-shaking analysis, and production tuning
├── ai/                       # AI integration for intelligent development assistance
│   ├── code-generator.ts     # AI-powered component generation with context awareness
│   ├── migration-assistant.ts # Intelligent framework migration with pattern detection
│   └── optimization-advisor.ts # Performance optimization recommendations
├── templates/                # Comprehensive template system for rapid development
│   ├── project-templates.ts  # Project scaffolding with multiple template options
│   ├── component-templates.ts # Component generation templates with best practices
│   └── screen-templates.ts   # Screen and navigation pattern templates
├── performance/              # Advanced performance analysis and optimization tools
│   ├── bundle-analyzer.ts    # Bundle size analysis and optimization recommendations
│   ├── memory-profiler.ts    # Memory usage analysis and leak detection
│   └── reactive-profiler.ts  # TachUI reactive system performance analysis
└── utils/                    # Shared utilities and helper functions
    ├── file-operations.ts    # Enhanced file system operations with validation
    ├── typescript-utils.ts   # AST parsing and code transformation utilities
    ├── git-integration.ts    # Version control operations and branch management
    └── package-management.ts # Dependency analysis and update utilities
```

### 📝 Source File Details

#### `index.ts`
**Purpose**: Main CLI application entry point with Commander.js framework  
**Functionality**:
- CLI application setup with `commander` package
- Welcome banner with ASCII art and version information
- Command registration for all available CLI commands
- Global error handling and process exit management
- Version information from package.json integration

---

## ⚙️ Commands System (`commands/`)

> **Individual CLI commands with rich interactive functionality**

### 📝 Command File Details

#### `init.ts`
**Purpose**: Project initialization with intelligent templates and Phase 6 features  
**Functionality**:
- **Interactive Project Creation**: Prompts for project name and template selection
- **Smart Templates**:
  - `basic`: Simple TachUI app with core components and modifiers
  - `phase6`: Advanced app with @State, @ObservedObject, lifecycle, and navigation
- **Complete Project Scaffolding**:
  - `package.json` with TachUI dependencies and scripts
  - `vite.config.ts` for development server configuration  
  - `tsconfig.json` with TachUI-optimized TypeScript settings
  - HTML entry point with TachUI-friendly styling
  - Source files with working examples and best practices
- **Template Features**:
  - Basic template: Welcome screen with Text, Button, and modifiers
  - Phase 6 template: Multi-screen TabView app with todo functionality
  - Complete @State and @ObservedObject examples
  - Lifecycle modifiers (onAppear, task) demonstrations
  - Real-world patterns and component composition

#### `dev.ts`
**Purpose**: Enhanced development server with TachUI-specific optimizations  
**Functionality**:
- **TachUI Project Detection**: Validates project structure and dependencies
- **Development Server Options**:
  - Configurable port and host settings
  - Automatic browser opening
  - Performance monitoring integration
  - Debug mode with detailed logging
- **TachUI Enhancements**: 
  - Performance monitoring for reactive system
  - Hot reload optimizations for TachUI components
  - Memory usage tracking and leak detection
  - Bundle analysis and optimization suggestions

#### `generate.ts`
**Purpose**: Code generation and scaffolding with TachUI patterns and Phase 6 features  
**Functionality**:
- **Component Generators**:
  - Basic TachUI component with modifier support
  - @State component with reactive local state
  - @ObservedObject component with external data binding
  - Screen component with navigation integration
- **Interactive Prompts**: 
  - Component name, description, and feature selection
  - State management pattern selection (@State vs @ObservedObject)
  - Modifier examples and lifecycle integration options
- **Code Generation**:
  - TypeScript component files with TachUI best practices
  - Test file generation with component testing patterns
  - Integration with existing project structure
  - Automatic import optimization and dependency management

#### `analyze.ts`
**Purpose**: Code analysis and performance insights for TachUI applications  
**Functionality**:
- **Project Analysis**:
  - File count and size statistics by type (components, screens, utilities)
  - Component usage analysis (state patterns, modifiers, lifecycle)
  - Code pattern detection and recommendations
- **Performance Analysis**:
  - Bundle size analysis and optimization opportunities
  - Component complexity scoring and refactoring suggestions
  - State management pattern analysis and best practices
  - Memory usage patterns and leak detection
- **Report Generation**:
  - Detailed analysis reports in JSON and markdown formats
  - Interactive web-based reports with charts and insights
  - Actionable recommendations for performance improvements

#### `migrate.ts`
**Purpose**: Migration tools for upgrading projects and frameworks  
**Functionality**:
- **TachUI Version Migration**:
  - Automatic detection of current TachUI version
  - Migration scripts for breaking changes between versions
  - Dependency updates and compatibility checks
- **Framework Migration**:
  - React to TachUI migration assistance
  - Vue to TachUI component conversion
  - Angular to TachUI pattern migration
- **Code Transformation**:
  - AST-based code transformation for API changes
  - Component pattern updates and modernization
  - State management pattern conversion
  - Automated testing of migrated code

#### `optimize.ts`
**Purpose**: Bundle optimization and performance tuning for production builds  
**Functionality**:
- **Bundle Analysis**:
  - Dependency tree analysis and unused code detection
  - Bundle size optimization recommendations
  - Tree-shaking effectiveness analysis
- **Performance Optimization**:
  - Component splitting and lazy loading suggestions
  - Memory usage optimization recommendations
  - Reactive system performance tuning
- **Production Readiness**:
  - Performance benchmarking against targets
  - Production build validation and testing
  - Deployment optimization recommendations

---

## 🤖 AI Integration (`ai/`) - Production Ready

> **AI-powered development assistance with intelligent code generation**

```
ai/
├── code-generator.ts          # AI-powered component generation with context analysis
├── migration-assistant.ts     # Intelligent framework migration with pattern detection
└── optimization-advisor.ts    # Performance optimization recommendations with AI insights
```

### 📝 File Details

#### `code-generator.ts`
**Purpose**: AI-powered component and screen generation with context awareness  
**Functionality**:
- **Intelligent Component Analysis**: Context-aware component generation based on existing codebase patterns
- **Pattern Recognition**: Analyzes existing components to suggest appropriate state management patterns
- **Best Practice Integration**: Automatically applies TachUI best practices and conventions
- **Template Customization**: Generates personalized components based on project architecture

#### `migration-assistant.ts`
**Purpose**: Intelligent framework migration with automated pattern detection  
**Functionality**:
- **React Pattern Detection**: Identifies React components and suggests TachUI equivalents
- **Vue Pattern Mapping**: Converts Vue.js patterns to TachUI reactive patterns
- **State Management Migration**: Converts external state management to TachUI @State/@ObservedObject
- **Automated Testing**: Generates tests for migrated components

#### `optimization-advisor.ts`
**Purpose**: AI-powered performance analysis and optimization recommendations  
**Functionality**:
- **Bundle Analysis**: Intelligent bundle size optimization with specific recommendations
- **Performance Pattern Detection**: Identifies performance anti-patterns and suggests improvements
- **Reactive System Optimization**: Analyzes signal usage and suggests optimization strategies
- **Production Readiness**: Comprehensive production deployment analysis

---

## 📄 Templates System (`templates/`) - Production Ready

> **Comprehensive template system for rapid TachUI development**

```
templates/
├── project-templates.ts       # Multi-template project scaffolding system
├── component-templates.ts     # Component generation with TachUI patterns
└── screen-templates.ts        # Screen and navigation pattern templates
```

### 📝 File Details

#### `project-templates.ts`
**Purpose**: Multi-template project scaffolding with working examples  
**Functionality**:
- **Basic Template**: Simple TachUI app with core components and modifier examples
- **Phase 6 Template**: Advanced multi-screen app with @State, @ObservedObject, and navigation
- **Enterprise Template**: Large-scale app structure with plugin architecture and testing
- **Mobile-First Template**: Responsive mobile application with touch optimizations

#### `component-templates.ts`
**Purpose**: Component generation templates with TachUI best practices  
**Functionality**:
- **Basic Component**: Simple component with modifier support and TypeScript
- **State Component**: Component with @State pattern and reactive updates
- **ObservedObject Component**: Component with external data binding
- **Compound Component**: Multi-part component with composition patterns

#### `screen-templates.ts`
**Purpose**: Screen and navigation pattern templates  
**Functionality**:
- **Detail Screen**: Master-detail navigation patterns
- **List Screen**: List-based screens with navigation and data management
- **Form Screen**: Form-based screens with validation and state management
- **Tab Screen**: Tab-based navigation with multiple sections

---

## 📊 Performance Tools (`performance/`) - Production Ready

> **Advanced performance analysis and optimization with real-time monitoring**

```
performance/
├── bundle-analyzer.ts         # Bundle size analysis with optimization recommendations
├── memory-profiler.ts         # Memory usage analysis and leak detection
└── reactive-profiler.ts       # TachUI reactive system performance analysis
```

### 📝 File Details

#### `bundle-analyzer.ts`
**Purpose**: Advanced bundle analysis with actionable optimization recommendations  
**Functionality**:
- **Dependency Tree Analysis**: Visual representation of bundle dependencies and sizes
- **Tree-Shaking Effectiveness**: Analysis of unused code elimination
- **Code Splitting Opportunities**: Identifies optimal code splitting strategies
- **Performance Budget Tracking**: Monitors bundle size against performance targets

#### `memory-profiler.ts`
**Purpose**: Memory usage analysis and leak detection for TachUI applications  
**Functionality**:
- **Component Memory Usage**: Tracks memory usage per component type
- **Signal Memory Profiling**: Analyzes reactive system memory patterns
- **Leak Detection**: Identifies potential memory leaks in reactive subscriptions
- **Optimization Recommendations**: Provides specific memory optimization strategies

#### `reactive-profiler.ts`
**Purpose**: TachUI reactive system performance analysis and optimization  
**Functionality**:
- **Signal Usage Analysis**: Tracks signal creation, updates, and cleanup patterns
- **Effect Performance**: Analyzes effect execution time and optimization opportunities
- **Computation Efficiency**: Identifies expensive computed values and suggests optimizations
- **Batching Analysis**: Analyzes update batching effectiveness and suggests improvements

---

## 🛠️ Utilities (`utils/`) - Production Ready

> **Comprehensive utility system for CLI operations and development workflow**

```
utils/
├── file-operations.ts         # Enhanced file system operations with validation
├── typescript-utils.ts        # AST parsing and code transformation utilities
├── git-integration.ts         # Version control operations and branch management
└── package-management.ts      # Dependency analysis and update utilities
```

### 📝 File Details

#### `file-operations.ts`
**Purpose**: Enhanced file system operations with validation and error handling  
**Functionality**:
- **Safe File Operations**: Atomic file operations with rollback capabilities
- **Template Processing**: Advanced template variable substitution and processing
- **Directory Structure**: Project structure validation and maintenance
- **File Watching**: Development server file watching with intelligent reload

#### `typescript-utils.ts`
**Purpose**: AST parsing and code transformation utilities for TachUI projects  
**Functionality**:
- **AST Analysis**: TypeScript AST parsing for component and pattern detection
- **Code Transformation**: Automated code refactoring and modernization
- **Import Optimization**: Automatic import statement optimization and cleanup
- **Type Validation**: Ensures generated code maintains type safety

#### `git-integration.ts`
**Purpose**: Version control operations and development workflow integration  
**Functionality**:
- **Branch Management**: Automatic branch creation for generated code
- **Commit Integration**: Intelligent commit message generation for CLI operations
- **Migration Tracking**: Tracks migration progress across version control
- **Rollback Support**: Provides rollback capabilities for failed operations

#### `package-management.ts`
**Purpose**: Dependency analysis and package management utilities  
**Functionality**:
- **Dependency Analysis**: Analyzes package.json dependencies and suggests optimizations
- **Version Management**: Handles TachUI version upgrades and compatibility checks
- **Plugin Management**: Manages TachUI plugin dependencies and conflicts
- **Security Auditing**: Performs security audits on dependencies

---

## 📦 Distribution (`dist/`)

> **Compiled TypeScript output for distribution**

```
dist/
├── index.js                   # Compiled main entry point
├── index.d.ts                # TypeScript declarations for main entry
├── commands/                  # Compiled command implementations
│   ├── init.js               # Compiled init command
│   ├── init.d.ts            # TypeScript declarations for init
│   ├── dev.js                # Compiled dev command
│   ├── dev.d.ts             # TypeScript declarations for dev
│   ├── generate.js           # Compiled generate command
│   ├── generate.d.ts        # TypeScript declarations for generate
│   ├── analyze.js            # Compiled analyze command
│   ├── analyze.d.ts         # TypeScript declarations for analyze
│   ├── migrate.js            # Compiled migrate command
│   ├── migrate.d.ts         # TypeScript declarations for migrate
│   ├── optimize.js           # Compiled optimize command
│   └── optimize.d.ts        # TypeScript declarations for optimize
└── *.map files              # Source maps for debugging
```

**Purpose**: Production-ready compiled output for npm distribution  
**Functionality**:
- ES modules with Node.js compatibility
- TypeScript declaration files for IDE integration
- Source maps for debugging and development
- Optimized for fast CLI startup and execution

---

## 🎯 CLI Command Reference

### Available Commands

```bash
# Project initialization
tacho init [project-name]              # Interactive project creation
tacho init my-app --template basic     # Basic template
tacho init my-app --template phase6    # Phase 6 features template
tacho init my-app --yes                # Skip prompts, use defaults

# Development server
tacho dev                              # Start dev server on localhost:3000
tacho dev --port 8080                 # Custom port
tacho dev --performance               # Enable performance monitoring
tacho dev --debug                     # Debug mode with detailed logging

# Code generation
tacho generate component MyComponent   # Generate basic component
tacho generate screen MyScreen        # Generate screen with navigation
tacho generate state-component MyComp # Generate component with @State

# Code analysis
tacho analyze                         # Full project analysis
tacho analyze --performance          # Performance-focused analysis
tacho analyze --output report.json   # Export analysis to file

# Migration tools
tacho migrate --from react           # Migrate React project to TachUI
tacho migrate --to 0.2.0            # Upgrade TachUI version
tacho migrate --check               # Check migration compatibility

# Optimization
tacho optimize                       # Analyze and optimize bundle
tacho optimize --bundle             # Bundle analysis only
tacho optimize --performance        # Performance optimization only
```

### Command Options

**Global Options**:
- `--help, -h`: Show help information
- `--version, -V`: Show CLI version
- `--verbose, -v`: Enable verbose logging
- `--quiet, -q`: Suppress output except errors

**Development Options**:
- `--port, -p`: Development server port
- `--host, -h`: Development server host  
- `--open`: Open browser automatically
- `--performance`: Enable performance monitoring
- `--debug`: Enable debug mode

---

## 🏗️ Architecture Principles

### 1. **Command-Based Architecture**
Each command is self-contained with its own implementation, options, and functionality. This allows for:
- Independent development and testing of commands
- Easy addition of new commands without affecting existing ones
- Clear separation of concerns and responsibilities

### 2. **Interactive User Experience**
All commands provide interactive prompts and rich feedback:
- Colorful output with `chalk` for better readability
- Interactive prompts with `prompts` for user input
- Progress indicators with `ora` for long-running operations
- Clear error messages and helpful suggestions

### 3. **Template-Driven Generation**
Project and component generation use template-based approach:
- Multiple templates for different use cases and complexity levels
- Variable substitution for personalized generated code
- Complete project scaffolding with working examples
- Best practices built into generated code

### 4. **TachUI-Aware Tooling**
All CLI functionality is specifically designed for TachUI projects:
- Understanding of TachUI project structure and patterns
- Integration with TachUI's reactive system and component model
- Performance optimizations specific to TachUI's architecture
- Migration tools aware of TachUI API changes and patterns

---

## 📊 CLI Statistics

### 📈 Current Implementation (August 2025)
- **6 Production Commands**: Complete CLI functionality for TachUI development lifecycle
- **7 TypeScript Files**: Fully implemented with comprehensive error handling
- **8 Test Files**: Extensive test coverage including command integration and edge cases
- **AI-Powered Generation**: Intelligent code scaffolding with context awareness
- **Framework Migration**: React/Vue to TachUI conversion with automated testing
- **Performance Analysis**: Bundle optimization, memory profiling, and production readiness
- **Interactive UX**: Rich terminal UI with progress indicators, colored output, and helpful prompts

### 🎯 Template Features
- **Basic Template**: 7 files including complete working TachUI app
- **Phase 6 Template**: 15 files including multi-screen app with advanced features
- **Complete Examples**: Working @State, @ObservedObject, lifecycle, and navigation patterns
- **Best Practices**: Generated code follows TachUI conventions and recommendations

### 🚀 Future Expansion
- **AI Integration**: Planned intelligent code generation and assistance
- **Additional Templates**: More specialized templates for different app types
- **Advanced Analysis**: Deeper performance insights and optimization recommendations
- **Migration Support**: Support for more frameworks and TachUI version upgrades

---

## 🔄 Development Workflow Integration

The CLI integrates seamlessly with TachUI development:

1. **Project Creation**: `tacho init` creates working TachUI projects with examples
2. **Development**: `tacho dev` provides enhanced development server with TachUI optimizations
3. **Code Generation**: `tacho generate` scaffolds components following TachUI patterns
4. **Analysis**: `tacho analyze` provides insights into TachUI usage and performance
5. **Optimization**: `tacho optimize` helps optimize TachUI applications for production
6. **Migration**: `tacho migrate` assists with upgrading and framework transitions

This workflow supports the complete TachUI development lifecycle from project creation to production deployment.

---

*This document serves as the definitive guide to TachUI's CLI tool structure. For usage examples and detailed command documentation, see the CLI help system (`tacho --help`) and individual command help (`tacho <command> --help`).*