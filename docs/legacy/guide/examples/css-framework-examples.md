# CSS Framework Integration Examples

Practical examples demonstrating how to integrate TachUI with popular CSS frameworks. These examples show real-world patterns for building modern web interfaces.

## Tailwind CSS Examples

### Complete Dashboard Layout

```typescript
import { VStack, HStack, Text, Button, Image, createSignal } from '@tachui/core'

const TailwindDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = createSignal(false)

  return VStack({
    css: "min-h-screen bg-gray-100 flex",
    children: [
      // Sidebar
      VStack({
        css: () => [
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out",
          sidebarOpen() ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:inset-0"
        ],
        children: [
          // Logo
          HStack({
            css: "flex items-center px-6 py-4 bg-indigo-600",
            children: [
              Text("Dashboard", { css: "text-xl font-bold text-white" })
            ]
          }),
          
          // Navigation
          VStack({
            css: "flex-1 px-4 py-6 space-y-2",
            children: [
              NavItem("Dashboard", "home", true),
              NavItem("Analytics", "chart-bar", false),
              NavItem("Users", "users", false),
              NavItem("Settings", "cog", false)
            ]
          })
        ]
      }),

      // Main content
      VStack({
        css: "flex-1 md:ml-64",
        children: [
          // Header
          HStack({
            css: "bg-white shadow-sm px-6 py-4 flex items-center justify-between",
            children: [
              Button("Toggle Sidebar", () => setSidebarOpen(!sidebarOpen()), {
                css: "md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              }),
              
              Text("Welcome back, John!", { 
                css: "text-xl font-semibold text-gray-900" 
              }),
              
              HStack({
                css: "flex items-center space-x-4",
                children: [
                  Button("Notifications", () => {}, {
                    css: "p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  }),
                  Image({
                    src: "avatar.jpg",
                    css: "h-8 w-8 rounded-full"
                  })
                ]
              })
            ]
          }),

          // Dashboard content
          VStack({
            css: "flex-1 p-6",
            children: [
              // Stats cards
              HStack({
                css: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
                children: [
                  StatsCard("Total Users", "12,345", "+12%", "text-green-600"),
                  StatsCard("Revenue", "$54,321", "+8%", "text-green-600"),
                  StatsCard("Orders", "1,234", "-3%", "text-red-600"),
                  StatsCard("Conversion", "3.2%", "+15%", "text-green-600")
                ]
              }),

              // Charts and tables
              HStack({
                css: "grid grid-cols-1 lg:grid-cols-2 gap-6",
                children: [
                  ChartCard("Sales Overview"),
                  RecentActivityCard()
                ]
              })
            ]
          })
        ]
      })
    ]
  })
}

const NavItem = (title: string, icon: string, active: boolean) =>
  HStack({
    css: [
      "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
      active 
        ? "bg-indigo-100 text-indigo-700 border-r-2 border-indigo-700"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    ],
    children: [
      Text(title)
    ]
  })

const StatsCard = (title: string, value: string, change: string, changeColor: string) =>
  VStack({
    css: "bg-white rounded-lg shadow p-6",
    children: [
      Text(title, { css: "text-sm font-medium text-gray-500" }),
      Text(value, { css: "mt-2 text-3xl font-bold text-gray-900" }),
      Text(change, { css: `mt-2 text-sm font-medium ${changeColor}` })
    ]
  })

const ChartCard = (title: string) =>
  VStack({
    css: "bg-white rounded-lg shadow p-6",
    children: [
      Text(title, { css: "text-lg font-semibold text-gray-900 mb-4" }),
      VStack({
        css: "h-64 bg-gray-50 rounded-lg flex items-center justify-center",
        children: [
          Text("Chart placeholder", { css: "text-gray-500" })
        ]
      })
    ]
  })
```

### Responsive E-commerce Product Card

