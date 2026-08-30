(() => {
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

  fetch('/runtime/site-config.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : null)
    .then((config) => {
      if (config) applyConfig(config);
    })
    .catch(() => {
      // The tracked repository intentionally works without local/private config.
    });
})();
