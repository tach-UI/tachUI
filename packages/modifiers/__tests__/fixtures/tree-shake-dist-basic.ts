// Consumes the PUBLISHED dist exactly as an app does, not the source tree.
// The other fixtures import from ../../src, so they validate source-level
// tree-shaking only and cannot see registration being dropped from the
// built artifact (#260).
import '../../dist/preload/basic.js'