```typescript
const TailwindProductCard = ({ product }: { product: Product }) => {
  const [isFavorite, setFavorite] = createSignal(false)
  const [isInCart, setInCart] = createSignal(false)

  return VStack({
    css: "group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden",
    children: [
      // Product image
      VStack({
        css: "relative aspect-square overflow-hidden bg-gray-200",
        children: [
          Image({
            src: product.image,
            css: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          }),
          
          // Favorite button
          Button("❤️", () => setFavorite(!isFavorite()), {
            css: () => [
              "absolute top-3 right-3 p-2 rounded-full transition-colors",
              isFavorite() 
                ? "bg-red-500 text-white" 
                : "bg-white text-gray-400 hover:text-red-500"
            ]
          }),

          // Sale badge
          product.onSale && VStack({
            css: "absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded",
            children: [Text("SALE")]
          })
        ]
      }),

      // Product info
      VStack({
        css: "p-4 flex-1",
        children: [
          Text(product.name, { 
            css: "text-lg font-semibold text-gray-900 mb-2 line-clamp-2" 
          }),
          
          Text(product.description, { 
            css: "text-sm text-gray-600 mb-3 line-clamp-3" 
          }),

          // Price and rating
          HStack({
            css: "flex items-center justify-between mb-4",
            children: [
              VStack({
                css: "flex items-baseline space-x-2",
                children: [
                  Text(`$${product.price}`, { 
                    css: "text-xl font-bold text-gray-900" 
                  }),
                  product.originalPrice && Text(`$${product.originalPrice}`, { 
                    css: "text-sm text-gray-500 line-through" 
                  })
                ]
              }),
              
              HStack({
                css: "flex items-center",
                children: [
                  Text("⭐", { css: "text-yellow-400" }),
                  Text(`${product.rating}`, { css: "text-sm text-gray-600 ml-1" })
                ]
              })
            ]
          }),

          // Add to cart button
          Button(
            isInCart() ? "Added!" : "Add to Cart", 
            () => {
              setInCart(true)
              setTimeout(() => setInCart(false), 2000)
            }, 
            {
              css: () => [
                "w-full py-2 px-4 rounded-md font-medium transition-all duration-200",
                isInCart() 
                  ? "bg-green-500 text-white" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
              ]
            }
          )
        ]
      })
    ]
  })
}
```

## Bootstrap Examples

### Complete Contact Form

```typescript
const BootstrapContactForm = () => {
  const [formData, setFormData] = createSignal({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    newsletter: false
  })

  const [isSubmitting, setSubmitting] = createSignal(false)
  const [isSubmitted, setSubmitted] = createSignal(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setSubmitting(false)
    setSubmitted(true)
  }

  if (isSubmitted()) {
    return VStack({
      css: "container py-5",
      children: [
        VStack({
          css: "alert alert-success text-center",
          children: [
            Text("✅ Thank you!", { css: "h4 mb-2" }),
            Text("Your message has been sent successfully. We'll get back to you soon!", {
              css: "mb-0"
            })
          ]
        })
      ]
    })
  }

  return Form({
    css: "container py-5",
    children: [
      // Header
      VStack({
        css: "text-center mb-5",
        children: [
          Text("Contact Us", { css: "display-4 fw-bold mb-3" }),
          Text("We'd love to hear from you. Send us a message and we'll respond as soon as possible.", {
            css: "lead text-muted"
          })
        ]
      }),

      VStack({
        css: "row justify-content-center",
        children: [
          VStack({
            css: "col-lg-8 col-md-10",
            children: [
              VStack({
                css: "card shadow-sm",
                children: [
                  VStack({
                    css: "card-body p-4",
                    children: [
                      // Name fields
                      HStack({
                        css: "row g-3 mb-3",
                        children: [
                          VStack({
                            css: "col-md-6",
                            children: [
                              Text("First Name", { css: "form-label" }),
                              TextField({
                                placeholder: "John",
                                css: "form-control form-control-lg",
                                onChange: (value) => setFormData(prev => ({ ...prev, firstName: value }))
                              })
                            ]
                          }),
                          VStack({
                            css: "col-md-6",
                            children: [
                              Text("Last Name", { css: "form-label" }),
                              TextField({
                                placeholder: "Doe",
                                css: "form-control form-control-lg",
                                onChange: (value) => setFormData(prev => ({ ...prev, lastName: value }))
                              })
                            ]
                          })
                        ]
                      }),

                      // Contact fields  
                      HStack({
                        css: "row g-3 mb-3",
                        children: [
                          VStack({
                            css: "col-md-6",
                            children: [
                              Text("Email Address", { css: "form-label" }),
                              TextField({
                                type: "email",
                                placeholder: "john@example.com", 
                                css: "form-control form-control-lg",
                                onChange: (value) => setFormData(prev => ({ ...prev, email: value }))
                              })
                            ]
                          }),
                          VStack({
                            css: "col-md-6",
                            children: [
                              Text("Phone Number", { css: "form-label" }),
                              TextField({
                                type: "tel",
                                placeholder: "(555) 123-4567",
                                css: "form-control form-control-lg",
                                onChange: (value) => setFormData(prev => ({ ...prev, phone: value }))
                              })
                            ]
                          })
                        ]
                      }),

                      // Message field
                      VStack({
                        css: "mb-3",
                        children: [
                          Text("Message", { css: "form-label" }),
                          TextField({
                            multiline: true,
                            rows: 5,
                            placeholder: "Tell us about your project...",
                            css: "form-control",
                            onChange: (value) => setFormData(prev => ({ ...prev, message: value }))
                          })
                        ]
                      }),

                      // Newsletter checkbox
                      VStack({
                        css: "form-check mb-4",
                        children: [
                          Toggle({
                            isOn: () => formData().newsletter,
                            onToggle: (checked) => setFormData(prev => ({ ...prev, newsletter: checked })),
                            css: "form-check-input"
                          }),
                          Text("Subscribe to our newsletter for updates", { 
                            css: "form-check-label ms-2" 
                          })
                        ]
                      }),

                      // Submit button
                      VStack({
                        css: "d-grid gap-2",
                        children: [
                          Button(
                            isSubmitting() ? "Sending..." : "Send Message",
                            handleSubmit,
                            {
                              css: () => [
                                "btn btn-primary btn-lg",
                                isSubmitting() ? "disabled" : ""
                              ]
                            }
                          )
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  })
}
```

