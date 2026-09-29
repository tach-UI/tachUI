/**
 * Derive modifier metadata signatures from the registered factories.
 *
 * Every first-party modifier registers with metadata carrying a `signature`,
 * which tooling such as devtools and the CLI reads. Writing those strings by
 * hand drifted from the factories they described, so they are derived
 * instead: the TypeScript compiler reads each factory's declared parameters,
 * the devtools `buildSignature` turns them into the
 * `(name: Type, other?: Type): this` form, and the result is written to a
 * table beside the list that registers the factories. The registration reads
 * its signatures from that table.
 *
 * Chain methods are not typed from these tables: each registering package
 * augments `ModifierBuilder` from its factories directly.
 *
 * An overloaded factory is described by its implementation signature, which
 * accepts every overload's arguments.
 *
 * Run through `derive-modifier-signatures`; `--check` compares instead of
 * writing and exits non-zero when a table is stale.
 */

import { promises as fs } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

import {
  buildSignature,
  type SignatureParameter,
} from '../../devtools/src/modifier-metadata'

type ModifierCategory =
  | 'layout'
  | 'appearance'
  | 'interaction'
  | 'animation'
  | 'accessibility'
  | 'custom'

export interface SignatureSource {
  /** Module that registers the factories, relative to the repository root. */
  source: string
  /** An exported `[name, factory, ...]` registration list in `source`. */
  list?: string
  /**
   * Modifier name to the factory it registers: a declaration in `source`, or
   * in another module when the registration is split across files.
   */
  factories?: Record<string, string | FactoryLocation>
  /** Generated table, relative to the repository root. */
  output: string
  /** Name of the exported signature table. */
  exportName: string
  /**
   * Also export `<exportName>` categories, taken from the directory each
   * factory is declared in. For lists that carry no metadata of their own.
   */
  categoriesExportName?: string
}

export interface FactoryLocation {
  source: string
  factory: string
}

export interface DerivedModifier {
  name: string
  parameters: SignatureParameter[]
  signature: string
  category: ModifierCategory
}

export const REPO_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../..',
)

export const SIGNATURE_SOURCES: SignatureSource[] = [
  {
    source: 'packages/modifiers/src/basic/index.ts',
    list: 'basicModifierRegistrations',
    output: 'packages/modifiers/src/basic/signatures.generated.ts',
    exportName: 'basicModifierSignatures',
    categoriesExportName: 'basicModifierCategories',
  },
  {
    source: 'packages/modifiers/src/effects/index.ts',
    list: 'effectRegistrations',
    output: 'packages/modifiers/src/effects/signatures.generated.ts',
    exportName: 'effectModifierSignatures',
    categoriesExportName: 'effectModifierCategories',
  },
  {
    source: 'packages/modifiers/src/preload/filters.ts',
    list: 'filterRegistrations',
    output: 'packages/modifiers/src/preload/filters.signatures.generated.ts',
    exportName: 'filterModifierSignatures',
    categoriesExportName: 'filterModifierCategories',
  },
  {
    source: 'packages/modifiers/src/preload/shadows.ts',
    list: 'shadowRegistrations',
    output: 'packages/modifiers/src/preload/shadows.signatures.generated.ts',
    exportName: 'shadowModifierSignatures',
    categoriesExportName: 'shadowModifierCategories',
  },
  {
    source: 'packages/modifiers/src/preload/transforms.ts',
    list: 'transformRegistrations',
    output: 'packages/modifiers/src/preload/transforms.signatures.generated.ts',
    exportName: 'transformModifierSignatures',
    categoriesExportName: 'transformModifierCategories',
  },
  {
    source: 'packages/modifiers/src/preload/backdrop.ts',
    list: 'backdropRegistrations',
    output: 'packages/modifiers/src/preload/backdrop.signatures.generated.ts',
    exportName: 'backdropModifierSignatures',
    categoriesExportName: 'backdropModifierCategories',
  },
  {
    source: 'packages/responsive/src/modifiers/responsive/index.ts',
    list: 'responsiveRegistrations',
    output:
      'packages/responsive/src/modifiers/responsive/signatures.generated.ts',
    exportName: 'responsiveModifierSignatures',
  },
  {
    source: 'packages/grid/src/modifiers/grid.ts',
    list: 'gridModifierRegistrations',
    output: 'packages/grid/src/modifiers/signatures.generated.ts',
    exportName: 'gridModifierSignatures',
  },
  {
    source: 'packages/viewport/src/modifiers/index.ts',
    factories: { onAppear: 'onAppear', onDisappear: 'onDisappear' },
    output: 'packages/viewport/src/modifiers/signatures.generated.ts',
    exportName: 'viewportModifierSignatures',
  },
  {
    source: 'packages/mobile/src/modifiers/index.ts',
    factories: { refreshable: 'refreshable' },
    output: 'packages/mobile/src/modifiers/signatures.generated.ts',
    exportName: 'mobileModifierSignatures',
  },
  {
    source: 'packages/forms/src/modifiers/index.ts',
    factories: {
      validation: 'validation',
      placeholder: 'placeholder',
      required: 'required',
    },
    output: 'packages/forms/src/modifiers/signatures.generated.ts',
    exportName: 'formsModifierSignatures',
  },
  {
    source: 'packages/fragments/src/modifiers.ts',
    factories: { interactive: 'interactive', snapshot: 'snapshot' },
    output: 'packages/fragments/src/modifier-signatures.generated.ts',
    exportName: 'fragmentModifierSignatures',
  },
  {
    source: 'packages/core/src/modifiers/alignment.ts',
    factories: {
      alignment: 'alignmentFactory',
      cornerRadius: {
        source: 'packages/core/src/modifiers/corner-radius.ts',
        factory: 'cornerRadiusFactory',
      },
      layoutPriority: {
        source: 'packages/core/src/modifiers/layout-priority.ts',
        factory: 'layoutPriorityFactory',
      },
      opacity: {
        source: 'packages/core/src/modifiers/opacity.ts',
        factory: 'opacityFactory',
      },
    },
    output: 'packages/core/src/modifiers/signatures.generated.ts',
    exportName: 'coreModifierSignatures',
  },
]

