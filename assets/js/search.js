/**
 * KINGSAMTECH PRO — Search & Category Filtering Engine
 * Real-time instant debounced client-side filtering
 */

(function () {
  'use strict';

  let activeCategory = 'all';
  let searchQuery = '';

  function renderPostCard(article) {
    const isBookmarked = window.isArticleBookmarked && window.isArticleBookmarked(article.id);
    return `
      <article class="post-card" data-category="${article.categorySlug}" data-id="${article.id}">
        <div class="card-image-wrap">
          <a href="article.html?id=${article.id}">
            <img src="${article.coverImage}" alt="${article.title}" loading="lazy"/>
          </a>
          <span class="badge card-badge">${article.category}</span>
          <button class="bookmark-btn ${isBookmarked ? 'saved' : ''}" 
                  data-id="${article.id}" 
                  title="${isBookmarked ? 'Remove from Saved' : 'Save for Later'}"
                  aria-label="Bookmark article">
            <i class="ph ${isBookmarked ? 'ph-bookmark-simple-fill' : 'ph-bookmark-simple'}"></i>
          </button>
        </div>
        <div class="card-content">
          <h3 class="card-title">
            <a href="article.html?id=${article.id}">${article.title}</a>
          </h3>
          <p class="card-excerpt">${article.excerpt}</p>
          <div class="card-meta">
            <div class="meta-author">
              <img src="${article.author.avatar}" alt="${article.author.name}"/>
              <span>${article.author.name}</span>
            </div>
            <span class="read-time-pill"><i class="ph ph-clock"></i> ${article.readTime}</span>
          </div>
        </div>
      </article>
    `;
  }

  function filterAndDisplayArticles() {
    const grid = document.getElementById('articles-grid');
    const resultCount = document.getElementById('search-result-count');
    if (!grid) return;

    const all = typeof getAllArticles === 'function' ? getAllArticles() : [];
    const query = searchQuery.trim().toLowerCase();

    const filtered = all.filter(article => {
      const matchCat = activeCategory === 'all' || article.categorySlug === activeCategory;
      const matchQuery = !query || 
        article.title.toLowerCase().includes(query) || 
        article.excerpt.toLowerCase().includes(query) || 
        article.category.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (resultCount) {
      resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'story' : 'stories'}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 64px 20px;">
          <div style="font-size: 48px; color: var(--text-muted); margin-bottom: 14px;">
            <i class="ph ph-magnifying-glass"></i>
          </div>
          <h3 style="margin-bottom: 8px;">No matching stories found</h3>
          <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto 20px;">
            Try adjusting your search terms or select another category pill.
          </p>
          <button class="btn-primary" id="clear-search-btn">Clear Filters</button>
        </div>
      `;
      const clearBtn = document.getElementById('clear-search-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          const input = document.getElementById('main-search-input');
          if (input) input.value = '';
          searchQuery = '';
          activeCategory = 'all';
          updatePillStyles();
          filterAndDisplayArticles();
        });
      }
      return;
    }

    grid.innerHTML = filtered.map(renderPostCard).join('');
    attachBookmarkHandlers();
  }

  function updatePillStyles() {
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(pill => {
      const cat = pill.getAttribute('data-cat');
      pill.classList.toggle('active', cat === activeCategory);
    });
  }

  function attachBookmarkHandlers() {
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (window.toggleBookmark) {
          const saved = window.toggleBookmark(id);
          btn.classList.toggle('saved', saved);
          const icon = btn.querySelector('i');
          if (icon) {
            icon.className = saved ? 'ph ph-bookmark-simple-fill' : 'ph ph-bookmark-simple';
          }
        }
      });
    });
  }

  // Debounce utility
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Initial Render
    filterAndDisplayArticles();

    // Category Pills
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        activeCategory = pill.getAttribute('data-cat') || 'all';
        updatePillStyles();
        filterAndDisplayArticles();
      });
    });

    // Search Input
    const searchInput = document.getElementById('main-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        searchQuery = e.target.value;
        filterAndDisplayArticles();
      }, 160));
    }
  });

  // Re-export for external calls
  window.refreshArticlesGrid = filterAndDisplayArticles;

})();
