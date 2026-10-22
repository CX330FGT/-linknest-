import { STORAGE_KEY, normalizeUrl, validateBookmark, parseBackup, serialize, filterBookmarks, createSeeds, mergeBookmarks } from './core.js';
import { RESEARCH_CATEGORIES, AI_GROUPS, SIMULATION_GROUPS, createCatalog } from './catalog.js';
import { filterJournals, JOURNAL_SOURCES, applyJournalRankings } from './journals.js';
import { siteIconUrl } from './icons.js';

const $ = selector => document.querySelector(selector);
$('#cards').before($('#research-panels').content.cloneNode(true));
for (const [name, title, placeholder] of [['subcategory', '子分类（选填）', '例如：物理与科学机器学习'], ['tags', '研究标签（选填，逗号分隔）', '例如：PINNs，参数识别，代理模型']]) {
  const label = document.createElement('label');
  label.textContent = title;
  const input = document.createElement('input');
  input.name = name;
  input.maxLength = name === 'tags' ? 371 : 30;
  input.placeholder = placeholder;
  label.append(input);
  $('#bookmark-form .checkbox').before(label);
}
let bookmarks = createSeeds();
let category = 'all';
let subcategory = '';
let view = 'library';
try { if (sessionStorage.getItem('linknest.view') === 'personal') view = 'personal'; } catch { /* Fall back to the research directory. */ }
let catalog = createCatalog();
const journalFilter = { origin: '', field: '', system: 'cas', tier: '' };
try {
  const ranks = localStorage.getItem('linknest.journal-rankings.v1');
  if (ranks) catalog = [...catalog.filter(item => !item.journal), ...applyJournalRankings(catalog.filter(item => item.journal), ranks)];
} catch { /* Invalid optional ranking data never changes bookmarks or the base directory. */ }
const journalPanel = element('section', 'resource-panel journal-panel');
journalPanel.id = 'journal-panel';
journalPanel.hidden = true;
const journalHeading = element('p', '', '期刊分区与方向');
const journalNote = element('small', '', '同时展示中科院与 JCR；未核实的分区、年份和 SCI 收录状态不作推断。不同学科可能有不同分区，请以当年官方记录为准。');
const journalControls = element('div', 'journal-controls');
for (const [name, label, options] of [
  ['origin', '主办地区', [['', '全部地区'], ['中国主办', '中国主办'], ['海外主办', '海外主办']]],
  ['field', '研究方向', [['', '全部方向'], ...[...new Set(catalog.filter(item => item.journal).map(item => item.journal.field))].map(value => [value, value])]],
  ['system', '分区体系', [['cas', '中科院 1–4 区'], ['jcr', 'JCR Q1–Q4']]],
  ['tier', '分区筛选', [['', '全部分区'], ['pending', '待核验'], ['1', '1 区'], ['2', '2 区'], ['3', '3 区'], ['4', '4 区']]],
]) {
  const wrapper = element('label', '', label);
  const select = document.createElement('select');
  select.id = `journal-${name}`;
  for (const [value, text] of options) { const option = element('option', '', text); option.value = value; select.append(option); }
  select.addEventListener('change', () => {
    journalFilter[name] = select.value;
    if (name === 'system') {
      journalFilter.tier = '';
      $('#journal-tier').replaceChildren();
      const values = [['', '全部分区'], ['pending', '待核验'], ...[1,2,3,4].map(value => [select.value === 'cas' ? String(value) : `Q${value}`, select.value === 'cas' ? `${value} 区` : `Q${value}`])];
      for (const [value, text] of values) { const option = element('option', '', text); option.value = value; $('#journal-tier').append(option); }
    }
    renderCards();
  });
  wrapper.append(select); journalControls.append(wrapper);
}
const journalSources = element('div', 'journal-sources');
for (const source of JOURNAL_SOURCES) { const link = element('a', '', source.title + ' ↗'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; journalSources.append(link); }
const rankImport = element('button', 'quiet-button', '导入已核对的分区数据');
rankImport.id = 'import-rankings';
const rankFile = document.createElement('input'); rankFile.type = 'file'; rankFile.accept = '.json,application/json'; rankFile.hidden = true;
rankFile.id = 'rankings-file';
rankImport.addEventListener('click', () => rankFile.click());
rankFile.addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = ''; if (!file) return;
  try {
    if (file.size > 1000000) throw new Error('分区文件不能超过 1 MB');
    const next = applyJournalRankings(catalog.filter(item => item.journal), await file.text());
    const snapshot = { version: 1, rankings: next.filter(item => item.journal.cas || item.journal.jcr).map(item => ({ id: item.id, cas: item.journal.cas, jcr: item.journal.jcr })) };
    localStorage.setItem('linknest.journal-rankings.v1', JSON.stringify(snapshot));
    catalog = [...catalog.filter(item => !item.journal), ...next];
    render(); toast('分区资料已导入。请按卡片来源核对；导入不代表官方认证。');
  } catch (error) { toast(error.message || '分区导入失败，原数据未改变'); }
});
journalPanel.append(journalHeading, journalNote, journalControls, journalSources, rankImport, rankFile);
$('#cards').before(journalPanel);
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
const symbols = { all: '▦', pinned: '☆', 'AI 与智能科研': '✦', '文献检索': '⌕', '仿真与建模': '◇', '编程与数值计算': '⌘' };
function pool() { return view === 'library' ? catalog : bookmarks; }
function categories() { return view === 'library' ? RESEARCH_CATEGORIES : [...new Set([...RESEARCH_CATEGORIES, ...bookmarks.map(item => item.category)])]; }
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function chooseCategory(next) { category = next; subcategory = ''; render(); }
function chooseView(next) { view = next; category = 'all'; subcategory = ''; $('#search').value = ''; render(); }
function renderNavigation() {
  const navigation = $('#navigation');
  const filters = $('#filters');
  navigation.replaceChildren();
  filters.replaceChildren();
  const entries = [['all', '全部网站'], ...(view === 'personal' ? [['pinned', '常用收藏']] : []), ...categories().map(name => [name, name])];
  for (const [value, label] of entries) {
    const count = filterBookmarks(pool(), { category: value }).length;
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
  let visible = filterBookmarks(pool(), { category, subcategory, query });
  if (category === '文献期刊') visible = filterJournals(visible, journalFilter);
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
    const icon = element('span', 'site-icon', '↗');
    icon.setAttribute('aria-hidden', 'true');
    const favicon = document.createElement('img');
    favicon.alt = '';
    favicon.width = 28;
    favicon.height = 28;
    favicon.decoding = 'async';
    favicon.referrerPolicy = 'no-referrer';
    favicon.addEventListener('load', () => icon.classList.add('has-image'));
    favicon.addEventListener('error', () => { favicon.remove(); icon.classList.remove('has-image'); }, { once: true });
    favicon.src = siteIconUrl(item.url);
    icon.append(favicon);
    const text = element('div', 'site-text');
    text.append(element('h3', 'card-title', item.title), element('div', 'site-domain', new URL(item.url).hostname.replace(/^www\./, '')));
    top.append(icon, text);
    link.append(top, element('p', 'card-description', item.description || '为下一次探索，留个入口。'));
    if (item.tags?.length) {
      const tags = element('div', 'resource-tags');
      for (const tag of item.tags) tags.append(element('span', '', tag));
      link.append(tags);
    }
    if (item.journal) {
      const ranks = element('div', 'journal-ranks');
      for (const [system, label] of [['cas', '中科院'], ['jcr', 'JCR']]) {
        const rank = item.journal[system];
        ranks.append(element('span', rank ? 'rank-badge rank-recorded' : 'rank-badge', rank ? `${label} ${rank.zone}${system === 'cas' ? ' 区' : ''} · ${rank.year}` : `${label} 待核验`));
      }
      link.append(ranks);
    }
    const bottom = element('div', 'card-bottom');
    const actions = element('div', 'card-actions');
    if (view === 'library') {
      const saved = bookmarks.some(bookmark => bookmark.url === item.url);
      const add = action(saved ? `已收藏：${item.title}` : `加入收藏：${item.title}`, saved ? '已收藏 ✓' : '＋ 收藏', () => {
        try {
          const merged = mergeBookmarks(bookmarks, [item]);
          if (persist(merged.bookmarks)) { render(); toast(`已收藏「${item.title}」`); }
        } catch (error) { toast(error.message || '无法加入收藏'); }
      });
      add.disabled = saved;
      actions.append(add);
    } else actions.append(
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
    bottom.append(element('span', 'category-tag', item.subcategory || item.category), actions);
    if (item.journal) {
      const rankDetails = element('details', 'rank-details');
      rankDetails.append(element('summary', '', '分区年份与来源'));
      for (const [system, label] of [['cas', '中科院'], ['jcr', 'JCR']]) {
        const rank = item.journal[system];
        if (!rank) rankDetails.append(element('p', '', `${label}：分区、年份、学科均待核验。`));
        else {
          const line = element('p', '', `${label} ${rank.year} · ${rank.category} · ${rank.note || '本地录入，请核对来源'} `);
          const source = element('a', '', '查看来源 ↗'); source.href = rank.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; line.append(source); rankDetails.append(line);
        }
      }
      card.append(rankDetails);
    }
    card.append(link, bottom);
    $('#cards').append(card);
  }
}
function render() {
  try { sessionStorage.setItem('linknest.view', view); } catch { /* View switching still works. */ }
  for (const [id, value] of [['#library-view', 'library'], ['#personal-view', 'personal']]) {
    $(id).classList.toggle('active', view === value);
    $(id).setAttribute('aria-pressed', String(view === value));
  }
  $('#collection-note').textContent = view === 'library' ? '精选科研入口 · 一键加入我的收藏' : '你的编辑与收藏，保存在当前浏览器';
  $('#ai-subfilters').replaceChildren();
  const isAI = category === 'AI 与智能科研', isSimulation = category === '仿真与建模';
  $('#ai-panel').hidden = !isAI && !isSimulation;
  $('#ai-panel > p').firstChild.textContent = isSimulation ? '课题组仿真工作流 ' : 'AI 与智能科研 ';
  $('#ai-panel > p span').textContent = isSimulation ? 'HyperMesh 建模 → LS-DYNA 求解 → LS-PrePost 后处理' : '从文献发现到物理机器学习';
  $('#ai-panel > small').textContent = isSimulation ? '主力：HyperMesh / LS-DYNA；辅助：COMSOL / Abaqus / SolidWorks / AutoCAD / MATLAB。请按本机版本选择文档。' : '文献引用需核对原文，推导和代码需验证；未公开数据按课题组要求处理。';
  if (isAI || isSimulation) for (const group of ['', ...(isAI ? AI_GROUPS : SIMULATION_GROUPS)]) {
    const button = element('button', `filter${subcategory === group ? ' active' : ''}`, group || (isAI ? '全部 AI 资源' : '全部仿真工具'));
    button.setAttribute('aria-pressed', String(subcategory === group));
    button.addEventListener('click', () => { subcategory = group; render(); });
    $('#ai-subfilters').append(button);
  }
  $('#campus-tip').hidden = category !== '校园与课题组';
  $('#journal-panel').hidden = category !== '文献期刊';
  renderNavigation(); renderCards();
}
function openEditor(item = null) {
  if (!item && bookmarks.length >= 2000) { toast('最多支持 2000 条收藏，请先整理或导出备份。'); return; }
  editingId = item?.id ?? null;
  const form = $('#bookmark-form');
  form.reset();
  $('#editor-title').textContent = item ? '编辑网站' : '添加网站';
  $('#form-error').textContent = '';
  $('#categories').replaceChildren(...categories().map(name => { const option = document.createElement('option'); option.value = name; return option; }));
  for (const key of ['title', 'url', 'description', 'subcategory']) form.elements.namedItem(key).value = item?.[key] ?? '';
  form.elements.namedItem('tags').value = (item?.tags ?? []).join('，');
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
    const group = form.elements.namedItem('subcategory').value.trim();
    const tags = form.elements.namedItem('tags').value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
    const original = bookmarks.find(bookmark => bookmark.id === editingId);
    const item = validateBookmark({ id: editingId ?? crypto.randomUUID(), title: form.elements.namedItem('title').value, url: normalizeUrl(form.elements.namedItem('url').value), category: form.elements.namedItem('category').value, description: form.elements.namedItem('description').value, pinned: form.elements.namedItem('pinned').checked, ...(group ? { subcategory: group } : {}), ...(tags.length ? { tags } : {}), ...(original?.journal ? { journal: original.journal } : {}) });
    if (bookmarks.some(bookmark => bookmark.id !== item.id && bookmark.url === item.url)) throw new Error('这个网站已经收藏过了，可以直接编辑已有收藏。');
    const next = editingId ? bookmarks.map(bookmark => bookmark.id === editingId ? item : bookmark) : [...bookmarks, item];
    if (!persist(next)) return;
    $('#editor').close();
    view = 'personal';
    category = 'all';
    subcategory = '';
    $('#search').value = '';
    render();
    toast(editingId ? '修改已保存' : '新网站已加入收藏');
  } catch (error) { $('#form-error').textContent = error.message || '请检查填写内容'; }
});
$('#add').addEventListener('click', () => openEditor());
$('#library-view').addEventListener('click', () => chooseView('library'));
$('#personal-view').addEventListener('click', () => chooseView('personal'));
$('#add-campus').addEventListener('click', () => openEditor());
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
    view = 'personal';
    category = 'all';
    subcategory = '';
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
