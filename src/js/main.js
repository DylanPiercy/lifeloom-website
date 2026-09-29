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

  const parseReleaseDate = (value) => {
    if (!value) return null;

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatReleaseDate = (date) => new Intl.DateTimeFormat(
    document.documentElement.lang || 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  ).format(date);

  const getReleaseState = (releaseDate) => {
    if (!releaseDate) return 'coming-soon';
    return releaseDate.getTime() <= Date.now() ? 'released' : 'scheduled';
  };

  const updateReleaseStatus = (element) => {
    const releaseDate = parseReleaseDate(element.dataset.releaseDate);
    const state = getReleaseState(releaseDate);
    if (state === 'released') {
      element.textContent = element.dataset.releasedLabel || 'Released';
      return;
    }
    if (state === 'scheduled') {
      const label = element.dataset.comingOnLabel || 'Coming on';
      element.textContent = `${label} ${formatReleaseDate(releaseDate)}`;
      return;
    }
    element.textContent = element.dataset.comingSoonLabel || 'Coming Soon';
  };

  const updateAvailability = (panel) => {
    const releaseDate = parseReleaseDate(panel.dataset.releaseDate);
    const state = getReleaseState(releaseDate);
    const appName = panel.dataset.appName || 'This app';
    const formattedDate = releaseDate ? formatReleaseDate(releaseDate) : '';
    const heading = panel.querySelector('[data-release-heading]');
    const description = panel.querySelector('[data-release-description]');
    const dateRow = panel.querySelector('[data-release-date-row]');
    const dateLabel = panel.querySelector('[data-release-date-label]');
    const dateValue = panel.querySelector('[data-release-date-value]');
    const platformLabel = panel.querySelector('[data-release-platform-label]');

    if (state === 'released') {
      if (heading) heading.textContent = `${appName} ${panel.dataset.releasedHeading || 'is available.'}`;
      if (description) description.textContent = `${panel.dataset.releasedDescription || 'Released on'} ${formattedDate}.`;
      if (dateRow) dateRow.hidden = false;
      if (dateLabel) dateLabel.textContent = panel.dataset.releasedLabel || 'Released';
      if (dateValue) dateValue.textContent = formattedDate;
      if (platformLabel) platformLabel.textContent = panel.dataset.availableOnLabel || 'Available on';
    } else if (state === 'scheduled') {
      if (heading) heading.textContent = `${appName} ${panel.dataset.scheduledHeading || 'is coming on'} ${formattedDate}.`;
      if (description) description.textContent = `${panel.dataset.scheduledDescription || 'This app is scheduled for release on'} ${formattedDate}.`;
      if (dateRow) dateRow.hidden = false;
      if (dateLabel) dateLabel.textContent = panel.dataset.comingOnLabel || 'Coming on';
      if (dateValue) dateValue.textContent = formattedDate;
      if (platformLabel) platformLabel.textContent = panel.dataset.inDevelopmentLabel || 'Currently being developed for';
    } else {
      if (heading) heading.textContent = `${appName} ${panel.dataset.comingSoonHeading || 'is coming soon.'}`;
      if (description) description.textContent = panel.dataset.comingSoonDescription || 'This app is currently in development.';
      if (dateRow) dateRow.hidden = true;
      if (platformLabel) platformLabel.textContent = panel.dataset.inDevelopmentLabel || 'Currently being developed for';
    }

    const releaseLinks = [...panel.querySelectorAll('[data-release-link]')];
    let hasVisibleReleaseLink = false;

    releaseLinks.forEach((link) => {
      const ready = link.dataset.linkReady === 'true';
      const visible = state === 'released' && ready;
      link.hidden = !visible;
      hasVisibleReleaseLink ||= visible;
    });

    const releaseLinksContainer = panel.querySelector('[data-release-links]');
    if (releaseLinksContainer) releaseLinksContainer.hidden = !hasVisibleReleaseLink;
  };

  const refreshReleaseStates = () => {
    document.querySelectorAll('[data-release-status]').forEach(updateReleaseStatus);
    document.querySelectorAll('[data-release-availability]').forEach(updateAvailability);
  };

  refreshReleaseStates();
  window.setInterval(refreshReleaseStates, 60 * 60 * 1000);

  const applyConfig = (config) => {
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
      link.dataset.linkReady = 'true';
    });

    refreshReleaseStates();

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
