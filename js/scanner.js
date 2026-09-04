// Camera barcode scanning. Prefers the browser's native BarcodeDetector
// (Android/Chrome). Falls back to the free ZXing library (loaded from a CDN)
// on browsers without it, such as iOS Safari. Returns a stop() function.
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];

export async function startScanner(video, onDetect) {
  let stopped = false;
  const guard = (code) => { if (!stopped && code) { stopped = true; onDetect(String(code)); } };

  if ('BarcodeDetector' in window) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    await video.play();
    let formats = FORMATS;
    try { const sup = await window.BarcodeDetector.getSupportedFormats(); formats = FORMATS.filter((f) => sup.includes(f)); } catch (e) {}
    const detector = new window.BarcodeDetector({ formats: formats.length ? formats : undefined });
    const tick = async () => {
      if (stopped) return;
      try { const codes = await detector.detect(video); if (codes && codes.length) return guard(codes[0].rawValue); } catch (e) {}
      if (!stopped) setTimeout(() => requestAnimationFrame(tick), 120);
    };
    requestAnimationFrame(tick);
    return () => { stopped = true; stream.getTracks().forEach((t) => t.stop()); };
  }

  // Fallback: ZXing manages its own camera stream.
  const ZX = await loadZXing();
  const reader = new ZX.BrowserMultiFormatReader();
  reader.decodeFromVideoDevice(undefined, video, (result) => { if (result) guard(result.getText()); });
  return () => { stopped = true; try { reader.reset(); } catch (e) {} };
}

function loadZXing() {
  return new Promise((resolve, reject) => {
    if (window.ZXing) return resolve(window.ZXing);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/umd/index.min.js';
    s.onload = () => window.ZXing ? resolve(window.ZXing) : reject(new Error('ZXing missing'));
    s.onerror = () => reject(new Error('Could not load the scanner library'));
    document.head.appendChild(s);
  });
}
