import preferDirectModifiers from './rules/prefer-direct-modifiers.js'
import type { Plugin, RuleModule } from './types.js'

export const rules: Record<string, RuleModule> = {
  'prefer-direct-modifiers': preferDirectModifiers,
}

const plugin: Plugin = {
  rules,
}

export default plugin
