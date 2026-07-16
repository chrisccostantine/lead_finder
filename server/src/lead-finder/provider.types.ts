export interface LeadSearchInput {
  keyword: string; category?: string; country?: string; city?: string; radius?: number;
  latitude?: number; longitude?: number; minimumRating?: number; hasWebsite?: boolean;
  hasPhone?: boolean; hasEmail?: boolean; maximumResults: number;
}

export interface ProviderLead {
  resultId: string; providerReference: string; businessName: string; address?: string;
  city?: string; country?: string; latitude?: number; longitude?: number; rating?: number;
  reviewCount?: number; websiteUrl?: string; phone?: string; email?: string;
  businessTypes: string[]; googleMapsUrl?: string;
}

export interface LeadSearchResult { results: ProviderLead[]; requestCount: number; warnings: string[] }
export interface LeadSourceProvider { searchBusinesses(input: LeadSearchInput): Promise<LeadSearchResult> }
