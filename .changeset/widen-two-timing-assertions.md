---
'@tachui/query': patch
'@tachui/registry': patch
---

Two test-only timing assertions no longer fail on a loaded machine.

`retryDelay > waits between attempts` allowed a flat 20ms sleep for three
loads and two 1ms backoffs, then asserted all three had run; under load it saw
two. It now polls through the helper the file already has for this, so it waits
on the retries happening rather than on a window elapsing.

`should validate large registry quickly` budgeted 20ms for about 1ms of work
and was seen at 22.6ms. Widened to 200ms, which still catches a superlinear
regression over 1000 modifiers without measuring the machine.
