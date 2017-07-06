# url-relation [![NPM Version][npm-image]][npm-url] ![File Size][filesize-image] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Monitor][greenkeeper-image]][greenkeeper-url]

> Determine the relation between two URLs.


## Installation

[Node.js](http://nodejs.org/) `>= 6` is required. To install, type this at the command line:
```shell
npm install url-relation
```


## Usage

* Inputs *must* be [`URL`](https://developer.mozilla.org/en/docs/Web/API/URL) instances.
* The result will be a number that correponds to a [relation constant](#relation-constants).

```js
const urlRelation = require('url-relation');

const url1 = new URL('http://domain.com/');
const url2 = new URL('http://domain.com/#hash');

const relation = urlRelation(url1, url2, options);
//-> 14

if (relation >= urlRelation.HOST) {
  // same host
}
```

## Options

It is simplest to use an [option profile](#option-profiles), but custom configurations are still possible.

### `defaultPorts`
Type: `Object`  
Default value: `{}`  
A map of protocol default ports for [`ignoreDefaultPort`](#ignoredefaultport). Be sure to include the suffixed ":" in the key. [Common protocols](https://url.spec.whatwg.org/#special-scheme) already have their ports removed.

### `directoryIndexes`
Type: `Array<RegExp|string>`  
Default value: `['index.html']`  
A list of file names for [`ignoreDirectoryIndex`](#ignoredirectoryindex).

### `ignoreDefaultPort`
Type: `Boolean` or `Function`  
Default value: `true`  
When set to `true` or a function that returns `true`, a URL's port that matches any found in [`defaultPorts`](#defaultports) will be ignored during comparison.

### `ignoreDirectoryIndex`
Type: `Boolean` or `Function`  
Default value: [`Function`](https://github.com/stevenvachon/url-relation/blob/master/index.js#L34)  
When set to `true` or a function that returns `true`, a URL's file name that matches any found in [`directoryIndexes`](#directoryindexes) will be ignored during comparison.

### `ignoreEmptyDirectoryNames`
Type: `Boolean` or `Function`  
Default value: `false`  
When set to `true` or a function that returns `true`, empty directory names within a URL's path (such as the "//" in "/path//to/") will be ignored during comparison.

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

### `ignoreWWW`
Type: `Boolean` or `Function`  
Default value: [`Function`](https://github.com/stevenvachon/url-relation/blob/master/index.js#L34)  
When set to `true` or a function that returns `true`, a URL's "www" subdomain will be ignored during comparison.

### `queryNames`
Type: `Array<RegExp|string>`  
Default value: `[]`  
A list of query parameters for [`ignoreQueryNames`](#ignorequerynames).


### Function as an Option

When an option is defined as a `Function`, it must return `true` to be included in the custom filter:
```js
const options = {
  ignoreDirectoryIndex: (url1, url2) => {
    // Only URLs with these protocols will have their directory indexes ignored
    return url1.protocol === 'http:' && url1.protocol === 'https:';
  }
};
```


### Option Profiles

`CAREFUL_PROFILE` is useful for a URL to an unknown or third-party server that could be incorrectly configured according to specifications and common best practices.

`COMMON_PROFILE`, the default profile, is useful for a URL to a known server that you trust and expect to be correctly configured according to specifications and common best practices.

An example of checking for a trusted hostname:
```js
const url1 = new URL('http://domain.com/');
const url2 = new URL('http://domain.com/#hash');

const trustedHosts = ['domain.com'];

const isTrusted = trustedHosts
  .reduce((results, trustedHost) => {
    results[0] = results[0] || url1.hostname.endsWith(trustedHost);
    results[1] = results[1] || url2.hostname.endsWith(trustedHost);
    return results;
  }, [false,false])
  .every(result => result);

const options = urlRelation[`${isTrusted ? 'COMMON' : 'CAREFUL'}_PROFILE`];

urlRelation(url1, url2, options);
```


#### Customizing Profiles

```js
const custom = {
  ...urlRelation.CAREFUL_PROFILE,
  ignoreTrailingSlash: true
};
```
Or:
```js
const extend = require('extend');

const custom = extend(true, {}, urlRelation.COMMON_PROFILE, { directoryIndexes:['index.php'] });
```


## Relation Constants

In sequential order, returned values can be compared with: `NONE`, `PROTOCOL`, `TLD`, `DOMAIN`, `SUBDOMAIN`, `HOSTNAME`, `PORT`, `HOST`, `USERNAME`, `PASSWORD`, `AUTH`, `DIRECTORY`, `FILENAME`, `PATHNAME`, `SEARCH`, `PATH`, `HASH`, `ALL`.

```
               AUTH                  HOST                        PATH
              __|__                ___|___                 _______|______
             /     \              /       \               /              \
        USERNAME PASSWORD     HOSTNAME    PORT        PATHNAME        SEARCH  HASH
         ___|__   __|___   ______|______   |   __________|_________   ___|___   |
        /      \ /      \ /             \ / \ /                    \ /       \ / \
  foo://username:password@www.example.com:123/hello/world/there.html?var=value#foo
  \_/                     \_/ \_____/ \_/     \_________/ \________/
   |                       |     |     |           |           |
PROTOCOL               SUBDOMAIN |    TLD      DIRECTORY   FILENAME
                                 |
                              DOMAIN
```

**Note:** there are a few breaks in the linearity of these values:

* `AUTH` is prioritized *after* `HOST` because matching authentication on a different host is pointless.
* `TLD` is prioritized *before* `DOMAIN` because matching a domain on a different top-level domain is pointless.
* `SUBDOMAIN` is prioritized *after* `DOMAIN`.


## Browserify/etc

Due to extreme file size in correctly parsing domains, browser builds will not include such functionality by default. As a result, output of this library within a web browser will never exactly equal `TLD`, `DOMAIN` nor `SUBDOMAIN`.


[npm-image]: https://img.shields.io/npm/v/url-relation.svg
[npm-url]: https://npmjs.org/package/url-relation
[filesize-image]: https://img.shields.io/badge/size-2.4kB%20gzipped-blue.svg
[travis-image]: https://img.shields.io/travis/stevenvachon/url-relation.svg
[travis-url]: https://travis-ci.org/stevenvachon/url-relation
[coveralls-image]: https://img.shields.io/coveralls/stevenvachon/url-relation.svg
[coveralls-url]: https://coveralls.io/github/stevenvachon/url-relation
[greenkeeper-image]: https://badges.greenkeeper.io/stevenvachon/url-relation.svg
[greenkeeper-url]: https://greenkeeper.io/
