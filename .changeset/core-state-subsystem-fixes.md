---
'@tachui/core': patch
---

Fix state subsystem bugs surfaced by re-enabling the core state-management suite (#219): `@ObservedObject` and `@EnvironmentObject` factories now resolve the component context through the canonical `ComponentContextSymbol` instead of duplicate locally-defined symbols (their runtime path previously always threw); `ObservableObjectBase.objectWillChange` now exposes the callable `Signal` getter its consumers expect; the `makeObservable` proxy answers `in` checks so `isObservableObject()` recognizes its own output; `useEnvironmentObject` and `EnvironmentObjectImpl.resolveEnvironmentObject` invoke the accessor returned by `useContext` instead of returning it as the value (fixes #239); and the `isState` type guard no longer matches bindings.
