# Text Component

The Text component is one of TachUI's most fundamental components, providing comprehensive typography support with reactive content, extensive styling options, and built-in accessibility features.

## Overview

The Text component displays text content with full support for:

- Reactive content updates
- Typography presets following design system patterns
- Advanced text formatting and styling
- Accessibility features
- Interactive capabilities

## Basic Usage

### Simple Text

```typescript
import { Text } from '@tachui/primitives'

// Static text
Text('Hello, World!').build()
```

### Reactive Text

```typescript
import { Text } from '@tachui/primitives'
import { createSignal } from '@tachui/core'

const [message, setMessage] = createSignal('Initial message')

// Reactive text that updates automatically
Text(message).foregroundColor('#333').build()

// Update the text
setMessage('Updated message!')
```

### Functional Text

```typescript
const currentTime = () => new Date().toLocaleTimeString()

Text(currentTime).font({ family: 'monospace', size: 16 }).build()
```

## Typography Presets

TachUI provides built-in typography presets that follow system design patterns:

```typescript
import { TextStyles } from '@tachui/primitives'

// Large title
TextStyles.LargeTitle('Welcome').foregroundColor('#000').build()

// Regular title
TextStyles.Title('Section Title').build()

// Body text
TextStyles.Body(
  'This is body text with proper line height and sizing.'
).build()

// Caption text
TextStyles.Caption('Small caption text').opacity(0.7).build()
```

### Available Typography Presets

| Preset        | Size | Weight | Line Height | Use Case            |
| ------------- | ---- | ------ | ----------- | ------------------- |
| `LargeTitle`  | 34px | 400    | 1.2         | Main page titles    |
| `Title`       | 28px | 400    | 1.3         | Section headers     |
| `Title2`      | 22px | 400    | 1.3         | Sub-section headers |
| `Title3`      | 20px | 400    | 1.4         | Minor headers       |
| `Headline`    | 17px | 600    | 1.4         | Emphasized text     |
| `Body`        | 17px | 400    | 1.5         | Main content        |
| `Callout`     | 16px | 400    | 1.4         | Highlighted content |
| `Subheadline` | 15px | 400    | 1.4         | Secondary content   |
| `Footnote`    | 13px | 400    | 1.3         | Footnotes           |
| `Caption`     | 12px | 400    | 1.2         | Image captions      |
| `Caption2`    | 11px | 400    | 1.1         | Fine print          |

## Text Formatting

### Using TextFormat Utilities

```typescript
import { TextFormat } from '@tachui/primitives'

// Bold text
TextFormat.bold('Important message').build()

// Italic text
TextFormat.italic('Emphasized text').build()

// Underlined text
TextFormat.underline('Underlined text').build()

// Monospace text
TextFormat.monospace('code snippet')
  .backgroundColor('#f5f5f5')
  .padding(4)
  .build()

// Multiple formatting options
TextFormat.formatted('Multi-formatted text', {
  bold: true,
  italic: true,
  underline: true,
}).build()
```

### Manual Font Styling

```typescript
Text('Custom styled text')
  .font({
    family: 'Georgia, serif',
    size: 18,
    weight: '600',
    style: 'italic',
    variant: 'small-caps',
  })
  .build()
```

## Advanced Text Properties

### Text Alignment and Decoration

```typescript
Text('Centered text')
  .textAlign('center')
  .textDecoration('underline')
  .textTransform('uppercase')
  .build()
```

### Line Spacing and Letter Spacing

```typescript
Text('Spaced text with custom typography')
  .lineHeight(1.8)
  .letterSpacing('2px')
  .wordSpacing('4px')
  .build()
```

### Line Limiting and Truncation

```typescript
// Limit to 3 lines with tail truncation
Text('This is a very long text that will be truncated after three lines...')
  .frame({ width: 200 })
  .lineHeight(1.4)
  .css({
    display: '-webkit-box',
    '-webkit-line-clamp': '3',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  })
  .build()
```

## Accessibility

### Semantic Roles

```typescript
// Heading text
Text('Page Title')
  .accessibilityRole('heading')
  .accessibilityLevel(1)
  .font(Typography.largeTitle)
  .build()

// Label text
Text('Username:').accessibilityRole('label').build()
```

### Accessibility Labels

```typescript
Text('👍').accessibilityLabel('Thumbs up emoji').build()
```

## Interactive Text

### Clickable Text

```typescript
const handleClick = () => {
  console.log('Text clicked!')
}

Text('Click me')
  .foregroundColor('#007AFF')
  .textDecoration('underline')
  .cursor('pointer')
  .onTap(handleClick)
  .build()
```

### Long Press Support

```typescript
const handleLongPress = () => {
  console.log('Long press detected')
}

Text('Long press me').onLongPress(handleLongPress).build()
```

## Responsive Typography

### Responsive Font Sizes

