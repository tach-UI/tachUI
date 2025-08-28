/**
 * SF Symbol Category Mapping System
 * 
 * Organizes SF Symbols into functional categories and provides utilities
 * for discovering, filtering, and managing symbols by category.
 */

import { SF_SYMBOLS_MAPPING, type SFSymbolMapping } from './sf-symbols-mapping.js'

/**
 * Comprehensive SF Symbol category definitions
 * Based on Apple's SF Symbols organization and common usage patterns
 */
export enum SymbolCategory {
  // Core System
  SYSTEM = 'system',
  INTERFACE = 'interface',
  NAVIGATION = 'navigation',
  
  // Content & Media
  MEDIA = 'media',
  PLAYBACK = 'playback',
  CAMERA = 'camera',
  
  // Communication
  COMMUNICATION = 'communication',
  SOCIAL = 'social',
  MESSAGING = 'messaging',
  
  // People & Identity
  PEOPLE = 'people',
  IDENTITY = 'identity',
  ACCESSIBILITY = 'accessibility',
  
  // Documents & Files
  DOCUMENTS = 'documents',
  FILES = 'files',
  STORAGE = 'storage',
  
  // Time & Calendar
  TIME = 'time',
  CALENDAR = 'calendar',
  SCHEDULING = 'scheduling',
  
  // Location & Travel
  LOCATION = 'location',
  MAPS = 'maps',
  TRANSPORTATION = 'transportation',
  TRAVEL = 'travel',
  
  // Weather & Environment
  WEATHER = 'weather',
  ENVIRONMENT = 'environment',
  NATURE = 'nature',
  
  // Health & Fitness
  HEALTH = 'health',
  FITNESS = 'fitness',
  WELLNESS = 'wellness',
  
  // Shopping & Commerce
  SHOPPING = 'shopping',
  COMMERCE = 'commerce',
  FINANCE = 'finance',
  
  // Technology & Devices
  TECHNOLOGY = 'technology',
  DEVICES = 'devices',
  CONNECTIVITY = 'connectivity',
  
  // Education & Learning
  EDUCATION = 'education',
  LEARNING = 'learning',
  SCIENCE = 'science',
  
  // Entertainment & Games
  ENTERTAINMENT = 'entertainment',
  GAMES = 'games',
  SPORTS = 'sports',
  
  // Business & Productivity
  BUSINESS = 'business',
  PRODUCTIVITY = 'productivity',
  TOOLS = 'tools'
}

/**
 * Category metadata with descriptions and usage guidelines
 */
export interface CategoryMetadata {
  name: string
  displayName: string
  description: string
  keywords: string[]
  commonUseCases: string[]
  relatedCategories: SymbolCategory[]
}

/**
 * Comprehensive category metadata
 */
