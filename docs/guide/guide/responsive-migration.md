# Migration Guide: From External CSS to TachUI Responsive

This guide helps you migrate existing responsive designs to TachUI's responsive system from popular CSS frameworks and approaches.

## Overview

TachUI's responsive system provides TypeScript-safe, performant alternatives to common CSS responsive patterns. This guide covers migration strategies for:

- **Raw CSS Media Queries**
- **Tailwind CSS**
- **Bootstrap**
- **CSS-in-JS Solutions** (styled-components, emotion)
- **Styled System / Theme UI**
- **Material-UI (MUI)**

## Migration from Raw CSS Media Queries

### Before: Raw CSS

```css
/* styles.css */
.hero-title {
  font-size: 24px;
  text-align: center;
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 32px;
    text-align: left;
    margin-bottom: 24px;
  }
}

@media (min-width: 1024px) {
  .hero-title {
    font-size: 40px;
    margin-bottom: 32px;
  }
}

@media (prefers-color-scheme: dark) {
  .hero-title {
    color: #ffffff;
  }
}
```

### After: TachUI Responsive

```typescript
import { Text } from '@tachui/core'

const HeroTitle = ({ children }: { children: string }) => {
  return Text(children)
    .modifier
    .responsive({
      base: { 
        fontSize: 24, 
        textAlign: 'center',
        marginBottom: 16
      },
      md: { 
        fontSize: 32, 
        textAlign: 'left',
        marginBottom: 24
      },
      lg: { 
        fontSize: 40,
        marginBottom: 32
      }
    })
    .mediaQuery('(prefers-color-scheme: dark)', { 
      color: '#ffffff' 
    })
    .build()
}
```

### Benefits of Migration

- ✅ **TypeScript Safety**: Catch responsive errors at compile time
- ✅ **Performance**: Optimized CSS generation with caching
- ✅ **Maintainability**: Component-scoped responsive logic
- ✅ **Developer Experience**: IntelliSense and auto-completion

## Migration from Tailwind CSS

### Before: Tailwind CSS

```html
<!-- Tailwind HTML -->
<div class="
  text-2xl md:text-4xl lg:text-5xl
  text-center md:text-left
  mb-4 md:mb-6 lg:mb-8
  text-gray-800 dark:text-white
  p-4 md:p-6 lg:p-8
  bg-gray-100 md:bg-white
  rounded-lg md:rounded-xl
">
  Hero Content
</div>
```

### After: TachUI Responsive

```typescript
import { VStack, Text } from '@tachui/core'

const HeroSection = () => {
  return VStack([
    Text("Hero Content")
      .modifier
      .responsive({
        base: { 
          fontSize: 24,        // text-2xl
          textAlign: 'center', // text-center
          marginBottom: 16,    // mb-4
          color: '#1f2937',    // text-gray-800
          padding: 16,         // p-4
          backgroundColor: '#f3f4f6', // bg-gray-100
          borderRadius: 8      // rounded-lg
        },
        md: { 
          fontSize: 36,        // md:text-4xl
          textAlign: 'left',   // md:text-left
          marginBottom: 24,    // md:mb-6
          padding: 24,         // md:p-6
          backgroundColor: '#ffffff', // md:bg-white
          borderRadius: 12     // md:rounded-xl
        },
        lg: { 
          fontSize: 48,        // lg:text-5xl
          marginBottom: 32,    // lg:mb-8
          padding: 32          // lg:p-8
        }
      })
      .mediaQuery('(prefers-color-scheme: dark)', { 
        color: '#ffffff'     // dark:text-white
      })
      .build()
  ])
  .build()
}
```

### Tailwind to TachUI Mapping

| Tailwind Class | TachUI Equivalent |
|---------------|-------------------|
| `sm:text-lg` | `.sm.fontSize(18)` |
| `md:p-6` | `.md.padding(24)` |
| `lg:w-1/2` | `.lg.width('50%')` |
| `xl:grid-cols-3` | `.xl.gridTemplateColumns('repeat(3, 1fr)')` |
| `dark:bg-gray-900` | `.mediaQuery('(prefers-color-scheme: dark)', { backgroundColor: '#111827' })` |

