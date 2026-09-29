import { describe, expect, it } from 'vitest'
import { findBlockingAdvisories, parseAuditPaths } from '../check-audit.mjs'

const advisory = (severity: string, id: string) => ({
  severity,
  url: `https://github.com/advisories/${id}`,
  title: id,
  vulnerable_versions: '<1.0.0',
})

// Trimmed from the `bun audit` text report, colors included.
const report = [
  '\u001b[1mbun audit \u001b[0m\u001b[2mv1.3.9\u001b[0m',
  'vitest  >=2.1.0 <4.1.11',
  '  (direct dependency)',
  '  workspace:@tachui/core › vitest',
  '  moderate: Vitest: Path Traversal - https://github.com/advisories/GHSA-82fw-gwwq-j7x9',
  '',
  'form-data  >=4.0.0 <4.0.6',
  '  workspace:@tachui/core › jsdom',
  '  high: form-data: CRLF injection - https://github.com/advisories/GHSA-hmw2-7cc7-3qxx',
  '',
  'ws  >=8.0.0 <8.20.1',
  '  workspace:@tachui/core › jsdom',
  '  moderate: ws: Uninitialized memory disclosure - https://github.com/advisories/GHSA-58qx-3vcg-4xpx',
  '  high: ws: Memory exhaustion DoS - https://github.com/advisories/GHSA-96hv-2xvq-fx4p',
  '',
  '7 vulnerabilities (2 high, 5 moderate)',
  '',
  'To update all dependencies to the latest compatible versions:',
  '  bun update',
].join('\n')

describe('parseAuditPaths', () => {
  it('collects the dependency paths under each package, without severity lines', () => {
    const paths = parseAuditPaths(report)

    expect([...paths.keys()]).toEqual(['vitest', 'form-data', 'ws'])
    expect(paths.get('vitest')).toEqual([
      '(direct dependency)',
      'workspace:@tachui/core › vitest',
    ])
    expect(paths.get('ws')).toEqual(['workspace:@tachui/core › jsdom'])
  })
})

describe('findBlockingAdvisories', () => {
  it('passes when the only high advisories run through jsdom', () => {
    const advisories = {
      vitest: [advisory('moderate', 'GHSA-82fw-gwwq-j7x9')],
      'form-data': [advisory('high', 'GHSA-hmw2-7cc7-3qxx')],
      ws: [
        advisory('moderate', 'GHSA-58qx-3vcg-4xpx'),
        advisory('high', 'GHSA-96hv-2xvq-fx4p'),
      ],
    }

    expect(findBlockingAdvisories(advisories, parseAuditPaths(report))).toEqual([])
  })

  it('flags a high or critical advisory reached outside jsdom', () => {
    const advisories = {
      vitest: [advisory('critical', 'GHSA-critical')],
      'form-data': [advisory('high', 'GHSA-hmw2-7cc7-3qxx')],
    }

    const blocking = findBlockingAdvisories(advisories, parseAuditPaths(report))

    expect(blocking.map(entry => entry.advisory.url)).toEqual([
      'https://github.com/advisories/GHSA-critical',
    ])
  })

  it('flags a package that jsdom and another dependency both reach', () => {
    const mixed = [
      'ws  >=8.0.0 <8.21.0',
      '  workspace:@tachui/core › jsdom',
      '  workspace:@tachui/cli › some-server',
      '  high: ws: Memory exhaustion DoS - https://github.com/advisories/GHSA-96hv-2xvq-fx4p',
    ].join('\n')
    const advisories = { ws: [advisory('high', 'GHSA-96hv-2xvq-fx4p')] }

    expect(findBlockingAdvisories(advisories, parseAuditPaths(mixed))).toHaveLength(1)
  })

  it('flags a high advisory whose paths could not be parsed', () => {
    const advisories = { 'form-data': [advisory('high', 'GHSA-hmw2-7cc7-3qxx')] }

    expect(findBlockingAdvisories(advisories, new Map())).toHaveLength(1)
  })

  it('does not treat a package named jsdom at the root of a path as the carve-out', () => {
    const direct = ['jsdom  <1.0.0', '  jsdom', '  high: jsdom: something'].join('\n')
    const advisories = { jsdom: [advisory('high', 'GHSA-jsdom')] }

    expect(findBlockingAdvisories(advisories, parseAuditPaths(direct))).toHaveLength(1)
  })
})
