# Direct Modifier Mode

Direct chaining (for example `Text('Hi').padding(12).fontWeight('bold')`) is the
default experience in TachUI. This page documents the configuration flag in case
you ever need to re-enable the legacy builder for backwards compatibility.

## Enabling the proxy mode

Import the configuration helper from `@tachui/core` and toggle the flag before
creating any components:

```ts
import { configureCore } from '@tachui/core'

configureCore({ proxyModifiers: true })
```

Once enabled, modifiers can be chained directly:

```ts
import { Text } from '@tachui/primitives'

Text('Hello direct mode')
  .fontSize(20)
  .foregroundColor('#007AFF')
  .padding(16)
```

## Legacy builder mode

If you need to temporarily bring back the legacy builder pattern (for example,
during a staggered migration), toggle the flag off:

## Toggling at runtime

```ts
configureCore({ proxyModifiers: false })
```

This is useful for staged rollouts, A/B testing, or quick rollback scenarios.

You can also use the new `tachui.configure` facade when you prefer an object
based API:

```ts
import { tachui } from '@tachui/core'

tachui.configure({ proxyModifiers: true })

console.log(tachui.getFeatureFlags())
```

## Notes

- Direct chaining applies to components created via `withModifiers`, the
  standard wrappers, and factory helpers.
- Modifiers are resolved through the global registry; custom packages can
  continue to register new modifiers using the existing APIs.
- Cloning (`component.clone()`) returns a proxied instance when the feature flag
  is enabled.
*** End Patch
