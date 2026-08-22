import createSequence from '../src/createSequence.ts';
import { describe, expect, it } from 'vitest';
import { URL_COMPONENT_SEQUENCE, URLComponent } from '../src/components.ts';

it('can accept empty exclusions', () =>
  expect(createSequence([], URLComponent.HASH)).toEqual(URL_COMPONENT_SEQUENCE));

it('can slice the sequence', () =>
  expect(createSequence([], URLComponent.HOST)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.PORT,
    URLComponent.HOST,
  ]));

it('can exclude URLComponent.PROTOCOL', () =>
  expect(createSequence([URLComponent.PROTOCOL], URLComponent.HASH)).toEqual([
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.PORT,
    URLComponent.HOST,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.SEARCH,
    URLComponent.PATH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.USERNAME and its parent "group"`, () =>
  expect(createSequence([URLComponent.USERNAME], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.PASSWORD,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.PORT,
    URLComponent.HOST,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.SEARCH,
    URLComponent.PATH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.PASSWORD and its parent "group"`, () =>
  expect(createSequence([URLComponent.PASSWORD], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.PORT,
    URLComponent.HOST,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.SEARCH,
    URLComponent.PATH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.TLD and its parent "groups"`, () =>
  expect(createSequence([URLComponent.TLD], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.PORT,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.SEARCH,
    URLComponent.PATH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.DOMAIN and its parent "groups"`, () =>
  expect(createSequence([URLComponent.DOMAIN], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.SUBDOMAIN,
    URLComponent.PORT,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.SEARCH,
    URLComponent.PATH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.SUBDOMAIN and its parent "groups"`, () =>
  expect(createSequence([URLComponent.SUBDOMAIN], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.PORT,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.SEARCH,
    URLComponent.PATH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.PORT and its parent "group"`, () =>
  expect(createSequence([URLComponent.PORT], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.SEARCH,
    URLComponent.PATH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.SEGMENTS and its parent "groups"`, () =>
  expect(createSequence([URLComponent.SEGMENTS], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.PORT,
    URLComponent.HOST,
    URLComponent.FILENAME,
    URLComponent.SEARCH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.FILENAME and its parent "groups"`, () =>
  expect(createSequence([URLComponent.FILENAME], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.PORT,
    URLComponent.HOST,
    URLComponent.SEGMENTS,
    URLComponent.SEARCH,
    URLComponent.HASH,
  ]));

it(`can exclude URLComponent.SEARCH and its parent "group"`, () =>
  expect(createSequence([URLComponent.SEARCH], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.PORT,
    URLComponent.HOST,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.HASH,
  ]));

it('can exclude URLComponent.HASH', () =>
  expect(createSequence([URLComponent.HASH], URLComponent.HASH)).toEqual([
    URLComponent.PROTOCOL,
    URLComponent.USERNAME,
    URLComponent.PASSWORD,
    URLComponent.AUTH,
    URLComponent.TLD,
    URLComponent.DOMAIN,
    URLComponent.SUBDOMAIN,
    URLComponent.HOSTNAME,
    URLComponent.PORT,
    URLComponent.HOST,
    URLComponent.SEGMENTS,
    URLComponent.FILENAME,
    URLComponent.PATHNAME,
    URLComponent.SEARCH,
    URLComponent.PATH,
  ]));

describe('Component "group"', () => {
  describe('URLComponent.AUTH', () => {
    const EXPECTED = [
      URLComponent.PROTOCOL,
      URLComponent.TLD,
      URLComponent.DOMAIN,
      URLComponent.SUBDOMAIN,
      URLComponent.HOSTNAME,
      URLComponent.PORT,
      URLComponent.HOST,
      URLComponent.SEGMENTS,
      URLComponent.FILENAME,
      URLComponent.PATHNAME,
      URLComponent.SEARCH,
      URLComponent.PATH,
      URLComponent.HASH,
    ];

    it('has all of its components excluded', () =>
      expect(createSequence([URLComponent.AUTH], URLComponent.HASH)).toEqual(EXPECTED));

    it('can overlap its components', () =>
      expect(
        createSequence(
          [URLComponent.AUTH, URLComponent.PASSWORD, URLComponent.USERNAME],
          URLComponent.HASH
        )
      ).toEqual(EXPECTED));
  });

  describe('URLComponent.HOST', () => {
    const EXPECTED = [
      URLComponent.PROTOCOL,
      URLComponent.USERNAME,
      URLComponent.PASSWORD,
      URLComponent.AUTH,
      URLComponent.SEGMENTS,
      URLComponent.FILENAME,
      URLComponent.PATHNAME,
      URLComponent.SEARCH,
      URLComponent.PATH,
      URLComponent.HASH,
    ];

    it('has all of its components excluded', () =>
      expect(createSequence([URLComponent.HOST], URLComponent.HASH)).toEqual(EXPECTED));

    it('can overlap its components', () =>
      expect(
        createSequence(
          [
            URLComponent.DOMAIN,
            URLComponent.HOST,
            URLComponent.HOSTNAME,
            URLComponent.PORT,
            URLComponent.SUBDOMAIN,
            URLComponent.TLD,
          ],
          URLComponent.HASH
        )
      ).toEqual(EXPECTED));
  });

  describe('URLComponent.HOSTNAME', () => {
    const EXPECTED = [
      URLComponent.PROTOCOL,
      URLComponent.USERNAME,
      URLComponent.PASSWORD,
      URLComponent.AUTH,
      URLComponent.PORT,
      URLComponent.SEGMENTS,
      URLComponent.FILENAME,
      URLComponent.PATHNAME,
      URLComponent.SEARCH,
      URLComponent.PATH,
      URLComponent.HASH,
    ];

    it('has all of its components excluded', () =>
      expect(createSequence([URLComponent.HOSTNAME], URLComponent.HASH)).toEqual(EXPECTED));

    it('can overlap its components', () =>
      expect(
        createSequence(
          [URLComponent.DOMAIN, URLComponent.HOSTNAME, URLComponent.SUBDOMAIN, URLComponent.TLD],
          URLComponent.HASH
        )
      ).toEqual(EXPECTED));
  });

  describe('URLComponent.PATH', () => {
    const EXPECTED = [
      URLComponent.PROTOCOL,
      URLComponent.USERNAME,
      URLComponent.PASSWORD,
      URLComponent.AUTH,
      URLComponent.TLD,
      URLComponent.DOMAIN,
      URLComponent.SUBDOMAIN,
      URLComponent.HOSTNAME,
      URLComponent.PORT,
      URLComponent.HOST,
      URLComponent.HASH,
    ];

    it('has all of its components excluded', () =>
      expect(createSequence([URLComponent.PATH], URLComponent.HASH)).toEqual(EXPECTED));

    it('can overlap its components', () =>
      expect(
        createSequence(
          [
            URLComponent.FILENAME,
            URLComponent.PATH,
            URLComponent.PATHNAME,
            URLComponent.SEARCH,
            URLComponent.SEGMENTS,
          ],
          URLComponent.HASH
        )
      ).toEqual(EXPECTED));
  });

  describe('URLComponent.PATHNAME', () => {
    const EXPECTED = [
      URLComponent.PROTOCOL,
      URLComponent.USERNAME,
      URLComponent.PASSWORD,
      URLComponent.AUTH,
      URLComponent.TLD,
      URLComponent.DOMAIN,
      URLComponent.SUBDOMAIN,
      URLComponent.HOSTNAME,
      URLComponent.PORT,
      URLComponent.HOST,
      URLComponent.SEARCH,
      URLComponent.HASH,
    ];

    it('has all of its components excluded', () =>
      expect(createSequence([URLComponent.PATHNAME], URLComponent.HASH)).toEqual(EXPECTED));

    it('can overlap its components', () =>
      expect(
        createSequence(
          [URLComponent.FILENAME, URLComponent.PATHNAME, URLComponent.SEGMENTS],
          URLComponent.HASH
        )
      ).toEqual(EXPECTED));
  });
});
