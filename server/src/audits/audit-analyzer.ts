import { runPageSpeed } from './pagespeed.js';
import { safeFetch } from './safe-url.js';

export type AuditCategory = 'TECHNICAL' | 'PERFORMANCE' | 'SEO' | 'CONVERSION' | 'MOBILE';
export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface AuditIssue { category: AuditCategory; severity: AuditSeverity; title: string; description: string; recommendation: string }
export interface AuditOutput {
  overallScore: number; technicalScore: number; performanceScore: number; seoScore: number; conversionScore: number; mobileScore: number;
  strengths: string[]; problems: AuditIssue[]; recommendedActions: string[]; rawMetrics: Record<string, unknown>;
}

const percent = (checks: boolean[]) => Math.round(100 * checks.filter(Boolean).length / Math.max(1, checks.length));
export function calculateAuditScores(input: { technical: boolean[]; performance: number; seo: boolean[]; conversion: boolean[]; mobile: boolean[] }) {
  const technicalScore = percent(input.technical);
  const performanceScore = Math.max(0, Math.min(100, Math.round(input.performance)));
  const seoScore = percent(input.seo);
  const conversionScore = percent(input.conversion);
  const mobileScore = percent(input.mobile);
  const overallScore = Math.round(technicalScore * .25 + performanceScore * .2 + seoScore * .2 + conversionScore * .2 + mobileScore * .15);
  return { overallScore, technicalScore, performanceScore, seoScore, conversionScore, mobileScore };
}

const match = (html: string, pattern: RegExp) => pattern.test(html);
const content = (html: string, pattern: RegExp) => html.match(pattern)?.[1]?.replace(/\s+/g, ' ').trim() ?? null;
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;

async function probe(url: string) {
  try { const response = await safeFetch(url, { maxBytes: 150_000 }); return { available: response.status >= 200 && response.status < 400, status: response.status }; }
  catch { return { available: false, status: null }; }
}

function fallbackPerformance(responseMs: number, byteLength: number) {
  const responseScore = responseMs < 500 ? 100 : responseMs < 1000 ? 85 : responseMs < 2000 ? 65 : responseMs < 4000 ? 40 : 15;
  const sizeScore = byteLength < 250_000 ? 100 : byteLength < 750_000 ? 80 : byteLength < 1_250_000 ? 55 : 30;
  return Math.round((responseScore + sizeScore) / 2);
}

