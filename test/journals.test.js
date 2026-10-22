import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJournals, applyJournalRankings, filterJournals } from '../dist/journals.js';
import { parseBackup, serialize } from '../dist/core.js';
// Synthetic ranking values test the mechanics of import, not actual journal ratings.
const synthetic = { version: 1, rankings: [{ id: 'journal-jmps', cas: { zone: 2, year: 2025, category: '测试学科', source: 'https://www.fenqubiao.com/' }, jcr: { zone: 'Q3', year: 2025, category: 'Synthetic test category', source: 'https://jcr.clarivate.com/' } }] };
test('journal directory has unique IDs and URLs, both origins, and no invented rankings', () => {
  const items = createJournals();
  assert.equal(items.length, 128);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.equal(new Set(items.map(item => item.url)).size, items.length);
  assert.deepEqual(new Set(items.map(item => item.journal.origin)), new Set(['中国主办', '海外主办']));
  assert.ok(items.every(item => item.journal.cas === null));
  assert.deepEqual(items.filter(item => item.journal.jcr).map(item => item.id), ['journal-arfm']);
  assert.match(items.find(item => item.id === 'journal-arfm').journal.jcr.note, /1\/172/);
  assert.deepEqual(parseBackup(serialize(items)), items);
});
test('CAS and JCR filters remain independent and combine with origin and subject', () => {
  const items = applyJournalRankings(createJournals(), JSON.stringify(synthetic));
  assert.equal(filterJournals(items, { system: 'cas', tier: '2' }).length, 1);
  assert.equal(filterJournals(items, { system: 'jcr', tier: 'Q3' }).length, 1);
  assert.equal(filterJournals(items, { system: 'jcr', tier: 'Q2' }).length, 0);
  assert.equal(filterJournals(items, { system: 'cas', tier: 'pending' }).length, 127);
  assert.equal(filterJournals(items, { origin: '中国主办', field: '固体与材料', system: 'cas', tier: '2' }).length, 0);
});
test('rankings require valid zone, year, subject and safe source URL', () => {
  for (const invalid of [{ zone: 0 }, { year: new Date().getFullYear() + 1 }, { category: '' }, { source: 'javascript:alert(1)' }, { source: 'https://user:pass@example.com/' }]) {
    const payload = structuredClone(synthetic);
    Object.assign(payload.rankings[0].cas, invalid);
    assert.throws(() => applyJournalRankings(createJournals(), JSON.stringify(payload)));
  }
  const mixed = structuredClone(synthetic); mixed.rankings[0].jcr.zone = 1;
  assert.throws(() => applyJournalRankings(createJournals(), JSON.stringify(mixed)));
});
test('unknown or duplicate IDs and invalid batches never mutate the directory', () => {
  const items = createJournals(), before = JSON.stringify(items);
  for (const rankings of [[{ id: 'unknown' }], [synthetic.rankings[0], synthetic.rankings[0]], [synthetic.rankings[0], { id: 'unknown' }]]) assert.throws(() => applyJournalRankings(items, JSON.stringify({ version: 1, rankings })));
  assert.equal(JSON.stringify(items), before);
});
test('ranking import rejects wrong versions, oversized data, and allows explicit clearing', () => {
  for (const text of ['{', '{"version":2,"rankings":[]}', '中'.repeat(400000)]) assert.throws(() => applyJournalRankings(createJournals(), text));
  const items = applyJournalRankings(createJournals(), JSON.stringify(synthetic));
  const cleared = applyJournalRankings(items, JSON.stringify({ version: 1, rankings: [{ id: 'journal-jmps', cas: null }] }));
  assert.equal(cleared[0].journal.cas, null);
  assert.equal(cleared[0].journal.jcr.zone, 'Q3');
});
test('saved journal metadata survives backup, including source and subject', () => {
  const items = applyJournalRankings(createJournals(), JSON.stringify(synthetic));
  assert.deepEqual(parseBackup(serialize([items[0]])), [items[0]]);
});
