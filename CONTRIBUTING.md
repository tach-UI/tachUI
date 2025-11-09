# Contributing to tachUI

Welcome to tachUI! 🎉 We're excited to have you contribute to bringing SwiftUI-inspired development to the web.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- **Node.js**: 20.0.0 or higher
- **pnpm**: 10.0.0 or higher
- **TypeScript**: Familiarity with TypeScript development
- **SwiftUI Knowledge**: Helpful but not required

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/tach-UI/tachUI.git
cd tachUI

# Install dependencies
pnpm install

# Run development server
pnpm dev:core

# Run tests
pnpm test

# Build all packages
pnpm build
```

## Development Setup

### Workspace Structure

tachUI uses pnpm workspaces with the following structure:

```
packages/
├── core/              # Main framework (@tachui/core)
├── forms/             # Form components (@tachui/forms)
├── navigation/        # Navigation system (@tachui/navigation)
├── symbols/           # Icon system (@tachui/symbols)
├── mobile-patterns/   # Mobile UI patterns (@tachui/mobile-patterns)
└── cli/              # Developer tooling (@tachui/cli)
```

### Available Scripts

```bash
# Development
pnpm dev                 # Start all dev servers
pnpm dev:core           # Core package development
pnpm dev:docs           # Documentation development

# Testing
pnpm test               # Run all tests
pnpm test:coverage      # Run tests with coverage
pnpm benchmark          # Run performance benchmarks

# Building
pnpm build              # Build all packages
pnpm build:core         # Build core package only

# Code Quality
pnpm lint               # Run linter
pnpm type-check         # Run TypeScript checks
pnpm docs:api          # Generate API documentation
```

## Contributing Guidelines

### What We're Looking For

#### High Priority

- **Bug fixes** in core functionality
- **SwiftUI component parity** - missing components or modifiers
- **Performance optimizations** - bundle size, runtime performance
- **Documentation improvements** - guides, examples, API docs

#### Medium Priority

- **New SwiftUI-compatible features** that enhance developer experience
- **Developer tooling** improvements
- **Test coverage** improvements
- **Accessibility** enhancements

#### Nice to Have

- **Advanced animations** and transitions
- **Design system integration** tools
- **Performance monitoring** tools
- **Migration utilities** from other frameworks

### Before You Start

1. **Check existing issues** - Someone might already be working on it
2. **Create an issue** - Discuss your idea before implementing
3. **Small PRs** - Break large features into smaller, reviewable chunks
4. **Follow SwiftUI patterns** - Maintain API consistency with SwiftUI

## Pull Request Process

### 1. Preparation

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Run quality checks
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

### 2. Commit Messages

Use conventional commit format:

```
type(scope): description

feat(core): add responsive grid component
fix(forms): resolve validation state bug
docs(guide): update getting started examples
perf(core): optimize signal update batching
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### 3. Pull Request Requirements

- [ ] **Descriptive title** and detailed description
- [ ] **Tests added/updated** for new functionality
- [ ] **Documentation updated** if needed
- [ ] **SwiftUI compatibility** maintained
- [ ] **No breaking changes** (unless clearly marked)
- [ ] **Performance impact** considered and documented
- [ ] **Linting and type checking** passes
- [ ] **All tests pass**

### 4. Review Process

1. **Automated checks** must pass
2. **Maintainer review** - We aim to review within 48 hours
3. **Address feedback** - Work with reviewers to refine the PR
4. **Final approval** - Maintainer approval required for merge

## Project Structure

### Core Package (`@tachui/core`)

```
packages/core/src/
├── components/        # React-like components (Button, Text, etc.)
├── modifiers/         # SwiftUI-style modifiers
├── reactivity/        # Signal system and reactive utilities
├── layout/           # Layout components (VStack, HStack, etc.)
├── styling/          # CSS and styling utilities
├── dom/             # DOM manipulation utilities
└── types/           # TypeScript type definitions
```

### Adding a New Component

1. **Component Implementation**:

```typescript
// packages/core/src/components/MyComponent.ts
export interface MyComponentProps {
  // Props interface
}

export function MyComponent(props: MyComponentProps) {
  // Implementation
}
```

2. **Modifiers Support**:

```typescript
// Extend with modifier support
export const MyComponent = createModifiableComponent(
  'MyComponent',
  implementation
)
```

3. **Tests**:

```typescript
// packages/core/__tests__/components/MyComponent.test.ts
describe('MyComponent', () => {
  // Test cases
})
```

