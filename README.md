# url-relation [![NPM Version][npm-image]][npm-url] ![File Size][filesize-image] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Monitor][greenkeeper-image]][greenkeeper-url]

> Determine the relation between two [`URL`](https://mdn.io/URL)s.


## Installation

[Node.js](https://nodejs.org) `>= 14` is required. To install, type this at the command line:
```shell
npm install url-relation
```


## Usage

### `URLRelation.match(url1, url2[, options])`
```js
const URLRelation = require('url-relation');

const url1 = new URL('http://domain.com/');
const url2 = new URL('http://domain.com/#hash');

const options = {
  components: [URLRelation.HASH],
  ignoreComponents: true
};

if (URLRelation.match(url1, url2, options)) {
  // considered the same
}
```

### `URLRelation::upTo(component[, ignoredComponents])`
`component` is the same as [`targetComponent`](#targetcomponent).

`ignoredComponents` is the same as [`components`](#components). However, if it's value is a non-empty array, it will also set [`ignoreComponents`](#ignorecomponents) to `true`.

```js
const URLRelation = require('url-relation');

const url1 = new URL('http://domain.com/');
const url2 = new URL('http://domain.com/#hash');

const relation = new URLRelation(url1, url2, options);

if (relation.upTo(URLRelation.HASH, [URLRelation.HASH])) {
  // considered the same
}

if (relation.upTo(URLRelation.PATH)) {
  // considered the same
}
```


## Options

It is simplest to use an [option profile](#option-profiles), but custom configurations are still possible.

### `components`
Type: `Array<Symbol>`  
Default value: `[]`  
A list of URL components for [`ignoreComponents`](#ignorecomponents). See [URL Components](#urlcomponents) for possible values.

### `defaultPorts`
Type: `Object`  
Default value: `{}`  
A map of protocol default ports for [`ignoreDefaultPort`](#ignoredefaultport). Be sure to include the suffixed ":" in the key. [Common protocols](https://url.spec.whatwg.org/#special-scheme) already have their ports removed.

### `ignoreComponents`
Type: `Boolean` or `Function`  
Default value: `true`  
When set to `true` or a function that returns `true`, a URL's components specified in [`components`](#components) will be ignored during comparison.

### `ignoreDefaultPort`
Type: `Boolean` or `Function`  
Default value: `true`  
When set to `true` or a function that returns `true`, a URL's port that matches any found in [`defaultPorts`](#defaultports) will be ignored during comparison.

### `ignoreIndexFilename`
Type: `Boolean` or `Function`  
Default value: [`Function`](https://github.com/stevenvachon/url-relation/blob/master/index.js#L34)  
When set to `true` or a function that returns `true`, a URL's file name that matches any found in [`indexFilenames`](#indexFilenames) will be ignored during comparison.

### `ignoreEmptyQueries`
Type: `Boolean` or `Function`  
Default value: [`Function`](https://github.com/stevenvachon/url-relation/blob/master/index.js#L40-L46)  
When set to `true` or a function that returns `true`, a URL's empty query parameters (such as "?=") will be ignored during comparison. **This option will be silently skipped** if the input `URL`s do not support `URLSearchParams`.

### `ignoreQueryNames`
Type: `Boolean` or `Function`  
Default value: `false`  
When set to `true` or a function that returns `true`, a URL's query parameters matching [`queryNames`](#querynames) will be ignored during comparison. **This option will be silently skipped** if the input `URL`s do not support `URLSearchParams`.

### `ignoreQueryOrder`
Type: `Boolean` or `Function`  
Default value: [`Function`](https://github.com/stevenvachon/url-relation/blob/master/index.js#L40-46)  
When set to `true` or a function that returns `true`, the order of *unique* query parameters will not distinguish one URL from another. **This option will be silently skipped** if the input `URL`s do not support `URLSearchParams`.

### `ignoreEmptySegmentNames`
Type: `Boolean` or `Function`  
Default value: `false`  
When set to `true` or a function that returns `true`, empty segment names within a URL's path (such as the "//" in "/path//to/") will be ignored during comparison.

### `ignoreWWW`
Type: `Boolean` or `Function`  
Default value: [`Function`](https://github.com/stevenvachon/url-relation/blob/master/index.js#L34)  
When set to `true` or a function that returns `true`, a URL's "www" subdomain will be ignored during comparison.

### `indexFilenames`
Type: `Array<RegExp|string>`  
Default value: `['index.html']`  
A list of file names for [`ignoreIndexFilename`](#ignoreindexfilename).

### `queryNames`
Type: `Array<RegExp|string>`  
Default value: `[]`  
A list of query parameters for [`ignoreQueryNames`](#ignorequerynames).

### `targetComponent`
Type: `Symbol`  
Default value: `URLRelation.HASH`  
The URL component at which to limit—and include in—the relation from left to right. See [URL Components](#urlcomponents) for more info and for possible values.


### Function as an Option

When an option is defined as a `Function`, it must return `true` to be included in the custom filter:
```js
const options = {
  ignoreIndexFilename: (url1, url2) => {
    // Only URLs with these protocols will have their index filename ignored
    return url1.protocol === 'http:' && url1.protocol === 'https:';
  }
};
```


### Option Profiles

`CAREFUL_PROFILE` is useful for a URL to an unknown or third-party server that could be incorrectly configured according to specifications and common best practices.

`COMMON_PROFILE`, the default profile, is useful for a URL to a known server that you trust and expect to be correctly configured according to specifications and common best practices.

An example of checking for a trusted hostname:
```js
const dynamicProfile = (url1, url2) => {
  const trustedHostnames = ['domain.com'];

  const isTrusted = trustedHostnames
    .reduce((results, trustedHostname) => {
      results[0] = results[0] || url1.hostname.endsWith(trustedHostname);
      results[1] = results[1] || url2.hostname.endsWith(trustedHostname);
      return results;
    }, [false,false])
    .every(result => result);

  return URLRelation[`${isTrusted ? 'COMMON' : 'CAREFUL'}_PROFILE`];
};

const url1 = new URL('http://domain.com/');
const url2 = new URL('http://domain.com/#hash');
const profile = dynamicProfile(url1, url2);
```


#### Customizing Profiles

```js
const custom = {
  ...URLRelation.COMMON_PROFILE,
  indexFilenames: ['index.html', 'index.php']
};
```
Or:
```js
const extend = require('extend');

const custom = extend(true, {}, URLRelation.COMMON_PROFILE, { indexFilenames:['index.php'] });
```


## URL Components

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
* `PROTOCOL`
* `USERNAME`
* `PASSWORD`
* `AUTH`
* `TLD`
* `DOMAIN`
* `SUBDOMAIN`
* `HOSTNAME`
* `PORT`
* `HOST`
* `SEGMENTS`
* `FILENAME`
* `PATHNAME`
* `SEARCH`
* `PATH`
* `HASH`

As you may have noticed, there are a few **breaks in linearity**:

* `TLD` is prioritized *before* `DOMAIN` because matching a domain on a different top-level domain is very uncommon (but still possible via [`ignoreComponents`](#ignorecomponents)).
* `SUBDOMAIN` is prioritized *after* `DOMAIN`.

Other considerations:

* URLs with [invalid domain names](https://tools.ietf.org/html/rfc1034), [reserved domains](https://npmjs.com/parse-domain#-reserved-domains), [unlisted TLDs](https://publicsuffix.org/) or IP addresses that have been determined to have related `HOSTNAME` components will also have related `TLD`, `DOMAIN` and `SUBDOMAIN` components due to the above mentioned comparison order *only*; not because they actually *have* those components.


[npm-image]: https://img.shields.io/npm/v/url-relation.svg
[npm-url]: https://npmjs.org/package/url-relation
[filesize-image]: https://img.shields.io/badge/bundle-53kB%20gzipped-blue.svg
[travis-image]: https://img.shields.io/travis/stevenvachon/url-relation.svg
[travis-url]: https://travis-ci.org/stevenvachon/url-relation
[coveralls-image]: https://img.shields.io/coveralls/stevenvachon/url-relation.svg
[coveralls-url]: https://coveralls.io/github/stevenvachon/url-relation
[greenkeeper-image]: https://badges.greenkeeper.io/stevenvachon/url-relation.svg
[greenkeeper-url]: https://greenkeeper.io/
