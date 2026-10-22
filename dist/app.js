import { STORAGE_KEY, emptyWorkspace, loadWorkspace, parseWorkspace, serializeWorkspace, addCategory, saveBookmark, filterBookmarks, mergeWorkspaces } from './core.js';
import { siteIconUrl } from './icons.js';
const $ = selector => document.querySelector(selector);
const node = (tag, className, text) => { const value = document.createElement(tag); if (className) value.className = className; if (text !== undefined) value.textContent = text; return value; };
let state = emptyWorkspace(), selected = 'all', editingId = null, blocked = false, toastTimer;
function toast(message, persistent = false) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
  if (!persistent) toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
try { state = loadWorkspace(localStorage); } catch { blocked = true; toast('无法读取或保存本地数据。请检查浏览器存储权限，或导入有效的新版备份。', true); }
try { sessionStorage.removeItem('linknest.view'); } catch { /* Optional old view preference. */ }
function commit(next, recovery = false) {
  if (blocked && !recovery) { toast('本地存储尚未恢复，无法保存。请检查权限或导入备份。'); return false; }
  try { localStorage.setItem(STORAGE_KEY, serializeWorkspace(next)); state = next; blocked = false; return true; }
  catch (error) { toast(`保存失败，当前导航未改变。${error.name === 'QuotaExceededError' ? '浏览器存储已满。' : error.message}`); return false; }
}
function selectedName() { return selected === 'all' ? '全部网址' : selected === 'pinned' ? '常用网址' : state.categories.find(item => item.id === selected)?.name ?? '全部网址'; }
function selectCategory(id) { selected = id; $('#search').value = ''; render(); }
function renderNavigation() {
  $('#navigation').replaceChildren(); $('#filters').replaceChildren();
  for (const [id, name] of [['all', '全部网址'], ['pinned', '常用网址'], ...state.categories.map(item => [item.id, item.name])]) {
    const count = filterBookmarks(state, { category: id }).length;
    const button = node('button', `nav-button${selected === id ? ' active' : ''}`);
    button.append(node('span', 'nav-symbol', id === 'all' ? '▦' : id === 'pinned' ? '☆' : '◇'), node('span', 'nav-text', name), node('span', 'nav-count', count));
    button.title = name; button.setAttribute('aria-pressed', String(selected === id));
    button.addEventListener('click', () => selectCategory(id)); $('#navigation').append(button);
    const filter = node('button', `filter${selected === id ? ' active' : ''}`, name);
    filter.setAttribute('aria-pressed', String(selected === id)); filter.addEventListener('click', () => selectCategory(id)); $('#filters').append(filter);
  }
}
function action(label, text, handler, className = '') {
  const button = node('button', `card-action ${className}`, text); button.title = label; button.setAttribute('aria-label', label); button.addEventListener('click', handler); return button;
}
function renderCards() {
  const query = $('#search').value, visible = filterBookmarks(state, { category: selected, query });
  $('#cards').replaceChildren(); $('#breadcrumb').textContent = selectedName();
  const count = node('span', '', String(visible.length)); count.id = 'result-count';
  $('#collection-title').replaceChildren(document.createTextNode(query.trim() ? '搜索结果 ' : selectedName() + ' '), count);
  $('#add-in-category').hidden = !state.categories.some(item => item.id === selected);
  $('#empty').hidden = visible.length > 0; $('#clear-search').hidden = !query.trim();
  $('#empty-title').textContent = query.trim() ? '没有匹配的网址' : selected === 'pinned' ? '还没有常用网址' : '这个空间还没有网址';
  $('#empty-message').textContent = query.trim() ? '试试其他关键词，或清除搜索。' : state.categories.length ? '点击添加网址，把常用的网站放进这个分类。' : '先创建一个分类，再添加你的第一个网址。';
  $('#empty-add').textContent = state.categories.length ? '＋ 添加网址' : '＋ 添加分类';
  for (const item of visible) {
    const card = node('article', 'card'), link = node('a', 'card-link');
    link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', `${item.title}（在新标签页打开）`);
    const icon = node('span', 'site-icon', '↗'); icon.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img'); image.alt = ''; image.width = 28; image.height = 28; image.referrerPolicy = 'no-referrer'; image.decoding = 'async';
    image.addEventListener('load', () => icon.classList.add('has-image'));
    image.addEventListener('error', () => { image.remove(); icon.classList.remove('has-image'); }, { once: true });
    image.src = siteIconUrl(item.url); icon.append(image);
    const text = node('div', 'site-text'); text.append(node('h3', 'card-title', item.title), node('div', 'site-domain', new URL(item.url).hostname));
    const top = node('div', 'card-top'); top.append(icon, text); link.append(top, node('p', 'card-description', item.description || '为下一次访问，留一个入口。'));
    const actions = node('div', 'card-actions');
    actions.append(
      action(`${item.pinned ? '取消常用' : '设为常用'}：${item.title}`, item.pinned ? '★' : '☆', () => { if (commit(saveBookmark(state, { ...item, pinned: !item.pinned }))) render(); }, item.pinned ? 'pinned' : ''),
      action(`编辑：${item.title}`, '编辑', () => openEditor(item)),
      action(`删除：${item.title}`, '删除', async () => { const snapshot = state; if (await confirmDelete(item.title) && snapshot === state && commit({ ...state, bookmarks: state.bookmarks.filter(bookmark => bookmark.id !== item.id) })) { render(); toast('网址已删除'); } }),
    );
    const bottom = node('div', 'card-bottom'); bottom.append(node('span', 'category-tag', state.categories.find(category => category.id === item.categoryId).name), actions);
    card.append(link, bottom); $('#cards').append(card);
  }
}
function render() { if (!['all', 'pinned'].includes(selected) && !state.categories.some(item => item.id === selected)) selected = 'all'; renderNavigation(); renderCards(); }
function openCategory() { $('#category-form').reset(); $('#category-error').textContent = ''; $('#category-editor').showModal(); }
function openEditor(item = null) {
  if (!state.categories.length) { openCategory(); return; }
  editingId = item?.id ?? null; const form = $('#bookmark-form'); form.reset(); $('#form-error').textContent = ''; $('#editor-title').textContent = item ? '编辑网址' : '添加网址';
  const categorySelect = form.elements.namedItem('categoryId'); categorySelect.replaceChildren();
  for (const category of state.categories) { const option = node('option', '', category.name); option.value = category.id; categorySelect.append(option); }
  for (const name of ['title', 'url', 'description']) form.elements.namedItem(name).value = item?.[name] ?? '';
  categorySelect.value = item?.categoryId ?? (state.categories.some(category => category.id === selected) ? selected : state.categories[0].id);
  form.elements.namedItem('pinned').checked = item?.pinned ?? false; $('#editor').showModal();
}
function confirmDelete(title) {
  const dialog = $('#confirmation'); dialog.returnValue = 'cancel'; $('#confirm-title').textContent = '删除网址'; $('#confirm-message').textContent = `确定删除「${title}」吗？`;
  dialog.showModal(); return new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), { once: true }));
}
$('#category-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const id = crypto.randomUUID(); const next = addCategory(state, event.currentTarget.elements.namedItem('name').value, id);
    if (!commit(next)) return; selected = id; $('#search').value = ''; $('#category-editor').close(); render(); toast('分类已创建，现在可以添加网址');
  } catch (error) { $('#category-error').textContent = error.message; }
});
$('#bookmark-form').addEventListener('submit', event => {
  event.preventDefault(); const form = event.currentTarget;
  try {
    const item = { id: editingId ?? crypto.randomUUID(), title: form.elements.namedItem('title').value, url: form.elements.namedItem('url').value, description: form.elements.namedItem('description').value, categoryId: form.elements.namedItem('categoryId').value, pinned: form.elements.namedItem('pinned').checked };
    if (!commit(saveBookmark(state, item))) return; selected = item.categoryId; $('#search').value = ''; $('#editor').close(); render(); toast(editingId ? '网址已更新' : '网址已添加到分类');
  } catch (error) { $('#form-error').textContent = error.message; }
});
for (const id of ['#add-category', '#add-category-side']) $(id).addEventListener('click', openCategory);
for (const id of ['#add', '#add-in-category', '#empty-add']) $(id).addEventListener('click', () => openEditor());
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
$('#search').addEventListener('input', renderCards); $('#clear-search').addEventListener('click', () => { $('#search').value = ''; renderCards(); });
document.addEventListener('keydown', event => { if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); $('#search').focus(); } });
function applyTheme(value) { document.documentElement.dataset.theme = value; $('#theme').setAttribute('aria-label', value === 'dark' ? '切换浅色主题' : '切换深色主题'); }
let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
try { const saved = localStorage.getItem('linknest.theme'); if (['light','dark'].includes(saved)) theme = saved; } catch { /* In-memory theme works. */ }
applyTheme(theme); $('#theme').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(theme); try { localStorage.setItem('linknest.theme', theme); } catch { toast('主题已切换，但未能保存偏好'); } });
function exportWorkspace() {
  if (blocked) { toast('当前数据未能读取，请先恢复有效备份'); return; }
  const url = URL.createObjectURL(new Blob([serializeWorkspace(state)], { type: 'application/json' })), link = document.createElement('a');
  link.href = url; link.download = `linknest-backup-${new Date().toISOString().slice(0,10)}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('分类与网址备份已生成');
}
for (const id of ['#export','#export-mobile']) $(id).addEventListener('click', exportWorkspace);
$('#import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = ''; if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('备份不能超过 2 MB');
    const incoming = parseWorkspace(await file.text()), snapshot = state, dialog = $('#import-dialog');
    $('#import-summary').textContent = `备份包含 ${incoming.categories.length} 个分类、${incoming.bookmarks.length} 个网址。请选择合并或替换。`;
    dialog.querySelector('[value=merge]').disabled = blocked; dialog.returnValue = 'cancel'; dialog.showModal();
    const mode = await new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue), { once: true }));
    if (!['merge','replace'].includes(mode)) return;
    if (state !== snapshot) { toast('其他标签页已改变导航，请重新导入'); return; }
    const merged = mode === 'merge' ? mergeWorkspaces(state, incoming) : null;
    if (!commit(merged?.workspace ?? incoming, mode === 'replace')) return;
    selected = 'all'; $('#search').value = ''; render(); toast(merged ? `已添加 ${merged.added} 个网址，跳过 ${merged.skipped} 个重复项` : '分类与网址已恢复');
  } catch (error) { toast(error.message || '导入失败，原导航未改变'); }
});
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close('cancel');
  try { state = event.newValue ? parseWorkspace(event.newValue) : emptyWorkspace(); blocked = false; render(); toast('已同步其他标签页的导航'); }
  catch { blocked = true; toast('其他标签页的数据无效，已暂停保存'); }
});
$('#today').textContent = new Intl.DateTimeFormat('zh-CN', { month:'long', day:'numeric', weekday:'long' }).format(new Date());
render();
