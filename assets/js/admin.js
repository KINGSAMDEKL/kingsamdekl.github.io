/**
 * KINGSAMTECH PRO — Admin Dashboard Core Controller
 * Password Authentication, Article CRUD, Live Markdown Editor, and GitHub REST API Cloud Sync
 */

(function () {
  'use strict';

  // Constants & Defaults
  const DEFAULT_PASSWORD_HASH = 'de74db000c2aa20f272e1fc7043ca246a42d8b6bdde8a1200cf79b206511cf51'; // kingsam2026
  const STORAGE_KEYS = {
    HASH: 'kst_admin_hash',
    SESSION: 'kst_admin_session',
    ARTICLES: 'kst_admin_articles',
    GH_TOKEN: 'kst_gh_token',
    GH_REPO: 'kst_gh_repo',
    LAST_SYNC: 'kst_last_sync'
  };

  const DEFAULT_REPO = 'KINGSAMDEKL/kingsamdekl.github.io';
  const DEFAULT_AUTHOR = {
    name: 'Kingsam',
    role: 'Lead Tech Editor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
  };

  // State
  let articles = [];
  let currentEditingId = null;
  let hasUnsavedCloudChanges = false;
  let inactivityTimer = null;

  // Web Crypto Helper: Compute SHA-256 Hex Digest
  async function computeSha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // =========================================
  // 1. AUTHENTICATION & SECURITY
  // =========================================
  function getMasterHash() {
    return localStorage.getItem(STORAGE_KEYS.HASH) || DEFAULT_PASSWORD_HASH;
  }

  function isAuthenticated() {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION) === 'authenticated';
  }

  function setAuthenticated() {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, 'authenticated');
    resetInactivityTimer();
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    showLockScreen();
  }

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    // Auto-lock after 30 minutes of inactivity
    inactivityTimer = setTimeout(() => {
      showToast('Session timed out due to inactivity', 'info');
      logout();
    }, 30 * 60 * 1000);
  }

  // Attach activity listeners for auto-lock reset
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => {
      if (isAuthenticated()) resetInactivityTimer();
    }, { passive: true });
  });

  function showLockScreen() {
    const overlay = document.getElementById('lockScreenOverlay');
    const pwdInput = document.getElementById('lockPasswordInput');
    const errMsg = document.getElementById('lockErrorMsg');
    if (overlay) overlay.classList.remove('unlocked');
    if (pwdInput) {
      pwdInput.value = '';
      pwdInput.focus();
    }
    if (errMsg) errMsg.textContent = '';
  }

  function hideLockScreen() {
    const overlay = document.getElementById('lockScreenOverlay');
    if (overlay) overlay.classList.add('unlocked');
  }

  async function handleUnlock(e) {
    if (e) e.preventDefault();
    const pwdInput = document.getElementById('lockPasswordInput');
    const errMsg = document.getElementById('lockErrorMsg');
    const password = pwdInput ? pwdInput.value : '';

    if (!password) {
      errMsg.textContent = 'Please enter your password.';
      return;
    }

    const hash = await computeSha256(password);
    const targetHash = getMasterHash();

    if (hash === targetHash) {
      setAuthenticated();
      hideLockScreen();
      showToast('Welcome back, Admin!', 'success');
      loadInitialData();
      renderDashboard();
    } else {
      errMsg.textContent = 'Incorrect password. Access denied.';
      pwdInput.value = '';
      pwdInput.focus();
      // Shake animation
      const card = document.querySelector('.lock-card');
      if (card) {
        card.style.animation = 'none';
        card.offsetHeight; // trigger reflow
        card.style.animation = 'cardFadeIn 0.3s ease, shake 0.4s ease';
      }
    }
  }

  // =========================================
  // 2. DATA INITIALIZATION & LOCAL STORAGE
  // =========================================
  function loadInitialData() {
    const stored = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    if (stored) {
      try {
        articles = JSON.parse(stored);
      } catch (err) {
        console.error('Failed to parse cached articles', err);
        articles = typeof TECH_ARTICLES !== 'undefined' ? [...TECH_ARTICLES] : [];
      }
    } else if (typeof TECH_ARTICLES !== 'undefined' && Array.isArray(TECH_ARTICLES)) {
      articles = [...TECH_ARTICLES];
      saveArticlesLocally();
    } else {
      articles = [];
    }

    // Prefill GitHub Token in Settings if exists
    const tokenInput = document.getElementById('settingsGhToken');
    const repoInput = document.getElementById('settingsGhRepo');
    if (tokenInput) tokenInput.value = localStorage.getItem(STORAGE_KEYS.GH_TOKEN) || '';
    if (repoInput) repoInput.value = localStorage.getItem(STORAGE_KEYS.GH_REPO) || DEFAULT_REPO;
  }

  function saveArticlesLocally() {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
    hasUnsavedCloudChanges = true;
    updateSyncIndicator();
  }

  function updateSyncIndicator() {
    const pill = document.getElementById('cloudSyncPill');
    const dot = pill ? pill.querySelector('.sync-pulse-dot') : null;
    const text = pill ? pill.querySelector('span') : null;
    if (!pill) return;

    if (hasUnsavedCloudChanges) {
      pill.classList.add('unsaved');
      if (text) text.textContent = 'Unsaved Changes';
    } else {
      pill.classList.remove('unsaved');
      if (text) text.textContent = 'Synced to GitHub';
    }
  }

  // =========================================
  // 3. UI RENDERING & ROUTING
  // =========================================
  function switchTab(targetViewId) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === targetViewId);
    });

    document.querySelectorAll('.admin-view').forEach(view => {
      view.classList.toggle('active', view.id === targetViewId);
    });

    if (targetViewId === 'overviewView') {
      renderOverview();
    } else if (targetViewId === 'articlesView') {
      renderArticlesTable();
    } else if (targetViewId === 'editorView') {
      updateLivePreview();
    } else if (targetViewId === 'syncView') {
      renderSyncView();
    }
  }

  function renderDashboard() {
    renderOverview();
    renderArticlesTable();
    populateCategoryDropdowns();
  }

  // --- Overview ---
  function renderOverview() {
    const totalPostsEl = document.getElementById('statTotalPosts');
    const publishedEl = document.getElementById('statPublished');
    const draftsEl = document.getElementById('statDrafts');
    const totalWordsEl = document.getElementById('statTotalWords');

    const publishedCount = articles.filter(a => a.status !== 'draft').length;
    const draftsCount = articles.filter(a => a.status === 'draft').length;

    let totalWords = 0;
    articles.forEach(a => {
      const text = (a.content || '').replace(/<[^>]*>?/gm, '');
      totalWords += text.trim().split(/\s+/).filter(Boolean).length;
    });

    if (totalPostsEl) totalPostsEl.textContent = articles.length;
    if (publishedEl) publishedEl.textContent = publishedCount;
    if (draftsEl) draftsEl.textContent = draftsCount;
    if (totalWordsEl) totalWordsEl.textContent = totalWords.toLocaleString();

    // Render Recent Activity list
    const recentList = document.getElementById('recentActivityList');
    if (recentList) {
      const recent = [...articles].slice(0, 5);
      if (recent.length === 0) {
        recentList.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:24px;">No articles yet. Click "Create New Post" to start.</td></tr>`;
      } else {
        recentList.innerHTML = recent.map(post => `
          <tr>
            <td>
              <div class="table-post-cell">
                <img src="${post.coverImage || 'assets/images/placeholder.jpg'}" alt="" class="table-post-thumb" onerror="this.src='https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=120&q=80'"/>
                <div class="table-post-meta">
                  <div class="table-post-title">${escapeHtml(post.title)}</div>
                  <div class="table-post-slug">${escapeHtml(post.slug || post.id)}</div>
                </div>
              </div>
            </td>
            <td><span class="category-badge">${escapeHtml(post.category || 'General')}</span></td>
            <td><span class="status-badge ${post.status === 'draft' ? 'draft' : 'published'}">${post.status === 'draft' ? 'Draft' : 'Published'}</span></td>
            <td>${escapeHtml(post.date || 'Today')}</td>
            <td>
              <button class="btn-admin-secondary" onclick="window.kstAdmin.editArticle('${post.id}')" style="padding: 6px 10px; font-size: 12px;">
                <i class="ph ph-pencil-simple"></i> Edit
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  // --- Articles Table ---
  function renderArticlesTable() {
    const tableBody = document.getElementById('articlesTableBody');
    if (!tableBody) return;

    const searchVal = (document.getElementById('articlesSearchInput')?.value || '').toLowerCase().trim();
    const categoryVal = document.getElementById('articlesFilterCategory')?.value || '';
    const statusVal = document.getElementById('articlesFilterStatus')?.value || '';

    const filtered = articles.filter(item => {
      const matchesSearch = !searchVal || 
        (item.title && item.title.toLowerCase().includes(searchVal)) ||
        (item.slug && item.slug.toLowerCase().includes(searchVal)) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(searchVal));

      const matchesCat = !categoryVal || item.categorySlug === categoryVal || item.category === categoryVal;
      const isDraft = item.status === 'draft';
      const matchesStatus = !statusVal || (statusVal === 'draft' ? isDraft : !isDraft);

      return matchesSearch && matchesCat && matchesStatus;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 40px; color: #64748b;">
            <i class="ph ph-magnifying-glass" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
            No articles match your search criteria.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(post => `
      <tr>
        <td>
          <div class="table-post-cell">
            <img src="${post.coverImage || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=120&q=80'}" alt="" class="table-post-thumb" onerror="this.src='https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=120&q=80'"/>
            <div class="table-post-meta">
              <div class="table-post-title" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</div>
              <div class="table-post-slug">/${escapeHtml(post.slug || post.id)}</div>
            </div>
          </div>
        </td>
        <td><span class="category-badge">${escapeHtml(post.category || 'General')}</span></td>
        <td>
          <span class="status-badge ${post.status === 'draft' ? 'draft' : 'published'}">
            ${post.status === 'draft' ? '<i class="ph ph-clock"></i> Draft' : '<i class="ph ph-check-circle"></i> Published'}
          </span>
        </td>
        <td>${escapeHtml(post.date || 'September 16, 2026')}</td>
        <td>${escapeHtml(post.readTime || '4 min read')}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon-action edit" title="Edit Article" onclick="window.kstAdmin.editArticle('${post.id}')">
              <i class="ph ph-pencil-simple"></i>
            </button>
            <button class="btn-icon-action" title="Preview Article" onclick="window.kstAdmin.previewArticleModal('${post.id}')">
              <i class="ph ph-eye"></i>
            </button>
            <button class="btn-icon-action" title="Duplicate Article" onclick="window.kstAdmin.duplicateArticle('${post.id}')">
              <i class="ph ph-copy"></i>
            </button>
            <button class="btn-icon-action delete" title="Delete Article" onclick="window.kstAdmin.confirmDeleteArticle('${post.id}')">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function populateCategoryDropdowns() {
    const filterCat = document.getElementById('articlesFilterCategory');
    const editorCat = document.getElementById('editorCategory');
    if (!filterCat && !editorCat) return;

    const categories = new Set();
    articles.forEach(a => {
      if (a.category) categories.add(a.category);
    });

    const defaultCategories = [
      'Cybersecurity & VPN',
      'AI & Machine Learning',
      'Android & Mobile Tech',
      'Web Development',
      'Hardware & Gadgets'
    ];
    defaultCategories.forEach(c => categories.add(c));

    const optionsHtml = Array.from(categories).map(cat => 
      `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`
    ).join('');

    if (filterCat) {
      filterCat.innerHTML = `<option value="">All Categories</option>` + optionsHtml;
    }
    if (editorCat) {
      editorCat.innerHTML = optionsHtml;
    }
  }

  // =========================================
  // 4. POST EDITOR & LIVE PREVIEW
  // =========================================
  function resetEditorForm() {
    currentEditingId = null;
    const titleEl = document.getElementById('editorTitle');
    const slugEl = document.getElementById('editorSlug');
    const catEl = document.getElementById('editorCategory');
    const excerptEl = document.getElementById('editorExcerpt');
    const coverEl = document.getElementById('editorCoverImage');
    const authorEl = document.getElementById('editorAuthorName');
    const statusEl = document.getElementById('editorStatus');
    const featuredEl = document.getElementById('editorFeatured');
    const trendingEl = document.getElementById('editorTrending');
    const contentEl = document.getElementById('editorContent');

    if (titleEl) titleEl.value = '';
    if (slugEl) slugEl.value = '';
    if (catEl && catEl.options.length > 0) catEl.selectedIndex = 0;
    if (excerptEl) excerptEl.value = '';
    if (coverEl) coverEl.value = 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80';
    if (authorEl) authorEl.value = DEFAULT_AUTHOR.name;
    if (statusEl) statusEl.value = 'published';
    if (featuredEl) featuredEl.checked = false;
    if (trendingEl) trendingEl.checked = false;

    if (contentEl) {
      contentEl.value = `<h2>Introduction</h2>\n<p class="lead">Write your engaging hook and introduce the core subject...</p>\n\n<h2>Key Highlights & Features</h2>\n<p>Explain the most valuable points and step-by-step instructions here.</p>\n\n<blockquote>A notable takeaway or core piece of advice for your readers.</blockquote>\n\n<h2>Conclusion</h2>\n<p>Summarize the key takeaways and encourage reader discussion.</p>`;
    }

    const heading = document.getElementById('editorHeadingText');
    if (heading) heading.textContent = 'Create New Post';

    updateCoverThumbnail();
    updateLivePreview();
  }

  function editArticle(id) {
    const post = articles.find(a => a.id === id);
    if (!post) return;

    currentEditingId = id;
    switchTab('editorView');

    const titleEl = document.getElementById('editorTitle');
    const slugEl = document.getElementById('editorSlug');
    const catEl = document.getElementById('editorCategory');
    const excerptEl = document.getElementById('editorExcerpt');
    const coverEl = document.getElementById('editorCoverImage');
    const authorEl = document.getElementById('editorAuthorName');
    const statusEl = document.getElementById('editorStatus');
    const featuredEl = document.getElementById('editorFeatured');
    const trendingEl = document.getElementById('editorTrending');
    const contentEl = document.getElementById('editorContent');

    if (titleEl) titleEl.value = post.title || '';
    if (slugEl) slugEl.value = post.slug || post.id || '';
    if (catEl) catEl.value = post.category || '';
    if (excerptEl) excerptEl.value = post.excerpt || '';
    if (coverEl) coverEl.value = post.coverImage || '';
    if (authorEl) authorEl.value = (post.author && post.author.name) || DEFAULT_AUTHOR.name;
    if (statusEl) statusEl.value = post.status || 'published';
    if (featuredEl) featuredEl.checked = !!post.featured;
    if (trendingEl) trendingEl.checked = !!post.trending;
    if (contentEl) contentEl.value = (post.content || '').trim();

    const heading = document.getElementById('editorHeadingText');
    if (heading) heading.textContent = `Editing: ${post.title}`;

    updateCoverThumbnail();
    updateLivePreview();
  }

  function generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function updateCoverThumbnail() {
    const url = document.getElementById('editorCoverImage')?.value;
    const previewBox = document.getElementById('editorCoverThumbPreview');
    if (!previewBox) return;

    if (url) {
      previewBox.innerHTML = `<img src="${url}" alt="Cover preview" onerror="this.src='https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80'"/>`;
    } else {
      previewBox.innerHTML = `<div class="cover-preview-placeholder"><i class="ph ph-image"></i> No cover image set</div>`;
    }
  }

  function updateLivePreview() {
    const title = document.getElementById('editorTitle')?.value || 'Untitled Tech Article';
    const category = document.getElementById('editorCategory')?.value || 'Technology';
    const author = document.getElementById('editorAuthorName')?.value || 'Kingsam';
    const coverUrl = document.getElementById('editorCoverImage')?.value || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80';
    const rawContent = document.getElementById('editorContent')?.value || '';

    // Calculate word count & reading time
    const textOnly = rawContent.replace(/<[^>]*>?/gm, '');
    const wordCount = textOnly.trim().split(/\s+/).filter(Boolean).length;
    const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

    const wordCountEl = document.getElementById('editorWordCountDisplay');
    if (wordCountEl) {
      wordCountEl.textContent = `${wordCount} words • ~${readTimeMin} min read`;
    }

    // Populate preview pane
    const prevTitle = document.getElementById('previewTitle');
    const prevCategory = document.getElementById('previewCategory');
    const prevMeta = document.getElementById('previewMeta');
    const prevCover = document.getElementById('previewCover');
    const prevBody = document.getElementById('previewBody');

    if (prevTitle) prevTitle.textContent = title;
    if (prevCategory) prevCategory.textContent = category;
    if (prevMeta) prevMeta.textContent = `By ${author} • Today • ${readTimeMin} min read`;
    if (prevCover) prevCover.src = coverUrl;
    if (prevBody) prevBody.innerHTML = rawContent || '<p style="color:#64748b; font-style:italic;">Your article content preview will appear here...</p>';
  }

  function saveArticleFromEditor(status = 'published') {
    const titleEl = document.getElementById('editorTitle');
    const contentEl = document.getElementById('editorContent');
    const title = titleEl ? titleEl.value.trim() : '';

    if (!title) {
      showToast('Please enter an article title', 'error');
      titleEl?.focus();
      return;
    }

    const slug = document.getElementById('editorSlug')?.value.trim() || generateSlug(title);
    const category = document.getElementById('editorCategory')?.value.trim() || 'General';
    const categorySlug = generateSlug(category);
    const excerpt = document.getElementById('editorExcerpt')?.value.trim() || '';
    const coverImage = document.getElementById('editorCoverImage')?.value.trim() || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80';
    const authorName = document.getElementById('editorAuthorName')?.value.trim() || DEFAULT_AUTHOR.name;
    const featured = !!document.getElementById('editorFeatured')?.checked;
    const trending = !!document.getElementById('editorTrending')?.checked;
    const content = contentEl ? contentEl.value.trim() : '';

    const textOnly = content.replace(/<[^>]*>?/gm, '');
    const wordCount = textOnly.trim().split(/\s+/).filter(Boolean).length;
    const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    // Today's formatted date
    const dateStr = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

    const articleData = {
      id: slug,
      slug: slug,
      title: title,
      category: category,
      categorySlug: categorySlug,
      featured: featured,
      trending: trending,
      status: status,
      author: {
        name: authorName,
        role: 'Tech Contributor',
        avatar: DEFAULT_AUTHOR.avatar
      },
      date: dateStr,
      readTime: readTime,
      coverImage: coverImage,
      excerpt: excerpt || title,
      content: content
    };

    if (currentEditingId) {
      // Update existing
      const index = articles.findIndex(a => a.id === currentEditingId);
      if (index !== -1) {
        articles[index] = { ...articles[index], ...articleData };
        showToast('Article updated successfully!', 'success');
      }
    } else {
      // Check for duplicate ID
      let finalSlug = slug;
      let counter = 1;
      while (articles.some(a => a.id === finalSlug)) {
        finalSlug = `${slug}-${counter++}`;
      }
      articleData.id = finalSlug;
      articleData.slug = finalSlug;

      articles.unshift(articleData);
      showToast('New article created successfully!', 'success');
    }

    saveArticlesLocally();
    renderDashboard();
    switchTab('articlesView');
  }

  function duplicateArticle(id) {
    const post = articles.find(a => a.id === id);
    if (!post) return;

    const copy = JSON.parse(JSON.stringify(post));
    copy.title = `${copy.title} (Copy)`;
    copy.id = `${copy.id}-copy-${Date.now().toString().slice(-4)}`;
    copy.slug = copy.id;
    copy.status = 'draft';
    copy.date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

    articles.unshift(copy);
    saveArticlesLocally();
    renderDashboard();
    showToast('Article duplicated as draft', 'info');
  }

  let pendingDeleteId = null;

  function confirmDeleteArticle(id) {
    pendingDeleteId = id;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('open');
  }

  function executeDeleteArticle() {
    if (!pendingDeleteId) return;
    articles = articles.filter(a => a.id !== pendingDeleteId);
    pendingDeleteId = null;
    saveArticlesLocally();
    renderDashboard();
    closeModal('deleteModal');
    showToast('Article deleted', 'info');
  }

  function previewArticleModal(id) {
    const post = articles.find(a => a.id === id);
    if (!post) return;

    const modal = document.getElementById('previewModal');
    const contentEl = document.getElementById('previewModalContent');
    if (!modal || !contentEl) return;

    contentEl.innerHTML = `
      <div style="margin-bottom: 16px;">
        <span class="category-badge">${escapeHtml(post.category)}</span>
        <span class="status-badge ${post.status === 'draft' ? 'draft' : 'published'}" style="margin-left:8px;">${post.status === 'draft' ? 'Draft' : 'Published'}</span>
      </div>
      <h1 style="font-family:var(--admin-heading-font); font-size:24px; color:#fff; margin-bottom:12px;">${escapeHtml(post.title)}</h1>
      <p style="font-size:13px; color:#94a3b8; margin-bottom:16px;">By ${escapeHtml(post.author?.name || 'Kingsam')} • ${escapeHtml(post.date)} • ${escapeHtml(post.readTime)}</p>
      <img src="${post.coverImage}" alt="" style="width:100%; max-height:260px; object-fit:cover; border-radius:8px; margin-bottom:20px;"/>
      <div style="font-size:14px; line-height:1.7; color:#cbd5e1;">${post.content}</div>
    `;

    modal.classList.add('open');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  // --- Toolbar Insert Helpers ---
  function insertFormat(prefix, suffix = '') {
    const textarea = document.getElementById('editorContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = prefix + (selectedText || 'text') + suffix;

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || 'text').length);
    updateLivePreview();
  }

  // =========================================
  // 5. 1-CLICK GITHUB REST API CLOUD SYNC
  // =========================================
  function renderSyncView() {
    const token = localStorage.getItem(STORAGE_KEYS.GH_TOKEN);
    const tokenDisplay = document.getElementById('syncTokenStatusText');
    const publishBtn = document.getElementById('btnSyncCloudPublish');

    if (tokenDisplay) {
      if (token) {
        tokenDisplay.innerHTML = `<span style="color:var(--admin-success);"><i class="ph ph-check-circle"></i> Token configured (${token.slice(0, 7)}...)</span>`;
      } else {
        tokenDisplay.innerHTML = `<span style="color:var(--admin-warning);"><i class="ph ph-warning-circle"></i> No GitHub token configured yet</span>`;
      }
    }

    if (publishBtn) {
      publishBtn.disabled = !token;
    }
  }

  function generateArticlesJsContent() {
    const formattedJson = JSON.stringify(articles, null, 2);
    return `/**\n * KINGSAMTECH PRO — Structured Articles Database\n * Automatically generated and published via KINGSAMTECH PRO Admin Dashboard\n * Last Synced: ${new Date().toISOString()}\n */\n\nconst TECH_ARTICLES = ${formattedJson};\n`;
  }

  async function syncToGitHub() {
    const token = localStorage.getItem(STORAGE_KEYS.GH_TOKEN);
    const repo = localStorage.getItem(STORAGE_KEYS.GH_REPO) || DEFAULT_REPO;

    if (!token) {
      showToast('Please set your GitHub Personal Access Token in Settings first', 'error');
      switchTab('settingsView');
      return;
    }

    const publishBtn = document.getElementById('btnSyncCloudPublish');
    const originalBtnText = publishBtn ? publishBtn.innerHTML : '';
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Deploying to GitHub...`;
    }

    try {
      const filePath = 'assets/js/articles-data.js';
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

      // 1. Get current file SHA
      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });

      let currentSha = null;
      if (getRes.ok) {
        const fileData = await getRes.json();
        currentSha = fileData.sha;
      }

      // 2. Generate updated JavaScript string
      const fileContent = generateArticlesJsContent();

      // UTF-8 safe Base64 encoding
      const utf8Bytes = new TextEncoder().encode(fileContent);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const base64Content = btoa(binary);

      // 3. Commit update to GitHub
      const putBody = {
        message: `CMS: Update articles database via Admin Portal (${articles.length} posts)`,
        content: base64Content,
        branch: 'main'
      };
      if (currentSha) {
        putBody.sha = currentSha;
      }

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

      if (!putRes.ok) {
        const errorData = await putRes.json();
        throw new Error(errorData.message || 'GitHub API returned an error');
      }

      hasUnsavedCloudChanges = false;
      updateSyncIndicator();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      showToast('🚀 Successfully pushed to GitHub! Site will update in ~30s.', 'success');

    } catch (err) {
      console.error('Cloud Sync failed:', err);
      showToast(`Sync error: ${err.message}`, 'error');
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalBtnText;
      }
    }
  }

  function downloadArticlesDataFile() {
    const content = generateArticlesJsContent();
    const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'articles-data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded articles-data.js', 'success');
  }

  function copyJsToClipboard() {
    const content = generateArticlesJsContent();
    navigator.clipboard.writeText(content).then(() => {
      showToast('Copied JavaScript code to clipboard!', 'success');
    }).catch(err => {
      showToast('Failed to copy to clipboard', 'error');
    });
  }

  function exportBackupJson() {
    const data = JSON.stringify(articles, null, 2);
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kingsamtech-blog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported articles backup', 'success');
  }

  function importBackupJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          articles = imported;
          saveArticlesLocally();
          renderDashboard();
          showToast(`Imported ${imported.length} articles successfully!`, 'success');
        } else {
          showToast('Invalid backup file format (expected JSON array)', 'error');
        }
      } catch (err) {
        showToast('Failed to parse JSON file', 'error');
      }
    };
    reader.readAsText(file);
  }

  // =========================================
  // 6. SETTINGS & PASSWORD CHANGE
  // =========================================
  async function handlePasswordChange(e) {
    e.preventDefault();
    const currentEl = document.getElementById('currentPasswordInput');
    const newEl = document.getElementById('newPasswordInput');
    const confirmEl = document.getElementById('confirmPasswordInput');

    const currentPwd = currentEl?.value || '';
    const newPwd = newEl?.value || '';
    const confirmPwd = confirmEl?.value || '';

    if (!currentPwd || !newPwd || !confirmPwd) {
      showToast('Please fill out all password fields', 'error');
      return;
    }

    const currentHash = await computeSha256(currentPwd);
    if (currentHash !== getMasterHash()) {
      showToast('Current password does not match', 'error');
      return;
    }

    if (newPwd !== confirmPwd) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPwd.length < 6) {
      showToast('Password should be at least 6 characters long', 'error');
      return;
    }

    const newHash = await computeSha256(newPwd);
    localStorage.setItem(STORAGE_KEYS.HASH, newHash);

    currentEl.value = '';
    newEl.value = '';
    confirmEl.value = '';
    showToast('Dashboard password changed successfully!', 'success');
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    const token = document.getElementById('settingsGhToken')?.value.trim() || '';
    const repo = document.getElementById('settingsGhRepo')?.value.trim() || DEFAULT_REPO;

    localStorage.setItem(STORAGE_KEYS.GH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.GH_REPO, repo);

    showToast('Settings saved successfully!', 'success');
    renderSyncView();
  }

  function resetAllToDefault() {
    if (confirm('Are you sure you want to reset articles back to the default database? Any local unsynced edits will be lost.')) {
      if (typeof TECH_ARTICLES !== 'undefined') {
        articles = [...TECH_ARTICLES];
        saveArticlesLocally();
        renderDashboard();
        showToast('Reset to default articles', 'info');
      }
    }
  }

  // =========================================
  // 7. TOAST NOTIFICATIONS HELPER
  // =========================================
  function showToast(message, type = 'info') {
    let container = document.querySelector('.admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'admin-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'warning-circle';

    toast.innerHTML = `<i class="ph ph-${icon}" style="font-size:18px;"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================
  // 8. EVENT BINDING ON DOM READY
  // =========================================
  document.addEventListener('DOMContentLoaded', () => {
    // Check initial authentication
    if (isAuthenticated()) {
      hideLockScreen();
      loadInitialData();
      renderDashboard();
    } else {
      showLockScreen();
    }

    // Lock Form Submit
    const lockForm = document.getElementById('lockForm');
    if (lockForm) lockForm.addEventListener('submit', handleUnlock);

    // Toggle Password Visibility
    const togglePwdBtn = document.getElementById('toggleLockPwdBtn');
    if (togglePwdBtn) {
      togglePwdBtn.addEventListener('click', () => {
        const input = document.getElementById('lockPasswordInput');
        if (!input) return;
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        togglePwdBtn.innerHTML = `<i class="ph ph-${isPwd ? 'eye-slash' : 'eye'}"></i>`;
      });
    }

    // Logout / Lock Button
    const lockBtn = document.getElementById('adminHeaderLockBtn');
    if (lockBtn) lockBtn.addEventListener('click', logout);

    // Tab Navigation
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.view));
    });

    // Quick Action: New Post
    const newPostBtns = document.querySelectorAll('.btn-action-new-post');
    newPostBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        resetEditorForm();
        switchTab('editorView');
      });
    });

    // Editor Auto Slug from Title
    const titleInput = document.getElementById('editorTitle');
    const slugInput = document.getElementById('editorSlug');
    if (titleInput && slugInput) {
      titleInput.addEventListener('input', () => {
        if (!currentEditingId) {
          slugInput.value = generateSlug(titleInput.value);
        }
        updateLivePreview();
      });
    }

    // Editor inputs live preview listener
    ['editorTitle', 'editorCategory', 'editorAuthorName', 'editorCoverImage', 'editorContent'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => {
        if (id === 'editorCoverImage') updateCoverThumbnail();
        updateLivePreview();
      });
    });

    // Cover Image Quick Presets
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const url = chip.dataset.url;
        const coverInput = document.getElementById('editorCoverImage');
        if (coverInput && url) {
          coverInput.value = url;
          updateCoverThumbnail();
          updateLivePreview();
        }
      });
    });

    // Editor Save Buttons
    const btnSavePublish = document.getElementById('btnEditorSavePublish');
    const btnSaveDraft = document.getElementById('btnEditorSaveDraft');
    if (btnSavePublish) btnSavePublish.addEventListener('click', () => saveArticleFromEditor('published'));
    if (btnSaveDraft) btnSaveDraft.addEventListener('click', () => saveArticleFromEditor('draft'));

    // Formatting Toolbar Buttons
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        if (format === 'bold') insertFormat('**', '**');
        else if (format === 'italic') insertFormat('*', '*');
        else if (format === 'h2') insertFormat('\n<h2>', '</h2>\n');
        else if (format === 'h3') insertFormat('\n<h3>', '</h3>\n');
        else if (format === 'code') insertFormat('\n<pre><code class="language-bash">\n', '\n</code></pre>\n');
        else if (format === 'quote') insertFormat('\n<blockquote>', '</blockquote>\n');
        else if (format === 'ul') insertFormat('\n<ul>\n  <li>', '</li>\n</ul>\n');
        else if (format === 'link') insertFormat('<a href="https://example.com">', '</a>');
        else if (format === 'image') insertFormat('<img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80" alt="');
      });
    });

    // Filter Listeners
    const searchInput = document.getElementById('articlesSearchInput');
    const filterCat = document.getElementById('articlesFilterCategory');
    const filterStatus = document.getElementById('articlesFilterStatus');
    if (searchInput) searchInput.addEventListener('input', renderArticlesTable);
    if (filterCat) filterCat.addEventListener('change', renderArticlesTable);
    if (filterStatus) filterStatus.addEventListener('change', renderArticlesTable);

    // Delete Modal Actions
    const confirmDeleteBtn = document.getElementById('btnConfirmDelete');
    const cancelDeleteBtn = document.getElementById('btnCancelDelete');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', executeDeleteArticle);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => closeModal('deleteModal'));

    // Preview Modal Close
    const closePreviewBtn = document.getElementById('btnClosePreviewModal');
    if (closePreviewBtn) closePreviewBtn.addEventListener('click', () => closeModal('previewModal'));

    // Cloud Sync Buttons
    const btnCloudPublish = document.getElementById('btnSyncCloudPublish');
    const btnDownloadJs = document.getElementById('btnSyncDownloadJs');
    const btnCopyJs = document.getElementById('btnSyncCopyJs');
    const btnExportJson = document.getElementById('btnSyncExportJson');
    const importFileInput = document.getElementById('importBackupFileInput');

    if (btnCloudPublish) btnCloudPublish.addEventListener('click', syncToGitHub);
    if (btnDownloadJs) btnDownloadJs.addEventListener('click', downloadArticlesDataFile);
    if (btnCopyJs) btnCopyJs.addEventListener('click', copyJsToClipboard);
    if (btnExportJson) btnExportJson.addEventListener('click', exportBackupJson);
    if (importFileInput) importFileInput.addEventListener('change', importBackupJson);

    // Settings Forms
    const pwdForm = document.getElementById('settingsPasswordForm');
    const ghForm = document.getElementById('settingsGithubForm');
    const resetBtn = document.getElementById('btnResetDefaultData');

    if (pwdForm) pwdForm.addEventListener('submit', handlePasswordChange);
    if (ghForm) ghForm.addEventListener('submit', handleSaveSettings);
    if (resetBtn) resetBtn.addEventListener('click', resetAllToDefault);
  });

  // Export global API for inline button handlers
  window.kstAdmin = {
    editArticle,
    duplicateArticle,
    confirmDeleteArticle,
    previewArticleModal,
    closeModal,
    syncToGitHub
  };
})();
