---
'@tachui/primitives': patch
---

`Image` renders the sizing and presentation props it declares.

`width`, `height`, `contentMode` and `resizeMode` were all in `ImageProps`,
all type-checked, and none of them reached the DOM — the rendered `<img>` had
no dimensions and no `object-fit`. The same was true of `aspectRatio`,
`opacity`, `blur`, `grayscale` and `sepia`, which no report had named but
which were dropped in the same place.

They are written as styles rather than attributes, because the dimensions are
typed to take a CSS length — `100%` is as valid as `246` — and a bare number
is read as pixels. A modifier setting the same property still wins, so
`.css({ height: '400px' })` over a `height` prop behaves the way `.css()`
already does over a stack's own styles.

`contentMode` maps to `object-fit`: `fit` to `contain`, `fill` to `cover`,
`stretch` to `fill`, `center` to `none`, `scaleDown` to `scale-down`.
`resizeMode` is named for the CSS values themselves, so it is the more
specific of the two and wins where both are set. `blur`, `grayscale` and
`sepia` compose into one `filter`.

Template mode is sized too, but keeps its existing warning that `contentMode`
and `resizeMode` do nothing there: it paints an inline SVG into a span, where
`object-fit` has no replaced content to act on.
