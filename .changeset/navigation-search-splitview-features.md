---
"@tachui/navigation": minor
---

Add three-column NavigationSplitView, searchable/suggestions/scopes modifiers, and fix NavigationStack root rendering

**New features**

- `NavigationSplitView` now accepts an optional `content` column for three-column (sidebar + content + detail) layouts at ≥1024px, degrading to two-column at 768–1023px with a sidebar toggle and single-column below 768px. Custom `columnWidths` per column are supported (closes #41).
- `.searchable(text, placement?)` adds a reactive search input to the navigation bar or toolbar, bound to a writable signal or `Binding<string>` with a clear button (closes #42).
- `.searchSuggestions(suggestions)` displays a dropdown of static or dynamically computed suggestions below the search field while it is focused and non-empty (closes #43).
- `.searchScopes(scope, scopes)` renders a segmented control below the search field for filtering results by category; the active segment is bound to a writable signal (closes #44).

**Bug fixes**

- `NavigationStack` and `NavigationView` no longer render `[object Object]` when passed an unbuilt or chained modifiable component as the root view. Root destinations are now normalised through the same resolution path as `push`/`replace` (closes #150).

**Accessibility**

- Search input now carries an explicit `aria-label="Search"` (WCAG 2.1 SC 4.1.2).
