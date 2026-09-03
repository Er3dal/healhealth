// Thin wrapper over localStorage with an in-memory fallback so the app still
// runs where storage is blocked (e.g. a sandboxed preview). On GitHub Pages
// localStorage works normally and data persists.
export const store = (() => {
  let ok = true;
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); }
  catch (e) { ok = false; }
  const mem = {};
  return {
    ok,
    get: (k) => ok ? localStorage.getItem(k) : (k in mem ? mem[k] : null),
    set: (k, v) => { try { ok ? localStorage.setItem(k, v) : (mem[k] = v); } catch (e) { mem[k] = v; } },
    remove: (k) => { try { ok ? localStorage.removeItem(k) : (delete mem[k]); } catch (e) { delete mem[k]; } },
  };
})();

export const jget = (k, fallback) => {
  try { const v = store.get(k); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
};
export const jset = (k, v) => store.set(k, JSON.stringify(v));
