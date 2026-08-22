import { expect, expectTypeOf, it } from 'vitest';
import * as Index from '../src/index.ts';

it('has named exports', () =>
  ['CAREFUL_PROFILE', 'COMMON_PROFILE', 'URLComponent'].forEach(namedExport =>
    expect(Index).toHaveProperty(namedExport)
  ));

it('has immutable named exports', () => {
  // @ts-expect-error -- assigning to read-only prop
  expect(() => (Index.CAREFUL_PROFILE.ignoreComponents = false)).toThrow(TypeError);
  // @ts-expect-error -- invalid prop
  expect(() => (Index.CAREFUL_PROFILE.nonExistent = false)).toThrow(TypeError);

  // @ts-expect-error -- assigning to read-only prop
  expect(() => (Index.COMMON_PROFILE.ignoreComponents = false)).toThrow(TypeError);
  // @ts-expect-error -- invalid prop
  expect(() => (Index.COMMON_PROFILE.nonExistent = false)).toThrow(TypeError);

  // @ts-expect-error -- assigning to read-only prop
  expect(() => (Index.URLComponent.AUTH = Symbol())).toThrow(TypeError);
  // @ts-expect-error -- invalid prop
  expect(() => (Index.URLComponent.nonExistent = Symbol())).toThrow(TypeError);
});

it('has named type exports', () => {
  expectTypeOf<Index.URLComponentValue>();
  expectTypeOf<Index.URLRelationOptions>();
  expectTypeOf<Index.URLRelationOptionsWithTarget>();
});

it('has a default export', () => expect(Index).toHaveProperty('default'));
