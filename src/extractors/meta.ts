import * as cheerio from 'cheerio';

export function extractMeta($: cheerio.CheerioAPI): Record<string, string> {
  const meta: Record<string, string> = {};

  const title = $('title').first().text().trim();
  if (title) meta.title = title;

  const description = $('meta[name="description"]').attr('content');
  if (description) meta.description = description.trim();

  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) meta.canonical = canonical.trim();

  const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content')?.split('charset=')[1];
  if (charset) meta.charset = charset.trim();

  const lang = $('html').attr('lang');
  if (lang) meta.lang = lang.trim();

  const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || $('link[rel="apple-touch-icon"]').attr('href');
  if (favicon) meta.favicon = favicon.trim();

  const author = $('meta[name="author"]').attr('content');
  if (author) meta.author = author.trim();

  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) meta.keywords = keywords.trim();

  const ogAttrs = ['title', 'description', 'image', 'url', 'type', 'site_name', 'locale'];
  for (const attr of ogAttrs) {
    const val = $(`meta[property="og:${attr}"]`).attr('content');
    if (val) meta[`og:${attr}`] = val.trim();
  }

  const twitterAttrs = ['card', 'site', 'creator', 'title', 'description', 'image'];
  for (const attr of twitterAttrs) {
    const val = $(`meta[name="twitter:${attr}"]`).attr('content') || $(`meta[property="twitter:${attr}"]`).attr('content');
    if (val) meta[`twitter:${attr}`] = val.trim();
  }

  return meta;
}
