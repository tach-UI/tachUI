/**
 * SF Symbols to Lucide Icon Mapping
 * 
 * This module provides comprehensive mapping between SF Symbol names and Lucide icon equivalents,
 * enabling SwiftUI developers to use familiar SF Symbol naming conventions while leveraging
 * Lucide's robust icon library.
 * 
 * Based on SF Symbols 6.0 catalog and most commonly used symbols in iOS/macOS applications.
 */

export interface SFSymbolMapping {
  /** SF Symbol name */
  sfSymbol: string
  /** Corresponding Lucide icon name */
  lucideIcon: string
  /** Default variant to use */
  defaultVariant?: 'none' | 'filled' | 'slash' | 'circle' | 'square'
  /** Whether this is an exact match or approximate */
  matchQuality: 'exact' | 'close' | 'approximate'
  /** Optional notes about the mapping */
  notes?: string
  /** Alternative SF Symbol names that map to the same Lucide icon */
  aliases?: string[]
  /** Category this symbol belongs to */
  category?: string
}

/**
 * Comprehensive SF Symbol to Lucide mapping table
 * Organized by categories for maintainability
 */

// System & Interface Symbols
const SYSTEM_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'plus',
    lucideIcon: 'plus',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'minus',
    lucideIcon: 'minus',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'xmark',
    lucideIcon: 'x',
    matchQuality: 'exact',
    category: 'system',
    aliases: ['x.mark']
  },
  {
    sfSymbol: 'checkmark',
    lucideIcon: 'check',
    matchQuality: 'exact',
    category: 'system',
    aliases: ['check.mark']
  },
  {
    sfSymbol: 'chevron.left',
    lucideIcon: 'chevron-left',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'chevron.right',
    lucideIcon: 'chevron-right',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'chevron.up',
    lucideIcon: 'chevron-up',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'chevron.down',
    lucideIcon: 'chevron-down',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'arrow.left',
    lucideIcon: 'arrow-left',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'arrow.right',
    lucideIcon: 'arrow-right',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'arrow.up',
    lucideIcon: 'arrow-up',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'arrow.down',
    lucideIcon: 'arrow-down',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'gear',
    lucideIcon: 'settings',
    matchQuality: 'close',
    category: 'system',
    aliases: ['gearshape']
  },
  {
    sfSymbol: 'slider.horizontal.3',
    lucideIcon: 'sliders-horizontal',
    matchQuality: 'exact',
    category: 'system'
  },
  {
    sfSymbol: 'ellipsis',
    lucideIcon: 'more-horizontal',
    matchQuality: 'close',
    category: 'system'
  },
  {
    sfSymbol: 'ellipsis.vertical',
    lucideIcon: 'more-vertical',
    matchQuality: 'close',
    category: 'system'
  }
]

// Navigation & Interface
const NAVIGATION_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'house',
    lucideIcon: 'home',
    matchQuality: 'exact',
    category: 'navigation',
    aliases: ['house.fill']
  },
  {
    sfSymbol: 'magnifyingglass',
    lucideIcon: 'search',
    matchQuality: 'exact',
    category: 'navigation'
  },
  {
    sfSymbol: 'bell',
    lucideIcon: 'bell',
    matchQuality: 'exact',
    category: 'navigation',
    aliases: ['bell.fill']
  },
  {
    sfSymbol: 'bell.slash',
    lucideIcon: 'bell-off',
    matchQuality: 'exact',
    category: 'navigation'
  },
  {
    sfSymbol: 'bookmark',
    lucideIcon: 'bookmark',
    matchQuality: 'exact',
    category: 'navigation',
    aliases: ['bookmark.fill']
  },
  {
    sfSymbol: 'star',
    lucideIcon: 'star',
    matchQuality: 'exact',
    category: 'navigation',
    aliases: ['star.fill']
  },
  {
    sfSymbol: 'heart',
    lucideIcon: 'heart',
    matchQuality: 'exact',
    category: 'navigation',
    aliases: ['heart.fill']
  },
  {
    sfSymbol: 'heart.circle',
    lucideIcon: 'heart',
    matchQuality: 'close',
    category: 'navigation',
    aliases: ['heart.circle.fill'],
    notes: 'Heart symbol without circle frame'
  },
  {
    sfSymbol: 'folder',
    lucideIcon: 'folder',
    matchQuality: 'exact',
    category: 'navigation',
    aliases: ['folder.fill']
  },
  {
    sfSymbol: 'trash',
    lucideIcon: 'trash-2',
    matchQuality: 'close',
    category: 'navigation',
    aliases: ['trash.fill']
  },
  {
    sfSymbol: 'pencil',
    lucideIcon: 'pencil',
    matchQuality: 'exact',
    category: 'navigation'
  },
  {
    sfSymbol: 'square.and.pencil',
    lucideIcon: 'edit',
    matchQuality: 'close',
    category: 'navigation'
  }
]

