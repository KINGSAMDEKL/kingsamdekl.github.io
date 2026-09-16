/**
 * KINGSAMTECH PRO — Local Bookmarks & Read Later Manager
 * Client-side article saving powered by localStorage
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'kingsamtech_saved_articles';

  function getBookmarks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveBookmarks(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      updateBookmarkBadges();
    } catch (e) {}
  }

  window.isArticleBookmarked = function (id) {
    const list = getBookmarks();
    return list.includes(id);
  };

  window.toggleBookmark = function (id) {
    let list = getBookmarks();
    let isSaved = false;
    if (list.includes(id)) {
      list = list.filter(item => item !== id);
      if (window.showToast) window.showToast('Removed from Read Later list');
    } else {
      list.push(id);
      isSaved = true;
      if (window.showToast) window.showToast('Saved to Read Later list!', 'success');
    }
    saveBookmarks(list);
    return isSaved;
  };

  function updateBookmarkBadges() {
    const list = getBookmarks();
    document.querySelectorAll('.bookmark-count-badge').forEach(badge => {
      badge.textContent = list.length;
      badge.style.display = list.length > 0 ? 'flex' : 'none';
    });
  }

  function createBookmarksDrawerDOM() {
    const drawer = document.createElement('div');
    drawer.id = 'bookmarks-drawer';
    drawer.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 100%;
      max-width: 420px;
      height: 100vh;
      background: var(--bg-surface-elevated, #0e1830);
      border-left: 1px solid var(--border-medium);
      box-shadow: var(--shadow-lg);
      z-index: 2500;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      display: flex;
      flex-direction: column;
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'bookmarks-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 18, 0.7);
      backdrop-filter: blur(8px);
      z-index: 2400;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    `;

    drawer.innerHTML = `
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="ph ph-bookmark-simple-fill" style="color: var(--accent-amber); font-size: 20px;"></i>
          <h3 style="font-size: 1.1rem; margin: 0;">Read Later (<span id="drawer-bookmark-count">0</span>)</h3>
        </div>
        <button id="close-bookmarks-btn" class="action-icon-btn" style="width: 32px; height: 32px;">
          <i class="ph ph-x"></i>
        </button>
      </div>
      <div id="bookmarks-items-list" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px;">
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    backdrop.addEventListener('click', closeBookmarksDrawer);
    drawer.querySelector('#close-bookmarks-btn').addEventListener('click', closeBookmarksDrawer);
  }

  function renderBookmarksList() {
    const list = getBookmarks();
    const container = document.getElementById('bookmarks-items-list');
    const countSpan = document.getElementById('drawer-bookmark-count');
    if (!container) return;

    if (countSpan) countSpan.textContent = list.length;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
          <i class="ph ph-bookmark-simple" style="font-size: 42px; margin-bottom: 12px; display: block;"></i>
          <p style="font-size: 14px;">No saved stories yet.</p>
          <p style="font-size: 12.5px; color: var(--text-secondary);">Click the star or bookmark icon on any article to save it for later.</p>
        </div>
      `;
      return;
    }

    const all = typeof getAllArticles === 'function' ? getAllArticles() : [];
    const savedArticles = all.filter(a => list.includes(a.id));

    container.innerHTML = savedArticles.map(a => `
      <div style="display: grid; grid-template-columns: 80px 1fr auto; gap: 14px; padding: 12px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); align-items: center;">
        <img src="${a.coverImage}" alt="${a.title}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px;"/>
        <div style="min-width: 0;">
          <a href="article.html?id=${a.id}" style="font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${a.title}
          </a>
          <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 600;">${a.readTime}</span>
        </div>
        <button class="remove-saved-btn" data-id="${a.id}" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 6px;" title="Remove">
          <i class="ph ph-trash" style="font-size: 16px;"></i>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.remove-saved-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.toggleBookmark(id);
        renderBookmarksList();
        if (window.refreshArticlesGrid) window.refreshArticlesGrid();
      });
    });
  }

  function openBookmarksDrawer() {
    let drawer = document.getElementById('bookmarks-drawer');
    if (!drawer) {
      createBookmarksDrawerDOM();
      drawer = document.getElementById('bookmarks-drawer');
    }
    const backdrop = document.getElementById('bookmarks-backdrop');
    renderBookmarksList();
    drawer.style.transform = 'translateX(0)';
    if (backdrop) {
      backdrop.style.opacity = '1';
      backdrop.style.visibility = 'visible';
    }
  }

  function closeBookmarksDrawer() {
    const drawer = document.getElementById('bookmarks-drawer');
    const backdrop = document.getElementById('bookmarks-backdrop');
    if (drawer) drawer.style.transform = 'translateX(100%)';
    if (backdrop) {
      backdrop.style.opacity = '0';
      backdrop.style.visibility = 'hidden';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateBookmarkBadges();
    document.querySelectorAll('.open-bookmarks-trigger').forEach(btn => {
      btn.addEventListener('click', openBookmarksDrawer);
    });
  });

  window.openBookmarksDrawer = openBookmarksDrawer;
  window.closeBookmarksDrawer = closeBookmarksDrawer;

})();