### Migration Script

Create a migration script to convert Tailwind classes:

```typescript
// tailwind-migration.ts
const tailwindToTachUI = {
  // Text sizes
  'text-sm': { fontSize: 14 },
  'text-base': { fontSize: 16 },
  'text-lg': { fontSize: 18 },
  'text-xl': { fontSize: 20 },
  'text-2xl': { fontSize: 24 },
  'text-3xl': { fontSize: 30 },
  'text-4xl': { fontSize: 36 },
  
  // Spacing
  'p-2': { padding: 8 },
  'p-4': { padding: 16 },
  'p-6': { padding: 24 },
  'p-8': { padding: 32 },
  
  'm-2': { margin: 8 },
  'm-4': { margin: 16 },
  'm-6': { margin: 24 },
  'm-8': { margin: 32 },
  
  // Colors
  'text-gray-800': { color: '#1f2937' },
  'text-white': { color: '#ffffff' },
  'bg-gray-100': { backgroundColor: '#f3f4f6' },
  'bg-white': { backgroundColor: '#ffffff' }
}

const convertTailwindClasses = (classes: string): ResponsiveStyleConfig => {
  const config: ResponsiveStyleConfig = {}
  const classArray = classes.split(' ')
  
  classArray.forEach(cls => {
    const [breakpoint, ...classnameParts] = cls.split(':')
    const className = classnameParts.length > 0 ? classnameParts.join(':') : breakpoint
    const bp = classnameParts.length > 0 ? breakpoint : 'base'
    
    if (tailwindToTachUI[className]) {
      if (!config[bp]) config[bp] = {}
      Object.assign(config[bp], tailwindToTachUI[className])
    }
  })
  
  return config
}

// Usage
const tailwindClasses = "text-2xl md:text-4xl p-4 md:p-6 text-gray-800"
const tachUIConfig = convertTailwindClasses(tailwindClasses)
console.log(tachUIConfig)
// Output: {
//   base: { fontSize: 24, padding: 16, color: '#1f2937' },
//   md: { fontSize: 36, padding: 24 }
// }
```

## Migration from Bootstrap

### Before: Bootstrap CSS

```html
<!-- Bootstrap HTML -->
<div class="container-fluid">
  <div class="row">
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Card Title</h5>
          <p class="card-text">Card content</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### After: TachUI Responsive

```typescript
import { 
  VStack, HStack, Text,
  ResponsiveGridPatterns, ResponsiveContainerPatterns 
} from '@tachui/core'

const BootstrapCard = () => {
  return ResponsiveContainerPatterns.contentContainer({
    maxWidth: { base: '100%' }, // container-fluid equivalent
    padding: { base: 15, md: 15 } // Bootstrap container padding
  }).apply(
    ResponsiveGridPatterns.columns({
      columns: {
        base: 1,  // col-12
        md: 2,    // col-md-6
        lg: 3     // col-lg-4 (3 columns = 12/4)
      },
      gap: { base: 15, md: 15 } // Bootstrap gutter
    }).apply(
      VStack([
        VStack([
          VStack([
            Text("Card Title")
              .modifier
              .fontSize(20)
              .fontWeight('500')
              .marginBottom(8)
              .build(),
            
            Text("Card content")
              .modifier
              .fontSize(16)
              .color('#6c757d')
              .build()
          ])
          .modifier
          .padding(20) // card-body padding
          .build()
        ])
        .modifier
        .backgroundColor('#ffffff')
        .border('1px solid rgba(0,0,0,.125)')
        .borderRadius(6) // Bootstrap card border-radius
        .build()
      ])
      .build()
    )
  )
}
```

### Bootstrap Grid to TachUI Grid

| Bootstrap Classes | TachUI Equivalent |
|------------------|-------------------|
| `col-12` | `{ base: 1 }` (1 column) |
| `col-md-6` | `{ md: 2 }` (2 columns) |
| `col-lg-4` | `{ lg: 3 }` (3 columns) |
| `col-xl-3` | `{ xl: 4 }` (4 columns) |

```typescript
// Bootstrap grid conversion helper
const convertBootstrapGrid = (classes: string[]) => {
  const columns: Partial<Record<BreakpointKey, number>> = {}
  
  classes.forEach(cls => {
    if (cls.startsWith('col-')) {
      const parts = cls.split('-')
      if (parts.length === 2) {
        // col-{number}
        const colCount = parseInt(parts[1])
        columns.base = 12 / colCount
      } else if (parts.length === 3) {
        // col-{breakpoint}-{number}
        const breakpoint = parts[1] as BreakpointKey
        const colCount = parseInt(parts[2])
        columns[breakpoint] = 12 / colCount
      }
    }
  })
  
  return columns
}

