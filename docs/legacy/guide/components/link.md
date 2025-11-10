# Link

A SwiftUI-inspired link component for URL navigation with intelligent routing, supporting external links, internal navigation, SPA routing, and various link types (web, email, phone, etc.).

## Overview

The `Link` component provides seamless navigation handling with automatic detection of internal vs external links, comprehensive accessibility, and flexible routing modes. It follows SwiftUI patterns while adding web-specific enhancements like SPA routing and download support.

## Basic Usage

### SwiftUI API (Recommended)

```typescript
import { Link } from '@tachui/core'

function BasicExample() {
  return Link('Visit Example', 'https://example.com')
    .modifier
    .build()
}
```

### Object API (Backward Compatibility)

```typescript
import { Link } from '@tachui/core'

function BasicExample() {
  return Link({
    destination: 'https://example.com',
    children: 'Visit Example'
  }).build()
}
```

## API Formats

The Link component supports two API formats:

- **SwiftUI API**: `Link(text, destination)` - Recommended for simple links matching SwiftUI patterns
- **Object API**: `Link({destination, children, ...})` - Use for advanced features like custom event handlers, routing modes, and accessibility options

Both formats support the full modifier system and have identical functionality.

## API Reference

### LinkProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `destination` | `string \| URL \| Signal<string \| URL>` | **Required** | Link destination URL |
| `children` | `string \| ComponentInstance \| Array` | `destination` | Link content (defaults to URL if not provided) |
| `target` | `LinkTarget \| Signal<LinkTarget>` | `'_self'` | Link target (`_self`, `_blank`, `_parent`, `_top`) |
| `routingMode` | `LinkRoutingMode \| Signal<LinkRoutingMode>` | `'auto'` | Routing behavior (`auto`, `external`, `internal`, `spa`) |
| `download` | `boolean \| string \| Signal<boolean \| string>` | `false` | Download attribute (true or filename) |
| `rel` | `string \| Signal<string>` | Auto-generated | Relationship attributes |
| `onPress` | `(event: Event) => void` | `undefined` | Click callback |
| `onBeforeNavigation` | `(url: string) => boolean \| Promise<boolean>` | `undefined` | Pre-navigation hook |
| `onInternalNavigation` | `(path: string) => boolean \| Promise<boolean>` | `undefined` | Internal routing hook |
| `disabled` | `boolean \| Signal<boolean>` | `false` | Whether link is disabled |
| `accessibilityLabel` | `string \| Signal<string>` | `undefined` | ARIA label for accessibility |
| `accessibilityHint` | `string \| Signal<string>` | `undefined` | ARIA description |
| `accessibilityRole` | `string` | `undefined` | ARIA role override |

### LinkTarget

```typescript
type LinkTarget = '_self' | '_blank' | '_parent' | '_top'
```

### LinkRoutingMode

```typescript
type LinkRoutingMode = 'auto' | 'external' | 'internal' | 'spa'
```

- **`auto`**: Automatically detect based on URL (default)
- **`external`**: Force external navigation (new window/tab)
- **`internal`**: Force internal navigation (same window)
- **`spa`**: Use History API for single-page app routing

## URL Types and Navigation

### External Links
Automatically detected or explicitly set:

```typescript
// SwiftUI API - Auto-detected as external
Link('External Link', 'https://external.com').build()

// Object API - Explicitly external with options
Link({
  destination: 'https://example.com',
  children: 'Force External',
  routingMode: 'external',
  target: '_blank'
}).build()
```

### Internal Links
For same-domain navigation:

```typescript
// SwiftUI API - Auto-detected as internal
Link('Internal Page', '/internal-page').build()

// Object API - Explicitly internal
Link({
  destination: '/dashboard',
  children: 'Dashboard',
  routingMode: 'internal'
}).build()
```

### Single-Page App (SPA) Links
Uses History API for client-side routing:

```typescript
Link({
  destination: '/spa-route',
  children: 'SPA Navigation',
  routingMode: 'spa',
  onInternalNavigation: (path) => {
    console.log('Navigating to:', path)
    return true // Allow navigation
  }
}).build()
```

