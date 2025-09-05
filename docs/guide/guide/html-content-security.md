# HTML Content Security Guide

This guide covers secure HTML content rendering in TachUI using the `.asHTML()` modifier, including best practices, security considerations, and integration with external sanitization libraries.

## Overview

The `.asHTML()` modifier allows Text components to render HTML content safely while providing built-in protection against XSS (Cross-Site Scripting) attacks. It implements a security-first approach with basic sanitization enabled by default.

## Quick Start

### Basic HTML Rendering

```typescript
import { Text } from '@tachui/primitives'

// Safe: Basic HTML with default sanitization
Text('<p>Welcome to <strong>TachUI</strong>!</p>').modifier.asHTML().build()

// Rich content example
Text(`
  <article class="blog-post">
    <header>
      <h2>Getting Started with TachUI</h2>
      <p><em>Published on March 15, 2024</em></p>
    </header>
    
    <section>
      <p>TachUI provides a <strong>SwiftUI-inspired</strong> development experience for web applications.</p>
      
      <blockquote>
        "The future of web development is declarative and type-safe."
      </blockquote>
      
      <ul>
        <li>Reactive state management</li>
        <li>Component-based architecture</li>
        <li>Built-in security features</li>
      </ul>
    </section>
    
    <footer>
      <p>
        <a href="https://tachui.dev/docs" target="_blank" rel="noopener">
          Read the full documentation →
        </a>
      </p>
    </footer>
  </article>
`)
  .modifier.asHTML()
  .padding(24)
  .backgroundColor('#FFFFFF')
  .border(1, '#E5E5E7')
  .cornerRadius(12)
  .shadow({ x: 0, y: 4, blur: 16, color: 'rgba(0,0,0,0.1)' })
  .build()
```

## Security Model

### Text Component Restriction

The `.asHTML()` modifier enforces strict component type restrictions for security:

```typescript
// ✅ Allowed: Text components only
Text('<p>Safe HTML content</p>').modifier.asHTML().build()

// ❌ Runtime Error: Other components are blocked
Button('Click me')
  .modifier.asHTML() // Error: AsHTML modifier can only be applied to Text components
  .build()

VStack({ children: [] })
  .modifier.asHTML() // Error: AsHTML modifier can only be applied to Text components
  .build()
```

**Why This Restriction Matters:**

- Prevents HTML injection into interactive components
- Ensures HTML content is treated as display-only
- Reduces attack surface for XSS vulnerabilities
- Maintains clear separation between content and interactivity

### Built-in Sanitization

The modifier includes comprehensive protection against common XSS vectors:

#### Automatic Removal of Dangerous Content

```typescript
// Script tags - completely removed
Text('<script>alert("XSS")</script><p>Safe content</p>')
  .modifier.asHTML()
  .build()
// Result: '<p>Safe content</p>'

// Event handlers - attributes stripped
Text('<div onclick="alert(1)" class="safe">Content</div>')
  .modifier.asHTML()
  .build()
// Result: '<div class="safe">Content</div>'

// JavaScript URLs - removed from href/src attributes
Text('<a href="javascript:alert(1)">Link</a>').modifier.asHTML().build()
// Result: '<a>Link</a>'

// Dangerous elements - completely removed
Text('<iframe src="evil.html"></iframe><p>Content</p>')
  .modifier.asHTML()
  .build()
// Result: '<p>Content</p>'
```

#### Protected Attack Vectors (40+)

The sanitizer protects against these common XSS patterns:

- **Script injection**: `<script>`, nested scripts, malformed tags
- **Event handlers**: `onclick`, `onload`, `onerror`, etc.
- **URL-based attacks**: `javascript:`, `data:` URLs with scripts
- **CSS injection**: `<style>` tags, `expression()`, `@import` with JS
- **Entity encoding**: HTML entities used to bypass filters
- **Mixed case evasion**: `<ScRiPt>`, `<IMG SRC=...>`
- **SVG vectors**: `<svg onload=...>`, embedded scripts
- **Form attacks**: `formaction` attributes, dangerous inputs
- **Meta tag attacks**: Refresh redirects, dangerous headers

## Configuration Options

### Custom Sanitization

#### Using DOMPurify (Recommended for Production)