function sourceFilesOf(entry: SignatureSource): string[] {
  const files = [entry.source]
  for (const location of Object.values(entry.factories ?? {})) {
    if (typeof location !== 'string') files.push(location.source)
  }
  return files
}

/**
 * Where a factory is declared decides its category, for the lists in
 * `@tachui/modifiers` that register without metadata of their own.
 */
const CATEGORY_BY_DIRECTORY: Record<string, ModifierCategory> = {
  layout: 'layout',
  basic: 'layout',
  appearance: 'appearance',
  typography: 'appearance',
  effects: 'appearance',
  interaction: 'interaction',
  animation: 'animation',
  attributes: 'accessibility',
}

/**
 * Resolve `@tachui/<package>` and its subpaths to source, so a factory is read
 * from what its author declared rather than from emitted declarations.
 */
function sourcePaths(): Record<string, string[]> {
  const paths: Record<string, string[]> = {}
  const packages = [
    'core',
    'types',
    'registry',
    'modifiers',
    'primitives',
    'responsive',
    'grid',
    'viewport',
    'mobile',
    'forms',
    'fragments',
    'navigation',
    'devtools',
  ]
  for (const name of packages) {
    paths[`@tachui/${name}`] = [`packages/${name}/src/index.ts`]
    paths[`@tachui/${name}/*`] = [`packages/${name}/src/*`]
  }
  return paths
}

export function createDerivationProgram(
  sources: SignatureSource[] = SIGNATURE_SOURCES,
): ts.Program {
  return ts.createProgram({
    rootNames: sources
      .flatMap(sourceFilesOf)
      .map((source) => resolve(REPO_ROOT, source)),
    options: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      allowImportingTsExtensions: true,
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
      baseUrl: REPO_ROOT,
      paths: sourcePaths(),
    },
  })
}

/**
 * Derive every modifier of one source: its parameters, the signature built
 * from them, and the category its declaring directory implies.
 */
export function deriveModifiers(
  program: ts.Program,
  entry: SignatureSource,
): DerivedModifier[] {
  const checker = program.getTypeChecker()
  const file = program.getSourceFile(resolve(REPO_ROOT, entry.source))
  if (!file) {
    throw new Error(`Cannot read ${entry.source}`)
  }

  const factories = entry.list
    ? listFactories(checker, file, entry.list)
    : namedFactories(program, entry)

  return factories.map((reference) => {
    const declaration = factoryDeclaration(checker, reference)
    const typeParameters = typeParametersOf(declaration)
    const parameters = declaration.parameters
      .filter(
        (parameter) =>
          !(ts.isIdentifier(parameter.name) && parameter.name.text === 'this'),
      )
      .map((parameter) =>
        describeParameter(checker, parameter, typeParameters),
      )
    return {
      name: reference.name,
      parameters,
      signature: buildSignature(parameters),
      category: categoryOf(declaration),
    }
  })
}

/**
 * A registered name and where its factory is declared: every declaration of
 * the symbol, or the inline function registered directly.
 */
interface FactoryReference {
  name: string
  declarations: readonly ts.Node[]
}

