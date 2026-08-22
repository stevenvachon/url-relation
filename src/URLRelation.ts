import anyMatch from 'any-match';
import { COMMON_PROFILE } from './profiles.ts';
import createSequence from './createSequence.ts';
import evaluateValue, { type EvaluateValueArgs } from 'evaluate-value';
import isURL from 'isurl';
import { parseDomain, type ParseResultListed, ParseResultType } from 'parse-domain';
import { URL_COMPONENT_SEQUENCE, URLComponent } from './components.ts';
import type {
  URLComponentValue,
  URLRelationOptions,
  URLRelationOptionsWithTarget,
} from './types.ts';

const MULTIPLE_SLASHES = /\/{2,}/g;

/**
 * Determine the relation between the user info of two URLs.
 */
const authRelation = (url1: Readonly<URL>, url2: Readonly<URL>) => {
  const password = url1.password === url2.password;
  const username = url1.username === url2.username;
  return {
    [URLComponent.AUTH]: password && username,
    [URLComponent.PASSWORD]: password,
    [URLComponent.USERNAME]: username,
  };
};

/**
 * Fallback to the default value for a specific option if there's no custom value.
 * If a custom option is a function that returns `undefined` or `null`, the fallback value will be used.
 */
const defaultFallback = <K extends keyof typeof COMMON_PROFILE>(
  options: Readonly<URLRelationOptions> | undefined,
  name: K,
  ...args: EvaluateValueArgs<Readonly<URLRelationOptions>[K]>
) => evaluateValue(options?.[name], ...args) ?? evaluateValue(COMMON_PROFILE[name], ...args);

/**
 * The ICANN subdomains of a listed hostname, optionally without a leading "www".
 */
const getICANNSubdomains = (parsedDomain: ParseResultListed, omitWWW: boolean) =>
  omitWWW && parsedDomain.icann.subDomains[0] === 'www'
    ? parsedDomain.icann.subDomains.slice(1)
    : parsedDomain.icann.subDomains;

/**
 * Determine the relation between the hostnames of two URLs.
 */
const hostnameRelation = (
  url1: Readonly<URL>,
  url2: Readonly<URL>,
  options?: Readonly<URLRelationOptions>
) => {
  if (url1.hostname === url2.hostname) {
    return {
      [URLComponent.DOMAIN]: true,
      [URLComponent.HOSTNAME]: true,
      [URLComponent.SUBDOMAIN]: true,
      [URLComponent.TLD]: true,
    };
  }

  const hostname1 = parseDomain(url1.hostname);
  const hostname2 = parseDomain(url2.hostname);

  if (hostname1.type !== ParseResultType.Listed || hostname2.type !== ParseResultType.Listed) {
    return {
      [URLComponent.DOMAIN]: false,
      [URLComponent.HOSTNAME]: false,
      [URLComponent.SUBDOMAIN]: false,
      [URLComponent.TLD]: false,
    };
  }

  const ignoreWWW = defaultFallback(options, 'ignoreWWW', url1, url2);

  // Avoid effective/private TLDs by using the ICANN result

  const domain = hostname1.icann.domain === hostname2.icann.domain;

  const subdomain =
    getICANNSubdomains(hostname1, ignoreWWW).join('.') ===
    getICANNSubdomains(hostname2, ignoreWWW).join('.');

  const tld =
    hostname1.icann.topLevelDomains.join('.') === hostname2.icann.topLevelDomains.join('.');

  return {
    [URLComponent.DOMAIN]: domain,
    [URLComponent.HOSTNAME]: domain && subdomain && tld,
    [URLComponent.SUBDOMAIN]: subdomain,
    [URLComponent.TLD]: tld,
  };
};

const notEmptyParam = ([name, value]: readonly [string, string]) => name !== '' || value !== '';

/**
 * Determine the relation between the pathnames of two URLs.
 */
const pathnameRelation = (
  url1: Readonly<URL>,
  url2: Readonly<URL>,
  options?: Readonly<URLRelationOptions>
) => {
  let pathname1 = url1.pathname;
  let pathname2 = url2.pathname;

  if (pathname1 === pathname2) {
    return {
      [URLComponent.FILENAME]: true,
      [URLComponent.PATHNAME]: true,
      [URLComponent.SEGMENTS]: true,
    };
  }

  if (defaultFallback(options, 'ignoreEmptySegmentNames', url1, url2)) {
    pathname1 = pathname1.replace(MULTIPLE_SLASHES, '/');
    pathname2 = pathname2.replace(MULTIPLE_SLASHES, '/');
  }

  const splitPathname1 = pathname1.split('/');
  const splitPathname2 = pathname2.split('/');

  const filename1 = splitPathname1.pop() as string;
  const filename2 = splitPathname2.pop() as string;
  let filename = false;

  if (defaultFallback(options, 'ignoreIndexFilename', url1, url2)) {
    const indexFilenames = defaultFallback(options, 'indexFilenames');

    // If one ends in a trailing slash and one ends in an index file
    filename =
      (filename1 === '' && anyMatch(filename2, indexFilenames)) ||
      (filename2 === '' && anyMatch(filename1, indexFilenames));
  } else {
    filename = filename1 === filename2;
  }

  if (splitPathname1.length !== splitPathname2.length) {
    return {
      [URLComponent.FILENAME]: filename,
      [URLComponent.PATHNAME]: false,
      [URLComponent.SEGMENTS]: false,
    };
  }

  const segments = splitPathname1.every((pathname, i) => pathname === splitPathname2[i]);

  return {
    [URLComponent.FILENAME]: filename,
    [URLComponent.PATHNAME]: segments && filename,
    [URLComponent.SEGMENTS]: segments,
  };
};

