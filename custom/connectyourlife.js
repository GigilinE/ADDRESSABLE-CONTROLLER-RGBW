/* ============================================================
   ConnectYourLife — Parete TV
   UI Enhancer v2 — ESPHome web_server v3
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
  document.body.style.paddingTop = '60px';

  /* ── 2. Clock ── */
  function tick() {
    const el = document.getElementById('cyl-clock');
    if (el) el.textContent = new Date().toLocaleTimeString('it-IT');
  }
  tick();
  setInterval(tick, 1000);

  /* ── 3. Shadow DOM CSS — applied to esp-app.shadowRoot ── */
  const SHADOW_CSS = `
    :host {
      display: block;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #f1f5f9;
    }

    /* ── Layout ── */
    .flex-grid-half {
      display: flex !important;
      flex-direction: column !important;
      padding: 24px 16px 48px !important;
      max-width: 560px !important;
      margin: 0 auto !important;
    }

    /* Hide logs — production UI */
    #col_logs { display: none !important; }

    /* Dim ESPHome native top bar */
    .top-icon, #logo, #beat, #scheme {
      opacity: .25 !important;
      transition: opacity .2s !important;
    }
    .top-icon:hover, #logo:hover, #beat:hover, #scheme:hover {
      opacity: .65 !important;
    }

    /* ── Section label ── */
    .tab-header {
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 2.5px !important;
      color: #334155 !important;
      padding: 20px 4px 6px !important;
    }

    /* ── Entity card ── */
    .entity-row {
      background: rgba(255,255,255,.045) !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      border-radius: 14px !important;
      padding: 14px 16px !important;
      margin-bottom: 8px !important;
      transition: border-color .25s ease, background .25s ease, box-shadow .25s ease !important;
      animation: cyl-up .38s cubic-bezier(.4,0,.2,1) both !important;
    }
    .entity-row:hover {
      border-color: rgba(245,158,11,.22) !important;
      background: rgba(255,255,255,.065) !important;
      box-shadow: 0 0 0 1px rgba(245,158,11,.08), 0 8px 24px rgba(0,0,0,.4) !important;
    }

    /* Button-only rows: no card chrome */
    .singlebutton-row {
      background: transparent !important;
      border: none !important;
      border-radius: 0 !important;
      padding: 3px 0 !important;
      margin-bottom: 0 !important;
      box-shadow: none !important;
    }
    .singlebutton-row:hover {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    /* Entity name label */
    .entity {
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 1px !important;
      color: #475569 !important;
      margin-bottom: 10px !important;
    }

    /* ── Buttons ── */
    .abutton, button {
      background: rgba(255,255,255,.07) !important;
      color: #cbd5e1 !important;
      border: 1px solid rgba(255,255,255,.1) !important;
      border-radius: 9px !important;
      padding: 9px 18px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      font-family: inherit !important;
      cursor: pointer !important;
      transition: all .2s ease !important;
      outline: none !important;
      letter-spacing: .1px !important;
    }
    .abutton:hover, button:hover {
      background: rgba(245,158,11,.12) !important;
      border-color: rgba(245,158,11,.35) !important;
      color: #fbbf24 !important;
    }
    .abutton:active, button:active {
      transform: scale(.96) !important;
    }

    /* ── Range slider ── */
    input[type=range] {
      -webkit-appearance: none !important;
      appearance: none !important;
      height: 4px !important;
      background: rgba(255,255,255,.1) !important;
      border-radius: 99px !important;
      outline: none !important;
      cursor: pointer !important;
      width: 100% !important;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none !important;
      width: 20px !important;
      height: 20px !important;
      border-radius: 50% !important;
      background: #f59e0b !important;
      box-shadow: 0 0 12px rgba(245,158,11,.55), 0 0 0 3px rgba(245,158,11,.15) !important;
      cursor: pointer !important;
      transition: box-shadow .2s !important;
    }
    input[type=range]::-webkit-slider-thumb:hover {
      box-shadow: 0 0 20px rgba(245,158,11,.75), 0 0 0 5px rgba(245,158,11,.2) !important;
    }
    input[type=range]::-moz-range-thumb {
      width: 20px !important;
      height: 20px !important;
      border-radius: 50% !important;
      background: #f59e0b !important;
      border: none !important;
      cursor: pointer !important;
    }

    .range-value {
      color: #f59e0b !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      min-width: 36px !important;
      text-align: right !important;
    }

    /* ── Effect dropdown ── */
    select {
      background: rgba(255,255,255,.07) !important;
      color: #e2e8f0 !important;
      border: 1px solid rgba(255,255,255,.1) !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      font-size: 13px !important;
      font-family: inherit !important;
      cursor: pointer !important;
      outline: none !important;
      transition: border-color .2s !important;
      -webkit-appearance: none !important;
      appearance: none !important;
    }
    select:hover, select:focus {
      border-color: rgba(245,158,11,.4) !important;
    }
    select option {
      background: #0d0d1e !important;
      color: #e2e8f0 !important;
    }

    /* ── Text inputs / number ── */
    input[type=number], input[type=text] {
      background: rgba(255,255,255,.07) !important;
      color: #e2e8f0 !important;
      border: 1px solid rgba(255,255,255,.1) !important;
      border-radius: 8px !important;
      padding: 7px 10px !important;
      font-size: 13px !important;
      outline: none !important;
      transition: border-color .2s !important;
    }
    input[type=number]:focus, input[type=text]:focus {
      border-color: rgba(245,158,11,.4) !important;
    }

    /* ── Color picker ── */
    .colorpicker {
      margin-top: 10px !important;
      border-radius: 10px !important;
      overflow: hidden !important;
      box-shadow: 0 4px 16px rgba(0,0,0,.4) !important;
    }

    /* ── Sensor / state values ── */
    .state, .sensor-state {
      font-size: 13px !important;
      color: #94a3b8 !important;
    }

    /* ── Animations ── */
    @keyframes cyl-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
  `;

  /* ── 4. Inject into shadow root ── */
  async function injectIntoShadow(el) {
    if (!el || el._cyl) return;
    if (!el.shadowRoot) {
      // Wait up to 2s for shadow root
      await new Promise(res => {
        let tries = 0;
        const t = setInterval(() => {
          if (el.shadowRoot || ++tries > 40) { clearInterval(t); res(); }
        }, 50);
      });
    }
    if (!el.shadowRoot) return;
    el._cyl = true;
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    el.shadowRoot.appendChild(style);
  }

  /* ── 5. Wait for esp-app ── */
  await customElements.whenDefined('esp-app');
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  const app = document.querySelector('esp-app');
  if (!app) return;

  await injectIntoShadow(app);

  /* ── 6. Color-code buttons by name ── */
  const COLOR_MAP = [
    { match: 'toggle luce', bg: 'rgba(245,158,11,.18)', border: 'rgba(245,158,11,.5)',  color: '#fbbf24', glow: 'rgba(245,158,11,.5)'  },
    { match: 'bianco',      bg: 'rgba(255,253,220,.1)', border: 'rgba(255,253,220,.35)',color: '#fefce8', glow: 'rgba(255,253,220,.45)' },
    { match: 'rosso',       bg: 'rgba(239,68,68,.13)',  border: 'rgba(239,68,68,.4)',   color: '#fca5a5', glow: 'rgba(239,68,68,.45)'  },
    { match: 'verde',       bg: 'rgba(34,197,94,.12)',  border: 'rgba(34,197,94,.4)',   color: '#86efac', glow: 'rgba(34,197,94,.45)'  },
    { match: 'blu',         bg: 'rgba(59,130,246,.14)', border: 'rgba(59,130,246,.45)', color: '#93c5fd', glow: 'rgba(59,130,246,.5)'  },
    { match: 'restart',     bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.2)', color: '#94a3b8', glow: ''                     },
  ];

  function colorButtons(root) {
    root.querySelectorAll('button, .abutton').forEach(btn => {
      if (btn._cyl_colored) return;
      const label = btn.textContent.trim().toLowerCase();
      const rule = COLOR_MAP.find(r => label.includes(r.match));
      if (!rule) return;
      btn._cyl_colored = true;
      Object.assign(btn.style, {
        background:   rule.bg,
        borderColor:  rule.border,
        color:        rule.color,
      });
      if (rule.glow) {
        btn.addEventListener('mouseenter', () => btn.style.boxShadow = `0 0 16px ${rule.glow}, 0 0 0 1px ${rule.border}`);
        btn.addEventListener('mouseleave', () => btn.style.boxShadow = '');
      }
    });
  }

  // Apply now and on any DOM changes inside the shadow root
  if (app.shadowRoot) {
    colorButtons(app.shadowRoot);
    new MutationObserver(() => colorButtons(app.shadowRoot))
      .observe(app.shadowRoot, { childList: true, subtree: true });
  }

  /* ── 7. Also handle nested web components (esp-switch, esp-range-slider) ── */
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
