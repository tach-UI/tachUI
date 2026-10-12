---
---

No release: vitest and @vitest/coverage-v8 move from ^3.2.7 to ^5.0.4 in the
root and every workspace manifest at once. Tests that replaced `document` or
`navigator` by assignment now use `vi.stubGlobal`, and constructor mocks use
`function` implementations. No package source changes.
