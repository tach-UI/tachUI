---
title: Component Catalog
---

# Component Catalog

This page lists the publicly exported components and where they live today. Use it as an index while the detailed package docs are migrated; each entry notes the owning package so you can jump straight to the source README until we land deep links.

> _Component counts mirror `pnpm test` as of the current branch (4,774 tests / 248 files). If you add, rename, or remove a component, update this catalog in the same pull request._

## @tachui/core

Runtime-level components that ship with the core package before any optional plugins.

| Component | Summary |
| --- | --- |
| `App`, `Scene` (internal) | Root wrappers used by the renderer |
| `DOMBridge` helpers | Bindings for hydrating/mounting |
| `Window`, `WindowGroup` (legacy) | Early viewport abstractions (now in `@tachui/viewport`) |
| `ConcatenatedComponent` | Optimization primitive returned by `.concatenate()` |
| _Note_ | Most UI components moved to `@tachui/primitives`; see that section for the catalog. |

## @tachui/primitives

Core layout, display, and control surfaces.

| Component | Summary |
| --- | --- |
| `VStack` / `HStack` / `ZStack` | Stack layouts with spacing/alignment controls |
| `Spacer` / `Divider` | Layout fillers and separators |
| `ScrollView` | Horizontal or vertical scroll container |
| `Text` / `Symbol` | Typography and iconography primitives |
| `Image` / `HTML` | Media + raw HTML escape hatch |
| `Button` / `Link` | Action + navigation controls |
| `Toggle` / `Picker` / `Slider` / `Stepper` | Input controls |
| `BasicInput` / `BasicForm` | Lightweight input + grouping |
| `DatePicker` | Basic date/time selection |

_Next_: add Label, ProgressView, Gauge before 1.0.

## @tachui/navigation

Navigation structures and link helpers.

| Component | Summary |
| --- | --- |
| `NavigationStack` | Stack-style routing with path binding |
| `NavigationLink` | Declarative navigation trigger |
| `TabView` / `SimpleTabView` | Tabbed navigation |
| `NavigationView` | Legacy wrapper (still supported) |

_Roadmap_: Modal/sheet APIs, `NavigationSplitView`, `.searchable`.

## @tachui/forms

Rich form inputs with built-in validation.

| Component | Summary |
| --- | --- |
| `Form` / `FormSection` | Declarative form container + grouping |
| `TextField` / `SecureField` | Standard text inputs with validation hooks |
| `EmailField` / `PasswordField` | Specialized text inputs with formatters |
| `CreditCardField` / `PhoneField` / `MaskedField` | Inputs with built-in formatting/masking |
| `Checkbox` / `CheckboxGroup` | Boolean controls with form bindings |
| `Radio` / `RadioGroup` | Single-select boolean sets |
| `Select` / `ComboBox` | Dropdown + searchable select |
| `SwitchField` / `ToggleField` | iOS-style boolean controls |
| `SliderField` / `StepperField` | Numeric form controls |
| `DatePickerField` / `TimePickerField` | Date/time inputs tied to form state |

## @tachui/data

Data display utilities.

| Component | Summary |
| --- | --- |
| `List` | Virtualized scrolling list with sections |
| `Menu` | Command menu with nested sections |
| `SectionList` | Grouped list display |
| `VirtualList` (beta) | Performance-focused list |

## @tachui/flow-control

| Component | Summary |
| --- | --- |
| `Show` | Conditional rendering |
| `When` / `Unless` | Branch helpers |
| `ForEach` / `For` | Iteration helpers |

## @tachui/mobile

| Component | Summary |
| --- | --- |
| `ActionSheet` | Sheet presentation for mobile |
| `Alert` | Modal alert dialog |

_Planned_: SwipeActions, PullToRefresh, gesture suite.

## @tachui/viewport

| Component | Summary |
| --- | --- |
| `App` | Desktop entry point |
| `Window` | Single window definition |
| `WindowGroup` | Multiple window orchestration |

## @tachui/symbols

Delivers the symbol/icon datasets rather than UI components. Pair with `Symbol`/`Image` from `@tachui/primitives`.

## Linking plan

During Phase 2 each component above will link to:

1. The package README (already listed under `/packages/*`).
2. Generated TypeDoc entry under `/api/components/*`.
3. A runnable example in the Showcase section.

Until then, use the package sidebar (`/packages/`) to drill into the README or source code for additional details.