### Bootstrap Modal with TachUI

```typescript
const BootstrapModal = () => {
  const [showModal, setShowModal] = createSignal(false)

  return VStack({
    children: [
      // Trigger button
      Button("Open Modal", () => setShowModal(true), {
        css: "btn btn-primary btn-lg"
      }),

      // Modal
      Show({
        when: showModal,
        children: [
          VStack({
            css: () => [
              "modal fade show d-block",
              showModal() ? "show" : ""
            ],
            children: [
              VStack({
                css: "modal-dialog modal-dialog-centered modal-lg",
                children: [
                  VStack({
                    css: "modal-content",
                    children: [
                      // Header
                      HStack({
                        css: "modal-header",
                        children: [
                          Text("Confirmation", { css: "modal-title h4" }),
                          Button("×", () => setShowModal(false), {
                            css: "btn-close"
                          })
                        ]
                      }),

                      // Body
                      VStack({
                        css: "modal-body",
                        children: [
                          Text("Are you sure you want to continue with this action?", {
                            css: "mb-3"
                          }),
                          Text("This action cannot be undone and will permanently affect your data.", {
                            css: "text-muted small"
                          })
                        ]
                      }),

                      // Footer
                      HStack({
                        css: "modal-footer",
                        children: [
                          Button("Cancel", () => setShowModal(false), {
                            css: "btn btn-secondary"
                          }),
                          Button("Confirm", () => {
                            console.log("Action confirmed")
                            setShowModal(false)
                          }, {
                            css: "btn btn-danger"
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),

              // Backdrop
              VStack({
                css: "modal-backdrop fade show",
                onclick: () => setShowModal(false)
              })
            ]
          })
        ]
      })
    ]
  })
}
```

## Custom Design System Examples

### Design Token Integration

```typescript
// CSS Custom Properties (design-tokens.css)
/*
:root {
  --ds-color-primary: #3B82F6;
  --ds-color-secondary: #64748B;
  --ds-color-success: #10B981;
  --ds-color-danger: #EF4444;
  --ds-color-warning: #F59E0B;
  
  --ds-space-xs: 0.25rem;
  --ds-space-sm: 0.5rem;
  --ds-space-md: 1rem;
  --ds-space-lg: 1.5rem;
  --ds-space-xl: 2rem;
  --ds-space-2xl: 3rem;
  
  --ds-font-size-xs: 0.75rem;
  --ds-font-size-sm: 0.875rem;
  --ds-font-size-base: 1rem;
  --ds-font-size-lg: 1.125rem;
  --ds-font-size-xl: 1.25rem;
  --ds-font-size-2xl: 1.5rem;
  --ds-font-size-3xl: 1.875rem;
  
  --ds-radius-sm: 0.25rem;
  --ds-radius-md: 0.375rem;
  --ds-radius-lg: 0.5rem;
  --ds-radius-xl: 0.75rem;
  
  --ds-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --ds-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --ds-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.ds-card {
  background: white;
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-lg);
  box-shadow: var(--ds-shadow-md);
  border: 1px solid #e5e7eb;
}

.ds-button {
  padding: var(--ds-space-sm) var(--ds-space-md);
  border-radius: var(--ds-radius-md);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--ds-font-size-sm);
}

.ds-button--primary {
  background: var(--ds-color-primary);
  color: white;
}

.ds-button--secondary {
  background: var(--ds-color-secondary);
  color: white;
}

.ds-text--heading-1 { font-size: var(--ds-font-size-3xl); font-weight: 700; }
.ds-text--heading-2 { font-size: var(--ds-font-size-2xl); font-weight: 600; }
.ds-text--heading-3 { font-size: var(--ds-font-size-xl); font-weight: 600; }
.ds-text--body { font-size: var(--ds-font-size-base); line-height: 1.5; }
.ds-text--small { font-size: var(--ds-font-size-sm); }
*/

// Component implementation
const DesignSystemCard = ({ title, content, actions }: DSCardProps) =>
  VStack({
    css: "ds-card",
    children: [
      title && Text(title, { 
        css: "ds-text--heading-3 ds-color-primary mb-md" 
      }),
      
      content && Text(content, { 
        css: "ds-text--body ds-color-secondary mb-lg" 
      }),
      
      actions && HStack({
        css: "ds-flex ds-gap-sm ds-justify-end",
        children: actions
      })
    ]
  })

const DSButton = ({ 
  variant = 'primary', 
  size = 'medium',
  children, 
  action,
  ...props 
}: DSButtonProps) =>
  Button(children, action, {
    css: `ds-button ds-button--${variant} ds-button--${size}`,
    ...props
  })

// Usage example
const ProfileCard = ({ user }: { user: User }) =>
  VStack({
    css: "ds-container",
    children: [
      DesignSystemCard({
        title: "User Profile",
        content: `Welcome back, ${user.name}!`,
        actions: [
          DSButton({
            variant: 'secondary',
            children: [Text("Edit Profile")],
            action: () => navigateToEdit()
          }),
          DSButton({
            variant: 'primary', 
            children: [Text("View Dashboard")],
            action: () => navigateToDashboard()
          })
        ]
      })
    ]
  })
```