// People & Identity
const PEOPLE_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'person',
    lucideIcon: 'user',
    matchQuality: 'exact',
    category: 'people',
    aliases: ['person.fill']
  },
  {
    sfSymbol: 'person.2',
    lucideIcon: 'users',
    matchQuality: 'exact',
    category: 'people',
    aliases: ['person.2.fill']
  },
  {
    sfSymbol: 'person.3',
    lucideIcon: 'users',
    matchQuality: 'close',
    category: 'people',
    notes: 'Lucide uses same icon for 2+ people'
  },
  {
    sfSymbol: 'person.circle',
    lucideIcon: 'user-circle',
    matchQuality: 'exact',
    category: 'people',
    aliases: ['person.circle.fill']
  },
  {
    sfSymbol: 'person.crop.circle',
    lucideIcon: 'user-circle',
    matchQuality: 'exact',
    category: 'people',
    aliases: ['person.crop.circle.fill']
  }
]

// Communication & Media
const COMMUNICATION_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'envelope',
    lucideIcon: 'mail',
    matchQuality: 'exact',
    category: 'communication',
    aliases: ['envelope.fill']
  },
  {
    sfSymbol: 'envelope.open',
    lucideIcon: 'mail-open',
    matchQuality: 'exact',
    category: 'communication',
    aliases: ['envelope.open.fill']
  },
  {
    sfSymbol: 'phone',
    lucideIcon: 'phone',
    matchQuality: 'exact',
    category: 'communication',
    aliases: ['phone.fill']
  },
  {
    sfSymbol: 'phone.down',
    lucideIcon: 'phone-off',
    matchQuality: 'close',
    category: 'communication',
    aliases: ['phone.down.fill']
  },
  {
    sfSymbol: 'message',
    lucideIcon: 'message-circle',
    matchQuality: 'close',
    category: 'communication',
    aliases: ['message.fill']
  },
  {
    sfSymbol: 'bubble.left',
    lucideIcon: 'message-circle',
    matchQuality: 'close',
    category: 'communication',
    aliases: ['bubble.left.fill']
  },
  {
    sfSymbol: 'bubble.right',
    lucideIcon: 'message-circle',
    matchQuality: 'close',
    category: 'communication'
  },
  {
    sfSymbol: 'video',
    lucideIcon: 'video',
    matchQuality: 'exact',
    category: 'communication',
    aliases: ['video.fill']
  },
  {
    sfSymbol: 'video.slash',
    lucideIcon: 'video-off',
    matchQuality: 'exact',
    category: 'communication'
  },
  {
    sfSymbol: 'mic',
    lucideIcon: 'mic',
    matchQuality: 'exact',
    category: 'communication',
    aliases: ['mic.fill']
  },
  {
    sfSymbol: 'mic.slash',
    lucideIcon: 'mic-off',
    matchQuality: 'exact',
    category: 'communication'
  }
]

