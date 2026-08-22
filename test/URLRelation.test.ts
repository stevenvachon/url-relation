import { describe, expect, it } from 'vitest';
import tests from './helpers/tests.json' with { type: 'json' };
import { URL_COMPONENT_SEQUENCE, URLComponent } from '../src/components.ts';
import type {
  URLComponentValue,
  URLRelationOptions,
  URLRelationOptionsWithTarget,
} from '../src/types.ts';
import URLRelation, { CAREFUL_PROFILE, COMMON_PROFILE } from '../src/index.ts';
import type { Writable } from 'type-fest';

/**
 * The named `relation` columns in `tests.json`.
 */
const RelationColumn = {
  CAREFUL: 'careful',
  COMMON: 'common',
} as const satisfies Record<string, keyof (typeof tests)[number]['relation']>;

/**
 * The named `relation` columns in `tests.json`.
 */
type RelationColumn = (typeof RelationColumn)[keyof typeof RelationColumn];

/**
 * Split the component sequence into those through to `component` (expected to be related)
 * and those beyond it (expected to be unrelated).
 */
const all = (component: URLComponentValue) => {
  const componentIndex = URL_COMPONENT_SEQUENCE.indexOf(component);
  return {
    relatedComponents: URL_COMPONENT_SEQUENCE.slice(0, componentIndex + 1),
    unrelatedComponents: URL_COMPONENT_SEQUENCE.slice(componentIndex + 1),
  };
};

/**
 * Determine whether `URLRelation.match` is `true` through to `options.targetComponent` _**and `false` beyond it**_
 * (`match` itself does not test beyond).
 */
const allMatch = (url1: URL, url2: URL, options: URLRelationOptionsWithTarget) => {
  const { relatedComponents, unrelatedComponents } = all(options.targetComponent!);
  return (
    relatedComponents.every(() => URLRelation.match(url1, url2, options)) &&
    unrelatedComponents.every(() => !URLRelation.match(url1, url2, options))
  );
};

/**
 * Determine whether `URLRelation::upTo` is `true` through to `component` _**and `false` beyond it**_
 * (`upTo` itself does not test beyond).
 */
const allUpTo = (
  url1: URL,
  url2: URL,
  options: URLRelationOptions | undefined,
  component: URLComponentValue,
  ignoreComponents?: readonly URLComponentValue[]
) => {
  const { relatedComponents, unrelatedComponents } = all(component);
  const instance = new URLRelation(url1, url2, options);
  return (
    relatedComponents.every(part => instance.upTo(part, ignoreComponents)) &&
    unrelatedComponents.every(part => !instance.upTo(part, ignoreComponents))
  );
};

/**
 * Creates a test case that matches every pair in `tests.json` using one of its relation columns.
 */
const combinations = (options: URLRelationOptions | undefined, relationColumn: RelationColumn) =>
  it(`supports ${tests.length} different URL combinations`, { timeout: 7500 }, () =>
    tests.forEach(({ url1: url1String, url2: url2String, relation: _relation }) => {
      const url1 = new URL(url1String);
      const url2 = new URL(url2String);
      const relation = _relation[relationColumn];
      const component =
        relation === false
          ? URLComponent.PROTOCOL
          : URLComponent[relation as keyof typeof URLComponent];
      const errorMessage = `\n  Matching:\n    "${url1String}"\n  With:\n    "${url2String}"\n  …up to ${component.description} with ${relationColumn} profile`;
      expect(allUpTo(url1, url2, options, component), errorMessage).toBe(!!relation);
      expect(allUpTo(url2, url1, options, component), errorMessage).toBe(!!relation);
    })
  );

const isHttpOrHttps = (url1: URL, url2: URL) =>
  [url1, url2].every(url => url.protocol === 'http:' || url.protocol === 'https:');

/**
 * Customized options defaulting all to disabled/empty.
 */
const options = (overrides: URLRelationOptionsWithTarget = {}): URLRelationOptionsWithTarget => ({
  components: [],
  defaultPorts: {},
  ignoreComponents: false,
  ignoreDefaultPort: false,
  ignoreEmptySearchParams: false,
  ignoreEmptySegmentNames: false,
  ignoreIndexFilename: false,
  ignoreSearchParamNames: false,
  ignoreSearchParamOrder: false,
  ignoreWWW: false,
  indexFilenames: [],
  searchParamNames: [],
  ...overrides,
});

