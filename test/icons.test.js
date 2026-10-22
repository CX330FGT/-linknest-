import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SITE_ICONS, siteIconUrl } from '../dist/icons.js';
import { createCatalog } from '../dist/catalog.js';
import { createSeeds } from '../dist/core.js';
test('all directory and legacy bookmark domains resolve to bundled PNG icons', () => {
  for (const item of [...createCatalog(), ...createSeeds()]) {
    const icon = siteIconUrl(item.url);
    assert.match(icon, /^data:image\/png;base64,/);
    const bytes = Buffer.from(icon.split(',')[1], 'base64');
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  }
  assert.equal(Object.keys(SITE_ICONS).length, 56);
});
test('custom favicon paths omit private query and fragment data and reject unsafe URLs', () => {
  assert.equal(siteIconUrl('https://custom.example:8080/private?token=secret#section'), 'https://custom.example:8080/favicon.ico');
  for (const value of ['javascript:alert(1)', 'data:image/png,abc', 'https://user:password@example.com']) assert.throws(() => siteIconUrl(value));
});
