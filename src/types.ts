export interface ScrapeQuery {
  url: string;
  emails?: boolean;
  phones?: boolean;
  domains?: boolean;
  socials?: boolean;
  meta?: boolean;
  names?: boolean;
}

export interface ExtractQuery {
  html: string;
  url?: string;
  emails?: boolean;
  phones?: boolean;
  domains?: boolean;
  socials?: boolean;
  meta?: boolean;
}

export interface FoundItem {
  value: string;
  source: 'mailto' | 'tel' | 'text' | 'meta' | 'obfuscated' | 'jsonld';
}

export interface ExtractedData {
  emails?: FoundItem[];
  phones?: FoundItem[];
  domains?: string[];
  socials?: Record<string, string[]>;
  meta?: Record<string, string>;
  names?: NamedContact[];
}

export interface ScrapeResponse {
  url: string;
  scraped_at: string;
  data: ExtractedData;
  stats: Record<string, number>;
}

export interface NamedContact {
  name?: string;
  title?: string;
  email?: string;
  source: 'jsonld' | 'meta' | 'proximity' | 'structure';
}

export interface BatchQuery {
  urls: string[];
  emails?: boolean;
  phones?: boolean;
  domains?: boolean;
  socials?: boolean;
  meta?: boolean;
  names?: boolean;
}
