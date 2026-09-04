import { state, profile, foodToday, foodTotals, addFood, deleteFood, notify } from '../state.js';
import { lookupBarcode, searchFoods, scaleMacros } from '../food.js';
import { startScanner } from '../scanner.js';
import { $, val, escapeHTML, escapeAttr } from '../lib/dom.js';

// transient sub-state for this tab lives on state.ui.food
function ui() { return (state.ui.food = state.ui.food || { mode: null }); }
function setMode(mode) { stopScan(); ui().mode = mode; ui().pending = null; ui().results = null; ui().msg = ''; notify(); }
function stopScan() { const f = ui(); if (f.stop) { try { f.stop(); } catch (e) {} f.stop = null; } }

// Called by the router when navigating away or logging out, so the camera
// doesn't keep running in the background.
export function cleanupFood() {
  const f = state.ui.food;
  if (!f) return;
  stopScan();
  f.mode = null; f.pending = null; f.results = null;
}

export function renderFood(v) {
  const g = profile().program.macros;
  const t = foodTotals();
  const f = ui();

  v.innerHTML = `
    <div class="stack">
      <div class="card">
        <div class="card-top"><h3>Today’s intake</h3><span class="tag">goal ${g.kcal.toLocaleString()} kcal</span></div>
        ${ring('Calories', t.kcal, g.kcal, 'kcal')}
        <div class="macro-bars">
          ${bar('Protein', t.protein, g.protein)}
          ${bar('Carbs', t.carbs, g.carbs)}
          ${bar('Fat', t.fat, g.fat)}
        </div>
      </div>

      <div class="add-row">
        <button class="add-btn" data-mode="scan"><span>📷</span>Scan barcode</button>
        <button class="add-btn" data-mode="search"><span>🔎</span>Search</button>
        <button class="add-btn" data-mode="manual"><span>✏️</span>Manual</button>
      </div>

      ${f.mode ? panel(f) : ''}

      <div class="card">
        <div class="card-top"><h3>Logged today</h3><span class="tag">${foodToday().length} items</span></div>
        <div>${foodToday().length === 0
          ? `<div class="empty">Nothing logged yet. Scan a barcode, search a food, or add one manually.</div>`
          : foodToday().map(foodRow).join('')}</div>
      </div>
    </div>`;

  wire(v);
}

/* ---------- totals visuals ---------- */
function ring(label, have, goal, unit) {
  const pct = goal ? Math.min(100, Math.round((have / goal) * 100)) : 0;
  const left = Math.max(0, goal - have);
  return `<div class="cals">
    <div><div class="cals-have cond">${Math.round(have).toLocaleString()}</div><div class="cals-sub">${label} · ${left} ${unit} left</div></div>
    <div class="cals-track"><div class="cals-fill" style="width:${pct}%"></div></div>
  </div>`;
}
function bar(label, have, goal) {
  const pct = goal ? Math.min(100, Math.round((have / goal) * 100)) : 0;
  return `<div class="mb">
    <div class="mb-top"><span>${label}</span><span>${Math.round(have)} / ${goal}g</span></div>
    <div class="mb-track"><div class="mb-fill" style="width:${pct}%"></div></div>
  </div>`;
}
function foodRow(f) {
  return `<div class="food-row">
    <div class="food-name">${escapeHTML(f.name)}<small>${f.kcal} kcal · P${f.protein} C${f.carbs} F${f.fat}${f.grams ? ` · ${f.grams}g` : ''}</small></div>
    <button class="food-del" data-del="${f.id}" aria-label="Remove">✕</button>
  </div>`;
}

/* ---------- add panels ---------- */
function panel(f) {
  if (f.pending && f.pending.loading) return `<div class="card panel">
    <div class="card-top"><h3>Looking up…</h3><button class="link muted-link" id="close">Close</button></div>
    <p class="hint">Fetching product details from Open Food Facts.</p></div>`;
  if (f.pending) return quantityPanel(f.pending);
  if (f.mode === 'scan') return scanPanel(f);
  if (f.mode === 'search') return searchPanel(f);
  return manualPanel();
}

