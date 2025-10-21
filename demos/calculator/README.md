# TachUI Calculator App

A beautiful, fully-functional calculator built with TachUI Core demonstrating precise interaction patterns and Apple-inspired design.

## 🎯 Demo Objectives

This calculator app showcases:

- **Precise Interaction Patterns**: Button press states, haptic feedback, visual transitions
- **Apple-Style Design**: iOS Calculator-inspired UI with modern glassmorphism effects
- **SwiftUI-Style Architecture**: Clean component composition and reactive state management
- **Core-Only Bundle**: ~17.5KB gzipped (under 60KB target)
- **Full Keyboard Support**: Complete keyboard navigation and shortcuts
- **Responsive Design**: Works perfectly on desktop and mobile

## 🚀 Quick Start

```bash
# Development
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Analyze bundle size
pnpm analyze
```

## 🧮 Features

### Calculator Functions
- ✅ Basic arithmetic operations (+, -, ×, ÷)
- ✅ Decimal point support
- ✅ Plus/minus toggle (±)
- ✅ Percentage calculations (%)
- ✅ All Clear (AC) function
- ✅ Memory and operation chaining
- ✅ Error handling (division by zero, etc.)

### Interactions
- ✅ Click/tap buttons
- ✅ Full keyboard support
- ✅ Haptic feedback (on supported devices)
- ✅ Visual press states
- ✅ Smooth animations

### Keyboard Shortcuts
| Key | Function |
|-----|----------|
| `0-9` | Number input |
| `+ - * /` | Operations |
| `=` or `Enter` | Equals |
| `Escape` or `C` | Clear |
| `.` | Decimal point |
| `%` | Percentage |

## 🏗️ Architecture

### Component Structure
```
CalculatorApp/
├── CalculatorDisplay     # Shows current value with formatting
├── CalculatorKeypad      # Button grid layout
│   └── CalculatorButton  # Individual button with press states
└── useKeyboardSupport    # Keyboard input handling hook
```

### State Management
- Pure functions for calculator logic (`calculator-logic.ts`)
- TachUI reactive signals for UI state
- Clean separation of concerns

### Styling System
- CSS custom properties for theming
- Apple-inspired design tokens
- Responsive breakpoints
- Smooth transitions and animations

## 📦 Bundle Analysis

| Component | Size (gzipped) | Purpose |
|-----------|----------------|---------|
| TachUI Core | 16.29 KB | Framework runtime |
| Calculator App | 1.26 KB | Application code |
| **Total** | **~17.5 KB** | **Complete app** |

## 🎨 Design System

The calculator uses an Apple-inspired design system with:

- **Colors**: iOS Calculator color palette
- **Typography**: SF Pro Display/Text font stack
- **Spacing**: Consistent 12px grid system
- **Animations**: 150ms cubic-bezier transitions
- **Effects**: Glassmorphism backdrop blur

## 🧪 Testing

This calculator demonstrates:

1. **Real-world TachUI usage** - How external apps consume TachUI packages
2. **Bundle size efficiency** - Core-only apps stay lightweight
3. **Component patterns** - Best practices for TachUI app architecture
4. **Interaction design** - Smooth animations and feedback
5. **Accessibility** - Keyboard navigation and semantic markup

## 🔧 Technical Implementation

### Built with TachUI Core
- `VStack`, `HStack` - Layout components
- `Button`, `Text` - UI components  
- `createSignal` - Reactive state
- `mountRoot` - DOM rendering

### External Dependencies
- Vite 7.1.1 - Build tooling
- TypeScript - Type safety

### No External UI Libraries
This app demonstrates that TachUI Core provides everything needed for production applications without additional UI dependencies.

## 🔧 Development Notes

### Component Context for State()

Components that use `State()` and are called by other components need to be wrapped with `withComponentContext`:

```typescript
// CalculatorDisplay.ts - Uses State() internally
import { State, VStack, withComponentContext } from '@tachui/core'

// Internal component function
function _CalculatorDisplay(props): ComponentInstance {
  const isHiding = State(true) // This requires component context
  // ... component logic
}

// Export wrapped version
export const CalculatorDisplay = withComponentContext(_CalculatorDisplay, 'CalculatorDisplay')

// Now works when called by CalculatorApp:
function CalculatorApp() {
  return VStack({
    children: [
      CalculatorDisplay({ value: "123" }) // ✅ Context provided automatically
    ]
  })
}
```

This ensures that `State()` has proper component context when the calculator loads. See the [TachUI State Management Guide](https://github.com/TachUI/tachui/blob/main/apps/docs/guide/state-management.md#component-context-wrapping) for complete documentation.

---

**Part of the TachUI 1.0 release demonstration suite.**