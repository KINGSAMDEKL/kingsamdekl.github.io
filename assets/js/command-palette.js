/**
 * KINGSAMTECH PRO — Command Palette (Cmd+K / Ctrl+K)
 * Universal keyboard navigation and instant spotlight search
 */

(function () {
  'use strict';

  let selectedIndex = 0;
  let currentItems = [];

  const QUICK_ACTIONS = [
    { title: 'Admin Console & Editor', icon: 'ph-shield-check', url: 'admin.html', type: 'Navigation' },
    { title: 'Toggle Dark / Light Mode', icon: 'ph-sun-dim', action: 'toggle-theme', type: 'Preference' },
    { title: 'View Saved Bookmarks', icon: 'ph-bookmark-simple', action: 'open-bookmarks', type: 'Action' },
    { title: 'Filter by AI & Machine Learning', icon: 'ph-cpu', filter: 'ai', type: 'Filter' },
    { title: 'Filter by Cybersecurity & VPN', icon: 'ph-shield-check', filter: 'vpn', type: 'Filter' },
    { title: 'About KINGSAMTECH PRO', icon: 'ph-info', url: 'about.html', type: 'Navigation' }
  ];

  function createPaletteDOM() {
    const backdrop = document.createElement('div');
    backdrop.className = 'palette-backdrop';
    backdrop.id = 'command-palette-backdrop';

    backdrop.innerHTML = `
      <div class="palette-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
        <div class="palette-header">
          <i class="ph ph-magnifying-glass" style="font-size: 20px; color: var(--text-muted);"></i>
          <input type="text" id="palette-search-input" placeholder="Type a story title, tag, or command..." autocomplete="off"/>
          <span class="kbd-shortcut">ESC</span>
        </div>
        <div class="palette-results" id="palette-results-list"></div>
        <div class="palette-footer">
          <span><kbd class="kbd-shortcut">↑</kbd> <kbd class="kbd-shortcut">↓</kbd> to navigate</span>
          <span><kbd class="kbd-shortcut">↵</kbd> to select</span>
          <span><kbd class="kbd-shortcut">ESC</kbd> to close</span>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closePalette();
    });

    const input = backdrop.querySelector('#palette-search-input');
    input.addEventListener('input', (e) => {
      filterPalette(e.target.value);
    });

    input.addEventListener('keydown', handleKeyNavigation);
  }

  function openPalette() {
    let backdrop = document.getElementById('command-palette-backdrop');
    if (!backdrop) {
      createPaletteDOM();
      backdrop = document.getElementById('command-palette-backdrop');
    }

    backdrop.classList.add('open');
    const input = backdrop.querySelector('#palette-search-input');
    input.value = '';
    selectedIndex = 0;
    filterPalette('');
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    const backdrop = document.getElementById('command-palette-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  }

  function filterPalette(query) {
    const q = query.trim().toLowerCase();
    const articles = typeof getAllArticles === 'function' ? getAllArticles() : [];

    let results = [];

    // Match actions
    QUICK_ACTIONS.forEach(act => {
      if (!q || act.title.toLowerCase().includes(q) || act.type.toLowerCase().includes(q)) {
        results.push(act);
      }
    });

    // Match articles
    articles.forEach(art => {
      if (!q || art.title.toLowerCase().includes(q) || art.category.toLowerCase().includes(q)) {
        results.push({
          title: art.title,
          icon: 'ph-article',
          url: `article.html?id=${art.id}`,
          badge: art.category,
          type: 'Story'
        });
      }
    });

    currentItems = results;
    selectedIndex = 0;
    renderResults();
  }

  function renderResults() {
    const list = document.getElementById('palette-results-list');
    if (!list) return;

    if (currentItems.length === 0) {
      list.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13.5px;">
          No matching commands or articles found.
        </div>
      `;
      return;
    }

    list.innerHTML = currentItems.map((item, i) => `
      <div class="palette-item ${i === selectedIndex ? 'selected' : ''}" data-index="${i}">
        <i class="ph ${item.icon}"></i>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.title}
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">${item.type}</div>
        </div>
        ${item.badge ? `<span class="badge" style="font-size: 10px;">${item.badge}</span>` : ''}
      </div>
    `).join('');

    // Attach click triggers
    list.querySelectorAll('.palette-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        executeItem(currentItems[idx]);
      });
    });
  }

  function handleKeyNavigation(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentItems.length;
      renderResults();
      scrollSelectedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
      renderResults();
      scrollSelectedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentItems[selectedIndex]) {
        executeItem(currentItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      closePalette();
    }
  }

  function scrollSelectedIntoView() {
    const list = document.getElementById('palette-results-list');
    const selected = list ? list.querySelector('.palette-item.selected') : null;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  function executeItem(item) {
    closePalette();
    if (item.url) {
      window.location.href = item.url;
    } else if (item.action === 'toggle-theme') {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('kingsamtech_theme', next);
      if (window.showToast) window.showToast(`Switched to ${next} theme!`);
    } else if (item.action === 'open-bookmarks') {
      if (window.openBookmarksDrawer) window.openBookmarksDrawer();
    } else if (item.filter) {
      const pill = document.querySelector(`.cat-pill[data-cat="${item.filter}"]`);
      if (pill) pill.click();
    }
  }

  // Keyboard shortcut listener
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const backdrop = document.getElementById('command-palette-backdrop');
      if (backdrop && backdrop.classList.contains('open')) {
        closePalette();
      } else {
        openPalette();
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Search trigger buttons
    document.querySelectorAll('.search-trigger-btn').forEach(btn => {
      btn.addEventListener('click', openPalette);
    });
  });

  window.openCommandPalette = openPalette;
  window.closeCommandPalette = closePalette;

})();
