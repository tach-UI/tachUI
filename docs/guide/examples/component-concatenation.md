# Component Concatenation Examples

This guide provides practical examples of using tachUI's component concatenation system to build real-world UI patterns.

## Basic Examples

### Simple Text Combination

```typescript
import { Text } from '@tachui/core'

// Basic text concatenation
const greeting = Text("Hello, ")
  .concat(Text("World!"))

// Multi-part message
const welcomeMessage = Text("Welcome to ")
  .concat(Text("tachUI").fontWeight('bold'))
  .concat(Text(", the SwiftUI-inspired web framework!"))

// Dynamic content
import { createSignal } from '@tachui/core'

const PersonalGreeting = () => {
  const [name] = createSignal("John Doe")
  
  return Text("Welcome back, ")
    .concat(Text(name).color('#007AFF'))
    .concat(Text("!"))
}
```

### Text with Icons

```typescript
import { Text, Image } from '@tachui/core'

// Status message with icon
const successMessage = Image("check-circle.svg", { 
  alt: "Success",
  width: 16,
  height: 16 
})
.concat(Text(" Operation completed successfully"))
.modifier
.color('#28a745')
.display('flex')
.alignItems('center')
.gap(8)

// Warning with icon
const warningMessage = Image("warning.svg", { 
  alt: "Warning",
  width: 16,
  height: 16 
})
.concat(Text(" Please review your changes"))
.modifier
.color('#ffc107')
.display('flex')
.alignItems('center')
.gap(8)

// Navigation item
const homeNavItem = Image("home-icon.svg", { alt: "" })
  .concat(Text("Home"))
  .modifier
  .display('flex')
  .alignItems('center')
  .gap(8)
  .padding(12)
  .cursor('pointer')
```

## Interactive Content

### Buttons with Icons

```typescript
import { Button, Image, Text } from '@tachui/core'

// Save button with icon
const saveButton = Image("save-icon.svg", { alt: "" })
  .concat(Button("Save Changes", handleSave))
  .modifier
  .display('flex')
  .alignItems('center')
  .gap(8)

// Download button
const downloadButton = Button("Download", handleDownload)
  .concat(Image("download-icon.svg", { 
    alt: "",
    width: 16,
    height: 16 
  }))
  .modifier
  .display('flex')
  .alignItems('center')
  .gap(8)

// Social login button
const googleLogin = Image("google-logo.svg", { alt: "Google" })
  .concat(Text("Sign in with Google"))
  .modifier
  .display('flex')
  .alignItems('center')
  .gap(12)
  .padding(12)
  .border('1px solid #dadce0')
  .borderRadius(8)
  .cursor('pointer')
```

### Action Groups

```typescript
import { Button, Text } from '@tachui/core'

// Confirmation dialog actions
const confirmationActions = Button("Cancel", handleCancel, {
  variant: 'outlined'
})
.concat(Text("  "))
.concat(Button("Delete", handleDelete, {
  variant: 'filled',
  role: 'destructive'
}))

// Pagination controls
const paginationControls = Button("Previous", goToPrevious)
  .concat(Text(` Page ${currentPage} of ${totalPages} `))
  .concat(Button("Next", goToNext))
```

### Links and Navigation

```typescript
import { Link, Text, Image } from '@tachui/core'

// External link with icon
const externalLink = Link("Visit our GitHub", "https://github.com/company/repo", {
  target: '_blank'
})
.concat(Image("external-link.svg", { 
  alt: "Opens in new tab",
  width: 12,
  height: 12 
}))

// Breadcrumb navigation
const breadcrumbs = Link("Home", "/")
  .concat(Text(" > "))
  .concat(Link("Products", "/products"))
  .concat(Text(" > "))
  .concat(Text("iPhone 15 Pro"))

// Social media links
const socialLinks = Link("Twitter", "https://twitter.com/company")
  .concat(Text(" • "))
  .concat(Link("LinkedIn", "https://linkedin.com/company/company"))
  .concat(Text(" • "))
  .concat(Link("GitHub", "https://github.com/company"))
```

## Real-World UI Patterns

### User Profile Cards

