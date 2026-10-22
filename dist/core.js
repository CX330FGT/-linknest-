export const STORAGE_KEY = 'linknest.workspace.v2';
export const LEGACY_KEYS = ['linknest.data.v1', 'linknest.journal-rankings.v1'];
export const DEFAULT_CATEGORIES = ['仿真与建模', '文献期刊', 'AI 与智能科研', '文献检索', '理论与课程', '编程与数值计算', '实验与数据资源', '绘图与后处理', '论文写作与文献管理', '校园与课题组'];
const fold = value => value.trim().toLocaleLowerCase();
function bounded(value, label, max, required = true) {
  if (typeof value !== 'string' || (required && !value.trim()) || value.length > max) throw new Error(`${label}格式不正确，最多 ${max} 字`);
  return value.trim();
}
export function normalizeUrl(value) {
  bounded(value, '网址', 2048);
  const input = value.trim();
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('仅支持不含账号密码的 HTTP 或 HTTPS 网址');
  return url.href;
}
export function emptyWorkspace(legacyText = null) {
  const names = [...DEFAULT_CATEGORIES];
  try {
    const old = JSON.parse(legacyText);
    for (const item of old?.bookmarks ?? []) if (typeof item.category === 'string' && item.category.trim() && item.category.length <= 30 && !names.some(name => fold(name) === fold(item.category)) && names.length < 100) names.push(item.category.trim());
  } catch { /* Old addresses are deliberately not restored. */ }
  return { version: 2, categories: names.map((name, index) => ({ id: `category-${index + 1}`, name })), bookmarks: [] };
}
export function validateWorkspace(data) {
  if (data?.version !== 2 || !Array.isArray(data.categories) || !Array.isArray(data.bookmarks) || data.categories.length > 100 || data.bookmarks.length > 2000) throw new Error('备份必须为版本 2，且不超过 100 个分类、2000 个网址');
  const categories = data.categories.map(item => {
    const id = bounded(item?.id, '分类标识', 100);
    if (['all', 'pinned'].includes(id)) throw new Error('分类标识不能使用保留名称');
    return { id, name: bounded(item.name, '分类名称', 30) };
  });
  const ids = new Set(categories.map(item => item.id));
  if (ids.size !== categories.length || new Set(categories.map(item => fold(item.name))).size !== categories.length) throw new Error('分类名称或标识重复');
  const bookmarks = data.bookmarks.map(item => {
    if (!ids.has(item?.categoryId)) throw new Error('网址必须属于一个存在的分类');
    if (typeof item.pinned !== 'boolean') throw new Error('常用标记必须为布尔值');
    return { id: bounded(item.id, '网址标识', 100), title: bounded(item.title, '网站名称', 60), url: normalizeUrl(item.url), description: bounded(item.description ?? '', '描述', 180, false), categoryId: item.categoryId, pinned: item.pinned };
  });
  if (new Set(bookmarks.map(item => item.id)).size !== bookmarks.length) throw new Error('网址标识重复');
  if (new Set(bookmarks.map(item => `${item.categoryId}\0${item.url}`)).size !== bookmarks.length) throw new Error('同一分类存在重复网址');
  return { version: 2, categories, bookmarks };
}
export function parseWorkspace(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 2_000_000) throw new Error('备份不能超过 2 MB');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('文件不是有效的 JSON'); }
  return validateWorkspace(data);
}
export function serializeWorkspace(workspace) {
  const data = validateWorkspace(workspace);
  const text = JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
  if (new TextEncoder().encode(text).length > 2_000_000) throw new Error('数据超过 2 MB，请精简网址或描述');
  return text;
}
export function loadWorkspace(storage) {
  const saved = storage.getItem(STORAGE_KEY);
  const data = saved === null ? emptyWorkspace(storage.getItem(LEGACY_KEYS[0])) : parseWorkspace(saved);
  if (saved === null) storage.setItem(STORAGE_KEY, serializeWorkspace(data));
  for (const key of LEGACY_KEYS) storage.removeItem(key);
  return data;
}
export function addCategory(workspace, name, id) {
  return validateWorkspace({ ...workspace, categories: [...workspace.categories, { id, name }] });
}
export function saveBookmark(workspace, bookmark) {
  const exists = workspace.bookmarks.some(item => item.id === bookmark.id);
  return validateWorkspace({ ...workspace, bookmarks: exists ? workspace.bookmarks.map(item => item.id === bookmark.id ? bookmark : item) : [...workspace.bookmarks, bookmark] });
}
export function filterBookmarks(workspace, { category = 'all', query = '' } = {}) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const names = new Map(workspace.categories.map(item => [item.id, item.name]));
  return workspace.bookmarks.filter(item => (category === 'all' || (category === 'pinned' ? item.pinned : item.categoryId === category)) && terms.every(term => `${item.title} ${item.url} ${item.description} ${names.get(item.categoryId)}`.toLocaleLowerCase().includes(term)));
}
export function mergeWorkspaces(current, imported) {
  const base = validateWorkspace(current), incoming = validateWorkspace(imported);
  const categories = [...base.categories], bookmarks = [...base.bookmarks];
  const usedCategories = new Set([...categories, ...incoming.categories].map(item => item.id));
  const usedBookmarks = new Set([...bookmarks, ...incoming.bookmarks].map(item => item.id));
  const categoryMap = new Map();
  let categoryCounter = 0, bookmarkCounter = 0, added = 0, skipped = 0;
  for (const item of incoming.categories) {
    const same = categories.find(category => fold(category.name) === fold(item.name));
    if (same) { categoryMap.set(item.id, same.id); continue; }
    let id = item.id;
    if (categories.some(category => category.id === id)) { do { id = `import-category-${++categoryCounter}`; } while (usedCategories.has(id)); }
    usedCategories.add(id); categories.push({ ...item, id }); categoryMap.set(item.id, id);
  }
  for (const item of incoming.bookmarks) {
    const categoryId = categoryMap.get(item.categoryId);
    if (bookmarks.some(bookmark => bookmark.categoryId === categoryId && bookmark.url === item.url)) { skipped++; continue; }
    let id = item.id;
    if (bookmarks.some(bookmark => bookmark.id === id)) { do { id = `import-bookmark-${++bookmarkCounter}`; } while (usedBookmarks.has(id)); }
    usedBookmarks.add(id); bookmarks.push({ ...item, id, categoryId }); added++;
  }
  const workspace = validateWorkspace({ version: 2, categories, bookmarks });
  serializeWorkspace(workspace);
  return { workspace, added, skipped };
}
