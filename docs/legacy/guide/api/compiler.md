# Compiler API Reference

*This API reference is coming soon. We're working on comprehensive documentation for TachUI's SwiftUI syntax transformation system.*

Complete TypeScript API documentation for TachUI's build-time compiler that transforms SwiftUI-style syntax into efficient web components.

## Planned Content

This reference will cover:

- **Parser APIs** - SwiftUI syntax parsing and AST generation
- **Transformer APIs** - AST transformation and optimization
- **Code Generation** - DOM creation and reactive updates
- **Plugin System** - Vite plugin configuration and hooks
- **Type System** - Compiler type checking and inference

## Quick Preview

```typescript
// Compiler API (planned)
import { TachUICompiler, CompilerOptions } from '@tachui/compiler'

const compiler = new TachUICompiler({
  target: 'es2020',
  module: 'esm',
  optimization: {
    minify: true,
    treeShaking: true,
    inlineSignals: true
  }
})

const result = await compiler.transform(sourceCode, {
  filename: 'Component.tsx',
  sourceMap: true
})
```

## Current Status

🚧 **In Development** - Compiler API documentation is being written with complete type definitions and examples.

## Alternative Resources

While we finish this reference:

- **[Compiler Guide](/guide/compiler)** - How the compiler works
- **[Build Tooling](/guide/build-tooling)** - Vite integration setup
- **[GitHub Source](https://github.com/whoughton/TachUI/tree/main/packages/compiler)** - Current implementation

## Get Notified

Follow our progress:

- **[GitHub Issues](https://github.com/whoughton/TachUI/issues)** - Compiler development