// Baut die Seite nach dist/: Seiten mit Kopf und Fuß zusammensetzen, Standardtexte
// einfüllen, Skripte bündeln, Schriften und Bilder kopieren.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TEXTS, DEFAULT_SERVICES, DEFAULT_HOURS, DEFAULT_REFERENCES } from '../src/js/content.js';
import * as R from '../src/js/render.js';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const watch = process.argv.includes('--watch');

const texts = Object.fromEntries(TEXTS.map((t) => [t.key, t]));
const renderText = (key) => {
  const t = texts[key];
  if (!t) throw new Error(`Unbekannter Textschlüssel: ${key}`);
  return t.multi ? R.renderRich(t.default) : R.esc(t.default);
};

const prerender = {
  'service-checks': () => R.renderServiceChecks(DEFAULT_SERVICES),
  'service-details': () => R.renderServiceDetails(DEFAULT_SERVICES),
  hours: () => R.renderHoursRows(DEFAULT_HOURS),
  'hours-note': () => R.esc(DEFAULT_HOURS.note),
  references: () => R.renderReferences(DEFAULT_REFERENCES),
  news: () => R.renderNews([]),
};

function fillDefaults(html) {
  // <tag … data-text="key" …></tag> bekommt den Standardtext als Inhalt
  html = html.replace(/<(\w+)([^>]*?\sdata-text="([^"]+)"[^>]*)><\/\1>/g,
    (_, tag, attrs, key) => `<${tag}${attrs}>${renderText(key)}</${tag}>`);
  html = html.replace(/<(\w+)([^>]*?\sdata-render="([^"]+)"[^>]*)><\/\1>/g, (_, tag, attrs, name) => {
    if (!prerender[name]) throw new Error(`Unbekannter Bereich: ${name}`);
    return `<${tag}${attrs}>${prerender[name]()}</${tag}>`;
  });
  html = html.replace(/(<a[^>]*?)\sdata-tel="([^"]+)"/g, (_, start, key) => `${start} data-tel="${key}" href="${R.telHref(texts[key].default)}"`);
  html = html.replace(/(<a[^>]*?)\sdata-mail="([^"]+)"/g, (_, start, key) =>
    `${start} data-mail="${key}"${texts[key].default ? ` href="mailto:${R.esc(texts[key].default)}"` : ''}`);
  html = html.replace(/(<\w+)([^>]*?\sdata-hide-empty="([^"]+)")/g, (m, start, rest, key) =>
    (texts[key].default.trim() ? m : `${start} hidden${rest}`));
  return html;
}

async function buildSite() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, 'assets/fonts'), { recursive: true });

  const result = await build({
    entryPoints: { site: join(SRC, 'js/site.js'), admin: join(SRC, 'js/admin.js') },
    bundle: true, format: 'esm', minify: true, target: 'es2020',
    outdir: join(DIST, 'assets/js'), metafile: true, logLevel: 'warning',
  });
  const version = createHash('sha1').update(JSON.stringify(result.metafile.outputs) + Date.now()).digest('hex').slice(0, 8);

  await cp(join(SRC, 'assets/css'), join(DIST, 'assets/css'), { recursive: true });
  await cp(join(SRC, 'assets/img'), join(DIST, 'assets/img'), { recursive: true });
  for (const [pkg, prefix, weights] of [['nunito', 'nunito', [700, 800, 900]], ['nunito-sans', 'nunito-sans', [400, 700]]]) {
    for (const w of weights) {
      const file = `${prefix}-latin-${w}-normal.woff2`;
      await cp(join(ROOT, 'node_modules/@fontsource', pkg, 'files', file), join(DIST, 'assets/fonts', file));
    }
  }

  const partials = {};
  for (const name of ['head', 'header', 'footer']) partials[name] = await readFile(join(SRC, 'partials', `${name}.html`), 'utf8');

  for (const file of (await readdir(join(SRC, 'pages'))).filter((f) => f.endsWith('.html'))) {
    let html = await readFile(join(SRC, 'pages', file), 'utf8');
    const metaMatch = /^<!--meta (\{.*\}) -->\n/.exec(html);
    if (!metaMatch) throw new Error(`${file}: Kopfzeile <!--meta {…} --> fehlt`);
    const meta = { robots: 'index, follow', ...JSON.parse(metaMatch[1]) };
    html = html.slice(metaMatch[0].length)
      .replace('<!-- @head -->', partials.head)
      .replace('<!-- @header -->', partials.header)
      .replace('<!-- @footer -->', partials.footer)
      .replace(/\{\{(\w+)\}\}/g, (_, k) => R.esc(k === 'version' ? version : meta[k] ?? ''));
    if (meta.nav) html = html.replace(`data-nav="${meta.nav}"`, `data-nav="${meta.nav}" aria-current="page"`);
    await writeFile(join(DIST, file), fillDefaults(html));
  }

  await mkdir(join(DIST, 'admin'), { recursive: true });
  const admin = (await readFile(join(SRC, 'admin/index.html'), 'utf8')).replace(/\{\{version\}\}/g, version);
  await writeFile(join(DIST, 'admin/index.html'), admin);
  await writeFile(join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /admin\n');
  console.log(`Seite gebaut in dist/ (Version ${version})`);
}

await buildSite();

if (watch) {
  const { watch: fsWatch } = await import('node:fs');
  let timer;
  fsWatch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => buildSite().catch((e) => console.error(e.message)), 150);
  });
  console.log('Beobachte src/ auf Änderungen …');
}