## Special Link Types

### Email Links
```typescript
// SwiftUI API - Basic email link
Link('Contact Support', 'mailto:support@example.com').build()

// Object API - Email with subject and body
Link({
  destination: 'mailto:hello@example.com?subject=Hello&body=Message',
  children: 'Send Message'
}).build()
```

### Phone Links
```typescript
// SwiftUI API
Link('Call Us', 'tel:+1234567890').build()
```

### Download Links
```typescript
// Object API - For advanced download options
Link({
  destination: 'https://example.com/file.pdf',
  children: 'Download PDF',
  download: true
}).build()

Link({
  destination: 'https://example.com/document.pdf',
  children: 'Download Document',
  download: 'my-document.pdf'
}).build()
```

## LinkUtils

Pre-configured Link setups for common use cases:

### External Links
```typescript
import { LinkUtils } from '@tachui/core'

function ExternalExample() {
  return Link({
    ...LinkUtils.external('https://example.com', 'Visit Website')
  }).build()
  
  // Equivalent to:
  // destination: 'https://example.com'
  // children: 'Visit Website'
  // target: '_blank'
  // routingMode: 'external'
  // rel: 'noopener noreferrer external'
  // accessibilityHint: 'Opens in a new tab'
}
```

### Internal Navigation
```typescript
function InternalExample() {
  return Link({
    ...LinkUtils.internal('/dashboard', 'Go to Dashboard')
  }).build()
  
  // Pre-configured: target '_self', routingMode 'internal'
}
```

### SPA Navigation
```typescript
function SPAExample() {
  return Link({
    ...LinkUtils.spa('/profile', 'View Profile')
  }).build()
  
  // Pre-configured: routingMode 'spa', accessibilityHint 'Navigates within the app'
}
```

### Email Links
```typescript
function EmailExample() {
  return VStack({
    children: [
      // Basic email
      Link({
        ...LinkUtils.email('support@example.com')
      }).build(),
      
      // Email with subject and body
      Link({
        ...LinkUtils.email('sales@example.com', 'Product Inquiry', 'I would like to know more about...', 'Contact Sales')
      }).build()
    ]
  }).build()
}
```

### Phone Links
```typescript
function PhoneExample() {
  return Link({
    ...LinkUtils.phone('+1 (555) 123-4567', 'Call Support')
  }).build()
  
  // Automatically formats phone number and adds accessibility
}
```

### Download Links
```typescript
function DownloadExample() {
  return Link({
    ...LinkUtils.download('https://example.com/manual.pdf', 'user-manual.pdf', 'Download Manual')
  }).build()
}
```

### Social Media Links
```typescript
function SocialExample() {
  return HStack({
    children: [
      Link({
        ...LinkUtils.social.twitter('username')
      }).build(),
      
      Link({
        ...LinkUtils.social.github('username')
      }).build(),
      
      Link({
        ...LinkUtils.social.linkedin('profile')
      }).build()
    ]
  })
  .modifier
  .gap(16)
  .build()
}
```

### App Store Links
```typescript
function AppStoreExample() {
  return VStack({
    children: [
      Link({
        ...LinkUtils.appStore.ios('123456789', 'Download iOS App')
      }).build(),
      
      Link({
        ...LinkUtils.appStore.android('com.example.app', 'Get Android App')
      }).build()
    ]
  }).build()
}
```

## Routing Modes

### Auto Mode (Default)
Automatically determines routing based on URL characteristics:

```typescript
Link({
  destination: '/internal',        // → Internal routing
  routingMode: 'auto'
}).build()

Link({
  destination: 'https://external.com', // → External routing
  routingMode: 'auto'
}).build()

Link({
  destination: 'mailto:test@example.com', // → Special scheme (external)
  routingMode: 'auto'
}).build()
```

### Internal Mode
Forces same-window navigation:

