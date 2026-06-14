import * as cheerio from 'cheerio';
import { defaults } from './config.js';
import { extractEmails } from './extractors/emails.js';
import { extractPhones } from './extractors/phones.js';
import { extractDomains } from './extractors/domains.js';
import { extractSocials } from './extractors/socials.js';
import { extractMeta } from './extractors/meta.js';
import { extractNames } from './extractors/names.js';
import type { ScrapeQuery, ExtractedData, ScrapeResponse, BatchQuery } from './types.js';

export async function fetchAndParse(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), defaults.fetchTimeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': defaults.userAgent,
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function parseHTML(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}

export function extractData(
  $: cheerio.CheerioAPI,
  sourceUrl: string,
  toggles: Partial<ScrapeQuery>,
): ExtractedData {
  const data: ExtractedData = {};

  if (toggles.emails !== false) {
    data.emails = extractEmails($);
  }

  if (toggles.phones !== false) {
    data.phones = extractPhones($);
  }

  if (toggles.domains !== false) {
    data.domains = extractDomains($, sourceUrl);
  }

  if (toggles.socials !== false) {
    data.socials = extractSocials($, sourceUrl);
  }

  if (toggles.meta !== false) {
    data.meta = extractMeta($);
  }

  if (toggles.names !== false) {
    data.names = extractNames($);
  }

  return data;
}

export function buildResponse(
  url: string,
  data: ExtractedData,
): ScrapeResponse {
  const stats: Record<string, number> = {};

  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      stats[key] = val.length;
    } else if (typeof val === 'object' && val !== null) {
      stats[key] = Object.keys(val).length;
    }
  }

  return {
    url,
    scraped_at: new Date().toISOString(),
    data,
    stats,
  };
}

export async function scrapeUrl(query: ScrapeQuery): Promise<ScrapeResponse> {
  const html = await fetchAndParse(query.url);
  const $ = parseHTML(html);
  const data = extractData($, query.url, query);
  return buildResponse(query.url, data);
}

export function scrapeHtml(html: string, url: string | undefined, toggles: Partial<ScrapeQuery>): ScrapeResponse {
  const $ = parseHTML(html);
  const sourceUrl = url || 'https://unknown';
  const data = extractData($, sourceUrl, toggles);
  return buildResponse(sourceUrl, data);
}
