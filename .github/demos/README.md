# tachUI Demo Applications

This repository contains demo applications showcasing the tachUI framework capabilities.

## Applications

### Intro App
A marketing landing page demonstrating tachUI's responsive design, theming, and component system.

- **Location**: `intro/`
- **Tech Stack**: tachUI Core, tachUI Symbols
- **Features**: Responsive design, dark/light theme, optimized bundle

### Calculator App
A fully functional calculator with Apple-style design and advanced features.

- **Location**: `calculator/`
- **Tech Stack**: tachUI Core, tachUI Symbols, Advanced State Management
- **Features**: Scientific calculations, history tape, keyboard support, themes

## Development

### Prerequisites
- Node.js 20+
- pnpm 10+

### Setup
```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Start specific app
pnpm intro:dev
pnpm calculator:dev
```

### Building
```bash
# Build all applications
pnpm build

# Build specific app
pnpm intro:build
pnpm calculator:build
```

### Quality Assurance
```bash
# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Preview built applications
pnpm preview
```

## Package Versions

Both applications use published npm packages:
- `@tachui/core`: ^0.7.0-alpha1
- `@tachui/symbols`: ^0.7.0-alpha1

## Repository Structure

```
demos/
├── intro/           # Marketing landing page
├── calculator/      # Calculator application  
├── package.json     # Workspace configuration
├── pnpm-workspace.yaml
└── README.md
```

## Contributing

1. Each application should be self-contained
2. Use latest published tachUI packages
3. Follow tachUI coding standards
4. Include comprehensive README in each app directory
5. Ensure applications build and run correctly

## License

Mozilla Public License 2.0 - see individual application directories for details.