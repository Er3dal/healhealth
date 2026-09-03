import { state, setDaily, logWeight, streak } from '../state.js';
import { MOBILITY, SUPPS } from '../program.js';
import { TODAY } from '../lib/dates.js';
import { $, val } from '../lib/dom.js';

export function renderToday(v) {
  const d = state.data.daily[TODAY] || {};
  const s = streak();
  const last = state.data.weights[state.data.weights.length - 1];

  v.innerHTML = `
    <div class="stack">
      <div class="hero">
        <div class="hero-num cond">${s}</div>
        <div>
          <div class="hero-word cond">day${s === 1 ? '' : 's'} in a row</div>
          <div class="hero-sub">Mobility is the one daily rule. This number is the whole game.</div>
        </div>
      </div>

      <div class="card">
        <div class="card-top"><h3>Today’s mobility</h3><span class="tag">10 min · warm</span></div>
        <button class="toggle ${d.mobility ? 'on' : ''}" id="mob">${d.mobility ? '✓ Done today' : 'Mark today’s routine done'}</button>
        <button class="link" id="drillT" aria-expanded="false">▸ The 8 drills</button>
        <ul class="drills" id="drills" hidden>${MOBILITY.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>

      <div class="card">
        <div class="card-top"><h3>Supplements</h3></div>
        <div class="chips">${SUPPS.map((su) =>
          `<button class="chip ${d[su.id] ? 'on' : ''}" data-s="${su.id}"><b>${d[su.id] ? '✓ ' : ''}${su.label}</b><small>${su.note}</small></button>`
        ).join('')}</div>
      </div>

      <div class="card">
        <div class="card-top"><h3>Weight</h3>${last ? `<span class="tag">last: ${last.kg}kg</span>` : ''}</div>
        <div class="inline"><input id="wq" inputmode="decimal" placeholder="e.g. 96.4"><button class="btn" id="wqb">Log</button></div>
        <p class="hint">Weigh 2–3 mornings a week. Trends win, not single days.</p>
      </div>
    </div>`;

  $('mob').onclick = () => setDaily('mobility', !d.mobility);
  $('drillT').onclick = (e) => {
    const el = $('drills'); const open = el.hidden; el.hidden = !open;
    e.currentTarget.setAttribute('aria-expanded', String(open));
  };
  v.querySelectorAll('.chip').forEach((c) => { c.onclick = () => setDaily(c.dataset.s, !d[c.dataset.s]); });
  $('wqb').onclick = () => { const n = parseFloat(val('wq')); if (!isNaN(n)) logWeight(n); };
}
