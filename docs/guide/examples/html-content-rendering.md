# HTML Content Rendering Examples

This document provides comprehensive examples of using the `.asHTML()` modifier for secure HTML content rendering in various real-world scenarios.

## Basic Examples

### Simple Rich Text

```typescript
import { Text, VStack } from '@tachui/primitives'

// Basic formatted content
const WelcomeMessage = () => {
  return Text(
    '<p>Welcome to <strong>TachUI</strong>! Start building <em>amazing</em> applications today.</p>'
  )
    .asHTML()
    .fontSize(16)
    .lineHeight(1.5)
    .textAlign('center')
    .padding(20)
    
}
```

### Newsletter Content

```typescript
const NewsletterArticle = () => {
  const content = `
    <article>
      <header>
        <h1>The Future of Web Development</h1>
        <p><em>Published March 15, 2024</em></p>
      </header>
      
      <section>
        <p>Modern web development is evolving rapidly, with new frameworks and approaches emerging regularly.</p>
        
        <h2>Key Trends</h2>
        <ul>
          <li><strong>Declarative UI</strong> - Framework that describe what the UI should look like</li>
          <li><strong>Type Safety</strong> - Catching errors at compile time</li>
          <li><strong>Component Architecture</strong> - Reusable, composable building blocks</li>
        </ul>
        
        <blockquote>
          "The best way to predict the future is to build it."
        </blockquote>
        
        <p>
          Learn more about modern development practices in our 
          <a href="/docs/guide" target="_blank" rel="noopener">comprehensive guide</a>.
        </p>
      </section>
    </article>
  `

  return Text(content)
    .asHTML()
    .maxWidth(600)
    .padding(24)
    .backgroundColor('#FFFFFF')
    .border(1, '#E5E5E7')
    .cornerRadius(12)
    .shadow({ x: 0, y: 4, blur: 16, color: 'rgba(0,0,0,0.1)' })
    
}
```

## Security-Focused Examples

### User-Generated Content (Comments)

```typescript
import DOMPurify from 'dompurify'

interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
}

const CommentComponent = (comment: Comment) => {
  // Strict sanitization for user comments
  const sanitizeUserContent = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'code', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_DOM_FRAGMENT: false,
    })
  }

  return VStack({
    children: [
      // Author (plain text, no HTML)
      Text(comment.author)
        .fontWeight('600')
        .fontSize(14)
        .foregroundColor('#2C3E50')
        ,

      // Comment content (sanitized HTML)
      Text(comment.content)
        .asHTML({
          customSanitizer: sanitizeUserContent,
        })
        .fontSize(14)
        .lineHeight(1.4)
        .marginTop(4)
        ,

      // Timestamp (plain text)
      Text(comment.timestamp)
        .fontSize(12)
        .opacity(0.6)
        .marginTop(8)
        ,
    ],
  })
    .padding(16)
    .backgroundColor('#F8F9FA')
    .border(1, '#E9ECEF')
    .cornerRadius(8)
    .marginBottom(12)
    
}

// Usage example
const CommentsSection = (comments: Comment[]) => {
  return VStack({
    children: [
      Text('Comments')
        .fontSize(20)
        .fontWeight('600')
        .marginBottom(16)
        ,

      ...comments.map(comment => CommentComponent(comment)),
    ],
  })
}
```

### Blog Post with Custom Sanitization

```typescript
interface BlogPost {
  title: string
  content: string
  excerpt: string
  tags: string[]
}

const BlogPostComponent = (post: BlogPost) => {
  // Editorial content - balanced security for trusted authors
  const sanitizeBlogContent = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        // Structure
        'article',
        'section',
        'header',
        'footer',
        'aside',
        'div',
        'span',
        'p',
        'br',

        // Headers
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',

        // Text formatting
        'strong',
        'em',
        'b',
        'i',
        'u',
        's',
        'sup',
        'sub',
        'mark',
        'del',
        'ins',
        'small',

        // Lists
        'ul',
        'ol',
        'li',
        'dl',
        'dt',
        'dd',

        // Links and media
        'a',
        'img',

        // Code and quotes
        'code',
        'pre',
        'blockquote',
        'cite',

        // Tables
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',

        // Misc
        'hr',
      ],
      ALLOWED_ATTR: {
        // Global attributes
        '*': ['class', 'id'],

        // Links
        a: ['href', 'target', 'rel', 'title'],

        // Images
        img: ['src', 'alt', 'width', 'height', 'title'],

        // Tables
        td: ['colspan', 'rowspan'],
        th: ['colspan', 'rowspan', 'scope'],

        // Code blocks
        pre: ['class'], // For syntax highlighting
        code: ['class'],
      },
      ALLOWED_URI_REGEXP: /^https?:|^\/|^#|^mailto:/i,
    })
  }

  return VStack({
    children: [
      // Title
      Text(post.title)
        .fontSize(32)
        .fontWeight('700')
        .lineHeight(1.2)
        .marginBottom(16)
        ,

      // Tags
      Text(`Tagged: ${post.tags.join(', ')}`)
        .fontSize(14)
        .opacity(0.7)
        .marginBottom(24)
        ,

      // Content with rich HTML support
      Text(post.content)
        .asHTML({
          customSanitizer: sanitizeBlogContent,
        })
        .fontSize(16)
        .lineHeight(1.6)
        ,
    ],
  })
    .maxWidth(800)
    .padding(32)
    .backgroundColor('#FFFFFF')
    .cornerRadius(12)
    .shadow({ x: 0, y: 2, blur: 16, color: 'rgba(0,0,0,0.08)' })
    
}
```

