import { batch } from 'solid-js';
import { createStore, SetStoreFunction, Store } from 'solid-js/store';
import {
  IAbstractControl,
  ControlId,
  AbstractControlInterface,
  isAbstractControl,
} from './abstract-control';
import {
  IAbstractControlBaseOptions,
  createAbstractControlBase,
  propInitializer,
} from './abstract-control-base';
import { isEqual, mergeObj } from './util';

export const FormControlInterface = '@@FormControlInterface_solidjs';

export interface IFormControlOptions<
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControlBaseOptions<Data> {}

export interface IFormControl<
  Value = any,
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControl<Value, Data, Value> {
  [FormControlInterface]: true;
}

/**
 * Returns true if the provided object implements
 * `IFormControl`
 */
export function isFormControl(object?: unknown): object is IFormControl {
  return (
    isAbstractControl(object) &&
    (object as any)?.[FormControlInterface] === true
  );
}

export function createFormControl<
  Value,
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  value?: Value,
  options?: IFormControlOptions<Data>
): IFormControl<Value, Data>;
export function createFormControl<
  Value,
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  initValue?: Value,
  initOptions: IFormControlOptions<Data> = {}
): IFormControl<Value, Data> {
  let control: Store<IFormControl<Value, Data>>;
  let setControl: SetStoreFunction<IFormControl<Value, Data>>;

  const [untilInit, initComplete] = propInitializer();

  const [base, initializeBase] = createAbstractControlBase<Value, Data, Value>(
    () => [control, setControl],
    untilInit,
    initOptions
  );

  const storeConfig = mergeObj(base, {
    [AbstractControlInterface]: true,
    [FormControlInterface]: true,

    rawValue: initValue as Value,

    get value() {
      return this.rawValue;
    },

    setValue(value) {
      if (isEqual(this.value, value)) return;
      setControl('rawValue', value);
    },
  } as IFormControl<Value, Data>);

  [control, setControl] = createStore<IFormControl<Value, Data>>(storeConfig);

  initializeBase();
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

  return control as unknown as IFormControl<Value, Data>;
}
