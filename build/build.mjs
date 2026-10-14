// node build/build.mjs [--check]: writes ar/ and tr/ from the English pages + locales/*.json.
// --check lists English text that has no translation yet, without writing.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const check = process.argv.includes('--check');
const dump = {};

const PAGES = { home: '', features: 'features/', designs: 'designs/', guide: 'guide/', faq: 'faq/', privacy: 'privacy/' };
// designs and privacy are hand-maintained per locale; only these are generated
const BUILT = ['home', 'features', 'guide', 'faq'];
const LOCALES = {
  ar: { dir: 'rtl', native: 'العربية', code: 'AR' },
  tr: { dir: 'ltr', native: 'Türkçe', code: 'TR' },
};
const SITE = 'https://pointcalc.in/';
const common = JSON.parse(read('locales/_common.json'));

const localizedPage = (sitePath) => {
  const p = sitePath.replace(/index\.html$/, '');
  return Object.values(PAGES).includes(p) ? p : null;
};

const relative = (fromDir, toPath) => {
  const from = fromDir.split('/').filter(Boolean);
  const to = toPath.split('/');
  let i = 0;
  while (i < from.length && i < to.length - 1 && from[i] === to[i]) i++;
  return '../'.repeat(from.length - i) + to.slice(i).join('/');
};

function rewriteUrls(html, pagePath, locale) {
  const outDir = locale + '/' + pagePath;
  return html.replace(/\b(href|src)="([^"]*)"/g, (all, attr, url) => {
    if (!url || /^(https?:|mailto:|tel:|data:|#|\/\/|javascript:)/.test(url)) return all;
    const [path, hash = ''] = url.split('#');
    const abs = new URL(path, SITE + pagePath).pathname.slice(1);
    const page = localizedPage(abs);
    const target = page !== null ? locale + '/' + page + (abs.endsWith('index.html') || abs === page ? 'index.html' : '') : abs;
    return `${attr}="${relative(outDir, target)}${hash ? '#' + hash : ''}"`;
  });
}

function switcher(pagePath, locale) {
  const outDir = locale + '/' + pagePath;
  const link = (code, native, target, extra) =>
    `<a class="ln${code === locale ? ' on' : ''}" href="${relative(outDir, target + 'index.html')}" lang="${code}" hreflang="${code}"${extra}><span class="ln-native">${native}</span><span class="ln-code">${code.toUpperCase()}</span></a>`;
  return link('en', 'English', pagePath, '') +
    Object.entries(LOCALES).map(([c, L]) => link(c, L.native, c + '/' + pagePath, L.dir === 'rtl' ? ' dir="rtl"' : '')).join('');
}

function pairsFor(key) {
  const data = JSON.parse(read(`locales/${key}.json`));
  return { meta: data.meta, pairs: [...data.pairs, ...navPairs()] };
}

function navPairs() {
  const out = [];
  const walk = (en, ar, tr) => {
    for (const k of Object.keys(en)) {
      if (typeof en[k] === 'object') walk(en[k], ar[k], tr[k]);
      else out.push({ en: en[k], ar: ar[k], tr: tr[k] });
    }
  };
  walk(common.en, common.ar, common.tr);
  return out.filter((p) => p.en && p.ar && p.tr);
}

const translateText = (html, pairs, locale) => {
  const sorted = pairs.filter((p) => p[locale]).sort((a, b) => b.en.length - a.en.length);
  const unused = [];
  for (const p of sorted) {
    const tagged = new RegExp(`(>\\s*)${escape(p.en)}(\\s*<)`, 'g');
    const quoted = new RegExp(`((?:content|alt|aria-label|title|placeholder)=")${escape(p.en)}(")`, 'g');
    const jsonStr = new RegExp(`(": ")${escape(jsonEscape(p.en))}(")`, 'g');
    let hit = false;
    html = html.replace(tagged, (m, a, b) => { hit = true; return a + p[locale] + b; })
      .replace(quoted, (m, a, b) => { hit = true; return a + p[locale] + b; })
      .replace(jsonStr, (m, a, b) => { hit = true; return a + jsonEscape(p[locale]) + b; });
    if (!hit && p.en.length >= 20 && html.includes(p.en)) { html = html.split(p.en).join(p[locale]); hit = true; }
    if (!hit) unused.push(p.en);
  }
  return { html, unused };
};
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const jsonEscape = (s) => JSON.stringify(s).slice(1, -1);