export const CATEGORY_METADATA: Record<SymbolCategory, CategoryMetadata> = {
  [SymbolCategory.SYSTEM]: {
    name: 'system',
    displayName: 'System',
    description: 'Core system interface elements and controls',
    keywords: ['ui', 'interface', 'controls', 'buttons', 'system'],
    commonUseCases: ['UI components', 'Form controls', 'Basic interactions'],
    relatedCategories: [SymbolCategory.INTERFACE, SymbolCategory.NAVIGATION]
  },
  
  [SymbolCategory.INTERFACE]: {
    name: 'interface',
    displayName: 'Interface',
    description: 'User interface elements and interaction patterns',
    keywords: ['ui', 'ux', 'interface', 'interaction', 'controls'],
    commonUseCases: ['App interfaces', 'Web controls', 'Interactive elements'],
    relatedCategories: [SymbolCategory.SYSTEM, SymbolCategory.NAVIGATION]
  },
  
  [SymbolCategory.NAVIGATION]: {
    name: 'navigation',
    displayName: 'Navigation',
    description: 'Navigation elements and wayfinding symbols',
    keywords: ['nav', 'menu', 'navigation', 'routing', 'wayfinding'],
    commonUseCases: ['App navigation', 'Menu systems', 'Breadcrumbs'],
    relatedCategories: [SymbolCategory.SYSTEM, SymbolCategory.INTERFACE]
  },
  
  [SymbolCategory.MEDIA]: {
    name: 'media',
    displayName: 'Media',
    description: 'Media content and multimedia elements',
    keywords: ['media', 'multimedia', 'content', 'assets'],
    commonUseCases: ['Media players', 'Content galleries', 'Asset management'],
    relatedCategories: [SymbolCategory.PLAYBACK, SymbolCategory.CAMERA]
  },
  
  [SymbolCategory.PLAYBACK]: {
    name: 'playback',
    displayName: 'Playback',
    description: 'Audio and video playback controls',
    keywords: ['play', 'pause', 'stop', 'audio', 'video', 'controls'],
    commonUseCases: ['Media players', 'Audio controls', 'Video interfaces'],
    relatedCategories: [SymbolCategory.MEDIA, SymbolCategory.ENTERTAINMENT]
  },
  
  [SymbolCategory.CAMERA]: {
    name: 'camera',
    displayName: 'Camera',
    description: 'Camera, photography, and image capture',
    keywords: ['camera', 'photo', 'image', 'capture', 'photography'],
    commonUseCases: ['Camera apps', 'Photo editing', 'Image capture'],
    relatedCategories: [SymbolCategory.MEDIA, SymbolCategory.TECHNOLOGY]
  },
  
  [SymbolCategory.COMMUNICATION]: {
    name: 'communication',
    displayName: 'Communication',
    description: 'General communication and connectivity symbols',
    keywords: ['communication', 'connect', 'contact', 'reach'],
    commonUseCases: ['Contact forms', 'Communication apps', 'Connectivity'],
    relatedCategories: [SymbolCategory.MESSAGING, SymbolCategory.SOCIAL]
  },
  
  [SymbolCategory.SOCIAL]: {
    name: 'social',
    displayName: 'Social',
    description: 'Social interaction and community features',
    keywords: ['social', 'community', 'sharing', 'interaction'],
    commonUseCases: ['Social media', 'Community features', 'Sharing'],
    relatedCategories: [SymbolCategory.COMMUNICATION, SymbolCategory.MESSAGING]
  },
  
  [SymbolCategory.MESSAGING]: {
    name: 'messaging',
    displayName: 'Messaging',
    description: 'Messaging, chat, and text communication',
    keywords: ['message', 'chat', 'text', 'conversation', 'messaging'],
    commonUseCases: ['Chat applications', 'Messaging interfaces', 'Text communication'],
    relatedCategories: [SymbolCategory.COMMUNICATION, SymbolCategory.SOCIAL]
  },
  
  [SymbolCategory.PEOPLE]: {
    name: 'people',
    displayName: 'People',
    description: 'People, users, and human representation',
    keywords: ['people', 'person', 'user', 'human', 'individual'],
    commonUseCases: ['User profiles', 'Account systems', 'People management'],
    relatedCategories: [SymbolCategory.IDENTITY, SymbolCategory.SOCIAL]
  },
  
  [SymbolCategory.IDENTITY]: {
    name: 'identity',
    displayName: 'Identity',
    description: 'Identity, authentication, and user management',
    keywords: ['identity', 'auth', 'user', 'account', 'profile'],
    commonUseCases: ['User authentication', 'Profile management', 'Identity systems'],
    relatedCategories: [SymbolCategory.PEOPLE, SymbolCategory.BUSINESS]
  },
  
  [SymbolCategory.ACCESSIBILITY]: {
    name: 'accessibility',
    displayName: 'Accessibility',
    description: 'Accessibility features and inclusive design',
    keywords: ['accessibility', 'a11y', 'inclusive', 'disability', 'support'],
    commonUseCases: ['Accessible interfaces', 'Inclusive design', 'Disability support'],
    relatedCategories: [SymbolCategory.PEOPLE, SymbolCategory.INTERFACE]
  },
  
  [SymbolCategory.DOCUMENTS]: {
    name: 'documents',
    displayName: 'Documents',
    description: 'Documents, files, and content management',
    keywords: ['document', 'file', 'content', 'text', 'paper'],
    commonUseCases: ['Document management', 'File systems', 'Content editing'],
    relatedCategories: [SymbolCategory.FILES, SymbolCategory.STORAGE]
  },
  
  [SymbolCategory.FILES]: {
    name: 'files',
    displayName: 'Files',
    description: 'File management and organization systems',
    keywords: ['file', 'folder', 'organize', 'management', 'system'],
    commonUseCases: ['File managers', 'Organization tools', 'File systems'],
    relatedCategories: [SymbolCategory.DOCUMENTS, SymbolCategory.STORAGE]
  },
  
  [SymbolCategory.STORAGE]: {
    name: 'storage',
    displayName: 'Storage',
    description: 'Storage, backup, and data management',
    keywords: ['storage', 'backup', 'data', 'save', 'archive'],
    commonUseCases: ['Data backup', 'Storage management', 'Archive systems'],
    relatedCategories: [SymbolCategory.FILES, SymbolCategory.TECHNOLOGY]
  },
  
  [SymbolCategory.TIME]: {
    name: 'time',
    displayName: 'Time',
    description: 'Time, clocks, and temporal elements',
    keywords: ['time', 'clock', 'timer', 'temporal', 'duration'],
    commonUseCases: ['Time displays', 'Timers', 'Clock interfaces'],
    relatedCategories: [SymbolCategory.CALENDAR, SymbolCategory.SCHEDULING]
  },
  
  [SymbolCategory.CALENDAR]: {
    name: 'calendar',
    displayName: 'Calendar',
    description: 'Calendar, dates, and scheduling',
    keywords: ['calendar', 'date', 'schedule', 'appointment', 'event'],
    commonUseCases: ['Calendar applications', 'Date pickers', 'Event scheduling'],
    relatedCategories: [SymbolCategory.TIME, SymbolCategory.SCHEDULING]
  },
  
  [SymbolCategory.SCHEDULING]: {
    name: 'scheduling',
    displayName: 'Scheduling',
    description: 'Scheduling, planning, and time management',
    keywords: ['schedule', 'plan', 'organize', 'time', 'management'],
    commonUseCases: ['Scheduling apps', 'Planning tools', 'Time management'],
    relatedCategories: [SymbolCategory.TIME, SymbolCategory.CALENDAR]
  },
  
  [SymbolCategory.LOCATION]: {
    name: 'location',
    displayName: 'Location',
    description: 'Location, positioning, and geographic elements',
    keywords: ['location', 'position', 'place', 'geographic', 'gps'],
    commonUseCases: ['Location services', 'GPS apps', 'Geographic interfaces'],
    relatedCategories: [SymbolCategory.MAPS, SymbolCategory.TRAVEL]
  },
  
  [SymbolCategory.MAPS]: {
    name: 'maps',
    displayName: 'Maps',
    description: 'Maps, navigation, and geographic visualization',
    keywords: ['map', 'navigation', 'geographic', 'route', 'direction'],
    commonUseCases: ['Map applications', 'Navigation systems', 'Geographic tools'],
    relatedCategories: [SymbolCategory.LOCATION, SymbolCategory.TRANSPORTATION]
  },
  
  [SymbolCategory.TRANSPORTATION]: {
    name: 'transportation',
    displayName: 'Transportation',
    description: 'Transportation modes and travel methods',
    keywords: ['transport', 'travel', 'vehicle', 'journey', 'mobility'],
    commonUseCases: ['Transportation apps', 'Travel planning', 'Mobility services'],
    relatedCategories: [SymbolCategory.TRAVEL, SymbolCategory.MAPS]
  },
  
  [SymbolCategory.TRAVEL]: {
    name: 'travel',
    displayName: 'Travel',
    description: 'Travel, tourism, and journey planning',
    keywords: ['travel', 'tourism', 'journey', 'trip', 'vacation'],
    commonUseCases: ['Travel apps', 'Tourism platforms', 'Journey planning'],
    relatedCategories: [SymbolCategory.TRANSPORTATION, SymbolCategory.LOCATION]
  },
  
  [SymbolCategory.WEATHER]: {
    name: 'weather',
    displayName: 'Weather',
    description: 'Weather conditions and meteorological symbols',
    keywords: ['weather', 'climate', 'meteorology', 'conditions', 'forecast'],
    commonUseCases: ['Weather apps', 'Climate interfaces', 'Weather widgets'],
    relatedCategories: [SymbolCategory.ENVIRONMENT, SymbolCategory.NATURE]
  },
  
  [SymbolCategory.ENVIRONMENT]: {
    name: 'environment',
    displayName: 'Environment',
    description: 'Environmental and ecological symbols',
    keywords: ['environment', 'ecology', 'nature', 'green', 'sustainability'],
    commonUseCases: ['Environmental apps', 'Sustainability tools', 'Eco-friendly interfaces'],
    relatedCategories: [SymbolCategory.NATURE, SymbolCategory.WEATHER]
  },
  
  [SymbolCategory.NATURE]: {
    name: 'nature',
    displayName: 'Nature',
    description: 'Natural elements and outdoor symbols',
    keywords: ['nature', 'outdoor', 'natural', 'organic', 'wilderness'],
    commonUseCases: ['Outdoor apps', 'Nature guides', 'Environmental interfaces'],
    relatedCategories: [SymbolCategory.ENVIRONMENT, SymbolCategory.WEATHER]
  },
  
  [SymbolCategory.HEALTH]: {
    name: 'health',
    displayName: 'Health',
    description: 'Health, medical, and wellness symbols',
    keywords: ['health', 'medical', 'wellness', 'healthcare', 'medicine'],
    commonUseCases: ['Health apps', 'Medical interfaces', 'Wellness tracking'],
    relatedCategories: [SymbolCategory.FITNESS, SymbolCategory.WELLNESS]
  },
  
  [SymbolCategory.FITNESS]: {
    name: 'fitness',
    displayName: 'Fitness',
    description: 'Fitness, exercise, and physical activity',
    keywords: ['fitness', 'exercise', 'workout', 'physical', 'activity'],
    commonUseCases: ['Fitness apps', 'Exercise tracking', 'Activity monitoring'],
    relatedCategories: [SymbolCategory.HEALTH, SymbolCategory.WELLNESS]
  },
  
  [SymbolCategory.WELLNESS]: {
    name: 'wellness',
    displayName: 'Wellness',
    description: 'Mental wellness and self-care',
    keywords: ['wellness', 'mental', 'selfcare', 'mindfulness', 'balance'],
    commonUseCases: ['Wellness apps', 'Mental health tools', 'Self-care interfaces'],
    relatedCategories: [SymbolCategory.HEALTH, SymbolCategory.FITNESS]
  },
  
  [SymbolCategory.SHOPPING]: {
    name: 'shopping',
    displayName: 'Shopping',
    description: 'Shopping, retail, and consumer activities',
    keywords: ['shopping', 'retail', 'purchase', 'buy', 'consumer'],
    commonUseCases: ['E-commerce apps', 'Shopping interfaces', 'Retail systems'],
    relatedCategories: [SymbolCategory.COMMERCE, SymbolCategory.FINANCE]
  },
  
  [SymbolCategory.COMMERCE]: {
    name: 'commerce',
    displayName: 'Commerce',
    description: 'Commercial activities and business transactions',
    keywords: ['commerce', 'business', 'trade', 'transaction', 'commercial'],
    commonUseCases: ['Business apps', 'Commerce platforms', 'Trading interfaces'],
    relatedCategories: [SymbolCategory.SHOPPING, SymbolCategory.BUSINESS]
  },
  
  [SymbolCategory.FINANCE]: {
    name: 'finance',
    displayName: 'Finance',
    description: 'Financial services and monetary symbols',
    keywords: ['finance', 'money', 'payment', 'financial', 'monetary'],
    commonUseCases: ['Financial apps', 'Payment systems', 'Banking interfaces'],
    relatedCategories: [SymbolCategory.BUSINESS, SymbolCategory.COMMERCE]
  },
  
  [SymbolCategory.TECHNOLOGY]: {
    name: 'technology',
    displayName: 'Technology',
    description: 'Technology, computing, and digital elements',
    keywords: ['technology', 'tech', 'computing', 'digital', 'electronic'],
    commonUseCases: ['Tech interfaces', 'Computing tools', 'Digital platforms'],
    relatedCategories: [SymbolCategory.DEVICES, SymbolCategory.CONNECTIVITY]
  },
  
  [SymbolCategory.DEVICES]: {
    name: 'devices',
    displayName: 'Devices',
    description: 'Electronic devices and hardware',
    keywords: ['device', 'hardware', 'electronic', 'gadget', 'equipment'],
    commonUseCases: ['Device management', 'Hardware interfaces', 'Equipment tracking'],
    relatedCategories: [SymbolCategory.TECHNOLOGY, SymbolCategory.CONNECTIVITY]
  },
  
  [SymbolCategory.CONNECTIVITY]: {
    name: 'connectivity',
    displayName: 'Connectivity',
    description: 'Network connectivity and communication protocols',
    keywords: ['connectivity', 'network', 'connection', 'wireless', 'internet'],
    commonUseCases: ['Network tools', 'Connectivity status', 'Communication protocols'],
    relatedCategories: [SymbolCategory.TECHNOLOGY, SymbolCategory.COMMUNICATION]
  },
  
  [SymbolCategory.EDUCATION]: {
    name: 'education',
    displayName: 'Education',
    description: 'Education, learning, and academic activities',
    keywords: ['education', 'learning', 'academic', 'school', 'study'],
    commonUseCases: ['Educational apps', 'Learning platforms', 'Academic interfaces'],
    relatedCategories: [SymbolCategory.LEARNING, SymbolCategory.SCIENCE]
  },
  
  [SymbolCategory.LEARNING]: {
    name: 'learning',
    displayName: 'Learning',
    description: 'Learning processes and knowledge acquisition',
    keywords: ['learning', 'knowledge', 'education', 'skill', 'development'],
    commonUseCases: ['Learning apps', 'Skill development', 'Knowledge platforms'],
    relatedCategories: [SymbolCategory.EDUCATION, SymbolCategory.PRODUCTIVITY]
  },
  
  [SymbolCategory.SCIENCE]: {
    name: 'science',
    displayName: 'Science',
    description: 'Scientific elements and research symbols',
    keywords: ['science', 'research', 'scientific', 'experiment', 'discovery'],
    commonUseCases: ['Scientific apps', 'Research tools', 'Educational science'],
    relatedCategories: [SymbolCategory.EDUCATION, SymbolCategory.TECHNOLOGY]
  },
  
  [SymbolCategory.ENTERTAINMENT]: {
    name: 'entertainment',
    displayName: 'Entertainment',
    description: 'Entertainment, leisure, and recreational activities',
    keywords: ['entertainment', 'leisure', 'fun', 'recreation', 'amusement'],
    commonUseCases: ['Entertainment apps', 'Media platforms', 'Recreation interfaces'],
    relatedCategories: [SymbolCategory.GAMES, SymbolCategory.MEDIA]
  },
  
  [SymbolCategory.GAMES]: {
    name: 'games',
    displayName: 'Games',
    description: 'Gaming and interactive entertainment',
    keywords: ['games', 'gaming', 'play', 'interactive', 'entertainment'],
    commonUseCases: ['Gaming interfaces', 'Interactive entertainment', 'Game controls'],
    relatedCategories: [SymbolCategory.ENTERTAINMENT, SymbolCategory.SPORTS]
  },
  
  [SymbolCategory.SPORTS]: {
    name: 'sports',
    displayName: 'Sports',
    description: 'Sports, athletics, and competitive activities',
    keywords: ['sports', 'athletics', 'competition', 'game', 'physical'],
    commonUseCases: ['Sports apps', 'Athletic tracking', 'Competition interfaces'],
    relatedCategories: [SymbolCategory.FITNESS, SymbolCategory.GAMES]
  },
  
  [SymbolCategory.BUSINESS]: {
    name: 'business',
    displayName: 'Business',
    description: 'Business operations and professional activities',
    keywords: ['business', 'professional', 'corporate', 'work', 'enterprise'],
    commonUseCases: ['Business apps', 'Professional tools', 'Corporate interfaces'],
    relatedCategories: [SymbolCategory.PRODUCTIVITY, SymbolCategory.COMMERCE]
  },
  
  [SymbolCategory.PRODUCTIVITY]: {
    name: 'productivity',
    displayName: 'Productivity',
    description: 'Productivity tools and efficiency enhancement',
    keywords: ['productivity', 'efficiency', 'tools', 'workflow', 'optimization'],
    commonUseCases: ['Productivity apps', 'Workflow tools', 'Efficiency interfaces'],
    relatedCategories: [SymbolCategory.BUSINESS, SymbolCategory.TOOLS]
  },
  
  [SymbolCategory.TOOLS]: {
    name: 'tools',
    displayName: 'Tools',
    description: 'Tools, utilities, and functional instruments',
    keywords: ['tools', 'utility', 'instrument', 'function', 'helper'],
    commonUseCases: ['Utility apps', 'Tool interfaces', 'Functional elements'],
    relatedCategories: [SymbolCategory.PRODUCTIVITY, SymbolCategory.SYSTEM]
  }
}