## Advanced Examples

### Email Template Preview

```typescript
const EmailTemplatePreview = (
  templateHtml: string,
  variables: Record<string, string> = {}
) => {
  // Process email template with variable substitution
  const processEmailTemplate = (html: string) => {
    let processed = html

    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      processed = processed.replace(regex, value)
    })

    // Remove remaining template syntax
    processed = processed.replace(/\{\{.*?\}\}/g, '[VARIABLE]')

    // Clean server-side tags
    processed = processed.replace(/<\?.*?\?>/g, '')
    processed = processed.replace(/<%.*?%>/g, '')

    return processed
  }

  return Text(templateHtml)
    .asHTML({
      customSanitizer: processEmailTemplate,
      allowedTags: [
        // Email HTML structure
        'html',
        'head',
        'body',
        'meta',
        'title',
        'style',

        // Email layout (tables)
        'table',
        'tr',
        'td',
        'th',
        'thead',
        'tbody',

        // Content
        'div',
        'span',
        'p',
        'br',
        'a',
        'img',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'strong',
        'em',
        'b',
        'i',
        'u',
        'ul',
        'ol',
        'li',
        'hr',
      ],
      allowedAttributes: {
        // Email needs inline styles and specific attributes
        '*': ['class', 'id', 'style'],
        table: [
          'width',
          'height',
          'border',
          'cellspacing',
          'cellpadding',
          'align',
        ],
        td: [
          'width',
          'height',
          'align',
          'valign',
          'colspan',
          'rowspan',
          'bgcolor',
        ],
        th: ['width', 'height', 'align', 'valign', 'colspan', 'rowspan'],
        a: ['href', 'target', 'rel', 'title'],
        img: ['src', 'alt', 'width', 'height', 'border', 'align'],
        meta: ['charset', 'name', 'content', 'http-equiv'],
      },
    })
    .fontFamily('system-ui, -apple-system, "Segoe UI", sans-serif')
    .fontSize(14)
    .lineHeight(1.4)
    .padding(20)
    .backgroundColor('#F5F5F5')
    
}

// Usage
const emailContent = `
  <table width="600" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding: 20px; background-color: #ffffff;">
        <h1>Hello {{firstName}}!</h1>
        <p>Thank you for signing up for our newsletter.</p>
        <p>Your subscription is now active.</p>
        <a href="{{unsubscribeUrl}}" style="color: #666;">Unsubscribe</a>
      </td>
    </tr>
  </table>
`

const previewComponent = EmailTemplatePreview(emailContent, {
  firstName: 'John',
  unsubscribeUrl: 'https://example.com/unsubscribe',
})
```

### Markdown-to-HTML Rendering

```typescript
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const MarkdownRenderer = (markdown: string) => {
  // Convert markdown to HTML
  const htmlContent = marked(markdown)

  // Sanitize the generated HTML
  const sanitizeMarkdown = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'strong',
        'em',
        'code',
        'pre',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',
        'del',
        'hr',
      ],
      ALLOWED_ATTR: {
        a: ['href', 'title'],
        img: ['src', 'alt', 'title'],
        pre: ['class'], // For code language
        code: ['class'],
        th: ['align'],
        td: ['align'],
      },
      ALLOWED_URI_REGEXP: /^https?:|^\/|^#/i,
    })
  }

  return Text(htmlContent)
    .asHTML({
      customSanitizer: sanitizeMarkdown,
    })
    .fontSize(16)
    .lineHeight(1.6)
    
}

// Usage example
const DocumentationPage = (markdownContent: string) => {
  return VStack({
    children: [MarkdownRenderer(markdownContent)],
  })
    .maxWidth(800)
    .padding(24)
    
}
```

### Rich Text Editor Output

```typescript
interface RichTextContent {
  html: string
  plainText: string
  wordCount: number
}

const RichTextDisplay = (content: RichTextContent) => {
  // Sanitization for rich text editor output (trusted but validate)
  const sanitizeEditorContent = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'div',
        'span',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'strong',
        'em',
        'b',
        'i',
        'u',
        's',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'img',
        'hr',
      ],
      ALLOWED_ATTR: {
        '*': ['class', 'style'], // Rich text editors use classes and inline styles
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height', 'style'],
        span: ['style'], // For text colors, fonts, etc.
        div: ['style'],
        p: ['style'],
      },
      ALLOWED_URI_REGEXP: /^https?:|^\/|^#|^mailto:/i,
      // Allow some safe inline styles
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onfocus', 'onmouseover'],
    })
  }

  return VStack({
    children: [
      // Content
      Text(content.html)
        .asHTML({
          customSanitizer: sanitizeEditorContent,
        })
        .fontSize(16)
        .lineHeight(1.6)
        ,

      // Meta information
      Text(`${content.wordCount} words`)
        .fontSize(12)
        .opacity(0.6)
        .marginTop(16)
        .textAlign('right')
        ,
    ],
  })
    .padding(20)
    .backgroundColor('#FFFFFF')
    .border(1, '#E5E5E7')
    .cornerRadius(8)
    
}
```

