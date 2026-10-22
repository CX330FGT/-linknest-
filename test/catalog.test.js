import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AI_GROUPS, RESEARCH_CATEGORIES, createCatalog } from '../dist/catalog.js';
import { createSeeds, filterBookmarks, mergeBookmarks, parseBackup, serialize, validateBookmark } from '../dist/core.js';
test('catalog has valid, unique resources and covers all AI groups', () => {
  const catalog = createCatalog();
  assert.deepEqual(parseBackup(serialize(catalog)), catalog);
  assert.equal(new Set(catalog.map(item => item.url)).size, catalog.length);
  assert.ok(catalog.every(item => RESEARCH_CATEGORIES.includes(item.category)));
  assert.deepEqual(new Set(catalog.filter(item => item.category === 'AI 与智能科研').map(item => item.subcategory)), new Set(AI_GROUPS));
});
test('AI subgroup and research keyword filters combine', () => {
  const catalog = createCatalog();
  const results = filterBookmarks(catalog, { category: 'AI 与智能科研', subcategory: '物理与科学机器学习', query: 'PINNs 参数识别' });
  assert.deepEqual(results.map(item => item.title), ['DeepXDE']);
  assert.equal(filterBookmarks(catalog, { subcategory: 'AI 文献发现', query: 'PINNs' }).length, 0);
});
test('saving a resource keeps metadata, resolves IDs, and preserves existing bookmarks', () => {
  const resource = createCatalog().find(item => item.title === 'DeepXDE');
  const current = createSeeds();
  const before = serialize(current);
  const merged = mergeBookmarks(current, [resource]);
  assert.equal(merged.added, 1);
  assert.equal(serialize(current).replace(/"exportedAt": ".*?"/, ''), before.replace(/"exportedAt": ".*?"/, ''));
  assert.deepEqual(merged.bookmarks.at(-1), resource);
  assert.equal(mergeBookmarks(merged.bookmarks, [resource]).added, 0);
});
test('old backups are unchanged and invalid metadata fails before saving', () => {
  assert.deepEqual(parseBackup(serialize(createSeeds())), createSeeds());
  const item = createSeeds()[0];
  for (const metadata of [{ tags: 'PINNs' }, { tags: Array(13).fill('x') }, { tags: ['x'.repeat(31)] }, { subcategory: 'x'.repeat(31) }]) assert.throws(() => validateBookmark({ ...item, ...metadata }));
});
