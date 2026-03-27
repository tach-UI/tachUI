interface CompatibilityEntry {
  cliRange: string
  coreVersion: string
}

const CORE_VERSION_COMPATIBILITY: CompatibilityEntry[] = [
  {
    cliRange: '>=0.8.8-alpha <0.9.0',
    coreVersion: '0.8.8-alpha',
  },
  {
    cliRange: '>=0.8.6-alpha <0.8.8-alpha',
    coreVersion: '0.8.6-alpha',
  },
]

interface ParsedVersion {
  major: number
  minor: number
  patch: number
  preRelease: string | null
}

function parseSemver(value: string): ParsedVersion | null {
  const match = value.trim().match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
  )
  if (!match) {
    return null
  }

  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  const preRelease = match[4] ?? null

  return { major, minor, patch, preRelease }
}

function comparePreReleaseIdentifier(left: string, right: string): number {
  const leftNumeric = /^\d+$/.test(left)
  const rightNumeric = /^\d+$/.test(right)

  if (leftNumeric && rightNumeric) {
    return Number(left) - Number(right)
  }
  if (leftNumeric && !rightNumeric) {
    return -1
  }
  if (!leftNumeric && rightNumeric) {
    return 1
  }

  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function comparePreRelease(left: string | null, right: string | null): number {
  if (left === right) return 0
  if (left === null) return 1
  if (right === null) return -1

  const leftIdentifiers = left.split('.')
  const rightIdentifiers = right.split('.')
  const maxLength = Math.max(leftIdentifiers.length, rightIdentifiers.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftIdentifiers[index]
    const rightPart = rightIdentifiers[index]

    if (leftPart === undefined) return -1
    if (rightPart === undefined) return 1

    const comparison = comparePreReleaseIdentifier(leftPart, rightPart)
    if (comparison !== 0) {
      return comparison
    }
  }

  return 0
}

function compareSemver(left: ParsedVersion, right: ParsedVersion): number {
  if (left.major !== right.major) return left.major - right.major
  if (left.minor !== right.minor) return left.minor - right.minor
  if (left.patch !== right.patch) return left.patch - right.patch
  return comparePreRelease(left.preRelease, right.preRelease)
}

function matchesRange(version: ParsedVersion, range: string): boolean {
  const constraints = range.split(' ').filter(Boolean)

  for (const constraint of constraints) {
    let operator = ''
    let rawVersion = ''

    if (constraint.startsWith('>=')) {
      operator = '>='
      rawVersion = constraint.slice(2)
    } else if (constraint.startsWith('>')) {
      operator = '>'
      rawVersion = constraint.slice(1)
    } else if (constraint.startsWith('<=')) {
      operator = '<='
      rawVersion = constraint.slice(2)
    } else if (constraint.startsWith('<')) {
      operator = '<'
      rawVersion = constraint.slice(1)
    } else if (constraint.startsWith('=')) {
      operator = '='
      rawVersion = constraint.slice(1)
    } else {
      return false
    }

    const constraintVersion = parseSemver(rawVersion)
    if (!constraintVersion) {
      return false
    }

    const comparison = compareSemver(version, constraintVersion)
    const passes =
      (operator === '>=' && comparison >= 0) ||
      (operator === '>' && comparison > 0) ||
      (operator === '<=' && comparison <= 0) ||
      (operator === '<' && comparison < 0) ||
      (operator === '=' && comparison === 0)

    if (!passes) {
      return false
    }
  }

  return true
}

export function resolveCoreVersionFromMap(cliVersion: string | null): string | null {
  if (!cliVersion) {
    return null
  }

  const parsed = parseSemver(cliVersion)
  if (!parsed) {
    return null
  }

  if (parsed.preRelease === null) {
    // Co-publish fallback for stable CLI releases.
    return `${parsed.major}.${parsed.minor}.${parsed.patch}`
  }

  const match = CORE_VERSION_COMPATIBILITY.find(entry => matchesRange(parsed, entry.cliRange))
  if (match?.coreVersion) {
    return match.coreVersion
  }

  return null
}
