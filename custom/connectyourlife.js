/* ============================================================
   ConnectYourLife — Parete TV
   Pannello custom: replica del design "LED Controller"
   Sostituisce l'interfaccia di ESPHome web_server v3.

   Il frontend nativo viene nascosto e al suo posto si disegna questa
   interfaccia, che parla con il device via API REST e riceve gli stati
   dallo stream /events. Il pannello originale resta raggiungibile dal
   link in fondo, come rete di sicurezza.
   ============================================================ */

(() => {
  'use strict';

  /* ── Palette e misure del design ── */
  const T = {
    bg: '#121110', surf: '#1c1a18', surf2: '#262320',
    line: '#2b2724', line2: '#363129', line3: '#5a534c',
    amber: '#f2a33a', amberHi: '#ffc46b', ink: '#1a1206',
    text: '#f3efe9', text2: '#cfc8bf', muted: '#a39d94',
    green: '#3ddc84', red: '#ff3b30', blue: '#2f8cff',
  };

  /* ── Preset colore: etichetta, effetto del firmware, tinta ── */
  const PRESETS = [
    { label: 'Bianco', effetto: 'Statico Bianco', col: null },  // tinta dalla strip scelta
    { label: 'Rosso',  effetto: 'Statico Rosso',  col: '#ff3b30' },
    { label: 'Verde',  effetto: 'Statico Verde',  col: '#3ddc84' },
    { label: 'Blu',    effetto: 'Statico Blu',    col: '#2f8cff' },
    { label: 'Notte',  effetto: 'Luce Notte',     col: '#6b5bd6' },
  ];

  /* ── Stato locale, alimentato dallo stream eventi ── */
  const S = {
    nomeLuce: null, on: false, brightness: 100, effetto: '', effetti: [],
    colore: { r: 255, g: 255, b: 255, w: 255 },
    autoOff: 0, wipe: 3, anim: true, mqtt: false, nome: '',
    ip: '—', rete: '—', segnale: '—', uptime: 0, statoWifi: '—',
    numPixel: 70, configAperta: false, tipoStrip: 'RGBW calda 3000K',
  };

  /* Tonalita' con cui disegnare il canale bianco, secondo la strip montata:
     il W di una 3000K e' ambrato, quello di una 6500K quasi neutro. */
  const BIANCHI = {
    // campionato dalla resa reale della strip calda
    'RGBW calda 3000K':    '#f9daa2',
    // a meta' strada fra la calda e il bianco: non piu' ambrata, non ancora bianca
    'RGBW naturale 4000K': '#fcebcc',
    'RGBW fredda 6500K':   '#fdfbf6',
  };
  const biancoStrip = () => BIANCHI[S.tipoStrip] || '#ffd9a0';

  const $ = (sel, root = document) => root.querySelector(sel);
  const enc = encodeURIComponent;

  /* ── Comandi verso il device ── */
  async function cmd(percorso, params) {
    const qs = params ? '?' + new URLSearchParams(params) : '';
    try {
      await fetch(percorso + qs, { method: 'POST', cache: 'no-store' });
    } catch (e) { /* il device risponde comunque allo stream */ }
  }
  const luce      = (azione, p) => S.nomeLuce && cmd(`/light/${enc(S.nomeLuce)}/${azione}`, p);
  const premi     = (nome)      => cmd(`/button/${enc(nome)}/press`);
  const numero    = (nome, v)   => cmd(`/number/${enc(nome)}/set`, { value: v });
  const interrutt = (nome, on)  => cmd(`/switch/${enc(nome)}/turn_${on ? 'on' : 'off'}`);
  const testo     = (nome, v)   => cmd(`/text/${enc(nome)}/set`, { value: v });
  const scelta    = (nome, v)   => cmd(`/select/${enc(nome)}/set`, { option: v });

  /* ── Stili ── */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box}
    html{background:${T.bg}}
    body{margin:0;background:${T.bg};color:${T.text};
      font-family:'Manrope','Segoe UI',system-ui,-apple-system,sans-serif;
      -webkit-font-smoothing:antialiased}
    esp-app{display:none!important}

    .cyl-wrap{max-width:1280px;margin:0 auto;padding-block:24px 40px;
      padding-left:16px;padding-right:16px;display:flex;flex-direction:column;gap:24px}

    .cyl-top{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
    .cyl-brandbox{display:flex;align-items:center;gap:14px}
    .cyl-mark{width:44px;height:44px;border-radius:12px;background:${T.amber};
      display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;
      font-weight:700;font-size:13px;letter-spacing:.04em;color:${T.ink};flex-shrink:0}
    .cyl-brand{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${T.muted}}
    .cyl-nome{font-family:'Sora',sans-serif;font-size:22px;font-weight:600;line-height:1.1}
    .cyl-pills{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .cyl-pill{display:flex;align-items:center;gap:8px;height:36px;padding:0 14px;
      border-radius:999px;background:${T.surf};border:1px solid ${T.line};
      font-size:13px;font-weight:600;color:${T.text2}}
    .cyl-dot{width:8px;height:8px;border-radius:50%;background:${T.green};
      box-shadow:0 0 8px ${T.green};flex-shrink:0}

    .cyl-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start}
    .cyl-col{display:flex;flex-direction:column;gap:20px;min-width:0}
    .cyl-card{border-radius:22px;background:${T.surf};border:1px solid ${T.line}}
    .cyl-sec{display:flex;flex-direction:column;gap:16px;padding:24px 28px}
    .cyl-lab{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${T.muted}}
    .cyl-tit{font-family:'Sora',sans-serif;font-size:17px;font-weight:600}
    .cyl-hint{font-size:13px;color:${T.muted}}

    .cyl-strip{display:flex;gap:3px;padding:14px;border-radius:14px;
      background:${T.bg};border:1px solid ${T.line};overflow:hidden}
    .cyl-px{flex:1 1 0;min-width:0;height:34px;border-radius:3px;background:${T.surf2};
      transition:background .12s linear,box-shadow .12s linear}

    .cyl-power{width:116px;height:116px;border-radius:50%;border:1px solid ${T.line2};
      background:${T.surf2};color:${T.muted};display:flex;align-items:center;justify-content:center;
      cursor:pointer;transition:all .2s ease}
    .cyl-power.on{background:${T.amber};border-color:${T.amber};color:${T.ink};
      box-shadow:0 0 42px -6px ${T.amber}}

    .cyl-range{-webkit-appearance:none;appearance:none;width:100%;height:44px;margin:0;
      background:transparent;cursor:pointer;display:block}
    .cyl-range::-webkit-slider-runnable-track{height:8px;border-radius:999px;background:${T.line}}
    .cyl-range::-moz-range-track{height:8px;border-radius:999px;background:${T.line}}
    .cyl-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;
      margin-top:-9px;border-radius:50%;background:${T.amber};border:4px solid ${T.bg};
      box-shadow:0 0 0 1px ${T.amber}}
    .cyl-range::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:${T.amber};
      border:4px solid ${T.bg};box-shadow:0 0 0 1px ${T.amber}}

    .cyl-btn{font-family:inherit;cursor:pointer;color:${T.text};
      transition:background .15s,border-color .15s,transform .1s}
    .cyl-btn:hover{border-color:${T.line3}}
    .cyl-btn:active{transform:scale(.98)}

    .cyl-chip{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
      height:84px;border-radius:16px;background:${T.surf2};border:1px solid ${T.line};
      font-size:14px;font-weight:700}
    .cyl-chip[aria-pressed="true"]{border-color:${T.amber};background:rgba(242,163,58,.12)}
    .cyl-chipdot{width:16px;height:16px;border-radius:50%}

    .cyl-fx{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
      height:64px;border-radius:14px;background:${T.surf2};border:1px solid ${T.line};
      font-size:12.5px;font-weight:700;padding:6px;text-align:center;line-height:1.2}
    .cyl-fx[aria-pressed="true"]{border-color:${T.amber};background:rgba(242,163,58,.12);color:${T.amberHi}}

    .cyl-sw{width:52px;height:30px;border-radius:999px;background:${T.line};border:none;
      padding:3px;cursor:pointer;flex-shrink:0;transition:background .2s}
    .cyl-sw[aria-checked="true"]{background:${T.amber}}
    .cyl-knob{display:block;width:24px;height:24px;border-radius:50%;background:${T.text};
      transition:transform .2s}
    .cyl-sw[aria-checked="true"] .cyl-knob{transform:translateX(22px);background:${T.ink}}

    .cyl-ico{width:40px;height:40px;border-radius:12px;background:${T.surf2};display:flex;
      align-items:center;justify-content:center;color:${T.amber};flex-shrink:0}

    .cyl-input{font-family:inherit;font-size:15px;color:${T.text};background:${T.bg};
      border:1px solid ${T.line2};border-radius:10px;padding:0 14px;height:44px;
      box-sizing:border-box;width:100%;outline:none}
    .cyl-input:focus{border-color:${T.amber}}

    .cyl-diag{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;font-size:14px}
    .cyl-diag div{display:flex;flex-direction:column;gap:2px;min-width:0}
    .cyl-diag .k{font-size:12px;font-weight:600;color:${T.muted}}
    .cyl-diag .v{font-weight:700;overflow-wrap:anywhere}

    .cyl-foot{text-align:center;font-size:12px;color:${T.muted};padding-top:8px}
    .cyl-foot a{color:${T.muted}}

    @media (max-width:980px){ .cyl-grid{grid-template-columns:minmax(0,1fr)} }
    @media (max-width:560px){
      .cyl-sec{padding:20px 18px}
      .cyl-power{width:96px;height:96px}
      .cyl-px{height:26px}
    }
  `;

  /* ── Icone ── */
  const ico = {
    power: `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
    timer: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/></svg>`,
    wipe:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h6"/><path d="M4 6h10"/><path d="M4 18h3"/><path d="M14 12h6"/><path d="M17 9l3 3-3 3"/></svg>`,
    cfg:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.6.76 1 1.4 1H21a2 2 0 1 1 0 4h-.09c-.64 0-1.2.4-1.51 1z"/></svg>`,
  };

  /* ── Impalcatura ── */
  const stile = document.createElement('style');
  stile.textContent = CSS;
  document.head.appendChild(stile);

  const root = document.createElement('div');
  root.className = 'cyl-wrap';
  document.body.appendChild(root);

  root.innerHTML = `
    <header class="cyl-top">
      <div class="cyl-brandbox">
        <div class="cyl-mark">CYL</div>
        <div>
          <div class="cyl-brand">ConnectYourLife</div>
          <div class="cyl-nome" id="cy-nome">—</div>
        </div>
      </div>
      <div class="cyl-pills">
        <div class="cyl-pill"><span class="cyl-dot" id="cy-dot"></span><span id="cy-conn">—</span></div>
        <div class="cyl-pill" id="cy-ora">--:--:--</div>
      </div>
    </header>

    <div class="cyl-grid">
      <div class="cyl-col">
        <!-- Luce -->
        <section class="cyl-card cyl-sec" style="gap:22px;padding:26px 28px 28px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div>
              <div class="cyl-lab" id="cy-sub">—</div>
              <div style="font-family:'Sora',sans-serif;font-size:26px;font-weight:600;line-height:1.1"
                   id="cy-stato">—</div>
            </div>
            <div id="cy-badge" style="height:32px;padding:0 12px;border-radius:999px;display:flex;
                 align-items:center;font-size:12px;font-weight:700;letter-spacing:.06em;
                 text-transform:uppercase;background:${T.surf2};color:${T.muted}">—</div>
          </div>

          <div class="cyl-strip" id="cy-strip" aria-hidden="true"></div>

          <div style="display:grid;grid-template-columns:168px minmax(0,1fr);gap:28px;align-items:center"
               id="cy-rowluce">
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
              <button class="cyl-btn cyl-power" id="cy-power" aria-label="Accendi o spegni">${ico.power}</button>
              <div style="font-size:13px;font-weight:700" id="cy-plabel">—</div>
              <div style="font-size:12px;line-height:1.4;text-align:center;color:${T.muted};max-width:168px"
                   id="cy-phint"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;min-width:0">
              <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">
                <label for="cy-lum" style="font-size:15px;font-weight:700">Luminosità</label>
                <div style="font-family:'Sora',sans-serif;font-size:28px;font-weight:600;line-height:1"
                     id="cy-lumval">—<span style="font-size:15px;color:${T.muted};margin-left:3px">%</span></div>
              </div>
              <input id="cy-lum" class="cyl-range" type="range" min="5" max="100" step="5" value="100">
              <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:${T.muted}">
                <span>1%</span><span>Il dimmer resta invariato durante on/off</span><span>100%</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Colore -->
        <section class="cyl-card cyl-sec">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div class="cyl-tit">Colore</div>
            <div class="cyl-hint">I preset scrivono un solo canale: bianco puro sul W, colori solo su RGB</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px"
               id="cy-presets"></div>
        </section>

        <!-- Effetti -->
        <section class="cyl-card cyl-sec">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div class="cyl-tit">Effetti</div>
            <button class="cyl-btn" id="cy-nofx" style="height:36px;padding:0 14px;border-radius:999px;
              background:transparent;border:1px solid ${T.line2};color:${T.text2};font-size:13px;font-weight:700">
              Nessun effetto</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px"
               id="cy-effetti"></div>
        </section>
      </div>

      <div class="cyl-col">
        <!-- Notte -->
        <button class="cyl-btn cyl-card" id="cy-notte" style="display:flex;align-items:center;gap:14px;
          padding:18px 22px;text-align:left">
          <span class="cyl-ico" id="cy-notte-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </span>
          <span style="display:flex;flex-direction:column;gap:3px;flex-grow:1;min-width:0">
            <span style="font-size:16px;font-weight:700">Notte</span>
            <span class="cyl-hint">Bianco caldo al minimo, senza animazione</span>
          </span>
          <span style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
            color:${T.muted}" id="cy-notte-st">Off</span>
        </button>

        <!-- Spegnimento automatico -->
        <section class="cyl-card cyl-sec" style="gap:12px;padding:22px 24px">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="cyl-ico">${ico.timer}</span>
            <label for="cy-auto" style="font-size:16px;font-weight:700;flex-grow:1">Spegnimento automatico</label>
            <span style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600" id="cy-autolab">—</span>
          </div>
          <input id="cy-auto" class="cyl-range" type="range" min="0" max="120" step="5" value="0">
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:${T.muted}">
            <span>Disattivato</span><span>120 min</span></div>
        </section>

        <!-- Animazione + velocità -->
        <section class="cyl-card cyl-sec" style="gap:18px;padding:22px 24px">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="cyl-ico">${ico.wipe}</span>
            <span style="display:flex;flex-direction:column;gap:3px;flex-grow:1;min-width:0">
              <span style="font-size:16px;font-weight:700">Animazione accensione</span>
              <span class="cyl-hint">Wipe da un capo all'altro</span>
            </span>
            <button class="cyl-btn cyl-sw" id="cy-anim" role="switch" aria-checked="false"
                    aria-label="Animazione accensione"><span class="cyl-knob"></span></button>
          </div>
          <div style="height:1px;background:${T.line}"></div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <label for="cy-wipe" style="font-size:15px;font-weight:700">Velocità wipe</label>
              <span style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600" id="cy-wipeval">—<span
                style="font-size:13px;color:${T.muted}"> / 10</span></span>
            </div>
            <input id="cy-wipe" class="cyl-range" type="range" min="1" max="10" step="1" value="3">
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:${T.muted}">
              <span>Veloce</span><span id="cy-wipedur"></span><span>Lenta</span></div>
          </div>
        </section>

        <!-- Diagnostica -->
        <section class="cyl-card cyl-sec" style="gap:14px;padding:22px 24px">
          <div class="cyl-lab">Diagnostica</div>
          <div class="cyl-diag">
            <div><span class="k">Indirizzo IP</span><span class="v" id="cy-ip">—</span></div>
            <div><span class="k">Stato WiFi</span><span class="v" id="cy-wst" style="color:${T.green}">—</span></div>
            <div><span class="k">Rete</span><span class="v" id="cy-rete">—</span></div>
            <div><span class="k">Segnale</span><span class="v" id="cy-sig">—</span></div>
            <div><span class="k">Uptime</span><span class="v" id="cy-up">—</span></div>
            <div><span class="k">Pixel</span><span class="v" id="cy-px">—</span></div>
          </div>
        </section>
      </div>
    </div>

    <!-- Configurazione -->
    <section class="cyl-card" style="display:flex;flex-direction:column">
      <button class="cyl-btn" id="cy-cfgbtn" style="display:flex;align-items:center;gap:12px;width:100%;
        height:64px;padding:0 28px;background:transparent;border:none;text-align:left">
        <span style="width:36px;height:36px;border-radius:10px;background:${T.surf2};display:flex;
          align-items:center;justify-content:center;color:${T.muted}">${ico.cfg}</span>
        <span style="font-size:16px;font-weight:700;flex-grow:1">Configurazione</span>
        <span style="color:${T.muted};font-size:13px" id="cy-cfglab">Apri</span>
      </button>
      <div id="cy-cfg" style="display:none;padding:0 28px 26px;gap:16px;flex-direction:column"></div>
    </section>

    <div class="cyl-foot">
      ConnectYourLife · <a href="#" id="cy-classico">pannello ESPHome classico</a>
    </div>
  `;

  /* ── Riferimenti ── */
  const el = {};
  ['nome','dot','conn','ora','sub','stato','badge','strip','power','plabel','phint','lum','lumval',
   'presets','effetti','nofx','notte','notte-ico','notte-st','auto','autolab','anim','wipe','wipeval',
   'wipedur','ip','wst','rete','sig','up','px','cfgbtn','cfg','cfglab','classico','rowluce']
    .forEach(k => el[k] = document.getElementById('cy-' + k));

  /* ── Anteprima strip ── */
  const pixel = [];
  function costruisciStrip(n) {
    el.strip.innerHTML = '';
    pixel.length = 0;
    const max = Math.min(n, 120);
    for (let i = 0; i < max; i++) {
      const d = document.createElement('div');
      d.className = 'cyl-px';
      el.strip.appendChild(d);
      pixel.push(d);
    }
  }
  costruisciStrip(S.numPixel);

  /* ── Wipe dell'anteprima ──
     Il firmware accende i pixel da un capo all'altro (pos 0 -> N) e li spegne
     nel verso opposto (N -> 0), avanzando di un pixel ogni "velocita wipe"
     frame da 10 ms. Qui si riproduce la stessa corsa, con la stessa durata,
     cosi' l'anteprima resta in passo con la striscia vera. */
  let wipeRaf = null, wipeAttivo = false;

  function fermaWipe() {
    if (wipeRaf) cancelAnimationFrame(wipeRaf);
    wipeRaf = null;
    wipeAttivo = false;
  }

  function dipingiPixel(soglia, col) {
    for (let i = 0; i < pixel.length; i++) {
      const acceso = i < soglia;
      pixel[i].style.background = acceso ? col : T.surf2;
      pixel[i].style.boxShadow  = acceso ? `0 0 10px -2px ${col}` : 'none';
    }
  }

  function animaWipe(verso, col) {
    fermaWipe();
    const n = pixel.length;
    if (!n) return;
    // stessa durata del firmware: un pixel ogni (velocita x 10 ms)
    const durata = Math.max(250, S.numPixel * S.wipe * 10);
    const t0 = performance.now();
    wipeAttivo = true;
    (function passo(t) {
      const q = Math.min(1, (t - t0) / durata);
      // in accensione la soglia sale da 0 a n, in spegnimento scende da n a 0
      const soglia = verso === 1 ? q * n : (1 - q) * n;
      dipingiPixel(soglia, col);
      if (q < 1) {
        wipeRaf = requestAnimationFrame(passo);
      } else {
        wipeRaf = null;
        wipeAttivo = false;
        render();
      }
    })(t0);
  }

  /* Quale tinta mostrare nell'anteprima.
     L'API riporta i canali della luce (per il bianco valgono tutti 255), non
     quello che gli effetti scrivono davvero nel buffer: "Statico Bianco"
     accende solo il W, ma l'API dice comunque 255,255,255,255. La tinta va
     quindi dedotta dall'effetto attivo, e solo in mancanza di questo dai canali. */
  const TINTA_EFFETTO = {
    'Statico Bianco': null, 'Luce Notte': null, 'Respiro Bianco': null,
    'TV Ambient Soft': null, 'Wipe White': null, 'Stelle': null, 'Lampo': null,
    'Statico Rosso': '#ff3b30', 'Statico Verde': '#3ddc84', 'Statico Blu': '#2f8cff',
    'Candela': '#ffb46b', 'Fuoco': '#ff7b2e', 'Tramonto': '#ff8a50',
    'Oceano': '#2f8cff', 'Meteora': '#9ecbff', 'Scanner': '#ff3b30',
    'Rainbow': '#7ad0ff', 'Fade Colori': '#c9a7ff', 'Arcobaleno Lento': '#7ad0ff',
    'Disco': '#c9a7ff',
  };

  function coloreAcceso() {
    const fx = S.effetto;
    if (fx && Object.prototype.hasOwnProperty.call(TINTA_EFFETTO, fx)) {
      // null significa "e' il canale bianco": tinta secondo la strip montata
      return TINTA_EFFETTO[fx] || biancoStrip();
    }
    const c = S.colore;
    // >= e non >: con il bianco tutti i canali stanno a 255 e il maggiore stretto fallisce
    if ((c.w || 0) >= Math.max(c.r || 0, c.g || 0, c.b || 0)) return biancoStrip();
    return `rgb(${c.r || 0},${c.g || 0},${c.b || 0})`;
  }

  function coloreCorrente() {
    return S.on ? coloreAcceso() : T.surf2;
  }

  /* ── Disegno ── */
  function render() {
    const col = coloreCorrente();

    el.nome.textContent  = S.nome || '—';
    document.title       = S.nome || 'ConnectYourLife';
    el.sub.textContent   = `${S.nomeLuce || 'Strip'} · ${S.numPixel} pixel`;
    const fx = (S.effetto && S.effetto !== 'None' && S.effetto !== 'Wipe White') ? S.effetto : '';
    el.stato.textContent = S.on ? (fx || 'Accesa') : 'Spenta';

    el.badge.textContent = S.on ? 'Accesa' : 'Spenta';
    el.badge.style.background = S.on ? 'rgba(242,163,58,.16)' : T.surf2;
    el.badge.style.color      = S.on ? T.amber : T.muted;

    const luminosita = Math.round(S.brightness);
    el.lumval.innerHTML = `${luminosita}<span style="font-size:15px;color:${T.muted};margin-left:3px">%</span>`;
    if (document.activeElement !== el.lum) el.lum.value = luminosita;

    el.power.classList.toggle('on', S.on);
    el.plabel.textContent = S.on ? 'Spegni' : 'Accendi';
    el.phint.textContent  = S.on
      ? 'Lo spegnimento rientra con il wipe nel colore corrente'
      : 'Si accende con il wipe da un capo all\'altro';

    if (!wipeAttivo) dipingiPixel(S.on ? pixel.length : 0, col);

    // preset ed effetti selezionati
    el.presets.querySelectorAll('button').forEach(b =>
      b.setAttribute('aria-pressed', String(S.on && b.dataset.fx === S.effetto)));
    el.effetti.querySelectorAll('button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.fx === S.effetto)));

    const notteOn = S.on && S.effetto === 'Luce Notte';
    el['notte-st'].textContent = notteOn ? 'On' : 'Off';
    el['notte-st'].style.color = notteOn ? T.amber : T.muted;
    el['notte-ico'].style.color = notteOn ? T.amber : T.muted;
    el.notte.style.borderColor = notteOn ? T.amber : T.line;

    el.autolab.textContent = S.autoOff > 0 ? `${S.autoOff} min` : 'Off';
    if (document.activeElement !== el.auto) el.auto.value = S.autoOff;

    el.wipeval.innerHTML = `${S.wipe}<span style="font-size:13px;color:${T.muted}"> / 10</span>`;
    if (document.activeElement !== el.wipe) el.wipe.value = S.wipe;
    el.wipedur.textContent = `circa ${((S.numPixel * S.wipe * 10) / 1000).toFixed(1)} s`;
    el.anim.setAttribute('aria-checked', String(S.anim));

    el.ip.textContent   = S.ip;
    el.wst.textContent  = S.statoWifi;
    el.wst.style.color  = S.statoWifi === 'Connesso' ? T.green : T.amber;
    el.rete.textContent = S.rete;
    el.sig.textContent  = S.segnale;
    el.px.textContent   = S.numPixel;
    const m = Math.floor(S.uptime / 60), sec = Math.round(S.uptime % 60);
    el.up.textContent   = m > 0 ? `${m} min ${sec} s` : `${sec} s`;
    el.conn.textContent = S.rete !== '—' ? `Connesso · ${S.rete}` : 'Connesso';
  }

  /* ── Preset ed effetti ── */
  PRESETS.forEach(p => {
    const b = document.createElement('button');
    b.className = 'cyl-btn cyl-chip';
    b.dataset.fx = p.effetto;
    b.innerHTML = `<span class="cyl-chipdot" style="background:${p.col || biancoStrip()}"></span><span>${p.label}</span>`;
    // Anche qui si preme il pulsante del firmware: imposta skip_anim e azzera
    // wipe_off_running prima di applicare l'effetto.
    b.onclick = () => premi(p.label);
    el.presets.appendChild(b);
  });

  function costruisciEffetti() {
    el.effetti.innerHTML = '';
    S.effetti.filter(n => n && n !== 'None').forEach(n => {
      const b = document.createElement('button');
      b.className = 'cyl-btn cyl-fx';
      b.dataset.fx = n;
      b.textContent = n;
      b.onclick = () => {
        if (S.on) { luce('turn_on', { effect: n }); return; }
        // da spenta: prima l'accensione animata, poi l'effetto a wipe concluso
        premi('Toggle Luce');
        const attesa = Math.max(1200, S.numPixel * S.wipe * 10 + 400);
        setTimeout(() => luce('turn_on', { effect: n }), attesa);
      };
      el.effetti.appendChild(b);
    });
  }

  /* ── Interazioni ── */
  // Si usa il pulsante del firmware, non turn_on/turn_off diretti: lo script
  // animated_toggle gestisce skip_anim e wipe_off_running, che governano il wipe.
  // Chiamando la luce direttamente le due animazioni si accavallano.
  el.power.onclick = () => premi('Toggle Luce');
  el.nofx.onclick  = () => { luce('turn_on', { effect: 'None' }); };
  el.notte.onclick = () => premi('Notte');

  el.lum.oninput  = () => { el.lumval.innerHTML = `${el.lum.value}<span style="font-size:15px;color:${T.muted};margin-left:3px">%</span>`; };
  el.lum.onchange = () => { numero('Luminosità', el.lum.value); S.brightness = +el.lum.value; };

  el.auto.oninput  = () => { el.autolab.textContent = +el.auto.value > 0 ? `${el.auto.value} min` : 'Off'; };
  el.auto.onchange = () => { numero('Spegnimento automatico', el.auto.value); S.autoOff = +el.auto.value; };

  el.wipe.oninput  = () => { el.wipeval.innerHTML = `${el.wipe.value}<span style="font-size:13px;color:${T.muted}"> / 10</span>`; };
  el.wipe.onchange = () => { numero('Velocita wipe', el.wipe.value); S.wipe = +el.wipe.value; };

  el.anim.onclick = () => { S.anim = !S.anim; interrutt('Animazione accensione', S.anim); render(); };

  el.cfgbtn.onclick = () => {
    S.configAperta = !S.configAperta;
    el.cfg.style.display = S.configAperta ? 'flex' : 'none';
    el.cfglab.textContent = S.configAperta ? 'Chiudi' : 'Apri';
  };

  el.classico.onclick = (ev) => {
    ev.preventDefault();
    const app = document.querySelector('esp-app');
    if (app) { app.style.display = 'block'; root.style.display = 'none'; }
  };

  /* ── Pannello di configurazione ── */
  function riga(etichetta, contenuto) {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;flex-direction:column;gap:6px';
    d.innerHTML = `<span class="cyl-lab">${etichetta}</span>`;
    d.appendChild(contenuto);
    return d;
  }
  function campoNum(nomeEntita, valore) {
    const i = document.createElement('input');
    i.className = 'cyl-input';
    i.type = 'number'; i.min = 1; i.max = 65535;
    i.value = valore;
    i.onchange = () => numero(nomeEntita, i.value);
    return i;
  }

  function campo(nomeEntita, valore, tipo) {
    const i = document.createElement('input');
    i.className = 'cyl-input';
    i.type = tipo || 'text';
    i.value = valore || '';
    i.onchange = () => testo(nomeEntita, i.value);
    return i;
  }

  function visibilitaMqtt() {
    el.cfg.querySelectorAll('[data-mqtt]').forEach(n => {
      n.style.display = S.mqtt ? '' : 'none';
    });
  }

  function costruisciConfig() {
    el.cfg.innerHTML = '';
    const griglia = document.createElement('div');
    griglia.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px';

    const mqtt = document.createElement('button');
    mqtt.className = 'cyl-btn cyl-sw';
    mqtt.setAttribute('role', 'switch');
    mqtt.setAttribute('aria-checked', String(S.mqtt));
    mqtt.innerHTML = '<span class="cyl-knob"></span>';
    mqtt.onclick = () => {
      S.mqtt = !S.mqtt;
      interrutt('MQTT', S.mqtt);
      mqtt.setAttribute('aria-checked', String(S.mqtt));
      visibilitaMqtt();
    };

    const tipo = document.createElement('select');
    tipo.className = 'cyl-input';
    Object.keys(BIANCHI).forEach(o => {
      const op = document.createElement('option');
      op.value = o; op.textContent = o;
      if (o === S.tipoStrip) op.selected = true;
      tipo.appendChild(op);
    });
    tipo.onchange = () => { S.tipoStrip = tipo.value; scelta('Tipo strip', tipo.value); render(); };

    griglia.appendChild(riga('MQTT', mqtt));
    griglia.appendChild(riga('Tipo strip', tipo));

    // I parametri del broker servono solo a MQTT acceso: tenerli sempre in vista
    // riempie la configurazione di campi che per molti impianti restano inutili.
    const gruppoMqtt = [
      riga('MQTT broker', campo('MQTT broker', S.mqttBroker || '')),
      riga('MQTT porta', campoNum('MQTT porta', S.mqttPorta || 1883)),
      riga('MQTT utente', campo('MQTT utente', S.mqttUser || '')),
      riga('MQTT password', campo('MQTT password', '', 'password')),
    ];
    gruppoMqtt.forEach(r => { r.dataset.mqtt = '1'; griglia.appendChild(r); });
    griglia.appendChild(riga('Nome dispositivo', campo('Nome dispositivo', S.nome)));
    griglia.appendChild(riga('WiFi 1 rete', campo('WiFi 1 rete', S.wifi1 || '')));
    griglia.appendChild(riga('WiFi 1 password', campo('WiFi 1 password', '', 'password')));
    griglia.appendChild(riga('WiFi 2 rete', campo('WiFi 2 rete', S.wifi2 || '')));
    griglia.appendChild(riga('WiFi 2 password', campo('WiFi 2 password', '', 'password')));
    el.cfg.appendChild(griglia);

    const azioni = document.createElement('div');
    azioni.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap';
    [['Applica WiFi', 'Applica WiFi'], ['Applica MQTT', 'Applica MQTT'],
     ['Restart', 'Restart']].forEach(([lab, ent]) => {
      const soloMqtt = (ent === 'Applica MQTT');
      const b = document.createElement('button');
      b.className = 'cyl-btn';
      b.style.cssText = `height:44px;padding:0 20px;border-radius:999px;background:${T.surf2};
        border:1px solid ${T.line2};font-size:14px;font-weight:700`;
      b.textContent = lab;
      b.onclick = () => premi(ent);
      if (soloMqtt) b.dataset.mqtt = '1';
      azioni.appendChild(b);
    });
    el.cfg.appendChild(azioni);
    visibilitaMqtt();
  }

  /* ── Orologio ── */
  setInterval(() => { el.ora.textContent = new Date().toLocaleTimeString('it-IT'); }, 1000);
  el.ora.textContent = new Date().toLocaleTimeString('it-IT');

  /* ── Stato dal device ── */
  /* Lo stream manda il messaggio completo (con domain e name) solo al primo
     invio; gli aggiornamenti successivi portano soltanto "id" e i campi
     cambiati. Il riconoscimento si fa quindi sull'id, mai su domain/name. */
  function applicaEvento(d) {
    const id = d.id || '';
    if (!id) return;
    const nome = id.slice(id.indexOf('/') + 1);

    if (id.startsWith('light/')) {
      S.nomeLuce = nome;
      const eraAccesa = S.on;
      S.on = (d.value === 'ON' || d.state === 'ON');
      if (d.effect !== undefined) S.effetto = d.effect;
      if (d.color) S.colore = d.color;
      if (Array.isArray(d.effects) && d.effects.length && S.effetti.length !== d.effects.length) {
        S.effetti = d.effects;
        costruisciEffetti();
      }
      if (S.on !== eraAccesa) {
        if (!S.anim) {
          fermaWipe();
          dipingiPixel(S.on ? pixel.length : 0, coloreAcceso());
        } else if (S.on) {
          animaWipe(1, biancoStrip());          // accensione: wipe bianco caldo
        } else {
          animaWipe(-1, coloreAcceso());    // spegnimento: rientra nel colore corrente
        }
      }
    }
    else if (id === 'number/Luminosità')             S.brightness = +d.value;
    else if (id === 'number/Spegnimento automatico') S.autoOff    = +d.value;
    else if (id === 'number/Velocita wipe')          S.wipe       = +d.value;
    else if (id === 'switch/Animazione accensione')  S.anim = (d.value === true || d.state === 'ON');
    else if (id === 'switch/MQTT') {
      S.mqtt = (d.value === true || d.state === 'ON');
      if (S.configAperta) visibilitaMqtt();
    }
    else if (id === 'select/Tipo strip') {
      S.tipoStrip = d.value ?? d.state ?? S.tipoStrip;
      el.presets.querySelectorAll('button').forEach(b => {
        if (b.dataset.fx === 'Statico Bianco') {
          const dot = b.querySelector('.cyl-chipdot');
          if (dot) dot.style.background = biancoStrip();
        }
      });
    }
    else if (id === 'text/MQTT broker')    S.mqttBroker = d.value ?? d.state ?? '';
    else if (id === 'text/MQTT utente')    S.mqttUser   = d.value ?? d.state ?? '';
    else if (id === 'number/MQTT porta')   S.mqttPorta  = +d.value;
    else if (id === 'text/Nome dispositivo')         S.nome  = d.value ?? d.state ?? S.nome;
    else if (id === 'text/WiFi 1 rete')              S.wifi1 = d.value ?? d.state ?? '';
    else if (id === 'text/WiFi 2 rete')              S.wifi2 = d.value ?? d.state ?? '';
    else if (id === 'sensor/WiFi Signal')            S.segnale = d.state || `${d.value} dBm`;
    else if (id === 'sensor/Uptime')                 S.uptime  = +d.value || 0;
    else if (id === 'text_sensor/Rete connessa')     S.rete      = d.state ?? d.value ?? '—';
    else if (id === 'text_sensor/Indirizzo IP')      S.ip        = d.state ?? d.value ?? '—';
    else if (id === 'text_sensor/Stato WiFi')        S.statoWifi = d.state ?? d.value ?? '—';
  }

  let disegnoInSospeso = false;
  function programmaRender() {
    if (disegnoInSospeso) return;
    disegnoInSospeso = true;
    requestAnimationFrame(() => { disegnoInSospeso = false; render(); });
  }

  function ascolta(tentativi) {
    // Il frontend ESPHome tiene gia' aperto uno stream su /events. Il device
    // regge poche connessioni insieme: aprendone un secondo, quello nuovo non
    // riceve nulla e il pannello si aggiorna solo al caricamento. Ci si aggancia
    // quindi allo stream esistente, e solo in sua assenza se ne apre uno.
    const src = window.source || null;
    if (!src) {
      if ((tentativi || 0) < 20) { setTimeout(() => ascolta((tentativi || 0) + 1), 250); return; }
      return ascoltaProprio();
    }
    collega(src);
  }

  function ascoltaProprio() {
    collega(new EventSource('/events'));
  }

  function collega(src) {
    src.addEventListener('state', ev => {
      if (!ev.data) return;
      let d; try { d = JSON.parse(ev.data); } catch (e) { return; }
      ultimoEvento = Date.now();
      applicaEvento(d);
      programmaRender();
    });
    src.addEventListener('ping', ev => {
      if (!ev.data) return;
      try {
        const d = JSON.parse(ev.data);
        if (d.title && !S.nome) { S.nome = d.title; programmaRender(); }
      } catch (e) { /* ping senza payload */ }
    });
    src.onerror = () => { /* EventSource riprova da solo */ };
  }

  // il pannello di configurazione si costruisce alla prima apertura
  el.cfgbtn.addEventListener('click', () => { if (S.configAperta) costruisciConfig(); }, { once: false });

  /* ── Rete di sicurezza ──
     Se lo stream tace (connessione persa, limite di socket del device), il
     pannello resterebbe fermo sull'ultimo stato noto. Ogni 3 s, quando non
     arrivano eventi da un po', si rilegge lo stato della luce via REST: il
     confronto con quello locale fa scattare comunque il wipe dell'anteprima. */
  let ultimoEvento = Date.now();

  async function sincronizza() {
    if (Date.now() - ultimoEvento < 4000) return;
    if (!S.nomeLuce) return;
    try {
      const r = await fetch(`/light/${enc(S.nomeLuce)}`, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      applicaEvento(d);
      programmaRender();
    } catch (e) { /* device momentaneamente irraggiungibile */ }
  }
  setInterval(sincronizza, 3000);

  ascolta();
  render();
})();