/**
 * Determine the relation between the ports of two URLs.
 */
const portRelation = (
  url1: Readonly<URL>,
  url2: Readonly<URL>,
  options?: Readonly<URLRelationOptions>
) => {
  if (url1.port === url2.port) {
    return { [URLComponent.PORT]: true };
  }

  if (defaultFallback(options, 'ignoreDefaultPort', url1, url2)) {
    const defaultPorts = defaultFallback(options, 'defaultPorts');

    return {
      [URLComponent.PORT]:
        // If one has no port and one has a default port
        (url1.port === '' && defaultPorts[url2.protocol] === parseInt(url2.port, 10)) ||
        (url2.port === '' && defaultPorts[url1.protocol] === parseInt(url1.port, 10)),
    };
  }

  return { [URLComponent.PORT]: false };
};

/**
 * Determine the relation between the search parameters of two URLs.
 */
const searchRelation = (
  url1: Readonly<URL>,
  url2: Readonly<URL>,
  options?: Readonly<URLRelationOptions>
) => {
  let params1 = [...url1.searchParams];
  let params2 = [...url2.searchParams];

  if (defaultFallback(options, 'ignoreEmptySearchParams', url1, url2)) {
    params1 = params1.filter(notEmptyParam);
    params2 = params2.filter(notEmptyParam);
  }

  if (defaultFallback(options, 'ignoreSearchParamNames', url1, url2)) {
    const searchParamNames = defaultFallback(options, 'searchParamNames');
    const notIgnoredName = ([name]: [string, string]) => !anyMatch(name, searchParamNames);

    params1 = params1.filter(notIgnoredName);
    params2 = params2.filter(notIgnoredName);
  }

  if (params1.length !== params2.length) {
    return { [URLComponent.SEARCH]: false };
  }

  if (defaultFallback(options, 'ignoreSearchParamOrder', url1, url2)) {
    params1 = params1.sort(sortByMatchingParamName);
    params2 = params2.sort(sortByMatchingParamName);
  }

  return {
    [URLComponent.SEARCH]: params1.every(
      (param1, i) =>
        param1[0] === params2[i][0] && // Matching key
        param1[1] === params2[i][1] // Matching value
    ),
  };
};

const sortByMatchingParamName = ([a]: readonly [string, string], [b]: readonly [string, string]) =>
  a < b ? -1 : a > b ? 1 : 0;

/**
 * Determine the relation between two [`URL`](https://mdn.io/URL)s.
 */
export default class URLRelation {
  #options?: Readonly<URLRelationOptions>;
  #relations: Readonly<Record<URLComponentValue, boolean>>;
  #url1: Readonly<URL>;
  #url2: Readonly<URL>;

  /**
   * @throws {TypeError} When `url1` or `url2` are not `URL`s.
   */
  constructor(url1: Readonly<URL>, url2: Readonly<URL>, options?: Readonly<URLRelationOptions>) {
    if (!isURL(url1) || !isURL(url2)) {
      throw new TypeError('Invalid URL');
    }

    this.#options = options;
    this.#url1 = url1;
    this.#url2 = url2;

    const relations = {
      [URLComponent.HASH]: url1.hash === url2.hash,
      [URLComponent.PROTOCOL]: url1.protocol === url2.protocol,
      ...authRelation(url1, url2),
      ...hostnameRelation(url1, url2, options),
      ...pathnameRelation(url1, url2, options),
      ...portRelation(url1, url2, options),
      ...searchRelation(url1, url2, options),
    };

    this.#relations = Object.freeze({
      ...relations,
      [URLComponent.HOST]: relations[URLComponent.HOSTNAME] && relations[URLComponent.PORT],
      [URLComponent.PATH]: relations[URLComponent.PATHNAME] && relations[URLComponent.SEARCH],
    });
  }

  /**
   * Determine whether two [`URL`](https://mdn.io/URL)s match through to `options.targetComponent`.
   * @throws {TypeError} When `options.targetComponent` is not valid.
   */
  static match(
    url1: Readonly<URL>,
    url2: Readonly<URL>,
    { targetComponent = URLComponent.HASH, ...options }: Readonly<URLRelationOptionsWithTarget> = {}
  ) {
    return new URLRelation(url1, url2, options).#run(targetComponent);
  }

  /**
   * Whether the two URLs match at each component.
   */
  get relations() {
    return this.#relations;
  }

  #run(targetComponent: URLComponentValue, components?: readonly URLComponentValue[]) {
    if (targetComponent === undefined || !URL_COMPONENT_SEQUENCE.includes(targetComponent)) {
      throw new TypeError('Invalid URL component');
    }

    if (
      components === undefined &&
      defaultFallback(this.#options, 'ignoreComponents', this.#url1, this.#url2)
    ) {
      components = defaultFallback(this.#options, 'components');
    }

    return createSequence(components ?? [], targetComponent).every(
      component => this.#relations[component]
    );
  }

  /**
   * Determine whether the two [`URL`](https://mdn.io/URL)s match through to `component`.
   * @param targetComponent The URL component at which to (inclusively) limit in the relation from left to right.
   * @param ignoredComponents Optional override for `options.components`. When provided, `options.ignoreComponents` is not used.
   * @throws {TypeError} When `targetComponent` is not defined or valid.
   */
  upTo(targetComponent: URLComponentValue, ignoredComponents?: readonly URLComponentValue[]) {
    return this.#run(targetComponent, ignoredComponents);
  }
}
