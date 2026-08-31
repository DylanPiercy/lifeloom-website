import { promises as fs } from 'node:fs';

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const replaceTokens = (template, values) => Object.entries(values).reduce(
  (output, [key, value]) => output.replaceAll(`{{${key}}}`, value ?? ''),
  template
);

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

export function renderInfoCards(items = []) {
  return items.map((item) => `<article class="info-card"><div class="info-number">${escapeHtml(item.number)}</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></article>`).join('');
}

export function renderFooterAppLinks(apps = []) {
  return apps.map((app) => `<a href="/apps/${escapeHtml(app.slug)}/">${escapeHtml(app.name)}</a>`).join('');
}
