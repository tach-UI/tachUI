---
cssclasses:
  - full-page
---

# TachUI Components Reference

Complete list of all components available in TachUI, organized by package with brief descriptions of functionality.

## 🏗️ Core Components (@tachui/core)

[[toc]]

### Primary UI Components

**Text** - SwiftUI-inspired text component with full typography support, reactive content handling, and advanced styling capabilities for displaying text content.

```typescript
// Basic text
Text('Hello, TachUI!')

// Reactive text
Text(() => `Count: ${count()}`)

// Styled text
Text('Styled Text')
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#007AFF')
  .textAlign('center')
  .build()
```

**Button** - Interactive button component with press states, multiple variants (filled, outlined, plain), haptic feedback, and support for loading/disabled states.

```typescript
// Basic button
Button('Click Me', () => console.log('Clicked!'))

// Styled button
Button('Primary Action', handleAction)
  .backgroundColor('#007AFF')
  .foregroundColor('white')
  .padding(16)
  .cornerRadius(8)
  .build()

// Reactive button state
Button('Submit', handleSubmit)
  .disabled(() => !isFormValid())
  .build()
```

**Image** - Enhanced image component with loading states, error handling, responsive sizing, and multiple content modes (fit, fill, stretch, center).

```typescript
// Basic image
Image('/path/to/image.jpg')

// Image with asset (theme-reactive)
Image(Assets.logo)

// Styled image
Image('/hero-image.jpg')
  .frame({ width: 300, height: 200 })
  .cornerRadius(12)
  .contentMode('cover')
  .build()

// Image with error handling
Image('/image.jpg', {
  placeholder: '/loading.gif',
  errorPlaceholder: '/error.svg',
  onLoadingStateChange: state => console.log(state),
})
```

**BasicInput** - Lightweight text input component designed for Core-only applications, providing essential input functionality without the full forms plugin overhead.

```typescript
// Basic input
BasicInput({
  placeholder: 'Enter your name',
  value: name,
  onInput: value => setName(value),
})

// Styled input
BasicInput({
  placeholder: 'Search...',
  value: searchTerm,
  onInput: setSearchTerm,
})
  .padding(12)
  .border(1, '#E5E5E7')
  .cornerRadius(8)
  .build()
```

### Interactive Controls

**Toggle** - Switch-style boolean control component with smooth animations and multiple style variants (switch, checkbox, button).

```typescript
// Basic toggle
const [isEnabled, setIsEnabled] = createSignal(false)
Toggle(isEnabled, setIsEnabled, { label: 'Enable notifications' })

// Reactive toggle
Toggle(
  () => settings().darkMode,
  value => updateSettings({ darkMode: value }),
  { label: 'Dark mode' }
)
```

**Slider** - Range selection component for numeric input with customizable min/max values, step intervals, and visual formatting options.

```typescript
// Basic slider
const [volume, setVolume] = createSignal(50)
Slider({
  value: volume,
  onChange: setVolume,
  range: { min: 0, max: 100 },
  step: 1,
})

// Styled slider with marks
Slider({
  value: brightness,
  onChange: setBrightness,
  range: { min: 0, max: 100 },
  marks: [0, 25, 50, 75, 100],
  label: 'Brightness',
})
  .frame({ width: 300 })
  .build()
```

**Picker** - Selection component offering dropdown, wheel, and segmented variants for choosing from a list of predefined options.

```typescript
// Basic picker
const [selectedOption, setSelectedOption] = createSignal('option1')
Picker({
  selection: selectedOption,
  onChange: setSelectedOption,
  label: 'Choose Option',
  options: [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
  ],
})

// Segmented picker
Picker({
  selection: viewMode,
  onChange: setViewMode,
  style: 'segmented',
  options: [
    { label: 'List', value: 'list' },
    { label: 'Grid', value: 'grid' },
  ],
})
```

**Stepper** - Numeric input control with increment/decrement buttons for precise value adjustments within defined ranges.

