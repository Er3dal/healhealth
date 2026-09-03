import { state, signIn } from '../state.js';
import { getAccounts, saveAccounts, saveData } from '../accounts.js';
import { generateProgram } from '../program.js';
import { hashPassword } from '../lib/crypto.js';
import { store } from '../lib/storage.js';
import { TODAY } from '../lib/dates.js';
import { $, val } from '../lib/dom.js';

export function renderAuth(root) {
  const isLogin = state.authTab === 'login';
  root.innerHTML = `
    <div class="auth">
      <div class="auth-title cond">10-Month<br>Program</div>
      <p class="auth-lead">Lean · athletic · functional. Create an account and it builds a plan around your body — then tracks every day of it.</p>
      <div class="tabs">
        <button data-t="login" class="${isLogin ? 'on' : ''}">Log in</button>
        <button data-t="create" class="${!isLogin ? 'on' : ''}">Create account</button>
      </div>
      ${isLogin ? loginForm() : createForm()}
      <p class="fine">${store.ok
        ? 'Accounts are saved in this browser on this device. This is a personal tracker, not a secure server — don’t reuse an important password here.'
        : 'Storage is blocked in this preview, so data won’t persist here. Once hosted on GitHub Pages it saves normally.'}</p>
    </div>`;

  root.querySelectorAll('.tabs button').forEach((b) => {
    b.onclick = () => { state.authTab = b.dataset.t; renderAuth(root); };
  });
  isLogin ? wireLogin() : wireCreate();
}

const loginForm = () => `
  <label class="field"><span>Username</span><input id="lu" autocomplete="username"></label>
  <label class="field"><span>Password</span><input id="lp" type="password" autocomplete="current-password"></label>
  <div id="lerr" class="err" role="alert"></div>
  <button class="btn full" id="lbtn">Log in</button>`;

const createForm = () => `
  <label class="field"><span>Choose a username</span><input id="cu" autocomplete="off"></label>
  <label class="field"><span>Choose a password</span><input id="cp" type="password" autocomplete="new-password"></label>
  <div class="row2">
    <label class="field"><span>Sex</span>
      <select id="csex"><option value="male">Male</option><option value="female">Female</option></select></label>
    <label class="field"><span>Age</span><input id="cage" inputmode="numeric" placeholder="30"></label>
  </div>
  <div class="row2">
    <label class="field"><span>Height (cm)</span><input id="ch" inputmode="numeric" placeholder="183"></label>
    <label class="field"><span>Weight (kg)</span><input id="cw" inputmode="decimal" placeholder="100"></label>
  </div>
  <label class="field"><span>Activity level</span>
    <select id="cact">
      <option value="sedentary">Sedentary — desk job, little exercise</option>
      <option value="light">Light — some walking / 1–2 sessions</option>
      <option value="moderate" selected>Moderate — training 3–5×/week</option>
      <option value="active">Active — hard training / physical job</option>
    </select></label>
  <label class="field"><span>Start date (Day 1)</span><input id="cstart" type="date" value="${TODAY}"></label>
  <div id="cerr" class="err" role="alert"></div>
  <button class="btn full" id="cbtn">Create account &amp; build my plan</button>`;

function wireLogin() {
  $('lbtn').onclick = async () => {
    const err = $('lerr');
    const u = val('lu').trim(), p = val('lp');
    const accts = getAccounts();
    if (!u || !p) return void (err.textContent = 'Enter your username and password.');
    if (!accts[u]) return void (err.textContent = 'No account with that username on this device.');
    if (accts[u].pass !== await hashPassword(p)) return void (err.textContent = 'Wrong password.');
    signIn(u);
  };
}

function wireCreate() {
  $('cbtn').onclick = async () => {
    const err = $('cerr');
    const u = val('cu').trim(), p = val('cp');
    const profile = {
      sex: val('csex'), age: +val('cage'), height: +val('ch'),
      weight: +val('cw'), activity: val('cact'), startDate: val('cstart'),
    };
    if (!u || !p) return void (err.textContent = 'Pick a username and password.');
    if (getAccounts()[u]) return void (err.textContent = 'That username is taken on this device.');
    if (!profile.age || profile.age < 13 || profile.age > 90) return void (err.textContent = 'Enter a real age (13–90).');
    if (!profile.height || profile.height < 120 || profile.height > 230) return void (err.textContent = 'Enter height in cm (120–230).');
    if (!profile.weight || profile.weight < 35 || profile.weight > 250) return void (err.textContent = 'Enter weight in kg (35–250).');

    profile.program = generateProgram(profile);
    const accts = getAccounts();
    accts[u] = { pass: await hashPassword(p), profile, created: TODAY };
    saveAccounts(accts);
    // seed the data store with the starting weight so the chart has an anchor
    saveData(u, { daily: {}, weights: [{ date: TODAY, kg: profile.weight }], workouts: [] });
    signIn(u);
  };
}
