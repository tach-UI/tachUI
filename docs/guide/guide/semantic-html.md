# Semantic HTML with tachUI

**Generate semantic, SEO-friendly HTML with SwiftUI-style components**

tachUI's Element Override system enables you to create semantic HTML5 document structures while maintaining the full SwiftUI component development experience. This guide covers best practices for building accessible, SEO-optimized applications.

## Why Semantic HTML Matters

### SEO Benefits
- **Better Search Rankings** - Search engines understand content hierarchy
- **Rich Snippets** - Proper markup enables enhanced search results
- **Content Structure** - Clear document outline improves indexing

### Accessibility Benefits  
- **Screen Reader Navigation** - Semantic elements provide navigation landmarks
- **Keyboard Navigation** - Proper focus management with semantic structure
- **Assistive Technology** - Better understanding of content relationships

### Standards Compliance
- **HTML5 Semantic Elements** - Modern web standards compliance
- **ARIA Integration** - Automatic role application for semantic elements
- **Future-Proof** - Aligned with web platform evolution

## Document Structure Patterns

### Basic Page Layout

```typescript
const HomePage = () =>
  VStack({
    element: "main",
    children: [
      // Page header with site title
      HStack({
        element: "header",
        children: [
          Text("My Website", { element: "h1" }),
          
          HStack({
            element: "nav",
            children: [
              Text("Home"),
              Text("About"),
              Text("Services"), 
              Text("Contact")
            ],
            spacing: 24
          })
        ],
        spacing: 40
      }),
      
      // Main content area
      VStack({
        element: "section",
        children: [
          Text("Welcome", { element: "h2" }),
          Text("Welcome to our website. We provide excellent services...")
        ],
        spacing: 16
      }),
      
      // Additional content section
      VStack({
        element: "section", 
        children: [
          Text("Our Services", { element: "h2" }),
          Text("We offer a wide range of professional services...")
        ],
        spacing: 16
      }),
      
      // Page footer
      HStack({
        element: "footer",
        children: [
          Text("© 2025 My Website"),
          Text("Privacy Policy"),
          Text("Terms of Service")
        ],
        spacing: 20
      })
    ],
    spacing: 32
  })
```

**Generated HTML:**
```html
<main role="main">
  <header>
    <h1>My Website</h1>
    <nav role="navigation">
      <span>Home</span>
      <span>About</span>
      <span>Services</span>
      <span>Contact</span>
    </nav>
  </header>
  
  <section role="region">
    <h2>Welcome</h2>
    <span>Welcome to our website...</span>
  </section>
  
  <section role="region">
    <h2>Our Services</h2>
    <span>We offer a wide range...</span>
  </section>
  
  <footer>
    <span>© 2025 My Website</span>
    <span>Privacy Policy</span>
    <span>Terms of Service</span>
  </footer>
</main>
```

### Blog Article Structure

```typescript
const BlogPost = () =>
  VStack({
    element: "main",
    children: [
      // Article content
      VStack({
        element: "article",
        children: [
          // Article header
          VStack({
            element: "header",
            children: [
              Text("How to Build Better Web Apps", { element: "h1" }),
              Text("Published on March 15, 2025"),
              Text("By John Developer")
            ],
            spacing: 8
          }),
          
          // Article sections
          VStack({
            element: "section",
            children: [
              Text("Introduction", { element: "h2" }),
              Text("Building modern web applications requires...")
            ],
            spacing: 12
          }),
          
          VStack({
            element: "section",
            children: [
              Text("Best Practices", { element: "h2" }),
              Text("Here are the key principles to follow...")
            ],
            spacing: 12
          }),
          
          VStack({
            element: "section", 
            children: [
              Text("Conclusion", { element: "h2" }),
              Text("By following these guidelines...")
            ],
            spacing: 12
          }),
          
          // Article footer
          VStack({
            element: "footer",
            children: [
              Text("Tags: web development, best practices"),
              HStack({
                children: [
                  Text("Share:"),
                  Text("Twitter"),
                  Text("LinkedIn"),
                  Text("Facebook")
                ],
                spacing: 12
              })
            ],
            spacing: 8
          })
        ],
        spacing: 24
      }),
      
      // Sidebar with related content
      VStack({
        element: "aside",
        children: [
          Text("Related Articles", { element: "h3" }),
          Text("• Getting Started with React"),
          Text("• CSS Grid Layout Guide"),
          Text("• JavaScript ES2025 Features")
        ],
        spacing: 12
      })
    ],
    spacing: 40
  })
```

## Navigation Patterns

### Primary Navigation