// Usage
const gridConfig = convertBootstrapGrid(['col-12', 'col-md-6', 'col-lg-4'])
// Result: { base: 1, md: 2, lg: 3 }
```

## Migration from CSS-in-JS (styled-components)

### Before: styled-components

```typescript
import styled from 'styled-components'

const StyledButton = styled.button`
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  background-color: #007bff;
  color: white;
  border: none;
  
  @media (min-width: 768px) {
    padding: 16px 32px;
    font-size: 18px;
  }
  
  @media (min-width: 1024px) {
    padding: 20px 40px;
    font-size: 20px;
  }
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`
```

### After: TachUI Responsive

```typescript
import { Button } from '@tachui/core'

const ResponsiveButton = ({ children, disabled, onClick }: ButtonProps) => {
  return Button(children)
    .modifier
    .responsive({
      base: { 
        padding: '12px 24px',
        fontSize: 16
      },
      md: { 
        padding: '16px 32px',
        fontSize: 18
      },
      lg: { 
        padding: '20px 40px',
        fontSize: 20
      }
    })
    .borderRadius(8)
    .backgroundColor('#007bff')
    .color('white')
    .border('none')
    .onHover({ backgroundColor: '#0056b3' })
    .onDisabled({ 
      opacity: 0.6, 
      cursor: 'not-allowed' 
    })
    .disabled(disabled)
    .onClick(onClick)
    .build()
}
```

### styled-components Migration Strategy

1. **Extract CSS properties**: Convert CSS rules to TachUI modifiers
2. **Convert media queries**: Transform to responsive objects
3. **Handle pseudo-states**: Use TachUI state modifiers
4. **Preserve component logic**: Maintain props and behavior

```typescript
// Migration helper for styled-components
const convertStyledComponent = (cssTemplate: string) => {
  const responsiveConfig: ResponsiveStyleConfig = {}
  
  // Parse CSS rules and media queries
  // This is a simplified example - you'd need a proper CSS parser
  const mediaQueryRegex = /@media \(min-width: (\d+)px\) \{([^}]+)\}/g
  const baseRulesRegex = /([a-z-]+):\s*([^;]+);/g
  
  // Extract base rules
  let match
  while ((match = baseRulesRegex.exec(cssTemplate)) !== null) {
    const property = match[1]
    const value = match[2]
    
    if (!responsiveConfig.base) responsiveConfig.base = {}
    responsiveConfig.base[property] = value
  }
  
  // Extract media query rules
  while ((match = mediaQueryRegex.exec(cssTemplate)) !== null) {
    const breakpointPx = parseInt(match[1])
    const rules = match[2]
    
    // Map pixel values to breakpoint names
    const breakpointMap = {
      768: 'md' as BreakpointKey,
      1024: 'lg' as BreakpointKey,
      1280: 'xl' as BreakpointKey
    }
    
    const breakpoint = breakpointMap[breakpointPx]
    if (breakpoint) {
      if (!responsiveConfig[breakpoint]) responsiveConfig[breakpoint] = {}
      
      const ruleMatches = rules.matchAll(/([a-z-]+):\s*([^;]+);/g)
      for (const ruleMatch of ruleMatches) {
        responsiveConfig[breakpoint][ruleMatch[1]] = ruleMatch[2]
      }
    }
  }
  
  return responsiveConfig
}
```

## Migration from Material-UI (MUI)

### Before: Material-UI

```typescript
import { makeStyles, useTheme, useMediaQuery } from '@mui/material'
import { Typography, Container, Box } from '@mui/material'