export async function analyzeWebsite(inputUrl: string): Promise<AuditOutput> {
  const page = await safeFetch(inputUrl, { requireHtml: true });
  const finalUrl = new URL(page.url);
  const html = page.body;
  const lower = html.toLowerCase();
  const base = `${finalUrl.protocol}//${finalUrl.host}`;
  const [robots, sitemap, faviconProbe, pageSpeed] = await Promise.all([
    probe(`${base}/robots.txt`), probe(`${base}/sitemap.xml`), probe(`${base}/favicon.ico`), runPageSpeed(page.url),
  ]);

  const title = content(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = content(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ?? content(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const canonical = match(lower, /<link[^>]+rel=["'][^"']*canonical[^"']*["']/i);
  const h1Count = count(lower, /<h1\b/g);
  const headingStructure = h1Count === 1 && match(lower, /<h2\b/);
  const images = count(lower, /<img\b/g);
  const imagesWithAlt = count(lower, /<img\b[^>]*\balt\s*=\s*["'][^"']*["']/g);
  const altCoverage = images === 0 ? 100 : Math.round(imagesWithAlt / images * 100);
  const openGraph = match(lower, /<meta[^>]+property=["']og:/);
  const twitter = match(lower, /<meta[^>]+(?:name|property)=["']twitter:/);
  const structuredData = match(lower, /application\/ld\+json|itemscope\b/);
  const favicon = match(lower, /<link[^>]+rel=["'][^"']*(?:icon|shortcut icon)[^"']*["']/) || faviconProbe.available;
  const https = finalUrl.protocol === 'https:';
  const okStatus = page.status >= 200 && page.status < 400;
  const mixedContent = https && match(lower, /(?:src|href)\s*=\s*["']http:\/\//);
  const securityHeaders = ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy'].filter((header) => Boolean(page.headers[header]));

  const cta = match(lower, />\s*(?:get started|contact us|book (?:a )?(?:call|demo)|request (?:a )?(?:quote|demo)|buy now|shop now|learn more|start now)\s*</);
  const contactForm = match(lower, /<form\b/) && match(lower, /type=["'](?:email|tel)["']|name=["'](?:email|phone|message)["']/);
  const whatsapp = match(lower, /(?:wa\.me|api\.whatsapp\.com|whatsapp:)/);
  const phoneLink = match(lower, /href=["']tel:/);
  const emailLink = match(lower, /href=["']mailto:/);
  const pricing = match(lower, /\b(?:pricing|plans?|packages?)\b/);
  const testimonials = match(lower, /\b(?:testimonials?|what (?:our )?clients say|reviews?)\b/);
  const portfolio = match(lower, /\b(?:portfolio|case studies|our work|projects)\b/);
  const socialLinks = match(lower, /(?:instagram\.com|facebook\.com|linkedin\.com|tiktok\.com|youtube\.com)/);
  const booking = match(lower, /(?:calendly\.com|cal\.com|book (?:a )?(?:call|appointment)|schedule (?:a )?(?:call|appointment))/);
  const ecommerce = match(lower, /(?:add to cart|checkout|shopify|woocommerce|application\/ld\+json[^<]*(?:product|offer))/);
  const trust = match(lower, /\b(?:trusted by|certified|guarantee|secure payment|years? experience|clients? served|award)/);

  const viewport = match(lower, /<meta[^>]+name=["']viewport["']/);
  const responsiveIndicators = match(lower, /@media\s*\(|(?:sm|md|lg|xl):[a-z]|bootstrap|container-fluid/);
  const technical = [https, okStatus, page.redirectCount <= 2, page.durationMs < 2000, favicon, !mixedContent, securityHeaders.length >= 3];
  const seo = [Boolean(title && title.length >= 10 && title.length <= 70), Boolean(description && description.length >= 50 && description.length <= 180), canonical, h1Count === 1, headingStructure, altCoverage >= 80, openGraph, twitter, robots.available, sitemap.available, structuredData];
  const conversion = [cta, contactForm, whatsapp || phoneLink || emailLink, pricing, testimonials, portfolio, socialLinks, booking, ecommerce, trust];
  const mobile = [viewport, responsiveIndicators, (pageSpeed.performanceScore ?? fallbackPerformance(page.durationMs, page.byteLength)) >= 60];
  const scores = calculateAuditScores({ technical, performance: pageSpeed.performanceScore ?? fallbackPerformance(page.durationMs, page.byteLength), seo, conversion, mobile });
  const problems: AuditIssue[] = [];
  const add = (condition: boolean, category: AuditCategory, severity: AuditSeverity, titleText: string, descriptionText: string, recommendation: string) => { if (!condition) problems.push({ category, severity, title: titleText, description: descriptionText, recommendation }); };
  add(https, 'TECHNICAL', 'CRITICAL', 'HTTPS is not active', 'The audited page is served over an unencrypted HTTP connection.', 'Install a valid TLS certificate and redirect all HTTP traffic to HTTPS.');
  add(okStatus, 'TECHNICAL', 'CRITICAL', 'Homepage returned an error', `The homepage returned HTTP ${page.status}.`, 'Restore a successful homepage response before driving traffic.');
  add(!mixedContent, 'TECHNICAL', 'HIGH', 'Mixed content detected', 'The HTTPS page references insecure HTTP resources.', 'Serve every script, image, stylesheet, and asset through HTTPS.');
  add(favicon, 'TECHNICAL', 'LOW', 'Favicon is missing', 'No favicon declaration or conventional favicon file was found.', 'Add a branded favicon and reference it in the page head.');
  add(securityHeaders.length >= 3, 'TECHNICAL', 'MEDIUM', 'Security headers are incomplete', `Only ${securityHeaders.length} of 5 sampled defensive headers were detected.`, 'Configure CSP, HSTS, content-type, framing, and referrer protections.');
  add(page.durationMs < 2000, 'PERFORMANCE', 'HIGH', 'Slow initial response', `The homepage completed in ${page.durationMs} ms from the audit server.`, 'Review hosting, caching, server work, and asset delivery.');
  add(Boolean(title), 'SEO', 'HIGH', 'Page title is missing', 'The homepage has no readable title element.', 'Add a concise, descriptive title targeting the primary service and location.');
  add(Boolean(description), 'SEO', 'MEDIUM', 'Meta description is missing', 'No meta description was detected.', 'Write a unique description that communicates the offer and encourages clicks.');
  add(canonical, 'SEO', 'LOW', 'Canonical URL is missing', 'No canonical link was found.', 'Declare the preferred canonical URL for the homepage.');
  add(h1Count === 1, 'SEO', 'HIGH', 'H1 structure needs attention', `The homepage contains ${h1Count} H1 headings.`, 'Use one clear H1 that describes the main offer.');
  add(altCoverage >= 80, 'SEO', 'MEDIUM', 'Image alt coverage is low', `${altCoverage}% of sampled images include an alt attribute.`, 'Add meaningful alt text to informative images and empty alt text to decorative images.');
  add(robots.available, 'SEO', 'LOW', 'robots.txt was not found', 'The standard robots.txt location was unavailable.', 'Publish a robots.txt file with appropriate crawl directives.');
  add(sitemap.available, 'SEO', 'MEDIUM', 'XML sitemap was not found', 'The standard sitemap.xml location was unavailable.', 'Generate and submit an XML sitemap.');
  add(cta, 'CONVERSION', 'HIGH', 'Clear call-to-action not detected', 'The homepage does not expose a recognizable primary action.', 'Add a specific, visible CTA such as Book a call or Request a quote.');
  add(contactForm, 'CONVERSION', 'HIGH', 'Contact form not detected', 'No obvious lead-capture form was found.', 'Add a short contact or inquiry form near high-intent content.');
  add(testimonials || portfolio, 'CONVERSION', 'MEDIUM', 'Proof of work is limited', 'No obvious testimonial, portfolio, or case-study section was detected.', 'Add credible client proof and outcome-focused case studies.');
  add(viewport, 'MOBILE', 'CRITICAL', 'Viewport configuration is missing', 'No mobile viewport meta tag was detected.', 'Add a responsive viewport meta tag.');
  add(responsiveIndicators, 'MOBILE', 'MEDIUM', 'Responsive indicators were not detected', 'The homepage HTML and inline styles show no common responsive signals.', 'Verify the layout at mobile breakpoints and add responsive styles.');

  const strengths = [https && 'HTTPS is active', okStatus && `Homepage responds successfully (HTTP ${page.status})`, title && 'A page title is present', description && 'A meta description is present', h1Count === 1 && 'The page uses one H1', altCoverage >= 80 && 'Image alt coverage is strong', cta && 'A clear call-to-action is visible', contactForm && 'A contact form is available', viewport && 'Mobile viewport is configured', structuredData && 'Structured data is present'].filter((item): item is string => Boolean(item));
  const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 } as const;
  problems.sort((a, b) => priority[a.severity] - priority[b.severity]);
  const recommendedActions = [...new Set(problems.map((problem) => problem.recommendation))].slice(0, 12);
  return {
    ...scores, strengths, problems, recommendedActions,
    rawMetrics: {
      auditedUrl: inputUrl, finalUrl: page.url, httpStatus: page.status, redirectCount: page.redirectCount, responseTimeMs: page.durationMs, htmlBytes: page.byteLength, https, mixedContent, securityHeaders,
      title, metaDescription: description, canonical, h1Count, headingStructure, imagesSampled: images, imagesWithAlt, altCoveragePercent: altCoverage, openGraph, twitter, robots, sitemap, structuredData,
      conversion: { cta, contactForm, whatsapp, phoneLink, emailLink, pricing, testimonials, portfolio, socialLinks, booking, ecommerce, trustIndicators: trust },
      mobile: { viewport, responsiveIndicators }, pageSpeed,
    },
  };
}
