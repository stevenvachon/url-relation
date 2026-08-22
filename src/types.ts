import type { URLComponent } from './components.ts';

export type URLComponentValue = (typeof URLComponent)[keyof typeof URLComponent];

export interface URLRelationOptions {
  /**
   * A list of URL components for `ignoreComponents`.
   * @default []
   */
  components?: readonly URLComponentValue[];
  /**
   * A map of protocol default ports for `ignoreDefaultPort`. Be sure to include the suffixed ":" in the key.
   * [Common protocols](https://url.spec.whatwg.org/#special-scheme) already have their ports removed.
   * @default {}
   * @example { 'protocol:': 123 }
   */
  defaultPorts?: Record<string, number>;
  /**
   * When `true` or a function that returns `true`, a URL's components specified in `URLRelationOptions.components` will be ignored during comparison.
   * @default true
   * @example
   * const options = {
   *   ignoreComponents: (url1, url2) => {
   *     // Only URLs with these protocols will have components in `URLRelationOptions.components` ignored
   *     return url1.protocol === 'protocol:' && url2.protocol === 'protocol:';
   *   },
   * };
   */
  ignoreComponents?: boolean | ((url1: URL, url2: URL) => boolean);
  /**
   * When `true` or a function that returns `true`, a URL's port that matches any found in `URLRelationOptions.defaultPorts` will be ignored during comparison.
   * @default true
   * @example
   * const options = {
   *   ignoreDefaultPort: (url1, url2) => {
   *     // Only URLs with these protocols will have their default port ignored
   *     return url1.protocol === 'protocol:' && url2.protocol === 'protocol:';
   *   },
   * };
   */
  ignoreDefaultPort?: boolean | ((url1: URL, url2: URL) => boolean);
  /**
   * When `true` or a function that returns `true`, a URL's empty search parameters (such as "?=") will be ignored during comparison.
   * @default () => boolean
   * @example
   * const options = {
   *   ignoreEmptySearchParams: (url1, url2) => {
   *     // Only URLs with these protocols will have their empty search parameters ignored
   *     return url1.protocol === 'protocol:' && url2.protocol === 'protocol:';
   *   },
   * };
   */
  ignoreEmptySearchParams?: boolean | ((url1: URL, url2: URL) => boolean);
  /**
   * When `true` or a function that returns `true`, empty segment names within a URL's path (such as the "//" in "/path//to/") will be ignored during comparison.
   * @default false
   * @example
   * const options = {
   *   ignoreEmptySegmentNames: (url1, url2) => {
   *     // Only URLs with these protocols will have their empty segment names ignored
   *     return url1.protocol === 'protocol:' && url2.protocol === 'protocol:';
   *   },
   * };
   */
  ignoreEmptySegmentNames?: boolean | ((url1: URL, url2: URL) => boolean);
  /**
   * When `true` or a function that returns `true`, a URL's file name that matches any found in `URLRelationOptions.indexFilenames` will be ignored during comparison.
   * @default () => boolean
   * @example
   * const options = {
   *   ignoreIndexFilename: (url1, url2) => {
   *     // Only URLs with these protocols will have their index filename ignored
   *     return url1.protocol === 'protocol:' && url2.protocol === 'protocol:';
   *   },
   * };
   */
  ignoreIndexFilename?: boolean | ((url1: URL, url2: URL) => boolean);
  /**
   * When `true` or a function that returns `true`, a URL's search parameters matching `URLRelationOptions.searchParamNames` will be ignored during comparison.
   * @default false
   * @example
   * const options = {
   *   ignoreSearchParamNames: (url1, url2) => {
   *     // Only URLs with these protocols will have their search parameter names ignored
   *     return url1.protocol === 'protocol:' && url2.protocol === 'protocol:';
   *   },
   * };
   */
  ignoreSearchParamNames?: boolean | ((url1: URL, url2: URL) => boolean);
  /**
   * When `true` or a function that returns `true`, the order of _unique_ search parameters will not distinguish one URL from another.
   * @default () => boolean
   * @example
   * const options = {
   *   ignoreSearchParamOrder: (url1, url2) => {
   *     // Only URLs with these protocols will have their search parameter order ignored
   *     return url1.protocol === 'protocol:' && url2.protocol === 'protocol:';
   *   },
   * };
   */
  ignoreSearchParamOrder?: boolean | ((url1: URL, url2: URL) => boolean);
  /**
   * When `true` or a function that returns `true`, a URL's "www" subdomain will be ignored during comparison.
   * @default () => boolean
   * @example
   * const options = {
   *   ignoreWWW: (url1, url2) => {
   *     // Only URLs with these protocols will have their "www" subdomain ignored
   *     return url1.protocol === 'protocol:' && url2.protocol === 'protocol:';
   *   },
   * };
   */
  ignoreWWW?: boolean | ((url1: URL, url2: URL) => boolean);
  /**
   * A list of file names for `URLRelationOptions.ignoreIndexFilename`.
   * @default ['index.html']
   */
  indexFilenames?: readonly (string | RegExp)[];
  /**
   * A list of search parameter names for `URLRelationOptions.ignoreSearchParamNames`.
   * @default []
   */
  searchParamNames?: readonly (string | RegExp)[];
}

export interface URLRelationOptionsWithTarget extends URLRelationOptions {
  /**
   * The URL component at which to (inclusively) limit in the relation from left to right.
   * @default URLComponent.HASH
   */
  targetComponent?: URLComponentValue;
}
