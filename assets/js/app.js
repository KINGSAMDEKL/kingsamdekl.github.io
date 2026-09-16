/**
 * KINGSAMTECH PRO — Core Application Logic
 * Theme manager, Navigation, Toasts, Reading Progress, Newsletter
 */

(function () {
  'use strict';

  // 1. Theme Manager (Dark / Light)
  const THEME_KEY = 'kingsamtech_theme';
  const root = document.documentElement;

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeTheme = saved ? saved : (prefersDark ? 'dark' : 'light');
    setTheme(activeTheme);
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeIcons(theme);
  }

  function updateThemeIcons(theme) {
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
      }
    });
  }

  // 2. Mobile Drawer Navigation
  function initMobileDrawer() {
    const toggleBtn = document.getElementById('mobile-drawer-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const closeBtn = document.getElementById('mobile-drawer-close');
    const backdrop = document.getElementById('drawer-backdrop');

    if (!drawer) return;

    function openDrawer() {
      drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }

    if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
  }

  // 3. Global Notification Toasts
  window.showToast = function (message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const iconClass = type === 'success' ? 'ph-check-circle' : type === 'error' ? 'ph-x-circle' : 'ph-info';
    const accentColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

    toast.style.cssText = `
      background: var(--bg-surface-elevated, #142244);
      color: var(--text-primary, #ffffff);
      border: 1px solid var(--border-medium, rgba(255,255,255,0.15));
      border-left: 4px solid ${accentColor};
      padding: 12px 18px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      font-size: 13.5px;
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: auto;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    `;

    toast.innerHTML = `<i class="ph ${iconClass}" style="font-size: 18px; color: ${accentColor};"></i> <span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(-10px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  // 4. Newsletter Subscription Form Handler
  function initNewsletter() {
    const forms = document.querySelectorAll('.newsletter-form');
    forms.forEach(form => {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        if (input && input.value.trim()) {
          const email = input.value.trim();
          showToast(`Thank you! ${email} has been subscribed to tech updates.`, 'success');
          input.value = '';
        }
      });
    });
  }

  // 5. Cookie Consent Initialization
  function initCookieConsent() {
    const banner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('cookie-accept-btn');
    if (!banner || !acceptBtn) return;

    if (!localStorage.getItem('kingsamtech_cookie_ok')) {
      setTimeout(() => banner.classList.add('show'), 1200);
    }

    acceptBtn.addEventListener('click', () => {
      banner.classList.remove('show');
      localStorage.setItem('kingsamtech_cookie_ok', 'true');
      showToast('Preferences saved!', 'info');
    });
  }

  // DOM Ready initialization
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileDrawer();
    initNewsletter();
    initCookieConsent();

    // Attach theme toggle click handlers
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
      });
    });
  });

})();
