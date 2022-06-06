# Solid Forms

Solid Forms provides several form control objects useful for making working with forms easier.

```bash
# solidjs
yarn add solid-forms
# or
npm install solid-forms
```

## Contents

- [Getting Started](#getting-started)
  - [Creating a form control](#creating-a-form-control)
  - [Creating a reusable form field input](#creating-a-reusable-form-field-input)
  - [Form validation and errors](#form-validation-and-errors)
    - [Validator functions](#validator-functions)
    - [Observe changes and manually set errors](#observe-changes-and-manually-set-errors)
  - [Using a FormGroup](#using-a-formgroup)
  - [The FormGroup "child", "children" and "self" props](#the-formgroup-"child"-"children"-and-"self"-props)
  - [Using a FormArray](#using-a-formarray)
    - [Creating controls asyncronously (i.e. `bindOwner()`)](#creating-controls-asyncronously-ie-bindowner)
  - [Making reusable form components `withControl()`](#making-reusable-form-components-withcontrol)
- [Examples](#examples)
  - [Simple example with validation](#simple-example-with-validation)
  - [Medium example](#medium-example)
- [API](#api)
  - [IAbstractControl](#iabstractcontrol)
  - [IAbstractControlContainer](#iabstractcontrolcontainer)
  - [IFormControl](#iformcontrol)
    - [`createFormControl()`](#createformcontrol)
  - [IFormGroup](#iformgroup)
    - [`createFormGroup()`](#createformgroup)
  - [IFormArray](#iformarray)
    - [`createFormArray()`](#createformarray)
  - [Helpers](#helpers)
    - [`withControl()`](#withcontrol)
    - [`bindOwner()`](#bindowner)

## Getting Started

The basic building block of Solid Forms are FormControls (see `IFormControl` API). A FormControl is intended to model a single input element of a form. For example, an `<input />` element or a radio button group. You can use a FormControl to save the value of the input, to handle validation and track errors, to track whether the input has been touched, changed, submitted, etc. Importantly, the FormControl itself is just a [Solidjs `store` object](https://www.solidjs.com/docs/latest/api#using-stores) so all of it's properties are observable and you can easily respond to changes (e.g. with `createEffect()` or just using the control values inside of a component directly).

For example,

```tsx
import { Show, mergeProps, type Component } from "solid-js";
import { createFormControl } from "solid-forms";

export const TextInput: Component<{
  control?: IFormControl<string>;
  name?: string;
  type?: string;
}> = (props) => {
  // here we provide a default form control in case the user doesn't supply one
  props = mergeProps({ control: createFormControl(""), type: "text" }, props);

  return (
    <div
      classList={{
        "is-invalid": !!props.control.errors,
        "is-touched": props.control.isTouched,
        "is-required": props.control.isRequired,
      }}
    >
      <input
        name={props.name}
        type={props.type}
        value={props.control.value}
        oninput={(e) => {
          props.control.setValue(e.currentTarget.value);
        }}
        onblur={() => props.control.markTouched(true)}
        required={props.control.isRequired}
      />

      <Show when={props.control.isTouched && props.control.errors?.isMissing}>
        <small>Answer required.</small>
      </Show>
    </div>
  );
};
```

**But the _real power_ of FormControls comes from their composability with other controls such as FormGroups (see `IFormGroup` API) and FormArrays (see `IFormArray` API).**

For example,

```tsx
import { Show, mergeProps, createEffect, type Component } from "solid-js";
import { createFormGroup, createFormControl } from "solid-forms";
// here we import the TextInput component we defined above
import { TextInput } from "./TextInput";

export const ExampleForm: Component<{}> = () => {
  const group = createFormGroup({
    name: createFormControl(""),
    email: createFormControl("", {
      required: true,
      validator: (value: string) =>
        value.length === 0 ? { isMissing: true } : null,
    }),
  });

  // This will automatically re-run whenever `group.isDisabled`, `group.isValid` or `group.value` change
  createEffect(() => {
    if (group.isDisabled || !group.isValid) return;

    console.log("Current group value", group.value);
  });

  const onSubmit = async () => {
    if (group.isSubmitted || !group.isValid) return;

    group.markSubmitted(true);
    // do stuff...
    // const { name, email } = group.value;
  };

  return (
    <form onSubmit={onSubmit}>
      <label for="name">Your name</label>
      <TextInput name="name" control={group.controls.name} />

      <label for="email">Your email address</label>
      <TextInput name="email" type="email" control={group.controls.email} />

      <button>Submit</button>
    </form>
  );
};
```

Lets begin by looking at how to use FormControls to model individual form fields, then we'll learn how to use FormGroups and FormArrays to model forms and form fieldsets (i.e. partial forms).

### Creating a form control

> [See IFormControl in the API section for all properties and methods](#iformcontrol).

To model individual form fields, we'll use FormControls created via `createFormControl()`. We can create a FormControl with an initial value of `""` like so:

```ts
const control = createFormControl("");
```

That's the same as this ([learn more about these options in the API reference](#createformcontrol)):

```ts
const control = createFormControl("", {
  id: Symbol("Control-1"),
  data: undefined,
  disabled: false,
  touched: false,
  dirty: false,
  readonly: false,
  submitted: false,
  pending: false,
  errors: null,
  validators: undefined,
});
```

If we want to set the value on our FormControl we can:

```ts
control.setValue("Hi");
control.value; // "Hi"
```

We can also mark our FormControl as touched (or required, disabled, readonly, submitted, pending, or dirty).

```ts
control.markTouched(true);
control.touched; // true
control.markTouched(false); // you get the idea
```

We can manually add errors to our FormControl

```ts
control.errors; // null
control.isValid; // true
control.setErrors({ required: true });
control.errors; // { required: true }
control.isValid; // false
control.patchErrors({ tooLong: "must be less than 5 characters" });
control.errors; // { required: true, tooLong: "must be less than 5 characters" }
```

We can add a validation function (or functions) which will be run after every value change

```ts
control.value; // ""
control.errors; // null
control.setValidators((value) =>
  typeof value === "string" && value.length === 0 ? { isMissing: true } : null
);
control.value; // ""
control.errors; // { isMissing: true }
control.setValue("Hi");
control.errors; // null
```

Under-the-hood, FormControls are just [Solidjs stores](https://www.solidjs.com/docs/latest/api#createstore) so we also have the ability to observe any changes to those properties with Solidjs.

```tsx
createEffect(() => {
  console.log("Value change: ", control.value);
});

// here we manually run validation inside of a render effect
createRenderEffect(() => {
  if (control.value.toLowerCase() !== control.value) {
    control.setErrors({ mustBeLowercase: true });
  } else {
    control.setErrors(null);
  }
});

<div classList={{ "is-invalid": !!control.errors }}>
  <p>The control's current value is: {JSON.stringify(control.value)}</p>
</div>;
```

[You can see all the IFormControl properties and methods in the API section](#iformcontrol). Lets look at creating a reusable form field component with an input.

### Creating a reusable form field input

Lets revist our `TextInput` example from above

```tsx
import { Show, For, mergeProps, type Component } from "solid-js";
import { createFormControl } from "solid-forms";

export const TextInput: Component<{
  control?: IFormControl<string>;
  name?: string;
  type?: string;
}> = (props) => {
  // here we provide a default form control in case the user doesn't supply one
  props = mergeProps({ control: createFormControl(""), type: "text" }, props);

  return (
    <div
      classList={{
        "is-invalid": !!props.control.errors,
        "is-touched": props.control.isTouched,
        "is-required": props.control.isRequired,
        "is-disabled": props.control.isDisabled,
      }}
    >
      <input
        name={props.name}
        type={props.type}
        value={props.control.value}
        oninput={(e) => {
          props.control.setValue(e.currentTarget.value);
        }}
        onblur={() => props.control.markTouched(true)}
        required={props.control.isRequired}
        disabled={props.control.isDisabled}
      />

      <Show when={props.control.isTouched && !props.control.isValid}>
        <For each={Object.values(props.control.errors)}>
          {(errorMsg: string) => <small>{errorMsg}</small>}
        </For>
      </Show>
    </div>
  );
};
```

Breaking this example down: we'd like the ability for a parent component to pass in a FormControl for the `TextInput` to use, but we'd also like the `TextInput` to be usable on its own if the parent doesn't supply a `control` value. We can accomplish that just like any other Solidjs component using [`mergeProps` from the Solidjs core library](https://www.solidjs.com/docs/latest/api#mergeprops) to provide a default `control` prop value if the user doesn't supply one.

```tsx
export const TextInput: Component<{
  control?: IFormControl<string>;
  name?: string;
  type?: string;
}> = (props) => {
  props = mergeProps({ control: createFormControl(""), type: "text" }, props);

  // ...
};
```

Since FormControl (and FormGroups and FormArrays) are just `Solidjs stores` under-the-hood, we can easily use the [core `classList` prop](https://www.solidjs.com/docs/latest/api#classlist) to add css classes to our `TextInput` if it is invalid, touched, required, or disabled.

```tsx
  // ...

  return (
    <div
      classList={{
        "is-invalid": !!props.control.errors,
        "is-touched": props.control.isTouched,
        "is-required": props.control.isRequired,
        "is-disabled": props.control.isDisabled,
      }}
    >
```

We set the underlying `<input />` element to be equal to the FormControl's value (`value={props.control.value}`), we react to input value changes and update the FormControl's value (`props.control.setValue(e.currentTarget.value)`), we mark the control as touched on blur events, and we setup the input to be required and disabled if the FormControl is required or disabled.

```tsx
<input
  name={props.name}
  type={props.type}
  value={props.control.value}
  oninput={(e) => {
    props.control.setValue(e.currentTarget.value);
  }}
  onblur={() => props.control.markTouched(true)}
  required={props.control.isRequired}
  disabled={props.control.isDisabled}
/>
```

Finally, we decide to show errors associated with this FormControl if the control isn't valid AND if the control has been touched. When this happens, we show all the error messages associated with the control.

```tsx
<Show when={props.control.isTouched && !props.control.isValid}>
  <For each={Object.values(props.control.errors)}>
    {(errorMsg: string) => <small>{errorMsg}</small>}
  </For>
</Show>
```

### Form validation and errors

Validating form data and working with errors is a core part of handling user input. The are two primary ways of validating data in Solid Forms. The simple but more limited approach is to use validator functions. The more flexible and powerful approach is to just use Solidjs built-ins like `createEffect()` to observe control changes and then `setErrors()` and `patchErrors()` on a control as appropriate.

#### Validator functions

Validator functions are optional functions you can provide to a control which are run whenever the control's value changes and either return `null` (if there are no errors) or return an object with key-value entries if there are errors.

```ts
import { type ValidatorFn } from "solid-forms";

const requiredValidator: ValidatorFn = (value: string) =>
  value.length === 0 ? { isMissing: true } : null;

const lowercaseValidator: ValidatorFn = (value: string) =>
  value.toLowerCase() !== value ? { isNotLowercase: true } : null;

// You can also create controls with validator functions
const control = createFormControl("", {
  validators: [requiredValidator, lowercaseValidator],
});
```

In this example, we provide a validator function that returns an error if the control's value is length `0` and a separate function which errors if the input string is not all lowercase. If we provide multiple validator functions to a control, all validator functions will be run on every change and their errors will be merged together.

You can update the validator function of a control with `control.setValidators()`.

#### Observe changes and manually set errors

Validator functions are a nice and quick way to add validation to your controls, but a more powerful approach is to observe control changes and manually set errors. With this approach, we have access to the full array of control properties which we can include in our validation logic (validator functions just have access to the control's value).

For example:

```ts
const control = createFormControl("");

createRenderEffect(() => {
  if (control.value.includes("@")) {
    control.setErrors({ mustNotIncludeSymbol: "Cannot include '@' symbol." });
  } else {
    control.setErrors(null);
  }
});
```

Here we observe control value changes and set an error if the value includes an `"@"` symbol or else clear the errors (to indicate that the value is valid).

If we have multiple different validation effects, we should use the `source` property of `control.setErrors()` and `control.patchErrors()` to partition the errors associated with each effect.

For example:

```ts
const control = createFormControl("");

createRenderEffect(() => {
  const source = "@ validator";

  if (control.value.includes("@")) {
    control.setErrors(
      { mustNotIncludeSymbol: "Cannot include '@' symbol." },
      { source }
    );
  } else {
    control.setErrors(null, { source });
  }
});

const source = Symbol("Max length validator");

createRenderEffect(() => {
  if (control.value.length > 10) {
    control.setErrors(
      { tooLong: "Cannot be more than 10 characters." },
      { source }
    );
  } else {
    control.setErrors(null, { source });
  }
});
```

Here when we use `control.setErrors()` and also provide the `source` option, we will only clear or overwrite existing errors that were also set by the same "source". Another way we _could_ have accomplished this would be by using `control.patchErrors()`. The patchErrors method _merges_ its changes into the existing `control.errors` property, rather than replacing the existing errors. If you pass an errors object with a key who's value is `null`, then that key will be deleted from the control errors.

For example:

```ts
createRenderEffect(() => {
  if (control.value.includes("@")) {
    control.patchErrors({ mustNotIncludeSymbol: "Cannot include '@' symbol." });
  } else {
    control.patchErrors({ mustNotIncludeSymbol: null });
  }
});
```

However, in this case using `control.patchErrors()` isn't as good an approach as using the "source" option. An accidental use of `control.setErrors()` elsewhere would still overwrite this render effect's validation (which wouldn't happen if you used "source").

Also note, we're using `createRenderEffect()` here (rather than `createEffect()`) since validation and errors are likely to affect the DOM (by displaying errors to the user).

Also note, when performing async validation you can mark a control as "pending" via `control.markPending(true)` to indicate that there is pending validation. `control.isValid` is only true if the control both doesn't have any errors and is also not pending. The `control.markPending()` method also accepts a `source` option for partitioning the pending state of different validation effects. A control will be considered pending so long as any "source" is still pending.

### Using a FormGroup

> [See IFormGroup in the API section for all properties and methods](#iformgroup).

To model a form (or [fieldset](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset)) with multiple form fields, we'll use FormGroups created via `createFormGroup()`. A FormGroup has all of the properties that a FormControl has, but it also has additional properties like a `controls` property which contains the FormGroup's child controls.

At it's simplest, we can create a FormGroup with no children and the default state.

```ts
const group = createFormGroup();
```

This is the same as:

```ts
const group = createFormGroup(
  {},
  {
    id: Symbol("Control-1"),
    data: undefined,
    disabled: false,
    touched: false,
    dirty: false,
    readonly: false,
    submitted: false,
    pending: false,
    errors: null,
    validators: undefined,
  }
);
```

If we want to add two child FormControls representing a person's name to our FormGroup we could:

```ts
group.setControl("firstName", createFormControl(""));
group.controls; // { firstName: IFormControl<string> }
group.value; // { firstName: "" }

group.setControl("lastName", createFormControl(""));
group.controls; // { firstName: IFormControl<string>, lastName: IFormControl<string> }
group.value; // { firstName: "", lastName: "" }
```

We can also set all the FormGroup's controls at once with

```ts
group.setControls({
  firstName: createFormControl("John"),
  lastName: createFormControl("Carroll"),
});

group.controls; // { firstName: IFormControl<string>, lastName: IFormControl<string> }
group.value; // { firstName: "John", lastName: "Carroll" }

group.removeControl("firstName");
group.controls; // { lastName: IFormControl<string> }
group.value; // { lastName: "Carroll" }
```

If we want to set the value of our FormGroup we can:

```ts
group.setValue({ firstName: "Sandy", lastName: "Smith" });
group.value; // { firstName: "Sandy", lastName: "Smith" }
```

Note that FormGroup's derive their value from the value of their _enabled_ child controls. When you use `group.setValue()` you are really setting the values of the FormGroup's children.

```ts
group.controls.firstName.value; // "Sandy"
group.controls.lastName.value; // "Smith"
```

You can use `patchValue()` to update the value of some controls but not others

```ts
group.patchValue({ lastName: "Carroll" });
group.value; // { firstName: "Sandy", lastName: "Carroll" }
group.controls.firstName.value; // "Sandy"
group.controls.lastName.value; // "Carroll"
```

Since a FormGroup's value is equal to the value of all their enabled children, is a child is disabled then it's value will be excluded from `group.value`.

```ts
group.value; // { firstName: "Sandy", lastName: "Carroll" }
group.controls.firstName.markDisabled(true);
group.value; // { lastName: "Carroll" }
```

If we'd like to get the FormGroup's value ignoring the disabled status of children, we can use the `group.rawValue` property.

```ts
group.rawValue; // { firstName: "Sandy", lastName: "Carroll" }
group.controls.firstName.markDisabled(true);
group.value; // { lastName: "Carroll" }
group.rawValue; // { firstName: "Sandy", lastName: "Carroll" }
```

FormGroups can have other FormGroups (or FormArrays) as children.

```ts
group.setControl(
  "addresses",
  createFormArray([
    createFormGroup({
      street: createFormControl(""),
      city: createFormControl(""),
      state: createFormControl(""),
      zip: createFormControl(""),
    }),
  ])
);

group.value;
// {
//   addresses: [
//     {
//       street: "",
//       city: "",
//       state: "",
//       zip: "" ,
//     },
//   ],
// }
```

We also have the ability to observe any properties of the FormGroup with Solidjs as well as changes to those properties

For example:

```tsx
createRenderEffect(() => {
  if (!group.children.areValid) {
    group.setErrors(null);
    return;
  }

  const firstPartOfEmail = group.value.email.split("@")[0];

  if (group.value.name !== firstPartOfEmail) {
    group.setErrors({ nameAndEmailMismatch: true });
  } else {
    group.setErrors(null);
  }
});
```

Here, we're using a render effect to create a custom validator for the FormGroup. This effect is automatically subscribing to some changes under-the-hood (`group.children.areValid`, `group.value.email`, `group.value.name`) and will automatically re-evaluate when these props change. Lets look at what's happening...

### The FormGroup "child", "children" and "self" props

> You can view the full [`IFormGroup` API reference](#iformgroup) for all of the `self`, `children`, and `child` properties.

Both FormControls and FormGroups (and FormArrays) have a `self` prop which itself is an object containing properties like `isValid`, `isDisabled`, `isTouched`, etc. In a FormControl, `control.isValid` is just an alias for `control.self.isValid` (same for `control.isTouched`, etc). In a FormGroup though, the two properties are different and the `self` object contains state local to that FormGroup.

For example, if you do `group.markTouched(true)` on the FormGroup, that updates `group.self.isTouched` to true but it doesn't affect the state of the FormGroup's children.

```ts
group.markTouched(true);
group.isTouched; // true
group.self.isTouched; // true
group.child.isTouched; // false
group.children.areTouched; // false
group.controls.firstName.isTouched; // false
group.controls.lastName.isTouched; // false
```

Meanwhile, `group.isTouched` is actually a getter function equal to `group.self.isTouched || group.children.areTouched`. The `group.children.areTouched` property is also a memoized getter (its created internally with `createMemo()`) which is true if every child is touched (it's `false` if there are no children). So a FormGroup is "touched" if _either_ the FormGroup itself has been `markTouched(true)` or if all of the FormGroup's children have been `markTouched(true)`. But if you just want to see if the FormGroup, itself, has been touched, then you can use `group.self.isTouched`. Meanwhile, `group.child.isTouched` will return `true` if _any_ child control has been touched. As expected, all of these properties are observable.

```ts
group.isTouched; // false
group.self.isTouched; // false
group.child.isTouched; // false
group.children.areTouched; // false

group.controls.firstName.markTouched(true);
group.isTouched; // false
group.self.isTouched; // false
group.child.isTouched; // true
group.children.areTouched; // false

group.controls.lastName.markTouched(true);
group.isTouched; // true
group.self.isTouched; // false
group.child.isTouched; // true
group.children.areTouched; // true
```

Above, we gave an example that used `group.setErrors()` in a way you may have found surprising:

```tsx
createRenderEffect(() => {
  if (!group.children.areValid) {
    group.setErrors(null);
    return;
  }

  // ...
});
```

To the unfamiliar, this might _look_ like we're clearing all errors on the FormGroup if any children are invalid. In reality, `group.errors` is a getter function equal to `{ ...group.children.errors, ...group.self.errors }` or `null` if there are no children errors or self errors. Using `group.setErrors()` sets `self.errors` but it doesn't affect FormGroup children.

> You can view the full [`IFormGroup` API reference](#iformgroup) for all of the `self`, `children`, and `child` properties.

#### Using a FormArray

> [See IFormArray in the API section for all properties and methods](#iformarray).

As you might expect, FormArrays are very similar to FormGroups and are used to group multiple controls together. While a FormGroup groups multiple controls together using an object with named keys, a FormArray groups them together using an array.

FormArrays behave very similarly to FormGroups but with the change that you're dealing with an array of child controls (rather than an object containing child controls). FormArray also has one additional method `push()` which adds a new child control to the end of the FormArray. Other than `push()`, FormArray and FormGroup have the same interface (which comes from the [`IAbstractControlContainer` interface](#iabstractcontrolcontainer)). Read the [FormGroup section](#using-a-formgroup) if you haven't yet since all of it also applies to FormArray.

Here's an example using a FormArray:

```tsx
import { For, type Component } from "solid-js";
import { createFormArray, createFormControl, bindOwner } from "solid-forms";

const ExampleForm: Component<{}> = () => {
  const array = createFormArray([createFormControl("")]);

  const addPhoneNumber = bindOwner(() => array.push(createFormControl("")));

  const removePhoneNumber = () => array.removeControl(array.size - 1);

  return (
    <form>
      <div>
        <p>Can you provide us with all of your phone numbers?</p>
      </div>

      <For each={array.controls}>
        {(control, index) => {
          return (
            <>
              <label for={index()}>Phone number {index()}</label>

              <input
                name={index()}
                value={control.value}
                oninput={(e) => {
                  control.setValue(e.currentTarget.value);
                }}
                onblur={() => control.markTouched(true)}
              />
            </>
          );
        }}
      </For>

      <button onclick={addPhoneNumber}>Add phone number</button>
      <button onclick={removePhoneNumber}>Remove phone number</button>

      <button disabled={!group.isValid}>Submit</button>
    </form>
  );
};
```

In this example, we have a form asking for all of the user's phone numbers. Users can add or remove phone numbers from the form using buttons in the form (i.e. `<button onclick={addPhoneNumber}>Add phone number</button>`). As the user does this, callbacks will file which adds or removes FormControls from the FormArray. Since this is all observable, changes will be reflected in the component.

See the [IFormArray API below](#iformarray) for more information.

#### Creating controls asyncronously (i.e. `bindOwner()`)

Hopefully, given everything you've read up until this point, most of this just makes sense with, I'm guessing, one exception:

```ts
import { bindOwner } from "solid-forms";

const ExampleForm: Component<{}> = () => {
  const array = createFormArray([createFormControl("")]);

  const addPhoneNumber = bindOwner(() => array.push(createFormControl("")));

  const removePhoneNumber = () => array.removeControl(array.size - 1);

  // ...
};
```

You may be wondering, what's this `bindOwner()` function from "solid-forms" and why doesn't `removePhoneNumber()` need it? (though if you're a Solidjs wizz you may have already guessed). Solidjs' reactivity has a [concept of an "Owner"](https://www.solidjs.com/docs/latest/api#getowner) that you might never have run into before (the Solidjs "Getting Started" doc currently doesn't mention it and it's not something everyone will run into). The "Owner" is the parent of a given reactive context.

**The tl;dr; is that, whenever you have a function that creates a control asyncronously, you need to wrap that function with `bindOwner()`.** Here we're creating a control inside a button's `onclick` handler, which will be called asyncronously, so we need to use `bindOwner()`. We don't need to do that for `removePhoneNumber` because that function is just removing an already created control from the FormArray (it's not creating a new control).

For a longer (but still summarized) explaination of why this is needed and what an Owner is in Solidjs, here's my attempt at a tl;dr for that (with the caviate that I'm not expert so this is really just my current guess)...

> When call a component function (or something else using [computations](https://www.solidjs.com/docs/latest/api#createcomputed) like `createEffect()`), it runs immediately. When it does so, Signals inside that component (or `createEffect()`, etc), call [`getOwner()`](https://www.solidjs.com/docs/latest/api#getowner) and get the current owner of the context. They are able to do this because `getOwner()` is a global variable. The initial "root" Owner is set by the top level `render()` function which then calls the top level App component.

> The first thing the App component does when it's called is create a new Owner object for itself and set it to the global "owner" variable that is returned by `getOwner()`. Then the App component runs the actual component function you provided and when any Computations inside of it call `getOwner()` (and components are a type of Computation in solid) they receive the Owner associated with the App component. When the App component finishes executing the user provided function (which happens syncronously), then the App component resets the global "owner" viable to whatever it was before it started running. Any components nested inside the App component work the same way. As they are called, they create a new Owner object for themselves and replace the global owner with their own so that nested calls to `getOwner()` return this new Owner. When the child component function finishes executing, the original parent owner is restored. Etc.
>
> So with this idea, immediately after a component is intialized the component's `getOwner()` context is removed. If you call code asyncronously, for example inside a button `onclick` handler, when that code runs it can't find the parent component's owner anymore. The `bindOwner()` function provided by Solid Forms binds the component's "Owner" context to a function so that, whenever that function is called (even asyncronously) it uses the right owner context. If you create a control asyncronously (e.g. inside of a button onclick handler) then you need to wrap that function with `bindOwner()`. The `bindOwner()` function that Solid Forms provides is just a super simple helper utility that looks like this:
>
> ```ts
> import { getOwner, runWithOwner } from "solid-js";
>
> export function bindOwner<T>(fn: () => T): () => T {
>   const owner = getOwner();
>
>   if (!owner) {
>     throw new Error("No solidjs owner in current context");
>   }
>
>   return () => runWithOwner(owner, fn);
> }
> ```
>
> In the future, it seems possible that Solidjs will choose to provide this help directly within the core library.

### Making reusable form components `withControl()`

To make it easier to build nice, reusable form components, Solid Forms provides an optional `withControl()` higher order component.

For example:

```tsx
import { Show, type Component } from "solid-js";
import {
  createFormGroup,
  createFormControl,
  withControl,
  type IFormGroup,
  type IFormControl,
  type IFormControlOptions,
} from "solid-forms";

const controlFactory = (props?: { required?: boolean }) => {
  const options: IFormControlOptions = props?.required
    ? { required: true, validators: MyValidators.required }
    : undefined;

  return createFormGroup({
    street: createFormControl("", options),
    city: createFormControl("", options),
    state: createFormControl("", options),
    zip: createFormControl("", options),
  });
};

const AddressField = withControl<{ legend?: string }, typeof controlFactory>({
  controlFactory,
  component: (props) => {
    const group = () => props.control;
    const controls = () => group().controls;

    return (
      <fieldset disabled={group().isDisabled}>
        <legend>{props.legend || "Your address"}</legend>

        <label for="street">Street</label>
        <TextInput name="street" control={controls().street} />

        <label for="city">City</label>
        <TextInput name="city" control={controls().city} />

        <label for="state">State</label>
        <TextInput name="state" control={controls().state} />

        <label for="zip">Zip</label>
        <TextInput name="zip" control={controls().zip} />
      </fieldset>
    );
  },
});
```

We can then reuse this AddressField component in a hypothetical parent component like so

```tsx
import { AddressField } from "./AddressField";

export const ParentForm: Component<{}> = () => {
  const group = createFormGroup({
    firstName: createFormControl(""),
    lastName: createFormControl(""),
    address: AddressField.control({ required: true }),
  });

  const controls = () => group.controls;

  return (
    <form>
      <label for="firstName">First name</label>
      <TextInput name="firstName" control={controls().firstName} />

      <label for="lastName">Last Name</label>
      <TextInput name="lastName" control={controls().lastName} />

      <AddressField control={controls().address} legend="Your home address" />
    </form>
  );
};
```

Lets break this example down.

```tsx
const controlFactory = (props?: { required?: boolean }) => {
  const options: IFormControlOptions = props?.required
    ? { required: true, validators: MyValidators.required }
    : undefined;

  return createFormGroup({
    street: createFormControl("", options),
    city: createFormControl("", options),
    state: createFormControl("", options),
    zip: createFormControl("", options),
  });
};

const AddressField = withControl<{ legend?: string }, typeof controlFactory>({
  controlFactory,
  component: (props) => {
    // ...
  },
};
```

The `withControl()` function expects an object with `controlFactory` and `component` properties. The component property expects a component function. This component function will always receive a `control` prop that has the same typescript-type as the control returned by the provided `controlFactory` function. The control factory function is responsible for constructing the control used by the component. The control factory function optionally receives the component's properties as arguments. When using the `AddressField`, it will have an optional `control` property. If you provide that property (like we did in the example above), then the `controlFactory` function will never be called. But `withControl()` allows us to use our AddressField by itself without providing a control property to it.

For example:

```tsx
import { AddressField } from "./AddressField";

export const App: Component<{}> = () => {
  return (
    <div>
      <p>These are the questions we will ask you when we need your address.</p>

      <AddressField required />
    </div>
  );
};
```

This example will work just fine. In this case, `withControl()` will see that a `control` property wasn't provided and will use the controlFactory function you gave to construct it's control. Since we provided the optional `required` prop, that prop will be provided to the controlFactory function in the props param.

The controlFactory function, itself, operates like a component. It is only called once on initialization, and you can choose to use `createEffect()` and signals inside of it.

For example:

```tsx
const controlFactory = (props?: { required?: boolean }) => {
  const options: IFormControlOptions = props?.required
    ? { required: true, validators: MyValidators.required }
    : undefined;

  const group = createFormGroup({
    street: createFormControl("", options),
    city: createFormControl("", options),
    state: createFormControl("", options),
    zip: createFormControl("", options),
  });

  createEffect(() => {
    console.log("current address value", group.value);
  });

  return group;
};

const AddressField = withControl<{ legend?: string }, typeof controlFactory>({
  controlFactory,
  component: (props) => {
    // ...
  },
};
```

Finally, `withControl()` will add a `control` property containing your `controlFactory` function to the created Solidjs component. You can see this in action in the `ParentComponent` example, above

```tsx
import { AddressField } from "./AddressField";

export const ParentForm: Component<{}> = () => {
  const group = createFormGroup({
    firstName: createFormControl(""),
    lastName: createFormControl(""),
    // This use of `AddressField.control` is invoking the AddressField's
    // controlFactory function
    address: AddressField.control({ required: true }),
  });

  // ...
};
```

## Examples

### Simple example with validation

```tsx
const ExampleComponent: Component<{}> = () => {
  const control = createFormControl("", {
    // This optional validator function is run on every change.
    // If we return `null`, there are no errors. Else, we
    // can return an object containing errors.
    validators: (value: string) =>
      value.length === 0 ? { isMissing: true } : null,
  });

  return (
    <div>
      <label for="example">Please provide some text</label>

      <input
        name="example"
        type="text"
        value={control.value}
        oninput={(e) => {
          control.setValue(e.currentTarget.value);
        }}
        onblur={() => control.markTouched(true)}
      />

      <Show when={control.isTouched && control.errors?.isMissing}>
        <small>Answer required.</small>
      </Show>
    </div>
  );
};
```

Alternatively, this is effectively the same as the above:

```tsx
const ExampleComponent: Component<{}> = () => {
  const control = createFormControl("");

  // Under the hood, controls are just Solidjs stores
  // so every property is observable. Here we
  // observe the `value` prop and set or clear
  // errors as it changes
  createRenderEffect(() => {
    if (control.value.length > 0) {
      control.setErrors(null);
    } else {
      control.setErrors({ isMissing: true });
    }
  });

  return (
    <div>
      <label for="example">Please provide some text</label>

      <input
        name="example"
        type="text"
        value={control.value}
        oninput={(e) => {
          control.setValue(e.currentTarget.value);
        }}
        onblur={() => control.markTouched(true)}
      />

      <Show when={control.isTouched && control.errors?.isMissing}>
        <small>Answer required.</small>
      </Show>
    </div>
  );
};
```

### Medium example

```tsx
import { Show, type Component } from "solid-js";
import {
  createFormGroup,
  createFormControl,
  type IFormControl,
} from "solid-forms";

const ExampleForm: Component<{}> = () => {
  const group = createFormGroup({
    name: createFormControl(""),
    email: createFormControl(""),
  });

  const onSubmit = async () => {
    if (group.isSubmitted) return;
    // do stuff...
    // const { name, email } = group.value;
    // ...
    // group.markSubmitted(true);
  };

  return (
    <form onSubmit={onSubmit}>
      <label for="name">Your name</label>
      <TextInput name="name" control={group.controls.name} />

      <label for="email">Your email address</label>
      <TextInput name="email" type="email" control={group.controls.email} />

      <button>Submit</button>
    </form>
  );
};

const TextInput: Component<{
  control: IFormControl<string>;
  name?: string;
  type?: string;
}> = (props) => {
  const control = () => props.control;

  return (
    <>
      <input
        name={props.name}
        type={props.type || "text"}
        value={control().value}
        oninput={(e) => {
          control().markDirty(true);
          control().setValue(e.currentTarget.value);
        }}
        onblur={() => control().markTouched(true)}
        disabled={control().isDisabled}
        required={control().isRequired}
      />

      <Show when={control().isTouched && control().errors?.isMissing}>
        <small>Answer required.</small>
      </Show>
    </>
  );
};
```

Alternatively

```tsx
const ExampleForm: Component<{}> = () => {
  const group = createFormGroup({
    name: createFormControl(""),
    email: createFormControl("", {
      required: true,
      validators: (value: string) =>
        !value.includes("@") ? { invalid: true } : null,
    }),
  });

  createRenderEffect(() => {
    if (!group.children.areValid) {
      group.setErrors(null);
      return;
    }

    const firstPartOfEmail = group.value.email.split("@")[0];

    if (firstPartOfEmail !== group.value.name) {
      group.setErrors({ invalid: "email must match name" });
    } else {
      group.setErrors(null);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <label for="name">Your name</label>
      <TextInput name="name" control={group.controls.name} />

      <label for="email">Your email address</label>
      <TextInput name="email" type="email" control={group.controls.email} />

      <button>Submit</button>
    </form>
  );
};
```

## API

### IAbstractControl

```ts
interface IAbstractControl<
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
  readonly status: "DISABLED" | "PENDING" | "INVALID" | "VALID";

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
```

### IAbstractControlContainer

```ts
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
```

### IFormControl

[See the `IAbstractControl` interface, above.](#iabstractcontrol) IFormControl has the same properties as that interface.

```ts
interface IFormControl<
  Value = any,
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControl<Value, Data, Value> {
  [FormControlInterface]: true;
}
```

#### `createFormControl()`

Use the `createFormControl()` function to create a new Solidjs store conforming to the `IFormControl` interface.

```ts
function createFormControl<
  Value,
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  value?: Value,
  options?: IFormControlOptions<Data>
): IFormControl<Value, Data>;

interface IFormControlOptions<
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
```

### IFormGroup

[See the `IAbstractControlContainer` interface, above.](#iabstractcontrolcontainer) IFormGroup has the same properties as that interface.

```ts
interface IFormGroup<
  Controls extends { [key: string]: IAbstractControl } = {
    [key: string]: IAbstractControl;
  },
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControlContainer<Controls, Data> {
  [FormGroupInterface]: true;
}
```

#### `createFormGroup()`

Use the `createFormGroup()` function to create a new Solidjs store conforming to the `IFormGroup` interface.

```ts
function createFormGroup<
  Controls extends { [key: string]: IAbstractControl } = {
    [key: string]: IAbstractControl;
  },
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  controls?: Controls,
  options?: IFormGroupOptions<Data>
): IFormGroup<Controls, Data>;

interface IFormGroupOptions<
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
```

### IFormArray

[See the `IAbstractControlContainer` interface, above.](#iabstractcontrolcontainer) IFormArray has the same properties as that interface with one addtion: `push()` for adding new child controls to the end of the form array.

```ts
interface IFormArray<
  Controls extends ReadonlyArray<IAbstractControl> = ReadonlyArray<IAbstractControl>,
  Data extends Record<ControlId, any> = Record<ControlId, any>
> extends IAbstractControlContainer<Controls, Data> {
  [FormArrayInterface]: true;
  push(control: Controls[number]): void;
}
```

#### `createFormArray()`

Use the `createFormArray()` function to create a new Solidjs store conforming to the `IFormArray` interface.

```ts
function createFormArray<
  Controls extends ReadonlyArray<IAbstractControl> = ReadonlyArray<IAbstractControl>,
  Data extends Record<ControlId, any> = Record<ControlId, any>
>(
  controls?: Controls,
  options?: IFormArrayOptions<Data>
): IFormArray<Controls, Data>;

interface IFormArrayOptions<
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
```

### Helpers

#### `withControl()`

A higher order component function for creating reusable form components.

````ts
function withControl<
  Props extends {},
  ControlFactory extends (...args: [any, ...any[]]) => IAbstractControl
>(
  options: IWithControlOptions<Props, ControlFactory>
): WithControlReturnType<Props, ControlFactory>;

interface IWithControlOptions<
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

type WithControlReturnType<
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
````

#### `bindOwner()`

Helper to bind the owner of the current context to the supplied function.

```ts
function bindOwner<T>(fn: () => T): () => T;
```

## About

This library was created by John Carroll with **_significant_** inspiration from Angular's `ReactiveFormsModule`.
