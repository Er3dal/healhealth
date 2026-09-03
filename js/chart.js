// Hand-drawn SVG line chart — no external library, works offline.
// Faint line = each reading; bold green line = 7-reading moving average.
export function chartSVG(W) {
  const w = 440, h = 200, pad = 28;
  const avg = W.map((r, i) => {
    const win = W.slice(Math.max(0, i - 6), i + 1);
    return win.reduce((a, b) => a + b.kg, 0) / win.length;
  });
  const all = W.map((r) => r.kg).concat(avg);
  let lo = Math.min(...all), hi = Math.max(...all);
  if (hi - lo < 1) { hi += 0.5; lo -= 0.5; }

  const x = (i) => pad + (W.length === 1 ? 0 : (i / (W.length - 1)) * (w - 2 * pad));
  const y = (k) => h - pad - ((k - lo) / (hi - lo)) * (h - 2 * pad);
  const path = (arr) => arr.map((k, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(k).toFixed(1)}`).join(' ');
  const dots = W.map((r, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(r.kg).toFixed(1)}" r="2.4" fill="#c7d0cb"/>`).join('');

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block" role="img" aria-label="Bodyweight trend">
    <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#e5e8e7"/>
    <text x="${pad}" y="${h - 8}" font-size="10" fill="#6b7075">${W[0].date.slice(5)}</text>
    <text x="${w - pad}" y="${h - 8}" font-size="10" fill="#6b7075" text-anchor="end">${W[W.length - 1].date.slice(5)}</text>
    <text x="2" y="${(y(hi) + 4).toFixed(1)}" font-size="10" fill="#6b7075">${hi.toFixed(1)}</text>
    <text x="2" y="${y(lo).toFixed(1)}" font-size="10" fill="#6b7075">${lo.toFixed(1)}</text>
    <path d="${path(W.map((r) => r.kg))}" fill="none" stroke="#c7d0cb" stroke-width="1.5"/>
    ${dots}
    <path d="${path(avg)}" fill="none" stroke="#1F6F4A" stroke-width="2.5"/>
  </svg>`;
}
