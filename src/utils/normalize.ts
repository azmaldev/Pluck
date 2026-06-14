export function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(raw: string): string {
  const cleaned = raw.trim();
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  if (cleaned.startsWith('+')) return '+' + digits;
  return digits;
}

export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email);
}

export function isExternalDomain(hostname: string, sourceHostname: string): boolean {
  if (!hostname || hostname === sourceHostname) return false;
  if (hostname.endsWith('.' + sourceHostname)) return false;
  return true;
}