```typescript
import { VStack, HStack, Image, Text, Button } from '@tachui/core'

const UserProfileCard = (user: User) => {
  // Header with avatar and name
  const userHeader = Image(user.avatar, { 
    alt: `${user.name}'s profile picture`,
    width: 48,
    height: 48 
  })
  .concat(Text(user.name).fontSize(18).fontWeight('bold'))
  .concat(Text(user.title).color('#666').fontSize(14))
  .modifier
  .display('flex')
  .alignItems('center')
  .gap(12)

  // Stats row
  const userStats = Text(`${user.followers} followers`)
    .concat(Text(" • "))
    .concat(Text(`${user.following} following`))
    .concat(Text(" • "))
    .concat(Text(`${user.posts} posts`))
    .modifier
    .fontSize(12)
    .color('#666')

  // Action buttons
  const userActions = Button("Follow", () => followUser(user))
    .concat(Button("Message", () => messageUser(user), { variant: 'outlined' }))
    .modifier
    .display('flex')
    .gap(8)

  return VStack([
    userHeader,
    Text(user.bio),
    userStats,
    userActions
  ]).padding(20).border('1px solid #e1e5e9').borderRadius(12)
}
```

### Product Cards

```typescript
const ProductCard = (product: Product) => {
  // Product image with badge
  const productImage = Image(product.image, { 
    alt: product.name,
    width: 200,
    height: 200 
  })

  // Price with discount
  const priceDisplay = product.discountPrice 
    ? Text(`$${product.discountPrice}`).fontSize(18).fontWeight('bold')
        .concat(Text(` $${product.price}`).modifier
          .fontSize(14)
          .textDecoration('line-through')
          .color('#666')
          .marginLeft(8))
    : Text(`$${product.price}`).fontSize(18).fontWeight('bold')

  // Rating with stars
  const ratingDisplay = Text("★".repeat(product.rating))
    .concat(Text("☆".repeat(5 - product.rating)))
    .concat(Text(` (${product.reviewCount} reviews)`))
    .modifier
    .color('#ffd700')
    .fontSize(14)

  // Action buttons
  const productActions = Button("Add to Cart", () => addToCart(product))
    .concat(Button("♡", () => toggleWishlist(product), { 
      variant: 'plain',
      accessibilityLabel: 'Add to wishlist'
    }))

  return VStack([
    productImage,
    Text(product.name).fontSize(16).fontWeight('500'),
    priceDisplay,
    ratingDisplay,
    productActions
  ]).padding(16).border('1px solid #e1e5e9').borderRadius(8)
}
```

### Status Notifications

```typescript
const StatusNotification = (
  type: 'success' | 'warning' | 'error' | 'info',
  message: string,
  actionText?: string,
  onAction?: () => void
) => {
  const icons = {
    success: "check-circle.svg",
    warning: "warning-triangle.svg", 
    error: "x-circle.svg",
    info: "info-circle.svg"
  }

  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
  }

  let notification = Image(icons[type], { 
    alt: type,
    width: 20,
    height: 20 
  }).concat(Text(message))

  if (actionText && onAction) {
    notification = notification
      .concat(Button(actionText, onAction, { variant: 'plain' }))
  }

  return notification.modifier
    .display('flex')
    .alignItems('center')
    .gap(12)
    .padding(16)
    .backgroundColor(colors[type].bg)
    .border(`1px solid ${colors[type].border}`)
    .color(colors[type].text)
    .borderRadius(8)
}

// Usage
const notifications = VStack([
  StatusNotification('success', 'File uploaded successfully'),
  StatusNotification('warning', 'Connection unstable', 'Retry', retryConnection),
  StatusNotification('error', 'Upload failed. Please try again.', 'Retry', retryUpload),
  StatusNotification('info', 'New version available', 'Update', startUpdate)
])
```

### Form Fields with Labels

```typescript
import { VStack, Text, TextField, BasicInput } from '@tachui/core'

const FormField = (
  label: string, 
  value: string, 
  setValue: (value: string) => void,
  required: boolean = false,
  helpText?: string,
  error?: string
) => {
  // Label with required indicator
  const fieldLabel = Text(label)
    .concat(required ? Text(" *").color('#dc3545') : Text(""))
    .modifier
    .fontSize(14)
    .fontWeight('500')
    .marginBottom(4)

  // Help text
  const helpElement = helpText 
    ? Text(helpText).fontSize(12).color('#666').marginTop(4)
    : null

  // Error message
  const errorElement = error
    ? Text(error).fontSize(12).color('#dc3545').marginTop(4)
    : null

  const elements = [
    fieldLabel,
    BasicInput(value, setValue, { placeholder: `Enter ${label.toLowerCase()}` })
  ]

  if (helpElement) elements.push(helpElement)
  if (errorElement) elements.push(errorElement)

  return VStack(elements).marginBottom(16)
}

