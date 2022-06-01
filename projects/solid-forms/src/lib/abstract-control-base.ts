import type {
  ValidatorFn,
  ValidationErrors,
  ControlId,
  AbstractControlInterface,
} from './abstract-control';
import { IAbstractControl } from './abstract-control';
import { SetStoreFunction, Store } from 'solid-js/store';
import {
  Accessor,
  createComputed,
  createMemo,
  createSignal,
  on,
} from 'solid-js';
import { isEqual } from './util';

export const DEFAULT_SOURCE = 'CONTROL_DEFAULT_SOURCE';

export interface IAbstractControlBaseOptions<
  Data extends Record<ControlId, any> = Record<ControlId, any>
> {
  id?: ControlId;
  data?: Data;
  disabled?: boolean;
  touched?: boolean;
  dirty?: boolean;
  readonly?: boolean;
  required?: boolean;
  submitted?: boolean;
  errors?: null | ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>;
  validators?:
    | null
    | ValidatorFn
    | ValidatorFn[]
    | ReadonlyMap<ControlId, ValidatorFn>;
  pending?: boolean | ReadonlySet<ControlId>;
}

export function propInitializer(): [
  propInitializing: <T>(value: T) => T,
  initComplete: () => void
] {
  const [initializationSignal, setInitializationSignal] = createSignal<
    null | false
  >(null);

  return [
    <T>(value: T) => initializationSignal() || value,
    () => setInitializationSignal(false),
  ];
}

export function composeValidators(
  validators: undefined | null | ValidatorFn | ValidatorFn[]
): null | ValidatorFn {
  if (!validators || (Array.isArray(validators) && validators.length === 0)) {
    return null;
  }

  if (Array.isArray(validators)) {
    return (control) =>
      validators.reduce((prev: ValidationErrors | null, curr: ValidatorFn) => {
        const errors = curr(control);
        return errors ? { ...prev, ...errors } : prev;
      }, null);
  }

  return validators;
}

export type IAbstractControlBase<
  Data extends Record<ControlId, any> = Record<ControlId, any>
> = Omit<
  IAbstractControl<unknown, Data, unknown>,
  'value' | 'rawValue' | 'setValue' | typeof AbstractControlInterface
>;

let controlId = 0;

export function createAbstractControlBase<
  RawValue,
  Data extends Record<ControlId, any> = Record<ControlId, any>,
  Value = RawValue