```typescript
const Navigation = () =>
  HStack({
    element: "nav",
    children: [
      Text("Products"),
      Text("Solutions"),
      Text("Resources"),
      Text("About"),
      Text("Contact")
    ],
    spacing: 32
  })
  .modifier
  .aria({ label: "Primary navigation" })
  .build()

// Renders: <nav role="navigation" aria-label="Primary navigation">
```

### Breadcrumb Navigation

```typescript
const Breadcrumbs = () =>
  HStack({
    element: "nav",
    children: [
      Text("Home"),
      Text(" > "),
      Text("Products"), 
      Text(" > "),
      Text("Laptops")
    ],
    spacing: 8
  })
  .modifier
  .aria({ label: "Breadcrumb navigation" })
  .build()
```

### Skip Links (Accessibility)

```typescript
const SkipLinks = () =>
  HStack({
    element: "nav",
    children: [
      Text("Skip to main content"),
      Text("Skip to navigation"),
      Text("Skip to footer")
    ]
  })
  .modifier
  .aria({ label: "Skip links" })
  .build()
```

## Content Organization

### Heading Hierarchy

```typescript
// Proper heading structure for SEO and accessibility
VStack({
  children: [
    Text("Main Page Title", { element: "h1" }),      // Only one H1 per page
    Text("Major Section", { element: "h2" }),
    Text("Subsection A", { element: "h3" }),
    Text("Detail Point", { element: "h4" }),
    Text("Subsection B", { element: "h3" }),
    Text("Another Major Section", { element: "h2" })
  ]
})
```

### Content Sections

```typescript
const ContentAreas = () =>
  VStack({
    element: "main",
    children: [
      // Main content
      VStack({
        element: "section",
        children: [
          Text("Products", { element: "h2" }),
          Text("Our product lineup includes...")
        ]
      }),
      
      // Secondary content
      VStack({
        element: "section",
        children: [
          Text("Services", { element: "h2" }),
          Text("We provide comprehensive services...")
        ]
      }),
      
      // Sidebar content
      VStack({
        element: "aside",
        children: [
          Text("Quick Links", { element: "h3" }),
          Text("• Support Center"),
          Text("• Documentation"),
          Text("• Contact Us")
        ]
      })
    ]
  })
```

## E-commerce Patterns

### Product Listing

```typescript
const ProductGrid = () =>
  VStack({
    element: "section",
    children: [
      Text("Featured Products", { element: "h2" }),
      
      // Product grid using semantic markup
      HStack({
        children: products.map(product =>
          VStack({
            element: "article",
            children: [
              Image({ src: product.image, alt: product.name }),
              Text(product.name, { element: "h3" }),
              Text(`$${product.price}`),
              Button("Add to Cart")
            ]
          })
        ),
        spacing: 24
      })
    ]
  })
```

### Product Detail

```typescript
const ProductDetail = () =>
  VStack({
    element: "main",
    children: [
      VStack({
        element: "article",
        children: [
          // Product header
          VStack({
            element: "header",
            children: [
              Text(product.name, { element: "h1" }),
              Text(`$${product.price}`, { element: "span" })
            ]
          }),
          
          // Product description
          VStack({
            element: "section",
            children: [
              Text("Description", { element: "h2" }),
              Text(product.description)
            ]
          }),
          
          // Product specifications
          VStack({
            element: "section",
            children: [
              Text("Specifications", { element: "h2" }),
              Text("Dimensions: 12\" x 8\" x 2\""),
              Text("Weight: 2.5 lbs"),
              Text("Material: Aluminum")
            ]
          })
        ]
      })
    ]
  })
```

## Form Patterns

### Contact Form

```typescript
const ContactForm = () =>
  VStack({
    element: "section",
    children: [
      Text("Contact Us", { element: "h2" }),
      
      Form({
        element: "form", // Form already uses <form> by default
        children: [
          VStack({
            element: "fieldset",
            children: [
              Text("Personal Information", { element: "legend" }),
              TextField({ placeholder: "Name" }),
              TextField({ placeholder: "Email" })
            ]
          }),
          
          VStack({
            element: "fieldset", 
            children: [
              Text("Message", { element: "legend" }),
              TextArea({ placeholder: "Your message..." })
            ]
          }),
          
          Button("Send Message")
        ]
      })
    ]
  })
```

## Accessibility Best Practices

### ARIA Labels

```typescript
// Provide descriptive labels for screen readers
HStack({
  element: "nav",
  children: navigationItems
})
.modifier
.aria({ 
  label: "Primary site navigation",
  role: "navigation" // Overrides automatic role if needed
})
.build()
```

### Skip Navigation

