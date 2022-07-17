# Change Log

This repo attempts to follow [semantic versioning](https://semver.org/).

## Unreleased

- none

## 0.4.5 FIX (2022/7/16)

### Fix

- Fixed a bug in `IAbstractControlContainerBase` that could result in an abstract control container (i.e. a FormGroup or FormArray) have an incorrect `children.errors` and, as a consequence, `errors` properties.
