export type TemplateId = 'basic' | 'advanced'

export interface TemplateDefinition {
  id: TemplateId
  name: string
  description: string
  features: string[]
  directoryName: string
}

const TEMPLATE_DEFINITIONS: Record<TemplateId, TemplateDefinition> = {
  basic: {
    id: 'basic',
    name: 'Basic TachUI App',
    description: 'Minimal TachUI application with core components',
    features: ['Core components', 'Single-page starter', 'Vite + TypeScript'],
    directoryName: 'basic',
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced TachUI App',
    description: 'Starter with reactive state and richer component structure',
    features: ['State management', 'Structured app layout', 'Extended starter patterns'],
    directoryName: 'advanced',
  },
}

export function getTemplateDefinition(templateId: string): TemplateDefinition | undefined {
  if (templateId in TEMPLATE_DEFINITIONS) {
    return TEMPLATE_DEFINITIONS[templateId as TemplateId]
  }

  return undefined
}

export function listTemplateDefinitions(): TemplateDefinition[] {
  return Object.values(TEMPLATE_DEFINITIONS)
}