/**
 * Enhanced SF Symbol mapping with extended category information
 */
export interface CategorizedSymbolMapping extends SFSymbolMapping {
  primaryCategory: SymbolCategory
  secondaryCategories?: SymbolCategory[]
  usageContext: string[]
  commonPairings: string[]
}

/**
 * Get symbols by category
 * 
 * @param category - The symbol category to filter by
 * @param includeSecondary - Whether to include symbols where this is a secondary category
 * @returns Array of symbols in the specified category
 */
export function getSymbolsByCategory(
  category: SymbolCategory, 
  includeSecondary: boolean = false
): SFSymbolMapping[] {
  return SF_SYMBOLS_MAPPING.filter(mapping => {
    if (mapping.category === category) {
      return true
    }
    
    // Check secondary categories if enabled
    if (includeSecondary) {
      // This would require extending SF_SYMBOLS_MAPPING with secondary categories
      // For now, return based on primary category only
      return false
    }
    
    return false
  })
}

/**
 * Get category for a specific SF Symbol
 * 
 * @param sfSymbol - The SF Symbol name
 * @returns The primary category for the symbol
 */
export function getSymbolCategory(sfSymbol: string): SymbolCategory | undefined {
  const mapping = SF_SYMBOLS_MAPPING.find(m => 
    m.sfSymbol === sfSymbol || (m.aliases && m.aliases.includes(sfSymbol))
  )
  
  if (!mapping || !mapping.category) {
    return undefined
  }
  
  // Map string categories to enum values
  return Object.values(SymbolCategory).find(cat => cat === mapping.category) as SymbolCategory
}

