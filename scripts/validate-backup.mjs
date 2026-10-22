import { stat, readFile } from 'node:fs/promises';
import { parseWorkspace } from '../dist/core.js';
try {
  const filename = process.argv[2];
  if (!filename) throw new Error('用法：node scripts/validate-backup.mjs <backup.json>');
  if ((await stat(filename)).size > 2_000_000) throw new Error('备份不能超过 2 MB');
  const workspace = parseWorkspace(await readFile(filename, 'utf8'));
  console.log(JSON.stringify({ valid: true, categories: workspace.categories.length, bookmarks: workspace.bookmarks.length }));
} catch (error) {
  console.error(JSON.stringify({ valid: false, error: error.message }));
  process.exitCode = 1;
}
