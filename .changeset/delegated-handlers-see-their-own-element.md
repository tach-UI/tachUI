---
'@tachui/core': patch
---

A delegated handler reads its own element from `event.currentTarget`.

The listener doing the work sits on the mount container, so `currentTarget`
was the container for every delegated handler, where an ordinary listener
would report the element it was attached to. A handler reaching for its form
or its parent node through `currentTarget` got the mount root instead, and
delegated and directly attached handlers disagreed about the same event.

Each handler now runs with `currentTarget` reading as the element it was
registered on. `currentTarget` lives on `Event.prototype` and is only
meaningful during dispatch, so the override is an own property put on for the
call and taken off after, leaving the event as the browser made it.

This was already true of the one handler delegation used to run; it only
became easy to hit now that an event reaches the handlers above the target
too.
