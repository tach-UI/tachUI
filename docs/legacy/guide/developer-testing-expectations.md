# Developer Testing Expectations for TachUI

## Overview

This document outlines the testing expectations and requirements for developers working on the TachUI project. Following these guidelines ensures code quality, security, and maintainability across the entire framework.

## Testing Philosophy

TachUI follows a **comprehensive testing approach** that prioritizes:

1. **Real Integration Testing** over extensive mocking
2. **Security-First Development** with automated vulnerability detection
3. **Performance Awareness** with continuous monitoring
4. **Memory Safety** with leak detection and cleanup validation
5. **Real-World Validation** through complete user workflow testing

## Mandatory Testing Requirements

### 1. Test Coverage Requirements

- **Minimum Coverage**: 95% code coverage for all packages
- **Critical Paths**: 100% coverage for security-sensitive code
- **New Features**: Must include comprehensive test suite before merge
- **Bug Fixes**: Must include regression tests

### 2. Required Test Types

Every feature or component must include:

#### ✅ Unit Tests
```typescript
// Example: Component unit test
describe('Button Component', () => {
  it('should render with correct props', () => {
    const button = Button({ text: 'Click me', variant: 'primary' })
    expect(button.props.text).toBe('Click me')
    expect(button.props.variant).toBe('primary')
  })
})
```

#### ✅ Integration Tests
```typescript
// Example: Real DOM integration test
describe('Button Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-root"></div>'
  })

  it('should handle click events in real DOM', () => {
    const testRoot = document.querySelector('#test-root')!
    const button = Button({ text: 'Click me', onClick: mockHandler })
    
    render(button, testRoot)
    
    const buttonElement = testRoot.querySelector('button')!
    buttonElement.click()
    
    expect(mockHandler).toHaveBeenCalled()
  })
})
```

#### ✅ Memory Leak Tests
```typescript
// Example: Memory leak testing
describe('Component Memory Management', () => {
  it('should not leak memory during lifecycle', async () => {
    const memoryTester = new MemoryLeakTester()
    
    const result = await memoryTester.testComponentMemory('Button', {
      text: 'Test'
    }, {
      iterations: 100,
      operationsPerIteration: 10
    })
    
    expect(result.hasLeak).toBe(false)
  })
})
```

#### ✅ Security Tests
```typescript
// Example: Security validation
describe('Input Component Security', () => {
  it('should sanitize user input', () => {
    const maliciousInput = '<script>alert("XSS")</script>'
    const input = TextInput({ value: maliciousInput })
    
    expect(input.sanitizedValue).not.toContain('<script>')
    expect(input.sanitizedValue).toBe('alert("XSS")')
  })
})
```

### 3. Plugin Development Testing

Plugin developers must include:

#### ✅ Plugin Compatibility Tests
```typescript
describe('My Plugin Compatibility', () => {
  it('should work with Forms plugin', async () => {
    const pluginTester = new PluginTestingFramework()
    
    const result = await pluginTester.testPluginCombination([
      'my-plugin',
      '@tachui/forms'
    ])
    
    expect(result.compatible).toBe(true)
    expect(result.conflicts).toHaveLength(0)
  })
})
```

#### ✅ Plugin Security Tests
```typescript
describe('My Plugin Security', () => {
  it('should not introduce vulnerabilities', async () => {
    const scanner = new SecurityVulnerabilityScanner()
    
    const results = await scanner.scanPlugin('my-plugin')
    
    expect(results.criticalVulnerabilities).toHaveLength(0)
    expect(results.complianceStatus.owasp).toBe(true)
  })
})
```

## Development Workflow

### 1. Pre-Development

Before starting any feature:

```bash
# Run full test suite to establish baseline
pnpm test

# Run security scan
pnpm test:security

# Check performance benchmarks
pnpm benchmark:quick
```

### 2. During Development

#### Test-Driven Development (TDD)
1. Write failing test first
2. Implement minimal code to make test pass
3. Refactor while keeping tests green
4. Add edge cases and error scenarios

#### Continuous Testing
```bash
# Run tests in watch mode during development
pnpm test --watch

# Run specific test file
pnpm test MyComponent.test.ts

# Run tests with coverage
pnpm test --coverage
```

### 3. Pre-Commit Requirements

Before committing any code:

#### ✅ Run Complete Test Suite
```bash
pnpm test:ci
```
**Must Pass**: All tests must pass with no regressions

#### ✅ Security Validation
```bash
pnpm test:security
```
**Must Pass**: No critical or high-severity vulnerabilities

#### ✅ Performance Check
```bash
pnpm benchmark:quick
```
**Must Pass**: No significant performance regressions

#### ✅ Memory Validation
```bash
pnpm test:memory
```
**Must Pass**: No memory leaks detected

### 4. Pull Request Requirements

Every pull request must include:

#### ✅ Test Coverage Report
- Include coverage report showing affected lines
- Justify any coverage decreases
- Add tests for new uncovered code paths

