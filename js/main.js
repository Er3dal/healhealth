// Router / orchestrator: renders the auth screen or the app shell + current tab,
// and re-renders whenever state changes.
import { state, setOnChange, boot, signOut, planNow } from './state.js';
import { $, escapeHTML } from './lib/dom.js';
import { renderAuth } from './views/auth.js';
import { renderToday } from './views/today.js';
import { renderPlan } from './views/plan.js';
import { renderProgress } from './views/progress.js';
import { renderTrain } from './views/train.js';

const root = $('root');
const VIEWS = { today: renderToday, plan: renderPlan, progress: renderProgress, train: renderTrain };

const NAV = [
  ['today', 'Today', 'M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z'],
  ['plan', 'Plan', 'M4 4h16v4H4zM4 10h16v10H4z'],
  ['progress', 'Progress', 'M3 17l6-6 4 4 8-8'],
  ['train', 'Train', 'M6 7v10M18 7v10M3 10h3M18 10h3M6 12h12'],
];

function render() {
  if (state.screen === 'auth') { renderAuth(root); return; }

  const pl = planNow();
  root.innerHTML = `
    <div class="app">
      <div class="hdr">
        <div>
          <div class="hdr-hi cond">${escapeHTML(state.user)}</div>
          <div class="hdr-sub">Day ${pl.day} · Phase ${pl.phase.n} — ${pl.phase.name}</div>
        </div>
        <button class="logout" id="logout">Log out</button>
      </div>
      <div class="main" id="view"></div>
      <nav class="nav">${NAV.map(navButton).join('')}</nav>
    </div>`;

  $('logout').onclick = signOut;
  root.querySelectorAll('.nav button').forEach((b) => {
    b.onclick = () => { state.tab = b.dataset.tab; render(); };
  });
  VIEWS[state.tab]($('view'));
}

function navButton([id, label, d]) {
  return `<button data-tab="${id}" class="${state.tab === id ? 'on' : ''}" aria-label="${label}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>
    <span>${label}</span></button>`;
}

setOnChange(render);
boot();
render();
