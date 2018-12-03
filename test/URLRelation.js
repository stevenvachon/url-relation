"use strict";
const {componentSequence} = require("../lib/components");
const customizeURL = require("incomplete-url");
const {describe, it} = require("mocha");
const {expect} = require("chai");
const tests = require("./helpers/tests.json");
const {URL} = require("universal-url");
const URLRelation = require("../lib");



const all = (url1, url2, component) =>
{
	const componentIndex = componentSequence.indexOf(component);

	if (componentIndex === -1)
	{
		throw new TypeError("Invalid URL component");
	}
	else
	{
		return {
			componentIndex,
			relatedParts: componentSequence.slice(0, componentIndex + 1),
			unrelatedParts: componentSequence.slice(componentIndex + 1)
		};
	}
};



const allMatch = (url1, url2, options) =>
{
	const {componentIndex, relatedParts, unrelatedParts} = all(url1, url2, options.targetComponent);

	const relatedPartsMatch = relatedParts.every(component => URLRelation.match(url1, url2, options));
	const unrelatedPartsMatch = unrelatedParts.every(component => !URLRelation.match(url1, url2, options));

	return relatedPartsMatch && unrelatedPartsMatch;
};



const allUpTo = (url1, url2, options, component, ignoreComponents) =>
{
	const {componentIndex, relatedParts, unrelatedParts} = all(url1, url2, component);

	const instance = new URLRelation(url1, url2, options);

	const relatedPartsMatch = relatedParts.every(component => instance.upTo(component, ignoreComponents));
	const unrelatedPartsMatch = unrelatedParts.every(component => !instance.upTo(component, ignoreComponents));

	return relatedPartsMatch && unrelatedPartsMatch;
};



const combinations = (options, type) =>
{
	const _URL = type==="trusted_deep" ? URL : customizeURL({ urlExclusions:["searchParams"] }).IncompleteURL;
	//let skipped = 0;

	it(`supports ${tests.length} different url combinations`, function()
	{
		this.timeout(7500);  // for the shim

		for (let i=0; i<tests.length; i++)
		{
			let relation = tests[i].relation[type];

			//if (relation === null) { skipped++; continue }

			const url1 = new _URL( tests[i].url1 );
			const url2 = new _URL( tests[i].url2 );

			if (relation === false)
			{
				relation = URLRelation.PROTOCOL;
				expect( allUpTo(url1,url2,options,relation) ).to.be.false;
				expect( allUpTo(url2,url1,options,relation) ).to.be.false;
			}
			else
			{
				relation = URLRelation[relation];
				expect( allUpTo(url1,url2,options,relation) ).to.be.true;
				expect( allUpTo(url2,url1,options,relation) ).to.be.true;
			}

			//console.log(i, type)
			//console.log(tests[i].url1)
			//console.log(tests[i].url2)
			//console.log("=======")
		}

		//if (skipped > 0) console.log(`${skipped} skipped`);
	});
};



const httpOnly = (url1, url2) => [url1,url2].every(url => ["http:","https:"].includes(url.protocol));



const options = overrides =>
({
	components: [],
	defaultPorts: {},
	ignoreComponents: false,
	ignoreDefaultPort: false,
	ignoreEmptyQueries: false,
	ignoreEmptySegmentNames: false,
	ignoreIndexFilename: false,
	ignoreQueryNames: false,
	ignoreQueryOrder: false,
	ignoreWWW: false,
	indexFilenames: [],
	queryNames: [],
	targetComponent: null,
	...overrides
});



