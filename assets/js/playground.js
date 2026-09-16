/**
 * KINGSAMTECH PRO — In-Browser Web Sandbox & Playground
 * Real-time HTML/CSS/JS execution engine in isolated sandbox frame
 */

(function () {
  'use strict';

  const PRESETS = {
    'glass-card': {
      html: `<div class="card-container">
  <div class="glass-card">
    <div class="card-badge">PRO EDITION</div>
    <h2>Cyber Tech Card</h2>
    <p>Hover over this card to witness modern CSS glassmorphism, dynamic backdrop blur, and smooth border reflections.</p>
    <button class="action-btn">Explore Features</button>
  </div>
</div>`,
      css: `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1e293b, #0f172a);
  font-family: system-ui, -apple-system, sans-serif;
}

.glass-card {
  width: 320px;
  padding: 32px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  color: #fff;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.glass-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 25px 60px rgba(59, 130, 246, 0.35);
  border-color: rgba(59, 130, 246, 0.5);
}

.card-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  padding: 4px 10px;
  border-radius: 99px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  margin-bottom: 16px;
}

h2 { margin: 0 0 10px; font-size: 22px; }
p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }

.action-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.action-btn:hover { background: #2563eb; }`,
      js: `console.log("Glassmorphic Card Loaded Successfully!");
document.querySelector('.action-btn').addEventListener('click', () => {
  alert("Button clicked! Live sandbox interactive test passed.");
});`
    },

    'neon-button': {
      html: `<div class="wrapper">
  <button class="neon-btn">
    <span></span>
    <span></span>
    <span></span>
    <span></span>
    LAUNCH PROTOCOL
  </button>
</div>`,
      css: `body {
  margin: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #050811;
  font-family: sans-serif;
}

.neon-btn {
  position: relative;
  padding: 18px 36px;
  color: #03e9f4;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 4px;
  text-transform: uppercase;
  background: transparent;
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: 0.5s;
}

.neon-btn:hover {
  background: #03e9f4;
  color: #050811;
  box-shadow: 0 0 10px #03e9f4, 0 0 40px #03e9f4, 0 0 80px #03e9f4;
}

.neon-btn span { position: absolute; display: block; }
.neon-btn span:nth-child(1) {
  top: 0; left: -100%; width: 100%; height: 2px;
  background: linear-gradient(90deg, transparent, #03e9f4);
  animation: btn-anim1 1.2s linear infinite;
}
@keyframes btn-anim1 {
  0% { left: -100%; } 50%, 100% { left: 100%; }
}`,
      js: `console.log("Neon Glow Button Mounted!");`
    },

    'tech-clock': {
      html: `<div class="clock-wrap">
  <div class="hud-label">SYSTEM TIME • UTC+3</div>
  <div id="digital-clock">00:00:00</div>
  <div id="digital-date">Loading...</div>
</div>`,
      css: `body {
  margin: 0;
  height: 100vh;
  display: grid;
  place-items: center;
  background: #020617;
  color: #38bdf8;
  font-family: 'JetBrains Mono', monospace, monospace;
}

.clock-wrap {
  text-align: center;
  padding: 40px 60px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 35px rgba(56, 189, 248, 0.15);
}

.hud-label {
  font-size: 11px;
  letter-spacing: 3px;
  opacity: 0.7;
  margin-bottom: 12px;
}

#digital-clock {
  font-size: 52px;
  font-weight: 800;
  text-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
}

#digital-date {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 10px;
  letter-spacing: 1px;
}`,
      js: `function updateClock() {
  const d = new Date();
  document.getElementById('digital-clock').textContent = d.toLocaleTimeString();
  document.getElementById('digital-date').textContent = d.toDateString().toUpperCase();
}
setInterval(updateClock, 1000);
updateClock();
console.log("Realtime Clock Running!");`
    }
  };

  let activeTab = 'html';
  let codeStore = { html: '', css: '', js: '' };

  function initPlayground() {
    loadPreset('glass-card');
    attachTabListeners();
    attachToolbarListeners();
    runCode();
  }

  function loadPreset(presetKey) {
    const preset = PRESETS[presetKey] || PRESETS['glass-card'];
    codeStore = {
      html: preset.html,
      css: preset.css,
      js: preset.js
    };
    updateTextarea();
  }

  function updateTextarea() {
    const textarea = document.getElementById('playground-editor');
    if (textarea) {
      textarea.value = codeStore[activeTab] || '';
    }
  }

  function attachTabListeners() {
    const tabs = document.querySelectorAll('.editor-tab');
    const textarea = document.getElementById('playground-editor');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Save current tab content
        if (textarea) {
          codeStore[activeTab] = textarea.value;
        }

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.getAttribute('data-lang');
        updateTextarea();
      });
    });

    if (textarea) {
      textarea.addEventListener('input', () => {
        codeStore[activeTab] = textarea.value;
        const autoRun = document.getElementById('auto-run-check');
        if (autoRun && autoRun.checked) {
          debouncedRun();
        }
      });

      // Handle Tab key insertion
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }
      });
    }
  }

  function attachToolbarListeners() {
    const runBtn = document.getElementById('run-code-btn');
    const resetBtn = document.getElementById('reset-code-btn');
    const presetSelect = document.getElementById('preset-select');
    const viewportBtns = document.querySelectorAll('.viewport-btn');
    const previewPane = document.querySelector('.preview-pane');

    if (runBtn) runBtn.addEventListener('click', runCode);

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const sel = presetSelect ? presetSelect.value : 'glass-card';
        loadPreset(sel);
        runCode();
        if (window.showToast) window.showToast('Reset to original preset template');
      });
    }

    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        loadPreset(e.target.value);
        runCode();
      });
    }

    // Viewport resizing
    viewportBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewportBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');

        if (previewPane) {
          previewPane.classList.remove('tablet-view', 'mobile-view');
          if (view === 'tablet') previewPane.classList.add('tablet-view');
          if (view === 'mobile') previewPane.classList.add('mobile-view');
        }
      });
    });
  }

  function runCode() {
    const iframe = document.getElementById('preview-frame');
    const textarea = document.getElementById('playground-editor');
    const consoleText = document.getElementById('console-output-text');
    if (!iframe) return;

    if (textarea) codeStore[activeTab] = textarea.value;

    const source = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          ${codeStore.css}
        </style>
      </head>
      <body>
        ${codeStore.html}
        <script>
          // Catch errors and log to parent
          window.onerror = function(msg, url, line) {
            window.parent.postMessage({ type: 'CONSOLE_ERROR', message: msg + ' (Line ' + line + ')' }, '*');
          };
          const _log = console.log;
          console.log = function(...args) {
            _log.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', message: args.join(' ') }, '*');
          };
          try {
            ${codeStore.js}
          } catch(err) {
            console.log("Error: " + err.message);
          }
        <\/script>
      </body>
      </html>
    `;

    const blob = new Blob([source], { type: 'text/html' });
    iframe.src = URL.createObjectURL(blob);

    if (consoleText) consoleText.textContent = 'Sandbox executed successfully at ' + new Date().toLocaleTimeString();
  }

  // Debounce helper
  let timer;
  function debouncedRun() {
    clearTimeout(timer);
    timer = setTimeout(runCode, 450);
  }

  // Listen for sandbox console messages
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'CONSOLE_LOG') {
      const el = document.getElementById('console-output-text');
      if (el) el.textContent = `> ${e.data.message}`;
    }
  });

  document.addEventListener('DOMContentLoaded', initPlayground);

})();