function listFactories(
  checker: ts.TypeChecker,
  file: ts.SourceFile,
  listName: string,
): FactoryReference[] {
  const initializer = unwrap(findVariable(file, listName)?.initializer)
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${file.fileName}: ${listName} is not an array literal`)
  }

  return initializer.elements.map((element) => {
    if (
      !ts.isArrayLiteralExpression(element) ||
      element.elements.length < 2 ||
      !ts.isStringLiteralLike(element.elements[0])
    ) {
      throw new Error(
        `${file.fileName}: every ${listName} entry must be [name, factory, ...]`,
      )
    }
    const factory = unwrap(element.elements[1])
    if (
      factory &&
      (ts.isArrowFunction(factory) || ts.isFunctionExpression(factory))
    ) {
      return { name: element.elements[0].text, declarations: [factory] }
    }
    const symbol = checker.getSymbolAtLocation(element.elements[1])
    return {
      name: element.elements[0].text,
      declarations: symbol
        ? (resolveAlias(checker, symbol).declarations ?? [])
        : [],
    }
  })
}

function unwrap(
  expression: ts.Expression | undefined,
): ts.Expression | undefined {
  let current = expression
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression
  }
  return current
}

/**
 * Resolve each named factory as a module-level declaration or an export of
 * its module, following re-exports to where it is declared.
 */
function namedFactories(
  program: ts.Program,
  entry: SignatureSource,
): FactoryReference[] {
  const checker = program.getTypeChecker()

  return Object.entries(entry.factories ?? {}).map(([name, location]) => {
    const { source, factory } =
      typeof location === 'string'
        ? { source: entry.source, factory: location }
        : location
    const file = program.getSourceFile(resolve(REPO_ROOT, source))
    if (!file) {
      throw new Error(`Cannot read ${source}`)
    }

    const variable = findVariable(file, factory)
    const functions = file.statements.filter(
      (statement) =>
        ts.isFunctionDeclaration(statement) && statement.name?.text === factory,
    )
    if (variable || functions.length > 0) {
      return { name, declarations: variable ? [variable] : functions }
    }

    const moduleSymbol = checker.getSymbolAtLocation(file)
    const symbol = moduleSymbol
      ? checker
          .getExportsOfModule(moduleSymbol)
          .find((candidate) => candidate.name === factory)
      : undefined
    if (!symbol) {
      throw new Error(`${source} does not declare or export ${factory}`)
    }
    return {
      name,
      declarations: resolveAlias(checker, symbol).declarations ?? [],
    }
  })
}

function findVariable(
  file: ts.SourceFile,
  name: string,
): ts.VariableDeclaration | undefined {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        return declaration
      }
    }
  }
  return undefined
}

function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol
}

/**
 * Find the declaration whose parameters describe a factory: the
 * implementation of a function (so every overload's arguments are accepted),
 * the function a variable is initialised with, or the variable's single call
 * signature.
 */
function factoryDeclaration(
  checker: ts.TypeChecker,
  reference: FactoryReference,
): ts.SignatureDeclaration {
  const { declarations, name } = reference

  for (const declaration of declarations) {
    if (ts.isArrowFunction(declaration) || ts.isFunctionExpression(declaration)) {
      return declaration
    }
  }

  const functions = declarations.filter(ts.isFunctionDeclaration)
  if (functions.length > 0) {
    return functions.find((declaration) => declaration.body) ?? functions[0]
  }

  for (const declaration of declarations) {
    if (!ts.isVariableDeclaration(declaration)) continue
    const initializer = unwrap(declaration.initializer)
    if (
      initializer &&
      (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
    ) {
      return initializer
    }
    const signatures = checker
      .getTypeAtLocation(declaration)
      .getCallSignatures()
    const signature = signatures.length === 1 ? signatures[0].declaration : undefined
    if (signature && !ts.isJSDocSignature(signature)) {
      return signature
    }
  }

  throw new Error(`Cannot find the factory declaration for modifier '${name}'`)
}


const printer = ts.createPrinter({ removeComments: true })

/**
 * Print a declared parameter type on one line. A type parameter of the
 * factory has no meaning outside it, so it is replaced by its constraint, or
 * `unknown` when it has none.
 */
function printType(
  node: ts.TypeNode,
  typeParameters: ReadonlyMap<string, ts.TypeNode>,
): string {
  const result = ts.transform(node, [
    (context) => (root) => {
      const visit = (child: ts.Node): ts.Node => {
        if (
          ts.isTypeReferenceNode(child) &&
          ts.isIdentifier(child.typeName) &&
          typeParameters.has(child.typeName.text)
        ) {
          return typeParameters.get(child.typeName.text)!
        }
        return ts.visitEachChild(child, visit, context)
      }
      return ts.visitNode(root, visit) as ts.TypeNode
    },
  ])
  const text = printer.printNode(
    ts.EmitHint.Unspecified,
    result.transformed[0],
    node.getSourceFile(),
  )
  result.dispose()
  return text.replace(/\s+/g, ' ').trim()
}

function typeParametersOf(
  declaration: ts.SignatureDeclaration,
): Map<string, ts.TypeNode> {
  const substitutions = new Map<string, ts.TypeNode>()
  for (const parameter of declaration.typeParameters ?? []) {
    substitutions.set(
      parameter.name.text,
      parameter.constraint ??
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
    )
  }
  return substitutions
}

function describeParameter(
  checker: ts.TypeChecker,
  parameter: ts.ParameterDeclaration,
  typeParameters: ReadonlyMap<string, ts.TypeNode>,
): SignatureParameter {
  const rest = parameter.dotDotDotToken !== undefined
  const baseName = ts.isIdentifier(parameter.name)
    ? parameter.name.text
    : ts.isObjectBindingPattern(parameter.name)
      ? 'options'
      : 'values'

  const type = parameter.type
    ? printType(parameter.type, typeParameters)
    : checker.typeToString(
        checker.getTypeAtLocation(parameter),
        undefined,
        ts.TypeFormatFlags.NoTruncation,
      )

  return {
    name: rest ? `...${baseName}` : baseName,
    type,
    required:
      rest ||
      (parameter.questionToken === undefined &&
        parameter.initializer === undefined),
  }
}

function categoryOf(declaration: ts.Node): ModifierCategory {
  const path = relative(REPO_ROOT, declaration.getSourceFile().fileName)
  const match = /^packages\/[^/]+\/src\/([^/]+)\//.exec(path)
  return (match && CATEGORY_BY_DIRECTORY[match[1]]) ?? 'custom'
}

/**
 * Render one generated table module.
 */
export function formatSignatureTable(
  entry: SignatureSource,
  modifiers: DerivedModifier[],
): string {
  const origin = entry.list ?? 'the factories it registers'
  const lines = [
    '// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.',
    `// Signatures derived from ${origin} in ${entry.source}`,
    '// by packages/core/scripts/derive-modifier-signatures.ts.',
    '// Run `bun run --filter @tachui/core derive-modifier-signatures` to regenerate.',
    '',
    `export const ${entry.exportName}: Readonly<Record<string, string>> = {`,
  ]
  for (const modifier of modifiers) {
    lines.push(`  ${modifier.name}: ${quote(modifier.signature)},`)
  }
  lines.push('}')

  if (entry.categoriesExportName) {
    lines.push('')
    lines.push(
      `export const ${entry.categoriesExportName}: Readonly<Record<string, 'layout' | 'appearance' | 'interaction' | 'animation' | 'accessibility' | 'custom'>> = {`,
    )
    for (const modifier of modifiers) {
      lines.push(`  ${modifier.name}: ${quote(modifier.category)},`)
    }
    lines.push('}')
  }

  lines.push('')
  return lines.join('\n')
}