### Component Library with Theme Support

```typescript
// Theme provider with CSS custom properties
const ThemeProvider = ({ children }: { children: ComponentInstance[] }) => {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')

  createEffect(() => {
    document.documentElement.setAttribute('data-theme', theme())
  })

  return VStack({
    css: () => `app-container theme-${theme()}`,
    children: [
      // Theme toggle
      HStack({
        css: "theme-controls ds-p-md ds-bg-surface ds-border-b",
        children: [
          Text("Theme:", { css: "ds-text--small ds-color-secondary" }),
          Button("Light", () => setTheme('light'), {
            css: () => [
              "ds-button ds-button--sm",
              theme() === 'light' ? "ds-button--primary" : "ds-button--outline"
            ]
          }),
          Button("Dark", () => setTheme('dark'), {
            css: () => [
              "ds-button ds-button--sm", 
              theme() === 'dark' ? "ds-button--primary" : "ds-button--outline"
            ]
          })
        ]
      }),

      // App content
      ...children
    ]
  })
}

// CSS for theme support
/*
[data-theme="light"] {
  --ds-bg-primary: #ffffff;
  --ds-bg-secondary: #f8fafc;
  --ds-text-primary: #1e293b;
  --ds-text-secondary: #64748b;
  --ds-border-color: #e2e8f0;
}

[data-theme="dark"] {
  --ds-bg-primary: #0f172a;
  --ds-bg-secondary: #1e293b;
  --ds-text-primary: #f1f5f9;
  --ds-text-secondary: #94a3b8;
  --ds-border-color: #334155;
}

.ds-bg-surface { background: var(--ds-bg-primary); }
.ds-color-primary { color: var(--ds-text-primary); }
.ds-color-secondary { color: var(--ds-text-secondary); }
.ds-border { border-color: var(--ds-border-color); }
*/
```

## Performance Best Practices

### CSS Class Caching

```typescript
// ✅ Good: Cache repeated class combinations
const cardClasses = "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
const buttonClasses = "px-4 py-2 rounded-md font-medium transition-colors"

// Reuse cached classes
VStack({ css: cardClasses })
Button("Action", handleClick, { css: `${buttonClasses} bg-blue-500 text-white` })

// ✅ Good: Use computed for complex reactive classes
const dynamicCardClasses = createComputed(() => [
  cardClasses,
  isSelected() ? 'ring-2 ring-blue-500' : '',
  isDisabled() ? 'opacity-50 cursor-not-allowed' : ''
].filter(Boolean).join(' '))

VStack({ css: dynamicCardClasses })
```

### Bundle Optimization

```typescript
// ✅ Good: Conditional CSS loading
const loadTailwindCSS = async () => {
  if (useTailwind()) {
    await import('tailwindcss/tailwind.css')
  }
}

// ✅ Good: Framework detection
const detectCSSFramework = () => {
  if (document.querySelector('[class*="btn"]')) return 'bootstrap'
  if (document.querySelector('[class*="bg-"]')) return 'tailwind'
  return 'custom'
}
```

## Related Documentation

- **[CSS Classes API Reference](/api/css-classes)** - Complete API documentation
- **[CSS Framework Integration Guide](/guide/css-framework-integration)** - Setup and configuration
- **[Modifiers API](/api/modifiers)** - TachUI's built-in styling system
- **[Component Reference](/components/)** - All components support CSS classes