>(
  store: Accessor<
    [
      Store<IAbstractControl<RawValue, Data, Value>>,
      SetStoreFunction<IAbstractControl<RawValue, Data, Value>>
    ]
  >,
  untilInit: <T>(value: T) => T,
  initOptions: Pick<IAbstractControlBaseOptions<Data>, 'id' | 'data'> = {}
): [base: IAbstractControlBase<Data>, initializer: () => void] {
  let control: Store<IAbstractControl<RawValue, Data, Value>>;
  let setControl: SetStoreFunction<IAbstractControl<RawValue, Data, Value>>;

  let selfIsPendingMemo: Accessor<IAbstractControl['self']['isPending']>;
  let selfErrorsMemo: Accessor<ValidationErrors | null>;
  let statusMemo: Accessor<IAbstractControl['status']>;
  let validatorMemo: Accessor<IAbstractControl['validator']>;

  const base: IAbstractControlBase<Data> = {
    id: initOptions.id || Symbol(`AbstractControl-${controlId++}`),

    data: { ...(initOptions.data as Data) },

    self: {
      get isValid() {
        // here "this" is self
        return this.errors === null && !this.isPending;
      },
      isDisabled: false,
      isTouched: false,
      isDirty: false,
      isReadonly: false,
      isSubmitted: false,
      isRequired: false,
      get isPending() {
        return selfIsPendingMemo?.() ?? untilInit(false);
      },
      get errors() {
        return selfErrorsMemo?.() ?? untilInit(null);
      },
    },

    get isDisabled() {
      return this.self.isDisabled;
    },

    get isTouched() {
      return this.self.isTouched;
    },

    get isDirty() {
      return this.self.isDirty;
    },

    get isReadonly() {
      return this.self.isReadonly;
    },

    get isSubmitted() {
      return this.self.isSubmitted;
    },

    get isRequired() {
      return this.self.isRequired;
    },

    get errors() {
      return this.self.errors;
    },

    errorsStore: new Map(),

    get isPending() {
      return this.self.isPending;
    },

    pendingStore: new Set(),

    get isValid() {
      return this.self.isValid;
    },

    get status() {
      return statusMemo?.() ?? untilInit('VALID');
    },

    get validator() {
      return validatorMemo?.() ?? untilInit(null);
    },

    validatorStore: new Map(),

    markDisabled(input) {
      if (isEqual(this.self.isDisabled, input)) return;
      setControl('self', 'isDisabled', input);
    },

    markReadonly(input) {
      if (isEqual(this.self.isReadonly, input)) return;
      setControl('self', 'isReadonly', input);
    },

    markRequired(input) {
      if (isEqual(this.self.isRequired, input)) return;
      setControl('self', 'isRequired', input);
    },

    markDirty(input) {
      if (isEqual(this.self.isDirty, input)) return;
      setControl('self', 'isDirty', input);
    },

    markTouched(input) {
      if (isEqual(this.self.isTouched, input)) return;
      setControl('self', 'isTouched', input);
    },

    markSubmitted(input) {
      if (isEqual(this.self.isSubmitted, input)) return;
      setControl('self', 'isSubmitted', input);
    },

    markPending(input, options) {
      let newPendingStore: Set<ControlId>;

      if (typeof input === 'boolean') {
        const source = options?.source || DEFAULT_SOURCE;

        if (this.pendingStore.has(source) === input) return;

        newPendingStore = new Set(this.pendingStore);

        if (input) {
          newPendingStore.add(source);
        } else {
          newPendingStore.delete(source);
        }
      } else {
        if (this.pendingStore === input) return;

        newPendingStore = new Set(input);
      }

      if (isEqual(this.pendingStore, newPendingStore)) return;

      setControl('pendingStore', newPendingStore);
    },

    setErrors(input, options) {
      const source = options?.source || DEFAULT_SOURCE;

      const existingStore = this.errorsStore;

      let newErrorsStore: Map<ControlId, ValidationErrors>;

      if (input instanceof Map) {
        newErrorsStore = input;
      } else if (input === null || Object.keys(input).length === 0) {
        newErrorsStore = new Map(existingStore);
        newErrorsStore.delete(source);
      } else {
        newErrorsStore = new Map(existingStore).set(source, input);
      }

      if (isEqual(this.errorsStore, newErrorsStore)) return;

      setControl('errorsStore', newErrorsStore);
    },

    patchErrors(input, options) {
      const existingStore = this.errorsStore as Map<
        ControlId,
        ValidationErrors
      >;

      if (input instanceof Map) {
        setControl('errorsStore', new Map([...existingStore, ...input]));
      } else {
        if (Object.keys(input).length === 0) return;

        const source = options?.source || DEFAULT_SOURCE;

        let newErrors: ValidationErrors = input;

        let existingValue = existingStore.get(source);

        if (existingValue) {
          existingValue = { ...existingValue };

          for (const [k, err] of Object.entries(newErrors)) {
            if (err === null) {
              delete existingValue![k];
            } else {
              existingValue![k] = err;
            }
          }

          newErrors = existingValue;
        } else {
          const entries = Object.entries(newErrors).filter(
            ([, v]) => v !== null
          );

          if (entries.length === 0) return;

          newErrors = Object.fromEntries(entries);
        }

        const newErrorsStore = new Map(existingStore);

        if (Object.keys(newErrors).length === 0) {
          newErrorsStore.delete(source);
        } else {
          newErrorsStore.set(source, newErrors);
        }

        if (isEqual(this.errorsStore, newErrorsStore)) return;

        setControl('errorsStore', newErrorsStore);
      }
    },

    setValidators(input, options) {
      const source = options?.source || DEFAULT_SOURCE;

      let newValidatorsStore: Map<ControlId, ValidatorFn>;

      if (input instanceof Map) {
        newValidatorsStore = new Map(input);
      } else {
        newValidatorsStore = new Map(
          this.validatorStore as Map<ControlId, ValidatorFn>
        );

        const newValidator = composeValidators(
          input as Exclude<typeof input, ReadonlyMap<any, any>>
        );

        if (newValidator) {
          newValidatorsStore.set(source, newValidator);
        } else {
          newValidatorsStore.delete(source);
        }
      }

      if (isEqual(this.validatorStore, newValidatorsStore)) return;

      setControl('validatorStore', newValidatorsStore);
    },

    setData(key, input) {
      if (isEqual(this.data[key], input)) return;
      // tslint:disable-next-line: no-any
      setControl('data', key as any, input);
    },
  };

  const initializer = () => {
    [control, setControl] = store();

    selfIsPendingMemo = createMemo(() => control.pendingStore.size > 0);

    selfErrorsMemo = createMemo(() => {
      return control.errorsStore.size === 0
        ? null
        : Array.from(control.errorsStore.values()).reduce<ValidationErrors>(
            (p, errors) => ({
              ...p,
              ...errors,
            }),
            {}
          );
    });

    statusMemo = createMemo(() => {
      return control.isDisabled
        ? 'DISABLED'
        : control.isPending
        ? 'PENDING'
        : control.isValid
        ? 'VALID'
        : 'INVALID';
    });

    validatorMemo = createMemo(() => {
      if (control.validatorStore.size === 0) return null;

      const validators = Array.from(control.validatorStore.values());

      return (c) => {
        const e = validators.reduce<ValidationErrors>((err, v) => {
          return { ...err, ...v(c) };
        }, {});

        return Object.keys(e).length === 0 ? null : e;
      };
    });

    // Intentionally not using `createRenderEffect()` since it appears to
    // mess with initializing a control with errors (i.e. it clears the errors
    // after the control is initialized)
    createComputed(
      on(
        () => control.validator?.(control.value) ?? null,
        (errors) => {
          if (control.errorsStore.get(DEFAULT_SOURCE) === errors) return;

          const newErrorsStore = new Map(
            control.errorsStore as Map<ControlId, ValidationErrors>
          );

          if (errors) {
            newErrorsStore.set(DEFAULT_SOURCE, errors);
          } else {
            newErrorsStore.delete(DEFAULT_SOURCE);
          }

          if (isEqual(control.errorsStore, newErrorsStore)) return;

          setControl('errorsStore', newErrorsStore);
        }
      )
    );
  };

  return [base, initializer];
}
