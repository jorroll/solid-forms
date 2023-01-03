# Change Log

This repo attempts to follow [semantic versioning](https://semver.org/).

## Unreleased

- none

## 0.4.9 FIX (2023/1/2)

### Fix

- Only call dispose on unmount in `solid-forms-react` `useControl()`.

## 0.4.8 FIX (2023/1/2)

### Fix

- Loosened the typing of `useControlState()` in `solid-forms-react` package.

## 0.4.7 FIX (2023/1/2)

### Fix

- Loosened the typing of `useControl()` in `solid-forms-react` package.

## 0.4.6 FIX (2022/8/19)

### Fix

- Workaround for a seemingly upstream issue with `solid-js/store` that would prevent subscribers from being informed when nested data changed. The fix was to use `produce()` instead of the standard `setState` function that a store returns.

## 0.4.5 FIX (2022/7/16)

### Fix

- Fixed a bug in `IAbstractControlContainerBase` that could result in an abstract control container (i.e. a FormGroup or FormArray) have an incorrect `children.errors` and, as a consequence, `errors` properties.
