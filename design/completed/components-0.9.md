# tachUI Components v0.9.0 - Complete Reference

This document provides a comprehensive reference of all components available in tachUI v0.9.0, organized by package and functionality.

## Component Statistics
- **Total Packages:** 17
- **Total Components:** 80+ individual components
- **Architecture:** Modular, plugin-based system

## Import Structure
Components are organized by package with clear import paths:

```typescript
// Core infrastructure
import { ComponentFactory, GradientSystem } from '@tachui/core'
import { CSSClassManager } from '@tachui/core/css-classes'

// UI primitives
import { VStack, Text, Button } from '@tachui/primitives'
import { Spacer, Divider } from '@tachui/primitives/layout'
import { Image, ScrollView } from '@tachui/primitives/display'
import { EnhancedButton, Toggle } from '@tachui/primitives/controls'
import { BasicForm } from '@tachui/primitives/forms'

// Form components
import { TextField, EmailField, PasswordField } from '@tachui/forms/text-input'
import { Checkbox, Radio, Select } from '@tachui/forms/selection'
import { DatePicker, TimeField } from '@tachui/forms/date-picker'
import { Stepper, Slider } from '@tachui/forms/advanced'

// Advanced features
import { NavigationStack, TabView } from '@tachui/navigation'
import { List, Menu } from '@tachui/data'
import { ActionSheet, Alert } from '@tachui/mobile'
import { Grid, LazyVGrid } from '@tachui/grid'
import { Symbol, SystemImage } from '@tachui/symbols'
import { App, Window, WindowGroup } from '@tachui/viewport'
import { Show, ForEach } from '@tachui/flow-control'
```

---

## Core Infrastructure Components

### @tachui/core
**Package:** `@tachui/core` | **Components:** 5 core components

| Component | Description | Use Case | Package |
|-----------|-------------|----------|---------|
| ComponentFactory | Core component creation and management | Foundation for all tachUI components | @tachui/core/components |
| ComponentWrapper | Component lifecycle and behavior wrapper | Managing component state and events | @tachui/core/components |
| LayoutComponent | Core layout infrastructure | Base for stack and positioning components | @tachui/core/components |
| CSSClassManager | Dynamic CSS class management | Runtime styling and theming | @tachui/core/css-classes |
| GradientSystem | Advanced gradient and visual effects | Background effects, text gradients | @tachui/core/gradients |

---

## Foundation UI Components

### @tachui/primitives  
**Package:** `@tachui/primitives` | **Components:** 19 components

#### Layout Components
| Component | Description | Package |
|-----------|-------------|---------|
| VStack | Vertical stack layout container | @tachui/primitives/layout |
| HStack | Horizontal stack layout container | @tachui/primitives/layout |
| ZStack | Overlay/absolute positioning stack | @tachui/primitives/layout |
| Spacer | Flexible spacing component | @tachui/primitives/layout |
| Divider | Visual separator with theming | @tachui/primitives/layout |

#### Display Components
| Component | Description | Package |
|-----------|-------------|---------|
| Text | Rich text with formatting and styling | @tachui/primitives/display |
| EnhancedText | Advanced text features and typography | @tachui/primitives/display |
| Image | Optimized image component with states | @tachui/primitives/display |
| EnhancedImage | Image with advanced features (lazy loading, etc.) | @tachui/primitives/display |
| ScrollView | Scrollable content container | @tachui/primitives/display |
| EnhancedScrollView | Advanced scroll with pull-to-refresh | @tachui/primitives/display |
| HTML | Raw HTML element wrapper | @tachui/primitives/display |
| H1-H6 | Semantic heading elements | @tachui/primitives/display |

#### Control Components
| Component | Description | Package |
|-----------|-------------|---------|
| Button | Interactive button with variants and states | @tachui/primitives/controls |
| EnhancedButton | Advanced button with animations and accessibility | @tachui/primitives/controls |
| Link | Navigation link with URL handling | @tachui/primitives/controls |
| Toggle | Binary state control (on/off) | @tachui/primitives/controls |
| EnhancedToggle | Advanced toggle with animations | @tachui/primitives/controls |
| Picker | Selection picker with options | @tachui/primitives/controls |
| EnhancedPicker | Advanced picker with search and grouping | @tachui/primitives/controls |

#### Basic Form Components
| Component | Description | Use Case | Package |
|-----------|-------------|----------|---------|
| BasicForm | Simple form container with validation | Basic form layouts | @tachui/primitives/forms |
| BasicInput | Text input with basic validation | Simple text input | @tachui/primitives/forms |

