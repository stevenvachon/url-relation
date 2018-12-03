"use strict";
const {components, componentSequence} = require("./components");
require("array.prototype.flat/auto");



const
{
	AUTH,
	DOMAIN,
	FILENAME,
	HOST,
	HOSTNAME,
	PASSWORD,
	PATH,
	PATHNAME,
	PORT,
	SEARCH,
	SEGMENTS,
	SUBDOMAIN,
	TLD,
	USERNAME
} = components;



const groupComponents =
{
	[AUTH]: [USERNAME, PASSWORD],
	[HOST]: [TLD, DOMAIN, SUBDOMAIN, PORT],
	[HOSTNAME]: [TLD, DOMAIN, SUBDOMAIN],
	[PATH]: [SEGMENTS, FILENAME, SEARCH],
	[PATHNAME]: [SEGMENTS, FILENAME]
};

const groups = Object.getOwnPropertySymbols(groupComponents);



const appendComponentGroups = components =>
{
	const appends = groups.reduce((result, group) =>
	{
		const hasAnyComponents = groupComponents[group].some(component => components.includes(component));
		const hasGroupComponent = components.includes(group);

		if (hasAnyComponents && !hasGroupComponent)
		{
			result.push(group);
		}

		return result;
	}, []);

	return [...components, ...appends];
};



const endAt = component =>
{
	const sliceIndex = componentSequence.indexOf(component);

	if (sliceIndex > -1)
	{
		return componentSequence.slice(0, sliceIndex + 1);
	}
	else
	{
		return componentSequence;
	}
};



const excludeComponents = (exclusions=[], lastComponent) =>
{
	exclusions = expandComponentGroups(exclusions);
	exclusions = appendComponentGroups(exclusions);

	const sequence = endAt(lastComponent);

	return sequence.filter(component => !exclusions.includes(component));
};



const expandComponentGroups = components =>
{
	return components
		.map(component => groupComponents[component] || component)
		.flat()
		.filter((component, i, array) => i === array.indexOf(component));
};



module.exports = excludeComponents;
