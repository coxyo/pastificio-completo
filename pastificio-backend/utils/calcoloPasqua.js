// utils/calcoloPasqua.js - Algoritmo di Gauss per calcolo data Pasqua

/**
 * Calcola la data di Pasqua per un anno dato
 * Algoritmo di Gauss (computus)
 */
export function calcolaPasqua(anno) {
  const a = anno % 19;
  const b = Math.floor(anno / 100);
  const c = anno % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31);
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(anno, mese - 1, giorno);
}

/**
 * Calcola la data di Pasquetta (lunedì dopo Pasqua)
 */
export function calcolaPasquetta(anno) {
  const pasqua = calcolaPasqua(anno);
  const pasquetta = new Date(pasqua);
  pasquetta.setDate(pasquetta.getDate() + 1);
  return pasquetta;
}

/**
 * Formatta una data come stringa YYYY-MM-DD
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Ottieni tutte le festività fisse per un anno
 * @param {number} anno
 * @param {object} config - festivitaAttive dalla configChiusure
 * @returns {Array} Array di { data: 'YYYY-MM-DD', motivo: string }
 */
export function getFestivitaAnno(anno, config = {}) {
  const tutte = {
    capodanno:    { data: `${anno}-01-01`, motivo: 'Capodanno' },
    epifania:     { data: `${anno}-01-06`, motivo: 'Epifania' },
    pasquetta:    { data: formatDate(calcolaPasquetta(anno)), motivo: 'Pasquetta' },
    liberazione:  { data: `${anno}-04-25`, motivo: 'Festa della Liberazione' },
    santEfisio:   { data: `${anno}-04-28`, motivo: "Sant'Efisio" },
    lavoratori:   { data: `${anno}-05-01`, motivo: 'Festa dei Lavoratori' },
    repubblica:   { data: `${anno}-06-02`, motivo: 'Festa della Repubblica' },
    ferragosto:   { data: `${anno}-08-15`, motivo: 'Ferragosto' },
    ognissanti:   { data: `${anno}-11-01`, motivo: 'Ognissanti' },
    immacolata:   { data: `${anno}-12-08`, motivo: 'Immacolata Concezione' },
    natale:       { data: `${anno}-12-25`, motivo: 'Natale' },
    santoStefano: { data: `${anno}-12-26`, motivo: 'Santo Stefano' }
  };

  // Se non c'è config, tutte attive di default
  const result = [];
  for (const [key, val] of Object.entries(tutte)) {
    if (config[key] === undefined || config[key] === true) {
      result.push(val);
    }
  }
  return result;
}