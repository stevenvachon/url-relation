"use strict";
const expect = require("chai").expect;
const tests = require("./helpers/tests.json");
const universalURL = require("universal-url");
const urlRelation = require("../lib/url-relation");

const it_searchParamsOnly = universalURL.supportsSearchParams ? it : it.skip;
const URL = universalURL.URL;



function combinations(options, type)
{
	const _it = type==="trusted_deep" ? it_searchParamsOnly : it;
	//let skipped = 0;

	_it(`supports ${tests.length} different url combinations`, function()
	{
		this.timeout(3000);  // for the shim

		for (let i=0; i<tests.length; i++)
		{
			//if (tests[i].relation[type] === null) { skipped++; continue }

			const url1 = new URL( tests[i].url1 );
			const url2 = new URL( tests[i].url2 );
			expect( urlRelation(url1,url2,options) ).to.equal( urlRelation[ tests[i].relation[type] ] );
			expect( urlRelation(url2,url1,options) ).to.equal( urlRelation[ tests[i].relation[type] ] );
		}

		//if (skipped > 0) console.log(`${skipped} skipped`);
	});
}



function httpOnly(url1, url2)
{
	return (url1.protocol==="http:" || url1.protocol==="https:") && (url2.protocol==="http:" || url2.protocol==="https:");
}




function options(/*...overrides*/)
{
	const resetOptions = 
	{
		defaultPorts: {},
		directoryIndexes: [],
		ignoreDefaultPort: false,
		ignoreDirectoryIndex: false,
		ignoreEmptyDirectoryNames: false,
		ignoreEmptyQueries: false,
		ignoreQueryNames: false,
		ignoreQueryOrder: false,
		ignoreWWW: false,
		queryNames: []
	};

	// TODO :: use this when dropping Node v4 support
	//if (overrides == null) return resetOptions;
	//return Object.assign(resetOptions, ...overrides);

	const overrides = Array.from(arguments);
	if (overrides.length === 0) return resetOptions;
	return Object.assign.apply(undefined, [resetOptions].concat(overrides));
}



it(`has "careful" options profile publicly available`, function()
{
	expect( urlRelation.CAREFUL_PROFILE ).to.be.an("object");

	const originalValue = urlRelation.CAREFUL_PROFILE;

	expect(() => urlRelation.CAREFUL_PROFILE = "changed").to.throw(Error);
	expect(() => urlRelation.CAREFUL_PROFILE.defaultPorts = "changed").to.throw(Error);
	expect(urlRelation.CAREFUL_PROFILE).to.equal(originalValue);
});



it(`has "common" options profile publicly available`, function()
{
	expect( urlRelation.COMMON_PROFILE ).to.be.an("object");

	const originalValue = urlRelation.COMMON_PROFILE;

	expect(() => urlRelation.COMMON_PROFILE = "changed").to.throw(Error);
	expect(() => urlRelation.COMMON_PROFILE.defaultPorts = "changed").to.throw(Error);
	expect(urlRelation.COMMON_PROFILE).to.equal(originalValue);
});



it("has output levels publicly available", function()
{
	expect(urlRelation).to.contain.all.keys(["NONE", "ALL"]);

	const originalValue = urlRelation.NONE;

	expect(() => urlRelation.NONE = "changed").to.throw(Error);
	expect(urlRelation.NONE).to.equal(originalValue);
});



it("accepts URL input", function()
{
	const opts = options();
	const url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
	const url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
	expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
});



it("rejects non-URL input", function()
{
	const opts = options();
	const url1 = "http://www.domain.com:123/dir/file.html?query#hash";
	const url2 = "http://www.domain.com:123/dir/file.html?query#hash";

	const strings       = () => urlRelation(url1, url2, opts);
	const stringAndURL1 = () => urlRelation(new URL(url1), url2, opts);
	const stringAndURL2 = () => urlRelation(url1, new URL(url2), opts);

	expect(strings).to.throw(TypeError);
	expect(stringAndURL1).to.throw(TypeError);
	expect(stringAndURL2).to.throw(TypeError);
});