// Media & Playback
const MEDIA_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'play',
    lucideIcon: 'play',
    matchQuality: 'exact',
    category: 'media',
    aliases: ['play.fill']
  },
  {
    sfSymbol: 'pause',
    lucideIcon: 'pause',
    matchQuality: 'exact',
    category: 'media',
    aliases: ['pause.fill']
  },
  {
    sfSymbol: 'stop',
    lucideIcon: 'square',
    matchQuality: 'approximate',
    category: 'media',
    aliases: ['stop.fill'],
    notes: 'Lucide uses square for stop'
  },
  {
    sfSymbol: 'backward',
    lucideIcon: 'skip-back',
    matchQuality: 'close',
    category: 'media',
    aliases: ['backward.fill']
  },
  {
    sfSymbol: 'forward',
    lucideIcon: 'skip-forward',
    matchQuality: 'close',
    category: 'media',
    aliases: ['forward.fill']
  },
  {
    sfSymbol: 'speaker',
    lucideIcon: 'volume-2',
    matchQuality: 'close',
    category: 'media'
  },
  {
    sfSymbol: 'speaker.slash',
    lucideIcon: 'volume-x',
    matchQuality: 'close',
    category: 'media'
  },
  {
    sfSymbol: 'speaker.wave.1',
    lucideIcon: 'volume-1',
    matchQuality: 'exact',
    category: 'media'
  },
  {
    sfSymbol: 'speaker.wave.2',
    lucideIcon: 'volume-2',
    matchQuality: 'exact',
    category: 'media'
  },
  {
    sfSymbol: 'camera',
    lucideIcon: 'camera',
    matchQuality: 'exact',
    category: 'media',
    aliases: ['camera.fill']
  },
  {
    sfSymbol: 'photo',
    lucideIcon: 'image',
    matchQuality: 'close',
    category: 'media',
    aliases: ['photo.fill']
  }
]

// Documents & Storage
const DOCUMENT_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'doc',
    lucideIcon: 'file',
    matchQuality: 'exact',
    category: 'documents',
    aliases: ['doc.fill']
  },
  {
    sfSymbol: 'doc.text',
    lucideIcon: 'file-text',
    matchQuality: 'exact',
    category: 'documents',
    aliases: ['doc.text.fill']
  },
  {
    sfSymbol: 'folder',
    lucideIcon: 'folder',
    matchQuality: 'exact',
    category: 'documents',
    aliases: ['folder.fill']
  },
  {
    sfSymbol: 'archivebox',
    lucideIcon: 'archive',
    matchQuality: 'close',
    category: 'documents',
    aliases: ['archivebox.fill']
  },
  {
    sfSymbol: 'externaldrive',
    lucideIcon: 'hard-drive',
    matchQuality: 'close',
    category: 'documents',
    aliases: ['externaldrive.fill']
  },
  {
    sfSymbol: 'icloud',
    lucideIcon: 'cloud',
    matchQuality: 'exact',
    category: 'documents',
    aliases: ['icloud.fill']
  },
  {
    sfSymbol: 'icloud.and.arrow.down',
    lucideIcon: 'cloud-download',
    matchQuality: 'exact',
    category: 'documents'
  },
  {
    sfSymbol: 'icloud.and.arrow.up',
    lucideIcon: 'cloud-upload',
    matchQuality: 'exact',
    category: 'documents'
  }
]

// Time & Calendar
const TIME_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'clock',
    lucideIcon: 'clock',
    matchQuality: 'exact',
    category: 'time',
    aliases: ['clock.fill']
  },
  {
    sfSymbol: 'calendar',
    lucideIcon: 'calendar',
    matchQuality: 'exact',
    category: 'time'
  },
  {
    sfSymbol: 'timer',
    lucideIcon: 'timer',
    matchQuality: 'exact',
    category: 'time'
  },
  {
    sfSymbol: 'alarm',
    lucideIcon: 'alarm-clock',
    matchQuality: 'close',
    category: 'time',
    aliases: ['alarm.fill']
  }
]

