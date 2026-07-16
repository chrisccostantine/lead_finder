import { env } from '../config/env.js';

export interface PageSpeedMetrics {
  available: boolean;
  performanceScore?: number;
  accessibilityScore?: number;
  bestPracticesScore?: number;
  seoScore?: number;
  largestContentfulPaintMs?: number;
  interactionToNextPaintMs?: number;
  cumulativeLayoutShift?: number;
  firstContentfulPaintMs?: number;
  totalBlockingTimeMs?: number;
  tapTargetsScore?: number;
  fontSizeScore?: number;
  error?: string;
}

const numeric = (audits: Record<string, { numericValue?: number }> | undefined, key: string) => audits?.[key]?.numericValue;
const auditScore = (audits: Record<string, { score?: number | null }> | undefined, key: string) => audits?.[key]?.score == null ? undefined : Math.round((audits[key]?.score ?? 0) * 100);

export async function runPageSpeed(url: string): Promise<PageSpeedMetrics> {
  if (!env.ENABLE_PAGESPEED || !env.GOOGLE_PAGESPEED_API_KEY) return { available: false, error: 'PageSpeed is not configured.' };
  try {
    const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('strategy', 'mobile');
    endpoint.searchParams.set('key', env.GOOGLE_PAGESPEED_API_KEY);
    for (const category of ['performance', 'accessibility', 'best-practices', 'seo']) endpoint.searchParams.append('category', category);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(25_000) });
    if (!response.ok) throw new Error(`PageSpeed returned HTTP ${response.status}.`);
    const payload = await response.json() as { lighthouseResult?: { categories?: Record<string, { score?: number | null }>; audits?: Record<string, { numericValue?: number; score?: number | null }> } };
    const result = payload.lighthouseResult;
    if (!result) throw new Error('PageSpeed did not return Lighthouse results.');
    const score = (key: string) => result.categories?.[key]?.score == null ? undefined : Math.round((result.categories[key]?.score ?? 0) * 100);
    return {
      available: true,
      performanceScore: score('performance'), accessibilityScore: score('accessibility'), bestPracticesScore: score('best-practices'), seoScore: score('seo'),
      largestContentfulPaintMs: numeric(result.audits, 'largest-contentful-paint'), interactionToNextPaintMs: numeric(result.audits, 'interaction-to-next-paint'), cumulativeLayoutShift: numeric(result.audits, 'cumulative-layout-shift'), firstContentfulPaintMs: numeric(result.audits, 'first-contentful-paint'), totalBlockingTimeMs: numeric(result.audits, 'total-blocking-time'),
      tapTargetsScore: auditScore(result.audits, 'tap-targets'), fontSizeScore: auditScore(result.audits, 'font-size'),
    };
  } catch (error) {
    return { available: false, error: error instanceof Error ? error.message : 'PageSpeed analysis failed.' };
  }
}