const KEEP = /^([A-Z]{2,4}|Babul Behera|Sakeena Basheer|Adhi \(Gamer FF\)|Maniac Esports|Team xOp|Pointcalc Esports|pointcalcdev@gmail\.com|@pointcalc_ig|pointcalc\.in\/d\/night-owls-table|PointCalc|PointCalc Studio|Studio|Studio Pro|BGMI|PUBG Mobile|Free Fire|PUBG|App Store|Google Play|Instagram|WhatsApp|YouTube|Premium|Premium \+ AI|AI Team|xbeastop|Amal Manoj|EN|AR|TR|English|FAQ|[\d₹.,+★%\s/:×x-]+|[^A-Za-z]*)$/;

const textNodes = (html) => {
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, '');
  return [...body.matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter(Boolean);
};

function untranslated(html, en) {
  const english = new Set(textNodes(en));
  return [...new Set(textNodes(html).filter((t) => english.has(t) && /[A-Za-z]{3,}/.test(t) && !KEEP.test(t)))];
}


const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();

// FAQ structured data must match the visible (translated) questions
function rebuildFaqLd(html) {
  const items = [...html.matchAll(/<button class="faq-q">([\s\S]*?)<span class="ic">\+<\/span><\/button>\s*<div class="faq-a"><p>([\s\S]*?)<\/p><\/div>/g)];
  if (!items.length || !html.includes('"@type": "FAQPage"')) return html;
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([, q, a]) => ({ '@type': 'Question', name: stripTags(q), acceptedAnswer: { '@type': 'Answer', text: stripTags(a) } })) };
  return html.replace(/<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema.org",\s*"@type": "FAQPage"[\s\S]*?<\/script>/,
    () => '<script type="application/ld+json">\n' + JSON.stringify(ld, null, 2) + '\n</script>');
}

let missing = 0;
for (const key of BUILT) {
  const pagePath = PAGES[key];
  const en = read(pagePath + 'index.html');
  const { meta, pairs } = pairsFor(key);
  for (const [locale, L] of Object.entries(LOCALES)) {
    let html = en.replace(/<html[^>]*>/, `<html lang="${locale}" dir="${L.dir}">`);
    const out = translateText(html, pairs, locale);
    html = rewriteUrls(rebuildFaqLd(out.html), pagePath, locale);
    html = html.replace(/(<div class="lang-menu" role="menu">)[\s\S]*?(<\/div>)/, `$1${switcher(pagePath, locale)}$2`);
    html = html.replace(/(<button class="lang-btn"[\s\S]*?<\/svg><span>)EN(<\/span>)/, `$1${L.code}$2`);
    const url = SITE + locale + '/' + pagePath;
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
      .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${locale === 'ar' ? 'ar_AR' : 'tr_TR'}$2`);
    if (locale === 'ar') {
      html = html.replace(/(<link rel="stylesheet" href="[^"]*styles\.css"[^>]*>)/,
        `$1\n<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />\n<link rel="stylesheet" href="${relative(locale + '/' + pagePath, 'rtl.css')}" />`);
    }
    const m = meta?.[locale];
    if (m?.title) html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${m.title}</title>`)
      .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(")/g, `$1${m.title}$2`);
    if (m?.desc) html = html.replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(")/g, `$1${m.desc}$2`);
    const left = untranslated(html, en);
    if (left.length) {
      missing += left.length;
      (dump[key] ??= {})[locale] = left;
      console.log(`\n${locale}/${pagePath || '(home)'}: ${left.length} untranslated`);
      left.forEach((t) => console.log('  ' + t.slice(0, 160)));
    }
    if (!check) writeFileSync(join(root, locale, pagePath, 'index.html'), html);
  }
}
if (check) writeFileSync(join(root, '_build', 'untranslated.json'), JSON.stringify(dump, null, 1));
console.log(`\n${missing} untranslated strings${check ? ' (check only, nothing written)' : ''}`);
