# rx-controls

_The canonical version of this repo is hosted on [Gitlab](https://gitlab.com/john.carroll.p/rx-controls), but there is also a [Github mirror](https://github.com/jorroll/rx-controls). Issues and merge requests should be created in the [Gitlab repo](https://gitlab.com/john.carroll.p/rx-controls)._

RxControls provides several javascript `FormControl` objects to make dealing with forms easier. The library can be used stand-alone via `rx-controls` or via one of the framework specific options (Solidjs and Angular).

Installation depends on if you want to just use the core library (vanillajs) or if you want to use the Solidjs or Angular versions.

```bash
# vanilla
yarn add rx-controls
# solidjs
npm install rx-controls-solid
# angular
yarn add rx-controls-angular
```

## [Read the docs](./docs/1.%20Introduction.md)

- Read the docs [here](./docs/1.%20Introduction.md)

### Demos

- [Solidjs demo](https://codesandbox.io/s/rxcontrols-solid-blog-example-4sh0x?file=/index.tsx)

## About

This library was created by John Carroll with **_significant_** inspiration from Angular's `ReactiveFormsModule`. Anyone familiar with Angular will see many similarities in `rx-controls-angular` and getting started should be made much easier for it.

- _Sidenote, my background is mainly in Angular and I've had some growing pains setting up a monorepo that is framework agnostic. At the moment, the `rx-controls` and `rx-controls-solid` packages only have `main` (node) and `module` (es6) entry points, both of which target `es2015` transpilation (i.e. no `es5` or `UMD` builds are currently provided). I hope to improve the published bundles in the future to make this repo more accessible, but for the time being your own build system should be able to downlevel the modules further if necessary._
