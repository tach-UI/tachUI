---

---

No release. Documentation only.

Every package README audited by resolving each of its `@tachui` imports against
what that entry point actually exports. 110 imports; the audit found whole APIs
that had never existed.

Corrected: `navigation` imported components from `@tachui/core` and documented a
`TabView` that is `SimpleTabView` taking `tabItem`-tagged components, not
configuration objects — and used `VStack([...])`, which renders nothing, in
place of `VStack({ children })`. `mobile`'s quick start used `useActionSheet`
and `useAlert` hooks that do not exist; both are components driven by an
`isPresented` signal. `devtools` opened on a `ComponentInspector` overlay that
is really the `globalDevTools` singleton. `grid` documented `GridResponsive`,
`gridColumn` and `gridRow`, and a `Card` primitive — none of which exist.
`responsive` claimed twelve APIs of which one was real. `forms` imported
validators that are private to the module. `symbols` documented five sections of
fiction.

Where no equivalent exists the section is gone and listed under a "Not
implemented yet" heading with the nearest real API, rather than left as an
example that cannot run.

Two checks keep it true. `ci:check-readme-imports` resolves every README import
against the package's own declarations, skipping sections that say up front they
are planned. And the opening example of every README that builds UI is now
mounted in a test — resolving is not running, which is exactly how the CLI
starter shipped broken.