```typescript
// Basic stepper
const [quantity, setQuantity] = createSignal(1)
Stepper({
  value: quantity,
  onChange: setQuantity,
  range: { min: 1, max: 10 },
  step: 1,
  label: 'Quantity',
})

// Decimal stepper
Stepper({
  value: price,
  onChange: setPrice,
  range: { min: 0, max: 1000 },
  step: 0.01,
  format: value => `$${value.toFixed(2)}`,
})
```

**DatePicker** - Comprehensive date/time selection component with three display styles (calendar, compact, wheel) and full localization support.

```typescript
// Basic date picker
const [selectedDate, setSelectedDate] = createSignal(new Date())
DatePicker({
  selection: selectedDate,
  onChange: setSelectedDate,
  displayedComponents: ['date'],
})

// Date and time picker
DatePicker({
  selection: appointment,
  onChange: setAppointment,
  displayedComponents: ['date', 'hourAndMinute'],
  in: { start: new Date(), end: futureDate },
})

// Compact style
DatePicker({
  selection: date,
  onChange: setDate,
  style: 'compact',
  label: 'Event Date',
})
```

### Navigation & Links

**Link** - Web navigation component with routing support, providing seamless integration with browser navigation and external URLs.

```typescript
// SwiftUI API (Recommended)
Link('About Us', '/about')

// External link
Link('External Site', 'https://example.com')

// Object API for advanced features
Link({
  destination: 'https://example.com',
  target: '_blank',
  children: [Text('External Site')],
})
  .foregroundColor('#007AFF')
  .textDecoration('none')
  .onHover(hovered => setHovered(hovered))
  .build()
```

### Modal & Overlay Components

**Alert** - Modal dialog system with backdrop, animations, customizable button roles, and support for title/message/actions patterns.

```typescript
// Basic alert
Alert({
  title: 'Confirm Action',
  message: 'Are you sure you want to delete this item?',
  primaryButton: {
    title: 'Delete',
    role: 'destructive',
    action: () => deleteItem(),
  },
  secondaryButton: {
    title: 'Cancel',
    role: 'cancel',
  },
})

// Simple alert
Alert({
  title: 'Success',
  message: 'Item saved successfully!',
  dismissButton: { title: 'OK' },
})
```

**ActionSheet** - Mobile-friendly action selection pattern presenting a sheet of actions typically triggered from the bottom of the screen.

```typescript
// Basic action sheet
ActionSheet({
  title: 'Choose Action',
  message: 'What would you like to do?',
  buttons: [
    {
      title: 'Edit',
      action: () => editItem(),
    },
    {
      title: 'Share',
      action: () => shareItem(),
    },
    {
      title: 'Delete',
      role: 'destructive',
      action: () => deleteItem(),
    },
    {
      title: 'Cancel',
      role: 'cancel',
    },
  ],
})
```

**Menu** - Dropdown menu component with automatic positioning, keyboard navigation support, and customizable menu items.

```typescript
// Basic menu
Menu({
  label: 'Options',
  content: [
    MenuItem({ title: 'Edit', action: () => edit() }),
    MenuItem({ title: 'Share', action: () => share() }),
    MenuDivider(),
    MenuItem({
      title: 'Delete',
      role: 'destructive',
      action: () => delete()
    })
  ]
})

// Context menu
Text('Right-click me')
  .modifier
  .onContextMenu(() => showContextMenu())
  .build()
```

### Layout Components

**VStack** - Vertical stack layout arranging child components in a column with configurable spacing and alignment options.

```typescript
// Basic vertical stack
VStack({
  spacing: 16,
  children: [
    Text('Title'),
    Text('Subtitle'),
    Button('Action', handleAction)
  ]
})

// Styled stack
VStack({
  spacing: 20,
  alignment: 'center',
  children: [...]
})
  .modifier
  .padding(24)
  .backgroundColor('#F8F9FA')
  .cornerRadius(12)
  .build()
```

**HStack** - Horizontal stack layout arranging child components in a row with configurable spacing and alignment options.

```typescript
// Basic horizontal stack
HStack({
  spacing: 12,
  children: [Image('/icon.svg'), Text('Menu Item'), Spacer(), Text('⌘K')],
})

// Justified layout
HStack({
  children: [
    Button('Cancel', handleCancel),
    Spacer(),
    Button('Save', handleSave),
  ],
})
```

