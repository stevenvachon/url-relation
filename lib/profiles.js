"use strict";
const {HASH} = require("./components");



const components = [];
const defaultPorts = {};
const indexFilenames = ["index.html"];
const queryNames = [];



const filterCommon = (url1, url2) => isHttpProtocol(url1.protocol) && isHttpProtocol(url2.protocol);

const filterSafe = (url1, url2) => url1.protocol==="mailto:" && url2.protocol==="mailto:";



const filterSpecCompliant = (url1, url2) =>
{
	if (filterSafe(url1,url2)) return true;
	if (isHttpProtocol(url1.protocol) && isHttpProtocol(url2.protocol)) return true;
	if (isWsProtocol(url1.protocol) && isWsProtocol(url2.protocol)) return true;
	return false;
};



const isHttpProtocol = protocol => protocol==="http:" || protocol==="https:";

const isWsProtocol = protocol => protocol==="ws:" || protocol==="wss:";



const CAREFUL_PROFILE =
{
	components,
	defaultPorts,
	ignoreComponents: true,
	ignoreDefaultPort: true,
	ignoreEmptyQueries: false,
	ignoreEmptySegmentNames: false,
	ignoreIndexFilename: false,
	ignoreQueryNames: false,
	ignoreQueryOrder: false,
	ignoreWWW: false,
	indexFilenames,
	queryNames,
	targetComponent: HASH
};

const COMMON_PROFILE =
{
	components,
	defaultPorts,
	ignoreComponents: true,
	ignoreDefaultPort: true,
	ignoreEmptyQueries: filterSpecCompliant,
	ignoreEmptySegmentNames: false,
	ignoreIndexFilename: filterCommon,
	ignoreQueryNames: false,
	ignoreQueryOrder: filterSpecCompliant,
	ignoreWWW: filterCommon,
	indexFilenames,
	queryNames,
	targetComponent: HASH
};



module.exports =
{
	CAREFUL_PROFILE,
	COMMON_PROFILE
};
