import assert from 'node:assert/strict';
import test from 'node:test';
import { isBlockedAddress } from './safe-url.js';

test('SSRF guard blocks private, loopback, link-local, and metadata ranges', () => {
  for (const address of ['127.0.0.1', '10.2.3.4', '172.16.0.1', '192.168.1.2', '169.254.169.254', '::1', '::ffff:127.0.0.1', 'fd00::1', 'fe80::1', 'ff02::1']) assert.equal(isBlockedAddress(address), true, address);
});

test('SSRF guard allows representative public addresses', () => {
  assert.equal(isBlockedAddress('8.8.8.8'), false);
  assert.equal(isBlockedAddress('2606:4700:4700::1111'), false);
});
