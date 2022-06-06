# Solid Forms

Solid Forms provides several form control objects useful for making working with forms easier.

```bash
# solidjs
yarn add solid-forms
# or
npm install solid-forms
```

### Example:

```tsx
const ExampleForm: Component<{}> = () => {
  const group = createFormGroup({
    name: createFormControl(""),
    email: createFormControl("", {
      required: true,
      validator: (value: string) =>
        value.length === 0 ? { isMissing: true } : null,
    }),
  });

  createEffect(() => {
    if (group.isDisabled || !group.isValid) return;

    console.log("Current value", group.value);
  });

  const onSubmit = async () => {
    if (!group.isValid) return;

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
          control().setValue(e.currentTarget.value);
        }}
        onblur={() => control().markTouched(true)}
        required={control().isRequired}
      />

      <Show when={control().isTouched && control().errors?.isMissing}>
        <small>Answer required.</small>
      </Show>
    </>
  );
};
```

## Contents

- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Building a form](#building-a-form)
    - [Simple validation](#simple-validation)
    - [Observing and syncing input changes](#observing-and-syncing-input-changes)
    - [Grouping controls together](#grouping-controls-together)
    - [Using a FormGroup](#using-a-formgroup)
    - [The FormGroup "child", "children" and "self" props](#the-formgroup-"child"-"children"-and-"self"-props)
    - [Using a FormArray](#using-a-formarray)
    - [Creating controls asyncronously (i.e. `bindOwner()`)](#creating-controls-asyncronously-ie-bindowner)
  - [Reusing form components](#reusing-form-components)
    - [The `withControl()` helper](#the-withcontrol-helper)
  - [Validation and errors](#validation-and-errors)
    - [Validator functions](#validator-functions)
    - [Observe changes and manually set errors](#observe-changes-and-manually-set-errors)
- [Examples](#examples)
  - [Simple example](#simple-example)
  - [Simple example with validation](#simple-example-with-validation)
  - [Medium example](#medium-example)
- [API](#api)
  - [IAbstractControl](#iabstractcontrol)
  - [IAbstractControlContainer](#iabstractcontrolcontainer)
  - [IFormControl](#iformcontrol)
  - [IFormGroup](#iformgroup)
  - [IFormArray](#iformarray)
- [About](#about)

## Getting Started

### Installation

First add Solid Forms to your project via

```bash
# solidjs
yarn add solid-forms
# or
npm install solid-forms
```

### Building a form

Solid Forms has three basic building blocks: `createFormControl()`, `createFormGroup()`, and `createFormArray()`. You'll use `createFormControl()` to create individual inputs and then you'll optionally group those inputs together into more complex forms using FormGroups or FormArrays.

For example, if we wanted to create a simple standalone form for an email address, we could do the following:

```tsx
import { Show, type Component } from "solid-js";
import { createFormControl } from "solid-forms";

const ExampleComponent: Component<{}> = () => {
  const control = createFormControl("", {
    validators: (value: string) =>
      value.length < 4 || !value.includes("@") ? { invalid: true } : null,
  });

  return (
    <form>
      <label for="email">Please provide your email address</label>

      <input
        name="email"
        type="email"
        required
        value={control.value}
        oninput={(e) => {
          control.setValue(e.currentTarget.value);
        }}
        onblur={() => control.markTouched(true)}
      />

      <Show when={control.isTouched && !control.isValid}>
        <small>Answer invalid.</small>
      </Show>
    </form>
  );
};
```

Let's break this example down...

#### Simple validation

Here we create the control with a default value of a blank string (`""`) and an optional validation function.

```tsx
const ExampleComponent: Component<{}> = () => {
  const control = createFormControl("", {
    validators: (value: string) =>
      value.length < 4 || !value.includes("@") ? { invalid: true } : null,
  });

  // ...
};
```

This validation function will receive the control's new value on changes and is expected to either return `null` if there are no errors or return an object. The object needs to have keys but otherwise can be anything you choose. Here I've chosen a simple "invalid: true" entry, but you could use something like `invalid: "Answer invalid."` where `"Answer invalid."` is the error message you want to show the user. Or you could support errors in multiple languages via something like:

```
{
  invalid: {
    en: "Answer invalid.",
    es: "Respuesta inválida.",
    ...
  }
}
```

It's up to you to decide what the error entries mean. You can access errors via the `control.errors` prop. E.g. `control.errors?.invalid` or `control.errors?.invalid.en`.

#### Observing and syncing input changes

Here we wire up our FormControl to the input so that it responds to changes appropriately.

```tsx
return (
  <form>
    <label for="email">Please provide your email address</label>

    <input
      name="email"
      type="email"
      required
      value={control.value}
      oninput={(e) => {
        control.setValue(e.currentTarget.value);
      }}
      onblur={() => control.markTouched(true)}
    />

    <Show when={control.isTouched && !control.isValid}>
      <small>Must provide valid email.</small>
    </Show>
  </form>
);
```

We set the input element's value to the control's value. We then subscribe to `input` events for the element and set the control's value to the input's new value on every change. We also want to mark our controls as "touched" on blur events. We decide to only show an error message if the control is both invalid and has been marked as `isTouched`. Under the hood, `createFormControl` leans on Solidjs' [`createStore()` utility](https://www.solidjs.com/docs/latest/api#createstore) for all the heavy lifting. Because of this, all control properties are observable just like a [Solidjs store](https://www.solidjs.com/docs/latest/api#using-stores) is. When the control's `value` or `isTouched` or `isValid` properties change, this component will update automatically.

Just like the Solidjs store object, this results in fine grained reactivity. Only properties that are observed (i.e. `value` or `isTouched` or `isValid`) are processed by the browser and changes are only run when these properties update.

#### Grouping controls together

Most forms will have multiple parts and those parts can have subparts. We can group FormControls together using FormGroups and FormArrays. I expect most forms will be made using a FormGroup. Lets look at an example:

```tsx
import { Show, type Component } from "solid-js";
import {
  createFormGroup,
  createFormControl,
  type IFormControl,
} from "solid-forms";

const MyValidators = {
  required: (value: string) =>
    value.length === 0 ? { isMissing: "Answer required." } : null,
  email: (value: string) =>
    value.length > 0 && !value.includes("@")
      ? { invalid: "Invalid email." }
      : null,
};

const ExampleForm: Component<{}> = () => {
  const group = createFormGroup({
    name: createFormControl("", {
      validators: MyValidators.required,
    }),
    email: createFormControl("", {
      validators: [MyValidators.required, MyValidators.email],
    }),
  });

  const nameControl = () => group.controls.name;
  const emailControl = () => group.controls.email;

  const onSubmit = async () => {
    if (!group.isValid || group.isSubmitted) return;
    // do stuff...
    // const { name, email } = group.value;
    // ...
    // group.markSubmitted(true);
  };

  return (
    <form onSubmit={onSubmit}>
      <label for="name">Your name</label>
      <input
        name="name"
        required
        value={nameControl().value}
        oninput={(e) => {
          nameControl().setValue(e.currentTarget.value);
        }}
        onblur={() => nameControl().markTouched(true)}
      />

      <Show when={nameControl().isTouched && !nameControl().isValid}>
        <small>Answer required.</small>
      </Show>

      <label for="email">Your email address</label>
      <input
        name="email"
        type="email"
        required
        value={emailControl().value}
        oninput={(e) => {
          emailControl().setValue(e.currentTarget.value);
        }}
        onblur={() => emailControl().markTouched(true)}
      />

      <Show when={emailControl().isTouched && !emailControl().isValid}>
        <For each={Object.values(emailControl().errors)}>
          {(errorMsg) => <small>{errorMsg}</small>}
        </For>
      </Show>

      <button disabled={!group.isValid}>Submit</button>
    </form>
  );
};
```

You might be noticing some annoying duplication in our code here. Let's set that problem aside for a moment and look at what's happening in this example...

#### Using a FormGroup

Here we've used the `createFormGroup()` function to create a FormGroup which has child `name` and `email` FormControls (as you might expect, FormGroups can also have nested `FormGroups` or `FormArrays`).

```tsx
const ExampleForm: Component<{}> = () => {
  const group = createFormGroup({
    name: createFormControl("", {
      validators: MyValidators.required,
    }),
    email: createFormControl("", {
      validators: [MyValidators.required, MyValidators.email],
    }),
  });

  const nameControl = () => group.controls.name;
  const emailControl = () => group.controls.email;

  // ...
};
```

While FormControls implement the [`IAbstractControl` interface](#iabstractcontrol) (which you can learn more about in the [API section](#api), below), FormGroups implement the [`IAbstractControlContainer` interface](#iabstractcontrolcontainer) (which itself implements the `IAbstractControl` interface). A FormGroup has all of the properties that a FormControl has, but it also has additional properties like a `controls` property which contains the FormGroups child controls. We can access these controls via `group.control["control name"]`.

[As before](#observing-and-syncing-input-changes), the FormGroup is powered by a Solidjs store and all the properties are observable. This means we can observe changes to the `controls` property. Each value in the `controls` property is actually a FormControl object, so we obviously can observe all of their changes as well.

**/Start slight digression**

> Because accessing each control via `group.controls.name` is verbose and repetitive, I chose to create a helper function to access each child control (i.e. `const nameControl = () => group.controls.name`). In javascript, [a function like this is called a "thunk"](https://reactgo.com/thunks-javascript/#definition-of-thunk). Anywhere a signal is expected in Solidjs, you can replace that signal with a thunk which returns a signal value (this isn't specific to Solid Forms, this is just a Solidjs feature you may not be familiar with).
>
> For example, this works just fine:
>
> ```tsx
> const [value, setValue] = createSignal();
>
> const valueAlias = () => value();
>
> return <p>{valueAlias()}</p>;
> ```
>
> You might think you could do something like this:
>
> ```tsx
> const [value, setValue] = createSignal({ nestedValue: true });
>
> const { nestedValue } = value();
>
> return <p>{nestedValue}</p>;
> ```
>
> [But you can't. This breaks reactivity in Solidjs.](https://www.solidjs.com/guides/reactivity#considerations) Hence, using thunks can be handy to reduce repitition.

**/End digression**

In a FormGroup, some properties are derived from the children controls and other properties are hybrids of the children state as well as the FormGroup's personal state. For example, the `value` of our FormGroup can be thought of as `{ name: nameControl().value, email: emailControl().value }` except disabled child controls are removed from the FormGroup's value. That is, if we disabled the "name" control (e.g. `nameControl().markDisabled(true)`) then the FormGroup's value would update to be `{ email: emailControl().value }`.

If we want to get the value of the FormGroup ignoring the disabled status of children, we can use the `rawValue` property. This property can be thought of as `{ name: nameControl().rawValue, email: emailControl().rawValue }` and will continue to return the rawValue of all children, even if some are disabled. Like all properties, a FormGroup's value is deeply observable.

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

#### The FormGroup "child", "children" and "self" props

Both FormControls and FormGroups (and FormArrays) have a `self` prop which itself is an object containing properties like `isValid`, `isDisabled`, `isTouched`, etc. In a FormControl, `control.isValid` is just an alias for `control.self.isValid` (same for `control.isTouched`, etc). In a FormGroup though, the two properties are different and the `self` object contains state local to that FormGroup.

For example, if you do `group.markTouched(true)` on the FormGroup, that updates `group.self.isTouched` to true but it doesn't affect the state of the FormGroup's children. Meanwhile, `group.isTouched` is actually a getter function equal to `group.self.isTouched || group.children.areTouched`. The `group.children.areTouched` property is also a memoized getter (it uses `createMemo()` under-the-hood) which is true if every child is touched (it's `false` if there are no children). So a FormGroup is "touched" if _either_ the FormGroup itself has been `markTouched(true)` or if all of the FormGroup's children have been `markTouched(true)`. But if you just want to see if the FormGroup, itself, has been touched, then you can use `group.self.isTouched`. Meanwhile, `group.child.isTouched` will return `true` if _any_ child control has been touched. As expected, all of these properties are observable.

> You can view the full [`IFormGroup` API reference](#iformgroup) for all of the `self`, `children`, and `child` properties.

In our last example, we used `group.setErrors()` in a way you may have found surprising:

```tsx
createRenderEffect(() => {
  if (!group.children.areValid) {
    group.setErrors(null);
    return;
  }

  // ...
});
```

To the unfamiliar, this might _look_ like we're clearing all errors on the FormGroup is any children are invalid. And we are doing that, but clearing errors on the FormGroup doesn't necessarily clear the `group.errors` property. This is because `group.errors` is a getter function equal to `{ ...group.children.errors, ...group.self.errors }` or `null` if there are no children errors or self errors. Using `group.setErrors()` sets `self.errors`. So what we're doing here is saying, "If not all children are valid, clear the FormGroups errors and don't run validation." Else, check to see if the part of the email address before the "@" symbol matches the "name" value exactly. If it doesn't, then we set `group.self.errors` else we clear any existing errors.

```ts
const firstPartOfEmail = group.value.email.split("@")[0];

if (group.value.name !== firstPartOfEmail) {
  group.setErrors({ nameAndEmailMismatch: true });
} else {
  group.setErrors(null);
}
```

#### Using a FormArray

[Like FormGroups](#using-a-formgroup), FormArrays implement the [`IAbstractControlContainer` interface](#iabstractcontrolcontainer) (which itself implements the [`IAbstractControl` interface](#iabstractcontrol)). As you might expect, FormArrays are very similar to FormGroups and are used to group multiple controls together. While a FormGroup groups multiple controls together using an object with named keys, a FormArray groups them together using an array. FormArrays behave very similarly to FormGroups but with the change that you're dealing with an array of child controls (rather than an object containing child controls). FormArray also has one additional method `push()` which adds a new child control to the end of the FormArray. Other than `push()`, FormArray and FormGroup have the same interface (which comes from `IAbstractControlContainer`). Read the FormGroup section to familiarize yourself with the `IAbstractControlContainer` interface.

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

### Reusing form components

So far, many of the examples have involved a fair amount of repitition. In that sense, they are unrealistic. We want dry code! In practice, I expect you will be creating your own reusable input components and form partials and, I think, this is where Solid Forms _really shines!_

There are two main ways you can make reusable form inputs. The first option is to handle it like any other component in your app, and this is just fine.

Example:

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

  const controls = () => group.controls;

  return (
    <form>
      <label for="name">Your name</label>
      <TextInput name="name" control={controls().name} />

      <label for="email">Your email address</label>
      <TextInput name="email" type="email" control={controls().email} />

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

Here we've created a reusable `TextInput` component. We just pass it a FormControl via the `control` prop and use it like normal. Nice and easy!

You also aren't limited to reusing FormControls. Here's an example of a reusable AddressField component.

```tsx
import { Show, type Component } from "solid-js";
import {
  createFormGroup,
  createFormControl,
  type IFormGroup,
  type IFormControl,
} from "solid-forms";

const AddressField: Component<{
  control: IFormGroup<{
    street: IFormControl<string>;
    city: IFormControl<string>;
    state: IFormControl<string>;
    zip: IFormControl<string>;
  }>;
  legend?: string;
}> = () => {
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
};
```

But here, with our reusable AddressField component, the parent using this component always needs to build the address form group. Maybe you want to cut down on that duplication so you try to wire things up so that, instead of passing an address FormGroup control prop to the AddressField, you pass the parent FormGroup and the AddressField registers itself.

For example:

```tsx
const options = {
  required: true,
  validators: MyValidators.required,
};

const AddressField: Component<{
  controlContainer: IFormGroup;
  controlName: string;
  legend?: string;
}> = () => {
  const group = createFormGroup({
    street: createFormControl("", options),
    city: createFormControl("", options),
    state: createFormControl("", options),
    zip: createFormControl("", options),
  });

  createEffect(() => {
    props.controlContainer.setControl(props.controlName, group);

    onCleanup(() => {
      props.controlContainer.removeControl(group);
    });
  });

  // ...
};
```

In this example, the parent doesn't need to worry about creating our AddressField control, the address field handles that itself. The problem with this approach is that the address control is not available in the parent immediately. Instead, we need to wait for Solidjs to run through the `createEffect()` so that the control is registered on the parent via `setControl()`. Additionally, in typescript we don't have nice type inference on the parent control. Also, maybe the parent component wants to do some customization on initialization to the AddressField control. That gets more complicated if the address control is being intialized in the AddressField component.

Maybe instead you decide to do something like the following:

```tsx
const options = {
  required: true,
  validators: MyValidators.required,
};

export const controlFactory = () =>
  createFormGroup({
    street: createFormControl("", options),
    city: createFormControl("", options),
    state: createFormControl("", options),
    zip: createFormControl("", options),
  });

export const AddressField: Component<{
  control: IFormGroup<{
    street: IFormControl<string>;
    city: IFormControl<string>;
    state: IFormControl<string>;
    zip: IFormControl<string>;
  }>;
  legend?: string;
}> = () => {
  // ...
};
```

And then, in a hypothetical parent component...

```tsx
import { AddressField, controlFactory } from "./AddressField";

export const ParentForm: Component<{}> = () => {
  const group = createFormGroup({
    firstName: createFormControl(""),
    lastName: createFormControl(""),
    address: controlFactory(),
  });

  const controls = () => group.controls;

  // For whatever reason, we decide to for our address field to
  // be disabled by default.
  controls().address.markDisabled(true);

  return (
    <form>
      <label for="firstName">First name</label>
      <TextInput name="firstName" control={controls().firstName} />

      <label for="lastName">Last Name</label>
      <TextInput name="lastName" control={controls().lastName} />

      <AddressField control={controls().address} />
    </form>
  );
};
```

In this example, we create a control factory function which a parent can import and use to create the AddressField form group. This is nice because we get our type inference in typescript and also we can manipulate the address control before passing it to the AddressField. In this example we decide to disable the AddressField control before passing it to the AddressField.

But there's a better way of doing this...

#### The `withControl()` helper

The simplest way of creating a reusable form component is to just handle it like a normal component [like described above](#reusing-form-components). However, in many situations, for example the AddressField, it might make sense to colocate the address control creation logic with AddressField. In these situations (which might be most situations), Solid Forms provides an optional `withControl()` higher order component helper that simplifies creating reusable form components.

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

The `withControl()` function expects an object with `controlFactory` and `component` properties. The component property expects a component function. This component function will always receive a `control` prop that has the same interface as the control returned by the provided `controlFactory` function. The control factory function is responsible for constructing the control used by the component. The control factory function optionally receives the component's properties as arguments. When using the `AddressField`, it will have an optional `control` property. If you provide that property (like we did in the example above), then the `controlFactory` function will never be called. But `withControl()` allows us to use our AddressField by itself without providing a control property to it.

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

The controlFactory function, itself, operates like a component. It is only called once on initialization, and you can use choose to use `createEffect()` and signals inside of it.

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

### Validation and errors

Validating data and working with errors is a core part of working with forms. The are two primary ways of validating data in Solid Forms. The simple but more limited approach is to use validator functions and the more flexible and powerful approach is to just use Solidjs builtings like `createEffect()` to observe control changes and then `setErrors()` and `patchErrors()` as appropriate.

#### Validator functions

Validator functions are optional functions you can provide to a control which are run whenever the control's value changes and either return `null` (if there are no errors) or return an object with key-value entries if there are errors.

```ts
const control = createFormControl("", {
  validators: (value: string) =>
    value.length === 0 ? { isMissing: true } : null,
});
```

In this example we provide a validator function that returns an error if the control's value is length `0`. When constructing a new control, we can also provide an array of validator functions if we wish. All their errors on every change will be merged together in the control. You can update the validator function with `setValidator()`.

#### Observe changes and manually set errors

Validator functions are nice and the easiest way to add validation in many (most?) situations, but a more powerful approach is to observe control changes and manually set errors. With this approach, we have access to the full array of control properties which we can include in our validation logic (not just the value).

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

Here we observe control value changes and set an error if the value includes an "@" symbol or else clear the errors (to indicate that the value is valid).

If we have multiple different validation effects, we should use the `source` property of `setErrors()` and `patchErrors()` to partition the errors associated with each effect. For example:

```ts
const control = createFormControl("");

createRenderEffect(() => {
  if (control.value.includes("@")) {
    control.setErrors(
      { mustNotIncludeSymbol: "Cannot include '@' symbol." },
      {
        source: "@ validator",
      }
    );
  } else {
    control.setErrors(null, {
      source: "@ validator",
    });
  }
});

createRenderEffect(() => {
  if (control.value.length > 10) {
    control.setErrors(
      { tooLong: "Cannot be more than 10 characters." },
      {
        source: "Max lenth validator",
      }
    );
  } else {
    control.setErrors(null, {
      source: "Max lenth validator",
    });
  }
});
```

Here when we `setErrors()` and also provide the `source` option, we will only clear or overwrite existing errors that were also set with the `"Max lenth validator"` source. The `setValidators()` (for setting validator functions) and `markPending()` methods also accept `source` options. The `markPending()` option allows async validators to mark the control as pending while the validation is being processed. The control will register as pending so long as any `source` is still pending.

### Examples

I generally like seeing some example code to get a feel for the API. What follows are three examples of using Solid Forms. These examples don't go into great detail describing how things work though. If you'd like to dive in to how to use Solid Forms, skip to the [Building a form](#building-a-form) section, below.

#### Simple example

```tsx
import { Show, type Component } from "solid-js";
import { createFormControl } from "solid-forms";

const ExampleComponent: Component<{}> = () => {
  const control = createFormControl("");

  createEffect(() => {
    console.log("see value on every change", control.value);
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
      />
    </div>
  );
};
```

#### Simple example with validation

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

Alternatively

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

  // ...
};
```

#### Medium example

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
    const name = () => group.controls.name;
    const email = () => group.controls.email;

    if (!group.children.areValid) {
      group.setErrors(null);
      return;
    }

    const firstPartOfEmail = email().value.split("@")[0];

    if (firstPartOfEmail !== name()) {
      group.setErrors({ invalid: "email must match name" });
    } else {
      group.setErrors(null);
    }
  });

  // etc ...
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
   * The value of the IAbstractControl. In an IAbstractControlContainer,
   * `value` and `rawValue` have differences, but in a standard
   * `IAbstractControl` `value` is an alias for `rawValue`.
   */
  readonly value: Value;

  /** The value of the IAbstractControl. */
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
   * validated the control inside a `createEffect()` you could alter the
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
   * A validator function that is run on value changes and which
   * generates errors associated with the source "CONTROL_DEFAULT_SOURCE".
   */
  readonly validator: ValidatorFn | null;

  /**
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

  /**
   * `true` if this control is pending, false otherwise.
   * This is an alias for `self.isPending`.
   */
  readonly isPending: boolean;

  /**
   * A set of ControlIds. `self.isPending` is true so long
   * as `pendingStore.size > 0`. Because this is a set, you
   * can track multiple pending "things" at once. This
   * control will register as pending until all of the "things"
   * have resolved. Use the `markPending()` method with
   * the `source` option to update the pendingStore.
   */
  readonly pendingStore: ReadonlySet<ControlId>;

  /**
   * Valid if `this.selfErrors === null && !this.selfPending`
   *
   * This is an alias for `selfValid`.
   */
  readonly isValid: boolean;

  /**
   * The `self` object on an abstract control contains
   * properties reflecting the controls personal state. On an
   * IAbstractControlContainer, the personal state can differ
   * from the control's state. For example, an
   * IAbstractControlContainer will register as disabled if
   * the control itself has been marked as disabled OR if
   * all of it's children controls are disabled. Marking the
   * control itself as disabled doesn't mark the children as
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
     * Dirty can be thought of as, "Has the value changed?"
     * Though the isDirty property must be manually set by
     * the user (using `markDirty()`) and is not automatically
     * updated.
     */
    readonly isDirty: boolean;
    /**
     * `true` if this control is readonly, false otherwise.
     * This property does not have any predefined meeting for
     * an IAbstractControl. You can decide if you want to give
     * it meaning.
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
   * If provided a `ValidationErrors` object or `null`, replaces the errors.
   * Optionally, provide a source ID and the change will be partitioned
   * assocaited with the source ID. The default source is
   * "CONTROL_DEFAULT_SOURCE".
   *
   * If you provide a `Map` object containing `ValidationErrors` keyed to source IDs,
   * that will replace the `errorsStore` associated with this control.
   */
  setErrors(
    value: ValidationErrors | null | ReadonlyMap<ControlId, ValidationErrors>,
    options?: { source?: ControlId }
  ): void;

  /**
   * If you provide a `ValidationErrors` object, that object is merged with the
   * existing errors associated with the source ID. If the error object has
   * properties = `null`, errors associated with those keys are deleted
   * from the `errorsStore`.
   *
   * If you provide a `Map` object containing `ValidationErrors` keyed to source IDs,
   * that object is merged with the existing `errorsStore`.
   */
  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options?: { source?: ControlId }
  ): void;

  markTouched(value: boolean): void;
  markDirty(value: boolean): void;
  markReadonly(value: boolean): void;

  /**
   * Mark the control as required. Note that this property doesn't
   * have any predefined meaning for IAbstractControls and it doesn't affect
   * validation in any way. It is up to you to decide what meaning, if any,
   * to give to this property and how to use it. For example, if you
   * validated the control inside a `createEffect()` you could alter the
   * validation based on whether the control was marked as `required` or
   * not.
   */
  markRequired(value: boolean): void;

  /**
   * Mark the control as disabled. This affect's the control's `status`
   * property. Additionally, `IAbstractControlContainer's` ignore
   * disabled children in many cases. For example, the `value` of a
   * control container does not contain disabled children (if you want
   * to see the value including disabled children, use `rawValue`).
   */
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
  readonly controls: Controls;

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

  /**
   * Apply a partial update to the values of some children but
   * not all.
   */
  patchValue(value: unknown): void;

  setControls(controls: Controls): void;

  setControl(key: unknown, control: unknown): void;

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

## About

This library was created by John Carroll with **_significant_** inspiration from Angular's `ReactiveFormsModule`.