**ZStack** - Overlay layout stacking child components on top of each other with z-order control and alignment options.

**ScrollView** - Scrollable container with performance optimization, smooth scrolling behavior, and pull-to-refresh capabilities.

```typescript
// Basic scroll view
ScrollView({
  children: [...longListOfComponents],
})

// Horizontal scroll
ScrollView({
  axis: 'horizontal',
  showsIndicators: false,
  children: [...horizontalItems],
})
  .frame({ height: 200 })
  .build()

// With pull-to-refresh
ScrollView({
  children: content,
  refreshable: {
    onRefresh: async () => await refreshData(),
    isRefreshing: isRefreshing,
  },
})
```

**Spacer** - Flexible space component that expands to fill available space in stack layouts, pushing other content apart.

```typescript
// Basic spacer in HStack
HStack({
  children: [Text('Left'), Spacer(), Text('Right')],
})

// Fixed minimum space
Spacer({ minLength: 50 })

// In VStack for vertical spacing
VStack({
  children: [Text('Top'), Spacer(), Button('Bottom', handleAction)],
})
```

**Grid** - SwiftUI-style Grid component for explicit 2D layouts with CSS Grid performance and responsive design capabilities.

```typescript
// Basic 2D grid layout
Grid({
  alignment: 'center',
  spacing: 16,
  children: [
    GridRow([Text('A1'), Text('B1'), Text('C1')]),
    GridRow([Text('A2'), Text('B2'), Text('C2')]),
  ],
})

// With spanning items
Grid({
  children: [
    GridRow([
      Text('Header')
        .gridColumnSpan(3)
        .backgroundColor('#007AFF')
        .foregroundColor('white')
        .build(),
    ]),
    GridRow([Text('A1'), Text('B1'), Text('C1')]),
  ],
})
```

**LazyVGrid** - Vertical scrolling grid with flexible columns that automatically adapts to content and container size.

```typescript
// Responsive product grid
LazyVGrid({
  columns: [GridItem.adaptive(250, 350)],
  spacing: 16,
  children: products.map(product => ProductCard(product)),
})

// Multi-column grid
LazyVGrid({
  columns: [GridItem.flexible(), GridItem.flexible(), GridItem.flexible()],
  spacing: 12,
  children: items,
})

// With sections
LazyVGrid({
  columns: [GridItem.adaptive(200)],
  sections: [
    createGridSection({
      id: 'featured',
      header: Text('Featured Items'),
      items: featuredItems,
    }),
  ],
})
```

**LazyHGrid** - Horizontal scrolling grid with flexible rows for carousel-style layouts and timeline presentations.

```typescript
// Image carousel
LazyHGrid({
  rows: [GridItem.fixed(200)],
  spacing: 12,
  children: images.map(image =>
    Image({ src: image.url, alt: image.title })
      .frame(150, 200)
      .cornerRadius(8)
      .build()
  ),
})

// Timeline layout
LazyHGrid({
  rows: [GridItem.flexible(100, 150)],
  spacing: 20,
  children: events.map(event => EventCard(event)),
})
```

**GridItem** - Factory methods for defining grid column and row sizing behavior with SwiftUI compatibility.

```typescript
// Fixed size
GridItem.fixed(200) // Exactly 200px

// Flexible sizing
GridItem.flexible() // Expands to fill space
GridItem.flexible(100, 300) // Min 100px, max 300px

// Adaptive sizing
GridItem.adaptive(250) // Fit as many 250px+ columns as possible
GridItem.adaptive(200, 400) // Min 200px, max 400px per column
```

### Visual & Structural Components

**Symbol** - SwiftUI-inspired icon system with advanced rendering modes, animation effects, and extensible icon set management for scalable vector graphics.

