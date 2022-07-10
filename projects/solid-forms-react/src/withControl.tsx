import React, {
  useEffect,
  useMemo,
  type ComponentType,
  type PropsWithChildren,
} from "react";
import { createRoot } from "solid-js";
import { type IAbstractControl } from "solid-forms";

type WithControlProps<
  Props,
  ControlFactory extends (...args: [any, ...any[]]) => IAbstractControl
> = PropsWithChildren<
  Props &
    (Parameters<ControlFactory>[number] extends never
      ? {}
      : Parameters<ControlFactory>[0] extends undefined
      ? {}
      : Parameters<ControlFactory>[0])
>;

export interface IWithControlOptions<
  Props extends {},
  ControlFactory extends (...args: [any, ...any[]]) => IAbstractControl
> {
  controlFactory: ControlFactory;
  component: ComponentType<
    WithControlProps<Props, ControlFactory> & {
      control: ReturnType<ControlFactory>;
    }
  >;
}

export type WithControlReturnType<
  Props extends {},
  ControlFactory extends (...args: [any, ...any[]]) => IAbstractControl
> = ((
  props: WithControlProps<Props, ControlFactory> & {
    control?: ReturnType<ControlFactory>;
  }
) => JSX.Element) & {
  /**
   * Factory function to build the component's default form control.
   * Note, you can pass any form control to the component which
   * satisfies the component's interface. You do not need to use
   * this factory function.
   *
   * Example usage:
   * ```ts
   * const TextInput = withControl({
   *   // etc...
   * });
   *
   * createFormGroup({
   *   street: TextInput.control(),
   *   city: TextInput.control(),
   *   state: TextInput.control(),
   *   zip: TextInput.control(),
   * })
   * ```
   */
  control: ControlFactory;
};

export function withControl<
  Props extends {},
  ControlFactory extends (...args: [any, ...any[]]) => IAbstractControl
>(
  options: IWithControlOptions<Props, ControlFactory>
): WithControlReturnType<Props, ControlFactory> {
  const wrappedComponent: WithControlReturnType<Props, ControlFactory> = (
    props
  ) => {
    const [control, disposer] = useMemo(
      () =>
        [props.control, undefined] ||
        createRoot((disposer) => [
          options.controlFactory(props) as ReturnType<ControlFactory>,
          disposer,
        ]),
      []
    );

    useEffect(() => {
      return disposer;
    }, [disposer]);

    const Component = options.component;

    return <Component {...props} control={control} />;
  };

  wrappedComponent.control = options.controlFactory;

  return wrappedComponent;
}
