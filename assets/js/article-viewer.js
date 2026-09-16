/**
 * KINGSAMTECH PRO — Article Viewer & Interactive Reader
 * Web Speech TTS, Dynamic TOC, Code Block Copy, Reading Progress, Social Share
 */

(function () {
  'use strict';

  let currentArticle = null;
  let speechUtterance = null;
  let isSpeaking = false;
  let speechRate = 1.0;

  function getArticleFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (typeof getArticleById === 'function') {
      return getArticleById(id);
    }
    return null;
  }

  function renderArticle() {
    currentArticle = getArticleFromUrl();
    if (!currentArticle) return;

    // Update document title & metadata
    document.title = `${currentArticle.title} — KINGSAMTECH PRO`;

    // Elements
    const titleEl = document.getElementById('article-title');
    const catEl = document.getElementById('article-category');
    const dateEl = document.getElementById('article-date');
    const readTimeEl = document.getElementById('article-read-time');
    const authorNameEl = document.getElementById('article-author-name');
    const authorRoleEl = document.getElementById('article-author-role');
    const authorAvatarEl = document.getElementById('article-author-avatar');
    const coverEl = document.getElementById('article-cover');
    const bodyEl = document.getElementById('article-body-content');

    if (titleEl) titleEl.textContent = currentArticle.title;
    if (catEl) catEl.textContent = currentArticle.category;
    if (dateEl) dateEl.textContent = currentArticle.date;
    if (readTimeEl) readTimeEl.innerHTML = `<i class="ph ph-clock"></i> ${currentArticle.readTime}`;
    if (authorNameEl) authorNameEl.textContent = currentArticle.author.name;
    if (authorRoleEl) authorRoleEl.textContent = currentArticle.author.role;
    if (authorAvatarEl) authorAvatarEl.src = currentArticle.author.avatar;
    if (coverEl) coverEl.src = currentArticle.coverImage;
    if (bodyEl) {
      bodyEl.innerHTML = currentArticle.content;
      generateTableOfContents(bodyEl);
      enhanceCodeBlocks(bodyEl);
    }

    renderRelatedArticles();
    initReadingProgress();
    initAudioReader();
    initShareButtons();
  }

  // 1. Reading Progress Bar
  function initReadingProgress() {
    const bar = document.getElementById('reading-progress-indicator');
    if (!bar) return;

    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const st = h.scrollTop || document.body.scrollTop;
      const sh = h.scrollHeight || document.body.scrollHeight;
      const ch = h.clientHeight;
      const scrollPercent = (st / (sh - ch)) * 100;
      bar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
    }, { passive: true });
  }

  // 2. Table of Contents Generator
  function generateTableOfContents(contentEl) {
    const tocContainer = document.getElementById('article-toc-container');
    if (!tocContainer) return;

    const headings = contentEl.querySelectorAll('h2, h3');
    if (headings.length < 2) {
      tocContainer.style.display = 'none';
      return;
    }

    const ol = document.createElement('ol');
    headings.forEach((h, index) => {
      if (!h.id) {
        h.id = `heading-${index}-${h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      }
      const li = document.createElement('li');
      if (h.tagName.toLowerCase() === 'h3') {
        li.style.marginLeft = '18px';
      }
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, null, `#${h.id}`);
      });
      li.appendChild(a);
      ol.appendChild(li);
    });

    tocContainer.appendChild(ol);
  }

  // 3. Code Block Copy Buttons
  function enhanceCodeBlocks(contentEl) {
    const pres = contentEl.querySelectorAll('pre');
    pres.forEach(pre => {
      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.type = 'button';
      btn.innerHTML = '<i class="ph ph-copy"></i> Copy';

      btn.addEventListener('click', () => {
        const code = pre.querySelector('code') || pre;
        const text = code.innerText || code.textContent;
        navigator.clipboard.writeText(text).then(() => {
          btn.classList.add('copied');
          btn.innerHTML = '<i class="ph ph-check"></i> Copied!';
          if (window.showToast) window.showToast('Code copied to clipboard!', 'success');
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<i class="ph ph-copy"></i> Copy';
          }, 2200);
        });
      });

      pre.appendChild(btn);
    });
  }

  // 4. Web Speech Audio Reader (Native Text-to-Speech)
  function initAudioReader() {
    const playBtn = document.getElementById('tts-play-btn');
    const speedBtn = document.getElementById('tts-speed-btn');
    const statusEl = document.getElementById('tts-status');

    if (!('speechSynthesis' in window)) {
      const bar = document.querySelector('.audio-reader-bar');
      if (bar) bar.style.display = 'none';
      return;
    }

    const rates = [1.0, 1.25, 1.5, 2.0];
    let rateIndex = 0;

    function getArticleText() {
      const body = document.getElementById('article-body-content');
      return body ? body.innerText || body.textContent : '';
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (window.speechSynthesis.speaking) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            playBtn.innerHTML = '<i class="ph ph-pause"></i>';
            if (statusEl) statusEl.textContent = 'Listening to article...';
          } else {
            window.speechSynthesis.pause();
            playBtn.innerHTML = '<i class="ph ph-play"></i>';
            if (statusEl) statusEl.textContent = 'Audio paused';
          }
        } else {
          const text = getArticleText();
          speechUtterance = new SpeechSynthesisUtterance(text);
          speechUtterance.rate = speechRate;
          speechUtterance.pitch = 1.0;

          speechUtterance.onstart = () => {
            playBtn.innerHTML = '<i class="ph ph-pause"></i>';
            if (statusEl) statusEl.textContent = 'Listening to article...';
          };

          speechUtterance.onend = () => {
            playBtn.innerHTML = '<i class="ph ph-play"></i>';
            if (statusEl) statusEl.textContent = 'Listen to article';
          };

          speechUtterance.onerror = () => {
            playBtn.innerHTML = '<i class="ph ph-play"></i>';
            if (statusEl) statusEl.textContent = 'Listen to article';
          };

          window.speechSynthesis.speak(speechUtterance);
        }
      });
    }

    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        rateIndex = (rateIndex + 1) % rates.length;
        speechRate = rates[rateIndex];
        speedBtn.textContent = `${speechRate}x`;
        if (window.speechSynthesis.speaking && speechUtterance) {
          window.speechSynthesis.cancel();
          playBtn.click();
        }
      });
    }

    window.addEventListener('beforeunload', () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    });
  }

  // 5. Social Share
  function initShareButtons() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    const xBtn = document.getElementById('share-x');
    const linkedinBtn = document.getElementById('share-linkedin');
    const whatsappBtn = document.getElementById('share-whatsapp');
    const copyLinkBtn = document.getElementById('share-copy');

    if (xBtn) xBtn.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    if (linkedinBtn) linkedinBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (whatsappBtn) whatsappBtn.href = `https://api.whatsapp.com/send?text=${title}%20${url}`;

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(window.location.href).then(() => {
          if (window.showToast) window.showToast('Article URL copied to clipboard!', 'success');
        });
      });
    }
  }

  // 6. Related Articles Grid
  function renderRelatedArticles() {
    const grid = document.getElementById('related-articles-grid');
    if (!grid || !currentArticle) return;

    const all = typeof getAllArticles === 'function' ? getAllArticles() : [];
    const related = all
      .filter(a => a.id !== currentArticle.id)
      .slice(0, 3);

    grid.innerHTML = related.map(a => `
      <article class="post-card">
        <div class="card-image-wrap" style="height: 160px;">
          <a href="article.html?id=${a.id}">
            <img src="${a.coverImage}" alt="${a.title}" loading="lazy"/>
          </a>
          <span class="badge card-badge" style="font-size: 10px;">${a.category}</span>
        </div>
        <div class="card-content" style="padding: 16px;">
          <h4 style="font-size: 1rem; line-height: 1.35;">
            <a href="article.html?id=${a.id}" style="color: inherit;">${a.title}</a>
          </h4>
          <span style="font-size: 11.5px; color: var(--accent-cyan); font-weight: 600; margin-top: 8px; display: block;">
            ${a.readTime}
          </span>
        </div>
      </article>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', renderArticle);

})();
