---
'@tachui/cli': patch
---

The CLI's runtime dependencies move to their current majors: `commander` ^15,
`inquirer` ^14, `ora` ^9 and `chalk` ^6. Commands, options and output are
unchanged, and `@types/inquirer` is dropped because inquirer ships its own
types.

commander 15 needs Node 22.12+, chalk 6 Node 22+, and inquirer 14
`^22.13.0 || >=23.5.0`, so the CLI's `engines` range narrows from
`^20.0.0 || >=22.0.0` to `^22.13.0 || >=23.5.0`. Node 20 is no longer supported.