```typescript
import DOMPurify from 'dompurify'

// Comprehensive sanitization with DOMPurify
Text(userGeneratedContent)
  .modifier.asHTML({
    customSanitizer: (html: string) =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'li', 'blockquote'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        ALLOW_DATA_ATTR: false,
      }),
  })
  .build()

// DOMPurify with custom configuration
const sanitizeRichContent = (html: string) => {
  return DOMPurify.sanitize(html, {
    // Allow common formatting tags
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'i',
      'b',
      's',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      'blockquote',
      'pre',
      'code',
      'kbd',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
      'div',
      'span',
      'section',
      'article',
      'header',
      'footer',
    ],

    // Safe attributes only
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'class',
      'id',
      'src',
      'alt',
      'width',
      'height',
      'title',
    ],

    // Block data attributes and unknown protocols
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^https?:|^\/|^#/i,

    // Additional security
    KEEP_CONTENT: true,
    RETURN_DOM_FRAGMENT: false,
  })
}

Text(blogContent)
  .modifier.asHTML({ customSanitizer: sanitizeRichContent })
  .build()
```

#### Custom Tag and Attribute Filtering

```typescript
// Restrict to specific tags and attributes
Text(articleContent)
  .modifier.asHTML({
    allowedTags: [
      'p',
      'strong',
      'em',
      'a',
      'ul',
      'li',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'img',
    ],
    allowedAttributes: {
      '*': ['class', 'id'], // Global attributes
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      h1: [],
      h2: [],
      h3: [], // No additional attributes
    },
  })
  .build()

// Minimal content (text formatting only)
Text(commentContent)
  .modifier.asHTML({
    allowedTags: ['strong', 'em', 'code', 'br'],
    allowedAttributes: {}, // No attributes allowed
  })
  .build()
```

#### Custom Pattern Removal

```typescript
// Remove custom dangerous patterns
Text(templateContent)
  .modifier.asHTML({
    customPatterns: [
      // Remove server-side includes
      /<\?.*?\?>/gi,
      // Remove template expressions
      /\{\{.*?\}\}/gi,
      // Remove PHP tags
      /<\?php.*?\?>/gi,
      // Custom script-like patterns
      /<customscript.*?<\/customscript>/gi,
    ],
  })
  .build()
```

### Performance Optimizations

#### Trusted Content Optimization

```typescript
// For trusted, pre-validated content
Text(trustedServerContent)
  .modifier.asHTML({
    validateDOM: false, // Skip DOM validation
    customPatterns: [], // Skip custom pattern checks
    __suppressWarnings: true,
  })
  .build()

// Template content with known structure
Text(emailTemplate)
  .modifier.asHTML({
    // Only check for critical patterns
    customPatterns: [/<script.*?<\/script>/gi, /javascript:/gi],
    // Skip full DOM validation for performance
    validateDOM: false,
  })
  .build()
```

## Security Best Practices

### 1. Content Source Classification

```typescript
// User-generated content - Maximum security
Text(userComment)
  .modifier.asHTML({
    customSanitizer: DOMPurify.sanitize,
    allowedTags: ['p', 'strong', 'em', 'code', 'br'],
    allowedAttributes: {},
  })
  .build()

// Editorial content - Balanced security
Text(blogPost)
  .modifier.asHTML({
    customSanitizer: html =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p',
          'strong',
          'em',
          'a',
          'ul',
          'li',
          'blockquote',
          'h1',
          'h2',
          'h3',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      }),
  })
  .build()

// Trusted CMS content - Moderate security
Text(cmsContent)
  .modifier.asHTML({
    // Use built-in sanitization with custom allowed tags
    allowedTags: [...defaultTags, 'table', 'tr', 'td', 'img'],
    allowedAttributes: {
      '*': ['class', 'id'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
  })
  .build()

// Server templates - Minimal security (trusted source)
Text(serverTemplate)
  .modifier.asHTML({
    skipSanitizer: true,
    __suppressWarnings: true,
  })
  .build()
```

### 2. Content Security Policy (CSP)

Combine `.asHTML()` with Content Security Policy headers:

```typescript
// Add CSP meta tag or headers
const cspPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Avoid 'unsafe-inline' in production
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ')

// Then use asHTML() knowing scripts are blocked by CSP
Text(richContent)
  .modifier.asHTML() // Even if sanitization fails, CSP provides backup protection
  .build()
```

### 3. Input Validation at Source

```typescript
// Validate content before rendering
const validateContentSource = (html: string): boolean => {
  // Check content length
  if (html.length > 50000) return false

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:.*script/i,
    /vbscript:/i,
  ]

  return !suspiciousPatterns.some(pattern => pattern.test(html))
}

const renderSafeContent = (content: string) => {
  if (!validateContentSource(content)) {
    return Text('Content blocked for security reasons')
      .modifier.foregroundColor('#FF3B30')
      .build()
  }

  return Text(content).modifier.asHTML().build()
}
```

## Development Guidelines

### Development Mode Features

The modifier provides helpful development warnings:

```typescript
// In development, this triggers security warnings
Text('<script>alert(1)</script><p>Content</p>').modifier.asHTML().build()

// Console output:
// 🔒 AsHTML Security Warnings
// Potentially dangerous content detected in asHTML:
//   • Script tags detected
//   • Event handlers detected
// Consider using a comprehensive sanitization solution like DOMPurify
// To suppress these warnings, use { __suppressWarnings: true }
```

### Testing Security

```typescript
// Test security measures in your application
const testSecurityVectors = () => {
  const dangerousInputs = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    '<a href="javascript:alert(1)">Click</a>',
    '<div onclick="alert(1)">Click</div>',
    '<iframe src="javascript:alert(1)"></iframe>',
  ]

  dangerousInputs.forEach(input => {
    const result = Text(input).modifier.asHTML().build()
    // Verify that dangerous content is removed/sanitized
    console.assert(
      !result.innerHTML?.includes('alert'),
      `Failed to sanitize: ${input}`
    )
  })
}

// Run security tests in development
if (process.env.NODE_ENV === 'development') {
  testSecurityVectors()
}
```

## Real-World Examples

### Blog Content Rendering

```typescript
import { Text, VStack } from '@tachui/primitives'
import DOMPurify from 'dompurify'

interface BlogPost {
  title: string
  content: string
  excerpt: string
  publishedAt: string
}

const BlogPostComponent = (post: BlogPost) => {
  const sanitizeBlogContent = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'i',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'blockquote',
        'pre',
        'code',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',
      ],
      ALLOWED_ATTR: [
        'href',
        'target',
        'rel',
        'src',
        'alt',
        'width',
        'height',
        'class',
        'id',
      ],
      ALLOWED_URI_REGEXP: /^https?:|^\/|^#/i,
    })
  }

  return VStack({
    children: [
      // Title (safe, no HTML)
      Text(post.title)
        .modifier.fontSize(32)
        .fontWeight('bold')
        .marginBottom(8)
        .build(),

      // Published date (safe, no HTML)
      Text(post.publishedAt)
        .modifier.fontSize(14)
        .opacity(0.7)
        .marginBottom(24)
        .build(),

      // Rich HTML content with security
      Text(post.content)
        .modifier.asHTML({
          customSanitizer: sanitizeBlogContent,
        })
        .fontSize(16)
        .lineHeight(1.6)
        .build(),
    ],
  })
    .modifier.padding(24)
    .backgroundColor('#FFFFFF')
    .cornerRadius(8)
    .shadow({ x: 0, y: 2, blur: 8, color: 'rgba(0,0,0,0.1)' })
    .build()
}
```

### Comment System

```typescript
interface Comment {
  author: string
  content: string
  timestamp: string
}

const CommentComponent = (comment: Comment) => {
  // Strict sanitization for user comments
  const sanitizeComment = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'br', 'p'],
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true,
    })
  }

  return VStack({
    children: [
      // Author name (plain text, no HTML)
      Text(comment.author).modifier.fontWeight('600').fontSize(14).build(),

      // User comment (limited HTML, heavily sanitized)
      Text(comment.content)
        .modifier.asHTML({
          customSanitizer: sanitizeComment,
        })
        .fontSize(14)
        .lineHeight(1.4)
        .marginTop(4)
        .build(),

      // Timestamp (plain text, no HTML)
      Text(comment.timestamp)
        .modifier.fontSize(12)
        .opacity(0.6)
        .marginTop(8)
        .build(),
    ],
  })
    .modifier.padding(16)
    .backgroundColor('#F8F9FA')
    .cornerRadius(6)
    .marginBottom(12)
    .build()
}
```