```typescript
import { createSignal } from '@tachui/core'

const [isMobile, setIsMobile] = createSignal(window.innerWidth < 768)

Text('Responsive text')
  .font({
    size: () => (isMobile() ? 16 : 20),
    weight: '400',
  })
  .build()
```

### Responsive Line Height

```typescript
Text('Text with responsive line height')
  .lineHeight(() => (isMobile() ? 1.4 : 1.6))
  .build()
```

## Color and Background

### Text Colors

```typescript
// Static color
Text('Colored text').foregroundColor('#FF6B6B').build()

// Reactive color
const [isDark, setIsDark] = createSignal(false)

Text('Theme-aware text')
  .foregroundColor(() => (isDark() ? '#FFFFFF' : '#000000'))
  .build()
```

### Background Colors

```typescript
Text('Text with background')
  .backgroundColor('#FFE66D')
  .padding(8)
  .cornerRadius(4)
  .build()
```

## Layout Integration

### Text in Layouts

```typescript
import { VStack, HStack } from '@tachui/primitives'

VStack([
  TextStyles.Title('Article Title').textAlign('center').build(),

  HStack([
    TextStyles.Caption('By Author').opacity(0.7).build(),

    Spacer(),

    TextStyles.Caption('2 min read').opacity(0.7).build(),
  ]),

  TextStyles.Body('Article content goes here...')
    .lineHeight(1.6)
    .build(),
])
```

## Common Patterns

### Article Header

```typescript
const ArticleHeader = (title: string, author: string, date: string) =>
  VStack([
    TextStyles.LargeTitle(title)
      .textAlign('center')
      .marginBottom(16)
      .build(),

    HStack([
      TextStyles.Subheadline(`By ${author}`).opacity(0.8).build(),

      TextStyles.Subheadline(' • ').opacity(0.5).build(),

      TextStyles.Subheadline(date).opacity(0.8).build(),
    ])
      .justifyContent('center')
      .marginBottom(24)
      .build(),
  ])
```

### Code Block

```typescript
const CodeBlock = (code: string) =>
  TextFormat.monospace(code)
    .backgroundColor('#1e1e1e')
    .foregroundColor('#d4d4d4')
    .padding(16)
    .cornerRadius(8)
    .fontSize(14)
    .lineHeight(1.5)
    .overflowX('auto')
    .build()
```

### Badge/Tag

```typescript
const Badge = (text: string, color: string = '#007AFF') =>
  TextStyles.Caption(text)
    .backgroundColor(color)
    .foregroundColor('#FFFFFF')
    .padding({ horizontal: 8, vertical: 4 })
    .cornerRadius(12)
    .fontSize(12)
    .fontWeight('600')
    .textTransform('uppercase')
    .letterSpacing('0.5px')
    .build()
```

### Link Text

```typescript
const LinkText = (text: string, url: string) =>
  Text(text)
    .foregroundColor('#007AFF')
    .textDecoration('underline')
    .cursor('pointer')
    .onTap(() => window.open(url, '_blank'))
    .onHover(hovered => (hovered ? { opacity: 0.7 } : { opacity: 1 }))
    .build()
```

## Performance Considerations

### Text Memoization

For expensive text computations, use memoization:

```typescript
import { createMemo } from '@tachui/core'

const [data, setData] = createSignal([])

const formattedText = createMemo(() =>
  data()
    .map(item => item.name)
    .join(', ')
)

Text(formattedText).build()
```

### Large Text Lists

For large amounts of text content, consider virtualization:

```typescript
import { List } from '@tachui/data'

const LargeTextList = ({ items }: { items: string[] }) =>
  List({
    data: items,
    renderItem: (text, index) =>
      TextStyles.Body(text).padding(8).build(),
  })
```

## API Reference

### Text Function

```typescript
Text(
  content: string | (() => string) | Signal<string>,
  props?: Omit<TextProps, 'content'>
): ModifiableComponent<TextProps>
```

### TextProps Interface

```typescript
interface TextProps {
  content?: string | (() => string) | Signal<string>

  // Typography
  font?: {
    family?: string
    size?: number | string
    weight?: string
    style?: 'normal' | 'italic' | 'oblique'
    variant?: 'normal' | 'small-caps'
  }

  // Styling
  color?: string | Signal<string>
  backgroundColor?: string | Signal<string>
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  lineHeight?: number | string
  letterSpacing?: number | string
  wordSpacing?: number | string

  // Layout
  lineLimit?: number
  truncationMode?: 'head' | 'tail' | 'middle'
  allowsSelection?: boolean

  // Accessibility
  accessibilityLabel?: string
  accessibilityRole?: 'text' | 'heading' | 'label'
  accessibilityLevel?: 1 | 2 | 3 | 4 | 5 | 6

  // Interactive
  onTap?: () => void
  onLongPress?: () => void
}
```

### Typography Presets

