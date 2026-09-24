---
'@tachui/core': patch
---

`createTimeout` and `createInterval` return `ReturnType<typeof setTimeout>` and
`ReturnType<typeof setInterval>` instead of `NodeJS.Timeout`, so a consumer
without `@types/node` that type-checks its dependencies no longer fails on
`Cannot find namespace 'NodeJS'`. In an environment with Node's types the
returned value's type is unchanged.