```typescript
// Basic symbol
Symbol('heart')

// With animation and styling
Symbol('star', {
  effect: 'glow',
  effectValue: 0.8,
})
  .foregroundColor('#FFD700')
  .scaleLarge()
  .build()

// Advanced rendering modes
Symbol('star', {
  renderingMode: 'hierarchical',
  primaryColor: '#007AFF',
})

// Reactive symbol
const [isFavorited, setIsFavorited] = createSignal(false)
Symbol('heart', {
  variant: () => (isFavorited() ? 'filled' : 'none'),
  effect: 'heartbeat',
})
  .foregroundColor(() => (isFavorited() ? '#ff0000' : '#999'))
  .onTap(() => setIsFavorited(!isFavorited()))
  .build()
```

**Divider** - Visual separator component supporting horizontal and vertical orientations for content organization and UI structure.

```typescript
// Horizontal divider (default)
Divider()

// Vertical divider
Divider({ orientation: 'vertical' }).frame({ height: 40 }).build()

// Styled divider
Divider().backgroundColor('#E5E5E7').frame({ height: 2 }).build()
```

### List & Data Components

**List** - High-performance list component with virtual scrolling, ForEach pattern support, and efficient rendering for large datasets.

```typescript
// Basic list
List({
  data: items,
  children: item => [
    Text(item.title),
    Text(item.subtitle).foregroundColor('#666').build(),
  ],
})

// List with sections
List({
  sections: [
    {
      header: 'Recent',
      items: recentItems,
      children: item => ListRow(item),
    },
    {
      header: 'All Items',
      items: allItems,
      children: item => ListRow(item),
    },
  ],
})
```

**Show** - Conditional rendering component that displays content based on boolean conditions or reactive signals.

```typescript
// Basic conditional rendering
Show(() => isLoggedIn(), Text('Welcome back!'), Text('Please log in'))

// With reactive condition
Show(
  () => error() !== null,
  Text(error()).foregroundColor('red').build()
)

// Alternative utilities
When(() => isLoading(), Text('Loading...'))
Unless(() => hasPermission(), Text('Access denied'))
```

**ForEach** - Iteration component for rendering lists of data with reactive updates and efficient re-rendering.

```typescript
// Basic iteration
ForEach(
  () => items(),
  (item, index) => Text(`${index}: ${item.name}`)
)

// With key for efficient updates
ForEach(
  () => users(),
  user => UserCard(user),
  user => user.id // key function
)
```

### Form Infrastructure

**Form** - Form container providing automatic styling, validation coordination, and consistent layout for form elements.

```typescript
// Basic form
Form({
  onSubmit: data => console.log('Form data:', data),
  children: [
    Section({
      header: 'Personal Information',
      children: [
        BasicInput({ placeholder: 'Name', name: 'name' }),
        BasicInput({ placeholder: 'Email', name: 'email', type: 'email' }),
      ],
    }),

    Section({
      children: [Button('Submit', null, { type: 'submit' })],
    }),
  ],
})
```

**Section** - Form section component for grouping related form fields with optional headers and footers.

```typescript
// Section with header
Section({
  header: 'Account Settings',
  children: [
    Toggle(darkMode, setDarkMode, { label: 'Dark Mode' }),
    Toggle(notifications, setNotifications, { label: 'Notifications' }),
  ],
})

// Section with header and footer
Section({
  header: 'Privacy',
  footer: 'Your data is encrypted and secure.',
  children: [
    Toggle(analytics, setAnalytics, { label: 'Analytics' }),
    Toggle(tracking, setTracking, { label: 'Ad Tracking' }),
  ],
})
```

### Viewport & Window Components

**Window** - SwiftUI-style Window component that creates a single, unique window that prevents duplicates for desktop applications.

**WindowGroup** - SwiftUI-style WindowGroup component that creates a group of windows that can have multiple instances with data-driven content.

**App** - App-level scene container (SwiftUI App equivalent) for managing multiple window scenes in desktop applications.

### HTML Semantic Components

**H1, H2, H3, H4, H5, H6** - HTML heading components with TachUI modifier support for semantic markup and SEO.

```typescript
// Semantic headings with modifiers
H1('Main Title')
  .fontSize(32)
  .fontWeight('bold')
  .marginBottom(16)
  .build()

H2('Section Title').fontSize(24).foregroundColor('#333').build()
```

