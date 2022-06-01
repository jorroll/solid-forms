// *****************************
// Misc Types
// *****************************

export type ControlId = string | symbol;

export type ValidatorFn = (value: any) => ValidationErrors | null;

export interface ValidationErrors {
  [key: string]: any;
}

// *****************************
// AbstractControl interface
// *****************************

export const AbstractControlInterface = '@@AbstractControlInterface_solidjs';

export function isAbstractControl(
  object?: unknown
): object is IAbstractControl {
  return (
    typeof object === 'object' &&
    (object as any)?.[AbstractControlInterface] === true
  );
}

export interface IAbstractControl<
  RawValue = any,
  Data extends Record<ControlId, any> = Record<ControlId, any>,
  Value = RawValue
> {
  /**
   * The ID is used to determine where StateChanges originated,
   * and to ensure that a given AbstractControl only processes
   * values one time.
   */
  readonly id: ControlId;

  readonly data: Data;

  /**
   * The value of the AbstractControl. This is an alias for `rawValue`.
   */
  readonly value: Value;
  /** The value of the AbstractControl. */
  readonly rawValue: RawValue;
  /**
   * `true` if this control is disabled, false otherwise.
   * This is an alias for `selfDisabled`.
   */
  readonly isDisabled: boolean;

  /**
   * `true` if this control is touched, false otherwise.
   * This is an alias for `selfTouched`.
   */
  readonly isTouched: boolean;

  /**
   * `true` if this control is dirty, false otherwise.
   * This is an alias for `selfDirty`.
   */
  readonly isDirty: boolean;
  /**
   * `true` if this control is readonly, false otherwise.
   * This is an alias for `selfReadonly`.
   */
  readonly isReadonly: boolean;
  /**
   * `true` if this control is submitted, false otherwise.
   * This is an alias for `selfSubmitted`.
   */
  readonly isSubmitted: boolean;
  /**
   * `true` if this control is required, false otherwise.
   * This is an alias for `selfRequired`.
   */
  readonly isRequired: boolean;

  /**
   * Contains a `ValidationErrors` object if this control
   * has any errors. Otherwise contains `null`.
   *
   * An alias for `selfErrors`.
   */
  readonly errors: ValidationErrors | null;
  readonly errorsStore: ReadonlyMap<ControlId, ValidationErrors>;

  readonly validator: ValidatorFn | null;
  readonly validatorStore: ReadonlyMap<ControlId, ValidatorFn>;

  /**
   * `true` if this control is pending, false otherwise.
   * This is an alias for `selfPending`.
   */
  readonly isPending: boolean;
  readonly pendingStore: ReadonlySet<ControlId>;

  /**
   * Valid if `this.selfErrors === null && !this.selfPending`
   *
   * This is an alias for `selfValid`.
   */
  readonly isValid: boolean;

  readonly self: {
    /** `this.self.errors === null && !this.self.isPending` */
    readonly isValid: boolean;
    /** `true` if this control is disabled, false otherwise. */
    readonly isDisabled: boolean;
    /** `true` if this control is touched, false otherwise. */
    readonly isTouched: boolean;
    /** `true` if this control is dirty, false otherwise. */
    readonly isDirty: boolean;
    /** `true` if this control is readonly, false otherwise. */
    readonly isReadonly: boolean;
    /** `true` if this control is submitted, false otherwise. */
    readonly isSubmitted: boolean;
    /** `true` if this control is required, false otherwise. */
    readonly isRequired: boolean;
    /** `true` if this control is pending, false otherwise. */
    readonly isPending: boolean;
    /**
     * Contains a `ValidationErrors` object if this control
     * has any errors. Otherwise contains `null`.
     */
    readonly errors: ValidationErrors | null;
  };

  readonly status: 'DISABLED' | 'PENDING' | 'VALID' | 'INVALID';

  [AbstractControlInterface]: true;

  setValue(value: RawValue): void;

  /**
   * If provided a `ValidationErrors` object or `null`, replaces the errors
   * associated with the source ID.
   *
   * If provided a `Map` object containing `ValidationErrors` keyed to source IDs,
   * uses it to replace the `errorsStore` associated with this control.
   */
  setErrors(
    value: ValidationErrors | null | ReadonlyMap<ControlId, ValidationErrors>,
    options?: { source?: ControlId }
  ): void;

  /**
   * If provided a `ValidationErrors` object, that object is merged with the
   * existing errors associated with the source ID. If the error object has
   * properties = `null`, errors associated with those keys are deleted
   * from the `errorsStore`.
   *
   * If provided a `Map` object containing `ValidationErrors` keyed to source IDs,
   * that object is merged with the existing `errorsStore`.
   */
  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options?: { source?: ControlId }
  ): void;

  markTouched(value: boolean): void;
  markDirty(value: boolean): void;
  markReadonly(value: boolean): void;
  markRequired(value: boolean): void;
  markDisabled(value: boolean): void;
  markSubmitted(value: boolean): void;
  markPending(
    value: boolean | ReadonlySet<ControlId>,
    options?: { source?: ControlId }
  ): void;

  setValidators(
    value:
      | ValidatorFn
      | ValidatorFn[]
      | ReadonlyMap<ControlId, ValidatorFn>
      | null,
    options?: { source?: ControlId }
  ): void;

  setData<K extends keyof Data>(key: K, data: Data[K]): void;
}
