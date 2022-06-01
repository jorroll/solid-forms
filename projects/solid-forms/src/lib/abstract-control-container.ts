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
  readonly controls: Controls;

  readonly size: number;

  /** Only returns values for `enabled` child controls. */
  readonly value: ControlsValue<Controls>;

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

    markDisabled(value: boolean, options?: { deep?: boolean }): void;

    markTouched(value: boolean, options?: { deep?: boolean }): void;

    markDirty(value: boolean, options?: { deep?: boolean }): void;

    markReadonly(value: boolean, options?: { deep?: boolean }): void;

    markRequired(value: boolean, options?: { deep?: boolean }): void;

    markSubmitted(value: boolean, options?: { deep?: boolean }): void;

    markPending(
      value: boolean,
      options?: { source?: ControlId; deep?: boolean }
    ): void;
  };

  [AbstractControlContainerInterface]: true;

  get<A extends ControlsKey<Controls>>(a: A): Controls[A];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>
  >(
    a: A,
    b: B
  ): ContainerControls<Controls[A]>[B];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>
  >(
    a: A,
    b: B,
    c: C
  ): ContainerControls<ContainerControls<Controls[A]>[B]>[C];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>,
    D extends keyof ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >
  >(
    a: A,
    b: B,
    c: C,
    d: D
  ): ContainerControls<
    ContainerControls<ContainerControls<Controls[A]>[B]>[C]
  >[D];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>,
    D extends keyof ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >,
    E extends keyof ContainerControls<
      ContainerControls<
        ContainerControls<ContainerControls<Controls[A]>[B]>[C]
      >[D]
    >
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E
  ): ContainerControls<
    ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >[D]
  >[E];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>,
    D extends keyof ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >,
    E extends keyof ContainerControls<
      ContainerControls<
        ContainerControls<ContainerControls<Controls[A]>[B]>[C]
      >[D]
    >,
    F extends IAbstractControl = IAbstractControl
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    ...args: any[]
  ): F | null;

  patchValue(value: unknown): void;

  setControls(controls: Controls): void;

  setControl(key: unknown, control: unknown): void;

  removeControl(key: unknown): void;
}

// /**
//  * This exists because of limitations in typescript. It lets the "real"
//  * AbstractControlContainer interface be less type safe while still
//  * retaining the correct type information in FormArray and FormGroup. If
//  * AbstractControlContainer looked like this (and it should), then
//  * FormArray<AbstractControl[]> could not be assigned to AbstractControlContainer<any>
//  * (and it should be able to be assigned to that).
//  *
//  * I think the issue arrises because Typescript doesn't seem to recognize that
//  * Controls[ControlsKey<Controls>] is an AbstractControl.
//  */
// export interface PrivateAbstractControlContainer<
//   Controls extends GenericControlsObject = any,
//   Data = any
// > extends AbstractControlContainer<Controls, Data> {
//   // setControls(controls: Controls, options?: IControlEventOptions): void;
//   setControl<N extends ControlsKey<Controls>>(
//     name: N,
//     control: Controls[N] | null,
//     options?: IControlEventOptions
//   ): string[];
//   addControl<N extends ControlsKey<Controls>>(
//     name: N,
//     control: Controls[N],
//     options?: IControlEventOptions
//   ): string[];
//   removeControl(
//     name: ControlsKey<Controls>,
//     options?: IControlEventOptions
//   ): string[];
// }
