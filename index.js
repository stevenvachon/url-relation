"use strict";
const anyMatch = require("any-match");
const deepFreeze = require("deep-freeze-node");
const defined = require("defined");
const evaluateValue = require("evaluate-value");
const isURL = require("isurl");
const parseDomain = require("parse-domain");
const stripWWW = require("strip-www");

const defaultPorts = {};
const directoryIndexes = ["index.html"];
const encodedSpace = /%20/g;
const multipleSlashes = /\/{2,}/g;
const queryNames = [];

const level =
{
	NONE:      -1,
	PROTOCOL:  0,
	TLD:       1,
	DOMAIN:    2,
	SUBDOMAIN: 3,
	HOSTNAME:  4,
	PORT:      5,
	HOST:      6,
	USERNAME:  7,
	PASSWORD:  8,
	AUTH:      9,
	DIRECTORY: 10,
	FILENAME:  11,
	PATHNAME:  12,
	SEARCH:    13,
	PATH:      14,
	HASH:      15,
	ALL:       16
};

const carefulProfile =
{
	defaultPorts,
	directoryIndexes,
	ignoreDefaultPort: true,
	ignoreDirectoryIndex: false,
	ignoreEmptyDirectoryNames: false,
	ignoreEmptyQueries: false,
	ignoreQueryNames: false,
	ignoreQueryOrder: false,
	ignoreWWW: false,
	queryNames
};

const commonProfile =
{
	defaultPorts,
	directoryIndexes,
	ignoreDefaultPort: true,
	ignoreDirectoryIndex: filterCommon,
	ignoreEmptyDirectoryNames: false,
	ignoreEmptyQueries: filterSpecCompliant,
	ignoreQueryOrder: filterSpecCompliant,
	ignoreQueryNames: false,
	ignoreWWW: filterCommon,
	queryNames
};



function defaultValue(customOptions, optionName, ...args)
{
	const defaultOption = evaluateValue(commonProfile[optionName], ...args);

	if (customOptions != null)
	{
		return defined( evaluateValue(customOptions[optionName], ...args), defaultOption );
	}
	else
	{
		return defaultOption;
	}
}



function filterCommon(url1, url2)
{
	return (url1.protocol==="http:" || url1.protocol==="https:") && (url2.protocol==="http:" || url2.protocol==="https:");
}



function filterSafe(url1, url2)
{
	return url1.protocol==="mailto:" && url2.protocol==="mailto:";
}



function filterSpecCompliant(url1, url2)
{
	if (filterSafe(url1,url2)) return true;
	if ((url1.protocol==="http:" || url1.protocol==="https:") && (url2.protocol==="http:" || url2.protocol==="https:")) return true;
	if ((url1.protocol==="ws:"   || url1.protocol==="wss:")   && (url2.protocol==="ws:"   || url2.protocol==="wss:"))   return true;
	return false;
}



function hostnameRelation(url1, url2, options)
{
	if (url1.hostname === url2.hostname) return;

	if (defaultValue(options, "ignoreWWW", url1, url2))
	{
		const hostname1_stripped = stripWWW(url1.hostname);
		const hostname2_stripped = stripWWW(url2.hostname);

		if (hostname1_stripped === hostname2_stripped) return;
	}

	const hostname1 = parseDomain(url1.hostname);
	const hostname2 = parseDomain(url2.hostname);

	// If unknown top-level domain or running in a browser
	if (hostname1===null || hostname2===null) return level.PROTOCOL;

	if (hostname1.tld !== hostname2.tld) return level.PROTOCOL;
	if (hostname1.domain !== hostname2.domain) return level.TLD;
	if (hostname1.subdomain !== hostname2.subdomain) return level.DOMAIN;
}



function matchingParamName(a, b)
{
	return a[0].localeCompare( b[0] );
}



function notEmptyParam(param)
{
	return param[0]!=="" || param[1]!=="";
}