```typescript
const SkipNavigation = () =>
  HStack({
    element: "nav",
    children: [
      Text("Skip to main content"),
      Text("Skip to navigation"),
      Text("Skip to footer")
    ]
  })
  .modifier
  .aria({ label: "Skip navigation links" })
  .css({ 
    position: "absolute",
    left: "-9999px", // Hidden by default
    "&:focus": { left: "0" } // Visible when focused
  })
  .build()
```

### Landmark Roles

```typescript
// Automatic landmark roles applied by element override
VStack({ element: "main" })     // role="main" 
HStack({ element: "nav" })      // role="navigation"
VStack({ element: "section" })  // role="region"
VStack({ element: "aside" })    // role="complementary"
VStack({ element: "article" })  // role="article"

// Context-sensitive elements (manual role recommended)
HStack({ 
  element: "header" // Could be page or section header
})
.modifier
.aria({ role: "banner" }) // Specify page banner
.build()
```

## SEO Optimization

### Structured Data

```typescript
// Use semantic elements for better search engine understanding
VStack({
  element: "article", // Search engines understand this is an article
  children: [
    Text("Blog Post Title", { element: "h1" }), // Main heading
    Text("Published: 2025-03-15"), // Publication date
    Text("Author: John Developer"), // Author information
    Text("Blog post content...") // Main content
  ]
})
```

### Content Hierarchy

```typescript
// Clear heading hierarchy improves SEO
VStack({
  children: [
    Text("Complete Guide to Web Development", { element: "h1" }),
    
    VStack({
      element: "section",
      children: [
        Text("Getting Started", { element: "h2" }),
        Text("Prerequisites", { element: "h3" }),
        Text("Installation", { element: "h3" })
      ]
    }),
    
    VStack({
      element: "section", 
      children: [
        Text("Advanced Topics", { element: "h2" }),
        Text("Performance", { element: "h3" }),
        Text("Security", { element: "h3" })
      ]
    })
  ]
})
```

## Configuration

### Global Settings

```typescript
import { configureElementOverrides } from '@tachui/core'

// Configure semantic HTML generation
configureElementOverrides({
  autoApplySemanticRoles: true,    // Automatic ARIA roles
  warnOnOverrides: true,           // Development warnings
  warnOnSemanticIssues: true,      // Accessibility warnings
  validateTags: true,              // HTML tag validation
  allowInvalidTags: false          // Reject invalid tags
})
```

## Migration Strategy

### Incremental Adoption

```typescript
// 1. Start with layout containers
HStack({ children: [...] })           // Before
HStack({ element: "nav", children: [...] }) // After

// 2. Add semantic sections  
VStack({ children: [...] })           // Before
VStack({ element: "main", children: [...] }) // After

// 3. Enhance content elements
Text("Title")                         // Before  
Text("Title", { element: "h1" })     // After
```

### Testing Approach

1. **HTML Validation** - Use W3C validator to verify markup
2. **Accessibility Testing** - Use screen readers and automated tools
3. **SEO Analysis** - Verify structured data and content hierarchy
4. **Performance Testing** - Ensure no regression in bundle size

## Common Patterns

### Documentation Site

```typescript
const DocPage = () =>
  VStack({
    element: "main",
    children: [
      // Documentation navigation
      HStack({
        element: "nav",
        children: docSections.map(section => 
          Text(section.title)
        )
      }),
      
      // Main documentation content
      VStack({
        element: "article",
        children: [
          Text("API Reference", { element: "h1" }),
          
          VStack({
            element: "section",
            children: [
              Text("Methods", { element: "h2" }),
              // Method documentation...
            ]
          }),
          
          VStack({
            element: "section",
            children: [
              Text("Examples", { element: "h2" }),
              // Code examples...
            ]
          })
        ]
      })
    ]
  })
```

### Dashboard Layout

```typescript
const Dashboard = () =>
  VStack({
    element: "main",
    children: [
      // Dashboard header
      HStack({
        element: "header", 
        children: [
          Text("Dashboard", { element: "h1" }),
          Text("Welcome back, John!")
        ]
      }),
      
      // Main dashboard content
      HStack({
        children: [
          // Primary content
          VStack({
            element: "section",
            children: [
              Text("Analytics", { element: "h2" }),
              // Charts and metrics...
            ]
          }),
          
          // Sidebar
          VStack({
            element: "aside",
            children: [
              Text("Quick Actions", { element: "h3" }),
              Button("Create Project"),
              Button("View Reports")
            ]
          })
        ]
      })
    ]
  })
```

The Element Override system makes it effortless to create semantic, accessible HTML while maintaining the SwiftUI development experience you love. Start with basic layout elements and gradually enhance your application's semantic structure for better SEO and accessibility.