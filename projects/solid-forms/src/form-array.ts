import {
  AbstractControlInterface,
  ControlId,
  IAbstractControl,
} from './abstract-control';
import { createAbstractControlContainerBase } from './abstract-control-container-base';
import {
  ControlsValue,
  ControlsRawValue,
  ControlsKey,
  IAbstractControlContainer,
  AbstractControlContainerInterface,
  isAbstractControlContainer,
} from './abstract-control-container';
import {
  IAbstractControlBaseOptions,
  propInitializer,
} from './abstract-control-base';
import { createStore, produce, SetStoreFunction, Store } from 'solid-js/store';
import { Accessor, batch, createMemo } from 'solid-js';
import { isEqual, mergeObj } from './util';
import type { PartialDeep } from 'type-fest';

export const FormArrayInterface = '@@FormArrayInterface_solidjs';

export interface IFormArrayOptions<
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControlBaseOptions<Data> {}

export interface IFormArray<
  Controls extends ReadonlyArray<IAbstractControl> = ReadonlyArray<IAbstractControl>,
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControlContainer<Controls, Data> {
  [FormArrayInterface]: true;
  push(control: Controls[number]): void;
  setControls(controls: Controls): void;
  removeControl(
    keyOrControl: ControlsKey<Controls> | Controls[ControlsKey<Controls>]
  ): void;
  patchValue(value: PartialDeep<ControlsRawValue<Controls>>): void;
}

/**
 * Returns true if the provided object implements
 * `IFormArray`
 */
export function isFormArray(object?: unknown): object is IFormArray {
  return (
    isAbstractControlContainer(object) &&
    (object as any)?.[FormArrayInterface] === true
  );
}

export function createFormArray<
  Controls extends ReadonlyArray<IAbstractControl> = ReadonlyArray<IAbstractControl>,
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  controls?: Controls,
  options?: IFormArrayOptions<Data>
): IFormArray<Controls, Data>;
export function createFormArray<
  Controls extends ReadonlyArray<IAbstractControl> = ReadonlyArray<IAbstractControl>,
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  initControls = [] as unknown as Controls,
  initOptions: IFormArrayOptions<Data> = {}
): IFormArray<Controls, Data> {
  let control: Store<IFormArray<Controls, Data>>;
  let setControl: SetStoreFunction<IFormArray<Controls, Data>>;

  const [untilInit, initComplete] = propInitializer();

  const [base, initializeBase] = createAbstractControlContainerBase(
    () => [control, setControl],
    untilInit,
    initOptions
  );

  let rawValueMemo: Accessor<ControlsRawValue<Controls>>;
  let valueMemo: Accessor<ControlsValue<Controls>>;

  const storeConfig = mergeObj(base, {
    [AbstractControlInterface]: true,
    [AbstractControlContainerInterface]: true,
    [FormArrayInterface]: true,

    controls: initControls,

    get rawValue() {
      return rawValueMemo?.() ?? untilInit({});
    },

    get value() {
      return valueMemo?.() ?? untilInit({});
    },

    setControl<N extends ControlsKey<Controls>>(
      key: N,
      newControl: Controls[N] | null
    ) {
      if (
        newControl === null
          ? !control.controls[key]
          : isEqual(control.controls[key], newControl)
      ) {
        return;
      }

      setControl(
        produce((state) => {
          if (newControl === null) {
            (
              state.controls as unknown as Array<
                typeof state['controls'][number]
              >
            ).splice(key, 1);
          } else {
            state.controls[key] = newControl;
          }
        })
      );
    },

    push(control: Controls[number]) {
      this.setControl(this.controls.length, control);
    },
  } as IFormArray<Controls, Data>);

  [control, setControl] = createStore(storeConfig);

  initializeBase();

  const enabledControlsMemo = createMemo(() =>
    control.controls.filter((c) => !c.isDisabled)
  );

  rawValueMemo = createMemo(
    () =>
      (control as IFormArray<Controls, Data>).controls.map(
        (c) => c.rawValue
      ) as unknown as ControlsRawValue<Controls>
  );

  valueMemo = createMemo(
    () =>
      enabledControlsMemo().map(
        (c) => c.value
      ) as unknown as ControlsValue<Controls>
  );

  initComplete();

  // Intentionally not using `batch()` since it appears to mess with
  // initializing a control with errors
  if (initOptions.disabled) control.markDisabled(initOptions.disabled);
  if (initOptions.touched) control.markTouched(initOptions.touched);
  if (initOptions.dirty) control.markDirty(initOptions.dirty);
  if (initOptions.readonly) control.markReadonly(initOptions.readonly);
  if (initOptions.submitted) control.markSubmitted(initOptions.submitted);
  if (initOptions.required) control.markRequired(initOptions.required);
  if (initOptions.pending) control.markPending(initOptions.pending);
  if (initOptions.validators) control.setValidators(initOptions.validators);
  if (initOptions.pending) control.markPending(initOptions.pending);
  // this needs to be last to ensure that the errors aren't overwritten
  if (initOptions.errors) control.patchErrors(initOptions.errors);

  return control as unknown as IFormArray<Controls, Data>;
}
