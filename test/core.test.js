import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeeds, normalizeUrl, parseBackup, serialize, filterBookmarks } from '../dist/core.js';
test('defaults are valid and backup round-trips without data loss', () => {
  const bookmarks = createSeeds();
  assert.deepEqual(parseBackup(serialize(bookmarks)), bookmarks);
  assert.equal(bookmarks.length, 15);
});
test('URL normalization accepts HTTPS defaults and rejects executable or credential URLs', () => {
  assert.equal(normalizeUrl('example.com'), 'https://example.com/');
  assert.equal(normalizeUrl('http://localhost:8080/a'), 'http://localhost:8080/a');
  for (const input of ['javascript:alert(1)', 'data:text/html,test', 'file:///secret', 'https://user:pass@example.com', '', 'not a domain']) assert.throws(() => normalizeUrl(input));
});
test('search combines case-insensitive keywords and category constraints', () => {
  const bookmarks = createSeeds();
  assert.equal(filterBookmarks(bookmarks, { query: 'GITHUB 代码', category: '开发工具' }).length, 1);
  assert.equal(filterBookmarks(bookmarks, { query: 'github', category: '设计灵感' }).length, 0);
  assert.equal(filterBookmarks(bookmarks, { category: 'pinned' }).length, 4);
});
test('malformed backups fail before mutation', () => {
  const item = createSeeds()[0];
  for (const text of ['no json', '{}', JSON.stringify({ version: 2, bookmarks: [] }), JSON.stringify({ version: 1, bookmarks: [item, item] }), JSON.stringify({ version: 1, bookmarks: [{ ...item, url: 'javascript:alert(1)' }] }), JSON.stringify({ version: 1, bookmarks: [{ ...item, title: 'x'.repeat(61) }] }), JSON.stringify({ version: 1, bookmarks: Array(2001).fill(item) }), ' '.repeat(2_000_001)]) assert.throws(() => parseBackup(text));
});
test('empty backup remains empty, custom categories and literal HTML survive safely as text', () => {
  assert.deepEqual(parseBackup('{"version":1,"bookmarks":[]}'), []);
  const item = { ...createSeeds()[0], title: '<img src=x onerror=alert(1)>', category: '我的分类' };
  assert.equal(parseBackup(serialize([item]))[0].title, item.title);
  assert.equal(filterBookmarks([item], { category: '我的分类' }).length, 1);
});
