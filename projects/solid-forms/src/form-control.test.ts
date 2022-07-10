// runAbstractControlBaseTestSuite(
//   'FormControl',
//   (args) => new FormControl(null, args?.options)
// );

import { DEFAULT_SOURCE } from './abstract-control-base';
import { createFormControl, IFormControl } from './form-control';
import { inspect } from 'util';
import { createEffect } from 'solid-js';

// runSharedTestSuite(
//   'FormControl',
//   (args) => new FormControl(null, args?.options),
//   {
//     controlContainer: false,
//   }
// );

// function testAllDefaultsExcept(
//   c: FormControl,
//   ...skipTests: Array<keyof FormControl>
// ) {
//   testAllAbstractControlDefaultsExcept(c, ...skipTests);

//   if (!(skipTests.includes('value') || skipTests.includes('rawValue'))) {
//     expect(c.value).toEqual(null);
//     expect(c.rawValue).toEqual(null);
//   }
// }

describe('FormControl', () => {
  beforeEach(() => {});

  describe('initialization', () => {
    describe('options', () => {
      it('value/rawValue', () => {
        const c = createFormControl('one');

        expect(c.value).toEqual('one');
        expect(c.rawValue).toEqual('one');
      });

      it('id', () => {
        const c = createFormControl(null, {
          id: 'one',
        });

        expect(c.id).toEqual('one');
      });

      it('data', () => {
        const c = createFormControl(null, {
          data: { one: 'one' },
        });

        expect(c.data).toEqual({ one: 'one' });
      });

      it('all options', () => {
        const c = createFormControl('one', {
          data: { one: 'one' },
          dirty: true,
          disabled: true,
          errors: { error: true },
          id: 'controlId',
          pending: true,
          readonly: true,
          submitted: true,
          touched: true,
          validators: (c) => null,
        });

        expect(c).toMatchObject({
          value: 'one',
          rawValue: 'one',
          isValid: false,
          status: 'DISABLED',
          data: { one: 'one' },
          isDirty: true,
          isDisabled: true,
          errors: { error: true },
          id: 'controlId',
          isPending: true,
          isReadonly: true,
          isSubmitted: true,
          isTouched: true,
          validator: expect.any(Function),
          self: {
            errorsStore: new Map([[DEFAULT_SOURCE, { error: true }]]),
            pendingStore: new Set([DEFAULT_SOURCE]),
            validatorStore: new Map([[DEFAULT_SOURCE, expect.any(Function)]]),
          },
        });
      });
    });
  });

  describe('setValue', () => {
    let c: IFormControl;

    beforeEach(() => {
      c = createFormControl('oldValue');
    });

    it('should have starting value', () => {
      expect(c.rawValue).toEqual('oldValue');
    });

    it('should set the value of the control', () => {
      c.setValue('newValue');
      expect(c.rawValue).toEqual('newValue');
    });

    it('with validator', async () => {
      c.setValidators((value) =>
        value !== 'oldValue' ? null : { required: true }
      );

      expect(c).toMatchObject({
        value: 'oldValue',
        rawValue: 'oldValue',
        isValid: false,
        status: 'INVALID',
        errors: { required: true },
        validator: expect.any(Function),
        self: {
          errorsStore: new Map([[DEFAULT_SOURCE, { required: true }]]),
          validatorStore: new Map([[DEFAULT_SOURCE, expect.any(Function)]]),
        },
      });

      c.setValue('hi');

      expect(c).toMatchObject({
        value: 'hi',
        rawValue: 'hi',
        validator: expect.any(Function),
        self: {
          validatorStore: new Map([[DEFAULT_SOURCE, expect.any(Function)]]),
        },
      });
    });
  });

  describe('validationService', () => {
    let c: IFormControl;

    beforeEach(() => {
      c = createFormControl('oldValue');
    });

    it('with one service', async () => {
      createEffect(() => {
        const errors = c.value === 'validValue' ? null : { invalidValid: true };

        c.setErrors(errors, { source: 'myValidationService' });
      });

      c.setValue('invalidValue');

      expect(c).toMatchObject({
        value: 'invalidValue',
        rawValue: 'invalidValue',
        isValid: false,
        errors: { invalidValid: true },
        self: {
          errorsStore: new Map([
            ['myValidationService', { invalidValid: true }],
          ]),
        },
      });

      c.setValue('validValue');

      expect(c).toMatchObject({
        value: 'validValue',
        rawValue: 'validValue',
        isValid: true,
        errors: null,
        self: {
          errorsStore: new Map(),
        },
      });
    });

    it('with two services', async () => {
      createEffect(() => {
        const errors =
          c.rawValue.toLowerCase() === c.rawValue
            ? null
            : { mustBeLowercase: true };

        c.setErrors(errors, { source: 'lowercaseValidationService' });
      });

      createEffect(() => {
        const errors =
          c.rawValue.toLowerCase() === 'validvalue'
            ? null
            : { invalidValue: true };

        c.setErrors(errors, { source: 'valueValidationService' });
      });

      c.setValue('invalidValue');

      expect(c).toMatchObject({
        value: 'invalidValue',
        rawValue: 'invalidValue',
        isValid: false,
        errors: { mustBeLowercase: true, invalidValue: true },
        self: {
          errorsStore: new Map([
            ['lowercaseValidationService', { mustBeLowercase: true }],
            ['valueValidationService', { invalidValue: true }],
          ]),
        },
      });

      c.setValue('validValue');

      expect(c).toMatchObject({
        value: 'validValue',
        rawValue: 'validValue',
        isValid: false,
        errors: { mustBeLowercase: true },
        self: {
          errorsStore: new Map([
            ['lowercaseValidationService', { mustBeLowercase: true }],
          ]),
        },
      });

      c.setValue('validvalue');

      expect(c).toMatchObject({
        value: 'validvalue',
        rawValue: 'validvalue',
        isValid: true,
        errors: null,
        self: {
          errorsStore: new Map(),
        },
      });
    });
  });
});
