import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { recordsFromCsv } from './csv.js';
import { duplicateKeys, matchingReasons } from './duplicate-detection.js';
import { createLeadSchema } from './lead.schemas.js';

describe('lead validation', () => {
  it('accepts a valid lead and applies defaults', () => {
    const result = createLeadSchema.parse({ businessName: 'North Star Studio' });
    assert.equal(result.status, 'NEW');
    assert.equal(result.priority, 'MEDIUM');
    assert.deepEqual(result.contacts, []);
  });

  it('rejects invalid URLs and email addresses', () => {
    const result = createLeadSchema.safeParse({ businessName: 'Example', websiteUrl: 'internal', email: 'wrong' });
    assert.equal(result.success, false);
  });
});

describe('duplicate detection', () => {
  it('normalizes domains, email, phone, and business names', () => {
    const first = duplicateKeys({ businessName: 'Café North, LLC', websiteUrl: 'https://www.example.com/about', email: 'Hello@Example.com', phone: '+961 70 123 456' });
    const second = duplicateKeys({ businessName: 'Cafe North LLC', websiteUrl: 'http://example.com', email: 'hello@example.com', phone: '+961-70-123-456' });
    assert.deepEqual(matchingReasons(first, second), ['website', 'email', 'phone', 'businessName']);
  });

  it('preserves non-Latin business names', () => {
    assert.equal(duplicateKeys({ businessName: 'مطعم بيروت' }).businessNameKey, 'مطعم بيروت');
  });
});

describe('CSV parsing', () => {
  it('handles quoted commas and exposes invalid rows for schema validation', () => {
    const records = recordsFromCsv('businessName,city,email\n"Studio, One",Beirut,hello@example.com\nBad,Paris,not-an-email');
    assert.equal(records[0]?.businessName, 'Studio, One');
    assert.equal(createLeadSchema.safeParse(records[1]).success, false);
  });
});
