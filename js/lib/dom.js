export const $ = (id) => document.getElementById(id);
export const val = (id) => { const el = $(id); return el ? el.value : ''; };

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function escapeAttr(s) {
  return escapeHTML(s).replace(/`/g, '&#96;');
}
