import { state, planNow, addWorkout, deleteWorkout, notify } from '../state.js';
import { TEMPLATES } from '../program.js';
import { TODAY } from '../lib/dates.js';
import { $, val, escapeAttr } from '../lib/dom.js';

export function renderTrain(v) {
  if (state.ui.session) return renderSession(v);

  const phase = planNow().phase.n;
  const suggested = phase >= 3 ? ['legsA', 'power', 'push', 'legsB', 'pull'] : ['legsA', 'legsB', 'push', 'pull'];
  const W = state.data.workouts;

  v.innerHTML = `
    <div class="stack">
      <div class="card">
        <div class="card-top"><h3>Start a session</h3><span class="tag">Phase ${phase}</span></div>
        <div class="tmpl-grid">${suggested.map((k) =>
          `<button class="tmpl" data-k="${k}"><b class="cond">${TEMPLATES[k].label}</b><small>${TEMPLATES[k].ex.length} exercises</small></button>`
        ).join('')}</div>
      </div>

      <div class="card">
        <div class="card-top"><h3>History</h3><span class="tag">${W.length} logged</span></div>
        <div>${W.length === 0
          ? `<div class="empty">No sessions yet. Pick a template above and log your first — every entry feeds progressive overload.</div>`
          : W.map(historyRow).join('')}</div>
      </div>
    </div>`;

  v.querySelectorAll('.tmpl').forEach((b) => { b.onclick = () => startSession(b.dataset.k); });
  v.querySelectorAll('.hist-top').forEach((b) => {
    b.onclick = () => { state.ui.openId = state.ui.openId === b.dataset.id ? null : b.dataset.id; notify(); };
  });
  v.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => deleteWorkout(b.dataset.del); });
}

function historyRow(w) {
  const open = state.ui.openId === w.id;
  return `<div>
    <button class="hist-top" data-id="${w.id}"><span>${open ? '▾' : '▸'}</span><b>${w.label}</b><small>${w.date.slice(5)}</small></button>
    ${open ? `<div class="hist-body">
      ${w.entries.map((e) => `<div class="ex"><b>${e.name}</b>${e.sets.map((s) => `${s.reps || '–'}×${s.kg || '–'}`).join('  ·  ')}</div>`).join('')}
      <button class="del" data-del="${w.id}">Delete session</button>
    </div>` : ''}
  </div>`;
}

function startSession(key) {
  const ex = {};
  TEMPLATES[key].ex.forEach((e) => { ex[e] = [{ reps: '', kg: '' }]; });
  state.ui.session = { key, ex };
  notify();
}

function renderSession(v) {
  const s = state.ui.session, t = TEMPLATES[s.key];
  v.innerHTML = `
    <div class="stack">
      <div class="session-head">
        <h2 class="cond">${t.label}</h2>
        <button class="link muted-link" id="cancel">Cancel</button>
      </div>
      ${t.ex.map((name) => `
        <div class="card">
          <div class="card-top"><h3>${name}</h3></div>
          <div class="set-head"><span>Set</span><span>Reps</span><span>Kg</span></div>
          <div>${s.ex[name].map((r, i) => setRow(name, i, r)).join('')}</div>
          <button class="link" data-add="${escapeAttr(name)}">＋ Add set</button>
        </div>`).join('')}
      <button class="btn full" id="save">Save session</button>
    </div>`;

  $('cancel').onclick = () => { state.ui.session = null; notify(); };
  // typing updates the in-memory session only — no re-render, so focus is kept
  v.querySelectorAll('input[data-f]').forEach((inp) => {
    inp.oninput = () => { s.ex[inp.dataset.ex][+inp.dataset.i][inp.dataset.f] = inp.value; };
  });
  v.querySelectorAll('[data-add]').forEach((b) => {
    b.onclick = () => { s.ex[b.dataset.add].push({ reps: '', kg: '' }); notify(); };
  });
  $('save').onclick = () => {
    const entries = Object.entries(s.ex)
      .map(([name, sets]) => ({ name, sets: sets.filter((x) => x.reps !== '' || x.kg !== '') }))
      .filter((e) => e.sets.length);
    addWorkout({ id: String(Date.now()), date: TODAY, label: t.label, entries });
    state.ui.session = null;
    notify();
  };
}

function setRow(name, i, r) {
  const a = escapeAttr(name);
  return `<div class="set-row"><span class="i cond">${i + 1}</span>
    <input data-f="reps" data-ex="${a}" data-i="${i}" inputmode="numeric" value="${r.reps}">
    <input data-f="kg" data-ex="${a}" data-i="${i}" inputmode="decimal" value="${r.kg}"></div>`;
}
