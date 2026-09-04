// Open Food Facts client — free, open, no API key. Barcode lookup + name search.
// Requires an internet connection (the requests go straight from the browser to
// Open Food Facts). Coverage is strong for packaged/barcoded products.
const OFF = 'https://world.openfoodfacts.org';
const num = (n) => { const x = parseFloat(n); return isNaN(x) ? 0 : Math.round(x * 10) / 10; };

function normalize(p) {
  const n = p.nutriments || {};
  const per100 = {
    kcal: num(n['energy-kcal_100g'] != null ? n['energy-kcal_100g'] : n['energy-kcal']),
    protein: num(n['proteins_100g']),
    carbs: num(n['carbohydrates_100g']),
    fat: num(n['fat_100g']),
  };
  let servingG = null;
  if (p.serving_size) { const m = String(p.serving_size).match(/([\d.]+)\s*g/i); if (m) servingG = parseFloat(m[1]); }
  const brand = p.brands ? p.brands.split(',')[0].trim() : '';
  const name = [brand, p.product_name || ''].filter(Boolean).join(' ').trim() || 'Unknown product';
  return { name, per100, servingG };
}

export async function lookupBarcode(code) {
  try {
    const url = `${OFF}/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,nutriments,serving_size`;
    const r = await fetch(url);
    const j = await r.json();
    if (!j || j.status !== 1 || !j.product) return { found: false, code };
    return { found: true, code, ...normalize(j.product) };
  } catch (e) {
    return { found: false, code, error: true };
  }
}

export async function searchFoods(query) {
  try {
    const url = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size`;
    const r = await fetch(url);
    const j = await r.json();
    return (j.products || []).map(normalize).filter((x) => x.per100.kcal > 0).slice(0, 15);
  } catch (e) {
    return [];
  }
}

// Scale a per-100g nutrient set to a gram quantity, rounded.
export function scaleMacros(per100, grams) {
  const f = grams / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    protein: Math.round(per100.protein * f),
    carbs: Math.round(per100.carbs * f),
    fat: Math.round(per100.fat * f),
  };
}
