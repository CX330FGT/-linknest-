export const CATEGORIES = ['开发工具', '设计灵感', '效率办公', '学习阅读', '生活日常'];
export const STORAGE_KEY = 'linknest.data.v1';
export function normalizeUrl(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) throw new Error('请输入有效的网站地址');
  const input = value.trim();
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('只支持不含账号密码的 HTTP 或 HTTPS 地址');
  return url.href;
}
function bounded(value, field, limit, required = true) {
  if (typeof value !== 'string' || (required && !value.trim()) || value.length > limit) throw new Error(`${field}格式不正确（最多 ${limit} 字）`);
  return value.trim();
}
export function validateJournalMetadata(value) {
  if (!value || !['中国主办', '海外主办'].includes(value.origin)) throw new Error('期刊主办地区不正确');
  const result = { origin: value.origin, field: bounded(value.field, '期刊方向', 30) };
  for (const system of ['cas', 'jcr']) {
    const rank = value[system];
    if (rank == null) { result[system] = null; continue; }
    const allowed = system === 'cas' ? [1, 2, 3, 4] : ['Q1', 'Q2', 'Q3', 'Q4'];
    if (!allowed.includes(rank.zone) || !Number.isInteger(rank.year) || rank.year < 2000 || rank.year > new Date().getFullYear()) throw new Error('分区或数据年份不正确');
    result[system] = { zone: rank.zone, year: rank.year, category: bounded(rank.category, '分区学科', 100), source: normalizeUrl(rank.source), ...(rank.note ? { note: bounded(rank.note, '分区说明', 180) } : {}) };
  }
  return result;
}
export function validateBookmark(item) {
  if (!item || typeof item !== 'object') throw new Error('收藏格式不正确');
  if (item.pinned !== undefined && typeof item.pinned !== 'boolean') throw new Error('常用收藏标记必须是布尔值');
  const metadata = {};
  if (item.journal !== undefined) metadata.journal = validateJournalMetadata(item.journal);
  if (item.subcategory !== undefined) metadata.subcategory = bounded(item.subcategory, '子分类', 30);
  if (item.tags !== undefined) {
    if (!Array.isArray(item.tags) || item.tags.length > 12) throw new Error('标签最多 12 个');
    metadata.tags = item.tags.map(tag => bounded(tag, '标签', 30));
  }
  return {
    id: bounded(item.id, '标识', 100),
    title: bounded(item.title, '名称', 60),
    url: normalizeUrl(item.url),
    description: bounded(item.description ?? '', '描述', 180, false),
    category: bounded(item.category, '分类', 30),
    pinned: item.pinned === true,
    ...metadata,
  };
}
export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 2_000_000) throw new Error('备份不能超过 2 MB');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('文件不是有效的 JSON 备份'); }
  if (data?.version !== 1 || !Array.isArray(data.bookmarks) || data.bookmarks.length > 2000) throw new Error('备份版本不支持，或收藏超过 2000 条');
  const bookmarks = data.bookmarks.map(validateBookmark);
  if (new Set(bookmarks.map(item => item.id)).size !== bookmarks.length) throw new Error('备份中存在重复标识');
  return bookmarks;
}
export function serialize(bookmarks) {
  const text = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), bookmarks }, null, 2);
  parseBackup(text);
  return text;
}
export function mergeBookmarks(current, incoming) {
  const existing = parseBackup(serialize(current));
  const imported = parseBackup(serialize(incoming));
  const urls = new Set(existing.map(item => item.url));
  const ids = new Set(existing.map(item => item.id));
  const reserved = new Set([...ids, ...imported.map(item => item.id)]);
  let added = 0, skipped = 0, renamed = 0, counter = 0;
  const result = [...existing];
  for (const item of imported) {
    if (urls.has(item.url)) { skipped++; continue; }
    let id = item.id;
    if (ids.has(id)) {
      do { id = `import-${++counter}`; } while (reserved.has(id));
      reserved.add(id);
      renamed++;
    }
    result.push({ ...item, id });
    urls.add(item.url);
    ids.add(id);
    added++;
  }
  serialize(result);
  return { bookmarks: result, added, skipped, renamed };
}
export function filterBookmarks(bookmarks, { category = 'all', subcategory = '', query = '' } = {}) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return bookmarks.filter(item => (category === 'all' || (category === 'pinned' ? item.pinned : item.category === category)) && (!subcategory || item.subcategory === subcategory) && terms.every(term => `${item.title} ${item.description} ${item.url} ${item.category} ${item.subcategory ?? ''} ${(item.tags ?? []).join(' ')}`.toLocaleLowerCase().includes(term)));
}
export function createSeeds() {
  return [
    ['GitHub', 'https://github.com', '代码、灵感与下一次创造。', '开发工具', true],
    ['MDN Web Docs', 'https://developer.mozilla.org/zh-CN/', '开放网络的开发参考手册。', '开发工具', false],
    ['Stack Overflow', 'https://stackoverflow.com', '找到问题背后的解法。', '开发工具', false],
    ['Figma', 'https://www.figma.com', '把一个想法，变成一个界面。', '设计灵感', true],
    ['Dribbble', 'https://dribbble.com', '发现来自世界各地的设计灵感。', '设计灵感', false],
    ['Behance', 'https://www.behance.net', '浏览创意作品与完整项目。', '设计灵感', false],
    ['Notion', 'https://www.notion.so', '为笔记、计划和想法留个位置。', '效率办公', true],
    ['Google 翻译', 'https://translate.google.com', '跨过语言的边界。', '效率办公', false],
    ['Excalidraw', 'https://excalidraw.com', '用手绘图把复杂想法说清楚。', '效率办公', false],
    ['Wikipedia', 'https://www.wikipedia.org', '保持好奇，探索新的知识。', '学习阅读', true],
    ['哔哩哔哩', 'https://www.bilibili.com', '收藏值得花时间看的内容。', '学习阅读', false],
    ['少数派', 'https://sspai.com', '寻找适合自己的数字生活方式。', '学习阅读', false],
    ['豆瓣', 'https://www.douban.com', '书影音，以及生活里的小事。', '生活日常', false],
    ['高德地图', 'https://www.amap.com', '出发之前，找到你的方向。', '生活日常', false],
    ['小红书', 'https://www.xiaohongshu.com', '收集日常生活里的新发现。', '生活日常', false],
  ].map(([title, url, description, category, pinned], index) => ({ id: `seed-${index}`, title, url: normalizeUrl(url), description, category, pinned }));
}
