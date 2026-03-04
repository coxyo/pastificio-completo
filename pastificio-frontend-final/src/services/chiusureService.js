// src/services/chiusureService.js
// Servizio per verificare se una data è chiusa, con cache locale

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pastificio-completo-production.up.railway.app/api';

// Cache in-memory per evitare chiamate ripetute per la stessa data
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minuti

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  cache.set(key, { value, ts: Date.now() });
}

/**
 * Verifica se una data è chiusa
 * @param {string} dataStr - formato 'YYYY-MM-DD'
 * @returns {Promise<{ chiuso: boolean, motivo: string|null, prossimaData: string|null }>}
 */
export async function verificaChiusura(dataStr) {
  if (!dataStr) return { chiuso: false, motivo: null };

  const cacheKey = `verifica:${dataStr}`;
  const cached = getFromCache(cacheKey);
  if (cached !== null) return cached;

  try {
    const res = await fetch(`${API_URL}/chiusure/verifica?data=${dataStr}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) return { chiuso: false, motivo: null };

    const data = await res.json();
    const result = {
      chiuso: data.chiuso || false,
      motivo: data.motivo || null,
      prossimaData: null
    };

    // Se chiuso, carica subito anche il prossimo disponibile
    if (result.chiuso) {
      try {
        const res2 = await fetch(`${API_URL}/chiusure/prossimo-disponibile?data=${dataStr}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res2.ok) {
          const d2 = await res2.json();
          result.prossimaData = d2.prossimaData || null;
        }
      } catch (_) {}
    }

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[chiusureService] errore verifica:', err);
    return { chiuso: false, motivo: null };
  }
}

/**
 * Ottieni tutte le date chiuse in un mese (per date picker)
 * @param {number} anno
 * @param {number} mese - 1-12
 * @returns {Promise<Array<{ data: string, motivo: string }>>}
 */
export async function getDateChiuseMese(anno, mese) {
  const cacheKey = `mese:${anno}-${mese}`;
  const cached = getFromCache(cacheKey);
  if (cached !== null) return cached;

  try {
    const res = await fetch(`${API_URL}/chiusure/mese?anno=${anno}&mese=${mese}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const result = data.dateChiuse || [];
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[chiusureService] errore mese:', err);
    return [];
  }
}

/**
 * Invalida tutta la cache (da chiamare dopo modifiche alle chiusure)
 */
export function invalidaCache() {
  cache.clear();
}

export default { verificaChiusura, getDateChiuseMese, invalidaCache };