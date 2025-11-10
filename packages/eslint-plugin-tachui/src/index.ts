import preferDirectModifiers from './rules/prefer-direct-modifiers'
import type { Plugin, RuleModule } from './types'

export const rules: Record<string, RuleModule> = {
  'prefer-direct-modifiers': preferDirectModifiers,
}

const plugin: Plugin = {
  rules,
}

export default plugin