const useStyles = makeStyles((theme) => ({
  hero: {
    padding: theme.spacing(2),
    textAlign: 'center',
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(4),
      textAlign: 'left'
    },
    [theme.breakpoints.up('lg')]: {
      padding: theme.spacing(6)
    }
  },
  title: {
    fontSize: '1.5rem',
    [theme.breakpoints.up('md')]: {
      fontSize: '2rem'
    },
    [theme.breakpoints.up('lg')]: {
      fontSize: '2.5rem'
    }
  }
}))

const MUIComponent = () => {
  const classes = useStyles()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  return (
    <Container>
      <Box className={classes.hero}>
        <Typography variant="h2" className={classes.title}>
          {isMobile ? 'Mobile Title' : 'Desktop Title'}
        </Typography>
      </Box>
    </Container>
  )
}
```

### After: TachUI Responsive

```typescript
import { 
  VStack, Text, 
  ResponsiveContainerPatterns,
  useBreakpoint 
} from '@tachui/core'

const TachUIComponent = () => {
  const bp = useBreakpoint()
  const isMobile = bp.isBelow('md')()
  
  return ResponsiveContainerPatterns.contentContainer({
    maxWidth: { base: '100%', lg: '1200px' },
    padding: { base: 16, md: 24 }
  }).apply(
    VStack([
      Text(isMobile ? 'Mobile Title' : 'Desktop Title')
        .modifier
        .responsive({
          base: { 
            fontSize: 24,      // 1.5rem
            textAlign: 'center'
          },
          md: { 
            fontSize: 32,      // 2rem
            textAlign: 'left'
          },
          lg: { 
            fontSize: 40       // 2.5rem
          }
        })
        .build()
    ])
    .modifier
    .responsive({
      base: { 
        padding: 16,         // theme.spacing(2)
        textAlign: 'center'
      },
      md: { 
        padding: 32,         // theme.spacing(4)
        textAlign: 'left'
      },
      lg: { 
        padding: 48          // theme.spacing(6)
      }
    })
    .build()
  )
}
```

### MUI Theme to TachUI Configuration

```typescript
// Convert MUI theme to TachUI breakpoints
const convertMUITheme = (muiTheme: any) => {
  const muiBreakpoints = muiTheme.breakpoints.values
  
  return {
    sm: `${muiBreakpoints.sm}px`,
    md: `${muiBreakpoints.md}px`,
    lg: `${muiBreakpoints.lg}px`,
    xl: `${muiBreakpoints.xl}px`
  }
}

// Convert MUI spacing to TachUI values
const convertMUISpacing = (spacing: number, muiTheme: any) => {
  return muiTheme.spacing(spacing) // Usually spacing * 8
}
```

## Migration from Styled System / Theme UI

### Before: Styled System

```typescript
import { Box, Text } from 'theme-ui'

const StyledSystemComponent = () => {
  return (
    <Box
      sx={{
        padding: [2, 3, 4], // responsive padding
        fontSize: [2, 3, 4], // responsive font size
        color: ['text', 'text', 'primary'], // responsive colors
        bg: 'background',
        borderRadius: 2
      }}
    >
      <Text
        sx={{
          fontSize: [3, 4, 5],
          fontWeight: 'bold',
          textAlign: ['center', 'left']
        }}
      >
        Styled System Text
      </Text>
    </Box>
  )
}
```

### After: TachUI Responsive

```typescript
import { VStack, Text } from '@tachui/core'

