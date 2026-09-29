import type { ModifierParameterRegistry } from './modifier-parameter-system'

type ModifierSignature = ReturnType<ModifierParameterRegistry['getAllModifiers']>[number]

/**
 * The part of a documented modifier parameter that a signature is built from.
 * The signature deriver in `packages/core/scripts` produces the same shape
 * from each registered factory's declaration.
 */
export type SignatureParameter = Pick<
  ModifierSignature['parameters'][number],
  'name' | 'type' | 'required'
>

/**
 * Build the metadata signature for a modifier from its parameters, in the
 * `(name: Type, other?: Type): this` form.
 */
export function buildSignature(
  parameters: readonly SignatureParameter[] | undefined,
): string {
  if (!parameters || parameters.length === 0) {
    return '(): this'
  }

  const parts = parameters.map((param) => {
    const name = param.name || 'arg'
    const optional = param.required === false ? '?' : ''
    const type = param.type || 'any'
    return `${name}${optional}: ${type}`
  })

  return `(${parts.join(', ')}): this`
}
