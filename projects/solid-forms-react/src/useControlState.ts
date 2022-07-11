import { useMemo, useEffect, useState } from 'react';
import { createRoot, createEffect } from 'solid-js';
import type { IAbstractControl } from 'solid-forms';

export function useControlState<T>(
  fn: () => T,
  deps: [theControl: IAbstractControl, ...otherDeps: any[]],
  isEqual: (a: T, b: T) => boolean = isEqualDefault
): T {
  const initialValue = useMemo(fn, []);

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const disposeFn = createRoot((disposer) => {
      createEffect((prevValue) => {
        const newValue = fn();

        if (isEqual(newValue, prevValue as T)) return prevValue;

        setValue(newValue);

        return newValue;
      });

      return disposer;
    });

    return disposeFn;
  }, [...deps, isEqual]);

  return value;
}

function isEqualDefault(a: unknown, b: unknown) {
  return a === b;
}
