import { randomUUID } from 'node:crypto';
import type { LeadSearchInput, LeadSearchResult, LeadSourceProvider, ProviderLead } from './provider.types.js';

export class MockLeadSourceProvider implements LeadSourceProvider {
  async searchBusinesses(input: LeadSearchInput): Promise<LeadSearchResult> {
    const city = input.city || 'Beirut'; const country = input.country || 'Lebanon';
    const category = input.category || input.keyword || 'Business';
    const results: ProviderLead[] = Array.from({ length: Math.min(input.maximumResults, 12) }, (_, index) => ({
      resultId: randomUUID(), providerReference: `mock-${category}-${city}-${index}`.toLowerCase().replace(/\s+/g, '-'),
      businessName: `${category} ${['Collective', 'Studio', 'House', 'Labs', 'Works', 'Company'][index % 6]} ${index + 1}`,
      address: `${12 + index} Sample Street, ${city}, ${country}`, city, country,
      latitude: 33.89 + index * 0.002, longitude: 35.5 + index * 0.002,
      rating: 3.5 + (index % 4) * 0.4, reviewCount: 12 + index * 17,
      websiteUrl: index % 3 ? `https://example-${index + 1}.test` : undefined,
      phone: index % 4 ? `+961 1 555 ${String(100 + index)}` : undefined,
      businessTypes: [category.toLowerCase().replace(/\s+/g, '_')], googleMapsUrl: 'https://maps.google.com/',
    })).filter((lead) => (input.minimumRating === undefined || (lead.rating ?? 0) >= input.minimumRating) && (input.hasWebsite === undefined || Boolean(lead.websiteUrl) === input.hasWebsite) && (input.hasPhone === undefined || Boolean(lead.phone) === input.hasPhone) && !input.hasEmail);
    return { results, requestCount: 0, warnings: ['Mock data is synthetic and intended for development only.'] };
  }
}