describe("options", function()
{
	it("ignoreDefaultPort = false", function()
	{
		const opts = options({ defaultPorts:{ "other:":1234 } });
		const url1 = new URL("other://www.domain.com:1234/dir/file.html?query#hash");
		const url2 = new URL("other://www.domain.com/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.HOSTNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.HOSTNAME);
	});



	it("ignoreDefaultPort = true", function()
	{
		const opts = options({ ignoreDefaultPort:true, defaultPorts:{ "other:":1234 } });
		let url1,url2;

		url1 = new URL("other://www.domain.com:1234/dir/file.html?query#hash");
		url2 = new URL("other://www.domain.com/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("other://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("other://www.domain.com/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.HOSTNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.HOSTNAME);
	});



	it("ignoreDefaultPort = function", function()
	{
		const opts = options({ ignoreDefaultPort:httpOnly, defaultPorts:{ "http:":1234, "other:":1234 } });
		let url1,url2;

		url1 = new URL("http://www.domain.com:1234/dir/file.html?query#hash");
		url2 = new URL("http://www.domain.com/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("http://www.domain.com/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.HOSTNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.HOSTNAME);

		url1 = new URL("other://www.domain.com:1234/dir/file.html?query#hash");
		url2 = new URL("other://www.domain.com/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.HOSTNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.HOSTNAME);
	});



	it("ignoreDirectoryIndex = false", function()
	{
		const opts = options({ directoryIndexes:["other.html"] });
		const url1 = new URL("http://www.domain.com:123/dir/other.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.DIRECTORY);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.DIRECTORY);
	});



	it("ignoreDirectoryIndex = true", function()
	{
		let opts = options({ ignoreDirectoryIndex:true, directoryIndexes:["other.html"] });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/other.html?query#hash");
		url2 = new URL("http://www.domain.com:123/dir/?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("other://www.domain.com:123/dir/other.html?query#hash");
		url2 = new URL("other://www.domain.com:123/dir/?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		opts = options({ ignoreDirectoryIndex:true, directoryIndexes:[/^another\.[a-z]+$/] });
		url1 = new URL("http://www.domain.com:123/dir/another.html?query#hash");
		url2 = new URL("http://www.domain.com:123/dir/?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);
	});



	it("ignoreDirectoryIndex = function", function()
	{
		const opts = options({ ignoreDirectoryIndex:httpOnly, directoryIndexes:["other.html"] });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/other.html?query#hash");
		url2 = new URL("http://www.domain.com:123/dir/?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("other://www.domain.com:123/dir/other.html?query#hash");
		url2 = new URL("other://www.domain.com:123/dir/?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.DIRECTORY);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.DIRECTORY);
	});



	it("ignoreEmptyDirectoryNames = false", function()
	{
		const opts = options({ ignoreEmptyDirectoryNames:false });
		const url1 = new URL("http://www.domain.com:123/dir//file.html?query#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.AUTH);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.AUTH);
	});
	


	it("ignoreEmptyDirectoryNames = true", function()
	{
		const opts = options({ ignoreEmptyDirectoryNames:true });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir//file.html?query#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("other://www.domain.com:123/dir///file.html?query#hash");
		url2 = new URL("other://www.domain.com:123/dir//file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);
	});



	it("ignoreEmptyDirectoryNames = function", function()
	{
		const opts = options({ ignoreEmptyDirectoryNames:httpOnly });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir//file.html?query#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("other://www.domain.com:123/dir//file.html?query#hash");
		url2 = new URL("other://www.domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.AUTH);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.AUTH);
	});



	it("ignoreEmptyQueries = false", function()
	{
		const opts = options({ ignoreEmptyQueries:false });
		let url1,url2;

		// NOTE :: this is a shallow query comparison
		url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var&#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);

		// NOTE :: this is a shallow query comparison
		url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var&=#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);
	});



	it_searchParamsOnly("ignoreEmptyQueries = true", function()
	{
		const opts = options({ ignoreEmptyQueries:true });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var&#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var&=#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("http://www.domain.com:123/dir/file.html?var=value1&var=value2&=&=#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?=&var=value1&var=value2#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);
	});



	it_searchParamsOnly("ignoreEmptyQueries = function", function()
	{
		const opts = options({ ignoreEmptyQueries:httpOnly });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var&#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var&=#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		// NOTE :: this is a shallow query comparison
		url1 = new URL("other://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("other://www.domain.com:123/dir/file.html?var&#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);

		// NOTE :: this is a shallow query comparison
		url1 = new URL("other://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("other://www.domain.com:123/dir/file.html?var&=#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);
	});



	it("ignoreQueryNames = false", function()
	{
		// NOTE :: this is a shallow query comparison
		const opts = options({ ignoreQueryNames:false, queryNames:["var"] });
		const url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);
	});



	it_searchParamsOnly("ignoreQueryNames = true", function()
	{
		let opts,url1,url2;

		opts = options({ ignoreQueryNames:true, queryNames:["var1"] });
		url1 = new URL("http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2=value#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var2=value#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		opts = options({ ignoreQueryNames:true, queryNames:[/^var\d+$/] });
		url1 = new URL("http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2=value#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);
	});



	it_searchParamsOnly("ignoreQueryNames = function", function()
	{
		const opts = options({ ignoreQueryNames:httpOnly, queryNames:["var"] });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		// NOTE :: this is a shallow query comparison
		url1 = new URL("other://www.domain.com:123/dir/file.html?var#hash");
		url2 = new URL("other://www.domain.com:123/dir/file.html#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);
	});



	it("ignoreQueryOrder = false", function()
	{
		const opts = options({ ignoreQueryOrder:false });
		const url1 = new URL("http://www.domain.com:123/dir/file.html?var2=&var1#hash");
		const url2 = new URL("http://www.domain.com:123/dir/file.html?var1=&var2#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);
	});



	it_searchParamsOnly("ignoreQueryOrder = true", function()
	{
		const opts = options({ ignoreQueryOrder:true });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/file.html?var2=&var1#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var1=&var2#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var2&var1=value1&var1=value2#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("http://www.domain.com:123/dir/file.html?var1=value1&var1=value2&var2#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var2&var1=value2&var1=value1#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);
	});



	it_searchParamsOnly("ignoreQueryOrder = function", function()
	{
		const opts = options({ ignoreQueryOrder:httpOnly });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/file.html?var2=&var1#hash");
		url2 = new URL("http://www.domain.com:123/dir/file.html?var1=&var2#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("other://www.domain.com:123/dir/file.html?var2=&var1#hash");
		url2 = new URL("other://www.domain.com:123/dir/file.html?var1=&var2#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PATHNAME);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PATHNAME);
	});



	it("ignoreWWW = false", function()
	{
		const opts = options();
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("http://domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.DOMAIN);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.DOMAIN);

		url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("http://domain.net:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PROTOCOL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PROTOCOL);

		url1 = new URL("http://www.domain:123/dir/file.html?query#hash");
		url2 = new URL("http://domain:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PROTOCOL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PROTOCOL);
	});



	it("ignoreWWW = true", function()
	{
		const opts = options({ ignoreWWW:true });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("http://domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("http://domain.net:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PROTOCOL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PROTOCOL);

		url1 = new URL("http://www.domain:123/dir/file.html?query#hash");
		url2 = new URL("http://domain:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PROTOCOL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PROTOCOL);

		url1 = new URL("other://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("other://domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);
	});



	it("ignoreWWW = function", function()
	{
		const opts = options({ ignoreWWW:httpOnly });
		let url1,url2;

		url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("http://domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

		url1 = new URL("http://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("http://domain.net:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PROTOCOL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PROTOCOL);

		url1 = new URL("http://www.domain:123/dir/file.html?query#hash");
		url2 = new URL("http://domain:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.PROTOCOL);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.PROTOCOL);

		url1 = new URL("other://www.domain.com:123/dir/file.html?query#hash");
		url2 = new URL("other://domain.com:123/dir/file.html?query#hash");
		expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.DOMAIN);
		expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.DOMAIN);
	});



	describe("in careful profile", function()
	{
		combinations(urlRelation.CAREFUL_PROFILE, "untrusted");
	});



	describe("in common profile", function()
	{
		combinations(urlRelation.COMMON_PROFILE, "trusted_deep");



		it_searchParamsOnly("supports edge cases", function()
		{
			const opts = urlRelation.COMMON_PROFILE;
			let url1,url2;

			url1 = new URL("http://www.domain.com:123/dir/file.html?var2&var1#hash");
			url2 = new URL("http://domain.com:123/dir/file.html?var1&var2#hash");
			expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
			expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

			url1 = new URL("https://www.domain.com:123/dir/file.html?var2&var1#hash");
			url2 = new URL("https://domain.com:123/dir/file.html?var1&var2#hash");
			expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
			expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

			url1 = new URL("mailto:email@domain.com?cc=user%40domain.com&subject=hello+world");
			url2 = new URL("mailto:email@domain.com?subject=hello+world&cc=user%40domain.com");
			expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
			expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

			url1 = new URL("ws://domain.com:123/dir/file.html?var2&var1#hash");
			url2 = new URL("ws://domain.com:123/dir/file.html?var1&var2#hash");
			expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
			expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);

			url1 = new URL("wss://domain.com:123/dir/file.html?var2&var1#hash");
			url2 = new URL("wss://domain.com:123/dir/file.html?var1&var2#hash");
			expect( urlRelation(url1,url2,opts) ).to.equal(urlRelation.ALL);
			expect( urlRelation(url2,url1,opts) ).to.equal(urlRelation.ALL);
		});
	});



	// Simulate an incomplete `URL` implementation that's missing `URLSearchParams`
	describe("in common profile; ignoreEmptyQueries = false, ignoreQueryOrder = false", function()
	{
		combinations( options(urlRelation.COMMON_PROFILE, { ignoreEmptyQueries:false, ignoreQueryOrder:false }), "trusted_shallow" );
	});



	describe(`in default profile`, function()
	{
		combinations(null, "trusted_deep");
	});
});
