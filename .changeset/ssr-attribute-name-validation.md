---
'@tachui/ssr': patch
---

Harden the SSR serializer against attribute-name injection (#218): attribute *values* were already escaped, but attribute *names* reached the markup unvalidated. Prop keys arriving via spread-props patterns (e.g. `"x\" onmouseover=\"1"`) are now validated against a safe attribute-name charset and skipped with a development-mode warning instead of being emitted.
