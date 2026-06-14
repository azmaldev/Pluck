import * as cheerio from 'cheerio';
import { FoundItem } from '../types.js';
import { EMAIL_REGEX, OBFUSCATED_EMAIL_REGEXES } from '../utils/patterns.js';
import { cleanEmail, isValidEmail } from '../utils/normalize.js';
import { defaults } from '../config.js';

export function extractEmails($: cheerio.CheerioAPI): FoundItem[] {
  const results: FoundItem[] = [];

  const seen = new Set<string>();

  const add = (value: string, source: FoundItem['source']) => {
    const cleaned = cleanEmail(value);
    if (!cleaned || seen.has(cleaned) || !isValidEmail(cleaned)) return;
    if (results.length >= defaults.maxResultsPerField) return;
    seen.add(cleaned);
    results.push({ value: cleaned, source });
  };

  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const email = href.replace('mailto:', '').split('?')[0];
    add(email, 'mailto');
  });

  const text = $.text();

  const textMatches = text.match(EMAIL_REGEX) || [];
  for (const m of textMatches) {
    add(m, 'text');
  }

  for (const regex of OBFUSCATED_EMAIL_REGEXES) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const reconstructed = `${match[1]}@${match[2]}.${match[3]}`;
      add(reconstructed, 'obfuscated');
    }
  }

  const jsonldScripts = $('script[type="application/ld+json"]').toArray();
  for (const script of jsonldScripts) {
    try {
      const parsed = JSON.parse($(script).text());
      const extractNestedEmails = (obj: unknown): void => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(extractNestedEmails); return; }
        const o = obj as Record<string, unknown>;
        for (const val of Object.values(o)) {
          if (typeof val === 'string' && val.includes('@')) {
            add(val, 'jsonld');
          }
          extractNestedEmails(val);
        }
      };
      extractNestedEmails(parsed);
    } catch {}
  }

  return results;
}
