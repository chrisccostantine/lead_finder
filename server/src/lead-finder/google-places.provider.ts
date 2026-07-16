import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import type { LeadSearchInput, LeadSearchResult, LeadSourceProvider, ProviderLead } from './provider.types.js';

interface GooglePlace { id: string; displayName?: { text?: string }; formattedAddress?: string; location?: { latitude?: number; longitude?: number }; rating?: number; userRatingCount?: number; websiteUri?: string; nationalPhoneNumber?: string; types?: string[]; googleMapsUri?: string }
interface GoogleResponse { places?: GooglePlace[]; nextPageToken?: string; error?: { message?: string } }

export class GooglePlacesProvider implements LeadSourceProvider {
  async searchBusinesses(input: LeadSearchInput): Promise<LeadSearchResult> {
    if (!env.GOOGLE_PLACES_API_KEY || !env.ENABLE_GOOGLE_PLACES) throw new Error('Google Places is not configured.');
    if (input.hasEmail) return { results: [], requestCount: 0, warnings: ['Google Places does not provide public email addresses.'] };
    const results: ProviderLead[] = []; let pageToken: string | undefined; let requestCount = 0;
    do {
      const remaining = input.maximumResults - results.length;
      const body: Record<string, unknown> = { textQuery: [input.keyword, input.category, input.city, input.country].filter(Boolean).join(' '), pageSize: Math.min(20, remaining), minRating: input.minimumRating, pageToken };
      if (input.category) { body.includedType = input.category; body.strictTypeFiltering = false; }
      if (input.radius && input.latitude !== undefined && input.longitude !== undefined) body.locationBias = { circle: { center: { latitude: input.latitude, longitude: input.longitude }, radius: input.radius } };
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', { method: 'POST', signal: AbortSignal.timeout(15_000), headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.types,places.googleMapsUri,nextPageToken' }, body: JSON.stringify(body) });
      requestCount += 1; const payload = await response.json() as GoogleResponse;
      if (!response.ok) throw new Error(payload.error?.message || `Google Places returned HTTP ${response.status}.`);
      for (const place of payload.places ?? []) {
        if (!place.id || !place.displayName?.text) continue;
        const lead: ProviderLead = { resultId: randomUUID(), providerReference: place.id, businessName: place.displayName.text, address: place.formattedAddress, city: input.city, country: input.country, latitude: place.location?.latitude, longitude: place.location?.longitude, rating: place.rating, reviewCount: place.userRatingCount, websiteUrl: place.websiteUri, phone: place.nationalPhoneNumber, businessTypes: place.types ?? [], googleMapsUrl: place.googleMapsUri };
        if ((input.hasWebsite === undefined || Boolean(lead.websiteUrl) === input.hasWebsite) && (input.hasPhone === undefined || Boolean(lead.phone) === input.hasPhone)) results.push(lead);
        if (results.length >= input.maximumResults) break;
      }
      pageToken = payload.nextPageToken;
    } while (pageToken && results.length < input.maximumResults && requestCount < 3);
    return { results, requestCount, warnings: ['Google Places requests may incur usage charges. Review current Google Maps Platform pricing.', 'Google Places does not supply email addresses.'] };
  }
}