// Location & Maps
const LOCATION_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'location',
    lucideIcon: 'map-pin',
    matchQuality: 'close',
    category: 'location',
    aliases: ['location.fill']
  },
  {
    sfSymbol: 'mappin',
    lucideIcon: 'map-pin',
    matchQuality: 'exact',
    category: 'location',
    aliases: ['mappin.circle', 'mappin.circle.fill']
  },
  {
    sfSymbol: 'map',
    lucideIcon: 'map',
    matchQuality: 'exact',
    category: 'location',
    aliases: ['map.fill']
  },
  {
    sfSymbol: 'globe',
    lucideIcon: 'globe',
    matchQuality: 'exact',
    category: 'location'
  }
]

// Weather
const WEATHER_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'sun.max',
    lucideIcon: 'sun',
    matchQuality: 'exact',
    category: 'weather',
    aliases: ['sun.max.fill']
  },
  {
    sfSymbol: 'moon',
    lucideIcon: 'moon',
    matchQuality: 'exact',
    category: 'weather',
    aliases: ['moon.fill']
  },
  {
    sfSymbol: 'cloud',
    lucideIcon: 'cloud',
    matchQuality: 'exact',
    category: 'weather',
    aliases: ['cloud.fill']
  },
  {
    sfSymbol: 'cloud.rain',
    lucideIcon: 'cloud-rain',
    matchQuality: 'exact',
    category: 'weather',
    aliases: ['cloud.rain.fill']
  },
  {
    sfSymbol: 'cloud.snow',
    lucideIcon: 'cloud-snow',
    matchQuality: 'exact',
    category: 'weather',
    aliases: ['cloud.snow.fill']
  },
  {
    sfSymbol: 'bolt',
    lucideIcon: 'zap',
    matchQuality: 'close',
    category: 'weather',
    aliases: ['bolt.fill']
  }
]

// Transportation
const TRANSPORTATION_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'car',
    lucideIcon: 'car',
    matchQuality: 'exact',
    category: 'transportation',
    aliases: ['car.fill']
  },
  {
    sfSymbol: 'airplane',
    lucideIcon: 'plane',
    matchQuality: 'exact',
    category: 'transportation'
  },
  {
    sfSymbol: 'bicycle',
    lucideIcon: 'bike',
    matchQuality: 'exact',
    category: 'transportation'
  },
  {
    sfSymbol: 'train.side.front.car',
    lucideIcon: 'train-front',
    matchQuality: 'close',
    category: 'transportation'
  }
]

// Health & Fitness
const HEALTH_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'heart',
    lucideIcon: 'heart',
    matchQuality: 'exact',
    category: 'health',
    aliases: ['heart.fill']
  },
  {
    sfSymbol: 'heart.pulse',
    lucideIcon: 'activity',
    matchQuality: 'close',
    category: 'health',
    aliases: ['heart.pulse.fill']
  },
  {
    sfSymbol: 'cross',
    lucideIcon: 'plus',
    matchQuality: 'approximate',
    category: 'health',
    aliases: ['cross.fill'],
    notes: 'Medical cross approximated with plus'
  }
]

// Shopping & Commerce
const SHOPPING_SYMBOLS: SFSymbolMapping[] = [
  {
    sfSymbol: 'cart',
    lucideIcon: 'shopping-cart',
    matchQuality: 'exact',
    category: 'shopping',
    aliases: ['cart.fill']
  },
  {
    sfSymbol: 'bag',
    lucideIcon: 'shopping-bag',
    matchQuality: 'exact',
    category: 'shopping',
    aliases: ['bag.fill']
  },
  {
    sfSymbol: 'creditcard',
    lucideIcon: 'credit-card',
    matchQuality: 'exact',
    category: 'shopping',
    aliases: ['creditcard.fill']
  },
  {
    sfSymbol: 'dollarsign.circle',
    lucideIcon: 'dollar-sign',
    matchQuality: 'close',
    category: 'shopping',
    aliases: ['dollarsign.circle.fill']
  }
]