function pathnameRelation(url1, url2, options)
{
	if (url1.pathname === url2.pathname) return;

	let pathname1 = url1.pathname;
	let pathname2 = url2.pathname;

	if (defaultValue(options, "ignoreEmptyDirectoryNames", url1, url2))
	{
		pathname1 = pathname1.replace(multipleSlashes, "/");
		pathname2 = pathname2.replace(multipleSlashes, "/");
	}

	pathname1 = pathname1.split("/");
	pathname2 = pathname2.split("/");

	if (pathname1.length !== pathname2.length) return level.AUTH;

	for (let i=0; i<pathname1.length; i++)
	{
		if (pathname1[i] !== pathname2[i])
		{
			// If last segment
			// NOTE :: length will never be less than 2 as the minimum value for `pathname` is "/" (per spec)
			if (i >= pathname1.length-1)
			{
				if (defaultValue(options, "ignoreDirectoryIndex", url1, url2))
				{
					const directoryIndexes = defaultValue(options, "directoryIndexes");

					// If one ends in a trailing slash and one ends in a directory index
					if (pathname1[i]==="" && anyMatch(pathname2[i], directoryIndexes)) return;
					if (pathname2[i]==="" && anyMatch(pathname1[i], directoryIndexes)) return;
				}

				return level.DIRECTORY;
			}

			// Not same dir
			return level.AUTH;
		}
	}
}



function portRelation(url1, url2, options)
{
	if (url1.port === url2.port) return;

	if (defaultValue(options, "ignoreDefaultPort", url1, url2))
	{
		const defaultPorts = defaultValue(options, "defaultPorts");

		// If one has no port and one has a default por
		if (url1.port==="" && defaultPorts[url2.protocol]===parseInt(url2.port)) return;
		if (url2.port==="" && defaultPorts[url1.protocol]===parseInt(url1.port)) return;
	}

	return level.HOSTNAME;
}



function searchRelation(url1, url2, options)
{
	if (url1.search === url2.search) return;

	const ignoreEmptyQueries = defaultValue(options, "ignoreEmptyQueries", url1, url2);
	const ignoreQueryNames   = defaultValue(options, "ignoreQueryNames", url1, url2);
	const ignoreQueryOrder   = defaultValue(options, "ignoreQueryOrder", url1, url2);

	// Also if is a partial implementation
	if ((!ignoreEmptyQueries && !ignoreQueryNames && !ignoreQueryOrder) || url1.searchParams===undefined || url2.searchParams===undefined)
	{
		// Normalize space characters
		if (url1.search.replace(encodedSpace,"+") === url2.search.replace(encodedSpace,"+"))
		{
			return;
		}

		return level.PATHNAME;
	}

	let params1 = Array.from(url1.searchParams);
	let params2 = Array.from(url2.searchParams);

	if (ignoreEmptyQueries)
	{
		params1 = params1.filter(notEmptyParam);
		params2 = params2.filter(notEmptyParam);
	}

	if (ignoreQueryNames)
	{
		const queryNames = defaultValue(options, "queryNames");

		const notIgnoredName = function(param)
		{
			return !anyMatch(param[0], queryNames);
		};

		params1 = params1.filter(notIgnoredName);
		params2 = params2.filter(notIgnoredName);
	}

	if (params1.length !== params2.length) return level.PATHNAME;

	if (ignoreQueryOrder)
	{
		params1 = params1.sort(matchingParamName);
		params2 = params2.sort(matchingParamName);
	}

	for (let i=0; i<params1.length; i++)
	{
		if (params1[i][0] !== params2[i][0]) return level.PATHNAME;
		if (params1[i][1] !== params2[i][1]) return level.PATHNAME;
	}
}



function urlRelation(url1, url2, options)
{
	if (!isURL.lenient(url1) || !isURL.lenient(url2))
	{
		throw new TypeError("Invalid URL");
	}

	if (url1.protocol !== url2.protocol) return level.NONE;

	const unrelatedHostname = hostnameRelation(url1, url2, options);
	if (unrelatedHostname !== undefined) return unrelatedHostname;

	const unrelatedPort = portRelation(url1, url2, options);
	if (unrelatedPort !== undefined) return unrelatedPort;

	if (url1.username !== url2.username) return level.HOST;
	if (url1.password !== url2.password) return level.USERNAME;

	const unrelatedPathname = pathnameRelation(url1, url2, options);
	if (unrelatedPathname !== undefined) return unrelatedPathname;

	const unrelatedSearch = searchRelation(url1, url2, options);
	if (unrelatedSearch !== undefined) return unrelatedSearch;

	if (url1.hash !== url2.hash) return level.PATH;

	return level.ALL;
}



urlRelation.CAREFUL_PROFILE = carefulProfile;
urlRelation.COMMON_PROFILE = commonProfile;

Object.assign(urlRelation, level);



module.exports = deepFreeze(urlRelation);
