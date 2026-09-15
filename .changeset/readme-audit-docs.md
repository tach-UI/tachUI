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

Four of the rewritten examples resolved their imports and still did not
compile. `ActionSheet` takes `buttons` of `{ label, onPress }`, not `actions`;
`AlertButton`'s callback is `action`; `DevToolsConfig` has no
`trackReactiveOperations`; `Grid` reads template areas from
`styling.templateAreas`; and `getCurrentBreakpoint()` returns a Signal whose
keys are `base | sm | md | lg | xl | 2xl` rather than device names, which the
`DEFAULT_BREAKPOINTS` comment also had wrong. They are type-checked now.

Worth knowing for anything relying on types to catch this: `ComponentProps`
declares `[key: string]: any`, so no component rejects an unknown prop. The
grid example's misplaced `templateAreas` compiled perfectly and rendered
nothing, which is why that one is asserted against mounted output instead.

`@tachui/core`'s quick start told readers to `npm install @tachui/core` and then
imported `@tachui/primitives` and `@tachui/modifiers`. Core neither depends on
nor re-exports either, so the example could not run from the install it
documents. All three are in the command now, with a line on what each provides.