```typescript
Link({
  destination: 'https://external.com', // Still navigates internally
  children: 'Internal Navigation',
  routingMode: 'internal'
}).build()
```

### External Mode
Forces new window/tab navigation:

```typescript
Link({
  destination: '/internal-page', // Opens in new tab
  children: 'External Navigation',
  routingMode: 'external',
  target: '_blank'
}).build()
```

### SPA Mode
Uses History API for client-side routing:

```typescript
Link({
  destination: '/spa-route',
  children: 'SPA Link',
  routingMode: 'spa',
  onInternalNavigation: async (path) => {
    // Custom routing logic
    await myRouter.navigate(path)
    return true
  }
}).build()
```

## Event Handling

### Navigation Hooks
Control navigation flow with async hooks:

```typescript
Link({
  destination: 'https://example.com',
  children: 'Controlled Link',
  onBeforeNavigation: async (url) => {
    // Show confirmation dialog
    const confirmed = await showConfirmDialog(`Navigate to ${url}?`)
    return confirmed
  },
  onInternalNavigation: async (path) => {
    // Handle SPA routing
    await router.push(path)
    return true
  }
}).build()
```

### Click Callbacks
```typescript
Link({
  destination: 'https://example.com',
  children: 'Tracked Link',
  onPress: (event) => {
    // Track link click
    analytics.track('link_clicked', {
      destination: 'https://example.com',
      timestamp: Date.now()
    })
  }
}).build()
```

## Reactive Properties

All Link properties support reactive values:

```typescript
function ReactiveExample() {
  const [destination, setDestination] = createSignal('https://example.com')
  const [isDisabled, setIsDisabled] = createSignal(false)
  const [linkTarget, setLinkTarget] = createSignal<'_self' | '_blank'>('_self')

  return VStack({
    children: [
      Link({
        destination,
        children: 'Reactive Link',
        target: linkTarget,
        disabled: isDisabled
      }).build(),
      
      Button({
        title: 'Toggle Target',
        action: () => setLinkTarget(prev => prev === '_self' ? '_blank' : '_self')
      }).build(),
      
      Button({
        title: 'Toggle Disabled',
        action: () => setIsDisabled(prev => !prev)
      }).build()
    ]
  }).build()
}
```

## Accessibility

### Automatic Accessibility
Links provide built-in accessibility features:

- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Enter and Space key support
- **Focus Management**: Visible focus indicators
- **State Announcements**: Disabled state properly announced

```typescript
Link({
  destination: 'https://example.com',
  children: 'Accessible Link',
  accessibilityLabel: 'Visit Example website',
  accessibilityHint: 'Opens in a new browser tab',
  disabled: false
}).build()
```

### Screen Reader Support
Links announce:
- Link text or accessibility label
- Destination type (external, email, phone)
- Opening behavior (new tab, same window)
- Current state (enabled, disabled)

### Keyboard Navigation
- **Tab**: Move focus to link
- **Enter/Space**: Activate link
- **Tab + Shift**: Move to previous focusable element

## Security

### Automatic Security Attributes
External links automatically receive security attributes:

```typescript
// Automatically adds rel="noopener noreferrer"
Link({
  destination: 'https://external.com',
  children: 'Secure External Link',
  target: '_blank'
}).build()
```

### Custom Security Attributes
```typescript
Link({
  destination: 'https://untrusted.com',
  children: 'Untrusted Link',
  rel: 'nofollow noopener noreferrer'
}).build()
```

## Styling with Modifiers

Customize appearance with the TachUI modifier system:

```typescript
Link({
  destination: 'https://example.com',
  children: 'Styled Link'
})
.modifier
.fontSize(18)
.fontWeight('600')
.color('#007AFF')
.padding(12)
.backgroundColor('#F0F8FF')
.borderRadius(8)
.textDecoration('none')
.build()
```

## Custom Theming

Create custom Link themes:

