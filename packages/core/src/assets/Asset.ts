/**
 * Base Asset class for TachUI Assets system
 *
 * Provides the foundation for all asset types including colors, images, and other resources.
 */

export abstract class Asset<T = unknown> {
  constructor(public readonly name: string) {}

  abstract resolve(): T
}