4. **Documentation**:

```markdown
<!-- docs/guide/components/mycomponent.md -->

# MyComponent

## Usage

## Props

## Examples
```

5. **Export**:

```typescript
// packages/core/src/index.ts
export { MyComponent } from './components/MyComponent'
```

## Testing

### Test Types

- **Unit tests**: Component and utility function tests
- **Integration tests**: Multi-component interactions
- **Performance tests**: Benchmarks and memory usage
- **Security tests**: XSS prevention, CSP compliance

### Workspace Package Aliases in Tests

**Important**: When writing tests that import other workspace packages (e.g., `@tachui/forms`, `@tachui/grid`), you **must** configure proper aliases in your package's `vitest.config.ts` file.

#### Why This Matters

Vitest needs to resolve workspace package imports during testing. Without proper aliases, imports like `import { Form } from '@tachui/forms'` will fail with:

```
Error: Failed to resolve import "@tachui/forms"
```

#### How to Configure Aliases

Add workspace packages to the `resolve.alias` section of your `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // ... other config
  },
  resolve: {
    alias: {
      '@tachui/core': resolve(__dirname, '../core/src'),
      '@tachui/forms': resolve(__dirname, '../forms/src'),
      '@tachui/grid': resolve(__dirname, '../grid/src'),
      // Add other packages as needed
    },
  },
})
```

#### Validation Tool

Run the workspace alias validator to check for missing aliases:

```bash
# Check for missing aliases
pnpm validate:workspace-aliases

# Auto-fix missing aliases
pnpm validate:workspace-aliases --fix
```

The validator scans your test files for `@tachui/*` imports and ensures all referenced packages have proper aliases configured. It only checks for aliases that are actually used in your tests.

#### Rules of Thumb

1. **Only add aliases you need**: The validator only checks for packages actually imported in your tests
2. **Point to `src/` not `dist/`**: Tests should import from source for better debugging
3. **Update when adding dependencies**: If you add a new workspace dependency to your tests, add the alias
4. **Run validation in CI**: The validator can fail CI if aliases are missing (`--fix` flag excluded)

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { MyComponent } from '../src/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    // Test implementation
  })

  it('handles props correctly', () => {
    // Test props handling
  })

  it('applies modifiers correctly', () => {
    // Test modifier application
  })
})
```

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @tachui/core test

# Watch mode
pnpm --filter @tachui/core test --watch

# Coverage
pnpm test:coverage
```

## Documentation

### Types of Documentation

1. **API Documentation**: Auto-generated from TypeScript
2. **Guide Documentation**: Hand-written guides in `docs/guide/`
3. **Component Examples**: Interactive examples in `apps/examples/`
4. **Code Comments**: Inline documentation

### Writing Documentation

- **Clear examples** that developers can copy/paste
- **SwiftUI comparisons** when relevant
- **Performance notes** for optimization-sensitive features
- **Migration guides** for breaking changes

### Building Documentation

```bash
# API docs (TypeDoc)
pnpm docs:api

# Guide docs (VitePress)
pnpm docs:build

# Development server
pnpm docs:dev
```

## Community

### Getting Help

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussion
- **Documentation**: Comprehensive guides and API reference

### Communication Guidelines

- **Be respectful** and inclusive
- **Provide context** when asking questions
- **Search first** before creating new issues
- **Use templates** for issues and PRs
- **Tag appropriately** with relevant labels

### Recognition

Contributors are recognized in:

- **GitHub contributors list**
- **Release notes** for significant contributions
- **Documentation credits** for docs improvements
- **Special mentions** for outstanding community support

## Development Tips

### Performance Considerations

- **Bundle size impact**: Check bundle size changes
- **Runtime performance**: Profile reactive updates
- **Memory usage**: Test for memory leaks
- **Accessibility**: Ensure ARIA compliance

### SwiftUI Compatibility

- **API consistency**: Match SwiftUI naming when possible
- **Behavior parity**: Maintain expected SwiftUI behavior
- **Documentation**: Note differences from SwiftUI

### Code Style

- **TypeScript-first**: Leverage TypeScript's type system
- **Functional patterns**: Prefer pure functions
- **Immutability**: Avoid mutations where possible
- **Clear naming**: Use descriptive variable and function names

---

## Questions?

Don't hesitate to ask questions! We're here to help:

- **Create an issue** for bugs or feature requests
- **Start a discussion** for questions or ideas
- **Check existing documentation** first

Thank you for contributing to tachUI!
