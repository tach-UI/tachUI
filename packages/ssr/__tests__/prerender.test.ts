import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  Assets,
  createColorAsset,
  createGoogleFont,
  h,
  registerAsset,
  text,
} from '@tachui/core'
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

  it('throws for empty routes input', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'tachui-ssr-'))
    try {
      await expect(prerender([], { outDir })).rejects.toThrow(
        'prerender requires at least one route definition.'
      )
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('throws for empty or whitespace outDir', async () => {
    await expect(
      prerender(
        [
          {
            path: '/',
            render: () => h('main', null, text('Home')),
          },
        ],
        { outDir: '' }
      )
    ).rejects.toThrow('prerender requires a non-empty outDir.')

    await expect(
      prerender(
        [
          {
            path: '/',
            render: () => h('main', null, text('Home')),
          },
        ],
        { outDir: '   ' }
      )
    ).rejects.toThrow('prerender requires a non-empty outDir.')
  })

  it('writes deep nested route paths', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'tachui-ssr-'))

    try {
      await prerender(
        [
          {
            path: '/a/b/c',
            render: () => h('main', null, text('Deep')),
          },
        ],
        { outDir }
      )

      const html = await readFile(path.join(outDir, 'a/b/c/index.html'), 'utf8')
      expect(html).toContain('<div id="app"><main>Deep</main></div>')
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('uses route title in the default document shell', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'tachui-ssr-'))

    try {
      await prerender(
        [
          {
            path: '/meta',
            title: 'Meta & <Title>',
            render: () => h('main', null, text('Title test')),
          },
        ],
        { outDir }
      )

      const html = await readFile(path.join(outDir, 'meta/index.html'), 'utf8')
      expect(html).toContain('<title>Meta &amp; &lt;Title&gt;</title>')
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('propagates render errors with route context', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'tachui-ssr-'))

    try {
      await expect(
        prerender(
          [
            {
              path: '/broken',
              render: () => {
                throw new Error('boom')
              },
            },
          ],
          { outDir }
        )
      ).rejects.toThrow('prerender failed for route "/broken": boom')
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('injects collected SSR head entries into the default document', async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), 'tachui-ssr-'))
    registerAsset(
      'prerender-font',
      createGoogleFont('Inter', [400], 'prerender-font')
    )
    registerAsset(
      'prerender-color',
      createColorAsset('#202020', '#f3f3f3', 'prerender-color')
    )

    try {
      await prerender(
        [
          {
            path: '/head',
            render: () =>
              h('main', {
                style: {
                  fontFamily: (Assets as any)['prerender-font'],
                  color: (Assets as any)['prerender-color'],
                },
              }, text('Head test')),
          },
        ],
        { outDir }
      )

      const html = await readFile(path.join(outDir, 'head/index.html'), 'utf8')
      expect(html).toContain('<link rel="stylesheet" href="https://fonts.googleapis.com')
      expect(html).toContain('<style>:root{--tachui-color-prerender-color:#202020;}')
      expect(html).toContain('<div id="app"><main style="font-family:Inter')
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })
})
