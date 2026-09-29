(() => {
  const themeKey = 'lifeloom-theme';
  const themeToggle = document.querySelector('[data-theme-toggle]');

  const applyTheme = (theme, persist = false) => {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;

    if (persist) {
      try {
        localStorage.setItem(themeKey, nextTheme);
      } catch {
        // Theme persistence is optional when storage is unavailable.
      }
    }

    document.querySelectorAll('[data-theme-logo]').forEach((logo) => {
      const source = nextTheme === 'light' ? logo.dataset.lightSrc : logo.dataset.darkSrc;
      if (source && logo.getAttribute('src') !== source) logo.src = source;
    });

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = nextTheme === 'light' ? '#f7f8fb' : '#0b0d12';

    if (themeToggle) {
      const label = nextTheme === 'light'
        ? themeToggle.dataset.darkLabel
        : themeToggle.dataset.lightLabel;
      themeToggle.setAttribute('aria-label', label || 'Toggle colour theme');
      themeToggle.title = label || 'Toggle colour theme';
      themeToggle.setAttribute('aria-pressed', String(nextTheme === 'light'));
    }
  };

  const initialTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  applyTheme(initialTheme);

  themeToggle?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', true);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === themeKey && (event.newValue === 'light' || event.newValue === 'dark')) {
      applyTheme(event.newValue);
    }
  });
  const menuButton = document.querySelector('[data-menu-button]');
  const navLinks = document.querySelector('[data-nav-links]');

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const applyConfig = (config) => {
    const brandAssets = config.brandAssets || {};

    document.querySelectorAll('[data-brand]').forEach((img) => {
      const asset = brandAssets[img.dataset.brand];
      if (asset) img.src = asset;
    });

    document.querySelectorAll('[data-brand-icon]').forEach((link) => {
      const asset = brandAssets[link.dataset.brandIcon];
      if (asset) link.href = asset;
    });

    const email = config.supportEmail;
    if (email) {
      document.querySelectorAll('[data-support-email]').forEach((link) => {
        const subject = link.dataset.supportSubject;
        link.href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

        if (link.dataset.showEmail === 'true') {
          link.textContent = `${email}${link.dataset.arrow === 'true' ? ' →' : ''}`;
        }
      });
    }

    const storeLinks = config.storeLinks || {};
    document.querySelectorAll('[data-store-link]').forEach((link) => {
      const url = storeLinks[link.dataset.storeLink];
      if (!url) return;
      link.href = url;
      link.hidden = false;
    });

    const hasStoreLink = Object.values(storeLinks).some(Boolean);
    document.querySelectorAll('[data-store-placeholder]').forEach((el) => {
      el.hidden = hasStoreLink;
    });
  };

  fetch('/runtime/site-config.json', { cache: 'no-cache' })
    .then((response) => response.ok ? response.json() : null)
    .then((config) => {
      if (config) applyConfig(config);
    })
    .catch(() => {
      // The tracked repository intentionally works without local/private config.
    });
})();
