import type { ComponentInstance } from '@tachui/types/runtime'
import type { ModifierMethodsOf } from '@tachui/types/modifiers'
import type { validation } from './validation'
import type { placeholder } from './placeholder'
import type { required } from './required'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerValidationModifier } from './validation'
import { registerPlaceholderModifier } from './placeholder'
import { registerRequiredModifier } from './required'
import { TACHUI_PACKAGE_VERSION } from '../version'

type FormsModifierRegistration = (
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
) => void

const FORMS_PLUGIN_INFO: PluginInfo = {
  name: '@tachui/forms',
  version: TACHUI_PACKAGE_VERSION,
  author: 'TachUI Team',
  verified: true,
}

const registrations: FormsModifierRegistration[] = [
  registerValidationModifier,
  registerPlaceholderModifier,
  registerRequiredModifier,
]

let registered = false

export interface RegisterFormsModifiersOptions {
  registry?: ModifierRegistry
  plugin?: PluginInfo
  force?: boolean
}

export function registerFormsModifiers(
  options?: RegisterFormsModifiersOptions,
): void {
  const targetRegistry = options?.registry
  const targetPlugin = options?.plugin ?? FORMS_PLUGIN_INFO
  const shouldForce = options?.force === true
  const isCustomTarget = Boolean(targetRegistry || options?.plugin)

  if (!isCustomTarget && registered && !shouldForce) {
    return
  }

  registrations.forEach(register =>
    register(targetRegistry, targetPlugin),
  )

  if (!isCustomTarget) {
    registered = true
  }
}

registerFormsModifiers()

// Type the forms modifiers on the builder, from their factories, so they
// typecheck exactly when this module has registered them.
declare module '@tachui/types/modifiers' {
  interface ModifierBuilder<T extends ComponentInstance = ComponentInstance>
    extends ModifierMethodsOf<{ validation: typeof validation; placeholder: typeof placeholder; required: typeof required }> {}
}

export {
  validation,
} from './validation'
export {
  placeholder,
} from './placeholder'
export {
  required,
} from './required'

if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
  ;(import.meta as any).hot.accept(() => {
    registerFormsModifiers({ force: true })
  })
}
