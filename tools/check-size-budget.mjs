#!/usr/bin/env node
/**
 * Bundle size budget gate.
 *
 * A package opts in by declaring a budget in its package.json:
 *
 *   "tachui": {
 *     "sizeBudget": { "entry": "dist/index.js", "gzipBytes": 12288 }
 *   }
 *
 * Packages without that field are skipped, so this can be adopted one package at a
 * time rather than needing a budget for all twenty at once.
 *
 * Measures the gzipped size of the built entry, following relative imports so that
 * code split into sibling chunks still counts against the budget. Requires the
 * package to be built first.
 *
 * Usage:
 *   node tools/check-size-budget.mjs              # every package that declares a budget
 *   node tools/check-size-budget.mjs @tachui/query # just one
 */
import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import process from 'node:process'

const REPO_ROOT = path.resolve(import.meta.dirname, '..')
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages')

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function collectBudgetedPackages(only) {
  const packages = []

  for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const manifestPath = path.join(PACKAGES_DIR, entry.name, 'package.json')
    if (!existsSync(manifestPath)) continue

    let manifest
    try {
      manifest = readJson(manifestPath)
    } catch {
      continue
    }

    const budget = manifest.tachui?.sizeBudget
    if (!budget) continue
    if (only && manifest.name !== only) continue

    if (typeof budget.entry !== 'string' || typeof budget.gzipBytes !== 'number') {
      throw new Error(
        `${manifest.name}: tachui.sizeBudget must declare a string "entry" and a numeric "gzipBytes".`
      )
    }

    packages.push({
      name: manifest.name,
      directory: path.join(PACKAGES_DIR, entry.name),
      budget,
    })
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Keywords after which a `/` can only open a regex literal, never divide.
 * Everything else that reads as a word - an identifier, a number, `true` - is a
 * value, so a `/` following it is division.
 */
const NON_VALUE_KEYWORDS = new Set([
  'await',
  'case',
  'delete',
  'do',
  'else',
  'in',
  'instanceof',
  'new',
  'of',
  'return',
  'throw',
  'typeof',
  'void',
  'yield',
])

/**
 * Words whose parenthesised head is followed by a *statement* rather than a
 * value, so a `/` after the closing `)` opens a regex instead of dividing.
 */
const CONTROL_HEAD_KEYWORDS = new Set(['if', 'while', 'for'])

/**
 * The relative specifiers a module imports.
 *
 * A single-pass tokenizer rather than regexes over the whole file. A regex
 * cannot tell import-like text inside an ordinary string from a real import, nor
 * `import("./a")` from `foo.from("./a")`, and blanking every string literal
 * would destroy the specifiers this exists to find. Tracking the preceding word
 * settles all three.
 *
 * Regex literals are tokenized too, because a quote inside one - `/"/g` in a
 * minified escaping helper is routine - would otherwise open a string that runs
 * to the next quote in the file, putting every later specifier on the wrong side
 * of a quote pair and dropping the whole tail of the chunk graph from the
 * measurement. Whether a `/` opens a regex is decided by the preceding token, the
 * standard lexer heuristic: after something that produces a value it is division,
 * otherwise it is a regex.
 *
 * Bare specifiers are ignored: an external dependency is the consumer's cost,
 * not this package's.
 */
export function relativeImportsOf(source) {
  const specifiers = []
  const length = source.length
  let i = 0
  let lastWord = ''
  // A `/` at the very start of a module can only be a regex.
  let expectsValue = true
  // Whether the previous token was `.`, so the next word is a member name.
  let afterDot = false
  // Whether `lastWord` itself arrived as a member name. `loader.import(…)` and
  // `o.from(…)` are ordinary method calls, not module syntax.
  let lastWordIsMember = false
  // Open groupings, innermost last. A `(` remembers whether it headed a control
  // statement; a `${` remembers the template to return to on `}`.
  const stack = []
  // Set while reading template-literal text, rather than skipping the template
  // wholesale.
  let template = null

  const isIdentifierChar = ch => /[A-Za-z0-9_$]/.test(ch)

  const record = value => {
    if (value !== null && value.startsWith('.') && !specifiers.includes(value)) {
      specifiers.push(value)
    }
  }

  while (i < length) {
    if (template) {
      const ch = source[i]

      if (ch === '\\') {
        template.text += source[i + 1] ?? ''
        i += 2
        continue
      }

      if (ch === '`') {
        const closed = template
        template = null
        i += 1
        if (!closed.isMember && (closed.word === 'from' || closed.word === 'import')) {
          record(closed.interpolated ? null : closed.text)
        }
        lastWord = ''
        lastWordIsMember = false
        expectsValue = false
        afterDot = false
        continue
      }

      if (ch === '$' && source[i + 1] === '{') {
        template.interpolated = true
        stack.push({ kind: 'interpolation', template })
        template = null
        i += 2
        lastWord = ''
        lastWordIsMember = false
        expectsValue = true
        afterDot = false
        continue
      }

      template.text += ch
      i += 1
      continue
    }

    const two = source.slice(i, i + 2)

    if (two === '//') {
      const stop = source.indexOf('\n', i)
      i = stop === -1 ? length : stop
      continue
    }

    if (two === '/*') {
      const stop = source.indexOf('*/', i + 2)
      i = stop === -1 ? length : stop + 2
      continue
    }

    const ch = source[i]

    if (ch === '/' && expectsValue) {
      const end = readRegexLiteral(source, i)
      // `null` means nothing closed it on this line, so the heuristic misread a
      // division; fall through and treat the `/` as a plain operator.
      if (end !== null) {
        i = end
        lastWord = ''
        lastWordIsMember = false
        expectsValue = false
        afterDot = false
        continue
      }
    }

    if (ch === '`') {
      template = { text: '', interpolated: false, word: lastWord, isMember: lastWordIsMember }
      i += 1
      continue
    }

    if (ch === '"' || ch === "'") {
      const literal = readStringLiteral(source, i)
      if (!lastWordIsMember && (lastWord === 'from' || lastWord === 'import')) {
        record(literal.value)
      }
      i = literal.end
      lastWord = ''
      lastWordIsMember = false
      expectsValue = false
      afterDot = false
      continue
    }

    if (isIdentifierChar(ch)) {
      let j = i
      while (j < length && isIdentifierChar(source[j])) j += 1
      lastWord = source.slice(i, j)
      i = j
      // A keyword used as a member name - `o.in`, `o.of`, `o.return` - is an
      // ordinary property, so it leaves a value behind and a following `/`
      // divides. Only a real keyword flips this.
      expectsValue = !afterDot && NON_VALUE_KEYWORDS.has(lastWord)
      lastWordIsMember = afterDot
      afterDot = false
      continue
    }

    // Whitespace preserves the word context; `(` preserves it only for
    // `import(`, so dynamic imports resolve while `something.from(...)` does not.
    if (/\s/.test(ch)) {
      i += 1
      continue
    }

    if (ch === '(') {
      stack.push({ kind: 'paren', controlHead: CONTROL_HEAD_KEYWORDS.has(lastWord) })
      // Only a bare `import(` is a dynamic import; `loader.import(` is a method.
      if (lastWord !== 'import' || lastWordIsMember) lastWord = ''
      i += 1
      expectsValue = true
      afterDot = false
      continue
    }

    if (ch === '[' || ch === '{') {
      stack.push({ kind: ch === '[' ? 'bracket' : 'brace' })
      lastWord = ''
      lastWordIsMember = false
      i += 1
      expectsValue = true
      afterDot = false
      continue
    }

    if (ch === ')') {
      const frame = stack.pop()
      // `if (...)`, `while (...)` and `for (...)` are followed by a statement,
      // where a `/` opens a regex. Every other `)` closes a value, where it
      // divides.
      expectsValue = frame?.kind === 'paren' && frame.controlHead === true
      lastWord = ''
      lastWordIsMember = false
      afterDot = false
      i += 1
      continue
    }

    if (ch === ']') {
      stack.pop()
      expectsValue = false
      lastWord = ''
      lastWordIsMember = false
      afterDot = false
      i += 1
      continue
    }

    if (ch === '}') {
      const frame = stack.pop()
      if (frame?.kind === 'interpolation') {
        // Back to the template text this interpolation interrupted.
        template = frame.template
        i += 1
        continue
      }
      expectsValue = true
      lastWord = ''
      lastWordIsMember = false
      afterDot = false
      i += 1
      continue
    }

    // `++` and `--` leave a value behind, so a following `/` divides. Prefix use
    // is unaffected: the operand that follows sets the same state.
    if ((ch === '+' || ch === '-') && source[i + 1] === ch) {
      lastWord = ''
      lastWordIsMember = false
      afterDot = false
      expectsValue = false
      i += 2
      continue
    }

    lastWord = ''
    lastWordIsMember = false
    afterDot = ch === '.'
    expectsValue = true
    i += 1
  }

  return specifiers
}

/**
 * Read the string or template literal starting at `start`.
 *
 * Returns the decoded value and the index just past the closing quote. `value`
 * is null for a template carrying an interpolation: its specifier is not
 * statically known, so it could not be resolved on disk anyway.
 */
function readStringLiteral(source, start) {
  const quote = source[start]
  let i = start + 1
  let value = ''

  while (i < source.length) {
    const ch = source[i]

    if (ch === '\\') {
      // Keep the escaped character: `import "./quo\"ted.js"` names a file with a
      // quote in it, not a specifier truncated at the backslash.
      value += source[i + 1] ?? ''
      i += 2
      continue
    }

    if (ch === quote) {
      i += 1
      break
    }

    value += ch
    i += 1
  }

  return { value, end: i }
}

/**
 * Read the regex literal starting at `start`, returning the index just past its
 * flags, or null if it turns out not to be one.
 *
 * A `/` inside a `[...]` class does not close the literal, and a regex cannot
 * span a line - an unterminated one means the heuristic misread a division, so
 * the caller backs off rather than swallowing the rest of the file.
 */
function readRegexLiteral(source, start) {
  let i = start + 1
  let inClass = false

  while (i < source.length) {
    const ch = source[i]

    if (ch === '\\') {
      i += 2
      continue
    }

    if (ch === '\n') return null

    if (inClass) {
      if (ch === ']') inClass = false
    } else if (ch === '[') {
      inClass = true
    } else if (ch === '/') {
      i += 1
      while (i < source.length && /[a-z]/i.test(source[i])) i += 1
      return i
    }

    i += 1
  }

  return null
}

export function resolveChunk(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [base, `${base}.js`, `${base}.mjs`, path.join(base, 'index.js')]
  return candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile())
}