function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

export interface DeriveResult {
  output: string
  content: string
}

/**
 * Derive every table. Duplicate names inside one list (aliases such as
 * `elementId` for `id`) are kept once, as the registry keeps them.
 */
export function deriveSignatureTables(
  sources: SignatureSource[] = SIGNATURE_SOURCES,
): DeriveResult[] {
  const program = createDerivationProgram(sources)
  return sources.map((entry) => {
    const seen = new Set<string>()
    const modifiers = deriveModifiers(program, entry).filter((modifier) => {
      if (seen.has(modifier.name)) return false
      seen.add(modifier.name)
      return true
    })
    return {
      output: resolve(REPO_ROOT, entry.output),
      content: formatSignatureTable(entry, modifiers),
    }
  })
}

/**
 * Write the derived tables, or with `check` report the ones that differ from
 * what is committed. Returns the number of stale tables.
 */
export async function writeSignatureTables(
  options: { check?: boolean } = {},
): Promise<number> {
  let stale = 0
  for (const { output, content } of deriveSignatureTables()) {
    let existing: string | null = null
    try {
      existing = await fs.readFile(output, 'utf8')
    } catch {
      existing = null
    }
    if (existing === content) continue

    if (options.check) {
      console.error(
        `❌ ${relative(process.cwd(), output)} is stale. Re-run derive-modifier-signatures.`,
      )
      stale++
    } else {
      await fs.writeFile(output, content, 'utf8')
    }
  }
  return stale
}

const executedAsScript =
  typeof process.argv[1] === 'string' &&
  pathToFileURL(process.argv[1]).href === import.meta.url

if (executedAsScript) {
  const check = process.argv.includes('--check')
  writeSignatureTables({ check })
    .then((stale) => {
      if (stale > 0) process.exitCode = 1
    })
    .catch((error) => {
      console.error('❌ Failed to derive modifier signatures.')
      console.error(error)
      process.exitCode = 1
    })
}