describe('new URLRelation()', () => {
  it('accepts URL input', () => {
    const opts = options();
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    expect(() => new URLRelation(url1, url2, opts)).not.toThrow();
  });

  it('rejects non-URL input', () => {
    const opts = options();
    const url = 'http://www.domain.com:123/dir/file.html?search#hash';
    // @ts-expect-error -- unsupported value
    expect(() => new URLRelation(url, url, opts)).toThrow(TypeError);
    // @ts-expect-error -- unsupported value
    expect(() => new URLRelation(new URL(url), url, opts)).toThrow(TypeError);
    // @ts-expect-error -- unsupported value
    expect(() => new URLRelation(url, new URL(url), opts)).toThrow(TypeError);
  });
});

describe('URLRelation.match()', () => {
  it('accepts URL input', () => {
    const opts = options({ targetComponent: URLComponent.HASH });
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    expect(() => URLRelation.match(url1, url2, opts)).not.toThrow();
  });

  it('rejects non-URL input', () => {
    const opts = options({ targetComponent: URLComponent.HASH });
    const url = 'http://www.domain.com:123/dir/file.html?search#hash';
    // @ts-expect-error -- unsupported value
    expect(() => URLRelation.match(url, url, opts)).toThrow(TypeError);
    // @ts-expect-error -- unsupported value
    expect(() => URLRelation.match(new URL(url), url, opts)).toThrow(TypeError);
    // @ts-expect-error -- unsupported value
    expect(() => URLRelation.match(url, new URL(url), opts)).toThrow(TypeError);
  });

  it('rejects non-URLComponent for options.targetComponent', () => {
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    // @ts-expect-error -- unsupported value
    expect(() => URLRelation.match(url1, url2, options({ targetComponent: 'hash' }))).toThrow(
      TypeError
    );
  });

  it('returns a boolean', () => {
    const opts = options({ targetComponent: URLComponent.HASH });
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search');

    expect(URLRelation.match(url1, url1, opts)).toBe(true);
    expect(URLRelation.match(url1, url2, opts)).toBe(false);
    expect(URLRelation.match(url2, url1, opts)).toBe(false);

    expect(allMatch(url1, url1, opts)).toBe(true);
    expect(allMatch(url1, url2, opts)).toBe(false);
    expect(allMatch(url2, url1, opts)).toBe(false);
  });
});

describe('URLRelation::relations', () => {
  it('has a boolean for each URLComponent', () => {
    const opts = options();
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    expect(new URLRelation(url1, url2, opts)).toHaveProperty(
      'relations',
      expect.objectContaining(
        Object.values(URLComponent).reduce(
          (result, component) => {
            result[component] = expect.any(Boolean);
            return result;
          },
          {} as Writable<typeof URLRelation.prototype.relations>
        )
      )
    );
  });

  it('is immutable', () => {
    const opts = options();
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const instance = new URLRelation(url1, url2, opts);
    // @ts-expect-error -- assigning to read-only prop
    expect(() => (instance.relations = {})).toThrow(TypeError);
    // @ts-expect-error -- assigning to read-only prop
    expect(() => (instance.relations[URLComponent.AUTH] = false)).toThrow(TypeError);
    // @ts-expect-error -- invalid prop
    expect(() => (instance.relations.nonExistent = false)).toThrow(TypeError);
  });
});