### Email Template Rendering

```typescript
const EmailPreview = (templateHtml: string) => {
  // Email templates are trusted but may contain template variables
  const sanitizeEmailTemplate = (html: string) => {
    // Remove server-side template syntax but keep HTML structure
    return html
      .replace(/\{\{.*?\}\}/g, '[VARIABLE]') // Replace template variables
      .replace(/<\?.*?\?>/g, '') // Remove PHP tags
      .replace(/<%.*?%>/g, '') // Remove ASP tags
  }

  return Text(templateHtml)
    .modifier.asHTML({
      customSanitizer: sanitizeEmailTemplate,
      allowedTags: [
        'html',
        'head',
        'body',
        'meta',
        'title', // Email structure
        'table',
        'tr',
        'td',
        'th',
        'thead',
        'tbody', // Email layout
        'div',
        'span',
        'p',
        'br',
        'a',
        'img', // Content
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6', // Headers
        'strong',
        'em',
        'b',
        'i',
        'u', // Formatting
        'ul',
        'ol',
        'li', // Lists
      ],
      allowedAttributes: {
        '*': ['class', 'id', 'style'], // Email needs inline styles
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height', 'border'],
        table: ['width', 'height', 'border', 'cellspacing', 'cellpadding'],
        td: ['width', 'height', 'align', 'valign', 'colspan', 'rowspan'],
        meta: ['charset', 'name', 'content'],
      },
    })
    .modifier.fontFamily('system-ui, -apple-system, sans-serif')
    .fontSize(14)
    .lineHeight(1.4)
    .build()
}
```

## Troubleshooting

### Common Issues

#### Content Not Rendering

```typescript
// Issue: Empty output
Text('<div>Content</div>').modifier.asHTML().build()
// Check: Is 'div' in allowedTags? Default sanitizer may be too restrictive

// Solution: Add explicit allowed tags
Text('<div>Content</div>')
  .modifier.asHTML({
    allowedTags: ['div', 'p', 'span'], // Add div to allowed tags
  })
  .build()
```

#### Development Warnings

```typescript
// Issue: Console spam with security warnings
Text(content).modifier.asHTML().build()

// Solution: Suppress warnings for known-safe content
Text(content).modifier.asHTML({ __suppressWarnings: true }).build()

// Or: Fix the content to remove dangerous patterns
const safeContent = content.replace(/<script.*?<\/script>/gi, '')
Text(safeContent).modifier.asHTML().build()
```

#### Performance Issues

```typescript
// Issue: Slow rendering with large content
Text(largeHtmlContent).modifier.asHTML().build()

// Solution: Optimize for trusted content
Text(largeHtmlContent)
  .modifier.asHTML({
    validateDOM: false, // Skip DOM validation
    customPatterns: [], // Skip custom pattern checks
  })
  .build()
```

## Migration from Other Solutions

### From innerHTML

```typescript
// Before: Direct innerHTML (unsafe)
element.innerHTML = userContent

// After: Secure asHTML modifier
Text(userContent).modifier.asHTML().build()
```

### From Manual Sanitization

```typescript
// Before: Manual DOMPurify usage
const sanitized = DOMPurify.sanitize(content)
element.innerHTML = sanitized

// After: Integrated with asHTML
Text(content)
  .modifier.asHTML({
    customSanitizer: DOMPurify.sanitize,
  })
  .build()
```

## Conclusion

The `.asHTML()` modifier provides a secure, developer-friendly way to render HTML content in TachUI applications. By following the security best practices outlined in this guide, you can safely handle rich content while protecting your users from XSS attacks.

Key takeaways:

- Always use the modifier with security in mind
- Classify your content sources and apply appropriate restrictions
- Consider using DOMPurify for production applications with user-generated content
- Test your security measures during development
- Follow the principle of least privilege when configuring allowed tags and attributes

For questions or security concerns, please refer to the [TachUI Security Documentation](./security.md) or open an issue on GitHub.