## 🧭 Navigation Components (@tachui/navigation)

### Stack Navigation

**NavigationView** - SwiftUI's legacy stack-based navigation container with automatic back button handling, navigation bar, and push/pop animations.

```typescript
// Basic navigation view
NavigationView({
  children: [
    VStack({
      children: [
        Text('Home Screen'),
        NavigationLink('Go to Settings', () => SettingsView()),
      ],
    }),
  ],
})

// With navigation bar styling
NavigationView({
  children: [HomeView()],
})
  .navigationTitle('My App')
  .navigationBarTitleDisplayMode('large')
  .build()
```

**NavigationStack** - Modern SwiftUI NavigationStack with path-based navigation and type-safe routing.

```typescript
// Modern navigation stack
const [navigationPath, setNavigationPath] = createSignal<string[]>([])

NavigationStack({
  path: navigationPath,
  children: [HomeView()],
})
  .navigationDestination('settings', () => SettingsView())
  .navigationDestination('profile', () => ProfileView())
  .build()

// Programmatic navigation
setNavigationPath(['settings']) // Navigate to settings
setNavigationPath([]) // Pop to root
```

**NavigationLink** - Declarative navigation links for pushing views onto the navigation stack when activated.

```typescript
// Basic navigation link
NavigationLink('Settings', () => SettingsView())

// Navigation link with custom styling
NavigationLink(
  HStack({
    children: [
      Image('/settings-icon.svg'),
      Text('Settings'),
      Spacer(),
      Text('>'),
    ],
  }),
  () => SettingsView()
)
  .padding(16)
  .backgroundColor('#F8F9FA')
  .cornerRadius(8)
  .build()

// Variants
NavigationIconLink('/settings', 'Settings', '/settings-icon.svg')
NavigationListLink('Profile', () => ProfileView(), {
  subtitle: 'Manage your account',
})
```

### Tab Navigation

**SimpleTabView** - Basic SwiftUI TabView with simple selection binding and tabItem modifier support.

```typescript
// Basic tab view
const [selectedTab, setSelectedTab] = createSignal(0)

SimpleTabView({
  selection: selectedTab,
  onChange: setSelectedTab,
  children: [
    VStack({ children: [Text('Home Content')] })
      .tabItem('Home', '/home-icon.svg')
      .build(),

    VStack({ children: [Text('Settings Content')] })
      .tabItem('Settings', '/settings-icon.svg')
      .build(),
  ],
})
```

**TabView** - Full-featured SwiftUI TabView with comprehensive tab management and customization.

```typescript
// Advanced tab view
TabView({
  placement: 'bottom',
  style: 'automatic',
  tabs: [
    {
      id: 'home',
      title: 'Home',
      icon: '/home-icon.svg',
      badge: () => unreadCount(),
      content: () => HomeView(),
    },
    {
      id: 'search',
      title: 'Search',
      icon: '/search-icon.svg',
      content: () => SearchView(),
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: '/profile-icon.svg',
      content: () => ProfileView(),
    },
  ],
})
  .tabViewStyle('page') // Optional: page-style tabs
  .build()
```

**EnhancedTabView** - Modern SwiftUI TabView with WWDC 2024-2025 features including floating tabs and user customization.

```typescript
// Enhanced tab view with modern features
EnhancedTabView({
  style: 'floating',
  allowsCustomization: true,
  sidebarAdaptable: true,
  sections: [
    {
      title: 'Main',
      tabs: [
        { id: 'home', title: 'Home', content: () => HomeView() },
        { id: 'browse', title: 'Browse', content: () => BrowseView() },
      ],
    },
    {
      title: 'Tools',
      tabs: [
        { id: 'settings', title: 'Settings', content: () => SettingsView() },
        { id: 'help', title: 'Help', content: () => HelpView() },
      ],
    },
  ],
})
```

**AdvancedTabView** - Advanced TabView with tab reordering, context menus, and multiple view styles.

