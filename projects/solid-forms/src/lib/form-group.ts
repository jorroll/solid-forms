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

export const FormGroupInterface = '@@FormGroupInterface_solidjs';

export interface IFormGroupOptions<
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControlBaseOptions<Data> {}

export interface IFormGroup<
  Controls extends { [key: string]: IAbstractControl } = {
    [key: string]: IAbstractControl;
  },
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControlContainer<Controls, Data> {
  [FormGroupInterface]: true;
}

export function isFormGroup(object?: unknown): object is IFormGroup {
  return (
    isAbstractControlContainer(object) &&
    (object as any)?.[FormGroupInterface] === true
  );
}

export function createFormGroup<
  Controls extends { [key: string]: IAbstractControl } = {
    [key: string]: IAbstractControl;
  },
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  controls?: Controls,
  options?: IFormGroupOptions<Data>
): IFormGroup<Controls, Data>;
export function createFormGroup<
  Controls extends { [key: string]: IAbstractControl } = {
    [key: string]: IAbstractControl;
  },
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  initControls = {} as Controls,
  initOptions: IFormGroupOptions<Data> = {}
): IFormGroup<Controls, Data> {
  let control: Store<IFormGroup<Controls, Data>>;
  let setControl: SetStoreFunction<IFormGroup<Controls, Data>>;

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
    [FormGroupInterface]: true,

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
            delete state.controls[key];
          } else {
            state.controls[key] = newControl;
          }
        })
      );
    },
  } as IFormGroup<Controls, Data>);

  [control, setControl] = createStore(storeConfig);

  initializeBase();

  const allControlEntriesMemo = createMemo(() =>
    Object.entries(control.controls)
  );

  const enabledControlEntriesMemo = createMemo(() =>
    allControlEntriesMemo().filter(([, c]) => !c.isDisabled)
  );

  rawValueMemo = createMemo(
    () =>
      Object.fromEntries(
        allControlEntriesMemo().map(([k, c]) => [k, c.rawValue])
      ) as ControlsRawValue<Controls>
  );

  valueMemo = createMemo(
    () =>
      Object.fromEntries(
        enabledControlEntriesMemo().map(([k, c]) => [k, c.value])
      ) as ControlsValue<Controls>
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

  return control as unknown as IFormGroup<Controls, Data>;
}