```typescript
const Typography = {
  largeTitle: { size: 34, weight: '400', lineHeight: 1.2 },
  title: { size: 28, weight: '400', lineHeight: 1.3 },
  title2: { size: 22, weight: '400', lineHeight: 1.3 },
  title3: { size: 20, weight: '400', lineHeight: 1.4 },
  headline: { size: 17, weight: '600', lineHeight: 1.4 },
  body: { size: 17, weight: '400', lineHeight: 1.5 },
  callout: { size: 16, weight: '400', lineHeight: 1.4 },
  subheadline: { size: 15, weight: '400', lineHeight: 1.4 },
  footnote: { size: 13, weight: '400', lineHeight: 1.3 },
  caption: { size: 12, weight: '400', lineHeight: 1.2 },
  caption2: { size: 11, weight: '400', lineHeight: 1.1 },
}
```

## HTML Content Rendering

### `.asHTML()` Modifier

The Text component supports secure HTML content rendering through the `.asHTML()` modifier, which includes built-in XSS protection and sanitization.

> ⚠️ **Security Notice**: The `.asHTML()` modifier can only be used with Text components and includes basic sanitization by default. For production applications handling untrusted content, consider using DOMPurify.

#### Basic HTML Rendering

```typescript
import { Text } from '@tachui/primitives'

// Simple HTML content
Text('<p>Welcome to <strong>TachUI</strong>!</p>').asHTML().build()

// Rich content with styling
Text(`
  <article>
    <h2>Getting Started</h2>
    <p>TachUI provides a <em>SwiftUI-inspired</em> development experience.</p>
    <ul>
      <li>Reactive state management</li>
      <li>Type-safe components</li>
      <li>Built-in security</li>
    </ul>
    <blockquote>
      "The future of web development is declarative."
    </blockquote>
  </article>
`)
  .asHTML()
  .padding(20)
  .backgroundColor('#F8F9FA')
  .cornerRadius(8)
  .build()
```

#### Security Features

The `.asHTML()` modifier automatically protects against common XSS attacks:

```typescript
// Dangerous content is automatically sanitized
Text('<script>alert("xss")</script><p>Safe content</p>')
  .asHTML()
  .build()
// Result: '<p>Safe content</p>' (script removed)

Text('<img src="x" onerror="alert(1)" alt="Image">').asHTML().build()
// Result: '<img src="x" alt="Image">' (event handler removed)
```

#### Custom Sanitization

```typescript
import DOMPurify from 'dompurify'

// Using DOMPurify for comprehensive sanitization
Text(userGeneratedContent)
  .asHTML({
    customSanitizer: (html: string) => DOMPurify.sanitize(html),
  })
  .build()

// Restrict to specific tags
Text(blogContent)
  .asHTML({
    allowedTags: ['p', 'strong', 'em', 'a', 'ul', 'li', 'blockquote'],
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'target', 'rel'],
    },
  })
  .build()
```

#### Content Types and Security Levels

```typescript
// User comments - Maximum security
Text(userComment)
  .asHTML({
    allowedTags: ['p', 'strong', 'em', 'br'],
    allowedAttributes: {},
  })
  .build()

// Editorial content - Balanced security
Text(articleContent)
  .asHTML({
    allowedTags: ['p', 'strong', 'em', 'a', 'ul', 'li', 'h1', 'h2', 'h3'],
    allowedAttributes: {
      '*': ['class'],
      a: ['href', 'target', 'rel'],
    },
  })
  .build()

// Trusted server content - Skip sanitization (use with caution)
Text(trustedTemplate)
  .asHTML({
    skipSanitizer: true,
    __suppressWarnings: true,
  })
  .build()
```

For comprehensive documentation on secure HTML rendering, see the [HTML Content Security Guide](../guide/html-content-security.md).

## Best Practices

1. **Use Typography Presets**: Start with built-in presets for consistency
2. **Reactive Content**: Use signals for dynamic text that needs updates
3. **Accessibility**: Always provide proper accessibility roles for semantic text
4. **Performance**: Memoize expensive text computations
5. **Responsive**: Consider mobile-first responsive typography
6. **Contrast**: Ensure sufficient color contrast for readability
7. **Line Height**: Use appropriate line height (1.4-1.6) for readability

## Troubleshooting

### Text Not Updating

- Ensure you're using signals or reactive functions for dynamic content
- Check that the signal is properly set up with `createSignal`

### Styling Not Applied

- Remember that styling is applied through the modifier system
- Use `.modifier` before applying styles

### Poor Performance with Large Text

- Consider text virtualization for very large amounts of text
- Use `createMemo` for expensive text computations
- Debounce rapid text updates

### Accessibility Issues

- Always provide `accessibilityLabel` for non-text content (emojis, symbols)
- Use proper heading hierarchy with `accessibilityLevel`
- Ensure sufficient color contrast ratios