---

## Form & Input Components

### @tachui/forms
**Package:** `@tachui/forms` | **Components:** 27+ form components

#### Text Input Components
| Component | Description | Input Type | Package |
|-----------|-------------|------------|---------|
| TextField | General purpose text input | text | @tachui/forms/text-input |
| EmailField | Email validation and formatting | email | @tachui/forms/text-input |
| PasswordField | Secure password input | password | @tachui/forms/text-input |
| SearchField | Search input with suggestions | search | @tachui/forms/text-input |
| URLField | URL validation and formatting | url | @tachui/forms/text-input |
| PhoneField | Phone number formatting | tel | @tachui/forms/text-input |
| NumberField | Numeric input with controls | number | @tachui/forms/text-input |
| CreditCardField | Credit card number formatting | text | @tachui/forms/text-input |
| SSNField | Social security number formatting | text | @tachui/forms/text-input |
| PostalCodeField | Postal code formatting | text | @tachui/forms/text-input |
| TextArea | Multi-line text input | textarea | @tachui/forms/text-input |
| DateField | Date picker integration | date | @tachui/forms/date-picker |
| TimeField | Time picker integration | time | @tachui/forms/date-picker |
| ColorField | Color picker | color | @tachui/forms/text-input |

#### Selection Components
| Component | Description | Use Case | Package |
|-----------|-------------|----------|---------|
| Checkbox | Single checkbox control | Binary selection | @tachui/forms/selection |
| CheckboxGroup | Multiple checkbox selection | Multiple options | @tachui/forms/selection |
| Switch | iOS-style toggle switch | On/off states | @tachui/forms/selection |
| Radio | Single selection radio button | Mutually exclusive options | @tachui/forms/selection |
| RadioGroup | Group of radio buttons | Form radio groups | @tachui/forms/selection |
| Combobox | Searchable dropdown | Large option lists | @tachui/forms/selection |
| MultiSelect | Multiple selection dropdown | Tag selection | @tachui/forms/selection |
| Select | Basic dropdown selector | Single selection | @tachui/forms/selection |

#### Advanced Form Components
| Component | Description | Use Case | Package |
|-----------|-------------|----------|---------|
| Stepper | Numeric stepper with +/- controls | Numeric input with controls | @tachui/forms/advanced |
| Slider | Range slider with marks and values | Range selection | @tachui/forms/advanced |
| DatePicker | Rich calendar date selection | Date selection interface | @tachui/forms/date-picker |

---

## Navigation Components

### @tachui/navigation
**Package:** `@tachui/navigation` | **Components:** 15+ navigation components

| Component | Description | Use Case | Package |
|-----------|-------------|----------|---------|
| NavigationStack | Stack-based navigation container | iOS-style navigation | @tachui/navigation |
| NavigationLink | Declarative navigation links | Programmatic navigation | @tachui/navigation |
| TabView | Tab-based navigation | Multi-view navigation | @tachui/navigation |
| SimpleTabView | Lightweight tab implementation | Simple tab interfaces | @tachui/navigation |
| NavigationView | Legacy navigation container | Backward compatibility | @tachui/navigation |
| NavigationManager | Global navigation state management | App-wide navigation | @tachui/navigation |
| NavigationPath | URL path management | Deep linking support | @tachui/navigation |
| NavigationRouter | Client-side routing | SPA navigation | @tachui/navigation |
| ProgrammaticNavigation | Navigation control APIs | Advanced navigation patterns | @tachui/navigation |
| NavigationTitle | Navigation bar title | Header configuration | @tachui/navigation |
| NavigationBarItems | Custom navigation bar items | Toolbar customization | @tachui/navigation |
| ToolbarBackground | Toolbar background styling | Visual customization | @tachui/navigation |
| ToolbarForegroundColor | Toolbar text color | Theme integration | @tachui/navigation |

---

## Data Display Components

### @tachui/data
**Package:** `@tachui/data` | **Components:** 2 main components

| Component | Description | Use Case | Package |
|-----------|-------------|----------|---------|
| List | Virtualized scrollable list | Large data sets | @tachui/data |
| Menu | Contextual menu system | Right-click and dropdown menus | @tachui/data |

### @tachui/flow-control
**Package:** `@tachui/flow-control` | **Components:** 4 components

