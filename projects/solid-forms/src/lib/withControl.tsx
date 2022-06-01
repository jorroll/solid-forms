import { Component, createMemo, createRoot, JSX, ParentProps } from 'solid-js';
import { IAbstractControl } from './abstract-control';

type WithControlProps<
  Props,
  ControlFactory extends (...args: [any, ...any[]]) => IAbstractControl
> = ParentProps<
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
  component: Component<
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
    const control = createMemo(
      () =>
        props.control ||
        createRoot(
          () => options.controlFactory(props) as ReturnType<ControlFactory>
        )
    );

    const Component = options.component;

    return <Component {...props} control={control()} />;
  };

  wrappedComponent.control = options.controlFactory;

  return wrappedComponent;
}
