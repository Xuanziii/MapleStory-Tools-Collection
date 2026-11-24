(() => {
  const THEME_KEY = 'ms_tools_theme';
  const root = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? '切換至淺色模式' : '切換至深色模式');
      btn.setAttribute('title', theme === 'dark' ? '切換至淺色模式' : '切換至深色模式');
      const sunIcon = btn.querySelector('.icon-sun');
      const moonIcon = btn.querySelector('.icon-moon');
      if (sunIcon && moonIcon) {
        sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
        moonIcon.style.display = theme === 'dark' ? 'none' : 'block';
      }
    }
  }

  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme());

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }

    const menuBtn = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if (menuBtn && navLinks) {
      menuBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    const dropdown = document.getElementById('tools-dropdown');
    const dropdownToggle = document.getElementById('tools-dropdown-toggle');
    if (dropdown && dropdownToggle) {
      dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        dropdownToggle.setAttribute('aria-expanded', String(isOpen));
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
          dropdownToggle.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('open');
          dropdownToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });
})();
