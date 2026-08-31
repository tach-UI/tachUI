#!/usr/bin/env node
/**
 * pre-push gate: run type-check and the CI test suite, except for pushes that
 * cannot break anything.
 *
 * The hook previously ran `bun run type-check && bun run test:ci`
 * unconditionally, which meant deleting a merged branch paid the full suite —
 * several minutes to remove a ref that contains no code. Branch cleanup is
 * exactly when a developer is least inclined to wait, so the practical effect
 * was to train everyone into `--no-verify`, which disables the gate for real
 * pushes too.
 *
 * Git feeds pre-push one line per ref on stdin:
 *
 *   <local ref> <local sha> <remote ref> <remote sha>
 *
 * A deletion has an all-zero local sha (and a literal `(delete)` local ref), so
 * a delete-only push is detectable and safe to wave through: no new commits
 * reach the remote.
 *
 * Everything else runs the checks, including anything unparseable or an empty
 * stdin — the default is always to verify.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const ZERO_SHA = /^0+$/

/**
 * Decide whether a pre-push payload can skip the checks.
 *
 * @param {string} stdinText Raw stdin from git.
 * @returns {{ skip: boolean, reason: string, deleted: string[] }}
 */
export function classifyPush(stdinText) {
  const lines = String(stdinText ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return {
      skip: false,
      reason: 'no ref updates on stdin; running checks',
      deleted: [],
    }
  }

  const deleted = []
  for (const line of lines) {
    const fields = line.split(/\s+/)
    if (fields.length < 4) {
      return {
        skip: false,
        reason: `unrecognized ref update (${line}); running checks`,
        deleted: [],
      }
    }

    const [, localSha, remoteRef] = fields
    if (!ZERO_SHA.test(localSha)) {
      return {
        skip: false,
        reason: 'push contains commits; running checks',
        deleted: [],
      }
    }
    deleted.push(remoteRef)
  }

  return {
    skip: true,
    reason: 'delete-only push; no commits reach the remote',
    deleted,
  }
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    // No stdin (invoked by hand, or a platform that closes fd 0): verify.
    return ''
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.error) {
    console.error(`✗ pre-push: failed to run \`${command} ${args.join(' ')}\``)
    console.error(`  ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function main() {
  const { skip, reason, deleted } = classifyPush(readStdin())

  if (skip) {
    const refs = deleted.join(', ')
    console.log(`[pre-push] ${reason} — skipping type-check and tests (${refs})`)
    process.exit(0)
  }

  console.log(`[pre-push] ${reason}`)
  run('bun', ['run', 'type-check'])
  run('bun', ['run', 'test:ci'])
}

// Only run when invoked as the hook, so the test can import classifyPush.
if (process.argv[1] && process.argv[1].endsWith('pre-push.mjs')) {
  main()
}
