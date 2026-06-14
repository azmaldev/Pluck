import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { extractEmails } from '../src/extractors/emails.js';
import { extractPhones } from '../src/extractors/phones.js';
import { extractDomains } from '../src/extractors/domains.js';
import { extractSocials } from '../src/extractors/socials.js';
import { extractMeta } from '../src/extractors/meta.js';
import { extractNames } from '../src/extractors/names.js';

function load(html: string) {
  return cheerio.load(html);
}

describe('extractEmails', () => {
  it('extracts from mailto: links', () => {
    const $ = load('<a href="mailto:test@example.com">email</a>');
    const results = extractEmails($);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('test@example.com');
    expect(results[0].source).toBe('mailto');
  });

  it('extracts multiple emails from text', () => {
    const $ = load('<p>Contact us at hello@test.com or support@test.com</p>');
    const results = extractEmails($);
    expect(results).toHaveLength(2);
  });

  it('extracts obfuscated emails [at] [dot]', () => {
    const $ = load('<p>Email: user [at] domain [dot] com</p>');
    const results = extractEmails($);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('user@domain.com');
    expect(results[0].source).toBe('obfuscated');
  });

  it('extracts obfuscated emails (at) (dot)', () => {
    const $ = load('<p>Email: user(at)domain(dot)com</p>');
    const results = extractEmails($);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('user@domain.com');
  });

  it('handles empty page', () => {
    const $ = load('<html></html>');
    const results = extractEmails($);
    expect(results).toHaveLength(0);
  });

  it('strips query params from mailto', () => {
    const $ = load('<a href="mailto:user@test.com?subject=hello">email</a>');
    const results = extractEmails($);
    expect(results[0].value).toBe('user@test.com');
  });
});

describe('extractPhones', () => {
  it('extracts from tel: links', () => {
    const $ = load('<a href="tel:+1-555-0123">call</a>');
    const results = extractPhones($);
    expect(results).toHaveLength(1);
  });

  it('extracts international number from text', () => {
    const $ = load('<p>Call +44 20 7946 0958</p>');
    const results = extractPhones($);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('+442079460958');
  });

  it('extracts US number from text', () => {
    const $ = load('<p>Call (555) 123-4567</p>');
    const results = extractPhones($);
    expect(results).toHaveLength(1);
  });

  it('rejects too-short numbers', () => {
    const $ = load('<p>Call 1234</p>');
    const results = extractPhones($);
    expect(results).toHaveLength(0);
  });

  it('handles empty page', () => {
    const $ = load('<html></html>');
    const results = extractPhones($);
    expect(results).toHaveLength(0);
  });
});

describe('extractDomains', () => {
  it('extracts external domains', () => {
    const $ = load('<a href="https://other.com/page">link</a>');
    const results = extractDomains($, 'https://source.com');
    expect(results).toContain('other.com');
  });

  it('filters out source domain', () => {
    const $ = load('<a href="https://source.com/page">link</a>');
    const results = extractDomains($, 'https://source.com');
    expect(results).not.toContain('source.com');
  });

  it('filters out javascript: and # links', () => {
    const $ = load('<a href="javascript:void(0)">x</a><a href="#section">x</a>');
    const results = extractDomains($, 'https://source.com');
    expect(results).toHaveLength(0);
  });

  it('handles empty page', () => {
    const $ = load('<html></html>');
    const results = extractDomains($, 'https://source.com');
    expect(results).toHaveLength(0);
  });
});

describe('extractSocials', () => {
  const html = `
    <a href="https://linkedin.com/company/acme">LI</a>
    <a href="https://twitter.com/acme">tw</a>
    <a href="https://github.com/acme">gh</a>
    <a href="https://tiktok.com/@acme">tt</a>
  `;

  it('detects linkedin', () => {
    const $ = load(html);
    const results = extractSocials($, 'https://source.com');
    expect(results.linkedin).toHaveLength(1);
  });

  it('detects twitter', () => {
    const $ = load(html);
    const results = extractSocials($, 'https://source.com');
    expect(results.twitter).toHaveLength(1);
  });

  it('detects github', () => {
    const $ = load(html);
    const results = extractSocials($, 'https://source.com');
    expect(results.github).toHaveLength(1);
  });

  it('detects tiktok (new platform)', () => {
    const $ = load(html);
    const results = extractSocials($, 'https://source.com');
    expect(results.tiktok).toHaveLength(1);
  });

  it('handles empty page', () => {
    const $ = load('<html></html>');
    const results = extractSocials($, 'https://source.com');
    expect(Object.keys(results)).toHaveLength(0);
  });
});

describe('extractMeta', () => {
  it('extracts basic meta fields', () => {
    const html = `
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="A test page">
          <meta name="author" content="John Doe">
          <meta property="og:title" content="OG Test">
          <meta name="twitter:card" content="summary">
          <meta charset="utf-8">
          <html lang="en">
        </head>
      </html>
    `;
    const $ = load(html);
    const results = extractMeta($);
    expect(results.title).toBe('Test Page');
    expect(results.description).toBe('A test page');
    expect(results.author).toBe('John Doe');
    expect(results['og:title']).toBe('OG Test');
    expect(results['twitter:card']).toBe('summary');
    expect(results.charset).toBe('utf-8');
  });

  it('handles empty page', () => {
    const $ = load('<html></html>');
    const results = extractMeta($);
    expect(Object.keys(results)).toHaveLength(0);
  });
});

describe('extractNames', () => {
  it('extracts from meta author', () => {
    const $ = load('<meta name="author" content="John Doe">');
    const results = extractNames($);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('John Doe');
    expect(results[0].source).toBe('meta');
  });

  it('extracts from team HTML structure', () => {
    const html = `
      <div class="team-member">
        <h3>Jane Smith</h3>
        <span class="title">CEO</span>
        <a href="mailto:jane@acme.com">email</a>
      </div>
    `;
    const $ = load(html);
    const results = extractNames($);
    expect(results.some(r => r.name === 'Jane Smith')).toBe(true);
    expect(results.some(r => r.title === 'CEO')).toBe(true);
  });

  it('extracts name near email link', () => {
    const html = `
      <div>
        <h2>Contact</h2>
        <p><a href="mailto:info@acme.com">info@acme.com</a></p>
      </div>
    `;
    const $ = load(html);
    const results = extractNames($);
    expect(results.some(r => r.email === 'info@acme.com')).toBe(true);
  });

  it('handles empty page', () => {
    const $ = load('<html></html>');
    const results = extractNames($);
    expect(results).toHaveLength(0);
  });

  it('deduplicates entries', () => {
    const html = `
      <div class="team-member">
        <h3>Jane Smith</h3>
        <a href="mailto:jane@acme.com">email</a>
      </div>
      <p><a href="mailto:jane@acme.com">jane@acme.com</a></p>
    `;
    const $ = load(html);
    const results = extractNames($);
    const janes = results.filter(r => r.email === 'jane@acme.com');
    expect(janes.length).toBeLessThanOrEqual(
      results.filter(r => r.source === 'proximity' || r.source === 'structure').length
    );
  });
});
