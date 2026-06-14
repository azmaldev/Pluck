export const EMAIL_REGEX = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/g;

export const OBFUSCATED_EMAIL_REGEXES = [
  /([a-zA-Z0-9._%+-]+)\s*\[?at\]?\s*([a-zA-Z0-9.-]+)\s*\[?dot\]?\s*([a-zA-Z]{2,})/gi,
  /([a-zA-Z0-9._%+-]+)\s*\(at\)\s*([a-zA-Z0-9.-]+)\s*\(dot\)\s*([a-zA-Z]{2,})/gi,
  /([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*dot\s*([a-zA-Z]{2,})/gi,
  /([a-zA-Z0-9._%+-]+)\s*\[@\]\s*([a-zA-Z0-9.-]+)\s*\[.\]+\s*([a-zA-Z]{2,})/gi,
];

export const PHONE_PATTERNS = [
  /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
  /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
];
