import { env } from '../config/env.js';
import { GooglePlacesProvider } from './google-places.provider.js';
import { MockLeadSourceProvider } from './mock.provider.js';

const providers = { MOCK: new MockLeadSourceProvider(), GOOGLE_PLACES: new GooglePlacesProvider() } as const;
export function getProvider(name: 'MOCK' | 'GOOGLE_PLACES') { return providers[name]; }
export function providerMetadata() { return [
  { id: 'MOCK', name: 'Mock provider', available: env.ENABLE_MOCK_PROVIDER, searchable: true, warning: 'Synthetic development data; no external API calls.' },
  { id: 'GOOGLE_PLACES', name: 'Google Places', available: env.ENABLE_GOOGLE_PLACES && Boolean(env.GOOGLE_PLACES_API_KEY), searchable: true, warning: 'Official API; requests may incur Google Maps Platform charges. Email is unavailable.' },
  { id: 'MANUAL_CSV', name: 'Manual CSV', available: true, searchable: false, importPath: '/leads/import', warning: 'User-reviewed manual import.' },
]; }
