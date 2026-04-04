/**
 * Segmented preload entry that eagerly registers every basic modifier family.
 * Re-exporting the basic module ensures it is evaluated immediately while
 * still exposing the public API for downstream imports.
 */

export * from '../basic'
