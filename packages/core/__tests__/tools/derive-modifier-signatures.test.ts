import { beforeAll, describe, expect, it } from 'vitest'
import type ts from 'typescript'
import {
  createDerivationProgram,
  deriveModifiers,
  deriveSignatureTables,
  formatSignatureTable,
  SIGNATURE_SOURCES,
  type SignatureSource,
} from '../../scripts/derive-modifier-signatures'
import { buildSignature } from '../../../devtools/src/modifier-metadata'

const FIXTURE = 'packages/core/__tests__/tools/fixtures/modifier-signature-fixture.ts'

const fixtureList: SignatureSource = {
  source: FIXTURE,
  list: 'fixtureRegistrations',
  output: 'unused.ts',
  exportName: 'fixtureSignatures',
  categoriesExportName: 'fixtureCategories',
}

const fixtureNamed: SignatureSource = {
  source: FIXTURE,
  factories: { local: 'localFactory', exported: 'quoted' },
  output: 'unused.ts',
  exportName: 'namedSignatures',
}

function signaturesOf(program: ts.Program, entry: SignatureSource) {
  return Object.fromEntries(
    deriveModifiers(program, entry).map((modifier) => [
      modifier.name,
      modifier.signature,
    ]),
  )
}

describe('buildSignature', () => {
  it('builds the chainable form from parameters', () => {
    expect(buildSignature(undefined)).toBe('(): this')
    expect(buildSignature([])).toBe('(): this')
    expect(
      buildSignature([
        { name: 'value', type: 'number', required: true },
        { name: 'unit', type: 'string', required: false },
      ]),
    ).toBe('(value: number, unit?: string): this')
  })
})

describe('signature derivation from factory declarations', () => {
  let fixture: Record<string, string>

  beforeAll(() => {
    const program = createDerivationProgram([fixtureList, fixtureNamed])
    fixture = signaturesOf(program, fixtureList)
  }, 60_000)

  it('describes an overloaded function by its implementation', () => {
    expect(fixture.overloaded).toBe(
      '(optionsOrValue: Emphasis | number | string): this',
    )
    expect(fixture.alias).toBe(fixture.overloaded)
  })

  it('marks parameters with defaults optional', () => {
    expect(fixture.arrowFactory).toBe('(tone: Tone, amount?: number): this')
  })

  it('names destructured parameters', () => {
    expect(fixture.destructured).toBe(
      '(options: Emphasis, values: number[]): this',
    )
  })

  it('keeps rest parameters', () => {
    expect(fixture.rest).toBe('(...values: Array<string | number>): this')
  })

  it('replaces type parameters with their constraint, or unknown', () => {
    expect(fixture.generic).toBe('(value: string, fallback?: string): this')
    expect(fixture.unconstrained).toBe('(value: unknown): this')
  })

  it('prints a multi-line type on one line with its separators', () => {
    expect(fixture.multiline).toBe(
      '(config: { top?: number; bottom?: number; }): this',
    )
  })

  it('drops a this parameter', () => {
    expect(fixture.noParameters).toBe('(): this')
  })

  it('reads an inline factory', () => {
    expect(fixture.inline).toBe('(label: string): this')
  })

  it('reads a variable through its declared function type', () => {
    expect(fixture.typed).toBe('(level: number, label?: string): this')
  })

  it('resolves named factories, local or exported', () => {
    const program = createDerivationProgram([fixtureNamed])
    expect(signaturesOf(program, fixtureNamed)).toEqual({
      local: '(enabled: boolean): this',
      exported: `(value: 'it\\'s' | "plain"): this`,
    })
  })

  it('reports a factory it cannot find', () => {
    const program = createDerivationProgram([fixtureNamed])
    expect(() =>
      deriveModifiers(program, {
        ...fixtureNamed,
        factories: { missing: 'doesNotExist' },
      }),
    ).toThrow(/does not declare or export doesNotExist/)
    expect(() =>
      deriveModifiers(program, { ...fixtureList, list: 'localFactory' }),
    ).toThrow(/is not an array literal/)
  })
})

describe('generated signature tables', () => {
  it('quotes signatures and lists categories when asked', () => {
    const content = formatSignatureTable(fixtureList, [
      {
        name: 'quoted',
        parameters: [],
        signature: "(value: 'a'): this",
        category: 'custom',
      },
    ])

    expect(content).toContain('// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.')
    expect(content).toContain(
      'export const fixtureSignatures: Readonly<Record<string, string>> = {',
    )
    expect(content).toContain("  quoted: '(value: \\'a\\'): this',")
    expect(content).toContain('export const fixtureCategories')
    expect(content).toContain("  quoted: 'custom',")
  })

  it('keeps a name listed twice once, with the first factory, as the registry does', () => {
    const [table] = deriveSignatureTables([
      {
        source: FIXTURE,
        list: 'duplicateRegistrations',
        output: 'unused.ts',
        exportName: 'duplicateSignatures',
      },
    ])
    expect(table.content.match(/ twice:/g)).toHaveLength(1)
    expect(table.content).toContain("  twice: '(enabled: boolean): this',")
  }, 60_000)
})

describe('first-party signature sources', () => {
  let derived: Map<string, Record<string, string>>

  beforeAll(() => {
    const program = createDerivationProgram()
    derived = new Map(
      SIGNATURE_SOURCES.map((entry) => [
        entry.exportName,
        signaturesOf(program, entry),
      ]),
    )
  }, 120_000)

  it('derives a signature for every registered modifier', () => {
    for (const [exportName, signatures] of derived) {
      expect(Object.keys(signatures).length, exportName).toBeGreaterThan(0)
      for (const [name, signature] of Object.entries(signatures)) {
        expect(signature, `${exportName}.${name}`).toMatch(/^\(.*\): this$/)
      }
    }
  })

  it('covers the representative complex modifiers', () => {
    const basic = derived.get('basicModifierSignatures')!
    expect(basic.overlay).toBe(
      "(content: OverlayContent, alignmentOrOptions?: OverlayAlignment | Signal<OverlayAlignment> | Omit<OverlayOptions, 'content'>): this",
    )
    expect(basic.padding).toBe(
      '(optionsOrAll: ReactivePaddingOptions | PaddingValue | Signal<PaddingValue>): this',
    )
    expect(basic.clipShape).toBe(
      '(shape: ClipShapeName | Shape, parameters?: Record<string, any>): this',
    )
  })

  it('derives from the factory each package actually registers', () => {
    expect(derived.get('coreModifierSignatures')).toEqual({
      alignment: "(value: NonNullable<LayoutModifierProps['alignment']>): this",
      cornerRadius: '(radius: CornerRadiusValue): this',
      layoutPriority: '(value: LayoutPriorityValue): this',
      opacity: '(value: OpacityValue): this',
    })
    expect(derived.get('formsModifierSignatures')?.validation).toBe(
      '(...rules: ValidationArgs[]): this',
    )
    expect(derived.get('responsiveModifierSignatures')?.responsiveProperty).toBe(
      '(property: string, value: ResponsiveValue<unknown>): this',
    )
  })
})
