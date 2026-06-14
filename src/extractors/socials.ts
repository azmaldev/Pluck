import * as cheerio from 'cheerio';
import { socialPlatforms, defaults } from '../config.js';

export function extractSocials($: cheerio.CheerioAPI, sourceUrl: string): Record<string, string[]> {
  const results: Record<string, string[]> = {};
  const seen = new Set<string>();

  $('a[href]').each((_, el) => {
    if (seen.size >= defaults.maxResultsPerField) return false;

    const href = $(el).attr('href') || '';
    if (!href) return;

    let resolved: string;
    try {
      resolved = new URL(href, sourceUrl).href;
    } catch {
      return;
    }

    if (seen.has(resolved)) return;
    seen.add(resolved);

    for (const [platform, patterns] of Object.entries(socialPlatforms)) {
      for (const pattern of patterns) {
        if (pattern.test(resolved)) {
          (results[platform] ??= []).push(resolved);
          break;
        }
      }
    }
  });

  for (const key of Object.keys(results)) {
    results[key] = [...new Set(results[key])];
  }

  return results;
}