| Component | Description | Use Case | Package |
|-----------|-------------|----------|---------|
| Show | Conditional content display | Show/hide based on conditions | @tachui/flow-control |
| When | If-then conditional rendering | Simple conditional logic | @tachui/flow-control |
| Unless | Inverse conditional | Hide/show opposite conditions | @tachui/flow-control |
| ForEach | Array/list iteration | Dynamic list rendering | @tachui/flow-control |

---

## Mobile-Specific Components

### @tachui/mobile
**Package:** `@tachui/mobile` | **Components:** 2 mobile components

| Component | Description | Platform | Package |
|-----------|-------------|----------|---------|
| ActionSheet | Mobile action selection | iOS-style action sheets | @tachui/mobile |
| Alert | Modal dialog with backdrop | Mobile alert patterns | @tachui/mobile |

---

## Layout & Grid Components

### @tachui/grid
**Package:** `@tachui/grid` | **Components:** 6 grid components

| Component | Description | Layout Type | Package |
|-----------|-------------|-------------|---------|
| Grid | Basic CSS Grid container | CSS Grid | @tachui/grid |
| EnhancedGrid | Grid with advanced features | Advanced Grid | @tachui/grid |
| GridRow | Grid row container | Grid Row | @tachui/grid |
| EnhancedGridRow | Row with additional features | Enhanced Row | @tachui/grid |
| LazyHGrid | Horizontal lazy-loaded grid | Performance Grid | @tachui/grid |
| LazyVGrid | Vertical lazy-loaded grid | Performance Grid | @tachui/grid |
| GridItem | Individual grid cell | Grid Item | @tachui/grid |

### @tachui/symbols
**Package:** `@tachui/symbols` | **Components:** 1 main component + infrastructure

| Component | Description | Icon System | Package |
|-----------|-------------|-------------|---------|
| Symbol | SF Symbols-compatible icon component | SF Symbols | @tachui/symbols |
| SystemImage | System icon rendering | Platform Icons | @tachui/symbols |
| LucideIconSet | Lucide icons integration | Lucide Icons | @tachui/symbols |

---

## Viewport Management

### @tachui/viewport
**Package:** `@tachui/viewport` | **Components:** 4 viewport components

| Component | Description | Platform Support | Package |
|-----------|-------------|------------------|---------|
| App | Application container component | Web, Desktop | @tachui/viewport |
| Window | Window management component | Desktop Apps | @tachui/viewport |
| WindowGroup | Multiple window handling | Multi-window Apps | @tachui/viewport |
| ExampleScenes | Sample implementation patterns | Documentation | @tachui/viewport |

---

## Component Usage Patterns

### Layout Hierarchy
```
App
├── Window
│   ├── NavigationStack
│   │   ├── VStack/HStack
│   │   │   ├── Text
│   │   │   ├── Button
│   │   │   └── List
│   │   └── TabView
│   └── Grid
└── ActionSheet/Alert (Overlay)
```

### Form Composition
```
BasicForm
├── TextField
├── Select
├── DatePicker
└── Button (Submit)
```

### Data Display
```
ScrollView
├── List
│   └── ForEach(items) { item in
│       ├── Text
│       └── Menu
│   }
└── Image
```

---

## Development Notes

### Component Architecture
- **Functional Components**: All components are functional with hooks
- **TypeScript First**: Full type safety across all components
- **Reactive System**: Built on tachUI's fine-grained reactivity
- **Modifier Chain**: Components accept modifier chains for styling
- **Plugin System**: Components auto-register with modifier system

### Best Practices
1. **Start with Primitives**: Use VStack, HStack for layouts
2. **Use Form Components**: Leverage validation and state management
3. **Apply Modifiers**: Chain modifiers for styling and behavior
4. **Consider Mobile**: Use mobile-specific components for iOS patterns
5. **Optimize Performance**: Use lazy grids for large datasets

### Package Dependencies
- **Core**: Required by all other packages
- **Primitives**: Foundation for UI components
- **Forms**: Requires primitives for input styling
- **Navigation**: Works with any layout component
- **Mobile**: Augments core components with mobile patterns

### Import Guidelines
1. **Default imports work for main exports**: `import { Button, VStack } from '@tachui/primitives'`
2. **Use specific paths for better tree-shaking**: `import { TextField } from '@tachui/forms/components/text-input'`
3. **Core modifiers are globally available**: No need to import basic modifiers like `padding`, `margin`
4. **Package subdirectories**: Most packages export from `src/index.ts` and specific subdirectories
5. **Auto-registration**: Components automatically register with the modifier system upon import
