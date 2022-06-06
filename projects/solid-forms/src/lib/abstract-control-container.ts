import {
  ControlId,
  isAbstractControl,
  ValidationErrors,
} from './abstract-control';
import { IAbstractControl } from './abstract-control';

// UTILITY TYPES

type PickUndefinedKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

type PickRequiredKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];

type ObjectControlsOptionalRawValue<
  T extends { [key: string]: IAbstractControl | undefined }
> = {
  [P in Exclude<PickUndefinedKeys<T>, undefined>]?: NonNullable<
    T[P]
  >['rawValue'];
};

type ObjectControlsRequiredRawValue<
  T extends { [key: string]: IAbstractControl | undefined }
> = {
  [P in Exclude<PickRequiredKeys<T>, undefined>]: NonNullable<T[P]>['rawValue'];
};

type ArrayControlsRawValue<T extends ReadonlyArray<IAbstractControl>> =
  T extends ReadonlyArray<infer C>
    ? C extends IAbstractControl
      ? ReadonlyArray<C['rawValue']>
      : never
    : never;

type ObjectControlsOptionalValue<
  T extends { [key: string]: IAbstractControl | undefined }
> = {
  [P in Exclude<PickUndefinedKeys<T>, undefined>]?: NonNullable<T[P]>['value'];
};

type ObjectControlsRequiredValue<
  T extends { [key: string]: IAbstractControl | undefined }
> = {
  [P in Exclude<PickRequiredKeys<T>, undefined>]: NonNullable<T[P]>['value'];
};

type ArrayControlsValue<T extends ReadonlyArray<IAbstractControl>> =
  T extends ReadonlyArray<infer C>
    ? C extends IAbstractControl
      ? ReadonlyArray<C['value']>
      : never
    : never;

// END UTILITY TYPES

export type GenericControlsObject =
  | {
      readonly [key: string]: IAbstractControl;
    }
  | ReadonlyArray<IAbstractControl>;

// need to add the `keyof ControlsRawValue<Controls>` as well as
// `keyof ControlsValue<Controls>` as well as the `keyof Controls` etc
// because typescript doesn't realize that all three are the same keys
// and without all three, then ControlsKey can't be used to index all three
export type ControlsKey<Controls extends GenericControlsObject> =
  keyof ControlsRawValue<Controls> &
    keyof ControlsValue<Controls> &
    (Controls extends ReadonlyArray<any>
      ? keyof Controls & number
      : Controls extends object
      ? // the `& string` is needed or else
        // ControlsKey<{[key: string]: AbstractControl}> is type string | number
        keyof Controls & string
      : any);

export type ControlsRawValue<Controls extends GenericControlsObject> =
  Controls extends ReadonlyArray<IAbstractControl>
    ? ArrayControlsRawValue<Controls>
    : Controls extends { readonly [key: string]: IAbstractControl | undefined }
    ? ObjectControlsRequiredRawValue<Controls> &
        ObjectControlsOptionalRawValue<Controls>
    : never;

export type ControlsValue<Controls extends GenericControlsObject> =
  Controls extends ReadonlyArray<IAbstractControl>
    ? ArrayControlsValue<Controls>
    : Controls extends { readonly [key: string]: IAbstractControl | undefined }
    ? Partial<
        ObjectControlsRequiredValue<Controls> &
          ObjectControlsOptionalValue<Controls>
      >
    : never;

export type ContainerControls<C> = C extends IAbstractControlContainer<
  infer Controls
>
  ? Controls
  : unknown;

export const AbstractControlContainerInterface =
  '@@AbstractControlContainerInterface_solidjs';

/**
 * Returns true if the provided object implements
 * `IAbstractControlContainer`
 */
export function isAbstractControlContainer(
  object?: unknown
): object is IAbstractControlContainer {
  return (
    isAbstractControl(object) &&
    (object as any)[AbstractControlContainerInterface]
  );
}

export interface IAbstractControlContainer<
  Controls extends GenericControlsObject = any,
  Data = any
