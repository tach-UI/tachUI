# Direct Modifier Mode

TachUI supports SwiftUI-style modifier chaining without the intermediate
`.modifier` builder. This behaviour is currently **optional** and can be enabled
per application.

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

configureCore({ proxyModifiers: true })

Text('Hello proxy mode')
  .fontSize(20)
  .foregroundColor('#007AFF')
  .padding(16)
  .build()
```

All modifier calls still return the same proxied component, so existing chaining
patterns (including `.build()`) continue to work.

## Toggling at runtime

You can switch back to the legacy builder mode by disabling the flag:

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

- Proxy mode currently applies to components created via `withModifiers`, the
  standard wrappers, and factory helpers. Additional entry points will adopt the
  proxy in subsequent updates.
- Modifiers are resolved through the global registry; custom packages can
  continue to register new modifiers using the existing APIs.
- Cloning (`component.clone()`) returns a proxied instance when the feature flag
  is enabled.
*** End Patch
