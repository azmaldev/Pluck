import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { NamedContact } from '../types.js';
import { defaults } from '../config.js';

export function extractNames($: cheerio.CheerioAPI): NamedContact[] {
  const results: NamedContact[] = [];
  const seen = new Set<string>();

  const add = (c: NamedContact) => {
    if (!c.name && !c.email) return false;
    const key = `${c.name ?? ''}|${c.email ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (results.length >= defaults.maxResultsPerField) return false;
    results.push(c);
    return true;
  };

  const jsonldScripts = $('script[type="application/ld+json"]').toArray();
  for (const script of jsonldScripts) {
    try {
      const parsed = JSON.parse($(script).text());
      const walk = (obj: unknown): void => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(walk); return; }
        const o = obj as Record<string, unknown>;
        const type = (o as Record<string, unknown>)['@type'] as string | undefined;
        if (type === 'Person' || type?.includes('Person')) {
          add({
            name: [o.givenName, o.familyName].filter(Boolean).join(' ') || (o.name as string) || undefined,
            title: (o.jobTitle as string) || undefined,
            email: (o.email as string) || undefined,
            source: 'jsonld',
          });
        }
        for (const val of Object.values(o)) walk(val);
      };
      walk(parsed);
    } catch {}
  }

  const authorMeta = $('meta[name="author"]').attr('content');
  if (authorMeta?.trim()) {
    add({ name: authorMeta.trim(), source: 'meta' });
  }

  const processedElements = new Set<Element>();
  const teamSelectors = ['.team-member', '.staff', '.team', '.people', '[class*="team"]', '[class*="member"]', '[class*="staff"]'];
  for (const sel of teamSelectors) {
    $(sel).each((_, el) => {
      if (processedElements.has(el as Element)) return;
      processedElements.add(el as Element);

      const nameEl = $(el).find('h1, h2, h3, h4, .name, [class*="name"]').first();
      const titleEl = $(el).find('.title, .role, [class*="title"], [class*="role"]').first();
      const emailEl = $(el).find('a[href^="mailto:"]').first();

      const name = nameEl.text().trim();
      const title = titleEl.text().trim();
      const email = emailEl.attr('href')?.replace('mailto:', '').split('?')[0] || '';

      if (name) {
        add({ name, title: title || undefined, email: email || undefined, source: 'structure' });
      }
    });
  }

  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const email = href.replace('mailto:', '').split('?')[0];
    if (!email) return;

    let current = $(el).parent();
    let depth = 0;
    while (current.length && depth < 5) {
      const nearbyName = current.find('h1, h2, h3, h4, strong, .name').first().text().trim();
      const nearbyTitle = current.find('.title, .role, [class*="title"]').first().text().trim();
      if (nearbyName) {
        add({ name: nearbyName, title: nearbyTitle || undefined, email, source: 'proximity' });
        break;
      }
      current = current.parent();
      depth++;
    }
  });

  return results;
}