> extends IAbstractControl<
    ControlsRawValue<Controls>,
    Data,
    ControlsValue<Controls>
  > {
  /** Child controls associated with this container */
  readonly controls: Controls;

  /** The number of controls associated with this container */
  readonly size: number;

  /** Only returns values for enabled child controls. */
  readonly value: ControlsValue<Controls>;

  /**
   * Returns values for both enabled and disabled child controls.
   */
  readonly rawValue: ControlsRawValue<Controls>;

  /** Will return true if `this.self.isValid` and `this.children.isValid` */
  readonly isValid: boolean;

  /** Will return true if `this.self.isDisabled` or `this.children.areDisabled` */
  readonly isDisabled: boolean;

  /** Will return true if `this.self.isReadonly` or `this.children.areReadonly` */
  readonly isReadonly: boolean;

  /** Will return true if `this.self.isRequired` or `this.children.areRequired` */
  readonly isRequired: boolean;

  /** Will return true if `this.self.isPending` or `this.children.arePending` */
  readonly isPending: boolean;

  /** Will return true if `this.self.isTouched` or `this.children.areTouched` */
  readonly isTouched: boolean;

  /** Will return true if `this.self.isDirty` or `this.children.areDirty` */
  readonly isDirty: boolean;

  /** Will return true if `this.self.isSubmitted` or `this.children.areSubmitted` */
  readonly isSubmitted: boolean;

  /** Contains `{ ...this.children.errors, ...this.self.errors }` or `null` if there are none */
  readonly errors: ValidationErrors | null;

  readonly child: {
    /** Will return true if *any* `enabled` direct child control is `valid` */
    readonly isValid: boolean;
    /** Will return true if *any* direct child control is `disabled` */
    readonly isDisabled: boolean;
    /** Will return true if *any* `enabled` direct child control is `readonly` */
    readonly isReadonly: boolean;
    /** Will return true if *any* `enabled` direct child control is `required` */
    readonly isRequired: boolean;
    /** Will return true if *any* `enabled` direct child control is `pending` */
    readonly isPending: boolean;
    /** Will return true if *any* `enabled` direct child control is `touched` */
    readonly isTouched: boolean;
    /** Will return true if *any* `enabled` direct child control is `dirty` */
    readonly isDirty: boolean;
    /** Will return true if *any* `enabled` direct child control is `submitted` */
    readonly isSubmitted: boolean;
  };

  readonly children: {
    /** Will return true if *all* `enabled` direct child control's are `valid` */
    readonly areValid: boolean;
    /** Will return true if *all* direct child control's are `disabled` */
    readonly areDisabled: boolean;
    /** Will return true if *all* `enabled` direct child control's are `readonly` */
    readonly areReadonly: boolean;
    /** Will return true if *all* `enabled` direct child control's are `required` */
    readonly areRequired: boolean;
    /** Will return true if *all* `enabled` direct child control's are `pending` */
    readonly arePending: boolean;
    /** Will return true if *all* `enabled` direct child control's are `touched` */
    readonly areTouched: boolean;
    /** Will return true if *all* `enabled` direct child control's are `dirty` */
    readonly areDirty: boolean;
    /** Will return true if *all* `enabled` direct child control's are `submitted` */
    readonly areSubmitted: boolean;
    /** Contains *all* `enabled` child control errors or `null` if there are none */
    readonly errors: ValidationErrors | null;

    /**
     * Mark all direct children as disabled. Use the `deep: true`
     * option to instead mark all direct and indirect children
     * as disabled.
     */
    markDisabled(value: boolean, options?: { deep?: boolean }): void;

    /**
     * Mark all direct children as touched. Use the `deep: true`
     * option to instead mark all direct and indirect children
     * as touched.
     */
    markTouched(value: boolean, options?: { deep?: boolean }): void;

    /**
     * Mark all direct children as dirty. Use the `deep: true`
     * option to instead mark all direct and indirect children
     * as dirty.
     */
    markDirty(value: boolean, options?: { deep?: boolean }): void;

    /**
     * Mark all direct children as readonly. Use the `deep: true`
     * option to instead mark all direct and indirect children
     * as readonly.
     */
    markReadonly(value: boolean, options?: { deep?: boolean }): void;

    /**
     * Mark all direct children as required. Use the `deep: true`
     * option to instead mark all direct and indirect children
     * as required.
     */
    markRequired(value: boolean, options?: { deep?: boolean }): void;

    /**
     * Mark all direct children as submitted. Use the `deep: true`
     * option to instead mark all direct and indirect children
     * as submitted.
     */
    markSubmitted(value: boolean, options?: { deep?: boolean }): void;

    /**
     * Mark all direct children as pending. Use the `deep: true`
     * option to instead mark all direct and indirect children
     * as pending.
     */
    markPending(
      value: boolean,
      options?: { source?: ControlId; deep?: boolean }
    ): void;
  };

  [AbstractControlContainerInterface]: true;

  /**
   * Apply a partial update to the values of some children but
   * not all.
   */
  patchValue(value: unknown): void;

  /** sets the `controls` property */
  setControls(controls: Controls): void;

  /** stores the provided control in `controls[key]` */
  setControl(key: unknown, control: unknown): void;

  /**
   * If provided a control value, removes the given control from
   * `controls`. If provided a control key value, removes the
   * control associated with the given key from `controls`.
   */
  removeControl(key: unknown): void;
}