/**
 * Get all available symbol categories
 * 
 * @returns Array of all symbol categories with counts
 */
export function getAllSymbolCategories(): Array<{
  category: SymbolCategory
  name: string
  displayName: string
  count: number
  symbols: string[]
}> {
  const categoryCounts = new Map<string, string[]>()
  
  // Count symbols in each category
  SF_SYMBOLS_MAPPING.forEach(mapping => {
    if (mapping.category) {
      const existing = categoryCounts.get(mapping.category) || []
      existing.push(mapping.sfSymbol)
      categoryCounts.set(mapping.category, existing)
    }
  })
  
  // Convert to structured result
  return Object.values(SymbolCategory).map(category => {
    const metadata = CATEGORY_METADATA[category]
    const symbols = categoryCounts.get(category) || []
    
    return {
      category,
      name: metadata.name,
      displayName: metadata.displayName,
      count: symbols.length,
      symbols
    }
  }).filter(result => result.count > 0) // Only include categories with symbols
}

/**
 * Search symbols by category and keywords
 * 
 * @param query - Search query (keywords or category name)
 * @param categories - Specific categories to search within
 * @returns Array of matching symbols
 */
export function searchSymbolsByCategory(
  query: string,
  categories?: SymbolCategory[]
): Array<{
  symbol: SFSymbolMapping
  category: SymbolCategory
  relevanceScore: number
}> {
  const searchTerms = query.toLowerCase().split(/\s+/)
  const results: Array<{ symbol: SFSymbolMapping; category: SymbolCategory; relevanceScore: number }> = []
  
  // Filter symbols by categories if specified
  const symbolsToSearch = categories 
    ? SF_SYMBOLS_MAPPING.filter(mapping => 
        mapping.category && categories.includes(mapping.category as SymbolCategory)
      )
    : SF_SYMBOLS_MAPPING
  
  symbolsToSearch.forEach(mapping => {
    if (!mapping.category) return
    
    const category = mapping.category as SymbolCategory
    const categoryMetadata = CATEGORY_METADATA[category]
    
    let score = 0
    
    // Check symbol name
    const symbolName = mapping.sfSymbol.toLowerCase()
    searchTerms.forEach(term => {
      if (symbolName.includes(term)) score += 10
      if (symbolName === term) score += 20
    })
    
    // Check category keywords
    searchTerms.forEach(term => {
      if (categoryMetadata.keywords.some(keyword => keyword.includes(term))) {
        score += 5
      }
    })
    
    // Check category name and display name
    searchTerms.forEach(term => {
      if (categoryMetadata.name.includes(term)) score += 15
      if (categoryMetadata.displayName.toLowerCase().includes(term)) score += 15
    })
    
    // Check aliases
    if (mapping.aliases) {
      mapping.aliases.forEach(alias => {
        searchTerms.forEach(term => {
          if (alias.toLowerCase().includes(term)) score += 8
        })
      })
    }
    
    if (score > 0) {
      results.push({
        symbol: mapping,
        category,
        relevanceScore: score
      })
    }
  })
  
  // Sort by relevance score (descending)
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

/**
 * Get recommended symbols based on category and context
 * 
 * @param category - Primary category to recommend from
 * @param context - Usage context for more targeted recommendations
 * @param limit - Maximum number of recommendations
 * @returns Array of recommended symbols
 */
export function getRecommendedSymbols(
  category: SymbolCategory,
  context?: string,
  limit: number = 10
): SFSymbolMapping[] {
  const categorySymbols = getSymbolsByCategory(category)
  
  if (!context) {
    // Return most commonly used symbols from category
    return categorySymbols
      .filter(mapping => ['exact', 'close'].includes(mapping.matchQuality))
      .slice(0, limit)
  }
  
  // Context-based filtering
  const contextTerms = context.toLowerCase().split(/\s+/)
  const scoredSymbols = categorySymbols.map(mapping => {
    let score = mapping.matchQuality === 'exact' ? 10 : 
                mapping.matchQuality === 'close' ? 8 : 5
    
    // Boost score if symbol name relates to context
    contextTerms.forEach(term => {
      if (mapping.sfSymbol.toLowerCase().includes(term)) score += 5
      if (mapping.aliases?.some(alias => alias.toLowerCase().includes(term))) score += 3
    })
    
    return { mapping, score }
  })
  
  return scoredSymbols
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.mapping)
}

