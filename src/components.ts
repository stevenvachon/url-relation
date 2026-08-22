// Unique-symbol identity is only preserved across files if these bindings are exported;
// otherwise, `URLComponent.HOST` widens to `symbol` and is not assignable to `URLComponentValue`
export const AUTH = Symbol('auth');
export const DOMAIN = Symbol('domain');
export const FILENAME = Symbol('filename');
export const HASH = Symbol('hash');
export const HOST = Symbol('host');
export const HOSTNAME = Symbol('hostname');
export const PASSWORD = Symbol('password');
export const PATH = Symbol('path');
export const PATHNAME = Symbol('pathname');
export const PORT = Symbol('port');
export const PROTOCOL = Symbol('protocol');
export const SEARCH = Symbol('search');
export const SEGMENTS = Symbol('segments');
export const SUBDOMAIN = Symbol('subdomain');
export const TLD = Symbol('tld');
export const USERNAME = Symbol('username');

/**
 * ```text
 *                AUTH                  HOST                       PATH
 *               __|__                ___|___                 ______|______
 *              /     \              /       \               /             \
 *         USERNAME PASSWORD     HOSTNAME    PORT        PATHNAME        SEARCH  HASH
 *          ___|__   __|___   ______|______   |   __________|_________   ___|___   |
 *         /      \ /      \ /             \ / \ /                    \ /       \ / \
 *   foo://username:password@www.example.com:123/hello/world/there.html?var=value#foo
 *   \_/                     \_/ \_____/ \_/     \_________/ \________/
 *    |                       |     |     |           |           |
 * PROTOCOL               SUBDOMAIN |    TLD       SEGMENTS   FILENAME
 *                                  |
 *                               DOMAIN
 * ```
 */
export const URLComponent = Object.freeze({
  AUTH,
  DOMAIN,
  FILENAME,
  HASH,
  HOST,
  HOSTNAME,
  PASSWORD,
  PATH,
  PATHNAME,
  PORT,
  PROTOCOL,
  SEARCH,
  SEGMENTS,
  SUBDOMAIN,
  TLD,
  USERNAME,
} as const);

export const URL_COMPONENT_SEQUENCE = [
  PROTOCOL,
  USERNAME,
  PASSWORD,
  AUTH,
  TLD,
  DOMAIN,
  SUBDOMAIN,
  HOSTNAME,
  PORT,
  HOST,
  SEGMENTS,
  FILENAME,
  PATHNAME,
  SEARCH,
  PATH,
  HASH,
] as const;
