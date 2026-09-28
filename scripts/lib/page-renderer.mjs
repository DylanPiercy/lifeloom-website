import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  renderSiteFooter,
  renderSiteHead,
  renderSiteHeader,
  renderSiteScripts,
  replaceTokens
} from './render.mjs';

function assertNoUnresolvedTokens(output, sourceLabel) {
  const unresolved = [...new Set(output.match(/{{[A-Z0-9_]+}}/g) || [])];
  if (unresolved.length > 0) {
    throw new Error(`Unresolved template tokens in ${sourceLabel}: ${unresolved.join(', ')}`);
  }
}

export function createPageRenderer(context) {
  const {
    templatesDir,
    publicDir,
    site,
    apps,
    partials,
    sharedTokens
  } = context;

  const siteHead = renderSiteHead(partials.head, sharedTokens);
  const siteScripts = renderSiteScripts(partials.scripts, sharedTokens);
  const templateCache = new Map();

  async function readTemplate(templateName) {
    if (!templateCache.has(templateName)) {
      templateCache.set(
        templateName,
        await fs.readFile(path.join(templatesDir, templateName), 'utf8')
      );
    }
    return templateCache.get(templateName);
  }

  return async function renderPage({
    templateName,
    outputPath,
    values = {},
    sourceLabel,
    activePage = '',
    footerOptions = {}
  }) {
    const template = await readTemplate(templateName);
    const output = replaceTokens(template, {
      ...sharedTokens,
      SITE_HEAD: siteHead,
      SITE_HEADER: renderSiteHeader(partials.header, site, sharedTokens, activePage),
      SITE_FOOTER: renderSiteFooter(partials.footer, site, apps, sharedTokens, footerOptions),
      SITE_SCRIPTS: siteScripts,
      ...values
    });

    assertNoUnresolvedTokens(output, sourceLabel);

    const fullOutputPath = path.join(publicDir, outputPath);
    await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
    await fs.writeFile(
      fullOutputPath,
      `<!-- Generated from ${sourceLabel}. Do not edit directly. -->\n${output}`,
      'utf8'
    );
  };
}
