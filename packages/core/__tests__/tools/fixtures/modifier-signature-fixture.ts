/**
 * Factories in each form the signature deriver reads, registered the way the
 * first-party lists register theirs.
 */

type Tone = 'soft' | 'loud'

interface Emphasis {
  weight: number
}

export function overloaded(options: Emphasis): object
export function overloaded(value: number | string): object
export function overloaded(optionsOrValue: Emphasis | number | string): object {
  return { optionsOrValue }
}

const arrowFactory = (tone: Tone, amount = 1): object => ({ tone, amount })

function destructured({ weight }: Emphasis, [first]: number[]): object {
  return { weight, first }
}

function rest(...values: Array<string | number>): object {
  return { values }
}

function generic<Value extends string>(value: Value, fallback?: Value): object {
  return { value, fallback }
}

function unconstrained<Value>(value: Value): object {
  return { value }
}

function multiline(config: {
  top?: number
  bottom?: number
}): object {
  return config
}

function noParameters(this: unknown): object {
  return {}
}

export function quoted(value: 'it\'s' | "plain"): object {
  return { value }
}

type LevelFactory = (level: number, label?: string) => object

const makeLevelFactory = (): LevelFactory => (level, label) => ({ level, label })

const typedFactory: LevelFactory = makeLevelFactory()

export const fixtureRegistrations = [
  ['typed', typedFactory],
  ['overloaded', overloaded],
  ['arrowFactory', arrowFactory],
  ['destructured', destructured],
  ['rest', rest],
  ['generic', generic],
  ['unconstrained', unconstrained],
  ['multiline', multiline],
  ['noParameters', noParameters],
  ['inline', (label: string) => ({ label })],
  ['quoted', quoted],
  ['alias', overloaded],
] as const

export const localFactory = (enabled: boolean): object => ({ enabled })

export const duplicateRegistrations = [
  ['twice', localFactory],
  ['twice', arrowFactory],
] as const
