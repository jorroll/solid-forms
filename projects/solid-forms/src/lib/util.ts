import _isEqual from 'fast-deep-equal/es6';
import { getOwner, runWithOwner } from 'solid-js';
import type { Merge } from 'type-fest';

export function isEqual<T>(a: T, b: any): b is T {
  return _isEqual(a, b);
}

export function mergeObj<A, B>(a: A, b: Merge<Partial<A>, B>): Merge<A, B> {
  return Object.defineProperties(
    a,
    Object.getOwnPropertyDescriptors(b)
  ) as unknown as Merge<A, B>;
}

/**
 * Helper to bind the owner of the current context to the
 * supplied function.
 *
 * Implementation is very simple:
 * ```ts
 * export function bindOwner<T>(fn: () => T): () => T {
 *   const owner = getOwner();
 *
 *   if (!owner) {
 *     throw new Error('No solidjs owner in current context');
 *   }
 *
 *   return () => runWithOwner(owner, fn);
 * }
 * ```
 */
export function bindOwner<T>(fn: () => T): () => T {
  const owner = getOwner();

  if (!owner) {
    throw new Error('No solidjs owner in current context');
  }

  return () => runWithOwner(owner, fn);
}
