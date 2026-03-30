import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { h, text } from '@tachui/core'
import { prerender } from '../src/prerender'

describe('prerender', () => {
  it('writes root and nested route HTML files', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'tachui-ssr-'))

    try {
      const results = await prerender(
        [
          {
            path: '/',
            render: () => h('main', null, text('Home')),
          },
          {
            path: '/about',
            render: () => h('main', null, text('About')),
          },
        ],
        { outDir }
      )

      expect(results).toHaveLength(2)

      const rootHtml = await readFile(path.join(outDir, 'index.html'), 'utf8')
      const aboutHtml = await readFile(path.join(outDir, 'about/index.html'), 'utf8')

      expect(rootHtml).toContain('<div id="app"><main>Home</main></div>')
      expect(aboutHtml).toContain('<div id="app"><main>About</main></div>')
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('allows custom document wrappers', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'tachui-ssr-'))

    try {
      await prerender(
        [
          {
            path: '/custom',
            render: () => h('section', null, text('Custom')),
          },
        ],
        {
          outDir,
          document: (html, route) =>
            `<!doctype html><html><body data-route="${route.path}">${html}</body></html>`,
        }
      )

      const html = await readFile(path.join(outDir, 'custom/index.html'), 'utf8')
      expect(html).toBe(
        '<!doctype html><html><body data-route="/custom"><section>Custom</section></body></html>'
      )
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })
})
