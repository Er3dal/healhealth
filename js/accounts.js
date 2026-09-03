// Account + per-user data storage. Everything lives in this browser only.
import { jget, jset, store } from './lib/storage.js';

const ACCOUNTS_KEY = 'ftp_accounts';
const SESSION_KEY = 'ftp_session';
const dataKey = (u) => 'ftp_data_' + u;

export const getAccounts = () => jget(ACCOUNTS_KEY, {});
export const saveAccounts = (a) => jset(ACCOUNTS_KEY, a);
export const getAccount = (u) => getAccounts()[u] || null;
export const getProfile = (u) => { const a = getAccount(u); return a ? a.profile : null; };

export const getSession = () => store.get(SESSION_KEY);
export const setSession = (u) => store.set(SESSION_KEY, u || '');

export const loadData = (u) => jget(dataKey(u), { daily: {}, weights: [], workouts: [] });
export const saveData = (u, d) => jset(dataKey(u), d);
