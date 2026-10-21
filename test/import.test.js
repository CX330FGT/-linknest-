import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeeds, mergeBookmarks, parseBackup, serialize } from '../dist/core.js';
const item = (id, url, extra = {}) => ({ ...createSeeds()[0], id, url, ...extra });
test('merge deduplicates normalized addresses and preserves existing edits', () => {
  const original = [item('old', 'https://example.com/', { title: '我的标题', pinned: true })];
  const imported = [item('new', 'example.com', { title: '另一标题' })];
  const result = mergeBookmarks(original, imported);
  assert.equal(result.added, 0);
  assert.equal(result.skipped, 1);
  assert.deepEqual(result.bookmarks, original);
});
test('ID collisions are resolved without overwriting either bookmark or later IDs', () => {
  const result = mergeBookmarks([item('a', 'https://a.example/')], [item('a', 'https://b.example/'), item('import-1', 'https://c.example/')]);
  assert.equal(result.added, 2);
  assert.equal(result.renamed, 1);
  assert.equal(new Set(result.bookmarks.map(value => value.id)).size, 3);
  assert.equal(result.bookmarks[1].id, 'import-2');
});
test('duplicates inside an incoming batch are counted and skipped', () => {
  const result = mergeBookmarks([], [item('a', 'example.com'), item('b', 'https://example.com/')]);
  assert.equal(result.added, 1);
  assert.equal(result.skipped, 1);
});
test('different query parameters and fragments remain distinct destinations', () => {
  const result = mergeBookmarks([], [item('a', 'https://example.com/?q=1'), item('b', 'https://example.com/?q=2'), item('c', 'https://example.com/#part')]);
  assert.equal(result.added, 3);
});
test('merge is idempotent and does not mutate input objects', () => {
  const original = [item('a', 'https://a.example/')];
  const imported = [item('a', 'https://b.example/')];
  const before = JSON.stringify([original, imported]);
  const first = mergeBookmarks(original, imported);
  const second = mergeBookmarks(first.bookmarks, imported);
  assert.deepEqual(second.bookmarks, first.bookmarks);
  assert.equal(second.added, 0);
  assert.equal(JSON.stringify([original, imported]), before);
});
test('invalid or oversized merges leave original data untouched', () => {
  const original = Array.from({ length: 2000 }, (_, index) => item(`a${index}`, `https://example.com/${index}`));
  assert.throws(() => mergeBookmarks(original, [item('extra', 'https://other.example/')]), /2000/);
  assert.equal(original.length, 2000);
  assert.throws(() => mergeBookmarks([], [item('a', 'javascript:alert(1)')]));
});
test('2 MB limit measures UTF-8 bytes, including multibyte text', () => {
  assert.throws(() => parseBackup('中'.repeat(700000)), /2 MB/);
});
test('wrong pinned types are rejected instead of silently losing user intent', () => {
  assert.throws(() => serialize([item('a', 'https://example.com', { pinned: 'true' })]), /布尔/);
});
