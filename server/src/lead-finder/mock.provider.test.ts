import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MockLeadSourceProvider } from './mock.provider.js';
test('mock provider works without credentials and honors filters', async () => {
  const result = await new MockLeadSourceProvider().searchBusinesses({ keyword: 'restaurant', city: 'Beirut', minimumRating: 4, hasWebsite: true, maximumResults: 10 });
  assert.ok(result.results.length > 0);
  assert.ok(result.results.every((lead) => (lead.rating ?? 0) >= 4 && lead.websiteUrl));
  assert.equal(result.requestCount, 0);
});
