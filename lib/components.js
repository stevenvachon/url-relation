"use strict";
const AUTH      = Symbol("auth");
const DOMAIN    = Symbol("domain");
const FILENAME  = Symbol("filename");
const HASH      = Symbol("hash");
const HOST      = Symbol("host");
const HOSTNAME  = Symbol("hostname");
const PASSWORD  = Symbol("password");
const PATH      = Symbol("path");
const PATHNAME  = Symbol("pathname");
const PORT      = Symbol("port");
const PROTOCOL  = Symbol("protocol");
const SEARCH    = Symbol("search");
const SEGMENTS  = Symbol("segments");
const SUBDOMAIN = Symbol("subdomain");
const TLD       = Symbol("tld");
const USERNAME  = Symbol("username");

const components =
{
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
	USERNAME
};

const componentSequence =
[
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
	HASH
];

module.exports =
{
	components,
	componentSequence,
	...components
};
