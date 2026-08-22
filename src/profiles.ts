import deepFreeze from 'deep-freeze-strict';
import type { URLRelationOptions } from './types.ts';

const filterCommon = (url1: URL, url2: URL) => isHttpProtocol(url1) && isHttpProtocol(url2);

const filterSafe = (url1: URL, url2: URL) =>
  url1.protocol === 'mailto:' && url2.protocol === 'mailto:';

const filterSpecCompliant = (url1: URL, url2: URL) =>
  filterSafe(url1, url2)
    ? true
    : isHttpProtocol(url1) && isHttpProtocol(url2)
      ? true
      : isWsProtocol(url1) && isWsProtocol(url2);

const isHttpProtocol = (url: URL) => url.protocol === 'http:' || url.protocol === 'https:';

const isWsProtocol = (url: URL) => url.protocol === 'ws:' || url.protocol === 'wss:';

const BASE_PROFILE = {
  components: [],
  defaultPorts: {} as NonNullable<URLRelationOptions['defaultPorts']>,
  indexFilenames: ['index.html'],
  ignoreComponents: true,
  ignoreDefaultPort: true,
  ignoreEmptySegmentNames: false,
  ignoreSearchParamNames: false,
  searchParamNames: [],
} as const satisfies URLRelationOptions;

/**
 * An options profile.
 * Useful for a URL to an unknown or third-party server that could be incorrectly configured
 * according to specifications and common best practices.
 */
export const CAREFUL_PROFILE = deepFreeze({
  ...BASE_PROFILE,
  ignoreEmptySearchParams: false,
  ignoreIndexFilename: false,
  ignoreSearchParamOrder: false,
  ignoreWWW: false,
} as const satisfies URLRelationOptions);

/**
 * The default options profile.
 * Useful for a URL to a known server that you trust and expect to be correctly configured
 * according to specifications and common best practices.
 */
export const COMMON_PROFILE = deepFreeze({
  ...BASE_PROFILE,
  ignoreEmptySearchParams: filterSpecCompliant,
  ignoreIndexFilename: filterCommon,
  ignoreSearchParamOrder: filterSpecCompliant,
  ignoreWWW: filterCommon,
} as const satisfies URLRelationOptions);