describe("URLRelation()", () =>
{
	it(`has "careful" options profile publicly available`, () =>
	{
		expect( URLRelation.CAREFUL_PROFILE ).to.be.an("object");

		const originalValue = URLRelation.CAREFUL_PROFILE;

		expect(() => URLRelation.CAREFUL_PROFILE = "changed").to.throw(Error);
		expect(() => URLRelation.CAREFUL_PROFILE.defaultPorts = "changed").to.throw(Error);
		expect(() => URLRelation.CAREFUL_PROFILE.indexFilenames.push('changed.html')).to.throw(Error);
		expect(URLRelation.CAREFUL_PROFILE).to.equal(originalValue);
	});



	it(`has "common" options profile publicly available`, () =>
	{
		expect( URLRelation.COMMON_PROFILE ).to.be.an("object");

		const originalValue = URLRelation.COMMON_PROFILE;

		expect(() => URLRelation.COMMON_PROFILE = "changed").to.throw(Error);
		expect(() => URLRelation.COMMON_PROFILE.defaultPorts = "changed").to.throw(Error);
		expect(() => URLRelation.COMMON_PROFILE.indexFilenames.push('changed.html')).to.throw(Error);
		expect(URLRelation.COMMON_PROFILE).to.equal(originalValue);
	});



	it("has URL components publicly available", () =>
	{
		expect(URLRelation).to.contain.all.keys(
		[
			"AUTH",
			"DOMAIN",
			"FILENAME",
			"HASH",
			"HOST",
			"HOSTNAME",
			"PASSWORD",
			"PATH",
			"PATHNAME",
			"PORT",
			"PROTOCOL",
			"SEARCH",
			"SEGMENTS",
			"SUBDOMAIN",
			"TLD",
			"USERNAME"
		]);

		const originalValue = URLRelation.AUTH;

		expect(() => URLRelation.AUTH = "changed").to.throw(Error);
		expect(URLRelation.AUTH).to.equal(originalValue);
	});



	it("accepts URL input", () =>
	{
		const opts = options();
		const url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		expect(() => new URLRelation(url1, url2, opts)).not.to.throw();
	});



	it("rejects non-URL input", () =>
	{
		const opts = options();
		const url1 = "http://www.domain.com:123/dir/file.html?query#hash";
		const url2 = "http://www.domain.com:123/dir/file.html?query#hash";

		const strings       = () => new URLRelation(url1, url2, opts);
		const stringAndURL1 = () => new URLRelation(new URL(url1), url2, opts);
		const stringAndURL2 = () => new URLRelation(url1, new URL(url2), opts);

		expect(strings).to.throw(TypeError);
		expect(stringAndURL1).to.throw(TypeError);
		expect(stringAndURL2).to.throw(TypeError);
	});
});



describe("URLRelation.match()", () =>
{
	it("accepts URL input", () =>
	{
		const opts = options({ targetComponent:URLRelation.HASH });
		const url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		expect(() => URLRelation.match(url1, url2, opts)).not.to.throw();
	});



	it("rejects non-URL input", () =>
	{
		const opts = options({ targetComponent:URLRelation.HASH });
		const url1 = "http://www.domain.com:123/dir/file.html?query#hash";
		const url2 = "http://www.domain.com:123/dir/file.html?query#hash";

		const strings       = () => URLRelation.match(url1, url2, opts);
		const stringAndURL1 = () => URLRelation.match(new URL(url1), url2, opts);
		const stringAndURL2 = () => URLRelation.match(url1, new URL(url2), opts);

		expect(strings).to.throw(TypeError);
		expect(stringAndURL1).to.throw(TypeError);
		expect(stringAndURL2).to.throw(TypeError);
	});



	it("rejects non-URL component for options.targetComponent", () =>
	{
		const url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		let opts;

		opts = options();
		expect(() => URLRelation.match(url1, url2, opts)).to.throw();

		opts = options({ targetComponent:"hash" });
		expect(() => URLRelation.match(url1, url2, opts)).to.throw();
	});



	it("returns a boolean", () =>
	{
		const opts = options({ targetComponent:URLRelation.HASH });
		const url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?query");

		expect( URLRelation.match(url1,url1,opts) ).to.be.true;
		expect( URLRelation.match(url1,url2,opts) ).to.be.false;
		expect( URLRelation.match(url2,url1,opts) ).to.be.false;

		expect( allMatch(url1,url1,opts) ).to.be.true;
		expect( allMatch(url1,url2,opts) ).to.be.false;
		expect( allMatch(url2,url1,opts) ).to.be.false;
	});
});