describe('URLRelation::upTo()', () => {
  it('accepts URLComponent input', () => {
    const opts = options();
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const instance = new URLRelation(url1, url2, opts);
    expect(() => instance.upTo(URLComponent.PROTOCOL)).not.toThrow();
  });

  it('rejects non-URLComponent input', () => {
    const opts = options();
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const instance = new URLRelation(url1, url2, opts);
    // @ts-expect-error -- unsupported value
    expect(() => instance.upTo('protocol')).toThrow(TypeError);
    // @ts-expect-error -- required arg was omitted
    expect(() => instance.upTo()).toThrow(TypeError);
  });

  it('returns a boolean', () => {
    const opts = options();
    const url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
    const url2 = new URL('http://www.domain.com:123/dir/file.html?search');

    expect(new URLRelation(url1, url1, opts).upTo(URLComponent.HASH)).toBe(true);
    expect(new URLRelation(url1, url2, opts).upTo(URLComponent.HASH)).toBe(false);
    expect(new URLRelation(url2, url1, opts).upTo(URLComponent.HASH)).toBe(false);

    expect(allUpTo(url1, url1, opts, URLComponent.HASH)).toBe(true);
    expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(false);
    expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(false);
  });

  it('supports ignoredComponents override', () => {
    const opts = options({ components: [URLComponent.SEARCH] }); // `ignoreComponents` is false
    const url1 = new URL('http://www.domain.com/dir/file.html?search1#hash');
    const url2 = new URL('https://www.domain.com/dir/file.html?search2#hash');

    expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(false);
    expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(false);

    // Proves that the class' option was overridden and not extended
    expect(allUpTo(url1, url2, opts, URLComponent.HASH, [URLComponent.PROTOCOL])).toBe(false);
    expect(allUpTo(url2, url1, opts, URLComponent.HASH, [URLComponent.PROTOCOL])).toBe(false);
    expect(allUpTo(url1, url2, opts, URLComponent.PATHNAME, [URLComponent.PROTOCOL])).toBe(true);
    expect(allUpTo(url2, url1, opts, URLComponent.PATHNAME, [URLComponent.PROTOCOL])).toBe(true);

    expect(
      allUpTo(url1, url2, opts, URLComponent.HASH, [URLComponent.PROTOCOL, URLComponent.SEARCH])
    ).toBe(true);

    expect(
      allUpTo(url2, url1, opts, URLComponent.HASH, [URLComponent.PROTOCOL, URLComponent.SEARCH])
    ).toBe(true);
  });

  describe('options', () => {
    it('ignoreComponents = false', () => {
      const opts = options({
        components: [URLComponent.PORT, URLComponent.PROTOCOL],
      });
      const url1 = new URL('http://www.domain.com:1234/dir/file.html?search#hash');
      const url2 = new URL('https://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(false);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(false);
    });

    it('ignoreComponents = true', () => {
      const opts = options({
        ignoreComponents: true,
        components: [URLComponent.PORT, URLComponent.PROTOCOL],
      });
      const url1 = new URL('http://www.domain.com:1234/dir/file.html?search#hash');
      const url2 = new URL('https://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);
    });

    it('ignoreComponents = function', () => {
      const opts = options({
        ignoreComponents: isHttpOrHttps,
        components: [URLComponent.PORT, URLComponent.PROTOCOL],
      });
      const url1 = new URL('http://www.domain.com:1234/dir/file.html?search#hash');
      const url2 = new URL('https://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);
    });

    it('ignoreDefaultPort = false', () => {
      const opts = options({ defaultPorts: { 'other:': 1234 } });
      const url1 = new URL('other://www.domain.com:1234/dir/file.html?search#hash');
      const url2 = new URL('other://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HOSTNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HOSTNAME)).toBe(true);
    });

    it('ignoreDefaultPort = true', () => {
      const opts = options({
        ignoreDefaultPort: true,
        defaultPorts: { 'other:': 1234 },
      });
      let url1: URL, url2: URL;

      url1 = new URL('other://www.domain.com:1234/dir/file.html?search#hash');
      url2 = new URL('other://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('other://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HOSTNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HOSTNAME)).toBe(true);
    });

    it('ignoreDefaultPort = function', () => {
      const opts = options({
        ignoreDefaultPort: isHttpOrHttps,
        defaultPorts: { 'http:': 1234, 'other:': 1234 },
      });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:1234/dir/file.html?search#hash');
      url2 = new URL('http://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('http://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HOSTNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HOSTNAME)).toBe(true);

      url1 = new URL('other://www.domain.com:1234/dir/file.html?search#hash');
      url2 = new URL('other://www.domain.com/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HOSTNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HOSTNAME)).toBe(true);
    });

    it('ignoreEmptySearchParams = false', () => {
      const opts = options();
      let url1: URL, url2: URL;

      // `URLSearchParams` handles this
      url1 = new URL('http://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var&#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var&=#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.PATHNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.PATHNAME)).toBe(true);
    });

    it('ignoreEmptySearchParams = true', () => {
      const opts = options({ ignoreEmptySearchParams: true });
      let url1: URL, url2: URL;

      // `URLSearchParams` handles this
      url1 = new URL('http://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var&#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var&=#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?var=value1&var=value2&=&=#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?=&var=value1&var=value2#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);
    });

    it('ignoreEmptySearchParams = function', () => {
      const opts = options({ ignoreEmptySearchParams: isHttpOrHttps });
      let url1: URL, url2: URL;

      // `URLSearchParams` handles this
      url1 = new URL('http://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var&#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var&=#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      // `URLSearchParams` handles this
      url1 = new URL('other://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('other://www.domain.com:123/dir/file.html?var&#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('other://www.domain.com:123/dir/file.html?var&=#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.PATHNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.PATHNAME)).toBe(true);
    });

    it('ignoreEmptySegmentNames = false', () => {
      const opts = options();
      const url1 = new URL('http://www.domain.com:123/dir//file.html?search#hash');
      const url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HOST)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HOST)).toBe(true);
    });

    it('ignoreEmptySegmentNames = true', () => {
      const opts = options({ ignoreEmptySegmentNames: true });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir//file.html?search#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir///file.html?search#hash');
      url2 = new URL('other://www.domain.com:123/dir//file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);
    });

    it('ignoreEmptySegmentNames = function', () => {
      const opts = options({ ignoreEmptySegmentNames: isHttpOrHttps });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir//file.html?search#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir//file.html?search#hash');
      url2 = new URL('other://www.domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HOST)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HOST)).toBe(true);
    });

    it('ignoreIndexFilename = false', () => {
      const opts = options({ indexFilenames: ['other.html'] });
      const url1 = new URL('http://www.domain.com:123/dir/other.html?search#hash');
      const url2 = new URL('http://www.domain.com:123/dir/?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.SEGMENTS)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.SEGMENTS)).toBe(true);
    });

    it('ignoreIndexFilename = true', () => {
      let opts = options({
        ignoreIndexFilename: true,
        indexFilenames: ['other.html'],
      });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir/other.html?search#hash');
      url2 = new URL('http://www.domain.com:123/dir/?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir/other.html?search#hash');
      url2 = new URL('other://www.domain.com:123/dir/?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      opts = options({
        ignoreIndexFilename: true,
        indexFilenames: [/^another\.[a-z]+$/],
      });
      url1 = new URL('http://www.domain.com:123/dir/another.html?search#hash');
      url2 = new URL('http://www.domain.com:123/dir/?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);
    });

    it('ignoreIndexFilename = function', () => {
      const opts = options({
        ignoreIndexFilename: isHttpOrHttps,
        indexFilenames: ['other.html'],
      });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir/other.html?search#hash');
      url2 = new URL('http://www.domain.com:123/dir/?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir/other.html?search#hash');
      url2 = new URL('other://www.domain.com:123/dir/?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.SEGMENTS)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.SEGMENTS)).toBe(true);
    });

    it('ignoreSearchParamNames = false', () => {
      const opts = options({ searchParamNames: ['var'] });
      const url1 = new URL('http://www.domain.com:123/dir/file.html?var#hash');
      const url2 = new URL('http://www.domain.com:123/dir/file.html#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.PATHNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.PATHNAME)).toBe(true);
    });

    it('ignoreSearchParamNames = true', () => {
      let opts: URLRelationOptionsWithTarget, url1: URL, url2: URL;

      opts = options({ ignoreSearchParamNames: true, searchParamNames: ['var1'] });
      url1 = new URL(
        'http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2=value#hash'
      );
      url2 = new URL('http://www.domain.com:123/dir/file.html?var2=value#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      opts = options({ ignoreSearchParamNames: true, searchParamNames: [/^var\d+$/] });
      url1 = new URL(
        'http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2=value#hash'
      );
      url2 = new URL('http://www.domain.com:123/dir/file.html#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);
    });

    it('ignoreSearchParamNames = function', () => {
      const opts = options({ ignoreSearchParamNames: isHttpOrHttps, searchParamNames: ['var'] });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir/file.html?var#hash');
      url2 = new URL('other://www.domain.com:123/dir/file.html#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.PATHNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.PATHNAME)).toBe(true);
    });

    it('ignoreSearchParamOrder = false', () => {
      const opts = options();
      const url1 = new URL('http://www.domain.com:123/dir/file.html?var2=&var1#hash');
      const url2 = new URL('http://www.domain.com:123/dir/file.html?var1=&var2#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.PATHNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.PATHNAME)).toBe(true);
    });

    it('ignoreSearchParamOrder = true', () => {
      const opts = options({ ignoreSearchParamOrder: true });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir/file.html?var2=&var1#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var1=&var2#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var2&var1=value1&var1=value2#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var2&var1=value2&var1=value1#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.PATHNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.PATHNAME)).toBe(true);
    });

    it('ignoreSearchParamOrder = function', () => {
      const opts = options({ ignoreSearchParamOrder: isHttpOrHttps });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir/file.html?var2=&var1#hash');
      url2 = new URL('http://www.domain.com:123/dir/file.html?var1=&var2#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir/file.html?var2=&var1#hash');
      url2 = new URL('other://www.domain.com:123/dir/file.html?var1=&var2#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.PATHNAME)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.PATHNAME)).toBe(true);
    });

    it('ignoreWWW = false', () => {
      const opts = options();
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('http://domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.DOMAIN)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.DOMAIN)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('http://domain.net:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.AUTH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.AUTH)).toBe(true);

      url1 = new URL('http://www.domain:123/dir/file.html?search#hash');
      url2 = new URL('http://domain:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.AUTH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.AUTH)).toBe(true);
    });

    it('ignoreWWW = true', () => {
      const opts = options({ ignoreWWW: true });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('http://domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('http://domain.net:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.AUTH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.AUTH)).toBe(true);

      url1 = new URL('http://www.domain:123/dir/file.html?search#hash');
      url2 = new URL('http://domain:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.AUTH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.AUTH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('other://domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);
    });

    it('ignoreWWW = function', () => {
      const opts = options({ ignoreWWW: isHttpOrHttps });
      let url1: URL, url2: URL;

      url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('http://domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

      url1 = new URL('http://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('http://domain.net:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.AUTH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.AUTH)).toBe(true);

      url1 = new URL('http://www.domain:123/dir/file.html?search#hash');
      url2 = new URL('http://domain:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.AUTH)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.AUTH)).toBe(true);

      url1 = new URL('other://www.domain.com:123/dir/file.html?search#hash');
      url2 = new URL('other://domain.com:123/dir/file.html?search#hash');
      expect(allUpTo(url1, url2, opts, URLComponent.DOMAIN)).toBe(true);
      expect(allUpTo(url2, url1, opts, URLComponent.DOMAIN)).toBe(true);
    });

    describe('in careful profile', () => combinations(CAREFUL_PROFILE, RelationColumn.CAREFUL));

    describe('in common profile', () => {
      combinations(COMMON_PROFILE, RelationColumn.COMMON);

      it('supports edge cases', () => {
        const opts = COMMON_PROFILE;
        let url1: URL, url2: URL;

        url1 = new URL('http://www.domain.com:123/dir/file.html?var2&var1#hash');
        url2 = new URL('http://domain.com:123/dir/file.html?var1&var2#hash');
        expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
        expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

        url1 = new URL('https://www.domain.com:123/dir/file.html?var2&var1#hash');
        url2 = new URL('https://domain.com:123/dir/file.html?var1&var2#hash');
        expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
        expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

        url1 = new URL('mailto:email@domain.com?cc=user%40domain.com&subject=hello+world');
        url2 = new URL('mailto:email@domain.com?subject=hello+world&cc=user%40domain.com');
        expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
        expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

        url1 = new URL('ws://domain.com:123/dir/file.html?var2&var1#hash');
        url2 = new URL('ws://domain.com:123/dir/file.html?var1&var2#hash');
        expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
        expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);

        url1 = new URL('wss://domain.com:123/dir/file.html?var2&var1#hash');
        url2 = new URL('wss://domain.com:123/dir/file.html?var1&var2#hash');
        expect(allUpTo(url1, url2, opts, URLComponent.HASH)).toBe(true);
        expect(allUpTo(url2, url1, opts, URLComponent.HASH)).toBe(true);
      });
    });

    describe(`in default profile`, () => combinations(undefined, RelationColumn.COMMON));
  });
});
