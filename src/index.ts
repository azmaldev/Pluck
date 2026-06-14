import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { defaults } from './config.js';
import { scrapeUrl, scrapeHtml } from './scraper.js';
import type { ScrapeResponse } from './types.js';

const app = new Hono();

app.use('/*', cors());

const toggleFields = {
  emails: z.coerce.boolean().optional(),
  phones: z.coerce.boolean().optional(),
  domains: z.coerce.boolean().optional(),
  socials: z.coerce.boolean().optional(),
  meta: z.coerce.boolean().optional(),
  names: z.coerce.boolean().optional(),
};

const toggleFieldsJson = {
  emails: z.boolean().optional(),
  phones: z.boolean().optional(),
  domains: z.boolean().optional(),
  socials: z.boolean().optional(),
  meta: z.boolean().optional(),
  names: z.boolean().optional(),
};

app.get('/', (c) => {
  return c.json({
    name: 'pluck',
    version: '1.0.0',
    description: 'Extract emails, phones, domains, socials, meta, names from any URL',
    endpoints: {
      scrape: 'GET /v1/scrape?url=<url>&emails=true&phones=true',
      extract: 'POST /v1/extract  { "html": "...", "emails": true }',
      batch: 'POST /v1/batch  { "urls": ["...", "..."], "emails": true }',
    },
    docs: 'https://github.com/pluck/pluck',
  });
});

app.get(
  '/v1/scrape',
  zValidator('query', z.object({ url: z.string().url({ message: 'Invalid URL' }), ...toggleFields })),
  async (c) => {
    const query = c.req.valid('query');
    try {
      const result = await scrapeUrl(query);
      return c.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const status = message.startsWith('HTTP ') ? 502 : 400;
      return c.json({ error: message }, status);
    }
  },
);

app.post(
  '/v1/extract',
  zValidator('json', z.object({ html: z.string().min(1, { message: 'HTML is required' }), url: z.string().optional(), ...toggleFieldsJson })),
  (c) => {
    const body = c.req.valid('json');
    try {
      const result = scrapeHtml(body.html, body.url, body);
      return c.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  },
);

app.post(
  '/v1/batch',
  zValidator('json', z.object({
    urls: z.array(z.string().url()).min(1).max(defaults.maxBatchSize, { message: `Max ${defaults.maxBatchSize} URLs per batch` }),
    ...toggleFieldsJson,
  })),
  async (c) => {
    const body = c.req.valid('json');
    const results: (ScrapeResponse | { error: string; url: string })[] = [];

    const concurrency = defaults.batchConcurrency;
    const queue = [...body.urls];

    const worker = async () => {
      while (queue.length > 0) {
        const url = queue.shift()!;
        try {
          const result = await scrapeUrl({ url, ...body } as Parameters<typeof scrapeUrl>[0]);
          results.push(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          results.push({ error: message, url });
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, body.urls.length) }, () => worker());
    await Promise.all(workers);

    return c.json({ results, total: results.length, succeeded: results.filter((r) => 'data' in r).length });
  },
);

const port = parseInt(process.env.PORT || String(defaults.port), 10);

serve({ fetch: app.fetch, port });

console.log(`Pluck running on http://localhost:${port}`);
console.log(`  GET  /v1/scrape?url=<url>&emails=true&phones=true`);
console.log(`  POST /v1/extract (raw HTML)`);
console.log(`  POST /v1/batch  { "urls": ["url1", "url2"], "emails": true }`);