```typescript
// Advanced tab view with reordering
AdvancedTabView({
  viewStyle: 'grouped',
  allowsReordering: true,
  showsCloseButtons: true,
  tabs: dynamicTabs(),
  onTabReorder: (oldIndex, newIndex) => reorderTabs(oldIndex, newIndex),
  onTabClose: tabId => closeTab(tabId),
  contextMenuActions: [
    { title: 'Duplicate Tab', action: tabId => duplicateTab(tabId) },
    { title: 'Close Others', action: tabId => closeOtherTabs(tabId) },
  ],
})
```

### Navigation Infrastructure

**NavigationPath** - Type-safe navigation path management for programmatic navigation.

```typescript
// Create navigation path
const navigationPath = createNavigationPath<'home' | 'settings' | 'profile'>()

// Navigate programmatically
navigationPath.push('settings')
navigationPath.pop()
navigationPath.popToRoot()

// Path-based navigation
NavigationStack({
  path: navigationPath.path,
  children: [HomeView()],
})
```

**Navigation Modifiers** - SwiftUI-compatible navigation bar modifiers for styling and configuration.

```typescript
// Navigation bar modifiers
SomeView()
  .navigationTitle('Page Title')
  .navigationBarTitleDisplayMode('inline')
  .navigationBarHidden(false)
  .navigationBarItems({
    leading: Button('Cancel', handleCancel),
    trailing: Button('Save', handleSave),
  })
  .toolbarBackground('#FFFFFF')
  .toolbarForegroundColor('#000000')
  .build()
```

## 📝 Forms Plugin Components (@tachui/forms)

### Enhanced Form Infrastructure

**Form** (Enhanced) - Advanced form container with comprehensive validation, multi-step support, and enhanced state management.

**FormSection** - Enhanced section component with advanced grouping, conditional visibility, and validation coordination.

### Core Input Components

**TextField** (Enhanced) - Advanced text input with comprehensive validation, formatting, parsing, multiple input types, and full accessibility support.

**Select** - Dropdown selection component with search functionality, keyboard navigation, and support for single/multi-select modes.

**Combobox** - Editable dropdown combining text input with selection options for flexible user input.

**MultiSelect** - Multi-selection component allowing users to choose multiple options from a list.

### Boolean Input Components

**Checkbox** - Boolean input component rendered as a checkbox with label support and validation integration.

**CheckboxGroup** - Group of related checkboxes with coordinated state management and validation.

**Switch** - Toggle switch for boolean values with enhanced styling and animation options.

**Radio** - Radio button group component for single selection from multiple options with automatic group management.

**RadioGroup** - Container for managing radio button groups with validation and styling coordination.

### Specialized Text Input Fields

**EmailField** - Email-specific text input with built-in email validation and formatting.

**PasswordField** - Secure password input with strength indicators, show/hide toggle, and validation rules.

**PhoneField** - Phone number input with international formatting, validation, and country code support.

**NumberField** - Numeric input with min/max constraints, decimal support, and formatting options.

**CreditCardField** - Credit card input with automatic formatting, card type detection, and Luhn validation.

**SearchField** - Search-optimized input with suggestions, highlighting, and search behavior.

**URLField** - URL input with validation and protocol handling for web addresses.

**SSNField** - Social Security Number input with automatic formatting and validation.

**PostalCodeField** - Postal/zip code input with country-specific formatting and validation.

**DateField** - Date input component with calendar picker and various date format support.

**TimeField** - Time input component with time picker and format customization.

**ColorField** - Color selection input with color picker interface and hex/rgb support.

**TextArea** - Multi-line text input with resize controls, character limits, and rich formatting options.

## 🏷️ Component Categories

### By Complexity

- **Simple**: Text, Spacer, Divider, Show
- **Interactive**: Button, Toggle, Slider, Stepper
- **Complex**: List, ScrollView, DatePicker, Menu
- **Advanced**: Alert, ActionSheet, NavigationView, Form

### By Use Case

- **Content Display**: Text, Image, Symbol, Divider
- **User Input**: BasicInput, TextField variants, Toggle, Slider, Picker
- **Navigation**: NavigationView, NavigationLink, TabView, Link
- **Layout**: VStack, HStack, ZStack, ScrollView, Spacer
- **Data**: List, ForEach, Show
- **Modal**: Alert, ActionSheet, Menu
- **Desktop**: Window, WindowGroup, App