#### ✅ Performance Impact Assessment
- Include performance benchmark results
- Document any performance changes
- Provide justification for performance regressions

#### ✅ Security Review
- Include security scan results
- Document any new security considerations
- Address all security findings before merge

#### ✅ Real-World Scenario Testing
For significant features, include real-world scenario tests:

```typescript
// Example: Real-world scenario for new feature
const newFeatureScenario: RealWorldScenario = {
  name: 'New Feature End-to-End Test',
  description: 'Complete user workflow with new feature',
  tags: ['e2e', 'new-feature'],
  estimatedDuration: 5000,
  
  setup: async () => {
    // Set up realistic application state
  },
  
  steps: [
    // Complete user workflow steps
  ],
  
  successCriteria: [
    'User can discover the new feature',
    'Feature works as expected',
    'No usability issues detected',
    'Performance remains acceptable'
  ]
}
```

## Specific Testing Guidelines

### 1. Component Testing

#### State Management
```typescript
describe('Component State', () => {
  it('should manage state correctly', () => {
    const [count, setCount] = createSignal(0)
    
    // Test initial state
    expect(count()).toBe(0)
    
    // Test state updates
    setCount(5)
    expect(count()).toBe(5)
    
    // Test cleanup
    // Ensure signals are properly disposed
  })
})
```

#### Event Handling
```typescript
describe('Component Events', () => {
  it('should handle events correctly', () => {
    const mockHandler = vi.fn()
    const component = MyComponent({ onAction: mockHandler })
    
    // Trigger event
    component.triggerAction('test-data')
    
    // Verify handler called with correct data
    expect(mockHandler).toHaveBeenCalledWith('test-data')
  })
})
```

#### Error Boundaries
```typescript
describe('Component Error Handling', () => {
  it('should handle errors gracefully', () => {
    const errorBoundary = ErrorBoundary({
      fallback: ErrorFallback,
      children: ThrowingComponent()
    })
    
    // Should not crash the application
    expect(() => render(errorBoundary)).not.toThrow()
    
    // Should display fallback UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

### 2. Plugin Testing

#### Installation and Lifecycle
```typescript
describe('Plugin Lifecycle', () => {
  it('should install and uninstall correctly', async () => {
    const plugin = createTestPlugin()
    
    // Test installation
    await installPlugin(plugin)
    expect(isPluginInstalled(plugin.name)).toBe(true)
    
    // Test functionality
    const instance = getTachUIInstance()
    expect(instance.getComponent('PluginComponent')).toBeDefined()
    
    // Test uninstallation
    await uninstallPlugin(plugin.name)
    expect(isPluginInstalled(plugin.name)).toBe(false)
  })
})
```

#### Dependency Management
```typescript
describe('Plugin Dependencies', () => {
  it('should handle dependencies correctly', async () => {
    const dependency = createDependencyPlugin()
    const dependent = createDependentPlugin()
    
    // Should fail without dependency
    await expect(installPlugin(dependent)).rejects.toThrow()
    
    // Should succeed with dependency
    await installPlugin(dependency)
    await installPlugin(dependent)
    
    expect(isPluginInstalled(dependency.name)).toBe(true)
    expect(isPluginInstalled(dependent.name)).toBe(true)
  })
})
```

### 3. Security Testing

#### Input Validation
```typescript
describe('Input Security', () => {
  it('should validate all inputs', () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '\x3Cscript\x3Ealert("XSS")\x3C/script\x3E'
    ]
    
    maliciousInputs.forEach(input => {
      const result = validateInput(input)
      expect(result.isValid).toBe(false)
      expect(result.sanitized).not.toContain('<script>')
    })
  })
})
```

#### Authentication and Authorization
```typescript
describe('Security Controls', () => {
  it('should enforce access controls', () => {
    const unauthorizedUser = { role: 'guest' }
    const adminFunction = () => deleteAllData()
    
    expect(() => 
      executeWithAuth(adminFunction, unauthorizedUser)
    ).toThrow('Access denied')
  })
})
```

### 4. Performance Testing

#### Rendering Performance
```typescript
describe('Rendering Performance', () => {
  it('should render efficiently', async () => {
    const startTime = performance.now()
    
    const largeList = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }))
    
    render(List({ items: largeList }))
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // 100ms
  })
})
```

#### Memory Performance
```typescript
describe('Memory Performance', () => {
  it('should manage memory efficiently', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    // Perform memory-intensive operations
    for (let i = 0; i < 1000; i++) {
      const component = MyComponent({ data: generateLargeData() })
      render(component)
      cleanup(component)
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc()
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB
  })
})
```

## Common Testing Patterns

### 1. Setup and Teardown

```typescript
describe('Component Tests', () => {
  let testRoot: HTMLElement
  let cleanup: () => void

  beforeEach(() => {
    testRoot = document.createElement('div')
    testRoot.id = 'test-root'
    document.body.appendChild(testRoot)
    cleanup = () => {
      document.body.removeChild(testRoot)
    }
  })

  afterEach(() => {
    cleanup()
  })
})
```

### 2. Async Testing

```typescript
describe('Async Operations', () => {
  it('should handle async data loading', async () => {
    const mockData = { id: 1, name: 'Test' }
    vi.mocked(fetchData).mockResolvedValue(mockData)
    
    const component = DataComponent()
    
    // Wait for initial loading state
    expect(component.isLoading()).toBe(true)
    
    // Wait for data to load
    await waitFor(() => {
      expect(component.isLoading()).toBe(false)
      expect(component.data()).toEqual(mockData)
    })
  })
})
```

### 3. Error Testing

```typescript
describe('Error Handling', () => {
  it('should handle network errors', async () => {
    vi.mocked(fetchData).mockRejectedValue(new Error('Network error'))
    
    const component = DataComponent()
    
    await waitFor(() => {
      expect(component.error()).toBeDefined()
      expect(component.error()?.message).toBe('Network error')
    })
  })
})
```

## Test Quality Standards

### 1. Test Naming
- Use descriptive names that explain the scenario
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests with clear describe blocks

### 2. Assertions
- Use specific assertions with clear expected values
- Include meaningful error messages
- Test both positive and negative cases

### 3. Test Independence
- Each test should be independent and isolated
- Use proper setup/teardown to ensure clean state
- Avoid test interdependencies

### 4. Test Maintainability
- Keep tests simple and focused
- Use helper functions for common operations
- Document complex test logic with comments

## Debugging Tests

### 1. Debug Mode
```bash
# Run tests with debug output
DEBUG=true pnpm test

