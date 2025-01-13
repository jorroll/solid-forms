import { useEffect, useState } from 'react';
import { usePrevious } from 'react-use';
import { type IAbstractControl } from 'solid-forms';
import { createRoot } from 'solid-js';

/**
 * Initializes an abstract control using the provided
 * control factory function. In order to comply with React's
 * concurrent rendering model, the control will be null initially
 * and then created in an effect. If the deps change the control
 * will immediately become null and then recreated in an effect.
 *
 * Optionally, you can provide a `deps` array which will cause
 * the control to be recreated when the `deps` change.
 */
export function useControl<T extends IAbstractControl | undefined>(
  controlFactory: () => T,
  deps: unknown[] = []
): T | null {
  const [control, setControl] = useState<T | null>(null);

  useEffect(() => {
    const cleanup = createRoot((disposer) => {
      const control = controlFactory();
      setControl(control);
      return disposer;
    });

    return cleanup;
  }, deps);

  const didDepsChange = useDidDepsChange(deps);

  return didDepsChange ? null : control;
}

function useDidDepsChange(deps: unknown[]): boolean {
  const prevDeps = usePrevious(deps);

  let didDepsChange = false;

  if (
    prevDeps?.length !== deps.length ||
    deps.some((dep, i) => dep !== prevDeps[i])
  ) {
    didDepsChange = true;
  }

  return didDepsChange;
}