### Bundle Impact

- **Core Only** (~60KB): All @tachui/core components
- **Core + Forms** (~95KB): Core + enhanced form components
- **Core + Navigation** (~85KB): Core + navigation system
- **Full Framework** (~150KB): All packages combined

## 📊 Component Count Summary

### Core Package (@tachui/core)

- **Primary UI**: 4 components
- **Interactive Controls**: 5 components
- **Navigation & Links**: 1 component
- **Modal & Overlay**: 3 components
- **Layout**: 5 components
- **Visual & Structural**: 2 components (Symbol, Divider)
- **List & Data**: 3 components (List, Show, ForEach)
- **Form Infrastructure**: 2 components
- **Viewport & Window**: 3 components
- **HTML Semantic**: 6 components (H1-H6)
- **Total Core**: 34 components

### Navigation Package (@tachui/navigation)

- **Stack Navigation**: 3 components (NavigationView, NavigationStack, NavigationLink)
- **Tab Navigation**: 4 components (SimpleTabView, TabView, EnhancedTabView, AdvancedTabView)
- **Navigation Infrastructure**: 2 components (NavigationPath, Navigation Modifiers)
- **Total Navigation**: 9 components

### Forms Package (@tachui/forms)

- **Enhanced Infrastructure**: 2 components
- **Core Input**: 4 components
- **Boolean Input**: 5 components
- **Specialized Fields**: 13 components
- **Total Forms**: 24 components

**Grand Total**: 67 components across all packages

## 🚀 Getting Started

### Basic Usage Example

```typescript
import { VStack, Text, Button, createSignal } from '@tachui/primitives'

const CounterApp = () => {
  const [count, setCount] = createSignal(0)

  return VStack({
    children: [
      Text(() => `Count: ${count()}`),
      Button('Increment', () => setCount(count() + 1)),
    ],
  })
}
```

### With Forms Plugin

```typescript
import { Form, TextField, EmailField, PasswordField } from '@tachui/forms'

const LoginForm = () => {
  return Form({
    onSubmit: data => console.log('Form data:', data),
    children: [
      EmailField({
        label: 'Email',
        name: 'email',
        required: true,
      }),
      PasswordField({
        label: 'Password',
        name: 'password',
        minLength: 8,
      }),
    ],
  })
}
```

### With Navigation

```typescript
import { VStack, Text } from '@tachui/primitives'
import { NavigationStack, NavigationLink } from '@tachui/navigation'

const AppNavigation = () => {
  return NavigationStack({
    children: [
      VStack({
        children: [
          Text('Home Screen'),
          NavigationLink('Go to Settings', () => SettingsView()),
          NavigationLink('View Profile', () => ProfileView()),
        ],
      }),
    ],
  })
    .navigationDestination('settings', () => SettingsView())
    .navigationDestination('profile', () => ProfileView())
    .build()
}
```

## 📚 Documentation Links

- [Component Examples](/components/)
- [API Reference](/api/)
- [Getting Started Guide](/guide/getting-started)
- [Migration Guide](/guide/migration)

## 🎯 Design Philosophy

TachUI components follow these principles:

1. **SwiftUI API Parity** - Familiar APIs for developers coming from SwiftUI
2. **Tree-Shakeable** - Import only what you use for optimal bundle size
3. **TypeScript-First** - Full type safety and excellent IDE support
4. **Reactive by Default** - Built on fine-grained reactivity system
5. **Modifier-Based Styling** - Chainable modifiers for declarative styling
6. **Performance Focused** - Virtual scrolling, lazy loading, and efficient updates
7. **Accessibility Built-in** - ARIA compliance and keyboard navigation

## 🔄 Version History

- **v1.0** - Initial release with 26 core components
- **v1.1** - Forms plugin with 24 specialized form components
- **v1.2** - Navigation plugin with 6 navigation components
- **v1.3** - Advanced modifier system with 95% SwiftUI parity
- **v1.4** - Window management system for desktop applications

Last updated: 2025-08-15
