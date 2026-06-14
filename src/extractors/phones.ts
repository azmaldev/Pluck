import * as cheerio from 'cheerio';
import { FoundItem } from '../types.js';
import { PHONE_PATTERNS } from '../utils/patterns.js';
import { normalizePhone } from '../utils/normalize.js';
import { defaults } from '../config.js';

export function extractPhones($: cheerio.CheerioAPI): FoundItem[] {
  const results: FoundItem[] = [];
  const seen = new Set<string>();

  const add = (value: string, source: FoundItem['source']) => {
    const normalized = normalizePhone(value);
    if (!normalized || seen.has(normalized)) return;
    if (results.length >= defaults.maxResultsPerField) return;
    seen.add(normalized);
    results.push({ value: normalized, source });
  };

  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const phone = href.replace('tel:', '').split('?')[0];
    add(decodeURIComponent(phone), 'tel');
  });

  const text = $.text();

  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern) || [];
    for (const m of matches) {
      add(m, 'text');
    }
  }

  const jsonldScripts = $('script[type="application/ld+json"]').toArray();
  for (const script of jsonldScripts) {
    try {
      const parsed = JSON.parse($(script).text());
      const extractNestedPhones = (obj: unknown): void => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(extractNestedPhones); return; }
        const o = obj as Record<string, unknown>;
        for (const [key, val] of Object.entries(o)) {
          if (typeof val === 'string' && (key.toLowerCase().includes('phone') || key.toLowerCase().includes('telephone'))) {
            add(val, 'jsonld');
          }
          extractNestedPhones(val);
        }
      };
      extractNestedPhones(parsed);
    } catch {}
  }

  return results;
}
