"use strict";
const anyMatch = require("any-match");
const {CAREFUL_PROFILE, COMMON_PROFILE} = require("./profiles");
const {components, componentSequence} = require("./components");
const deepFreeze = require("deep-freeze-node");
const evaluateValue = require("evaluate-value");
const excludeComponents = require("./excludeComponents");
const isURL = require("isurl");
const {parseDomain, ParseResultType} = require("parse-domain");
require("symbol.prototype.description/auto");



const ENCODED_SPACE = /%20/g;
const MULTIPLE_SLASHES = /\/{2,}/g;



const authRelation = (url1, url2) =>
{
	const password = url1.password === url2.password;
	const username = url1.username === url2.username;

	return {
		auth: password && username,
		password,
		username
	};
};



const defaultValue = (customOptions, optionName, ...args) =>
{
	const defaultOption = evaluateValue(COMMON_PROFILE[optionName], ...args);

	return evaluateValue(customOptions?.[optionName], ...args) ?? defaultOption;
};



const hostnameRelation = (url1, url2, options) =>
{
	if (url1.hostname === url2.hostname)
	{
		return {
			domain: true,
			hostname: true,
			subdomain: true,
			tld: true
		};
	}
	else
	{
		let hostname1 = parseDomain(url1.hostname);
		let hostname2 = parseDomain(url2.hostname);

		if (hostname1.type!==ParseResultType.Listed || hostname2.type!==ParseResultType.Listed)
		{
			return {
				domain: false,
				hostname: false,
				subdomain: false,
				tld: false
			};
		}
		else
		{
			// Avoid "effective" TLDs
			hostname1 = hostname1.icann;
			hostname2 = hostname2.icann;

			const ignoreWWW = defaultValue(options, "ignoreWWW", url1, url2);
			const subdomains1 = (ignoreWWW && hostname1.subDomains[0] === "www") ? hostname1.subDomains.slice(1) : hostname1.subDomains;
			const subdomains2 = (ignoreWWW && hostname2.subDomains[0] === "www") ? hostname2.subDomains.slice(1) : hostname2.subDomains;

			const domain = hostname1.domain === hostname2.domain;
			const subdomain = subdomains1.join(".") === subdomains2.join(".");
			const tld = hostname1.topLevelDomains.join(".") === hostname2.topLevelDomains.join(".");

			return {
				domain,
				hostname: domain && subdomain && tld,
				subdomain,
				tld
			};
		}
	}
};



const matchingParamName = (a, b) => a[0].localeCompare( b[0] );

const notEmptyParam = param => param[0]!=="" || param[1]!=="";



const pathnameRelation = (url1, url2, options) =>
{
	let pathname1 = url1.pathname;
	let pathname2 = url2.pathname;

	if (pathname1 === pathname2)
	{
		return {
			filename: true,
			pathname: true,
			segments: true
		};
	}
	else
	{
		if (defaultValue(options, "ignoreEmptySegmentNames", url1, url2))
		{
			pathname1 = pathname1.replace(MULTIPLE_SLASHES, "/");
			pathname2 = pathname2.replace(MULTIPLE_SLASHES, "/");
		}

		pathname1 = pathname1.split("/");
		pathname2 = pathname2.split("/");

		const filename1 = pathname1.pop();
		const filename2 = pathname2.pop();
		let filename;

		if (defaultValue(options, "ignoreIndexFilename", url1, url2))
		{
			const indexFilenames = defaultValue(options, "indexFilenames");

			// If one ends in a trailing slash and one ends in an index file
			const match1 = filename1==="" && anyMatch(filename2, indexFilenames);
			const match2 = filename2==="" && anyMatch(filename1, indexFilenames);

			filename = match1 || match2;
		}
		else
		{
			filename = filename1 === filename2;
		}

		if (pathname1.length !== pathname2.length)
		{
			return {
				filename,
				pathname: false,
				segments: false
			};
		}
		else
		{
			const segments = pathname1.every((pathname, i) => pathname === pathname2[i]);

			return {
				filename,
				pathname: segments && filename,
				segments
			}
		}
	}
};



