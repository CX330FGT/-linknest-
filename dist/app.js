import { CATEGORIES, STORAGE_KEY, normalizeUrl, validateBookmark, parseBackup, serialize, filterBookmarks, createSeeds, mergeBookmarks } from './core.js';

const $ = selector => document.querySelector(selector);
let bookmarks = createSeeds();
let category = 'all';
let editingId = null;
let storageBlocked = false;
let toastTimer;
function toast(message, persistent = false) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  if (!persistent) toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) bookmarks = parseBackup(saved);
} catch {
  storageBlocked = true;
  toast('无法读取本地收藏。现有数据未被覆盖；请检查浏览器存储权限或导入有效备份。', true);
}
function persist(next, recovery = false) {
  if (storageBlocked && !recovery) {
    toast('本地存储尚未恢复，无法保存。请检查浏览器权限或导入备份。');
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, serialize(next));
    bookmarks = next;
    storageBlocked = false;
    return true;
  } catch {
    toast('保存失败：浏览器存储不可用或已满。原收藏未改变，请先导出备份。');
    return false;
  }
}
const symbols = { all: '▦', pinned: '☆', '开发工具': '⌘', '设计灵感': '◇', '效率办公': '▤', '学习阅读': '▧', '生活日常': '☷' };
function categories() { return [...new Set([...CATEGORIES, ...bookmarks.map(item => item.category)])]; }
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function chooseCategory(next) { category = next; render(); }
function renderNavigation() {
  const navigation = $('#navigation');
  const filters = $('#filters');
  navigation.replaceChildren();
  filters.replaceChildren();
  const entries = [['all', '全部网站'], ['pinned', '常用收藏'], ...categories().map(name => [name, name])];
  for (const [value, label] of entries) {
    const count = filterBookmarks(bookmarks, { category: value }).length;
    const button = element('button', `nav-button${category === value ? ' active' : ''}`);
    button.append(element('span', 'nav-symbol', symbols[value] ?? '◇'), element('span', 'nav-text', label), element('span', 'nav-count', count));
    button.setAttribute('aria-pressed', String(category === value));
    button.addEventListener('click', () => chooseCategory(value));
    navigation.append(button);
    const filter = element('button', `filter${category === value ? ' active' : ''}`, label);
    filter.setAttribute('aria-pressed', String(category === value));
    filter.addEventListener('click', () => chooseCategory(value));
    filters.append(filter);
  }
}
function action(label, text, callback, className = '') {
  const button = element('button', `card-action ${className}`, text);
  button.title = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', callback);
  return button;
}
function renderCards() {
  const query = $('#search').value;
  const visible = filterBookmarks(bookmarks, { category, query });
  $('#cards').replaceChildren();
  const title = category === 'all' ? '全部网站' : category === 'pinned' ? '常用收藏' : category;
  $('#breadcrumb').textContent = title;
  $('#collection-title').replaceChildren(document.createTextNode(query.trim() ? '搜索结果 ' : `${title} `));
  const count = element('span', '', String(visible.length));
  count.id = 'result-count';
  $('#collection-title').append(count);
  $('#empty').hidden = visible.length > 0;
  for (const item of visible) {
    const card = element('article', 'card');
    const link = element('a', 'card-link');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${item.title}（在新标签页打开）`);
    const top = element('div', 'card-top');
    const icon = element('span', 'site-icon', Array.from(item.title)[0].toLocaleUpperCase());
    icon.setAttribute('aria-hidden', 'true');
    const text = element('div', 'site-text');
    text.append(element('h3', 'card-title', item.title), element('div', 'site-domain', new URL(item.url).hostname.replace(/^www\./, '')));
    top.append(icon, text);
    link.append(top, element('p', 'card-description', item.description || '为下一次探索，留个入口。'));
    const bottom = element('div', 'card-bottom');
    const actions = element('div', 'card-actions');
    actions.append(
      action(`${item.pinned ? '取消常用' : '设为常用'}：${item.title}`, item.pinned ? '★' : '☆', () => {
        if (persist(bookmarks.map(bookmark => bookmark.id === item.id ? { ...bookmark, pinned: !bookmark.pinned } : bookmark))) render();
      }, item.pinned ? 'pinned' : ''),
      action(`编辑：${item.title}`, '编辑', () => openEditor(item)),
      action(`删除：${item.title}`, '删除', async () => {
        if (await confirmAction('删除网站', `确定删除「${item.title}」吗？此操作只会移除收藏，不会影响网站。`)) {
          if (persist(bookmarks.filter(bookmark => bookmark.id !== item.id))) { render(); toast('已删除网站'); }
        }
      }),
    );
    bottom.append(element('span', 'category-tag', item.category), actions);
    card.append(link, bottom);
    $('#cards').append(card);
  }
}
function render() { renderNavigation(); renderCards(); }
function openEditor(item = null) {
  if (!item && bookmarks.length >= 2000) { toast('最多支持 2000 条收藏，请先整理或导出备份。'); return; }
  editingId = item?.id ?? null;
  const form = $('#bookmark-form');
  form.reset();
  $('#editor-title').textContent = item ? '编辑网站' : '添加网站';
  $('#form-error').textContent = '';
  $('#categories').replaceChildren(...categories().map(name => { const option = document.createElement('option'); option.value = name; return option; }));
  for (const key of ['title', 'url', 'description']) form.elements.namedItem(key).value = item?.[key] ?? '';
  form.elements.namedItem('category').value = item?.category ?? (['all', 'pinned'].includes(category) ? '开发工具' : category);
  form.elements.namedItem('pinned').checked = item?.pinned ?? false;
  $('#editor').showModal();
}
function confirmAction(title, message) {
  const dialog = $('#confirmation');
  $('#confirm-title').textContent = title;
  $('#confirm-message').textContent = message;
  dialog.returnValue = 'cancel';
  dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true }));
}
$('#bookmark-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const item = validateBookmark({ id: editingId ?? crypto.randomUUID(), title: form.elements.namedItem('title').value, url: normalizeUrl(form.elements.namedItem('url').value), category: form.elements.namedItem('category').value, description: form.elements.namedItem('description').value, pinned: form.elements.namedItem('pinned').checked });
    if (bookmarks.some(bookmark => bookmark.id !== item.id && bookmark.url === item.url)) throw new Error('这个网站已经收藏过了，可以直接编辑已有收藏。');
    const next = editingId ? bookmarks.map(bookmark => bookmark.id === editingId ? item : bookmark) : [...bookmarks, item];
    if (!persist(next)) return;
    $('#editor').close();
    category = 'all';
    $('#search').value = '';
    render();
    toast(editingId ? '修改已保存' : '新网站已加入收藏');
  } catch (error) { $('#form-error').textContent = error.message || '请检查填写内容'; }
});
$('#add').addEventListener('click', () => openEditor());
for (const id of ['#close-editor', '#cancel-editor']) $(id).addEventListener('click', () => $('#editor').close());
$('#search').addEventListener('input', renderCards);
$('#clear-search').addEventListener('click', () => { $('#search').value = ''; chooseCategory('all'); });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); $('#search').focus(); }
});
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('#theme').setAttribute('aria-label', theme === 'dark' ? '切换浅色主题' : '切换深色主题');
  $('#theme').setAttribute('aria-pressed', String(theme === 'dark'));
}
let initialTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
try { const storedTheme = localStorage.getItem('linknest.theme'); if (['light', 'dark'].includes(storedTheme)) initialTheme = storedTheme; } catch { /* Theme still works in memory. */ }
applyTheme(initialTheme);
$('#theme').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('linknest.theme', theme); } catch { toast('主题已切换，但浏览器未允许保存偏好'); }
});
function downloadBackup() {
  const url = URL.createObjectURL(new Blob([serialize(bookmarks)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `linknest-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('备份已生成，请妥善保存下载文件');
}
$('#export').addEventListener('click', downloadBackup);
$('#export-mobile').addEventListener('click', downloadBackup);
$('#import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('备份不能超过 2 MB');
    const next = parseBackup(await file.text());
    const dialog = $('#import-dialog');
    const snapshot = bookmarks;
    $('#import-summary').textContent = `备份有 ${next.length} 个网站，当前有 ${bookmarks.length} 个。合并会保留现有内容并跳过重复网址；替换会移除当前收藏。`;
    $('#merge-import').disabled = storageBlocked;
    dialog.returnValue = 'cancel';
    dialog.showModal();
    const mode = await new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue), { once: true }));
    if (!['merge', 'replace'].includes(mode)) return;
    if (snapshot !== bookmarks) { toast('收藏已在其他标签页改变，请重新选择备份。'); return; }
    const merged = mode === 'merge' ? mergeBookmarks(bookmarks, next) : null;
    if (!persist(merged ? merged.bookmarks : next, mode === 'replace')) return;
    category = 'all';
    $('#search').value = '';
    render();
    toast(merged ? `已添加 ${merged.added} 个网站，跳过 ${merged.skipped} 个重复网址` : `已恢复 ${next.length} 个网站`);
  } catch (error) { toast(error.message || '备份导入失败，现有收藏未改变'); }
});
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  try {
    bookmarks = event.newValue ? parseBackup(event.newValue) : createSeeds();
    storageBlocked = false;
    if ($('#editor').open) $('#editor').close();
    if ($('#import-dialog').open) $('#import-dialog').close('cancel');
    render();
    toast('已同步其他标签页中的收藏变更');
  } catch { storageBlocked = true; toast('另一标签页的收藏数据格式异常，已暂停保存'); }
});
$('#today').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
render();
