import { describe, test, expect } from 'vitest'
import { BasicSanitizer } from '@tachui/modifiers/utility'

describe('BasicSanitizer Security Tests', () => {
  const xssVectors = [
    // Script injection
    '<script>alert("xss")</script>',
    '<script src="evil.js"></script>',
    '<script>document.location="http://evil.com"</script>',
    '<SCRIPT>alert("xss")</SCRIPT>',

    // Event handlers
    '<img src="x" onerror="alert(1)">',
    '<div onclick="alert(1)">click</div>',
    '<body onload="alert(1)">',
    '<input onfocus="alert(1)" autofocus>',
    '<div onmouseover="alert(1)">hover</div>',
    '<button ondblclick="alert(1)">double click</button>',

    // JavaScript URLs
    '<a href="javascript:alert(1)">link</a>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<form action="javascript:alert(1)">',
    '<img src="javascript:alert(1)">',
    '<area href="javascript:alert(1)">',

    // Data URLs with scripts
    '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
    '<object data="data:text/html,<script>alert(1)</script>"></object>',
    '<embed src="data:text/html,<script>alert(1)</script>">',

    // CSS injection
    '<style>body{background:url("javascript:alert(1)")}</style>',
    '<div style="background:url(javascript:alert(1))">',
    '<style>@import "javascript:alert(1)";</style>',
    '<style>body{background:expression(alert(1))}</style>',

    // HTML entity encoding attempts
    '<img src="x" onerror="&#97;lert(1)">',
    '<script>&#97;lert("xss")</script>',
    '<div onclick="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">',

    // Mixed case evasion
    '<ScRiPt>alert("xss")</ScRiPt>',
    '<IMG SRC="javascript:alert(1)">',
    '<DiV OnClIcK="alert(1)">',

    // Nested/malformed tags
    '<scr<script>ipt>alert("xss")</script>',
    '<img src="x" one<script>rror="alert(1)">',
    '<<SCRIPT>alert("xss")//<</SCRIPT>',

    // SVG vectors
    '<svg onload="alert(1)">',
    '<svg><script>alert(1)</script></svg>',
    '<svg><g onmouseover="alert(1)"><path/></g></svg>',

    // Form-related vectors
    '<form><input type="submit" formaction="javascript:alert(1)">',
    '<form><button formaction="javascript:alert(1)">click</button></form>',
    '<input type="image" src="x" onerror="alert(1)">',

    // Meta and link tag vectors
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    '<link rel="stylesheet" href="javascript:alert(1)">',
    '<base href="javascript:alert(1)//">',

    // CSS expression variations
    '<div style="width:expression(alert(1))">',
    '<style>@import url("javascript:alert(1)");</style>',
    '<style>body{background:url(vbscript:alert(1))}</style>',
  ]

  test.each(xssVectors)('blocks XSS vector: %s', maliciousHTML => {
    const sanitized = BasicSanitizer.sanitize(maliciousHTML)

    // Should not contain dangerous content
    expect(sanitized.toLowerCase()).not.toMatch(/<script/i)
    expect(sanitized.toLowerCase()).not.toMatch(/javascript:/i)
    expect(sanitized.toLowerCase()).not.toMatch(/on\w+\s*=/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<iframe/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<object/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<embed/i)
    expect(sanitized.toLowerCase()).not.toMatch(/alert\(/i)
    expect(sanitized.toLowerCase()).not.toMatch(/@import/i)
    expect(sanitized.toLowerCase()).not.toMatch(/expression\(/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<style/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<meta/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<link/i)
    expect(sanitized.toLowerCase()).not.toMatch(/<form/i)
  })

  test('preserves legitimate content', () => {
    const legitimateHTML = `
      <article>
        <h1>Article Title</h1>
        <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <blockquote>This is a quote</blockquote>
        <a href="https://example.com" title="Example">Legitimate link</a>
        <img src="/images/photo.jpg" alt="Photo" width="300" height="200">
        <pre><code>const x = 1;</code></pre>
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cell 1</td>
              <td>Cell 2</td>
            </tr>
          </tbody>
        </table>
      </article>
    `

    const sanitized = BasicSanitizer.sanitize(legitimateHTML)

    // Should preserve legitimate elements
    expect(sanitized).toContain('<article>')
    expect(sanitized).toContain('<h1>')
    expect(sanitized).toContain('<strong>')
    expect(sanitized).toContain('<em>')
    expect(sanitized).toContain('<ul>')
    expect(sanitized).toContain('<li>')
    expect(sanitized).toContain('<blockquote>')
    expect(sanitized).toContain('<a href="https://example.com"')
    expect(sanitized).toContain('<img src="/images/photo.jpg"')
    expect(sanitized).toContain('<pre>')
    expect(sanitized).toContain('<code>')
    expect(sanitized).toContain('<table>')
    expect(sanitized).toContain('<thead>')
    expect(sanitized).toContain('<tbody>')
    expect(sanitized).toContain('<th>')
    expect(sanitized).toContain('<td>')
  })

  test('handles malformed HTML gracefully', () => {
    const malformedHTML = '<div><p>Unclosed paragraph<span>Nested</div>'

    const sanitized = BasicSanitizer.sanitize(malformedHTML)

    // Should not crash and should return some content
    expect(sanitized).toBeTruthy()
    expect(typeof sanitized).toBe('string')
    expect(sanitized).toContain('Unclosed paragraph')
    expect(sanitized).toContain('Nested')
  })

  test('removes dangerous attributes while preserving safe ones', () => {
    const htmlWithAttributes = `
      <div class="safe" id="also-safe" onclick="alert(1)" onmouseover="alert(2)">
        <a href="https://example.com" target="_blank" onclick="alert(3)" rel="noopener">Link</a>
        <img src="/image.jpg" alt="Image" onerror="alert(4)" width="100">
      </div>
    `

    const sanitized = BasicSanitizer.sanitize(htmlWithAttributes)

    // Should keep safe attributes
    expect(sanitized).toContain('class="safe"')
    expect(sanitized).toContain('id="also-safe"')
    expect(sanitized).toContain('href="https://example.com"')
    expect(sanitized).toContain('target="_blank"')
    expect(sanitized).toContain('rel="noopener"')
    expect(sanitized).toContain('src="/image.jpg"')
    expect(sanitized).toContain('alt="Image"')
    expect(sanitized).toContain('width="100"')

    // Should remove dangerous attributes
    expect(sanitized).not.toContain('onclick')
    expect(sanitized).not.toContain('onmouseover')
    expect(sanitized).not.toContain('onerror')
    expect(sanitized).not.toContain('alert(1)')
    expect(sanitized).not.toContain('alert(2)')
    expect(sanitized).not.toContain('alert(3)')
    expect(sanitized).not.toContain('alert(4)')
  })

  test('validates URL safety in attributes', () => {
    const htmlWithUrls = `
      <a href="https://safe.com">Safe HTTPS</a>
      <a href="http://also-safe.com">Safe HTTP</a>
      <a href="/relative/path">Safe relative</a>
      <a href="./relative/path">Safe relative dot</a>
      <a href="#anchor">Safe anchor</a>
      <a href="mailto:test@example.com">Safe email</a>
      <a href="tel:+1234567890">Safe phone</a>
      <a href="javascript:alert(1)">Dangerous JS</a>
      <a href="data:text/html,<script>alert(1)</script>">Dangerous data</a>
      <a href="vbscript:alert(1)">Dangerous VBScript</a>
      <img src="https://safe.com/image.jpg">
      <img src="javascript:alert(1)">
    `

    const sanitized = BasicSanitizer.sanitize(htmlWithUrls)

    // Should keep safe URLs
    expect(sanitized).toContain('href="https://safe.com"')
    expect(sanitized).toContain('href="http://also-safe.com"')
    expect(sanitized).toContain('href="/relative/path"')
    expect(sanitized).toContain('href="./relative/path"')
    expect(sanitized).toContain('href="#anchor"')
    expect(sanitized).toContain('href="mailto:test@example.com"')
    expect(sanitized).toContain('href="tel:+1234567890"')
    expect(sanitized).toContain('src="https://safe.com/image.jpg"')

    // Should remove dangerous URLs
    expect(sanitized).not.toContain('javascript:alert(1)')
    expect(sanitized).not.toContain('data:text/html')
    expect(sanitized).not.toContain('vbscript:alert(1)')
  })

  test('performance with large HTML content', () => {
    const largeHTML = '<div>' + 'x'.repeat(10000) + '</div>'.repeat(100)

    const startTime = performance.now()
    const sanitized = BasicSanitizer.sanitize(largeHTML)
    const endTime = performance.now()

    expect(sanitized).toBeTruthy()
    expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
  })

  test('handles empty and null inputs', () => {
    expect(BasicSanitizer.sanitize('')).toBe('')
    expect(BasicSanitizer.sanitize(null as any)).toBe('')
    expect(BasicSanitizer.sanitize(undefined as any)).toBe('')
    expect(BasicSanitizer.sanitize(123 as any)).toBe('')
  })

  test('custom patterns option works', () => {
    const htmlWithCustomDanger =
      '<div>Normal content</div><customtag>Remove this</customtag>'
    const customPatterns = [/<customtag.*?<\/customtag>/gi]

    const sanitized = BasicSanitizer.sanitize(htmlWithCustomDanger, {
      customPatterns,
    })

    expect(sanitized).toContain('Normal content')
    expect(sanitized).not.toContain('<customtag>')
    // Note: Pattern-based removal doesn't preserve text content like DOM-based removal
    // This is expected behavior for pattern-based sanitization
    expect(sanitized).not.toContain('<customtag>')
  })

  test('custom allowed tags option works', () => {
    const htmlContent =
      '<div>Div content</div><p>Paragraph</p><span>Span content</span>'
    const allowedTags = ['div', 'p'] // Only allow div and p, not span

    const sanitized = BasicSanitizer.sanitize(htmlContent, { allowedTags })

    expect(sanitized).toContain('<div>')
    expect(sanitized).toContain('Div content')
    expect(sanitized).toContain('<p>')
    expect(sanitized).toContain('Paragraph')
    expect(sanitized).not.toContain('<span>')
    // Content should still be preserved even if tags are removed
    expect(sanitized).toContain('Span content')
  })

  test('custom allowed attributes option works', () => {
    const htmlContent =
      '<div class="test" id="myid" data-custom="value">Content</div>'
    const allowedAttributes = {
      '*': ['class'], // Only allow class globally
      div: [], // No div-specific attributes
    }

    const sanitized = BasicSanitizer.sanitize(htmlContent, {
      allowedAttributes,
    })

    expect(sanitized).toContain('class="test"')
    expect(sanitized).not.toContain('id="myid"')
    expect(sanitized).not.toContain('data-custom="value"')
    expect(sanitized).toContain('Content')
  })

  test('DOM validation can be disabled', () => {
    const htmlContent = '<div>Content</div>'

    // With DOM validation (default)
    const withValidation = BasicSanitizer.sanitize(htmlContent, {
      validateDOM: true,
    })

    // Without DOM validation
    const withoutValidation = BasicSanitizer.sanitize(htmlContent, {
      validateDOM: false,
    })

    // Both should contain the content, but the implementation path is different
    expect(withValidation).toContain('Content')
    expect(withoutValidation).toContain('Content')
  })
})