const TachUIComponent = () => {
  return VStack([
    Text("TachUI Text")
      .modifier
      .responsive({
        base: { 
          fontSize: 20,      // theme.fontSizes[3]
          fontWeight: 'bold',
          textAlign: 'center'
        },
        md: { 
          fontSize: 24,      // theme.fontSizes[4]
          textAlign: 'left'
        },
        lg: { 
          fontSize: 28       // theme.fontSizes[5]
        }
      })
      .build()
  ])
  .modifier
  .responsive({
    base: { 
      padding: 16,         // theme.space[2]
      fontSize: 16,        // theme.fontSizes[2]
      color: '#000000'     // theme.colors.text
    },
    md: { 
      padding: 24,         // theme.space[3]
      fontSize: 18         // theme.fontSizes[3]
    },
    lg: { 
      padding: 32,         // theme.space[4]
      fontSize: 20,        // theme.fontSizes[4]
      color: '#007bff'     // theme.colors.primary
    }
  })
  .backgroundColor('#ffffff') // theme.colors.background
  .borderRadius(8)             // theme.radii[2]
  .build()
}
```

### Styled System Array Syntax Conversion

```typescript
// Convert Styled System array syntax to TachUI responsive objects
const convertStyledSystemArray = <T>(
  values: T[],
  breakpoints: BreakpointKey[] = ['base', 'md', 'lg']
): Partial<Record<BreakpointKey, T>> => {
  const result: Partial<Record<BreakpointKey, T>> = {}
  
  values.forEach((value, index) => {
    if (index < breakpoints.length && value !== null && value !== undefined) {
      result[breakpoints[index]] = value
    }
  })
  
  return result
}

// Usage
const responsivePadding = convertStyledSystemArray([16, 24, 32])
// Result: { base: 16, md: 24, lg: 32 }

const responsiveColors = convertStyledSystemArray(['#333', '#000', '#007bff'])
// Result: { base: '#333', md: '#000', lg: '#007bff' }
```

## Common Migration Patterns

### 1. Responsive Typography Scale

```typescript
// Before: CSS custom properties
// :root {
//   --font-size-base: 16px;
//   --font-size-lg: 18px;
//   --font-size-xl: 20px;
// }
// 
// @media (min-width: 768px) {
//   :root {
//     --font-size-base: 18px;
//     --font-size-lg: 20px;
//     --font-size-xl: 24px;
//   }
// }

// After: TachUI responsive typography
const typographyScale = {
  base: { small: 14, base: 16, large: 18, xl: 20 },
  md: { small: 16, base: 18, large: 20, xl: 24 },
  lg: { small: 18, base: 20, large: 24, xl: 28 }
}

const ResponsiveText = ({ size }: { size: keyof typeof typographyScale.base }) => {
  return Text("Responsive Typography")
    .modifier
    .responsive({
      base: { fontSize: typographyScale.base[size] },
      md: { fontSize: typographyScale.md[size] },
      lg: { fontSize: typographyScale.lg[size] }
    })
    .build()
}
```

### 2. Responsive Spacing System

```typescript
// Before: CSS spacing utilities
// .spacing-sm { margin: 8px; }
// .spacing-md { margin: 16px; }
// .spacing-lg { margin: 24px; }
// 
// @media (min-width: 768px) {
//   .spacing-sm { margin: 12px; }
//   .spacing-md { margin: 24px; }
//   .spacing-lg { margin: 36px; }
// }

// After: TachUI responsive spacing
const spacingScale = {
  base: { sm: 8, md: 16, lg: 24, xl: 32 },
  md: { sm: 12, md: 24, lg: 36, xl: 48 },
  lg: { sm: 16, md: 32, lg: 48, xl: 64 }
}

const ResponsiveSpacing = ({ size }: { size: keyof typeof spacingScale.base }) => {
  return VStack([])
    .modifier
    .responsive({
      base: { padding: spacingScale.base[size] },
      md: { padding: spacingScale.md[size] },
      lg: { padding: spacingScale.lg[size] }
    })
    .build()
}
```

### 3. Responsive Grid Layout

```typescript
// Before: CSS Grid
// .grid {
//   display: grid;
//   grid-template-columns: 1fr;
//   gap: 1rem;
// }
// 
// @media (min-width: 768px) {
//   .grid {
//     grid-template-columns: repeat(2, 1fr);
//     gap: 1.5rem;
//   }
// }
// 
// @media (min-width: 1024px) {
//   .grid {
//     grid-template-columns: repeat(3, 1fr);
//     gap: 2rem;
//   }
// }

