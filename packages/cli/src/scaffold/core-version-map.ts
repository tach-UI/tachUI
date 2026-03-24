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
  const match = value.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/)
  if (!match) {
    return null
  }

  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  const preRelease = match[4] ?? null

  return { major, minor, patch, preRelease }
}

function comparePreRelease(left: string | null, right: string | null): number {
  if (left === right) return 0
  if (left === null) return 1
  if (right === null) return -1
  return left.localeCompare(right)
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

  const match = CORE_VERSION_COMPATIBILITY.find(entry => matchesRange(parsed, entry.cliRange))
  return match?.coreVersion ?? null
}
