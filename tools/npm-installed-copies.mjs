/**
 * Counts the installed copies of a package in an `npm ls --all --json --long`
 * tree, for the packed-install checks that require exactly one.
 *
 * A copy is an install path, not a version: two copies of the same version are
 * still two module instances, each with its own classes and its own state. The
 * tree must come from `--long`, which is what adds `path`; a deduped reference
 * carries the path of the copy it points at, so it is not counted twice.
 */

/**
 * The install path of every copy of `name` in `tree`, mapped to its version.
 *
 * @param {unknown} tree parsed output of `npm ls <name> --all --json --long`
 * @param {string} name
 * @returns {Map<string, string>}
 */
export function collectInstalledPaths(tree, name) {
  const copies = new Map()
  const walk = node => {
    const dependencies = node && typeof node === 'object' ? node.dependencies : undefined
    if (!dependencies || typeof dependencies !== 'object') return
    for (const [depName, dep] of Object.entries(dependencies)) {
      if (depName === name && dep && typeof dep.path === 'string') copies.set(dep.path, dep.version)
      walk(dep)
    }
  }
  walk(tree)
  return copies
}
