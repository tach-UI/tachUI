---
'@tachui/cli': patch
'@tachui/core': patch
'@tachui/data': patch
'@tachui/devtools': patch
'@tachui/eslint-plugin': patch
'@tachui/flow-control': patch
'@tachui/forms': patch
'@tachui/fragments': patch
'@tachui/grid': patch
'@tachui/mobile': patch
'@tachui/modifiers': patch
'@tachui/navigation': patch
'@tachui/primitives': patch
'@tachui/registry': patch
'@tachui/responsive': patch
'@tachui/ssr': patch
'@tachui/symbols': patch
'@tachui/types': patch
'@tachui/viewport': patch
---

fix(release): publish versioned internal dependency ranges

Rewrites the `workspace:*` internal dependency ranges to concrete
versioned ranges so published manifests are installable from npm.
`@tachui/core@0.8.27` and `@tachui/primitives@0.8.28` (the current
`latest` tags) shipped `workspace:*` dependencies and are uninstallable
outside the monorepo (#235). The release pipeline now rewrites workspace
ranges during versioning and rejects non-publishable protocols before
any future publish.
