import { useEffect, useMemo } from 'react';
import { type IAbstractControl } from 'solid-forms';
import { createRoot } from 'solid-js';

/**
 * Initializes an abstract control using the provided
 * control factory function.
 *
 * Optionally, you can provide a `deps` array which will cause
 * the control to be recreated when the `deps` change.
 */
export function useControl<T extends IAbstractControl | undefined>(
  controlFactory: () => T,
  deps: unknown[] = []
): T {
  const [control, dispose] = useMemo(
    () => createRoot((disposer) => [controlFactory(), disposer]),
    deps
  );

  useEffect(dispose, [dispose]);

  return control;
}