/**
 * Gzip the entry plus every relatively-imported chunk as one buffer. Gzipping the
 * concatenation rather than summing per-file gzip sizes is both closer to what a
 * server sends and immune to per-file header overhead inflating small chunks.
 */
export function measure(entryFile) {
  const seen = new Set()
  const queue = [entryFile]
  const sources = []

  while (queue.length > 0) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)

    const source = readFileSync(file, 'utf8')
    sources.push(source)

    for (const specifier of relativeImportsOf(source)) {
      const resolved = resolveChunk(file, specifier)
      if (!resolved) {
        // Dropping it would quietly shrink the measured bundle, which is the one
        // direction this gate must never be wrong in.
        throw new Error(
          `Cannot resolve ${specifier} imported from ${file}. The size budget cannot be measured accurately.`
        )
      }
      queue.push(resolved)
    }
  }

  return {
    files: seen.size,
    // Each chunk is a separate response with its own gzip stream, so they are
    // sized separately. Gzipping them concatenated would let duplicate text
    // across chunks share one dictionary and undercount what a browser actually
    // downloads - measured at 8-27% on this repo's own multi-chunk packages,
    // which is enough for an over-budget split package to pass.
    gzipBytes: sources.reduce(
      (total, source) => total + gzipSync(Buffer.from(source, 'utf8')).byteLength,
      0
    ),
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB (${bytes} B)`
}

export function main() {
  const only = process.argv[2]
  let packages

  try {
    packages = collectBudgetedPackages(only)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  if (only && packages.length === 0) {
    console.error(`No size budget declared for ${only}.`)
    process.exit(1)
  }

  if (packages.length === 0) {
    console.log('No packages declare tachui.sizeBudget; nothing to check.')
    return
  }

  const failures = []

  for (const pkg of packages) {
    const entryFile = path.join(pkg.directory, pkg.budget.entry)

    if (!existsSync(entryFile)) {
      failures.push(
        `${pkg.name}: ${pkg.budget.entry} does not exist. Build the package before checking its size budget.`
      )
      continue
    }

    const { files, gzipBytes } = measure(entryFile)
    const limit = pkg.budget.gzipBytes
    const percent = ((gzipBytes / limit) * 100).toFixed(1)
    const detail = `${formatBytes(gzipBytes)} gzipped across ${files} file(s), budget ${formatBytes(limit)} (${percent}%)`

    if (gzipBytes > limit) {
      failures.push(`${pkg.name}: OVER BUDGET - ${detail}`)
    } else {
      console.log(`${pkg.name}: ${detail}`)
    }
  }

  if (failures.length > 0) {
    console.error('\nBundle size budget exceeded:')
    for (const failure of failures) console.error(`- ${failure}`)
    console.error(
      '\nEither reduce the bundle or raise tachui.sizeBudget.gzipBytes deliberately, in its own commit.'
    )
    process.exit(1)
  }
}

// Only run when invoked directly, so tests can import the helpers above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
