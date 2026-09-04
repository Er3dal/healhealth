// Central app state + the only functions allowed to mutate saved data.
// Every mutator persists then calls notify() so the UI re-renders.
import { getAccount, getProfile, getSession, setSession, loadData, saveData } from './accounts.js';
import { TODAY, addDays, daysBetween } from './lib/dates.js';
import { phaseForMonth } from './program.js';

export const state = {
  screen: 'auth',   // 'auth' | 'app'
  authTab: 'login', // 'login' | 'create'
  user: null,
  data: null,       // { daily, weights, workouts }
  tab: 'today',     // 'today' | 'plan' | 'progress' | 'train'
  ui: {},           // transient view state (open history row, active session)
};

let onChange = () => {};
export const setOnChange = (fn) => { onChange = fn; };
export const notify = () => onChange();

export function boot() {
  const u = getSession();
  if (u && getAccount(u)) { state.user = u; state.data = loadData(u); state.screen = 'app'; }
}

export function signIn(user) {
  setSession(user);
  state.user = user;
  state.data = loadData(user);
  state.screen = 'app';
  state.tab = 'today';
  state.ui = {};
  onChange();
}

export function signOut() {
  setSession('');
  Object.assign(state, { user: null, data: null, screen: 'auth', authTab: 'login', ui: {} });
  onChange();
}

export const profile = () => getProfile(state.user);

export function planNow() {
  const pr = profile();
  const day = Math.max(1, daysBetween(pr.startDate, TODAY) + 1);
  const month = Math.min(10, Math.max(1, Math.floor((day - 1) / 30) + 1));
  return { day, month, phase: phaseForMonth(month) };
}

export function streak() {
  const daily = state.data.daily;
  const done = (d) => !!(daily[d] && daily[d].mobility);
  let d = TODAY, s = 0;
  if (!done(d)) d = addDays(d, -1);
  while (done(d)) { s++; d = addDays(d, -1); }
  return s;
}

function persist() { if (state.user) saveData(state.user, state.data); }

export function setDaily(field, value) {
  const cur = state.data.daily[TODAY] || {};
  state.data.daily[TODAY] = { ...cur, [field]: value };
  persist(); onChange();
}

export function logWeight(kg) {
  const W = state.data.weights.filter((r) => r.date !== TODAY);
  W.push({ date: TODAY, kg });
  W.sort((a, b) => a.date.localeCompare(b.date));
  state.data.weights = W;
  persist(); onChange();
}

export function addWorkout(w) { state.data.workouts.unshift(w); persist(); onChange(); }
export function deleteWorkout(id) { state.data.workouts = state.data.workouts.filter((w) => w.id !== id); persist(); onChange(); }

// --- food / macros ---
export const foodToday = () => state.data.food[TODAY] || [];

export function addFood(entry) {
  const id = String(Date.now()) + Math.random().toString(36).slice(2, 6);
  state.data.food[TODAY] = [...foodToday(), { ...entry, id }];
  persist(); onChange();
}
export function deleteFood(id) {
  state.data.food[TODAY] = foodToday().filter((f) => f.id !== id);
  persist(); onChange();
}
export function foodTotals() {
  return foodToday().reduce((a, f) => ({
    kcal: a.kcal + (f.kcal || 0), protein: a.protein + (f.protein || 0),
    carbs: a.carbs + (f.carbs || 0), fat: a.fat + (f.fat || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}
