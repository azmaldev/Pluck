import * as cheerio from 'cheerio';
import { defaults } from '../config.js';
import { isExternalDomain } from '../utils/normalize.js';

export function extractDomains($: cheerio.CheerioAPI, sourceUrl: string): string[] {
  const results = new Set<string>();
  let sourceHostname = '';

  try {
    sourceHostname = new URL(sourceUrl).hostname;
  } catch {
    return [];
  }

  const seenHrefs = new Set<string>();

  $('a[href]').each((_, el) => {
    if (results.size >= defaults.maxResultsPerField) return false;

    const href = $(el).attr('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    if (seenHrefs.has(href)) return;
    seenHrefs.add(href);

    try {
      const hostname = new URL(href, sourceUrl).hostname;
      if (isExternalDomain(hostname, sourceHostname)) {
        results.add(hostname);
      }
    } catch {}
  });

  $('link[href]').each((_, el) => {
    if (results.size >= defaults.maxResultsPerField) return false;
    const href = $(el).attr('href') || '';
    try {
      const hostname = new URL(href, sourceUrl).hostname;
      if (isExternalDomain(hostname, sourceHostname)) {
        results.add(hostname);
      }
    } catch {}
  });

  return [...results].sort();
}
