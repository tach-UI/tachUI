# TachUI Navigation Performance Benchmarks

This directory contains comprehensive performance benchmarks for the TachUI Navigation package, validating the 59% bundle size reduction achieved in Phase 5 optimization.

## Benchmark Categories

### 1. Navigation Performance (`navigation-performance.bench.ts`)
- **Component Creation**: NavigationStack, NavigationLink, SimpleTabView creation performance
- **Navigation Operations**: Route registration, navigation actions, modifier application
- **Complex Scenarios**: Deep navigation stacks, multiple tabs, complex modifier chains
- **Memory Performance**: Rapid creation/destruction, large state management
- **Bundle Impact**: Core vs full API usage comparison

### 2. Quick Benchmarks (`quick.bench.ts`)
- Essential baseline performance checks
- Fast execution for development workflow
- Core component creation and basic operations

### 3. Bundle Size Validation (`bundle-size.bench.ts`)
- Validates 59% bundle size reduction (201KB → 82KB target)
- Tree shaking effectiveness testing
- Import performance analysis
- Code complexity metrics

### 4. Browser Performance (`browser.spec.ts`)
- Real-world performance in browser environment
- User interaction response times
- Memory usage during navigation
- Large navigation tree rendering performance

## Running Benchmarks

### From Navigation Package
```bash
# Quick performance check
pnpm benchmark:quick

# Full performance suite
pnpm benchmark

# Bundle size validation
pnpm benchmark:bundle

# Browser performance tests
pnpm benchmark:browser

# Run all benchmarks
pnpm benchmark:all
```

### From Root Project
```bash
# Navigation-specific benchmarks
pnpm benchmark:navigation:quick
pnpm benchmark:navigation
pnpm benchmark:navigation:bundle
pnpm benchmark:navigation:all
```

## Performance Targets

### Bundle Size (Phase 5 Optimization Results)
- **ESM Bundle**: <85KB (target: 82KB, 59% reduction from 201KB)
- **CJS Bundle**: <90KB
- **Gzipped**: <20KB (target: 18.21KB)

### Runtime Performance
- **Component Creation**: <50ms for complex navigation stacks
- **Navigation Response**: <10ms for user interactions
- **Tab Switching**: <5ms response time
- **Memory Usage**: <5MB increase for 100 components

### Code Complexity
- **Exports**: <100 named exports (optimized from 180+)
- **Bundle Parsing**: <100ms initialization time

## Benchmark Results

Results are saved to `./benchmarks/results.json` for tracking performance over time.

## Phase 5 Optimization Impact

The benchmarks validate the following Phase 5 Week 11 optimizations:
- Removed migration tools, testing utilities, examples, and integrations
- Achieved 59% bundle size reduction
- Maintained all core functionality with 193 passing tests
- Focused exports on essential navigation components only

## Continuous Performance Monitoring

These benchmarks should be run:
- Before major releases
- After significant code changes
- During performance optimization phases
- As part of CI/CD pipeline (quick benchmarks)