import type {
  AbstractControlInterface,
  ControlId,
  ValidationErrors,
} from './abstract-control';

import { IAbstractControl } from './abstract-control';

import {
  AbstractControlContainerInterface,
  ControlsKey,
  ControlsRawValue,
  ControlsValue,
  GenericControlsObject,
  isAbstractControlContainer,
} from './abstract-control-container';

import { IAbstractControlContainer } from './abstract-control-container';

import {
  createAbstractControlBase,
  IAbstractControlBaseOptions,
} from './abstract-control-base';

import { produce, SetStoreFunction, Store } from 'solid-js/store';
import { Accessor, batch, createMemo } from 'solid-js';
import { isEqual, mergeObj } from './util';
import { PartialDeep } from 'type-fest';

export interface IAbstractControlContainerBaseArgs<
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControlBaseOptions<Data> {}

export interface IAbstractControlContainerBase<
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends Omit<
    IAbstractControlContainer<any, Data>,
    | 'value'
    | 'rawValue'
    | 'controls'
    | 'setControl'
    | typeof AbstractControlInterface
    | typeof AbstractControlContainerInterface
  > {}

export function createAbstractControlContainerBase<
  Controls extends GenericControlsObject = any,
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  store: Accessor<
    [
      Store<IAbstractControlContainer<Controls, Data>>,
      SetStoreFunction<IAbstractControlContainer<Controls, Data>>
    ]
  >,
  untilInit: <T>(value: T) => T,
  initOptions: IAbstractControlContainerBaseArgs<Data> = {}
): [base: IAbstractControlContainerBase<Data>, initializer: () => void] {
  let control: Store<IAbstractControlContainer<Controls, Data>>;
  let setControl: SetStoreFunction<IAbstractControlContainer<Controls, Data>>;

  const [base, initializeAbstractControl] = createAbstractControlBase<
    ControlsRawValue<Controls>,
    Data,
    ControlsValue<Controls>
  >(() => [control, setControl], untilInit, initOptions);

  let sizeMemo: Accessor<number>;

  let childIsValidMemo: Accessor<boolean>;
  let childIsDisabledMemo: Accessor<boolean>;
  let childIsReadonlyMemo: Accessor<boolean>;
  let childIsRequiredMemo: Accessor<boolean>;
  let childIsPendingMemo: Accessor<boolean>;
  let childIsTouchedMemo: Accessor<boolean>;
  let childIsDirtyMemo: Accessor<boolean>;
  let childIsSubmittedMemo: Accessor<boolean>;

  let childrenAreValidMemo: Accessor<boolean>;
  let childrenAreDisabledMemo: Accessor<boolean>;
  let childrenAreReadonlyMemo: Accessor<boolean>;
  let childrenAreRequiredMemo: Accessor<boolean>;
  let childrenArePendingMemo: Accessor<boolean>;
  let childrenAreTouchedMemo: Accessor<boolean>;
  let childrenAreDirtyMemo: Accessor<boolean>;
  let childrenAreSubmittedMemo: Accessor<boolean>;

  let errorsMemo: Accessor<ValidationErrors | null>;
  let childrenErrorsMemo: Accessor<ValidationErrors | null>;

  const containerBase = mergeObj(base, {
    get size() {
      return sizeMemo?.() ?? untilInit(0);
    },

    get isDisabled() {
      return this.self.isDisabled || this.children.areDisabled;
    },

    get isTouched() {
      return this.self.isTouched || this.child.isTouched;
    },

    get isDirty() {
      return this.self.isDirty || this.child.isDirty;
    },

    get isReadonly() {
      return this.self.isReadonly || this.children.areReadonly;
    },

    get isSubmitted() {
      return this.self.isSubmitted || this.children.areSubmitted;
    },

    get isRequired() {
      return this.self.isRequired || this.child.isRequired;
    },

    get isPending() {
      return this.self.isPending || this.child.isPending;
    },

    get errors() {
      return errorsMemo?.() ?? untilInit(null);
    },

    get isValid() {
      return this.self.isValid && this.children.areValid;
    },

    child: {
      /** Will return true if *any* `enabled` direct child control is `valid` */
      get isValid() {
        return childIsValidMemo?.() ?? untilInit(true);
      },
      /** Will return true if *any* direct child control is `disabled` */
      get isDisabled() {
        return childIsDisabledMemo?.() ?? untilInit(false);
      },
      /** Will return true if *any* `enabled` direct child control is `readonly` */
      get isReadonly() {
        return childIsReadonlyMemo?.() ?? untilInit(false);
      },
      /** Will return true if *any* `enabled` direct child control is `required` */
      get isRequired() {
        return childIsRequiredMemo?.() ?? untilInit(false);
      },
      /** Will return true if *any* `enabled` direct child control is `pending` */
      get isPending() {
        return childIsPendingMemo?.() ?? untilInit(false);
      },
      /** Will return true if *any* `enabled` direct child control is `touched` */
      get isTouched() {
        return childIsTouchedMemo?.() ?? untilInit(false);
      },
      /** Will return true if *any* `enabled` direct child control is `dirty` */
      get isDirty() {
        return childIsDirtyMemo?.() ?? untilInit(false);
      },
      /** Will return true if *any* `enabled` direct child control is `submitted` */
      get isSubmitted() {
        return childIsSubmittedMemo?.() ?? untilInit(false);
      },
    },

    children: {
      /** Will return true if *all* `enabled` direct child control's are `valid` */
      get areValid() {
        return childrenAreValidMemo?.() ?? untilInit(true);
      },
      /** Will return true if *all* direct child control's are `disabled` */
      get areDisabled() {
        return childrenAreDisabledMemo?.() ?? untilInit(false);
      },
      /** Will return true if *all* `enabled` direct child control's are `readonly` */
      get areReadonly() {
        return childrenAreReadonlyMemo?.() ?? untilInit(false);
      },
      /** Will return true if *all* `enabled` direct child control's are `required` */
      get areRequired() {
        return childrenAreRequiredMemo?.() ?? untilInit(false);
      },
      /** Will return true if *all* `enabled` direct child control's are `pending` */
      get arePending() {
        return childrenArePendingMemo?.() ?? untilInit(false);
      },
      /** Will return true if *all* `enabled` direct child control's are `touched` */
      get areTouched() {
        return childrenAreTouchedMemo?.() ?? untilInit(false);
      },
      /** Will return true if *all* `enabled` direct child control's are `dirty` */
      get areDirty() {
        return childrenAreDirtyMemo?.() ?? untilInit(false);
      },
      /** Will return true if *all* `enabled` direct child control's are `submitted` */
      get areSubmitted() {
        return childrenAreSubmittedMemo?.() ?? untilInit(false);
      },
      /** Contains *all* `enabled` child control errors or `null` if there are none */
      get errors() {
        return childrenErrorsMemo?.() ?? untilInit(null);
      },

      markDirty(value, options) {
        batch(() => {
          Object.values(control.controls).forEach((c) => {
            (c as IAbstractControl).markDirty(value);

            if (!options?.deep || !isAbstractControlContainer(c)) {
              return;
            }

            c.children.markDirty(value, options);
          });
        });
      },

      markDisabled(value, options) {
        batch(() => {
          Object.values(control.controls).forEach((c) => {
            (c as IAbstractControl).markDisabled(value);

            if (!options?.deep || !isAbstractControlContainer(c)) {
              return;
            }

            c.children.markDisabled(value, options);
          });
        });
      },

      markPending(value, options) {
        batch(() => {
          Object.values(control.controls).forEach((c) => {
            (c as IAbstractControl).markPending(value, options);

            if (!options?.deep || !isAbstractControlContainer(c)) {
              return;
            }

            c.children.markPending(value, options);
          });
        });
      },

      markReadonly(value, options) {
        batch(() => {
          Object.values(control.controls).forEach((c) => {
            (c as IAbstractControl).markReadonly(value);

            if (!options?.deep || !isAbstractControlContainer(c)) {
              return;
            }

            c.children.markReadonly(value, options);
          });
        });
      },

      markRequired(value, options) {
        batch(() => {
          Object.values(control.controls).forEach((c) => {
            (c as IAbstractControl).markRequired(value);

            if (!options?.deep || !isAbstractControlContainer(c)) {
              return;
            }

            c.children.markRequired(value, options);
          });
        });
      },

      markSubmitted(value, options) {
        batch(() => {
          Object.values(control.controls).forEach((c) => {
            (c as IAbstractControl).markSubmitted(value);

            if (!options?.deep || !isAbstractControlContainer(c)) {
              return;
            }

            c.children.markSubmitted(value, options);
          });
        });
      },

      markTouched(value, options) {
        batch(() => {
          Object.values(control.controls).forEach((c) => {
            (c as IAbstractControl).markTouched(value);

            if (!options?.deep || !isAbstractControlContainer(c)) {
              return;
            }

            c.children.markTouched(value, options);
          });
        });
      },
    },

    get<A extends IAbstractControl = IAbstractControl>(
      ...args: any[]
    ): A | null {
      const that = this as unknown as IAbstractControlContainer;

      if (args.length === 0) {
        throw new Error('Missing arguments for AbstractControlContainer#get()');
      } else if (args.length === 1) {
        return that.controls[args[0]];
      }

      return args.reduce((prev: IAbstractControl | null, curr) => {
        if (isAbstractControlContainer(prev)) {
          return prev.get(curr);
        }

        return null;
      }, that as IAbstractControl | null);
    },

    setControls(controls: Controls) {
      if (isEqual(control.controls, controls)) return;
      setControl('controls', controls);
    },

    /**
     * The provided control is removed from this FormGroup
     * if it is a child of this FormGroup.
     */
    removeControl(newControl: Controls[ControlsKey<Controls>]) {
      for (const [key, c] of Object.entries(control.controls!)) {
        if (c !== (newControl as unknown as IAbstractControl)) continue;

        control.setControl(key as ControlsKey<Controls>, null);
        return;
      }
    },

    setValue(value: ControlsRawValue<Controls>) {
      const valueEntries = Object.entries(value);

      if (valueEntries.length !== control.size!) {
        throw new Error(
          `setValue error: you must provide a value for each control.`
        );
      }

      batch(() => {
        for (const [key, val] of valueEntries) {
          const c = control.controls[
            key as ControlsKey<Controls>
          ] as unknown as IAbstractControl | undefined;

          if (!c) {
            throw new Error(`Invalid setValue value key "${key}".`);
          }

          c.setValue(val);
        }
      });
    },

    patchValue(value: PartialDeep<ControlsRawValue<Controls>>) {
      batch(() => {
        for (const [key, entryValue] of Object.entries(value)) {
          const c = control.controls[
            key as ControlsKey<Controls>
          ] as unknown as IAbstractControl | undefined;

          if (!c) {
            throw new Error(`Invalid patchValue value key "${key}".`);
          }

          if (isAbstractControlContainer(c)) {
            c.patchValue(entryValue);
          } else {
            c.setValue(entryValue);
          }
        }
      });
    },
  } as IAbstractControlContainerBase<Data>);

  const initializer = () => {
    [control, setControl] = store();

    initializeAbstractControl();

    const allControlsMemo = createMemo(() => Object.values(control.controls));

    const nonDisabledControlsMemo = createMemo(() =>
      allControlsMemo().filter((c) => !c.isDisabled)
    );

    sizeMemo = createMemo(() => allControlsMemo().length);

    childIsValidMemo = createMemo(() =>
      nonDisabledControlsMemo().some((c) => c.isValid)
    );

    childIsDisabledMemo = createMemo(() =>
      allControlsMemo().some((c) => c.isDisabled)
    );

    childIsReadonlyMemo = createMemo(() =>
      nonDisabledControlsMemo().some((c) => c.isReadonly)
    );

    childIsRequiredMemo = createMemo(() =>
      nonDisabledControlsMemo().some((c) => c.isRequired)
    );

    childIsPendingMemo = createMemo(() =>
      nonDisabledControlsMemo().some((c) => c.isPending)
    );

    childIsTouchedMemo = createMemo(() =>
      nonDisabledControlsMemo().some((c) => c.isTouched)
    );

    childIsDirtyMemo = createMemo(() =>
      nonDisabledControlsMemo().some((c) => c.isDirty)
    );

    childIsSubmittedMemo = createMemo(() =>
      nonDisabledControlsMemo().some((c) => c.isSubmitted)
    );

    childrenAreValidMemo = createMemo(() =>
      nonDisabledControlsMemo().every((c) => c.isValid)
    );

    childrenAreDisabledMemo = createMemo(() => {
      const controls = allControlsMemo();

      if (controls.length === 0) return false;

      return controls.every((c) => c.isDisabled);
    });

    childrenAreReadonlyMemo = createMemo(() => {
      const controls = nonDisabledControlsMemo();

      if (controls.length === 0) return false;

      return controls.every((c) => c.isReadonly);
    });

    childrenAreRequiredMemo = createMemo(() => {
      const controls = nonDisabledControlsMemo();

      if (controls.length === 0) return false;

      return controls.every((c) => c.isRequired);
    });

    childrenArePendingMemo = createMemo(() => {
      const controls = nonDisabledControlsMemo();

      if (controls.length === 0) return false;

      return controls.every((c) => c.isPending);
    });

    childrenAreTouchedMemo = createMemo(() => {
      const controls = nonDisabledControlsMemo();

      if (controls.length === 0) return false;

      return controls.every((c) => c.isTouched);
    });

    childrenAreDirtyMemo = createMemo(() => {
      const controls = nonDisabledControlsMemo();

      if (controls.length === 0) return false;

      return controls.every((c) => c.isDirty);
    });

    childrenAreSubmittedMemo = createMemo(() => {
      const controls = nonDisabledControlsMemo();

      if (controls.length === 0) return false;

      return controls.every((c) => c.isSubmitted);
    });

    errorsMemo = createMemo(() => {
      if (!control.self.errors && !control.children.errors) return null;

      return {
        ...control.children.errors,
        ...control.self.errors,
      };
    });

    childrenErrorsMemo = createMemo(() => {
      const controls = nonDisabledControlsMemo();

      return controls.reduce((prev, curr) => {
        return prev === null && curr === null
          ? null
          : { ...prev, ...curr.errors };
      }, null as ValidationErrors | null);
    });
  };

  return [containerBase, initializer];
}