describe("URLRelation::upTo()", () =>
{
	it("accepts URL component input", () =>
	{
		const opts = options();
		const url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const instance = new URLRelation(url1, url2, opts);
		expect(() => instance.upTo(URLRelation.PROTOCOL)).not.to.throw();
	});



	it("rejects non-URL component input", () =>
	{
		const opts = options();
		const url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const instance = new URLRelation(url1, url2, opts);
		expect(() => instance.upTo("protocol")).to.throw(TypeError);
		expect(() => instance.upTo()).to.throw(TypeError);
	});



	it("returns a boolean", () =>
	{
		const opts = options();
		const targetComponent = URLRelation.HASH;
		const url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?query");

		expect( new URLRelation(url1,url1,opts).upTo(targetComponent) ).to.be.true;
		expect( new URLRelation(url1,url2,opts).upTo(targetComponent) ).to.be.false;
		expect( new URLRelation(url2,url1,opts).upTo(targetComponent) ).to.be.false;

		expect( allUpTo(url1,url1,opts,targetComponent) ).to.be.true;
		expect( allUpTo(url1,url2,opts,targetComponent) ).to.be.false;
		expect( allUpTo(url2,url1,opts,targetComponent) ).to.be.false;
	});



	describe("options", () =>
	{
		it("ignoreComponents = false", () =>
		{
			const opts = options({ components:[URLRelation.PORT, URLRelation.PROTOCOL] });
			const url1 = new URL("http://www.domain.com:1234/dir/file.html?query#hash");
			const url2 = new URL("https://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.false;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.false;
		});



		it("ignoreComponents = true", () =>
		{
			const opts = options({ ignoreComponents:true, components:[URLRelation.PORT, URLRelation.PROTOCOL] });
			const url1 = new URL("http://www.domain.com:1234/dir/file.html?query#hash");
			const url2 = new URL("https://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;
		});



		it("ignoreComponents = function", () =>
		{
			const opts = options({ ignoreComponents:httpOnly, components:[URLRelation.PORT, URLRelation.PROTOCOL] });
			const url1 = new URL("http://www.domain.com:1234/dir/file.html?query#hash");
			const url2 = new URL("https://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;
		});



		it("ignoreDefaultPort = false", () =>
		{
			const opts = options({ defaultPorts:{ "other:":1234 } });
			const url1 = new URL("other://www.domain.com:1234/dir/file.html?query#hash");
			const url2 = new URL("other://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HOSTNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HOSTNAME) ).to.be.true;
		});



		it("ignoreDefaultPort = true", () =>
		{
			const opts = options({ ignoreDefaultPort:true, defaultPorts:{ "other:":1234 } });
			let url1,url2;

			url1 = new URL("other://www.domain.com:1234/dir/file.html?query#hash");
			url2 = new URL("other://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("other://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("other://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HOSTNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HOSTNAME) ).to.be.true;
		});



		it("ignoreDefaultPort = function", () =>
		{
			const opts = options({ ignoreDefaultPort:httpOnly, defaultPorts:{ "http:":1234, "other:":1234 } });
			let url1,url2;

			url1 = new URL("http://www.domain.com:1234/dir/file.html?query#hash");
			url2 = new URL("http://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("http://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HOSTNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HOSTNAME) ).to.be.true;

			url1 = new URL("other://www.domain.com:1234/dir/file.html?query#hash");
			url2 = new URL("other://www.domain.com/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HOSTNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HOSTNAME) ).to.be.true;
		});



		it("ignoreEmptyQueries = false", () =>
		{
			const opts = options({ ignoreEmptyQueries:false });
			let url1,url2;

			// NOTE :: this is a shallow query comparison
			url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var&#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;

			// NOTE :: this is a shallow query comparison
			url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var&=#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;
		});



		it("ignoreEmptyQueries = true", () =>
		{
			const opts = options({ ignoreEmptyQueries:true });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var&#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var&=#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var=value1&var=value2&=&=#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?=&var=value1&var=value2#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;
		});



		it("ignoreEmptyQueries = function", () =>
		{
			const opts = options({ ignoreEmptyQueries:httpOnly });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var&#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var&=#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			// NOTE :: this is a shallow query comparison
			url1 = new URL("other://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("other://www.domain.com:123/dir/file.html?var&#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;

			// NOTE :: this is a shallow query comparison
			url1 = new URL("other://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("other://www.domain.com:123/dir/file.html?var&=#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;
		});



		it("ignoreEmptySegmentNames = false", () =>
		{
			const opts = options({ ignoreEmptySegmentNames:false });
			const url1 = new URL("http://www.domain.com:123/dir//file.html?query#hash");
			const url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HOST) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HOST) ).to.be.true;
		});



		it("ignoreEmptySegmentNames = true", () =>
		{
			const opts = options({ ignoreEmptySegmentNames:true });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir//file.html?query#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("other://www.domain.com:123/dir///file.html?query#hash");
			url2 = new URL("other://www.domain.com:123/dir//file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;
		});



		it("ignoreEmptySegmentNames = function", () =>
		{
			const opts = options({ ignoreEmptySegmentNames:httpOnly });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir//file.html?query#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("other://www.domain.com:123/dir//file.html?query#hash");
			url2 = new URL("other://www.domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HOST) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HOST) ).to.be.true;
		});



		it("ignoreIndexFilename = false", () =>
		{
			const opts = options({ indexFilenames:["other.html"] });
			const url1 = new URL("http://www.domain.com:123/dir/other.html?query#hash");
			const url2 = new URL("http://www.domain.com:123/dir/?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.SEGMENTS) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.SEGMENTS) ).to.be.true;
		});



		it("ignoreIndexFilename = true", () =>
		{
			let opts = options({ ignoreIndexFilename:true, indexFilenames:["other.html"] });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/other.html?query#hash");
			url2 = new URL("http://www.domain.com:123/dir/?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("other://www.domain.com:123/dir/other.html?query#hash");
			url2 = new URL("other://www.domain.com:123/dir/?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			opts = options({ ignoreIndexFilename:true, indexFilenames:[/^another\.[a-z]+$/] });
			url1 = new URL("http://www.domain.com:123/dir/another.html?query#hash");
			url2 = new URL("http://www.domain.com:123/dir/?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;
		});



		it("ignoreIndexFilename = function", () =>
		{
			const opts = options({ ignoreIndexFilename:httpOnly, indexFilenames:["other.html"] });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/other.html?query#hash");
			url2 = new URL("http://www.domain.com:123/dir/?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("other://www.domain.com:123/dir/other.html?query#hash");
			url2 = new URL("other://www.domain.com:123/dir/?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.SEGMENTS) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.SEGMENTS) ).to.be.true;
		});



		it("ignoreQueryNames = false", () =>
		{
			// NOTE :: this is a shallow query comparison
			const opts = options({ ignoreQueryNames:false, queryNames:["var"] });
			const url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
			const url2 = new URL("http://www.domain.com:123/dir/file.html#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;
		});



		it("ignoreQueryNames = true", () =>
		{
			let opts,url1,url2;

			opts = options({ ignoreQueryNames:true, queryNames:["var1"] });
			url1 = new URL("http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2=value#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var2=value#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			opts = options({ ignoreQueryNames:true, queryNames:[/^var\d+$/] });
			url1 = new URL("http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2=value#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;
		});



		it("ignoreQueryNames = function", () =>
		{
			const opts = options({ ignoreQueryNames:httpOnly, queryNames:["var"] });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			// NOTE :: this is a shallow query comparison
			url1 = new URL("other://www.domain.com:123/dir/file.html?var#hash");
			url2 = new URL("other://www.domain.com:123/dir/file.html#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;
		});



		it("ignoreQueryOrder = false", () =>
		{
			const opts = options({ ignoreQueryOrder:false });
			const url1 = new URL("http://www.domain.com:123/dir/file.html?var2=&var1#hash");
			const url2 = new URL("http://www.domain.com:123/dir/file.html?var1=&var2#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;
		});



		it("ignoreQueryOrder = true", () =>
		{
			const opts = options({ ignoreQueryOrder:true });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var2=&var1#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var1=&var2#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var2&var1=value1&var1=value2#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var2&var1=value2&var1=value1#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;
		});



		it("ignoreQueryOrder = function", () =>
		{
			const opts = options({ ignoreQueryOrder:httpOnly });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var2=&var1#hash");
			url2 = new URL("http://www.domain.com:123/dir/file.html?var1=&var2#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("other://www.domain.com:123/dir/file.html?var2=&var1#hash");
			url2 = new URL("other://www.domain.com:123/dir/file.html?var1=&var2#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.PATHNAME) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.PATHNAME) ).to.be.true;
		});



		it("ignoreWWW = false", () =>
		{
			const opts = options();
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("http://domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.DOMAIN) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.DOMAIN) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("http://domain.net:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.AUTH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.AUTH) ).to.be.true;

			url1 = new URL("http://www.domain:123/dir/file.html?query#hash");
			url2 = new URL("http://domain:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.AUTH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.AUTH) ).to.be.true;
		});



		it("ignoreWWW = true", () =>
		{
			const opts = options({ ignoreWWW:true });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("http://domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("http://domain.net:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.AUTH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.AUTH) ).to.be.true;

			url1 = new URL("http://www.domain:123/dir/file.html?query#hash");
			url2 = new URL("http://domain:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.AUTH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.AUTH) ).to.be.true;

			url1 = new URL("other://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("other://domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;
		});



		it("ignoreWWW = function", () =>
		{
			const opts = options({ ignoreWWW:httpOnly });
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("http://domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

			url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("http://domain.net:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.AUTH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.AUTH) ).to.be.true;

			url1 = new URL("http://www.domain:123/dir/file.html?query#hash");
			url2 = new URL("http://domain:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.AUTH) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.AUTH) ).to.be.true;

			url1 = new URL("other://www.domain.com:123/dir/file.html?query#hash");
			url2 = new URL("other://domain.com:123/dir/file.html?query#hash");
			expect( allUpTo(url1,url2,opts,URLRelation.DOMAIN) ).to.be.true;
			expect( allUpTo(url2,url1,opts,URLRelation.DOMAIN) ).to.be.true;
		});



		describe("in careful profile", () =>
		{
			combinations(URLRelation.CAREFUL_PROFILE, "untrusted");
		});



		describe("in common profile", () =>
		{
			combinations(URLRelation.COMMON_PROFILE, "trusted_deep");



			it("supports edge cases", () =>
			{
				const opts = URLRelation.COMMON_PROFILE;
				let url1,url2;

				url1 = new URL("http://www.domain.com:123/dir/file.html?var2&var1#hash");
				url2 = new URL("http://domain.com:123/dir/file.html?var1&var2#hash");
				expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
				expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

				url1 = new URL("https://www.domain.com:123/dir/file.html?var2&var1#hash");
				url2 = new URL("https://domain.com:123/dir/file.html?var1&var2#hash");
				expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
				expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

				url1 = new URL("mailto:email@domain.com?cc=user%40domain.com&subject=hello+world");
				url2 = new URL("mailto:email@domain.com?subject=hello+world&cc=user%40domain.com");
				expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
				expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

				url1 = new URL("ws://domain.com:123/dir/file.html?var2&var1#hash");
				url2 = new URL("ws://domain.com:123/dir/file.html?var1&var2#hash");
				expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
				expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;

				url1 = new URL("wss://domain.com:123/dir/file.html?var2&var1#hash");
				url2 = new URL("wss://domain.com:123/dir/file.html?var1&var2#hash");
				expect( allUpTo(url1,url2,opts,URLRelation.HASH) ).to.be.true;
				expect( allUpTo(url2,url1,opts,URLRelation.HASH) ).to.be.true;
			});
		});



		// Simulate an incomplete `URL` implementation that's missing `URLSearchParams`
		describe("in common profile; ignoreEmptyQueries = false, ignoreQueryOrder = false", () =>
		{
			combinations( options({ ...URLRelation.COMMON_PROFILE, ignoreEmptyQueries:false, ignoreQueryOrder:false }), "trusted_shallow" );
		});



		describe(`in default profile`, () =>
		{
			combinations(null, "trusted_deep");
		});
	});
});
