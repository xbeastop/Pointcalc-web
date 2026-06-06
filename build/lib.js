/* PointCalc i18n build library — shared by all page generators.
   Loaded in run_script via: eval(await readFile('_build/lib.js')); then PCI.generatePage(...)
   Nothing here is shipped to the site; it only produces the per-locale HTML. */
(function () {
  const LOCALES = {
    en: { htmlLang: 'en', dir: 'ltr', native: 'English',  code: 'EN' },
    ar: { htmlLang: 'ar', dir: 'rtl', native: 'العربية',  code: 'AR' },
    tr: { htmlLang: 'tr', dir: 'ltr', native: 'Türkçe',   code: 'TR' },
  };
  const LOCALE_ORDER = ['en', 'ar', 'tr'];
  const PAGE_PATH = { home: '', features: 'features/', designs: 'designs/', guide: 'guide/', faq: 'faq/', privacy: 'privacy/' };

  const rep = (n) => '../'.repeat(n);
  const depthOf = (locale, pageKey) => (locale === 'en' ? 0 : 1) + (pageKey === 'home' ? 0 : 1);

  const GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/></svg>';
  const CARET = '<svg class="lang-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

  // ---- language switcher (cross-locale links) ----
  function buildSwitcher(locale, pageKey) {
    const here = LOCALES[locale];
    const depth = depthOf(locale, pageKey);
    const items = LOCALE_ORDER.map((t) => {
      const href = rep(depth) + (t === 'en' ? '' : t + '/') + PAGE_PATH[pageKey];
      const L = LOCALES[t];
      const on = t === locale ? ' on' : '';
      return `<a class="ln${on}" href="${href}" lang="${L.htmlLang}" hreflang="${L.htmlLang}"${L.dir === 'rtl' ? ' dir="rtl"' : ''}><span class="ln-native">${L.native}</span><span class="ln-code">${L.code}</span></a>`;
    }).join('');
    return `<div class="lang" id="langSwitch">
        <button class="lang-btn" id="langBtn" aria-haspopup="true" aria-expanded="false" aria-label="Language">${GLOBE}<span>${here.code}</span>${CARET}</button>
        <div class="lang-menu" role="menu">${items}</div>
      </div>`;
  }

  // ---- nav ----
  function buildNav(locale, pageKey, T) {
    const sub = pageKey !== 'home';
    const b = sub ? '../' : '';
    const brandHref = sub ? '../index.html' : '#top';
    const n = T.nav;
    const A = (key, href, label) => {
      const active = (key === pageKey) ? ' style="color:var(--ink)"' : '';
      return `<a href="${href}"${active}>${label}</a>`;
    };
    let links = '';
    if (!sub) links += A('how', '#how', n.how);
    links += A('features', b + 'features/index.html', n.features);
    links += A('designs', b + 'designs/index.html', n.designs);
    links += A('guide', b + 'guide/index.html', n.guide);
    links += A('pricing', sub ? '../index.html#pricing' : '#pricing', n.pricing);
    links += A('faq', b + 'faq/index.html', n.faq);
    const cta = sub ? '../index.html#download' : '#download';
    return `<nav class="nav" id="nav">
  <div class="wrap nav-inner">
    <a class="brand" lang="en" href="${brandHref}"><img src="https://pointcalc.in/icon.png" alt="PointCalc" />PointCalc</a>
    <div class="nav-links">
      ${links}
    </div>
    <a class="btn btn-acid nav-cta" href="${cta}">${n.download}</a>
    ${buildSwitcher(locale, pageKey)}
    <button class="nav-burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</nav>`;
  }

  // ---- footer ----
  function buildFooter(locale, pageKey, T) {
    const sub = pageKey !== 'home';
    const b = sub ? '../' : '';
    const f = T.footer, l = f.links;
    const pricingHref = sub ? '../index.html#pricing' : '#pricing';
    const founderHref = sub ? '../index.html#founder' : '#founder';
    return `<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-col">
        <div class="foot-brand" lang="en"><img src="https://pointcalc.in/icon.png" alt="" />PointCalc</div>
        <p>${f.tagline}</p>
      </div>
      <div class="foot-col">
        <h4>${f.product}</h4>
        <ul><li><a href="${b}features/index.html">${l.features}</a></li><li><a href="${b}designs/index.html">${l.designs}</a></li><li><a href="${b}guide/index.html">${l.guide}</a></li><li><a href="${pricingHref}">${l.pricing}</a></li><li><a href="${b}faq/index.html">${l.faq}</a></li></ul>
      </div>
      <div class="foot-col">
        <h4>${f.download}</h4>
        <ul><li><a href="https://apps.apple.com/in/app/pointcalc-custom-pt-maker/id6747952141">${l.appstore}</a></li><li><a href="https://play.google.com/store/apps/details?id=com.pointcalc.global">${l.googleplay}</a></li></ul>
      </div>
      <div class="foot-col">
        <h4>${f.connect}</h4>
        <ul><li><a href="https://www.instagram.com/pointcalc_ig/">${l.instagram}</a></li><li><a href="mailto:pointcalcdev@gmail.com">${l.email}</a></li><li><a href="${b}privacy/index.html">${l.privacy}</a></li></ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>${f.rights}</span>
      <span>${f.builtby} <a href="${founderHref}">xbeastop</a></span>
    </div>
  </div>
</footer>`;
  }

  // ---- hreflang alternates for <head> ----
  function buildHreflang(pageKey) {
    const base = 'https://pointcalc.in/';
    const alt = (loc) => base + (loc === 'en' ? '' : loc + '/') + PAGE_PATH[pageKey];
    return [
      `<link rel="alternate" hreflang="en" href="${alt('en')}">`,
      `<link rel="alternate" hreflang="ar" href="${alt('ar')}">`,
      `<link rel="alternate" hreflang="tr" href="${alt('tr')}">`,
      `<link rel="alternate" hreflang="x-default" href="${alt('en')}">`,
    ].join('\n');
  }

  // ---- the language-switcher runtime (tiny; toggles the dropdown) ----
  const SWITCH_JS = `
  // language switcher dropdown
  (function(){
    var ls=document.getElementById('langSwitch'),lb=document.getElementById('langBtn');
    if(!ls||!lb)return;
    lb.addEventListener('click',function(e){e.stopPropagation();var o=ls.classList.toggle('open');lb.setAttribute('aria-expanded',o?'true':'false');});
    document.addEventListener('click',function(e){if(!ls.contains(e.target)){ls.classList.remove('open');lb.setAttribute('aria-expanded','false');}});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){ls.classList.remove('open');lb.setAttribute('aria-expanded','false');}});
  })();`;

  /* Generate one localized page.
     opts: { src, locale, pageKey, T, meta, content, assets }
       src      : original English HTML (from _src)
       locale   : 'en'|'ar'|'tr'
       pageKey  : 'home'|'features'|...
       T        : common translations for this locale ({nav, footer})
       meta     : { title, desc } localized (optional; en keeps original if omitted)
       content  : array of [enExact, translated] pairs for body text (ar/tr only)
       assets   : array of [findExact, replaceWith] for asset path/href fixes
  */
  function generatePage(opts) {
    let html = opts.src;
    const L = LOCALES[opts.locale];
    const depth = depthOf(opts.locale, opts.pageKey);
    const root = rep(depth);

    // 1) <html lang dir>
    html = html.replace(/<html[^>]*>/, `<html lang="${L.htmlLang}" dir="${L.dir}">`);

    // 2) normalise shared-asset paths to the correct depth, then caller fixes
    html = html.replace(/href="(?:\.\.\/)*styles\.css"/g, `href="${root}styles.css"`);
    html = html.replace(/href="(?:\.\.\/)*icon\.png"/g, `href="${root}icon.png"`);
    (opts.assets || []).forEach(([a, b]) => { html = html.split(a).join(b); });

    // 3) inject rtl.css + Arabic font (Arabic only) right after the styles.css link
    if (opts.locale === 'ar') {
      const cairo = '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />';
      const rtl = `<link rel="stylesheet" href="${root}rtl.css" />`;
      html = html.replace(/(<link rel="stylesheet" href="[^"]*styles\.css"[^>]*>)/, `$1\n${cairo}\n${rtl}`);
    }

    // 4) hreflang alternates — insert before </head>
    html = html.replace('</head>', buildHreflang(opts.pageKey) + '\n</head>');

    // 5) localized <title> + meta description (+ og/twitter mirrors)
    if (opts.meta) {
      if (opts.meta.title) {
        html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${opts.meta.title}</title>`);
        html = html.replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${opts.meta.title}$2`);
        html = html.replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${opts.meta.title}$2`);
      }
      if (opts.meta.desc) {
        html = html.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${opts.meta.desc}$2`);
        html = html.replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${opts.meta.desc}$2`);
        html = html.replace(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${opts.meta.desc}$2`);
      }
    }

    // 6) rebuild nav + footer (translated, with switcher)
    html = html.replace(/<nav class="nav"[\s\S]*?<\/nav>/, buildNav(opts.locale, opts.pageKey, opts.T));
    html = html.replace(/<footer>[\s\S]*?<\/footer>/, buildFooter(opts.locale, opts.pageKey, opts.T));

    // 7) translate body content (ar/tr) — longest needle first to avoid substring clashes
    if (opts.content && opts.content.length) {
      const pairs = opts.content.slice().sort((a, b) => b[0].length - a[0].length);
      pairs.forEach(([en, tx]) => { if (tx != null && tx !== '') html = html.split(en).join(tx); });
    }

    // 8) inject switcher runtime before </body>
    html = html.replace('</body>', `<script>${SWITCH_JS}\n</script>\n</body>`);

    return html;
  }

  globalThis.PCI = { LOCALES, LOCALE_ORDER, PAGE_PATH, depthOf, rootPrefix: rep, buildNav, buildFooter, buildSwitcher, buildHreflang, generatePage };
})();
