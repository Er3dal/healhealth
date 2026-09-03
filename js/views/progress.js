import { state, profile, logWeight } from '../state.js';
import { chartSVG } from '../chart.js';
import { daysBetween } from '../lib/dates.js';
import { $, val } from '../lib/dom.js';

export function renderProgress(v) {
  const W = state.data.weights, pr = profile();
  const first = W[0] ? W[0].kg : pr.weight;
  const last = W.length ? W[W.length - 1].kg : null;
  const change = (first != null && last != null) ? Math.round((last - first) * 10) / 10 : null;

  let weekly = null;
  if (W.length >= 2) {
    const a = W[0], b = W[W.length - 1];
    const wks = Math.max(1, daysBetween(a.date, b.date)) / 7;
    weekly = Math.round(((b.kg - a.kg) / wks) * 100) / 100;
  }
  const cut = pr.program.mode === 'cut';

  v.innerHTML = `
    <div class="stack">
      <div class="stat-grid">
        <div class="stat"><small>Start</small><b>${first != null ? first + 'kg' : '—'}</b></div>
        <div class="stat"><small>Now</small><b>${last != null ? last + 'kg' : '—'}</b></div>
        <div class="stat"><small>Change</small><b class="${change < 0 ? 'good' : ''}">${change != null ? (change > 0 ? '+' : '') + change + 'kg' : '—'}</b></div>
        <div class="stat"><small>Per week</small><b>${weekly != null ? (weekly > 0 ? '+' : '') + weekly + 'kg' : '—'}</b></div>
      </div>

      <div class="card">
        <div class="card-top"><h3>Bodyweight</h3><span class="tag">${cut ? 'target −0.4 to −0.6/wk' : 'hold steady'}</span></div>
        <div>${W.length < 2
          ? `<div class="empty">Log a couple of weigh-ins to see your trend. The faint line is each reading; the bold green line is your 7-day average — that’s the one to watch.</div>`
          : chartSVG(W)}</div>
        <div class="inline" style="margin-top:12px"><input id="wp" inputmode="decimal" placeholder="Add a weigh-in (kg)"><button class="btn" id="wpb">Log</button></div>
      </div>

      <div class="card soft"><p class="hint">${cut
        ? 'Stalled 2–3 weeks? Trim about 200 kcal or add walking. Feeling wrecked? Eat a bit more.'
        : 'Hold weight roughly steady while your lifts and conditioning climb — that’s recomposition.'}</p></div>
    </div>`;

  $('wpb').onclick = () => { const n = parseFloat(val('wp')); if (!isNaN(n)) logWeight(n); };
}
