# Element Override API

**HTML tag override system for semantic markup generation**

The Element Override system enables tachUI components to render as semantic HTML elements while maintaining all styling and functionality. This enhancement improves SEO, accessibility, and standards compliance.

## Core Interface

### ElementOverrideProps

```typescript
interface ElementOverrideProps {
  element?: string
}
```

Base interface that adds element override capability to components.

**Properties:**
- `element?: string` - HTML tag to use instead of the component's default tag

**Supported Components:**
- Layout: `HStack`, `VStack`, `ZStack`
- Content: `Text`, `Image`

## Usage Examples

### Basic Override

```typescript
// HStack renders as <nav> instead of <div>
HStack({
  element: "nav",
  children: [
    Text("Home"),
    Text("About"), 
    Text("Contact")
  ],
  spacing: 20
})

// Generated HTML: <nav role="navigation">...</nav>
```

### Semantic Document Structure

```typescript
VStack({
  element: "main",
  children: [
    Text("Page Title", { element: "h1" }),
    
    HStack({
      element: "nav",
      children: navigationItems
    }),
    
    VStack({
      element: "article",
      children: [
        Text("Article Title", { element: "h2" }),
        Text("Article content...")
      ]
    }),
    
    VStack({
      element: "section", 
      children: sidebarContent
    })
  ]
})

// Generates proper HTML5 document structure with semantic elements
```

## Component Support

### Layout Components

| Component | Default Tag | Override Support | Auto ARIA | Notes |
|-----------|-------------|------------------|-----------|-------|
| `HStack` | `div` | ✅ Yes | ✅ Yes | Perfect for `nav`, `header`, `footer` |
| `VStack` | `div` | ✅ Yes | ✅ Yes | Ideal for `main`, `section`, `article` |
| `ZStack` | `div` | ✅ Yes | ✅ Yes | Useful for `article`, `aside` |

### Content Components  

| Component | Default Tag | Override Support | Auto ARIA | Notes |
|-----------|-------------|------------------|-----------|-------|
| `Text` | `span` | ✅ Yes | ❌ No | Common for `h1`-`h6`, `p` |
| `Image` | `img` | ✅ Yes | ❌ No | Use with caution - may break functionality |

## Automatic ARIA Roles

The system automatically applies appropriate ARIA roles for semantic tags:

```typescript
// Automatic role application
HStack({ element: "nav" })    // → <nav role="navigation">
VStack({ element: "main" })   // → <main role="main">  
VStack({ element: "section" }) // → <section role="region">
ZStack({ element: "article" }) // → <article role="article">
VStack({ element: "aside" })   // → <aside role="complementary">
```

**Context-sensitive tags** (no automatic role):
- `header` - Could be page banner or section header
- `footer` - Could be page footer or content footer
- Manual role specification recommended via `.aria()` modifier

## Configuration API

### Global Configuration

```typescript
import { configureElementOverrides } from '@tachui/core'

configureElementOverrides({
  // Accessibility
  autoApplySemanticRoles: true,
  
  // Development warnings  
  warnOnOverrides: true,
  warnOnSemanticIssues: true,
  
  // Validation
  validateTags: true,
  allowInvalidTags: true
})
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `autoApplySemanticRoles` | `true` | Automatically add ARIA roles to semantic elements |
| `warnOnOverrides` | `true` (dev) | Show console warnings when using element overrides |
| `warnOnSemanticIssues` | `true` (dev) | Warn about potential semantic/accessibility issues |
| `validateTags` | `true` | Validate that override tags are valid HTML elements |
| `allowInvalidTags` | `true` | Use invalid tags as-is (with warning) |

## Validation System

### Supported HTML Tags

The system supports 70+ valid HTML elements including:

**Container Elements:**
- `div`, `section`, `article`, `aside`, `nav`, `main`, `header`, `footer`

**Heading Elements:**
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

**Content Elements:**
- `p`, `span`, `strong`, `em`, `code`, `pre`, `blockquote`

**List Elements:**
- `ul`, `ol`, `li`, `dl`, `dt`, `dd`

**Interactive Elements:** (use with caution)
- `button`, `a`, `input`, `select`, `form`

**Media Elements:**
- `img`, `video`, `audio`, `canvas`, `svg`, `figure`

### Development Warnings

The system provides helpful warnings in development:

```typescript
// Warning: Interactive tag on layout component
HStack({ element: "button" }) // ⚠️ May cause accessibility issues

// Warning: Heading tag on layout  
VStack({ element: "h1" }) // ℹ️ Consider using Text component instead

// Warning: Invalid HTML tag
Text("Title", { element: "invalidtag" }) // ❌ Invalid HTML tag
```

## TypeScript Support

Full TypeScript integration with proper type safety:

```typescript
// Type-safe element overrides
const nav = HStack({
  element: "nav", // ✅ Valid
  children: []
})

const invalid = Text("Title", {
  element: "notarealtag" // ⚠️ Warning in development
})

// Interface extension
interface CustomProps extends ElementOverrideProps {
  customProp: string
}
```

## Performance

- **Development**: ~8KB additional code (validation + warnings)
- **Production**: ~2KB additional code (core functionality only)  
- **Runtime**: Zero overhead - validation disabled in production
- **Memory**: Minimal metadata storage

## Best Practices

### ✅ Recommended Usage

```typescript
// Semantic navigation
HStack({ element: "nav", children: menuItems })

// Document structure
VStack({ element: "main", children: pageContent })

// Headings
Text("Page Title", { element: "h1" })
Text("Section Title", { element: "h2" })

// Content sections
VStack({ element: "article", children: blogPost })
VStack({ element: "section", children: sidebar })
```

### ⚠️ Use With Caution

```typescript
// May break image functionality
Image({ element: "figure", src: "..." })

// Interactive tags on layouts (accessibility concerns)
HStack({ element: "button", children: [...] })
```

### ❌ Avoid

```typescript
// Form inputs should not override tags
TextField({ element: "div" }) // Breaks functionality
Toggle({ element: "span" })   // Breaks functionality  
```

## Migration

Element override is fully opt-in and backward compatible:

```typescript
// Existing code continues to work unchanged
HStack({ children: [...] }) // Still renders as <div>

// Add semantic markup incrementally  
HStack({ element: "nav", children: [...] }) // Now renders as <nav>
```

## Related APIs

- [Enhanced Modifiers](/api/enhanced-modifiers) - Advanced styling system
- [Component Modifiers](/api/modifiers) - Styling system compatibility
- [Semantic HTML Guide](/guide/semantic-html) - Best practices for semantic markup
- [Validation System](/api/validation) - Component validation features