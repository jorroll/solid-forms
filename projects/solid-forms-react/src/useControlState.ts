import { useCallback } from 'react';
import { createRoot, createEffect } from 'solid-js';
import type { IAbstractControl } from 'solid-forms';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

export function useControlState<T>(
  getControlState: () => T,
  deps: [theControl: IAbstractControl | undefined, ...otherDeps: any[]],
  isEqual: (a: T, b: T) => boolean = isEqualDefault
): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return createRoot((teardown) => {
        createEffect((prevValue) => {
          const newValue = getControlState();

          if (isEqual(newValue, prevValue as T)) return prevValue;

          onStoreChange();

          return newValue;
        });

        return teardown;
      });
    },
    [...deps, isEqual]
  );

  const value = useSyncExternalStoreWithSelector(
    subscribe,
    getControlState,
    undefined,
    (snapshot) => snapshot,
    isEqual
  );

  return value;
}

function isEqualDefault(a: unknown, b: unknown) {
  return a === b;
}
