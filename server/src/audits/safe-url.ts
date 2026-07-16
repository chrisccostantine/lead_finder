import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { env } from '../config/env.js';

const blockedNames = new Set(['localhost', 'localhost.localdomain', 'metadata.google.internal', 'metadata', 'instance-data']);

function isPrivateIpv4(address: string) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a = 0, b = 0] = octets;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

export function isBlockedAddress(address: string) {
  const normalized = address.toLowerCase().split('%')[0] ?? '';
  const version = isIP(normalized);
  if (version === 4) return isPrivateIpv4(normalized);
  if (version !== 6) return true;
  if (normalized === '::' || normalized === '::1' || normalized.startsWith('::ffff:') || normalized.startsWith('64:ff9b:') || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('fec') || normalized.startsWith('fed') || normalized.startsWith('fee') || normalized.startsWith('fef') || normalized.startsWith('ff')) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? isPrivateIpv4(mapped) : false;
}

export async function validatePublicUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('The website URL is invalid.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS website URLs are allowed.');
  if (url.username || url.password) throw new Error('Website URLs containing credentials are not allowed.');
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname || blockedNames.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.lan')) throw new Error('Internal network addresses are not allowed.');
  let addresses: Array<{ address: string }>;
  try { addresses = await lookup(hostname, { all: true, verbatim: true }); } catch { throw new Error('The website hostname could not be resolved.'); }
  if (!addresses.length || addresses.some(({ address }) => isBlockedAddress(address))) throw new Error('The website resolves to a blocked or private network address.');
  return url;
}

export interface SafeFetchResult {
  body: string;
  status: number;
  url: string;
  headers: Record<string, string>;
  durationMs: number;
  redirectCount: number;
  byteLength: number;
}

export async function safeFetch(input: string, options: { requireHtml?: boolean; maxBytes?: number } = {}): Promise<SafeFetchResult> {
  let url = await validatePublicUrl(input);
  const started = Date.now();
  let redirectCount = 0;
  while (true) {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(env.AUDIT_FETCH_TIMEOUT_MS),
      headers: { Accept: options.requireHtml ? 'text/html,application/xhtml+xml' : '*/*', 'User-Agent': 'ScaloraWebsiteAudit/1.0 (+internal review tool)' },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('The website returned a redirect without a destination.');
      if (++redirectCount > 5) throw new Error('The website redirected too many times.');
      await response.body?.cancel();
      url = await validatePublicUrl(new URL(location, url).toString());
      continue;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (options.requireHtml && !contentType.toLowerCase().includes('text/html') && !contentType.toLowerCase().includes('application/xhtml+xml')) throw new Error('The website did not return an HTML page.');
    const declaredSize = Number(response.headers.get('content-length') ?? 0);
    const maxBytes = options.maxBytes ?? env.AUDIT_MAX_RESPONSE_BYTES;
    if (declaredSize > maxBytes) throw new Error('The website response is too large to audit safely.');
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let byteLength = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        byteLength += value.byteLength;
        if (byteLength > maxBytes) { await reader.cancel(); throw new Error('The website response exceeded the audit size limit.'); }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { body: new TextDecoder().decode(bytes), status: response.status, url: url.toString(), headers: Object.fromEntries(response.headers.entries()), durationMs: Date.now() - started, redirectCount, byteLength };
  }
}