## Performance Optimization Examples

### Large Content with Virtualization

```typescript
import { createSignal, createMemo } from '@tachui/core'

const LargeHTMLContentViewer = (htmlContent: string) => {
  const [isExpanded, setIsExpanded] = createSignal(false)

  // Memoize expensive sanitization
  const sanitizedContent = createMemo(() => {
    const truncated = isExpanded()
      ? htmlContent
      : htmlContent.substring(0, 1000) + '...'

    return DOMPurify.sanitize(truncated, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'li'],
      ALLOWED_ATTR: { a: ['href'] },
    })
  })

  return VStack({
    children: [
      Text(sanitizedContent())
        .asHTML({
          skipSanitizer: true, // Already sanitized in memo
          validateDOM: false, // Skip DOM validation for performance
        })
        .fontSize(16)
        .lineHeight(1.6)
        ,

      !isExpanded()
        ? Text('Show More')
            .foregroundColor('#007AFF')
            .onTap(() => setIsExpanded(true))
            .padding(8)
            
        : null,
    ],
  })
}
```

### Cached Sanitization

```typescript
const sanitizationCache = new Map<string, string>()

const CachedHTMLRenderer = (content: string, cacheKey?: string) => {
  const key = cacheKey || content

  let sanitizedContent: string
  if (sanitizationCache.has(key)) {
    sanitizedContent = sanitizationCache.get(key)!
  } else {
    sanitizedContent = DOMPurify.sanitize(content)
    sanitizationCache.set(key, sanitizedContent)
  }

  return Text(sanitizedContent)
    .asHTML({
      skipSanitizer: true, // Already sanitized and cached
      validateDOM: false,
    })
    
}
```

## Testing Examples

### Security Testing Component

```typescript
const SecurityTestComponent = () => {
  const testVectors = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    '<a href="javascript:alert(1)">Click</a>',
    '<div onclick="alert(1)">Click</div>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<object data="javascript:alert(1)"></object>',
    '<style>body{background:url("javascript:alert(1)")}</style>',
  ]

  return VStack({
    children: [
      Text('Security Test Results')
        .fontSize(18)
        .fontWeight('600')
        .marginBottom(16)
        ,

      ...testVectors.map((vector, index) =>
        VStack({
          children: [
            Text(`Test ${index + 1}: ${vector.substring(0, 50)}...`)
              .fontSize(12)
              .fontFamily('monospace')
              .backgroundColor('#F8F9FA')
              .padding(8)
              ,

            Text(vector)
              .asHTML()
              .fontSize(14)
              .padding(8)
              .border(1, '#E5E5E7')
              .marginBottom(12)
              ,
          ],
        })
      ),
    ],
  })
    .padding(20)
    
}
```

## Real-World Integration

### CMS Content Renderer

```typescript
interface CMSContent {
  id: string
  type: 'article' | 'page' | 'snippet'
  content: string
  metadata: {
    author: string
    publishedAt: string
    updatedAt: string
  }
}

const CMSContentRenderer = (content: CMSContent) => {
  // Different sanitization rules based on content type
  const getSanitizationRules = (type: CMSContent['type']) => {
    switch (type) {
      case 'article':
        return {
          ALLOWED_TAGS: [
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'p',
            'br',
            'strong',
            'em',
            'u',
            'i',
            'ul',
            'ol',
            'li',
            'blockquote',
            'a',
            'img',
            'table',
            'thead',
            'tbody',
            'tr',
            'td',
            'th',
          ],
          ALLOWED_ATTR: {
            '*': ['class'],
            a: ['href', 'target', 'rel'],
            img: ['src', 'alt', 'width', 'height'],
          },
        }

      case 'page':
        return {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
          ALLOWED_ATTR: { a: ['href'] },
        }

      case 'snippet':
        return {
          ALLOWED_TAGS: ['strong', 'em'],
          ALLOWED_ATTR: {},
        }

      default:
        return { ALLOWED_TAGS: [], ALLOWED_ATTR: {} }
    }
  }

  const rules = getSanitizationRules(content.type)

  return Text(content.content)
    .asHTML({
      customSanitizer: html => DOMPurify.sanitize(html, rules),
    })
    .fontSize(content.type === 'article' ? 16 : 14)
    .lineHeight(1.6)
    
}
```

These examples demonstrate the flexibility and security features of the `.asHTML()` modifier across various real-world scenarios. Always remember to:

1. **Match sanitization to your content source** - user content needs stricter rules than editorial content
2. **Use comprehensive libraries like DOMPurify** for production applications
3. **Test your security measures** regularly with known XSS vectors
4. **Consider performance implications** for large content
5. **Follow the principle of least privilege** when configuring allowed tags and attributes

For more information, see the [HTML Content Security Guide](../guide/html-content-security.md).