# Run specific test with full output
pnpm test --reporter=verbose MyComponent.test.ts
```

### 2. Browser Debugging
```typescript
describe('Debug Test', () => {
  it('should debug in browser', async () => {
    // Set breakpoint for browser debugging
    debugger
    
    const component = MyComponent()
    render(component)
    
    // Use console.log for debugging
    console.log('Component state:', component.getState())
  })
})
```

### 3. Memory Debugging
```bash
# Run tests with memory monitoring
NODE_OPTIONS="--expose-gc" pnpm test:memory
```

## Tools and Utilities

### Available Testing Tools

1. **RealWorldScenarioTester** - Complete user workflow testing
2. **MemoryLeakTester** - Memory leak detection and validation
3. **PluginTestingFramework** - Plugin compatibility and conflict testing
4. **SecurityVulnerabilityScanner** - Automated security vulnerability detection
5. **PerformanceBenchmark** - Performance measurement and regression detection
6. **BundleSizeMonitor** - Bundle size tracking and optimization

### Custom Test Utilities

Create reusable test utilities for common patterns:

```typescript
// test-utils.ts
export const createTestEnvironment = () => {
  const testRoot = document.createElement('div')
  testRoot.id = 'test-root'
  document.body.appendChild(testRoot)
  
  return {
    testRoot,
    cleanup: () => document.body.removeChild(testRoot),
    render: (component: any) => render(component, testRoot)
  }
}

export const waitForElement = (selector: string, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const check = () => {
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      } else {
        setTimeout(check, 100)
      }
    }
    
    check()
  })
}
```

## Continuous Integration

### Required CI Checks

All pull requests must pass:

1. **Unit Tests** - `pnpm test:ci`
2. **Integration Tests** - `pnpm test:integration`
3. **Security Tests** - `pnpm test:security`
4. **Performance Tests** - `pnpm test:performance`
5. **Memory Tests** - `pnpm test:memory`
6. **Plugin Tests** - `pnpm test:plugins`

### Performance Budgets

Enforce performance budgets in CI:

```yaml
# .github/workflows/test.yml
- name: Performance Budget Check
  run: |
    pnpm benchmark:quick
    node scripts/check-performance-budget.js
```

### Security Gates

Block merges for security issues:

```yaml
- name: Security Gate
  run: |
    pnpm test:security
    if [ -f security-report.json ]; then
      node scripts/check-security-gate.js
    fi
```

## Getting Help

### Resources

- **Testing Framework Documentation**: `/apps/docs/testing-framework.md`
- **Example Tests**: `/packages/core/__tests__/`
- **Testing Tools**: `/tools/testing/`
- **CI Configuration**: `/.github/workflows/`

### Common Issues

1. **Memory Exhaustion**: Use `it.skip()` for memory-intensive tests in CI
2. **Flaky Tests**: Add proper wait conditions and cleanup
3. **Performance Regression**: Check for unintentional algorithm changes
4. **Security Failures**: Review input validation and sanitization

### Support

For testing questions or issues:

1. Check existing test examples for patterns
2. Review this documentation for requirements
3. Ask for help in team channels
4. Create an issue for framework bugs

Remember: **Good tests are an investment in code quality and team productivity**. Taking time to write comprehensive tests saves time in debugging and maintenance later.