/**
 * Master mapping table combining all categories
 */
export const SF_SYMBOLS_MAPPING: SFSymbolMapping[] = [
  ...SYSTEM_SYMBOLS,
  ...NAVIGATION_SYMBOLS,
  ...PEOPLE_SYMBOLS,
  ...COMMUNICATION_SYMBOLS,
  ...MEDIA_SYMBOLS,
  ...DOCUMENT_SYMBOLS,
  ...TIME_SYMBOLS,
  ...LOCATION_SYMBOLS,
  ...WEATHER_SYMBOLS,
  ...TRANSPORTATION_SYMBOLS,
  ...HEALTH_SYMBOLS,
  ...SHOPPING_SYMBOLS
]

/**
 * Create mapping lookup tables for performance
 */
export const SF_SYMBOL_TO_LUCIDE_MAP = new Map<string, string>()
export const LUCIDE_TO_SF_SYMBOL_MAP = new Map<string, string[]>()
export const SF_SYMBOL_ALIASES_MAP = new Map<string, string>()

// Initialize lookup maps
SF_SYMBOLS_MAPPING.forEach(mapping => {
  // Main mapping
  SF_SYMBOL_TO_LUCIDE_MAP.set(mapping.sfSymbol, mapping.lucideIcon)
  
  // Reverse mapping
  const existing = LUCIDE_TO_SF_SYMBOL_MAP.get(mapping.lucideIcon) || []
  existing.push(mapping.sfSymbol)
  LUCIDE_TO_SF_SYMBOL_MAP.set(mapping.lucideIcon, existing)
  
  // Aliases mapping
  if (mapping.aliases) {
    mapping.aliases.forEach(alias => {
      SF_SYMBOL_TO_LUCIDE_MAP.set(alias, mapping.lucideIcon)
      SF_SYMBOL_ALIASES_MAP.set(alias, mapping.sfSymbol)
    })
  }
})

/**
 * Get Lucide icon name for an SF Symbol
 */
export function getLucideForSFSymbol(sfSymbol: string): string | undefined {
  return SF_SYMBOL_TO_LUCIDE_MAP.get(sfSymbol)
}

/**
 * Get SF Symbols that map to a Lucide icon
 */
export function getSFSymbolsForLucide(lucideIcon: string): string[] {
  return LUCIDE_TO_SF_SYMBOL_MAP.get(lucideIcon) || []
}

/**
 * Check if an SF Symbol name is supported
 */
export function isSFSymbolSupported(sfSymbol: string): boolean {
  return SF_SYMBOL_TO_LUCIDE_MAP.has(sfSymbol)
}

/**
 * Get all supported SF Symbol names
 */
export function getAllSupportedSFSymbols(): string[] {
  return Array.from(SF_SYMBOL_TO_LUCIDE_MAP.keys()).sort()
}

/**
 * Get mapping details for an SF Symbol
 */
export function getSFSymbolMapping(sfSymbol: string): SFSymbolMapping | undefined {
  return SF_SYMBOLS_MAPPING.find(m => 
    m.sfSymbol === sfSymbol || (m.aliases && m.aliases.includes(sfSymbol))
  )
}

/**
 * Get SF Symbols by category
 */
export function getSFSymbolsByCategory(category: string): SFSymbolMapping[] {
  return SF_SYMBOLS_MAPPING.filter(m => m.category === category)
}

/**
 * Get all available categories
 */
export function getAllSFSymbolCategories(): string[] {
  const categories = new Set<string>()
  SF_SYMBOLS_MAPPING.forEach(m => {
    if (m.category) categories.add(m.category)
  })
  return Array.from(categories).sort()
}