```typescript
import { LinkStyles } from '@tachui/core'

const customTheme = LinkStyles.createTheme({
  colors: {
    ...LinkStyles.theme.colors,
    text: '#FF6B6B',
    textHover: '#FF5252',
    textActive: '#FF1744'
  },
  typography: {
    ...LinkStyles.theme.typography,
    fontWeight: '600',
    textDecorationHover: 'underline'
  }
})

// Apply custom theme in your app
```

### Style Presets
```typescript
// Button-style link
Link({
  destination: 'https://example.com',
  children: 'Button Link'
})
.modifier
.padding(12)
.backgroundColor('#007AFF')
.color('#FFFFFF')
.borderRadius(8)
.textDecoration('none')
.build()

// Subtle link
Link({
  destination: '/settings',
  children: 'Settings'
})
.modifier
.color('#8E8E93')
.fontSize(14)
.build()

// Destructive link
Link({
  destination: '/delete-account',
  children: 'Delete Account'
})
.modifier
.color('#FF3B30')
.build()
```

## Best Practices

### 1. Choose Appropriate Routing Modes
Use the right routing mode for your use case:

```typescript
// Good - External links open in new tabs
LinkUtils.external('https://docs.example.com', 'Documentation')

// Good - Internal navigation stays in same window
LinkUtils.internal('/dashboard', 'Dashboard')

// Good - SPA routing for client-side navigation
LinkUtils.spa('/profile', 'Profile')

// Avoid - Forcing external routing for internal links
Link({
  destination: '/internal-page',
  routingMode: 'external', // Confusing UX
  target: '_blank'
})
```

### 2. Provide Clear Link Text
Make link purpose obvious:

```typescript
// Good - Descriptive link text
Link({
  destination: 'https://example.com/privacy',
  children: 'Read our Privacy Policy'
}).build()

// Avoid - Generic link text
Link({
  destination: 'https://example.com/privacy',
  children: 'Click here' // Not descriptive
}).build()
```

### 3. Use Appropriate Accessibility Labels
```typescript
// Good - Clear accessibility information
Link({
  destination: 'mailto:support@example.com',
  children: 'Contact Support',
  accessibilityLabel: 'Send email to support team',
  accessibilityHint: 'Opens your email application'
}).build()

// Good - External link indication
Link({
  destination: 'https://external.com',
  children: 'External Resource',
  accessibilityHint: 'Opens in a new browser tab'
}).build()
```

### 4. Handle Navigation Gracefully
```typescript
// Good - Provide feedback for navigation
Link({
  destination: '/slow-loading-page',
  children: 'Slow Page',
  onPress: () => {
    showLoadingIndicator()
  },
  onBeforeNavigation: async (url) => {
    try {
      await prefetchPage(url)
      return true
    } catch {
      showError('Page unavailable')
      return false
    }
  }
}).build()
```

### 5. Consider Mobile Usability
```typescript
// Good - Touch-friendly link styling
Link({
  destination: '/mobile-page',
  children: 'Mobile Link'
})
.modifier
.padding(12) // Adequate touch target
.fontSize(16) // Readable text size
.build()

// Good - Mobile-specific behavior
Link({
  destination: 'tel:+1234567890',
  children: 'Call Now'
})
.modifier
.display('inline-block')
.padding(8, 16)
.backgroundColor('#007AFF')
.color('#FFFFFF')
.borderRadius(8)
.build()
```

## Performance Considerations

- Link components are lightweight with minimal overhead
- Routing mode detection is fast and cached
- Event handlers are efficiently attached using event delegation
- Reactive updates only re-render when properties change
- SPA navigation uses efficient History API calls

## Browser Support

Link uses modern web standards with graceful degradation:
- **Anchor elements**: Universal support (all browsers)
- **History API**: IE10+ for SPA routing
- **Touch events**: iOS Safari 3+, Android 2.1+
- **ARIA attributes**: IE11+ for full screen reader support

---

## Related Components

- [**Button**](./button.md) - Interactive actions that don't navigate
- [**NavigationView**](./navigationview.md) - Stack-based internal navigation
- [**TabView**](./tabview.md) - Tab-based navigation interface