---
title: Snippets
---

# Snippets

```ts
// Counter component
import { VStack, Text, Button, createSignal } from '@tachui/core'

const Counter = () => {
  const [count, setCount] = createSignal(0)

  return VStack({
    spacing: 12,
    children: [
      Text(() => `Count: ${count()}`).modifier.fontSize(24).build(),
      Button('Increment', () => setCount(count() + 1))
        .modifier
        .padding(12)
        .cornerRadius(8)
        .backgroundColor('#0d6efd')
        .foregroundColor('#fff')
        .build(),
    ],
  })
}
```

```ts
// Responsive container
import { VStack } from '@tachui/core'

VStack({
  children: [...],
})
  .modifier
  .responsive({
    base: (m) => m.padding(16),
    lg: (m) => m.padding(32).frame({ maxWidth: 960 }),
  })
  .build()
```

Want to add more? Submit a snippet via PR along with a brief explanation.
