"use strict";
const {components, componentSequence} = require("../lib/components");
const {describe, it} = require("mocha");
const excludeComponents = require("../lib/excludeComponents");
const {expect} = require("chai");

const
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
} = components;



describe("excludeComponents()", () =>
{
	it("can accept empty input", () =>
	{
		expect(excludeComponents([])).to.deep.equal(componentSequence);
		expect(excludeComponents()).to.deep.equal(componentSequence);
	});



	it("can slice the sequence", () => expect(excludeComponents([], HOST)).to.deep.equal(
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
		HOST
	]));



	it("can exclude PROTOCOL", () => expect(excludeComponents([PROTOCOL])).to.deep.equal(
	[
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
	]));



	it(`can exclude USERNAME and its parent "group"`, () => expect(excludeComponents([USERNAME])).to.deep.equal(
	[
		PROTOCOL,
		PASSWORD,
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
	]));



	it(`can exclude PASSWORD and its parent "group"`, () => expect(excludeComponents([PASSWORD])).to.deep.equal(
	[
		PROTOCOL,
		USERNAME,
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
	]));



	it(`can exclude TLD and its parent "groups"`, () => expect(excludeComponents([TLD])).to.deep.equal(
	[
		PROTOCOL,
		USERNAME,
		PASSWORD,
		AUTH,
		DOMAIN,
		SUBDOMAIN,
		PORT,
		SEGMENTS,
		FILENAME,
		PATHNAME,
		SEARCH,
		PATH,
		HASH
	]));



	it(`can exclude DOMAIN and its parent "groups"`, () => expect(excludeComponents([DOMAIN])).to.deep.equal(
	[
		PROTOCOL,
		USERNAME,
		PASSWORD,
		AUTH,
		TLD,
		SUBDOMAIN,
		PORT,
		SEGMENTS,
		FILENAME,
		PATHNAME,
		SEARCH,
		PATH,
		HASH
	]));



	it(`can exclude SUBDOMAIN and its parent "groups"`, () => expect(excludeComponents([SUBDOMAIN])).to.deep.equal(
	[
		PROTOCOL,
		USERNAME,
		PASSWORD,
		AUTH,
		TLD,
		DOMAIN,
		PORT,
		SEGMENTS,
		FILENAME,
		PATHNAME,
		SEARCH,
		PATH,
		HASH
	]));



	it(`can exclude PORT and its parent "group"`, () => expect(excludeComponents([PORT])).to.deep.equal(
	[
		PROTOCOL,
		USERNAME,
		PASSWORD,
		AUTH,
		TLD,
		DOMAIN,
		SUBDOMAIN,
		HOSTNAME,
		SEGMENTS,
		FILENAME,
		PATHNAME,
		SEARCH,
		PATH,
		HASH
	]));



	it(`can exclude SEGMENTS and its parent "groups"`, () => expect(excludeComponents([SEGMENTS])).to.deep.equal(
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
		FILENAME,
		SEARCH,
		HASH
	]));



	it(`can exclude FILENAME and its parent "groups"`, () => expect(excludeComponents([FILENAME])).to.deep.equal(
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
		SEARCH,
		HASH
	]));



	it(`can exclude SEARCH and its parent "group"`, () => expect(excludeComponents([SEARCH])).to.deep.equal(
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
		HASH
	]));



	it("can exclude HASH", () => expect(excludeComponents([HASH])).to.deep.equal(
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
		PATH
	]));



	describe(`AUTH "group"`, () =>
	{
		const expected =
		[
			PROTOCOL,
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



		it("has all of its components excluded", () =>
		{
			expect(excludeComponents([AUTH])).to.deep.equal(expected);
		});



		it("can overlap its components", () =>
		{
			expect(excludeComponents([AUTH, PASSWORD, USERNAME])).to.deep.equal(expected);
		});
	});



	describe(`HOST "group"`, () =>
	{
		const expected =
		[
			PROTOCOL,
			USERNAME,
			PASSWORD,
			AUTH,
			SEGMENTS,
			FILENAME,
			PATHNAME,
			SEARCH,
			PATH,
			HASH
		];



		it("has all of its components excluded", () =>
		{
			expect(excludeComponents([HOST])).to.deep.equal(expected);
		});



		it("can overlap its components", () =>
		{
			expect(excludeComponents([DOMAIN, HOST, HOSTNAME, PORT, SUBDOMAIN, TLD])).to.deep.equal(expected);
		});
	});



	describe(`HOSTNAME "group"`, () =>
	{
		const expected =
		[
			PROTOCOL,
			USERNAME,
			PASSWORD,
			AUTH,
			PORT,
			SEGMENTS,
			FILENAME,
			PATHNAME,
			SEARCH,
			PATH,
			HASH
		];



		it("has all of its components excluded", () =>
		{
			expect(excludeComponents([HOSTNAME])).to.deep.equal(expected);
		});



		it("can overlap its components", () =>
		{
			expect(excludeComponents([DOMAIN, HOSTNAME, SUBDOMAIN, TLD])).to.deep.equal(expected);
		});
	});



	describe(`PATH "group"`, () =>
	{
		const expected =
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
			HASH
		];



		it("has all of its components excluded", () =>
		{
			expect(excludeComponents([PATH])).to.deep.equal(expected);
		});



		it("can overlap its components", () =>
		{
			expect(excludeComponents([FILENAME, PATH, PATHNAME, SEARCH, SEGMENTS])).to.deep.equal(expected);
		});
	});



	describe(`PATHNAME "group"`, () =>
	{
		const expected =
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
			SEARCH,
			HASH
		];



		it("has all of its components excluded", () =>
		{
			expect(excludeComponents([PATHNAME])).to.deep.equal(expected);
		});



		it("can overlap its components", () =>
		{
			expect(excludeComponents([FILENAME, PATHNAME, SEGMENTS])).to.deep.equal(expected);
		});
	});
});