// Usage in a form
const ContactForm = () => {
  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [message, setMessage] = createSignal("")

  return VStack([
    FormField("Full Name", name(), setName, true),
    FormField("Email Address", email(), setEmail, true, "We'll never share your email"),
    FormField("Message", message(), setMessage, true),
    
    Button("Send Message", handleSubmit)
      .concat(Text("  or  "))
      .concat(Button("Cancel", handleCancel, { variant: 'outlined' }))
  ])
}
```

## Advanced Composition Patterns

### Dynamic Content Lists

```typescript
const TagList = (tags: string[], maxVisible: number = 3) => {
  const visibleTags = tags.slice(0, maxVisible)
  const hiddenCount = tags.length - maxVisible

  let tagDisplay: any = null

  visibleTags.forEach((tag, index) => {
    const tagElement = Text(tag).modifier
      .padding(4)
      .backgroundColor('#e9ecef')
      .borderRadius(4)
      .fontSize(12)

    if (tagDisplay === null) {
      tagDisplay = tagElement
    } else {
      tagDisplay = tagDisplay.concat(Text(" ")).concat(tagElement)
    }
  })

  if (hiddenCount > 0) {
    tagDisplay = tagDisplay
      .concat(Text(" "))
      .concat(Text(`+${hiddenCount} more`).modifier
        .fontSize(12)
        .color('#666')
        .fontStyle('italic'))
  }

  return tagDisplay
}
```

### Responsive Content

```typescript
const ResponsiveHeader = (title: string, subtitle: string, action?: () => void) => {
  let header = Text(title).fontSize(24).fontWeight('bold')
    .concat(Text(subtitle).fontSize(16).color('#666'))

  if (action) {
    header = header.concat(Button("Action", action))
  }

  return header.modifier
    .responsive({
      mobile: {
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-start'
      },
      desktop: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    })
}
```

### Conditional Content

```typescript
const UserStatus = (user: User) => {
  let status = Image(user.avatar, { alt: user.name, width: 32, height: 32 })
    .concat(Text(user.name))

  if (user.isOnline) {
    status = status.concat(
      Image("online-dot.svg", { 
        alt: "Online",
        width: 8,
        height: 8 
      })
    )
  }

  if (user.isPremium) {
    status = status.concat(
      Image("premium-badge.svg", { 
        alt: "Premium user",
        width: 16,
        height: 16 
      })
    )
  }

  if (user.unreadCount > 0) {
    status = status.concat(
      Text(user.unreadCount.toString()).modifier
        .backgroundColor('#dc3545')
        .color('white')
        .borderRadius('50%')
        .padding(4)
        .fontSize(10)
        .minWidth(18)
        .textAlign('center')
    )
  }

  return status
}
```

## Performance Optimization Examples

### Memoized Concatenations

```typescript
import { createMemo } from '@tachui/core'

const OptimizedUserCard = (user: User) => {
  // Memoize expensive concatenation operations
  const userInfo = createMemo(() => 
    Image(user.avatar, { alt: user.name })
      .concat(Text(user.name))
      .concat(Text(user.email))
  )

  const userStats = createMemo(() =>
    Text(`${user.followers} followers`)
      .concat(Text(" • "))
      .concat(Text(`${user.posts} posts`))
  )

  return VStack([
    userInfo(),
    userStats(),
    Button("Follow", () => followUser(user))
  ])
}
```

### Large List Optimization

```typescript
const OptimizedCommentList = (comments: Comment[]) => {
  // For large lists, consider using virtual scrolling
  return VStack(
    comments.slice(0, 10).map(comment => 
      Image(comment.author.avatar, { alt: comment.author.name })
        .concat(Text(comment.author.name))
        .concat(Text(comment.content))
        .concat(Text(comment.timestamp))
    )
  )
}
```

These examples demonstrate the flexibility and power of tachUI's concatenation system for building complex, accessible, and performant user interfaces. The system automatically handles optimization and accessibility while providing a natural, SwiftUI-inspired API for component composition.