# url-relation [![NPM Version][npm-image]][npm-url] ![Build Status][ghactions-image] [![Coverage Status][codecov-image]][codecov-url]

> Determine the relation between two [`URL`](https://mdn.io/URL)s.

```
               AUTH                  HOST                       PATH
              __|__                ___|___                 ______|______
             /     \              /       \               /             \
        USERNAME PASSWORD     HOSTNAME    PORT        PATHNAME        SEARCH  HASH
         ___|__   __|___   ______|______   |   __________|_________   ___|___   |
        /      \ /      \ /             \ / \ /                    \ /       \ / \
  foo://username:password@www.example.com:123/hello/world/there.html?var=value#foo
  \_/                     \_/ \_____/ \_/     \_________/ \________/
   |                       |     |     |           |           |
PROTOCOL               SUBDOMAIN |    TLD       SEGMENTS   FILENAME
                                 |
                              DOMAIN
```

The components of URLs are compared in the following order:

1. `PROTOCOL`
1. `USERNAME`
1. `PASSWORD`
1. `AUTH`
1. `TLD`
1. `DOMAIN`
1. `SUBDOMAIN`
1. `HOSTNAME`
1. `PORT`
1. `HOST`
1. `SEGMENTS`
1. `FILENAME`
1. `PATHNAME`
1. `SEARCH`
1. `PATH`
1. `HASH`

As you may have noticed, there are a few **breaks in linearity**:

- `TLD` is prioritized _before_ `DOMAIN` because matching a domain on a different top-level domain is very uncommon (but still possible via the `ignoreComponents` option).
- `SUBDOMAIN` is prioritized _after_ `DOMAIN`.

Other considerations:

- URLs with [invalid domain names](https://tools.ietf.org/html/rfc1034), [reserved domains](https://npmjs.com/parse-domain#-reserved-domains), [unlisted TLDs](https://publicsuffix.org/) or IP addresses that have been determined to have related `HOSTNAME` components will also have related `TLD`, `DOMAIN` and `SUBDOMAIN` components due to the above mentioned comparison order _only_; not because they actually _have_ those components.

## Install

```shell
npm install url-relation
```

## Consumer Usage

### `URLRelation.match(url1, url2[, options])`

For a single match between two URLs.

```ts
import URLRelation, { URLComponent, type URLRelationOptionsWithTarget } from 'url-relation';

const url1 = new URL('http://domain.com/');
const url2 = new URL('http://domain.com/#hash');

const options: URLRelationOptionsWithTarget = {
  components: [URLComponent.HASH], // Ignored components
  //ignoreComponents: true,
  //targetComponent: URLComponent.HASH,
};

URLRelation.match(url1, url2, options); //-> true
```

### `URLRelation::upTo(component[, ignoredComponents])`

For multiple matches between the same two URLs.

```ts
import URLRelation, { URLComponent /*, type URLRelationOptions*/ } from 'url-relation';

const url1 = new URL('http://domain.com/');
const url2 = new URL('http://domain.com/#hash');

const relation = new URLRelation(url1, url2 /*, options*/);

relation.upTo(URLComponent.HASH, [URLComponent.HASH]); //-> true
relation.upTo(URLComponent.PATH); //-> true
```

### Option Profiles

`CAREFUL_PROFILE` is useful for a URL to an unknown or third-party server that could be incorrectly configured according to specifications and common best practices.

`COMMON_PROFILE`, **the default profile**, is useful for a URL to a known server that you trust and expect to be correctly configured according to specifications and common best practices.

An example of checking for a trusted hostname:

```ts
import { CAREFUL_PROFILE, COMMON_PROFILE } from 'url-relation';

const dynamicProfile = (url1: URL, url2: URL) => {
  const trustedHostnames = ['domain.com'];

  return [url1, url2].every(url =>
    trustedHostnames.some(
      hostname => url.hostname === hostname || url.hostname.endsWith(`.${hostname}`)
    )
  )
    ? COMMON_PROFILE
    : CAREFUL_PROFILE;
};

const url1 = new URL('http://domain.com/');
const url2 = new URL('http://domain.com/#hash');
const profile = dynamicProfile(url1, url2); //-> COMMON_PROFILE
```

## Development Usage

### Production Build

```shell
npm run build
```

### Testing

The test suite can perform a _single run_:

```shell
npm test
```

… or indefinitely as files are changed:

```shell
npm run test:watch
```

[npm-image]: https://img.shields.io/npm/v/url-relation
[npm-url]: https://npmjs.org/url-relation
[ghactions-image]: https://img.shields.io/github/actions/workflow/status/stevenvachon/url-relation/test.yml
[codecov-image]: https://img.shields.io/codecov/c/github/stevenvachon/url-relation/next
[codecov-url]: https://app.codecov.io/github/stevenvachon/url-relation/tree/next
