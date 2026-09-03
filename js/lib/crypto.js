// One-way SHA-256 hash for passwords. Note: this is local-device only and is
// NOT real authentication — there is no server or salt. It just avoids storing
// the raw password in the browser.
export async function hashPassword(str) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return 'plain:' + str; // extreme fallback (very old browser)
  }
}
