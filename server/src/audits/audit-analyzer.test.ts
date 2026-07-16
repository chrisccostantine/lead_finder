import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateAuditScores } from './audit-analyzer.js';

test('audit scoring returns 100 when every category passes', () => {
  assert.deepEqual(calculateAuditScores({ technical: [true, true], performance: 100, seo: [true], conversion: [true], mobile: [true] }), { overallScore: 100, technicalScore: 100, performanceScore: 100, seoScore: 100, conversionScore: 100, mobileScore: 100 });
});

test('audit scoring applies category weights and clamps performance', () => {
  const scores = calculateAuditScores({ technical: [true, false], performance: 120, seo: [false, false], conversion: [true, false], mobile: [false] });
  assert.equal(scores.performanceScore, 100);
  assert.equal(scores.overallScore, 43);
});
