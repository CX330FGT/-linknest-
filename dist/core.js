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
export function validateBookmark(item) {
  if (!item || typeof item !== 'object') throw new Error('收藏格式不正确');
  return {
    id: bounded(item.id, '标识', 100),
    title: bounded(item.title, '名称', 60),
    url: normalizeUrl(item.url),
    description: bounded(item.description ?? '', '描述', 180, false),
    category: bounded(item.category, '分类', 30),
    pinned: item.pinned === true,
  };
}
export function parseBackup(text) {
  if (text.length > 2_000_000) throw new Error('备份不能超过 2 MB');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('文件不是有效的 JSON 备份'); }
  if (data?.version !== 1 || !Array.isArray(data.bookmarks) || data.bookmarks.length > 2000) throw new Error('备份版本不支持，或收藏超过 2000 条');
  const bookmarks = data.bookmarks.map(validateBookmark);
  if (new Set(bookmarks.map(item => item.id)).size !== bookmarks.length) throw new Error('备份中存在重复标识');
  return bookmarks;
}
export function serialize(bookmarks) {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), bookmarks }, null, 2);
}
export function filterBookmarks(bookmarks, { category = 'all', query = '' } = {}) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return bookmarks.filter(item => (category === 'all' || (category === 'pinned' ? item.pinned : item.category === category)) && terms.every(term => `${item.title} ${item.description} ${item.url} ${item.category}`.toLocaleLowerCase().includes(term)));
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
