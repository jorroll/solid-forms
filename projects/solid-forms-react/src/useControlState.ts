import { useMemo, useEffect, useState } from 'react';
import { createRoot, createEffect } from 'solid-js';
import type { IAbstractControl } from 'solid-forms';

export function useControlState<T>(
  fn: () => T,
  deps: [theControl: IAbstractControl, ...otherDeps: any[]]
): T {
  const initialValue = useMemo(fn, []);

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const disposeFn = createRoot((disposer) => {
      createEffect((prevValue) => {
        const newValue = fn();

        if (newValue === prevValue) return prevValue;

        setValue(newValue);

        return newValue;
      });

      return disposer;
    });

    return disposeFn;
  }, deps);

  return value;
}