/**
 * Get category relationships and suggest related categories
 * 
 * @param category - The primary category
 * @returns Array of related categories with relationship strength
 */
export function getRelatedCategories(category: SymbolCategory): Array<{
  category: SymbolCategory
  relationship: 'strong' | 'moderate' | 'weak'
  reason: string
}> {
  const metadata = CATEGORY_METADATA[category]
  
  return metadata.relatedCategories.map(relatedCat => {
    const relatedMetadata = CATEGORY_METADATA[relatedCat]
    
    // Determine relationship strength based on keyword overlap
    const keywordOverlap = metadata.keywords.filter(kw => 
      relatedMetadata.keywords.includes(kw)
    ).length
    
    let relationship: 'strong' | 'moderate' | 'weak'
    let reason: string
    
    if (keywordOverlap >= 2) {
      relationship = 'strong'
      reason = `High keyword overlap (${keywordOverlap} shared keywords)`
    } else if (keywordOverlap === 1) {
      relationship = 'moderate' 
      reason = 'Shared functional context'
    } else {
      relationship = 'weak'
      reason = 'Related usage patterns'
    }
    
    return {
      category: relatedCat,
      relationship,
      reason
    }
  })
}

/**
 * Generate category-based symbol collections
 * Useful for creating organized symbol palettes
 * 
 * @param categories - Categories to include in the collection
 * @param maxPerCategory - Maximum symbols per category
 * @returns Organized symbol collection
 */
export function generateSymbolCollection(
  categories: SymbolCategory[],
  maxPerCategory: number = 20
): Record<string, SFSymbolMapping[]> {
  const collection: Record<string, SFSymbolMapping[]> = {}
  
  categories.forEach(category => {
    const symbols = getSymbolsByCategory(category)
    const metadata = CATEGORY_METADATA[category]
    
    // Prioritize exact matches and commonly used symbols
    const sortedSymbols = symbols
      .sort((a, b) => {
        const scoreA = a.matchQuality === 'exact' ? 2 : 
                       a.matchQuality === 'close' ? 1 : 0
        const scoreB = b.matchQuality === 'exact' ? 2 : 
                       b.matchQuality === 'close' ? 1 : 0
        return scoreB - scoreA
      })
      .slice(0, maxPerCategory)
    
    collection[metadata.displayName] = sortedSymbols
  })
  
  return collection
}