// After: TachUI responsive grid
import { ResponsiveGridPatterns } from '@tachui/core'

const ResponsiveGrid = ({ children }: { children: any[] }) => {
  const gridModifier = ResponsiveGridPatterns.columns({
    columns: {
      base: 1,
      md: 2,
      lg: 3
    },
    gap: {
      base: '1rem',
      md: '1.5rem',
      lg: '2rem'
    }
  })

  return VStack(children)
    .modifier
    .apply(gridModifier)
    .build()
}
```

## Migration Checklist

### Pre-Migration Assessment

- [ ] **Audit current responsive patterns**: Identify breakpoints, media queries, and responsive behaviors
- [ ] **Document component inventory**: List all components that need responsive updates
- [ ] **Performance baseline**: Measure current CSS bundle size and performance
- [ ] **Browser support requirements**: Ensure TachUI meets your browser support needs

### Migration Process

- [ ] **Setup TachUI**: Install and configure TachUI responsive system
- [ ] **Configure breakpoints**: Match your current breakpoint system or standardize on TachUI defaults
- [ ] **Component-by-component migration**: Migrate one component at a time
- [ ] **Test responsive behavior**: Verify responsive behavior at each breakpoint
- [ ] **Performance validation**: Ensure performance improvements or parity

### Post-Migration Validation

- [ ] **Cross-browser testing**: Test responsive behavior across target browsers
- [ ] **Performance testing**: Measure CSS bundle size and runtime performance improvements
- [ ] **Accessibility testing**: Ensure responsive behavior maintains accessibility
- [ ] **Visual regression testing**: Compare visual output before and after migration

## Best Practices for Migration

### 1. Incremental Migration

Migrate components incrementally rather than all at once:

```typescript
// Start with leaf components
const MigratedButton = () => { /* TachUI implementation */ }

// Then container components
const MigratedCard = () => { 
  return VStack([
    MigratedButton(), // Uses migrated component
    LegacyText()      // Keep legacy until ready
  ]).build()
}
```

### 2. Maintain Visual Parity

Ensure migrated components look identical:

```typescript
// Use exact pixel values from original CSS
const MigratedComponent = () => {
  return Text("Migrated")
    .modifier
    .responsive({
      base: { fontSize: 16, padding: 12 }, // Exact original values
      md: { fontSize: 20, padding: 16 }
    })
    .build()
}
```

### 3. Performance Monitoring

Monitor performance throughout migration:

```typescript
// Before migration
const beforeSize = document.styleSheets.length
const beforeRules = Array.from(document.styleSheets)
  .reduce((total, sheet) => total + sheet.cssRules.length, 0)

// After migration
const afterSize = document.styleSheets.length
const afterRules = Array.from(document.styleSheets)
  .reduce((total, sheet) => total + sheet.cssRules.length, 0)

console.log('CSS Rules:', { before: beforeRules, after: afterRules })
```

### 4. Team Training

Provide team training on TachUI responsive patterns:

```typescript
// Create migration examples for your team
const MigrationExamples = {
  // Common patterns your team uses
  flexCenter: {
    before: "display: flex; align-items: center; justify-content: center;",
    after: ".alignItems('center').justifyContent('center')"
  },
  
  responsiveText: {
    before: "@media (min-width: 768px) { font-size: 20px; }",
    after: ".md.fontSize(20)"
  },
  
  mobileFirst: {
    before: "font-size: 16px; @media (min-width: 768px) { font-size: 20px; }",
    after: ".responsive({ base: { fontSize: 16 }, md: { fontSize: 20 } })"
  }
}
```

By following this migration guide, you can systematically transition from any CSS responsive approach to TachUI's type-safe, performant responsive system while maintaining visual consistency and improving developer experience.

## Related Guides

- [Responsive Design](./responsive-design.md) - Complete responsive design guide
- [Breakpoint System](./breakpoints.md) - Understanding TachUI breakpoints
- [Performance Optimization](./responsive-performance.md) - Optimize responsive performance
- [API Reference](../api/responsive-modifiers.md) - Complete API documentation