# Icon Bundle Optimization Guide

The TachUI Symbol system provides several approaches to minimize icon bundle sizes:

## 📊 Bundle Size Comparison

| Approach | Bundle Size | Icons Available | Setup Complexity |
|----------|-------------|-----------------|------------------|
| **Full Lucide** | 620KB + 194KB | 1000+ | Low |
| **Custom Icon Set** | 5KB + 194KB | App-specific | Medium |
| **Selective Loading** | 10-50KB + 194KB | Lucide subset | Low |
| **Build-time Extraction** | Variable | Auto-detected | High |

## 🎯 Approach 1: Custom Icon Set (Recommended for Small Apps)

Best for: Landing pages, marketing sites, simple apps with <20 icons

```typescript
// src/icons/app-icons.ts
import type { IconSet, IconDefinition } from '@tachui/symbols'

const iconData: Record<string, string> = {
  'home': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>',
  // ... only your needed icons
}

export class AppIconSet implements IconSet {
  name = 'app'
  version = '1.0.0'
  
  async getIcon(name: string): Promise<IconDefinition | undefined> {
    const svg = iconData[name]
    return svg ? { name, svg, viewBox: '0 0 24 24', variant: 'none', weight: 'regular' } : undefined
  }
  
  hasIcon(name: string): boolean { return name in iconData }
  listIcons(): string[] { return Object.keys(iconData) }
  supportsVariant(): boolean { return true }
  supportsWeight(): boolean { return true }
}

// src/icons/register.ts  
import { IconSetRegistry } from '@tachui/symbols'
import { AppIconSet } from './app-icons'

IconSetRegistry.register(new AppIconSet())
IconSetRegistry.setDefault('app')
```

**Usage:**
```typescript
// src/main.ts
import './icons/register' // Register first
import { Symbol } from '@tachui/symbols'

// Icons automatically use your custom set
Symbol('home') // Uses AppIconSet, not Lucide
```

**Bundle Impact:** 📦 **620KB → 5KB** (99% reduction)

## ⚡ Approach 2: Selective Lucide Loading

Best for: Medium apps that need Lucide's full icon library but want smaller initial bundles

```typescript
// src/icons/selective-setup.ts
import { IconSetRegistry } from '@tachui/symbols'
import { SelectiveLucideIconSet } from '@tachui/symbols/selective-lucide'

// Only preload critical icons
const iconSet = new SelectiveLucideIconSet({
  preload: ['home', 'user', 'settings'], // Loaded immediately
  debug: true // Log dynamic loads
})

IconSetRegistry.register(iconSet)
```

**Usage:**
```typescript
Symbol('home')     // Loaded from preload (immediate)
Symbol('calendar') // Loaded dynamically (small delay)
```

**Bundle Impact:** 📦 **620KB → 10-50KB** (80-90% reduction)

## 🛠 Approach 3: Build-time Icon Extraction

Best for: Large apps that want automatic optimization

```bash
# Extract icons automatically
node tools/icon-extractor.js src/ > src/icons/extracted-icons.ts
```

**Vite Plugin:**
```typescript
// vite.config.ts
import { iconTreeShaking } from './plugins/vite-plugin-icon-tree-shaking'

export default defineConfig({
  plugins: [
    iconTreeShaking({
      library: 'lucide',
      scanDirs: ['src'],
      debug: true
    })
  ]
})
```

**Bundle Impact:** 📦 **620KB → Variable** (depends on usage)

## 📋 Implementation Checklist

### For Custom Icon Set:
- [ ] Create `src/icons/app-icons.ts` with your icon data
- [ ] Create `src/icons/register.ts` for registration
- [ ] Import registration in `src/main.ts`
- [ ] Add `lucide` to Vite `external` config
- [ ] Test all icons render correctly

### For Selective Loading:
- [ ] Install `@tachui/symbols/selective-lucide`
- [ ] Configure with preloaded critical icons
- [ ] Register in main app entry point
- [ ] Monitor dynamic loading in devtools

### For Build-time Extraction:
- [ ] Set up extraction tooling
- [ ] Configure Vite plugin
- [ ] Add to build pipeline
- [ ] Validate extracted icons match usage

## 🎨 Icon Data Sources

### Manual Icon Creation:
```typescript
// Get SVG from Lucide website, Heroicons, or Feather Icons
const iconSvg = '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
```

### Lucide Icon Extraction:
```javascript
// Extract from Lucide dynamically
import { Home, User, Settings } from 'lucide'

const icons = { Home, User, Settings }
// Convert to TachUI format
```

### SVG to Icon Converter:
```bash
# Convert SVG files to icon set
node tools/svg-to-iconset.js assets/icons/ > src/icons/generated.ts
```

## ⚠️ Important Considerations

1. **SEO**: Custom icon sets may affect SEO if icons are critical content
2. **Accessibility**: Ensure all icons maintain proper aria-labels
3. **Caching**: Custom icons are cached with your bundle, Lucide icons may use CDN
4. **Updates**: Custom sets require manual updates, Lucide auto-updates
5. **Consistency**: Custom icons should match your design system

## 🚀 Performance Results

**Intro App Example:**
- Before: 844KB total (145KB gzipped)  
- After: 224KB total (59KB gzipped)
- **73% bundle size reduction**
- **Zero impact on functionality**

## 📖 Additional Resources

- [Lucide Icon Library](https://lucide.dev/icons/)
- [TachUI Symbol Documentation](../packages/symbols/README.md)
- [Vite Tree-shaking Guide](https://vitejs.dev/guide/features.html#tree-shaking)
- [Bundle Size Analysis Tools](https://bundlejs.com/)