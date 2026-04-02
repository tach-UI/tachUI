---
"@tachui/modifiers": patch
---

Fix preload registration reliability for segmented modifier imports by hardening side-effect handling against production tree-shaking.

This updates preload registration behavior for basic/effects and segmented effects preloads (filters, shadows, transforms, backdrop), expands sideEffects coverage for source and dist entrypoints, and adds regression verification/tests so chain methods like `transformStyle` remain available in production bundles.