const portRelation = (url1, url2, options) =>
{
	if (url1.port === url2.port)
	{
		return {
			port: true
		};
	}
	else if (defaultValue(options, "ignoreDefaultPort", url1, url2))
	{
		const defaultPorts = defaultValue(options, "defaultPorts");

		// If one has no port and one has a default port
		const match1 = url1.port==="" && defaultPorts[url2.protocol]===parseInt(url2.port,10);
		const match2 = url2.port==="" && defaultPorts[url1.protocol]===parseInt(url1.port,10);

		return {
			port: match1 || match2
		};
	}
	else
	{
		return {
			port: false
		};
	}
};



const searchRelation = (url1, url2, options) =>
{
	// @todo don't do this because there're more details such as https://github.com/whatwg/url/issues/18
	// If normalized match
	if (url1.search.replace(ENCODED_SPACE,"+") === url2.search.replace(ENCODED_SPACE,"+"))
	{
		return {
			search: true
		};
	}
	else
	{
		const ignoreEmptyQueries = defaultValue(options, "ignoreEmptyQueries", url1, url2);
		const ignoreQueryNames   = defaultValue(options, "ignoreQueryNames", url1, url2);
		const ignoreQueryOrder   = defaultValue(options, "ignoreQueryOrder", url1, url2);

		const noIgnores = !ignoreEmptyQueries && !ignoreQueryNames && !ignoreQueryOrder;

		// @todo remove support for this
		const partialImplementation = url1.searchParams===undefined || url2.searchParams===undefined;

		if (noIgnores || partialImplementation)
		{
			return {
				search: false
			};
		}
		else
		{
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

				const notIgnoredName = param => !anyMatch(param[0], queryNames);

				params1 = params1.filter(notIgnoredName);
				params2 = params2.filter(notIgnoredName);
			}

			if (ignoreQueryOrder)
			{
				params1 = params1.sort(matchingParamName);
				params2 = params2.sort(matchingParamName);
			}

			if (params1.length !== params2.length)
			{
				return {
					search: false
				};
			}
			else
			{
				return {
					search: params1.every((param1, i) =>
					{
						const matchingKey   = param1[0] === params2[i][0];
						const matchingValue = param1[1] === params2[i][1];
						return matchingKey && matchingValue;
					})
				};
			}
		}
	}
};



class URLRelation
{
	constructor(url1, url2, options)
	{
		if (!isURL.lenient(url1) || !isURL.lenient(url2))
		{
			throw new TypeError("Invalid URL");
		}

		// @todo make private when there's a native implementation
		this.options = options;
		this.url1 = url1;
		this.url2 = url2;

		// @todo make private when there's a native implementation
		this.relations =
		{
			hash: url1.hash === url2.hash,
			protocol: url1.protocol === url2.protocol,
			...authRelation(url1, url2),
			...hostnameRelation(url1, url2, options),
			...pathnameRelation(url1, url2, options),
			...portRelation(url1, url2, options),
			...searchRelation(url1, url2, options)
		};

		this.relations.host = this.relations.hostname && this.relations.port;
		this.relations.path = this.relations.pathname && this.relations.search;
	}



	static match(url1, url2, options)
	{
		return new URLRelation(url1, url2, options).run();
	}



	// @todo make private when there's a native implementation
	run(targetComponent, components)
	{
		if (targetComponent === undefined)
		{
			targetComponent = defaultValue(this.options, "targetComponent");
		}

		if (!componentSequence.includes(targetComponent))
		{
			throw new TypeError("Invalid URL component");
		}

		if (components===undefined && defaultValue(this.options, "ignoreComponents", this.url1, this.url2))
		{
			components = defaultValue(this.options, "components");
		}

		const sequence = excludeComponents(components, targetComponent);

		return sequence.every(({description}) => this.relations[description]);
	}



	upTo(component, ignoredComponents)
	{
		if (component === undefined)
		{
			throw new TypeError("Invalid URL component");
		}

		return this.run(component, ignoredComponents);
	}
}



// @todo move to public static fields when there's a native implementation
Object.assign
(
	URLRelation,
	components,
	{
		CAREFUL_PROFILE,
		COMMON_PROFILE
	}
);



module.exports = deepFreeze(URLRelation);
