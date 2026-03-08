---
title: Component Catalog (v0.9)
---

# Component Catalog (v0.9)

Every entry below comes directly from `design-docs/components-0.9.md`. Tables use the column order you requested: **Component · Group · Description · Package / Import**.

## @tachui/core · 5 components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `ComponentFactory` | Infrastructure | Component creation/lifecycle helper | `@tachui/core/components` |
| `ComponentWrapper` | Infrastructure | Wraps component state and events | `@tachui/core/components` |
| `LayoutComponent` | Infrastructure | Base class backing stacks/layout containers | `@tachui/core/components` |
| `CSSClassManager` | Infrastructure | Runtime CSS/utility manager | `@tachui/core/css-classes` |
| `GradientSystem` | Infrastructure | Gradient registry leveraged by effects | `@tachui/core/gradients` |

> UI components now ship in the plugin packages; keep this section in sync whenever core adds/removes infrastructure.

## @tachui/primitives · 19 components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `VStack` | Layout | Vertical stack container | `@tachui/primitives/layout` |
| `HStack` | Layout | Horizontal stack container | `@tachui/primitives/layout` |
| `ZStack` | Layout | Overlay/absolute positioning | `@tachui/primitives/layout` |
| `Spacer` | Layout | Flexible spacing element | `@tachui/primitives/layout` |
| `Divider` | Layout | Visual separator | `@tachui/primitives/layout` |
| `Grid`, `GridRow` | Layout | Experimental grid primitives | `@tachui/primitives/layout` |
| `Text`, `EnhancedText` | Display | Typography primitives | `@tachui/primitives/display` |
| `Image`, `EnhancedImage` | Display | Image components with loading states | `@tachui/primitives/display` |
| `ScrollView`, `EnhancedScrollView` | Display | Scroll containers (basic + advanced) | `@tachui/primitives/display` |
| `HTML` | Display | Raw HTML wrapper | `@tachui/primitives/display` |
| `H1`–`H6` | Display | Semantic heading elements | `@tachui/primitives/display` |
| `Button`, `EnhancedButton` | Controls | Interactive buttons | `@tachui/primitives/controls` |
| `Link` | Controls | Navigation link component | `@tachui/primitives/controls` |
| `Toggle`, `EnhancedToggle` | Controls | Boolean switch components | `@tachui/primitives/controls` |
| `Picker`, `EnhancedPicker` | Controls | Selection pickers (basic + advanced) | `@tachui/primitives/controls` |
| `BasicForm`, `BasicInput`, `DatePicker` (lightweight) | Basic forms | Minimal form primitives | `@tachui/primitives/forms` |

## @tachui/forms · 27+ components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `TextField` | Text input | General text input | `@tachui/forms/text-input` |
| `EmailField` | Text input | Email input with validation | `@tachui/forms/text-input` |
| `PasswordField` | Text input | Secure password input | `@tachui/forms/text-input` |
| `SearchField` | Text input | Search field with suggestions | `@tachui/forms/text-input` |
| `URLField` | Text input | URL validation | `@tachui/forms/text-input` |
| `PhoneField` | Text input | Phone formatting | `@tachui/forms/text-input` |
| `NumberField` | Text input | Numeric input | `@tachui/forms/text-input` |
| `CreditCardField`, `SSNField`, `PostalCodeField` | Text input | Masked inputs | `@tachui/forms/text-input` |
| `TextArea` | Text input | Multi-line input | `@tachui/forms/text-input` |
| `DateField`, `TimeField`, `DatePicker`, `TimePicker` | Text/advanced | Date/time inputs | `@tachui/forms/date-picker` + `.../advanced` |
| `ColorField` | Text input | Color picker | `@tachui/forms/text-input` |
| `Checkbox`, `CheckboxGroup` | Selection | Checkbox controls | `@tachui/forms/selection` |
| `Switch` | Selection | iOS-style toggle | `@tachui/forms/selection` |
| `Radio`, `RadioGroup` | Selection | Radio buttons | `@tachui/forms/selection` |
| `Combobox`, `MultiSelect`, `Select` | Selection | Drop-down controls | `@tachui/forms/selection` |
| `Stepper`, `Slider` | Advanced | Numeric controls | `@tachui/forms/advanced` |
| `Form`, `FormSection` | Advanced | Form container + grouping | `@tachui/forms` |

## @tachui/navigation · 15+ components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `NavigationStack` | Navigation | Stack navigation container | `@tachui/navigation` |
| `NavigationLink` | Navigation | Declarative link | `@tachui/navigation` |
| `NavigationView` | Navigation | Legacy container | `@tachui/navigation` |
| `TabView`, `SimpleTabView` | Navigation | Tab navigation shells | `@tachui/navigation` |
| `NavigationManager`, `NavigationPath`, `NavigationRouter`, `ProgrammaticNavigation` | Navigation | Routing/state helpers | `@tachui/navigation` |
| `NavigationTitle`, `NavigationBarItems`, `NavigationBarTitleDisplayMode`, `NavigationBarHidden`, `NavigationBarBackButtonHidden`, `ToolbarBackground`, `ToolbarForegroundColor` | Navigation | Toolbar/title customization | `@tachui/navigation` |

_Roadmap_: modal/sheet APIs, `NavigationSplitView`, `.searchable`.

## @tachui/data · 2 components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `List` | Data display | Virtualized list with sections | `@tachui/data` |
| `Menu` | Data display | Context/command menu | `@tachui/data` |

## @tachui/flow-control · 4 components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `Show` | Flow control | Conditional rendering helper | `@tachui/flow-control` |
| `When` | Flow control | If-then helper | `@tachui/flow-control` |
| `Unless` | Flow control | Inverse conditional helper | `@tachui/flow-control` |
| `ForEach`, `For` | Flow control | Iteration utilities | `@tachui/flow-control` |

## @tachui/mobile · 2 components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `ActionSheet` | Mobile | iOS-style action sheet | `@tachui/mobile` |
| `Alert` | Mobile | Modal alert dialog | `@tachui/mobile` |

## @tachui/grid · 7 components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `Grid`, `EnhancedGrid` | Layout | Grid containers | `@tachui/grid` |
| `GridRow`, `EnhancedGridRow` | Layout | Row helpers | `@tachui/grid` |
| `LazyHGrid`, `LazyVGrid` | Layout | Lazy-loaded grids | `@tachui/grid` |
| `GridItem` | Layout | Grid cell wrapper | `@tachui/grid` |

## @tachui/symbols · 3 components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `Symbol` | Icons | SF Symbols-compatible renderer | `@tachui/symbols` |
| `SystemImage` | Icons | Platform icon renderer | `@tachui/symbols` |
| `LucideIconSet` | Icons | Lucide icon registry/utilities | `@tachui/symbols` |

## @tachui/viewport · 4 components

| Component | Group | Description | Package / Import |
| --- | --- | --- | --- |
| `App` | Viewport | Top-level app/scene container | `@tachui/viewport` |
| `Window` | Viewport | Individual window | `@tachui/viewport` |
| `WindowGroup` | Viewport | Multi-window orchestration | `@tachui/viewport` |
| `ExampleScenes` | Viewport | Sample scaffolding used in docs | `@tachui/viewport` |

## Linking plan

As TypeDoc and package-specific guides come online, each row will link to:

1. The package README (`/packages/*`).
2. Generated API reference (`/api/components/**`).
3. Showcase demos/snippets.

Keep this catalog synchronized with `design-docs/components-0.9.md` whenever components change so the homepage stats stay accurate.
