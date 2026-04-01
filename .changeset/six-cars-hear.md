---
'@tachui/navigation': patch
'@tachui/core': patch
'@tachui/types': patch
---

Fix and enhance navigation and asset behavior across the branch scope:

- add directional sheet edge/size support (`top|bottom|left|right`, axis-aware sizing and drag)
- add swipe-back gesture support and spring transition improvements in navigation
- add tab badge support and fix badge reactivity/overlay behavior
- add `.inspector()` support and dismissal correctness updates
- fix navigation ComponentInstance compatibility issues and related modal mounting behavior
- improve typed asset registration and make ColorAsset transforms chainable/theme-adaptive
