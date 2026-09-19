/* ============================================================
   ConnectYourLife — Parete TV
   UI Enhancer v3 — ESPHome web_server v3
   ============================================================ */

(async () => {

  /* ── 1. Header ── */
  const hdr = document.createElement('div');
  hdr.id = 'cyl-header';
  hdr.innerHTML = `
    <div class="cyl-left">
      <div class="cyl-mark">CYL</div>
      <div class="cyl-names">
        <span class="cyl-brand-name">ConnectYourLife</span>
        <span class="cyl-device-name">Parete TV</span>
      </div>
    </div>
    <div class="cyl-right">
      <div class="cyl-status">
        <span class="cyl-dot"></span>
        <span>Connesso</span>
      </div>
      <span class="cyl-clock" id="cyl-clock">--:--:--</span>
    </div>
  `;
  document.body.insertBefore(hdr, document.body.firstChild);
  document.body.style.paddingTop = '64px';

  /* ── 1b. Nome del device dal campo "Nome dispositivo" ──
     L'hostname e' fissato a compilazione, ma il nome MOSTRATO qui e' un text
     template modificabile dal pannello: lo si rilegge periodicamente cosi'
     l'header segue la modifica senza ricompilare nulla. */
  async function aggiornaNome() {
    try {
      const r = await fetch('/text/' + encodeURIComponent('Nome dispositivo'),
                            { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      const nome = (j.value ?? j.state ?? '').toString().trim();
      const el = hdr.querySelector('.cyl-device-name');
      if (nome && el && el.textContent !== nome) {
        el.textContent = nome;
      }
      if (nome) {
        window.__cylNome = nome;
        document.title = nome;
        applicaTitolo();
      }
    } catch (e) { /* entita' assente su questo device: si tiene il nome statico */ }
  }

  /* Il titolo grande e' un <h1> nello shadow DOM di esp-app, alimentato da
     config.title che il frontend riscrive a ogni ping SSE con il friendly_name
     compilato. Va quindi riapplicato, non impostato una volta sola. */
  function applicaTitolo() {
    const nome = window.__cylNome;
    if (!nome) return;
    const app = document.querySelector('esp-app');
    const h1 = app && app.shadowRoot && app.shadowRoot.querySelector('h1');
    if (h1 && h1.textContent.trim() !== nome) h1.textContent = nome;
  }
  aggiornaNome();
  setInterval(aggiornaNome, 10000);

  /* ── 2. Clock ── */
  function tick() {
    const el = document.getElementById('cyl-clock');
    if (el) el.textContent = new Date().toLocaleTimeString('it-IT');
  }
  tick();
  setInterval(tick, 1000);

  /* ── 3. Shadow DOM CSS ── */
  const SHADOW_CSS = `
    :host {
      display: block;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #f1f5f9;
    }

    /* ── Layout esterno: una sola colonna (quella dei log e' nascosta) ──
       Nota: nel frontend v3 attuale .flex-grid-half contiene le COLONNE, non le
       entity-row. La griglia delle card sta su .tab-container, piu' sotto. */
    .flex-grid-half {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 0 !important;
      padding: 28px 24px 72px !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box !important;
      align-items: start !important;
    }

    .flex-grid-half .col {
      width: 100% !important;
      margin: 0 !important;
      overflow: visible !important;
    }

    /* ── Griglia responsive delle card: le .entity-row sono figlie di questo ── */
    .tab-container {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
      gap: 12px !important;
      align-items: start !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      background: none !important;
    }

    /* Hide logs */
    #col_logs { display: none !important; }

    /* Dim native top bar */
    .top-icon, #logo, #beat, #scheme {
      opacity: .18 !important;
      transition: opacity .2s !important;
    }
    .top-icon:hover, #logo:hover, #beat:hover, #scheme:hover {
      opacity: .55 !important;
    }

    /* ── Section header ── */
    .tab-header {
      grid-column: 1 / -1 !important;
      width: 100% !important;
      box-sizing: border-box !important;
      background: none !important;
      border-radius: 0 !important;
      max-width: none !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 3px !important;
      color: #64748b !important;
      padding: 22px 2px 10px !important;
      border-bottom: 1px solid rgba(255,255,255,.06) !important;
      margin-bottom: 2px !important;
    }
    .tab-header::before {
      content: '' !important;
      display: block !important;
      width: 3px !important;
      height: 13px !important;
      background: linear-gradient(180deg, #f59e0b 0%, #ef4444 100%) !important;
      border-radius: 2px !important;
      flex-shrink: 0 !important;
    }

    /* ── Controls that need full width ── */
    .cyl-row--slider,
    .cyl-row--select,
    .cyl-row--number,
    .cyl-row--color {
      grid-column: 1 / -1 !important;
    }

    /* ── Entity card (generic) ── */
    .entity-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 14px !important;
      flex-wrap: wrap !important;
      box-sizing: border-box !important;
      max-width: 100% !important;
      background: rgba(255,255,255,.055) !important;
      border: 1px solid rgba(255,255,255,.09) !important;
      border-radius: 16px !important;
      padding: 18px 20px !important;
      margin-bottom: 0 !important;
      transition: border-color .3s, background .3s, box-shadow .3s !important;
      animation: cyl-up .4s cubic-bezier(.4,0,.2,1) both !important;
      box-shadow: 0 2px 14px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.065) !important;
    }
    .entity-row:hover {
      border-color: rgba(245,158,11,.32) !important;
      background: rgba(255,255,255,.075) !important;
      box-shadow: 0 0 0 1px rgba(245,158,11,.1), 0 8px 32px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.09) !important;
    }

    /* ── Preset-button tiles (singlebutton-row) ── */
    .singlebutton-row {
      background: rgba(255,255,255,.04) !important;
      border: 1px solid rgba(255,255,255,.07) !important;
      border-radius: 16px !important;
      padding: 10px !important;
      margin-bottom: 0 !important;
      box-shadow: 0 2px 8px rgba(0,0,0,.15), inset 0 1px 0 rgba(255,255,255,.04) !important;
      transition: border-color .25s, background .25s !important;
    }
    .singlebutton-row:hover {
      border-color: rgba(255,255,255,.12) !important;
      background: rgba(255,255,255,.06) !important;
    }
    /* Hide redundant label inside button tiles */
    .singlebutton-row .entity {
      display: none !important;
    }
    /* Make button fill the tile */
    .singlebutton-row button,
    .singlebutton-row .abutton {
      width: 100% !important;
      min-height: 52px !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      letter-spacing: .3px !important;
      border-radius: 12px !important;
    }

    /* ── Entity label ── */
    .entity {
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 1.5px !important;
      color: #475569 !important;
      margin-bottom: 12px !important;
    }

    /* ── Generic buttons ── */
    .abutton, button {
      background: rgba(255,255,255,.07) !important;
      color: #cbd5e1 !important;
      border: 1px solid rgba(255,255,255,.1) !important;
      border-radius: 11px !important;
      padding: 10px 20px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      font-family: inherit !important;
      cursor: pointer !important;
      transition: background .2s, border-color .2s, color .2s, box-shadow .2s !important;
      outline: none !important;
      letter-spacing: .2px !important;
      min-height: 40px !important;
    }
    .abutton:hover, button:hover {
      background: rgba(245,158,11,.14) !important;
      border-color: rgba(245,158,11,.45) !important;
      color: #fbbf24 !important;
    }
    .abutton:active, button:active {
      transform: scale(.96) !important;
    }

    /* ── Range slider with gradient fill ── */
    input[type=range] {
      -webkit-appearance: none !important;
      appearance: none !important;
      height: 5px !important;
      background: linear-gradient(
        to right,
        #f59e0b var(--val, 0%),
        rgba(255,255,255,.12) var(--val, 0%)
      ) !important;
      border-radius: 99px !important;
      outline: none !important;
      cursor: pointer !important;
      width: 100% !important;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none !important;
      width: 22px !important;
      height: 22px !important;
      border-radius: 50% !important;
      background: #f59e0b !important;
      box-shadow: 0 0 14px rgba(245,158,11,.65), 0 0 0 3px rgba(245,158,11,.2) !important;
      cursor: pointer !important;
      transition: box-shadow .2s !important;
    }
    input[type=range]::-webkit-slider-thumb:hover {
      box-shadow: 0 0 22px rgba(245,158,11,.85), 0 0 0 5px rgba(245,158,11,.25) !important;
    }
    input[type=range]::-moz-range-thumb {
      width: 22px !important;
      height: 22px !important;
      border-radius: 50% !important;
      background: #f59e0b !important;
      border: none !important;
      cursor: pointer !important;
    }

    .range-value {
      color: #f59e0b !important;
      font-weight: 700 !important;
      font-size: 15px !important;
      min-width: 44px !important;
      text-align: right !important;
    }

    /* ── Dropdown ── */
    select {
      background-color: rgba(255,255,255,.07) !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: calc(100% - 14px) center !important;
      background-size: 10px !important;
      color: #e2e8f0 !important;
      border: 1px solid rgba(255,255,255,.1) !important;
      border-radius: 10px !important;
      padding: 11px 36px 11px 14px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      font-family: inherit !important;
      cursor: pointer !important;
      outline: none !important;
      transition: border-color .2s, background-color .2s !important;
      -webkit-appearance: none !important;
      appearance: none !important;
      width: 100% !important;
    }
    select:hover, select:focus {
      border-color: rgba(245,158,11,.5) !important;
      background-color: rgba(255,255,255,.1) !important;
    }
    select option {
      background: #0d0d1e !important;
      color: #e2e8f0 !important;
    }

    /* ── Number / text inputs ── */
    input[type=number], input[type=text] {
      background: rgba(255,255,255,.07) !important;
      color: #e2e8f0 !important;
      border: 1px solid rgba(255,255,255,.1) !important;
      border-radius: 10px !important;
      padding: 10px 13px !important;
      font-size: 14px !important;
      font-family: inherit !important;
      outline: none !important;
      transition: border-color .2s, background .2s !important;
      width: 100% !important;
    }
    input[type=number]:focus, input[type=text]:focus {
      border-color: rgba(245,158,11,.5) !important;
      background: rgba(255,255,255,.1) !important;
    }

    /* ── Color picker ── */
    .colorpicker {
      margin-top: 12px !important;
      border-radius: 12px !important;
      overflow: hidden !important;
      box-shadow: 0 4px 24px rgba(0,0,0,.5) !important;
    }

    /* ── Sensor / state ── */
    .state, .sensor-state {
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #94a3b8 !important;
    }

    /* ── Contenimento dei controlli dentro la card ──
       Senza min-width:0 un flex item non scende sotto la sua larghezza
       intrinseca e sborda sulla card adiacente. */
    .entity-row > * {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    esp-range-slider {
      flex: 1 1 180px !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    esp-switch { flex-shrink: 0 !important; }

    /* ── Enter animation ── */
    @keyframes cyl-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
  `;

  /* ── 4. Inject CSS into shadow root via adoptedStyleSheets ── */
  const cylSheet = new CSSStyleSheet();
  cylSheet.replaceSync(SHADOW_CSS);

  async function injectIntoShadow(el) {
    if (!el || el._cyl) return;
    if (!el.shadowRoot) {
      await new Promise(res => {
        let tries = 0;
        const t = setInterval(() => {
          if (el.shadowRoot || ++tries > 40) { clearInterval(t); res(); }
        }, 50);
      });
    }
    if (!el.shadowRoot) return;
    el._cyl = true;
    const existing = el.shadowRoot.adoptedStyleSheets;
    if (!existing.includes(cylSheet)) {
      el.shadowRoot.adoptedStyleSheets = [...existing, cylSheet];
    }
  }

  /* ── 5. Classify entity rows for grid spanning ── */
  function classifyRows(root) {
    root.querySelectorAll('.entity-row:not([data-cyl-cls])').forEach(row => {
      row.setAttribute('data-cyl-cls', '1');
      // I controlli sono web component: l'input vero sta nel loro shadow DOM,
      // quindi si classifica sul tag, non su cio' che contengono.
      if (row.querySelector('esp-range-slider, input[type=range]'))     row.classList.add('cyl-row--slider');
      else if (row.querySelector('select'))                             row.classList.add('cyl-row--select');
      else if (row.querySelector('input[type=number]'))                 row.classList.add('cyl-row--number');
      else if (row.querySelector('.colorpicker, input[type=color]'))    row.classList.add('cyl-row--color');
    });
  }

  /* ── 6. Slider gradient fill (sets --val CSS variable) ── */
  function enhanceSliders(root) {
    root.querySelectorAll('input[type=range]:not([data-cyl-enh])').forEach(inp => {
      inp.setAttribute('data-cyl-enh', '1');
      function updateFill() {
        const min = parseFloat(inp.min) || 0;
        const max = parseFloat(inp.max) || 100;
        const pct = ((parseFloat(inp.value) - min) / (max - min) * 100).toFixed(1) + '%';
        inp.style.setProperty('--val', pct);
      }
      updateFill();
      inp.addEventListener('input', updateFill);
      inp.addEventListener('change', updateFill);
    });
    /* Recurse into nested shadow roots */
    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) enhanceSliders(el.shadowRoot);
    });
  }

  /* ── 7. Stagger card entry animations ── */
  function staggerCards(root) {
    root.querySelectorAll('.entity-row:not([data-cyl-stg]), .singlebutton-row:not([data-cyl-stg])').forEach((row, i) => {
      row.setAttribute('data-cyl-stg', '1');
      row.style.animationDelay = `${i * 35}ms`;
    });
  }

  /* ── 8. Wait for esp-app ── */
  await customElements.whenDefined('esp-app');
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  const app = document.querySelector('esp-app');
  if (!app) return;

  await injectIntoShadow(app);

  /* ── 9. Button color map ── */
  const COLOR_MAP = [
    { match: 'toggle luce', bg: 'rgba(245,158,11,.2)',  border: 'rgba(245,158,11,.55)', color: '#fbbf24', glow: 'rgba(245,158,11,.55)' },
    { match: 'bianco',      bg: 'rgba(255,253,220,.1)', border: 'rgba(255,253,220,.4)', color: '#fefce8', glow: 'rgba(255,253,220,.5)' },
    { match: 'rosso',       bg: 'rgba(239,68,68,.15)',  border: 'rgba(239,68,68,.45)',  color: '#fca5a5', glow: 'rgba(239,68,68,.5)'  },
    { match: 'verde',       bg: 'rgba(34,197,94,.13)',  border: 'rgba(34,197,94,.45)',  color: '#86efac', glow: 'rgba(34,197,94,.5)'  },
    { match: 'blu',         bg: 'rgba(59,130,246,.16)', border: 'rgba(59,130,246,.5)',  color: '#93c5fd', glow: 'rgba(59,130,246,.55)'},
    { match: 'notte',       bg: 'rgba(99,102,241,.14)', border: 'rgba(99,102,241,.45)', color: '#a5b4fc', glow: 'rgba(99,102,241,.5)' },
    { match: 'restart',     bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.2)', color: '#94a3b8', glow: ''                    },
  ];

  function colorButtons(root) {
    root.querySelectorAll('button, .abutton').forEach(btn => {
      if (btn._cyl_colored) return;
      const label = btn.textContent.trim().toLowerCase();
      const rule = COLOR_MAP.find(r => label.includes(r.match));
      if (!rule) return;
      btn._cyl_colored = true;
      Object.assign(btn.style, {
        background:  rule.bg,
        borderColor: rule.border,
        color:       rule.color,
      });
      if (rule.glow) {
        btn.addEventListener('mouseenter', () => {
          btn.style.boxShadow = `0 0 18px ${rule.glow}, 0 0 0 1px ${rule.border}`;
          btn.style.background = rule.bg.replace(/[\d.]+\)$/, m => (parseFloat(m) * 1.5).toFixed(2) + ')');
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.boxShadow = '';
          btn.style.background = rule.bg;
        });
      }
    });
  }

  /* ── 10. Apply all enhancements + observe for DOM changes ── */
  if (app.shadowRoot) {
    colorButtons(app.shadowRoot);
    classifyRows(app.shadowRoot);
    enhanceSliders(app.shadowRoot);
    staggerCards(app.shadowRoot);

    applicaTitolo();

    new MutationObserver(() => {
      colorButtons(app.shadowRoot);
      classifyRows(app.shadowRoot);
      enhanceSliders(app.shadowRoot);
      staggerCards(app.shadowRoot);
      applicaTitolo();
    }).observe(app.shadowRoot, { childList: true, subtree: true });
  }

  /* ── 11. Handle nested web components (esp-switch, esp-range-slider, etc.) ── */
  async function injectNested(root) {
    root.querySelectorAll('*').forEach(async el => {
      if (el.shadowRoot && !el._cyl) await injectIntoShadow(el);
    });
  }

  if (app.shadowRoot) {
    await injectNested(app.shadowRoot);
    new MutationObserver(async () => injectNested(app.shadowRoot))
      .observe(app.shadowRoot, { childList: true, subtree: true });
  }

})();
