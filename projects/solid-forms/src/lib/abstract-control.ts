// *****************************
// Misc Types
// *****************************

export type ControlId = string | symbol;

export type ValidatorFn<T = any> = (value: T) => ValidationErrors | null;

export interface ValidationErrors {
  [key: string]: any;
}

// *****************************
// AbstractControl interface
// *****************************

export const AbstractControlInterface = '@@AbstractControlInterface_solidjs';

/** Returns true if the provided object implements `IAbstractControl` */
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

  /**
   * The data property can store arbitrary custom data. Use the
   * `setData` method on `IAbstractControl` to update it.
   *
   * The `data` property is, itself, an object. You can set individual
   * keys on the data property with `setData` but you cannot reset
   * or clear the whole object. This is intentional. A library
   * maintainer can store private data within the `data` property
   * using a symbol without fear of the user accidently erasing it.
   */
  readonly data: Data;

  /**
   * The value of the IAbstractControl.
   *
   * In an IAbstractControlContainer,
   * `value` and `rawValue` can be different, but in a standard
   * `IAbstractControl` `value` is just an alias for `rawValue`.
   * See the IAbstractControlContainer interface for possible differences
   * between `value` and `rawValue`.
   */
  readonly value: Value;

  /**
   * The value of the IAbstractControl.
   *
   * In an IAbstractControlContainer,
   * `value` and `rawValue` can be different, but in a standard
   * `IAbstractControl` `value` is just an alias for `rawValue` and
   * rawValue just contains the control's value.
   * See the IAbstractControlContainer interface for possible differences
   * between `value` and `rawValue`.
   */
  readonly rawValue: RawValue;

  /**
   * `true` if this control is disabled, false otherwise.
   * This is an alias for `self.isDisabled`.
   */
  readonly isDisabled: boolean;

  /**
   * `true` if this control is touched, false otherwise.
   * This is an alias for `self.isTouched`.
   */
  readonly isTouched: boolean;

  /**
   * `true` if this control is dirty, false otherwise.
   * This is an alias for `self.isDirty`.
   */
  readonly isDirty: boolean;
  /**
   * `true` if this control is readonly, false otherwise.
   * This is an alias for `self.isReadonly`.
   */
  readonly isReadonly: boolean;
  /**
   * `true` if this control is submitted, false otherwise.
   * This is an alias for `self.isSubmitted`.
   */
  readonly isSubmitted: boolean;
  /**
   * `true` if this control is required, false otherwise.
   * This is an alias for `self.isRequired`.
   *
   * Note that this property doesn't
   * have any predefined meaning for IAbstractControls and it doesn't affect
   * validation in any way. It is up to you to decide what meaning, if any,
   * to give to this property and how to use it. For example, if you
   * validated the control inside a `createEffect()`, you could choose to alter the
   * validation based on whether the control was marked as `required` or
   * not.
   */
  readonly isRequired: boolean;

  /**
   * Contains a `ValidationErrors` object if this control
   * has any errors. Otherwise contains `null`.
   *
   * An alias for `self.errors`.
   */
  readonly errors: ValidationErrors | null;

  /**
   * A validator function that is run on value changes and which
   * generates errors associated with the source "CONTROL_DEFAULT_SOURCE".
   */
  readonly validator: ValidatorFn | null;

  /**
   * `true` if this control is pending, false otherwise.
   * This is an alias for `self.isPending`.
   */
  readonly isPending: boolean;

  /**
   * Valid if `errors === null && !isPending`
   *
   * This is an alias for `self.valid`.
   */
  readonly isValid: boolean;

  /**
   * The `self` object on an abstract control contains
   * properties reflecting the control's personal state. On an
   * IAbstractControlContainer, the personal state can differ
   * from the control's state. For example, an
   * IAbstractControlContainer will register as disabled if
   * the control itself has been marked as disabled OR if
   * all of it's child controls are disabled.
   *
   * Marking the control container
   * itself as disabled doesn't mark the container's children as
   * disabled. On a standard IAbstractControl though,
   * the "self" properties are the same as regular properties.
   * I.e. `self.isInvalid` is the same as `isInvalid` on a
   * standard IAbstractControl (actually, `isInvalid` is
   * an alias for `self.isInvalid` on a standard control).
   */
  readonly self: {
    /** `this.self.errors === null && !this.self.isPending` */
    readonly isValid: boolean;

    /** `true` if this control is disabled, false otherwise. */
    readonly isDisabled: boolean;

    /** `true` if this control is touched, false otherwise. */
    readonly isTouched: boolean;

    /**
     * `true` if this control is dirty, false otherwise.
     *
     * Dirty can be thought of as, "Has the value changed?"
     * Though the isDirty property must be manually set by
     * the user (using `markDirty()`) and is not automatically
     * updated.
     */
    readonly isDirty: boolean;
    /**
     * `true` if this control is readonly, false otherwise.
     *
     * This property does not have any predefined meeting for
     * an IAbstractControl. You can decide if you want to give
     * it meaning by, for example, using this value to set
     * an input's readonly status (e.g.
     * `<input readonly={control.isReadonly} />`)
     */
    readonly isReadonly: boolean;

    /** `true` if this control is submitted, false otherwise. */
    readonly isSubmitted: boolean;

    /**
     * `true` if this control is required, false otherwise.
     *
     * Note that this property doesn't
     * have any predefined meaning for IAbstractControls and it doesn't affect
     * validation in any way. It is up to you to decide what meaning, if any,
     * to give to this property and how to use it. For example, if you
     * validated the control inside a `createEffect()` you could alter the
     * validation based on whether the control was marked as `required` or
     * not.
     */
    readonly isRequired: boolean;

    /** `true` if this control is pending, false otherwise. */
    readonly isPending: boolean;

    /**
     * Contains a `ValidationErrors` object if this control
     * has any errors. Otherwise contains `null`.
     */
    readonly errors: ValidationErrors | null;

    /**
     * *More advanced-ish*
     *
     * Contains a map of ControlId values and ValidationErrors.
     * The errorsStore allows partitioning errors so that
     * they can be associated with different sources and so
     * that one source does not overwrite another source.
     *
     * The `self.errors` property gets its errors from the errorsStore.
     */
    readonly errorsStore: ReadonlyMap<ControlId, ValidationErrors>;

    /**
     * More advanced-ish*
     *
     * A set of ControlIds. `self.isPending` is true so long
     * as `pendingStore.size > 0`. Because this is a set, you
     * can track multiple pending "things" at once. This
     * control will register as pending until all of the "things"
     * have resolved. Use the `markPending()` method with
     * the `source` option to update the pendingStore.
     */
    readonly pendingStore: ReadonlySet<ControlId>;

    /**
     * More advanced-ish*
     *
     * A map of ControlIds and ValidatorFns. The `validator`
     * property is composed of all the validator functions in the
     * `validatorStore`. The validatorStore allows you to change
     * individual validator functions on the control without
     * affecting other validator functions on the control.
     *
     * When you use the `setValidators` method, you are updating
     * the validatorStore.
     */
    readonly validatorStore: ReadonlyMap<ControlId, ValidatorFn>;
  };

  /**
   * If this control is disabled, the status is `"DISABLED"`,
   * else if this control is pending, the status is `"PENDING"`,
   * else if this control has any errors, the status is `"INVALID"`,
   * else the status is `"VALID"`.
   */
  readonly status: 'DISABLED' | 'PENDING' | 'INVALID' | 'VALID';

  [AbstractControlInterface]: true;

  /** set the control's value  */
  setValue(value: RawValue): void;

  /**
   * If provided a `ValidationErrors` object or `null`, replaces `self.errors`.
   * Optionally, provide a source ID and the change will be partitioned
   * assocaited with the source ID. The default source ID is
   * "CONTROL_DEFAULT_SOURCE".
   *
   * If you provide a `Map` object containing `ValidationErrors` keyed to source IDs,
   * that will replace the `self.errorsStore` associated with this control.
   */
  setErrors(
    value: ValidationErrors | null | ReadonlyMap<ControlId, ValidationErrors>,
    options?: { source?: ControlId }
  ): void;

  /**
   * If you provide a `ValidationErrors` object, that object is merged with the
   * existing errors associated with the source ID. If the error object has
   * keys equal to `null`, errors associated with those keys are deleted
   * from the errors object.
   *
   * If you provide a `Map` object containing `ValidationErrors` keyed to source IDs,
   * that object is merged with the existing `errorsStore`.
   */
  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options?: { source?: ControlId }
  ): void;

  /** sets `self.isTouched` */
  markTouched(value: boolean): void;

  /** sets `self.isDirty` */
  markDirty(value: boolean): void;

  /** sets `self.isReadonly` */
  markReadonly(value: boolean): void;

  /**
   * Sets `self.isRequired`.
   *
   * Note that this property doesn't
   * have any predefined meaning for IAbstractControls and it doesn't affect
   * validation in any way. It is up to you to decide what meaning, if any,
   * to give to this property and how to use it. For example, if you
   * validated the control inside a `createEffect()` you could alter the
   * validation based on whether the control was marked as `required` or
   * not.
   */
  markRequired(value: boolean): void;

  /**
   * Set `self.isDisabled`.
   *
   * Note that `self.isDisabled`` affect's the control's `status`
   * property. Additionally, `IAbstractControlContainer's` ignore
   * disabled children in many cases. For example, the `value` of a
   * control container is equal to the value of it's _enabled_ children
   * (if you want to see the value including disabled children, use
   * `rawValue`).
   */
  markDisabled(value: boolean): void;

  /** sets `self.isSubmitted` */
  markSubmitted(value: boolean): void;

  /** sets `self.pendingStore` and `self.isPending` */
  markPending(
    value: boolean | ReadonlySet<ControlId>,
    options?: { source?: ControlId }
  ): void;

  /** sets `validator` and `self.validatorStore` */
  setValidators(
    value:
      | ValidatorFn
      | ValidatorFn[]
      | ReadonlyMap<ControlId, ValidatorFn>
      | null,
    options?: { source?: ControlId }
  ): void;

  /**
   * The data property can store arbitrary custom data. Use the
   * `setData` method on `IAbstractControl` to update it.
   *
   * The `data` property is, itself, an object. You can set individual
   * keys on the data property with `setData` but you cannot reset
   * or clear the whole object. This is intentional. A library
   * maintainer can store private data within the `data` property
   * using a symbol without fear of the user accidently erasing it.
   */
  setData<K extends keyof Data>(key: K, data: Data[K]): void;
}