function scanPanel(f) {
  return `<div class="card panel">
    <div class="card-top"><h3>Scan a barcode</h3><button class="link muted-link" id="close">Close</button></div>
    <div class="scanwrap"><video id="video" playsinline muted></video><div class="scanline"></div></div>
    <p class="hint" id="scanmsg">${f.msg || 'Point your camera at the barcode. Hold steady.'}</p>
    <div class="inline"><input id="codein" inputmode="numeric" placeholder="…or type the barcode number"><button class="btn" id="codego">Go</button></div>
  </div>`;
}
function searchPanel(f) {
  const results = f.results;
  return `<div class="card panel">
    <div class="card-top"><h3>Search foods</h3><button class="link muted-link" id="close">Close</button></div>
    <div class="inline"><input id="q" placeholder="e.g. greek yogurt"><button class="btn" id="qgo">Search</button></div>
    ${f.loading ? `<p class="hint">Searching…</p>` : ''}
    ${results ? (results.length ? `<div class="results">${results.map((r, i) =>
      `<button class="result" data-i="${i}"><b>${escapeHTML(r.name)}</b><small>${r.per100.kcal} kcal · P${r.per100.protein} C${r.per100.carbs} F${r.per100.fat} per 100g</small></button>`
    ).join('')}</div>` : `<p class="hint">No matches — try simpler words, or add it manually.</p>`) : ''}
  </div>`;
}
function manualPanel(vals = {}) {
  return `<div class="card panel">
    <div class="card-top"><h3>Add manually</h3><button class="link muted-link" id="close">Close</button></div>
    <label class="field"><span>Food name</span><input id="m_name" value="${escapeAttr(vals.name || '')}"></label>
    <div class="row2">
      <label class="field"><span>Calories</span><input id="m_kcal" inputmode="numeric" value="${vals.kcal ?? ''}"></label>
      <label class="field"><span>Protein (g)</span><input id="m_p" inputmode="numeric" value="${vals.protein ?? ''}"></label>
    </div>
    <div class="row2">
      <label class="field"><span>Carbs (g)</span><input id="m_c" inputmode="numeric" value="${vals.carbs ?? ''}"></label>
      <label class="field"><span>Fat (g)</span><input id="m_f" inputmode="numeric" value="${vals.fat ?? ''}"></label>
    </div>
    <button class="btn full" id="m_add">Add to today</button>
  </div>`;
}
function quantityPanel(p) {
  const grams = p.grams || p.servingG || 100;
  const m = scaleMacros(p.per100, grams);
  return `<div class="card panel">
    <div class="card-top"><h3>${p.found === false ? 'Not found' : 'Add food'}</h3><button class="link muted-link" id="close">Close</button></div>
    ${p.found === false
      ? `<p class="hint">No product for barcode ${escapeHTML(String(p.code || ''))}. Add it manually below.</p>${manualInner()}`
      : `<label class="field"><span>Food</span><input id="q_name" value="${escapeAttr(p.name)}"></label>
         <label class="field"><span>Amount (grams)</span><input id="q_g" inputmode="decimal" value="${grams}"></label>
         <div class="qmac" id="qmac">${m.kcal} kcal · P${m.protein} · C${m.carbs} · F${m.fat}</div>
         <button class="btn full" id="q_add">Add to today</button>`}
  </div>`;
}
function manualInner() {
  return `<label class="field"><span>Food name</span><input id="m_name"></label>
    <div class="row2"><label class="field"><span>Calories</span><input id="m_kcal" inputmode="numeric"></label>
    <label class="field"><span>Protein (g)</span><input id="m_p" inputmode="numeric"></label></div>
    <div class="row2"><label class="field"><span>Carbs (g)</span><input id="m_c" inputmode="numeric"></label>
    <label class="field"><span>Fat (g)</span><input id="m_f" inputmode="numeric"></label></div>
    <button class="btn full" id="m_add">Add to today</button>`;
}

/* ---------- wiring ---------- */
function wire(v) {
  const f = ui();
  v.querySelectorAll('.add-btn').forEach((b) => { b.onclick = () => setMode(b.dataset.mode); });
  v.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => deleteFood(b.dataset.del); });
  const close = $('close'); if (close) close.onclick = () => setMode(null);

  if (f.pending) return wireQuantity(f);
  if (f.mode === 'scan') return wireScan(f);
  if (f.mode === 'search') return wireSearch(f);
  if (f.mode === 'manual') return wireManual();
}

async function wireScan(f) {
  const go = $('codego');
  if (go) go.onclick = () => { const c = val('codein').trim(); if (c) resolveBarcode(c); };
  const video = $('video');
  if (!video) return;
  stopScan();
  try {
    f.stop = await startScanner(video, (code) => resolveBarcode(code));
  } catch (e) {
    const msg = $('scanmsg');
    if (msg) msg.textContent = 'Couldn’t open the camera (permission or unsupported). Type the barcode above, or use Search / Manual.';
  }
}
async function resolveBarcode(code) {
  stopScan();
  const f = ui();
  f.pending = { loading: true }; f.msg = ''; notify();
  const res = await lookupBarcode(code);
  f.pending = res.found ? { ...res, grams: res.servingG || 100 } : { found: false, code };
  notify();
}

function wireSearch(f) {
  const go = $('qgo');
  const run = async () => {
    const q = val('q').trim(); if (!q) return;
    f.loading = true; f.results = null; notify();
    f.results = await searchFoods(q); f.loading = false; notify();
  };
  if (go) go.onclick = run;
  const q = $('q'); if (q) q.onkeydown = (e) => { if (e.key === 'Enter') run(); };
  document.querySelectorAll('.result').forEach((b) => {
    b.onclick = () => { const r = f.results[+b.dataset.i]; f.pending = { ...r, found: true, grams: r.servingG || 100 }; notify(); };
  });
}

function wireQuantity(f) {
  const p = f.pending;
  if (p.found === false) return wireManual();
  const gEl = $('q_g'), mac = $('qmac');
  if (gEl) gEl.oninput = () => {
    const grams = parseFloat(gEl.value) || 0;
    const m = scaleMacros(p.per100, grams);
    if (mac) mac.textContent = `${m.kcal} kcal · P${m.protein} · C${m.carbs} · F${m.fat}`;
  };
  const add = $('q_add');
  if (add) add.onclick = () => {
    const grams = parseFloat(val('q_g')) || 0;
    const m = scaleMacros(p.per100, grams);
    addFood({ name: val('q_name') || p.name, grams, ...m });
    setMode(null);
  };
}

function wireManual() {
  const add = $('m_add');
  if (add) add.onclick = () => {
    const name = val('m_name').trim();
    if (!name) return;
    addFood({
      name,
      kcal: Math.round(+val('m_kcal') || 0),
      protein: Math.round(+val('m_p') || 0),
      carbs: Math.round(+val('m_c') || 0),
      fat: Math.round(+val('m_f') || 0),
    });
    setMode(null);
  };
}
