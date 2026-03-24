const RESERVED_NAMES = new Set([
  'node_modules',
  'favicon.ico',
  'con',
  'prn',
  'aux',
  'nul',
])

const PACKAGE_NAME_PATTERN =
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/

export function validateProjectName(projectName: string): string | null {
  const normalized = projectName.trim()

  if (normalized.length === 0) {
    return 'Project name is required'
  }

  if (normalized.length > 214) {
    return 'Project name must be 214 characters or fewer'
  }

  if (normalized.startsWith('.') || normalized.startsWith('_')) {
    return 'Project name cannot start with "." or "_"'
  }

  if (/[A-Z]/.test(normalized)) {
    return 'Project name must be lowercase'
  }

  if (!PACKAGE_NAME_PATTERN.test(normalized)) {
    return 'Project name must be a valid npm package name'
  }

  if (RESERVED_NAMES.has(normalized)) {
    return `Project name "${normalized}" is reserved`
  }

  return null
}
