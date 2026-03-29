import { describe, expect, it } from 'vitest'
import { sanitizeSVG } from '../../src/utils/sanitize-svg'

describe('sanitizeSVG', () => {
  it('preserves allowed tags and attributes', () => {
    const input =
      '<svg viewBox="0 0 10 10"><path d="M0 0L10 10" fill="currentColor" stroke="#000" /></svg>'
    const output = sanitizeSVG(input)

    expect(output).toContain('<svg')
    expect(output).toContain('viewBox="0 0 10 10"')
    expect(output).toContain('<path')
    expect(output).toContain('fill="currentColor"')
    expect(output).toContain('stroke="#000"')
  })

  it('strips script, foreignObject, style, and event attributes', () => {
    const input = `
      <svg viewBox="0 0 10 10" onload="alert(1)">
        <style>.bad{background:url(https://evil.com/x)}</style>
        <foreignObject><div>bad</div></foreignObject>
        <script>alert(1)</script>
        <path d="M0 0L10 10" onclick="alert(2)" />
      </svg>
    `
    const output = sanitizeSVG(input).toLowerCase()

    expect(output).not.toContain('<script')
    expect(output).not.toContain('<foreignobject')
    expect(output).not.toContain('<style')
    expect(output).not.toContain('onload=')
    expect(output).not.toContain('onclick=')
  })

  it('allows only fragment href refs for use and strips external refs', () => {
    const safe = sanitizeSVG('<svg><use href="#icon" /></svg>')
    const unsafeHref = sanitizeSVG('<svg><use href="https://evil.com/icon.svg" /></svg>')
    const unsafeXlink = sanitizeSVG(
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="javascript:alert(1)" /></svg>'
    )

    expect(safe).toContain('href="#icon"')
    expect(unsafeHref).not.toContain('href="https://')
    expect(unsafeXlink).not.toContain('xlink:href=')
  })

  it('strips data and javascript protocol values', () => {
    const input =
      '<svg><path fill="url(https://evil.com/p)"/><use href="data:image/svg+xml;base64,AAA"/></svg>'
    const output = sanitizeSVG(input).toLowerCase()

    expect(output).not.toContain('data:')
    expect(output).not.toContain('javascript:')
    expect(output).not.toContain('url(https://')
  })

  it('handles malformed and empty input safely', () => {
    expect(sanitizeSVG('')).toBe('')
    expect(sanitizeSVG('not-svg')).toBe('')
    expect(sanitizeSVG('<svg><path></svg>')).toBe('')
  })
})
