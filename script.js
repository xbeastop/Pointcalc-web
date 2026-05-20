// Mobile nav — full-screen overlay with body scroll lock, ESC + link-click close
(function () {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  const setOpen = (open) => {
    links.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'navLinks');

  toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));

  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('open')) setOpen(false);
  });
})();

// Pricing period toggle
(function () {
  const buttons = document.querySelectorAll('.period-toggle');
  if (!buttons.length) return;
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      buttons.forEach((b) => b.classList.toggle('active', b === btn));

      document.querySelectorAll('[data-price-monthly]').forEach((el) => {
        const val = el.dataset[`price${period.charAt(0).toUpperCase() + period.slice(1)}`];
        if (val) el.textContent = val;
      });

      const labels = {
        weekly: '/week',
        monthly: '/month',
        quarterly: '/quarter',
        yearly: '/year',
      };
      document.querySelectorAll('[data-period-label]').forEach((el) => {
        el.textContent = labels[period] || '';
      });
    });
  });
})();

// Hero demo: clicking the watch-demo pill swaps the phone screenshot for an iframe and morphs the mockup to 9:16
(function () {
  const btn = document.getElementById('playDemoBtn');
  const screen = document.getElementById('heroDemoScreen');
  if (!btn || !screen) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const mockup = document.querySelector('.phone-mockup');
    if (mockup) mockup.classList.add('video-mode');
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/nR0OaI_TheI?autoplay=1&mute=1&loop=1&playlist=nR0OaI_TheI&modestbranding=1&playsinline=1&rel=0';
    iframe.title = 'PointCalc AI demo';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    screen.replaceChildren(iframe);
    btn.style.display = 'none';
  });
})();

// Mouse-tracked radial glow on every .card — sets CSS vars consumed by ::before
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });
})();

// Count-up animation for .stat-value when the proof section enters the viewport
(function () {
  const values = document.querySelectorAll('.stat-value[data-to]');
  if (!values.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const formatNum = (n, decimals) =>
    decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();

  const setFinal = (el) => {
    const to = parseFloat(el.dataset.to);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    el.textContent = formatNum(to, decimals) + (el.dataset.suffix || '');
  };

  const animate = (el) => {
    const to = parseFloat(el.dataset.to);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = formatNum(to * eased, decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatNum(to, decimals) + suffix;
    };
    requestAnimationFrame(tick);
  };

  // No IntersectionObserver or reduced motion → show the final values, never zero.
  if (reduceMotion || !('IntersectionObserver' in window)) {
    values.forEach(setFinal);
    return;
  }

  // Stash final and reset to 0; if obs hasn't fired within 2s of load, give up and show final.
  values.forEach((el) => {
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    el.textContent = formatNum(0, decimals) + (el.dataset.suffix || '');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = '1';
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  values.forEach((el) => observer.observe(el));

  // Safety net: if a counter is still un-animated 2.5s after page load
  // (prerender, screenshot scrape, tall layout above the fold etc.),
  // pop in the final value instead of leaving a zero on screen.
  window.addEventListener('load', () => {
    setTimeout(() => {
      values.forEach((el) => {
        if (!el.dataset.animated) {
          el.dataset.animated = '1';
          setFinal(el);
          observer.unobserve(el);
        }
      });
    }, 2500);
  });
})();

// Lightbox for design tiles + gallery
(function () {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  if (!lightbox || !lightboxImg) return;
  const triggers = document.querySelectorAll('.gallery-trigger');
  triggers.forEach((t) => {
    t.addEventListener('click', () => {
      const src = t.dataset.src || t.querySelector('img')?.src;
      if (!src) return;
      lightboxImg.src = src;
      lightboxImg.alt = t.querySelector('img')?.alt || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  const close = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-close')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();
