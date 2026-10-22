import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, LEGACY_KEYS, emptyWorkspace, loadWorkspace, addCategory, saveBookmark, normalizeUrl, parseWorkspace, serializeWorkspace, mergeWorkspaces, filterBookmarks } from '../dist/core.js';
const blank = () => ({ version: 2, categories: [{ id: 'a', name: '研究' }], bookmarks: [] });
const bookmark = (overrides = {}) => ({ id: 'b', title: '算例', url: 'https://example.invalid/', description: '', categoryId: 'a', pinned: false, ...overrides });
function storage(entries = {}) { const map = new Map(Object.entries(entries)); return { map, getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; }
test('legacy migration removes all old URLs once, retains category names and unrelated data', () => {
  const store = storage({ [LEGACY_KEYS[0]]: JSON.stringify({ bookmarks: [{ category: '课题自用', url: 'https://old.invalid/' }] }), [LEGACY_KEYS[1]]: '{}', 'linknest.theme': 'dark', other: 'keep' });
  const migrated = loadWorkspace(store);
  assert.equal(migrated.bookmarks.length, 0);
  assert.ok(migrated.categories.some(c => c.name === '课题自用'));
  for (const key of LEGACY_KEYS) assert.equal(store.getItem(key), null);
  assert.equal(store.getItem('other'), 'keep'); assert.equal(store.getItem('linknest.theme'), 'dark');
  const updated = saveBookmark(migrated, bookmark({ categoryId: migrated.categories[0].id }));
  store.setItem(STORAGE_KEY, serializeWorkspace(updated));
  assert.deepEqual(loadWorkspace(store), updated);
});
test('migration writes new state before removing old keys; corrupt v2 is never overwritten', () => {
  const store = storage({ [LEGACY_KEYS[0]]: 'old' });
  store.setItem = () => { throw new Error('full'); };
  assert.throws(() => loadWorkspace(store), /full/); assert.equal(store.getItem(LEGACY_KEYS[0]), 'old');
  const bad = storage({ [STORAGE_KEY]: '{broken', [LEGACY_KEYS[0]]: 'old' });
  assert.throws(() => loadWorkspace(bad)); assert.equal(bad.getItem(STORAGE_KEY), '{broken'); assert.equal(bad.getItem(LEGACY_KEYS[0]), 'old');
});
test('empty categories persist independently and duplicate category names are rejected', () => {
  const data = addCategory(blank(), ' AI ', 'ai');
  assert.equal(data.categories[1].name, 'AI'); assert.equal(data.bookmarks.length, 0);
  assert.deepEqual(parseWorkspace(serializeWorkspace(data)), data);
  assert.throws(() => addCategory(data, 'ai', 'other'), /重复/);
  for (const name of ['', ' ', 'a'.repeat(31)]) assert.throws(() => addCategory(data, name, 'new'));
  assert.throws(() => addCategory(data, '新分类', 'all'));
});
test('URLs belong to real categories; duplicates are scoped to the category', () => {
  let data = addCategory(blank(), '其他', 'c');
  data = saveBookmark(data, bookmark({ url: 'example.invalid' }));
  assert.equal(data.bookmarks[0].url, 'https://example.invalid/');
  assert.throws(() => saveBookmark(data, bookmark({ id: 'duplicate' })), /重复网址/);
  assert.throws(() => saveBookmark(data, bookmark({ id: 'missing', categoryId: 'missing' })), /存在的分类/);
  data = saveBookmark(data, bookmark({ id: 'second', categoryId: 'c' }));
  assert.equal(data.bookmarks.length, 2);
  data = saveBookmark(data, bookmark({ title: '改名', pinned: true }));
  assert.equal(data.bookmarks.length, 2); assert.equal(filterBookmarks(data, { category: 'pinned', query: '研究 改名' }).length, 1);
});
test('unsafe protocols and embedded credentials are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'https://user:pass@example.invalid', 'https://']) assert.throws(() => normalizeUrl(url));
  assert.equal(normalizeUrl('https://example.invalid/a?q=1#b'), 'https://example.invalid/a?q=1#b');
});
test('merge maps same-name categories and resolves conflicting IDs without modifying inputs', () => {
  const current = saveBookmark(blank(), bookmark());
  const incoming = { version: 2, categories: [{ id: 'other', name: '研究' }, { id: 'a', name: 'AI' }, { id: 'empty', name: '空分类' }], bookmarks: [bookmark({ id: 'same-url', categoryId: 'other' }), bookmark({ categoryId: 'a', url: 'https://new.invalid/' })] };
  const before = JSON.stringify([current, incoming]);
  const result = mergeWorkspaces(current, incoming);
  assert.equal(result.added, 1); assert.equal(result.skipped, 1); assert.equal(result.workspace.categories.length, 3);
  const ai = result.workspace.categories.find(c => c.name === 'AI');
  assert.notEqual(ai.id, 'a'); assert.equal(result.workspace.bookmarks[1].categoryId, ai.id); assert.notEqual(result.workspace.bookmarks[1].id, 'b');
  assert.equal(JSON.stringify([current, incoming]), before);
});
test('invalid or oversized imports fail; legacy backups cannot restore removed URLs', () => {
  assert.throws(() => parseWorkspace(JSON.stringify({ version: 1, bookmarks: [] })));
  assert.throws(() => parseWorkspace('{bad'));
  assert.throws(() => parseWorkspace('中'.repeat(700_000)), /2 MB/);
  assert.throws(() => parseWorkspace(JSON.stringify({ ...blank(), categories: Array.from({ length: 101 }, (_, i) => ({ id: String(i), name: String(i) })) })));
  assert.throws(() => parseWorkspace(JSON.stringify({ ...blank(), bookmarks: Array.from({ length: 2001 }, (_, i) => bookmark({ id: String(i), url: `https://example.invalid/${i}` })) })));
  assert.equal(emptyWorkspace().bookmarks.length, 0);
});
